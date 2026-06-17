// ============================================================
// FATEBOUND — char_monsters: detailed monster models (part 1)
// Dispatch registry + rat, skeleton, archer, spider, brute.
// Part 2 (char_monsters2.js) adds shaman, wraith, knight, corpses.
// ============================================================

const GORE_STYLE = {
  rat:      { kind: 'blood', body: '#4e3d2c' },
  skeleton: { kind: 'bone' },
  archer:   { kind: 'bone' },
  spider:   { kind: 'ichor', body: '#251d16' },
  brute:    { kind: 'blood', body: '#42531f' },
  shaman:   { kind: 'blood', body: '#324a36' },
  wraith:   { kind: 'mist' },
  knight:   { kind: 'blood', body: '#474f57' },
};
const GORE_PARTICLE = {
  rat: '#9c1f16', skeleton: '#d8d0bc', archer: '#d8d0bc', spider: '#5e7a32',
  brute: '#9c1f16', shaman: '#9c1f16', wraith: '#9fd4e8', knight: '#9c1f16',
};

const MONSTER_DRAW = {};

function drawEnemy(ctx, e) {
  const s = worldToScreen(e.x, e.y);
  const t = STATE.time + (e.t || 0);
  const lunge = e.lungeT ? Math.sin((1 - e.lungeT / 0.2) * Math.PI) * 6 : 0;
  const fa = worldAngToScreen(e.dir || 0);
  const lx = Math.cos(fa) * lunge, ly = Math.sin(fa) * lunge;
  const indiv = e.sizeVar || 1;                          // stable per-individual size variety
  const sc = e.def.scale * (e.boss ? 1.62 : e.elite ? 1.25 : 1) * 1.12 * indiv; // looming DA presence
  ctx.save();
  ctx.translate(s.x + lx, s.y + ly * 0.5);
  shadow(ctx, { x: 0, y: 0 }, 11 * sc);
  groundContact(ctx, 0, 0, 6.5 * sc);
  if (e.elite) { // elite aura tinted by its power
    const mc = (typeof ELITE_MOD_INFO !== 'undefined' && ELITE_MOD_INFO[e.eliteMod]) ? ELITE_MOD_INFO[e.eliteMod].color : '#ff9c4a';
    const g = ctx.createRadialGradient(0, -12, 2, 0, -12, 28);
    g.addColorStop(0, hexA(mc, 0.14 + Math.sin(t * 4) * 0.05));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-28, -42, 56, 56);
  }
  ctx.scale(sc, sc);
  const hurt = e.hurtT > 0;
  const seed = ((e.t || 0) * 97) | 0; // per-individual detail variation
  const h = {
    t, fa, hurt, seed,
    fx: Math.cos(fa), fy: Math.sin(fa),
    aggro: !!e.aggro,
    tint: (c) => hurt ? '#ffffff' : c,
    grad: (y0, y1, c, lt, dk) => hurt ? '#ffffff' : vGrad(ctx, y0, y1, c, lt, dk),
    outline: (w) => { ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = w || 1.2; ctx.stroke(); },
    rim: (px, py, r, a0, a1) => { // top-left rim light
      if (hurt) return;
      ctx.strokeStyle = 'rgba(255,238,210,0.30)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(px, py, r, a0 == null ? Math.PI * 1.05 : a0, a1 == null ? Math.PI * 1.65 : a1); ctx.stroke();
    },
  };
  const fn = MONSTER_DRAW[e.type];
  if (fn) fn(ctx, e, h);
  ctx.restore();

  if (e.elite) {
    ctx.save();
    const mod = (typeof ELITE_MOD_INFO !== 'undefined' && ELITE_MOD_INFO[e.eliteMod]) || null;
    const mc = e.boss ? '#ff352a' : (mod ? mod.color : '#ff9c4a');
    ctx.strokeStyle = hexA(mc, 0.7);
    ctx.lineWidth = e.boss ? 2.4 : 1.6;
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 1, 14 * sc, 6.5 * sc, 0, 0, 7); ctx.stroke();
    // nameplate: name + power, above the health bar
    const ny = s.y - 44 * sc;
    ctx.textAlign = 'center';
    ctx.font = '700 12px "Source Sans 3", sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(e.eliteName || e.def.name, s.x + 1, ny - 17);
    ctx.fillStyle = e.boss ? '#ff8a7a' : '#ffd9a0';
    ctx.fillText(e.eliteName || e.def.name, s.x, ny - 18);
    const subLabel = e.boss ? 'GUARDIAN' : (mod ? mod.label.toUpperCase() : null);
    if (subLabel) {
      ctx.font = '600 10px "Source Sans 3", sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(subLabel, s.x + 1, ny - 6);
      ctx.fillStyle = mc;
      ctx.fillText(subLabel, s.x, ny - 7);
    }
    const w = 38 * sc, k = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(s.x - w / 2 - 1, ny - 1, w + 2, 6);
    ctx.fillStyle = mc;
    ctx.fillRect(s.x - w / 2, ny, w * k, 4);
    ctx.restore();
  } else if (e.hp < e.maxHp) {
    const w = 30 * sc, k = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(s.x - w / 2, s.y - 44 * sc, w, 4);
    ctx.fillStyle = '#c93b2e';
    ctx.fillRect(s.x - w / 2, s.y - 44 * sc, w * k, 4);
  }
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function hurt2(h, c) { return h.hurt ? '#ffffff' : c; }

// ---------- dire rat ----------
MONSTER_DRAW.rat = function (ctx, e, h) {
  const { t, fa, fx, tint, grad, outline, seed } = h;
  const scur = Math.sin(t * 9) * 1.2;
  // scrabbling clawed legs
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const px = -6 + i * 4.2, wig = Math.sin(t * 13 + i * 1.9) * 1.9;
    ctx.strokeStyle = tint('#54402e'); ctx.lineWidth = 1.9;
    ctx.beginPath(); ctx.moveTo(px, -4.5); ctx.lineTo(px + wig * 0.5, -0.6); ctx.stroke();
    ctx.strokeStyle = tint('#c9bda4'); ctx.lineWidth = 0.7; // claws
    ctx.beginPath(); ctx.moveTo(px + wig * 0.5, -0.6); ctx.lineTo(px + wig * 0.5 + 1.2, -0.2); ctx.stroke();
  }
  // hunched body: haunch high, shoulders low
  ctx.fillStyle = grad(-16, -1, '#6e553f', 18, -24);
  ctx.beginPath();
  ctx.moveTo(fx * 9.4, -5.4);
  ctx.quadraticCurveTo(fx * 6, -11.4, -fx * 1, -13.4 + scur * 0.3);
  ctx.quadraticCurveTo(-fx * 9, -13.8, -fx * 10.4, -7);
  ctx.quadraticCurveTo(-fx * 10.4, -2.4, -fx * 5.4, -1.6);
  ctx.quadraticCurveTo(0, -0.8, fx * 7.4, -2.4);
  ctx.closePath(); ctx.fill(); outline();
  coreShadow(ctx, -fx * 3, -7, 9.4, 6.2);
  h.rim(-fx * 4, -8.4, 5.4);
  // raised hackles along the spine ridge
  ctx.strokeStyle = tint('#46362a'); ctx.lineWidth = 1.1;
  for (let i = 0; i < 6; i++) {
    const k = i / 5, hx2 = lerp(fx * 4, -fx * 9, k), hy2 = lerp(-10.4, -12.4, Math.sin(k * Math.PI)) + scur * 0.3;
    ctx.beginPath(); ctx.moveTo(hx2, hy2);
    ctx.lineTo(hx2 - fx * 0.8, hy2 - 2 - Math.sin(k * Math.PI) * 0.8); ctx.stroke();
  }
  // mangy fur: streaks + bald mottle patches
  furPatch(ctx, -fx * 3, -7.4, 7, 4.4, seed, 12, Math.PI * 0.6, 2.6, hurt2(h, 'rgba(60,44,30,0.7)'), 0.8);
  furPatch(ctx, -fx * 2, -9.4, 6, 3, seed + 5, 7, Math.PI * 0.55, 2.2, hurt2(h, 'rgba(126,100,74,0.55)'), 0.7);
  mottle(ctx, -fx * 5, -6, 4.4, 3, seed, 5, hurt2(h, 'rgba(140,110,86,0.5)'), hurt2(h, 'rgba(156,130,104,0.45)'), 0.7);
  if (!h.hurt) gleam(ctx, -fx * 4, -11, 5.2, Math.PI * 1.1, Math.PI * 1.5, 0.16, 1); // damp matted-fur sheen along the spine
  // ragged bite scar on the haunch
  ctx.strokeStyle = tint('#9c8268'); ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(-fx * 7.4, -10.4); ctx.lineTo(-fx * 6, -7.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-fx * 8.4, -9); ctx.lineTo(-fx * 7, -8); ctx.stroke();
  // head: wedge snout
  const hx = fx * 9, hy = -7 + h.fy * 3;
  ctx.fillStyle = grad(-13, -2, '#7a5f46', 16, -16);
  ctx.beginPath(); ctx.moveTo(hx - fx * 2.4, hy - 4.4);
  ctx.quadraticCurveTo(hx + fx * 6.4, hy - 3, hx + fx * 7.4, hy + 1.4);
  ctx.quadraticCurveTo(hx + fx * 3, hy + 3.8, hx - fx * 2.4, hy + 3.6);
  ctx.closePath(); ctx.fill(); outline(1);
  furPatch(ctx, hx + fx * 1, hy - 0.6, 3.4, 2.4, seed + 9, 6, fa, 1.8, hurt2(h, 'rgba(60,44,30,0.6)'), 0.7);
  // ears: torn, pink inner
  for (const off of [-2.4, 2.4]) {
    ctx.fillStyle = tint('#54402e');
    ctx.beginPath(); ctx.arc(hx - fx * 1.4 + off, hy - 4.6, 2.3, 0, 7); ctx.fill();
    ctx.fillStyle = tint('#a8766a');
    ctx.beginPath(); ctx.arc(hx - fx * 1.4 + off, hy - 4.6, 1.2, 0, 7); ctx.fill();
  }
  // torn notch in one ear
  ctx.fillStyle = hurt2(h, 'rgba(16,11,7,0.85)');
  ctx.beginPath(); ctx.moveTo(hx - fx * 1.4 + 2.4, hy - 6.6); ctx.lineTo(hx - fx * 1.4 + 3.4, hy - 5.4); ctx.lineTo(hx - fx * 1.4 + 1.8, hy - 5.2); ctx.closePath(); ctx.fill();
  // whiskers + scarred nose
  ctx.strokeStyle = 'rgba(230,220,200,0.6)'; ctx.lineWidth = 0.7;
  for (const wa of [-0.55, -0.15, 0.25, 0.6]) {
    ctx.beginPath(); ctx.moveTo(hx + fx * 5.8, hy + 0.8);
    ctx.lineTo(hx + fx * 5.8 + fx * 4.6, hy + 0.6 + wa * 3.4); ctx.stroke();
  }
  ctx.fillStyle = tint('#8f5a52');
  ctx.beginPath(); ctx.arc(hx + fx * 7.2, hy + 1.2, 1.1, 0, 7); ctx.fill();
  // bared yellow incisors + drool
  ctx.fillStyle = tint('#e0d2a8');
  ctx.beginPath(); ctx.moveTo(hx + fx * 5.8, hy + 2.4); ctx.lineTo(hx + fx * 6.2, hy + 4.4); ctx.lineTo(hx + fx * 6.8, hy + 2.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx + fx * 4.6, hy + 2.6); ctx.lineTo(hx + fx * 5, hy + 4); ctx.lineTo(hx + fx * 5.6, hy + 2.6); ctx.closePath(); ctx.fill();
  const drool = (t * 0.8) % 1;
  if (drool < 0.7) {
    ctx.fillStyle = `rgba(200,220,210,${0.5 - drool * 0.55})`;
    ctx.beginPath(); ctx.arc(hx + fx * 6, hy + 4 + drool * 4, 0.7, 0, 7); ctx.fill();
  }
  // gleaming red eyes
  ctx.fillStyle = 'rgba(255,83,70,0.30)';
  ctx.beginPath(); ctx.arc(hx + fx * 2, hy - 1.6, 2.8, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff5346';
  ctx.beginPath(); ctx.arc(hx + fx * 2 - 1.3, hy - 1.6, 1.1, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + fx * 2 + 1.5, hy - 1.6, 1.1, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,210,0.9)';
  ctx.beginPath(); ctx.arc(hx + fx * 2 - 1.6, hy - 1.9, 0.4, 0, 7); ctx.fill();
  // scarred segmented tail
  ctx.strokeStyle = tint('#9c7d5e'); ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-fx * 10, -6);
  ctx.quadraticCurveTo(-fx * 17, -3.6 + Math.sin(t * 8) * 2.6, -fx * 23, -8 + Math.sin(t * 6) * 1.6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,42,28,0.55)'; ctx.lineWidth = 0.8;
  for (let i = 1; i <= 5; i++) {
    const k = i / 6, tx = lerp(-fx * 10, -fx * 23, k);
    const ty = lerp(-6, -8 + Math.sin(t * 6) * 1.6, k) + Math.sin(t * 8) * 2.6 * Math.sin(k * Math.PI) * 0.7;
    ctx.beginPath(); ctx.moveTo(tx, ty - 1.3); ctx.lineTo(tx, ty + 1.3); ctx.stroke();
  }
};

// ---------- skeleton & archer ----------
function drawSkeletonBase(ctx, e, h) {
  const { t, fx, tint, grad, outline, seed } = h;
  const sway = Math.sin(t * 2.2) * 0.8;
  const bone = '#cfc4a4', boneDk = '#a89c7c', boneLt = '#e2d8bc';
  ctx.lineCap = 'round';
  // leg bones with knee knobs
  for (const side of [-1, 1]) {
    const wig = Math.sin(t * 5.4 + (side > 0 ? Math.PI : 0)) * 1.4;
    ctx.strokeStyle = tint(boneDk); ctx.lineWidth = 2.7;
    ctx.beginPath(); ctx.moveTo(side * 3, -13); ctx.lineTo(side * 3 + wig * 0.4, -7); ctx.stroke();
    ctx.strokeStyle = tint(bone); ctx.lineWidth = 2.3;
    ctx.beginPath(); ctx.moveTo(side * 3 + wig * 0.4, -7); ctx.lineTo(side * 3 + wig, -0.6); ctx.stroke();
    ctx.fillStyle = tint(boneLt);
    ctx.beginPath(); ctx.arc(side * 3 + wig * 0.4, -7, 1.5, 0, 7); ctx.fill();
    // splayed foot bones
    ctx.strokeStyle = tint(bone); ctx.lineWidth = 1;
    for (const ta of [-0.5, 0, 0.5]) {
      ctx.beginPath(); ctx.moveTo(side * 3 + wig, -0.6);
      ctx.lineTo(side * 3 + wig + Math.cos(ta) * 2.4, -0.2 + Math.sin(ta)); ctx.stroke();
    }
  }
  // pelvis
  ctx.fillStyle = tint(bone);
  ctx.beginPath(); ctx.ellipse(0, -13.4, 4.8, 2.8, 0, 0, 7); ctx.fill(); outline(1);
  ctx.fillStyle = hurt2(h, 'rgba(16,12,8,0.9)');
  ctx.beginPath(); ctx.ellipse(0, -13.4, 1.7, 1.1, 0, 0, 7); ctx.fill();
  mottle(ctx, 0, -13.4, 3.6, 1.8, seed + 3, 4, hurt2(h, 'rgba(120,106,76,0.5)'), hurt2(h, 'rgba(90,78,56,0.45)'), 0.5);
  // spine: stacked vertebrae
  ctx.strokeStyle = tint(boneDk); ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(sway * 0.4, -14); ctx.lineTo(sway, -22); ctx.stroke();
  ctx.fillStyle = tint(boneLt);
  for (let i = 0; i < 3; i++) ctx.fillRect(sway * (0.5 + i * 0.2) - 1.3, -15.8 - i * 2.5, 2.6, 1.2);
  // dark chest cavity + individual ribs (one snapped)
  ctx.fillStyle = hurt2(h, 'rgba(14,10,7,0.88)');
  ctx.beginPath(); ctx.ellipse(sway, -19.8, 6.4, 7.2, 0, 0, 7); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const ry = -24.6 + i * 2.7;
    const broken = i === 2;
    ctx.strokeStyle = tint(i % 2 ? bone : boneLt); ctx.lineWidth = 1.5;
    if (broken) { // snapped rib: jagged stub on one side
      ctx.beginPath(); ctx.moveTo(sway - 6 + i * 0.5, ry);
      ctx.quadraticCurveTo(sway - 2.4, ry + 1.8, sway - 1, ry + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sway + 6 - i * 0.5, ry);
      ctx.quadraticCurveTo(sway + 3.4, ry + 1.4, sway + 2.6, ry + 1.2); ctx.stroke();
      ctx.strokeStyle = tint(boneDk); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(sway - 1, ry + 2); ctx.lineTo(sway - 0.4, ry + 1.2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(sway - 6 + i * 0.5, ry);
      ctx.quadraticCurveTo(sway, ry + 2.8, sway + 6 - i * 0.5, ry); ctx.stroke();
    }
  }
  // sternum + grime
  ctx.strokeStyle = tint(boneDk); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(sway, -25.4); ctx.lineTo(sway, -16.4); ctx.stroke();
  mottle(ctx, sway, -20, 4.6, 5, seed + 8, 6, hurt2(h, 'rgba(96,84,58,0.5)'), hurt2(h, 'rgba(70,60,42,0.4)'), 0.5);
  // tattered burial rag across the hips
  ctx.fillStyle = tint('#4a3f30');
  ctx.beginPath();
  ctx.moveTo(sway - 5.4, -16.4);
  ctx.lineTo(sway - 3.4, -9.4 + Math.sin(t * 3) * 1);
  ctx.lineTo(sway - 1.6, -13.4);
  ctx.lineTo(sway + 0.4, -8.6 + Math.sin(t * 3.6) * 1);
  ctx.lineTo(sway + 2.4, -15.4);
  ctx.lineTo(sway + 4.6, -11 + Math.sin(t * 2.7) * 0.8);
  ctx.lineTo(sway + 5.4, -16.4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = hurt2(h, 'rgba(20,14,8,0.5)'); ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(sway - 2.6, -15.4); ctx.lineTo(sway - 2.2, -11.4); ctx.stroke();
  // off arm: shoulder -> elbow -> bony hand
  const bx = sway - fx * 6;
  ctx.strokeStyle = tint(bone); ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(bx, -23); ctx.lineTo(bx - 1.4, -18); ctx.lineTo(bx - 0.4, -13.4); ctx.stroke();
  ctx.fillStyle = tint(boneLt);
  ctx.beginPath(); ctx.arc(bx - 1.4, -18, 1.3, 0, 7); ctx.fill();
  ctx.strokeStyle = tint(bone); ctx.lineWidth = 0.8; // finger bones
  for (const da of [-0.5, 0, 0.5]) {
    ctx.beginPath(); ctx.moveTo(bx - 0.4, -13.4);
    ctx.lineTo(bx - 0.4 + Math.cos(1.6 + da) * 2, -13.4 + Math.sin(1.6 + da) * 2); ctx.stroke();
  }
  // skull: dome, brow, cheekbones, cracked
  const sx2 = sway;
  ctx.fillStyle = grad(-35, -22, '#d8cdab', 20, -12);
  ctx.beginPath(); ctx.arc(sx2, -28.8, 6.2, 0, 7); ctx.fill(); outline();
  h.rim(sx2, -28.8, 5.5);
  if (!h.hurt) gleam(ctx, sx2 - 0.6, -29.4, 5, Math.PI * 1.12, Math.PI * 1.52, 0.2, 1); // polished bone highlight
  coreShadow(ctx, sx2, -28.4, 6, 6);
  mottle(ctx, sx2, -29.4, 4.4, 4, seed, 6, hurt2(h, 'rgba(120,106,76,0.45)'), hurt2(h, 'rgba(168,154,118,0.5)'), 0.5);
  // brow ridge
  ctx.strokeStyle = tint(boneDk); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(sx2 - 4.6, -30.4); ctx.quadraticCurveTo(sx2, -31.6, sx2 + 4.6, -30.4); ctx.stroke();
  // cheekbones
  ctx.strokeStyle = tint(boneDk); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(sx2 - 5.4, -27.4); ctx.quadraticCurveTo(sx2 - 4, -26, sx2 - 2.6, -26.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx2 + 5.4, -27.4); ctx.quadraticCurveTo(sx2 + 4, -26, sx2 + 2.6, -26.2); ctx.stroke();
  // spider crack from the temple
  ctx.strokeStyle = tint('#8c8060'); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(sx2 - 1.4, -34.4); ctx.lineTo(sx2 - 2.8, -31.6); ctx.lineTo(sx2 - 1.8, -30.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx2 - 2.8, -31.6); ctx.lineTo(sx2 - 4, -30.8); ctx.stroke();
  // jaw with teeth + missing gap
  ctx.fillStyle = tint('#c9bd9c');
  ctx.beginPath();
  ctx.moveTo(sx2 - 3.8, -25); ctx.lineTo(sx2 + 3.8, -25);
  ctx.lineTo(sx2 + 3, -22.2); ctx.lineTo(sx2 - 3, -22.2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = tint(boneDk); ctx.lineWidth = 0.8;
  for (const jx of [-2.2, -0.6, 1, 2.4]) { ctx.beginPath(); ctx.moveTo(sx2 + jx, -25); ctx.lineTo(sx2 + jx, -22.6); ctx.stroke(); }
  ctx.fillStyle = hurt2(h, 'rgba(14,10,7,0.9)');
  ctx.fillRect(sx2 + 1.2, -24.8, 1.1, 1.8);
  // nasal cavity + glowing sockets
  ctx.beginPath(); ctx.moveTo(sx2 + fx * 1.4, -27.6); ctx.lineTo(sx2 + fx * 1.4 - 1, -25.9); ctx.lineTo(sx2 + fx * 1.4 + 1, -25.9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0f0c08';
  ctx.beginPath(); ctx.arc(sx2 - 2.5, -29.2, 2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(sx2 + 2.5, -29.2, 2, 0, 7); ctx.fill();
  const glowC = e.type === 'archer' ? '#7fd0ff' : '#ffb35e';
  const ga = 0.7 + Math.sin(t * 5) * 0.3;
  ctx.globalAlpha *= ga;
  ctx.fillStyle = hurt2(h, glowC);
  ctx.beginPath(); ctx.arc(sx2 - 2.5, -29.2, 1, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(sx2 + 2.5, -29.2, 1, 0, 7); ctx.fill();
  ctx.globalAlpha /= ga;
  return sway;
}

MONSTER_DRAW.skeleton = function (ctx, e, h) {
  const { fx, tint, seed } = h;
  const sway = drawSkeletonBase(ctx, e, h);
  // rusted half-breastplate strapped over the ribs
  ctx.fillStyle = h.grad(-24, -16, '#5d564a', 12, -18);
  ctx.beginPath();
  ctx.moveTo(sway - 5.8, -23.4);
  ctx.quadraticCurveTo(sway, -25, sway + 5.8, -23.4);
  ctx.lineTo(sway + 5, -17.4);
  ctx.quadraticCurveTo(sway, -15.8, sway - 5, -17.4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1; ctx.stroke();
  scratches(ctx, sway, -20.4, 4, 2.6, seed, 4, hurt2(h, 'rgba(20,16,12,0.6)'), 'rgba(220,228,235,0.25)');
  mottle(ctx, sway, -19.4, 4.6, 3, seed + 2, 6, tint('#8a4f2e'), tint('#6e3c20'), 0.8); // rust blooms
  // shoulder strap
  ctx.strokeStyle = tint('#3c2e1c'); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(sway - 5, -23.6); ctx.lineTo(sway + 4, -16.6); ctx.stroke();
  // rusted pauldron on sword shoulder
  ctx.fillStyle = h.grad(-26, -19, '#6b5640', 12, -16);
  ctx.beginPath(); ctx.ellipse(sway + fx * 6, -22.8, 3.6, 4.2, fx * 0.5, 0, 7); ctx.fill();
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1; ctx.stroke();
  mottle(ctx, sway + fx * 6, -22.8, 2.6, 3, seed + 6, 4, tint('#8a4f2e'), tint('#5d3a22'), 0.7);
  // sword arm
  ctx.strokeStyle = tint('#cfc4a4'); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sway + fx * 6, -22); ctx.lineTo(fx * 8, -16.4); ctx.lineTo(fx * 9.4, -14); ctx.stroke();
  ctx.fillStyle = tint('#e2d8bc');
  ctx.beginPath(); ctx.arc(fx * 8, -16.4, 1.2, 0, 7); ctx.fill();
  // notched, rust-bitten old sword
  const wx0 = fx * 9.4, wy0 = -14, wx1 = fx * 20.5, wy1 = -14 + h.fy * 6;
  ctx.strokeStyle = tint('#3e454c'); ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(wx0, wy0); ctx.lineTo(wx1, wy1); ctx.stroke();
  ctx.strokeStyle = tint('#9aa3ab'); ctx.lineWidth = 2.1;
  ctx.beginPath(); ctx.moveTo(wx0, wy0); ctx.lineTo(wx1, wy1); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(lerp(wx0, wx1, 0.1), lerp(wy0, wy1, 0.1) - 0.8); ctx.lineTo(lerp(wx0, wx1, 0.86), lerp(wy0, wy1, 0.86) - 0.8); ctx.stroke();
  ctx.fillStyle = hurt2(h, 'rgba(16,12,8,0.7)');
  for (const k of [0.32, 0.58, 0.8]) {
    ctx.beginPath(); ctx.arc(lerp(wx0, wx1, k), lerp(wy0, wy1, k) - 1.5, k === 0.58 ? 1.2 : 0.8, 0, 7); ctx.fill();
  }
  mottle(ctx, lerp(wx0, wx1, 0.5), lerp(wy0, wy1, 0.5), 4.4, 1, seed + 11, 4, tint('#8a4f2e'), tint('#6e3c20'), 0.6);
  // crossguard + wrapped tang
  ctx.strokeStyle = tint('#6b5640'); ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(wx0 + 1.4, wy0 - 2.8); ctx.lineTo(wx0 + 1.4, wy0 + 2.8); ctx.stroke();
  ctx.strokeStyle = tint('#3c2e1c'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(wx0 - 1, wy0 + 0.6); ctx.lineTo(wx0 + 0.6, wy0 - 0.6); ctx.stroke();
};

MONSTER_DRAW.archer = function (ctx, e, h) {
  const { t, fa, fx, tint, seed } = h;
  const sway = drawSkeletonBase(ctx, e, h);
  // quiver across the back w/ fletched arrows
  ctx.save();
  ctx.translate(sway - fx * 6.4, -20);
  ctx.rotate(-0.5);
  ctx.fillStyle = h.grad(-6, 6, '#54412c', 8, -16);
  ctx.fillRect(-2.4, -5.6, 4.8, 10.8);
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1; ctx.strokeRect(-2.4, -5.6, 4.8, 10.8);
  ctx.strokeStyle = tint('#3c2e1c'); ctx.lineWidth = 0.8; // stitched bands
  ctx.beginPath(); ctx.moveTo(-2.4, -2.4); ctx.lineTo(2.4, -2.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2.4, 1.8); ctx.lineTo(2.4, 1.8); ctx.stroke();
  for (const [ax, fc] of [[-1.2, '#b03a2e'], [0.4, '#7a8a52'], [1.4, '#b03a2e']]) {
    ctx.strokeStyle = tint('#8a7148'); ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(ax, -5.6); ctx.lineTo(ax + 0.6, -8.8); ctx.stroke();
    ctx.fillStyle = tint(fc);
    ctx.beginPath(); ctx.moveTo(ax + 0.6, -8.8); ctx.lineTo(ax - 0.6, -7.6); ctx.lineTo(ax + 1.4, -7.4); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // cracked leather skullcap w/ stitches
  ctx.fillStyle = h.grad(-35, -29, '#5d4630', 12, -12);
  ctx.beginPath(); ctx.arc(sway, -29.8, 6.3, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(sway - 6.2, -30.2); ctx.quadraticCurveTo(sway, -28, sway + 6.2, -30.2); ctx.stroke();
  ctx.strokeStyle = hurt2(h, 'rgba(30,20,10,0.6)'); ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(sway - 2, -34.4); ctx.lineTo(sway + 0.6, -33.8); ctx.stroke();
  for (const sx3 of [-3.4, -1, 1.4]) {
    ctx.beginPath(); ctx.moveTo(sway + sx3, -32.4); ctx.lineTo(sway + sx3 + 0.8, -31.4); ctx.stroke();
  }
  // bow arm
  ctx.strokeStyle = tint('#cfc4a4'); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sway + fx * 6, -22.4); ctx.lineTo(fx * 9, -17.4); ctx.stroke();
  // recurve bow w/ leather grip + drawn arrow when hunting
  const bx = fx * 10, by = -16 + h.fy * 4;
  ctx.strokeStyle = tint('#5d4426'); ctx.lineWidth = 2.3;
  ctx.beginPath(); ctx.arc(bx, by, 7.4, fa - 1.25, fa + 1.25); ctx.stroke();
  ctx.strokeStyle = tint('#3c2e1c'); ctx.lineWidth = 2.8; // grip wrap
  ctx.beginPath(); ctx.arc(bx, by, 7.4, fa - 0.22, fa + 0.22); ctx.stroke();
  const draw = h.aggro ? 0.9 : 0.4 + Math.sin(t * 2.6) * 0.2;
  const sx1 = bx + Math.cos(fa - 1.25) * 7.4, sy1 = by + Math.sin(fa - 1.25) * 7.4;
  const sx2 = bx + Math.cos(fa + 1.25) * 7.4, sy2 = by + Math.sin(fa + 1.25) * 7.4;
  const nx = bx - Math.cos(fa) * 3.8 * draw, ny = by - Math.sin(fa) * 3.8 * draw;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(nx, ny); ctx.lineTo(sx2, sy2); ctx.stroke();
  if (h.aggro) {
    ctx.strokeStyle = tint('#8a7148'); ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(bx + Math.cos(fa) * 8.4, by + Math.sin(fa) * 8.4); ctx.stroke();
    ctx.fillStyle = tint('#cfd6dc');
    const tipx = bx + Math.cos(fa) * 9.8, tipy = by + Math.sin(fa) * 9.8;
    ctx.beginPath(); ctx.moveTo(tipx, tipy);
    ctx.lineTo(tipx - Math.cos(fa - 0.4) * 2.6, tipy - Math.sin(fa - 0.4) * 2.6);
    ctx.lineTo(tipx - Math.cos(fa + 0.4) * 2.6, tipy - Math.sin(fa + 0.4) * 2.6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = tint('#b03a2e'); // fletching
    ctx.beginPath(); ctx.moveTo(nx, ny);
    ctx.lineTo(nx - Math.cos(fa - 0.5) * 2, ny - Math.sin(fa - 0.5) * 2);
    ctx.lineTo(nx + Math.cos(fa) * 1.4, ny + Math.sin(fa) * 1.4);
    ctx.closePath(); ctx.fill();
  }
};
