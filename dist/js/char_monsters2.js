// ============================================================
// FATEBOUND — char_monsters2: spider, brute, shaman
// ============================================================

// ---------- cave spider ----------
MONSTER_DRAW.spider = function (ctx, e, h) {
  const { t, fa, fx, tint, grad, outline, seed } = h;
  ctx.lineCap = 'round';
  // 8 legs: coxa -> femur -> tarsus, banded chitin plates, rippling gait
  for (let i = 0; i < 4; i++) {
    const la = (i - 1.5) * 0.5;
    for (const sgn of [1, -1]) {
      const wig = Math.sin(t * 11 + i * 1.7 + (sgn > 0 ? 0 : Math.PI)) * 2.1;
      const kx = sgn * Math.cos(la) * 8.8, ky = -11 + wig * 0.4;
      const fx2 = sgn * Math.cos(la) * 15.4, fy2 = -1 + wig * 0.5;
      ctx.strokeStyle = tint('#1c1612'); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(sgn * 2, -7.5); ctx.lineTo(kx, ky); ctx.stroke();
      ctx.strokeStyle = tint('#2e251d'); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx2, fy2); ctx.stroke();
      // pale chitin band at each joint
      ctx.strokeStyle = tint('#5e4e38'); ctx.lineWidth = 0.9;
      const bx2 = lerp(sgn * 2, kx, 0.55), by2 = lerp(-7.5, ky, 0.55);
      ctx.beginPath(); ctx.moveTo(bx2 - 1, by2); ctx.lineTo(bx2 + 1, by2 + 0.6); ctx.stroke();
      // bristle tufts
      ctx.strokeStyle = hurt2(h, 'rgba(70,56,40,0.85)'); ctx.lineWidth = 0.7;
      const mx = (sgn * 2 + kx) / 2, my = (-7.5 + ky) / 2;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + sgn * 1.1, my - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + sgn * 0.9, ky - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lerp(kx, fx2, 0.5), lerp(ky, fy2, 0.5)); ctx.lineTo(lerp(kx, fx2, 0.5) + sgn * 0.8, lerp(ky, fy2, 0.5) - 1.6); ctx.stroke();
      // joint knob + tarsal claw
      ctx.fillStyle = tint('#15100c');
      ctx.beginPath(); ctx.arc(kx, ky, 1.1, 0, 7); ctx.fill();
      ctx.strokeStyle = tint('#c9bda4'); ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(fx2, fy2); ctx.lineTo(fx2 + sgn * 1, fy2 + 0.6); ctx.stroke();
    }
  }
  // abdomen: bulbous, glossy, marked, breathing
  const breathe = 1 + Math.sin(t * 3.2) * 0.045;
  ctx.save();
  ctx.translate(-fx * 4.4, -9.4);
  ctx.scale(breathe, breathe);
  ctx.fillStyle = grad(-7.4, 6.8, '#352a20', 18, -22);
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, 0, 0, 7); ctx.fill(); outline(1.3);
  coreShadow(ctx, 0, 0.6, 8.6, 6.6);
  // glossy chitin speculars
  gleam(ctx, -1.4, -1.4, 5.4, Math.PI * 1.05, Math.PI * 1.5, 0.30, 1.6);
  gleam(ctx, 1, 0.4, 6.8, Math.PI * 1.7, Math.PI * 1.92, 0.16, 1.1);
  // pale hourglass marking
  ctx.fillStyle = tint('#6e4e2e');
  ctx.beginPath();
  ctx.moveTo(-2.4, -4.8); ctx.lineTo(2.4, -4.8); ctx.lineTo(0.8, -1); ctx.lineTo(2.2, 2.8); ctx.lineTo(-2.2, 2.8); ctx.lineTo(-0.8, -1);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = hurt2(h, 'rgba(20,14,8,0.5)'); ctx.lineWidth = 0.6; ctx.stroke();
  // mottled hide + dense rear bristles
  mottle(ctx, 0, 0, 6.6, 5, seed, 8, hurt2(h, 'rgba(20,14,10,0.55)'), hurt2(h, 'rgba(94,78,56,0.5)'), 0.7);
  for (let i = 0; i < 7; i++) {
    const ba = Math.PI * (0.66 + i * 0.115);
    ctx.strokeStyle = hurt2(h, 'rgba(70,56,40,0.75)'); ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(Math.cos(ba) * 8.6, Math.sin(ba) * 6.6);
    ctx.lineTo(Math.cos(ba) * 11.4, Math.sin(ba) * 9); ctx.stroke();
  }
  // spinnerets + silk strand
  ctx.fillStyle = tint('#15100c');
  ctx.beginPath(); ctx.arc(-fx * 8.2, 1.6, 1.3, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(220,225,215,0.25)'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(-fx * 8.8, 2.2);
  ctx.quadraticCurveTo(-fx * 11, 5 + Math.sin(t * 2) * 1, -fx * 12, 8.4); ctx.stroke();
  ctx.restore();
  // cephalothorax: armored carapace plate
  ctx.fillStyle = grad(-12.4, -2.6, '#46382c', 16, -16);
  ctx.beginPath(); ctx.ellipse(fx * 5.8, -7.2, 5.2, 4.3, 0, 0, 7); ctx.fill(); outline(1.1);
  gleam(ctx, fx * 5.8 - 1.4, -8.4, 2.8, Math.PI * 1.1, Math.PI * 1.6, 0.25, 1.1);
  // carapace groove
  ctx.strokeStyle = hurt2(h, 'rgba(20,14,8,0.6)'); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(fx * 5.8 - 3, -9.4); ctx.quadraticCurveTo(fx * 5.8, -8.2, fx * 5.8 + 3, -9.4); ctx.stroke();
  // pedipalps: jointed feelers
  ctx.strokeStyle = tint('#2e251d'); ctx.lineWidth = 1.4;
  for (const off of [-2.2, 2.2]) {
    const wig = Math.sin(t * 9 + off) * 0.9;
    ctx.beginPath(); ctx.moveTo(fx * 8.8 + off * 0.4, -6.2);
    ctx.quadraticCurveTo(fx * 10.8 + off, -5.2 + wig, fx * 11.6 + off, -3.6 + wig * 0.5); ctx.stroke();
    ctx.fillStyle = tint('#15100c');
    ctx.beginPath(); ctx.arc(fx * 10.6 + off * 0.8, -5 + wig * 0.7, 0.7, 0, 7); ctx.fill();
  }
  // chelicerae + venom-dripping fangs
  ctx.fillStyle = tint('#241c14');
  ctx.beginPath(); ctx.ellipse(fx * 9.2, -5.2, 2.2, 1.6, 0, 0, 7); ctx.fill();
  for (const off of [-1.4, 1.4]) {
    ctx.fillStyle = tint('#c9bda4');
    ctx.beginPath(); ctx.moveTo(fx * 9.2 + off - 0.9, -5.2); ctx.lineTo(fx * 9.2 + off - 0.1, -2.4); ctx.lineTo(fx * 9.2 + off + 0.8, -5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hurt2(h, 'rgba(20,14,8,0.4)'); ctx.lineWidth = 0.5; ctx.stroke();
  }
  const drip = (t * 0.9) % 1;
  if (drip < 0.8) {
    ctx.fillStyle = `rgba(140,180,70,${0.75 - drip * 0.8})`;
    ctx.beginPath(); ctx.arc(fx * 9.2, -2.2 + drip * 5, 0.9, 0, 7); ctx.fill();
  }
  // two rows of glossy eyes w/ highlights
  for (let i = 0; i < 4; i++) {
    const ex = fx * 5.8 - 2.9 + i * 2, big = i === 1 || i === 2;
    ctx.fillStyle = '#b32417';
    ctx.beginPath(); ctx.arc(ex, -10, big ? 1.25 : 0.8, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff6450';
    ctx.beginPath(); ctx.arc(ex - 0.3, -10.3, big ? 0.5 : 0.3, 0, 7); ctx.fill();
  }
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = '#b32417';
    ctx.beginPath(); ctx.arc(fx * 5.8 - 1.1 + i * 2.2, -11.6, 0.6, 0, 7); ctx.fill();
  }
};

// ---------- orc brute ----------
MONSTER_DRAW.brute = function (ctx, e, h) {
  const { t, fa, fx, tint, grad, outline, seed } = h;
  const breathe = Math.sin(t * 2.4) * 0.9;
  // trunk legs w/ wrapped shins
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.strokeStyle = tint('#4a5c28'); ctx.lineWidth = 4.6;
    ctx.beginPath(); ctx.moveTo(side * 5, -9); ctx.lineTo(side * 5.4, -0.8); ctx.stroke();
    ctx.strokeStyle = tint('#3c2e1c'); ctx.lineWidth = 1.1; // shin wraps
    for (let i = 0; i < 2; i++) {
      ctx.beginPath(); ctx.moveTo(side * 5 - 2, -5.4 - i * 2); ctx.lineTo(side * 5 + 2.2, -4.6 - i * 2); ctx.stroke();
    }
  }
  // hulking torso: trapezius hump, sloped shoulders
  ctx.fillStyle = grad(-26, 0, '#55702f', 24, -28);
  ctx.beginPath();
  ctx.moveTo(-12, -1);
  ctx.quadraticCurveTo(-15, -20 - breathe, -5, -25.4 - breathe);   // hump rises behind
  ctx.quadraticCurveTo(0, -27.4 - breathe, 5, -25.4 - breathe);
  ctx.quadraticCurveTo(15, -20 - breathe, 12, -1);
  ctx.closePath(); ctx.fill(); outline(1.5);
  coreShadow(ctx, 0, -11, 11.6, 11);
  h.rim(-3.4, -18 - breathe, 10, Math.PI * 1.12, Math.PI * 1.46);
  // muscle definition: pecs, abs, obliques + skin mottle
  ctx.strokeStyle = hurt2(h, 'rgba(38,52,18,0.8)'); ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(-7.8, -17.4 - breathe); ctx.quadraticCurveTo(0, -14.6 - breathe, 7.8, -17.4 - breathe); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -15 - breathe); ctx.lineTo(0, -7.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3.8, -12.8); ctx.quadraticCurveTo(0, -11.8, 3.8, -12.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3.4, -9.8); ctx.quadraticCurveTo(0, -8.8, 3.4, -9.8); ctx.stroke();
  ctx.strokeStyle = hurt2(h, 'rgba(38,52,18,0.5)'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-9.4, -13.4); ctx.quadraticCurveTo(-7.4, -10.4, -7.8, -7.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9.4, -13.4); ctx.quadraticCurveTo(7.4, -10.4, 7.8, -7.4); ctx.stroke();
  // highlight on pec tops
  ctx.strokeStyle = hurt2(h, 'rgba(160,190,100,0.4)'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-6.4, -18.6 - breathe); ctx.quadraticCurveTo(-3.4, -19.6 - breathe, -1, -18.8 - breathe); ctx.stroke();
  mottle(ctx, -4, -14, 6, 6, seed, 8, hurt2(h, 'rgba(50,66,24,0.5)'), hurt2(h, 'rgba(110,140,64,0.4)'), 0.8);
  // war paint: ochre stripes across the chest
  ctx.strokeStyle = tint('#b3622e'); ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(2, -20.4 - breathe); ctx.lineTo(7.4, -15.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4.6, -21 - breathe); ctx.lineTo(9.4, -16.6); ctx.stroke();
  // old scars
  ctx.strokeStyle = tint('#7e9a52'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-7.4, -19.4); ctx.lineTo(-3.4, -14.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6.4, -18.8); ctx.lineTo(-5, -17.2); ctx.stroke();
  // leather harness w/ skull trophy
  ctx.strokeStyle = tint('#3c2e1c'); ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-9.4, -21.4 - breathe); ctx.lineTo(6, -9.4); ctx.stroke();
  ctx.strokeStyle = hurt2(h, 'rgba(20,12,6,0.5)'); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-8.4, -21.6 - breathe); ctx.lineTo(7, -9.8); ctx.stroke();
  ctx.fillStyle = tint('#d8d0ba'); // tiny skull on the strap
  ctx.beginPath(); ctx.arc(-2, -16, 2, 0, 7); ctx.fill();
  ctx.fillStyle = '#15110c';
  ctx.beginPath(); ctx.arc(-2.7, -16.3, 0.5, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(-1.3, -16.3, 0.5, 0, 7); ctx.fill();
  // hide loincloth, stitched
  ctx.fillStyle = tint('#5e4a30');
  ctx.beginPath(); ctx.moveTo(-9.4, -7.4); ctx.quadraticCurveTo(0, -3.4, 9.4, -7.4); ctx.lineTo(8.4, -0.4); ctx.quadraticCurveTo(0, 2.6, -8.4, -0.4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = tint('#3c2e1c'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-7.4, -5.6); ctx.quadraticCurveTo(0, -2.2, 7.4, -5.6); ctx.stroke();
  for (const sx of [-4.6, 0, 4.6]) { ctx.beginPath(); ctx.moveTo(sx, -5.4); ctx.lineTo(sx + 0.7, -3); ctx.stroke(); }
  mottle(ctx, 0, -4.4, 6.4, 2, seed + 4, 5, hurt2(h, 'rgba(40,28,16,0.5)'), hurt2(h, 'rgba(120,96,60,0.45)'), 0.7);
  // bone-spiked pauldron, strapped
  const ps = -fx > 0 ? 1 : -1;
  ctx.fillStyle = grad(-28, -17, '#4e3a28', 16, -16);
  ctx.beginPath(); ctx.ellipse(ps * 10.4, -21.4 - breathe * 0.5, 5, 5.8, ps * 0.5, 0, 7); ctx.fill(); outline(1.2);
  scratches(ctx, ps * 10.4, -21.4, 3.4, 3.6, seed + 7, 4, hurt2(h, 'rgba(20,12,6,0.6)'), 'rgba(160,130,90,0.3)');
  ctx.fillStyle = tint('#d8d0ba');
  for (let i = 0; i < 3; i++) {
    const a2 = -Math.PI / 2 + (i - 1) * 0.6;
    ctx.beginPath();
    ctx.moveTo(ps * 10.4 + Math.cos(a2) * 3.6 - 1.1, -21.4 + Math.sin(a2) * 4.4);
    ctx.lineTo(ps * 10.4 + Math.cos(a2) * 8, -21.4 + Math.sin(a2) * 8.8);
    ctx.lineTo(ps * 10.4 + Math.cos(a2) * 3.6 + 1.1, -21.4 + Math.sin(a2) * 4.4 + 1);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hurt2(h, 'rgba(110,98,72,0.6)'); ctx.lineWidth = 0.5; ctx.stroke();
  }
  // head: heavy brow, jutting underbite, tusks
  const hY = -28.4 - breathe * 0.5;
  ctx.fillStyle = grad(hY - 8, hY + 6, '#647f3c', 20, -16);
  ctx.beginPath(); ctx.arc(0, hY, 7.8, 0, 7); ctx.fill(); outline(1.3);
  h.rim(0, hY, 6.9);
  coreShadow(ctx, 0, hY + 0.6, 7.4, 7);
  mottle(ctx, 0, hY - 2, 5, 4, seed + 2, 6, hurt2(h, 'rgba(50,66,24,0.5)'), hurt2(h, 'rgba(110,140,64,0.4)'), 0.6);
  // brow ridge: heavy double stroke
  ctx.strokeStyle = hurt2(h, 'rgba(38,52,18,0.95)'); ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(-5.6, hY - 2.6); ctx.quadraticCurveTo(0, hY - 4.6, 5.6, hY - 2.6); ctx.stroke();
  ctx.strokeStyle = hurt2(h, 'rgba(160,190,100,0.35)'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-5, hY - 3.8); ctx.quadraticCurveTo(0, hY - 5.6, 5, hY - 3.8); ctx.stroke();
  // war paint stripe down the face
  ctx.strokeStyle = tint('#b3622e'); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-fx * 2 - 1, hY - 6.6); ctx.lineTo(-fx * 2 - 1, hY + 2.4); ctx.stroke();
  // jutting jaw w/ lower teeth + tusks
  ctx.fillStyle = tint('#5d7634');
  ctx.beginPath(); ctx.ellipse(fx * 2.6, hY + 4.4, 5.8, 3.2, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = tint('#e8e0c8');
  for (const tx2 of [-1.4, 0, 1.2]) ctx.fillRect(fx * 2.6 + tx2, hY + 2.6, 1, 1.5);
  for (const side of [-1, 1]) {
    ctx.fillStyle = tint('#e8e0c8');
    ctx.beginPath();
    ctx.moveTo(fx * 2.6 + side * 4.4, hY + 5);
    ctx.quadraticCurveTo(fx * 2.6 + side * 4.6, hY + 1, fx * 2.6 + side * 3.2, hY - 0.6);
    ctx.lineTo(fx * 2.6 + side * 2.2, hY + 4.6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hurt2(h, 'rgba(120,108,84,0.5)'); ctx.lineWidth = 0.5; ctx.stroke();
  }
  // ears, one notched + bone earring
  ctx.fillStyle = tint('#55702f');
  ctx.beginPath(); ctx.moveTo(-7.4, hY - 1.6); ctx.lineTo(-12, hY - 3.6); ctx.lineTo(-7.4, hY + 1.4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7.4, hY - 1.6); ctx.lineTo(12, hY - 3.6); ctx.lineTo(10.2, hY - 1.3); ctx.lineTo(11.2, hY - 0.6); ctx.lineTo(7.4, hY + 1.4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = tint('#d8d0ba'); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(-10.4, hY + 0.4, 1.1, 0, Math.PI); ctx.stroke();
  // sunken burning eyes under the brow
  ctx.fillStyle = '#1c130c';
  ctx.beginPath(); ctx.ellipse(-2.7, hY - 1.2, 1.9, 1.5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(2.7, hY - 1.2, 1.9, 1.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath(); ctx.arc(-2.7 + fx * 0.7, hY - 1.3, 0.8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(2.7 + fx * 0.7, hY - 1.3, 0.8, 0, 7); ctx.fill();
  // massive arm + wrist wraps
  ctx.strokeStyle = tint('#4e6128'); ctx.lineWidth = 4.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(fx * 10, -19.4); ctx.lineTo(fx * 11.4, -13); ctx.stroke();
  ctx.strokeStyle = hurt2(h, 'rgba(38,52,18,0.6)'); ctx.lineWidth = 1; // bicep line
  ctx.beginPath(); ctx.moveTo(fx * 9.4, -18.4); ctx.lineTo(fx * 10.4, -15.4); ctx.stroke();
  ctx.strokeStyle = tint('#3c2e1c'); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(fx * 10.4 - 1.8, -15.2); ctx.lineTo(fx * 10.4 + 1.8, -14.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(fx * 10.8 - 1.8, -13.8); ctx.lineTo(fx * 10.8 + 1.8, -13); ctx.stroke();
  // club: grained haft, iron band, studded head, blood stain
  const cx2 = fx * 23, cy2 = -10 + h.fy * 7;
  ctx.strokeStyle = tint('#4e3a28'); ctx.lineWidth = 4.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(fx * 10, -12); ctx.lineTo(cx2, cy2); ctx.stroke();
  ctx.strokeStyle = hurt2(h, 'rgba(30,20,10,0.6)'); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(fx * 11.4, -12.4); ctx.lineTo(cx2 - fx * 2.4, cy2 - 0.6); ctx.stroke();
  ctx.strokeStyle = hurt2(h, 'rgba(120,90,60,0.4)'); ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(fx * 11.4, -10.8); ctx.lineTo(cx2 - fx * 3, cy2 + 0.8); ctx.stroke();
  ctx.strokeStyle = tint('#2c2722'); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(lerp(fx * 10, cx2, 0.72), lerp(-12, cy2, 0.72) - 2.5); ctx.lineTo(lerp(fx * 10, cx2, 0.72) + 0.8, lerp(-12, cy2, 0.72) + 2.5); ctx.stroke();
  ctx.fillStyle = grad(cy2 - 6.4, cy2 + 6.4, '#615850', 18, -20);
  ctx.beginPath(); ctx.arc(cx2 + fx, cy2, 6, 0, 7); ctx.fill(); outline(1.2);
  scratches(ctx, cx2 + fx, cy2, 3.4, 3.4, seed + 9, 4, hurt2(h, 'rgba(20,16,12,0.65)'), 'rgba(200,208,215,0.3)');
  ctx.fillStyle = hurt2(h, 'rgba(110,30,22,0.45)'); // dried blood
  ctx.beginPath(); ctx.arc(cx2 + fx + 2.4, cy2 + 2, 2.2, 0, 7); ctx.fill();
  ctx.fillStyle = tint('#3c3631');
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + 0.4;
    ctx.beginPath();
    ctx.moveTo(cx2 + fx + Math.cos(a) * 5, cy2 + Math.sin(a) * 5);
    ctx.lineTo(cx2 + fx + Math.cos(a) * 9, cy2 + Math.sin(a) * 9);
    ctx.lineTo(cx2 + fx + Math.cos(a + 0.5) * 4.7, cy2 + Math.sin(a + 0.5) * 4.7);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(230,240,250,0.25)'; ctx.lineWidth = 0.5; ctx.stroke();
  }
};

// ---------- shaman ----------
MONSTER_DRAW.shaman = function (ctx, e, h) {
  const { t, fa, fx, tint, grad, outline, seed } = h;
  const breathe = Math.sin(t * 2.6) * 0.6;
  // layered robe with tattered zigzag hem
  ctx.fillStyle = grad(-23, 0, '#41603f', 20, -26);
  ctx.beginPath();
  ctx.moveTo(-8.8, 0);
  ctx.quadraticCurveTo(-9.8, -19, 0, -22.8 - breathe);
  ctx.quadraticCurveTo(9.8, -19, 8.8, 0);
  ctx.lineTo(6.4, -2.6); ctx.lineTo(4.4, 0.6); ctx.lineTo(2, -2.2); ctx.lineTo(0, 0.8);
  ctx.lineTo(-2, -2.2); ctx.lineTo(-4.4, 0.6); ctx.lineTo(-6.4, -2.6);
  ctx.closePath(); ctx.fill(); outline(1.3);
  coreShadow(ctx, 0, -10, 8.6, 10);
  h.rim(-2, -16, 6.6, Math.PI * 1.1, Math.PI * 1.5);
  // cloth weave: vertical fold shading + mottle
  ctx.strokeStyle = hurt2(h, 'rgba(30,46,28,0.7)'); ctx.lineWidth = 1.1;
  for (const fx2 of [-4.6, -1.6, 1.6, 4.6]) {
    ctx.beginPath(); ctx.moveTo(fx2 * 0.6, -19 - breathe); ctx.quadraticCurveTo(fx2, -10, fx2, -1.4); ctx.stroke();
  }
  mottle(ctx, 0, -10, 6.4, 8, seed, 7, hurt2(h, 'rgba(30,46,28,0.5)'), hurt2(h, 'rgba(90,120,80,0.4)'), 0.7);
  // under-robe layer
  ctx.fillStyle = tint('#2c4029');
  ctx.beginPath(); ctx.moveTo(-5.4, -1); ctx.quadraticCurveTo(0, 1.8, 5.4, -1); ctx.lineTo(4.4, 1.6); ctx.quadraticCurveTo(0, 3.2, -4.4, 1.6); ctx.closePath(); ctx.fill();
  // painted glyphs on the robe
  ctx.strokeStyle = tint('#c9a44a'); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-3.8, -16.4); ctx.lineTo(-2.6, -14.4); ctx.lineTo(-3.8, -12.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3.8, -16.4); ctx.lineTo(2.6, -14.4); ctx.lineTo(3.8, -12.4); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -10.4, 1.6, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -12.6); ctx.lineTo(0, -8.2); ctx.stroke();
  // trim dots along the hem
  ctx.fillStyle = tint('#c9a44a');
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.arc(i * 3.2, -4.2 + Math.abs(i) * 0.4, 0.9, 0, 7); ctx.fill();
  }
  // feathered mantle across the shoulders
  for (let i = 0; i < 6; i++) {
    const mx = -6 + i * 2.4, ma = 0.6 - i * 0.24;
    ctx.save();
    ctx.translate(mx, -18.6 - breathe);
    ctx.rotate(ma + Math.sin(t * 2 + i) * 0.04);
    ctx.fillStyle = tint(i % 2 ? '#3a5238' : '#2e4230');
    ctx.beginPath(); ctx.ellipse(0, 2.4, 1.4, 3.4, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = hurt2(h, 'rgba(16,24,14,0.6)'); ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, -0.4); ctx.lineTo(0, 5); ctx.stroke();
    ctx.restore();
  }
  // bone necklace w/ teeth
  ctx.strokeStyle = tint('#8a7148'); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-4.6, -17.8); ctx.quadraticCurveTo(0, -14.6, 4.6, -17.8); ctx.stroke();
  ctx.fillStyle = tint('#d8d0ba');
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(i * 2, -16.4 + Math.abs(i) * 0.6 - (i % 2 ? 0.4 : 0));
    ctx.rotate(i * 0.25);
    if (i % 2) { ctx.beginPath(); ctx.moveTo(-0.6, 0); ctx.lineTo(0, 2.6); ctx.lineTo(0.6, 0); ctx.closePath(); ctx.fill(); }
    else ctx.fillRect(-0.7, 0, 1.4, 3);
    ctx.restore();
  }
  // hunched head in a deep cowl w/ antler-bone crown
  const hY = -24.4 - breathe;
  ctx.fillStyle = grad(hY - 7, hY + 5, '#33502f', 14, -18);
  ctx.beginPath(); ctx.arc(fx * 1.4, hY, 6.6, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
  ctx.lineTo(fx * 1.4 + 6.4, hY + 2.4);
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(fx * 1.4, hY, 6.6, Math.PI * 0.95, Math.PI * 2.05); ctx.stroke();
  // face in shadow
  ctx.fillStyle = hurt2(h, 'rgba(10,14,8,0.9)');
  ctx.beginPath(); ctx.ellipse(fx * 1.8, hY + 0.6, 4.6, 4, 0, 0, 7); ctx.fill();
  // antler-bone crown
  for (const side of [-1, 1]) {
    ctx.strokeStyle = tint('#cfc4a4'); ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx * 1.4 + side * 3.4, hY - 4.6);
    ctx.quadraticCurveTo(fx * 1.4 + side * 6, hY - 8.4, fx * 1.4 + side * 5.4, hY - 11);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fx * 1.4 + side * 4.8, hY - 7.4);
    ctx.lineTo(fx * 1.4 + side * 7, hY - 9);
    ctx.stroke();
  }
  // feathers tucked in the crown
  const feathers = [['#b03a2e', -1.4, -0.3], ['#c9a44a', 1.2, 0.12]];
  for (const [col, bx, ba] of feathers) {
    ctx.save();
    ctx.translate(fx * 1.4 + bx, hY - 5);
    ctx.rotate(ba + Math.sin(t * 2 + bx) * 0.05);
    ctx.strokeStyle = tint(col); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -6); ctx.stroke();
    ctx.strokeStyle = hurt2(h, 'rgba(20,14,8,0.5)'); ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, -5.4); ctx.stroke();
    ctx.restore();
  }
  // burning eyes deep in the cowl + ritual face paint
  const ga = 0.75 + Math.sin(t * 4.4) * 0.25;
  ctx.globalAlpha *= ga;
  ctx.fillStyle = hurt2(h, '#ffd24a');
  ctx.beginPath(); ctx.arc(fx * 1.8 - 2, hY + 0.2, 1.3, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(fx * 1.8 + 2, hY + 0.2, 1.3, 0, 7); ctx.fill();
  ctx.globalAlpha /= ga;
  ctx.strokeStyle = tint('#c9a44a'); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(fx * 1.8 - 2.6, hY + 2.2); ctx.lineTo(fx * 1.8 - 1.4, hY + 3.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(fx * 1.8 + 2.6, hY + 2.2); ctx.lineTo(fx * 1.8 + 1.4, hY + 3.4); ctx.stroke();
  // gnarled hand + totem staff
  ctx.strokeStyle = tint('#365534'); ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(fx * 6, -17); ctx.lineTo(fx * 8.6, -14.2); ctx.stroke();
  ctx.fillStyle = tint('#598455');
  ctx.beginPath(); ctx.arc(fx * 9, -13.8, 1.7, 0, 7); ctx.fill();
  // staff: gnarled wood, beads, skull, feathers, pulsing orb + motes
  const sx0 = fx * 9.6, sy0 = -7.4, sx1 = fx * 15.8, sy1 = -23.6 + h.fy * 4;
  ctx.strokeStyle = tint('#5d4426'); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(sx0, sy0);
  ctx.quadraticCurveTo(lerp(sx0, sx1, 0.5) + fx * 1.4, lerp(sy0, sy1, 0.5), sx1, sy1);
  ctx.stroke();
  ctx.strokeStyle = hurt2(h, 'rgba(30,20,10,0.55)'); ctx.lineWidth = 0.7; // wood grain
  ctx.beginPath(); ctx.moveTo(sx0 + fx, sy0 - 1);
  ctx.quadraticCurveTo(lerp(sx0, sx1, 0.5) + fx * 2, lerp(sy0, sy1, 0.5) - 0.6, sx1 - fx * 0.6, sy1 + 1); ctx.stroke();
  for (const [k, col] of [[0.26, '#b03a2e'], [0.38, '#c9a44a'], [0.5, '#7ddc8a']]) {
    ctx.fillStyle = tint(col);
    ctx.beginPath(); ctx.arc(lerp(sx0, sx1, k) + fx * 1.2, lerp(sy0, sy1, k) + 1.8, 1, 0, 7); ctx.fill();
  }
  // hanging feather off the haft
  ctx.strokeStyle = tint('#b03a2e'); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(lerp(sx0, sx1, 0.62), lerp(sy0, sy1, 0.62) + 1.4);
  ctx.lineTo(lerp(sx0, sx1, 0.62) + Math.sin(t * 2.4) * 1, lerp(sy0, sy1, 0.62) + 5.4); ctx.stroke();
  // skull topper
  const kx = lerp(sx0, sx1, 0.82), ky = lerp(sy0, sy1, 0.82) + 2;
  ctx.fillStyle = tint('#d8d0ba');
  ctx.beginPath(); ctx.arc(kx, ky, 2.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#15110c';
  ctx.beginPath(); ctx.arc(kx - 0.9, ky - 0.3, 0.6, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(kx + 0.9, ky - 0.3, 0.6, 0, 7); ctx.fill();
  // pulsing fetish orb + orbiting motes
  const ox = sx1, oy = sy1 - 1.6;
  const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, 9);
  og.addColorStop(0, 'rgba(125,220,138,0.7)'); og.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = og; ctx.fillRect(ox - 9, oy - 9, 18, 18);
  ctx.fillStyle = hurt2(h, '#7ddc8a');
  ctx.beginPath(); ctx.arc(ox, oy, 3.2 + Math.sin(t * 6) * 0.8, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(235,255,235,0.85)';
  ctx.beginPath(); ctx.arc(ox - 1, oy - 1, 1.1, 0, 7); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const ma = t * 2.4 + i * 2.1;
    ctx.fillStyle = `rgba(125,220,138,${0.5 + Math.sin(ma * 2) * 0.2})`;
    ctx.beginPath(); ctx.arc(ox + Math.cos(ma) * (5.4 + i), oy + Math.sin(ma) * (3.4 + i * 0.6), 0.8, 0, 7); ctx.fill();
  }
};
