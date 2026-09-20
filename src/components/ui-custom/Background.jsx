import React, { useEffect, useRef } from "react";

export const CHAPTERS = [
  { id: "top", label: "Start" },
  { id: "about", label: "About" },
  { id: "research", label: "Research" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Skills" },
  { id: "path", label: "Path" },
  { id: "teams", label: "Teams" },
  { id: "beyond", label: "Beyond" },
  { id: "contact", label: "Contact" },
];

/**
 * Chapter-aware backdrop: tracks which section is on screen, stamps it on
 * <html data-chapter> (which swaps --accent), drives the colour blobs, and
 * lays a film grain over everything.
 */
export default function Background() {
  const grainRef = useRef(null);

  useEffect(() => {
    const c = grainRef.current;
    if (c) {
      const s = 160;
      c.width = c.height = s;
      const g = c.getContext("2d");
      const img = g.createImageData(s, s);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 90 + Math.random() * 120;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      c.style.backgroundImage = `url(${c.toDataURL()})`;
    }

    let tops = [];
    const measure = () => {
      tops = CHAPTERS.map((ch) => {
        const el = document.getElementById(ch.id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      });
    };
    let last = "";
    const update = () => {
      const y = window.scrollY + window.innerHeight * 0.45;
      let id = CHAPTERS[0].id;
      for (let i = 0; i < CHAPTERS.length; i++) if (y >= tops[i]) id = CHAPTERS[i].id;
      if (id !== last) {
        last = id;
        document.documentElement.dataset.chapter = id;
        window.dispatchEvent(new CustomEvent("portfolio:chapter", { detail: id }));
      }
    };
    measure();
    update();
    // Section geometry changes when content reflows, not while the document is
    // merely scrolling. Observing the page size avoids the old periodic batch
    // of forced layout reads that could land in the middle of a wheel gesture.
    let measureFrame = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(measureFrame);
      measureFrame = requestAnimationFrame(() => {
        measure();
        update();
      });
    };
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
    if (ro) ro.observe(document.documentElement);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      cancelAnimationFrame(measureFrame);
      ro?.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, []);

  return (
    <>
      <canvas ref={grainRef} className="bg-grain" aria-hidden="true" style={{ backgroundRepeat: "repeat", width: "100%", height: "100%" }} />
    </>
  );
}
