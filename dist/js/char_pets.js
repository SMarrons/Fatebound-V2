// ============================================================
// FATEBOUND — char_pets: detailed companion models
// wolf whelp (melee) · hunting hawk (ranged) · arcane wisp (magic)
// ============================================================

function drawPet(ctx, pet) {
  const s = worldToScreen(pet.x, pet.y);
  const fa = worldAngToScreen(pet.dir);
  const flip = Math.cos(fa) < 0 ? -1 : 1;
  const t = pet.t;
  const lunge = pet.lungeT ? Math.sin((0.18 - pet.lungeT) / 0.18 * Math.PI) * 4 : 0;
  const accent = RARITIES[pet.rarity] ? RARITIES[pet.rarity].color : '#9ecbff';

  ctx.save();
  ctx.translate(s.x + Math.cos(fa) * lunge, s.y + Math.sin(fa) * lunge * 0.5);
  switch (pet.type) {
    case 'wolf': paintPetWolf(ctx, pet, t, flip, accent); break;
    case 'hawk': paintPetHawk(ctx, pet, t, flip, accent); break;
    case 'wisp': paintPetWisp(ctx, pet, t, flip, accent); break;
  }
  ctx.restore();
}

// ---------- wolf whelp ----------
function paintPetWolf(ctx, pet, t, flip, accent) {
  const wk = pet.walkT * 7;
  const moving = pet.lungeT || Math.abs(Math.sin(wk)) > 0.01;
  const bob = Math.sin(wk * 2) * 0.8;
  // shadow + contact
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 1, 12, 5, 0, 0, 7); ctx.fill();
  groundContact(ctx, 0, 1, 9);

  ctx.save();
  ctx.scale(flip, 1);
  ctx.translate(0, -8 + bob);

  // hind + fore legs, jointed swing
  const legs = [
    { x: -7, ph: 0 }, { x: -4.5, ph: 3.1 }, { x: 4, ph: 1.5 }, { x: 6.5, ph: 4.6 },
  ];
  for (const L of legs) {
    const sw = Math.sin(wk + L.ph) * (moving ? 3 : 0.4);
    const lift = Math.max(0, Math.sin(wk + L.ph + 1.2)) * (moving ? 2 : 0);
    ctx.strokeStyle = '#4e463c'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(L.x, 1);
    ctx.quadraticCurveTo(L.x + sw * 0.4, 5, L.x + sw, 8 - lift);
    ctx.stroke();
    ctx.fillStyle = '#3a342c';
    ctx.beginPath(); ctx.ellipse(L.x + sw, 8.4 - lift, 1.7, 1.1, 0, 0, 7); ctx.fill();
  }

  // tail — wagging, brushy
  const wag = Math.sin(t * (moving ? 10 : 4)) * 0.35;
  ctx.save();
  ctx.translate(-9.5, -3);
  ctx.rotate(-0.7 + wag);
  ctx.strokeStyle = '#5d5347'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, -3, -7, -2); ctx.stroke();
  ctx.strokeStyle = '#776a58'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(-2, -1); ctx.quadraticCurveTo(-5, -3.4, -7.4, -2.4); ctx.stroke();
  ctx.restore();

  // body — two-tone fur with grain
  ctx.fillStyle = '#6a5f50';
  ctx.beginPath(); ctx.ellipse(-1, -1, 10.5, 5.8, -0.08, 0, 7); ctx.fill();
  ctx.fillStyle = '#7d7160';
  ctx.beginPath(); ctx.ellipse(-1, -3, 9.5, 4, -0.08, 0, 7); ctx.fill();
  furPatch(ctx, -2, -4, 8, 3, 31, 16, -2.6, 2.6, 'rgba(40,34,26,0.5)', 0.7);
  furPatch(ctx, -2, -1, 8, 2.5, 77, 12, -2.7, 2.2, 'rgba(225,214,190,0.25)', 0.6);
  coreShadow(ctx, -1, 0.5, 10, 4.5, 'rgba(0,0,0,0.3)');
  // pale chest bib
  ctx.fillStyle = '#b3a78f';
  ctx.beginPath(); ctx.ellipse(6.5, 0.5, 3, 3.4, 0.3, 0, 7); ctx.fill();

  // head — angular, alert
  const hb = Math.sin(t * 3) * 0.06;
  ctx.save();
  ctx.translate(8.5, -6);
  ctx.rotate(hb + (pet.lungeT ? 0.18 : 0));
  // ears
  ctx.fillStyle = '#574d40';
  ctx.beginPath(); ctx.moveTo(-3.5, -3); ctx.lineTo(-5.5, -8.5); ctx.lineTo(-0.5, -4.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0.5, -3.5); ctx.lineTo(0.5, -8); ctx.lineTo(4, -3.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2e2820';
  ctx.beginPath(); ctx.moveTo(-3.6, -4); ctx.lineTo(-4.8, -7.4); ctx.lineTo(-1.6, -4.6); ctx.closePath(); ctx.fill();
  // skull + muzzle
  ctx.fillStyle = '#7d7160';
  ctx.beginPath(); ctx.ellipse(0, -1, 4.6, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#8d8170';
  ctx.beginPath(); ctx.ellipse(3.5, 0.4, 3.4, 2.1, 0.18, 0, 7); ctx.fill();
  ctx.fillStyle = '#26211b';
  ctx.beginPath(); ctx.ellipse(6.6, 0.6, 1.2, 0.9, 0, 0, 7); ctx.fill(); // nose
  // jaw open on lunge
  if (pet.lungeT) {
    ctx.fillStyle = '#3a2520';
    ctx.beginPath(); ctx.moveTo(2.5, 1.6); ctx.lineTo(6.6, 2.8); ctx.lineTo(2.8, 3.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e0c8';
    ctx.beginPath(); ctx.moveTo(4.6, 1.9); ctx.lineTo(5.3, 2.9); ctx.lineTo(4.0, 2.5); ctx.closePath(); ctx.fill();
  }
  // eye
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath(); ctx.ellipse(0.8, -1.6, 1.1, 0.85, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1b1812';
  ctx.beginPath(); ctx.arc(1.1, -1.6, 0.45, 0, 7); ctx.fill();
  ctx.restore();

  // collar in rarity color
  ctx.strokeStyle = accent; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(6.5, -3.4, 3.2, 0.5, 2.7); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(6.2, 0.2, 0.9, 0, 7); ctx.fill();

  ctx.restore();
}

// ---------- hunting hawk ----------
function paintPetHawk(ctx, pet, t, flip, accent) {
  const hover = Math.sin(t * 5) * 2.2;
  const flap = Math.sin(t * 16);
  // small high shadow
  ctx.fillStyle = 'rgba(0,0,0,0.26)';
  ctx.beginPath(); ctx.ellipse(0, 1, 7.5, 3.2, 0, 0, 7); ctx.fill();

  ctx.save();
  ctx.scale(flip, 1);
  ctx.translate(0, -22 + hover);

  // far wing
  ctx.save();
  ctx.translate(-2, -2);
  ctx.rotate(-0.25 - flap * 0.55);
  wingShape(ctx, '#6e5740', '#54422f', -1);
  ctx.restore();

  // tail fan
  ctx.save();
  ctx.translate(-6, 2);
  ctx.rotate(0.5 + Math.sin(t * 5 + 1) * 0.08);
  ctx.fillStyle = '#5d4936';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -2.5); ctx.lineTo(-8.5, 1.5); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(35,26,18,0.6)'; ctx.lineWidth = 0.7;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-1, 0.5); ctx.lineTo(-7.6, -1.5 + i * 1.8); ctx.stroke(); }
  ctx.restore();

  // body
  ctx.fillStyle = '#7c6248';
  ctx.beginPath(); ctx.ellipse(0, 0, 6.2, 4.4, -0.25, 0, 7); ctx.fill();
  ctx.fillStyle = '#9b7f5e';
  ctx.beginPath(); ctx.ellipse(1, -1.4, 5, 3, -0.25, 0, 7); ctx.fill();
  // breast speckles
  mottle(ctx, 2, 1, 3.5, 2.5, 19, 9, 'rgba(48,35,22,0.55)', 'rgba(238,228,205,0.5)', 0.55);
  coreShadow(ctx, 0, 1.2, 6, 3.6, 'rgba(0,0,0,0.3)');

  // head — pale with dark cap
  ctx.fillStyle = '#e3d7bd';
  ctx.beginPath(); ctx.arc(5.5, -4.5, 3.1, 0, 7); ctx.fill();
  ctx.fillStyle = '#4f3d2b';
  ctx.beginPath(); ctx.arc(5.5, -4.5, 3.1, -3.4, -0.6); ctx.lineTo(5.5, -4.5); ctx.closePath(); ctx.fill();
  // beak
  ctx.fillStyle = '#d9a93f';
  ctx.beginPath(); ctx.moveTo(8.2, -4.6); ctx.lineTo(10.6, -3.6); ctx.lineTo(8.2, -2.9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a6420';
  ctx.beginPath(); ctx.moveTo(9.4, -3.9); ctx.lineTo(10.6, -3.6); ctx.lineTo(9.4, -3.3); ctx.closePath(); ctx.fill();
  // eye
  ctx.fillStyle = '#ffce3d';
  ctx.beginPath(); ctx.arc(6.3, -4.8, 1.05, 0, 7); ctx.fill();
  ctx.fillStyle = '#171310';
  ctx.beginPath(); ctx.arc(6.5, -4.8, 0.5, 0, 7); ctx.fill();

  // talons tucked
  ctx.strokeStyle = '#d9a93f'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0.5, 3.8); ctx.lineTo(1.5, 5.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-1.5, 3.9); ctx.lineTo(-1, 5.8); ctx.stroke();

  // near wing
  ctx.save();
  ctx.translate(0.5, -2.5);
  ctx.rotate(-0.1 + flap * 0.65);
  wingShape(ctx, '#8a6e50', '#66503a', 1);
  ctx.restore();

  // jess ribbon in rarity color
  ctx.strokeStyle = accent; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0.8, 4.2); ctx.quadraticCurveTo(2.2, 6.4, 1.2, 8); ctx.stroke();

  ctx.restore();
}
function wingShape(ctx, top, under, side) {
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-6, -9 * side, -15, -8 * side);
  ctx.quadraticCurveTo(-10, -2 * side, -3, 2.4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = under; ctx.lineWidth = 0.8;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-2 - i * 1.2, 0.5);
    ctx.quadraticCurveTo(-6 - i * 2.4, -3 * side, -13.6 - i * 0.4, -7.2 * side);
    ctx.stroke();
  }
}

// ---------- arcane wisp ----------
function paintPetWisp(ctx, pet, t, flip, accent) {
  const hover = Math.sin(t * 3.2) * 2.6;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(0, 1, 6, 2.6, 0, 0, 7); ctx.fill();

  ctx.save();
  ctx.translate(0, -20 + hover);

  // trailing ember motes
  for (let i = 0; i < 5; i++) {
    const a = t * 2.4 + i * 1.26;
    const r = 9 + Math.sin(t * 3 + i * 2) * 2.5;
    const mx = Math.cos(a) * r, my = Math.sin(a) * r * 0.55 + 2;
    ctx.fillStyle = `rgba(158,203,255,${0.25 + 0.2 * Math.sin(a * 2)})`;
    ctx.beginPath(); ctx.arc(mx, my, 1 + (i % 2) * 0.6, 0, 7); ctx.fill();
  }

  // outer glow
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 13);
  g.addColorStop(0, 'rgba(190,224,255,0.85)');
  g.addColorStop(0.45, 'rgba(120,170,255,0.35)');
  g.addColorStop(1, 'rgba(120,170,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill();

  // core — molten swirl
  ctx.fillStyle = '#cfe6ff';
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(90,140,230,0.8)'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(0, 0, 3.4, t * 3, t * 3 + 3.6); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 4.6, -t * 2.2, -t * 2.2 + 2.4); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-1.2, -1.4, 1.7, 0, 7); ctx.fill();

  // tiny face — two dark eyes, blink
  const blink = Math.sin(t * 1.7) > 0.96 ? 0.2 : 1;
  ctx.fillStyle = '#1d2b4a';
  ctx.beginPath(); ctx.ellipse(-1.4, 0.3, 0.7, 1.1 * blink, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1.6, 0.3, 0.7, 1.1 * blink, 0, 0, 7); ctx.fill();

  // rarity halo ring
  ctx.strokeStyle = accent; ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7 + Math.sin(t * 4) * 0.2;
  ctx.beginPath(); ctx.ellipse(0, 6.5, 7.5, 2.4, 0, 0, 7); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}
