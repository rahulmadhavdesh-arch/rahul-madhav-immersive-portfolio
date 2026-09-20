import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { extras } from "../../data/content";
import ScanText from "../ui-custom/ScanText";
import Reveal from "../ui-custom/Reveal";
import StoryModal from "../modals/StoryModal";

/**
 * The fun stuff, as an index rather than another card grid — every other
 * section here is tiles, so this one earns its own form. Hovering a row
 * floats that photo under the cursor with a little lag and tilt; on touch
 * the thumbnail just sits inline instead.
 */
export default function Beyond() {
  const [open, setOpen] = useState(null);
  const [hot, setHot] = useState(-1);
  const floatRef = useRef(null);
  const imgRef = useRef(null);
  const hotRef = useRef(-1);

  useEffect(() => {
    const el = floatRef.current;
    if (!el) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const s = { x: window.innerWidth / 2, y: window.innerHeight / 2, tx: 0, ty: 0, vx: 0 };
    s.tx = s.x;
    s.ty = s.y;
    const onMove = (e) => { s.tx = e.clientX; s.ty = e.clientY; };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let running = true;
    const loop = () => {
      if (!running) return;
      const px = s.x;
      s.x += (s.tx - s.x) * 0.13;
      s.y += (s.ty - s.y) * 0.13;
      s.vx += ((s.x - px) - s.vx) * 0.2;
      const on = hotRef.current >= 0;
      el.style.transform =
        `translate3d(${s.x}px, ${s.y}px, 0) translate(-50%, -50%) rotate(${(s.vx * 0.35).toFixed(2)}deg) scale(${on ? 1 : 0.82})`;
      el.style.opacity = on ? 1 : 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, []);

  const enter = (i) => { hotRef.current = i; setHot(i); if (imgRef.current) imgRef.current.src = extras[i].cover; };
  const leave = () => { hotRef.current = -1; setHot(-1); };

  return (
    <section id="beyond" data-testid="beyond-section" className="relative py-28 md:py-40">
      <div className="container-x">
        <div className="grid md:grid-cols-12 gap-6 items-end mb-12 md:mb-16">
          <ScanText className="h-section text-text md:col-span-7" accent="clock">Off the clock.</ScanText>
          <Reveal as="p" className="p-body md:col-span-5 md:ml-auto md:text-right">
            Horses, forges, walls and crosswords. Open any of them for the full story and the photos.
          </Reveal>
        </div>

        <ul className="ex-list" onMouseLeave={leave}>
          {extras.map((x, i) => (
            <motion.li
              key={x.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
              style={{ "--tint": x.tint }}
            >
              <button
                type="button"
                className="ex-row"
                data-hover
                data-cursor="Open"
                data-on={hot === i ? "1" : "0"}
                data-dim={hot >= 0 && hot !== i ? "1" : "0"}
                data-testid={`extra-card-${i}`}
                onMouseEnter={() => enter(i)}
                onFocus={() => enter(i)}
                onBlur={leave}
                onClick={() => setOpen(x)}
              >
                <span className="num ex-idx">{String(i + 1).padStart(2, "0")}</span>
                <img className="ex-thumb" src={x.cover} alt="" loading="lazy" aria-hidden="true" />
                <span className="ex-title">{x.title}</span>
                <span className="ex-meta">
                  <span className="ex-tag">{x.tag}</span>
                  <span className="ex-period num">{x.period}</span>
                </span>
                <span className="ex-arrow" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 8.5 8.5 1.5M3 1.5h5.5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>

      <div ref={floatRef} className="ex-float" aria-hidden="true">
        <img ref={imgRef} alt="" />
      </div>

      <StoryModal item={open} onClose={() => setOpen(null)} />
    </section>
  );
}
