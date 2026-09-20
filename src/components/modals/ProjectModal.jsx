import React from "react";
import Modal from "../ui-custom/Modal";
import Plot from "../ui-custom/Plot";

export default function ProjectModal({ project, onClose }) {
  if (!project) return null;
  const { gallery, challenges, results, story } = project;
  // Full-width items sit on their own row, so only the rest compete for columns.
  // The grid is 6 wide: 3-up is span 2, 2-up is span 3, alone is span 6. A count
  // that would leave a short last row stretches its tail instead of gapping.
  const plateCount = gallery ? gallery.filter((g) => !g.wide).length : 0;
  const spanFor = (i) => {
    if (plateCount === 1) return 6;
    if (plateCount === 2 || plateCount === 4) return 3;
    const rem = plateCount % 3;
    if (rem && i >= plateCount - rem) return rem === 1 ? 6 : 3;
    return 2;
  };
  return (
    <Modal open={!!project} onClose={onClose} testid={`project-modal-${project.id}`}>
      <div className="relative h-64 md:h-80 w-full overflow-hidden" style={{ "--tint": project.tint }}>
        <div className="absolute inset-0 opacity-80"><Plot kind={project.art} tint={project.tint} /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-7 md:p-10">
          <div className="label mb-3">{project.code} · Case</div>
          <h2 className="h-card text-3xl md:text-5xl text-text">{project.title}</h2>
        </div>
      </div>
      <div className="p-7 md:p-10 grid md:grid-cols-12 gap-8 md:gap-12" style={{ "--tint": project.tint }}>
        <div className="md:col-span-7">
          <div className="label mb-3">Overview</div>
          {story
            ? story.map((para) => <p key={para.slice(0, 24)} className="p-body text-text-2 mb-4 last:mb-0">{para}</p>)
            : <p className="p-body text-text-2">{project.overview}</p>}
          <div className="label mt-9 mb-3">Stack</div>
          <div className="flex flex-wrap gap-2">{project.tags.map((t) => <span key={t} className="tag" style={{ "--tint": project.tint }}>{t}</span>)}</div>
        </div>
        <div className="md:col-span-5">
          <div className="label mb-3">Numbers</div>
          <dl className="border-t border-white/8">
            {project.specs.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-white/8 py-3">
                <dt className="label">{k}</dt>
                <dd className="text-text text-sm text-right">{v}</dd>
              </div>
            ))}
          </dl>
          {results ? (
            <>
              <div className="label mt-9 mb-3">Outcome</div>
              <ul className="case-results">
                {results.map((r) => <li key={r.slice(0, 24)}>{r}</li>)}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      {gallery ? (
        <div className="px-7 md:px-10 pb-2" style={{ "--tint": project.tint }}>
          <div className="label mb-3">Gallery</div>
          <div className="pg-grid">
            {gallery.map((g, i) => (
              <figure
                key={g.src}
                className={`pg-item${g.wide ? " pg-item--wide" : ""}`}
                style={g.wide ? undefined : { "--span": spanFor(gallery.slice(0, i).filter((x) => !x.wide).length) }}
              >
                {/* preload none: the clips are tens of MB and only fetch on play */}
                {g.src.endsWith(".mp4")
                  ? <video src={g.src} controls playsInline preload="none" poster={g.poster} aria-label={g.alt} />
                  : <img src={g.src} alt={g.alt} loading="lazy" decoding="async" />}
                <figcaption>{g.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}

      {challenges ? (
        <div className="p-7 md:p-10" style={{ "--tint": project.tint }}>
          <div className="label mb-3">What got in the way</div>
          <div className="case-hurdles">
            {challenges.map(([c, fix]) => (
              <div key={c} className="case-hurdle">
                <h4>{c}</h4>
                <p>{fix}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
