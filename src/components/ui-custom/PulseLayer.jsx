import React, { useEffect, useState } from "react";

/**
 * Accent ripples, on their own island of state. The scene emits a pulse when the
 * intro lands and at every section change; while this state lived on the page
 * component, each pulse re-rendered the whole section tree, and the intro one
 * landed right as the arm was handing off to its IK solver.
 */
export default function PulseLayer() {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    const onPulse = (e) => {
      const { x, y, tint } = e.detail;
      const id = `${Date.now()}-${Math.random()}`;
      setRipples((r) => [...r.slice(-4), { id, x, y, tint }]);
      setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 1400);
    };
    window.addEventListener("portfolio:pulse", onPulse);
    return () => window.removeEventListener("portfolio:pulse", onPulse);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[30]" aria-hidden="true">
      {ripples.map((r) => <span key={r.id} className="pulse-ripple" style={{ left: r.x, top: r.y, "--tint": r.tint }} />)}
    </div>
  );
}
