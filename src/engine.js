'use strict';
// ===================== STARWAKE v2 — ENGINE =====================
let S = null;
const rnd = Math.random;
const TAU = Math.PI * 2;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = a => a[Math.floor(rnd() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const r1 = v => Math.round(v * 10) / 10;
function wpick(w) { let t = 0, k; for (k in w) t += w[k]; let r = rnd() * t; for (k in w) { r -= w[k]; if (r <= 0) return k; } return k; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const B = id => S.bodies[id];
const ST = id => S.stars[id];
const has = t => !!(S && S.techs[t]);
function nid() { return S.nextId++; }
function msg(text, star, kind) { S.msgs.push({text, star: star == null ? null : star, kind: kind || 'info'}); }
function journal(text, star) { S.journal.push({year: S.year, text, star: star == null ? null : star}); }

// ---------- star types ----------
function starKind(sp) {
  sp = sp || 'M';
  const s = sp.replace(/^(sd|d|esd)/, '');
  const giant = /III|II(?!I)/.test(sp) && !/V/.test(sp.replace(/IV/, ''));
  const c = (s.match(/[OBAFGKMLTD]/) || ['M'])[0];
  const cls = s[0] === 'D' ? 'D' : c;
  const word = cls === 'D' ? 'White dwarf' : giant ? (cls === 'K' ? 'Orange giant' : 'Giant star') :
    {O: 'Blue giant', B: 'Blue-white star', A: 'White star', F: 'Yellow-white star', G: 'Sun-like star', K: 'Orange dwarf', M: 'Red dwarf', L: 'Brown dwarf', T: 'Brown dwarf'}[cls] || 'Star';
  const color = {O: '#9bb0ff', B: '#aabfff', A: '#d8e4ff', F: '#f8f7ff', G: '#ffe9a8', K: '#ffc078', M: '#ff8a5a', D: '#e8f0ff', L: '#c05a3a', T: '#a04a5a'}[cls] || '#ff8a5a';
  return {cls, giant, word, color};
}

// ---------- generation ----------
function newBody(star, o) {
  const b = Object.assign({id: S.bodies.length, star: star.id, name: '', cls: 'rocky', size: 1, temp: 'cold', atm: 'none', life: 'none', toxicLife: false, min: 1, traits: [], of: null, owner: null, col: null, tf: 0}, o);
  S.bodies.push(b); star.bodies.push(b.id); return b;
}
function atmFor(cls, temp) {
  if (cls === 'belt' || cls === 'dwarf') return 'none';
  if (cls === 'gasgiant' || cls === 'icegiant' || cls === 'minineptune') return 'thick';
  if (cls === 'molten') return wpick({none: 2, toxic: 1});
  if (cls === 'ocean') return wpick({thick: 3, thin: 1, toxic: 1});
  if (cls === 'ice') return wpick({none: 3, thin: 2});
  if (cls === 'superearth') return wpick({thick: 3, toxic: 2, thin: 2});
  if (temp === 'scorching') return wpick({none: 3, toxic: 1});
  return wpick({none: 2, thin: 3, thick: 1, toxic: 1});
}
const MIN_W = {0: 3, 1: 5, 2: 2};
function genSystem(star) {
  const k = starKind(star.sp);
  const letters = 'bcdefghij';
  let temps;
  if (k.cls === 'D') { if (rnd() < 0.35) newBody(star, {name: star.name + ' b', cls: rnd() < 0.5 ? 'belt' : 'rocky', size: 1, temp: 'cold', atm: 'none', min: +wpick(MIN_W)}); return; }
  if (k.cls === 'L' || k.cls === 'T') { if (rnd() < 0.4) newBody(star, {name: star.name + ' b', cls: 'rocky', size: 1, temp: 'frozen', atm: 'none', min: +wpick(MIN_W)}); return; }
  let n;
  if (k.giant) { n = ri(1, 2); temps = ['hot', 'cold', 'frozen']; }
  else if (k.cls === 'A' || k.cls === 'B') { n = ri(0, 2); temps = ['cold', 'frozen', 'frozen']; }
  else if (k.cls === 'M') { n = +wpick({0: 2, 1: 3, 2: 3, 3: 2, 4: 1}); temps = ['scorching', 'hot', 'temperate', 'cold', 'frozen']; }
  else { n = ri(2, 6); temps = ['scorching', 'hot', 'temperate', 'cold', 'frozen', 'frozen', 'frozen']; }
  const flare = k.cls === 'M' && rnd() < 0.45;
  for (let i = 0; i < n; i++) {
    let temp = temps[Math.min(temps.length - 1, i + (rnd() < 0.3 ? 1 : 0))];
    let cls;
    if (k.giant || k.cls === 'A' || k.cls === 'B') cls = rnd() < 0.7 ? 'gasgiant' : 'belt';
    else if (temp === 'scorching') cls = wpick({rocky: 4, superearth: 3, molten: 2});
    else if (temp === 'hot') cls = wpick({rocky: 3, superearth: 4, minineptune: 2, molten: 1});
    else if (temp === 'temperate') cls = wpick({rocky: 3, superearth: 4, ocean: 2, minineptune: 1});
    else if (temp === 'cold') cls = wpick({superearth: 2, ice: 3, minineptune: 2, gasgiant: k.cls === 'M' ? 1 : 3, belt: 1});
    else cls = wpick({gasgiant: 3, icegiant: 3, ice: 2, dwarf: 1, belt: 1});
    const size = {rocky: ri(1, 2), superearth: ri(2, 4), ocean: ri(2, 4), ice: ri(1, 3), molten: ri(1, 2), minineptune: 4, gasgiant: 5, icegiant: 4, belt: 1, dwarf: 1}[cls];
    const traits = [];
    if (k.cls === 'M' && (temp === 'temperate' || temp === 'hot' || temp === 'scorching') && PCLASS[cls].solid && cls !== 'belt' && rnd() < 0.75) traits.push('locked');
    if (flare) traits.push('flares');
    if ((cls === 'gasgiant' || cls === 'icegiant') && rnd() < 0.5) traits.push('moons');
    if (cls === 'gasgiant' && rnd() < 0.25) traits.push('rings');
    if (cls === 'ice' && rnd() < 0.35) traits.push('subocean');
    if ((cls === 'rocky' || cls === 'superearth') && rnd() < 0.12) traits.push('volcanic');
    const b = newBody(star, {name: star.name + ' ' + (cls === 'belt' ? 'belt' : letters[i]), cls, size, temp, atm: atmFor(cls, temp), min: +wpick(MIN_W), traits});
    if ((cls === 'gasgiant' || cls === 'icegiant') && rnd() < 0.4) {
      newBody(star, {name: b.name + ' I', cls: 'moon', size: ri(1, 2), temp: temp === 'temperate' ? 'temperate' : temp === 'hot' ? 'hot' : 'frozen', atm: rnd() < 0.3 ? 'thin' : 'none', min: +wpick(MIN_W), traits: rnd() < 0.4 ? ['subocean'] : [], of: b.name});
    }
  }
}
function knownSystem(star, list) {
  const k = starKind(star.sp);
  for (const [nm, cls, size, temp, traits] of list) {
    newBody(star, {name: (nm.length <= 3 ? star.name + ' ' + nm : nm.indexOf(star.name) === 0 ? nm : (/^(Proxima)/.test(nm) ? nm : star.name + ' ' + nm)),
      cls, size, temp, atm: atmFor(cls, temp), min: +wpick(MIN_W), traits: (traits || []).slice()});
  }
  if (star.name === 'Alpha Centauri') { // A and B: unknown planets, rolled
    for (let i = 0; i < ri(1, 3); i++) { const temp = pick(['hot', 'temperate', 'cold', 'frozen']); const cls = temp === 'frozen' ? pick(['gasgiant', 'ice', 'icegiant']) : pick(['rocky', 'superearth', 'ocean']);
      newBody(star, {name: 'Alpha Centauri ' + ['A', 'B'][i % 2] + ' ' + 'bcd'[Math.floor(i / 2)], cls, size: cls === 'gasgiant' ? 5 : ri(1, 3), temp, atm: atmFor(cls, temp), min: +wpick(MIN_W), traits: []}); }
  }
}
function assignLife() {
  for (const s of S.stars) {
    if (s.id === 0 || s.guard) continue;
    const bs = s.bodies.map(B);
    const r = rnd();
    if (r < 0.15) {
      let cand = bs.filter(b => PCLASS[b.cls].solid && !PCLASS[b.cls].belt && b.cls !== 'molten' && b.temp === 'temperate');
      if (!cand.length && !KNOWN_PLANETS[s.name]) {
        cand = bs.filter(b => ['rocky', 'superearth', 'ocean', 'ice'].includes(b.cls) && b.temp !== 'scorching');
        if (!cand.length && starKind(s.sp).cls !== 'D') cand = [newBody(s, {name: s.name + ' ' + 'bcdefghij'[bs.length], cls: pick(['rocky', 'superearth', 'ocean']), size: ri(2, 3), temp: 'temperate', atm: 'thick', min: +wpick(MIN_W), traits: []})];
        if (cand.length) { cand = [cand[0]]; cand[0].temp = 'temperate'; if (cand[0].cls === 'ice') cand[0].cls = 'ocean'; }
      }
      if (cand.length) {
        const b = pick(cand); b.life = 'ecosystem'; b.atm = rnd() < 0.55 ? 'breathable' : pick(['thick', 'thin']); b.toxicLife = rnd() < 0.5; continue;
      }
    }
    if (r < 0.35) {
      const cand = bs.filter(b => PCLASS[b.cls].solid && !PCLASS[b.cls].belt && b.cls !== 'molten' && b.temp !== 'scorching');
      if (cand.length) pick(cand).life = 'microbial';
    }
  }
}
function newGame(o) {
  const L = LENGTHS[o.len] || LENGTHS.standard;
  const list = o.len === 'long' ? STARS_LONG : STARS_STD;
  S = {version: GAME_VERSION, format: SAVE_FORMAT, turn: 1, year: START_YEAR, len: o.len, maxTurns: L.turns, radius: L.radius,
    stars: [], bodies: [], fleets: [], designs: [], techs: {}, res: null, rpBank: 0, bc: 500,
    known: {}, visited: {}, surveyed: {}, journal: [], hist: [], msgs: [], nextId: 1, story: o.story, empire: {name: o.name || 'United Earth', color: o.color || '#4aa8ff'},
    mods: {prod: 1, rp: 1, bc: 1, growth: 1, earthFood: 0, earthTel: COLONY_TEL}, stats: {anomalies: 0, anomScore: 0, lost: 0}, awakened: false, over: null,
    gameId: Date.now().toString(36) + Math.floor(rnd() * 1e6).toString(36), started: Date.now(), nextDesign: 1};
  list.forEach((s, i) => S.stars.push({id: i, name: s.n, x: s.x, y: s.y, z: s.z, sp: s.sp, cnt: s.c || 1, ly: s.ly, real: s.real || null, bodies: [], anom: null, anomDone: false, guard: false, stock: 0}));
  // the Solar System
  for (const b of SOL_BODIES) newBody(S.stars[0], Object.assign({}, b, {traits: b.traits.slice()}));
  for (const s of S.stars) { if (s.id === 0) continue; const kp = KNOWN_PLANETS[s.name]; if (kp) knownSystem(s, kp); else genSystem(s); }
  // guardian machines
  const gc = shuffle(S.stars.filter(s => s.ly >= 10 && s.ly <= L.radius - 2 && s.name !== 'Alpha Centauri' && s.bodies.length));
  gc.slice(0, o.len === 'long' ? 3 : 2).forEach(s => s.guard = true);
  assignLife();
  // anomalies
  const ev = shuffle(EVENTS.map(e => e.id));
  let k = 0;
  for (const s of shuffle(S.stars.filter(s => s.id !== 0 && !s.guard))) { if (rnd() < 0.38) { s.anom = ev[k % ev.length]; k++; } }
  // designs
  for (const d of DEFAULT_DESIGNS) S.designs.push(Object.assign({}, d, {mods: d.mods.slice(), std: true}));
  S.designs.push({id: 'probe', name: 'Starshot Probe', hull: 'light', mods: ['tel_m'], std: true, hidden: true});
  // backstory
  const st = o.story || {};
  const sun = S.stars[0];
  const body = n => sun.bodies.map(B).find(b => b.name === n);
  const earth = body('Earth');
  earth.col = {pop: 9500, focus: 'balanced', proj: {shipyard: 1}, queue: [], prog: 0, home: true, founded: START_YEAR};
  earth.owner = 0;
  const settle = (n, pop) => { const b = body(n); b.owner = 0; b.col = {pop, focus: 'balanced', proj: {}, queue: [], prog: 0, founded: START_YEAR - 60}; return b; };
  if (st.e0 === 'green') { S.mods.earthFood += 20; S.mods.growth += 0.1; }
  if (st.e0 === 'fortress') { S.mods.prod += 0.15; earth.col.pop -= 1500; }
  if (st.e0 === 'corporate') { S.mods.bc += 0.25; S.bc += 300; }
  if (st.e1 === 'moonmars') { settle('Moon', 0.08); settle('Mars', 0.09); }
  if (st.e1 === 'belt') { settle('Ceres', 0.07); const ab = body('Asteroid belt'); ab.owner = 0; ab.col = {pop: 0, outpost: true, focus: 'balanced', proj: {}, queue: [], prog: 0}; S.mods.prod += 0.1; }
  if (st.e1 === 'venus') { const v = settle('Venus', 2.5); v.clouds = true; S.mods.rp += 0.1; }
  if (st.e2 === 'unity') { S.mods.bc += 0.15; S.mods.growth += 0.1; }
  if (st.e2 === 'fracture') { S.mods.prod += 0.15; settle('Titan', 0.04); }
  if (st.e2 === 'transcend') { S.mods.rp += 0.2; }
  const home = s => newFleetAt(0, s);
  home('scout'); home('science'); home('colony');
  if (st.e3 === 'ark') { home('colony'); home('colony'); }
  if (st.e3 === 'telescope') { S.mods.earthTel = 24; S.techs.biosignatures = 1; }
  if (st.e3 === 'probes') {
    const near = S.stars.filter(s => s.id !== 0).sort((a, b) => a.ly - b.ly).slice(0, 6);
    shuffle(near).slice(0, 4).forEach((t, i) => { const f = newFleetAt(0, 'probe'); const k2 = 1 - (1 + i * 0.5) * 0.3 / Math.max(1, t.ly); f.star = null; f.x = t.x * k2; f.y = t.y * k2; f.z = t.z * k2; f.dest = t.id; });
  }
  for (const s of sun.bodies.map(B)) S.visited[0] = S.surveyed[0] = S.known[0] = 1;
  updateKnowledge();
  recordHistory();
  msg('The year is ' + START_YEAR + '. For the first time, humanity is ready to leave the Solar System. Choose a research project, then send your ships to the stars.', 0, 'info');
  return S;
}

// ---------- ships & designs ----------
function design(id) { return S.designs.find(d => d.id === id); }
function designMass(d) { let m = HULLS[d.hull].mass; for (const k of d.mods) m += MODULES[k].mass; return m; }
function designCost(d) { let c = HULLS[d.hull].cost; for (const k of d.mods) c += MODULES[k].cost; return Math.round(c * (has('orbital_construction') ? 0.85 : 1)); }
function massFactor(m) { return clamp(1.1 - 0.04 * m + (has('bt_alloys') ? 0.1 : 0), 0.5, 1); }
function driveLevel() { let l = 0; DRIVE_TECH.forEach((t, i) => { if (t && has(t)) l = Math.max(l, i); }); return l; }
function topSpeed() { return DRIVE_SPEEDS[driveLevel()]; }
function designSpeed(d) { return topSpeed() * massFactor(designMass(d)); }
function telBonus(r) { return r * (has('interferometry') ? 1.5 : 1) + (has('bt_lensing') ? 4 : 0); }
function designTel(d) { return telBonus(d.mods.includes('tel_l') ? 16 : d.mods.includes('tel_m') ? 8 : SHIP_TEL); }
function designHas(d, m) { return d.mods.includes(m); }
function newFleetAt(starId, did) {
  const s = ST(starId);
  const f = {id: nid(), ships: [{id: nid(), d: did}], star: starId, x: s.x, y: s.y, z: s.z, dest: null, task: null};
  S.fleets.push(f); return f;
}
function fleetSpeed(f) { let v = 1; for (const sh of f.ships) v = Math.min(v, designSpeed(design(sh.d))); return v; }
function fleetTel(f) { let v = 0; for (const sh of f.ships) v = Math.max(v, designTel(design(sh.d))); return v; }
function fleetHas(f, m) { return f.ships.some(sh => designHas(design(sh.d), m)); }
function fleetCargo(f) { let n = 0; for (const sh of f.ships) n += design(sh.d).mods.filter(m => m === 'cargo').length; return n * (has('interstellar_commerce') ? 2 : 1); }
function etaTo(f, starId) { const s = ST(starId); return Math.max(1, Math.ceil((d3(f, s) - 1e-6) / fleetSpeed(f))); }
function cleanupFleets() { S.fleets = S.fleets.filter(f => f.ships.length); }
function orderMove(f, starId) {
  if (f.star === starId) { f.dest = null; return null; }
  const s = ST(starId);
  if (s.guard && s.guardKnown && has('bt_machines')) return 'Guardian machines hold that system. Your ships refuse to enter.';
  if (!S.known[starId]) return 'Unknown destination';
  f.dest = starId; if (f.task && f.task.type !== 'route') f.task = null; return null;
}
function splitFleet(f, ids) { const nf = {id: nid(), ships: f.ships.filter(s => ids.includes(s.id)), star: f.star, x: f.x, y: f.y, z: f.z, dest: null, task: null}; f.ships = f.ships.filter(s => !ids.includes(s.id)); S.fleets.push(nf); cleanupFleets(); return nf; }
function mergeFleets(a, b) { a.ships.push(...b.ships); b.ships = []; cleanupFleets(); }

// ---------- habitability & colonies ----------
function hab(b) {
  if (b.star === 0 && b.name === 'Earth') return 'garden';
  if (b.clouds) return 'harsh';
  const c = PCLASS[b.cls];
  if (!c.solid || c.belt) return 'outpost';
  if (c.burning) return 'none';
  if (b.temp === 'scorching') return 'outpost';
  let h;
  if (b.temp === 'temperate') {
    if (b.atm === 'breathable') h = (b.life === 'ecosystem' && b.toxicLife && !has('xenobiochem')) ? 'harsh' : 'garden';
    else if (b.atm === 'toxic') h = 'harsh';
    else if (b.atm === 'none') h = 'hostile';
    else h = 'livable';
    if (h !== 'garden' && b.life === 'ecosystem' && b.toxicLife && !has('xenobiochem')) h = 'harsh';
  } else if (b.temp === 'hot' || b.temp === 'cold') h = (b.atm === 'none' || b.atm === 'toxic') ? 'hostile' : 'harsh';
  else h = 'hostile';
  if (b.tf) h = HAB_ORDER[Math.min(5, HAB_ORDER.indexOf(h) + b.tf)];
  return h;
}
function popCap(b) {
  if (b.star === 0 && b.name === 'Earth') return 12000 * (has('arcologies') ? 1.25 : 1);
  const h = hab(b);
  let c = b.clouds ? 40 : HAB[h].cap * b.size;
  if (h === 'harsh' && has('gene_adaptation')) c *= 1.5;
  if (has('arcologies')) c *= 1.25;
  if (b.col && b.col.proj.habitat) c *= 1.5;
  return c;
}
function stageOf(b) {
  const c = b.col; if (!c) return null;
  if (c.home) return 'home';
  if (c.outpost || c.pop <= 0) return 'outpost';
  if (c.pop < 0.1) return 'settlement';
  if (c.pop < 10) return 'city';
  return 'core';
}
function colonies(includeOutposts) { return S.bodies.filter(b => b.owner === 0 && b.col && (includeOutposts || !b.col.outpost)); }
function colOut(b) {
  const c = b.col, stg = stageOf(b), st = STAGES[stg], h = hab(b);
  const fm = {prod: 1, rp: 1, bc: 1, food: 1};
  if (c.focus === 'industry') { fm.prod = 1.75; fm.rp = fm.bc = 0.8; }
  if (c.focus === 'science') { fm.rp = 1.75; fm.prod = fm.bc = 0.8; }
  if (c.focus === 'trade') { fm.bc = 1.75; fm.prod = fm.rp = 0.8; }
  if (c.focus === 'farming') { fm.food = 2; fm.prod = fm.rp = fm.bc = 0.8; }
  const p = c.proj;
  let prod = st.prod * MIN_MULT[b.min] * fm.prod * (p.mines ? 1.5 : 1) * S.mods.prod * (has('autofactories') ? 1.2 : 1) * (has('antimatter_production') ? 1.1 : 1) * (has('bt_fusion') ? 1.15 : 1);
  let rp = st.rp * fm.rp * (p.campus ? 1.5 : 1) * S.mods.rp * (has('quantum_computing') ? 1.15 : 1) * (has('unified_science') ? 1.2 : 1) * (has('bt_signal') ? 1.15 : 1);
  let bc = st.bc * fm.bc * (p.tradeport ? 1.5 : 1) * S.mods.bc * (has('interstellar_commerce') ? 1.2 : 1);
  let fert = HAB[h].fert * ((h === 'harsh' || h === 'hostile') && has('closed_ecology') ? 1.5 : 1);
  const lvl = Math.max(0, STAGE_ORDER.indexOf(stg) - 1);
  let food = st.food * fert * fm.food + (p.agridomes ? (3 + 3 * Math.max(0, lvl - 0)) * (has('bt_seeds') ? 2 : 1) : 0) + (c.home ? S.mods.earthFood : 0);
  if (stg === 'outpost') { food = 0; }
  return {stage: stg, prod: r1(prod), rp: r1(rp), bc: r1(bc), food: r1(food), eat: st.eat, cap: popCap(b), hab: h};
}
function systemFood(starId) {
  let made = 0, eaten = 0;
  for (const bid of ST(starId).bodies) { const b = B(bid); if (b.owner !== 0 || !b.col) continue; const o = colOut(b); made += o.food; eaten += o.eat; }
  return {made: r1(made), eaten: r1(eaten), net: r1(made - eaten), stock: Math.floor(ST(starId).stock || 0)};
}
function colonyStars() { return [...new Set(colonies(true).map(b => b.star))]; }
function growthRate(b) {
  const h = hab(b), stg = stageOf(b);
  let g = HAB[h].grow * S.mods.growth;
  if (stg === 'settlement' && has('colonial_charter')) g *= 1.5;
  if (h === 'harsh' && has('gene_adaptation')) g *= 1.5;
  if (has('longevity')) g *= 1.25;
  if (has('bt_genome') && b.life !== 'none') g *= 1.25;
  if (stg === 'home') g = 0.004 * S.mods.growth;
  return g;
}
function shipCost(d, b) { return Math.round(designCost(d) * (b && b.col.proj.elevator ? 0.75 : 1)); }
function projCost(id) { return Math.round(PROJECTS[id].cost * (has('megastructures') ? 0.75 : 1)); }
function itemCost(b, it) { return it.kind === 'proj' ? projCost(it.id) : shipCost(design(it.id), b); }
function itemName(it) { return it.kind === 'proj' ? PROJECTS[it.id].name : design(it.id).name; }
function projReason(b, id) {
  const P = PROJECTS[id], c = b.col;
  if (c.outpost) return 'Outposts cannot build';
  if (P.tech && !has(P.tech)) return 'Needs ' + TECH[P.tech].name;
  if (c.proj[id] && !P.repeat) return 'Already built';
  if (c.queue.some(q => q.kind === 'proj' && q.id === id)) return 'Already queued';
  if (STAGE_ORDER.indexOf(stageOf(b)) < STAGE_ORDER.indexOf(P.stage)) return 'Needs a ' + STAGES[P.stage].name;
  if (id === 'terraform' && (hab(b) === 'garden' || hab(b) === 'none' || hab(b) === 'outpost' || c.home)) return 'Cannot be improved further';
  return null;
}
function shipReason(b) { if (b.col.outpost) return 'Outposts cannot build'; if (!b.col.proj.shipyard) return 'Needs an Orbital Shipyard'; return null; }
function buyCost(b) { const c = b.col; if (!c.queue.length) return 0; const cost = itemCost(b, c.queue[0]); return Math.ceil(Math.max(0, cost - c.prog) * (c.prog > 0 ? 2 : 3)); }
function buyItem(b) { const k = buyCost(b); if (k <= 0 || S.bc < k) return false; S.bc = r1(S.bc - k); b.col.prog = itemCost(b, b.col.queue[0]); return true; }
function completeItem(b, it) {
  if (it.kind === 'proj') {
    if (it.id === 'terraform') {
      b.tf = (b.tf || 0) + 1;
      if (b.life === 'ecosystem') { b.life = 'microbial'; msg('Terraforming on ' + b.name + ' has wiped out most of its native ecosystem.', b.star, 'warn'); }
      msg(b.name + ' is now ' + HAB[hab(b)].name + ' after a terraforming stage.', b.star, 'build');
    } else { b.col.proj[it.id] = 1; msg(b.name + ' completed ' + PROJECTS[it.id].name + '.', b.star, 'build'); }
  } else {
    newFleetAt(b.star, it.id);
    msg(b.name + ' launched a ' + design(it.id).name + '.', b.star, 'ship');
  }
}
function settlerCount() { return has('hibernation') ? 0.04 : 0.02; }
function colonizeCheck(f, b, kind) {
  if (f.star !== b.star || f.dest != null) return 'The ship must be in orbit';
  if (kind === 'colony') {
    if (!fleetHas(f, 'colony')) return 'No Colony Pod in this fleet';
    const h = hab(b);
    if (b.owner === 0 && b.col && !b.col.outpost) return null; // add settlers
    if (h === 'none' || h === 'outpost') return 'People cannot live there (use an Outpost Kit)';
    if (b.owner === 0 && b.col && b.col.outpost) return null;
    return null;
  }
  if (!fleetHas(f, 'outpost')) return 'No Outpost Kit in this fleet';
  if (b.owner === 0) return 'Already ours';
  if (hab(b) === 'none') return 'Nothing can be built there';
  return null;
}
function colonize(f, b, kind) {
  if (colonizeCheck(f, b, kind)) return false;
  const idx = f.ships.findIndex(sh => designHas(design(sh.d), kind === 'colony' ? 'colony' : 'outpost'));
  const sh = f.ships[idx];
  const pods = kind === 'colony' ? design(sh.d).mods.filter(m => m === 'colony').length : 0;
  f.ships.splice(idx, 1);
  if (kind === 'colony') {
    const add = settlerCount() * pods;
    if (b.owner === 0 && b.col && !b.col.outpost) { b.col.pop += add; msg(Math.round(add * 1e6).toLocaleString() + ' new settlers arrived on ' + b.name + '.', b.star, 'colony'); }
    else { const old = b.col; b.owner = 0; b.col = {pop: add, focus: 'balanced', proj: old ? old.proj : {}, queue: [], prog: 0, founded: S.year}; msg('A new colony is founded on ' + b.name + ' with ' + Math.round(add * 1e6).toLocaleString() + ' settlers.', b.star, 'colony'); journal('Founded a colony on ' + b.name + '.', b.star); }
  } else { b.owner = 0; b.col = {pop: 0, outpost: true, focus: 'balanced', proj: {}, queue: [], prog: 0, founded: S.year}; msg('A mining outpost is established on ' + b.name + '.', b.star, 'colony'); }
  cleanupFleets();
  return true;
}

// ---------- research ----------
function techCost(id) { const t = TECH[id]; return Math.round(t.cost * (id === 'exotic_matter' && has('bt_exotic') ? 0.5 : 1)); }
function availableTechs() { return TECHS.filter(t => !has(t.id) && t.req.every(has)); }
function setResearch(id) { if (!TECH[id] || has(id) || !TECH[id].req.every(has)) return false; if (S.res && S.res.tech !== id) S.rpBank += S.res.prog; if (!S.res || S.res.tech !== id) S.res = {tech: id, prog: 0}; return true; }
function learn(id, how) { if (has(id)) return; S.techs[id] = 1; msg((how || 'Research complete') + ': ' + TECH[id].name + '. ' + TECH[id].desc, null, 'tech'); }

// ---------- knowledge ----------
function telescopes() {
  const out = [];
  const seen = new Set();
  for (const b of colonies(true)) { if (seen.has(b.star)) continue; seen.add(b.star); const s = ST(b.star);
    let r = COLONY_TEL; if (b.star === 0) r = S.mods.earthTel; for (const bb of s.bodies.map(B)) if (bb.owner === 0 && bb.col && bb.col.proj.observatory) r = Math.max(r, 24);
    out.push({x: s.x, y: s.y, z: s.z, r: telBonus(r)}); }
  for (const f of S.fleets) out.push({x: f.x, y: f.y, z: f.z, r: fleetTel(f)});
  return out;
}
function updateKnowledge() {
  const tel = telescopes();
  for (const s of S.stars) {
    if (!S.known[s.id] && tel.some(t => d3(t, s) <= t.r + 1e-6)) { S.known[s.id] = 1; if (S.turn > 1) msg('Telescopes have spotted ' + s.name + ' (' + starKind(s.sp).word.toLowerCase() + ', ' + s.ly + ' light-years from the Sun).', s.id, 'spot'); }
    if (!S.visited[s.id]) for (const f of S.fleets) if (d3(f, s) <= DETAIL_RANGE + 1e-6) { visit(s); break; }
  }
}
function visit(s) {
  S.visited[s.id] = 1; S.known[s.id] = 1;
  const n = s.bodies.length;
  msg('Our ship reached ' + s.name + ': ' + (n ? n + ' world' + (n > 1 ? 's' : '') + ' found' : 'no planets') + (s.anom ? '. Strange readings detected!' : '.'), s.id, 'arrive');
  journal('First visit to ' + s.name + (s.anom ? ' (strange readings)' : '') + '.', s.id);
}
function lifeVisible(s) { return S.surveyed[s.id] || (has('biosignatures') && S.known[s.id]); }

// ---------- anomalies ----------
function eventOf(s) { return EVENTS.find(e => e.id === s.anom); }
function canInvestigate(f) { if (!f || f.star == null || f.dest != null) return false; const s = ST(f.star); return !!(s.anom && !s.anomDone && S.visited[s.id] && fleetHas(f, 'lab')); }
function resolveChoice(f, ci) {
  const s = ST(f.star), ev = eventOf(s); const ch = ev.ch[ci];
  let r = rnd(), o = ch.o[ch.o.length - 1];
  for (const x of ch.o) { if (r < x.p) { o = x; break; } r -= x.p; }
  s.anomDone = true; S.stats.anomalies++;
  const res = {text: o.t, gains: []};
  if (o.rp) { const v = Math.round(o.rp * (has('xenology') ? 1.5 : 1) * (1 + S.turn / 150)); S.rpBank += v; res.gains.push('+' + v + ' research'); }
  if (o.bc) { const v = Math.round(o.bc * (1 + S.turn / 200)); S.bc += v; res.gains.push('+' + v + ' credits'); }
  if (o.bt) { if (!has(o.bt)) { S.techs[o.bt] = 1; res.gains.push('Breakthrough: ' + TECH[o.bt].name + ' (' + TECH[o.bt].desc + ')'); } else { S.rpBank += 150; res.gains.push('+150 research'); } }
  if (o.reveal) { const unk = S.stars.filter(x => !S.known[x.id]).sort((a, b) => d3(a, s) - d3(b, s)).slice(0, o.reveal); unk.forEach(x => S.known[x.id] = 1); if (unk.length) res.gains.push('Revealed: ' + unk.map(x => x.name).join(', ')); }
  if (o.score) S.stats.anomScore += o.score;
  if (o.lose) { const i = f.ships.findIndex(sh => designHas(design(sh.d), 'lab')); f.ships.splice(i >= 0 ? i : 0, 1); S.stats.lost++; res.gains.push('The ship was lost'); res.lost = true; cleanupFleets(); }
  journal(ev.title + ' at ' + s.name + ': ' + o.t, s.id);
  return res;
}

// ---------- turn ----------
function moveFleets() {
  for (const f of S.fleets) {
    if (f.dest == null) continue;
    const d = ST(f.dest), spd = fleetSpeed(f);
    f.star = null;
    const L = d3(f, d);
    if (L <= spd + 1e-6) { f.x = d.x; f.y = d.y; f.z = d.z; f.star = f.dest; f.dest = null; f.arrived = S.turn; arrive(f); }
    else { f.x += (d.x - f.x) / L * spd; f.y += (d.y - f.y) / L * spd; f.z += (d.z - f.z) / L * spd; }
  }
  cleanupFleets();
}
function arrive(f) {
  const s = ST(f.star);
  if (s.guard) {
    S.stats.lost += f.ships.length; f.ships = [];
    s.guardKnown = true; S.visited[s.id] = 1;
    const first = !S.awakened; S.awakened = true;
    msg('Contact with our ships at ' + s.name + ' was lost. Their last transmissions show machines, ancient and artificial, opening fire. ' + (first ? 'We are not alone, and space is not safe.' : ''), s.id, 'lost');
    journal('Guardian machines destroyed our ships at ' + s.name + '.', s.id);
    return;
  }
  if (f.task && f.task.type === 'route') routeArrive(f);
}
function routeArrive(f) {
  const t = f.task, here = f.star;
  const cap = fleetCargo(f) * 4;
  if (here === t.a) {
    if (t.cargo === 'food') { const s = ST(here); const take = Math.min(cap, Math.floor(s.stock)); s.stock -= take; t.load = take; }
    else { const src = ST(here).bodies.map(B).filter(b => b.owner === 0 && b.col && !b.col.outpost && b.col.pop > 0.2).sort((a, b) => b.col.pop - a.col.pop)[0]; const n = fleetCargo(f) * 0.002; if (src) { src.col.pop -= n; t.load = n; } else t.load = 0; }
    f.dest = t.b;
  } else if (here === t.b) {
    if (t.load) {
      if (t.cargo === 'food') { ST(here).stock += t.load; }
      else { const dst = ST(here).bodies.map(B).filter(b => b.owner === 0 && b.col && !b.col.outpost).sort((a, b) => a.col.pop - b.col.pop)[0]; if (dst) dst.col.pop += t.load; }
      t.delivered = (t.delivered || 0) + 1;
    }
    t.load = 0; f.dest = t.a;
  }
}
function processSurveys() {
  for (const f of S.fleets) {
    if (!f.task || f.task.type !== 'survey' || f.star == null || f.dest != null) continue;
    if (--f.task.left <= 0) {
      const s = ST(f.star); f.task = null; if (S.surveyed[s.id]) continue; S.surveyed[s.id] = 1;
      const life = s.bodies.map(B).filter(b => b.life !== 'none');
      msg('Survey of ' + s.name + ' complete' + (life.length ? ': ' + life.map(b => LIFE[b.life].toLowerCase() + ' on ' + b.name).join(', ') + '!' : '. No life found.'), s.id, 'survey');
      if (life.length) journal('Found ' + life.map(b => LIFE[b.life].toLowerCase() + ' on ' + b.name).join(', ') + '.', s.id);
    }
  }
}
function processEconomy() {
  let rp = 0, bc = 0;
  const broke = S.bc < 0;
  for (const b of colonies(true)) {
    const o = colOut(b), c = b.col;
    rp += o.rp; bc += o.bc;
    if (c.outpost) { bc += o.prod; continue; }
    let prod = o.prod * (broke ? 0.5 : 1);
    while (c.queue.length && !itemValid(b, c.queue[0])) c.queue.shift();
    if (!c.queue.length) { bc += prod * 0.5; c.prog = 0; continue; }
    c.prog += prod;
    const it = c.queue[0], cost = itemCost(b, it);
    if (c.prog >= cost) { completeItem(b, it); c.prog = Math.min(c.prog - cost, cost); if (it.n > 1) it.n--; else c.queue.shift(); }
  }
  // food per system
  const stars = colonyStars();
  for (const sid of stars) {
    const s = ST(sid), f = systemFood(sid);
    s.short = false;
    if (f.net >= 0) { s.stock += f.net; if (s.stock > 60) { bc += (s.stock - 60) * 0.2; s.stock = 60; } }
    else { s.stock += f.net; if (s.stock < 0) { s.stock = 0; s.short = true; msg('Food is running out in the ' + s.name + ' system. Colonies there are shrinking. Switch a colony to Farming, build Agri-Domes, or send food by Freighter.', sid, 'warn'); } }
  }
  // growth
  for (const b of colonies()) {
    const c = b.col, before = stageOf(b), cap = popCap(b);
    if (ST(b.star).short) c.pop -= c.pop * 0.03;
    else if (c.pop < cap) c.pop += c.pop * growthRate(b) * (1 - c.pop / cap);
    else c.pop -= (c.pop - cap) * 0.1;
    c.pop = Math.max(0.001, c.pop);
    const after = stageOf(b);
    if (after !== before && STAGE_ORDER.indexOf(after) > STAGE_ORDER.indexOf(before)) { msg(b.name + ' has grown into a ' + STAGES[after].name + '.', b.star, 'stage'); journal(b.name + ' became a ' + STAGES[after].name + '.', b.star); }
  }
  // research
  if (!S.res) { S.rpBank += rp; }
  else {
    S.res.prog += rp + S.rpBank; S.rpBank = 0;
    const cost = techCost(S.res.tech);
    if (S.res.prog >= cost) { S.rpBank = Math.min(S.res.prog - cost, cost); learn(S.res.tech); S.res = null; }
  }
  // upkeep
  let up = 0; for (const f of S.fleets) for (const sh of f.ships) up += designCost(design(sh.d)) * 0.01;
  S.bc = r1(S.bc + bc - up);
  if (S.bc < 0) msg('The treasury is empty. Production is halved until credits recover: scrap idle ships or set a colony to Trade.', null, 'warn');
}
function itemValid(b, it) {
  if (it.kind === 'ship') return !!design(it.id) && !shipReason(b);
  const P = PROJECTS[it.id], c = b.col;
  if (c.outpost || (P.tech && !has(P.tech))) return false;
  if (c.proj[it.id] && !P.repeat) return false;
  if (it.id === 'terraform' && (hab(b) === 'garden' || hab(b) === 'none' || hab(b) === 'outpost' || c.home)) return false;
  return true;
}
function totals() {
  let prod = 0, rp = 0, bc = 0, pop = 0, food = 0;
  for (const b of colonies(true)) { const o = colOut(b); prod += o.prod; rp += o.rp; bc += o.bc; pop += b.col.pop; }
  let up = 0; for (const f of S.fleets) for (const sh of f.ships) up += designCost(design(sh.d)) * 0.01;
  const short = colonyStars().filter(s => ST(s).short || systemFood(s).net < 0 && ST(s).stock < 5);
  return {prod: r1(prod), rp: r1(rp), bc: r1(bc), up: r1(up), net: r1(bc - up), pop, short};
}
function endTurn() {
  S.msgs = [];
  moveFleets();
  updateKnowledge();
  processSurveys();
  processEconomy();
  S.turn++; S.year++;
  recordHistory();
  if (S.turn > S.maxTurns && !S.over) S.over = {result: 'complete', why: 'The age of exploration draws to a close in the year ' + S.year + '.'};
}
function recordHistory() { S.hist.push({t: S.turn, y: S.year, pop: Math.round(totals().pop), exp: Object.keys(S.visited).length, score: score().total}); }
function score() {
  let micro = 0, eco = 0, settle = 0, city = 0, core = 0;
  for (const sid in S.surveyed) for (const bid of ST(+sid).bodies) { const b = B(bid); if (b.star === 0) continue; if (b.life === 'microbial') micro++; if (b.life === 'ecosystem') eco++; }
  for (const b of colonies()) { if (b.star === 0) continue; const s = stageOf(b); if (s === 'settlement') settle++; if (s === 'city') city++; if (s === 'core') core++; }
  const pop = colonies().reduce((a, b) => a + b.col.pop, 0);
  const bts = Object.keys(S.techs).filter(t => TECH[t] && TECH[t].breakthrough).length;
  const techs = Object.keys(S.techs).filter(t => TECH[t] && !TECH[t].breakthrough).length;
  const p = {
    explored: (Object.keys(S.visited).length - 1) * SCORE_W.explored, surveyed: Math.max(0, Object.keys(S.surveyed).length - 1) * SCORE_W.surveyed,
    life: micro * SCORE_W.microbial + eco * SCORE_W.ecosystem, anomalies: S.stats.anomScore, breakthroughs: bts * SCORE_W.breakthrough, techs: techs * SCORE_W.tech,
    colonies: settle * SCORE_W.settlement + city * SCORE_W.city + core * SCORE_W.core, population: Math.round(Math.log10(1 + pop) * SCORE_W.popLog),
  };
  p.total = Object.values(p).reduce((a, b) => a + b, 0);
  return p;
}
