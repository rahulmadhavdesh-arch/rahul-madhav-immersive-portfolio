import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/** A single indexed band of working areas that drifts as the page scrolls.
 *  Transform only, so it never reflows, and it does not loop: the ends are
 *  meant to run out under the edge fades. */
export default function FocusStrip({ items }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["3%", "-12%"]);

  return (
    <div ref={ref} className="focus-strip" aria-label={items.join(", ")}>
      <motion.div className="focus-rail" style={{ x }}>
        {items.map((term, i) => (
          <span className="focus-item" key={term}>
            <i className="focus-idx num">{String(i + 1).padStart(2, "0")}</i>
            <span className="focus-term">{term}</span>
          </span>
        ))}
      </motion.div>
      <div className="focus-edge focus-edge--l" aria-hidden="true" />
      <div className="focus-edge focus-edge--r" aria-hidden="true" />
    </div>
  );
}
