'use strict';
// ===================== STARWAKE — CORE ENGINE =====================
let S = null;
const rnd = Math.random;
const TAU = Math.PI * 2;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = a => a[Math.floor(rnd() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const hyp = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function wpick(w) { let t = 0, k; for (k in w) t += w[k]; let r = rnd() * t; for (k in w) { r -= w[k]; if (r <= 0) return k; } return k; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const r1 = v => Math.round(v * 10) / 10;
function gauss() { return (rnd() + rnd() + rnd() - 1.5) / 0.5; }

const E = id => id === -1 ? S.monster : S.empires[id];
const R = emp => emp.id === -1 ? emp.race : RACE[emp.raceId];
const has = (emp, t) => !!(emp.techs && emp.techs[t]);
const avail = (emp, t) => t == null || has(emp, t);
const P = id => S.planets[id];
const ST = id => S.stars[id];
const player = () => S.empires[0];
const alive = () => S.empires.filter(e => e.alive);
function nid() { return S.nextId++; }
function msg(empId, text, star, kind) { if (empId === 0) S.msgs.push({text, star: star == null ? null : star, kind: kind || 'info'}); }

// ---------------- Galaxy generation ----------------
function genName(used) {
  for (let i = 0; i < 500; i++) {
    let n = pick(SYL1) + pick(SYL2);
    if (rnd() < 0.1) n += ' ' + pick(['Prime', 'Major', 'Minor', 'Nova']);
    if (!used.has(n) && !/^(Orion|Vael)/.test(n)) { used.add(n); return n; }
  }
  return 'Star ' + used.size;
}
function newPlanet(star, type, size, minerals) {
  const p = {id: S.planets.length, star: star.id, type, size, minerals, special: null, owner: null, col: null};
  S.planets.push(p); star.planets.push(p.id); return p;
}
function randomPlanet(star, rich) {
  const type = wpick(STAR_TYPES[star.type].w);
  let size = +wpick({1:2, 2:3, 3:4, 4:2, 5:1});
  if (type === 'gasgiant') size = 5;
  if (type === 'asteroids') size = 1;
  const minerals = clamp(+wpick({0:1, 1:2, 2:4, 3:2, 4:1}) + (rich ? (rnd() < 0.5 ? 1 : 0) : 0), 0, 4);
  const p = newPlanet(star, type, size, minerals);
  if (rnd() < (rich ? 0.14 : 0.07) && !PT[type].outpostOnly) {
    p.special = wpick(PT[type].fert > 0 ? {gold:3, gems:2, artifacts:2, fertile:3} : {gold:3, gems:2, artifacts:2});
  }
  return p;
}
function genPoint(shape, w, h, ctx) {
  const cx = w / 2, cy = h / 2, rx = w / 2 - 1.4, ry = h / 2 - 1.4;
  if (shape === 'ring') { const a = rnd() * TAU, r = 0.58 + rnd() * 0.42; return [cx + Math.cos(a) * r * rx, cy + Math.sin(a) * r * ry]; }
  if (shape === 'spiral') {
    const arm = ri(0, ctx.arms - 1), t = Math.pow(rnd(), 0.8);
    const a = ctx.rot + arm * TAU / ctx.arms + t * 4.6 + gauss() * 0.06;
    const r = 0.12 + t * 0.88;
    return [cx + Math.cos(a) * r * rx + gauss() * 0.35, cy + Math.sin(a) * r * ry + gauss() * 0.35];
  }
  if (shape === 'clusters') { const c = pick(ctx.centers); return [c[0] + gauss() * ctx.sd, c[1] + gauss() * ctx.sd]; }
  const a = rnd() * TAU, r = Math.sqrt(rnd()); return [cx + Math.cos(a) * r * rx, cy + Math.sin(a) * r * ry];
}
function linkComponents(maxD) {
  // ensure every star is reachable with hops <= maxD by inserting bridge stars
  const used = new Set(S.stars.map(s => s.name));
  for (let guard = 0; guard < 40; guard++) {
    const comp = new Array(S.stars.length).fill(-1); let nc = 0;
    for (let i = 0; i < S.stars.length; i++) {
      if (comp[i] >= 0) continue;
      const st = [i]; comp[i] = nc;
      while (st.length) { const a = S.stars[st.pop()]; for (const b of S.stars) if (comp[b.id] < 0 && hyp(a.x, a.y, b.x, b.y) <= maxD) { comp[b.id] = nc; st.push(b.id); } }
      nc++;
    }
    if (nc <= 1) return;
    let best = null, bd = 1e9;
    for (const a of S.stars) if (comp[a.id] === 0) for (const b of S.stars) if (comp[b.id] !== 0) { const d = hyp(a.x, a.y, b.x, b.y); if (d < bd) { bd = d; best = [a, b]; } }
    const [a, b] = best; const steps = Math.ceil(bd / (maxD - 0.6));
    for (let k = 1; k < steps; k++) {
      const x = a.x + (b.x - a.x) * k / steps, y = a.y + (b.y - a.y) * k / steps;
      S.stars.push({id: S.stars.length, name: genName(used), x: x + gauss() * 0.3, y: y + gauss() * 0.3, type: wpick(STAR_FREQ), planets: []});
    }
  }
}
function newGame(o) {
  const g = GAL[o.size] || GAL.medium;
  const rivals = clamp(o.rivals == null ? g.rivals : o.rivals, g.min, g.max);
  S = {turn: 1, stars: [], planets: [], fleets: [], empires: [], nextId: 1, msgs: [], prompts: [], pendingBattles: [], hist: [],
    W: g.w, H: g.h, size: o.size, shape: o.shape || 'round', skill: o.skill || 'standard', over: null, version: GAME_VERSION, format: SAVE_FORMAT,
    gameId: Date.now().toString(36) + Math.floor(rnd() * 1e6).toString(36), started: Date.now()};
  const used = new Set();
  const ctx = {arms: ri(2, 3), rot: rnd() * TAU, sd: 2.4, centers: []};
  const nc = ri(3, 5) + (o.size === 'huge' ? 2 : o.size === 'large' ? 1 : 0);
  for (let i = 0; i < nc; i++) {
    let best = null, bd = -1;
    for (let k = 0; k < 40; k++) { const c = [3.5 + rnd() * (g.w - 7), 3.5 + rnd() * (g.h - 7)]; const d = ctx.centers.length ? Math.min(...ctx.centers.map(o => hyp(o[0], o[1], c[0], c[1]))) : 1; if (d > bd) { bd = d; best = c; } }
    ctx.centers.push(best);
  }
  ctx.sd = 1.3 + Math.sqrt(g.n / nc) * 0.45;
  if (S.shape === 'spiral') {
    // walk along each arm placing stars about 3 parsecs apart
    const arms = g.n >= 40 ? 3 : 2, cx = g.w / 2, cy = g.h / 2, rx = g.w / 2 - 1.6, ry = g.h / 2 - 1.6;
    const per = Math.floor((g.n - 4) / arms);
    for (let k = 0; k < 4; k++) { const a = rnd() * TAU, r = rnd() * 2.2; const x = cx + Math.cos(a) * r * 1.4, y = cy + Math.sin(a) * r; if (S.stars.every(o => hyp(o.x, o.y, x, y) > 2.4)) S.stars.push({id: S.stars.length, name: genName(used), x, y, type: wpick(STAR_FREQ), planets: []}); }
    for (let arm = 0; arm < arms; arm++) {
      let placed = 0;
      for (let i = 0; i < 400 && placed < per; i++) {
        const t = 0.12 + i / 400 * 0.88;
        const a = ctx.rot + arm * TAU / arms + t * 4.4;
        const side = (placed % 2 ? 1 : -1) * (0.3 + rnd() * 0.7);
        const x = cx + Math.cos(a) * t * rx + Math.cos(a + Math.PI / 2) * side, y = cy + Math.sin(a) * t * ry + Math.sin(a + Math.PI / 2) * side;
        if (x < 1 || y < 1 || x > g.w - 1 || y > g.h - 1) continue;
        if (S.stars.some(o => hyp(o.x, o.y, x, y) < 2.6)) continue;
        S.stars.push({id: S.stars.length, name: genName(used), x, y, type: wpick(STAR_FREQ), planets: []}); placed++;
      }
    }
  }
  let tries = 0;
  while (S.stars.length < g.n && tries < 30000) {
    tries++;
    let [x, y] = genPoint(S.shape, g.w, g.h, ctx);
    if (x < 1 || y < 1 || x > g.w - 1 || y > g.h - 1) continue;
    if (S.stars.some(s => hyp(s.x, s.y, x, y) < 2.6)) continue;
    S.stars.push({id: S.stars.length, name: genName(used), x, y, type: wpick(STAR_FREQ), planets: []});
  }
  linkComponents(4.6);
  for (const s of S.stars) {
    s.rich = wpick({poor: 3, normal: 5, rich: 2});
    const n = s.rich === 'poor' ? ri(1, 2) : s.rich === 'normal' ? ri(2, 4) : ri(4, 6);
    for (let i = 0; i < n; i++) randomPlanet(s, s.rich === 'rich');
  }
  const nEmp = 1 + rivals;
  const colors = EMP_COLORS.filter(c => c !== o.color);
  const races = shuffle(RACES.filter(r => r.id !== o.raceId).slice());
  const homes = [];
  homes.push(pick(S.stars));
  // first home: pick the star farthest from centroid-ish to leave room
  while (homes.length < nEmp) {
    let best = null, bd = -1;
    for (const s of S.stars) { if (homes.includes(s)) continue; const d = Math.min(...homes.map(h => hyp(h.x, h.y, s.x, s.y))) + rnd() * 1.5; if (d > bd) { bd = d; best = s; } }
    homes.push(best);
  }
  for (let i = 0; i < nEmp; i++) {
    const raceId = i === 0 ? o.raceId : races[(i - 1) % races.length].id;
    S.empires.push({
      id: i, raceId, name: i === 0 ? (o.empName || RACE[raceId].name) : RACE[raceId].name,
      color: i === 0 ? o.color : colors[(i - 1) % colors.length], ai: i !== 0, alive: true,
      bc: 100, techs: {}, tier: FIELDS.map(() => 0), res: null, rpBank: 0, designs: [], nextDesign: 1,
      rel: {}, explored: {}, capital: null, drive: 0, range: 5, scan: 3, fscan: 1.5, compLvl: 0, techVer: 1,
      aiData: {target: null, rally: null, lastDesignVer: -1}, broke: false
    });
  }
  for (const a of S.empires) for (const b of S.empires) if (a !== b) a.rel[b.id] = {contact: false, status: 'peace', treaty: false, att: 0, warTurns: 0};
  S.empires.forEach((emp, i) => setupHome(emp, homes[i]));
  setupMonsters(homes);
  for (const emp of S.empires) { updateCaches(emp); updateExploration(emp); }
  for (const emp of S.empires) if (emp.ai) aiPickResearch(emp);
  recordHistory();
  S.msgs.push({text: 'Welcome, ruler of the ' + player().name + '. Pick a research topic, then send your scouts and colony ship out to the stars.', star: homes[0].id, kind: 'info'});
  return S;
}
function setupHome(emp, star) {
  const r = R(emp);
  const others = S.stars.filter(s => s !== star).sort((a, b) => hyp(a.x, a.y, star.x, star.y) - hyp(b.x, b.y, star.x, star.y));
  for (let i = 0; i < 3; i++) {
    const o = others[i]; if (!o || hyp(o.x, o.y, star.x, star.y) <= 4.6) continue;
    for (let t = 0; t < 60; t++) {
      const a = rnd() * TAU, rr = 3 + rnd() * 1.5;
      const nx = clamp(star.x + Math.cos(a) * rr, 1, S.W - 1), ny = clamp(star.y + Math.sin(a) * rr, 1, S.H - 1);
      if (S.stars.every(q => q === o || hyp(q.x, q.y, nx, ny) > 2.3)) { o.x = nx; o.y = ny; break; }
    }
  }
  while (star.planets.length > 3) { const pid = star.planets.pop(); S.planets[pid].star = -1; }
  if (star.planets.length < 2) randomPlanet(star, false);
  star.rich = 'normal';
  const hw = newPlanet(star, r.aquatic ? 'ocean' : 'terran', 4, 2);
  hw.isHome = true;
  newColony(emp, hw, 8);
  hw.col.capital = true;
  hw.col.bld.shipyard = 1;
  emp.capital = hw.id;
  emp.explored[star.id] = true;
  const near = others.slice(0, 3);
  let good = 0;
  for (const s of near) if (s.planets.map(P).some(p => ['terran', 'ocean', 'arid', 'jungle', 'tundra', 'gaia'].includes(p.type) && p.size >= 2)) good++;
  if (good < 2) for (const s of near.slice(0, 2 - good)) { if (s.planets.length >= 6) { const pid = s.planets.pop(); S.planets[pid].star = -1; } newPlanet(s, pick(['terran', 'arid', 'tundra', 'ocean', 'jungle']), ri(2, 4), ri(1, 3)); }
  for (const sp of ['scout', 'colony', 'outpost', 'transport']) emp.designs.push({id: 's_' + sp, name: SPECIAL_SHIPS[sp].name, special: sp});
  updateCaches(emp);
  const fr = autoDesign(emp, 'corvette'); addDesign(emp, fr);
  const de = autoDesign(emp, 'destroyer'); addDesign(emp, de);
  const mk = dids => { const f = newFleet(emp.id, star.id); for (const d of dids) addShip(emp, f, d); return f; };
  mk([fr.id, fr.id]);
  mk(['s_scout']); mk(['s_scout']); mk(['s_colony']);
}
function setupMonsters(homes) {
  S.monster = {id: -1, name: 'Void Leviathans', color: '#b8c0cc', race: {attack: 2, defense: 0}, techs: {}, techVer: 1, drive: 0, alive: true, rel: {},
    designs: [
      {id: 'm_leviathan', name: 'Void Leviathan', fixed: {hp: 110, attack: 2, defense: 1, shield: 2, speed: 3, weapons: [{id: 'ma', name: 'Acid Spray', type: 'beam', dmg: [3, 10], n: 4, range: 4, color: '#a0ff40'}]}},
      {id: 'm_matriarch', name: 'Leviathan Matriarch', fixed: {hp: 260, attack: 3, defense: 0, shield: 4, speed: 2, weapons: [{id: 'mb', name: 'Corrosive Torrent', type: 'beam', dmg: [5, 14], n: 5, range: 5, color: '#c0ff40'}, {id: 'mc', name: 'Spore Burst', type: 'missile', dmg: [12, 12], n: 2, range: 8, ammo: 3, color: '#e0ffa0'}]}},
    ]};
  const cand = shuffle(S.stars.filter(s => homes.every(h => hyp(h.x, h.y, s.x, s.y) > 7) && s.planets.length > 0));
  const n = Math.max(1, Math.round(S.stars.length / 11));
  cand.sort((a, b) => (b.rich === 'rich') - (a.rich === 'rich'));
  for (const s of cand.slice(0, n)) {
    const f = newFleet(-1, s.id); addShip(S.monster, f, s.rich === 'rich' ? 'm_matriarch' : 'm_leviathan');
    const best = s.planets.map(P).sort((a, b) => b.minerals - a.minerals)[0]; if (best) best.minerals = Math.min(4, best.minerals + 1);
  }
}

// ---------------- Fleets & ships ----------------
function newFleet(owner, starId) {
  const s = ST(starId);
  const f = {id: nid(), owner, ships: [], star: starId, x: s.x, y: s.y, dest: null};
  S.fleets.push(f); return f;
}
function designOf(emp, did) { return emp.designs.find(d => d.id === did); }
function addShip(emp, f, did) { const d = designOf(emp, did); const st = shipStats(emp, d); const sh = {id: nid(), d: did, hp: st.hp}; f.ships.push(sh); return sh; }
function shipRole(emp, ship) { const d = designOf(emp, ship.d); return d.special || 'war'; }
function fleetRole(f) {
  const emp = E(f.owner); let r = null;
  for (const s of f.ships) { const x = shipRole(emp, s); if (r == null) r = x; else if (r !== x) return 'mixed'; }
  return r || 'empty';
}
function fleetSpeed(f) { return f.owner === -1 ? 0 : DRIVES[E(f.owner).drive].speed; }
function spawnShip(emp, did, starId) {
  const d = designOf(emp, did); const role = d.special || 'war';
  let f = null;
  if (role === 'war' || role === 'transport') f = S.fleets.find(x => x.owner === emp.id && x.star === starId && x.dest == null && fleetRole(x) === role);
  if (!f) f = newFleet(emp.id, starId);
  return addShip(emp, f, did);
}
function armed(emp, f) { return f.ships.some(s => shipStats(emp, designOf(emp, s.d)).weapons.length > 0); }
function fleetPower(f) {
  const emp = E(f.owner); let hp = 0, dpr = 0;
  for (const s of f.ships) { const st = shipStats(emp, designOf(emp, s.d)); hp += s.hp; dpr += st.dpr; }
  return Math.sqrt(hp * dpr);
}
function powerOf(hp, dpr) { return Math.sqrt(Math.max(0, hp) * Math.max(0, dpr)); }
function cleanupFleets() { S.fleets = S.fleets.filter(f => f.ships.length > 0); }
function mergeFleets(a, b) { a.ships.push(...b.ships); b.ships = []; cleanupFleets(); }
function splitFleet(f, shipIds) {
  const nf = {id: nid(), owner: f.owner, ships: [], star: f.star, x: f.x, y: f.y, dest: null};
  nf.ships = f.ships.filter(s => shipIds.includes(s.id));
  f.ships = f.ships.filter(s => !shipIds.includes(s.id));
  S.fleets.push(nf); cleanupFleets(); return nf;
}

// ---------------- Designs ----------------
function designSpace(d) {
  if (d.special || d.fixed) return 0;
  const h = HULLS[d.hull]; let s = 0;
  for (const w of d.weapons) s += WEAPONS[w.id].space * w.n;
  if (d.shield > 0) s += Math.ceil(h.space * 0.12);
  if (d.comp > 0) s += Math.ceil(h.space * 0.08);
  for (const m of (d.mods || [])) s += Math.ceil(h.space * MODULES[m].space);
  return s;
}
function designCost(emp, d) {
  if (d.fixed) return 500;
  if (d.special) return SPECIAL_SHIPS[d.special].cost;
  const h = HULLS[d.hull];
  let c = h.cost + d.armor * h.cost * 0.12 + d.shield * h.cost * 0.15 + d.comp * h.cost * 0.1;
  for (const w of d.weapons) c += WEAPONS[w.id].cost * w.n;
  for (const m of (d.mods || [])) c += h.cost * MODULES[m].cost;
  return Math.round(c);
}
function shipStats(emp, d) {
  if (d._s && d._sv === emp.techVer) return d._s;
  const r = R(emp); let s;
  const defBonus = (has(emp, 'phase_dampers') ? 2 : 0) + (has(emp, 'ecm_suite') ? 1 : 0) + (r.defense || 0);
  const atkBonus = (r.attack || 0) + (has(emp, 'war_college') ? 1 : 0) + (has(emp, 'fire_control_ai') ? 2 : 0);
  const spdBonus = (has(emp, 'vector_thrusters') ? 1 : 0) + (emp.drive >= 2 ? 1 : 0) + (emp.drive >= 4 ? 1 : 0);
  if (d.fixed) {
    s = Object.assign({}, d.fixed); s.weapons = d.fixed.weapons.map(w => Object.assign({ammo: 0}, w)); s.special = null; s.troops = 0; s.cspeed = d.fixed.speed;
  } else if (d.special) {
    const sp = SPECIAL_SHIPS[d.special];
    s = {hp: sp.hp, attack: 0, defense: 2 + defBonus, shield: 0, weapons: [], special: d.special, cspeed: sp.cspeed + spdBonus,
      troops: d.special === 'transport' ? (has(emp, 'drop_pods') ? 8 : 4) : 0};
  } else {
    const h = HULLS[d.hull], mods = d.mods || [];
    const mult = 1 + (has(emp, 'reinforced_frames') ? 0.25 : 0) + (has(emp, 'bastion_frames') ? 0.5 : 0);
    const dm = has(emp, 'heavy_mounts') ? 1.25 : 1;
    s = {hp: Math.round(h.hp * mult + ARMOR[d.armor].hp * h.armorMult * (mods.includes('plating') ? 1.5 : 1)), attack: COMPUTERS[d.comp].val + atkBonus, defense: h.def + defBonus,
      shield: Math.floor(SHIELDS[d.shield].val * (has(emp, 'hardlight_shields') ? 1.5 : 1)), special: null,
      troops: mods.includes('troopbay') ? 2 : 0, ecm: mods.includes('ecm'), drones: mods.includes('drones'),
      cspeed: h.cspeed + spdBonus + (mods.includes('thrusters') ? 2 : 0),
      weapons: d.weapons.filter(w => w.n > 0).map(w => { const W = WEAPONS[w.id]; return {id: w.id, name: W.name, type: W.type, dmg: [Math.round(W.dmg[0] * dm), Math.round(W.dmg[1] * dm)], n: w.n, range: W.range, ammo: W.ammo || 0, color: W.color}; })};
  }
  s.dpr = 0;
  for (const w of s.weapons) s.dpr += w.n * (w.dmg[0] + w.dmg[1]) / 2 * 0.6 * (w.type === 'missile' ? 0.6 : 1);
  s.cost = designCost(emp, d);
  d._s = s; d._sv = emp.techVer; return s;
}
function bestIdx(arr, emp) { let b = 0; arr.forEach((a, i) => { if (avail(emp, a.tech)) b = i; }); return b; }
const bestArmor = emp => bestIdx(ARMOR, emp), bestShield = emp => bestIdx(SHIELDS, emp), bestComp = emp => bestIdx(COMPUTERS, emp);
function knownWeapons(emp) { return Object.keys(WEAPONS).filter(k => avail(emp, WEAPONS[k].tech)); }
function bestWeapon(emp, type) {
  let b = null, bv = -1;
  for (const k of knownWeapons(emp)) { const w = WEAPONS[k]; if (type && w.type !== type) continue; if (w.dmg[0] + w.dmg[1] > bv) { bv = w.dmg[0] + w.dmg[1]; b = k; } }
  return b;
}
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
function autoDesign(emp, hull) {
  const h = HULLS[hull];
  const d = {id: null, name: '', hull, armor: bestArmor(emp), shield: bestShield(emp), comp: bestComp(emp), weapons: [], mods: []};
  if (avail(emp, 'nanite_repair') && h.size >= 3) d.mods.push('drones');
  const beam = bestWeapon(emp, 'beam'), mis = bestWeapon(emp, 'missile');
  const fill = () => {
    d.weapons = [];
    let free = h.space - designSpace(d);
    const B = WEAPONS[beam], M = WEAPONS[mis];
    const useMis = !!mis && h.size >= 2;
    let nb = Math.floor(free * (useMis ? 0.65 : 1) / B.space);
    if (nb < 1 && free >= B.space) nb = 1;
    free -= nb * B.space;
    const nm = useMis ? Math.floor(free / M.space) : 0;
    free -= nm * M.space;
    nb += Math.floor(free / B.space);
    if (nb > 0) d.weapons.push({id: beam, n: nb});
    if (nm > 0) d.weapons.push({id: mis, n: nm});
  };
  fill();
  const cnt = () => d.weapons.reduce((a, w) => a + w.n, 0);
  if (cnt() < 2 && d.mods.length) { d.mods = []; fill(); }
  if (cnt() < 2) { d.comp = 0; fill(); }
  if (cnt() < 2) { d.shield = 0; fill(); }
  const pre = {corvette: 'Lancer', destroyer: 'Warden', cruiser: 'Vindicator', battleship: 'Bulwark', dreadnought: 'Sovereign'}[hull];
  d.name = pre + ' ' + ROMAN[Math.min(11, emp.designs.filter(x => x.hull === hull).length)];
  return d;
}
function addDesign(emp, d) { d.id = 'd' + (emp.nextDesign++); d.obsolete = false; emp.designs.push(d); return d; }
function designInUse(emp, did) {
  return S.fleets.some(f => f.owner === emp.id && f.ships.some(s => s.d === did)) ||
    colonies(emp, true).some(p => p.col.queue.some(q => q.kind === 'ship' && q.id === did));
}

// ---------------- Tech ----------------
function updateCaches(emp) {
  emp.drive = bestIdx(DRIVES, emp);
  emp.range = 5 + (has(emp, 'fuel_cells') ? 2 : 0) + (has(emp, 'subspace_tanks') ? 4 : 0);
  emp.scan = 3 + (has(emp, 'deep_scanners') ? 2 : 0);
  emp.fscan = 1.5 + (has(emp, 'deep_scanners') ? 1 : 0);
  emp.compLvl = bestComp(emp);
  emp.techVer = (emp.techVer || 0) + 1;
}
function techCost(fi, ti) { return Math.round(FIELDS[fi].tiers[ti].cost * (1 + ti * 0.5) / 10) * 10; }
function availableTechs(emp) {
  const out = [];
  FIELDS.forEach((f, fi) => {
    const ti = emp.tier[fi]; if (ti >= f.tiers.length) return;
    for (const o of f.tiers[ti].opts) if (!has(emp, o)) out.push({tech: o, f: fi, t: ti, cost: techCost(fi, ti)});
  });
  return out;
}
function learnTech(emp, id, how) {
  if (has(emp, id)) return;
  emp.techs[id] = 1;
  const loc = TECH_LOC[id];
  const learned = [id];
  if (loc && emp.tier[loc.f] === loc.t && !loc.bonus) {
    const tier = FIELDS[loc.f].tiers[loc.t];
    if (R(emp).creative) for (const o of tier.opts) if (!emp.techs[o]) { emp.techs[o] = 1; learned.push(o); }
    for (const b of (tier.bonus || [])) if (!emp.techs[b]) { emp.techs[b] = 1; learned.push(b); }
    emp.tier[loc.f]++;
  }
  updateCaches(emp);
  if (emp.id === 0) {
    msg(0, (how || 'Research complete') + ': ' + learned.map(t => TECH[t].name).join(', ') + '.', null, 'tech');
    const comp = learned.some(t => /^hull_/.test(t) || Object.values(WEAPONS).some(w => w.tech === t) || ARMOR.some(a => a.tech === t) || SHIELDS.some(a => a.tech === t) || COMPUTERS.some(a => a.tech === t) || t === 'nanite_repair' || t === 'ecm_suite');
    if (comp) msg(0, 'New ship parts are available. Open Ship Design to create better warships.', null, 'design');
  }
}
function processResearch(emp, rp) {
  if (!emp.res && emp.ai) aiPickResearch(emp);
  if (!emp.res) { emp.rpBank += rp; return; }
  emp.res.prog += rp + emp.rpBank; emp.rpBank = 0;
  const loc = TECH_LOC[emp.res.tech];
  const cost = techCost(loc.f, loc.t);
  if (emp.res.prog >= cost) {
    emp.rpBank = Math.min(emp.res.prog - cost, cost);
    learnTech(emp, emp.res.tech);
    emp.res = null;
    if (emp.ai) aiPickResearch(emp);
  }
}
function setResearch(emp, tech) {
  const av = availableTechs(emp).find(t => t.tech === tech); if (!av) return false;
  if (emp.res && emp.res.tech !== tech) emp.rpBank += emp.res.prog;
  if (!emp.res || emp.res.tech !== tech) emp.res = {tech, prog: 0};
  return true;
}

// ---------------- Colonies & economy ----------------
function colonies(emp, includeOutposts) { return S.planets.filter(p => p.owner === emp.id && p.star >= 0 && (includeOutposts || !p.col.outpost)); }
function newColony(emp, pl, pop) {
  pl.owner = emp.id;
  pl.col = {pop, bld: {}, queue: [], prog: 0, defHp: 0, capital: false, founded: S.turn};
  emp.explored[pl.star] = true;
  if (pl.special === 'artifacts' && !pl.artUsed) {
    pl.artUsed = true;
    const av = availableTechs(emp); if (av.length) { const t = pick(av); learnTech(emp, t.tech, 'Colonists decipher the Precursor Ruins on ' + planetName(pl)); }
  }
}
function newOutpost(emp, pl) { pl.owner = emp.id; pl.col = {outpost: true, pop: 0, bld: {}, queue: [], prog: 0, defHp: 0}; emp.explored[pl.star] = true; }
function planetName(pl) { const s = ST(pl.star); const idx = s.planets.indexOf(pl.id); return s.name + ' ' + ROMAN[idx]; }
function popF(emp, pl) {
  const t = PT[pl.type], r = R(emp);
  if (t.outpostOnly) return 0;
  let f = t.popF;
  if (r.aquatic && (pl.type === 'ocean' || pl.type === 'jungle')) f = 5;
  if (t.hostile) f = has(emp, 'hostile_habitats') ? 1 : 0;
  if (r.lithovore) f = Math.max(f, 2);
  return f;
}
function bldEff(c) {
  const e = {};
  for (const k in c.bld) { const b = BUILDINGS[k]; if (!b) continue; for (const x in b.e) e[x] = (x === 'shield') ? Math.max(e[x] || 0, b.e[x]) : (e[x] || 0) + b.e[x]; }
  return e;
}
function maxPop(emp, pl) {
  const f = popF(emp, pl); if (f <= 0) return 0;
  let m = Math.max(1, Math.round(SIZE_BASE[pl.size] * f / 2));
  if (pl.owner === emp.id && pl.col) m += bldEff(pl.col).maxPop || 0;
  if (has(emp, 'gene_crafting')) m += 2;
  if (has(emp, 'hyper_growth')) m += 3;
  return m;
}
function baseFert(emp, pl) {
  const r = R(emp); if (r.lithovore) return 0;
  let f = PT[pl.type].fert;
  if (r.aquatic && (pl.type === 'ocean' || pl.type === 'jungle')) f = 1.5;
  return f;
}
function slotsOf(pl) { return SIZE_SLOTS[pl.size] + (pl.col && pl.col.capital ? 1 : 0); }
function slotsUsed(pl) { const c = pl.col; return Object.keys(c.bld).length + c.queue.filter(q => q.kind === 'bld').length; }
function colStats(pl) {
  const emp = E(pl.owner), c = pl.col, r = R(emp);
  if (c.outpost) return {outpost: true, food: 0, use: 0, prod: 0, rp: 0, bc: 0, up: 0, maxPop: 0, growth: 0};
  const e = bldEff(c), pop = c.pop;
  const bf = baseFert(emp, pl);
  let fpp = bf > 0 ? bf + (r.foodPop || 0) + (pl.special === 'fertile' ? 0.5 : 0) + (e.foodPop || 0) : 0;
  const food = r1(pop * fpp + (e.foodFlat || 0) + (c.capital ? 2 : 0));
  const use = r.lithovore ? 0 : r1(pop);
  const ppp = MIN_MULT[pl.minerals] + (r.prodPop || 0) + (e.prodPop || 0);
  let prod = pop * ppp + (e.prodFlat || 0) + (c.capital ? 4 : 0);
  prod *= 1 + (has(emp, 'unified_government') ? 0.1 : 0) + (has(emp, 'imperial_charter') ? 0.2 : 0);
  if (emp.broke) prod *= 0.5;
  let rp = pop * (0.5 + (e.rpPop || 0)) + (e.rpFlat || 0) + (c.capital ? 3 : 0) + (pl.special === 'artifacts' ? 5 : 0) + (has(emp, 'sentient_core') ? 5 : 0);
  rp *= (r.research || 1) * (1 + (has(emp, 'neural_net') ? 0.2 : 0) + (has(emp, 'imperial_charter') ? 0.2 : 0));
  let bc = pop * (0.4 + (e.bcPop || 0)) + (e.bcFlat || 0) + (pl.special === 'gold' ? 5 : 0) + (pl.special === 'gems' ? 8 : 0) + (c.capital ? 5 : 0);
  bc *= (r.bc || 1) * (1 + (has(emp, 'galactic_bank') ? 0.2 : 0) + (has(emp, 'unified_government') ? 0.1 : 0));
  let up = 0; for (const k in c.bld) up += BUILDINGS[k] ? BUILDINGS[k].up : 0;
  const mp = maxPop(emp, pl);
  return {food, use, prod: Math.floor(prod), rp: r1(rp), bc: r1(bc), up, maxPop: mp, growth: growthOf(emp, pl, mp), fpp: r1(fpp), ppp: r1(ppp), e};
}
function growthOf(emp, pl, mp) {
  const c = pl.col; if (mp <= 0) return 0;
  if (c.pop > mp) return -Math.min(c.pop - mp, Math.max(0.2, (c.pop - mp) * 0.25));
  if (c.pop >= mp) return 0;
  let g = (0.16 * c.pop * (1 - c.pop / mp) + 0.1) * (R(emp).growth || 1);
  if (bldEff(c).growth) g *= 2;
  if (has(emp, 'hyper_growth')) g *= 1.5;
  return Math.min(g, mp - c.pop);
}
function empPop(emp) { let p = 0; for (const pl of colonies(emp)) p += pl.col.pop; return p; }
function empTotals(emp) {
  const t = {food: 0, use: 0, prod: 0, rp: 0, bc: 0, up: 0, ship: 0, trade: 0, pop: 0, cols: 0};
  for (const pl of colonies(emp)) { const s = colStats(pl); t.food += s.food; t.use += s.use; t.prod += s.prod; t.rp += s.rp; t.bc += s.bc; t.up += s.up; t.pop += pl.col.pop; t.cols++; }
  for (const f of S.fleets) if (f.owner === emp.id) for (const s of f.ships) t.ship += shipStats(emp, designOf(emp, s.d)).cost * 0.02;
  if (has(emp, 'war_college')) t.ship *= 0.5;
  t.ship = r1(t.ship);
  for (const k in emp.rel) { const rel = emp.rel[k]; const o = E(+k); if (rel.treaty && o.alive) t.trade += 0.1 * Math.min(t.pop, empPop(o)) * (has(emp, 'xeno_relations') ? 1.5 : 1); }
  t.trade = r1(t.trade); t.rp = r1(t.rp); t.bc = r1(t.bc); t.food = r1(t.food); t.use = r1(t.use);
  t.foodNet = r1(t.food - t.use);
  t.net = r1(t.bc + t.trade - t.up - t.ship + Math.max(0, t.foodNet) * 0.5);
  return t;
}

// ---------------- Production ----------------
function bldCost(emp, id) { return Math.round(BUILDINGS[id].cost * (has(emp, 'civil_engineering') ? 0.8 : 1)); }
function itemCost(emp, pl, it) {
  if (it.kind === 'bld') return bldCost(emp, it.id);
  if (it.kind === 'ship') { const d = designOf(emp, it.id); return d ? designCost(emp, d) : 0; }
  if (it.kind === 'proj') return it.id === 'terraform' ? 100 + pl.size * 40 : 250 + pl.size * 60;
  return 0;
}
function itemName(emp, it) {
  if (it.kind === 'bld') return BUILDINGS[it.id].name;
  if (it.kind === 'ship') { const d = designOf(emp, it.id); return d ? d.name : '?'; }
  if (it.kind === 'proj') return PROJECTS[it.id].name;
  return 'Trade Goods';
}
function bldReason(emp, pl, id) {
  const c = pl.col, b = BUILDINGS[id];
  if (c.outpost) return 'Outposts cannot build';
  if (c.bld[id]) return 'Already built';
  if (!avail(emp, b.tech)) return 'Not researched';
  if (c.queue.some(q => q.kind === 'bld' && q.id === id)) return 'Already queued';
  if (b.fertile && baseFert(emp, pl) <= 0) return 'Needs a fertile world';
  if (id === 'drydock' && !c.bld.shipyard && !c.queue.some(q => q.id === 'shipyard')) return 'Needs a Shipyard';
  if (slotsUsed(pl) >= slotsOf(pl)) return 'No free building slots';
  return null;
}
function canBuildBld(emp, pl, id) { return !bldReason(emp, pl, id); }
function canProject(emp, pl, id) {
  const c = pl.col; if (c.outpost || !has(emp, PROJECTS[id].tech)) return false;
  if (c.queue.some(q => q.kind === 'proj')) return false;
  if (id === 'terraform') return !!TERRAFORM[pl.type] && (!PT[pl.type].hostile || has(emp, 'hostile_habitats') || R(emp).lithovore);
  return pl.type === 'terran' || pl.type === 'ocean';
}
function shipReason(emp, pl, d) {
  if (pl.col.outpost) return 'Outposts cannot build';
  if (!pl.col.bld.shipyard) return 'Needs a Shipyard';
  if (d.hull && HULLS[d.hull].drydock && !pl.col.bld.drydock) return 'Needs a Drydock';
  return null;
}
function itemValid(emp, pl, it) {
  if (it.kind === 'bld') return !pl.col.bld[it.id];
  if (it.kind === 'ship') { const d = designOf(emp, it.id); return !!d && !shipReason(emp, pl, d); }
  if (it.kind === 'proj') return it.id === 'terraform' ? !!TERRAFORM[pl.type] : (pl.type === 'terran' || pl.type === 'ocean');
  return true;
}
function completeItem(emp, pl, it) {
  const c = pl.col;
  if (it.kind === 'bld') {
    c.bld[it.id] = 1;
    const e = BUILDINGS[it.id].e;
    if (e.defHp) c.defHp = Math.min(planetDefMax(pl), c.defHp + e.defHp * (has(emp, 'hardened_colonies') ? 1.5 : 1));
    msg(emp.id, planetName(pl) + ' completed ' + BUILDINGS[it.id].name + '.', pl.star, 'build');
  } else if (it.kind === 'ship') {
    spawnShip(emp, it.id, pl.star);
    msg(emp.id, planetName(pl) + ' launched a new ' + designOf(emp, it.id).name + '.', pl.star, 'ship');
  } else if (it.kind === 'proj') {
    const old = PT[pl.type].name;
    pl.type = it.id === 'gaia' ? 'gaia' : TERRAFORM[pl.type];
    msg(emp.id, planetName(pl) + ' transformed from ' + old + ' to ' + PT[pl.type].name + '.', pl.star, 'build');
  }
}
function processProduction(emp, pl, prod) {
  const c = pl.col;
  while (c.queue.length && !itemValid(emp, pl, c.queue[0])) c.queue.shift();
  if (!c.queue.length) { emp.bc += prod * 0.5; c.prog = 0; return; }
  c.prog += prod;
  const it = c.queue[0];
  const cost = itemCost(emp, pl, it);
  if (c.prog >= cost) {
    completeItem(emp, pl, it);
    c.prog = Math.min(c.prog - cost, cost);
    if (it.n && it.n > 1) it.n--; else c.queue.shift();
    if (!c.queue.length) { emp.bc += c.prog * 0.5; c.prog = 0; }
  }
}
function buyCost(emp, pl) {
  const c = pl.col; if (!c.queue.length) return 0;
  const cost = itemCost(emp, pl, c.queue[0]); const rem = Math.max(0, cost - c.prog);
  return Math.ceil(rem * (c.prog > 0 ? 2 : 3));
}
function buyItem(emp, pl) {
  const bc = buyCost(emp, pl); if (bc <= 0 || emp.bc < bc) return false;
  emp.bc = r1(emp.bc - bc); pl.col.prog = itemCost(emp, pl, pl.col.queue[0]); return true;
}
function demolish(emp, pl, id) {
  const c = pl.col; if (!c.bld[id]) return;
  delete c.bld[id];
  c.defHp = Math.min(c.defHp, planetDefMax(pl));
  if (id === 'shipyard') { delete c.bld.drydock; c.queue = c.queue.filter(q => q.kind !== 'ship'); }
}

// ---------------- Planet defense / troops ----------------
function planetDefMax(pl) {
  const c = pl.col; if (!c || c.outpost) return 0; const emp = E(pl.owner);
  return Math.round((bldEff(c).defHp || 0) * (has(emp, 'hardened_colonies') ? 1.5 : 1));
}
function planetDef(pl) {
  const c = pl.col; if (!c || c.outpost) return null; const emp = E(pl.owner);
  const e = bldEff(c); if (!e.defN) return null;
  const bw = bestWeapon(emp, 'beam'); const W = WEAPONS[bw];
  const dm = has(emp, 'heavy_mounts') ? 1.25 : 1;
  const weapons = [{id: bw, name: W.name, type: 'beam', dmg: [Math.round(W.dmg[0] * dm), Math.round(W.dmg[1] * dm)], n: e.defN, range: W.range + 3, ammo: 0, color: W.color}];
  return {maxHp: planetDefMax(pl), shield: e.shield || 0, attack: emp.compLvl + 1 + (has(emp, 'fire_control_ai') ? 2 : 0), defense: 0, weapons, dpr: e.defN * (W.dmg[0] + W.dmg[1]) / 2 * 0.6};
}
function garrison(pl) {
  const c = pl.col; if (!c || c.outpost) return 0; const emp = E(pl.owner);
  return Math.round((2 + c.pop * 0.5 + (bldEff(c).troops || 0)) * (has(emp, 'hardened_colonies') ? 1.5 : 1));
}
function troopStr(emp, attacking) { const r = R(emp); return (r.ground || 1) * (attacking ? (has(emp, 'assault_armor') ? 1.5 : 1) : (has(emp, 'personal_shields') ? 1.5 : 1)); }

// ---------------- Range / visibility ----------------
function distToOwned(emp, x, y) {
  let d = 1e9; for (const p of S.planets) if (p.owner === emp.id && p.star >= 0) { const s = ST(p.star); const dd = hyp(s.x, s.y, x, y); if (dd < d) d = dd; }
  return d;
}
function inRange(emp, starId) { const s = ST(starId); return distToOwned(emp, s.x, s.y) <= emp.range + 1e-6; }
function eta(f, starId) { const s = ST(starId); return Math.max(1, Math.ceil((hyp(f.x, f.y, s.x, s.y) - 1e-6) / fleetSpeed(f))); }
function orderMove(f, starId) {
  const emp = E(f.owner);
  if (f.star === starId) { f.dest = null; return null; }
  if (!inRange(emp, starId)) return 'Out of fuel range';
  if (!f.ships.length) return 'Empty fleet';
  f.dest = starId; return null;
}
function scanCircles(emp) {
  const c = []; const seen = new Set();
  for (const p of S.planets) if (p.owner === emp.id && p.star >= 0 && !seen.has(p.star)) { seen.add(p.star); const s = ST(p.star); c.push([s.x, s.y, emp.scan]); }
  for (const f of S.fleets) if (f.owner === emp.id) { const scout = f.ships.some(s => s.d === 's_scout'); c.push([f.x, f.y, emp.fscan + (scout ? 1.5 : 0)]); }
  return c;
}
function inCircles(cs, x, y) { for (const c of cs) if (hyp(c[0], c[1], x, y) <= c[2] + 1e-6) return true; return false; }
function updateExploration(emp) {
  const cs = scanCircles(emp);
  for (const s of S.stars) if (!emp.explored[s.id] && inCircles(cs, s.x, s.y)) emp.explored[s.id] = true;
}
function establishContacts() {
  const es = alive(); const circ = {}, pts = {};
  for (const e of es) {
    circ[e.id] = scanCircles(e); pts[e.id] = [];
    for (const p of S.planets) if (p.owner === e.id && p.star >= 0) { const s = ST(p.star); pts[e.id].push([s.x, s.y]); }
    for (const f of S.fleets) if (f.owner === e.id) pts[e.id].push([f.x, f.y]);
  }
  for (const a of es) for (const b of es) {
    if (a.id >= b.id || a.rel[b.id].contact) continue;
    if (pts[b.id].some(p => inCircles(circ[a.id], p[0], p[1])) || pts[a.id].some(p => inCircles(circ[b.id], p[0], p[1]))) makeContact(a, b);
  }
}
function makeContact(a, b) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const rel = x.rel[y.id]; rel.contact = true; rel.status = 'peace'; rel.peaceTurn = S.turn;
    rel.att = ri(-10, 10) + (R(y).diplo || 0) + (has(y, 'xeno_relations') ? 20 : 0) + (has(y, 'xeno_psychology') ? 30 : 0) - ((R(x).aggressive || 1) - 1) * 30;
  }
  const other = a.id === 0 ? b : b.id === 0 ? a : null;
  if (other) msg(0, 'First contact: we have met the ' + other.name + ' (' + R(other).species + ').', null, 'diplo');
}

// ---------------- Colonize / invade ----------------
function hostile(a, b) { if (a === b) return false; if (a === -1 || b === -1) return true; return E(a).rel[b].status === 'war'; }
function hostileArmedAt(empId, starId) {
  return S.fleets.some(f => f.star === starId && f.dest == null && hostile(empId, f.owner) && armed(E(f.owner), f));
}
function colonizeCheck(emp, f, pl) {
  if (pl.star !== f.star || f.dest != null) return 'Fleet must be in orbit';
  if (pl.owner != null && !(pl.owner === emp.id && pl.col.outpost)) return 'Planet is already claimed';
  if (hostileArmedAt(emp.id, pl.star)) return 'Hostile ships control this system';
  const mp = maxPop(emp, pl);
  const hasCol = f.ships.some(s => s.d === 's_colony'), hasOut = f.ships.some(s => s.d === 's_outpost');
  if (pl.owner === emp.id) return (hasCol && mp > 0) ? null : 'Needs a Colony Ship to settle this outpost';
  if (mp > 0 && hasCol) return null;
  if (hasOut) return null;
  if (mp <= 0 && hasCol) return 'Uninhabitable for your species: needs an Outpost Ship';
  return 'No Colony or Outpost Ship in this fleet';
}
function colonize(emp, f, pl, preferOutpost) {
  if (colonizeCheck(emp, f, pl)) return false;
  const mp = maxPop(emp, pl);
  const useCol = !preferOutpost && mp > 0 && f.ships.some(s => s.d === 's_colony');
  const sid = useCol ? 's_colony' : 's_outpost';
  const idx = f.ships.findIndex(s => s.d === sid); if (idx < 0) return false;
  f.ships.splice(idx, 1);
  if (useCol) { newColony(emp, pl, 1); msg(emp.id, 'New colony founded on ' + planetName(pl) + '.', pl.star, 'colony'); }
  else { newOutpost(emp, pl); msg(emp.id, 'Outpost established on ' + planetName(pl) + '.', pl.star, 'colony'); }
  cleanupFleets();
  return true;
}
function fleetTroops(f) { const emp = E(f.owner); let t = 0; for (const s of f.ships) { if (s.troopsUsed === S.turn) continue; t += shipStats(emp, designOf(emp, s.d)).troops || 0; } return t; }
function invadeCheck(emp, f, pl) {
  if (pl.star !== f.star || f.dest != null) return 'Fleet must be in orbit';
  if (pl.owner == null || pl.owner === emp.id || pl.owner < 0) return 'Not an enemy colony';
  if (!hostile(emp.id, pl.owner)) return 'You are not at war with them';
  if (S.fleets.some(x => x.star === pl.star && x.owner === pl.owner && armed(E(x.owner), x))) return 'Their warships still defend this system';
  if (S.fleets.some(x => x.star === pl.star && x.owner === -1)) return 'A monster guards this system';
  if (pl.col.outpost) return (armed(emp, f) || fleetTroops(f)) ? null : 'Needs warships or marines to seize an outpost';
  if (!fleetTroops(f)) return 'No marines in this fleet';
  if (planetDef(pl) && pl.col.defHp > 0) return 'Planet defenses must be destroyed first';
  return null;
}
function invade(emp, f, pl) {
  if (invadeCheck(emp, f, pl)) return null;
  const def = E(pl.owner);
  if (pl.col.outpost) {
    const old = pl.owner; newOutpost(emp, pl);
    msg(emp.id, 'We seized the ' + def.name + ' outpost on ' + planetName(pl) + '.', pl.star, 'war');
    msg(old, 'The ' + emp.name + ' seized our outpost on ' + planetName(pl) + '.', pl.star, 'war');
    return {win: true};
  }
  let a = fleetTroops(f); const a0 = a;
  let d = garrison(pl); const d0 = d;
  const as = troopStr(emp, true), ds = troopStr(def, false);
  while (a > 0 && d > 0) { if (rnd() * as > rnd() * ds) d--; else a--; }
  // marines are spent: transports and troop bays are used up
  f.ships = f.ships.filter(s => s.d !== 's_transport');
  for (const s of f.ships) { const st = shipStats(emp, designOf(emp, s.d)); if (st.troops) s.troopsUsed = S.turn; }
  cleanupFleets();
  const res = {win: d <= 0, a0, d0, aLeft: a, dLeft: d, planet: pl.id};
  if (res.win) {
    msg(emp.id, 'Our ' + a0 + ' marines captured ' + planetName(pl) + ' from the ' + def.name + ' (' + d0 + ' defenders).', pl.star, 'war');
    msg(pl.owner, 'The ' + emp.name + ' invaded and captured ' + planetName(pl) + '!', pl.star, 'war');
    capture(pl, emp);
  } else {
    msg(emp.id, 'Our invasion of ' + planetName(pl) + ' failed: ' + a0 + ' marines against ' + d0 + ' defenders.', pl.star, 'war');
    msg(pl.owner, 'We repelled a ' + emp.name + ' invasion of ' + planetName(pl) + '.', pl.star, 'war');
  }
  return res;
}
function capture(pl, emp) {
  const old = E(pl.owner); const c = pl.col;
  pl.owner = emp.id;
  if (!has(emp, 'xeno_psychology')) c.pop = Math.max(1, c.pop * 0.7);
  c.queue = []; c.prog = 0; c.defHp = 0;
  const wasCap = c.capital; c.capital = false;
  while (Object.keys(c.bld).length > slotsOf(pl)) delete c.bld[Object.keys(c.bld).pop()];
  old.rel[emp.id].att -= 25;
  if (wasCap) {
    const rest = colonies(old).sort((a, b) => b.col.pop - a.col.pop);
    if (rest.length) { rest[0].col.capital = true; old.capital = rest[0].id; } else old.capital = null;
  }
  const av = availableTechs(emp).filter(t => has(old, t.tech));
  if (av.length && rnd() < 0.6) learnTech(emp, pick(av).tech, 'Captured research archives reveal');
}

// ---------------- Diplomacy ----------------
function declareWar(a, b) {
  const ra = a.rel[b.id], rb = b.rel[a.id];
  if (ra.status === 'war') return;
  const broke = ra.treaty;
  ra.status = rb.status = 'war'; ra.treaty = rb.treaty = false; ra.warTurns = rb.warTurns = 0;
  rb.att -= 40;
  for (const o of alive()) if (o !== a && o !== b && o.rel[a.id].contact) o.rel[a.id].att -= broke ? 10 : 4;
  if (b.id === 0) S.msgs.push({text: 'The ' + a.name + ' have DECLARED WAR on us!', star: null, kind: 'war'});
  else if (a.id === 0) S.msgs.push({text: 'We are now at war with the ' + b.name + '.', star: null, kind: 'war'});
  else if (player().rel[a.id].contact && player().rel[b.id].contact) S.msgs.push({text: 'The ' + a.name + ' declared war on the ' + b.name + '.', star: null, kind: 'diplo'});
}
function makePeace(a, b) {
  const ra = a.rel[b.id], rb = b.rel[a.id];
  ra.status = rb.status = 'peace'; ra.warTurns = rb.warTurns = 0; ra.att += 10; rb.att += 10;
  ra.peaceTurn = rb.peaceTurn = S.turn;
  if (a.id === 0 || b.id === 0) S.msgs.push({text: 'Peace treaty signed with the ' + (a.id === 0 ? b : a).name + '.', star: null, kind: 'diplo'});
}
function signTrade(a, b) {
  a.rel[b.id].treaty = b.rel[a.id].treaty = true; a.rel[b.id].att += 5; b.rel[a.id].att += 5;
  if (a.id === 0 || b.id === 0) S.msgs.push({text: 'Trade treaty signed with the ' + (a.id === 0 ? b : a).name + '.', star: null, kind: 'diplo'});
}
function empMilitary(emp) { let v = 0; for (const f of S.fleets) if (f.owner === emp.id) for (const s of f.ships) { const st = shipStats(emp, designOf(emp, s.d)); if (st.weapons.length) v += st.cost; } return v; }
function empStrength(emp) {
  let v = empMilitary(emp);
  for (const p of colonies(emp)) { v += p.col.pop * 4; const d = planetDef(p); if (d) v += d.maxHp; }
  return v;
}
function attText(a) { return a >= 40 ? 'Friendly' : a >= 10 ? 'Cordial' : a > -10 ? 'Neutral' : a > -40 ? 'Wary' : 'Hostile'; }
function aiAcceptPeace(ai, other) {
  const rel = ai.rel[other.id];
  const ratio = empStrength(ai) / Math.max(1, empStrength(other));
  let chance = 0.15 + (rel.warTurns > 12 ? 0.25 : 0) + (ratio < 0.8 ? 0.45 : 0) - (ratio > 1.6 ? 0.4 : 0) + rel.att / 200;
  if (rel.warTurns < 5) chance -= 0.3;
  return rnd() < chance;
}
function aiAcceptTrade(ai, other) { const rel = ai.rel[other.id]; return rel.status === 'peace' && rel.att > -5 + rnd() * 20; }
function tributeAmount(payer) { return Math.max(20, Math.round(Math.min(payer.bc * 0.5, 40 + S.turn * 2) / 5) * 5); }
function aiAcceptDemand(ai, demander) {
  const ratio = empStrength(ai) / Math.max(1, empStrength(demander));
  return ratio < 0.6 && rnd() < 0.75 && ai.rel[demander.id].status === 'peace';
}
function payTribute(payer, to, amt) {
  amt = Math.min(amt, Math.floor(payer.bc)); payer.bc = r1(payer.bc - amt); to.bc = r1(to.bc + amt);
  payer.rel[to.id].att -= 10;
  return amt;
}

// ---------------- Turn processing ----------------
// Phase 1: orders + movement + contacts, then collect battles. Player battles are left in S.pendingBattles.
function endTurnStart() {
  S.msgs = []; S.prompts = []; S.pendingBattles = [];
  for (const emp of alive()) if (emp.ai) aiTurn(emp);
  moveFleets();
  for (const emp of alive()) updateExploration(emp);
  establishContacts();
  for (const sid of battleStars()) {
    const owners = battleOwners(sid);
    if (owners.includes(0)) S.pendingBattles.push(sid);
    else autoBattle(sid);
  }
  cleanupFleets();
}
// Phase 2: after all battles are resolved
function endTurnFinish() {
  for (const emp of alive()) if (emp.ai) aiPostMove(emp);
  cleanupFleets();
  for (const emp of alive()) processEconomy(emp);
  repairAndRegen();
  for (const emp of alive()) for (const k in emp.rel) { const r = emp.rel[k]; if (r.status === 'war') r.warTurns++; }
  for (const emp of alive()) if (emp.ai) aiDiplomacy(emp);
  checkEliminations();
  S.turn++;
  recordHistory();
  checkVictory();
}
function endTurnAuto() { endTurnStart(); for (const sid of S.pendingBattles) autoBattle(sid); S.pendingBattles = []; endTurnFinish(); }
function moveFleets() {
  for (const f of S.fleets) {
    if (f.dest == null) continue;
    const d = ST(f.dest), spd = fleetSpeed(f);
    if (spd <= 0) { f.dest = null; continue; }
    f.from = f.star != null ? f.star : f.from;
    f.star = null;
    const L = hyp(f.x, f.y, d.x, d.y);
    if (L <= spd + 1e-6) {
      f.x = d.x; f.y = d.y; f.star = f.dest; f.dest = null; f.arrived = S.turn;
      const emp = E(f.owner); if (emp.explored) emp.explored[f.star] = true;
    } else { f.x += (d.x - f.x) / L * spd; f.y += (d.y - f.y) / L * spd; }
  }
  for (const emp of alive()) if (emp.ai) {
    const byStar = {};
    for (const f of S.fleets) if (f.owner === emp.id && f.star != null && f.dest == null) {
      const role = fleetRole(f); if (role !== 'war' && role !== 'transport') continue;
      const k = f.star + ':' + role; if (byStar[k]) mergeFleets(byStar[k], f); else byStar[k] = f;
    }
  }
  cleanupFleets();
}
function processEconomy(emp) {
  const t = empTotals(emp);
  if (t.foodNet < 0) {
    const tp = Math.max(1, t.pop);
    for (const pl of colonies(emp)) pl.col.pop = Math.max(1, pl.col.pop - (-t.foodNet) * 0.25 * pl.col.pop / tp);
    msg(emp.id, 'Food shortage of ' + (-t.foodNet) + '! Colonists are starving. Build farms (Hydroponic Bays, Agri-Domes) or settle fertile worlds.', null, 'warn');
  }
  processResearch(emp, t.rp);
  for (const pl of colonies(emp)) {
    const s = colStats(pl);
    processProduction(emp, pl, s.prod);
    const g = growthOf(emp, pl, s.maxPop);
    pl.col.pop = Math.max(1, pl.col.pop + (t.foodNet < 0 ? Math.min(0, g) : g));
  }
  emp.bc = r1(emp.bc + t.net);
  emp.broke = false;
  if (emp.bc < 0) { emp.bc = 0; emp.broke = true; msg(emp.id, 'The treasury is empty! Production is halved until income is positive. Scrap ships, demolish buildings or let colonies build Trade Goods.', null, 'warn'); }
}
function repairAndRegen() {
  for (const f of S.fleets) {
    const emp = E(f.owner);
    let rate = 0.1;
    if (f.owner === -1) rate = 0.1;
    else if (f.star != null) {
      const own = ST(f.star).planets.map(P).filter(p => p.owner === emp.id && !p.col.outpost);
      if (own.some(p => p.col.bld.shipyard)) rate = 1; else if (own.length) rate = 0.25;
    }
    if (f.owner !== -1 && has(emp, 'nanite_repair')) rate = Math.max(rate, 0.25);
    for (const s of f.ships) { const st = shipStats(emp, designOf(emp, s.d)); s.hp = Math.min(st.hp, Math.round(s.hp + st.hp * rate)); }
  }
  for (const p of S.planets) if (p.col && !p.col.outpost) { const m = planetDefMax(p); p.col.defHp = Math.min(m, p.col.defHp + Math.max(5, m * 0.25)); }
}
function checkEliminations() {
  for (const emp of alive()) {
    const colonyShips = S.fleets.some(f => f.owner === emp.id && f.ships.some(s => s.d === 's_colony'));
    if (!colonies(emp).length && !colonyShips) {
      emp.alive = false; emp.diedTurn = S.turn;
      for (const p of colonies(emp, true)) { p.owner = null; p.col = null; }
      S.fleets = S.fleets.filter(f => f.owner !== emp.id);
      if (emp.id !== 0) S.msgs.push({text: 'The ' + emp.name + ' have been wiped from the galaxy!', star: null, kind: 'war'});
    }
  }
}
function powerIndex(emp) {
  if (!emp.alive) return 0;
  return Math.round(empPop(emp) * 1.5 + empMilitary(emp) / 12 + Object.keys(emp.techs).length * 3 + colonies(emp, true).length * 2);
}
function recordHistory() {
  const row = {t: S.turn, p: {}};
  for (const e of S.empires) row.p[e.id] = powerIndex(e);
  S.hist.push(row);
}
function checkVictory() {
  if (S.over) return;
  if (!player().alive) { S.over = {result: 'defeat', why: 'Your empire has fallen. The last of your colonies is gone.', turn: S.turn}; return; }
  if (alive().length === 1) S.over = {result: 'victory', kind: 'conquest', why: 'Every rival empire has been destroyed. The galaxy is yours!', turn: S.turn};
}
function finalScore() {
  const p = player();
  const base = Math.round(empPop(p) * 2 + Object.keys(p.techs).length * 5 + colonies(p, true).length * 6 + empMilitary(p) / 20);
  let bonus = 0;
  if (S.over && S.over.result === 'victory') bonus = 400 + Math.max(0, 150 - S.turn) * 4;
  const rivals = S.empires.length - 1;
  const killed = S.empires.filter(e => e.id !== 0 && !e.alive).length;
  return {base, bonus, rivalBonus: killed * 60, total: base + bonus + killed * 60, rivals};
}
