import React, { useRef } from "react";

export default function Button({
  href,
  onClick,
  children,
  variant = "solid",
  className = "",
  download,
  target,
  testid,
  ...rest
}) {
  const ref = useRef(null);
  const setPos = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  const Comp = href ? "a" : "button";
  return (
    <Comp
      ref={ref}
      href={href}
      onClick={onClick}
      download={download}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      type={href ? undefined : "button"}
      data-magnetic
      data-hover
      data-testid={testid}
      onMouseEnter={setPos}
      onMouseLeave={setPos}
      className={`btn btn-${variant} ${className}`}
      {...rest}
    >
      <span className="btn-fill" aria-hidden="true" />
      <span className="btn-label">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
      <span className="btn-ico" aria-hidden="true">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M1.5 8.5 8.5 1.5M3 1.5h5.5V7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Comp>
  );
}
