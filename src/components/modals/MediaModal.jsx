import React from "react";
import Modal from "../ui-custom/Modal";
import Plot from "../ui-custom/Plot";

export default function MediaModal({ item, onClose, kind = "entry" }) {
  if (!item) return null;
  const tint = item.tint || "var(--accent)";
  const isPath = kind === "path";
  const primaryTitle = isPath ? item.org : (item.title || item.role);
  const secondaryTitle = isPath ? item.role : item.org;
  return (
    <Modal open={!!item} onClose={onClose} testid={`${kind}-modal-${item.id}`}>
      <div className="relative h-56 md:h-72 w-full overflow-hidden" style={{ "--tint": tint }}>
        <div className="absolute inset-0 opacity-80"><Plot kind={item.art || "wave"} tint={tint} /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-7 md:p-10">
          <div className="label mb-3">
            {item.tag || item.period}
            {item.tag && item.period && <span className="text-text-3"> · {item.period}</span>}
          </div>
          <h2 className="h-card text-3xl md:text-5xl text-text">{primaryTitle}</h2>
          {secondaryTitle && <div className="mt-3 text-base md:text-lg font-semibold" style={{ color: tint }}>{secondaryTitle}</div>}
        </div>
      </div>
      <div className="p-7 md:p-10 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8"><p className="p-body text-base md:text-lg text-text-2">{item.body}</p></div>
        {item.short && (
          <div className="md:col-span-4">
            <div className="label mb-3">In brief</div>
            <p className="text-text-2 text-sm leading-relaxed">{item.short}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
