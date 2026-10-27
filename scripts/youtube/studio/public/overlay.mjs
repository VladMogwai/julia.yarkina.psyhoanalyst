// A text or a photo laid over the video, drawn the same way in the editor preview and in the final render.
//
// An overlay: { id, type: "text" | "photo", t0, t1 (source seconds), x, y (centre, share of the frame),
//   text, color, plate (text on a plate), size (font size, share of the frame width) | file, w (photo width, share) }

export const COLORS = ["#ffffff", "#141414", "#E8336D", "#FFD84A", "#2F5BEA"];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** The element for a frame W pixels wide; `attrs` go on the element (the editor marks it for dragging). */
export function overlayHtml(o, W, src, attrs = "") {
  const pos = `position:absolute;left:${o.x * 100}%;top:${o.y * 100}%;transform:translate(-50%,-50%)`;
  if (o.type === "photo") return `<img ${attrs} src="${src}" draggable="false" style="${pos};width:${o.w * W}px;border-radius:${0.012 * W}px;display:block">`;
  const fs = o.size * W;
  const look = o.plate
    ? `background:${["#ffffff", "#FFD84A"].includes(o.color) ? "#141414" : "#ffffff"};padding:${fs * 0.22}px ${fs * 0.5}px;border-radius:${fs * 0.3}px`
    : `text-shadow:0 ${fs * 0.04}px ${fs * 0.18}px rgba(0,0,0,.55)`;
  return `<div ${attrs} style="${pos};${look};color:${o.color};font:800 ${fs}px/1.15 Manrope,sans-serif;white-space:pre;text-align:center">${esc(o.text)}</div>`;
}
