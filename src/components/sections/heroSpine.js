/**
 * Single-stroke skeletons for the display caps.
 *
 * A font gives you the *outline* of a letter. What we want here is the path a
 * pen would take to write it — one continuous line down the middle of every
 * stem, bar and bowl — so a lit segment can travel it like a river. There is no
 * way to derive that from an outline, so the letters are drawn by hand.
 *
 * Each glyph is a list of subpaths on a 0..100 box: x across the letter's ink
 * width, y from cap height (0) to baseline (100). Only M / L / C are used, so
 * every number in a segment is a coordinate pair and the whole thing can be
 * mapped onto a measured letter box with one transform.
 */
const L = (x, y) => ["L", x, y];
const C = (x1, y1, x2, y2, x, y) => ["C", x1, y1, x2, y2, x, y];
const M = (x, y) => ["M", x, y];

export const SKELETONS = {
  A: [[M(6, 100), L(50, 0), L(94, 100)], [M(23, 66), L(77, 66)]],
  D: [[M(14, 0), L(52, 0), C(88, 0, 88, 100, 52, 100), L(14, 100), L(14, 0)]],
  H: [[M(12, 0), L(12, 100)], [M(88, 0), L(88, 100)], [M(12, 50), L(88, 50)]],
  L: [[M(14, 0), L(14, 100), L(88, 100)]],
  M: [[M(8, 100), L(8, 0), L(50, 64), L(92, 0), L(92, 100)]],
  R: [
    [M(12, 100), L(12, 0), L(56, 0), C(84, 0, 84, 46, 56, 46), L(12, 46)],
    [M(50, 46), L(90, 100)],
  ],
  // the control points sit well past the baseline on purpose: a cubic only pulls
  // a quarter of the way toward them, so y=110 puts the bottom of the curve on
  // the centre of the letter's own stroke. At 92 the bowl rode high inside the U
  // and only covered its inner edge.
  U: [[M(12, 0), L(12, 55), C(12, 110, 88, 110, 88, 55), L(88, 0)]],
  V: [[M(8, 0), L(50, 100), L(92, 0)]],
};

/**
 * Exact ink box for one rendered letter.
 *
 * Deriving cap height and side bearings from published font metrics was off by
 * most of a line, so ask the font directly: canvas TextMetrics gives the real
 * ascent, descent and per-glyph ink bounds, which is what the skeleton has to
 * register against.
 */
function inkBox(ctx, el, ch, fontSize) {
  const r = el.getBoundingClientRect();
  const m = ctx.measureText(ch);
  const ascent = m.fontBoundingBoxAscent;
  const descent = m.fontBoundingBoxDescent;
  // the glyph sits in the middle of the line box, half-leading either side
  const baseline = r.top + (r.height - (ascent + descent)) / 2 + ascent;
  const capH = m.actualBoundingBoxAscent || fontSize * 0.7;
  const left = r.left - m.actualBoundingBoxLeft;
  const width = m.actualBoundingBoxRight + m.actualBoundingBoxLeft;
  return { left, width, top: baseline - capH, height: capH };
}

/**
 * Build the skeleton as a list of separate strokes, in writing order.
 *
 * It has to be a list rather than one `d`: SVG restarts a dash pattern at every
 * subpath, so a single dash travelling one combined path lights up the start of
 * every stroke at once instead of moving through the name. Each stroke is its
 * own element and the travelling window is mapped onto it by the caller.
 */
export function buildSpine(letters, originX, originY, fontSize, ctx, padX = 0, padY = 0) {
  const strokes = [];
  for (const el of letters) {
    const ch = (el.textContent || "").trim().toUpperCase();
    const glyph = SKELETONS[ch];
    if (!glyph) continue;                 // spaces and anything unfamiliar
    const b = inkBox(ctx, el, ch, fontSize);
    // A round cap hangs half a stroke past its endpoint, and the bloom spreads
    // further still, so a skeleton drawn to the full cap height pokes out of the
    // top and bottom of the letter. Pull the drawing box in by that much.
    const w = b.width - padX * 2;
    const h = b.height - padY * 2;
    if (w <= 0 || h <= 0) continue;
    const x0 = b.left - originX + padX;
    const y0 = b.top - originY + padY;
    const tx = (x) => (x0 + (x / 100) * w).toFixed(1);
    const ty = (y) => (y0 + (y / 100) * h).toFixed(1);
    for (const sub of glyph) {
      let d = "";
      for (const seg of sub) {
        if (seg[0] === "C") {
          d += `C${tx(seg[1])},${ty(seg[2])} ${tx(seg[3])},${ty(seg[4])} ${tx(seg[5])},${ty(seg[6])}`;
        } else {
          d += `${seg[0]}${tx(seg[1])},${ty(seg[2])}`;
        }
      }
      strokes.push(d);
    }
  }
  return strokes;
}
