import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { research } from "../../data/content";
import ScanText from "../ui-custom/ScanText";
import Reveal from "../ui-custom/Reveal";
import Plot from "../ui-custom/Plot";

function Panel({ r, i }) {
  return (
    <article className="rail-panel" style={{ "--tint": r.tint }} data-testid={`research-${r.id}`}>
      <div className="absolute inset-0 opacity-50" style={{ maskImage: "linear-gradient(to left, #000 20%, transparent 70%)", WebkitMaskImage: "linear-gradient(to left, #000 20%, transparent 70%)" }}>
        <Plot kind={r.art} tint={r.tint} />
      </div>
      <div className="rail-index">{String(i + 1).padStart(2, "0")}</div>
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <span className="label">{r.lab}</span>
        <span className="num text-[0.7rem]" style={{ color: r.tint }}>{r.period}</span>
      </div>
      <div className="relative flex flex-col justify-center max-w-[43rem] py-4">
        <h3 className="h-card text-text rail-title">{r.title}</h3>
        <p className="p-body mt-4">{r.body}</p>
      </div>
    </article>
  );
}

export default function Research() {
  const wrap = useRef(null);
  const track = useRef(null);
  const [shift, setShift] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.6 });
  const x = useTransform(smooth, (p) => -p * shift);

  useEffect(() => {
    const measure = () => {
      const el = track.current;
      if (!el) return;
      setShift(Math.max(0, el.scrollWidth - window.innerWidth + 32));
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 600);
    return () => { window.removeEventListener("resize", measure); clearTimeout(t); };
  }, []);

  return (
    <section id="research" ref={wrap} data-testid="research-section" className="relative" style={{ height: `${research.length * 72}vh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden flex flex-col justify-center gap-6 md:gap-8 pt-20 pb-4">
        <div className="container-x flex items-end justify-between gap-6 flex-wrap">
          <ScanText className="h-section text-text" accent="research">My research.</ScanText>
          <Reveal className="w-full md:w-72">
            <div className="flex items-center justify-between label mb-2"><span>Scroll sideways</span><span>{research.length} panels</span></div>
            <div className="rail-progress"><motion.span style={{ scaleX: smooth }} /></div>
          </Reveal>
        </div>
        <motion.div ref={track} style={{ x }} className="flex gap-4 md:gap-5 h-[74svh] md:h-[62svh] min-h-[430px] pl-[clamp(1.25rem,4vw,4rem)] pr-8 will-change-transform">
          {research.map((r, i) => <Panel key={r.id} r={r} i={i} />)}
        </motion.div>
      </div>
    </section>
  );
}
