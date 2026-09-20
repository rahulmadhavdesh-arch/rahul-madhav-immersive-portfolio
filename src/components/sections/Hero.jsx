import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { profile } from "../../data/content";
import HeroName from "./HeroName";
import Reveal from "../ui-custom/Reveal";
import Button from "../ui-custom/Button";

/**
 * The hero sits *under* the WebGL canvas so the arm and its hologram float
 * over the letters; everything in it is still clickable because the canvas
 * ignores pointer events. Scrolling shrinks the card and About slides over.
 */
export default function Hero({ ready, lite = false }) {
  const wrap = useRef(null);
  const [replay, setReplay] = useState(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const scale = useTransform(scrollYProgress, [0.06, 0.38], [1, 0.94]);
  const radius = useTransform(scrollYProgress, [0.06, 0.38], [0, 24]);
  const opacity = useTransform(scrollYProgress, [0.06, 0.34], [1, 0]);
  const y = useTransform(scrollYProgress, [0.06, 0.38], [0, -45]);

  useEffect(() => {
    const onPulse = (e) => { if (e.detail.source === "click" && window.scrollY < window.innerHeight * 0.6) setReplay((v) => v + 1); };
    const onMove = (e) => {
      const el = wrap.current;
      if (!el) return;
      el.style.setProperty("--px", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      el.style.setProperty("--py", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    };
    window.addEventListener("portfolio:pulse", onPulse);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("portfolio:pulse", onPulse);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section id="top" ref={wrap} data-testid="hero-section" className="relative h-[180svh] z-[2]">
      <div className="hero-sticky">
        <motion.div style={{ scale: reduce ? 1 : scale, borderRadius: radius, opacity, y: reduce ? 0 : y }} className="relative h-full w-full overflow-hidden flex flex-col justify-end pb-10 md:pb-6 pt-32">
          {lite && <img className="lite-hero-scene" src="/fallback/hero-scene.jpg" alt="" decoding="async" fetchPriority="high" aria-hidden="true" />}
          <div className="container-x relative z-[1]">
            <div className="hero-name" key={replay}>
              <span className="hn-frame" aria-hidden="true">
                <i className="hn-tick tl" /><i className="hn-tick tr" /><i className="hn-tick bl" /><i className="hn-tick br" />
              </span>
              <HeroName first={profile.first} last={profile.last} play={ready} />
            </div>
            <div className="hero-copy">
              <Reveal play={ready} delay={1.5} as="p" className="p-lead" data-testid="hero-tagline">{profile.tagline}</Reveal>
              <Reveal play={ready} delay={1.65} as="p" className="hero-affiliation">{profile.institution} · {profile.location}</Reveal>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 1.8, ease: [0.16, 1, 0.3, 1] }} className="hero-actions">
                <Button href="#research" testid="hero-cta-projects">View my work</Button>
                <Button href="#contact" variant="ghost" testid="hero-cta-contact">Get in touch</Button>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 2.1 }} className="mt-12 md:mt-14 flex items-center gap-4">
              <span className="scroll-line" aria-hidden="true" />
              <span className="label">Scroll</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
