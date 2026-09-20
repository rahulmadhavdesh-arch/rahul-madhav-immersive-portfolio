import React from "react";
import { motion } from "framer-motion";
import useTilt from "../../hooks/useTilt";
import Plot from "./Plot";

/** Tile with cursor tilt, a tint glow anchored to the pointer, generated plot art and a clip reveal. */
export default function Tile({
  span = "", tint = "var(--accent)", art = "wave", code, title, text, tags = [], metric, metricLabel,
  cta = "Open", index = 0, onClick, testid, big = false, minH = "min-h-[360px] md:min-h-[440px]", model = false, logo,
  modelPoster,
}) {
  const tilt = useTilt({ max: 4, scale: 1.005 });
  const onMove = (e) => {
    tilt.handlers.onMouseMove(e);
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  return (
    <motion.button
      ref={tilt.ref} type="button" data-hover data-cursor={cta} data-testid={testid} onClick={onClick}
      onMouseMove={onMove} onMouseLeave={tilt.handlers.onMouseLeave}
      initial={{ clipPath: "inset(14% 0 0 0 round 20px)", opacity: 0, y: 28 }}
      whileInView={{ clipPath: "inset(0 0 0 0 round 20px)", opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{ ...tilt.style, "--tint": tint }}
      className={`${span} tile group text-left flex flex-col ${model ? 'tile-with-model' : minH}`}
    >
      {!model && <div className="tile-art" style={{ maskImage: "linear-gradient(to bottom, #000 8%, rgba(0,0,0,0.35) 52%, transparent 78%)", WebkitMaskImage: "linear-gradient(to bottom, #000 8%, rgba(0,0,0,0.35) 52%, transparent 78%)" }}>
        <Plot kind={art} tint={tint} />
      </div>}
      <span className="tile-glow" aria-hidden="true" />
      <div className="relative z-[1] flex items-center justify-between px-6 pt-6 md:px-7 md:pt-7">
        <span className="label text-text-2">{code}</span>
        <div className="flex items-center gap-3">
          {logo && <span className="org-mark org-mark--tile" aria-hidden="true"><img src={logo} alt="" loading="lazy" decoding="async" /></span>}
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--tint)", boxShadow: "0 0 10px var(--tint)" }} />
        </div>
      </div>
      {model && <div className="project-model-stage" data-project-model={index} aria-hidden="true">
        <span className="model-orbit" /><span className="model-orbit model-orbit-2" />
        {modelPoster && <img className="project-model-poster" src={modelPoster} alt="" loading="lazy" decoding="async" />}
      </div>}
      <div className="flex-1" />
      <div className="relative z-[1] px-6 pb-6 md:px-7 md:pb-7">
        <h3 className="h-card text-text" style={{ fontSize: big ? "clamp(1.8rem, 2.8vw, 2.7rem)" : "clamp(1.45rem, 2vw, 1.95rem)" }}>{title}</h3>
        <p className="p-body mt-3 text-[0.95rem] max-w-lg">{text}</p>
        <div className="mt-6 flex items-end justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-1.5">{tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}</div>
          <div className="flex items-center gap-4">
            {metric && (
              <div className="text-right">
                <div className="h-card leading-none" style={{ fontSize: "clamp(1.2rem, 1.7vw, 1.6rem)", color: "var(--tint)" }}>{metric}</div>
                <div className="label mt-1.5">{metricLabel}</div>
              </div>
            )}
            <span className="tile-arrow" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1.5 8.5 8.5 1.5M3 1.5h5.5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
