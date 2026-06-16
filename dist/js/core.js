// ============================================================
// FATEBOUND — core: constants, math, RNG, iso projection, input
// ============================================================
const TILE_HW = 32, TILE_HH = 16, WALL_H = 46;
const ZOOM = 1.65; // camera zoom: world is rendered scaled around screen center
const CHAR_SCALE = 1.5; // characters/monsters drawn larger than world-px for visual detail

// Global game state (filled by game.js)
const STATE = {
  screen: 'menu',        // 'menu' | 'game' | 'death'
  paused: false,
  time: 0,
  floor: 0,
  map: null,
  player: null,
  enemies: [],
  projectiles: [],
  pickups: [],
  particles: [],
  floaters: [],
  fxLines: [],
  meta: null,            // persistent meta progression
  run: null,             // current run info {seed, maxFloor, kills, gold earned}
  cam: { x: 0, y: 0 },
  shake: 0,
  nearInteract: null,
};
const VIEW = { w: 1280, h: 720 };

// ---------- RNG ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const rf = (r, a, b) => a + r() * (b - a);
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
// Convenience using Math.random (gameplay rolls)
const mri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const mrf = (a, b) => a + Math.random() * (b - a);
const mpick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- math ----------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
function angDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
// deterministic 2d hash noise 0..1 (tile shading)
function hash2(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------- isometric projection ----------
function worldToScreen(wx, wy) {
  const cx = (STATE.cam.x - STATE.cam.y) * TILE_HW;
  const cy = (STATE.cam.x + STATE.cam.y) * TILE_HH;
  return {
    x: (wx - wy) * TILE_HW - cx + VIEW.w / 2,
    y: (wx + wy) * TILE_HH - cy + VIEW.h / 2,
  };
}
function screenToWorld(sx, sy) {
  // un-zoom first: screen px -> world-pass px
  const ux = VIEW.w / 2 + (sx - VIEW.w / 2) / ZOOM;
  const uy = VIEW.h / 2 + (sy - VIEW.h / 2) / ZOOM;
  const cx = (STATE.cam.x - STATE.cam.y) * TILE_HW;
  const cy = (STATE.cam.x + STATE.cam.y) * TILE_HH;
  const ox = ux - VIEW.w / 2 + cx;
  const oy = uy - VIEW.h / 2 + cy;
  return {
    x: (ox / TILE_HW + oy / TILE_HH) / 2,
    y: (oy / TILE_HH - ox / TILE_HW) / 2,
  };
}
// world -> final (zoomed) screen px, for passes drawn outside the world transform
function worldToScreenZ(wx, wy) {
  const s = worldToScreen(wx, wy);
  return {
    x: VIEW.w / 2 + (s.x - VIEW.w / 2) * ZOOM,
    y: VIEW.h / 2 + (s.y - VIEW.h / 2) * ZOOM,
  };
}
// world-space angle -> screen-space angle (for drawing aimed things)
function worldAngToScreen(a) {
  const dx = Math.cos(a), dy = Math.sin(a);
  return Math.atan2((dx + dy) * 0.5, dx - dy);
}

// ---------- map collision ----------
// tiles: 0 void(solid) 1 floor 2 wall(solid) 3 stairs(walkable)
function tileAt(map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return 0;
  return map.tiles[ty * map.w + tx];
}
function isSolidTile(map, tx, ty) {
  const t = tileAt(map, tx, ty);
  return t === 0 || t === 2;
}
function circleHitsSolid(map, x, y, r) {
  const x0 = Math.floor(x - r), x1 = Math.floor(x + r);
  const y0 = Math.floor(y - r), y1 = Math.floor(y + r);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!isSolidTile(map, tx, ty)) continue;
    const nx = clamp(x, tx, tx + 1), ny = clamp(y, ty, ty + 1);
    if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < r * r) return true;
  }
  return false;
}
function moveCircle(map, e, dx, dy, phase) {
  if (phase) { e.x += dx; e.y += dy; return; }
  e.x += dx;
  if (circleHitsSolid(map, e.x, e.y, e.r)) e.x -= dx;
  e.y += dy;
  if (circleHitsSolid(map, e.x, e.y, e.r)) e.y -= dy;
}
function losClear(map, x0, y0, x1, y1) {
  const d = dist(x0, y0, x1, y1);
  const steps = Math.max(1, Math.ceil(d / 0.3));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isSolidTile(map, Math.floor(lerp(x0, x1, t)), Math.floor(lerp(y0, y1, t)))) return false;
  }
  return true;
}

// ---------- input ----------
const Input = { keys: {}, pressed: {}, mouse: { x: 0, y: 0, lmb: false, rmb: false } };
function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (!Input.keys[k]) Input.pressed[k] = true;
    Input.keys[k] = true;
    if ([' ', 'tab'].includes(k)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { Input.keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { Input.keys = {}; Input.mouse.lmb = false; Input.mouse.rmb = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) Input.mouse.lmb = true;
    if (e.button === 2) Input.mouse.rmb = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) Input.mouse.lmb = false;
    if (e.button === 2) Input.mouse.rmb = false;
  });
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    Input.mouse.x = e.clientX - rect.left;
    Input.mouse.y = e.clientY - rect.top;
  });
}
function consumePressed(k) {
  if (Input.pressed[k]) { delete Input.pressed[k]; return true; }
  return false;
}

// ---------- fx helpers ----------
function addFloater(x, y, txt, color, big) {
  STATE.floaters.push({ x, y, txt, color: color || '#fff', t: 0, life: big ? 1.4 : 0.9, big: !!big });
}
function addParticles(x, y, n, color, spd, size, grav) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = mrf(0.3, 1) * (spd || 3);
    STATE.particles.push({
      x, y, z: mrf(8, 22),
      vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: mrf(20, 70),
      t: 0, life: mrf(0.3, 0.7), color, size: size || 3, grav: grav !== false,
    });
  }
}
function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : Math.round(n); }

// dev error trap — surfaces runtime errors on screen
window.addEventListener('error', (e) => {
  let el = document.getElementById('err-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'err-overlay';
    el.style.cssText = 'position:fixed;top:70px;left:10px;z-index:999;background:rgba(120,20,20,0.92);color:#fff;font:12px monospace;padding:8px 10px;max-width:600px;white-space:pre-wrap;border-radius:6px;';
    document.body.appendChild(el);
  }
  const msg = `${e.message} @ ${(e.filename || '').split('/').pop()}:${e.lineno}`;
  if (!el.textContent.includes(msg)) el.textContent += msg + '\n';
});
