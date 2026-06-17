// ============================================================
// FATEBOUND — dungeon generation: themes, town, sanctuary
// ============================================================

const THEMES = {
  town: {
    name: 'Emberlight Camp',
    floorA: '#4a4035', floorB: '#42382e', wallTop: '#584e41', wallSide: '#3a322a', wallSide2: '#2e2821',
    ambient: 'rgba(10,7,14,0.62)', lightWarmth: 'rgba(255,166,86,0.13)',
  },
  halls: {
    name: 'The Stone Halls',
    floorA: '#46413a', floorB: '#3d3830', wallTop: '#5a5244', wallSide: '#36302a', wallSide2: '#2a2520',
    ambient: 'rgba(7,5,12,0.84)', lightWarmth: 'rgba(255,160,80,0.15)',
  },
  caves: {
    name: 'The Howling Caverns',
    floorA: '#3e3223', floorB: '#362b1e', wallTop: '#4c3c29', wallSide: '#2e2417', wallSide2: '#241c12',
    ambient: 'rgba(6,5,11,0.87)', lightWarmth: 'rgba(255,150,70,0.16)',
  },
  crypt: {
    name: 'The Sunken Crypt',
    floorA: '#30373d', floorB: '#293035', wallTop: '#414c54', wallSide: '#232b31', wallSide2: '#1b2227',
    ambient: 'rgba(4,6,15,0.89)', lightWarmth: 'rgba(140,190,255,0.10)',
  },
  timber: {
    name: 'The Timber Halls',
    floorA: '#6b4d28', floorB: '#5c4122', wallTop: '#7a5630', wallSide: '#4a3318', wallSide2: '#3a2814',
    ambient: 'rgba(12,7,3,0.82)', lightWarmth: 'rgba(255,176,90,0.18)',
  },
  sanctuary: {
    name: 'Sanctuary',
    floorA: '#4c4030', floorB: '#443a2b', wallTop: '#5e5140', wallSide: '#3a3226', wallSide2: '#2e281e',
    ambient: 'rgba(9,7,13,0.68)', lightWarmth: 'rgba(255,182,104,0.14)',
  },
};

function isSanctuaryFloor(f) { return f > 0 && f % 5 === 0; }
function themeKeyForFloor(f) {
  if (f === 0) return 'town';
  if (isSanctuaryFloor(f)) return 'sanctuary';
  const band = Math.floor((f - 1) / 5); // 0:1-4, 1:6-9, 2:11-14, ...
  return ['halls', 'timber', 'caves', 'crypt'][band % 4];
}
function floorTitle(f) {
  const t = THEMES[themeKeyForFloor(f)];
  if (f === 0) return t.name;
  return `${t.name} — Depth ${f}`;
}

// ---------- shared helpers ----------
function blankMap(w, h, floor) {
  return {
    w, h, floor,
    themeKey: themeKeyForFloor(floor),
    tiles: new Uint8Array(w * h),
    props: [],          // {type:'torch'|'campfire'|'crate'|'pillar'|'rubble', x, y, hp?}
    interactables: [],  // {type:'vendor'|'shrine'|'altar'|'stairs'|'gate'|'campfire', x, y, ...}
    spawn: { x: 2, y: 2 },
    stairs: null,
  };
}
function carve(map, x, y) {
  if (x > 0 && y > 0 && x < map.w - 1 && y < map.h - 1) map.tiles[y * map.w + x] = 1;
}
function carveRect(map, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) carve(map, x, y);
}
function carveDisc(map, cx, cy, r) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++)
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) carve(map, x, y);
}
function buildWalls(map) {
  const { w, h, tiles } = map;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (tiles[y * w + x] !== 0) continue;
    let adj = false;
    for (let dy = -1; dy <= 1 && !adj; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && (tiles[ny * w + nx] === 1 || tiles[ny * w + nx] === 3)) { adj = true; break; }
    }
    if (adj) tiles[y * w + x] = 2;
  }
}
function floorCells(map) {
  const out = [];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++)
    if (map.tiles[y * map.w + x] === 1) out.push({ x, y });
  return out;
}
// BFS distances from a point (4-dir over walkable)
function bfsDist(map, sx, sy) {
  const d = new Int32Array(map.w * map.h).fill(-1);
  const q = [[sx, sy]];
  d[sy * map.w + sx] = 0;
  while (q.length) {
    const [x, y] = q.shift();
    const base = d[y * map.w + x];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const t = map.tiles[ny * map.w + nx];
      if ((t === 1 || t === 3) && d[ny * map.w + nx] === -1) {
        d[ny * map.w + nx] = base + 1;
        q.push([nx, ny]);
      }
    }
  }
  return d;
}
function keepLargestRegion(map) {
  const seen = new Uint8Array(map.w * map.h);
  let best = null;
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const i = y * map.w + x;
    if (map.tiles[i] !== 1 || seen[i]) continue;
    const region = [];
    const q = [i]; seen[i] = 1;
    while (q.length) {
      const c = q.pop(); region.push(c);
      const cx = c % map.w, cy = (c / map.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
        const ni = ny * map.w + nx;
        if (map.tiles[ni] === 1 && !seen[ni]) { seen[ni] = 1; q.push(ni); }
      }
    }
    if (!best || region.length > best.length) best = region;
  }
  if (best) {
    const keep = new Set(best);
    for (let i = 0; i < map.tiles.length; i++)
      if (map.tiles[i] === 1 && !keep.has(i)) map.tiles[i] = 0;
  }
}

function placeTorches(map, rng, density) {
  const cells = floorCells(map);
  const n = Math.floor(cells.length * (density || 0.018));
  let placed = 0, guard = 0;
  while (placed < n && guard++ < 600) {
    const c = pick(rng, cells);
    // next to a wall, not too close to another torch
    let nearWall = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      if (tileAt(map, c.x + dx, c.y + dy) === 2) nearWall = true;
    if (!nearWall) continue;
    if (map.props.some(p => p.type === 'torch' && dist(p.x, p.y, c.x + 0.5, c.y + 0.5) < 5)) continue;
    map.props.push({ type: 'torch', x: c.x + 0.5, y: c.y + 0.5 });
    placed++;
  }
}
function placeCrates(map, rng, count) {
  const cells = floorCells(map).filter(c => dist(c.x, c.y, map.spawn.x, map.spawn.y) > 6);
  for (let i = 0; i < count && cells.length; i++) {
    const c = cells.splice(Math.floor(rng() * cells.length), 1)[0];
    if (map.interactables.some(it => dist(it.x, it.y, c.x + .5, c.y + .5) < 2)) continue;
    map.props.push({ type: rng() < 0.4 ? 'barrel' : 'crate', x: c.x + 0.5, y: c.y + 0.5, hp: 1, solid: true });
  }
}

// flat grunge decals baked into the floor (bones, rubble, moss, puddles, mushrooms)
function genDecals(map, rng) {
  const cells = floorCells(map);
  map.decals = [];
  const densities = {
    halls:     { bones: 0.010, rubble: 0.014, puddle: 0.008, moss: 0.006 },
    timber:    { rubble: 0.012, moss: 0.010, bones: 0.006 },
    caves:     { bones: 0.006, rubble: 0.016, puddle: 0.005, moss: 0.030, mushroom: 0.012 },
    crypt:     { bones: 0.016, rubble: 0.012, puddle: 0.012, moss: 0.012 },
    town:      { rubble: 0.005, moss: 0.008 },
    sanctuary: { rubble: 0.005, moss: 0.010 },
  };
  const d = densities[map.themeKey] || densities.halls;
  for (const type in d) {
    const n = Math.max(1, Math.round(cells.length * d[type]));
    for (let i = 0; i < n; i++) {
      const c = pick(rng, cells);
      map.decals.push({ type, x: c.x + rf(rng, 0.2, 0.8), y: c.y + rf(rng, 0.2, 0.8), s: rf(rng, 0.7, 1.3), seed: ri(rng, 0, 1e6) });
    }
  }
}

// ---------- generators ----------
function genRoomsAndCorridors(map, rng, opts) {
  opts = opts || {};
  const rooms = [];
  const tries = 70, maxRooms = opts.maxRooms || 11;
  for (let i = 0; i < tries && rooms.length < maxRooms; i++) {
    const rw = ri(rng, 4, opts.bigRooms ? 10 : 8), rh = ri(rng, 4, opts.bigRooms ? 10 : 8);
    const rx = ri(rng, 2, map.w - rw - 3), ry = ri(rng, 2, map.h - rh - 3);
    if (rooms.some(o => rx < o.x + o.w + 1 && rx + rw + 1 > o.x && ry < o.y + o.h + 1 && ry + rh + 1 > o.y)) continue;
    rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: rx + (rw >> 1), cy: ry + (rh >> 1) });
  }
  for (const r of rooms) carveRect(map, r.x, r.y, r.w, r.h);
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    // L corridor, 2 wide
    const horizFirst = rng() < 0.5;
    const carveH = (x0, x1, y) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { carve(map, x, y); carve(map, x, y + 1); } };
    const carveV = (y0, y1, x) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) { carve(map, x, y); carve(map, x + 1, y); } };
    if (horizFirst) { carveH(a.cx, b.cx, a.cy); carveV(a.cy, b.cy, b.cx); }
    else { carveV(a.cy, b.cy, a.cx); carveH(a.cx, b.cx, b.cy); }
  }
  // pillars in big rooms (crypt flavor)
  if (opts.pillars) {
    for (const r of rooms) {
      if (r.w < 7 || r.h < 7) continue;
      for (let py = r.y + 2; py < r.y + r.h - 2; py += 3)
        for (let px = r.x + 2; px < r.x + r.w - 2; px += 3)
          if (rng() < 0.7) map.tiles[py * map.w + px] = 2;
    }
  }
  return rooms;
}

function genCaves(map, rng) {
  const { w, h } = map;
  let grid = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++)
    grid[y * w + x] = rng() < 0.46 ? 0 : 1;
  for (let it = 0; it < 4; it++) {
    const next = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        n += grid[(y + dy) * w + (x + dx)];
      }
      next[y * w + x] = (grid[y * w + x] ? n >= 3 : n >= 5) ? 1 : 0;
    }
    grid = next;
  }
  for (let i = 0; i < grid.length; i++) if (grid[i]) map.tiles[i] = 1;
  keepLargestRegion(map);
}

// ---------- floor assembly ----------
function generateFloor(floor, runSeed) {
  const seed = (runSeed ^ Math.imul(floor + 1, 2654435761)) >>> 0;
  const rng = mulberry32(seed);

  if (floor === 0) return generateTown();
  if (isSanctuaryFloor(floor)) return generateSanctuary(floor, rng);

  const themeKey = themeKeyForFloor(floor);
  const size = 46 + Math.min(14, floor * 2);
  const map = blankMap(size, size, floor);

  if (themeKey === 'caves') {
    genCaves(map, rng);
  } else {
    genRoomsAndCorridors(map, rng, {
      pillars: themeKey === 'crypt',
      bigRooms: themeKey === 'crypt',
      maxRooms: themeKey === 'crypt' ? 9 : 11,
    });
  }

  let cells = floorCells(map);
  if (cells.length < 80) { // degenerate map fallback
    carveRect(map, 4, 4, map.w - 8, map.h - 8);
    cells = floorCells(map);
  }

  // spawn: random floor cell; stairs: farthest walkable cell from spawn
  const spawnCell = pick(rng, cells);
  map.spawn = { x: spawnCell.x + 0.5, y: spawnCell.y + 0.5 };
  const dists = bfsDist(map, spawnCell.x, spawnCell.y);
  let far = spawnCell, fd = 0;
  for (const c of cells) {
    const d = dists[c.y * map.w + c.x];
    if (d > fd) { fd = d; far = c; }
  }
  map.tiles[far.y * map.w + far.x] = 3;
  map.stairs = { x: far.x + 0.5, y: far.y + 0.5 };
  map.interactables.push({ type: 'stairs', x: far.x + 0.5, y: far.y + 0.5 });

  // guardian chest: a far cell, away from both spawn and stairs
  const chestCells = cells.filter(c =>
    (c.x !== far.x || c.y !== far.y) &&
    dist(c.x, c.y, spawnCell.x, spawnCell.y) > 9 &&
    dist(c.x, c.y, far.x, far.y) > 3);
  if (chestCells.length) {
    const cc = pick(rng, chestCells);
    const chest = { type: 'chest', x: cc.x + 0.5, y: cc.y + 0.5, opened: false, locked: true };
    map.chest = chest;
    map.props.push(chest);
    map.interactables.push(chest);
  }

  buildWalls(map);
  placeTorches(map, rng, themeKey === 'crypt' ? 0.014 : 0.02);
  placeCrates(map, rng, ri(rng, 6, 10));
  genDecals(map, rng);
  map.seed = seed;
  return map;
}

function generateSanctuary(floor, rng) {
  const map = blankMap(26, 26, floor);
  const cx = 13, cy = 13;
  carveDisc(map, cx, cy, 7.2);
  // alcoves
  carveRect(map, cx - 1, cy - 11, 3, 5);   // north passage → stairs
  carveDisc(map, cx - 9, cy + 3, 3);       // vendor alcove
  carveDisc(map, cx + 9, cy + 3, 3);       // shrine alcove
  carveRect(map, cx - 9, cy + 2, 9, 2);
  carveRect(map, cx + 1, cy + 2, 9, 2);

  map.spawn = { x: cx + 0.5, y: cy + 4.5 };
  // stairs at end of north passage
  map.tiles[(cy - 10) * map.w + cx] = 3;
  map.stairs = { x: cx + 0.5, y: cy - 9.5 };
  map.interactables.push({ type: 'stairs', x: cx + 0.5, y: cy - 9.5 });

  map.props.push({ type: 'campfire', x: cx + 0.5, y: cy + 0.5 });
  map.interactables.push({ type: 'campfire', x: cx + 0.5, y: cy + 0.5 });

  map.props.push({ type: 'vendorNpc', x: cx - 8.5, y: cy + 3.5 });
  map.interactables.push({ type: 'vendor', x: cx - 8.5, y: cy + 3.5, stock: rollVendorStock(floor) });

  map.props.push({ type: 'shrine', x: cx + 9.5, y: cy + 3.5 });
  map.interactables.push({ type: 'shrine', x: cx + 9.5, y: cy + 3.5, used: false, choices: null });

  buildWalls(map);
  // ring of torches
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    map.props.push({ type: 'torch', x: cx + 0.5 + Math.cos(a) * 5.5, y: cy + 0.5 + Math.sin(a) * 5.5 });
  }
  map.props.push({ type: 'barrel', x: cx - 7.5, y: cy + 4.8, hp: 0, solid: true });
  genDecals(map, rng);
  map.seed = floor;
  return map;
}

function generateTown() {
  const map = blankMap(26, 26, 0);
  const cx = 13, cy = 13;
  carveDisc(map, cx, cy, 8);
  carveRect(map, cx - 1, cy - 12, 3, 6); // north passage → dungeon gate

  map.spawn = { x: cx + 0.5, y: cy + 3.5 };

  map.props.push({ type: 'campfire', x: cx + 0.5, y: cy + 0.5 });
  map.interactables.push({ type: 'campfire', x: cx + 0.5, y: cy + 0.5 });

  map.props.push({ type: 'vendorNpc', x: cx - 5.5, y: cy - 2.5 });
  map.interactables.push({ type: 'vendor', x: cx - 5.5, y: cy - 2.5, stock: rollVendorStock(1) });

  map.props.push({ type: 'altar', x: cx + 5.5, y: cy - 2.5 });
  map.interactables.push({ type: 'altar', x: cx + 5.5, y: cy - 2.5 });

  map.props.push({ type: 'gate', x: cx + 0.5, y: cy - 10.5 });
  map.interactables.push({ type: 'gate', x: cx + 0.5, y: cy - 10.5 });

  // tents (decorative)
  map.props.push({ type: 'tent', x: cx - 4.5, y: cy + 4.5 });
  map.props.push({ type: 'tent', x: cx + 4.5, y: cy + 4.5 });

  buildWalls(map);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    map.props.push({ type: 'torch', x: cx + 0.5 + Math.cos(a) * 6.5, y: cy + 0.5 + Math.sin(a) * 6.5 });
  }
  map.props.push({ type: 'barrel', x: cx - 6.8, y: cy - 1.2, hp: 0, solid: true });
  map.props.push({ type: 'barrel', x: cx - 7.4, y: cy - 0.4, hp: 0, solid: true });
  genDecals(map, mulberry32(7));
  map.seed = 0;
  return map;
}
