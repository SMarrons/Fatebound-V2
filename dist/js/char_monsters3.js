// ============================================================
// FATEBOUND — char_monsters3: wraith, knight + corpses
// ============================================================

// ---------- wraith ----------
MONSTER_DRAW.wraith = function (ctx, e, h) {
  const { t, fa, fx, tint, grad } = h;
  ctx.globalAlpha *= 0.78 + Math.sin(t * 3) * 0.1;
  const wob = Math.sin(t * 4) * 2;
  // inner glow core
  const cg = ctx.createRadialGradient(0, -14 + wob, 0, 0, -14 + wob, 17);
  cg.addColorStop(0, 'rgba(160,225,245,0.45)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg; ctx.fillRect(-17, -33, 34, 38);
  // rear shroud layer: darker, wider, slower sway
  const wob2 = Math.sin(t * 3.1 + 1.2) * 2.6;
  ctx.fillStyle = hurt2(h, 'rgba(38,66,78,0.6)');
  ctx.beginPath();
  ctx.moveTo(-11.4, 3 + wob2 * 0.3);
  ctx.quadraticCurveTo(-13.4, -16, 0, -23.4 + wob2);
  ctx.quadraticCurveTo(13.4, -16, 11.4, 3 - wob2 * 0.3);
  ctx.quadraticCurveTo(7.4, -2, 4.6, 2.6);
  ctx.quadraticCurveTo(2, -2.6, 0, 3.2);
  ctx.quadraticCurveTo(-2, -2.6, -4.6, 2.6);
  ctx.quadraticCurveTo(-7.4, -2, -11.4, 3 + wob2 * 0.3);
  ctx.closePath(); ctx.fill();
  // independent trailing ribbons off the rear layer
  for (let i = 0; i < 3; i++) {
    const rx = -7 + i * 7, ph2 = t * 3.4 + i * 1.7;
    ctx.fillStyle = hurt2(h, `rgba(60,100,112,${0.45 - i * 0.08})`);
    ctx.beginPath();
    ctx.moveTo(rx - 1.4, -3);
    ctx.quadraticCurveTo(rx - 1 + Math.sin(ph2) * 2, 1.4, rx + Math.sin(ph2) * 3.4, 5.4 + Math.cos(ph2 * 0.7));
    ctx.quadraticCurveTo(rx + 1.4 + Math.sin(ph2) * 2, 1.4, rx + 1.6, -3);
    ctx.closePath(); ctx.fill();
  }
  // main shroud
  ctx.fillStyle = grad(-28, 2, '#4e7a88', 26, -20);
  ctx.beginPath();
  ctx.moveTo(-9, 2 + wob * 0.3);
  ctx.quadraticCurveTo(-11, -18, 0, -26.4 + wob);
  ctx.quadraticCurveTo(11, -18, 9, 2 - wob * 0.3);
  ctx.quadraticCurveTo(6, -3, 3.4, 1.4);
  ctx.quadraticCurveTo(1.6, -3, 0, 2);
  ctx.quadraticCurveTo(-1.6, -3, -3.4, 1.4);
  ctx.quadraticCurveTo(-6, -3, -9, 2 + wob * 0.3);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(180,235,250,0.32)'; ctx.lineWidth = 1; ctx.stroke();
  // ethereal folds + hint of ribs beneath the shroud
  ctx.strokeStyle = 'rgba(180,235,250,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-4.6, -20 + wob); ctx.quadraticCurveTo(-5.8, -10, -4.2, -1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4.6, -20 + wob); ctx.quadraticCurveTo(5.8, -10, 4.2, -1); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,240,250,0.14)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const ry = -16 + wob * 0.6 + i * 2.8;
    ctx.beginPath(); ctx.moveTo(-3.4, ry); ctx.quadraticCurveTo(0, ry + 1.6, 3.4, ry); ctx.stroke();
  }
  // tarnished circlet floating above the cowl
  ctx.strokeStyle = hurt2(h, 'rgba(150,160,140,0.6)'); ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.ellipse(0, -26.4 + wob, 4.4, 1.6, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = hurt2(h, 'rgba(158,203,255,0.8)');
  ctx.beginPath(); ctx.arc(0, -28 + wob, 0.8, 0, 7); ctx.fill();
  // skeletal hand reaching from the shroud
  const rx = fx * 7.6, ry = -12 + wob * 0.5;
  ctx.strokeStyle = 'rgba(214,244,255,0.8)'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(fx * 3, -14 + wob * 0.5); ctx.lineTo(rx, ry); ctx.stroke();
  ctx.lineWidth = 0.9;
  for (const da of [-0.55, -0.1, 0.34]) { // knuckled fingers
    const k1x = rx + Math.cos(fa + da) * 2.6, k1y = ry + Math.sin(fa + da) * 2 - 0.6;
    ctx.beginPath(); ctx.moveTo(rx, ry);
    ctx.lineTo(k1x, k1y);
    ctx.lineTo(k1x + Math.cos(fa + da + 0.5) * 2, k1y + Math.sin(fa + da + 0.5) * 1.8);
    ctx.stroke();
  }
  // hollow cowl, deep
  ctx.fillStyle = 'rgba(6,12,16,0.92)';
  ctx.beginPath(); ctx.ellipse(0, -19 + wob, 5, 5.4, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(180,235,250,0.25)'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.ellipse(0, -19 + wob, 5, 5.4, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  // twin lights w/ vertical smear trails
  for (const off of [-2, 2]) {
    const lg2 = ctx.createLinearGradient(0, -20 + wob, 0, -13.6 + wob);
    lg2.addColorStop(0, 'rgba(214,244,255,0.95)'); lg2.addColorStop(1, 'rgba(214,244,255,0)');
    ctx.fillStyle = lg2;
    ctx.fillRect(off - 0.8, -20 + wob, 1.6, 6.4);
    ctx.fillStyle = '#d6f4ff';
    ctx.beginPath(); ctx.arc(off, -20 + wob, 1.5, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(off - 0.4, -20.4 + wob, 0.5, 0, 7); ctx.fill();
  }
  // drifting spectral chain w/ shackle
  ctx.strokeStyle = 'rgba(150,200,215,0.45)'; ctx.lineWidth = 1;
  const ch0x = -fx * 6, ch0y = -6 + wob * 0.4;
  for (let i = 0; i < 5; i++) {
    const cx2 = ch0x - fx * i * 2.7, cy2 = ch0y + i * 2.1 + Math.sin(t * 3 + i) * 1.1;
    ctx.beginPath(); ctx.ellipse(cx2, cy2, 1.6, 1.05, i * 0.5, 0, 7); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(150,200,215,0.5)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(ch0x - fx * 13.5, ch0y + 10.5 + Math.sin(t * 3 + 5) * 1.1, 2.2, 0, 7); ctx.stroke();
  // trailing wisps
  ctx.fillStyle = 'rgba(140,200,220,0.32)';
  for (let i = 0; i < 4; i++) {
    const wt = (t * 1.4 + i * 0.25) % 1;
    ctx.beginPath(); ctx.arc(-Math.cos(fa) * (6 + wt * 13), -6 - wt * 7 + Math.sin(t * 5 + i) * 2, 2.8 * (1 - wt), 0, 7); ctx.fill();
  }
};

// ---------- dread knight ----------
MONSTER_DRAW.knight = function (ctx, e, h) {
  const { t, fa, fx, tint, grad, outline, seed } = h;
  const sway = Math.sin(t * 1.8) * 0.5;
  ctx.lineCap = 'round';
  // armored legs: greaves w/ knee cops + sabatons
  for (const side of [-1, 1]) {
    ctx.strokeStyle = tint('#343c44'); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(side * 4.2, -10); ctx.lineTo(side * 4.2, -0.8); ctx.stroke();
    ctx.strokeStyle = tint('#646e78'); ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.moveTo(side * 4.2, -10); ctx.lineTo(side * 4.2, -1.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,235,245,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(side * 4.2 - 0.8, -9.4); ctx.lineTo(side * 4.2 - 0.8, -3); ctx.stroke();
    ctx.fillStyle = tint('#7e868e'); // knee cop
    ctx.beginPath(); ctx.arc(side * 4.2, -8.6, 1.8, 0, 7); ctx.fill();
    ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.fillStyle = tint('#525c66'); // sabaton
    ctx.beginPath(); ctx.ellipse(side * 4.2 + side * 0.8, -0.8, 2.6, 1.3, 0, 0, 7); ctx.fill();
  }
  // faulds: segmented armor skirt w/ scratches
  for (let i = 0; i < 3; i++) {
    const fy2 = -12.4 + i * 2.9;
    ctx.fillStyle = grad(fy2 - 1.4, fy2 + 2.2, '#525c66', 16 - i * 4, -18);
    ctx.beginPath();
    ctx.moveTo(-8.8 + i * 0.8, fy2);
    ctx.quadraticCurveTo(0, fy2 + 3, 8.8 - i * 0.8, fy2);
    ctx.lineTo(8.4 - i * 0.8, fy2 + 2.7);
    ctx.quadraticCurveTo(0, fy2 + 5.2, -8.4 + i * 0.8, fy2 + 2.7);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,24,30,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
  }
  scratches(ctx, 0, -9, 6, 2.4, seed + 3, 3, hurt2(h, 'rgba(16,20,26,0.6)'), 'rgba(220,228,235,0.25)');
  // breastplate
  ctx.fillStyle = grad(-25.4, -8, '#646e78', 30, -28);
  ctx.beginPath();
  ctx.moveTo(-10.4, -10 + sway * 0.3);
  ctx.quadraticCurveTo(-12.4, -22.4, 0, -25 + sway);
  ctx.quadraticCurveTo(12.4, -22.4, 10.4, -10 - sway * 0.3);
  ctx.quadraticCurveTo(0, -7.4, -10.4, -10 + sway * 0.3);
  ctx.closePath(); ctx.fill(); outline(1.4);
  coreShadow(ctx, 0, -15.4, 10.4, 8.4);
  h.rim(-2.4, -17.4, 8.8, Math.PI * 1.08, Math.PI * 1.5);
  // battle damage: dent + scratches
  scratches(ctx, -4, -18, 4.4, 3.4, seed, 5, hurt2(h, 'rgba(16,20,26,0.65)'), 'rgba(220,228,235,0.3)');
  ctx.fillStyle = hurt2(h, 'rgba(20,24,30,0.5)'); // dent shadow
  ctx.beginPath(); ctx.ellipse(5.4, -19.4, 2, 1.4, 0.5, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(225,235,245,0.3)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(5.4, -19.4, 2.2, Math.PI * 0.6, Math.PI * 1.2); ctx.stroke();
  // plackart ridges + rivets
  ctx.strokeStyle = tint('#3c444c'); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-9.4, -11.6); ctx.quadraticCurveTo(0, -9, 9.4, -11.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, -15.4); ctx.quadraticCurveTo(0, -12.8, 10, -15.4); ctx.stroke();
  ctx.strokeStyle = 'rgba(225,235,245,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-7.4, -20.6); ctx.quadraticCurveTo(0, -23.4, 7.4, -20.6); ctx.stroke();
  ctx.fillStyle = 'rgba(225,235,245,0.55)';
  for (const [rx, ry] of [[-8.8, -13.6], [8.8, -13.6], [-9.4, -17.4], [9.4, -17.4]])
    ctx.fillRect(rx - 0.6, ry - 0.6, 1.2, 1.2);
  // tabard: frayed hem, heraldic sigil
  ctx.fillStyle = tint('#3c2f4e');
  ctx.beginPath(); ctx.moveTo(-3.8, -21.5); ctx.lineTo(3.8, -21.5); ctx.lineTo(3, -6.8);
  ctx.lineTo(1.6, -5); ctx.lineTo(0.4, -6.4); ctx.lineTo(-1, -4.6); ctx.lineTo(-3, -6.8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = tint('#241c30'); ctx.lineWidth = 0.8; ctx.stroke();
  mottle(ctx, 0, -13, 2.6, 6, seed + 5, 4, hurt2(h, 'rgba(26,20,36,0.7)'), hurt2(h, 'rgba(80,66,110,0.4)'), 0.6);
  ctx.strokeStyle = tint('#9b8bc4'); ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(0, -17.8); ctx.lineTo(2, -14.8); ctx.lineTo(0, -11.8); ctx.lineTo(-2, -14.8); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-1.4, -9.6); ctx.lineTo(1.4, -9.6); ctx.stroke();
  // layered spiked pauldrons
  for (const side of [-1, 1]) {
    ctx.fillStyle = grad(-28, -17, '#6b757f', 26, -16);
    ctx.beginPath(); ctx.ellipse(side * 10, -21.6, 4.8, 5.6, side * 0.5, 0, 7); ctx.fill();
    ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.strokeStyle = 'rgba(20,24,30,0.6)'; ctx.lineWidth = 1; // lower lame
    ctx.beginPath(); ctx.ellipse(side * 10.4, -19.6, 3.6, 3.8, side * 0.5, -0.9, 2.3); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,235,245,0.35)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(side * 9.6, -23, 2.8, 2.4, side * 0.5, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    // spike
    ctx.fillStyle = tint('#525c66');
    ctx.beginPath();
    ctx.moveTo(side * 11.4, -25.4); ctx.lineTo(side * 14.4, -29.4); ctx.lineTo(side * 12.8, -24.4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(230,240,250,0.55)';
    ctx.fillRect(side * 9.8 - 0.7, -25, 1.4, 1.4);
  }
  // great helm
  const hY = -28.8 + sway;
  ctx.fillStyle = grad(hY - 7.4, hY + 7, '#7e868e', 30, -20);
  ctx.beginPath();
  ctx.moveTo(-6.8, hY + 5.6);
  ctx.lineTo(-6.8, hY - 4);
  ctx.quadraticCurveTo(0, hY - 8.8, 6.8, hY - 4);
  ctx.lineTo(6.8, hY + 5.6);
  ctx.closePath(); ctx.fill(); outline();
  h.rim(-1, hY - 2.4, 6, Math.PI * 1.1, Math.PI * 1.6);
  scratches(ctx, 3, hY - 3, 2.8, 2, seed + 8, 3, hurt2(h, 'rgba(16,20,26,0.6)'), 'rgba(220,228,235,0.3)');
  // visor slit: cross-shaped, glowing
  ctx.fillStyle = '#0c1014';
  ctx.fillRect(-5.4, hY - 1.8, 10.8, 3.2);
  ctx.fillRect(-0.9, hY - 4.4, 1.8, 8.4);
  const va = 0.75 + Math.sin(t * 3.4) * 0.25;
  ctx.fillStyle = `rgba(158,203,255,${va})`;
  ctx.fillRect(-4.4 + fx * 0.8, hY - 1.1, 3.2, 1.8);
  ctx.fillRect(1.2 + fx * 0.8, hY - 1.1, 3.2, 1.8);
  // breath holes
  ctx.fillStyle = 'rgba(20,24,30,0.85)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(-2.2 + i * 2.2, hY + 3.4, 0.5, 0, 7); ctx.fill();
  }
  // riveted center ridge + plume
  ctx.strokeStyle = tint('#525c66'); ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(0, hY - 8.4); ctx.lineTo(0, hY - 4.6); ctx.stroke();
  ctx.strokeStyle = tint('#7a2e3c'); ctx.lineWidth = 2.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, hY - 7.8); ctx.quadraticCurveTo(-3.4, hY - 11 + Math.sin(t * 2.4) * 0.5, -7, hY - 9.4); ctx.stroke();
  ctx.strokeStyle = tint('#a04050'); ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(-1, hY - 8.4); ctx.quadraticCurveTo(-3.8, hY - 10.4 + Math.sin(t * 2.4) * 0.5, -6.4, hY - 9.6); ctx.stroke();
  // greatsword: rune-lit fuller, crossguard, wire grip
  const wx0 = fx * 9.4, wy0 = -13, wx1 = fx * 25.4, wy1 = -13 + h.fy * 8;
  ctx.strokeStyle = tint('#3e464e'); ctx.lineWidth = 4.8;
  ctx.beginPath(); ctx.moveTo(wx0, wy0); ctx.lineTo(wx1, wy1); ctx.stroke();
  ctx.strokeStyle = tint('#c2c9cf'); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(wx0, wy0); ctx.lineTo(wx1, wy1); ctx.stroke();
  // glowing rune fuller
  const ra = 0.5 + Math.sin(t * 2.8) * 0.3;
  ctx.strokeStyle = `rgba(158,203,255,${ra})`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(lerp(wx0, wx1, 0.15), lerp(wy0, wy1, 0.15)); ctx.lineTo(lerp(wx0, wx1, 0.8), lerp(wy0, wy1, 0.8)); ctx.stroke();
  for (const k of [0.3, 0.48, 0.66]) { // rune ticks
    ctx.beginPath(); ctx.moveTo(lerp(wx0, wx1, k), lerp(wy0, wy1, k) - 1.4); ctx.lineTo(lerp(wx0, wx1, k) + 0.8, lerp(wy0, wy1, k) + 1.4); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(lerp(wx0, wx1, 0.08), lerp(wy0, wy1, 0.08) - 1.2); ctx.lineTo(lerp(wx0, wx1, 0.9), lerp(wy0, wy1, 0.9) - 1.2); ctx.stroke();
  // tip taper
  ctx.fillStyle = tint('#c2c9cf');
  ctx.beginPath(); ctx.moveTo(wx1 + fx * 2.6, wy1 + h.fy * 1.4);
  ctx.lineTo(wx1, wy1 - 2.2); ctx.lineTo(wx1, wy1 + 2.2); ctx.closePath(); ctx.fill();
  // crossguard + wrapped grip
  ctx.strokeStyle = tint('#8a7148'); ctx.lineWidth = 2.1;
  ctx.beginPath(); ctx.moveTo(wx0 + 1.2, wy0 - 3.8); ctx.lineTo(wx0 + 1.2, wy0 + 3.8); ctx.stroke();
  ctx.fillStyle = tint('#8a7148');
  ctx.beginPath(); ctx.arc(wx0 + 1.2, wy0 - 4, 1.1, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(wx0 + 1.2, wy0 + 4, 1.1, 0, 7); ctx.fill();
  ctx.strokeStyle = tint('#3c2e1c'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(wx0 - 1.4, wy0 + 0.8); ctx.lineTo(wx0 + 0.4, wy0 - 0.8); ctx.stroke();
  // kite shield: scuffed paint, chevron, boss
  const shx = -fx * 10.4;
  ctx.fillStyle = grad(-23, -7.4, '#525c66', 22, -24);
  ctx.beginPath();
  ctx.moveTo(shx, -23);
  ctx.quadraticCurveTo(shx - 5.8, -18.8, shx - 4.8, -13);
  ctx.quadraticCurveTo(shx - 2.4, -8.4, shx, -7.2);
  ctx.quadraticCurveTo(shx + 2.4, -8.4, shx + 4.8, -13);
  ctx.quadraticCurveTo(shx + 5.8, -18.8, shx, -23);
  ctx.closePath(); ctx.fill(); outline(1.4);
  scratches(ctx, shx, -15, 3.4, 4.4, seed + 11, 5, hurt2(h, 'rgba(16,20,26,0.65)'), 'rgba(220,228,235,0.3)');
  ctx.strokeStyle = tint('#39424a'); ctx.lineWidth = 1.2; // inner rim
  ctx.beginPath();
  ctx.moveTo(shx, -21);
  ctx.quadraticCurveTo(shx - 4, -18, shx - 3.2, -13);
  ctx.quadraticCurveTo(shx - 1.8, -9.6, shx, -9);
  ctx.quadraticCurveTo(shx + 1.8, -9.6, shx + 3.2, -13);
  ctx.quadraticCurveTo(shx + 4, -18, shx, -21);
  ctx.stroke();
  // chipped paint chevron
  ctx.strokeStyle = tint('#9b8bc4'); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(shx - 2.8, -17.8); ctx.lineTo(shx, -14.6); ctx.lineTo(shx + 2.8, -17.8); ctx.stroke();
  ctx.fillStyle = hurt2(h, 'rgba(82,92,102,1)'); // paint chip
  ctx.fillRect(shx + 1, -16.6, 1.2, 1);
  ctx.fillStyle = tint('#7e868e'); // boss
  ctx.beginPath(); ctx.arc(shx, -15.2, 1.6, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(230,240,250,0.6)';
  ctx.beginPath(); ctx.arc(shx - 0.5, -15.7, 0.6, 0, 7); ctx.fill();
};

// ---------- corpses ----------
function drawCorpse(ctx, c) {
  const age = STATE.time - c.born;
  const a = age < 2.2 ? 1 : Math.max(0, 1 - (age - 2.2) / 2.0);
  if (a <= 0) return;
  const s = worldToScreen(c.x, c.y);
  const style = GORE_STYLE[c.type] || { kind: 'blood', body: '#3c3228' };
  const sc = (c.scale || 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(s.x, s.y);
  switch (style.kind) {
    case 'bone': {
      const fx = fxTex();
      const spr = fx.decals.bones[c.seed % 3];
      ctx.drawImage(spr, -28 * sc, -18 * sc, 56 * sc, 36 * sc);
      ctx.fillStyle = 'rgba(208,198,176,0.6)';
      ctx.beginPath(); ctx.arc(Math.cos(c.seed) * 12 * sc, 4 * sc, 1.4, 0, 7); ctx.fill();
      break;
    }
    case 'mist': {
      ctx.fillStyle = 'rgba(140,200,220,0.30)';
      for (let i = 0; i < 4; i++) {
        const k = Math.min(1, age * 0.8) + i * 0.12;
        ctx.beginPath();
        ctx.arc(Math.cos(c.seed + i * 2.2) * 7 * k, -5 - k * 9 + Math.sin(c.seed * 3 + i) * 3, 3.4 * (1.1 - k * 0.6), 0, 7);
        ctx.fill();
      }
      break;
    }
    default: { // slumped body w/ dropped weapon
      const fa = worldAngToScreen(c.dir || 0);
      const bodyC = style.body;
      ctx.fillStyle = vGrad(ctx, -8, 2, bodyC, 6, -20);
      ctx.beginPath(); ctx.ellipse(0, -3, 11 * sc, 4.6 * sc, fa * 0.12, 0, 7); ctx.fill();
      ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = shade(bodyC, -6);
      ctx.beginPath(); ctx.ellipse(-Math.cos(fa) * 4 * sc, -3.6, 4.4 * sc, 3 * sc, 0, 0, 7); ctx.fill();
      ctx.fillStyle = shade(bodyC, 12);
      ctx.beginPath(); ctx.arc(Math.cos(fa) * 9 * sc, -3.4 + Math.sin(fa) * 2, 3.8 * sc, 0, 7); ctx.fill();
      ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = shade(bodyC, -8); ctx.lineWidth = 2.2 * sc; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-Math.cos(fa) * 4 * sc, -3); ctx.lineTo(-Math.cos(fa) * 11 * sc, -1 + Math.sin(fa) * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(Math.cos(fa) * 5 * sc, -4.4); ctx.lineTo(Math.cos(fa) * 10 * sc, -7.4 + Math.sin(fa) * 1.4); ctx.stroke();
      if (c.type === 'knight' || c.type === 'skeleton') {
        ctx.strokeStyle = 'rgba(154,163,171,0.8)'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(6 * sc, 2); ctx.lineTo(15 * sc, 0.4); ctx.stroke();
        ctx.strokeStyle = 'rgba(110,82,48,0.8)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(5 * sc, 2.2); ctx.lineTo(7 * sc, 1.8); ctx.stroke();
      } else if (c.type === 'brute') {
        ctx.strokeStyle = 'rgba(78,58,40,0.85)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(6 * sc, 3); ctx.lineTo(14 * sc, 1); ctx.stroke();
        ctx.fillStyle = 'rgba(97,88,80,0.85)';
        ctx.beginPath(); ctx.arc(15 * sc, 0.8, 3 * sc, 0, 7); ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}
