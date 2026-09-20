import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Modal:
 *  - Locks background scroll (body overflow + Lenis stop) while open.
 *  - Content scrolls INSIDE the dialog only — not the page behind it.
 *  - Closes on backdrop click, close button, or Escape.
 */
export default function Modal({ open, onClose, children, testid = "modal" }) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;

    const focusDialog = () => {
      const first = dialogRef.current?.querySelector(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    };

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Preserve current body state so we can restore accurately
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarComp =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarComp > 0) {
      document.body.style.paddingRight = `${scrollbarComp}px`;
    }

    // Stop Lenis so wheel/touch events don't scroll the background
    const lenis = window.__lenis;
    if (lenis && typeof lenis.stop === "function") lenis.stop();

    window.addEventListener("keydown", onKey);
    const focusFrame = requestAnimationFrame(focusDialog);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      if (lenis && typeof lenis.start === "function") lenis.start();
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(focusFrame);
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid={`${testid}-backdrop`}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
          data-lenis-prevent
        >
          <div className="absolute inset-0 bg-[rgba(10,11,18,0.82)] backdrop-blur-md" />
          <motion.div
            data-testid={testid}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Details"
            initial={{ y: 40, opacity: 0, filter: "blur(8px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 40, opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            data-lenis-prevent
            className="relative w-full max-w-5xl max-h-[90vh] bg-ink-2 border border-white/8 rounded-[20px] overflow-hidden flex flex-col"
          >
            <button
              type="button"
              data-testid={`${testid}-close`}
              onClick={onClose}
              aria-label="Close"
              data-hover
              className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center text-text-2 hover:text-ink hover:bg-aqua hover:border-aqua text-xl bg-[rgba(10,11,18,0.7)] border border-white/10 rounded-full transition-colors"
            >
              ×
            </button>
            {/* Internal scroll container — this is the ONLY thing that scrolls */}
            <div
              data-testid={`${testid}-scroll`}
              className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar"
              data-lenis-prevent
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
