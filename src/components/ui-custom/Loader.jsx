import React, { useEffect, useState } from "react";

const R = 54;
const C = 2 * Math.PI * R;

/** Preloader: the nav monogram at scale. Its ring draws itself as progress and
 *  the accent dot rides the leading edge, then the whole mark settles away. */
export default function Loader({ onOpen, waitForScene = true }) {
  const [n, setN] = useState(0);
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let v = 0;
    let done = false;
    let tick;
    let safety;
    // Finish on the event itself, not on the next tick. The scene is rendering
    // by then, so interval callbacks get starved and used to add ~900ms of
    // dead time after the page was already ready.
    const onReady = () => {
      if (done) return;
      done = true;
      clearInterval(tick);
      clearTimeout(safety);
      setN(100);
      setOpen(true);
      onOpen?.();
      setTimeout(() => setGone(true), 420);
    };
    // A low-power/data-saver visitor receives the static version of the site.
    // Do not hold that visitor on a loader waiting for a canvas we intentionally
    // chose not to download or create.
    if (!waitForScene) {
      const fallback = setTimeout(onReady, 120);
      return () => clearTimeout(fallback);
    }
    tick = setInterval(() => {
      v += (90 - v) * 0.14;
      setN(Math.round(v));
    }, 32);
    window.addEventListener("portfolio:scene-ready", onReady);
    safety = setTimeout(onReady, 2200);
    if (window.__sceneReady) onReady();
    return () => {
      clearInterval(tick);
      clearTimeout(safety);
      window.removeEventListener("portfolio:scene-ready", onReady);
    };
  }, [onOpen, waitForScene]);

  if (gone) return null;
  return (
    <div className="loader" data-open={open ? "1" : "0"} aria-hidden="true">
      <div className="loader-mark">
        <svg viewBox="0 0 120 120" className="loader-ring">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle
            cx="60" cy="60" r={R} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - n / 100)} transform="rotate(-90 60 60)"
          />
        </svg>
        {/* the dot rides the arc's leading edge — the nav mark's pulse, unrolled */}
        <span className="loader-orbit" style={{ transform: `rotate(${(n / 100) * 360}deg)` }}>
          <i style={{ background: "var(--accent)" }} />
        </span>
        <span className="loader-mono">RMD</span>
      </div>
      <span className="loader-pct num">{String(n).padStart(3, "0")}</span>
    </div>
  );
}
