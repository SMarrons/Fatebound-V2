// ============================================================
// FATEBOUND — entities: player, enemies, combat, loot, projectiles
// ============================================================

// ---------- player ----------
function newPlayer(meta) {
  const p = {
    x: 0, y: 0, r: 0.32, dir: 0,
    level: 1, xp: 0, statPoints: 0,
    str: 8, dex: 8, mag: 8, vit: 8,
    hp: 1, mana: 1,
    gold: 30 + (perkLv(meta, 'outfitter') ? 30 : 0),
    potions: { hp: 2, mp: 1 },
    inventory: [],
    equipment: { main: null, off: null, helm: null, chest: null, boots: null, book: null, pet: null },
    boons: [],
    spellCds: {}, wardHp: 0, wardT: 0,
    // transient
    atkCd: 0, spCd: 0, potCd: 0, dodgeCd: 0, dodgeT: 0, invulnT: 0,
    hurtT: 0, swingT: 0, swingDir: 1, dead: false, usedSecondWind: false,
    moveX: 0, moveY: 0, walkT: 0,
    d: null,
  };
  p.equipment.main = makeStarterWeapon(meta);
  p.equipment.book = makeSpellbook('firebolt', 1, 'common');
  updateDerived(p);
  p.hp = p.d.maxHp; p.mana = p.d.maxMana;
  return p;
}

function xpNeeded(level) { return Math.round(45 * Math.pow(level, 1.5)); }

function updateDerived(p) {
  const m = collectMods(p, STATE.meta);
  const str = p.str + m.str, dex = p.dex + m.dex, mag = p.mag + m.mag, vit = p.vit + m.vit;
  const w = p.equipment.main;
  const ow = p.equipment.off;
  const dual = !!(ow && ow.kind === 'weapon');
  const cls = w ? w.cls : 'melee';
  const scaleStat = cls === 'melee' ? str : cls === 'ranged' ? dex : mag;
  let baseMin = w ? w.dmgMin : 2, baseMax = w ? w.dmgMax : 4;
  if (dual) { baseMin += ow.dmgMin * 0.35; baseMax += ow.dmgMax * 0.35; }
  const dmgScale = (1 + m.dmgPct) * (1 + scaleStat * 0.022);
  const spd = (w ? w.spd : 1.6) * (1 + m.atkSpd) * (dual ? 1.12 : 1);
  p.d = {
    str, dex, mag, vit, cls,
    dmgMin: (baseMin + m.dmgFlat) * dmgScale,
    dmgMax: (baseMax + m.dmgFlat) * dmgScale,
    atkInterval: 1 / Math.max(0.3, spd),
    range: w && w.range ? w.range : 1.5,
    arc: w && w.arc ? w.arc : 1.6,
    projSpd: w ? w.projSpd : 0,
    pierce: w ? w.pierce || 0 : 0,
    splash: w ? w.splash || 0 : 0,
    crit: 5 + dex * 0.25 + m.crit,
    critDmg: 1.5 + m.critDmg,
    maxHp: Math.round((52 + vit * 8 + (p.level - 1) * 6 + m.hp) * (1 + m.hpPct)),
    maxMana: Math.round(28 + mag * 4 + (p.level - 1) * 2 + m.mana),
    manaRegen: 1.6 + mag * 0.05 + m.manaRegen,
    hpRegen: 0.4 + m.hpRegen,
    armor: m.armor + Math.round(str * 0.3),
    block: Math.min(45, m.block),
    moveSpd: 4.4 * (1 + m.moveSpd),
    goldFind: m.goldFind, emberFind: m.emberFind,
    lifeHit: m.lifeHit, lifeKill: m.lifeKill, manaKill: m.manaKill,
    spCost: m.spCost, spCd: m.spCd, spDmg: m.spDmg, thorns: m.thorns,
    potionCap: 3 + m.potionCap, secondWind: m.secondWind,
  };
  p.hp = Math.min(p.hp, p.d.maxHp);
  p.mana = Math.min(p.mana, p.d.maxMana);

  // active legendary powers, keyed by power id (for combat hooks)
  const legends = {};
  for (const slot of ['main', 'off', 'helm', 'chest', 'boots']) {
    const it = p.equipment[slot];
    if (it && it.power) legends[it.power] = it;
  }
  p.d.legends = legends;
  // cleave (Skyreach): basic spear thrusts sweep a full circle
  if (legends.cleave && p.equipment.main && p.equipment.main.type === 'spear') p.d.arc = Math.PI * 2;
}

function rollPlayerDamage(p, mult) {
  let amt = mrf(p.d.dmgMin, p.d.dmgMax) * (mult || 1);
  const crit = Math.random() * 100 < p.d.crit;
  if (crit) amt *= p.d.critDmg;
  // Heart of the Mountain: deal 30% more while badly wounded
  if (p.d.legends && p.d.legends.laststand && p.hp < p.d.maxHp * 0.35) amt *= 1.3;
  return { amt, crit };
}

// burning DoT applied by fire legendaries (Emberfang, Cinderheart, Crown of Cinders)
function igniteEnemy(e, dps, dur) {
  e.burnDps = Math.max(e.burnDps || 0, dps);
  e.burnT = Math.max(e.burnT || 0, dur);
}

function gainXp(p, amt) {
  p.xp += amt;
  let need = xpNeeded(p.level);
  while (p.xp >= need) {
    p.xp -= need;
    p.level++;
    p.statPoints += 3;
    updateDerived(p);
    p.hp = Math.min(p.d.maxHp, p.hp + p.d.maxHp * 0.35);
    p.mana = p.d.maxMana;
    addFloater(p.x, p.y, 'LEVEL UP!', '#ffd24a', true);
    addParticles(p.x, p.y, 26, '#ffd24a', 4, 3.5);
    if (typeof uiToast === 'function') uiToast(`Level ${p.level} — +3 stat points (C)`);
    need = xpNeeded(p.level);
  }
}

function healPlayer(p, amt) {
  p.hp = Math.min(p.d.maxHp, p.hp + amt);
}

function blockNova(p) {
  STATE.shake = Math.min(10, STATE.shake + 4);
  addParticles(p.x, p.y, 22, '#cdd6e0', 5, 3);
  addFloater(p.x, p.y, 'AEGIS', '#dfe6ee');
  for (const e of STATE.enemies) {
    if (e.dead) continue;
    if (dist(p.x, p.y, e.x, e.y) < 3.2 + e.r) {
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      const { amt } = rollPlayerDamage(p, 1.2);
      hitEnemy(e, amt, false, true);
      if (!e.dead) {
        e.x += Math.cos(a) * 0.9; e.y += Math.sin(a) * 0.9;
        if (circleHitsSolid(STATE.map, e.x, e.y, e.r)) { e.x -= Math.cos(a) * 0.9; e.y -= Math.sin(a) * 0.9; }
      }
    }
  }
}

function damagePlayer(amt, srcX, srcY, isMelee) {
  const p = STATE.player;
  if (p.dead || p.invulnT > 0 || p.dodgeT > 0) return 0;
  const L = p.d.legends || {};
  const red = p.d.armor / (p.d.armor + 22 + 11 * STATE.floor);
  let final = Math.max(1, amt * (1 - Math.min(0.75, red)));
  // Heart of the Mountain: take 40% less while badly wounded
  if (L.laststand && p.hp < p.d.maxHp * 0.35) final *= 0.6;
  if (p.d.block && Math.random() * 100 < p.d.block) {
    addFloater(p.x, p.y, 'BLOCK', '#aeb6bd');
    if (L.blocknova) blockNova(p);
    return 0;
  }
  if (p.wardHp > 0) {
    const ab = Math.min(p.wardHp, final);
    p.wardHp -= ab;
    final -= ab;
    addParticles(p.x, p.y, 5, '#b3a584', 2.5, 2.5);
    if (final <= 0.5) { addFloater(p.x, p.y, 'WARDED', '#b3a584'); return 0; }
  }
  p.invulnT = 0.35;
  p.hp -= final;
  p.hurtT = 0.25;
  STATE.shake = Math.min(10, STATE.shake + 4);
  addFloater(p.x, p.y, '-' + Math.round(final), '#ff7a6b');
  addParticles(p.x, p.y, 6, '#c94f43', 3, 3);
  if (p.hp <= 0) {
    if (p.d.secondWind && !p.usedSecondWind) {
      p.usedSecondWind = true;
      p.hp = p.d.maxHp * 0.4;
      p.invulnT = 1.5;
      addFloater(p.x, p.y, 'SECOND WIND', '#ffd24a', true);
      addParticles(p.x, p.y, 30, '#ffd24a', 5, 4);
    } else {
      p.hp = 0; p.dead = true;
      onPlayerDeath();
    }
  }
  return final;
}

// ---------- enemy defs ----------
const ENEMY_TYPES = {
  rat:      { name: 'Dire Rat',      hp: 14, dmg: 4,  spd: 4.6, r: 0.26, xp: 6,  aggroR: 6,  atkInt: 0.9,  scale: 0.7 },
  skeleton: { name: 'Skeleton',      hp: 26, dmg: 7,  spd: 2.9, r: 0.32, xp: 11, aggroR: 7,  atkInt: 1.1,  scale: 1 },
  archer:   { name: 'Bone Archer',   hp: 18, dmg: 8,  spd: 2.6, r: 0.3,  xp: 14, aggroR: 9,  atkInt: 1.9,  scale: 0.95, ranged: { range: 7.5, projSpd: 9, kind: 'arrow' } },
  spider:   { name: 'Cave Spider',   hp: 22, dmg: 6,  spd: 5.2, r: 0.3,  xp: 13, aggroR: 7,  atkInt: 0.8,  scale: 0.85 },
  brute:    { name: 'Goblin Brute',  hp: 60, dmg: 14, spd: 2.4, r: 0.42, xp: 24, aggroR: 6,  atkInt: 1.5,  scale: 1.3 },
  shaman:   { name: 'Goblin Shaman', hp: 26, dmg: 10, spd: 2.7, r: 0.3,  xp: 20, aggroR: 9,  atkInt: 2.2,  scale: 0.95, ranged: { range: 8, projSpd: 7, kind: 'spark' } },
  wraith:   { name: 'Wraith',        hp: 34, dmg: 11, spd: 3.6, r: 0.3,  xp: 26, aggroR: 9,  atkInt: 1.0,  scale: 1, phase: true },
  knight:   { name: 'Crypt Knight',  hp: 85, dmg: 16, spd: 2.2, r: 0.4,  xp: 36, aggroR: 7,  atkInt: 1.4,  scale: 1.25 },
};
const THEME_ROSTERS = {
  halls: ['rat', 'rat', 'skeleton', 'skeleton', 'archer'],
  caves: ['spider', 'spider', 'brute', 'shaman', 'rat'],
  crypt: ['skeleton', 'wraith', 'wraith', 'knight', 'archer', 'shaman'],
};

// ---------- elites ----------
const ELITE_MODS = [
  { id: 'lifesap',      label: 'Life Sap',     color: '#c97cff', title: 'the Lifedrinker' },
  { id: 'frenzied',     label: 'Frenzied',     color: '#ff6450', title: 'the Rabid' },
  { id: 'stonehide',    label: 'Stonehide',    color: '#aeb6bd', title: 'the Unbroken' },
  { id: 'regenerating', label: 'Regenerating', color: '#7ddc8a', title: 'the Undying' },
  { id: 'burning',      label: 'Burning Aura', color: '#ff9c4a', title: 'the Smouldering' },
];
const ELITE_MOD_INFO = {};
for (const m of ELITE_MODS) ELITE_MOD_INFO[m.id] = m;
const ELITE_NAME_A = ['Gor', 'Mal', 'Thrak', 'Vex', 'Skar', 'Drul', 'Bal', 'Mor', 'Ur', 'Zag', 'Krag', 'Fen'];
const ELITE_NAME_B = ['mash', 'gul', 'rek', 'ash', 'oth', 'ix', 'ar', 'un', 'grim', 'tha', 'usk', 'eth'];

function spawnEnemies(map, floor) {
  const rng = mulberry32((map.seed ^ 0x9e3779b9) >>> 0);
  const roster = THEME_ROSTERS[map.themeKey] || THEME_ROSTERS.halls;
  const cells = floorCells(map).filter(c =>
    dist(c.x + 0.5, c.y + 0.5, map.spawn.x, map.spawn.y) > 8);
  const hpMul = 1 + (floor - 1) * 0.24;
  const dmgMul = 1 + (floor - 1) * 0.14;
  const count = Math.min(55, 16 + floor * 3);
  const out = [];
  for (let i = 0; i < count && cells.length; i++) {
    const c = cells.splice(Math.floor(rng() * cells.length), 1)[0];
    const type = pick(rng, roster);
    const t = ENEMY_TYPES[type];
    const elite = rng() < 0.06 + floor * 0.004;
    const em = elite ? 2.2 : 1;
    let eliteMod = null, eliteName = null;
    if (elite) {
      const mod = pick(rng, ELITE_MODS);
      eliteMod = mod.id;
      eliteName = pick(rng, ELITE_NAME_A) + pick(rng, ELITE_NAME_B) + ' ' + mod.title;
    }
    const frenzy = eliteMod === 'frenzied';
    out.push({
      type, def: t,
      x: c.x + 0.5, y: c.y + 0.5, r: t.r * (elite ? 1.25 : 1),
      hp: t.hp * hpMul * em, maxHp: t.hp * hpMul * em,
      dmg: t.dmg * dmgMul * (elite ? 1.4 : 1),
      spd: t.spd * rf(rng, 0.9, 1.1) * (frenzy ? 1.35 : 1),
      xp: Math.round(t.xp * (1 + (floor - 1) * 0.3) * (elite ? 2.5 : 1)),
      elite, eliteMod, eliteName,
      aggro: false, atkCd: rf(rng, 0, 1), hurtT: 0, t: rf(rng, 0, 9),
      sizeVar: rf(rng, 0.9, 1.12),
      dead: false, dir: rf(rng, 0, 6.28), wanderT: 0,
    });
  }
  if (map.chest) spawnGuardian(map, floor, rng, out);
  return out;
}

// ---------- chest guardian miniboss ----------
const GUARDIAN_TITLES = ['the Hoardkeeper', 'Warden of the Vault', 'the Coffer-Bound', 'the Gilded Tyrant', 'Keeper of Spoils', 'the Vaultsworn'];
function spawnGuardian(map, floor, rng, out) {
  const roster = THEME_ROSTERS[map.themeKey] || THEME_ROSTERS.halls;
  // prefer a heavy bruiser type for the theme; fall back to roster
  const heavy = ['knight', 'brute'].filter(t => roster.includes(t));
  const type = heavy.length ? pick(rng, heavy) : pick(rng, roster);
  const t = ENEMY_TYPES[type];
  const hpMul = 1 + (floor - 1) * 0.24, dmgMul = 1 + (floor - 1) * 0.14;
  const name = pick(rng, ELITE_NAME_A) + pick(rng, ELITE_NAME_B) + ', ' + pick(rng, GUARDIAN_TITLES);
  // find a walkable cell adjacent to the chest
  let gx = map.chest.x, gy = map.chest.y;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]]) {
    if (tileAt(map, Math.floor(gx + dx), Math.floor(gy + dy)) === 1) { gx += dx * 0.7; gy += dy * 0.7; break; }
  }
  out.push({
    type, def: t,
    x: gx, y: gy, r: t.r * 1.5,
    hp: t.hp * hpMul * 4.2, maxHp: t.hp * hpMul * 4.2,
    dmg: t.dmg * dmgMul * 1.7,
    spd: t.spd * 0.96,
    xp: Math.round(t.xp * (1 + (floor - 1) * 0.3) * 4),
    elite: true, boss: true, guardsChest: true, chest: map.chest,
    eliteMod: 'frenzied', eliteName: name,
    aggro: false, atkCd: rf(rng, 0, 1), hurtT: 0, t: rf(rng, 0, 9),
    sizeVar: 1, dead: false, dir: rf(rng, 0, 6.28), wanderT: 0,
  });
}

// ---------- combat ----------
function hitEnemy(e, amt, crit, fromSkill, noLeg) {
  const p = STATE.player;
  if (fromSkill) amt *= (1 + p.d.spDmg);
  if (e.eliteMod === 'stonehide') amt *= 0.7;
  e.hp -= amt;
  e.hurtT = 0.18;
  e.aggro = true;
  addFloater(e.x, e.y, Math.round(amt), crit ? '#ffd24a' : '#f0e8da', crit);
  const goreC = (typeof GORE_PARTICLE !== 'undefined' && GORE_PARTICLE[e.type]) || '#9c1f16';
  addParticles(e.x, e.y, crit ? 10 : 5, crit ? '#ffd24a' : goreC, 3, 2.5);
  if (typeof paintHitBlood === 'function') paintHitBlood(e);
  if (p.d.lifeHit) healPlayer(p, p.d.lifeHit);
  // ---- legendary on-hit powers ----
  const L = p.d.legends || {};
  if (!noLeg) {
    if ((L.ignite || L.cinder) && !e.dead) {
      igniteEnemy(e, (p.d.dmgMin + p.d.dmgMax) * 0.5 * 0.4, 3);
      addParticles(e.x, e.y, 3, '#ff6a2a', 2, 2);
    }
    if (crit && L.critarc && !e.dead) {
      let hops = 0;
      for (const o of STATE.enemies) {
        if (o === e || o.dead || hops >= 2) continue;
        if (dist(e.x, e.y, o.x, o.y) < 4.2) {
          STATE.fxLines.push({ x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.28 });
          hitEnemy(o, amt * 0.5, false, true, true);
          addParticles(o.x, o.y, 6, '#cfeaff', 3, 2.5);
          hops++;
        }
      }
    }
  }
  if (e.hp <= 0 && !e.dead) killEnemy(e);
}

function killEnemy(e) {
  const p = STATE.player;
  e.dead = true;
  STATE.run.kills++;
  if (STATE.meta) STATE.meta.kills = (STATE.meta.kills || 0) + 1;
  if (typeof paintBlood === 'function') paintBlood(e.x, e.y, e.def.scale, e);
  gainXp(p, e.xp);
  if (p.d.lifeKill) healPlayer(p, p.d.lifeKill);
  if (p.d.manaKill) p.mana = Math.min(p.d.maxMana, p.mana + p.d.manaKill);
  const deathC = (typeof GORE_PARTICLE !== 'undefined' && GORE_PARTICLE[e.type]) || '#8a8276';
  addParticles(e.x, e.y, 14, deathC, 3.5, 3);
  dropLoot(e.x, e.y, STATE.floor, e.elite);
  // guardian falls -> its chest unlocks
  if (e.guardsChest && e.chest) {
    e.chest.locked = false;
    addParticles(e.chest.x, e.chest.y, 30, '#ff352a', 5, 3.5);
    addFloater(e.chest.x, e.chest.y, 'The vault is unsealed', '#ff8a7a', true);
    uiToast('The guardian falls — its chest is yours to claim.');
  }
  questOnKill(e);
  // pack alert
  for (const o of STATE.enemies)
    if (!o.dead && dist(o.x, o.y, e.x, e.y) < 4) o.aggro = true;
}

// open a guardian's chest: a burst of rich loot, biased toward high rarity
function openChest(chest) {
  const p = STATE.player;
  const floor = STATE.floor;
  chest.opened = true;
  addParticles(chest.x, chest.y, 36, '#ffd24a', 5, 3.5);
  STATE.shake = Math.min(8, STATE.shake + 3);
  const gold = Math.round(mri(30, 60) * (1 + floor * 0.35) * (1 + p.d.goldFind));
  STATE.pickups.push({ kind: 'gold', x: chest.x, y: chest.y + 0.3, amt: gold, t: 0 });
  STATE.pickups.push({ kind: 'ember', x: chest.x - 0.4, y: chest.y + 0.3, amt: Math.round(mri(3, 6) * (1 + p.d.emberFind)), t: 0 });
  // 3 quality items; first is guaranteed rare+, with a real shot at legendary
  const jit = () => mrf(-0.5, 0.5);
  for (let i = 0; i < 3; i++) {
    let item;
    if (i === 0) {
      const r = Math.random();
      const rarity = r < 0.16 ? 'legendary' : r < 0.5 ? 'epic' : 'rare';
      item = rollItem(Math.max(1, floor + 1), { rarity });
    } else {
      item = rollItem(Math.max(1, floor + 1), { luck: 0.45 });
    }
    STATE.pickups.push({ kind: 'item', x: chest.x + jit(), y: chest.y + 0.4 + jit(), item, t: 0 });
  }
  uiToast('You throw open the guardian\u2019s chest!');
}

// ---------- per-floor challenges ----------
function pluralName(type) {
  const n = ENEMY_TYPES[type].name;
  return /s$/.test(n) ? n : n + 's';
}
function generateQuest(map, floor) {
  const qrng = mulberry32((map.seed ^ 0x51ed2701) >>> 0);
  const counts = {};
  for (const e of STATE.enemies) if (!e.boss) counts[e.type] = (counts[e.type] || 0) + 1;
  const types = Object.keys(counts);
  const roll = qrng();

  if (roll < 0.36 && types.length) {
    // cull a specific monster type
    const type = types[Math.floor(qrng() * types.length)];
    const target = Math.min(counts[type], 5 + Math.floor(floor * 0.7));
    return { kind: 'killType', type, target, n: 0, done: false,
      title: 'Cull the ' + pluralName(type) };
  }
  if (roll < 0.68) {
    // gather dark shards strewn about the floor
    const target = Math.min(12, 5 + Math.floor(floor * 0.6));
    const cells = floorCells(map).filter(c =>
      dist(c.x + 0.5, c.y + 0.5, map.spawn.x, map.spawn.y) > 5);
    for (let i = 0; i < target && cells.length; i++) {
      const c = cells.splice(Math.floor(qrng() * cells.length), 1)[0];
      STATE.pickups.push({ kind: 'shard', x: c.x + 0.5, y: c.y + 0.5, t: 0, seed: (qrng() * 1e6) | 0 });
    }
    return { kind: 'collect', target, n: 0, done: false, title: 'Gather the Dark Shards' };
  }
  // cleanse: slay every foe on the floor
  const total = STATE.enemies.filter(e => !e.boss).length;
  return { kind: 'cleanse', target: total, n: 0, done: false, title: 'Cleanse the Floor' };
}
function questText(q) {
  if (!q) return '';
  if (q.kind === 'killType') return `Slay ${pluralName(q.type)}`;
  if (q.kind === 'collect') return 'Collect dark shards';
  return 'Slay every foe';
}
function questOnKill(e) {
  const q = STATE.quest;
  if (!q || q.done || e.boss) return;
  if (q.kind === 'killType' && e.type === q.type) q.n++;
  else if (q.kind === 'cleanse') q.n++;
  if (q.n >= q.target) questComplete();
}
function questComplete() {
  const q = STATE.quest;
  if (!q || q.done) return;
  q.done = true;
  const p = STATE.player, floor = STATE.floor;
  const embers = Math.round((3 + floor) * (1 + p.d.emberFind));
  STATE.meta.embers += embers; STATE.run.embersFound += embers; saveMeta();
  const gold = Math.round(mri(20, 40) * (1 + floor * 0.3) * (1 + p.d.goldFind));
  STATE.pickups.push({ kind: 'gold', x: p.x + mrf(-0.5, 0.5), y: p.y + 0.6, amt: gold, t: 0 });
  STATE.pickups.push({ kind: 'item', x: p.x + mrf(-0.5, 0.5), y: p.y + 0.8, item: rollItem(Math.max(1, floor + 1), { luck: 0.4 }), t: 0 });
  addParticles(p.x, p.y, 28, '#ffd24a', 4.5, 3.5);
  addFloater(p.x, p.y, 'Challenge complete!', '#ffd24a', true);
  uiToast(`Floor challenge complete — +${embers} embers`);
}

function dropLoot(x, y, floor, elite) {
  const p = STATE.player;
  const jit = () => mrf(-0.45, 0.45);
  const goldChance = elite ? 1 : 0.55;
  if (Math.random() < goldChance) {
    const amt = Math.round(mri(2, 7) * (1 + floor * 0.3) * (1 + p.d.goldFind) * (elite ? 2.5 : 1));
    STATE.pickups.push({ kind: 'gold', x: x + jit(), y: y + jit(), amt, t: 0 });
  }
  if (Math.random() < (elite ? 0.22 : 0.07))
    STATE.pickups.push({ kind: 'ember', x: x + jit(), y: y + jit(), amt: Math.round(mri(1, 3) * (1 + p.d.emberFind)), t: 0 });
  if (Math.random() < (elite ? 0.25 : 0.075))
    STATE.pickups.push({ kind: Math.random() < 0.62 ? 'potion_hp' : 'potion_mp', x: x + jit(), y: y + jit(), t: 0 });
  if (Math.random() < (elite ? 0.12 : 0.035)) {
    STATE.pickups.push({ kind: 'item', x: x + jit(), y: y + jit(), item: makeSpellbook(mpick(BOOK_SPELLS), Math.max(1, floor)), t: 0 });
  }
  if (Math.random() < (elite ? 0.09 : 0.012)) {
    const item = makePetItem(mpick(Object.keys(PET_TYPES)), Math.max(1, floor), rollRarity(elite ? 0.35 : 0.1));
    STATE.pickups.push({ kind: 'item', x: x + jit(), y: y + jit(), item, t: 0 });
  }
  if (Math.random() < (elite ? 0.65 : 0.11)) {
    const item = rollItem(Math.max(1, floor + (elite ? 1 : 0)), { luck: elite ? 0.35 : 0 });
    STATE.pickups.push({ kind: 'item', x: x + jit(), y: y + jit(), item, t: 0 });
  }
}

function breakCrate(prop) {
  prop.hp = 0;
  addParticles(prop.x, prop.y, 12, '#8a6844', 3.5, 3);
  const floor = STATE.floor;
  if (Math.random() < 0.65)
    STATE.pickups.push({ kind: 'gold', x: prop.x, y: prop.y, amt: Math.round(mri(2, 6) * (1 + floor * 0.25)), t: 0 });
  else if (Math.random() < 0.5)
    STATE.pickups.push({ kind: Math.random() < 0.6 ? 'potion_hp' : 'potion_mp', x: prop.x, y: prop.y, t: 0 });
  else if (Math.random() < 0.25)
    STATE.pickups.push({ kind: 'item', x: prop.x, y: prop.y, item: rollItem(Math.max(1, floor)), t: 0 });
}

function meleeSweep(x, y, dirAng, range, arc, dmgFn, fromSkill) {
  for (const e of STATE.enemies) {
    if (e.dead) continue;
    const d = dist(x, y, e.x, e.y);
    if (d > range + e.r) continue;
    const a = Math.atan2(e.y - y, e.x - x);
    if (Math.abs(angDiff(dirAng, a)) > arc / 2 && d > 0.7) continue;
    const { amt, crit } = dmgFn();
    hitEnemy(e, amt, crit, fromSkill);
    // small knockback
    e.x += Math.cos(a) * 0.18; e.y += Math.sin(a) * 0.18;
    if (circleHitsSolid(STATE.map, e.x, e.y, e.r)) { e.x -= Math.cos(a) * 0.18; e.y -= Math.sin(a) * 0.18; }
  }
  // crates
  for (const prop of STATE.map.props) {
    if (prop.type !== 'crate' || !prop.hp) continue;
    if (dist(x, y, prop.x, prop.y) < range + 0.4) breakCrate(prop);
  }
}

function spawnProjectile(opts) {
  STATE.projectiles.push(Object.assign({
    x: 0, y: 0, vx: 0, vy: 0, r: 0.18, dmg: 5, crit: false, friendly: true,
    kind: 'arrow', life: 1.6, pierce: 0, splash: 0, fromSkill: false, hitSet: null,
  }, opts));
}

function playerAttack(p) {
  const w = p.equipment.main;
  const d = p.d;
  p.atkCd = d.atkInterval;
  p.swingT = Math.min(0.3, d.atkInterval * 0.7);
  p.swingDir *= -1;
  const cls = d.cls;
  const L = d.legends || {};
  if (!w || cls === 'melee') {
    // Skyreach cleaves a full circle; otherwise the weapon's normal arc
    meleeSweep(p.x, p.y, p.dir, d.range, d.arc, () => rollPlayerDamage(p));
  } else if (cls === 'ranged' && L.multishot && w.type === 'bow') {
    // Wolfsong: every shot is a fan of three
    for (let i = -1; i <= 1; i++) {
      const a = p.dir + i * 0.14;
      const { amt, crit } = rollPlayerDamage(p, 0.8);
      spawnProjectile({
        x: p.x + Math.cos(a) * 0.5, y: p.y + Math.sin(a) * 0.5,
        vx: Math.cos(a) * d.projSpd, vy: Math.sin(a) * d.projSpd,
        dmg: amt, crit, friendly: true, pierce: d.pierce, kind: 'arrow', life: 1.4, hitSet: new Set(),
      });
    }
  } else {
    const { amt, crit } = rollPlayerDamage(p);
    const isMagic = cls === 'magic';
    let splash = d.splash;
    if (L.detonate && w.type === 'crossbow') splash = Math.max(splash, 1.6);   // Doomtoll
    if (L.cinder && w.type === 'staff') splash = Math.max(splash, 1.7) * 1.4;    // Cinderheart
    spawnProjectile({
      x: p.x + Math.cos(p.dir) * 0.5, y: p.y + Math.sin(p.dir) * 0.5,
      vx: Math.cos(p.dir) * d.projSpd, vy: Math.sin(p.dir) * d.projSpd,
      dmg: amt, crit, friendly: true, pierce: d.pierce, splash,
      homing: !!(L.homing && w.type === 'wand'),                                  // Whisperwind
      kind: isMagic ? (w.type === 'staff' ? 'fireball' : 'bolt') : 'arrow',
      life: 1.4, hitSet: new Set(),
    });
  }
}

function playerSpecial(p) {
  const w = p.equipment.main;
  if (!w) return;
  const sk = WEAPON_SKILLS[w.type];
  if (!sk) return;
  const cost = sk.cost * (1 - p.d.spCost);
  if (p.spCd > 0) return;
  if (p.mana < cost) { addFloater(p.x, p.y, 'Not enough mana', '#7fb4ff'); return; }
  p.mana -= cost;
  p.spCd = sk.cd * (1 - p.d.spCd);
  p.spCdMax = p.spCd;
  p.swingT = 0.3;
  const d = p.d;
  const dmgFn = (mult) => rollPlayerDamage(p, mult || 1);
  switch (w.type) {
    case 'sword': {
      addParticles(p.x, p.y, 22, '#e8e0d0', 5, 3);
      meleeSweep(p.x, p.y, p.dir, d.range + 0.6, Math.PI * 2, () => dmgFn(1.5), true);
      break;
    }
    case 'dagger': {
      const dashLen = 3.4;
      const steps = 8;
      let nx = p.x, ny = p.y;
      for (let i = 1; i <= steps; i++) {
        const tx = p.x + Math.cos(p.dir) * (dashLen * i / steps);
        const ty = p.y + Math.sin(p.dir) * (dashLen * i / steps);
        if (circleHitsSolid(STATE.map, tx, ty, p.r)) break;
        nx = tx; ny = ty;
        meleeSweep(nx, ny, p.dir, 1.1, Math.PI * 2, () => dmgFn(1.1), true);
        addParticles(nx, ny, 3, '#cdd6e0', 2, 2);
      }
      p.x = nx; p.y = ny;
      p.invulnT = Math.max(p.invulnT, 0.3);
      break;
    }
    case 'spear': {
      const len = 4.2;
      for (let i = 1; i <= 10; i++) {
        const tx = p.x + Math.cos(p.dir) * (len * i / 10);
        const ty = p.y + Math.sin(p.dir) * (len * i / 10);
        if (isSolidTile(STATE.map, Math.floor(tx), Math.floor(ty))) break;
        addParticles(tx, ty, 2, '#e8e0d0', 1.5, 2);
        meleeSweep(tx, ty, p.dir, 0.8, Math.PI * 2, () => dmgFn(1.7), true);
      }
      break;
    }
    case 'bow': {
      for (let i = -2; i <= 2; i++) {
        const a = p.dir + i * 0.16;
        const { amt, crit } = dmgFn(0.9);
        spawnProjectile({
          x: p.x + Math.cos(a) * 0.5, y: p.y + Math.sin(a) * 0.5,
          vx: Math.cos(a) * d.projSpd, vy: Math.sin(a) * d.projSpd,
          dmg: amt, crit, kind: 'arrow', fromSkill: true, hitSet: new Set(),
        });
      }
      break;
    }
    case 'crossbow': {
      const { amt, crit } = dmgFn(2.4);
      spawnProjectile({
        x: p.x + Math.cos(p.dir) * 0.5, y: p.y + Math.sin(p.dir) * 0.5,
        vx: Math.cos(p.dir) * (d.projSpd * 1.2), vy: Math.sin(p.dir) * (d.projSpd * 1.2),
        dmg: amt, crit, kind: 'bigbolt', pierce: 99, life: 1.6, fromSkill: true, hitSet: new Set(), r: 0.26,
      });
      break;
    }
    case 'wand': {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (STATE.player.dead || STATE.screen !== 'game') return;
          const pp = STATE.player;
          const { amt, crit } = rollPlayerDamage(pp, 1.0);
          spawnProjectile({
            x: pp.x + Math.cos(pp.dir) * 0.5, y: pp.y + Math.sin(pp.dir) * 0.5,
            vx: Math.cos(pp.dir) * pp.d.projSpd, vy: Math.sin(pp.dir) * pp.d.projSpd,
            dmg: amt, crit, kind: 'bolt', fromSkill: true, hitSet: new Set(),
          });
        }, i * 110);
      }
      break;
    }
    case 'staff': {
      addParticles(p.x, p.y, 36, '#ff9c4a', 6, 4);
      STATE.shake = Math.min(10, STATE.shake + 5);
      for (const e of STATE.enemies) {
        if (e.dead) continue;
        if (dist(p.x, p.y, e.x, e.y) < 3.4 + e.r) {
          const { amt, crit } = dmgFn(1.8);
          hitEnemy(e, amt, crit, true);
        }
      }
      for (const prop of STATE.map.props)
        if (prop.type === 'crate' && prop.hp && dist(p.x, p.y, prop.x, prop.y) < 3.4) breakCrate(prop);
      break;
    }
  }
}

// ---------- spells ----------
function castSpell(p, spellId) {
  const sp = SPELLS[spellId];
  if (!sp || p.dead) return;
  if ((p.spellCds[spellId] || 0) > 0) return;
  const cost = sp.cost * (1 - p.d.spCost);
  if (p.mana < cost) { addFloater(p.x, p.y, 'Not enough mana', '#7fb4ff'); return; }
  p.mana -= cost;
  p.spellCds[spellId] = sp.cd * (1 - p.d.spCd);
  p.swingT = 0.22;
  switch (spellId) {
    case 'firebolt': {
      spawnProjectile({
        x: p.x + Math.cos(p.dir) * 0.5, y: p.y + Math.sin(p.dir) * 0.5,
        vx: Math.cos(p.dir) * 11, vy: Math.sin(p.dir) * 11,
        dmg: spellDamage(p, sp), crit: Math.random() * 100 < p.d.crit,
        kind: 'fireball', splash: 1.1, life: 1.5, fromSkill: true, hitSet: new Set(),
      });
      break;
    }
    case 'frostnova': {
      addParticles(p.x, p.y, 30, '#9ed8ff', 5.5, 3.5);
      STATE.shake = Math.min(10, STATE.shake + 4);
      for (const e of STATE.enemies) {
        if (e.dead) continue;
        if (dist(p.x, p.y, e.x, e.y) < sp.radius + e.r) {
          hitEnemy(e, spellDamage(p, sp), false, true);
          if (!e.dead) { e.slowT = 2.6; addParticles(e.x, e.y, 5, '#9ed8ff', 2, 2.5); }
        }
      }
      break;
    }
    case 'arc': {
      const targets = STATE.enemies
        .filter(e => !e.dead && dist(p.x, p.y, e.x, e.y) < sp.range && losClear(STATE.map, p.x, p.y, e.x, e.y))
        .sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y))
        .slice(0, sp.targets);
      if (!targets.length) {
        addFloater(p.x, p.y, 'No target in reach', '#9ecbff');
        p.mana += cost; p.spellCds[spellId] = 0.3;
        break;
      }
      let from = { x: p.x, y: p.y };
      for (const e of targets) {
        STATE.fxLines.push({ x1: from.x, y1: from.y, x2: e.x, y2: e.y, t: 0, life: 0.3 });
        hitEnemy(e, spellDamage(p, sp), Math.random() * 100 < p.d.crit, true);
        addParticles(e.x, e.y, 8, '#cfeaff', 3.5, 2.5);
        from = e;
      }
      break;
    }
    case 'ward': {
      p.wardT = 7;
      p.wardHp = Math.round(p.d.maxHp * 0.3);
      addParticles(p.x, p.y, 18, '#b3a584', 3.5, 3);
      addFloater(p.x, p.y, 'STONE WARD', '#b3a584', true);
      break;
    }
    case 'mend': {
      healPlayer(p, 10 + p.d.maxHp * 0.25);
      addParticles(p.x, p.y, 20, '#8fd98a', 3.5, 3);
      addFloater(p.x, p.y, '+life', '#8fd98a', true);
      break;
    }
  }
}

// equipped spellbook cast (RMB)
function castEquippedSpell(p) {
  const book = p.equipment.book;
  if (!book) {
    if (p.msgCd <= 0) { addFloater(p.x, p.y, 'No spellbook equipped', '#9ecbff'); p.msgCd = 1; }
    return;
  }
  const sp = SPELLS[book.spell];
  if ((p.spellCds[book.spell] || 0) > 0) return;
  if (p.mana < sp.cost * (1 - p.d.spCost)) {
    if (p.msgCd <= 0) { addFloater(p.x, p.y, 'Not enough mana', '#7fb4ff'); p.msgCd = 1; }
    return;
  }
  castSpell(p, book.spell);
}

function destroyItem(p, item) {
  const idx = p.inventory.indexOf(item);
  if (idx === -1) return;
  p.inventory.splice(idx, 1);
  addParticles(p.x, p.y, 8, '#8a8276', 2.5, 2);
  uiToast(item.name + ' destroyed');
  uiRefreshPanels();
}

// ---------- pets ----------
function syncPet() {
  const p = STATE.player;
  const eq = p.equipment.pet;
  if (!eq) { STATE.pet = null; return; }
  if (!STATE.pet || STATE.pet.itemId !== eq.id) {
    STATE.pet = {
      itemId: eq.id, type: eq.type, def: PET_TYPES[eq.type], rarity: eq.rarity,
      x: p.x + 0.8, y: p.y + 0.4, dir: 0, atkCd: 0, t: Math.random() * 9, walkT: 0,
    };
    addParticles(STATE.pet.x, STATE.pet.y, 14, '#9ecbff', 3, 3);
  }
}
function updatePet(dt) {
  syncPet();
  const pet = STATE.pet, p = STATE.player;
  if (!pet || p.dead) return;
  pet.t += dt;
  pet.atkCd = Math.max(0, pet.atkCd - dt);
  const def = pet.def;
  const dmg = petDamage(p.level, pet.rarity);
  // pick target
  let tgt = null, bd = 8;
  for (const e of STATE.enemies) {
    if (e.dead || !e.aggro) continue;
    const d = dist(pet.x, pet.y, e.x, e.y);
    if (d < bd && losClear(STATE.map, pet.x, pet.y, e.x, e.y)) { bd = d; tgt = e; }
  }
  const dp = dist(pet.x, pet.y, p.x, p.y);
  if (dp > 9) { // teleport if left behind
    pet.x = p.x + mrf(-0.5, 0.5); pet.y = p.y + mrf(-0.5, 0.5);
    addParticles(pet.x, pet.y, 8, '#9ecbff', 2.5, 2.5);
  }
  const want = def.cls === 'melee' ? 0.55 : (def.range - 0.5);
  let moved = false;
  if (tgt && bd > (def.cls === 'melee' ? 0.9 : def.range)) {
    const a = Math.atan2(tgt.y - pet.y, tgt.x - pet.x);
    pet.dir = a;
    moveCircle(STATE.map, Object.assign(pet, { r: 0.24 }), Math.cos(a) * def.spd * dt, Math.sin(a) * def.spd * dt);
    moved = true;
  } else if (!tgt && dp > 1.4) {
    const a = Math.atan2(p.y - pet.y, p.x - pet.x);
    pet.dir = a;
    moveCircle(STATE.map, Object.assign(pet, { r: 0.24 }), Math.cos(a) * def.spd * dt, Math.sin(a) * def.spd * dt);
    moved = true;
  }
  if (moved) pet.walkT += dt * def.spd;
  if (tgt && pet.atkCd <= 0) {
    const d = dist(pet.x, pet.y, tgt.x, tgt.y);
    pet.dir = Math.atan2(tgt.y - pet.y, tgt.x - pet.x);
    if (def.cls === 'melee' && d < 1.0) {
      pet.atkCd = def.atkInt;
      pet.lungeT = 0.18;
      hitEnemy(tgt, dmg * mrf(0.85, 1.15), Math.random() < 0.08);
    } else if (def.cls !== 'melee' && d < def.range) {
      pet.atkCd = def.atkInt;
      spawnProjectile({
        x: pet.x, y: pet.y,
        vx: Math.cos(pet.dir) * def.projSpd, vy: Math.sin(pet.dir) * def.projSpd,
        dmg: dmg * mrf(0.85, 1.15), friendly: true, splash: def.splash || 0,
        kind: pet.type === 'wisp' ? 'bolt' : 'arrow', life: 1.3, hitSet: new Set(),
      });
    }
  }
  if (pet.lungeT) pet.lungeT = Math.max(0, pet.lungeT - dt);
}

// ---------- town portal ----------
function lastSafeFloor() {
  for (let f = STATE.floor; f >= 0; f--)
    if (f === 0 || isSanctuaryFloor(f)) return f;
  return 0;
}
function useTownPortal(p) {
  if (p.dead) return;
  if (STATE.floor === 0 || isSanctuaryFloor(STATE.floor)) { uiToast('You are already somewhere safe.'); return; }
  STATE.runPortal = { floor: STATE.floor, x: p.x, y: p.y };
  addParticles(p.x, p.y, 30, '#7fb4ff', 5, 4);
  const safe = lastSafeFloor();
  enterFloor(safe);
  uiToast('The portal carries you to safety. It will hold open for your return.');
  saveRun();
}

function usePotion(p, kind) {
  if (p.potCd > 0 || p.dead) return;
  if (kind === 'hp') {
    if (p.potions.hp <= 0) { uiToast('No health potions'); return; }
    if (p.hp >= p.d.maxHp) return;
    p.potions.hp--;
    healPlayer(p, 18 + p.d.maxHp * 0.35);
    addParticles(p.x, p.y, 12, '#e0584d', 3, 3);
    addFloater(p.x, p.y, '+health', '#ff8a7a');
  } else {
    if (p.potions.mp <= 0) { uiToast('No mana potions'); return; }
    if (p.mana >= p.d.maxMana) return;
    p.potions.mp--;
    p.mana = Math.min(p.d.maxMana, p.mana + 14 + p.d.maxMana * 0.4);
    addParticles(p.x, p.y, 12, '#5a8cff', 3, 3);
    addFloater(p.x, p.y, '+mana', '#7fb4ff');
  }
  p.potCd = 1.2;
}

// ---------- per-frame updates ----------
function updatePlayer(dt) {
  const p = STATE.player;
  if (p.dead) return;
  updateDerived(p);
  // timers
  p.atkCd = Math.max(0, p.atkCd - dt);
  p.spCd = Math.max(0, p.spCd - dt);
  p.potCd = Math.max(0, p.potCd - dt);
  p.dodgeCd = Math.max(0, p.dodgeCd - dt);
  p.dodgeT = Math.max(0, p.dodgeT - dt);
  p.invulnT = Math.max(0, p.invulnT - dt);
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.swingT = Math.max(0, p.swingT - dt);
  p.msgCd = Math.max(0, (p.msgCd || 0) - dt);
  p.wardT = Math.max(0, p.wardT - dt);
  if (p.wardT <= 0) p.wardHp = 0;
  for (const k in p.spellCds) p.spellCds[k] = Math.max(0, p.spellCds[k] - dt);
  // regen
  p.mana = Math.min(p.d.maxMana, p.mana + p.d.manaRegen * dt);
  p.hp = Math.min(p.d.maxHp, p.hp + p.d.hpRegen * dt);
  // Crown of Cinders: a wreath of embers scorches nearby foes
  if (p.d.legends.igniteaura) {
    if (Math.random() < dt * 9) addParticles(p.x + mrf(-0.7, 0.7), p.y - 0.4, 1, '#ff8a3a', 1.6, 2.6);
    p.auraCd = (p.auraCd || 0) - dt;
    if (p.auraCd <= 0) {
      p.auraCd = 0.5;
      for (const e of STATE.enemies) {
        if (e.dead) continue;
        if (dist(p.x, p.y, e.x, e.y) < 2.4 + e.r) igniteEnemy(e, (p.d.dmgMin + p.d.dmgMax) * 0.5 * 0.3, 2);
      }
    }
  }

  // movement: screen-relative WASD mapped to world axes
  const ix = (Input.keys['d'] || Input.keys['arrowright'] ? 1 : 0) - (Input.keys['a'] || Input.keys['arrowleft'] ? 1 : 0);
  const iy = (Input.keys['s'] || Input.keys['arrowdown'] ? 1 : 0) - (Input.keys['w'] || Input.keys['arrowup'] ? 1 : 0);
  let wx = ix + 2 * iy, wy = 2 * iy - ix;
  const len = Math.hypot(wx, wy);
  if (len > 0.01) { wx /= len; wy /= len; }
  p.moveX = wx; p.moveY = wy;
  let spd = p.d.moveSpd;
  if (p.dodgeT > 0) spd *= 2.6;
  if (len > 0.01 || p.dodgeT > 0) {
    let mx = wx, my = wy;
    if (p.dodgeT > 0) { mx = p.dodgeVX; my = p.dodgeVY; }
    moveCircle(STATE.map, p, mx * spd * dt, my * spd * dt);
    p.walkT += dt * (p.dodgeT > 0 ? 2.5 : 1.4) * spd;
  }
  // aim
  const mw = screenToWorld(Input.mouse.x, Input.mouse.y);
  p.dir = Math.atan2(mw.y - p.y, mw.x - p.x);

  // dodge
  if ((consumePressed(' ') || consumePressed('shift')) && p.dodgeCd <= 0) {
    p.dodgeCd = p.d.legends.phantomstep ? 0.55 : 1.1;   // Sevenleague Stride cools twice as fast
    p.dodgeT = 0.22;
    const dlen = len > 0.01;
    p.dodgeVX = dlen ? wx : Math.cos(p.dir);
    p.dodgeVY = dlen ? wy : Math.sin(p.dir);
    addParticles(p.x, p.y, 8, '#cdc4b4', 2.5, 2.5);
    if (p.d.legends.phantomstep) {
      addParticles(p.x, p.y, 14, '#b8a0ff', 4, 3);
      for (const e of STATE.enemies) {
        if (e.dead) continue;
        if (dist(p.x, p.y, e.x, e.y) < 1.9 + e.r) { const { amt } = rollPlayerDamage(p, 0.8); hitEnemy(e, amt, false, true); }
      }
    }
  }
  // attacks (held buttons)
  if (Input.mouse.lmb && p.atkCd <= 0) playerAttack(p);
  if (Input.mouse.rmb) castEquippedSpell(p);
  if (consumePressed('q')) playerSpecial(p);
  if (consumePressed('t')) useTownPortal(p);
  if (consumePressed('1')) usePotion(p, 'hp');
  if (consumePressed('2')) usePotion(p, 'mp');

  // pickups
  for (const pk of STATE.pickups) {
    if (pk.got) continue;
    const d = dist(p.x, p.y, pk.x, pk.y);
    if (pk.kind !== 'item' && d < 1.6) { // magnet
      const a = Math.atan2(p.y - pk.y, p.x - pk.x);
      pk.x += Math.cos(a) * 7 * dt; pk.y += Math.sin(a) * 7 * dt;
    }
    if (d < 0.55) collectPickup(pk);
  }
}

function collectPickup(pk) {
  const p = STATE.player;
  if (pk.got) return;
  if (pk.kind === 'item') {
    if (p.inventory.length >= 25) { if (!pk.warned) { uiToast('Inventory full'); pk.warned = true; } return; }
    p.inventory.push(pk.item);
    addFloater(pk.x, pk.y, pk.item.name, RARITIES[pk.item.rarity].color);
    uiRefreshPanels();
  } else if (pk.kind === 'gold') {
    p.gold += pk.amt;
    STATE.run.goldFound += pk.amt;
    addFloater(pk.x, pk.y, '+' + pk.amt + 'g', '#ffd24a');
  } else if (pk.kind === 'ember') {
    STATE.meta.embers += pk.amt;
    STATE.run.embersFound += pk.amt;
    saveMeta();
    addFloater(pk.x, pk.y, '+' + pk.amt + ' ember' + (pk.amt > 1 ? 's' : ''), '#ff9c4a', true);
  } else if (pk.kind === 'potion_hp') {
    if (p.potions.hp >= p.d.potionCap) return;
    p.potions.hp++;
    addFloater(pk.x, pk.y, '+health potion', '#ff8a7a');
  } else if (pk.kind === 'potion_mp') {
    if (p.potions.mp >= p.d.potionCap) return;
    p.potions.mp++;
    addFloater(pk.x, pk.y, '+mana potion', '#7fb4ff');
  } else if (pk.kind === 'shard') {
    addParticles(pk.x, pk.y, 6, '#c9a0ff', 2.5, 2.5);
    addFloater(pk.x, pk.y, '+dark shard', '#c9a0ff');
    const q = STATE.quest;
    if (q && q.kind === 'collect' && !q.done) { q.n++; if (q.n >= q.target) questComplete(); }
  }
  pk.got = true;
}

function updateEnemies(dt) {
  const p = STATE.player;
  const map = STATE.map;
  for (const e of STATE.enemies) {
    if (e.dead) continue;
    e.t += dt;
    e.hurtT = Math.max(0, e.hurtT - dt);
    e.atkCd = Math.max(0, e.atkCd - dt);
    if (e.slowT) e.slowT = Math.max(0, e.slowT - dt);
    // burning DoT from fire legendaries
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.hp -= (e.burnDps || 0) * dt;
      if (Math.random() < dt * 7) addParticles(e.x + mrf(-0.4, 0.4), e.y - 0.2, 1, '#ff7a2a', 1.5, 2.2);
      if (e.hp <= 0 && !e.dead) { killEnemy(e); continue; }
    }
    const slowK = e.slowT > 0 ? 0.45 : 1;
    // elite auras
    if (e.eliteMod === 'regenerating' && e.hp < e.maxHp) {
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.03 * dt);
      if (Math.random() < dt * 3) addParticles(e.x, e.y, 1, '#7ddc8a', 1.5, 2);
    }
    if (e.eliteMod === 'burning' && !p.dead) {
      e.auraT = (e.auraT || 0) - dt;
      if (Math.random() < dt * 6) addParticles(e.x + mrf(-0.6, 0.6), e.y + mrf(-0.6, 0.6), 1, '#ff9c4a', 1.5, 2);
      if (dist(e.x, e.y, p.x, p.y) < 2.1 && e.auraT <= 0) {
        e.auraT = 0.6;
        damagePlayer(e.dmg * 0.35, e.x, e.y, false);
        addParticles(p.x, p.y, 5, '#ff9c4a', 2.5, 2);
      }
    }
    const dp = dist(e.x, e.y, p.x, p.y);
    if (!e.aggro) {
      if (dp < e.def.aggroR && losClear(map, e.x, e.y, p.x, p.y)) e.aggro = true;
      else {
        // idle wander
        e.wanderT -= dt;
        if (e.wanderT <= 0) { e.wanderT = mrf(1.5, 4); e.dir = mrf(0, Math.PI * 2); e.wanderMove = Math.random() < 0.4; }
        if (e.wanderMove) moveCircle(map, e, Math.cos(e.dir) * e.spd * slowK * 0.25 * dt, Math.sin(e.dir) * e.spd * slowK * 0.25 * dt, e.def.phase);
        continue;
      }
    }
    if (p.dead) { e.aggro = false; continue; }
    const toP = Math.atan2(p.y - e.y, p.x - e.x);
    e.dir = toP;
    const rng = e.def.ranged;
    if (rng && dp < rng.range && dp > 1.6 && losClear(map, e.x, e.y, p.x, p.y)) {
      if (e.atkCd <= 0) {
        e.atkCd = e.def.atkInt;
        spawnProjectile({
          x: e.x + Math.cos(toP) * 0.4, y: e.y + Math.sin(toP) * 0.4,
          vx: Math.cos(toP) * rng.projSpd, vy: Math.sin(toP) * rng.projSpd,
          dmg: e.dmg, friendly: false, kind: rng.kind, life: 2,
        });
      }
      // strafe slightly
      moveCircle(map, e, Math.cos(toP + Math.PI / 2) * e.spd * slowK * 0.2 * dt * Math.sin(e.t), Math.sin(toP + Math.PI / 2) * e.spd * slowK * 0.2 * dt * Math.sin(e.t), e.def.phase);
    } else if (dp > e.r + p.r + 0.25) {
      // chase + separation
      let sx = Math.cos(toP), sy = Math.sin(toP);
      for (const o of STATE.enemies) {
        if (o === e || o.dead) continue;
        const od = dist(e.x, e.y, o.x, o.y);
        if (od < e.r + o.r + 0.15 && od > 0.001) {
          sx += (e.x - o.x) / od * 0.6;
          sy += (e.y - o.y) / od * 0.6;
        }
      }
      const sl = Math.hypot(sx, sy) || 1;
      moveCircle(map, e, sx / sl * e.spd * slowK * dt, sy / sl * e.spd * slowK * dt, e.def.phase);
      // phase enemies shouldn't leave the map
      if (e.def.phase) {
        e.x = clamp(e.x, 1, map.w - 1);
        e.y = clamp(e.y, 1, map.h - 1);
      }
    } else if (e.atkCd <= 0) {
      e.atkCd = e.def.atkInt;
      e.lungeT = 0.2;
      const dealt = damagePlayer(e.dmg, e.x, e.y, true);
      if (dealt > 0 && e.eliteMod === 'lifesap') {
        e.hp = Math.min(e.maxHp, e.hp + dealt * 1.6);
        addFloater(e.x, e.y, 'sapped', '#c97cff');
        addParticles(e.x, e.y, 8, '#c97cff', 3, 2.5);
      }
      if (dealt > 0 && p.d.thorns) hitEnemy(e, e.dmg * p.d.thorns, false);
    }
    if (e.lungeT) e.lungeT = Math.max(0, e.lungeT - dt);
  }
}

function updateProjectiles(dt) {
  const p = STATE.player;
  const map = STATE.map;
  for (const pr of STATE.projectiles) {
    if (pr.dead) continue;
    pr.life -= dt;
    if (pr.life <= 0) { pr.dead = true; continue; }
    // Whisperwind: bolts curve toward the nearest foe
    if (pr.homing && pr.friendly) {
      let best = null, bd = 7;
      for (const e of STATE.enemies) {
        if (e.dead) continue;
        const dd = dist(pr.x, pr.y, e.x, e.y);
        if (dd < bd) { bd = dd; best = e; }
      }
      if (best) {
        const sp = Math.hypot(pr.vx, pr.vy);
        const ta = Math.atan2(best.y - pr.y, best.x - pr.x);
        let ca = Math.atan2(pr.vy, pr.vx) + clamp(angDiff(ta, Math.atan2(pr.vy, pr.vx)), -1, 1) * 7 * dt;
        pr.vx = Math.cos(ca) * sp; pr.vy = Math.sin(ca) * sp;
      }
    }
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    if (isSolidTile(map, Math.floor(pr.x), Math.floor(pr.y))) {
      pr.dead = true;
      addParticles(pr.x, pr.y, 5, pr.kind === 'fireball' ? '#ff9c4a' : '#cdc4b4', 2.5, 2);
      if (pr.splash) splashDamage(pr);
      continue;
    }
    if (pr.friendly) {
      for (const e of STATE.enemies) {
        if (e.dead || (pr.hitSet && pr.hitSet.has(e))) continue;
        if (dist(pr.x, pr.y, e.x, e.y) < pr.r + e.r) {
          hitEnemy(e, pr.dmg, pr.crit, pr.fromSkill);
          if (pr.splash) splashDamage(pr, e);
          if (pr.pierce > 0) { pr.pierce--; if (pr.hitSet) pr.hitSet.add(e); }
          else { pr.dead = true; break; }
        }
      }
      // crates
      if (!pr.dead) for (const prop of map.props) {
        if (prop.type === 'crate' && prop.hp && dist(pr.x, pr.y, prop.x, prop.y) < 0.5) {
          breakCrate(prop); pr.dead = true; break;
        }
      }
    } else {
      if (!p.dead && dist(pr.x, pr.y, p.x, p.y) < pr.r + p.r) {
        damagePlayer(pr.dmg, pr.x, pr.y, false);
        pr.dead = true;
      }
    }
  }
  STATE.projectiles = STATE.projectiles.filter(pr => !pr.dead);
}

function splashDamage(pr, except) {
  addParticles(pr.x, pr.y, 14, '#ff9c4a', 4, 3);
  for (const e of STATE.enemies) {
    if (e.dead || e === except) continue;
    if (dist(pr.x, pr.y, e.x, e.y) < pr.splash + e.r)
      hitEnemy(e, pr.dmg * 0.6, false, pr.fromSkill);
  }
}

function updateFx(dt) {
  for (const f of STATE.floaters) f.t += dt;
  STATE.floaters = STATE.floaters.filter(f => f.t < f.life);
  for (const l of STATE.fxLines) l.t += dt;
  STATE.fxLines = STATE.fxLines.filter(l => l.t < l.life);
  for (const pa of STATE.particles) {
    pa.t += dt;
    pa.x += pa.vx * dt; pa.y += pa.vy * dt;
    if (pa.grav) { pa.z += pa.vz * dt; pa.vz -= 280 * dt; if (pa.z < 0) { pa.z = 0; pa.vz *= -0.4; } }
  }
  STATE.particles = STATE.particles.filter(pa => pa.t < pa.life);
  STATE.pickups = STATE.pickups.filter(pk => !pk.got);
  STATE.shake = Math.max(0, STATE.shake - dt * 28);
}

// ---------- equipment ----------
const OFFHANDABLE = { dagger: true, sword: true };
function equipItem(p, item, toSlot) {
  const idx = p.inventory.indexOf(item);
  if (idx === -1) return;
  let slot = item.slot;
  if (item.kind === 'weapon' && toSlot === 'off') {
    if (!OFFHANDABLE[item.type]) { uiToast('Only daggers and swords fit the off-hand'); return; }
    slot = 'off';
  }
  const evicted = [];
  if (slot === 'main') {
    if (item.twoH && p.equipment.off) { evicted.push(p.equipment.off); p.equipment.off = null; }
    if (p.equipment.main) evicted.push(p.equipment.main);
    p.equipment.main = item;
  } else if (slot === 'off') {
    const mw = p.equipment.main;
    if (mw && mw.twoH) { uiToast('Cannot equip with a two-handed weapon'); return; }
    if (p.equipment.off) evicted.push(p.equipment.off);
    p.equipment.off = item;
  } else {
    if (p.equipment[slot]) evicted.push(p.equipment[slot]);
    p.equipment[slot] = item;
  }
  p.inventory.splice(idx, 1);
  for (const ev of evicted) p.inventory.push(ev);
  updateDerived(p);
  uiRefreshPanels();
}
function unequipItem(p, slot) {
  const it = p.equipment[slot];
  if (!it) return;
  if (p.inventory.length >= 25) { uiToast('Inventory full'); return; }
  p.equipment[slot] = null;
  p.inventory.push(it);
  updateDerived(p);
  uiRefreshPanels();
}
