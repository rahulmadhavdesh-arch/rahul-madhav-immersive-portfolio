import React, { Suspense, lazy, useCallback, useState } from "react";
import Nav from "../components/sections/Nav";
import Hero from "../components/sections/Hero";
import About from "../components/sections/About";
import Research from "../components/sections/Research";
import Projects from "../components/sections/Projects";
import Skills from "../components/sections/Skills";
import Path from "../components/sections/Path";
import Teams from "../components/sections/Teams";
import Beyond from "../components/sections/Beyond";
import Contact from "../components/sections/Contact";
import CustomCursor from "../components/ui-custom/CustomCursor";
import Loader from "../components/ui-custom/Loader";
import PulseLayer from "../components/ui-custom/PulseLayer";
import FocusStrip from "../components/ui-custom/FocusStrip";
import { focusAreas } from "../data/content";
import Background from "../components/ui-custom/Background";
import ChapterIndex from "../components/ui-custom/ChapterIndex";
import useLenis from "../hooks/useLenis";

const SceneCanvas = lazy(() => import("../components/three/SceneCanvas"));
const NebulaCanvas = lazy(() => import("../components/three/NebulaCanvas"));

function canRun3D() {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).has("lite")) return false;
  const nav = window.navigator;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const lowCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const dataSaver = connection?.saveData || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType || "");
  if (lowMemory || lowCpu || dataSaver) return false;

  // Chromium reports SwiftShader / llvmpipe when WebGL would run in software.
  // A page-long animation loop on that renderer is dramatically worse than the
  // intentionally designed static fallback.
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) return false;
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "";
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return !/swiftshader|llvmpipe|software rasterizer/i.test(renderer);
}

export default function Portfolio() {
  useLenis();
  const [ready, setReady] = useState(false);
  const richScene = canRun3D();

  const onOpen = useCallback(() => {
    // Latch before broadcasting. A canvas that mounts after this point still
    // needs to know the page opened, and a bare event tells it nothing.
    window.__portfolioOpened = true;
    window.dispatchEvent(new CustomEvent("portfolio:open"));
    setTimeout(() => setReady(true), 150);
  }, []);

  return (
    <div data-testid="portfolio-root" data-lite={richScene ? "0" : "1"} className="relative min-h-screen text-text">
      <Background />
      {!richScene && <div className="lite-nebula" aria-hidden="true" />}
      {richScene && <Suspense fallback={null}><NebulaCanvas /></Suspense>}
      {richScene && <Suspense fallback={null}><SceneCanvas /></Suspense>}
      <PulseLayer />
      <Loader onOpen={onOpen} waitForScene={richScene} />
      <CustomCursor />
      <Nav ready={ready} />
      <ChapterIndex />
      {/* hero lives below the canvas; everything after floats above it */}
      <Hero ready={ready} lite={!richScene} />
      <main id="main-content" className="relative z-10">
        <About />
        <FocusStrip items={focusAreas} />
        <Research />
        <Projects lite={!richScene} />
        <Skills />
        <Path />
        <Teams />
        <Beyond />
        <Contact />
      </main>
    </div>
  );
}
