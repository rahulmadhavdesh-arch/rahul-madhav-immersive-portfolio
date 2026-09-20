import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { profile } from "../../data/content";

const links = [
  { href: "#about", label: "About" },
  { href: "#research", label: "Research" },
  { href: "#work", label: "Work" },
  { href: "#skills", label: "Skills" },
  { href: "#path", label: "Path" },
  { href: "#teams", label: "Teams" },
  { href: "#beyond", label: "Beyond" },
  { href: "#contact", label: "Contact" },
];

export default function Nav({ ready = true }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const lenis = window.__lenis;
    if (lenis) open ? lenis.stop() : lenis.start();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const setPos = (e) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  return (
    <>
      <motion.a
        href="#top"
        data-testid="brand-link"
        data-hover
        initial={{ opacity: 0, y: -8 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-5 left-5 md:top-7 md:left-9 z-[40] flex items-center gap-3 text-text no-underline"
      >
        <span className="relative grid place-items-center w-9 h-9 rounded-full border border-white/15">
          <span className="font-display font-black text-[0.72rem]">RMD</span>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
        </span>
        <span className="hidden md:inline text-sm font-medium text-text-2">Rahul Madhav Deshpande</span>
      </motion.a>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 right-4 md:top-6 md:right-9 z-[60]"
      >
      <button
        ref={btnRef}
        type="button"
        data-testid="nav-menu-icon"
        data-magnetic
        data-hover
        onMouseEnter={setPos}
        onMouseLeave={setPos}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="btn btn-ghost !py-2.5 !pl-4 !pr-3 text-sm backdrop-blur-md bg-[rgba(10,11,18,0.5)]"
      >
        <span className="btn-fill" aria-hidden="true" />
        <span className="btn-label">
          <span>{open ? "Close" : "Menu"}</span>
          <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
        </span>
        <span className="relative w-4 h-3 ml-1" aria-hidden="true">
          <span
            className={`absolute left-0 right-0 h-px bg-current transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
              open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 right-0 h-px bg-current transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
              open ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-full -translate-y-full"
            }`}
          />
        </span>
      </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="nav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[50] bg-[rgba(10,11,18,0.9)] backdrop-blur-xl"
          >
            <div className="container-x h-full flex flex-col justify-center">
              <ul className="flex flex-col gap-1 md:gap-2">
                {links.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ clipPath: "inset(0 0 100% 0)", y: 30 }}
                    animate={{ clipPath: "inset(0 0 0% 0)", y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.06 + i * 0.05 }}
                  >
                    <a
                      href={l.href}
                      data-hover
                      data-testid={`nav-${l.label.toLowerCase()}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-5 md:gap-8 w-fit text-text-2 hover:text-text no-underline"
                    >
                      <span className="num text-[0.68rem] accent w-6">0{i + 1}</span>
                      <span className="nav-bar" />
                      <span
                        className="nav-item font-display font-bold leading-none"
                        style={{ fontSize: "clamp(2.6rem, 7vw, 6rem)", letterSpacing: "-0.03em" }}
                      >
                        {l.label}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="mt-14 flex flex-wrap items-center justify-between gap-4 text-sm text-text-2"
              >
                <a className="u-link" href={`mailto:${profile.email}`} data-hover>
                  {profile.email}
                </a>
                <div className="flex gap-6">
                  <a className="u-link" href={profile.linkedin} target="_blank" rel="noopener noreferrer" data-hover>
                    LinkedIn
                  </a>
                  <a className="u-link" href={profile.resumeUrl} download data-hover data-testid="nav-resume-btn">
                    Résumé
                  </a>
                  <a className="u-link" href={profile.cvUrl} download data-hover data-testid="nav-cv-btn">
                    Academic CV
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
