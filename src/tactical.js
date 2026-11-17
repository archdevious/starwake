'use strict';
// ===================== STARWAKE — HEX TACTICAL BATTLES =====================
const BW = 17, BH = 11, MAX_ROUNDS = 30;
function offToCube(c, r) { const x = c - (r - (r & 1)) / 2; return [x, -x - r, r]; }
function hexDist(a, b) { const A = offToCube(a.c, a.r), B = offToCube(b.c, b.r); return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2])); }
const NB_EVEN = [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]], NB_ODD = [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]];
function hexNeighbors(c, r) { return (r & 1 ? NB_ODD : NB_EVEN).map(([dc, dr]) => [c + dc, r + dr]).filter(([x, y]) => x >= 0 && y >= 0 && x < BW && y < BH); }

function stackParties(sid) {
  const parties = {}; // owner -> {armed, any}
  for (const f of S.fleets) if (f.star === sid && f.dest == null && f.ships.length) {
    const p = parties[f.owner] = parties[f.owner] || {armed: false, any: false};
    p.any = true; if (armed(E(f.owner), f)) p.armed = true;
  }
  for (const pid of ST(sid).planets) {
    const pl = P(pid); if (pl.owner == null || pl.owner < 0) continue;
    const d = planetDef(pl); if (!d || pl.col.defHp <= 0) continue;
    const p = parties[pl.owner] = parties[pl.owner] || {armed: false, any: false};
    p.any = true; p.armed = true;
  }
  return parties;
}
function battleOwners(sid) {
  const parties = stackParties(sid); const ids = Object.keys(parties).map(Number); const inv = new Set();
  for (const a of ids) for (const b of ids) if (hostile(a, b) && parties[a].armed && parties[b].any) { inv.add(a); inv.add(b); }
  return [...inv];
}
function battleStars() {
  const stars = new Set();
  for (const f of S.fleets) if (f.star != null && f.dest == null) stars.add(f.star);
  return [...stars].filter(sid => battleOwners(sid).length >= 2);
}

function createBattle(sid, interactive) {
  const owners = battleOwners(sid);
  const B = {star: sid, round: 1, units: [], order: [], idx: 0, over: false, interactive, events: [], log: [], owners, uid: 0, retreated: {}, result: null};
  const hasPlanet = o => ST(sid).planets.some(pid => P(pid).owner === o && planetDef(P(pid)) && P(pid).col.defHp > 0);
  let left;
  if (owners.includes(0)) left = [0];
  else { const def = owners.find(hasPlanet); left = owners.filter(o => o !== (def != null ? def : owners[owners.length - 1])).slice(0, 1); }
  const sideOf = o => left.includes(o) ? 'L' : 'R';
  for (const f of S.fleets) {
    if (f.star !== sid || f.dest != null || !owners.includes(f.owner)) continue;
    const emp = E(f.owner);
    const groups = {};
    for (const s of f.ships) (groups[s.d] = groups[s.d] || []).push(s);
    for (const did in groups) {
      const d = designOf(emp, did), st = shipStats(emp, d);
      B.units.push({uid: B.uid++, owner: f.owner, side: sideOf(f.owner), kind: 'stack', name: d.name, hull: d.fixed ? 'monster' : (d.special || d.hull),
        did, ships: groups[did].map(s => ({ref: s, fleet: f, hp: s.hp})), all: null, maxHp: st.hp, attack: st.attack, defense: st.defense, shield: st.shield,
        speed: st.cspeed || 3, weapons: st.weapons.map(w => Object.assign({}, w, {ammoLeft: w.ammo})), ecm: !!st.ecm, drones: !!st.drones,
        civ: !st.weapons.length, alive: true, retreated: false, c: 0, r: 0, moved: false, fired: false, size: d.fixed ? 6 : d.hull ? HULLS[d.hull].size : 1});
    }
  }
  for (const pid of ST(sid).planets) {
    const pl = P(pid); if (!owners.includes(pl.owner)) continue;
    const d = planetDef(pl); if (!d || pl.col.defHp <= 0) continue;
    B.units.push({uid: B.uid++, owner: pl.owner, side: sideOf(pl.owner), kind: 'planet', name: planetName(pl), hull: 'planet', ptype: pl.type, pid,
      ships: [], hp: pl.col.defHp, maxHp: d.maxHp, attack: d.attack, defense: d.defense, shield: d.shield, speed: 0,
      weapons: d.weapons.map(w => Object.assign({}, w, {ammoLeft: 0})), civ: false, alive: true, retreated: false, c: 0, r: 0, size: 6});
  }
  for (const u of B.units) if (u.kind === 'stack') u.all = u.ships.slice();
  placeUnits(B);
  for (const u of B.units) { u.hp0 = unitHp(u); u.count0 = u.kind === 'stack' ? u.ships.length : 1; }
  newRoundOrder(B);
  return B;
}
function placeUnits(B) {
  const rowsOrder = [5, 4, 6, 3, 7, 2, 8, 1, 9, 0, 10];
  const occ = new Set();
  for (const side of ['L', 'R']) {
    const us = B.units.filter(u => u.side === side);
    const planets = us.filter(u => u.kind === 'planet');
    planets.forEach((u, i) => { u.c = side === 'L' ? 0 : BW - 1; u.r = [5, 2, 8, 0, 10][i % 5]; occ.add(u.c + ',' + u.r); });
    const ships = us.filter(u => u.kind === 'stack').sort((a, b) => (a.civ - b.civ) || (b.size - a.size));
    const cols = side === 'L' ? [3, 2, 1, 4, 0] : [BW - 4, BW - 3, BW - 2, BW - 5, BW - 6];
    let k = 0;
    for (const u of ships) {
      let placed = false;
      const colList = u.civ ? cols.slice().reverse().slice(1).concat(cols.slice(-1)) : cols;
      for (const c of colList) { for (const r of rowsOrder) { if (!occ.has(c + ',' + r)) { u.c = c; u.r = r; occ.add(c + ',' + r); placed = true; break; } } if (placed) break; }
      if (!placed) { u.c = cols[0]; u.r = k++ % BH; }
    }
  }
}
function unitHp(u) { return u.kind === 'planet' ? Math.max(0, u.hp) : u.ships.reduce((a, s) => a + Math.max(0, s.hp), 0); }
function unitDpr(u) { let d = 0; for (const w of u.weapons) if (w.type !== 'missile' || w.ammoLeft > 0) d += w.n * (u.kind === 'stack' ? u.ships.length : 1) * (w.dmg[0] + w.dmg[1]) / 2 * 0.6; return d; }
function activeUnits(B) { return B.units.filter(u => u.alive && !u.retreated); }
function unitCanShoot(u) { return u.alive && !u.retreated && u.weapons.some(w => w.type !== 'missile' || w.ammoLeft > 0); }
function battleContinues(B) {
  const us = activeUnits(B);
  for (const a of us) { if (!unitCanShoot(a)) continue; for (const b of us) if (hostile(a.owner, b.owner)) return true; }
  return false;
}
function newRoundOrder(B) {
  B.order = activeUnits(B).slice().sort((a, b) => (b.speed - a.speed) || (rnd() - 0.5));
  // interleave sides so neither side gets all its moves first
  const L = B.order.filter(u => u.side === 'L'), Rr = B.order.filter(u => u.side === 'R');
  const out = []; const first = rnd() < 0.5 ? [L, Rr] : [Rr, L];
  while (first[0].length || first[1].length) { if (first[0].length) out.push(first[0].shift()); if (first[1].length) out.push(first[1].shift()); }
  B.order = out; B.idx = 0;
  for (const u of B.units) { u.moved = false; u.fired = false; }
}
function occupiedMap(B, except) { const m = new Set(); for (const u of activeUnits(B)) if (u !== except) m.add(u.c + ',' + u.r); return m; }
function reachable(B, u) {
  const occ = occupiedMap(B, u); const dist = new Map(); const key = (c, r) => c + ',' + r;
  dist.set(key(u.c, u.r), 0); let frontier = [[u.c, u.r]];
  if (u.moved || u.kind === 'planet') return dist;
  for (let d = 1; d <= u.speed; d++) {
    const next = [];
    for (const [c, r] of frontier) for (const [nc, nr] of hexNeighbors(c, r)) { const k = key(nc, nr); if (dist.has(k) || occ.has(k)) continue; dist.set(k, d); next.push([nc, nr]); }
    frontier = next;
  }
  return dist;
}
function enemiesOf(B, u) { return activeUnits(B).filter(t => hostile(u.owner, t.owner)); }
function maxRange(u) { let m = 0; for (const w of u.weapons) if (w.type !== 'missile' || w.ammoLeft > 0) m = Math.max(m, w.range); return m; }
function targetsInRange(B, u, from) { const pos = from || u; const mr = maxRange(u); return enemiesOf(B, u).filter(t => hexDist(pos, t) <= mr); }
function hitChance(u, t, w, d) {
  let hc = 0.6 + 0.1 * (u.attack - t.defense);
  if (d > Math.ceil(w.range / 2)) hc -= 0.1;
  if (w.type === 'missile') hc += t.ecm ? -0.3 : 0.1;
  if (t.kind === 'planet') hc += 0.15;
  return clamp(hc, 0.05, 0.95);
}
function moveUnit(B, u, c, r) {
  if (u.moved) return false;
  const reach = reachable(B, u); if (!reach.has(c + ',' + r)) return false;
  const from = {c: u.c, r: u.r};
  u.c = c; u.r = r; u.moved = true;
  if (from.c !== c || from.r !== r) B.events.push({type: 'move', uid: u.uid, from, to: {c, r}});
  return true;
}
function fireAt(B, u, t) {
  if (u.fired || !t.alive || t.retreated) return false;
  const d = hexDist(u, t);
  let any = false;
  const mult = u.kind === 'stack' ? u.ships.length : 1;
  for (const w of u.weapons) {
    if (d > w.range) continue;
    if (w.type === 'missile') { if (w.ammoLeft <= 0) continue; w.ammoLeft--; }
    any = true;
    const shots = w.n * mult; let hits = 0, dmg = 0, kills = 0;
    const hc = hitChance(u, t, w, d);
    for (let i = 0; i < shots && t.alive; i++) {
      if (rnd() >= hc) continue;
      hits++;
      const sh = w.type === 'missile' ? Math.floor(t.shield / 2) : t.shield;
      const dd = Math.max(0, ri(w.dmg[0], w.dmg[1]) - sh);
      if (dd <= 0) continue;
      dmg += dd;
      if (t.kind === 'planet') { t.hp -= dd; if (t.hp <= 0) { t.hp = 0; t.alive = false; kills++; } }
      else { const s = t.ships[0]; s.hp -= dd; if (s.hp <= 0) { t.ships.shift(); kills++; if (!t.ships.length) t.alive = false; } }
    }
    B.events.push({type: 'fire', a: u.uid, t: t.uid, w: w.name, color: w.color, missile: w.type === 'missile', shots, hits, dmg, kills, dead: !t.alive});
  }
  if (any) u.fired = true;
  return any;
}
function retreatOwner(B, owner) {
  for (const u of B.units) if (u.owner === owner && u.kind === 'stack' && u.alive && !u.retreated) { u.retreated = true; B.events.push({type: 'retreat', uid: u.uid}); }
  B.retreated[owner] = true;
  B.log.push(E(owner).name + ' retreat from battle.');
}
// --- AI for a single unit ---
function aiPickTarget(B, u, list) {
  if (!list.length) return null;
  const skill = S.skill;
  if (skill === 'relaxed') return pick(list);
  let best = null, bs = -1e9;
  for (const t of list) {
    const hp = unitHp(t); const d = hexDist(u, t);
    let s = -d * 2 + (t.civ ? -4 : 3) + (t.kind === 'planet' ? 2 : 0);
    if (skill === 'cunning') s += 30 * Math.min(1, unitDpr(u) / Math.max(1, hp)) + unitDpr(t) / 10;
    else s += 10 * Math.min(1, unitDpr(u) / Math.max(1, hp));
    if (s > bs) { bs = s; best = t; }
  }
  return best;
}
function aiActUnit(B, u) {
  const enemies = enemiesOf(B, u);
  if (!enemies.length) return;
  if (u.kind !== 'planet' && !u.moved) {
    const reach = reachable(B, u);
    if (u.civ) {
      // unarmed ships flee from enemies
      let best = null, bs = -1e9;
      for (const [k] of reach) { const [c, r] = k.split(',').map(Number); const dmin = Math.min(...enemies.map(t => hexDist({c, r}, t))); if (dmin > bs) { bs = dmin; best = [c, r]; } }
      if (best) moveUnit(B, u, best[0], best[1]);
      return;
    }
    const T = aiPickTarget(B, u, enemies);
    if (T) {
      const hasMis = u.weapons.some(w => w.type === 'missile' && w.ammoLeft > 0);
      const beamR = Math.max(0, ...u.weapons.filter(w => w.type === 'beam').map(w => w.range));
      const pr = hasMis && !beamR ? maxRange(u) - 1 : Math.max(1, Math.ceil(beamR / 2));
      let best = null, bs = -1e9;
      for (const [k, steps] of reach) {
        const [c, r] = k.split(',').map(Number); const d = hexDist({c, r}, T);
        let s = -Math.abs(d - pr) * 3 - steps * 0.2;
        if (d <= maxRange(u)) s += 10;
        // stay away from many enemies when fragile
        if (S.skill === 'cunning') for (const e of enemies) if (e !== T && hexDist({c, r}, e) <= maxRange(e)) s -= unitDpr(e) / Math.max(20, unitHp(u)) * 2;
        if (s > bs) { bs = s; best = [c, r]; }
      }
      if (best) moveUnit(B, u, best[0], best[1]);
    }
  }
  const inR = targetsInRange(B, u);
  const t = aiPickTarget(B, u, inR);
  if (t) fireAt(B, u, t);
}
function sidePower(B, owner) {
  let hp = 0, dpr = 0;
  for (const u of activeUnits(B)) if (u.owner === owner) { hp += unitHp(u); dpr += unitDpr(u); }
  return powerOf(hp, dpr);
}
function endRound(B) {
  B.round++;
  for (const u of activeUnits(B)) if (u.drones) for (const s of u.ships) s.hp = Math.min(u.maxHp, s.hp + Math.ceil(u.maxHp * 0.1));
  // AI retreat decisions
  for (const o of B.owners) {
    if (o === -1 || B.retreated[o] || (o === 0 && B.interactive && !B.autoPlayer)) continue;
    if (!activeUnits(B).some(u => u.owner === o && u.kind === 'stack')) continue;
    let enemy = 0; for (const x of B.owners) if (hostile(o, x)) enemy += sidePower(B, x);
    const mine = sidePower(B, o);
    if (B.round >= 3 && mine < enemy * 0.35 && (o !== 0 || B.autoPlayer)) retreatOwner(B, o);
  }
  if (!battleContinues(B)) { B.over = true; return; }
  if (B.round > MAX_ROUNDS) { B.over = true; B.timeout = true; return; }
  newRoundOrder(B);
}
// Advance until player input is needed. Returns 'input', 'anim' or 'over'.
function battleStep(B) {
  while (!B.over) {
    if (B.idx >= B.order.length) { endRound(B); B.events.push({type: 'round', round: B.round}); if (B.over) break; if (B.interactive) return 'anim'; continue; }
    const u = B.order[B.idx];
    if (!u.alive || u.retreated) { B.idx++; continue; }
    if (!battleContinues(B)) { B.over = true; break; }
    if (u.owner === 0 && u.kind === 'stack' && B.interactive && !B.autoPlayer) { B.active = u; return 'input'; }
    B.active = u;
    aiActUnit(B, u); B.idx++;
    if (B.interactive && B.events.length) return 'anim';
  }
  return 'over';
}
function playerEndUnit(B) { B.idx++; B.active = null; }
function runAutoBattle(B) { B.autoPlayer = true; let guard = 0; while (!B.over && guard++ < 20000) battleStep(B); B.events = []; }
function autoBattle(sid) { const B = createBattle(sid, false); B.autoPlayer = true; runAutoBattle(B); return finishBattle(B); }

function retreatDest(emp, sid, fromStar) {
  let best = null, bd = 1e9; const s = ST(sid);
  for (const p of colonies(emp, true)) { if (p.star === sid) continue; const t = ST(p.star); const d = hyp(t.x, t.y, s.x, s.y); if (d < bd) { bd = d; best = p.star; } }
  if (best == null && fromStar != null && fromStar !== sid) best = fromStar;
  return best;
}
function finishBattle(B) {
  const sid = B.star, star = ST(sid);
  if (B.timeout) {
    // after the round limit, every side without a colony here withdraws
    for (const o of B.owners) if (o !== -1 && !ST(sid).planets.some(pid => P(pid).owner === o)) for (const u of B.units) if (u.owner === o && u.alive && u.kind === 'stack') u.retreated = true;
  }
  const lost = {}, had = {};
  for (const u of B.units) {
    if (u.kind === 'planet') { P(u.pid).col.defHp = Math.max(0, Math.round(u.hp)); continue; }
    had[u.owner] = (had[u.owner] || 0) + u.count0; lost[u.owner] = (lost[u.owner] || 0) + (u.count0 - u.ships.length);
    for (const s of u.ships) s.ref.hp = Math.max(1, Math.round(s.hp));
    for (const e of u.all) if (!u.ships.includes(e)) e.fleet.ships = e.fleet.ships.filter(s => s !== e.ref);
  }
  // retreating ships leave the system
  for (const o of B.owners) {
    if (o === -1) continue;
    const ret = B.units.filter(u => u.owner === o && u.kind === 'stack' && u.retreated && u.ships.length);
    if (!ret.length) continue;
    const ids = new Set(); ret.forEach(u => u.ships.forEach(s => ids.add(s.ref.id)));
    const emp = E(o);
    const src = S.fleets.filter(f => f.star === sid && f.owner === o);
    const from = src.length ? src[0].from : null;
    const dest = retreatDest(emp, sid, from);
    const nf = {id: nid(), owner: o, ships: [], star: null, x: star.x + 0.01, y: star.y + 0.01, dest, from: sid};
    for (const f of src) { nf.ships.push(...f.ships.filter(s => ids.has(s.id))); f.ships = f.ships.filter(s => !ids.has(s.id)); }
    if (dest == null) { nf.star = sid; nf.x = star.x; nf.y = star.y; }
    if (nf.ships.length) S.fleets.push(nf);
  }
  cleanupFleets();
  const report = {star: sid, rounds: B.round - 1, owners: B.owners, lost, had, units: B.units.map(u => ({owner: u.owner, name: u.name, kind: u.kind, count0: u.count0, count: u.kind === 'stack' ? u.ships.length : (u.alive ? 1 : 0), alive: u.alive, retreated: u.retreated}))};
  if (B.owners.includes(0)) {
    const foes = B.owners.filter(o => o !== 0).map(o => E(o).name).join(', ');
    const enemyLost = Object.keys(lost).filter(k => +k !== 0).reduce((a, k) => a + lost[k], 0);
    msg(0, 'Battle at ' + star.name + ' against ' + foes + ': we lost ' + (lost[0] || 0) + ' of ' + (had[0] || 0) + ' ships; they lost ' + enemyLost + '.', sid, 'war');
  }
  return report;
}
