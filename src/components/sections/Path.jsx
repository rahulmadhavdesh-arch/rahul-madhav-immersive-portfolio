import React, { useMemo, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { timeline } from "../../data/content";
import MediaModal from "../modals/MediaModal";
import ScanText from "../ui-custom/ScanText";
import Reveal from "../ui-custom/Reveal";
import useTilt from "../../hooks/useTilt";

function Entry({ e, i, onOpen }) {
  const tilt = useTilt({ max: 3, scale: 1 });
  const tint = e.kind === "study" ? "var(--aqua)" : "var(--coral)";
  return (
    <motion.li initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.85, delay: 0.05, ease: [0.16, 1, 0.3, 1] }} className="relative" style={{ "--tint": tint }}>
      <span className="hidden md:block absolute -left-[3.3rem] top-9 w-2.5 h-2.5 rounded-full" style={{ background: tint, boxShadow: `0 0 12px ${tint}` }} aria-hidden="true" />
      <motion.button ref={tilt.ref} {...tilt.handlers} style={tilt.style} type="button" data-hover data-cursor="Open" data-testid={`path-item-${i}`}
        onClick={() => onOpen(e)} className="tile group w-full text-left p-6 md:p-8">
        <span className="tile-glow" aria-hidden="true" />
        <div className="relative flex items-center gap-4 flex-wrap">
          <span className="num text-[0.7rem]" style={{ color: tint }}>{e.period}</span>
          <span className="label ml-auto">{e.kind === "study" ? "Study" : "Work"}</span>
        </div>
        <div className="relative org-heading mt-4">
          {e.logo && <span className="org-mark" aria-hidden="true"><img src={e.logo} alt="" loading="lazy" decoding="async" /></span>}
          {e.logoText && <span className="org-mark org-mark--type" aria-hidden="true">{e.logoText}</span>}
          <h3 className="h-card text-text" style={{ fontSize: "clamp(1.55rem, 2.35vw, 2.2rem)" }}>{e.org}</h3>
        </div>
        <div className="relative mt-2 text-[1rem] md:text-[1.12rem] font-semibold" style={{ color: tint }}>{e.role}</div>
        <p className="relative p-body mt-3">{e.short}</p>
        <div className="relative mt-5 flex items-center gap-3 text-sm text-text-2">
          <span className="tile-arrow" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1.5 8.5 8.5 1.5M3 1.5h5.5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          View details
        </div>
      </motion.button>
    </motion.li>
  );
}

export default function Path() {
  const [open, setOpen] = useState(null);
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 55%"] });
  const drawn = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const d = useMemo(() => {
    const n = timeline.length;
    let s = "M20 0";
    for (let i = 0; i < n; i++) { const y = ((i + 0.5) / n) * 1000; s += ` L20 ${y - 22} L30 ${y - 12} L8 ${y} L28 ${y + 10} L20 ${y + 18}`; }
    return s + " L20 1000";
  }, []);

  return (
    <section id="path" data-testid="path-section" className="relative py-28 md:py-40">
      <div className="container-x grid md:grid-cols-12 gap-10 md:gap-14">
        <div className="md:col-span-4 md:sticky md:top-32 self-start">
          <ScanText className="h-section text-text" accent="been">Where I've been.</ScanText>
          <Reveal as="p" className="p-body mt-6">A timeline of my education, research, industry experience, and technical leadership.</Reveal>
        </div>
        <div className="md:col-span-8 relative" ref={listRef}>
          <svg className="hidden md:block absolute -left-2 top-0 h-full w-10 pointer-events-none" viewBox="0 0 40 1000" preserveAspectRatio="none" aria-hidden="true">
            <path d={d} stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
            <motion.path d={d} stroke="var(--accent)" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" style={{ pathLength: drawn }} />
          </svg>
          <ul className="space-y-4 md:pl-14">
            {timeline.map((e, i) => <Entry key={e.id} e={e} i={i} onOpen={setOpen} />)}
          </ul>
        </div>
      </div>
      <MediaModal item={open} onClose={() => setOpen(null)} kind="path" />
    </section>
  );
}
