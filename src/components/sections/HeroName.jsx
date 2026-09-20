import React, { useEffect, useRef } from "react";
import { buildSpine } from "./heroSpine";

/**
 * The name is the specimen.
 *
 * On load a virtual probe sweeps across it and the letters resolve out of
 * blur, in order — the name is imaged into existence rather than faded in.
 * After that the real probe drives it: letters inside the beam fill with
 * light, widen on the font's `wdth` axis and lift, so the beam reads as
 * illuminating the name instead of covering it. With no beam, the cursor
 * does the same thing more gently, so the type is never inert.
 *
 * All per-frame work writes CSS custom properties directly — no React
 * re-renders, no layout reads except a throttled re-measure.
 */
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function HeroName({ first, last, play }) {
  const ref = useRef(null);
  const svgRef = useRef(null);
  const baseGRef = useRef(null);
  const trailGRef = useRef(null);
  const flowGRef = useRef(null);
  const headRef = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const letters = Array.from(root.querySelectorAll("[data-l]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      letters.forEach((el) => {
        el.style.setProperty("--r", 1);
        el.style.setProperty("--l", 0);
      });
      return;
    }

    const st = letters.map(() => ({ r: 0, l: 0, wr: -1, wl: -1 }));
    // Store letter centres in document coordinates. Scrolling changes only the
    // viewport offset, so we can subtract scrollY in the animation loop instead
    // of forcing a layout read and rebuilding every SVG path on every wheel tick.
    let centres = [];
    let box = { left: 0, width: 1 };

    const solidLetters = letters.filter((el) => el.parentElement?.classList.contains("hn-solid"));
    let spineLen = 0;
    const segs = [];
    // the spine stays dark until the name has finished resolving, and its first
    // pass is timed from that moment rather than from page load — otherwise it
    // is already mid-flow through letters that have not arrived yet
    let spineStart = null;
    let spineShown = false;
    // TextMetrics is the only reliable source for where the ink of a glyph
    // actually sits inside its box, which is what the skeleton registers to
    const mctx = document.createElement("canvas").getContext("2d");

    const measure = () => {
      box = root.getBoundingClientRect();
      centres = letters.map((el) => {
        const b = el.getBoundingClientRect();
        return {
          x: b.left + window.scrollX + b.width / 2,
          y: b.top + window.scrollY + b.height / 2,
        };
      });

      const svg = svgRef.current;
      const groups = [baseGRef.current, trailGRef.current, flowGRef.current];
      if (!svg || groups.some((g) => !g)) return;
      const cs = getComputedStyle(root);
      const fs = parseFloat(cs.fontSize) || 0;
      if (!mctx) return;
      mctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;

      // a lighter monoline than before: it should read as the letter glowing
      // from inside, not as a hard wire laid over it
      const sw = fs * 0.040;          // core stroke
      const blur = fs * 0.013;        // softens the core's edges
      // keep cap and bloom inside the glyph, top and bottom especially
      const padY = sw / 2 + blur + fs * 0.012;
      const padX = sw / 2 + blur * 0.6;
      const strokes = buildSpine(solidLetters, box.left, box.top, fs, mctx, padX, padY);
      svg.style.setProperty("--spine-w", `${sw.toFixed(2)}px`);
      svg.style.setProperty("--spine-blur", `${blur.toFixed(2)}px`);
      svg.style.setProperty("--spine-blur-soft", `${(fs * 0.035).toFixed(2)}px`);

      // one element per stroke, in writing order, reused across re-measures
      groups.forEach((g) => {
        while (g.childElementCount > strokes.length) g.removeChild(g.lastChild);
        while (g.childElementCount < strokes.length) {
          g.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
        }
        strokes.forEach((d, i) => g.children[i].setAttribute("d", d));
      });

      // cumulative distance along the whole name, so the travelling window can
      // be mapped onto whichever stroke it currently covers
      segs.length = 0;
      spineLen = 0;
      const flowKids = flowGRef.current.children;
      for (let i = 0; i < flowKids.length; i++) {
        const el = flowKids[i];
        const len = el.getTotalLength ? el.getTotalLength() : 0;
        segs.push({ el, trailEl: trailGRef.current.children[i], start: spineLen, len });
        spineLen += len;
      }

      const w = sw.toFixed(2);
      baseGRef.current.setAttribute("stroke-width", w);
      flowGRef.current.setAttribute("stroke-width", w);
      trailGRef.current.setAttribute("stroke-width", (sw * 1.25).toFixed(2));
      if (headRef.current) headRef.current.setAttribute("r", (fs * 0.028).toFixed(2));
    };
    measure();

    // measure() reads a rect off the root and every letter, which forces a layout
    // flush and rebuilds the decorative SVG spine. The boxes only change when the
    // viewport or font metrics change; ordinary scrolling is handled from the
    // cached document coordinates in the loop below.
    let dirty = false;
    const markDirty = () => { dirty = true; };
    let visible = true;
    const visibilityObserver = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { rootMargin: "200px 0px" });
    visibilityObserver?.observe(root);

    const pointer = { x: -9999, y: -9999 };
    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", markDirty);
    if (document.fonts?.ready) document.fonts.ready.then(markDirty).catch(() => {});
    // The spine is built from canvas TextMetrics, which report the fallback face
    // until the real one is actually usable — and that lands after fonts.ready
    // in practice. A few re-measures over the first couple of seconds settle it.
    const settle = [120, 400, 900, 1800, 3000].map((ms) => setTimeout(markDirty, ms));

    let raf = 0;
    let running = true;
    let start = null;
    let lastG = -1;

    const loop = (now) => {
      if (!running) return;
      if (start === null && play) start = now;
      // Once the hero is outside the viewport, the travelling SVG highlight and
      // per-glyph lighting are invisible. Avoid getPointAtLength and style writes
      // until the title is close to view again.
      if (!visible || window.scrollY > window.innerHeight * 1.25) { raf = requestAnimationFrame(loop); return; }
      if (dirty) { dirty = false; measure(); }

      // intro: a virtual probe crosses the name, resolving letters as it goes
      const introT = start === null ? 0 : clamp01((now - start) / 1700);
      const introDone = introT >= 1;
      const sweepX = box.left - 140 + (box.width + 280) * easeInOut(introT);

      // the light the probe carries is warm, and cools to the site's accent once
      // the name has landed — the gold belongs to the arrival, not the resting
      // state. one write on the container, not per letter.
      const secs = start === null ? 0 : (now - start) / 1000;
      const g = start === null ? 1 : clamp01(1 - (secs - 1.7) / 1.2);
      const gr = Math.round(g * 100) / 100;
      if (gr !== lastG) { root.style.setProperty("--g", gr); lastG = gr; }

      // the river: one lit segment runs the whole name, head first, then a beat
      // of darkness before it starts again. Never waits on input.
      const svgEl = svgRef.current;
      if (svgEl && spineShown !== introDone) {
        spineShown = introDone;
        svgEl.style.opacity = introDone ? "1" : "0";
      }

      if (spineLen > 0 && segs.length && introDone) {
        if (spineStart === null) spineStart = now;
        const CYCLE = 6400;   // ms for one pass of the name
        const REST = 1100;    // ms of dark before it runs again
        const wake = spineLen * 0.30;   // soft, behind
        const core = spineLen * 0.115;  // bright, at the front
        const head = headRef.current;
        const t = ((now - spineStart) % (CYCLE + REST)) / CYCLE;
        const lead = t > 1 ? -1 : t * (spineLen + wake);

        // paint the window [lead - W, lead] onto each stroke it overlaps
        const paint = (el, segStart, segLen, W) => {
          const hi = Math.min(segLen, lead - segStart);
          const lo = Math.max(0, lead - W - segStart);
          if (lead < 0 || hi <= 0 || lo >= segLen || hi <= lo) { el.style.opacity = "0"; return; }
          el.style.opacity = "1";
          el.setAttribute("stroke-dasharray", `0 ${lo.toFixed(1)} ${(hi - lo).toFixed(1)} ${segLen.toFixed(1)}`);
        };
        for (const sg of segs) {
          paint(sg.el, sg.start, sg.len, core);
          paint(sg.trailEl, sg.start, sg.len, wake);
        }

        if (head) {
          const on = segs.find((sg) => lead >= sg.start && lead <= sg.start + sg.len);
          if (on && on.el.getPointAtLength) {
            const pt = on.el.getPointAtLength(lead - on.start);
            head.setAttribute("cx", pt.x.toFixed(1));
            head.setAttribute("cy", pt.y.toFixed(1));
            head.style.opacity = "1";
          } else {
            head.style.opacity = "0";
          }
        }
      }

      const arm = window.__arm;
      const beamOn = !!arm && arm.imaging && introDone;
      const lx = beamOn ? arm.bx : pointer.x;
      const ly = beamOn ? arm.by : pointer.y;
      const lr = beamOn ? arm.br : 190;
      const gain = beamOn ? 1 : 0.5;

      for (let i = 0; i < letters.length; i++) {
        const c = centres[i];
        const s = st[i];
        if (!c) continue;

        // resolve
        const rTarget = start === null ? 0 : clamp01((sweepX - c.x + 90) / 150);
        s.r = introDone ? 1 : Math.max(s.r, rTarget);

        // light
        let target = 0;
        if (!introDone) {
          // the sweep itself glows as it passes
          target = clamp01(1 - Math.abs(sweepX - c.x) / 230);
        } else {
          const dx = c.x - window.scrollX - lx;
          const dy = c.y - window.scrollY - ly;
          target = clamp01(1 - Math.sqrt(dx * dx + dy * dy) / lr) * gain;
        }
        s.l += (target - s.l) * 0.16;

        const r = Math.round(s.r * 100) / 100;
        const l = Math.round(s.l * 100) / 100;
        if (r !== s.wr) { letters[i].style.setProperty("--r", r); s.wr = r; }
        if (l !== s.wl) { letters[i].style.setProperty("--l", l); s.wl = l; }

      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", markDirty);
      visibilityObserver?.disconnect();
      settle.forEach(clearTimeout);
    };
  }, [play]);

  const line = (text, cls) => (
    <span className={`hn-line ${cls}`}>
      {Array.from(text).map((ch, i) => (
        <span key={i} className={`hn-l${ch === " " ? " hn-space" : ""}`} data-l aria-hidden="true">
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );

  return (
    <h1 id="hero-name" ref={ref} className="hn" aria-label={`${first} ${last}`} data-testid="hero-name">
      {line(first, "hn-solid")}
      {line(last, "hn-ghost")}
      <svg ref={svgRef} className="hn-spine" aria-hidden="true" focusable="false">
        <g ref={baseGRef} className="hn-spine-base" />
        <g ref={trailGRef} className="hn-spine-trail" />
        <g ref={flowGRef} className="hn-spine-flow" />
        <circle ref={headRef} className="hn-spine-head" cx="-99" cy="-99" r="4" />
      </svg>
    </h1>
  );
}
