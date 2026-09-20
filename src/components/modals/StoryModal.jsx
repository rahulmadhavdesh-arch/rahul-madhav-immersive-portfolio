import React, { useState } from "react";
import Modal from "../ui-custom/Modal";

/** Full write-up for a Beyond entry: story, achievements, and a gallery that
 *  takes both photos and video. */
export default function StoryModal({ item, onClose }) {
  const [expandedImage, setExpandedImage] = useState(null);
  if (!item) return null;
  const tint = item.tint || "var(--accent)";
  return (
    <Modal open={!!item} onClose={() => { setExpandedImage(null); onClose(); }} testid={`beyond-modal-${item.id}`}>
      <div className="relative h-64 md:h-[22rem] w-full overflow-hidden" style={{ "--tint": tint }}>
        <img src={item.cover} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/45 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-7 md:p-10">
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className="tag" style={{ "--tint": tint, color: tint }}>{item.tag}</span>
            <span className="num text-[0.7rem] text-text-3">{item.period}</span>
          </div>
          <h2 className="h-card text-3xl md:text-5xl text-text">{item.title}</h2>
        </div>
      </div>

      <div className="p-7 md:p-10 grid md:grid-cols-12 gap-8 md:gap-12">
        <div className="md:col-span-7">
          <p className="p-body text-base md:text-lg text-text-2">{item.body}</p>
        </div>
        {item.achievements?.length > 0 && (
          <div className="md:col-span-5">
            <div className="label mb-4">Highlights</div>
            <ul className="space-y-3">
              {item.achievements.map((a) => (
                <li key={a} className="flex gap-3 text-sm text-text-2 leading-relaxed">
                  <span className="mt-[0.55em] w-1.5 h-1.5 flex-none rounded-full" style={{ background: tint }} />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {item.gallery?.length > 0 && (
        <div className="p-7 md:p-10 pt-0">
          <div className="flex items-baseline justify-between mb-4">
            <div className="label">Gallery</div>
            <div className="label">{item.gallery.length} items</div>
          </div>
          <div className="ex-gallery">
            {item.gallery.map((g, i) =>
              g.kind === "video" ? (
                <video key={i} className="ex-gal-item" src={g.src} poster={g.poster} controls playsInline preload="metadata" data-testid={`beyond-${item.id}-media-${i}`} />
              ) : (
                <button
                  key={i}
                  type="button"
                  className="ex-gal-button"
                  aria-label={`Expand ${item.title} photo ${i + 1}`}
                  data-hover
                  onClick={() => setExpandedImage({ src: g.src, alt: `${item.title} ${i + 1}` })}
                  data-testid={`beyond-${item.id}-media-${i}`}
                >
                  <img className="ex-gal-item" src={g.src} alt={`${item.title} ${i + 1}`} loading="lazy" />
                  <span className="ex-gal-expand" aria-hidden="true">Expand</span>
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {expandedImage && (
        <div className="ex-media-popout" role="dialog" aria-modal="true" aria-label={expandedImage.alt} onClick={() => setExpandedImage(null)}>
          <button type="button" className="ex-media-popout-close" aria-label="Close expanded photo" data-hover onClick={() => setExpandedImage(null)}>×</button>
          <img src={expandedImage.src} alt={expandedImage.alt} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </Modal>
  );
}
