// ============================================================
// FATEBOUND — props: scenery, projectiles, pickups, particles
// (hero & monsters live in char_hero.js / char_monsters*.js)
// Painterly pass: gradient-shaded bodies, dark outlines, glow.
// ============================================================

const OUTLINE_C = 'rgba(10,7,4,0.55)';
const _shadeCache = {};
function shade(hex, amt) {
  const key = hex + amt;
  if (_shadeCache[key]) return _shadeCache[key];
  const num = parseInt(hex.slice(1), 16);
  const r = clamp((num >> 16) + amt, 0, 255), g = clamp(((num >> 8) & 255) + amt, 0, 255), b = clamp((num & 255) + amt, 0, 255);
  return (_shadeCache[key] = `rgb(${r},${g},${b})`);
}
// vertical body gradient: lit from above
function vGrad(ctx, y0, y1, hex, lt, dk) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shade(hex, lt == null ? 22 : lt));
  g.addColorStop(1, shade(hex, dk == null ? -20 : dk));
  return g;
}

function shadow(ctx, s, r) {
  const g = ctx.createRadialGradient(s.x, s.y + 2, 0, s.x, s.y + 2, r);
  g.addColorStop(0, 'rgba(0,0,0,0.38)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(s.x, s.y + 2, r, r * 0.45, 0, 0, 7); ctx.fill();
}

function isoCube(ctx, x, y, hw, h, top, left, right) {
  const hh = hw * 0.5;
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(x - hw, y - h + hh); ctx.lineTo(x, y - h + hh * 2); ctx.lineTo(x, y + hh * 2); ctx.lineTo(x - hw, y + hh);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(x + hw, y - h + hh); ctx.lineTo(x, y - h + hh * 2); ctx.lineTo(x, y + hh * 2); ctx.lineTo(x + hw, y + hh);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x, y - h); ctx.lineTo(x + hw, y - h + hh); ctx.lineTo(x, y - h + hh * 2); ctx.lineTo(x - hw, y - h + hh);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - hw, y - h + hh); ctx.lineTo(x, y - h + hh * 2); ctx.lineTo(x + hw, y - h + hh);
  ctx.moveTo(x, y - h + hh * 2); ctx.lineTo(x, y + hh * 2);
  ctx.stroke();
}

function flame(ctx, x, y, r, t, c1, c2) {
  const w1 = Math.sin(t * 11) * r * 0.18, w2 = Math.cos(t * 8) * r * 0.14;
  ctx.fillStyle = c1 || '#ff8c3a';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y);
  ctx.quadraticCurveTo(x - r * 0.5 + w1, y - r * 0.9, x + w2, y - r * 1.7);
  ctx.quadraticCurveTo(x + r * 0.5 + w1, y - r * 0.9, x + r * 0.55, y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = c2 || '#ffd24a';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.28, y);
  ctx.quadraticCurveTo(x + w2 * 0.5, y - r * 0.7, x + w1 * 0.4, y - r * 0.95);
  ctx.quadraticCurveTo(x + r * 0.28, y - r * 0.5, x + r * 0.28, y);
  ctx.closePath(); ctx.fill();
}

// ---------- props ----------
function drawProp(ctx, prop) {
  const s = worldToScreen(prop.x, prop.y);
  const t = STATE.time;
  switch (prop.type) {
    case 'torch': {
      shadow(ctx, s, 7);
      // iron bracket pole
      ctx.strokeStyle = '#241f1a'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - 30); ctx.stroke();
      ctx.strokeStyle = '#4a3b2a'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - 30); ctx.stroke();
      // banding
      ctx.strokeStyle = '#1c1814'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(s.x - 2.4, s.y - 12); ctx.lineTo(s.x + 2.4, s.y - 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x - 2.4, s.y - 22); ctx.lineTo(s.x + 2.4, s.y - 22); ctx.stroke();
      // basket
      ctx.fillStyle = '#2a221a';
      ctx.beginPath(); ctx.ellipse(s.x, s.y - 30, 7, 3.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#54422e';
      ctx.beginPath(); ctx.ellipse(s.x, s.y - 31, 6, 2.8, 0, 0, 7); ctx.fill();
      flame(ctx, s.x, s.y - 33, 6 + Math.sin(t * 9 + prop.x * 11) * 1.4, t + prop.x);
      break;
    }
    case 'campfire': {
      shadow(ctx, s, 16);
      // stone ring
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2;
        const rx = s.x + Math.cos(a) * 15, ry = s.y + Math.sin(a) * 7;
        ctx.fillStyle = shade('#6a6258', -((i * 37) % 26));
        ctx.beginPath(); ctx.ellipse(rx, ry, 3.4, 2.4, a, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,220,170,0.14)';
        ctx.beginPath(); ctx.ellipse(rx - 0.8, ry - 1, 1.6, 1, a, 0, 7); ctx.fill();
      }
      // charred logs
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + 0.4;
        ctx.strokeStyle = i ? '#3a2c1c' : '#2c211a'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x - Math.cos(a) * 11, s.y - Math.sin(a) * 5);
        ctx.lineTo(s.x + Math.cos(a) * 11, s.y + Math.sin(a) * 5);
        ctx.stroke();
      }
      // ember glow bed
      const eg = ctx.createRadialGradient(s.x, s.y - 2, 0, s.x, s.y - 2, 10);
      eg.addColorStop(0, `rgba(255,120,40,${0.55 + Math.sin(t * 5) * 0.15})`);
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg; ctx.fillRect(s.x - 10, s.y - 12, 20, 20);
      flame(ctx, s.x, s.y - 8, 13 + Math.sin(t * 6) * 2, t);
      break;
    }
    case 'crate': {
      shadow(ctx, s, 12);
      isoCube(ctx, s.x, s.y - 2, 13, 20, '#84693f', '#55432c', '#6e5839');
      // plank seams + nails
      ctx.strokeStyle = 'rgba(20,12,6,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - 13, s.y - 9.5); ctx.lineTo(s.x, s.y - 3);
      ctx.moveTo(s.x, s.y - 3); ctx.lineTo(s.x + 13, s.y - 9.5);
      ctx.moveTo(s.x - 13, s.y - 15.5); ctx.lineTo(s.x, s.y - 9);
      ctx.moveTo(s.x, s.y - 9); ctx.lineTo(s.x + 13, s.y - 15.5);
      ctx.stroke();
      // top cross brace
      ctx.strokeStyle = 'rgba(40,26,12,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.x - 8, s.y - 22.5); ctx.lineTo(s.x + 8, s.y - 22.5); ctx.stroke();
      ctx.fillStyle = '#2e2218';
      for (const [nx, ny] of [[-10, -12], [-3, -7], [10, -12], [3, -7]]) {
        ctx.fillRect(s.x + nx - 0.8, s.y + ny - 0.8, 1.6, 1.6);
      }
      break;
    }
    case 'barrel': {
      shadow(ctx, s, 11);
      // staves
      const g = ctx.createLinearGradient(s.x - 9, 0, s.x + 9, 0);
      g.addColorStop(0, '#4a3823'); g.addColorStop(0.45, '#7c6138'); g.addColorStop(1, '#54412a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(s.x - 8, s.y - 4);
      ctx.bezierCurveTo(s.x - 11, s.y - 12, s.x - 11, s.y - 16, s.x - 8, s.y - 24);
      ctx.lineTo(s.x + 8, s.y - 24);
      ctx.bezierCurveTo(s.x + 11, s.y - 16, s.x + 11, s.y - 12, s.x + 8, s.y - 4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.2; ctx.stroke();
      // lid
      ctx.fillStyle = '#8a6c3e';
      ctx.beginPath(); ctx.ellipse(s.x, s.y - 24, 8, 3.4, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(30,18,8,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(s.x, s.y - 24, 8, 3.4, 0, 0, 7); ctx.stroke();
      // iron hoops
      ctx.strokeStyle = '#27221d'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(s.x - 10.2, s.y - 17); ctx.quadraticCurveTo(s.x, s.y - 14.4, s.x + 10.2, s.y - 17); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x - 9, s.y - 8); ctx.quadraticCurveTo(s.x, s.y - 5.6, s.x + 9, s.y - 8); ctx.stroke();
      // stave seams
      ctx.strokeStyle = 'rgba(20,12,6,0.30)'; ctx.lineWidth = 1;
      for (const dx of [-4, 0, 4]) {
        ctx.beginPath(); ctx.moveTo(s.x + dx, s.y - 23); ctx.lineTo(s.x + dx * 1.3, s.y - 5); ctx.stroke();
      }
      break;
    }
    case 'shrine': {
      shadow(ctx, s, 14);
      isoCube(ctx, s.x, s.y - 2, 14, 24, '#677580', '#3c454d', '#525d66');
      // carved runes on the face
      ctx.fillStyle = 'rgba(158,203,255,0.5)';
      ctx.font = '700 7px serif'; ctx.textAlign = 'center';
      ctx.fillText('᛭', s.x - 6, s.y - 9);
      ctx.fillText('ᛟ', s.x + 7, s.y - 7);
      const it = STATE.map.interactables.find(i => i.type === 'shrine');
      const used = it && it.used;
      const bob = Math.sin(t * 2.4) * 3;
      if (!used) {
        const g = ctx.createRadialGradient(s.x, s.y - 38 + bob, 0, s.x, s.y - 38 + bob, 16);
        g.addColorStop(0, 'rgba(158,203,255,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(s.x - 16, s.y - 54 + bob, 32, 32);
      }
      ctx.fillStyle = used ? 'rgba(120,120,130,0.5)' : '#cfe6ff';
      ctx.beginPath(); ctx.arc(s.x, s.y - 38 + bob, used ? 4 : 5.4, 0, 7); ctx.fill();
      break;
    }
    case 'altar': {
      shadow(ctx, s, 16);
      isoCube(ctx, s.x, s.y - 2, 17, 20, '#5f5140', '#3b3224', '#4e4232');
      // scorch marks + candle drippings
      ctx.fillStyle = 'rgba(15,8,4,0.5)';
      ctx.beginPath(); ctx.ellipse(s.x, s.y - 21, 8, 3.4, 0, 0, 7); ctx.fill();
      flame(ctx, s.x, s.y - 24, 8 + Math.sin(t * 5) * 1.5, t, '#ff9c4a', '#ffd24a');
      break;
    }
    case 'vendorNpc': {
      drawFigure(ctx, s, { hood: '#5a4634', body: '#6e5840', t });
      break;
    }
    case 'gate': {
      shadow(ctx, s, 20);
      isoCube(ctx, s.x - 22, s.y - 8, 9, 52, '#6a6052', '#403a32', '#564e42');
      isoCube(ctx, s.x + 22, s.y + 8, 9, 52, '#6a6052', '#403a32', '#564e42');
      // cracked carvings
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(s.x - 26, s.y - 40); ctx.lineTo(s.x - 19, s.y - 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x + 19, s.y - 26); ctx.lineTo(s.x + 26, s.y - 14); ctx.stroke();
      // swirling portal
      const pg = ctx.createRadialGradient(s.x, s.y - 22, 2, s.x, s.y - 22, 30);
      pg.addColorStop(0, `rgba(170,130,240,${0.5 + Math.sin(t * 2.2) * 0.12})`);
      pg.addColorStop(0.6, 'rgba(120,80,200,0.22)');
      pg.addColorStop(1, 'rgba(150,110,220,0)');
      ctx.fillStyle = pg;
      ctx.fillRect(s.x - 32, s.y - 54, 64, 64);
      for (let i = 0; i < 3; i++) {
        const a = t * (1.1 + i * 0.4) + i * 2.1;
        ctx.fillStyle = 'rgba(210,180,255,0.5)';
        ctx.beginPath(); ctx.arc(s.x + Math.cos(a) * (8 + i * 4), s.y - 22 + Math.sin(a) * (5 + i * 2.4), 1.4, 0, 7); ctx.fill();
      }
      break;
    }
    case 'portal': {
      shadow(ctx, s, 14);
      // standing stone arch
      const pg2 = ctx.createRadialGradient(s.x, s.y - 20, 2, s.x, s.y - 20, 26);
      pg2.addColorStop(0, `rgba(127,180,255,${0.55 + Math.sin(t * 3) * 0.12})`);
      pg2.addColorStop(0.6, 'rgba(90,140,255,0.25)');
      pg2.addColorStop(1, 'rgba(90,140,255,0)');
      ctx.fillStyle = pg2;
      ctx.fillRect(s.x - 26, s.y - 46, 52, 52);
      // swirling ellipse ring
      ctx.save();
      ctx.translate(s.x, s.y - 20);
      ctx.strokeStyle = 'rgba(190,220,255,0.85)'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 19, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(127,180,255,0.5)'; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.ellipse(0, 0, 9.5, 15, 0, 0, 7); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = t * (1.3 + i * 0.3) + i * 1.6;
        ctx.fillStyle = 'rgba(220,240,255,0.8)';
        ctx.beginPath(); ctx.arc(Math.cos(a) * 10, Math.sin(a) * 15, 1.3, 0, 7); ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'tent': {
      shadow(ctx, s, 22);
      const g = ctx.createLinearGradient(s.x - 28, 0, s.x + 28, 0);
      g.addColorStop(0, '#5a4128'); g.addColorStop(0.5, '#7c5c38'); g.addColorStop(1, '#4e3823');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 38); ctx.lineTo(s.x + 28, s.y + 2); ctx.lineTo(s.x - 28, s.y + 2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#46331f';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 38); ctx.lineTo(s.x + 28, s.y + 2); ctx.lineTo(s.x + 14, s.y + 10); ctx.lineTo(s.x, s.y - 30);
      ctx.closePath(); ctx.fill();
      // seams + patch
      ctx.strokeStyle = 'rgba(30,18,8,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(s.x - 8, s.y - 26); ctx.lineTo(s.x - 14, s.y + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x + 6, s.y - 28); ctx.lineTo(s.x + 12, s.y - 2); ctx.stroke();
      ctx.fillStyle = 'rgba(120,96,60,0.65)';
      ctx.fillRect(s.x - 12, s.y - 12, 7, 6);
      ctx.strokeStyle = 'rgba(30,18,8,0.45)';
      ctx.strokeRect(s.x - 12, s.y - 12, 7, 6);
      break;
    }
  }
}

// hooded NPC
function drawFigure(ctx, s, o) {
  shadow(ctx, s, 10);
  const bob = Math.sin((o.t || 0) * 1.8) * 1;
  ctx.fillStyle = vGrad(ctx, s.y - 26, s.y, o.body, 18, -22);
  ctx.beginPath();
  ctx.moveTo(s.x - 8, s.y);
  ctx.quadraticCurveTo(s.x - 9, s.y - 22, s.x, s.y - 24 + bob);
  ctx.quadraticCurveTo(s.x + 9, s.y - 22, s.x + 8, s.y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.2; ctx.stroke();
  // rope belt
  ctx.strokeStyle = '#3c2e1d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(s.x - 6.5, s.y - 11); ctx.quadraticCurveTo(s.x, s.y - 9.4, s.x + 6.5, s.y - 11); ctx.stroke();
  ctx.fillStyle = vGrad(ctx, s.y - 33 + bob, s.y - 19 + bob, o.hood, 20, -16);
  ctx.beginPath(); ctx.arc(s.x, s.y - 26 + bob, 7, 0, 7); ctx.fill();
  ctx.strokeStyle = OUTLINE_C; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.fillStyle = '#171210';
  ctx.beginPath(); ctx.arc(s.x + 2, s.y - 25 + bob, 4.2, 0, 7); ctx.fill();
  // glint of eyes in the hood
  ctx.fillStyle = 'rgba(240,210,150,0.8)';
  ctx.fillRect(s.x + 0.5, s.y - 26 + bob, 1.2, 1.2);
  ctx.fillRect(s.x + 3.6, s.y - 26 + bob, 1.2, 1.2);
}

// ---------- projectiles, pickups, particles ----------
function drawProjectile(ctx, pr) {
  const s = worldToScreen(pr.x, pr.y);
  const a = Math.atan2((pr.vx + pr.vy) * 0.5, pr.vx - pr.vy);
  ctx.save();
  ctx.translate(s.x, s.y - 14);
  const orb = (r1, r2, cOut, cIn, cCore) => {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r1);
    g.addColorStop(0, cOut); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-r1, -r1, r1 * 2, r1 * 2);
    ctx.fillStyle = cIn;
    ctx.beginPath(); ctx.arc(0, 0, r2, 0, 7); ctx.fill();
    if (cCore) {
      ctx.fillStyle = cCore;
      ctx.beginPath(); ctx.arc(0, 0, r2 * 0.45, 0, 7); ctx.fill();
    }
  };
  switch (pr.kind) {
    case 'arrow':
      ctx.rotate(a);
      ctx.strokeStyle = '#6e5230'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke();
      ctx.fillStyle = '#cfd6dc';
      ctx.beginPath(); ctx.moveTo(9.5, 0); ctx.lineTo(4, -2.6); ctx.lineTo(4, 2.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d8d0bc'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-7, -1.6); ctx.lineTo(-4.4, 0); ctx.moveTo(-7, 1.6); ctx.lineTo(-4.4, 0); ctx.stroke();
      break;
    case 'bigbolt':
      ctx.rotate(a);
      ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = 8;
      ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
      ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
      break;
    case 'bolt': orb(9, 4, 'rgba(158,203,255,0.5)', '#9ecbff', '#eaf6ff'); break;
    case 'fireball': orb(12, 5.5, 'rgba(255,140,50,0.5)', '#ff9c4a', '#ffe9a0'); break;
    case 'spark': orb(9, 3.5, 'rgba(125,220,138,0.5)', '#7ddc8a', '#d8ffd8'); break;
  }
  ctx.restore();
}

function drawPickup(ctx, pk) {
  const s = worldToScreen(pk.x, pk.y);
  pk.t = (pk.t || 0);
  const bob = Math.sin(STATE.time * 3 + pk.x * 7) * 2.5;
  switch (pk.kind) {
    case 'gold':
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(s.x, s.y, 5, 2.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#c79a2a';
      ctx.beginPath(); ctx.ellipse(s.x, s.y - 3 - bob * 0.4, 4.5, 3.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath(); ctx.ellipse(s.x, s.y - 4.4 - bob * 0.4, 4.5, 3.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,220,0.7)';
      ctx.beginPath(); ctx.ellipse(s.x - 1.4, s.y - 5.4 - bob * 0.4, 1.4, 0.9, -0.5, 0, 7); ctx.fill();
      break;
    case 'ember': {
      const g = ctx.createRadialGradient(s.x, s.y - 8 - bob, 0, s.x, s.y - 8 - bob, 11);
      g.addColorStop(0, 'rgba(255,140,58,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(s.x - 11, s.y - 19 - bob, 22, 22);
      ctx.fillStyle = '#ff9c4a';
      ctx.save(); ctx.translate(s.x, s.y - 8 - bob); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3.5, -3.5, 7, 7);
      ctx.fillStyle = '#ffe9a0';
      ctx.fillRect(-1.4, -1.4, 2.8, 2.8);
      ctx.restore();
      break;
    }
    case 'potion_hp': case 'potion_mp': {
      const c = pk.kind === 'potion_hp' ? '#e0584d' : '#5a8cff';
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(s.x, s.y, 5, 2.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(s.x, s.y - 7 - bob * 0.5, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(s.x - 1.6, s.y - 8.6 - bob * 0.5, 1.5, 1, -0.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#6e5230';
      ctx.fillRect(s.x - 1.5, s.y - 15 - bob * 0.5, 3, 4);
      break;
    }
    case 'item': {
      const c = RARITIES[pk.item.rarity].color;
      const g = ctx.createLinearGradient(s.x, s.y - 46, s.x, s.y);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, c + 'aa');
      ctx.fillStyle = g;
      ctx.fillRect(s.x - 2.5, s.y - 46, 5, 46);
      ctx.fillStyle = c;
      ctx.save(); ctx.translate(s.x, s.y - 8 - bob); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-4, -4, 3, 3);
      ctx.restore();
      break;
    }
  }
}

function drawParticle(ctx, pa) {
  const s = worldToScreen(pa.x, pa.y);
  const k = 1 - pa.t / pa.life;
  ctx.globalAlpha = k;
  ctx.fillStyle = pa.color;
  ctx.beginPath();
  ctx.arc(s.x, s.y - (pa.z || 0) * 0.5, pa.size * k, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
}
