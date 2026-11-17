'use strict';
// ===================== STARWAKE — AI EMPIRES =====================
const AI_TECH_W = {
  orbital_smelter: 10, xeno_lab: 9, agri_domes: 6, habitat_ring: 7, clone_vats: 6, hostile_habitats: 5, exchange_spire: 7,
  ion_drive: 6, fuel_cells: 6, fusion_drive: 5, subspace_tanks: 5, arcology: 6, quantum_archive: 8, core_tap: 8, free_port: 6,
  weather_grid: 5, terraforming: 4, gene_crafting: 6, galactic_bank: 5, neural_net: 7, unified_government: 6, imperial_charter: 7,
  protein_vats: 5, xeno_relations: 3, civil_engineering: 4, sentient_core: 6,
};
const MIL_TECH = new Set(['defense_battery', 'ceramite_armor', 'reinforced_frames', 'orbital_bastion', 'lattice_armor', 'hardened_colonies', 'planetary_citadel',
  'voidsteel_armor', 'bastion_frames', 'railgun', 'hunter_missile', 'ion_lance', 'assault_armor', 'graviton_shear', 'swarm_torpedo', 'plasma_torrent', 'heavy_mounts',
  'nova_torpedo', 'drop_pods', 'singularity_cannon', 'fire_control_ai', 'barrier_1', 'shield_lattice', 'barrier_2', 'personal_shields', 'barrier_3', 'nanite_repair',
  'barrier_4', 'aegis_dome', 'barrier_5', 'hardlight_shields', 'targeting_1', 'targeting_2', 'ecm_suite', 'targeting_3', 'targeting_4', 'targeting_5',
  'vector_thrusters', 'phase_dampers', 'war_college', 'barracks']);

function atWar(emp) { return alive().filter(o => o !== emp && emp.rel[o.id].status === 'war'); }
function aiPickResearch(emp) {
  const av = availableTechs(emp); if (!av.length) return;
  const war = atWar(emp).length > 0; const aggr = R(emp).aggressive || 1;
  const fewStars = S.stars.filter(s => inRange(emp, s.id)).length < 8;
  let best = null, bs = -1e9;
  for (const t of av) {
    let w = AI_TECH_W[t.tech] || 4;
    if (MIL_TECH.has(t.tech)) w = (war ? 8 : 5) * aggr;
    if (['fuel_cells', 'subspace_tanks'].includes(t.tech) && fewStars) w = 30;
    if (t.tech === 'hostile_habitats' && aiColonyTargets(emp, false).length < 2) w = 14;
    const noise = S.skill === 'relaxed' ? 0.6 + rnd() * 0.8 : 0.8 + rnd() * 0.4;
    const s = w * noise / Math.pow(t.cost, 0.9);
    if (s > bs) { bs = s; best = t; }
  }
  emp.res = {tech: best.tech, prog: 0};
}
function aiDesigns(emp) {
  const A = emp.aiData; if (A.lastDesignVer === emp.techVer) return;
  A.lastDesignVer = emp.techVer;
  const hulls = HULL_ORDER.filter(h => avail(emp, HULLS[h].tech));
  const keep = hulls.slice(-3);
  for (const h of keep) {
    const nd = autoDesign(emp, h);
    const cur = emp.designs.find(d => d.hull === h && !d.obsolete);
    const same = cur && cur.armor === nd.armor && cur.shield === nd.shield && cur.comp === nd.comp && JSON.stringify(cur.weapons) === JSON.stringify(nd.weapons) && JSON.stringify(cur.mods || []) === JSON.stringify(nd.mods);
    if (!same) { if (cur) cur.obsolete = true; addDesign(emp, nd); }
  }
  for (const d of emp.designs) if (d.hull && !keep.includes(d.hull)) d.obsolete = true;
  emp.designs = emp.designs.filter(d => !d.obsolete || designInUse(emp, d.id));
}
function bestWarDesign(emp, pl, prod) {
  const ds = emp.designs.filter(d => d.hull && !d.obsolete && !shipReason(emp, pl, d)).sort((a, b) => HULLS[b.hull].space - HULLS[a.hull].space);
  for (const d of ds) if (designCost(emp, d) <= Math.max(prod, 3) * 12) return d;
  return ds[ds.length - 1];
}
function knownMonster(emp, starId) { return emp.explored[starId] && S.fleets.some(f => f.star === starId && f.owner === -1); }
function starThreat(emp, starId) {
  let hp = 0, dpr = 0;
  for (const f of S.fleets) if (f.star === starId && hostile(emp.id, f.owner)) { const o = E(f.owner); for (const s of f.ships) { const st = shipStats(o, designOf(o, s.d)); hp += s.hp; dpr += st.dpr; } }
  for (const pid of ST(starId).planets) { const p = P(pid); if (p.owner != null && hostile(emp.id, p.owner)) { const d = planetDef(p); if (d) { hp += d.maxHp; dpr += d.dpr; } } }
  return powerOf(hp, dpr);
}
function fleetsPower(fs) { let hp = 0, dpr = 0; for (const f of fs) { const emp = E(f.owner); for (const s of f.ships) { const st = shipStats(emp, designOf(emp, s.d)); hp += s.hp; dpr += st.dpr; } } return powerOf(hp, dpr); }
function aiColonyTargets(emp, outposts) {
  const cap = P(emp.capital); const cs = cap ? ST(cap.star) : ST(0);
  const out = [];
  for (const p of S.planets) {
    if (p.star < 0 || !emp.explored[p.star]) continue;
    if (p.owner != null && !(p.owner === emp.id && p.col.outpost && !outposts)) continue;
    if (knownMonster(emp, p.star) || !inRange(emp, p.star)) continue;
    if (S.fleets.some(f => f.star === p.star && f.owner >= 0 && hostile(emp.id, f.owner) && armed(E(f.owner), f))) continue;
    const st = ST(p.star); const mp = maxPop(emp, p);
    if (!outposts) {
      if (mp < 2 && !(mp >= 1 && p.special)) continue;
      out.push({p, score: mp * 1.5 + p.minerals * 1.5 + SIZE_SLOTS[p.size] + (p.special ? 5 : 0) + baseFert(emp, p) * 3 - hyp(st.x, st.y, cs.x, cs.y) * 0.3});
    } else {
      if (p.owner != null) continue;
      if (mp >= 2 && !PT[p.type].outpostOnly) continue;
      const presence = st.planets.some(pid => P(pid).owner === emp.id);
      out.push({p, score: 3 + p.minerals + (presence ? 0 : 6) - hyp(st.x, st.y, cs.x, cs.y) * 0.25});
    }
  }
  return out.sort((a, b) => b.score - a.score);
}
function countRole(emp, role) {
  let n = 0;
  for (const f of S.fleets) if (f.owner === emp.id) for (const s of f.ships) if ((designOf(emp, s.d).special || 'war') === role) n++;
  for (const p of colonies(emp)) for (const q of p.col.queue) if (q.kind === 'ship') { const d = designOf(emp, q.id); if (d && (d.special || 'war') === role) n += q.n || 1; }
  return n;
}
function isBorder(emp, pl) {
  const s = ST(pl.star);
  return S.planets.some(p => p.owner != null && p.owner !== emp.id && p.owner >= 0 && p.star >= 0 && emp.rel[p.owner] && emp.rel[p.owner].contact && hyp(ST(p.star).x, ST(p.star).y, s.x, s.y) < 8);
}
function aiRole(emp, pl) {
  const c = pl.col;
  if (c.capital) return 'capital';
  if (c.aiRole) return c.aiRole;
  const f = baseFert(emp, pl);
  c.aiRole = pl.minerals >= 3 ? 'industry' : f >= 1.25 && pl.size >= 3 ? 'food' : pl.size >= 4 ? 'science' : pick(['trade', 'science', 'industry']);
  return c.aiRole;
}
const AI_BUILD = {
  capital:  ['foundry', 'research_station', 'market', 'orbital_smelter', 'xeno_lab', 'drydock', 'habitat_ring', 'exchange_spire', 'core_tap', 'quantum_archive'],
  industry: ['foundry', 'shipyard', 'orbital_smelter', 'drydock', 'habitat_ring', 'core_tap', 'clone_vats'],
  science:  ['research_station', 'xeno_lab', 'habitat_ring', 'quantum_archive', 'clone_vats', 'market'],
  trade:    ['market', 'exchange_spire', 'habitat_ring', 'free_port', 'research_station'],
  food:     ['agri_domes', 'hydroponic_bays', 'weather_grid', 'protein_vats', 'habitat_ring', 'market'],
};
function aiPickBuilding(emp, pl, s, ctx) {
  const c = pl.col, pop = c.pop;
  const can = id => canBuildBld(emp, pl, id);
  const free = slotsOf(pl) - slotsUsed(pl);
  if (free <= 0) {
    if (pop >= s.maxPop - 1) { if (canProject(emp, pl, 'gaia')) return {kind: 'proj', id: 'gaia'}; if (canProject(emp, pl, 'terraform')) return {kind: 'proj', id: 'terraform'}; }
    return null;
  }
  if (ctx.food < 0 && pop >= 2) { for (const id of ['agri_domes', 'hydroponic_bays', 'protein_vats']) if (can(id)) return {kind: 'bld', id}; }
  const border = ctx.war && isBorder(emp, pl);
  if (border && pop >= 4 && free >= 2) for (const id of ['defense_battery', 'shield_lattice', 'orbital_bastion']) if (can(id)) return {kind: 'bld', id};
  if (c.capital && S.turn > 40 && free >= 2 && can('defense_battery')) return {kind: 'bld', id: 'defense_battery'};
  const role = aiRole(emp, pl);
  for (const id of AI_BUILD[role]) {
    if (!can(id)) continue;
    if (id === 'shipyard' && (pop < 3 || ctx.yards >= 1 + Math.floor(ctx.cols / 4))) continue;
    if (id === 'habitat_ring' && pop < s.maxPop - 1.5) continue;
    if (id === 'arcology' && pop < s.maxPop - 1.5) continue;
    if (id === 'clone_vats' && (s.maxPop < 10 || pop > s.maxPop * 0.6)) continue;
    if (pop < 2 && id !== 'agri_domes' && id !== 'hydroponic_bays') continue;
    if (ctx.net < -3 && BUILDINGS[id].up > 0 && !['market', 'exchange_spire', 'free_port'].includes(id)) continue;
    if (id === 'shipyard') ctx.yards++;
    return {kind: 'bld', id};
  }
  return null;
}
function aiProduction(emp) {
  const t = empTotals(emp);
  const war = atWar(emp);
  const cols = colonies(emp).map(pl => ({pl, s: colStats(pl)})).sort((a, b) => b.s.prod - a.s.prod);
  const ct = aiColonyTargets(emp, false), ot = aiColonyTargets(emp, true);
  const unexplored = S.stars.filter(s => !emp.explored[s.id] && inRange(emp, s.id) && !knownMonster(emp, s.id)).length;
  const aggr = R(emp).aggressive || 1;
  const want = {
    colony: Math.min(cols.length < 4 ? 3 : 2, ct.length) - countRole(emp, 'colony'),
    outpost: Math.min(2, ot.length, Math.ceil(cols.length * 1.2) - colonies(emp, true).filter(p => p.col.outpost).length) - countRole(emp, 'outpost'),
    scout: (S.turn < 40 && unexplored > 0 ? 2 : 0) - countRole(emp, 'scout'),
    war: Math.floor((2 + S.turn / 5 * aggr) * (war.length ? 1.6 : 1)) - countRole(emp, 'war'),
    transport: 0,
  };
  if (t.net < 1 && emp.bc < 40) want.war = Math.min(want.war, 0);
  if (emp.bc > 300) want.war += 2;
  if (t.ship > (t.bc + t.trade) * 0.45 && emp.bc < 500) want.war = Math.min(want.war, 0);
  const A = emp.aiData;
  if (war.length) {
    let need = 4;
    if (A.target != null) { const tp = P(A.target); if (tp.owner != null && tp.owner >= 0 && tp.owner !== emp.id) need = Math.ceil(garrison(tp) * 1.4 / (has(emp, 'drop_pods') ? 8 : 4)); }
    want.transport = Math.min(8, need) - countRole(emp, 'transport');
  }
  const ctx = {food: t.foodNet, net: t.net, war: war.length > 0, cols: cols.length, yards: colonies(emp).filter(p => p.col.bld.shipyard || p.col.queue.some(q => q.id === 'shipyard')).length};
  cols.forEach(({pl, s}) => {
    const c = pl.col;
    if (c.queue.length) return;
    const yard = !!c.bld.shipyard;
    const shipFor = role => {
      if (!yard || want[role] <= 0) return null;
      const did = role === 'war' ? (bestWarDesign(emp, pl, s.prod) || {}).id : 's_' + role;
      if (!did) return null;
      want[role]--; return {kind: 'ship', id: did, n: 1};
    };
    let it = null;
    if (yard) it = shipFor('colony') || shipFor('scout') || (war.length ? shipFor('war') || shipFor('transport') : null) || shipFor('outpost') ||
      (rnd() < 0.5 ? shipFor('war') : null) || aiPickBuilding(emp, pl, s, ctx) || shipFor('war');
    else it = aiPickBuilding(emp, pl, s, ctx);
    if (it) c.queue.push(it);
  });
}
function aiBuy(emp) {
  const reserve = 60 + colonies(emp).length * 10;
  if (emp.bc < reserve + 60) return;
  const cols = colonies(emp).filter(p => p.col.queue.length).sort((a, b) => (b.col.queue[0].kind === 'ship') - (a.col.queue[0].kind === 'ship') || b.col.pop - a.col.pop);
  let n = 0;
  for (const p of cols) { const c = buyCost(emp, p); if (c > 0 && emp.bc - c >= reserve) { buyItem(emp, p); if (++n >= 3) return; } }
}
function aiTurn(emp) {
  aiDesigns(emp);
  aiProduction(emp);
  aiFleets(emp);
  if (S.skill !== 'relaxed') aiBuy(emp);
  const t = empTotals(emp);
  if (emp.bc < 10 && t.net < 0) {
    for (const f of S.fleets) if (f.owner === emp.id) { const i = f.ships.findIndex(s => { const d = designOf(emp, s.d); return d.obsolete || d.special === 'scout'; }); if (i >= 0) { f.ships.splice(i, 1); break; } }
    cleanupFleets();
  }
}
function aiFleets(emp) {
  for (const f of S.fleets.filter(x => x.owner === emp.id && x.dest == null && x.star != null)) {
    if (fleetRole(f) !== 'mixed') continue;
    const roles = {}; for (const s of f.ships) { const r = shipRole(emp, s); (roles[r] = roles[r] || []).push(s.id); }
    const keys = Object.keys(roles); for (let i = 1; i < keys.length; i++) splitFleet(f, roles[keys[i]]);
  }
  const mine = () => S.fleets.filter(x => x.owner === emp.id);
  const targeted = new Set();
  for (const f of mine()) if (f.dest != null && fleetRole(f) === 'scout') targeted.add(f.dest);
  for (const f of mine()) {
    if (fleetRole(f) !== 'scout' || f.dest != null) continue;
    let best = null, bd = 1e9;
    for (const s of S.stars) { if (emp.explored[s.id] || targeted.has(s.id) || !inRange(emp, s.id)) continue; const d = hyp(f.x, f.y, s.x, s.y); if (d < bd) { bd = d; best = s; } }
    if (best) { orderMove(f, best.id); targeted.add(best.id); }
  }
  for (const role of ['colony', 'outpost']) {
    const tl = aiColonyTargets(emp, role === 'outpost');
    const taken = new Set();
    for (const f of mine()) if (fleetRole(f) === role && f.target != null) { const p = P(f.target); if (tl.find(x => x.p === p)) taken.add(p.id); else f.target = null; }
    for (const f of mine()) {
      if (fleetRole(f) !== role || f.target != null) continue;
      let best = null, bs = -1e9;
      for (const x of tl) { if (taken.has(x.p.id)) continue; const st = ST(x.p.star); const sc = x.score - hyp(f.x, f.y, st.x, st.y) * 0.4; if (sc > bs) { bs = sc; best = x.p; } }
      if (best) { f.target = best.id; taken.add(best.id); }
    }
    for (const f of mine()) if (fleetRole(f) === role && f.target != null && f.star !== P(f.target).star && (f.dest == null || f.dest !== P(f.target).star)) orderMove(f, P(f.target).star);
  }
  aiWarFleets(emp);
}
function aiWarFleets(emp) {
  const A = emp.aiData;
  const wars = atWar(emp);
  const cols = colonies(emp, true);
  if (!cols.length) return;
  const cap = P(emp.capital) && P(emp.capital).owner === emp.id ? P(emp.capital) : cols[0];
  let rally = cap.star;
  if (wars.length) {
    let bd = 1e9;
    for (const p of colonies(emp)) { const s = ST(p.star); for (const q of S.planets) if (q.owner != null && wars.some(w => w.id === q.owner) && emp.explored[q.star]) { const d = hyp(s.x, s.y, ST(q.star).x, ST(q.star).y); if (d < bd) { bd = d; rally = p.star; } } }
  }
  A.rally = rally;
  const war = S.fleets.filter(f => f.owner === emp.id && fleetRole(f) === 'war');
  const trans = S.fleets.filter(f => f.owner === emp.id && fleetRole(f) === 'transport');
  const idle = war.filter(f => f.dest == null);
  if (A.target != null) { const tp = P(A.target); if (tp.owner == null || tp.owner === emp.id || tp.owner < 0 || !hostile(emp.id, tp.owner)) A.target = null; }
  const cs = scanCircles(emp);
  const threats = S.fleets.filter(f => f.owner >= 0 && hostile(emp.id, f.owner) && armed(E(f.owner), f) && inCircles(cs, f.x, f.y));
  const used = new Set();
  for (const th of threats) {
    let near = null, nd = 1e9;
    for (const p of colonies(emp)) { const s = ST(p.star); const d = hyp(s.x, s.y, th.x, th.y); if (d < nd) { nd = d; near = p; } }
    if (!near || nd > 5) continue;
    const tp = fleetPower(th) * 1.2;
    const ns = ST(near.star);
    const cand = idle.filter(f => !used.has(f.id) && fleetPower(f) > tp).sort((a, b) => hyp(a.x, a.y, ns.x, ns.y) - hyp(b.x, b.y, ns.x, ns.y))[0];
    if (cand) { used.add(cand.id); if (cand.star !== near.star) orderMove(cand, near.star); }
  }
  if (wars.length) {
    const atRally = idle.filter(f => f.star === rally && !used.has(f.id));
    const rallyPow = fleetsPower(atRally);
    const margin = S.skill === 'cunning' ? 1.5 : S.skill === 'relaxed' ? 1.1 : 1.3;
    if (A.target == null) {
      let best = null, bs = -1e9; const rs = ST(rally);
      for (const p of S.planets) {
        if (p.owner == null || p.owner < 0 || !wars.some(w => w.id === p.owner) || !emp.explored[p.star] || !inRange(emp, p.star)) continue;
        const d = starThreat(emp, p.star);
        const sc = (p.col.outpost ? 3 : p.col.pop * 2 + (p.col.capital ? 6 : 0)) - hyp(rs.x, rs.y, ST(p.star).x, ST(p.star).y) * 0.8 - d * 0.05;
        if (rallyPow >= d * margin + 3 && sc > bs) { bs = sc; best = p; }
      }
      if (best) A.target = best.id;
    }
    if (A.target != null) {
      const tp = P(A.target);
      const here = war.filter(f => f.star === tp.star && f.dest == null);
      const enroute = war.filter(f => f.dest === tp.star);
      if (!here.length && !enroute.length) {
        if (rallyPow >= starThreat(emp, tp.star) * margin + 2) {
          for (const f of atRally) orderMove(f, tp.star);
          for (const f of trans) if (f.dest == null && f.star === rally) orderMove(f, tp.star);
        }
      } else if (here.length && !hostileArmedAt(emp.id, tp.star)) for (const f of trans) if (f.dest == null && f.star !== tp.star) orderMove(f, tp.star);
    }
  } else if (S.turn > 35) {
    const atRally = idle.filter(f => f.star === rally && !used.has(f.id));
    const pw = fleetsPower(atRally);
    for (const f of S.fleets) {
      if (f.owner !== -1 || !emp.explored[f.star] || !inRange(emp, f.star)) continue;
      if (pw > fleetPower(f) * 1.8 + 5) { for (const x of atRally) orderMove(x, f.star); break; }
    }
  }
  const tstar = A.target != null ? P(A.target).star : null;
  for (const f of war) {
    if (f.dest != null || used.has(f.id) || f.star === rally || f.star === tstar) continue;
    if (S.fleets.some(m => m.owner === -1 && m.star === f.star)) continue;
    orderMove(f, rally);
  }
  for (const f of trans) if (f.dest == null && f.star !== rally && f.star !== tstar) orderMove(f, rally);
}
function aiPostMove(emp) {
  for (const f of S.fleets.slice()) {
    if (f.owner !== emp.id || f.dest != null || f.star == null || !f.ships.length) continue;
    const role = fleetRole(f);
    if ((role === 'colony' || role === 'outpost') && f.target != null) {
      const p = P(f.target);
      if (p.star === f.star && !colonizeCheck(emp, f, p)) { colonize(emp, f, p, role === 'outpost'); f.target = null; }
    }
  }
  for (const f of S.fleets.slice()) {
    if (f.owner !== emp.id || f.dest != null || f.star == null || !f.ships.length) continue;
    for (const pid of ST(f.star).planets) {
      const p = P(pid);
      if (p.owner == null || p.owner === emp.id || p.owner < 0) continue;
      if (invadeCheck(emp, f, p)) continue;
      if (p.col.outpost || fleetTroops(f) >= garrison(p) * 1.25) invade(emp, f, p);
      if (!f.ships.length) break;
    }
  }
  cleanupFleets();
}
function aiDiplomacy(emp) {
  const aggr = R(emp).aggressive || 1;
  const myS = empStrength(emp);
  const wars = atWar(emp).length;
  for (const o of alive()) {
    if (o === emp) continue;
    const rel = emp.rel[o.id]; if (!rel.contact) continue;
    const border = colonies(emp, true).some(p => colonies(o, true).some(q => hyp(ST(q.star).x, ST(q.star).y, ST(p.star).x, ST(p.star).y) < 8));
    const base = (R(o).diplo || 0) + (has(o, 'xeno_relations') ? 20 : 0) + (has(o, 'xeno_psychology') ? 30 : 0) - (border ? 25 : 0) + (rel.treaty ? 15 : 0) - (aggr - 1) * 40 + 5;
    rel.att += (base - rel.att) * 0.04; if (rel.status === 'war') rel.att -= 0.3;
    rel.att = clamp(rel.att, -100, 100);
    const oS = Math.max(1, empStrength(o));
    if (rel.status === 'peace') {
      const since = S.turn - (rel.peaceTurn || 0);
      if (S.turn > 25 && since > 15 && !wars && border && ((rel.att < 0 && myS > 1.2 * oS && rnd() < 0.04 * aggr) || (myS > 1.8 * oS && rnd() < 0.015 * aggr))) { declareWar(emp, o); continue; }
      if (S.turn > 20 && myS > 1.6 * oS && rel.att < 10 && rnd() < 0.02 * aggr && o.bc >= 40) {
        const amt = tributeAmount(o);
        if (o.ai) { if (aiAcceptDemand(o, emp)) payTribute(o, emp, amt); else { rel.att -= 10; if (rnd() < 0.3) declareWar(emp, o); } }
        else S.prompts.push({type: 'demand', from: emp.id, amount: amt});
        continue;
      }
      if (!rel.treaty && rel.att > 12 && rnd() < 0.04) {
        if (o.ai) { if (aiAcceptTrade(o, emp)) signTrade(emp, o); }
        else S.prompts.push({type: 'trade', from: emp.id});
      }
    } else if (rel.status === 'war' && rel.warTurns > 6) {
      if ((myS < 0.75 * oS || rel.warTurns > 30) && rnd() < 0.08) {
        if (o.ai) { if (aiAcceptPeace(o, emp)) makePeace(emp, o); }
        else S.prompts.push({type: 'peace', from: emp.id});
      }
    }
  }
}
