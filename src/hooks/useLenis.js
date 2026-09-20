import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth scroll wiring. Sub-second inertia, direction-preserving.
 * Exposes the Lenis instance on window.__lenis so modals/overlays can stop it
 * to prevent background scroll while they're open.
 */
export default function useLenis() {
  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)").matches;
    if (isTouch) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });
    window.__lenis = lenis;

    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Lenis takes ownership of scrolling as soon as the app mounts, which
    // prevents the browser's usual initial #section jump. Honour a shared
    // section URL after the page has laid out without animating the visitor
    // away from their intended destination.
    const initialHash = window.location.hash;
    let hashFrame = 0;
    if (initialHash && initialHash !== "#top") {
      hashFrame = requestAnimationFrame(() => {
        try {
          const target = document.querySelector(initialHash);
          if (target) lenis.scrollTo(target, { offset: -40, immediate: true });
        } catch {
          // Ignore a malformed hash; normal navigation remains available.
        }
      });
    }

    const onAnchor = (e) => {
      const link = e.target.closest && e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -40, duration: 1.4 });
      }
    };
    document.addEventListener("click", onAnchor);

    return () => {
      document.removeEventListener("click", onAnchor);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(hashFrame);
      lenis.destroy();
      if (window.__lenis === lenis) delete window.__lenis;
    };
  }, []);
}
