// ============================================================
// FATEBOUND — char_hero: detailed hero model
// Jointed limbs, layered gear, cloak, weapon trails.
// Coordinates are world-pass px (ZOOM scales them on screen).
// ============================================================

// two-segment limb: shoulder/hip -> knee/elbow -> foot/hand
function limb(ctx, x0, y0, x1, y1, x2, y2, w, c1, c2) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = c1; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = c2 || c1; ctx.lineWidth = w * 0.92;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

// metal tone of equipped plate, by rarity — gives each tier a distinct look
const ARMOR_TONE    = { common: '#79828c', magic: '#6c7f9b', rare: '#9a8a55', epic: '#6d5f86', legendary: '#5c4446' };
const ARMOR_TONE_DK = { common: '#5d6772', magic: '#4f6480', rare: '#7d6e3e', epic: '#534670', legendary: '#3f2d2f' };
const HELM_TONE     = { common: '#7e868e', magic: '#6f8298', rare: '#9c8c58', epic: '#71638a', legendary: '#5e4648' };

function drawHero(ctx, p) {
  const s = worldToScreen(p.x, p.y);
  const fa = worldAngToScreen(p.dir);
  const fx = Math.cos(fa), fy = Math.sin(fa);
  const stepping = (Math.abs(p.moveX) > 0.01 || Math.abs(p.moveY) > 0.01 || p.dodgeT > 0);
  const ph = p.walkT * 3.2;
  const step = stepping ? Math.sin(ph) * 1 : 0;          // -1..1 leg phase
  const bob = stepping ? Math.abs(Math.cos(ph)) * 1.6 : Math.sin(STATE.time * 1.6) * 0.7;
  const flash = p.invulnT > 0 && Math.sin(STATE.time * 30) > 0;
  const hasChest = !!p.equipment.chest;
  const hasHelm = !!p.equipment.helm;
  const chestIt = p.equipment.chest, helmIt = p.equipment.helm, bootIt = p.equipment.boots;
  const chestR = chestIt ? chestIt.rarity : 'common';
  const helmR = helmIt ? helmIt.rarity : 'common';
  const bootR = bootIt ? bootIt.rarity : 'common';
  const chestTone = ARMOR_TONE[chestR] || '#79828c';
  const chestToneDk = ARMOR_TONE_DK[chestR] || '#5d6772';
  const chestTrim = (RARITIES[chestR] && RARITIES[chestR].color) || '#d6b26e';
  const helmTone = HELM_TONE[helmR] || '#7e868e';
  const chestLeg = !!(chestIt && chestIt.power);
  const helmLeg = !!(helmIt && helmIt.power);
  const bootC = bootIt ? (ARMOR_TONE_DK[bootR] || '#3f464e') : '#3a2e21';
  const legC = '#33291d';

  shadow(ctx, s, 11);
  ctx.save();
  if (flash) ctx.globalAlpha = 0.55;

  const gy = s.y;            // ground
  const hipY = gy - 12 - bob * 0.4;

  // ---- legs: hip -> knee -> foot, alternating stride ----
  for (const side of [-1, 1]) {
    const sw = step * side;                       // stride amount for this leg
    const lift = stepping ? Math.max(0, Math.sin(ph * 1 + (side > 0 ? Math.PI : 0))) * 2.2 : 0;
    const hx = s.x + side * 3.6;
    const footX = hx + sw * 3.2, footY = gy - 1 - lift;
    const kneeX = hx + sw * 1.4 + side * 0.6, kneeY = (hipY + footY) / 2 - 1.2;
    limb(ctx, hx, hipY, kneeX, kneeY, footX, footY, 4.2, legC, shade(legC, 6));
    // boot
    ctx.strokeStyle = bootC; ctx.lineWidth = 4.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo((kneeX + footX) / 2, (kneeY + footY) / 2 + 1); ctx.lineTo(footX, footY); ctx.stroke();
    // boot cuff
    ctx.strokeStyle = shade(bootC, 16); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo((kneeX + footX) / 2 - 2.2, (kneeY + footY) / 2 + 0.4); ctx.lineTo((kneeX + footX) / 2 + 2.2, (kneeY + footY) / 2 + 0.4); ctx.stroke();
  }

  const w = p.equipment.main;
  const swing = p.swingT > 0 ? Math.sin((1 - p.swingT / 0.3) * Math.PI) * p.swingDir * 0.9 : 0;
  const weaponBehind = fy < -0.2;

  // ---- cloak: behind body, sways against movement ----
  const clkSway = stepping ? Math.sin(ph * 0.5) * 2.4 : Math.sin(STATE.time * 1.3) * 1.2;
  const clkX = s.x - fx * 4;
  ctx.fillStyle = vGrad(ctx, gy - 27, gy - 5, '#3d2c22', 8, -22);
  ctx.beginPath();
  ctx.moveTo(s.x - 6, gy - 25 - bob);
  ctx.quadraticCurveTo(clkX - 9 + clkSway, gy - 16, clkX - 7 + clkSway * 1.4, gy - 3.5);
  ctx.quadraticCurveTo(clkX - 2 + clkSway * 0.6, gy - 6.5, clkX + 1 + clkSway * 1.2, gy - 3);
  ctx.quadraticCurveTo(clkX + 4 + clkSway * 0.5, gy - 7, s.x + 6, gy - 24 - bob);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(12,8,5,0.5)'; ctx.lineWidth = 1.1; ctx.stroke();
  // ragged hem nicks
  ctx.strokeStyle = 'rgba(12,8,5,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(clkX - 4 + clkSway, gy - 4.5); ctx.lineTo(clkX - 3.4 + clkSway, gy - 8); ctx.stroke();

  if (weaponBehind) drawHeroWeapon(ctx, s, fa + swing, w, p, bob);

  // ---- rear arm (off-weapon side), swings opposite legs ----
  const armSw = stepping ? Math.sin(ph + Math.PI) * 2.6 : 0;
  const rsX = s.x - fx * 7.5, rsY = gy - 22.5 - bob;
  limb(ctx, rsX, rsY, rsX - 1.4 + armSw * 0.5, rsY + 5.6, rsX - 0.6 + armSw, rsY + 10.4, 3.2, hasChest ? '#566069' : '#5d4630', '#caa27c');

  // ---- torso ----
  const torsoC = hasChest ? chestTone : '#6b4f35';
  const tY = gy - bob;
  ctx.fillStyle = vGrad(ctx, tY - 26, tY - 6, torsoC, 24, -24);
  ctx.beginPath();
  ctx.moveTo(s.x - 7.5, tY - 9);
  ctx.quadraticCurveTo(s.x - 8.8, tY - 24, s.x, tY - 26);
  ctx.quadraticCurveTo(s.x + 8.8, tY - 24, s.x + 7.5, tY - 9);
  ctx.quadraticCurveTo(s.x, tY - 6, s.x - 7.5, tY - 9);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.3; ctx.stroke();
  // top-left rim light
  ctx.strokeStyle = 'rgba(255,238,210,0.30)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(s.x - 7.4, tY - 16); ctx.quadraticCurveTo(s.x - 7.8, tY - 23, s.x - 1, tY - 25.6); ctx.stroke();

  if (hasChest) {
    // cuirass: center ridge, waist plates, rivets
    ctx.strokeStyle = 'rgba(20,24,30,0.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(s.x, tY - 24.5); ctx.lineTo(s.x, tY - 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.x - 7.6, tY - 12.4); ctx.quadraticCurveTo(s.x, tY - 9.8, s.x + 7.6, tY - 12.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.x - 8.1, tY - 16.4); ctx.quadraticCurveTo(s.x, tY - 13.8, s.x + 8.1, tY - 16.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,235,245,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(s.x - 5.5, tY - 22); ctx.quadraticCurveTo(s.x, tY - 24.5, s.x + 5.5, tY - 22); ctx.stroke();
    ctx.fillStyle = 'rgba(225,235,245,0.5)';
    for (const [rx, ry] of [[-6.2, -19], [6.2, -19], [-6.8, -13.6], [6.8, -13.6]])
      ctx.fillRect(s.x + rx - 0.6, tY + ry - 0.6, 1.2, 1.2);
    // polished gleam + battle scratches across the breastplate
    gleam(ctx, s.x - 1, tY - 21, 7.4, Math.PI * 1.08, Math.PI * 1.52, 0.26, 1.2);
    scratches(ctx, s.x, tY - 16.5, 6, 5.2, 17, 4, 'rgba(20,24,30,0.5)', 'rgba(225,235,245,0.26)');
    // rarity trim down the flanks + a crest gem on fabled/legendary plate
    if (chestR !== 'common') {
      if (chestLeg) { ctx.shadowColor = chestTrim; ctx.shadowBlur = 6; }
      ctx.strokeStyle = chestLeg ? chestTrim : hexA(chestTrim, 0.85); ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(s.x - 6.8, tY - 11.4); ctx.lineTo(s.x - 5.2, tY - 22.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x + 6.8, tY - 11.4); ctx.lineTo(s.x + 5.2, tY - 22.4); ctx.stroke();
      ctx.shadowBlur = 0;
      if (chestR === 'epic' || chestR === 'legendary') {
        if (chestLeg) { ctx.shadowColor = chestTrim; ctx.shadowBlur = 7; }
        ctx.fillStyle = chestTrim;
        ctx.beginPath(); ctx.arc(s.x, tY - 19.6, 1.9, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(s.x - 0.6, tY - 20.2, 0.7, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    // pauldrons: two-plate, riveted
    for (const side of [-1, 1]) {
      ctx.fillStyle = vGrad(ctx, tY - 27, tY - 17, chestToneDk, 24, -12);
      ctx.beginPath(); ctx.ellipse(s.x + side * 8.2, tY - 22, 4, 5, side * 0.5, 0, 7); ctx.fill();
      ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.strokeStyle = 'rgba(20,24,30,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(s.x + side * 8.6, tY - 20.4, 3.2, 3.4, side * 0.5, -0.8, 2.2); ctx.stroke();
      ctx.fillStyle = 'rgba(230,240,250,0.55)';
      ctx.fillRect(s.x + side * 8 - 0.7, tY - 25.4, 1.4, 1.4);
    }
  } else {
    // leather tunic: cross strap, stitching, shoulder patches
    ctx.strokeStyle = 'rgba(46,30,16,0.7)'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(s.x - 7, tY - 21.5); ctx.lineTo(s.x + 6.4, tY - 10.5); ctx.stroke();
    ctx.fillStyle = '#8a7148';
    ctx.fillRect(s.x - 1.6, tY - 17.4, 2.8, 2.8); // strap buckle
    ctx.strokeStyle = 'rgba(30,18,8,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(s.x, tY - 23.5); ctx.lineTo(s.x, tY - 14); ctx.stroke();
    for (const yy of [-21, -18.4]) {
      ctx.beginPath(); ctx.moveTo(s.x - 1.8, tY + yy); ctx.lineTo(s.x + 1.8, tY + yy); ctx.stroke();
    }
    // cloth shoulders
    for (const side of [-1, 1]) {
      ctx.fillStyle = vGrad(ctx, tY - 26, tY - 19, '#5d4630', 16, -10);
      ctx.beginPath(); ctx.ellipse(s.x + side * 7.6, tY - 22, 3.2, 4, side * 0.5, 0, 7); ctx.fill();
      ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  // belt + buckle + hanging pouch
  ctx.fillStyle = '#3e2f22';
  ctx.fillRect(s.x - 7, tY - 13, 14, 3.2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(s.x - 7, tY - 10.4, 14, 1);
  ctx.fillStyle = '#c7a14a';
  ctx.fillRect(s.x - 1.6, tY - 13.2, 3.2, 3.4);
  ctx.fillStyle = 'rgba(255,240,200,0.6)';
  ctx.fillRect(s.x - 1, tY - 12.6, 1.2, 1.2);
  ctx.fillStyle = vGrad(ctx, tY - 10, tY - 4, '#54412c', 10, -14);
  ctx.beginPath(); ctx.ellipse(s.x - 5.6, tY - 7.4, 2.6, 3, 0.2, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(20,12,6,0.5)'; ctx.lineWidth = 0.9; ctx.stroke();

  // ---- offhand shield ----
  const off = p.equipment.off;
  if (off && off.type === 'shield') {
    const ox = s.x + Math.cos(fa + 1.5) * 10, oy = tY - 16 + Math.sin(fa + 1.5) * 5;
    ctx.fillStyle = vGrad(ctx, oy - 9, oy + 9, '#8b949c', 24, -28);
    ctx.beginPath();
    ctx.moveTo(ox, oy - 8.6);
    ctx.quadraticCurveTo(ox + 6.4, oy - 7, ox + 6, oy - 1);
    ctx.quadraticCurveTo(ox + 5.4, oy + 5.4, ox, oy + 8.6);
    ctx.quadraticCurveTo(ox - 5.4, oy + 5.4, ox - 6, oy - 1);
    ctx.quadraticCurveTo(ox - 6.4, oy - 7, ox, oy - 8.6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.4; ctx.stroke();
    // rim + rivets + center boss
    ctx.strokeStyle = 'rgba(40,46,52,0.65)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ox, oy - 6.6);
    ctx.quadraticCurveTo(ox + 4.6, oy - 5.2, ox + 4.2, oy - 0.6);
    ctx.quadraticCurveTo(ox + 3.8, oy + 4, ox, oy + 6.6);
    ctx.quadraticCurveTo(ox - 3.8, oy + 4, ox - 4.2, oy - 0.6);
    ctx.quadraticCurveTo(ox - 4.6, oy - 5.2, ox, oy - 6.6);
    ctx.stroke();
    ctx.fillStyle = 'rgba(230,240,250,0.5)';
    for (const [bx, by] of [[0, -7.4], [4.8, -3.4], [-4.8, -3.4], [3.6, 4], [-3.6, 4]])
      ctx.fillRect(ox + bx - 0.6, oy + by - 0.6, 1.2, 1.2);
    ctx.fillStyle = RARITIES[off.rarity].color;
    ctx.beginPath(); ctx.arc(ox, oy, 2.4, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(ox - 0.8, oy - 0.8, 0.9, 0, 7); ctx.fill();
  }

  // ---- head ----
  const hY = tY - 30;
  const hg = ctx.createRadialGradient(s.x - 2, hY - 2, 1, s.x, hY, 8);
  hg.addColorStop(0, '#e8c7a0'); hg.addColorStop(1, '#bd9069');
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(s.x, hY, 6.5, 0, 7); ctx.fill();
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.1; ctx.stroke();
  // jaw shade
  ctx.fillStyle = 'rgba(120,80,48,0.30)';
  ctx.beginPath(); ctx.arc(s.x, hY + 2.4, 4.6, 0.3, Math.PI - 0.3); ctx.fill();
  // subtle skin texture: faint freckling + cheek highlight
  mottle(ctx, s.x, hY + 0.6, 4.4, 3.8, 23, 5, 'rgba(150,100,60,0.20)', 'rgba(245,215,175,0.26)', 0.55);
  ctx.fillStyle = 'rgba(255,236,206,0.30)';
  ctx.beginPath(); ctx.arc(s.x - 2.4, hY - 1.4, 1.5, 0, 7); ctx.fill();

  if (hasHelm) {
    // kettle helm: dome, brim, nose guard, rivets, rim light
    ctx.fillStyle = vGrad(ctx, hY - 8.4, hY + 2, helmTone, 28, -16);
    ctx.beginPath(); ctx.arc(s.x, hY - 1, 7, Math.PI, 0); ctx.fill();
    ctx.fillRect(s.x - 7, hY - 1, 14, 2.4);
    ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(s.x, hY - 1, 7, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.x - 7, hY + 1.4); ctx.lineTo(s.x + 7, hY + 1.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,245,255,0.45)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(s.x - 0.6, hY - 1.4, 5.8, Math.PI * 1.12, Math.PI * 1.6); ctx.stroke();
    ctx.fillStyle = '#5d656d';
    ctx.fillRect(s.x + fx * 4 - 1, hY - 1, 2, 4.6);
    ctx.fillStyle = 'rgba(230,240,250,0.6)';
    ctx.fillRect(s.x - 4.5, hY - 3.6, 1.1, 1.1);
    ctx.fillRect(s.x + 3.6, hY - 3.6, 1.1, 1.1);
    ctx.fillRect(s.x - 0.5, hY - 7.2, 1.1, 1.1);
    // rarity brim trim + legendary ember crown
    if (helmR !== 'common') {
      const ht = RARITIES[helmR].color;
      if (helmLeg) { ctx.shadowColor = ht; ctx.shadowBlur = 6; }
      ctx.strokeStyle = helmLeg ? ht : hexA(ht, 0.85); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(s.x - 7, hY + 0.2); ctx.lineTo(s.x + 7, hY + 0.2); ctx.stroke();
      ctx.shadowBlur = 0;
      if (helmLeg) {
        for (let i = 0; i < 3; i++) {
          const fl = Math.sin(STATE.time * 6 + i * 2.1) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255,${(120 + fl * 90) | 0},50,${0.45 + fl * 0.4})`;
          ctx.beginPath(); ctx.arc(s.x - 3.4 + i * 3.4, hY - 8.4 - fl * 2.2, 1 + fl, 0, 7); ctx.fill();
        }
      }
    }
  } else {
    // swept hair with strands + highlight
    ctx.fillStyle = '#4a3725';
    ctx.beginPath(); ctx.arc(s.x, hY - 2, 6.2, Math.PI * 1.0, Math.PI * 2.0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s.x - 6.2, hY - 2); ctx.quadraticCurveTo(s.x - 7, hY + 1.4, s.x - 5, hY + 2.4); ctx.quadraticCurveTo(s.x - 5.6, hY - 0.6, s.x - 4.4, hY - 2.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.moveTo(s.x + 2, hY - 5.8); ctx.quadraticCurveTo(s.x + 4.4, hY - 4.6, s.x + 5.6, hY - 2.2); ctx.quadraticCurveTo(s.x + 4, hY - 4, s.x + 1.4, hY - 4.6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150,112,70,0.65)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(s.x - 3.4, hY - 6.2); ctx.quadraticCurveTo(s.x - 1, hY - 7.4, s.x + 1.6, hY - 6.6); ctx.stroke();
  }
  // eyes track aim + nose hint
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.arc(s.x + fx * 3.2 - 1.4, hY + fy * 1.5 + 0.2, 1.1, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(s.x + fx * 3.2 + 1.6, hY + fy * 1.5 + 0.2, 1.1, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(140,95,58,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(s.x + fx * 4.4, hY + 1.2 + fy); ctx.lineTo(s.x + fx * 4.4 - 0.8, hY + 2.6 + fy); ctx.stroke();

  // ---- front arm to weapon grip ----
  const fsX = s.x + fx * 7.2, fsY = tY - 22;
  const grX = s.x + Math.cos(fa + swing) * 9, grY = tY - 16 + Math.sin(fa + swing) * 5;
  limb(ctx, fsX, fsY, (fsX + grX) / 2 + fy * 1.6, (fsY + grY) / 2 + 1.4, grX, grY, 3.2, hasChest ? '#566069' : '#5d4630', '#caa27c');
  ctx.fillStyle = '#8a6a48'; // glove
  ctx.beginPath(); ctx.arc(grX, grY, 2.2, 0, 7); ctx.fill();

  if (!weaponBehind) drawHeroWeapon(ctx, s, fa + swing, w, p, bob);
  ctx.restore();
}

function drawHeroWeapon(ctx, s, ang, w, p, bob) {
  const hy0 = s.y - 16 - (bob || 0);
  const hx = s.x + Math.cos(ang) * 9, hy = hy0 + Math.sin(ang) * 5;

  // swing trail arc
  if (p.swingT > 0) {
    const k = 1 - p.swingT / 0.3;
    const a0 = ang - p.swingDir * 1.2 * (1 - k);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 * Math.sin(k * Math.PI);
    const tg = ctx.createRadialGradient(s.x, hy0, 6, s.x, hy0, 26);
    tg.addColorStop(0, 'rgba(255,250,235,0)');
    tg.addColorStop(0.75, 'rgba(255,246,220,0.55)');
    tg.addColorStop(1, 'rgba(255,246,220,0)');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(s.x, hy0);
    ctx.arc(s.x, hy0, 26, Math.min(a0, ang), Math.max(a0, ang));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(ang);
  const rc = w ? RARITIES[w.rarity].color : '#b8b2a6';
  const type = w ? w.type : 'sword';
  const rare = w && w.rarity !== 'common';
  const wLeg = w && w.power;
  ctx.lineCap = 'round';
  // steel blade with edge + fuller
  const blade = (x0, x1, lw) => {
    ctx.strokeStyle = '#4d555d'; ctx.lineWidth = lw + 1.8;
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    ctx.strokeStyle = '#cfd6dc'; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    // tip taper
    ctx.fillStyle = '#cfd6dc';
    ctx.beginPath(); ctx.moveTo(x1, -lw * 0.5); ctx.lineTo(x1 + lw * 1.1, 0); ctx.lineTo(x1, lw * 0.5); ctx.closePath(); ctx.fill();
    // fuller groove + edge highlight
    ctx.strokeStyle = 'rgba(70,80,90,0.6)'; ctx.lineWidth = lw * 0.26;
    ctx.beginPath(); ctx.moveTo(x0 + 1.4, 0); ctx.lineTo(x1 - 2, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + 1, -lw * 0.32); ctx.lineTo(x1 - 1, -lw * 0.32); ctx.stroke();
  };
  // leather-wrapped grip with bands + pommel
  const grip = (x0, x1, lw) => {
    ctx.strokeStyle = '#3c2f20'; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,12,6,0.6)'; ctx.lineWidth = 1;
    const n = Math.max(2, ((x1 - x0) / 1.6) | 0);
    for (let i = 1; i < n; i++) {
      const gx = x0 + (x1 - x0) * (i / n);
      ctx.beginPath(); ctx.moveTo(gx, -lw * 0.4); ctx.lineTo(gx + 0.7, lw * 0.4); ctx.stroke();
    }
    ctx.fillStyle = '#8a7148';
    ctx.beginPath(); ctx.arc(x0 - 0.8, 0, 1.7, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.5)';
    ctx.beginPath(); ctx.arc(x0 - 1.2, -0.5, 0.6, 0, 7); ctx.fill();
  };
  if (rare) { ctx.shadowColor = rc; ctx.shadowBlur = wLeg ? 11 + Math.sin(STATE.time * 5) * 3 : (w.rarity === 'epic' ? 9 : 7); }
  switch (type) {
    case 'sword':
      grip(-1, 3, 2.8);
      blade(4.5, 21, 3.2);
      // crossguard with quillon balls
      ctx.strokeStyle = rc; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(4, -4.4); ctx.lineTo(4, 4.4); ctx.stroke();
      ctx.fillStyle = rc;
      ctx.beginPath(); ctx.arc(4, -4.6, 1.3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(4, 4.6, 1.3, 0, 7); ctx.fill();
      break;
    case 'dagger':
      grip(0, 3, 2.4);
      blade(3.6, 13.5, 2.6);
      ctx.strokeStyle = rc; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(3.5, -3); ctx.lineTo(3.5, 3); ctx.stroke();
      break;
    case 'spear': {
      ctx.strokeStyle = '#5d4426'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(20, 0); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,225,180,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-7, -0.8); ctx.lineTo(19, -0.8); ctx.stroke();
      // lashing below the head
      ctx.strokeStyle = '#8a7148'; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(15.4 + i * 1.3, -1.6); ctx.lineTo(16.2 + i * 1.3, 1.6); ctx.stroke(); }
      // leaf head
      ctx.fillStyle = '#cfd6dc';
      ctx.beginPath(); ctx.moveTo(28.5, 0); ctx.quadraticCurveTo(24, -3.6, 19, -2.6); ctx.lineTo(19, 2.6); ctx.quadraticCurveTo(24, 3.6, 28.5, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(70,80,90,0.7)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(27, 0); ctx.stroke();
      ctx.strokeStyle = rc; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(18.5, -2.8); ctx.lineTo(18.5, 2.8); ctx.stroke();
      break;
    }
    case 'bow': {
      // recurve limbs + wrapped grip + string
      ctx.strokeStyle = '#5d4426'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.arc(6, 0, 9, -1.25, 1.25); ctx.stroke();
      ctx.strokeStyle = '#3c2f20'; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.arc(6, 0, 9, -0.3, 0.3); ctx.stroke();
      ctx.strokeStyle = rc; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(6, 0, 9, -0.5, -0.34); ctx.stroke();
      ctx.beginPath(); ctx.arc(6, 0, 9, 0.34, 0.5); ctx.stroke();
      // tips
      ctx.fillStyle = '#cfd6dc';
      ctx.beginPath(); ctx.arc(6 + Math.cos(-1.25) * 9, Math.sin(-1.25) * 9, 1.1, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(6 + Math.cos(1.25) * 9, Math.sin(1.25) * 9, 1.1, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(6 + Math.cos(-1.25) * 9, Math.sin(-1.25) * 9); ctx.lineTo(6 + Math.cos(1.25) * 9, Math.sin(1.25) * 9); ctx.stroke();
      break;
    }
    case 'crossbow':
      ctx.strokeStyle = '#5d4426'; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(14, 0); ctx.stroke();
      ctx.strokeStyle = '#3c2f20'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(2, 0); ctx.stroke();
      // steel lath + string + stirrup
      ctx.strokeStyle = '#cfd6dc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, -6.4); ctx.quadraticCurveTo(12.4, 0, 10, 6.4); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(10, -6.2); ctx.lineTo(3, 0); ctx.lineTo(10, 6.2); ctx.stroke();
      ctx.strokeStyle = rc; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(15.4, 0, 2, -1.8, 1.8); ctx.stroke();
      break;
    case 'wand':
      ctx.strokeStyle = '#5d4426'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(13, 0); ctx.stroke();
      // spiral binding
      ctx.strokeStyle = 'rgba(200,170,110,0.7)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(4, -1.2); ctx.quadraticCurveTo(7, 1.4, 10, -1.2); ctx.stroke();
      ctx.fillStyle = rc;
      ctx.beginPath(); ctx.arc(15, 0, 3, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath(); ctx.arc(14, -1, 1.1, 0, 7); ctx.fill();
      break;
    case 'staff': {
      ctx.strokeStyle = '#5d4426'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(15, 0); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,225,180,0.22)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-9, -0.9); ctx.lineTo(14, -0.9); ctx.stroke();
      // iron claw cradling the orb
      ctx.strokeStyle = '#2c2722'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(15, -2); ctx.quadraticCurveTo(18.4, -4.4, 21.4, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15, 2); ctx.quadraticCurveTo(18.4, 4.4, 21.4, 2); ctx.stroke();
      const pulse = 0.8 + Math.sin(STATE.time * 4) * 0.2;
      const og = ctx.createRadialGradient(19, 0, 0, 19, 0, 8 * pulse);
      og.addColorStop(0, rc + 'aa'); og.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = og; ctx.fillRect(11, -8, 16, 16);
      ctx.fillStyle = rc;
      ctx.beginPath(); ctx.arc(19, 0, 4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(18, -1.2, 1.6, 0, 7); ctx.fill();
      break;
    }
  }
  ctx.restore();
}
