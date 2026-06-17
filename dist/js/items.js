// ============================================================
// FATEBOUND — items: weapons, armor, affixes, generation, icons
// ============================================================

const RARITIES = {
  common: { name: 'Common', color: '#b8b2a6', affixes: [0, 0], mult: 1, value: 14 },
  magic:  { name: 'Enchanted', color: '#6fa8ff', affixes: [1, 2], mult: 1.05, value: 42 },
  rare:   { name: 'Rare', color: '#ffd24a', affixes: [2, 3], mult: 1.12, value: 115 },
  epic:   { name: 'Fabled', color: '#c97cff', affixes: [3, 4], mult: 1.22, value: 270 },
  legendary: { name: 'Legendary', color: '#ff352a', affixes: [2, 3], mult: 1.42, value: 720 },
};

// ---------- legendaries: unique named items, each with one fixed power ----------
// power ids are read by the combat engine (entities.js / skills.js collectMods).
const LEGENDARIES = [
  // weapons
  { id: 'emberfang',   name: 'Emberfang',           base: 'sword',    power: 'ignite',
    text: 'Strikes set the wounded ablaze, searing them over time.' },
  { id: 'twinfang',    name: 'Vengeance, Twin Fang', base: 'dagger',  power: 'critarc',
    text: 'Critical strikes loose forked lightning to nearby foes.' },
  { id: 'skyreach',    name: 'Skyreach',            base: 'spear',    power: 'cleave',
    text: 'Every thrust cleaves through all foes in its reach.' },
  { id: 'wolfsong',    name: 'Wolfsong',            base: 'bow',      power: 'multishot',
    text: 'Each loosed arrow splits into a fan of three.' },
  { id: 'doomtoll',    name: 'Doomtoll',            base: 'crossbow', power: 'detonate',
    text: 'Bolts detonate on impact, blasting all nearby enemies.' },
  { id: 'whisperwind', name: 'Whisperwind',         base: 'wand',     power: 'homing',
    text: 'Arcane bolts curve through the air to hunt their prey.' },
  { id: 'cinderheart', name: 'Cinderheart',         base: 'staff',    power: 'cinder',
    text: 'Conjured fire bursts wider and leaves enemies burning.' },
  // offhand
  { id: 'aegis',       name: 'Aegis of the Fallen', base: 'shield',   power: 'blocknova',
    text: 'A turned blow erupts in a shockwave that hurls foes back.' },
  // armor
  { id: 'cinderscrown',name: 'Crown of Cinders',    base: 'helm',     power: 'igniteaura',
    text: 'Embers wreathe your brow, scorching foes who draw near.' },
  { id: 'mountainheart',name: 'Heart of the Mountain', base: 'chest', power: 'laststand',
    text: 'Below a third life: take 40% less and deal 30% more.' },
  { id: 'sevenleague', name: 'Sevenleague Stride',  base: 'boots',    power: 'phantomstep',
    text: 'Your dodge cools twice as fast and bursts on landing.' },
];
const LEG_KIND = { sword: 'weapon', dagger: 'weapon', spear: 'weapon', bow: 'weapon', crossbow: 'weapon', wand: 'weapon', staff: 'weapon', shield: 'offhand', helm: 'armor', chest: 'armor', boots: 'armor' };
function legSlot(base) { return base === 'shield' ? 'off' : LEG_KIND[base] === 'weapon' ? 'main' : base; }

// elemental enchantments: a chance to apply a status on hit + a graphical override
const ELEMENTS = {
  fire:      { name: 'Flaming', color: '#ff6a2a', glow: '#ff8a3a', tip: 'Chance to ignite — burns foes over time' },
  cold:      { name: 'Frost',   color: '#7fc8ff', glow: '#bfe8ff', tip: 'Chance to chill — slows movement & attacks' },
  lightning: { name: 'Storm',   color: '#b98cff', glow: '#d8c4ff', tip: 'Chance to shock — shocked foes take more crits' },
};

// class: melee scales w/ STR, ranged w/ DEX, magic w/ MAG
const WEAPON_TYPES = {
  sword:    { label: 'Sword',    cls: 'melee',  min: 4, max: 7,  spd: 1.5,  range: 1.7,  arc: 1.75, twoH: false },
  dagger:   { label: 'Dagger',   cls: 'melee',  min: 3, max: 5,  spd: 2.2,  range: 1.35, arc: 1.25, twoH: false, crit: 7 },
  spear:    { label: 'Spear',    cls: 'melee',  min: 5, max: 9,  spd: 1.15, range: 2.7,  arc: 0.95, twoH: false },
  bow:      { label: 'Bow',      cls: 'ranged', min: 4, max: 7,  spd: 1.5,  projSpd: 15, twoH: true },
  crossbow: { label: 'Crossbow', cls: 'ranged', min: 8, max: 13, spd: 0.85, projSpd: 19, twoH: true, pierce: 1 },
  wand:     { label: 'Wand',     cls: 'magic',  min: 3, max: 6,  spd: 1.9,  projSpd: 12, twoH: false },
  staff:    { label: 'Staff',    cls: 'magic',  min: 7, max: 12, spd: 0.95, projSpd: 10, twoH: true, splash: 1.35 },
};
const OFFHAND_TYPES = {
  shield: { label: 'Shield', armor: 6, block: 12 },
  tome:   { label: 'Tome', mana: 14, manaRegen: 0.6, spDmg: 0.1 },
};
const ARMOR_TYPES = {
  helm:  { label: 'Helm', armor: 3 },
  chest: { label: 'Armor', armor: 5 },
  boots: { label: 'Boots', armor: 2 },
};

// affix pool — v = [min,max] at ilvl 1, grows with ilvl
const AFFIX_POOL = [
  { k: 'dmgPct',    v: [0.06, 0.14], pct: true,  label: 'damage',            pre: 'Keen' },
  { k: 'dmgFlat',   v: [1, 3],       flat: true, label: 'flat damage',       pre: 'Brutal' },
  { k: 'atkSpd',    v: [0.05, 0.12], pct: true,  label: 'attack speed',      pre: 'Swift' },
  { k: 'crit',      v: [3, 7],       flat: true, label: '% critical chance', pre: 'Deadly' },
  { k: 'critDmg',   v: [0.15, 0.35], pct: true,  label: 'critical damage',   suf: 'of Ruin' },
  { k: 'armor',     v: [3, 8],       flat: true, label: 'armor',             suf: 'of the Tortoise' },
  { k: 'hp',        v: [8, 18],      flat: true, label: 'life',              suf: 'of the Bear' },
  { k: 'mana',      v: [6, 14],      flat: true, label: 'mana',              suf: 'of the Owl' },
  { k: 'manaRegen', v: [0.4, 1.0],   flat: true, label: 'mana per second',   suf: 'of Springs' },
  { k: 'moveSpd',   v: [0.04, 0.08], pct: true,  label: 'movement speed',    suf: 'of the Fox' },
  { k: 'lifeHit',   v: [1, 2.5],     flat: true, label: 'life per hit',      pre: 'Vampiric' },
  { k: 'str',       v: [2, 5],       flat: true, label: 'strength',          suf: 'of the Ox' },
  { k: 'dex',       v: [2, 5],       flat: true, label: 'dexterity',         suf: 'of the Hawk' },
  { k: 'mag',       v: [2, 5],       flat: true, label: 'magic',             suf: 'of Stars' },
  { k: 'vit',       v: [2, 5],       flat: true, label: 'vitality',          suf: 'of Oaks' },
  { k: 'goldFind',  v: [0.10, 0.25], pct: true,  label: 'gold find',         suf: 'of Greed' },
];
const STAT_LABELS = {
  dmgPct: '% damage', dmgFlat: 'damage', atkSpd: '% attack speed', crit: '% crit chance',
  critDmg: '% crit damage', armor: 'armor', hp: 'life', mana: 'mana', manaRegen: 'mana/sec',
  moveSpd: '% move speed', lifeHit: 'life per hit', str: 'strength', dex: 'dexterity',
  mag: 'magic', vit: 'vitality', goldFind: '% gold find', block: '% block chance',
  spDmg: '% skill damage',
};
function affixLine(a) {
  const def = STAT_LABELS[a.k] || a.k;
  const val = a.pct ? Math.round(a.v * 100) : (a.v % 1 ? a.v.toFixed(1) : a.v);
  return `+${val} ${def}`;
}

function ilvlScale(ilvl) { return 1 + (Math.max(1, ilvl) - 1) * 0.17; }

function rollRarity(luck) {
  const r = Math.random() * (1 - (luck || 0));
  if (r < 0.009) return 'legendary';
  if (r < 0.05) return 'epic';
  if (r < 0.18) return 'rare';
  if (r < 0.50) return 'magic';
  return 'common';
}

function rollAffixes(rarity, ilvl, excludeKeys) {
  const [lo, hi] = RARITIES[rarity].affixes;
  const n = mri(lo, hi);
  const pool = AFFIX_POOL.filter(a => !(excludeKeys || []).includes(a.k));
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const a = pool.splice(idx, 1)[0];
    let v = mrf(a.v[0], a.v[1]) * (RARITIES[rarity].mult) * (a.flat ? ilvlScale(ilvl) : 1);
    if (a.flat) v = Math.round(v * 10) / 10;
    if (v >= 3 && a.flat) v = Math.round(v);
    out.push({ k: a.k, v, pct: !!a.pct, word: a });
  }
  return out;
}

function nameItem(baseName, rarity, affixes) {
  if (rarity === 'common' || !affixes.length) return baseName;
  let pre = '', suf = '';
  for (const a of affixes) {
    if (!pre && a.word.pre) pre = a.word.pre;
    else if (!suf && a.word.suf) suf = a.word.suf;
  }
  if (rarity === 'epic' && !pre) pre = 'Fabled';
  return `${pre ? pre + ' ' : ''}${baseName}${suf ? ' ' + suf : ''}`.trim();
}

let _itemId = 1;
function rollItem(ilvl, opts) {
  opts = opts || {};
  const kindRoll = Math.random();
  let kind = opts.kind || (kindRoll < 0.45 ? 'weapon' : kindRoll < 0.62 ? 'offhand' : 'armor');
  const rarity = opts.rarity || rollRarity(opts.luck);
  // legendary: resolve to a specific unique, overriding kind/type
  let legend = null;
  if (rarity === 'legendary') {
    const pool = LEGENDARIES.filter(l => !opts.kind || LEG_KIND[l.base] === opts.kind);
    legend = opts.legend || mpick(pool.length ? pool : LEGENDARIES);
    kind = LEG_KIND[legend.base];
    opts = Object.assign({}, opts, { type: legend.base });
  }
  const s = ilvlScale(ilvl);
  let item;
  if (kind === 'weapon') {
    const type = opts.type || mpick(Object.keys(WEAPON_TYPES));
    const w = WEAPON_TYPES[type];
    const mult = RARITIES[rarity].mult;
    item = {
      kind, type, slot: 'main', cls: w.cls, twoH: !!w.twoH,
      dmgMin: Math.round(w.min * s * mult), dmgMax: Math.round(w.max * s * mult),
      spd: w.spd, range: w.range, arc: w.arc, projSpd: w.projSpd, pierce: w.pierce || 0,
      splash: w.splash || 0, baseCrit: w.crit || 0,
      affixes: rollAffixes(rarity, ilvl),
      baseName: w.label,
    };
  } else if (kind === 'offhand') {
    const type = opts.type || mpick(Object.keys(OFFHAND_TYPES));
    const o = OFFHAND_TYPES[type];
    item = {
      kind, type, slot: 'off',
      armor: o.armor ? Math.round(o.armor * s) : 0,
      block: o.block || 0,
      mana: o.mana ? Math.round(o.mana * s) : 0,
      manaRegen: o.manaRegen || 0, spDmg: o.spDmg || 0,
      affixes: rollAffixes(rarity, ilvl),
      baseName: o.label,
    };
  } else {
    const type = opts.type || mpick(Object.keys(ARMOR_TYPES));
    const a = ARMOR_TYPES[type];
    item = {
      kind: 'armor', type, slot: type,
      armor: Math.round(a.armor * s * RARITIES[rarity].mult),
      affixes: rollAffixes(rarity, ilvl),
      baseName: a.label,
    };
  }
  item.id = _itemId++;
  item.ilvl = ilvl;
  item.rarity = rarity;
  item.name = nameItem(item.baseName, rarity, item.affixes);
  item.value = Math.round(RARITIES[rarity].value * (1 + ilvl * 0.22));
  // weapon graphic variety (curved / spiked / etc) — stable per item
  if (kind === 'weapon') item.variant = (Math.random() * 3) | 0;
  // elemental enchant on some non-legendary weapons
  if (kind === 'weapon' && !legend && rarity !== 'common' && Math.random() < 0.28) {
    item.element = mpick(['fire', 'cold', 'lightning']);
    item.name = ELEMENTS[item.element].name + ' ' + item.name;
    item.value = Math.round(item.value * 1.25);
  }
  if (legend) {
    item.legend = legend.id;
    item.power = legend.power;
    item.powerText = legend.text;
    item.name = legend.name;
  }
  return item;
}

function makeStarterWeapon(meta) {
  const it = rollItem(1, { kind: 'weapon', type: 'sword', rarity: perkLv(meta, 'outfitter') ? 'magic' : 'common' });
  it.name = perkLv(meta, 'outfitter') ? it.name : 'Worn Sword';
  return it;
}

function makeSpellbook(spellId, ilvl, rarity) {
  const sp = SPELLS[spellId];
  rarity = rarity || (Math.random() < 0.25 ? 'rare' : 'magic');
  return {
    id: _itemId++, kind: 'book', type: 'book', slot: 'book', spell: spellId,
    name: 'Tome of ' + sp.name, baseName: 'Tome', rarity,
    ilvl: ilvl || 1,
    affixes: rarity === 'common' ? [] : rollAffixes(rarity, ilvl || 1, ['dmgFlat', 'atkSpd', 'lifeHit', 'goldFind']),
    value: Math.round(70 * (1 + (ilvl || 1) * 0.18)),
  };
}

// ---------- pets ----------
const PET_TYPES = {
  wolf: { label: 'Wolf Whelp',   cls: 'melee',  atkInt: 0.95, spd: 5.8 },
  hawk: { label: 'Hunting Hawk', cls: 'ranged', atkInt: 1.4,  spd: 6.4, range: 6.5, projSpd: 13 },
  wisp: { label: 'Arcane Wisp',  cls: 'magic',  atkInt: 1.8,  spd: 5.6, range: 6,   projSpd: 10, splash: 0.9 },
};
const PET_RARITY_MULT = { common: 1, magic: 1.2, rare: 1.45, epic: 1.8 };
function petDamage(level, rarity) {
  return (3 + level * 1.4) * (PET_RARITY_MULT[rarity] || 1);
}
function makePetItem(type, ilvl, rarity) {
  const t = PET_TYPES[type];
  rarity = rarity || rollRarity(0.2);
  const pre = rarity === 'epic' ? 'Fabled ' : rarity === 'rare' ? 'Prized ' : rarity === 'magic' ? 'Loyal ' : '';
  return {
    id: _itemId++, kind: 'pet', type, slot: 'pet', petCls: t.cls,
    name: pre + t.label, baseName: t.label, rarity,
    ilvl: ilvl || 1, affixes: [],
    value: Math.round(180 * (1 + (ilvl || 1) * 0.15)),
  };
}

function potionPrice(kind, floor) { return Math.round((kind === 'hp' ? 22 : 18) * (1 + floor * 0.12)); }

function rollVendorStock(floor) {
  const stock = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    let it = rollItem(Math.max(1, floor + (i === 0 ? 1 : 0)), { luck: 0.25 });
    // legendaries are dungeon-only treasure — Maren never stocks them
    if (it.rarity === 'legendary') it = rollItem(it.ilvl, { rarity: 'epic' });
    if (it.rarity === 'common') { it.rarity = 'magic'; it.affixes = rollAffixes('magic', it.ilvl); it.name = nameItem(it.baseName, 'magic', it.affixes); it.value = Math.round(RARITIES.magic.value * (1 + it.ilvl * 0.22)); }
    stock.push(it);
  }
  stock.push(makeSpellbook(mpick(BOOK_SPELLS), Math.max(1, floor)));
  return stock;
}

// ---------- tooltips ----------
// the body of a single item card (no buy/sell footer, no compare)
function itemCardHTML(item) {
  const rc = RARITIES[item.rarity].color;
  if (item.kind === 'book' || item.kind === 'scroll') {
    const sp = SPELLS[item.spell];
    const aff = item.affixes.map(a => `<div class="tt-affix">${affixLine(a)}</div>`).join('');
    return `
      <div class="tt-name" style="color:${rc}">${item.name}</div>
      <div class="tt-type">Spellbook · equip, then right-click to cast</div>
      <div class="tt-stat">${sp.desc}</div>
      <div class="tt-stat tt-dim">${sp.cost} mana · ${sp.cd}s cooldown · scales with Magic</div>
      ${aff}`;
  }
  if (item.kind === 'pet') {
    const t = PET_TYPES[item.type];
    return `
      <div class="tt-name" style="color:${rc}">${item.name}</div>
      <div class="tt-type">Pet · ${t.cls} companion</div>
      <div class="tt-stat">Fights at your side. Only one pet may follow you.</div>
      <div class="tt-stat tt-dim">Damage scales with your level (×${(PET_RARITY_MULT[item.rarity] || 1).toFixed(2)} ${RARITIES[item.rarity].name.toLowerCase()})</div>`;
  }
  let rows = '';
  if (item.kind === 'weapon') {
    rows += `<div class="tt-stat">${item.dmgMin}–${item.dmgMax} damage <span class="tt-dim">(${item.cls})</span></div>`;
    rows += `<div class="tt-stat">${item.spd.toFixed(1)} attacks/sec${item.twoH ? ' · two-handed' : ''}</div>`;
    if (item.baseCrit) rows += `<div class="tt-stat">+${item.baseCrit}% crit chance</div>`;
    if (item.pierce) rows += `<div class="tt-stat">Pierces ${item.pierce} enemy</div>`;
    if (item.splash) rows += `<div class="tt-stat">Splash damage on impact</div>`;
    if (item.element) rows += `<div class="tt-stat" style="color:${ELEMENTS[item.element].color}">◆ ${ELEMENTS[item.element].tip}</div>`;
  } else {
    if (item.armor) rows += `<div class="tt-stat">${item.armor} armor</div>`;
    if (item.block) rows += `<div class="tt-stat">${item.block}% block chance</div>`;
    if (item.mana) rows += `<div class="tt-stat">+${item.mana} mana</div>`;
    if (item.manaRegen) rows += `<div class="tt-stat">+${item.manaRegen.toFixed(1)} mana/sec</div>`;
    if (item.spDmg) rows += `<div class="tt-stat">+${Math.round(item.spDmg * 100)}% skill damage</div>`;
  }
  const aff = item.affixes.map(a => `<div class="tt-affix">${affixLine(a)}</div>`).join('');
  const leg = item.power ? `<div class="tt-legend">◈ ${item.powerText}</div>` : '';
  return `
    <div class="tt-name" style="color:${rc}">${item.name}</div>
    <div class="tt-type">${RARITIES[item.rarity].name} ${item.baseName} · lv ${item.ilvl}</div>
    ${rows}${aff}${leg}`;
}
function itemTooltipHTML(item, opts) {
  opts = opts || {};
  let foot = '';
  if (opts.price != null) foot = `<div class="tt-foot">Buy: <b class="gold">${opts.price}g</b></div>`;
  else if (opts.sell != null) foot = `<div class="tt-foot">Sell: <b class="gold">${opts.sell}g</b> <span class="tt-dim">(right-click)</span></div>`;
  else if (opts.hint) foot = `<div class="tt-foot tt-dim">${opts.hint}</div>`;
  // side-by-side comparison: hovered card next to the equipped card
  if (opts.compare && opts.compare !== item) {
    const eq = opts.compare;
    return `<div class="tt-cards">
      <div class="tt-card"><div class="tt-cardtag">Hovered</div>${itemCardHTML(item)}${foot}</div>
      <div class="tt-card tt-card-eq"><div class="tt-cardtag">Equipped</div>${itemCardHTML(eq)}</div>
    </div>`;
  }
  return itemCardHTML(item) + foot;
}

// ---------- icons (small vector canvases) ----------
function drawItemIcon(cv, item) {
  const ctx = cv.getContext('2d');
  const S = cv.width;
  ctx.clearRect(0, 0, S, S);
  ctx.save();
  ctx.translate(S / 2, S / 2);
  const rc = RARITIES[item.rarity].color;
  const el = item.element ? ELEMENTS[item.element] : null;
  if (item.rarity === 'legendary') { ctx.shadowColor = rc; ctx.shadowBlur = 6; }
  else if (el) { ctx.shadowColor = el.glow; ctx.shadowBlur = 7; }
  const steel = el ? el.color : '#aeb6bd', wood = '#8a6844', dark = '#3a3f45';
  const vr = item.variant || 0;
  function blade(len, wid, color) {
    ctx.save(); ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = color; ctx.beginPath();
    if (vr === 1) {
      // curved saber
      ctx.moveTo(-wid, len * 0.45);
      ctx.quadraticCurveTo(-wid * 2.4, -len * 0.1, 0, -len * 0.55);
      ctx.quadraticCurveTo(wid * 1.4, -len * 0.1, wid, len * 0.45);
      ctx.closePath(); ctx.fill();
    } else if (vr === 2) {
      // serrated / spiked edge
      ctx.moveTo(-wid, len * 0.45); ctx.lineTo(-wid, -len * 0.2);
      ctx.lineTo(-wid * 2, -len * 0.2); ctx.lineTo(-wid * 0.5, -len * 0.4);
      ctx.lineTo(-wid * 1.6, -len * 0.45); ctx.lineTo(0, -len * 0.58);
      ctx.lineTo(wid, -len * 0.35); ctx.lineTo(wid, len * 0.45);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.moveTo(-wid, len * 0.45); ctx.lineTo(-wid, -len * 0.35);
      ctx.lineTo(0, -len * 0.55); ctx.lineTo(wid, -len * 0.35); ctx.lineTo(wid, len * 0.45);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  switch (item.type) {
    case 'sword':
      blade(S * 0.78, S * 0.07, steel);
      ctx.save(); ctx.rotate(-Math.PI / 4); ctx.fillStyle = rc;
      ctx.fillRect(-S * 0.16, S * 0.30, S * 0.32, S * 0.06);
      ctx.fillStyle = wood; ctx.fillRect(-S * 0.035, S * 0.36, S * 0.07, S * 0.16); ctx.restore();
      break;
    case 'dagger':
      blade(S * 0.5, S * 0.075, steel);
      ctx.save(); ctx.rotate(-Math.PI / 4); ctx.fillStyle = rc;
      ctx.fillRect(-S * 0.12, S * 0.16, S * 0.24, S * 0.055);
      ctx.fillStyle = wood; ctx.fillRect(-S * 0.035, S * 0.21, S * 0.07, S * 0.14); ctx.restore();
      break;
    case 'spear':
      ctx.save(); ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = wood; ctx.fillRect(-S * 0.025, -S * 0.2, S * 0.05, S * 0.62);
      ctx.fillStyle = steel; ctx.beginPath();
      ctx.moveTo(0, -S * 0.5); ctx.lineTo(S * 0.07, -S * 0.22); ctx.lineTo(-S * 0.07, -S * 0.22);
      ctx.closePath(); ctx.fill(); ctx.restore();
      break;
    case 'bow':
      ctx.save(); ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = wood; ctx.lineWidth = S * 0.06; ctx.beginPath();
      ctx.arc(-S * 0.1, 0, S * 0.34, -Math.PI / 2.2, Math.PI / 2.2); ctx.stroke();
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(-S * 0.1 + Math.cos(-Math.PI / 2.2) * S * 0.34, Math.sin(-Math.PI / 2.2) * S * 0.34);
      ctx.lineTo(-S * 0.1 + Math.cos(Math.PI / 2.2) * S * 0.34, Math.sin(Math.PI / 2.2) * S * 0.34);
      ctx.stroke(); ctx.restore();
      break;
    case 'crossbow':
      ctx.fillStyle = wood; ctx.fillRect(-S * 0.05, -S * 0.32, S * 0.1, S * 0.6);
      ctx.strokeStyle = steel; ctx.lineWidth = S * 0.055; ctx.beginPath();
      ctx.arc(0, -S * 0.18, S * 0.26, Math.PI * 0.15, Math.PI * 0.85, true); ctx.stroke();
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(-S * 0.24, -S * 0.1); ctx.lineTo(S * 0.24, -S * 0.1); ctx.stroke();
      break;
    case 'wand':
      ctx.save(); ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = wood; ctx.fillRect(-S * 0.03, -S * 0.25, S * 0.06, S * 0.55);
      ctx.fillStyle = rc; ctx.beginPath(); ctx.arc(0, -S * 0.3, S * 0.1, 0, 7); ctx.fill(); ctx.restore();
      break;
    case 'staff':
      ctx.save(); ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = wood; ctx.fillRect(-S * 0.035, -S * 0.32, S * 0.07, S * 0.85);
      ctx.strokeStyle = rc; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -S * 0.36, S * 0.12, 0, 7); ctx.stroke();
      ctx.fillStyle = rc; ctx.beginPath(); ctx.arc(0, -S * 0.36, S * 0.06, 0, 7); ctx.fill(); ctx.restore();
      break;
    case 'shield':
      ctx.fillStyle = steel; ctx.beginPath();
      ctx.moveTo(0, -S * 0.34); ctx.lineTo(S * 0.28, -S * 0.2); ctx.lineTo(S * 0.24, S * 0.12);
      ctx.lineTo(0, S * 0.36); ctx.lineTo(-S * 0.24, S * 0.12); ctx.lineTo(-S * 0.28, -S * 0.2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = rc; ctx.beginPath(); ctx.arc(0, 0, S * 0.09, 0, 7); ctx.fill();
      break;
    case 'tome':
      ctx.fillStyle = rc; ctx.fillRect(-S * 0.26, -S * 0.3, S * 0.52, S * 0.6);
      ctx.fillStyle = dark; ctx.fillRect(-S * 0.26, -S * 0.3, S * 0.09, S * 0.6);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(S * 0.04, 0, S * 0.11, 0, 7); ctx.stroke();
      break;
    case 'helm':
      ctx.fillStyle = steel; ctx.beginPath();
      ctx.arc(0, -S * 0.04, S * 0.28, Math.PI, 0); ctx.lineTo(S * 0.28, S * 0.22);
      ctx.lineTo(-S * 0.28, S * 0.22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark; ctx.fillRect(-S * 0.2, S * 0.02, S * 0.4, S * 0.08);
      ctx.fillStyle = rc; ctx.fillRect(-S * 0.03, -S * 0.34, S * 0.06, S * 0.12);
      break;
    case 'chest':
      ctx.fillStyle = steel; ctx.beginPath();
      ctx.moveTo(-S * 0.3, -S * 0.26); ctx.lineTo(S * 0.3, -S * 0.26);
      ctx.lineTo(S * 0.22, S * 0.3); ctx.lineTo(-S * 0.22, S * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rc; ctx.fillRect(-S * 0.035, -S * 0.26, S * 0.07, S * 0.56);
      break;
    case 'boots':
      ctx.fillStyle = steel;
      ctx.fillRect(-S * 0.28, -S * 0.26, S * 0.18, S * 0.4);
      ctx.fillRect(-S * 0.28, S * 0.06, S * 0.34, S * 0.16);
      ctx.fillRect(S * 0.06, -S * 0.26, S * 0.18, S * 0.4);
      ctx.fillRect(S * 0.06, S * 0.06, S * 0.34, S * 0.16);
      ctx.fillStyle = rc; ctx.fillRect(-S * 0.28, -S * 0.26, S * 0.18, S * 0.07);
      ctx.fillRect(S * 0.06, -S * 0.26, S * 0.18, S * 0.07);
      break;
    case 'book': {
      const sc = (typeof SPELL_COLORS !== 'undefined' && SPELL_COLORS[item.spell]) || rc;
      ctx.fillStyle = '#5a3b22';
      ctx.fillRect(-S * 0.26, -S * 0.3, S * 0.52, S * 0.6);
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(-S * 0.17, -S * 0.3, S * 0.43, S * 0.6);
      ctx.strokeStyle = rc; ctx.lineWidth = 1.4;
      ctx.strokeRect(-S * 0.14, -S * 0.26, S * 0.37, S * 0.52);
      // glowing spell sigil
      ctx.shadowColor = sc; ctx.shadowBlur = 6;
      ctx.strokeStyle = sc; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(S * 0.045, -S * 0.02, S * 0.11, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(S * 0.045, -S * 0.16); ctx.lineTo(S * 0.045, S * 0.12); ctx.stroke();
      ctx.shadowBlur = 0;
      // clasp
      ctx.fillStyle = '#c7a14a';
      ctx.fillRect(S * 0.2, -S * 0.06, S * 0.07, S * 0.12);
      break;
    }
    case 'wolf':
      ctx.fillStyle = '#8a8276';
      ctx.beginPath(); ctx.arc(0, S * 0.02, S * 0.24, 0, 7); ctx.fill(); // head
      ctx.beginPath(); ctx.moveTo(-S * 0.2, -S * 0.1); ctx.lineTo(-S * 0.3, -S * 0.34); ctx.lineTo(-S * 0.06, -S * 0.2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(S * 0.2, -S * 0.1); ctx.lineTo(S * 0.3, -S * 0.34); ctx.lineTo(S * 0.06, -S * 0.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5d564a';
      ctx.beginPath(); ctx.moveTo(0, S * 0.06); ctx.lineTo(S * 0.1, S * 0.22); ctx.lineTo(-S * 0.1, S * 0.22); ctx.closePath(); ctx.fill(); // muzzle
      ctx.fillStyle = rc;
      ctx.beginPath(); ctx.arc(-S * 0.09, -S * 0.02, S * 0.045, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(S * 0.09, -S * 0.02, S * 0.045, 0, 7); ctx.fill();
      break;
    case 'hawk':
      ctx.fillStyle = '#9c7d5e';
      ctx.beginPath(); ctx.ellipse(0, S * 0.04, S * 0.13, S * 0.24, 0, 0, 7); ctx.fill(); // body
      ctx.beginPath(); ctx.moveTo(-S * 0.08, -S * 0.04); ctx.quadraticCurveTo(-S * 0.4, -S * 0.26, -S * 0.34, S * 0.06); ctx.quadraticCurveTo(-S * 0.2, S * 0.02, -S * 0.08, S * 0.1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(S * 0.08, -S * 0.04); ctx.quadraticCurveTo(S * 0.4, -S * 0.26, S * 0.34, S * 0.06); ctx.quadraticCurveTo(S * 0.2, S * 0.02, S * 0.08, S * 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8e0c8';
      ctx.beginPath(); ctx.arc(0, -S * 0.2, S * 0.1, 0, 7); ctx.fill(); // head
      ctx.fillStyle = rc;
      ctx.beginPath(); ctx.moveTo(0, -S * 0.16); ctx.lineTo(S * 0.07, -S * 0.08); ctx.lineTo(-S * 0.07, -S * 0.08); ctx.closePath(); ctx.fill();
      break;
    case 'wisp':
      ctx.shadowColor = rc; ctx.shadowBlur = 10;
      ctx.fillStyle = rc;
      ctx.beginPath(); ctx.arc(0, -S * 0.04, S * 0.17, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(-S * 0.05, -S * 0.09, S * 0.06, 0, 7); ctx.fill();
      ctx.fillStyle = rc;
      ctx.beginPath(); ctx.arc(-S * 0.18, S * 0.16, S * 0.05, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(S * 0.16, S * 0.2, S * 0.04, 0, 7); ctx.fill();
      break;
    case 'scroll':
      ctx.fillStyle = '#d9cdb0';
      ctx.fillRect(-S * 0.18, -S * 0.3, S * 0.36, S * 0.6);
      ctx.fillStyle = '#b3a584';
      ctx.fillRect(-S * 0.24, -S * 0.3, S * 0.08, S * 0.6);
      ctx.fillRect(S * 0.16, -S * 0.3, S * 0.08, S * 0.6);
      ctx.strokeStyle = '#6fa8ff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, -S * 0.02, S * 0.09, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-S * 0.1, S * 0.16); ctx.lineTo(S * 0.1, S * 0.16); ctx.stroke();
      break;
    default:
      ctx.fillStyle = rc; ctx.fillRect(-S * 0.2, -S * 0.2, S * 0.4, S * 0.4);
  }
  ctx.restore();
}
