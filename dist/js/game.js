// ============================================================
// FATEBOUND — game: loop, floors, saves, interactions
// ============================================================

const META_KEY = 'fatebound_meta_v1';
const RUN_KEY = 'fatebound_run_v1';

// ---------- persistence ----------
function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY));
    if (m && typeof m.embers === 'number') return Object.assign({ embers: 0, perks: {}, bestFloor: 0, kills: 0, runs: 0 }, m);
  } catch (e) { /* ignore */ }
  return { embers: 0, perks: {}, bestFloor: 0, kills: 0, runs: 0 };
}
function saveMeta() {
  try { localStorage.setItem(META_KEY, JSON.stringify(STATE.meta)); } catch (e) { /* ignore */ }
}

function serializePlayer(p) {
  return {
    level: p.level, xp: p.xp, statPoints: p.statPoints,
    str: p.str, dex: p.dex, mag: p.mag, vit: p.vit,
    hp: p.hp, mana: p.mana, gold: p.gold,
    potions: p.potions, inventory: p.inventory,
    equipment: p.equipment, boons: p.boons,
    usedSecondWind: p.usedSecondWind,
  };
}
function restorePlayer(data) {
  const p = newPlayer(STATE.meta);
  Object.assign(p, data);
  // migrate older saves
  if (!p.equipment.book) p.equipment.book = null;
  if (p.equipment.pet === undefined) p.equipment.pet = null;
  if (!p.equipment.book) p.equipment.book = makeSpellbook('firebolt', 1, 'common');
  delete p.spells;
  p.inventory = (p.inventory || []).filter(i => i.kind !== 'scroll');
  updateDerived(p);
  p.hp = Math.min(p.hp, p.d.maxHp);
  p.mana = Math.min(p.mana, p.d.maxMana);
  p.dead = false;
  return p;
}
function saveRun() {
  if (!STATE.run) return;
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify({
      seed: STATE.run.seed, floor: STATE.floor,
      maxFloor: STATE.run.maxFloor, kills: STATE.run.kills,
      goldFound: STATE.run.goldFound, embersFound: STATE.run.embersFound,
      portal: STATE.runPortal || null,
      player: serializePlayer(STATE.player),
    }));
  } catch (e) { /* ignore */ }
}
function clearRunSave() {
  try { localStorage.removeItem(RUN_KEY); } catch (e) { /* ignore */ }
}

// ---------- run / floor management ----------
function startNewRun() {
  clearRunSave();
  STATE.meta.runs++;
  saveMeta();
  STATE.run = {
    seed: (Math.random() * 0xffffffff) >>> 0,
    maxFloor: 0, kills: 0, goldFound: 0, embersFound: 0,
  };
  STATE.runPortal = null;
  STATE.pet = null;
  STATE.player = newPlayer(STATE.meta);
  enterFloor(0);
  uiSetScreen('game');
  uiToast('WASD move · LMB attack · RMB cast · Q skill · T portal · E interact');
}

function continueRun() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(RUN_KEY)); } catch (e) { /* ignore */ }
  if (!data) { startNewRun(); return; }
  STATE.run = {
    seed: data.seed, maxFloor: data.maxFloor || data.floor,
    kills: data.kills || 0, goldFound: data.goldFound || 0, embersFound: data.embersFound || 0,
  };
  STATE.player = restorePlayer(data.player);
  STATE.runPortal = data.portal || null;
  enterFloor(data.floor);
  uiSetScreen('game');
  uiToast('You wake by the sanctuary fire.');
}

function enterFloor(floor) {
  STATE.floor = floor;
  STATE.map = generateFloor(floor, STATE.run.seed);
  STATE.enemies = (floor === 0 || isSanctuaryFloor(floor)) ? [] : spawnEnemies(STATE.map, floor);
  STATE.projectiles = [];
  STATE.pickups = [];
  STATE.particles = [];
  STATE.floaters = [];
  const p = STATE.player;
  p.x = STATE.map.spawn.x;
  p.y = STATE.map.spawn.y;
  if (STATE.pet) { STATE.pet.x = p.x + 0.8; STATE.pet.y = p.y + 0.4; }
  // open the return portal in safe zones
  if (STATE.runPortal && (floor === 0 || isSanctuaryFloor(floor))) {
    const px = STATE.map.spawn.x + 2.2, py = STATE.map.spawn.y - 1.2;
    STATE.map.props.push({ type: 'portal', x: px, y: py });
    STATE.map.interactables.push({ type: 'portal', x: px, y: py });
  }
  STATE.cam.x = p.x; STATE.cam.y = p.y;
  if (floor > STATE.run.maxFloor) {
    STATE.run.maxFloor = floor;
    if (floor > 0) {
      const embers = Math.round((2 + floor) * (1 + p.d.emberFind));
      STATE.meta.embers += embers;
      STATE.run.embersFound += embers;
      if (floor > STATE.meta.bestFloor) STATE.meta.bestFloor = floor;
      saveMeta();
      setTimeout(() => addFloater(p.x, p.y, `+${embers} embers — depth ${floor}`, '#ff9c4a', true), 400);
    }
  }
  if (isSanctuaryFloor(floor)) {
    saveRun();
    setTimeout(() => uiToast('Sanctuary reached — your run is saved here.'), 600);
  }
  if (floor === 0) saveRun();
}

function onPlayerDeath() {
  // embers already banked live; drop the run save
  clearRunSave();
  saveMeta();
  STATE.shake = 12;
  setTimeout(() => showDeathScreen(), 1100);
}

// ---------- interactions ----------
function findNearInteract() {
  const p = STATE.player;
  if (!STATE.map) return null;
  let best = null, bd = 1.7;
  for (const it of STATE.map.interactables) {
    const d = dist(p.x, p.y, it.x, it.y);
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}

function doInteract(it) {
  const p = STATE.player;
  switch (it.type) {
    case 'vendor': openPanel('vendor', it); break;
    case 'altar': openPanel('altar'); break;
    case 'shrine':
      if (it.used) { uiToast('The shrine is spent.'); return; }
      openPanel('shrine', it);
      break;
    case 'stairs': {
      enterFloor(STATE.floor + 1);
      break;
    }
    case 'gate': enterFloor(1); break;
    case 'portal': {
      const rp = STATE.runPortal;
      if (!rp) break;
      STATE.runPortal = null;
      enterFloor(rp.floor);
      p.x = rp.x; p.y = rp.y;
      STATE.cam.x = p.x; STATE.cam.y = p.y;
      addParticles(p.x, p.y, 26, '#7fb4ff', 4.5, 3.5);
      uiToast('The portal snaps shut behind you.');
      saveRun();
      break;
    }
    case 'campfire': {
      if (STATE.floor === 0 || isSanctuaryFloor(STATE.floor)) {
        p.hp = p.d.maxHp; p.mana = p.d.maxMana;
        addParticles(p.x, p.y, 18, '#ff9c4a', 3.5, 3);
        uiToast('You rest. Health and mana restored.');
        saveRun();
      }
      break;
    }
  }
}

// ---------- main loop ----------
let CANVAS, CTX, lastT = 0;

function resize() {
  VIEW.w = innerWidth;
  VIEW.h = innerHeight;
  VIEW.dpr = Math.min(2, window.devicePixelRatio || 1);
  CANVAS.width = Math.round(VIEW.w * VIEW.dpr);
  CANVAS.height = Math.round(VIEW.h * VIEW.dpr);
  CANVAS.style.width = VIEW.w + 'px';
  CANVAS.style.height = VIEW.h + 'px';
}

let lastFrameAt = 0;
function tick(t) {
  requestAnimationFrame(tick);
  frame(t);
}
function frame(t) {
  lastFrameAt = performance.now();
  const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000 || 0.016));
  lastT = t;
  // hi-dpi base transform: all drawing code works in css px
  CTX.setTransform(VIEW.dpr || 1, 0, 0, VIEW.dpr || 1, 0, 0);

  if (STATE.screen === 'game' || STATE.screen === 'death') {
    if (STATE.screen === 'game' && !STATE.paused) {
      STATE.time += dt;
      updatePlayer(dt);
      updatePet(dt);
      updateEnemies(dt);
      updateProjectiles(dt);
      updateFx(dt);
      STATE.nearInteract = findNearInteract();
      // camera follow (guard against any non-finite drift)
      if (!Number.isFinite(STATE.cam.x) || !Number.isFinite(STATE.cam.y)) {
        STATE.cam.x = STATE.player.x; STATE.cam.y = STATE.player.y;
      }
      STATE.cam.x = lerp(STATE.cam.x, STATE.player.x, 1 - Math.pow(0.001, dt));
      STATE.cam.y = lerp(STATE.cam.y, STATE.player.y, 1 - Math.pow(0.001, dt));
      // interactions & panel hotkeys
      if (consumePressed('e') && STATE.nearInteract) doInteract(STATE.nearInteract);
      if (consumePressed('i')) openPanel('inventory');
      if (consumePressed('c')) openPanel('character');
      if (consumePressed('escape')) { /* nothing open */ }
    } else if (STATE.screen === 'game' && STATE.paused) {
      STATE.time += dt;
      updateFx(dt);
      if (consumePressed('escape') || consumePressed('i') && openPanelName === 'inventory' || consumePressed('c') && openPanelName === 'character') closePanel();
    } else {
      STATE.time += dt;
      updateFx(dt);
    }
    if (STATE.map) renderGame(CTX);
    updateHUD();
  } else {
    // menu backdrop
    CTX.fillStyle = '#0b0910';
    CTX.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  Input.pressed = {};
}

window.addEventListener('DOMContentLoaded', () => {
  CANVAS = document.getElementById('game');
  CTX = CANVAS.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  initInput(CANVAS);
  STATE.meta = loadMeta();
  uiInit();
  uiSetScreen('menu');
  requestAnimationFrame(tick);
  // watchdog: drive frames manually if rAF is throttled or suspended
  setInterval(() => {
    if (performance.now() - lastFrameAt > 80) frame(performance.now());
  }, 33);
});
