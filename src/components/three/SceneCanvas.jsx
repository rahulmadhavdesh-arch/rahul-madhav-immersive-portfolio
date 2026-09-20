import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/* ============================================================
   Three instruments over a nebula.
   A — a ceramic surgical arm whose probe follows the cursor and projects a
       live holographic B-mode ultrasound image (speckle, fascia bands, a
       drifting vessel, a sweep line). The arm is servo-smooth: spring-damped
       target, low-gain CCD IK, joint rate limits.
   B — a transparent transducer array rastered by a coral laser dot.
   C — a LiDAR sweep revealing a room of points under a marker-tagged drone.
   Behind everything: a GPU fbm nebula tinted by the chapter's accent colours.
   ============================================================ */

const CLR = { aqua: 0x4be1ff, coral: 0xff6b57, violet: 0x8f7bff, lime: 0xc9ff4a, butter: 0xffd84a, ink: 0x07070c };
const SECTIONS = ["top", "about", "research", "work", "skills", "path", "teams", "beyond", "contact"];
const ACCENT = { top: [CLR.aqua, CLR.violet], about: [CLR.lime, CLR.aqua], research: [CLR.coral, CLR.butter], work: [CLR.violet, CLR.coral], skills: [CLR.lime, CLR.violet], path: [CLR.aqua, CLR.lime], teams: [CLR.butter, CLR.coral], beyond: [CLR.lime, CLR.butter], contact: [CLR.coral, CLR.aqua] };

const KEYS = [
  { scene: "A", pos: [3.5, -2.3, 0.2], scale: 1.0, yaw: -0.3, cam: [0, 0.2, 7.4], look: [0.3, 0.3, 0], mode: "cursor", reach: 2.6 },
  { scene: "A", pos: [-3.4, -2.3, -2.8], scale: 0.9, yaw: 0.9, cam: [-0.3, 0.2, 7.6], look: [0, 0.4, 0], mode: "fixed", target: [1.4, 1.7, 0.9] },
  { scene: "B", pos: [0.2, -0.9, -3.4], scale: 1, yaw: 0.35, cam: [0, 0.6, 7.6], look: [0, 0.2, 0], mode: "fixed" },
  { scene: "C", pos: [3.6, -1.7, -2.6], scale: 1, yaw: 0, cam: [0.2, 0.3, 7.5], look: [0.2, 0.3, 0], mode: "fixed" },
  { scene: "A", pos: [5.0, -2.5, -2.6], scale: 0.78, yaw: -0.5, cam: [0.2, 0.2, 7.4], look: [0.2, 0.4, 0], mode: "cursor", reach: 1.6 },
  { scene: "B", pos: [-3.8, -1.0, -3.8], scale: 0.95, yaw: -0.4, cam: [-0.2, 0.4, 7.6], look: [0, 0.3, 0], mode: "fixed" },
  { scene: "C", pos: [0.6, -2.0, -4.2], scale: 1.1, yaw: 0.3, cam: [0, 0.3, 7.8], look: [0, 0.3, 0], mode: "fixed" },
  { scene: "A", pos: [6.5, -3.9, -3.6], scale: 0.6, yaw: -0.55, cam: [0.2, 0.3, 7.5], look: [0.2, 0.4, 0], mode: "cursor", reach: 1.8 },
  { scene: "A", pos: [3.5, -2.3, -0.6], scale: 0.95, yaw: -0.3, cam: [0, 0.2, 7.4], look: [0.3, 0.4, 0], mode: "cursor", reach: 2.6 },
];

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const { clamp, lerp } = THREE.MathUtils;
const smooth = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const NOISE_GLSL = `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
`;

function radialTexture(stops) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- studio environment ----------
   Emissive softboxes baked to an env map. This is most of what reads as
   "photoreal": long specular streaks across the ceramic instead of the flat
   ambient wash a default room environment gives. */
export function buildEnvScene() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(40, 20, 14), new THREE.MeshBasicMaterial({ color: 0x05050c, side: THREE.BackSide })));
  const geo = new THREE.PlaneGeometry(1, 1);
  const panel = (w, h, pos, color, power) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power) }));
    m.scale.set(w, h, 1);
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(16, 8, [-9, 13, 5], 0xfff6ec, 8);   // key softbox, upper left
  panel(5, 16, [13, 3, -5], 0x8fe4ff, 3.4); // cool rim, right
  panel(11, 5, [-2, -7, 11], 0xffa085, 1.5); // warm bounce from below
  panel(6, 6, [5, 9, -11], 0xc0b0ff, 2.4);  // violet kicker behind
  return s;
}

/** Low-frequency value noise, upscaled smooth — micro roughness variation. */
function softNoiseTexture(size = 512, lo = 0.34, hi = 0.66, repeat = 3) {
  const small = document.createElement("canvas");
  small.width = small.height = 48;
  const gs = small.getContext("2d");
  const id = gs.createImageData(48, 48);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 255 * (lo + Math.random() * (hi - lo));
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  gs.putImageData(id, 0, 0);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(small, 0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}

export function makeMaterials() {
  const rough = softNoiseTexture(512, 0.3, 0.7, 4);
  return {
    ceramic: new THREE.MeshPhysicalMaterial({
      color: 0xeceae6, roughness: 0.28, roughnessMap: rough, metalness: 0,
      clearcoat: 0.95, clearcoatRoughness: 0.16,
      sheen: 0.6, sheenColor: new THREE.Color(0xcfc4ff), sheenRoughness: 0.5,
      envMapIntensity: 1.35,
    }),
    rubber: new THREE.MeshPhysicalMaterial({ color: 0x121320, roughness: 0.82, roughnessMap: rough, metalness: 0.02, sheen: 0.3, sheenColor: new THREE.Color(0x6a6a90), envMapIntensity: 0.5 }),
    dark: new THREE.MeshPhysicalMaterial({ color: 0x232535, roughness: 0.38, roughnessMap: rough, metalness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 1.1 }),
    status: new THREE.MeshStandardMaterial({ color: CLR.aqua, emissive: CLR.aqua, emissiveIntensity: 1.6, roughness: 0.4 }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0x20263a, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.0 }),
    // The research array needs translucency, not physically traced refraction.
    // MeshPhysicalMaterial's transmission shader linked on the first
    // About-to-Research frame and could block integrated GPUs for over a second.
    glass: new THREE.MeshStandardMaterial({ color: 0xbff0ff, roughness: 0.14, metalness: 0.08, transparent: true, opacity: 0.58, depthWrite: false, envMapIntensity: 1.15 }),
    floor: new THREE.MeshPhysicalMaterial({
      color: 0x090a12, roughness: 0.14, roughnessMap: rough, metalness: 0.75,
      clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.1,
      transparent: true, opacity: 0.5,
    }),
  };
}

/* ---------- hologram B-mode sector ---------- */
function makeHologram() {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uTint: { value: new THREE.Color(CLR.aqua) }, uOpacity: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uTint; uniform float uOpacity; varying vec2 vUv;
      ${NOISE_GLSL}
      void main(){
        vec2 p = vUv - 0.5; float r = length(p) * 2.0; float th = atan(p.x, p.y);
        float side = smoothstep(0.44, 0.38, abs(th));
        float edge = smoothstep(1.0, 0.9, r) * smoothstep(0.05, 0.16, r);
        float sp = noise(vec2(r * 140.0, th * 110.0)) * noise(vec2(r * 70.0 + uTime * 0.35, th * 50.0 - uTime * 0.1));
        float bands = pow(0.5 + 0.5 * sin(r * 30.0 + sin(th * 6.0 + uTime * 0.5) * 0.9), 7.0) * 0.9;
        vec2 v = vec2(0.14 * sin(uTime * 0.35), 0.58 + 0.08 * cos(uTime * 0.27));
        float vessel = 1.0 - smoothstep(0.06, 0.12, length(vec2((th - v.x) * 0.7, r - v.y)));
        float wall = smoothstep(0.12, 0.10, length(vec2((th - v.x) * 0.7, r - v.y))) - smoothstep(0.10, 0.08, length(vec2((th - v.x) * 0.7, r - v.y)));
        float tgc = mix(1.0, 0.4, r);
        float img = (sp * 1.1 + bands) * tgc;
        img = img * (1.0 - vessel * 0.92) + wall * 0.9;
        float sweep = smoothstep(0.025, 0.0, abs(th - sin(uTime * 1.1) * 0.38));
        vec3 col = mix(vec3(0.015, 0.015, 0.03), mix(vec3(0.95), uTint, 0.28), clamp(img, 0.0, 1.0));
        col += uTint * sweep * 0.7;
        float grid = step(0.985, fract(r * 8.0)) * 0.25 + step(0.985, fract((th + 0.44) * 6.0)) * 0.15;
        col += uTint * grid;
        gl_FragColor = vec4(col, (side * edge * 0.92 + sweep * 0.3) * uOpacity);
      }`,
  });
  const geo = new THREE.CircleGeometry(1.75, 48, Math.PI / 2 - 0.44, 0.88);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.02;
  const frame = new THREE.Mesh(new THREE.CircleGeometry(1.78, 48, Math.PI / 2 - 0.45, 0.9), new THREE.MeshBasicMaterial({ color: CLR.aqua, transparent: true, opacity: 0, wireframe: true, depthWrite: false }));
  frame.position.y = 0.02;
  return { mesh, mat, frame };
}

/* ---------- arm ---------- */
function ringLight(r, mat) { return new THREE.Mesh(new THREE.TorusGeometry(r, 0.011, 8, 72), mat); }
function housing(r, m, along = "z") {
  const g = new THREE.Group();
  const h = r * 1.5;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48), m.ceramic);
  const groove = new THREE.Mesh(new THREE.TorusGeometry(r + 0.004, r * 0.1, 10, 72), m.rubber);
  groove.rotation.x = Math.PI / 2;
  const capA = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.78, 0.02, 48), m.dark);
  capA.position.y = h / 2 + 0.005;
  const capB = capA.clone();
  capB.position.y = -h / 2 - 0.005;
  const ledA = ringLight(r * 0.6, m.status);
  ledA.rotation.x = Math.PI / 2;
  ledA.position.y = h / 2 + 0.018;
  const ledB = ledA.clone();
  ledB.position.y = -h / 2 - 0.018;
  g.add(body, groove, capA, capB, ledA, ledB);
  // Fine bearing seams give the existing illuminated joints a physical edge.
  for (const side of [-1, 1]) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(r * 0.82, 0.006, 8, 64), m.dark);
    seam.rotation.x = Math.PI / 2;
    seam.position.y = side * (h / 2 + 0.014);
    g.add(seam);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(r * 0.06, 12, 12), m.dark);
    b.position.set(Math.cos(a) * r * 0.42, h / 2 + 0.02, Math.sin(a) * r * 0.42);
    g.add(b);
  }
  if (along === "z") g.rotation.x = Math.PI / 2;
  return g;
}
function link(r, len, m) {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 28), m.ceramic);
  cap.position.y = len / 2;
  g.add(cap);
  for (const sx of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len * 0.82, 10), m.rubber);
    c.position.set(sx * r * 0.5, len / 2, r * 0.93);
    g.add(c);
  }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.006, len * 0.7, 0.028), m.status);
  strip.position.set(-r - 0.001, len / 2, 0);
  g.add(strip);
  return g;
}
export function buildArm(m) {
  const root = new THREE.Group();
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.72, 0.1, 64), m.rubber); pedestal.position.y = 0.05;
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.22, 64), m.ceramic); dome.position.y = 0.2;
  const baseRing = ringLight(0.56, m.status); baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.315;
  const column = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 6, 32), m.ceramic); column.position.y = 0.6;
  root.add(pedestal, dome, baseRing, column);
  const j1 = new THREE.Group(); j1.position.y = 1.0; root.add(j1); j1.add(housing(0.28, m, "y"));
  const j2 = new THREE.Group(); j2.position.y = 0.22; j1.add(j2); j2.add(housing(0.3, m, "z"));
  const L1 = 1.3; j2.add(link(0.16, L1 - 0.3, m));
  const j3 = new THREE.Group(); j3.position.y = L1; j2.add(j3); j3.add(housing(0.25, m, "z"));
  const L2 = 1.1; j3.add(link(0.13, L2 - 0.26, m));
  const j4 = new THREE.Group(); j4.position.y = L2; j3.add(j4); j4.add(housing(0.2, m, "z"));
  const L3 = 0.4; j4.add(link(0.1, L3 - 0.2, m));
  const j5 = new THREE.Group(); j5.position.y = L3; j4.add(j5);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.12, 40), m.dark); collar.position.y = 0.04;
  const collarLed = ringLight(0.15, m.status); collarLed.rotation.x = Math.PI / 2; collarLed.position.y = 0.1;
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.24, 6, 24), m.ceramic); handle.position.y = 0.24;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.13, 40), m.rubber); head.position.y = 0.44;
  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.09), m.lens); lens.position.y = 0.515;
  const tip = new THREE.Object3D(); tip.position.y = 0.53;
  j5.add(collar, collarLed, handle, head, lens, tip);
  // The probe's contact aperture and connector are readable in the macro pass.
  const apertureMaterial = new THREE.MeshStandardMaterial({ color: 0x9fb2bd, metalness: 0.72, roughness: 0.18 });
  for (let n = 0; n < 20; n++) {
    const element = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.003, 0.072), apertureMaterial);
    element.position.set((n - 9.5) * 0.011, 0.534, 0); j5.add(element);
  }
  for (let n = 0; n < 5; n++) {
    const seal = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.0035, 6, 32), m.rubber);
    seal.rotation.x = Math.PI / 2; seal.position.y = 0.16 + n * 0.02; j5.add(seal);
  }
  return { root, j1, j2, j3, j4, j5, tip };
}

/* ---------- transducer array (B) ---------- */
function buildArray(m) {
  const g = new THREE.Group();
  const N = 9, S = 0.24;
  const tiles = [];
  const layers = [];
  const geo = new THREE.BoxGeometry(0.2, 0.035, 0.2);
  const tileMesh = new THREE.InstancedMesh(geo, m.glass, N * N);
  const tileDummy = new THREE.Object3D();
  let tileIndex = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const base = V((i - (N - 1) / 2) * S, 0, (j - (N - 1) / 2) * S);
    tileDummy.position.copy(base);
    tileDummy.updateMatrix();
    tileMesh.setMatrixAt(tileIndex++, tileDummy.matrix);
    tiles.push(base);
  }
  tileMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  g.add(tileMesh);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(N * S * 0.72, 0.035, 12, 96), m.dark);
  frame.rotation.x = Math.PI / 2; frame.position.y = -0.03;
  const frameLed = ringLight(N * S * 0.72 + 0.05, m.status); frameLed.rotation.x = Math.PI / 2;
  // Optical layers separate as the research chapter advances. Concept geometry,
  // not a claim about the construction of a specific fabricated device.
  for (let n = 0; n < 3; n++) {
    const layer = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.035, 2.28), n === 2 ? m.dark : m.glass);
    layer.add(plate);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(plate.geometry), new THREE.LineBasicMaterial({ color: CLR.aqua, transparent: true, opacity: 0.28 }));
    layer.add(outline);
    layer.position.y = -0.14 - n * 0.12;
    layers.push(layer); g.add(layer);
  }
  const contactMaterial = new THREE.MeshStandardMaterial({ color: 0xb7a37b, metalness: 0.85, roughness: 0.27 });
  const contactGeo = new THREE.BoxGeometry(0.035, 0.01, 0.19);
  const contacts = new THREE.InstancedMesh(contactGeo, contactMaterial, 36);
  const contactDummy = new THREE.Object3D();
  let contactIndex = 0;
  for (let n = 0; n < 18; n++) {
    for (const side of [-1, 1]) {
      contactDummy.position.set((n - 8.5) * 0.115, 0.023, side * 1.01);
      contactDummy.updateMatrix();
      contacts.setMatrixAt(contactIndex++, contactDummy.matrix);
    }
  }
  layers[2].add(contacts);
  const laser = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshBasicMaterial({ color: CLR.coral }));
  const laserLight = new THREE.PointLight(CLR.coral, 3, 3);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 3, 6), new THREE.MeshBasicMaterial({ color: CLR.coral, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  beam.position.y = 1.5;
  laser.add(beam);
  g.add(frame, frameLed, laser, laserLight);
  g.rotation.x = 0.35;
  const focusLines = new THREE.Group(); g.add(focusLines);
  const acousticMaterial = new THREE.LineBasicMaterial({ color: CLR.aqua, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let n = 0; n < 16; n++) {
    const angle = n * Math.PI * 2 / 16;
    const curve = new THREE.QuadraticBezierCurve3(V(Math.cos(angle), 0, Math.sin(angle)), V(Math.cos(angle) * 0.55, -0.9, Math.sin(angle) * 0.55), V(0, -1.8, 0));
    focusLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)), acousticMaterial));
  }
  const echoes = Array.from({ length: 4 }, () => {
    const echo = new THREE.Mesh(new THREE.TorusGeometry(1, 0.009, 6, 80), new THREE.MeshBasicMaterial({ color: CLR.aqua, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    echo.rotation.x = Math.PI / 2; g.add(echo); return echo;
  });
  return { group: g, tiles, tileMesh, tileDummy, laser, laserLight, layers, echoes, focusLines, acousticMaterial };
}

/* ---------- lidar + drone (C) ---------- */
function buildLidar(m, tex) {
  const g = new THREE.Group();
  const N = 1800;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), ang = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    let r = 2.4 + 0.5 * Math.sin(a * 3) + 0.25 * Math.cos(a * 7);
    if (a > 0.7 && a < 1.3) r -= 1.0;
    if (a > 3.5 && a < 4.3) r -= 1.3;
    if (a > 5.2 && a < 5.5) r -= 0.7;
    r += (Math.random() - 0.5) * 0.08;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - 0.35) * 1.3; pos[i * 3 + 2] = Math.sin(a) * r;
    ang[i] = a;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.012), new THREE.MeshBasicMaterial({ color: CLR.lime, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  sweep.rotation.x = -Math.PI / 2;
  sweep.geometry.translate(1.6, 0, 0);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 32), m.dark);
  const hubLed = ringLight(0.13, m.status); hubLed.rotation.x = Math.PI / 2; hubLed.position.y = 0.06;
  g.add(pts, sweep, hub, hubLed);
  const drone = new THREE.Group();
  drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.26), m.dark));
  const rotors = [];
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 8), m.ceramic);
    arm.rotation.z = Math.PI / 2; arm.rotation.y = Math.atan2(sz, sx); arm.position.set(sx * 0.14, 0, sz * 0.14);
    const ring = ringLight(0.11, m.status); ring.rotation.x = Math.PI / 2; ring.position.set(sx * 0.27, 0.03, sz * 0.27);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.004, 0.02), m.rubber); blade.position.copy(ring.position);
    drone.add(arm, ring, blade);
    rotors.push(blade);
  });
  const markerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2, roughness: 0.3 });
  [[0, 0.16, 0], [0.12, 0.11, 0.08], [-0.1, 0.13, -0.06]].forEach((p) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, p[1], 6), m.rubber); post.position.set(p[0], p[1] / 2, p[2]);
    const mk = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), markerMat); mk.position.set(p[0], p[1], p[2]);
    drone.add(post, mk);
  });
  drone.position.y = 1.0;
  g.add(drone);
  return { group: g, pts, sweep, drone, rotors, ang, col, N };
}

function makePoints(count, box, size, opacity, color, tex) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = lerp(box[0][0], box[0][1], Math.random());
    pos[i * 3 + 1] = lerp(box[1][0], box[1][1], Math.random());
    pos[i * 3 + 2] = lerp(box[2][0], box[2][1], Math.random());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ size, color, map: tex, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
}

export default function SceneCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(0, 0.2, 7.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // This canvas already has real geometry, lighting, reflections, and a shader
    // backdrop. Rendering it above 1.25× DPR made every frame substantially more
    // expensive, especially on integrated graphics, for detail that is not visible
    // at normal viewing distance.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearAlpha(0);
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentScene = buildEnvScene();
    const environmentTarget = pmrem.fromScene(environmentScene, 0.015);
    scene.environment = environmentTarget.texture;
    environmentScene.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    const mats = makeMaterials();
    if (process.env.NODE_ENV !== "production") window.__scene = { renderer, mats };
    const softTex = radialTexture([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.5)"], [1, "rgba(255,255,255,0)"]]);

    /* ---- scene A ---- */
    const arm = buildArm(mats);
    const A = new THREE.Group();
    A.add(arm.root);

    // Glossy floor + a genuine mirrored copy of the arm. Cheaper and more
    // stable than a render-target reflector, and it grounds the arm — without
    // it the whole thing reads as a sticker floating on the background.
    const floor = new THREE.Mesh(new THREE.CircleGeometry(4.6, 64), mats.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.001;
    const floorFade = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 64),
      new THREE.MeshBasicMaterial({ map: softTex, color: CLR.ink, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.NormalBlending }),
    );
    floorFade.rotation.x = -Math.PI / 2;
    floorFade.position.y = 0.004;
    floorFade.material.map = radialTexture([[0, "rgba(0,0,0,0)"], [0.55, "rgba(0,0,0,0.25)"], [1, "rgba(0,0,0,1)"]]);
    arm.root.add(floor, floorFade);

    const mirrorMats = {
      ceramic: mats.ceramic.clone(), rubber: mats.rubber.clone(), dark: mats.dark.clone(),
      status: mats.status, lens: mats.lens.clone(), glass: mats.glass.clone(),
    };
    // a real reflection dies off with depth; clip it a short way under the
    // floor rather than letting a full upside-down arm hang in space
    const mirrorClip = new THREE.Plane(V(0, 1, 0), 0);
    Object.values(mirrorMats).forEach((m) => {
      if (m === mats.status) return;
      m.side = THREE.DoubleSide;
      m.transparent = true;
      m.opacity = 0.22;
      m.depthWrite = false;
      m.clippingPlanes = [mirrorClip];
    });
    const armMirror = buildArm(mirrorMats);
    armMirror.root.scale.y = -1;
    armMirror.root.position.y = -0.004;
    arm.root.add(armMirror.root);
    const mirrorJoints = [
      [arm.j1, armMirror.j1], [arm.j2, armMirror.j2], [arm.j3, armMirror.j3],
      [arm.j4, armMirror.j4], [arm.j5, armMirror.j5],
    ];

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshBasicMaterial({ map: softTex, color: 0x000000, transparent: true, opacity: 0.7, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.006;
    arm.root.add(shadow);

    scene.add(A);
    const holo = makeHologram();
    arm.tip.add(holo.mesh, holo.frame);

    const joints = [
      { obj: arm.j1, axis: V(0, 1, 0), prop: "y", min: -0.6, max: 0.6, w: 0.4 },
      { obj: arm.j2, axis: V(0, 0, 1), prop: "z", min: -1.4, max: 1.4, w: 1 },
      { obj: arm.j3, axis: V(0, 0, 1), prop: "z", min: -2.4, max: 2.4, w: 0.85 },
      { obj: arm.j4, axis: V(0, 0, 1), prop: "z", min: -1.6, max: 1.6, w: 0.55 },
    ];
    arm.j2.rotation.z = 1.1; arm.j3.rotation.z = -2.2; arm.j4.rotation.z = 1.0;
    const prevRot = joints.map((J) => J.obj.rotation[J.prop]);

    const tE = V(), tJ = V(), tA = V(), tB = V(), tC = V(), axisW = V();
    const q = new THREE.Quaternion();
    const solveIK = (target, gain) => {
      for (let it = 0; it < 8; it++) {
        for (let i = joints.length - 1; i >= 0; i--) {
          const J = joints[i];
          arm.tip.getWorldPosition(tE);
          J.obj.getWorldPosition(tJ);
          J.obj.getWorldQuaternion(q);
          axisW.copy(J.axis).applyQuaternion(q).normalize();
          tA.subVectors(tE, tJ);
          tB.subVectors(target, tJ);
          tA.addScaledVector(axisW, -tA.dot(axisW));
          tB.addScaledVector(axisW, -tB.dot(axisW));
          if (tA.lengthSq() < 1e-5 || tB.lengthSq() < 1e-5) continue;
          tA.normalize(); tB.normalize();
          tC.crossVectors(tA, tB);
          const ang = Math.atan2(tC.dot(axisW), tA.dot(tB)) * gain * J.w;
          J.obj.rotation[J.prop] = clamp(J.obj.rotation[J.prop] + ang, J.min, J.max);
        }
      }
    };
    const posTarget = V(), tipDirV = V();
    const aimWrist = (target, gain) => {
      const J = joints[3];
      arm.tip.getWorldQuaternion(q);
      tipDirV.set(0, 1, 0).applyQuaternion(q);
      J.obj.getWorldPosition(tJ);
      J.obj.getWorldQuaternion(q);
      axisW.copy(J.axis).applyQuaternion(q).normalize();
      tA.copy(tipDirV);
      tB.subVectors(target, tJ);
      tA.addScaledVector(axisW, -tA.dot(axisW));
      tB.addScaledVector(axisW, -tB.dot(axisW));
      if (tA.lengthSq() < 1e-5 || tB.lengthSq() < 1e-5) return;
      tA.normalize(); tB.normalize();
      tC.crossVectors(tA, tB);
      const ang = Math.atan2(tC.dot(axisW), tA.dot(tB)) * gain * 1.6;
      J.obj.rotation.z = clamp(J.obj.rotation.z + ang, J.min, J.max);
    };
    // servo feel: cap angular velocity per joint
    const rateLimit = (dt) => {
      const maxStep = 3.2 * dt;
      joints.forEach((J, i) => {
        const cur = J.obj.rotation[J.prop];
        const d = clamp(cur - prevRot[i], -maxStep, maxStep);
        prevRot[i] += d;
        J.obj.rotation[J.prop] = prevRot[i];
      });
    };

    /* ---- scene B / C ---- */
    const B = buildArray(mats); scene.add(B.group);
    const C = buildLidar(mats, softTex); scene.add(C.group);
    const scenes = { A: { g: A, mix: 1 }, B: { g: B.group, mix: 0 }, C: { g: C.group, mix: 0 } };
    const goals = { A: { pos: V(...KEYS[0].pos), scale: KEYS[0].scale, yaw: KEYS[0].yaw }, B: { pos: V(...KEYS[2].pos), scale: 1, yaw: KEYS[2].yaw }, C: { pos: V(...KEYS[3].pos), scale: 1, yaw: 0 } };
    const curs = { A: { pos: goals.A.pos.clone(), scale: 1, yaw: goals.A.yaw }, B: { pos: goals.B.pos.clone(), scale: 1, yaw: goals.B.yaw }, C: { pos: goals.C.pos.clone(), scale: 1, yaw: 0 } };

    /* ---- rings ---- */
    const ringGeo = new THREE.TorusGeometry(1, 0.004, 8, 96);
    const rings = Array.from({ length: 8 }, () => {
      const mesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: CLR.aqua, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      mesh.visible = false; scene.add(mesh);
      return { mesh, life: 1 };
    });
    const Z = V(0, 0, 1);
    const spawnRing = (pos, dir, color) => {
      const r = rings.find((x) => x.life >= 1) || rings[0];
      r.life = 0; r.mesh.visible = true; r.mesh.position.copy(pos);
      r.mesh.quaternion.setFromUnitVectors(Z, dir);
      r.mesh.material.color.setHex(color);
    };

    /* ---- pulse packet ---- */
    const packet = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), new THREE.MeshBasicMaterial({ color: CLR.coral }));
    packet.visible = false;
    const packetLight = new THREE.PointLight(CLR.coral, 0, 3.5);
    scene.add(packet, packetLight);
    const pathNodes = [arm.j1, arm.j2, arm.j3, arm.j4, arm.tip];
    const pathPts = pathNodes.map(() => V());
    const pulse = { active: false, t: 0, fired: false, source: "" };
    let pulses = 0, statusMix = 0;
    const coralC = new THREE.Color(CLR.coral), accentC = new THREE.Color(CLR.aqua), accent2C = new THREE.Color(CLR.violet), tmpC = new THREE.Color();
    const emitPulse = (source) => { if (pulse.active) return; pulse.active = true; pulse.t = 0; pulse.fired = false; pulse.source = source; };

    /* ---- depth layers: far dust → mid dust → near defocused motes ---- */
    const speckle = makePoints(1600, [[-15, 15], [-11, 11], [-22, -4]], 0.05, 0.45, 0xc9d2ff, softTex);
    const bokeh = makePoints(70, [[-7, 7], [-5, 5], [1.5, 4.2]], 0.24, 0.26, 0xffffff, softTex);
    // right in front of the lens: big, heavily defocused motes
    const foreBokeh = makePoints(22, [[-6, 6], [-4, 4], [5.2, 6.4]], 0.75, 0.16, 0xffffff, softTex);
    scene.add(speckle, bokeh, foreBokeh);


    /* ---- lights ---- */
    const key = new THREE.SpotLight(0xfff3e6, 0, 40, 0.5, 0.6); key.position.set(-3, 8, 6); key.target.position.set(0.5, 0.5, 0);
    const rim = new THREE.SpotLight(CLR.aqua, 0, 30, 0.7, 0.8); rim.position.set(5, 3, -4); rim.target.position.set(0, 1, 0);
    const fill = new THREE.PointLight(CLR.coral, 0, 20); fill.position.set(-5, -2, 3);
    const hemi = new THREE.HemisphereLight(0x9aa0ff, 0x1a0a10, 0.35);
    scene.add(key, key.target, rim, rim.target, fill, hemi);

    // B and C first become visible at the research and work boundaries. Force
    // their synchronous WebGL setup while the loader still covers the page so
    // those boundaries never have to compile a program mid-scroll.
    const bInitiallyVisible = B.group.visible;
    const cInitiallyVisible = C.group.visible;
    B.group.visible = true;
    C.group.visible = true;
    let shadersReady = false;
    const finishShaderWarmup = () => {
      // compileAsync can report completion before a driver has linked every
      // program variant used by a newly visible group. Render each instrument
      // once into a tiny target so the driver finishes that work under Loader.
      const previous = [A.visible, B.group.visible, C.group.visible];
      const warmTarget = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: true, stencilBuffer: false });
      try {
        renderer.setRenderTarget(warmTarget);
        [A, B.group, C.group].forEach((group, index) => {
          A.visible = index === 0;
          B.group.visible = index === 1;
          C.group.visible = index === 2;
          renderer.render(scene, camera);
        });
        // WebGL may queue buffer uploads/program linking and return before the
        // driver finishes. Flush that one-time work now so the first visible
        // research frame cannot become the synchronization point.
        renderer.getContext().finish();
      } catch {
        // A failed warm-up must not strand visitors behind the loader.
      } finally {
        renderer.setRenderTarget(null);
        A.visible = previous[0];
        B.group.visible = previous[1];
        C.group.visible = previous[2];
        warmTarget.dispose();
        shadersReady = true;
      }
    };
    try {
      renderer.compile(scene, camera);
      finishShaderWarmup();
    } catch {
      finishShaderWarmup();
    }
    B.group.visible = bInitiallyVisible;
    C.group.visible = cInitiallyVisible;

    /* ---- input / sections ---- */
    const pointer = { x: 0, y: 0, sx: 0, sy: 0, seen: false, last: 0 };
    const onMove = (e) => { pointer.x = (e.clientX / window.innerWidth) * 2 - 1; pointer.y = -(e.clientY / window.innerHeight) * 2 + 1; pointer.seen = true; pointer.last = performance.now(); };
    const onDown = (e) => { if (e.target.closest?.("a, button, input, textarea, select, [role='button'], [data-hover]")) return; emitPulse("click"); };
    const onEmit = () => emitPulse("ui");
    // Seed from the latch: if the loader already opened the page before this
    // effect ran, the event is long gone and reveal would stay pinned at 0,
    // which renders the whole scene black.
    let opened = !!window.__portfolioOpened, openAt = 0;
    const onOpen = () => { if (opened) return; opened = true; openAt = clock.elapsedTime; };
    let tops = [];
    const measure = () => { tops = SECTIONS.map((id) => { const el = document.getElementById(id); return el ? el.getBoundingClientRect().top + window.scrollY : 0; }); };
    const onResize = () => {
      if (window.innerWidth < 2 || window.innerHeight < 2) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      measure();
    };
    measure();
    // Recompute chapter positions only when the document geometry changes.
    // The old two-second timer forced nine layout reads at arbitrary points in
    // a scroll gesture, producing a small but visible catch at section edges.
    let measureFrame = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(measureFrame);
      measureFrame = requestAnimationFrame(measure);
    };
    const layoutObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
    if (layoutObserver) layoutObserver.observe(document.documentElement);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("portfolio:emit", onEmit);
    window.addEventListener("portfolio:open", onOpen);
    window.addEventListener("resize", onResize);

    const cam = { pos: V(...KEYS[0].cam), look: V(...KEYS[0].look) };
    const goalCam = { pos: V(), look: V() };
    const macroTip = V(), macroCamera = V(), macroLook = V();
    const ikTarget = V(-0.5, 0.9, 1.4), ikGoal = V(), localT = V(), tipWorld = V(), tipDir = V(), tmp = V();
    const beamMid = V(), beamTip = V();
    // Screen-space beam, published every frame for the hero name to read.
    const armOut = (window.__arm = { bx: -9999, by: -9999, br: 200, imaging: false, overName: false });
    let nameRect = null;
    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(V(0, 0, 1), 0);
    const ndc = new THREE.Vector2();
    let lastSection = 0, idleTimer = 0, introFired = false, stateTimer = 0, running = true, raf = 0, readyFired = false;
    // Returning from a chapter with a different scene must never hand the arm
    // a stale IK pose.  Track ownership so its first frame back is predictable.
    let armWasActive = true, armRecoverUntil = 0;
    const clock = new THREE.Clock();

    const sectionFloat = () => {
      const y = window.scrollY + window.innerHeight * 0.4;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        if (y >= tops[i]) {
          if (i === SECTIONS.length - 1) return i;
          const span = Math.max(1, tops[i + 1] - tops[i]);
          return i + clamp((y - tops[i]) / span, 0, 1);
        }
      }
      return 0;
    };

    const animate = () => {
      if (!running) return;
      if (window.__scene?.paused) { raf = requestAnimationFrame(animate); return; }
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const mobile = window.innerWidth < 768;
      const heroProgress = clamp(window.scrollY / Math.max(1, tops[1] - window.innerHeight), 0, 1);
      const macro = reducedMotion.matches ? 0 : smooth(0.18, 0.48, heroProgress) * (1 - smooth(0.76, 1, heroProgress));
      const reveal = opened ? smooth(openAt, openAt + 1.4, t) : 0;
      const kq = 1 - Math.exp(-dt * 3);
      pointer.sx = lerp(pointer.sx, pointer.x, 1 - Math.exp(-dt * 7));
      pointer.sy = lerp(pointer.sy, pointer.y, 1 - Math.exp(-dt * 7));

      const s = sectionFloat();
      const i = Math.min(Math.floor(s), KEYS.length - 1);
      const j = Math.min(i + 1, KEYS.length - 1);
      const f = smooth(0.15, 0.85, s - i);
      const sec = Math.round(s);
      const near = KEYS[sec];
      const secId = SECTIONS[sec];
      const [acc, acc2] = ACCENT[secId] || ACCENT.top;
      accentC.lerp(tmpC.setHex(acc), 1 - Math.exp(-dt * 1.6));
      accent2C.lerp(tmpC.setHex(acc2), 1 - Math.exp(-dt * 1.6));

      const KA = KEYS[i], KB = KEYS[j];
      goalCam.pos.set(lerp(KA.cam[0], KB.cam[0], f), lerp(KA.cam[1], KB.cam[1], f), lerp(KA.cam[2], KB.cam[2], f));
      goalCam.look.set(lerp(KA.look[0], KB.look[0], f), lerp(KA.look[1], KB.look[1], f), lerp(KA.look[2], KB.look[2], f));
      if (mobile) { goalCam.pos.z += 1.6; goalCam.look.y += 1.5; }
      goalCam.pos.x += pointer.sx * 0.35 * reveal;
      goalCam.pos.y += pointer.sy * 0.25 * reveal;
      if (macro > 0.001) {
        arm.tip.getWorldPosition(macroTip);
        macroLook.copy(macroTip).add(mobile ? V(0, -0.42, 0) : V(-0.55, 0.08, 0));
        macroCamera.copy(macroTip).add(mobile ? V(0.7, 0.8, 3.5) : V(1.05, 0.65, 2.45));
        goalCam.pos.lerp(macroCamera, macro);
        goalCam.look.lerp(macroLook, macro);
      }
      cam.pos.lerp(goalCam.pos, 1 - Math.exp(-dt * 2.5));
      cam.look.lerp(goalCam.look, 1 - Math.exp(-dt * 2.5));
      camera.position.copy(cam.pos);
      camera.lookAt(cam.look);

      Object.keys(scenes).forEach((k) => {
        const S = scenes[k];
        const active = near.scene === k;
        S.mix = lerp(S.mix, active ? 1 : 0, kq);
        if (active) {
          goals[k].pos.set(...near.pos); goals[k].scale = near.scale; goals[k].yaw = near.yaw;
          // on phones the copy is bottom-aligned, so the instrument moves into
          // the empty upper half instead of sitting on top of the text
          if (mobile) {
            // On a portrait screen the arm should frame the hero, not sit over
            // the name. Keep it compact and off to the upper-right, where the
            // rest of the hero intentionally has breathing room.
            goals[k].pos.x = k === "A" ? 1.4 : goals[k].pos.x * 0.22;
            goals[k].pos.y += 5.4;
            goals[k].scale *= k === "A" ? 0.34 : 0.44;
          }
          if (k === 'A' && macro > 0.05) {
            goals[k].pos.lerp(V(3.5, -2.3, 0.2), macro);
            goals[k].scale = lerp(goals[k].scale, 1, macro);
          }
          if (k === 'B' && secId === 'research' && !mobile) {
            goals[k].pos.set(3.35, 1.6, -0.8);
            goals[k].scale = 0.9;
          }
        }
        curs[k].pos.lerp(goals[k].pos, kq);
        curs[k].scale = lerp(curs[k].scale, goals[k].scale, kq);
        curs[k].yaw = lerp(curs[k].yaw, goals[k].yaw, kq);
        const e = easeOut(S.mix);
        S.g.visible = S.mix > 0.02;
        S.g.position.copy(curs[k].pos);
        S.g.position.y -= (1 - e) * 1.6;
        S.g.scale.setScalar(Math.max(0.001, curs[k].scale * (0.6 + 0.4 * e)) * (reveal > 0 ? 1 : 0.001));
        S.g.rotation.y = curs[k].yaw + (1 - e) * 0.6;
      });

      if (sec !== lastSection && opened && t > openAt + 2.6) { lastSection = sec; emitPulse("section"); }
      idleTimer += dt;
      if (idleTimer > 7 && opened) { idleTimer = 0; emitPulse("idle"); }

      /* ---- scene A: IK ---- */
      const recent = performance.now() - pointer.last < 4000;
      const mode = macro > 0.05 || reducedMotion.matches ? "fixed" : near.mode === "cursor" && !(pointer.seen && recent) ? "sweep" : near.mode;
      if (mode === "cursor") {
        plane.constant = -(A.position.z + 0.9);
        // The probe tracks the pointer everywhere. It used to freeze on a stored
        // point whenever the pointer entered the title's box, which with a
        // three-word name covers most of the hero — the arm read as drifting on
        // its own instead of following. The beam already fades itself over the
        // letters (see `overName` below), so the title needs no second guard.
        ndc.set(pointer.sx, pointer.sy);
        ray.setFromCamera(ndc, camera);
        if (!ray.ray.intersectPlane(plane, ikGoal)) ikGoal.set(0, 1.5, 1);
      } else if (mode === "sweep") {
        localT.set(-1.4 + Math.sin(t * 0.35) * 1.8, 1.8 + Math.sin(t * 0.23) * 0.6, 1.4);
        A.localToWorld(ikGoal.copy(localT));
      } else {
        localT.set(...(macro > 0.05 ? [-0.8, 2.0, 1.1] : near.target || [1.4, 1.7, 0.9]));
        A.localToWorld(ikGoal.copy(localT));
      }
      ikTarget.lerp(ikGoal, 1 - Math.exp(-dt * 5));
      arm.j2.getWorldPosition(tJ);
      tA.subVectors(ikTarget, tJ);
      const reach = (near.reach || 2.4) * curs.A.scale;
      const dist = clamp(tA.length() - 0.9 * curs.A.scale, 0.6, reach);
      posTarget.copy(tJ).addScaledVector(tA.normalize(), dist);

      const it = opened ? t - openAt : -1;
      const armOwnsScene = opened && it >= 1.9 && near.scene === "A" && scenes.A.mix >= 0.7;
      const home = [0, 0.35, -1.1, 0.25];
      if (armOwnsScene && !armWasActive) {
        // Snap to a deliberately open neutral pose before resuming IK.  This
        // prevents a hidden, folded pose from fighting the cursor on re-entry.
        joints.forEach((J, n) => {
          J.obj.rotation[J.prop] = home[n];
          prevRot[n] = home[n];
        });
        arm.j5.rotation.y = 0;
        ikTarget.copy(ikGoal);
        armRecoverUntil = t + 0.32;
      }
      if (!opened || it < 1.9) {
        // Let the lightweight arrival pose finish before the iterative pointer
        // solver takes over. Starting both together was the last small hitch in
        // the landing motion on integrated GPUs.
        const u = easeOut(Math.max(0, it) / 1.9);
        arm.j1.rotation.y = Math.sin(Math.max(0, it) * 3.2) * 0.5 * (1 - u);
        arm.j2.rotation.z = lerp(1.1, 0.35, u);
        arm.j3.rotation.z = lerp(-2.2, -1.1, u);
        arm.j4.rotation.z = lerp(1.0, 0.25, u);
        joints.forEach((J, n) => (prevRot[n] = J.obj.rotation[J.prop]));
      } else if (!armOwnsScene || t < armRecoverUntil) {
        // Keep the arm in a known, open pose while another chapter owns the
        // canvas. Previously the IK solver continued chasing an off-screen
        // target; returning to the hero could expose that folded pose before
        // the solver recovered.
        const k = 1 - Math.exp(-dt * 8);
        joints.forEach((J, n) => {
          J.obj.rotation[J.prop] = lerp(J.obj.rotation[J.prop], home[n], k);
          prevRot[n] = J.obj.rotation[J.prop];
        });
      } else {
        const g = 0.46 * smooth(1.9, 3.0, it);
        solveIK(posTarget, g);
        aimWrist(ikTarget, g);
        rateLimit(dt);
      }
      armWasActive = armOwnsScene;
      const armActive = armOwnsScene;
      arm.j5.rotation.y = lerp(arm.j5.rotation.y, Math.sin(t * 0.4) * 0.15 + (armActive && mode === "cursor" ? pointer.sx * 0.35 : 0), 1 - Math.exp(-dt * 3));
      for (let m = 0; m < mirrorJoints.length; m++) mirrorJoints[m][1].rotation.copy(mirrorJoints[m][0].rotation);
      arm.root.getWorldPosition(tmp);
      mirrorClip.constant = -(tmp.y - 1.25 * curs.A.scale);
      // the reflection is a desktop-scale detail; on phones it just lands on the copy
      armMirror.root.visible = !mobile;
      if (!introFired && opened && it >= 1.9) { introFired = true; emitPulse("intro"); window.dispatchEvent(new CustomEvent("portfolio:intro-complete")); }

      arm.tip.getWorldPosition(tipWorld);
      arm.tip.getWorldQuaternion(q);
      tipDir.set(0, 1, 0).applyQuaternion(q).normalize();

      /* hologram: on while imaging (cursor mode, arm active) */
      const imaging = mode === "cursor" && scenes.A.mix > 0.6 && it > 2.2;

      /* project the beam to screen; when it sweeps across the name the fan
         hands its energy to the letters instead of covering them */
      beamMid.copy(tipWorld).addScaledVector(tipDir, 0.95).project(camera);
      beamTip.copy(tipWorld).project(camera);
      const halfW = window.innerWidth / 2, halfH = window.innerHeight / 2;
      const bx = (beamMid.x + 1) * halfW, by = (1 - beamMid.y) * halfH;
      const tx = (beamTip.x + 1) * halfW, ty = (1 - beamTip.y) * halfH;
      const br = Math.max(90, Math.hypot(bx - tx, by - ty) * 1.7);
      if (window.scrollY < window.innerHeight * 2) {
        const el = document.getElementById("hero-name");
        nameRect = el ? el.getBoundingClientRect() : null;
      }
      const pad = br * 0.35;
      const overName = !!nameRect && imaging &&
        bx > nameRect.left - pad && bx < nameRect.right + pad &&
        by > nameRect.top - pad && by < nameRect.bottom + pad;
      armOut.bx = bx; armOut.by = by; armOut.br = br;
      armOut.imaging = imaging; armOut.overName = overName;

      holo.mat.uniforms.uTime.value = t;
      holo.mat.uniforms.uTint.value.copy(accentC);
      const holoTarget = imaging ? (overName ? 0.05 : 0.85) : 0;
      holo.mat.uniforms.uOpacity.value = lerp(holo.mat.uniforms.uOpacity.value, holoTarget, 1 - Math.exp(-dt * 5));
      holo.frame.material.color.copy(accentC);
      holo.frame.material.opacity = holo.mat.uniforms.uOpacity.value * 0.12;

      /* ---- scene B ---- */
      if (scenes.B.mix > 0.02) {
        const chapterProgress = clamp((window.scrollY - tops[2]) / Math.max(1, tops[3] - tops[2]), 0, 1);
        const separation = smooth(0.02, 0.4, chapterProgress);
        B.layers.forEach((layer, n) => {
          layer.position.y = lerp(layer.position.y, -0.14 - n * (0.12 + separation * 0.24), kq);
        });
        B.acousticMaterial.color.copy(accentC);
        B.focusLines.rotation.y = reducedMotion.matches ? 0 : t * 0.08;
        B.echoes.forEach((echo, n) => {
          const phase = reducedMotion.matches ? n / 4 : (t * 0.32 + n / 4) % 1;
          echo.position.y = -1.8 + phase * 1.6;
          echo.scale.setScalar(0.06 + phase * 1.12);
          echo.material.color.copy(accentC);
          echo.material.opacity = Math.sin(phase * Math.PI) * 0.24;
        });
        B.laser.position.set(Math.sin(t * 0.9) * 0.85, 0.08, Math.sin(t * 0.37 + 1) * 0.85);
        B.laserLight.position.copy(B.laser.position).setY(0.4);
        B.tiles.forEach((base, n) => {
          const d = base.distanceTo(B.laser.position);
          const h = 0.16 * Math.exp(-d * 2.2) * Math.sin(d * 16 - t * 9) + 0.03 * Math.sin(t * 1.3 + base.x * 3);
          B.tileDummy.position.set(base.x, h, base.z);
          B.tileDummy.rotation.set(h * 1.2, 0, -h * 0.8);
          B.tileDummy.updateMatrix();
          B.tileMesh.setMatrixAt(n, B.tileDummy.matrix);
        });
        B.tileMesh.instanceMatrix.needsUpdate = true;
      }

      /* ---- scene C ---- */
      if (scenes.C.mix > 0.02) {
        const sa = (t * 1.1) % (Math.PI * 2);
        C.sweep.rotation.z = -sa;
        const col = C.col;
        for (let n = 0; n < C.N; n++) {
          let age = sa - C.ang[n];
          if (age < 0) age += Math.PI * 2;
          const b = 0.08 + Math.exp(-age * 1.1) * 0.95;
          col[n * 3] = accentC.r * b; col[n * 3 + 1] = accentC.g * b; col[n * 3 + 2] = accentC.b * b;
        }
        C.pts.geometry.attributes.color.needsUpdate = true;
        C.drone.position.set(Math.sin(t * 0.5) * 0.5, 1.0 + Math.sin(t * 1.4) * 0.08, Math.cos(t * 0.4) * 0.4);
        C.drone.rotation.z = lerp(C.drone.rotation.z, -pointer.sx * 0.25, 0.05);
        C.drone.rotation.x = lerp(C.drone.rotation.x, pointer.sy * 0.2, 0.05);
        C.rotors.forEach((r, n) => (r.rotation.y += dt * (28 + n)));
      }

      /* ---- pulse ---- */
      if (pulse.active) {
        pulse.t += dt / 0.55;
        const viaArm = scenes.A.mix > 0.5;
        if (viaArm) {
          pathNodes.forEach((o, n) => o.getWorldPosition(pathPts[n]));
          const u = clamp(pulse.t, 0, 1) * (pathNodes.length - 1);
          const n = Math.min(Math.floor(u), pathNodes.length - 2);
          packet.position.lerpVectors(pathPts[n], pathPts[n + 1], u - n);
          packet.visible = pulse.t < 1;
          packetLight.position.copy(packet.position);
          packetLight.intensity = pulse.t < 1 ? 3 : 0;
        }
        if (pulse.t >= 1 && !pulse.fired) {
          pulse.fired = true;
          pulses++;
          const origin = viaArm ? tipWorld : scenes.B.mix > 0.5 ? B.laser.getWorldPosition(tmp) : C.drone.getWorldPosition(tmp);
          spawnRing(origin, viaArm ? tipDir : V(0, 1, 0), accentC.getHex());
          const p = origin.clone().project(camera);
          window.dispatchEvent(new CustomEvent("portfolio:pulse", { detail: { x: ((p.x + 1) / 2) * window.innerWidth, y: ((1 - p.y) / 2) * window.innerHeight, source: pulse.source, tint: `#${accentC.getHexString()}` } }));
        }
        if (pulse.t > 1.8) { pulse.active = false; packet.visible = false; packetLight.intensity = 0; }
      }
      statusMix = lerp(statusMix, pulse.active && pulse.t < 1.2 ? 1 : 0, 1 - Math.exp(-dt * 6));
      mats.status.emissive.copy(accentC).lerp(coralC, statusMix);
      mats.status.color.copy(mats.status.emissive);
      mats.status.emissiveIntensity = 1.6 + statusMix * 1.6;
      rim.color.copy(accentC);
      rings.forEach((r) => {
        if (r.life >= 1) return;
        r.life += dt / 1.7;
        const e = easeOut(r.life);
        r.mesh.scale.setScalar(0.06 + e * 0.9);
        r.mesh.material.opacity = Math.pow(1 - r.life, 2.2) * 0.4;
        if (r.life >= 1) r.mesh.visible = false;
      });

      /* ---- dust ---- */
      const sy = window.scrollY;
      speckle.rotation.y = t * 0.01;
      speckle.position.y = sy * 0.0009;
      speckle.position.x = pointer.sx * 0.3;
      bokeh.position.y = -sy * 0.0025 + Math.sin(t * 0.2) * 0.2;
      bokeh.position.x = pointer.sx * 0.9;
      bokeh.material.color.copy(accentC);
      speckle.material.opacity = 0.45 * reveal;
      bokeh.material.opacity = 0.26 * reveal;
      foreBokeh.material.opacity = 0.16 * reveal;
      foreBokeh.position.set(pointer.sx * -1.6, -sy * 0.004 + pointer.sy * -1.0, 0);
      foreBokeh.material.color.copy(accentC);
      key.intensity = 10 * reveal; rim.intensity = 5 * reveal; fill.intensity = 0.9 * reveal;

      stateTimer += dt;
      if (stateTimer > 0.1) {
        stateTimer = 0;
        const p = tipWorld.clone().project(camera);
        window.dispatchEvent(new CustomEvent("portfolio:armstate", {
          detail: {
            x: Math.round(((p.x + 1) / 2) * window.innerWidth),
            y: Math.round(((1 - p.y) / 2) * window.innerHeight),
            pulses,
            joints: [arm.j1.rotation.y, arm.j2.rotation.z, arm.j3.rotation.z, arm.j4.rotation.z].map((r) => Math.round((r * 180) / Math.PI * 10) / 10),
            scanning: imaging,
          },
        }));
      }

      renderer.render(scene, camera);
      // Keep the loader up until all chapter material programs have finished
      // linking. Waiting here moves the one-time WebGL cost out of the first
      // transition from About into Research, where it previously froze scroll.
      if (!readyFired && shadersReady) {
        readyFired = true;
        window.__sceneReady = true;
        window.dispatchEvent(new CustomEvent("portfolio:scene-ready"));
      }
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(measureFrame);
      layoutObserver?.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("portfolio:emit", onEmit);
      window.removeEventListener("portfolio:open", onOpen);
      window.removeEventListener("resize", onResize);
      renderer.dispose(); environmentTarget.dispose(); pmrem.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
      });
    };
  }, []);

  return <div ref={containerRef} data-testid="hero-3d-canvas" className="fixed inset-0 z-[3] pointer-events-none" aria-hidden="true" />;
}
