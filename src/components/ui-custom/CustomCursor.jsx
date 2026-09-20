import React, { useEffect, useRef } from "react";

/**
 * Ring + dot cursor. Ring lags, dot tracks. Interactive targets grow the ring;
 * [data-cursor="Label"] fills it with a label. [data-magnetic] elements are
 * pulled toward the pointer through --mx/--my.
 */
export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!ring || !dot) return;

    const s = {
      tx: window.innerWidth / 2,
      ty: window.innerHeight / 2,
      rx: window.innerWidth / 2,
      ry: window.innerHeight / 2,
      dx: window.innerWidth / 2,
      dy: window.innerHeight / 2,
      hover: false,
      label: "",
      down: false,
      lastTx: -1,
      lastTy: -1,
    };

    const onMove = (e) => {
      s.tx = e.clientX;
      s.ty = e.clientY;
    };
    const onOver = (e) => {
      const t = e.target.closest?.("a, button, [role='button'], [data-hover], input, textarea, select");
      s.hover = !!t;
      const lab = t?.closest?.("[data-cursor]")?.dataset.cursor || "";
      s.label = lab;
      if (label) label.textContent = lab;
    };
    const onDown = () => (s.down = true);
    const onUp = () => (s.down = false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, true);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    let raf = 0;
    let frame = 0;
    const render = () => {
      s.rx += (s.tx - s.rx) * 0.18;
      s.ry += (s.ty - s.ry) * 0.18;
      s.dx += (s.tx - s.dx) * 0.55;
      s.dy += (s.ty - s.dy) * 0.55;
      const sc = s.down ? 0.85 : 1;
      ring.style.transform = `translate3d(${s.rx}px, ${s.ry}px, 0) translate(-50%, -50%) scale(${sc})`;
      dot.style.transform = `translate3d(${s.dx}px, ${s.dy}px, 0) translate(-50%, -50%)`;
      ring.dataset.hover = s.hover ? "1" : "0";
      ring.dataset.label = s.label ? "1" : "0";

      // Magnetic pull: all layout reads first, then all writes, and only
      // while the pointer is actually moving, so it never thrashes layout.
      const moved = Math.abs(s.tx - s.lastTx) + Math.abs(s.ty - s.lastTy) > 0.5;
      if (moved && frame++ % 2 === 0) {
        s.lastTx = s.tx;
        s.lastTy = s.ty;
        const mags = Array.from(document.querySelectorAll("[data-magnetic]"));
        const rects = mags.map((el) => el.getBoundingClientRect());
        mags.forEach((el, i) => {
          const r = rects[i];
          if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
          const dx = s.tx - (r.left + r.width / 2);
          const dy = s.ty - (r.top + r.height / 2);
          const dist = Math.hypot(dx, dy);
          const radius = Math.max(r.width, r.height) * 0.8 + 36;
          if (dist < radius) {
            const pull = (1 - dist / radius) * 0.3;
            el.style.setProperty("--mx", `${dx * pull}px`);
            el.style.setProperty("--my", `${dy * pull}px`);
          } else if (el.style.getPropertyValue("--mx") !== "0px" && el.style.getPropertyValue("--mx")) {
            el.style.setProperty("--mx", "0px");
            el.style.setProperty("--my", "0px");
          }
        });
      }
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver, true);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} id="cursor-ring" aria-hidden="true">
        <span ref={labelRef} id="cursor-label" />
      </div>
      <div ref={dotRef} id="cursor-dot" aria-hidden="true" />
    </>
  );
}
