// HTML for the 5-second intro: the cover animated over an abstract background, ending on the channel logo.
// window.render(t) draws the frame at t seconds; make.mjs captures 30 frames a second.
import { page, shapes, text } from "./cover.mjs";

const BARS = ["#E8336D", "#16224A", "#2F5BEA", "#FF7A3D", "#2E6B57", "#FFD84A"];
export const SECONDS = 5;

export function introHtml(s) {
  const [rx, ry] = { int: [650, 360], teor: [960, 401], tema: [1000, 420] }[s.kind]; // centre of the ripples
  const bars = (id) => `<div class="bars" id="${id}">${BARS.map((c) => `<div style="background:${c}"></div>`).join("")}</div>`;
  const body = `
<div class="blob" data-x="980" data-y="110" data-r="260" data-dx="40" data-dy="30" data-sp="0.5" style="background:${s.accent};opacity:.16"></div>
<div class="blob" data-x="160" data-y="600" data-r="220" data-dx="50" data-dy="25" data-sp="0.7" style="background:#fff;opacity:.08"></div>
<div class="blob" data-x="560" data-y="720" data-r="180" data-dx="30" data-dy="40" data-sp="0.9" style="background:${s.accent};opacity:.12"></div>
<div id="ring" style="left:${rx - 330}px;top:${ry - 330}px"></div>
${[0, 1, 2].map((i) => `<div class="wave" data-i="${i}" style="left:${rx}px;top:${ry}px"></div>`).join("")}
${shapes(s, (i) => `data-at="${1.1 + i * 0.25}"`)}
${text(s)}
${bars("in")}
<div id="logo"><div class="L">З Юлією Яркіною</div><div class="T"><span style="color:#E8336D">Pro</span> психоаналіз</div></div>
${bars("out")}
<script>
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
window.render = (time) => {
  // Abstract layer: drifting soft circles, a slow dashed ring, ripples from the photos.
  document.querySelectorAll(".blob").forEach((b) => {
    const d = b.dataset, r = +d.r, a = time * +d.sp;
    b.style.cssText += ";width:" + r * 2 + "px;height:" + r * 2 + "px;left:" + (+d.x - r + Math.sin(a) * +d.dx) + "px;top:" + (+d.y - r + Math.cos(a * 1.3) * +d.dy) + "px";
  });
  document.getElementById("ring").style.transform = "rotate(" + time * 12 + "deg) scale(" + (0.85 + 0.15 * ease(time / 1.5)) + ")";
  document.querySelectorAll(".wave").forEach((w) => {
    const start = 1.4 + +w.dataset.i * 0.9, k = (((time - start) % 2.7) + 2.7) % 2.7, size = 300 + k * 260;
    w.style.cssText += ";width:" + size + "px;height:" + size + "px;margin:" + -size / 2 + "px 0 0 " + -size / 2 + "px;opacity:" + (time > start ? Math.max(0, 0.5 - (k / 2.7) * 0.5) : 0);
  });
  // Bars open the scene, then label, title and photos come in.
  [...document.querySelectorAll("#in div")].forEach((b, i) => (b.style.transform = "translateX(" + ease((time - i * 0.05) / 0.45) * 105 + "%)"));
  const l = ease((time - 0.5) / 0.4);
  document.getElementById("label").style.cssText += ";opacity:" + l + ";transform:translateY(" + (1 - l) * 20 + "px)";
  const p = ease((time - 0.6) / 0.6);
  t.style.opacity = p;
  t.style.transform = "scaleX(.86) translateY(" + (1 - p) * 60 + "px)";
  document.querySelectorAll(".c").forEach((c) => {
    const q = ease((time - +c.dataset.at) / 0.6);
    c.style.transform = "scale(" + (0.6 + 0.4 * q) + ")";
    c.style.opacity = q;
    c.querySelector(".z").style.transform = "scale(" + (1 + (0.06 * Math.max(0, time - 1.5)) / 3.5) + ")";
  });
  // Bars close the scene and uncover the logo.
  [...document.querySelectorAll("#out div")].forEach((b, i) => (b.style.transform = "translateX(" +
    (-105 + ease((time - 4.0 - i * 0.04) / 0.3) * 105 + (time > 4.4 ? ease((time - 4.4 - i * 0.03) / 0.25) * 105 : 0)) + "%)"));
  document.getElementById("logo").style.opacity = time > 4.35 ? 1 : 0;
};
</script>`;
  return page(s, body, `
.blob{position:absolute;border-radius:50%;filter:blur(30px)}
#ring{position:absolute;width:660px;height:660px;border-radius:50%;border:2px dashed ${s.accent};opacity:.35}
.wave{position:absolute;width:0;height:0;border-radius:50%;border:2px solid ${s.accent}}
.bars{position:absolute;inset:0;display:flex;flex-direction:column}.bars div{flex:1}
#logo{position:absolute;inset:0;background:#F6F1EA;display:flex;flex-direction:column;align-items:center;justify-content:center}
#logo .L{font:800 20px Manrope;letter-spacing:.14em;color:#E8336D}
#logo .T{font:700 92px/1 Oswald;color:#141414;margin-top:12px}`);
}
