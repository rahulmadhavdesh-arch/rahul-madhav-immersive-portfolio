import React, { useEffect, useRef } from "react";

const GLYPHS = "RMDHJK0173+/·:=|";

/**
 * Display-text reveal. Two voices:
 *  - "scan": a light block flashes, a beam sweeps and characters resolve from
 *    speckle into type (the hero name).
 *  - "rise": characters climb out of a mask with a soft blur and stagger
 *    (section headings). `accent` colours one word; `outline` renders the
 *    heading as a stroked outline that fills on hover.
 */
export default function ScanText({
  children,
  as: Tag = "h2",
  className = "",
  style,
  play,
  replay = 0,
  delay = 0,
  accent,
  outline = false,
  mode = "rise",
  tint = "var(--accent)",
  ...rest
}) {
  const text = String(children);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chars = Array.from(el.querySelectorAll("[data-c]"));
    const block = el.querySelector("[data-block]");
    const n = chars.length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const finish = () => {
      chars.forEach((c) => {
        c.textContent = c.dataset.c;
        c.style.opacity = "";
        c.style.color = "";
        c.style.transform = "";
        c.style.filter = "";
        c.style.transition = "";
        c.dataset.in = "1";
      });
      if (block) block.style.transform = "scaleX(0)";
    };
    const prime = () => chars.forEach((c) => { c.dataset.in = "0"; c.style.transition = ""; });

    const runRise = () => {
      chars.forEach((c, i) => {
        c.style.transition = `transform 1s cubic-bezier(.16,1,.3,1) ${delay * 1000 + i * 18}ms, opacity .7s ease ${delay * 1000 + i * 18}ms, filter .8s ease ${delay * 1000 + i * 18}ms`;
      });
      requestAnimationFrame(() => chars.forEach((c) => (c.dataset.in = "1")));
    };

    const runScan = () => {
      let start = null;
      const D = 620 + n * 26;
      const BLOCK = 240;
      chars.forEach((c) => { c.dataset.in = "1"; c.style.opacity = 0; });
      const step = (now) => {
        if (start === null) start = now;
        const e = now - start - delay * 1000;
        if (e < 0) { raf = requestAnimationFrame(step); return; }
        if (block) { const b = Math.min(1, e / BLOCK); const sx = b < 0.55 ? b / 0.55 : 1 - (b - 0.55) / 0.45; block.style.transform = `scaleX(${Math.max(0, sx)})`; }
        const p = (e - BLOCK * 0.5) / D;
        for (let i = 0; i < n; i++) {
          const c = chars[i];
          const d = p - i / n;
          if (d < -0.12) c.style.opacity = 0;
          else if (d < 0) { c.textContent = GLYPHS[(i * 7 + Math.floor(e / 45)) % GLYPHS.length]; c.style.opacity = 0.35; c.style.color = tint; c.style.transform = "translateY(0.08em)"; }
          else if (d < 0.07) { c.textContent = c.dataset.c; c.style.opacity = 1; c.style.color = tint; c.style.transform = "translateY(-0.03em)"; }
          else { c.textContent = c.dataset.c; c.style.opacity = 1; c.style.color = ""; c.style.transform = ""; }
        }
        if (p > 1.12) { finish(); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (reduce) { finish(); return; }
    const begin = () => (mode === "scan" ? runScan() : runRise());

    if (play === undefined) {
      prime();
      const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { begin(); io.disconnect(); } }, { rootMargin: "-8% 0px" });
      io.observe(el);
      return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }
    if (play) begin(); else prime();
    return () => cancelAnimationFrame(raf);
  }, [play, replay, text, delay, tint, mode]);

  const words = text.split(" ");
  const norm = (w) => w.replace(/[^\w]/g, "").toLowerCase();

  return (
    <Tag ref={ref} className={`${className} ${outline ? "h-stroke" : ""}`} aria-label={text} data-mode={mode} style={{ position: "relative", ...style }} {...rest}>
      {mode === "scan" && <span data-block aria-hidden="true" className="scan-block" style={{ background: tint }} />}
      {words.map((w, wi) => {
        const acc = accent && norm(w) === accent.toLowerCase();
        return (
          <React.Fragment key={wi}>
            <span className={`scan-w${acc ? " accent-word" : ""}`} aria-hidden="true">
              {Array.from(w).map((ch, ci) => (
                <span key={ci} data-c={ch} data-in="0" className="scan-c">{ch}</span>
              ))}
            </span>
            {wi < words.length - 1 && " "}
          </React.Fragment>
        );
      })}
    </Tag>
  );
}
