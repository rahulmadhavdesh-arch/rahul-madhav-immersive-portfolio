import React, { useEffect, useState } from "react";
import { CHAPTERS } from "./Background";

export default function ChapterIndex() {
  const [active, setActive] = useState("top");
  useEffect(() => {
    const on = (e) => setActive(e.detail);
    window.addEventListener("portfolio:chapter", on);
    return () => window.removeEventListener("portfolio:chapter", on);
  }, []);
  return (
    <nav className="chapters" aria-label="Chapters">
      {CHAPTERS.map((c, i) => (
        <a key={c.id} href={`#${c.id}`} className="chapter" data-active={active === c.id ? "1" : "0"} data-hover>
          <span className="chapter-label">{c.label}</span>
          <span className="num text-[0.6rem]">{String(i + 1).padStart(2, "0")}</span>
          <span className="chapter-bar" />
        </a>
      ))}
    </nav>
  );
}
