// ============================================================
// FATEBOUND — UI: HUD, panels, menus, tooltips
// ============================================================

const $ = (id) => document.getElementById(id);
let openPanelName = null;
let toastTimer = null;

function uiToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function uiSetScreen(name) {
  STATE.screen = name;
  $('main-menu').style.display = name === 'menu' ? 'flex' : 'none';
  $('death-screen').style.display = name === 'death' ? 'flex' : 'none';
  $('hud').style.display = name === 'game' ? 'block' : 'none';
  if (name !== 'game') closePanel();
  if (name === 'menu') uiRefreshMenu();
}

// ---------- HUD ----------
function updateHUD() {
  const p = STATE.player;
  if (!p || STATE.screen !== 'game') return;
  const d = p.d;
  $('hp-fill').style.width = (clamp(p.hp / d.maxHp, 0, 1) * 100) + '%';
  $('hp-text').textContent = `${Math.ceil(p.hp)} / ${d.maxHp}`;
  $('mp-fill').style.width = (clamp(p.mana / d.maxMana, 0, 1) * 100) + '%';
  $('mp-text').textContent = `${Math.floor(p.mana)} / ${d.maxMana}`;
  $('xp-fill').style.width = (clamp(p.xp / xpNeeded(p.level), 0, 1) * 100) + '%';
  $('hud-level').textContent = p.level;
  $('hud-gold').textContent = fmt(p.gold);
  $('hud-embers').textContent = fmt(STATE.meta.embers);
  $('hud-floor').textContent = floorTitle(STATE.floor);
  // floor challenge tracker
  const qel = $('hud-quest');
  const q = STATE.quest;
  if (q) {
    qel.style.display = 'inline-flex';
    qel.classList.toggle('done', !!q.done);
    qel.querySelector('.q-title').textContent = q.title;
    qel.querySelector('.q-prog').textContent = q.done ? '✓ Complete' : `${Math.min(q.n, q.target)} / ${q.target}`;
  } else {
    qel.style.display = 'none';
  }
  $('pot-hp-n').textContent = p.potions.hp;
  $('pot-mp-n').textContent = p.potions.mp;
  $('pot-hp').classList.toggle('empty', p.potions.hp <= 0);
  $('pot-mp').classList.toggle('empty', p.potions.mp <= 0);
  // weapon skill (Q)
  const w = p.equipment.main;
  const sk = w && WEAPON_SKILLS[w.type];
  $('skill-name').textContent = sk ? sk.name : '—';
  const cdMax = p.spCdMax || 1;
  const k = p.spCd > 0 ? p.spCd / cdMax : 0;
  $('skill-cd').style.height = (k * 100) + '%';
  $('skill-slot').classList.toggle('ready', p.spCd <= 0 && sk && p.mana >= sk.cost * (1 - d.spCost));
  // spellbook (RMB)
  const book = p.equipment.book;
  if (uiLastBookId !== (book ? book.id : 0)) {
    uiLastBookId = book ? book.id : 0;
    const ic = $('spell-ic');
    ic.getContext('2d').clearRect(0, 0, ic.width, ic.height);
    if (book) drawItemIcon(ic, book);
  }
  if (book) {
    const sp = SPELLS[book.spell];
    const cd = p.spellCds[book.spell] || 0;
    $('spell-cd').style.height = (clamp(cd / sp.cd, 0, 1) * 100) + '%';
    $('spell-slot').classList.toggle('ready', cd <= 0 && p.mana >= sp.cost * (1 - d.spCost));
  } else {
    $('spell-cd').style.height = '0%';
    $('spell-slot').classList.remove('ready');
  }
  drawMinimap();
  const dot = $('stat-alert');
  dot.style.display = p.statPoints > 0 ? 'block' : 'none';
}

// ---------- minimap ----------
let uiLastBookId = -1;
function drawMinimap() {
  const cv = $('minimap');
  const map = STATE.map, p = STATE.player;
  if (!cv || !map || !p) return;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  if (!map.seen || map.seen.length !== map.tiles.length) map.seen = new Uint8Array(map.tiles.length);
  // reveal around player
  const px = p.x | 0, py = p.y | 0, R = 9;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const nx = px + dx, ny = py + dy;
    if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
    if (dx * dx + dy * dy <= R * R) map.seen[ny * map.w + nx] = 1;
  }
  const sc = Math.min(cv.width / map.w, cv.height / map.h);
  const ox = (cv.width - map.w * sc) / 2, oy = (cv.height - map.h * sc) / 2;
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const i = y * map.w + x;
    if (!map.seen[i]) continue;
    const t = map.tiles[i];
    if (t === 1) c.fillStyle = 'rgba(148,134,114,0.30)';
    else if (t === 3) c.fillStyle = 'rgba(214,178,110,0.95)';
    else if (t === 2) c.fillStyle = 'rgba(212,202,182,0.5)';
    else continue;
    c.fillRect(ox + x * sc, oy + y * sc, sc, sc);
  }
  const dotAt = (x, y, r, col) => {
    c.fillStyle = col;
    c.beginPath(); c.arc(ox + x * sc, oy + y * sc, r, 0, 7); c.fill();
  };
  for (const it of map.interactables) {
    if (!map.seen[(it.y | 0) * map.w + (it.x | 0)]) continue;
    const col = it.type === 'vendor' ? '#ffd24a'
      : it.type === 'shrine' ? '#9ecbff'
      : it.type === 'altar' ? '#ff9c4a'
      : it.type === 'portal' ? '#7fb4ff'
      : it.type === 'gate' ? '#c97cff' : null;
    if (col) dotAt(it.x, it.y, 2.4, col);
  }
  for (const e of STATE.enemies) {
    if (e.dead || !e.aggro) continue;
    dotAt(e.x, e.y, e.elite ? 2.6 : 1.7, e.elite ? '#ff9c4a' : '#e0442e');
  }
  if (STATE.pet) dotAt(STATE.pet.x, STATE.pet.y, 1.7, '#7fd9c9');
  dotAt(p.x, p.y, 2.6, '#ffffff');
  c.strokeStyle = '#ffffff'; c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(ox + p.x * sc, oy + p.y * sc);
  c.lineTo(ox + (p.x + Math.cos(p.dir) * 2.4) * sc, oy + (p.y + Math.sin(p.dir) * 2.4) * sc);
  c.stroke();
}

// ---------- panels ----------
function closePanel() {
  openPanelName = null;
  $('panel-wrap').style.display = 'none';
  hideTooltip();
  STATE.paused = false;
}
function openPanel(name, data) {
  openPanelName = name;
  $('panel-wrap').style.display = 'flex';
  STATE.paused = true;
  for (const pn of ['inventory', 'character', 'vendor', 'shrine', 'altar'])
    $('panel-' + pn).style.display = pn === name ? 'block' : 'none';
  if (name === 'inventory') renderInventoryPanel();
  if (name === 'character') renderCharacterPanel();
  if (name === 'vendor') renderVendorPanel(data);
  if (name === 'shrine') renderShrinePanel(data);
  if (name === 'altar') renderAltarPanel();
}
function uiRefreshPanels() {
  if (!openPanelName) return;
  if (openPanelName === 'vendor') renderVendorPanel(uiVendorRef);
  else if (openPanelName === 'shrine') { /* one-shot */ }
  else openPanel(openPanelName);
}

// ---------- tooltip ----------
function showTooltip(html, ev) {
  const tt = $('tooltip');
  tt.innerHTML = html;
  tt.style.display = 'block';
  positionTooltip(ev);
}
function positionTooltip(ev) {
  const tt = $('tooltip');
  if (tt.style.display === 'none') return;
  const pad = 14;
  let x = ev.clientX + pad, y = ev.clientY + pad;
  const r = tt.getBoundingClientRect();
  if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad;
  if (y + r.height > innerHeight - 8) y = innerHeight - r.height - 8;
  tt.style.left = x + 'px';
  tt.style.top = y + 'px';
}
function hideTooltip() { $('tooltip').style.display = 'none'; }

function makeItemCell(item, opts) {
  opts = opts || {};
  const cell = document.createElement('div');
  cell.className = 'inv-cell' + (item ? ' has-item r-' + item.rarity : '');
  if (item) {
    const cv = document.createElement('canvas');
    cv.width = 40; cv.height = 40;
    drawItemIcon(cv, item);
    cell.appendChild(cv);
    cell.addEventListener('mouseenter', (e) => showTooltip(itemTooltipHTML(item, opts.tt), e));
    cell.addEventListener('mousemove', positionTooltip);
    cell.addEventListener('mouseleave', hideTooltip);
    if (opts.onClick) cell.addEventListener('click', (e) => { hideTooltip(); opts.onClick(e); });
    if (opts.onRClick) cell.addEventListener('contextmenu', (e) => { e.preventDefault(); hideTooltip(); opts.onRClick(); });
  }
  return cell;
}

// ---------- inventory / equipment ----------
function renderInventoryPanel() {
  const p = STATE.player;
  const eqWrap = $('equip-slots');
  eqWrap.innerHTML = '';
  const slotNames = { main: 'Weapon', off: 'Off-hand', helm: 'Helm', chest: 'Chest', boots: 'Boots', book: 'Spellbook', pet: 'Pet' };
  for (const slot of ['main', 'off', 'helm', 'chest', 'boots', 'book', 'pet']) {
    const row = document.createElement('div');
    row.className = 'equip-row';
    const lab = document.createElement('div');
    lab.className = 'equip-label';
    lab.textContent = slotNames[slot];
    const cell = makeItemCell(p.equipment[slot], {
      tt: { hint: 'Click to unequip' },
      onClick: () => unequipItem(p, slot),
    });
    row.appendChild(cell);
    row.appendChild(lab);
    eqWrap.appendChild(row);
  }
  const grid = $('inv-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const item = p.inventory[i];
    let opts = null;
    if (item) {
      const offable = item.kind === 'weapon' && OFFHANDABLE[item.type];
      const cmpSlot = item.kind === 'weapon' ? 'main' : item.slot;
      let hint = 'Click to equip · right-click ×2 to destroy';
      if (offable) hint = 'Click to equip · shift-click for off-hand · right-click ×2 to destroy';
      opts = {
        tt: { hint, compare: p.equipment[cmpSlot] },
        onClick: (e) => equipItem(p, item, (e && e.shiftKey && offable) ? 'off' : undefined),
        onRClick: () => {
          const now = Date.now();
          if (item._armDestroy && now - item._armDestroy < 2500) destroyItem(p, item);
          else { item._armDestroy = now; uiToast('Right-click again to destroy ' + item.name); }
        },
      };
    }
    grid.appendChild(makeItemCell(item, opts));
  }
  $('inv-gold').textContent = fmt(p.gold);
}

// ---------- character ----------
function renderCharacterPanel() {
  const p = STATE.player, d = p.d;
  $('char-points').textContent = p.statPoints;
  $('char-points-row').style.display = p.statPoints > 0 ? 'flex' : 'none';
  const stats = $('char-stats');
  stats.innerHTML = '';
  const mkRow = (label, val, key) => {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `<span>${label}</span><b>${val}</b>`;
    if (key && p.statPoints > 0) {
      const btn = document.createElement('button');
      btn.className = 'plus-btn';
      btn.textContent = '+';
      btn.addEventListener('click', () => {
        p[key]++; p.statPoints--;
        updateDerived(p);
        renderCharacterPanel();
      });
      row.appendChild(btn);
    }
    stats.appendChild(row);
  };
  mkRow('Strength', d.str, 'str');
  mkRow('Dexterity', d.dex, 'dex');
  mkRow('Magic', d.mag, 'mag');
  mkRow('Vitality', d.vit, 'vit');
  const div = document.createElement('div');
  div.className = 'stat-divider';
  stats.appendChild(div);
  mkRow('Damage', `${Math.round(d.dmgMin)}–${Math.round(d.dmgMax)}`);
  mkRow('Attack rate', (1 / d.atkInterval).toFixed(2) + '/s');
  mkRow('Crit chance', d.crit.toFixed(0) + '%');
  mkRow('Armor', d.armor);
  if (d.block) mkRow('Block', d.block + '%');
  mkRow('Move speed', '+' + Math.round((d.moveSpd / 4.4 - 1) * 100) + '%');
  // boons
  const bl = $('char-boons');
  bl.innerHTML = '';
  if (!p.boons.length) bl.innerHTML = '<div class="dim">None yet — find a Shrine of Fate on a sanctuary floor.</div>';
  const counts = {};
  for (const id of p.boons) counts[id] = (counts[id] || 0) + 1;
  for (const id in counts) {
    const b = boonById(id);
    const el = document.createElement('div');
    el.className = 'boon-row';
    el.innerHTML = `<b>${b.name}${counts[id] > 1 ? ' ×' + counts[id] : ''}</b><span>${b.desc}</span>`;
    const rb = document.createElement('button');
    rb.className = 'reroll-btn';
    rb.innerHTML = '⟲ 8';
    rb.title = 'Reroll this boon into a random other — costs 8 embers';
    rb.addEventListener('click', () => rerollBoon(id));
    el.appendChild(rb);
    bl.appendChild(el);
  }
  if (p.boons.length) {
    const note = document.createElement('div');
    note.className = 'dim';
    note.style.cssText = 'font-size:12px;margin-top:8px';
    note.innerHTML = '⟲ reweaves a boon into a random other — 8 <span class="ember-text">embers</span> (you have ' + fmt(STATE.meta.embers) + ')';
    bl.appendChild(note);
  }
  $('char-level').textContent = p.level;
  $('char-xp').textContent = `${fmt(p.xp)} / ${fmt(xpNeeded(p.level))} xp`;
}

function rerollBoon(id) {
  const meta = STATE.meta, p = STATE.player;
  if (meta.embers < 8) { uiToast('Needs 8 embers — earn them in the depths'); return; }
  const counts = {};
  for (const bid of p.boons) counts[bid] = (counts[bid] || 0) + 1;
  const pool = BOONS.filter(b => b.id !== id && (counts[b.id] || 0) < 2);
  if (!pool.length) { uiToast('Fate offers nothing new'); return; }
  const nb = pool[(Math.random() * pool.length) | 0];
  p.boons[p.boons.indexOf(id)] = nb.id;
  meta.embers -= 8;
  saveMeta();
  updateDerived(p);
  saveRun();
  addParticles(p.x, p.y, 20, '#ff9c4a', 4, 3);
  uiToast('Fate rewoven: ' + nb.name);
  renderCharacterPanel();
  updateHUD();
}

// ---------- vendor ----------
let uiVendorRef = null;
function renderVendorPanel(vendor) {
  uiVendorRef = vendor;
  const p = STATE.player;
  $('vendor-gold').textContent = fmt(p.gold);
  const stock = $('vendor-stock');
  stock.innerHTML = '';
  // potions
  for (const kind of ['hp', 'mp']) {
    const price = potionPrice(kind, STATE.floor);
    const cell = document.createElement('div');
    cell.className = 'vendor-item';
    cell.innerHTML = `
      <div class="pot-icon ${kind}"></div>
      <div class="vi-name">${kind === 'hp' ? 'Health' : 'Mana'} Potion</div>
      <div class="vi-price gold">${price}g</div>`;
    cell.addEventListener('click', () => {
      if (p.gold < price) { uiToast('Not enough gold'); return; }
      if (p.potions[kind] >= p.d.potionCap) { uiToast('Potion belt is full'); return; }
      p.gold -= price;
      p.potions[kind]++;
      renderVendorPanel(vendor);
    });
    stock.appendChild(cell);
  }
  for (const item of vendor.stock) {
    const cell = document.createElement('div');
    cell.className = 'vendor-item';
    const cv = document.createElement('canvas');
    cv.width = 40; cv.height = 40;
    drawItemIcon(cv, item);
    cell.appendChild(cv);
    const nm = document.createElement('div');
    nm.className = 'vi-name';
    nm.style.color = RARITIES[item.rarity].color;
    nm.textContent = item.name;
    const pr = document.createElement('div');
    pr.className = 'vi-price gold';
    pr.textContent = item.value + 'g';
    cell.appendChild(nm);
    cell.appendChild(pr);
    cell.addEventListener('mouseenter', (e) => showTooltip(itemTooltipHTML(item, { price: item.value, compare: p.equipment[item.kind === 'weapon' ? 'main' : item.slot] }), e));
    cell.addEventListener('mousemove', positionTooltip);
    cell.addEventListener('mouseleave', hideTooltip);
    cell.addEventListener('click', () => {
      if (p.gold < item.value) { uiToast('Not enough gold'); return; }
      if (p.inventory.length >= 25) { uiToast('Inventory full'); return; }
      p.gold -= item.value;
      p.inventory.push(item);
      vendor.stock = vendor.stock.filter(i => i !== item);
      hideTooltip();
      renderVendorPanel(vendor);
    });
    stock.appendChild(cell);
  }
  // refresh wares with embers
  const rr = document.createElement('div');
  rr.className = 'vendor-item vendor-reroll';
  rr.innerHTML = `<span class="ember-ic"></span><div class="vi-name">Refresh the wares</div><div class="vi-price ember-text">5 embers · you have ${fmt(STATE.meta.embers)}</div>`;
  rr.addEventListener('click', () => {
    if (STATE.meta.embers < 5) { uiToast('Needs 5 embers'); return; }
    STATE.meta.embers -= 5;
    saveMeta();
    vendor.stock = rollVendorStock(Math.max(1, STATE.floor));
    hideTooltip();
    renderVendorPanel(vendor);
    updateHUD();
    uiToast('Maren lays out new wares.');
  });
  stock.appendChild(rr);
  // sell grid
  const sell = $('vendor-sell');
  sell.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const item = p.inventory[i];
    const sellVal = item ? Math.max(1, Math.round(item.value * 0.3)) : 0;
    sell.appendChild(makeItemCell(item, item && {
      tt: { sell: sellVal },
      onRClick: () => {
        p.inventory.splice(p.inventory.indexOf(item), 1);
        p.gold += sellVal;
        addFloater(p.x, p.y, '+' + sellVal + 'g', '#ffd24a');
        renderVendorPanel(vendor);
      },
      onClick: () => uiToast('Right-click to sell'),
    }));
  }
}

// ---------- shrine ----------
function renderShrinePanel(shrine) {
  const wrap = $('shrine-choices');
  wrap.innerHTML = '';
  if (!shrine.choices) shrine.choices = rollBoonChoices(STATE.player, 3);
  for (const id of shrine.choices) {
    const b = boonById(id);
    const card = document.createElement('div');
    card.className = 'boon-card';
    card.innerHTML = `<div class="boon-name">${b.name}</div><div class="boon-desc">${b.desc}</div>`;
    card.addEventListener('click', () => {
      STATE.player.boons.push(id);
      shrine.used = true;
      updateDerived(STATE.player);
      addParticles(STATE.player.x, STATE.player.y, 24, '#9ecbff', 4, 3.5);
      addFloater(STATE.player.x, STATE.player.y, b.name + '!', '#9ecbff', true);
      closePanel();
      saveRun();
      uiToast('The shrine\u2019s light fades. Boon gained — run saved.');
    });
    wrap.appendChild(card);
  }
}

// ---------- altar (meta perks) ----------
function renderAltarPanel() {
  const meta = STATE.meta;
  $('altar-embers').textContent = fmt(meta.embers);
  const list = $('altar-perks');
  list.innerHTML = '';
  for (const perk of META_PERKS) {
    const lv = perkLv(meta, perk.id);
    const cost = perkCost(perk, lv);
    const row = document.createElement('div');
    row.className = 'perk-row' + (cost === null ? ' maxed' : meta.embers >= cost ? ' can-buy' : '');
    const pips = perk.tiers.map((_, i) => `<span class="pip ${i < lv ? 'on' : ''}"></span>`).join('');
    row.innerHTML = `
      <div class="perk-head"><b>${perk.name}</b><span class="pips">${pips}</span></div>
      <div class="perk-desc">${perk.each}</div>
      <div class="perk-cost">${cost === null ? 'MAX' : `<span class="ember-ic"></span>${cost}`}</div>`;
    if (cost !== null) row.addEventListener('click', () => {
      if (meta.embers < cost) { uiToast('Not enough embers'); return; }
      meta.embers -= cost;
      meta.perks[perk.id] = lv + 1;
      saveMeta();
      updateDerived(STATE.player);
      renderAltarPanel();
      updateHUD();
      uiToast(`${perk.name} ${lv + 2 > perk.tiers.length ? 'mastered' : 'improved'}!`);
    });
    list.appendChild(row);
  }
}

// ---------- menus ----------
function uiRefreshMenu() {
  const meta = STATE.meta;
  const hasRun = !!localStorage.getItem(RUN_KEY);
  $('btn-continue').style.display = hasRun ? 'block' : 'none';
  if (hasRun) {
    try {
      const r = JSON.parse(localStorage.getItem(RUN_KEY));
      $('btn-continue').textContent = `Continue — ${floorTitle(r.floor)}`;
    } catch (e) { /* ignore */ }
  }
  $('menu-meta').innerHTML = meta.bestFloor > 0
    ? `<span class="ember-ic"></span> ${fmt(meta.embers)} embers&nbsp;&nbsp;·&nbsp;&nbsp;Deepest: ${meta.bestFloor}&nbsp;&nbsp;·&nbsp;&nbsp;${fmt(meta.kills || 0)} slain`
    : 'A new fate awaits.';
}

function showDeathScreen() {
  uiSetScreen('death');
  const r = STATE.run;
  $('death-stats').innerHTML = `
    <div class="d-row"><span>Depth reached</span><b>${r.maxFloor}</b></div>
    <div class="d-row"><span>Monsters slain</span><b>${r.kills}</b></div>
    <div class="d-row"><span>Gold gathered</span><b class="gold">${fmt(r.goldFound)}</b></div>
    <div class="d-row"><span>Embers kept</span><b class="ember-text">${fmt(r.embersFound)}</b></div>`;
}

function uiInit() {
  $('btn-new-run').addEventListener('click', () => startNewRun());
  $('btn-continue').addEventListener('click', () => continueRun());
  $('btn-death-town').addEventListener('click', () => { uiSetScreen('menu'); });
  $('panel-close').addEventListener('click', closePanel);
  $('panel-wrap').addEventListener('mousedown', (e) => { if (e.target === $('panel-wrap')) closePanel(); });
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => openPanel(btn.dataset.tab));
  });
}
