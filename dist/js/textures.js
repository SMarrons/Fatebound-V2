// ============================================================
// FATEBOUND — textures: procedural baked surfaces & sprites
// Everything here bakes ONCE to offscreen canvases, so the
// per-frame cost of all this grit is just drawImage blits.
// ============================================================

const _TT = { themes: {}, fx: null };

// ---------- color helpers ----------
function _hx(hex) { const n = parseInt(hex.slice(1), 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 }; }
function _cs(c, a) { return `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a == null ? 1 : a})`; }
function _sh(c, amt) { return { r: clamp(c.r + amt, 0, 255), g: clamp(c.g + amt, 0, 255), b: clamp(c.b + amt, 0, 255) }; }
function _mx(a, b, t) { return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) }; }
function _cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// per-pixel grain over painted pixels only
function _grain(cv, rng, amt) {
  const ctx = cv.getContext('2d');
  const id = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (rng() - 0.5) * 2 * amt;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(id, 0, 0);
}

function _diamondClip(ctx, w, h) {
  ctx.beginPath();
  ctx.moveTo(w / 2, 0); ctx.lineTo(w, h / 2); ctx.lineTo(w / 2, h); ctx.lineTo(0, h / 2);
  ctx.closePath();
}

function _blotches(ctx, rng, w, h, n, dark, light) {
  for (let i = 0; i < n; i++) {
    const x = rng() * w, y = rng() * h, r = (8 + rng() * 22);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const darker = rng() < 0.6;
    g.addColorStop(0, darker ? `rgba(0,0,0,${dark * (0.5 + rng() * 0.5)})` : `rgba(255,235,210,${light * (0.4 + rng() * 0.6)})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function _crack(ctx, rng, x0, y0, x1, y1) {
  const segs = 4 + (rng() * 3 | 0);
  const pts = [[x0, y0]];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    pts.push([lerp(x0, x1, t) + (rng() - 0.5) * 7, lerp(y0, y1, t) + (rng() - 0.5) * 5]);
  }
  pts.push([x1, y1]);
  ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,220,0.10)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1] + 1.4);
  for (const p of pts) ctx.lineTo(p[0], p[1] + 1.4);
  ctx.stroke();
}

function _pebble(ctx, rng, x, y, r, base) {
  ctx.fillStyle = _cs(_sh(base, -18 + rng() * 14));
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.62, rng() * 3, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,215,0.12)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.3, 0, 0, 7); ctx.fill();
}

// ---------- theme style table ----------
const TEXTURE_STYLES = {
  town:      { floor: 'earth', wall: 'earth', fog: 'rgba(214,176,130,1)' },
  sanctuary: { floor: 'earth', wall: 'earth', fog: 'rgba(220,186,140,1)' },
  halls:     { floor: 'flag',  wall: 'brick', fog: 'rgba(170,160,150,1)' },
  caves:     { floor: 'rock',  wall: 'rock',  fog: 'rgba(168,140,104,1)' },
  crypt:     { floor: 'crypt', wall: 'block', fog: 'rgba(130,170,180,1)' },
};

// ---------- floor tiles (baked at 2x: 128x64) ----------
function _bakeFloor(styleKey, theme, rng, variant) {
  const W = 128, H = 64;
  const cv = _cv(W, H), ctx = cv.getContext('2d');
  const base = _mx(_hx(theme.floorA), _hx(theme.floorB), rng());
  ctx.save();
  _diamondClip(ctx, W, H); ctx.clip();
  ctx.fillStyle = _cs(base); ctx.fillRect(0, 0, W, H);
  _blotches(ctx, rng, W, H, 9, 0.16, 0.07);

  switch (styleKey) {
    case 'flag': { // cut flagstone — iso mortar seams
      ctx.lineCap = 'round';
      const seam = (slope, c) => {
        ctx.strokeStyle = 'rgba(0,0,0,0.40)'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(-20, slope * -20 + c); ctx.lineTo(150, slope * 150 + c); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,240,215,0.10)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-20, slope * -20 + c + 2); ctx.lineTo(150, slope * 150 + c + 2); ctx.stroke();
      };
      if (rng() < 0.85) seam(0.5, -32 + (-16 + rng() * 32));
      if (rng() < 0.55) seam(0.5, -32 + (-26 + rng() * 52));
      if (rng() < 0.85) seam(-0.5, 64 + (-16 + rng() * 32));
      for (let i = 0; i < 3; i++) { // chips
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath(); ctx.arc(20 + rng() * 88, 10 + rng() * 44, 1 + rng() * 2, 0, 7); ctx.fill();
      }
      if (rng() < 0.3) _crack(ctx, rng, 30 + rng() * 30, 12 + rng() * 14, 70 + rng() * 30, 34 + rng() * 18);
      break;
    }
    case 'rock': { // rough cavern floor
      _blotches(ctx, rng, W, H, 10, 0.2, 0.06);
      for (let i = 0; i < 7; i++) _pebble(ctx, rng, 16 + rng() * 96, 8 + rng() * 48, 1.5 + rng() * 3, base);
      if (rng() < 0.6) _crack(ctx, rng, 20 + rng() * 30, 14 + rng() * 12, 70 + rng() * 40, 30 + rng() * 24);
      if (rng() < 0.35) _crack(ctx, rng, 50 + rng() * 40, 8 + rng() * 10, 40 + rng() * 30, 40 + rng() * 16);
      break;
    }
    case 'crypt': { // bordered flagstone, moss, damp
      ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(64, 5); ctx.lineTo(118, 32); ctx.lineTo(64, 59); ctx.lineTo(10, 32);
      ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = 'rgba(220,240,255,0.07)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(64, 8); ctx.lineTo(112, 32); ctx.lineTo(64, 56); ctx.lineTo(16, 32);
      ctx.closePath(); ctx.stroke();
      const moss = { r: 74, g: 96, b: 62 };
      for (let i = 0; i < 3; i++) {
        if (rng() < 0.65) {
          const x = 20 + rng() * 88, y = 10 + rng() * 44, r = 4 + rng() * 9;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, _cs(moss, 0.30 + rng() * 0.2));
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
      }
      const g2 = ctx.createRadialGradient(64, 32, 2, 64, 32, 40);
      g2.addColorStop(0, 'rgba(190,220,235,0.05)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      if (rng() < 0.4) _crack(ctx, rng, 34 + rng() * 20, 16 + rng() * 10, 78 + rng() * 22, 36 + rng() * 14);
      break;
    }
    case 'earth': { // packed dirt
      for (let i = 0; i < 9; i++) {
        ctx.strokeStyle = rng() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(235,205,160,0.08)';
        ctx.lineWidth = 1 + rng() * 1.6;
        const x = 14 + rng() * 90, y = 8 + rng() * 46;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 6 + rng() * 10, y + (rng() - 0.5) * 6, x + 14 + rng() * 14, y + (rng() - 0.5) * 8);
        ctx.stroke();
      }
      for (let i = 0; i < 4; i++) _pebble(ctx, rng, 16 + rng() * 96, 8 + rng() * 48, 1 + rng() * 2.2, base);
      break;
    }
  }
  ctx.restore();
  _grain(cv, rng, styleKey === 'rock' ? 13 : 9);
  // soft edge shade so tiles read as separate stones
  ctx.save();
  _diamondClip(ctx, W, H); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 2.4;
  _diamondClip(ctx, W, H); ctx.stroke();
  ctx.restore();
  return cv;
}

// ---------- wall faces (baked at 2x: 64x92, mapped to 32x46 face) ----------
function _bakeWallFace(styleKey, theme, rng, baseHex) {
  const W = 64, H = WALL_H * 2;
  const cv = _cv(W, H), ctx = cv.getContext('2d');
  const base = _hx(baseHex);
  ctx.fillStyle = _cs(_sh(base, -10)); ctx.fillRect(0, 0, W, H); // mortar/under

  switch (styleKey) {
    case 'brick': {
      const courseH = 18, brickW = 30;
      for (let row = 0, y = 0; y < H; row++, y += courseH) {
        const off = row % 2 ? brickW / 2 : 0;
        for (let x = -off; x < W; x += brickW) {
          const c = _sh(base, -8 + rng() * 18);
          ctx.fillStyle = _cs(c);
          ctx.fillRect(x + 1.5, y + 1.5, brickW - 3, courseH - 3);
          ctx.fillStyle = 'rgba(255,235,205,0.07)';
          ctx.fillRect(x + 1.5, y + 1.5, brickW - 3, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(x + 1.5, y + courseH - 4, brickW - 3, 2.5);
          if (rng() < 0.16) { // chipped corner
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.arc(x + 2 + rng() * (brickW - 4), y + 2 + rng() * (courseH - 4), 1.4 + rng() * 1.8, 0, 7); ctx.fill();
          }
        }
      }
      if (rng() < 0.7) _crack(ctx, rng, 8 + rng() * 30, 4, 20 + rng() * 36, H - 8);
      break;
    }
    case 'rock': {
      let yb = 0;
      for (let band = 0; yb < H; band++) {
        const bh = 14 + rng() * 14;
        const c = _sh(base, -10 + rng() * 20);
        ctx.fillStyle = _cs(c);
        ctx.beginPath();
        ctx.moveTo(0, yb);
        for (let x = 0; x <= W; x += 8) ctx.lineTo(x, yb + Math.sin(x * 0.18 + band * 2.4) * 3);
        ctx.lineTo(W, yb + bh + 6); ctx.lineTo(0, yb + bh + 6);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 8) {
          const yy = yb + Math.sin(x * 0.18 + band * 2.4) * 3;
          x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
        yb += bh;
      }
      for (let i = 0; i < 5; i++) _pebble(ctx, rng, rng() * W, rng() * H, 1.6 + rng() * 2.6, base);
      if (rng() < 0.8) _crack(ctx, rng, 10 + rng() * 40, 2, 14 + rng() * 40, H - 4);
      break;
    }
    case 'block': {
      const courseH = 44, blockW = 60;
      for (let row = 0, y = -8; y < H; row++, y += courseH) {
        const off = row % 2 ? blockW / 2 : 0;
        for (let x = -off; x < W; x += blockW) {
          ctx.fillStyle = _cs(_sh(base, -6 + rng() * 14));
          ctx.fillRect(x + 2, y + 2, blockW - 4, courseH - 4);
          ctx.fillStyle = 'rgba(210,235,250,0.05)';
          ctx.fillRect(x + 2, y + 2, blockW - 4, 3);
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(x + 2, y + courseH - 5, blockW - 4, 3);
        }
      }
      // moss drips from the top
      const moss = { r: 70, g: 92, b: 60 };
      for (let i = 0; i < 5; i++) {
        if (rng() < 0.75) {
          const x = rng() * W, len = 8 + rng() * 36, w = 2.5 + rng() * 4;
          const g = ctx.createLinearGradient(0, 0, 0, len);
          g.addColorStop(0, _cs(moss, 0.4)); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - w / 2, 0, w, len);
        }
      }
      // damp sheen at the base
      const g2 = ctx.createLinearGradient(0, H - 26, 0, H);
      g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(150,200,220,0.10)');
      ctx.fillStyle = g2; ctx.fillRect(0, H - 26, W, 26);
      break;
    }
    case 'earth': {
      _blotches(ctx, rng, W, H, 10, 0.18, 0.07);
      for (let i = 0; i < 6; i++) _pebble(ctx, rng, rng() * W, rng() * H, 2 + rng() * 3.4, base);
      // root tendrils
      ctx.strokeStyle = 'rgba(40,28,16,0.4)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        if (rng() < 0.7) {
          const x = rng() * W;
          ctx.beginPath(); ctx.moveTo(x, 0);
          ctx.quadraticCurveTo(x + (rng() - 0.5) * 16, 14 + rng() * 10, x + (rng() - 0.5) * 22, 26 + rng() * 22);
          ctx.stroke();
        }
      }
      break;
    }
  }
  // base AO + top light
  const ao = ctx.createLinearGradient(0, 0, 0, H);
  ao.addColorStop(0, 'rgba(255,240,215,0.06)');
  ao.addColorStop(0.55, 'rgba(0,0,0,0)');
  ao.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = ao; ctx.fillRect(0, 0, W, H);
  _grain(cv, rng, 11);
  return cv;
}

// ---------- wall top (diamond 128x64) ----------
function _bakeWallTop(theme, rng, variant) {
  const W = 128, H = 64;
  const cv = _cv(W, H), ctx = cv.getContext('2d');
  const base = _hx(theme.wallTop);
  ctx.save();
  _diamondClip(ctx, W, H); ctx.clip();
  ctx.fillStyle = _cs(_sh(base, variant ? -7 : 0)); ctx.fillRect(0, 0, W, H);
  _blotches(ctx, rng, W, H, 7, 0.16, 0.06);
  for (let i = 0; i < 4; i++) _pebble(ctx, rng, 20 + rng() * 88, 10 + rng() * 44, 1.2 + rng() * 2.4, base);
  if (rng() < 0.4) _crack(ctx, rng, 30 + rng() * 30, 14 + rng() * 12, 74 + rng() * 28, 32 + rng() * 18);
  ctx.restore();
  _grain(cv, rng, 10);
  ctx.save();
  _diamondClip(ctx, W, H); ctx.clip();
  // catch light on the south-facing edges of the cap
  ctx.strokeStyle = 'rgba(255,240,210,0.13)'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(64, 64); ctx.lineTo(128, 32); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2;
  _diamondClip(ctx, W, H); ctx.stroke();
  ctx.restore();
  return cv;
}

// ---------- fog blob sheet ----------
function _bakeFog(tint) {
  const W = 360, H = 200;
  const cv = _cv(W, H), ctx = cv.getContext('2d');
  const rng = mulberry32(99);
  const m = tint.match(/[\d.]+/g) || ['200', '200', '200'];
  const c = `${m[0]},${m[1]},${m[2]},`;
  for (let i = 0; i < 11; i++) {
    const x = rng() * W, y = rng() * H, r = 36 + rng() * 64;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c}${0.16 + rng() * 0.16})`);
    g.addColorStop(1, `rgba(${c}0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return cv;
}

// ---------- per-theme bundle ----------
function themeTex(key) {
  if (_TT.themes[key]) return _TT.themes[key];
  const theme = THEMES[key], style = TEXTURE_STYLES[key] || TEXTURE_STYLES.halls;
  const rng = mulberry32(0xBEEF ^ key.length * 7919 ^ key.charCodeAt(0) * 131);
  const t = {
    floors: [], tops: [],
    wallL: _bakeWallFace(style.wall, theme, rng, theme.wallSide2),
    wallR: _bakeWallFace(style.wall, theme, rng, theme.wallSide),
    fog: _bakeFog(style.fog),
  };
  for (let i = 0; i < 5; i++) t.floors.push(_bakeFloor(style.floor, theme, rng, i));
  t.tops.push(_bakeWallTop(theme, rng, 0), _bakeWallTop(theme, rng, 1));
  return (_TT.themes[key] = t);
}

// ---------- shared fx sprites (decals, blood, grain, AO) ----------
function _bakeDecal(type, rng) {
  const cv = _cv(56, 36), ctx = cv.getContext('2d');
  const cx = 28, cy = 18;
  switch (type) {
    case 'bones': {
      ctx.strokeStyle = 'rgba(208,198,176,0.75)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = rng() * Math.PI, l = 6 + rng() * 7;
        const x = cx + (rng() - 0.5) * 26, y = cy + (rng() - 0.5) * 14;
        ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l * 0.5);
        ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.5); ctx.stroke();
        ctx.fillStyle = 'rgba(208,198,176,0.75)';
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.5, 1.8, 0, 7); ctx.fill();
      }
      if (rng() < 0.5) { // skull
        ctx.fillStyle = 'rgba(214,204,182,0.85)';
        ctx.beginPath(); ctx.ellipse(cx + 6, cy - 2, 4.5, 3.6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(20,14,10,0.9)';
        ctx.beginPath(); ctx.arc(cx + 4.5, cy - 2.5, 1.1, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 8, cy - 2.5, 1.1, 0, 7); ctx.fill();
      }
      break;
    }
    case 'rubble': {
      const base = { r: 110, g: 102, b: 92 };
      for (let i = 0; i < 6; i++)
        _pebble(ctx, rng, cx + (rng() - 0.5) * 30, cy + (rng() - 0.5) * 16, 1.4 + rng() * 2.8, base);
      break;
    }
    case 'puddle': {
      ctx.fillStyle = 'rgba(8,12,18,0.45)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 16, 7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(8,12,18,0.35)';
      ctx.beginPath(); ctx.ellipse(cx + 10, cy + 4, 6, 2.6, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(170,210,235,0.20)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx - 3, cy - 1.5, 8, 3, 0, 0, 7); ctx.stroke();
      break;
    }
    case 'moss': {
      for (let i = 0; i < 6; i++) {
        const x = cx + (rng() - 0.5) * 30, y = cy + (rng() - 0.5) * 16, r = 3 + rng() * 6;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${66 + rng() * 22 | 0},${92 + rng() * 22 | 0},58,${0.3 + rng() * 0.25})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      break;
    }
    case 'mushroom': {
      for (let i = 0; i < 3; i++) {
        const x = cx + (rng() - 0.5) * 22, y = cy + (rng() - 0.5) * 12, r = 2 + rng() * 2;
        const glow = ctx.createRadialGradient(x, y - r, 0, x, y - r, r * 4);
        glow.addColorStop(0, 'rgba(140,220,255,0.22)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow; ctx.fillRect(x - r * 4, y - r * 5, r * 8, r * 8);
        ctx.fillStyle = '#3d3328';
        ctx.fillRect(x - 0.8, y - r - 1, 1.6, r + 1);
        ctx.fillStyle = `rgba(${120 + rng() * 40 | 0},${190 + rng() * 40 | 0},235,0.9)`;
        ctx.beginPath(); ctx.ellipse(x, y - r - 1, r, r * 0.65, 0, Math.PI, 0); ctx.fill();
      }
      break;
    }
  }
  return cv;
}

function _bakeSplat(rng, col) {
  const cv = _cv(64, 40), ctx = cv.getContext('2d');
  const cx = 32, cy = 20;
  for (let i = 0; i < 8; i++) {
    const a = rng() * Math.PI * 2, d = rng() * rng() * 14;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.5;
    const r = i < 3 ? 5 + rng() * 7 : 1 + rng() * 3;
    ctx.fillStyle = `rgba(${col},${0.4 + rng() * 0.35})`;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, rng() * 3, 0, 7); ctx.fill();
  }
  // streaks
  for (let i = 0; i < 3; i++) {
    const a = rng() * Math.PI * 2;
    ctx.strokeStyle = `rgba(${col},${0.35 + rng() * 0.2})`;
    ctx.lineWidth = 1.2 + rng() * 1.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * (10 + rng() * 14), cy + Math.sin(a) * (5 + rng() * 7));
    ctx.stroke();
  }
  return cv;
}

function fxTex() {
  if (_TT.fx) return _TT.fx;
  const rng = mulberry32(0xF00D);
  const fx = { decals: {}, blood: [], ichor: [], ao: {}, grain: null };
  for (const t of ['bones', 'rubble', 'puddle', 'moss', 'mushroom'])
    fx.decals[t] = [_bakeDecal(t, rng), _bakeDecal(t, rng), _bakeDecal(t, rng)];
  for (let i = 0; i < 4; i++) fx.blood.push(_bakeSplat(rng, '118,16,12'));
  for (let i = 0; i < 3; i++) fx.ichor.push(_bakeSplat(rng, '52,72,30'));

  // AO edge overlays (1x tile: 64x32); keys = world-neighbor direction
  const edges = {
    n: [[32, 0], [64, 16]],  // neighbor (x, y-1)
    e: [[64, 16], [32, 32]], // neighbor (x+1, y)
    s: [[32, 32], [0, 16]],  // neighbor (x, y+1)
    w: [[0, 16], [32, 0]],   // neighbor (x-1, y)
  };
  for (const k in edges) {
    const cv = _cv(64, 32), ctx = cv.getContext('2d');
    const [[x0, y0], [x1, y1]] = edges[k];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    let nx = 32 - mx, ny = 16 - my;
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const depth = (k === 'n' || k === 'w') ? 17 : 11;
    const a = (k === 'n' || k === 'w') ? 0.34 : 0.20;
    const g = ctx.createLinearGradient(mx, my, mx + nx * depth, my + ny * depth);
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); _diamondClip(ctx, 64, 32); ctx.clip();
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 32);
    ctx.restore();
    fx.ao[k] = cv;
  }

  // film grain tile
  const g = _cv(192, 192), gx = g.getContext('2d');
  const id = gx.createImageData(192, 192);
  const grng = mulberry32(0xA11CE);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 110 + grng() * 70;
    id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = 255;
  }
  gx.putImageData(id, 0, 0);
  fx.grain = g;
  return (_TT.fx = fx);
}
