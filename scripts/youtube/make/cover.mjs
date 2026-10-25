// HTML for a YouTube cover (1280x720) in the channel style, shared by the cover and the intro.
//
// A spec: { kind: "int" | "tema" | "teor", bg, accent, labelColor, titleColor, label, title, photo, guests? (1–3 photos) }
// A photo: { src (file URL), w, h, face: [x, y, w, h] } — placed so the face sits at a fixed spot in its shape.

export const PALETTE = [
  { bg: "#E8336D", accent: "#FFD2DF" },
  { bg: "#16224A", accent: "#FF7A9C" },
  { bg: "#2F5BEA", accent: "#FFD84A" },
  { bg: "#FF7A3D", accent: "#16224A" },
  { bg: "#2E6B57", accent: "#F6C9A8" },
];
export const THEORY = { bg: "#F6F1EA", accent: "#E8336D", labelColor: "#E8336D", titleColor: "#141414" };

/** Scales and shifts a photo so the face is faceW wide (share of the box) at (cx, cy), never leaving an empty edge. */
export function place(p, bw, bh, faceW, cx, cy) {
  const [fx, fy, fw, fh] = p.face;
  const k = Math.max((faceW * bw) / fw, bw / p.w, bh / p.h);
  const x = Math.min(0, Math.max(bw - p.w * k, cx * bw - (fx + fw / 2) * k));
  const y = Math.min(0, Math.max(bh - p.h * k, cy * bh - (fy + fh / 2) * k));
  return `<img src="${p.src}" style="position:absolute;left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${(p.w * k).toFixed(0)}px">`;
}

/** The photo shapes of each layout; `extra` adds attributes to each shape (the intro animates them). */
export function shapes(s, extra = () => "") {
  const ring = `box-shadow:0 0 0 10px ${s.accent}`;
  const shape = (style, inner, i) => `<div class="c" ${extra(i)} style="position:absolute;overflow:hidden;${style};${ring}"><div class="z" style="position:absolute;inset:0">${inner}</div></div>`;
  if (s.kind === "int") {
    // Guests first, Julia last; [left, top, size] of each circle for one, two or three guests.
    const people = [...(s.guests ?? [s.guest]), s.photo];
    const LAYOUTS = {
      2: [[440, 150, 420], [880, 215, 360]],
      3: [[455, 175, 340], [790, 70, 340], [830, 415, 290]],
      4: [[565, 55, 290], [885, 55, 290], [565, 375, 290], [885, 375, 290]],
    };
    return LAYOUTS[people.length].map(([x, y, d], i) =>
      shape(`left:${x}px;top:${y}px;width:${d}px;height:${d}px;border-radius:50%`, place(people[i], d, d, 0.34, 0.5, 0.42), i)).join("");
  }
  if (s.kind === "teor")
    return shape("left:717px;top:158px;width:486px;height:486px;border-radius:50%", place(s.photo, 486, 486, 0.32, 0.5, 0.42), 0);
  return shape("right:-60px;bottom:-10px;width:720px;height:620px;border-radius:360px 360px 0 0", place(s.photo, 720, 620, 0.2, 0.42, 0.3), 0);
}

/** Label and title; the title shrinks until it fits beside the photos, then window.ready is set. */
export function text(s) {
  const title = s.title
    .replace(/(психо|само)(аналіз|достатн)/gi, "$1&shy;$2") // allowed break inside long words
    .replace(/(^|\s)(і|в|у|та|й|чи|на|за|не|до|ми|під|як)\s/gi, "$1$2&nbsp;"); // short words stay with the next one
  return `
<div id="label" style="position:absolute;left:60px;top:46px;font-size:27px;color:${s.labelColor};letter-spacing:.3px">${s.label}</div>
<div id="t" style="position:absolute;left:56px;top:108px;width:${{ int: 405, tema: 600, teor: 740 }[s.kind]}px;transform:scaleX(.86);transform-origin:left top;font-size:116px;line-height:.98;color:${s.titleColor}">${title}</div>
<script>
const t = document.getElementById("t");
document.fonts.ready.then(() => {
  const maxH = ${s.kind === "int" ? 450 : 500};
  for (let fs = 116; fs > 48 && (t.scrollWidth > t.clientWidth + 2 || t.offsetHeight > maxH); fs -= 4) t.style.fontSize = fs + "px";
  window.ready = true;
});
</script>`;
}

export const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Manrope:wght@700;800&display=block" rel="stylesheet">`;
export const page = (s, body, css = "") => `<html><head><meta charset="utf-8">${FONTS}<style>*{margin:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${s.bg};position:relative;overflow:hidden;font-family:Oswald;font-weight:600;text-transform:uppercase}${css}</style></head><body>${body}</body></html>`;

export const coverHtml = (s) => page(s, shapes(s) + text(s));
