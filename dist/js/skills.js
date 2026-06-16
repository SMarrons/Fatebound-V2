// ============================================================
// FATEBOUND — skills: run boons (shrines) + permanent meta perks
// ============================================================

// Boons: picked 1-of-3 at sanctuary shrines, last for the run, stack.
const BOONS = [
  { id: 'warcry',    name: 'War Cry',        desc: '+12% all damage',              mods: { dmgPct: 0.12 } },
  { id: 'stoneskin', name: 'Stoneskin',      desc: '+22 armor',                    mods: { armor: 22 } },
  { id: 'bloodlust', name: 'Bloodlust',      desc: '+3 life on kill',              mods: { lifeKill: 3 } },
  { id: 'siphon',    name: 'Soul Siphon',    desc: '+2 mana on kill',              mods: { manaKill: 2 } },
  { id: 'fleet',     name: 'Fleetfoot',      desc: '+9% movement speed',           mods: { moveSpd: 0.09 } },
  { id: 'precision', name: 'Precision',      desc: '+9% critical chance',          mods: { crit: 9 } },
  { id: 'brutality', name: 'Brutality',      desc: '+35% critical damage',         mods: { critDmg: 0.35 } },
  { id: 'bulwark',   name: 'Bulwark',        desc: '+18% maximum life',            mods: { hpPct: 0.18 } },
  { id: 'clarity',   name: 'Clarity',        desc: 'Skills cost 25% less mana',    mods: { spCost: 0.25 } },
  { id: 'quicken',   name: 'Quickening',     desc: 'Skill cooldowns 25% shorter',  mods: { spCd: 0.25 } },
  { id: 'thorns',    name: 'Thorned Hide',   desc: 'Reflect 40% of melee damage',  mods: { thorns: 0.4 } },
  { id: 'vamp',      name: 'Crimson Pact',   desc: '+2 life per hit',              mods: { lifeHit: 2 } },
  { id: 'treasure',  name: 'Treasure Sense', desc: '+35% gold find',               mods: { goldFind: 0.35 } },
  { id: 'embersight',name: 'Ember Sight',    desc: '+35% embers found',            mods: { emberFind: 0.35 } },
  { id: 'trance',    name: 'Battle Trance',  desc: '+14% attack speed',            mods: { atkSpd: 0.14 } },
  { id: 'arcpower',  name: 'Arcane Power',   desc: '+25% skill damage',            mods: { spDmg: 0.25 } },
  { id: 'regrowth',  name: 'Regrowth',       desc: '+2.5 life per second',         mods: { hpRegen: 2.5 } },
  { id: 'focus',     name: 'Deep Focus',     desc: '+1.5 mana per second',         mods: { manaRegen: 1.5 } },
];
const boonById = (id) => BOONS.find(b => b.id === id);

function rollBoonChoices(player, n) {
  const counts = {};
  for (const id of player.boons) counts[id] = (counts[id] || 0) + 1;
  const pool = BOONS.filter(b => (counts[b.id] || 0) < 2); // max 2 stacks
  const out = [];
  const cp = pool.slice();
  for (let i = 0; i < (n || 3) && cp.length; i++) {
    out.push(cp.splice(Math.floor(Math.random() * cp.length), 1)[0].id);
  }
  return out;
}

// Meta perks: permanent, bought with Fate Embers at the town altar.
const META_PERKS = [
  { id: 'vigor',     name: 'Vigor',          tiers: [20, 45, 90],  each: '+12 maximum life',        mods: (lv) => ({ hp: 12 * lv }) },
  { id: 'might',     name: 'Might',          tiers: [25, 55, 110], each: '+6% all damage',          mods: (lv) => ({ dmgPct: 0.06 * lv }) },
  { id: 'alacrity',  name: 'Alacrity',       tiers: [30, 70],      each: '+4% move & attack speed', mods: (lv) => ({ moveSpd: 0.04 * lv, atkSpd: 0.04 * lv }) },
  { id: 'arcana',    name: 'Arcana',         tiers: [25, 60],      each: '+15 mana, +0.5 mana/sec', mods: (lv) => ({ mana: 15 * lv, manaRegen: 0.5 * lv }) },
  { id: 'fortune',   name: 'Fortune',        tiers: [20, 50],      each: '+20% gold find',          mods: (lv) => ({ goldFind: 0.2 * lv }) },
  { id: 'emberpact', name: 'Ember Pact',     tiers: [40, 90],      each: '+25% embers found',       mods: (lv) => ({ emberFind: 0.25 * lv }) },
  { id: 'pockets',   name: 'Deep Pockets',   tiers: [35, 80],      each: '+1 potion capacity',      mods: (lv) => ({ potionCap: lv }) },
  { id: 'ironskin',  name: 'Iron Skin',      tiers: [30, 65],      each: '+10 armor',               mods: (lv) => ({ armor: 10 * lv }) },
  { id: 'secondwind',name: 'Second Wind',    tiers: [120],         each: 'Cheat death once per run (revive at 40% life)', mods: (lv) => ({ secondWind: lv }) },
  { id: 'outfitter', name: 'Outfitter',      tiers: [60],          each: 'Begin runs with an enchanted sword and +30 gold', mods: (lv) => ({}) },
];
function perkLv(meta, id) { return (meta && meta.perks && meta.perks[id]) || 0; }
function perkCost(perk, lv) { return lv < perk.tiers.length ? perk.tiers[lv] : null; }

// Aggregate all mods from equipment + boons + meta perks into one object.
function collectMods(player, meta) {
  const m = {
    dmgPct: 0, dmgFlat: 0, atkSpd: 0, crit: 0, critDmg: 0, armor: 0, hp: 0, hpPct: 0,
    mana: 0, manaRegen: 0, moveSpd: 0, lifeHit: 0, str: 0, dex: 0, mag: 0, vit: 0,
    goldFind: 0, emberFind: 0, spCost: 0, spCd: 0, lifeKill: 0, manaKill: 0,
    thorns: 0, spDmg: 0, hpRegen: 0, block: 0, potionCap: 0, secondWind: 0,
  };
  const add = (k, v) => { if (m[k] !== undefined) m[k] += v; };
  for (const slot of ['main', 'off', 'helm', 'chest', 'boots', 'book', 'pet']) {
    const it = player.equipment[slot];
    if (!it) continue;
    if (it.armor) add('armor', it.armor);
    if (it.block) add('block', it.block);
    if (it.mana) add('mana', it.mana);
    if (it.manaRegen) add('manaRegen', it.manaRegen);
    if (it.spDmg) add('spDmg', it.spDmg);
    if (it.baseCrit) add('crit', it.baseCrit);
    for (const a of it.affixes) add(a.k, a.v);
  }
  for (const id of player.boons) {
    const b = boonById(id);
    if (b) for (const k in b.mods) add(k, b.mods[k]);
  }
  if (meta) for (const perk of META_PERKS) {
    const lv = perkLv(meta, perk.id);
    if (lv > 0) { const mods = perk.mods(lv); for (const k in mods) add(k, mods[k]); }
  }
  return m;
}

// Weapon skills (right-click), keyed by weapon type.
const WEAPON_SKILLS = {
  sword:    { name: 'Whirlwind',     cost: 14, cd: 4,   desc: 'Spin, striking all nearby foes' },
  dagger:   { name: 'Shadow Dash',   cost: 12, cd: 3.5, desc: 'Dash through enemies, cutting them' },
  spear:    { name: 'Impale',        cost: 14, cd: 4,   desc: 'A piercing thrust in a long line' },
  bow:      { name: 'Volley',        cost: 15, cd: 4.5, desc: 'Loose a fan of five arrows' },
  crossbow: { name: 'Skewer Bolt',   cost: 16, cd: 5,   desc: 'A heavy bolt that pierces everything' },
  wand:     { name: 'Arcane Burst',  cost: 13, cd: 3.5, desc: 'Fire three rapid arcane bolts' },
  staff:    { name: 'Flame Nova',    cost: 20, cd: 6,   desc: 'A ring of fire erupts around you' },
};

// ---------- spells ----------
// Learned from scrolls (loot/vendor). Scale with Magic. Lost on death, like boons.
const SPELLS = {
  firebolt:  { name: 'Firebolt',      cost: 8,  cd: 1.1, base: 9,  glyph: 'flame',
               desc: 'Hurl a searing bolt that bursts on impact' },
  frostnova: { name: 'Frost Nova',    cost: 16, cd: 7,   base: 13, glyph: 'frost', radius: 3.2,
               desc: 'Ice erupts around you, chilling all nearby foes' },
  arc:       { name: 'Arc Lightning', cost: 13, cd: 4.5, base: 15, glyph: 'bolt', targets: 3, range: 6.5,
               desc: 'Lightning leaps between up to three nearby foes' },
  ward:      { name: 'Stone Ward',    cost: 15, cd: 14,  glyph: 'shield',
               desc: 'A ward of stone absorbs damage equal to 30% of your life, for 7s' },
  mend:      { name: 'Mend',          cost: 18, cd: 12,  glyph: 'leaf',
               desc: 'Knit flesh and bone, restoring 25% of your life' },
};
const LEARNABLE_SPELLS = ['frostnova', 'arc', 'ward', 'mend'];
const BOOK_SPELLS = ['firebolt', 'frostnova', 'arc', 'ward', 'mend'];
const SPELL_COLORS = {
  firebolt: '#ff9c4a', frostnova: '#9ed8ff', arc: '#cfeaff', ward: '#cdbb91', mend: '#8fd98a',
};
function spellDamage(p, sp) {
  return sp.base * mrf(0.85, 1.15) * (1 + p.d.mag * 0.03) * (1 + (p.level - 1) * 0.06);
}
