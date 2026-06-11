// ============================================================
// FATEBOUND — renderer: textured iso scene, gore, atmosphere
// ============================================================

let LIGHT_CV = null, VIGNETTE_CV = null;

function ensureRenderBuffers() {
  if (!LIGHT_CV || LIGHT_CV.width !== VIEW.w || LIGHT_CV.height !== VIEW.h) {
    LIGHT_CV = document.createElement('canvas');
    LIGHT_CV.width = VIEW.w; LIGHT_CV.height = VIEW.h;
    VIGNETTE_CV = document.createElement('canvas');
    VIGNETTE_CV.width = VIEW.w; VIGNETTE_CV.height = VIEW.h;
    const vg = VIGNETTE_CV.getContext('2d');
    const g = vg.createRadialGradient(VIEW.w / 2, VIEW.h / 2, Math.min(VIEW.w, VIEW.h) * 0.38, VIEW.w / 2, VIEW.h / 2, Math.max(VIEW.w, VIEW.h) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(4,3,8,0.55)');
    vg.fillStyle = g;
    vg.fillRect(0, 0, VIEW.w, VIEW.h);
  }
}

function diamondPath(ctx, sx, sy) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + TILE_HW, sy + TILE_HH);
  ctx.lineTo(sx, sy + TILE_HH * 2);
  ctx.lineTo(sx - TILE_HW, sy + TILE_HH);
  ctx.closePath();
}

// ---------- gore registry (filled by paintBlood, drawn each frame) ----------
const GORE = { blood: [], corpses: [] };
const BLOOD_LIFE = 5.0, BLOOD_SOLID = 3.0;

function paintBlood(x, y, scale, e) {
  const style = e ? (GORE_STYLE[e.type] || { kind: 'blood' }) : { kind: 'blood' };
  const seed = (Math.random() * 1e6) | 0;
  GORE.corpses.push({
    type: e ? e.type : null, x, y, dir: e ? e.dir : 0,
    scale: scale || 1, born: STATE.time, seed, floorSeed: STATE.map ? STATE.map.seed : 0,
  });
  if (GORE.corpses.length > 40) GORE.corpses.shift();
  if (style.kind === 'blood' || style.kind === 'ichor') {
    const n = 2 + (Math.random() * 3 | 0);
    for (let i = 0; i < n; i++) {
      GORE.blood.push({
        x: x + mrf(-0.5, 0.5), y: y + mrf(-0.5, 0.5),
        s: (0.7 + Math.random() * 0.8) * (scale || 1),
        rot: mrf(0, 6.28), v: (Math.random() * 4) | 0,
        ichor: style.kind === 'ichor', born: STATE.time,
        floorSeed: STATE.map ? STATE.map.seed : 0,
      });
    }
    if (GORE.blood.length > 130) GORE.blood.splice(0, GORE.blood.length - 130);
  } else if (style.kind === 'bone') {
    addParticles(x, y, 10, '#d8d0bc', 4, 2.5);
  }
}

// small splat on a heavy hit (not just kills)
function paintHitBlood(e) {
  const style = GORE_STYLE[e.type] || { kind: 'blood' };
  if (style.kind !== 'blood' && style.kind !== 'ichor') return;
  if (Math.random() > 0.4) return;
  GORE.blood.push({
    x: e.x + mrf(-0.4, 0.4), y: e.y + mrf(-0.4, 0.4),
    s: 0.4 + Math.random() * 0.35, rot: mrf(0, 6.28), v: (Math.random() * 4) | 0,
    ichor: style.kind === 'ichor', born: STATE.time,
    floorSeed: STATE.map ? STATE.map.seed : 0,
  });
  if (GORE.blood.length > 130) GORE.blood.shift();
}

function drawBlood(ctx, fx, mapSeed) {
  for (const b of GORE.blood) {
    if (b.floorSeed !== mapSeed) continue;
    const age = STATE.time - b.born;
    if (age > BLOOD_LIFE) continue;
    const a = age < BLOOD_SOLID ? 0.9 : 0.9 * (1 - (age - BLOOD_SOLID) / (BLOOD_LIFE - BLOOD_SOLID));
    const s = worldToScreen(b.x, b.y);
    const spr = (b.ichor ? fx.ichor : fx.blood)[b.v % (b.ichor ? 3 : 4)];
    ctx.globalAlpha = a;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(0); // splats baked pre-squashed; rotation skewed iso looks wrong
    ctx.drawImage(spr, -32 * b.s, -20 * b.s * 0.8, 64 * b.s, 40 * b.s * 0.8);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  // expire
  if (GORE.blood.length && STATE.time - GORE.blood[0].born > BLOOD_LIFE + 1)
    GORE.blood = GORE.blood.filter(b => STATE.time - b.born <= BLOOD_LIFE);
  if (GORE.corpses.length && STATE.time - GORE.corpses[0].born > 5)
    GORE.corpses = GORE.corpses.filter(c => STATE.time - c.born <= 4.6);
}

// ---------- main ----------
function renderGame(ctx) {
  ensureRenderBuffers();
  const map = STATE.map, theme = THEMES[map.themeKey], p = STATE.player;
  const ttex = themeTex(map.themeKey);
  const fx = fxTex();
  ctx.fillStyle = '#070609';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  ctx.save();
  if (STATE.shake > 0)
    ctx.translate(mrf(-STATE.shake, STATE.shake) * 0.5, mrf(-STATE.shake, STATE.shake) * 0.5);
  // camera zoom: scale the whole world pass around screen center
  ctx.translate(VIEW.w / 2, VIEW.h / 2);
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-VIEW.w / 2, -VIEW.h / 2);

  // visible world bounds
  const corners = [screenToWorld(0, 0), screenToWorld(VIEW.w, 0), screenToWorld(0, VIEW.h), screenToWorld(VIEW.w, VIEW.h + WALL_H + 40)];
  const minX = Math.max(0, Math.floor(Math.min(...corners.map(c => c.x)) - 1));
  const maxX = Math.min(map.w - 1, Math.ceil(Math.max(...corners.map(c => c.x)) + 1));
  const minY = Math.max(0, Math.floor(Math.min(...corners.map(c => c.y)) - 1));
  const maxY = Math.min(map.h - 1, Math.ceil(Math.max(...corners.map(c => c.y)) + 1));

  // ---- floor pass: baked texture variants + AO edges ----
  const nf = ttex.floors.length;
  for (let ty = minY; ty <= maxY; ty++) for (let tx = minX; tx <= maxX; tx++) {
    const t = map.tiles[ty * map.w + tx];
    if (t !== 1 && t !== 3) continue;
    const s = worldToScreen(tx, ty);
    const n = hash2(tx, ty);
    ctx.drawImage(ttex.floors[(n * nf) | 0], s.x - TILE_HW, s.y, TILE_HW * 2, TILE_HH * 2);
    // contact shadows where walls meet the floor
    if (isSolidTile(map, tx, ty - 1)) ctx.drawImage(fx.ao.n, s.x - TILE_HW, s.y, TILE_HW * 2, TILE_HH * 2);
    if (isSolidTile(map, tx - 1, ty)) ctx.drawImage(fx.ao.w, s.x - TILE_HW, s.y, TILE_HW * 2, TILE_HH * 2);
    if (isSolidTile(map, tx + 1, ty)) ctx.drawImage(fx.ao.e, s.x - TILE_HW, s.y, TILE_HW * 2, TILE_HH * 2);
    if (isSolidTile(map, tx, ty + 1)) ctx.drawImage(fx.ao.s, s.x - TILE_HW, s.y, TILE_HW * 2, TILE_HH * 2);
    if (t === 3) drawStairs(ctx, s.x, s.y);
  }

  // ---- flat decals (bones, rubble, moss, puddles, mushrooms) ----
  if (map.decals) {
    for (const d of map.decals) {
      if (d.x < minX || d.x > maxX + 1 || d.y < minY || d.y > maxY + 1) continue;
      const spr = fx.decals[d.type];
      if (!spr) continue;
      const s = worldToScreen(d.x, d.y);
      const cv = spr[d.seed % 3];
      ctx.drawImage(cv, s.x - 28 * d.s, s.y - 18 * d.s + TILE_HH * 0.5, 56 * d.s, 36 * d.s);
    }
  }

  // ---- blood splats (under entities) ----
  drawBlood(ctx, fx, map.seed);

  // ---- depth-sorted pass: walls, props, corpses, entities ----
  const draws = [];
  for (let ty = minY; ty <= maxY; ty++) for (let tx = minX; tx <= maxX; tx++) {
    if (map.tiles[ty * map.w + tx] === 2)
      draws.push({ d: tx + ty + 1, fn: () => drawWall(ctx, tx, ty, ttex, map) });
  }
  for (const prop of map.props) {
    if (prop.x < minX || prop.x > maxX + 1 || prop.y < minY || prop.y > maxY + 1) continue;
    if (prop.type === 'crate' && !prop.hp) continue;
    draws.push({ d: prop.x + prop.y, fn: () => drawProp(ctx, prop) });
  }
  for (const c of GORE.corpses) {
    if (c.floorSeed !== map.seed) continue;
    if (c.x < minX - 1 || c.x > maxX + 2 || c.y < minY - 1 || c.y > maxY + 2) continue;
    draws.push({ d: c.x + c.y - 0.3, fn: () => drawCorpse(ctx, c) });
  }
  for (const pk of STATE.pickups)
    draws.push({ d: pk.x + pk.y, fn: () => drawPickup(ctx, pk) });
  for (const e of STATE.enemies) {
    if (e.dead || e.x < minX - 1 || e.x > maxX + 2 || e.y < minY - 1 || e.y > maxY + 2) continue;
    draws.push({ d: e.x + e.y, fn: () => drawEnemy(ctx, e) });
  }
  if (!p.dead) draws.push({ d: p.x + p.y, fn: () => drawHero(ctx, p) });
  if (STATE.pet && typeof drawPet === 'function')
    draws.push({ d: STATE.pet.x + STATE.pet.y, fn: () => drawPet(ctx, STATE.pet) });
  for (const pr of STATE.projectiles)
    draws.push({ d: pr.x + pr.y, fn: () => drawProjectile(ctx, pr) });
  for (const pa of STATE.particles)
    draws.push({ d: pa.x + pa.y, fn: () => drawParticle(ctx, pa) });

  draws.sort((a, b) => a.d - b.d);
  for (const d of draws) d.fn();

  // ---- spell arc lines ----
  for (const l of STATE.fxLines) {
    const a = 1 - l.t / l.life;
    const s1 = worldToScreen(l.x1, l.y1), s2 = worldToScreen(l.x2, l.y2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(160,215,255,${a * 0.9})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y - 16);
    const segs = 4;
    for (let i = 1; i <= segs; i++) {
      const k = i / segs;
      const jx = i < segs ? (Math.random() - 0.5) * 10 : 0;
      const jy = i < segs ? (Math.random() - 0.5) * 8 : 0;
      ctx.lineTo(lerp(s1.x, s2.x, k) + jx, lerp(s1.y - 16, s2.y - 16, k) + jy);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ---- lighting ----
  const lg = LIGHT_CV.getContext('2d');
  lg.setTransform(1, 0, 0, 1, 0, 0);
  lg.globalCompositeOperation = 'source-over';
  lg.clearRect(0, 0, VIEW.w, VIEW.h);
  lg.fillStyle = theme.ambient;
  lg.fillRect(0, 0, VIEW.w, VIEW.h);
  lg.globalCompositeOperation = 'destination-out';
  // zoom the punch-out pass to match the world
  lg.translate(VIEW.w / 2, VIEW.h / 2);
  lg.scale(ZOOM, ZOOM);
  lg.translate(-VIEW.w / 2, -VIEW.h / 2);
  const lights = [];
  if (!p.dead) lights.push({ x: p.x, y: p.y, r: 330, a: 1 });
  for (const prop of map.props) {
    if (prop.type === 'torch') lights.push({ x: prop.x, y: prop.y, r: 130 + Math.sin(STATE.time * 7 + prop.x * 13) * 10, a: 0.85, warm: true, fire: true, h: 33 });
    if (prop.type === 'campfire') lights.push({ x: prop.x, y: prop.y, r: 230 + Math.sin(STATE.time * 5) * 14, a: 0.95, warm: true, fire: true, h: 10 });
    if (prop.type === 'shrine') lights.push({ x: prop.x, y: prop.y, r: 120, a: 0.7 });
    if (prop.type === 'altar') lights.push({ x: prop.x, y: prop.y, r: 150, a: 0.8, warm: true, fire: true, h: 26 });
    if (prop.type === 'gate') lights.push({ x: prop.x, y: prop.y, r: 130, a: 0.7 });
    if (prop.type === 'portal') lights.push({ x: prop.x, y: prop.y, r: 150, a: 0.85 });
  }
  for (const pr of STATE.projectiles)
    if (pr.kind === 'fireball' || pr.kind === 'bolt' || pr.kind === 'spark')
      lights.push({ x: pr.x, y: pr.y, r: 70, a: 0.7 });
  if (map.stairs) lights.push({ x: map.stairs.x, y: map.stairs.y, r: 110, a: 0.6 });
  for (const l of lights) {
    const s = worldToScreen(l.x, l.y);
    if (s.x < -l.r || s.x > VIEW.w + l.r || s.y < -l.r || s.y > VIEW.h + l.r) continue;
    const g = lg.createRadialGradient(s.x, s.y, 0, s.x, s.y, l.r);
    g.addColorStop(0, `rgba(0,0,0,${l.a})`);
    g.addColorStop(0.55, `rgba(0,0,0,${l.a * 0.55})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = g;
    lg.fillRect(s.x - l.r, s.y - l.r, l.r * 2, l.r * 2);
  }
  ctx.restore();
  ctx.drawImage(LIGHT_CV, 0, 0);

  // warm glow accents + rising fire sparks (zoomed to match world)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(VIEW.w / 2, VIEW.h / 2);
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-VIEW.w / 2, -VIEW.h / 2);
  for (const l of lights) {
    if (!l.warm) continue;
    const s = worldToScreen(l.x, l.y);
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, l.r * 0.8);
    g.addColorStop(0, theme.lightWarmth);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(s.x - l.r, s.y - l.r, l.r * 2, l.r * 2);
    if (l.fire) {
      // stateless drifting sparks
      const seed = l.x * 13.7 + l.y * 7.3;
      for (let i = 0; i < 4; i++) {
        const k = (STATE.time * (0.5 + (i % 3) * 0.17) + i * 0.27 + seed) % 1;
        const sa = 1 - k;
        ctx.fillStyle = `rgba(255,${150 + i * 20},60,${sa * 0.7})`;
        ctx.beginPath();
        ctx.arc(
          s.x + Math.sin(STATE.time * 2.4 + i * 2.1 + seed) * (4 + k * 9),
          s.y - (l.h || 20) - k * 34,
          1.2 + (1 - k) * 0.8, 0, 7);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // ---- drifting fog (two parallax layers, world-anchored) ----
  drawFog(ctx, ttex.fog);

  // ---- dust motes in the air ----
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const sp = 4 + (i % 5) * 2.2;
    const mx = ((i * 137.5 + STATE.time * sp) % (VIEW.w + 60)) - 30;
    const my = ((i * 89.7 + Math.sin(STATE.time * 0.6 + i) * 18 + STATE.time * 2.4) % (VIEW.h + 40)) - 20;
    const tw = 0.5 + 0.5 * Math.sin(STATE.time * 1.4 + i * 1.7);
    ctx.fillStyle = `rgba(235,215,180,${0.028 + tw * 0.05})`;
    ctx.beginPath(); ctx.arc(mx, my, i % 3 ? 1 : 1.6, 0, 7); ctx.fill();
  }
  ctx.restore();

  ctx.drawImage(VIGNETTE_CV, 0, 0);

  // floaters
  ctx.textAlign = 'center';
  for (const f of STATE.floaters) {
    const s = worldToScreenZ(f.x, f.y);
    const k = f.t / f.life;
    ctx.globalAlpha = 1 - k * k;
    ctx.font = (f.big ? '700 17px' : '600 13px') + ' "Source Sans 3", sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(f.txt, s.x + 1, s.y - 38 * ZOOM - k * 34 + 1);
    ctx.fillStyle = f.color;
    ctx.fillText(f.txt, s.x, s.y - 38 * ZOOM - k * 34);
  }
  ctx.globalAlpha = 1;

  // interact prompt
  if (STATE.nearInteract) {
    const it = STATE.nearInteract;
    const s = worldToScreenZ(it.x, it.y);
    const label = interactLabel(it);
    ctx.font = '600 14px "Source Sans 3", sans-serif';
    const tw = ctx.measureText(label).width;
    const bx = s.x - tw / 2 - 12, by = s.y - 78 * ZOOM;
    ctx.fillStyle = 'rgba(12,10,14,0.82)';
    ctx.strokeStyle = 'rgba(214,178,110,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, tw + 24, 26, 6); else ctx.rect(bx, by, tw + 24, 26);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8dfc8';
    ctx.fillText(label, s.x, by + 18);
  }

  // ---- film grain ----
  const grain = fx.grain;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.06;
  const gox = (Math.random() * 192) | 0, goy = (Math.random() * 192) | 0;
  for (let gy = -goy; gy < VIEW.h; gy += 192)
    for (let gx = -gox; gx < VIEW.w; gx += 192)
      ctx.drawImage(grain, gx, gy);
  ctx.restore();

  // hurt flash
  if (p.hurtT > 0) {
    ctx.fillStyle = `rgba(160,30,20,${p.hurtT * 0.55})`;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
}

function drawFog(ctx, fogCv) {
  const camPx = (STATE.cam.x - STATE.cam.y) * TILE_HW * ZOOM;
  const camPy = (STATE.cam.x + STATE.cam.y) * TILE_HH * ZOOM;
  ctx.save();
  const layers = [
    { sc: 2.6, par: 0.22, vx: 9, vy: 2.4, a: 0.30 },
    { sc: 3.6, par: 0.12, vx: -6, vy: 1.4, a: 0.22 },
  ];
  for (const L of layers) {
    const w = fogCv.width * L.sc, h = fogCv.height * L.sc;
    let ox = (-camPx * L.par + STATE.time * L.vx) % w; if (ox > 0) ox -= w;
    let oy = (-camPy * L.par + STATE.time * L.vy) % h; if (oy > 0) oy -= h;
    ctx.globalAlpha = L.a;
    for (let y = oy; y < VIEW.h; y += h)
      for (let x = ox; x < VIEW.w; x += w)
        ctx.drawImage(fogCv, x, y, w, h);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function interactLabel(it) {
  switch (it.type) {
    case 'vendor': return '[E]  Trade with Maren';
    case 'shrine': return it.used ? 'The shrine is spent' : '[E]  Shrine of Fate — choose a boon';
    case 'altar': return '[E]  Altar of Fate — spend embers';
    case 'stairs': return '[E]  Descend the stairs';
    case 'gate': return '[E]  Enter the dungeon';
    case 'portal': return '[E]  Step through the portal';
    case 'campfire': return '[E]  Rest at the fire';
  }
  return '[E]';
}

// ---------- tiles ----------
function drawWall(ctx, tx, ty, ttex, map) {
  const s = worldToScreen(tx, ty);
  const topY = s.y - WALL_H;
  const n = hash2(tx * 3, ty * 7);
  // left (SW) face — visible if south neighbor walkable
  const ts = tileAt(map, tx, ty + 1);
  if (ts === 1 || ts === 3) {
    ctx.save();
    ctx.translate(s.x - TILE_HW, s.y + TILE_HH - WALL_H);
    ctx.transform(1, TILE_HH / TILE_HW, 0, 1, 0, 0);
    ctx.drawImage(ttex.wallL, 0, 0, TILE_HW, WALL_H);
    ctx.restore();
  }
  // right (SE) face — visible if east neighbor walkable
  const te = tileAt(map, tx + 1, ty);
  if (te === 1 || te === 3) {
    ctx.save();
    ctx.translate(s.x, s.y + TILE_HH * 2 - WALL_H);
    ctx.transform(1, -TILE_HH / TILE_HW, 0, 1, 0, 0);
    ctx.drawImage(ttex.wallR, 0, 0, TILE_HW, WALL_H);
    ctx.restore();
  }
  // cap
  ctx.drawImage(ttex.tops[n < 0.5 ? 0 : 1], s.x - TILE_HW, topY, TILE_HW * 2, TILE_HH * 2);
}

function drawStairs(ctx, sx, sy) {
  ctx.save();
  diamondPath(ctx, sx, sy);
  ctx.clip();
  ctx.fillStyle = '#16131c';
  ctx.fillRect(sx - TILE_HW, sy, TILE_HW * 2, TILE_HH * 2);
  for (let i = 0; i < 4; i++) {
    const k = i / 4;
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(230,200,140,${0.55 - i * 0.12})`;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 2 + k * TILE_HH);
    ctx.lineTo(sx + TILE_HW * (1 - k), sy + TILE_HH + k * TILE_HH * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, sy + 2 + k * TILE_HH);
    ctx.lineTo(sx - TILE_HW * (1 - k), sy + TILE_HH + k * TILE_HH * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}
