import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Body-copy reveal: a left→right wipe (the same scan language, quieter). */
export default function Reveal({ children, className = "", delay = 0, as = "div", y = 12, play, ...rest }) {
  const M = motion[as] || motion.div;
  const reduce = useReducedMotion();
  const from = reduce ? {} : { clipPath: "inset(0 100% 0 0)", opacity: 0, y };
  const to = { clipPath: "inset(0 0% 0 0)", opacity: 1, y: 0 };
  const control =
    play === undefined
      ? { whileInView: to, viewport: { once: true, margin: "-8% 0px" } }
      : { animate: play ? to : from };
  return (
    <M
      className={className}
      initial={from}
      {...control}
      transition={{ duration: 1.05, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </M>
  );
}
