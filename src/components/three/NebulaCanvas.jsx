import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The backdrop: a GPU fbm nebula on its own layer, *behind* the page text, so
 * the instrument canvas above can stay transparent and float over the type.
 * Colours follow the chapter accent; one fullscreen quad, no depth, no post.
 */
const CLR = { aqua: 0x4be1ff, coral: 0xff6b57, violet: 0x8f7bff, lime: 0xc9ff4a, butter: 0xffd84a };
// [cloud A, cloud B, gain] — gain lifts a chapter's saturation a touch. The
// red and violet stretches carry slightly more than the rest.
const ACCENT = {
  // the one exception: violet leads the landing chapter. uA is the mid band,
  // the one that carries the surface, so the wall reads purple, aqua behind it.
  // every other chapter is its original pair and matches its own text.
  top: [CLR.violet, CLR.aqua, 1.18],
  about: [CLR.lime, CLR.aqua, 1.0],
  research: [CLR.coral, CLR.butter, 1.22],
  work: [CLR.violet, CLR.coral, 1.16],
  skills: [CLR.lime, CLR.violet, 1.04],
  path: [CLR.aqua, CLR.lime, 1.0],
  teams: [CLR.butter, CLR.coral, 1.08],
  beyond: [CLR.lime, CLR.butter, 1.1],
  contact: [CLR.coral, CLR.aqua, 1.18],
};

export default function NebulaCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power", depth: false, stencil: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uA: { value: new THREE.Color(CLR.violet) },
      uB: { value: new THREE.Color(CLR.aqua) },
      uAspect: { value: window.innerWidth / window.innerHeight },
      uScroll: { value: 0 },
      uReveal: { value: 0 },
      uGain: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      depthWrite: false,
      depthTest: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
        uniform float uTime; uniform vec2 uMouse; uniform vec3 uA; uniform vec3 uB;
        uniform float uAspect; uniform float uScroll; uniform float uReveal; uniform float uGain;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
          for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
        float fbm3(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
          for(int i=0;i<3;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }

        // depth 0 = far wall, 1 = right in front of the lens
        vec2 par(vec2 p, float depth){
          return p + uMouse * (0.018 + 0.11 * depth)
                   + vec2(0.0, uScroll * (0.00007 + 0.00045 * depth));
        }

        // one starfield layer
        float stars(vec2 p, float density, float cut, float speed){
          vec2 g = floor(p * density);
          float tw = 0.55 + 0.45 * sin(uTime * speed + hash(g) * 40.0);
          return pow(hash(g), 58.0) * step(cut, hash(g + 7.0)) * tw;
        }

        void main(){
          vec2 base = (vUv - 0.5) * vec2(uAspect, 1.0);
          float t = uTime * 0.022;
          vec3 col = vec3(0.013, 0.012, 0.034);

          // ── far band: the deep wall, big and slow ──
          vec2 pf = par(base, 0.0);
          vec2 qf = vec2(fbm(pf * 0.85 + t * 0.5), fbm(pf * 0.85 - t * 0.3));
          float nf = fbm(pf * 1.15 + qf * 1.4 + t * 0.2);
          col = mix(col, uB * (0.70 * uGain), smoothstep(0.38, 0.80, nf) * 0.96);

          // ── mid band: the main colour mass ──
          vec2 pm = par(base, 0.45);
          float nm = fbm(pm * 1.9 + qf * 1.6 + t * 0.4);
          col = mix(col, uA * (0.98 * uGain), smoothstep(0.42, 0.82, nm) * 0.97);
          col += uA * (0.10 * uGain) * smoothstep(0.66, 1.0, nf * nm * 2.0);

          // ── near band: fast, wispy, passes close to camera ──
          vec2 pn = par(base, 1.0);
          float nn = fbm3(pn * 3.6 - qf * 1.2 - t * 0.9);
          col = mix(col, mix(uA, uB, 0.5) * (0.68 * uGain), smoothstep(0.60, 0.94, nn) * 0.50);

          // ── a lit pool on the right, under the arm. That side of the frame
          //    is mostly empty once the title sits on the left, and it read as
          //    dead space; this gives the robot something to stand in. ──
          vec2 gv = (base - vec2(0.46, -0.16)) * vec2(0.86, 1.0);
          float gd = length(gv);
          float pool = pow(max(0.0, 1.0 - gd * 1.25), 2.6);
          col += mix(uB, uA, 0.30) * pool * 0.26 * uGain * uReveal;
          col += uB * pow(max(0.0, 1.0 - gd * 2.2), 3.2) * 0.13 * uGain * uReveal;

          // ── light shafts from off-frame, tinted by the chapter ──
          vec2 sv = base - vec2(-0.85, 0.62);
          float sa = atan(sv.y, sv.x);
          float sd = length(sv);
          float ray = fbm3(vec2(sa * 5.0, uTime * 0.035)) ;
          float shaft = pow(max(0.0, 1.0 - sd * 0.52), 2.4) * smoothstep(0.35, 0.85, ray);
          col += uA * shaft * 0.22 * uGain;

          // ── three star layers, each parallaxing at its own depth ──
          col += vec3(stars(par(base, 0.05), 300.0, 0.9972, 1.6)) * 0.75;
          col += vec3(stars(par(base, 0.35), 190.0, 0.9980, 2.2)) * 0.9;
          col += mix(uA, vec3(1.0), 0.6) * stars(par(base, 0.8), 110.0, 0.9988, 3.0) * 1.1;

          // ── a few big motes drifting right past the lens ──
          for (int i = 0; i < 5; i++){
            float fi = float(i);
            float sp = 0.006 + hash(vec2(fi, 2.0)) * 0.012;
            vec2 dp = vec2(fract(hash(vec2(fi, 1.0)) + uTime * sp) * 2.6 - 1.3,
                           hash(vec2(fi, 3.0)) * 1.3 - 0.65);
            float d = length(par(base, 1.0) - dp);
            col += mix(uA, vec3(1.0), 0.35) * smoothstep(0.075, 0.0, d) * 0.05;
          }

          float vig = smoothstep(1.32, 0.2, length(base));
          col *= 0.48 + 0.52 * vig;
          col *= mix(0.35, 1.0, uReveal);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    scene.add(quad);

    const target = { a: new THREE.Color(CLR.violet), b: new THREE.Color(CLR.aqua), gain: 1 };
    const onChapter = (e) => {
      const [a, b, gain] = ACCENT[e.detail] || ACCENT.top;
      target.a.setHex(a);
      target.b.setHex(b);
      target.gain = gain;
    };
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const onResize = () => {
      if (window.innerWidth < 2 || window.innerHeight < 2) return;
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    };
    let opened = !!window.__portfolioOpened;
    const onOpen = () => (opened = true);
    window.addEventListener("portfolio:chapter", onChapter);
    window.addEventListener("portfolio:open", onOpen);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;
    const animate = () => {
      if (!running) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const k = 1 - Math.exp(-dt * 1.6);
      uniforms.uTime.value = clock.elapsedTime;
      uniforms.uA.value.lerp(target.a, k);
      uniforms.uB.value.lerp(target.b, k);
      uniforms.uGain.value += (target.gain - uniforms.uGain.value) * k;
      pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
      pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
      uniforms.uMouse.value.set(pointer.sx, pointer.sy);
      uniforms.uScroll.value = window.scrollY;
      uniforms.uReveal.value += ((opened ? 1 : 0) - uniforms.uReveal.value) * (1 - Math.exp(-dt * 1.6));
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("portfolio:chapter", onChapter);
      window.removeEventListener("portfolio:open", onOpen);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      quad.geometry.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true" />;
}
