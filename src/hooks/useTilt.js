import { useRef } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Cursor-tracked tilt. Returns props to spread on a `motion` element so it
 * rotates a few degrees toward the cursor's position within its bounds, with a
 * spring so it settles back to flat cleanly on mouse-leave. Restrained by
 * design — pass a smaller `max` for small elements (nav items) and a larger
 * one for big cards, so different sizes don't share identical rotation.
 *
 *   const tilt = useTilt({ max: 6, scale: 1.02 });
 *   <motion.button {...tilt.handlers} style={tilt.style} ref={tilt.ref} />
 */
export default function useTilt({ max = 6, scale = 1.02 } = {}) {
  const ref = useRef(null);
  const px = useMotionValue(0.5); // pointer x within bounds, 0..1
  const py = useMotionValue(0.5); // pointer y within bounds, 0..1

  const spring = { stiffness: 220, damping: 20, mass: 0.4 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);
  const sScale = useSpring(1, spring);

  // The corner under the cursor lifts toward the viewer: cursor near the top
  // brings the top edge forward, cursor near a side brings that side forward.
  // Range is only ±max degrees so it stays a restrained lean, not a flip.
  const rotateX = useTransform(sy, [0, 1], [-max, max]);
  const rotateY = useTransform(sx, [0, 1], [max, -max]);

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    sScale.set(scale);
  };

  const onMouseLeave = () => {
    px.set(0.5);
    py.set(0.5);
    sScale.set(1);
  };

  return {
    ref,
    handlers: { onMouseMove, onMouseLeave },
    style: {
      rotateX,
      rotateY,
      scale: sScale,
      transformPerspective: 800,
      transformStyle: "preserve-3d",
    },
  };
}
