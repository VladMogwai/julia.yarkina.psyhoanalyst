/**
 * Phones: what a touch leaves in the air. On the dark first half of a topic it is fairy dust, like the
 * dust shaken off Tinker Bell: a tap throws a pinch that lifts a little and slowly settles, swaying and
 * twinkling, and a moving finger leaves a trail of it. On the light second half it is dandelion down:
 * seeds that float up and drift, carried by the wind of the finger. All of it lives on one full-screen
 * canvas above the card, so hundreds of particles stay smooth.
 */

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  star: boolean;
  colour: string;
  twinkle: number;
  phase: number;
  sway: number;
  swayReach: number;
}

interface Seed {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  /** Which way the seed hangs, and how it turns as it floats. */
  angle: number;
  spin: number;
  /** Size of the white parachute and the stalk under it. */
  reach: number;
  stalk: number;
  /** The parachute's tips are tinged with a colour of the card's abstraction. */
  tint: string;
  phase: number;
}

/** How strongly the dust settles (px/s²) and how quickly the air slows it (share of speed kept per second). */
const GRAVITY = 38;
const AIR_X = 0.12;
const AIR_Y = 0.2;
/** Kept soft on the glass: the glow around a mote and the mote itself stay translucent. */
const HALO_ALPHA = 0.32;
const MOTE_ALPHA = 0.8;
/** A share of a tap's motes are tiny four-pointed sparkles rather than specks; a trail has none. */
const STAR_SHARE = 0.1;

/** Down barely falls: it rises a little (px/s²) and the air slows it gently. */
const SEED_LIFT = 6;
const SEED_AIR_X = 0.4;
const SEED_AIR_Y = 0.5;
/** Rays of a seed's parachute, fanning over this angle (radians). */
const SEED_RAYS = 9;
const SEED_FAN = 2.4;

const between = (low: number, high: number) => low + Math.random() * (high - low);

export interface Dust {
  /**
   * A pinch thrown from a tap, with a few tiny sparkles among the specks, or a trail of plain dust
   * left along a moving finger.
   */
  sprinkle: (x: number, y: number, count: number, colours: string[], kind?: "pinch" | "trail") => void;
  /**
   * Dandelion seeds let go at a point, drifting with the given wind (px/s) and spreading around it;
   * `life` makes them float longer, as for a whole blown dandelion.
   */
  release: (
    x: number,
    y: number,
    count: number,
    tints: string[],
    wind?: { vx?: number; vy?: number; spread?: number; life?: number },
  ) => void;
  /** The wind of a moving finger: seeds near it are carried along. */
  blow: (x: number, y: number, vx: number, vy: number) => void;
  stop: () => void;
}

/** How far around a moving finger its wind reaches (px), and how much of its speed it passes on. */
const WIND_REACH = 140;
const WIND_SHARE = 0.35;

export function startDust(canvas: HTMLCanvasElement): Dust {
  const context = canvas.getContext("2d")!;
  let motes: Mote[] = [];
  let seeds: Seed[] = [];
  let frameId = 0;
  let last = 0;

  function fitCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const [width, height] = [Math.round(window.innerWidth * ratio), Math.round(window.innerHeight * ratio)];
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function sparkle(x: number, y: number, radius: number, turn: number) {
    context.beginPath();
    for (let point = 0; point < 8; point++) {
      const reach = point % 2 ? radius * 0.28 : radius;
      const angle = turn + (point * Math.PI) / 4;
      context.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
    }
    context.closePath();
    context.fill();
  }

  function drawMote(mote: Mote, step: number) {
    mote.age += step;
    if (mote.age > mote.life) return false;
    mote.vx *= AIR_X ** step;
    mote.vy = mote.vy * AIR_Y ** step + GRAVITY * step;
    mote.x += mote.vx * step + Math.sin(mote.age * mote.sway * 3 + mote.phase) * mote.swayReach * step;
    mote.y += mote.vy * step;

    const progress = mote.age / mote.life;
    const fade = progress < 0.08 ? progress / 0.08 : 1 - progress ** 1.6;
    const alpha = Math.max(0, fade * (0.45 + 0.55 * Math.abs(Math.sin(mote.age * mote.twinkle + mote.phase))));
    const radius = mote.size * (1 - 0.35 * progress);

    const glow = context.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, radius * 4.5);
    glow.addColorStop(0, mote.colour);
    glow.addColorStop(1, "transparent");
    context.globalAlpha = alpha * HALO_ALPHA;
    context.fillStyle = glow;
    context.beginPath();
    context.arc(mote.x, mote.y, radius * 4.5, 0, 2 * Math.PI);
    context.fill();

    context.globalAlpha = alpha * MOTE_ALPHA;
    context.fillStyle = mote.colour;
    if (mote.star) sparkle(mote.x, mote.y, radius * 1.9, mote.age * 1.5);
    else {
      context.beginPath();
      context.arc(mote.x, mote.y, radius * 0.7, 0, 2 * Math.PI);
      context.fill();
    }
    return true;
  }

  /** A seed: a dark stalk with its fruit hanging under a fan of white rays, their tips tinged. */
  function drawSeed(seed: Seed, step: number) {
    seed.age += step;
    if (seed.age > seed.life) return false;
    seed.vx *= SEED_AIR_X ** step;
    seed.vy = seed.vy * SEED_AIR_Y ** step - SEED_LIFT * step;
    seed.x += seed.vx * step + Math.sin(seed.age * 1.3 + seed.phase) * 14 * step;
    seed.y += seed.vy * step;
    seed.angle += seed.spin * step;

    const progress = seed.age / seed.life;
    const alpha = (progress < 0.1 ? progress / 0.1 : 1 - progress ** 2) * 0.85;
    context.save();
    context.translate(seed.x, seed.y);
    context.rotate(seed.angle);
    context.globalAlpha = alpha;
    context.lineWidth = 0.8;
    context.strokeStyle = "rgb(15 28 23 / 0.35)";
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, seed.stalk);
    context.stroke();
    context.fillStyle = "rgb(15 28 23 / 0.45)";
    context.beginPath();
    context.ellipse(0, seed.stalk, 1.2, 2.2, 0, 0, 2 * Math.PI);
    context.fill();

    context.lineWidth = 0.7;
    context.strokeStyle = "rgb(255 255 255 / 0.95)";
    for (let ray = 0; ray < SEED_RAYS; ray++) {
      const angle = -Math.PI / 2 + (ray / (SEED_RAYS - 1) - 0.5) * SEED_FAN;
      context.beginPath();
      context.moveTo(0, 0);
      context.quadraticCurveTo(
        Math.cos(angle) * seed.reach * 0.5,
        Math.sin(angle) * seed.reach * 0.5 - 2,
        Math.cos(angle) * seed.reach,
        Math.sin(angle) * seed.reach,
      );
      context.stroke();
    }
    context.globalAlpha = alpha * 0.55;
    context.strokeStyle = seed.tint;
    for (let ray = 0; ray < SEED_RAYS; ray += 2) {
      const angle = -Math.PI / 2 + (ray / (SEED_RAYS - 1) - 0.5) * SEED_FAN;
      context.beginPath();
      context.moveTo(Math.cos(angle) * seed.reach * 0.55, Math.sin(angle) * seed.reach * 0.55);
      context.lineTo(Math.cos(angle) * seed.reach, Math.sin(angle) * seed.reach);
      context.stroke();
    }
    context.restore();
    return true;
  }

  function frame(now: number) {
    const step = Math.min(0.05, (now - last) / 1000);
    last = now;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    // Dust glows (adds light); down is laid on top, white and dark, which reads on a light ground.
    context.globalCompositeOperation = "lighter";
    motes = motes.filter((mote) => drawMote(mote, step));
    context.globalCompositeOperation = "source-over";
    seeds = seeds.filter((seed) => drawSeed(seed, step));
    context.globalAlpha = 1;
    frameId = motes.length || seeds.length ? requestAnimationFrame(frame) : 0;
    if (!frameId) context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function run() {
    if (frameId) return;
    fitCanvas();
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  }

  return {
    sprinkle(x, y, count, colours, kind = "pinch") {
      const burst = kind === "pinch";
      for (let index = 0; index < count; index++) {
        const angle = between(0, 2 * Math.PI);
        const speed = burst ? between(20, 95) : between(5, 30);
        const star = burst && Math.random() < STAR_SHARE;
        motes.push({
          x: x + between(-4, 4),
          y: y + between(-4, 4),
          vx: Math.cos(angle) * speed,
          // A pinch lifts a little before it settles.
          vy: Math.sin(angle) * speed - (burst ? between(10, 45) : 0),
          age: 0,
          life: between(1.4, 2.6),
          size: star ? between(1.8, 2.8) : between(1, 2.6),
          star,
          colour: colours[Math.floor(Math.random() * colours.length)],
          twinkle: between(6, 14),
          phase: between(0, 2 * Math.PI),
          sway: between(0.8, 1.8),
          swayReach: between(6, 16),
        });
      }
      run();
    },
    release(x, y, count, tints, { vx = 0, vy = 0, spread = 1, life = 1 } = {}) {
      for (let index = 0; index < count; index++) {
        // Loosened seeds scatter upwards and to the sides, then go where the wind takes them.
        const angle = between(-Math.PI, 0);
        const speed = between(20, 55) * spread;
        seeds.push({
          x: x + between(-3, 3),
          y: y + between(-3, 3),
          vx: vx + Math.cos(angle) * speed,
          vy: vy + Math.sin(angle) * speed - 10,
          age: 0,
          life: between(2.4, 3.4) * life,
          angle: between(-0.6, 0.6),
          spin: between(-0.5, 0.5),
          reach: between(9, 13),
          stalk: between(8, 12),
          tint: tints[index % tints.length],
          phase: between(0, 2 * Math.PI),
        });
      }
      run();
    },
    blow(x, y, vx, vy) {
      for (const seed of seeds) {
        const distance = Math.hypot(seed.x - x, seed.y - y);
        if (distance > WIND_REACH) continue;
        const strength = (1 - distance / WIND_REACH) * WIND_SHARE;
        seed.vx += vx * strength;
        seed.vy += vy * strength;
      }
    },
    stop() {
      cancelAnimationFrame(frameId);
      frameId = 0;
      motes = [];
      seeds = [];
    },
  };
}
