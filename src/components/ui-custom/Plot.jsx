import React, { useMemo } from "react";

/**
 * Hand-built technical diagrams used as tile artwork. Every kind draws the
 * actual object from the CV — the pen, the cuff, the linear motor, the Venus
 * balloon — with real numbers as labels. Deterministic (seeded).
 */
const W = 400;
const H = 260;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const P = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
const series = (n, x0, x1, fn) => Array.from({ length: n }, (_, i) => { const x = i / (n - 1); return [x0 + x * (x1 - x0), fn(x)]; });
const Lbl = ({ x, y, children, anchor = "start", dim }) => <text className={`lbl${dim ? " dim" : ""}`} x={x} y={y} textAnchor={anchor}>{children}</text>;
const Arrow = ({ x1, y1, x2, y2, cls = "trace" }) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 7;
  return <g className={cls}><path d={`M${x1} ${y1} L${x2} ${y2}`} /><path d={`M${x2} ${y2} L${x2 - h * Math.cos(a - 0.5)} ${y2 - h * Math.sin(a - 0.5)} M${x2} ${y2} L${x2 - h * Math.cos(a + 0.5)} ${y2 - h * Math.sin(a + 0.5)}`} /></g>;
};

function build(kind) {
  const r = rng(kind.length * 7919 + kind.charCodeAt(0) * 31 + (kind.charCodeAt(1) || 0) * 17);
  const el = [];
  const grid = [];
  for (let i = 1; i < 6; i++) grid.push(<line key={`h${i}`} x1="16" x2={W - 16} y1={(H * i) / 6} y2={(H * i) / 6} />);
  for (let i = 1; i < 8; i++) grid.push(<line key={`v${i}`} x1={16 + ((W - 32) * i) / 8} x2={16 + ((W - 32) * i) / 8} y1="16" y2={H - 16} />);
  el.push(<g key="g" className="grid">{grid}</g>);

  switch (kind) {
    case "tremor": {
      // pen body
      el.push(<path key="pen" className="trace-2" d="M60 200 L200 60 L214 74 L74 214 Z M60 200 L48 226 L74 214" />);
      el.push(<path key="clip" className="trace-3" d="M120 140 L150 110" />);
      // handwriting with 4–12 Hz tremor riding on it
      const hw = series(260, 52, 300, (x) => 232 - 14 * Math.sin(x * 22) - 6 * Math.sin(x * 61 + 1) - 3 * Math.sin(x * 143));
      el.push(<path key="hw" className="trace draw" pathLength="1" d={P(hw)} />);
      // spectrum, 4–12 Hz band lit
      for (let f = 1; f <= 20; f++) {
        const x = 236 + f * 7.6;
        const inBand = f >= 4 && f <= 12;
        const h = (inBand ? 28 + 40 * Math.exp(-Math.pow((f - 7.5) / 2.6, 2)) : 8 + r() * 10);
        el.push(<rect key={`b${f}`} className={inBand ? "fill-strong" : "fill"} x={x} y={150 - h} width="5" height={h} rx="1" />);
      }
      el.push(<Lbl key="l1" x="266" y="166">4 Hz</Lbl>, <Lbl key="l2" x="322" y="166">12 Hz</Lbl>, <Lbl key="l3" x="236" y="92" dim>tremor band</Lbl>, <Lbl key="l4" x="52" y="46" dim>MEMS · 30 features</Lbl>);
      break;
    }
    case "pressure": {
      // endotracheal tube with cuff
      el.push(<path key="tube" className="trace-2" d="M40 40 C120 40 130 90 150 130 C165 160 190 170 240 172" />);
      el.push(<path key="tube2" className="trace-2" d="M40 54 C118 54 122 100 142 138 C158 168 188 184 240 186" />);
      el.push(<ellipse key="cuff" className="trace" cx="150" cy="150" rx="44" ry="26" fill="none" />);
      el.push(<path key="pilot" className="trace-3" d="M96 48 C80 70 70 90 62 120" />);
      el.push(<Lbl key="l0" x="150" y="154" anchor="middle">cuff</Lbl>);
      // pressure trace on the right with 20–30 window
      const tr = series(300, 240, W - 20, (x) => { const c = (x * 3) % 1; const on = c < 0.6; const rise = Math.min(1, c / 0.05); const ov = 1 + 0.16 * Math.exp(-c * 20) * Math.sin(c * 70); return 236 - (on ? 150 * rise * ov : 150 * Math.max(0, 1 - (c - 0.6) / 0.05)); });
      el.push(<path key="tr" className="trace draw" pathLength="1" d={P(tr)} />);
      el.push(<line key="w1" className="trace-3" x1="240" x2={W - 20} y1="104" y2="104" />, <line key="w2" className="trace-3" x1="240" x2={W - 20} y1="70" y2="70" />);
      el.push(<Lbl key="l1" x="244" y="62">40 kPa</Lbl>, <Lbl key="l2" x="244" y="250">0</Lbl>, <Lbl key="l3" x="244" y="98" dim>±1 % FS</Lbl>);
      break;
    }
    case "linkage": {
      // ENT articulating mount: clamp → 3 links → microscope head
      const J = [[60, 200], [110, 120], [200, 96], [270, 150]];
      el.push(<rect key="clamp" className="fill-strong" x="40" y="196" width="40" height="26" rx="3" />);
      el.push(<path key="links" className="trace draw" pathLength="1" d={P(J)} />);
      J.forEach((p, i) => el.push(<circle key={`j${i}`} className="dot" cx={p[0]} cy={p[1]} r="5" />));
      el.push(<circle key="scope" className="trace-2" cx="300" cy="176" r="26" fill="none" />, <path key="scope2" className="trace-2" d="M270 150 L282 160 M300 202 L300 224" />);
      el.push(<circle key="lens" className="fill" cx="300" cy="176" r="10" />);
      el.push(<Arrow key="load" x1="300" y1="70" x2="300" y2="140" cls="trace-3" />);
      el.push(<Lbl key="l1" x="310" y="60">static load</Lbl>, <Lbl key="l2" x="120" y="112" dim>lock stiffness</Lbl>, <Lbl key="l3" x="40" y="46" dim>endoscope · microscope</Lbl>);
      break;
    }
    case "torsion": {
      // shifter kart chassis, top view
      el.push(<path key="rails" className="trace-2" d="M80 90 L330 90 M80 170 L330 170 M80 90 L80 170 M330 90 C350 90 350 170 330 170" />);
      el.push(<path key="cross" className="trace-2" d="M130 90 L130 170 M200 90 L200 170 M270 90 L270 170" />);
      el.push(<rect key="seat" className="fill" x="150" y="106" width="40" height="48" rx="8" />);
      el.push(<rect key="eng" className="fill-strong" x="225" y="120" width="34" height="28" rx="3" />);
      [[60, 74], [60, 186], [330, 74], [330, 186]].forEach((w, i) => el.push(<rect key={`w${i}`} className="fill-strong" x={w[0] - 14} y={w[1] - 8} width="28" height="16" rx="3" />));
      // torsion arrows
      el.push(<path key="tw" className="trace draw" pathLength="1" d="M100 60 C140 30 300 30 340 60" />);
      el.push(<Lbl key="l1" x="204" y="40" anchor="middle">+15 % torsional rigidity</Lbl>, <Lbl key="l2" x="80" y="236" dim>205cc · +25 % accel · dyno-validated</Lbl>);
      break;
    }
    case "dslim": {
      // dual-sided linear induction motor: two stators, reaction plate between
      const teeth = (y, dir) => Array.from({ length: 12 }, (_, i) => <rect key={`t${y}${i}`} className="fill-strong" x={54 + i * 25} y={dir > 0 ? y : y - 16} width="14" height="16" />);
      el.push(<rect key="s1" className="fill" x="50" y="60" width="300" height="20" />, ...teeth(80, 1));
      el.push(<rect key="s2" className="fill" x="50" y="180" width="300" height="20" />, ...teeth(180, -1));
      el.push(<rect key="plate" className="trace-2" x="30" y="120" width="340" height="20" rx="2" fill="none" />);
      for (let k = 0; k < 3; k++) el.push(<path key={`ph${k}`} className={k === 0 ? "trace draw" : "trace-2"} pathLength="1" d={P(series(200, 50, 350, (x) => 130 + 40 * Math.sin(x * 12.6 + (k * 2 * Math.PI) / 3)))} />);
      el.push(<Arrow key="th" x1="300" y1="228" x2="360" y2="228" />);
      el.push(<Lbl key="l1" x="50" y="50" dim>12-slot dual-sided stator</Lbl>, <Lbl key="l2" x="290" y="246">thrust · &gt;68 %</Lbl>, <Lbl key="l3" x="34" y="158" dim>reaction plate</Lbl>);
      break;
    }
    case "venus": {
      // aerobot: balloon, tether, gondola with panels; pressure curve
      el.push(<ellipse key="bal" className="trace draw" pathLength="1" cx="120" cy="80" rx="62" ry="46" fill="none" />);
      el.push(<path key="tether" className="trace-3" d="M120 126 L120 170" />);
      el.push(<path key="gond" className="fill-strong" d="M104 170 L136 170 L144 186 L136 202 L104 202 L96 186 Z" />);
      el.push(<rect key="p1" className="fill" x="56" y="180" width="38" height="12" />, <rect key="p2" className="fill" x="146" y="180" width="38" height="12" />);
      el.push(<path key="curve" className="trace-2" d={P(series(80, 240, W - 20, (x) => 232 - 190 * Math.exp(-x * 4.5)))} />);
      el.push(<line key="alt" className="trace-3" x1="240" x2={W - 20} y1="112" y2="112" />);
      el.push(<Lbl key="l1" x="244" y="46">92 bar · 150 °C at surface</Lbl>, <Lbl key="l2" x="244" y="106" dim>float altitude</Lbl>, <Lbl key="l3" x="56" y="228" dim>≥200 W · multi-junction + Li-ion</Lbl>);
      break;
    }
    case "transducer": {
      // focused transparent array: laser passes through elements; sound focuses
      const cx = W / 2, fy = 214;
      for (let i = 0; i < 9; i++) {
        const t = (i - 4) / 4;
        const x = cx + t * 130, y = 60 + 18 * t * t;
        el.push(<rect key={`e${i}`} className="fill" x={x - 11} y={y} width="22" height="9" rx="2" transform={`rotate(${t * 14} ${x} ${y})`} />);
        el.push(<path key={`r${i}`} className={i === 4 ? "trace draw" : "trace-2"} pathLength="1" d={`M${x} ${y + 9} L${cx} ${fy}`} />);
      }
      el.push(<path key="laser" className="trace-3" d={`M${cx} 20 L${cx} ${fy}`} />);
      el.push(<circle key="f" className="dot" cx={cx} cy={fy} r="5" />);
      el.push(<Lbl key="l1" x="40" y="46" dim>light through the transducer</Lbl>, <Lbl key="l2" x={cx + 12} y={fy + 4}>focus</Lbl>, <Lbl key="l3" x="40" y="236" dim>f-TUT · planar → focused</Lbl>);
      break;
    }
    case "pinn": {
      // Multi-channel RF data compared through a baseline CNN and a PINN.
      for (let i = 0; i < 5; i++) {
        const trace = series(90, 34, 142, (x) => 48 + i * 28 + 10 * Math.sin(x * 24 + i) * Math.exp(-Math.pow((x - 0.52) / 0.28, 2)));
        el.push(<path key={`rf${i}`} className={i === 2 ? "trace draw" : "trace-2"} pathLength="1" d={P(trace)} />);
      }
      el.push(<Arrow key="a1" x1="150" y1="104" x2="202" y2="76" />, <Arrow key="a2" x1="150" y1="120" x2="202" y2="180" cls="trace-2" />);
      el.push(<rect key="cnn" className="trace-2" x="210" y="48" width="74" height="52" rx="5" fill="none" />);
      el.push(<rect key="pinn" className="trace" x="210" y="150" width="74" height="52" rx="5" fill="none" />);
      el.push(<path key="res" className="trace-3" d="M284 176 L336 176 L336 126 L284 126" />);
      el.push(<Arrow key="o1" x1="284" y1="74" x2="360" y2="74" cls="trace-2" />, <Arrow key="o2" x1="284" y1="176" x2="360" y2="176" />);
      el.push(<Lbl key="l1" x="34" y="36" dim>multi-channel PA RF</Lbl>, <Lbl key="l2" x="247" y="79" anchor="middle">CNN</Lbl>, <Lbl key="l3" x="247" y="181" anchor="middle">PINN</Lbl>, <Lbl key="l4" x="292" y="118" dim>wave equation</Lbl>, <Lbl key="l5" x="304" y="58" dim>tissue class</Lbl>, <Lbl key="l6" x="304" y="220" dim>classification + physics loss</Lbl>);
      break;
    }
    case "nullspace": {
      // Singular-value spectrum with a threshold and the resulting error split.
      const spectrum = series(100, 36, 210, (x) => 50 + 148 * (1 - Math.exp(-4.5 * x)));
      el.push(<path key="sv" className="trace draw" pathLength="1" d={P(spectrum)} />);
      el.push(<line key="th" className="trace-3" x1="36" x2="210" y1="160" y2="160" />);
      el.push(<Lbl key="l1" x="40" y="42" dim>singular values</Lbl>, <Lbl key="l2" x="134" y="154" dim>threshold</Lbl>);
      el.push(<rect key="m" className="trace-2" x="244" y="48" width="116" height="66" rx="5" fill="none" />);
      el.push(<rect key="n" className="trace" x="244" y="148" width="116" height="66" rx="5" fill="none" />);
      for (let i = 0; i < 18; i++) {
        el.push(<circle key={`m${i}`} className="fill" cx={256 + r() * 92} cy={60 + r() * 42} r={1.5 + r() * 2.5} />);
        el.push(<path key={`n${i}`} className={i % 4 === 0 ? "trace" : "trace-2"} d={`M${252 + r() * 94} ${158 + r() * 42} l${5 + r() * 15} ${-4 + r() * 8}`} />);
      }
      el.push(<Lbl key="l3" x="302" y="130" anchor="middle" dim>measured space</Lbl>, <Lbl key="l4" x="302" y="230" anchor="middle">effective null space</Lbl>, <Lbl key="l5" x="36" y="234" dim>PSNR · SSIM · CHO AUC</Lbl>);
      break;
    }
    case "eim": {
      // Five independent LC matching paths laid out as a compact PCB study.
      const bands = ["1", "3.6", "6.5", "13", "30"];
      bands.forEach((band, i) => {
        const y = 48 + i * 40;
        el.push(<circle key={`in${i}`} className="trace-2" cx="42" cy={y} r="8" fill="none" />);
        el.push(<path key={`wire${i}`} className={i === 3 ? "trace draw" : "trace-2"} pathLength="1" d={`M50 ${y} L92 ${y} l8 -9 l12 18 l12 -18 l12 18 l8 -9 L204 ${y} L204 ${y + 16}`} />);
        el.push(<line key={`cap1${i}`} className="trace-3" x1="194" x2="214" y1={y + 16} y2={y + 16} />);
        el.push(<line key={`cap2${i}`} className="trace-3" x1="194" x2="214" y1={y + 22} y2={y + 22} />);
        el.push(<line key={`ground${i}`} className="trace-3" x1="204" x2="204" y1={y + 22} y2={y + 28} />);
        el.push(<path key={`outwire${i}`} className="trace-2" d={`M204 ${y} L330 ${y}`} />);
        el.push(<circle key={`out${i}`} className="trace-2" cx="340" cy={y} r="8" fill="none" />);
        el.push(<Lbl key={`band${i}`} x="230" y={y - 6} dim>{band} MHz</Lbl>);
      });
      el.push(<Lbl key="l1" x="34" y="252" dim>BNC in</Lbl>, <Lbl key="l2" x="318" y="252" dim>BNC out</Lbl>, <Lbl key="l3" x="150" y="26">KiCad · five LC networks</Lbl>);
      break;
    }
    case "pa": {
      // light in (coral pulse), absorber, sound out (arcs) to a linear array
      el.push(<rect key="arr" className="fill-strong" x="90" y="34" width="220" height="12" rx="2" />);
      for (let i = 0; i < 11; i++) el.push(<rect key={`a${i}`} className="fill" x={94 + i * 20} y="46" width="12" height="6" />);
      el.push(<path key="tissue" className="trace-3" d="M40 90 C120 70 280 70 360 90 L360 236 L40 236 Z" />);
      el.push(<path key="light" className="trace draw" pathLength="1" d="M60 236 L120 200 L100 176 L160 150 L146 132 L200 164" />);
      el.push(<circle key="abs" className="dot" cx="205" cy="168" r="7" />);
      [26, 48, 70, 92].forEach((rr, i) => el.push(<path key={`w${i}`} className="trace-2" d={`M${205 - rr} 168 A${rr} ${rr} 0 0 1 ${205 + rr} 168`} />));
      el.push(<Lbl key="l1" x="40" y="252">light in</Lbl>, <Lbl key="l2" x="318" y="44">sound out</Lbl>, <Lbl key="l3" x="220" y="176" dim>absorber</Lbl>);
      break;
    }
    case "phantom": {
      for (let i = 0; i < 320; i++) el.push(<circle key={`s${i}`} className="dot" cx={40 + r() * 320} cy={70 + r() * 160} r={0.5 + r() * 1.5} opacity={0.12 + r() * 0.45} />);
      el.push(<path key="skin" className="trace-2" d="M40 70 L360 70" />);
      el.push(<path key="src" className="trace draw" pathLength="1" d="M120 40 L120 70 M100 52 L140 52 M108 40 L132 64 M132 40 L108 64" />);
      el.push(<ellipse key="les" className="trace" cx="240" cy="150" rx="40" ry="26" fill="none" />);
      el.push(<path key="det" className="trace-3" d="M60 232 L340 232" />);
      el.push(<Lbl key="l1" x="130" y="46">source</Lbl>, <Lbl key="l2" x="240" y="154" anchor="middle" dim>lesion</Lbl>, <Lbl key="l3" x="40" y="250" dim>NIRfast optics · K-wave acoustics</Lbl>);
      break;
    }
    case "piezo": {
      // crystal with cut planes + hysteresis loop
      el.push(<path key="cry" className="trace draw" pathLength="1" d="M110 60 L170 40 L230 60 L230 170 L170 190 L110 170 Z M110 60 L170 80 L230 60 M170 80 L170 190" />);
      el.push(<path key="cut" className="trace-3" d="M96 128 L244 96 M96 152 L244 120" />);
      const loop = [];
      for (let i = 0; i <= 160; i++) { const t = (i / 160) * Math.PI * 2; loop.push([320 + 44 * Math.cos(t), 130 - 46 * Math.tanh(2 * Math.cos(t)) - 14 * Math.sin(t)]); }
      el.push(<path key="h" className="trace-2" d={P(loop) + " Z"} />);
      el.push(<Lbl key="l1" x="96" y="220">LiNbO₃ · PMN-PT</Lbl>, <Lbl key="l2" x="250" y="112" dim>36° Y-cut</Lbl>, <Lbl key="l3" x="280" y="220" dim>P–E</Lbl>);
      break;
    }
    case "lidar": {
      const cx = 200, cy = 150;
      el.push(<path key="room" className="trace-3" d="M60 60 L340 60 L340 240 L60 240 Z M250 60 L250 120 L300 120" />);
      el.push(<rect key="o1" className="fill-strong" x="100" y="160" width="40" height="30" />, <rect key="o2" className="fill-strong" x="270" y="180" width="30" height="40" />);
      const ends = [];
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        let t = 999;
        const hit = (x0, y0, x1, y1) => { const d = Math.cos(a) * (y1 - y0) - Math.sin(a) * (x1 - x0); if (Math.abs(d) < 1e-6) return; const u = ((x0 - cx) * (y1 - y0) - (y0 - cy) * (x1 - x0)) / d; const v = ((x0 - cx) * Math.sin(a) - (y0 - cy) * Math.cos(a)) / d; if (u > 0 && v >= 0 && v <= 1) t = Math.min(t, u); };
        [[60, 60, 340, 60], [340, 60, 340, 240], [340, 240, 60, 240], [60, 240, 60, 60], [100, 160, 140, 160], [140, 160, 140, 190], [100, 190, 100, 160], [100, 190, 140, 190], [270, 180, 300, 180], [300, 180, 300, 220], [270, 220, 300, 220], [270, 180, 270, 220], [250, 60, 250, 120], [250, 120, 300, 120]].forEach((s) => hit(...s));
        ends.push([cx + Math.cos(a) * t, cy + Math.sin(a) * t]);
      }
      ends.forEach((p, i) => { if (i % 3 === 0) el.push(<line key={`r${i}`} className="trace-2" x1={cx} y1={cy} x2={p[0]} y2={p[1]} opacity="0.35" />); el.push(<circle key={`p${i}`} className="dot" cx={p[0]} cy={p[1]} r="2" />); });
      el.push(<circle key="bot" className="trace" cx={cx} cy={cy} r="9" fill="none" />);
      el.push(<Lbl key="l1" x="66" y="52" dim>ROS 2 · +20 % detection</Lbl>, <Lbl key="l2" x="214" y="146">±2 cm</Lbl>);
      break;
    }
    case "cnc": {
      // lunar-rover bracket + spiral toolpath
      el.push(<path key="part" className="trace-2" d="M70 70 L250 70 L250 110 L200 110 L200 190 L70 190 Z" />);
      const sp = [];
      for (let i = 0; i <= 300; i++) { const t = i / 300; const a = t * Math.PI * 14; const rr = 8 + t * 44; sp.push([130 + Math.cos(a) * rr, 130 + Math.sin(a) * rr * 0.8]); }
      el.push(<path key="tp" className="trace draw" pathLength="1" d={P(sp)} />);
      el.push(<path key="tool" className="trace-3" d="M300 40 L300 120 M286 120 L314 120 L300 150 Z" />);
      el.push(<Lbl key="l1" x="270" y="180">±0.02 mm</Lbl>, <Lbl key="l2" x="70" y="222" dim>Sinumerik G/M · −15 % cycle time</Lbl>);
      break;
    }
    case "lever": {
      // excavator lever: pivot, arm, force before/after
      el.push(<path key="base" className="fill-strong" d="M120 220 L180 220 L150 180 Z" />);
      el.push(<circle key="piv" className="dot" cx="150" cy="180" r="5" />);
      el.push(<path key="arm" className="trace draw" pathLength="1" d="M150 180 L300 90" />);
      el.push(<path key="arm2" className="trace-3" d="M150 180 L60 150" />);
      el.push(<Arrow key="f1" x1="300" y1="40" x2="300" y2="80" cls="trace-3" />, <Arrow key="f2" x1="60" y1="200" x2="60" y2="160" />);
      el.push(<Lbl key="l1" x="250" y="34" dim>10.9 lb before</Lbl>, <Lbl key="l2" x="30" y="228">1.7 lb after</Lbl>, <Lbl key="l3" x="180" y="240" dim>patented lever · BEML</Lbl>);
      break;
    }
    case "suspension": {
      // double wishbone
      el.push(<path key="chassis" className="fill" d="M40 60 L120 60 L120 200 L40 200 Z" />);
      el.push(<path key="upper" className="trace draw" pathLength="1" d="M120 90 L230 100 M120 110 L230 100" />);
      el.push(<path key="lower" className="trace-2" d="M120 160 L240 176 M120 180 L240 176" />);
      el.push(<path key="upright" className="trace-2" d="M230 100 L240 176" />);
      el.push(<rect key="wheel" className="fill-strong" x="252" y="80" width="30" height="110" rx="10" />);
      el.push(<path key="spring" className="trace-3" d="M150 96 L156 110 L144 124 L156 138 L144 152 L152 166" />);
      el.push(<Lbl key="l1" x="160" y="230">+20 % cornering stability</Lbl>, <Lbl key="l2" x="40" y="46" dim>TARMO5 · geometry optimised</Lbl>);
      break;
    }
    case "pod": {
      el.push(<path key="tube" className="trace-3" d="M20 90 L380 90 M20 190 L380 190" />);
      el.push(<path key="pod" className="trace draw" pathLength="1" d="M100 140 C100 110 130 104 180 104 L280 104 C320 104 340 120 350 140 C340 160 320 176 280 176 L180 176 C130 176 100 170 100 140 Z" />);
      for (let i = 0; i < 12; i++) el.push(<rect key={`s${i}`} className="fill-strong" x={130 + i * 18} y="182" width="10" height="8" />);
      el.push(<rect key="bms" className="fill" x="200" y="124" width="60" height="30" rx="3" />);
      el.push(<Lbl key="l1" x="204" y="144">BMS</Lbl>, <Lbl key="l2" x="30" y="220" dim>25+ members · 8 disciplines</Lbl>, <Lbl key="l3" x="290" y="220" dim>DSLIM</Lbl>);
      break;
    }
    case "cohort": {
      for (let i = 0; i < 40; i++) el.push(<circle key={`d${i}`} className={i === 17 ? "dot" : "fill-strong"} cx={70 + (i % 10) * 28} cy={110 + Math.floor(i / 10) * 30} r={i === 17 ? 7 : 5} />);
      el.push(<rect key="board" className="trace-2" x="60" y="40" width="280" height="40" rx="3" fill="none" />);
      el.push(<path key="chalk" className="trace draw" pathLength="1" d="M80 60 L120 60 M140 60 L200 60 M220 60 L250 60" />);
      el.push(<Lbl key="l1" x="60" y="236" dim>Weekly recitation · 300-student course</Lbl>);
      break;
    }
    case "wave":
    default: {
      el.push(<path key="w" className="trace draw" pathLength="1" d={P(series(240, 20, W - 20, (x) => H / 2 + 50 * Math.sin(x * 25) * Math.exp(-x * 2)))} />);
      el.push(<path key="w2" className="trace-2" d={P(series(240, 20, W - 20, (x) => H / 2 + 50 * Math.exp(-x * 2)))} />);
      el.push(<path key="w3" className="trace-2" d={P(series(240, 20, W - 20, (x) => H / 2 - 50 * Math.exp(-x * 2)))} />);
    }
  }
  return el;
}

export default function Plot({ kind = "wave", tint = "var(--accent)", className = "" }) {
  const el = useMemo(() => build(kind), [kind]);
  return (
    <svg className={`plot ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ "--tint": tint }} aria-hidden="true">
      {el}
    </svg>
  );
}
