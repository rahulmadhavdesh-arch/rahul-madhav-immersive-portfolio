import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { projects } from "../../data/content";
import ProjectModal from "../modals/ProjectModal";
import ScanText from "../ui-custom/ScanText";
import Reveal from "../ui-custom/Reveal";
import Tile from "../ui-custom/Tile";
const ProjectGallery = lazy(() => import('../three/ProjectGallery'));

const spans = ["md:col-span-7", "md:col-span-5", "md:col-span-4", "md:col-span-4", "md:col-span-4", "md:col-span-6", "md:col-span-6"];

function canUseProjectGallery() {
  const nav = window.navigator;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  return !new URLSearchParams(window.location.search).has("lite")
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    && !(typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4)
    && !(typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4)
    && !connection?.saveData
    && !/^(slow-2g|2g|3g)$/.test(connection?.effectiveType || "");
}

export default function Projects({ lite = false }) {
  const [open, setOpen] = useState(null);
  // Start the shared renderer only after a genuine pause in scrolling. Creating
  // the second WebGL context is a one-time cost; a fixed post-intro timer could
  // land that work directly inside the focus strip on a fast first pass.
  const [galleryOn, setGalleryOn] = useState(false);
  const sectionRef = useRef(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || lite || !canUseProjectGallery()) return;
    let startTimer = 0;
    let requested = false;
    let lastScroll = performance.now();
    const mountWhenQuiet = () => {
      window.clearTimeout(startTimer);
      const wait = Math.max(0, 850 - (performance.now() - lastScroll));
      startTimer = window.setTimeout(() => {
        if (performance.now() - lastScroll < 850) {
          mountWhenQuiet();
          return;
        }
        setGalleryOn(true);
      }, wait);
    };
    const schedule = () => {
      if (requested || galleryOn) return;
      requested = true;
      mountWhenQuiet();
    };
    const onScroll = () => {
      lastScroll = performance.now();
      if (requested) mountWhenQuiet();
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) schedule();
    }, { rootMargin: "2600px 0px" });
    // Hard fallback: once Projects is genuinely close, mount immediately even
    // if smooth scrolling has not produced an 850 ms quiet window.
    const nearIo = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setGalleryOn(true);
    }, { rootMargin: "1200px 0px" });
    io.observe(el);
    nearIo.observe(el);
    window.addEventListener("portfolio:intro-complete", schedule, { once: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      nearIo.disconnect();
      window.clearTimeout(startTimer);
      window.removeEventListener("portfolio:intro-complete", schedule);
      window.removeEventListener("scroll", onScroll);
    };
  }, [galleryOn, lite]);
  return (
    <section ref={sectionRef} id="work" data-testid="projects-section" className="relative py-28 md:py-40">
      <div className="container-x">
        <div className="grid md:grid-cols-12 gap-6 items-end mb-12 md:mb-16">
          <ScanText className="h-section text-text md:col-span-8" accent="built">Things I've built.</ScanText>
          <Reveal as="p" className="p-body md:col-span-4 md:text-right md:ml-auto">
            Medical devices, electric propulsion, and machines built to move. Explore the models, then open a project.
          </Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
          {projects.map((p, i) => (
            <Tile key={p.id} model index={i} span={spans[i]} tint={p.tint} art={p.art} code={p.code} title={p.title} text={p.summary} tags={p.tags}
              metric={p.metric} metricLabel={p.metricLabel} cta="Open case" big={i === 0}
              modelPoster={lite ? `/fallback/project-${i}.jpg` : undefined}
              testid={`project-card-${i + 1}`} onClick={() => setOpen(p)} />
          ))}
        </div>
      </div>
      {!lite && galleryOn && <Suspense fallback={null}><ProjectGallery /></Suspense>}
      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </section>
  );
}
