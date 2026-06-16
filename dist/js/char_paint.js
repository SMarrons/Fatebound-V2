// ============================================================
// FATEBOUND — char_paint: shared painterly helpers for models
// Multi-tone shading, texture marks, grounding. Deterministic
// detail uses hash2 so it's stable frame to frame.
// ============================================================

// crisp contact occlusion under feet (on top of the soft shadow)
function groundContact(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x, y + 1, 0, x, y + 1, r);
  g.addColorStop(0, 'rgba(0,0,0,0.42)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.18)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y + 1, r, r * 0.4, 0, 0, 7); ctx.fill();
}

// mottled skin/bone/cloth: deterministic specks in a region
function mottle(ctx, cx, cy, rx, ry, seed, n, dark, light, dr) {
  for (let i = 0; i < n; i++) {
    const h1 = hash2(seed + i * 7, seed * 3 + i), h2 = hash2(i * 13 + seed, seed + i * 31);
    const a = h1 * Math.PI * 2, d = Math.sqrt(h2);
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    const r = (dr || 0.8) + hash2(seed * 5 + i, i) * (dr || 0.8);
    ctx.fillStyle = hash2(i, seed) < 0.6 ? dark : light;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
}

// short directional strokes: fur, hair, bristle
function furPatch(ctx, cx, cy, rx, ry, seed, n, ang, len, color, lw) {
  ctx.strokeStyle = color; ctx.lineWidth = lw || 0.8; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const h1 = hash2(seed + i * 11, seed * 7 + i), h2 = hash2(i * 17 + seed, seed * 5 + i * 3);
    const a = h1 * Math.PI * 2, d = Math.sqrt(h2);
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    const fa2 = ang + (h2 - 0.5) * 0.9;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(fa2) * len, y + Math.sin(fa2) * len);
    ctx.stroke();
  }
}

// battle damage: scratches across an armor surface
function scratches(ctx, cx, cy, rx, ry, seed, n, dark, light) {
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const h1 = hash2(seed + i * 19, i * 3 + seed), h2 = hash2(seed * 9 + i, i * 23);
    const x = cx + (h1 - 0.5) * rx * 2, y = cy + (h2 - 0.5) * ry * 2;
    const a = hash2(i, seed + 4) * Math.PI, l = 1.4 + hash2(seed, i) * 2.6;
    ctx.strokeStyle = dark; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    ctx.strokeStyle = light; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l + 0.7);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l + 0.7); ctx.stroke();
  }
}

// specular gleam arc (chitin / polished metal)
function gleam(ctx, cx, cy, r, a0, a1, alpha, w) {
  ctx.strokeStyle = `rgba(255,250,240,${alpha == null ? 0.4 : alpha})`;
  ctx.lineWidth = w || 1.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
}

// core shadow: dark underside band on a rounded form
function coreShadow(ctx, cx, cy, rx, ry, color) {
  const g = ctx.createRadialGradient(cx, cy - ry * 0.6, ry * 0.2, cx, cy, Math.max(rx, ry) * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.72, 'rgba(0,0,0,0)');
  g.addColorStop(1, color || 'rgba(0,0,0,0.34)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
}
