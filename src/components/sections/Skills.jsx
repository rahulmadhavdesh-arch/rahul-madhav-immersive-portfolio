import React, { useState } from "react";
import { motion } from "framer-motion";
import { skillGroups } from "../../data/content";
import ScanText from "../ui-custom/ScanText";

export default function Skills() {
  const [hot, setHot] = useState({});
  return (
    <section id="skills" data-testid="skills-section" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="mb-12 md:mb-16">
          <ScanText className="h-section text-text" accent="skills">Technical skills.</ScanText>
        </div>

        <div className="border-b border-white/10">
          {skillGroups.map((g, gi) => {
            const h = hot[g.id];
            return (
              <motion.div key={g.id} className="ledger-row" style={{ "--tint": g.tint }} data-testid={`skill-category-${g.id}`}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.8, delay: gi * 0.06, ease: [0.16, 1, 0.3, 1] }}>
                <div className="flex items-start gap-4">
                  <span className="num text-[0.7rem] pt-2" style={{ color: g.tint }}>{String(gi + 1).padStart(2, "0")}</span>
                  <h3 className="h-card text-text text-[1.6rem] md:text-[2rem]" style={{ fontVariationSettings: '"wdth" 95' }}>{g.name}</h3>
                </div>
                <div className="xl:pr-[22rem]">
                  <div className="flex flex-wrap items-baseline">
                    {g.tools.map((t) => (
                      <button key={t.n} type="button" className="tool" data-hover data-on={h === t.n ? "1" : "0"}
                        onMouseEnter={() => setHot((v) => ({ ...v, [g.id]: t.n }))} onMouseLeave={() => setHot((v) => ({ ...v, [g.id]: null }))}
                        onFocus={() => setHot((v) => ({ ...v, [g.id]: t.n }))} onBlur={() => setHot((v) => ({ ...v, [g.id]: null }))}>
                        {t.n}
                      </button>
                    ))}
                  </div>
                  <div className="ledger-uses mt-3 flex items-center gap-2">
                    <span className="w-4 h-px" style={{ background: g.tint, opacity: h ? 1 : 0.3 }} />
                    <span className={h ? "text-text" : "text-text-3"}>{h ? g.tools.find((t) => t.n === h)?.uses : ""}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
