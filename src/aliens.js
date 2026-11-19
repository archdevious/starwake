// ---------- Prespacers: alien civilizations that have not reached space ----------
// Every race in this version appears as a Prespacer (stone age to modern). Found by surveying their system.
const CIV_STAGES = ['Stone age', 'Medieval', 'Industrial', 'Modern'];
const STAGE_STR = [0.6, 0.9, 1.8, 3.2];        // multiplies a race's base ground strength
const SPOT_BASE = [0.005, 0.01, 0.04, 0.12];   // yearly chance to spot a ship or colony in their system
const TRADE_BC = [1, 2, 4, 6];                 // credits a year from trade, by their stage
const SLAVE_PROD = [3, 5, 8, 12];              // production a year from an enslaved world, by their stage
const HARSH_PEN = {mild: 0.1, moderate: 0.2, high: 0.3}; // ground strength lost on a world harsh to humans
const TROOPS_PER_POD = 10000, HUMAN_STR = 20;
const CIV_COUNT = {standard: 8, long: 12};
const RACES = {
  tide: {name: 'Tidekin', one: 'Tidekin', base: 14, stages: [0, 3], spot: 1.3, lang: 0.8, hostile: 0.1, instinct: false, revolt: 1.2, revoltGrow: 0.01, prod: 1, harsh: 'moderate', trust0: 50, give: 0.75, trustMul: 1.4, awe: false,
    home: 'Shallow-sea world with two large moons', body: 'Amphibious, 5 ft. Breathes air and water.',
    culture: ['Patient', 'Clan-loyal', 'Long memory', 'Hates captivity'], comm: 'Hums and clicks from a throat sac; works underwater.',
    feel: 'Value fair trade. Aid changes them slowly, but they never forget a kindness, or a wrong.'},
  dusk: {name: 'Duskwalkers', one: 'Duskwalker', base: 18, stages: [0, 3], spot: 2.5, lang: 0.5, hostile: 0.25, instinct: false, revolt: 1, prod: 1, harsh: 'high', trust0: 40, give: 1, trustMul: 0.8, awe: false,
    home: 'Tide-locked world of a red dwarf', body: 'Four legs, upright torso, 6 ft 2 in. Huge eyes for dim light.',
    culture: ['Proud', 'Strict about rank', 'Territorial', 'Sky-watchers'], comm: 'Pulsing patterns of light from spots in their skin.',
    feel: 'Respect strength and despise weakness. Gifts look like a trap to them until they reach industry.'},
  crag: {name: 'Cragwings', one: 'Cragwing', base: 20, stages: [0, 3], spot: 2.5, lang: 1.2, hostile: 0.35, instinct: true, revolt: 1.1, prod: 1, harsh: 'mild', trust0: 50, give: 1, trustMul: 1, awe: true,
    home: 'Thick-air mountain world', body: 'Eagle-like biped, 6 ft 6 in. Folded wings, talons, hands at the wing joint.',
    culture: ['Curious', 'Fiercely independent', 'Quick to anger', 'Sharp-eyed'], comm: 'Song and screech from a two-sided voice box; within human hearing.',
    feel: 'Love their freedom above all. Treat them as equals and they warm quickly.'},
  stone: {name: 'Stonebacks', one: 'Stoneback', base: 32, stages: [0, 3], spot: 0.5, lang: 0.6, hostile: 0.35, instinct: true, revolt: 1.3, prod: 1.1, harsh: 'high', trust0: 45, give: 1, trustMul: 1, awe: true,
    home: 'Cold high-gravity world', body: 'Bear-like biped, 7 ft, about 850 lb. Horn armor plates on the back.',
    culture: ['Clan-proud', 'Honor-bound', 'Respect strength', 'Fearsome fighters'], comm: 'Deep rumbles, mostly below human hearing.',
    feel: 'Judge you by courage. Keep your word and they will stand by you.'},
  shell: {name: 'Shellwrights', one: 'Shellwright', base: 22, stages: [0, 3], spot: 0.7, lang: 0.6, hostile: 0.2, instinct: false, revolt: 0.7, prod: 1.2, harsh: 'moderate', trust0: 50, give: 1, trustMul: 1, awe: false,
    home: 'Humid forest world', body: 'Beetle-like, six legs and two hands, 4 ft 10 in.',
    culture: ['Industrious', 'Cautious', 'Clan nests (not a hive)', 'Master crafters'], comm: 'Chirps from rubbing leg ridges, plus scent-marks.',
    feel: 'Trust is built slowly, through work done together.'},
  wire: {name: 'Wirebound', one: 'Wirebound', base: 26, stages: [3, 3], spot: 3, lang: 1.2, hostile: 0.1, instinct: false, revolt: 1.4, prod: 1.3, harsh: 'high', trust0: 45, give: 1, trustMul: 0.9, awe: false,
    home: 'Industrial world with poisoned air', body: 'Humanoid, 6 ft 1 in, half machine: machine limbs and a visor.',
    culture: ['Logical', 'Wary', 'Hate waste', 'Proud of what flesh remains'], comm: 'Radio between implants; a throat speaker for outsiders.',
    feel: 'Value useful exchange. Wasteful gifts make them suspicious.'},
  cat: {name: 'Sandprowlers', one: 'Sandprowler', base: 22, stages: [0, 3], spot: 2, lang: 1, hostile: 0.25, instinct: false, revolt: 1.3, prod: 1, harsh: 'mild', trust0: 50, give: 1, trustMul: 1, awe: true,
    home: 'Desert world with cold nights', body: 'Cat-like biped, 6 ft. Long tail, tall ears, retractable claws.',
    culture: ['Curious', 'Individualistic', 'Settle disputes by duel', 'Night hunters'], comm: 'Growls, purrs and calls close to our range; ear and tail posture.',
    feel: 'Admire boldness. Easily bored by caution.'},
  veil: {name: 'Driftveils', one: 'Driftveil', base: 6, stages: [0, 3], spot: 0.5, lang: 0.4, hostile: 0.05, instinct: false, revolt: 0.3, prod: 1, harsh: 'moderate', trust0: 55, give: 1, trustMul: 1.1, awe: true,
    home: 'Dense-air world', body: 'Floating see-through bell, 7 ft, with long tendrils. Domesticated grazers do their heavy work.',
    culture: ['Serene', 'Unreadable', 'Highly intelligent', 'Keep herds of grazers'], comm: 'Ripples of light and faint electric fields.',
    feel: 'Calm toward everyone. Hard to tell what they think of you.'},
};
function civAt(sid) { return (S.civs || []).find(c => c.star === sid && c.status !== 'dead'); }
function civOfBody(b) { return b && b.civ != null ? (S.civs || []).find(c => c.id === b.civ) : null; }
function civBlocks(b) { const c = civOfBody(b); return !!(c && c.status === 'free'); } // their homeworld or outposts: not ours to settle
function civRace(c) { return RACES[c.race]; }
function civKnown(c) { return !!c.known; }
// ----- placement -----
function placeCivs(existing) {
  S.civs = S.civs || [];
  const want = CIV_COUNT[S.len] || 8;
  const ours = new Set(colonyStars());
  let cand = shuffle(S.stars.filter(s => s.id !== 0 && !s.guard && d3(s, S.stars[0]) > 10 && !ours.has(s.id) && !S.surveyed[s.id] && !civAt(s.id) &&
    s.bodies.some(id => civHomeOK(B(id)))));
  const races = shuffle(Object.keys(RACES)); let ri0 = 0;
  for (const s of cand) {
    if (S.civs.length >= want) break;
    const race = races[ri0 % races.length]; ri0++;
    const R = RACES[race];
    const homes = s.bodies.map(B).filter(civHomeOK).sort((a, b) => civHomeScore(b) - civHomeScore(a));
    const hb = homes[0];
    hb.temp = 'temperate'; if (hb.cls === 'ice') hb.cls = 'ocean'; hb.atm = race === 'wire' ? 'toxic' : race === 'veil' ? 'thick' : 'breathable'; hb.life = 'ecosystem'; hb.clouds = false;
    if (race === 'tide') hb.cls = 'ocean';
    const stage = ri(R.stages[0], R.stages[1]);
    const c = {id: S.civs.length + 1, race, star: s.id, body: hb.id, stage, tech: ri(5, 60), lang: 0, met: false, aware: false, known: false, trust: R.trust0,
      mode: 'none', give: 20, status: 'free', garrison: 0, unrest: false, boost: 1, enslavedYear: 0, outs: []};
    hb.civ = c.id;
    if (stage === 3) civModernOutposts(c);
    S.civs.push(c);
  }
}
function civHomeOK(b) { const P = PCLASS[b.cls]; return b && P.solid && !P.belt && b.cls !== 'molten' && b.owner == null && b.civ == null && b.temp !== 'scorching'; }
function civHomeScore(b) { return (b.temp === 'temperate' ? 10 : 0) + (b.life === 'ecosystem' ? 5 : 0) + (['rocky', 'superearth', 'ocean'].includes(b.cls) ? 3 : 0) + b.size; }
function civModernOutposts(c) {
  const s = ST(c.star); const n = ri(2, 3);
  for (const b of shuffle(s.bodies.map(B).filter(x => x.id !== c.body && x.owner == null && x.civ == null && PCLASS[x.cls].solid))) { if (c.outs.length >= n) break; b.civ = c.id; c.outs.push(b.id); }
}
function ensureCivs() {
  if (!S.civs) { S.civs = []; placeCivs(true); } if (S.contact == null) S.contact = false;
  if (!S.mile) S.mile = {eco: S.bodies.some(b => b.star !== 0 && b.life === 'ecosystem' && S.surveyed[b.star]) ? 1 : 0, contact: S.contact ? 1 : 0, colony: colonies().some(b => b.star !== 0) ? 1 : 0};
  S.popq = S.popq || [];
  for (const s of S.stars) if (s.short && !s.shortSince) s.shortSince = S.year;
}
// ----- discovery -----
function civDiscover(s, quiet) {
  const c = civAt(s.id); if (!c || c.known) return;
  c.known = true; const R = civRace(c);
  if (quiet) { S.contact = true; return; }
  msg('First contact! Our survey of ' + s.name + ' found a civilization on ' + B(c.body).name + ': the ' + R.name + ', at ' + CIV_STAGES[c.stage].toLowerCase() + ' level. They have no way to reach space yet. See Diplomacy.', s.id, 'contact');
  journal('Discovered the ' + R.name + ' (' + CIV_STAGES[c.stage].toLowerCase() + ') on ' + B(c.body).name + '.', s.id);
  if (!S.contact) {
    S.contact = true;
    budgetEvent('contact', 5, 'We are not alone. The discovery of the ' + R.name + ' changes how Earth sees the stars, and calls to prepare for other minds out there grow loud.', s.id);
    if (!S.mile.contact) { S.mile.contact = 1; S.popq.push({k: 'contact', star: s.id, body: c.body, civ: c.id, year: S.year, fx: ['Space budget +5 (now ' + spaceBudget() + '% of Earth\'s economy)', 'Ground Forces research is now possible', 'Diplomacy is open (top bar, or P)']}); }
    msg('Ground Forces research is now possible: assault doctrine, rifles, armor and environment suits.', null, 'info');
  }
}
// ----- yearly -----
function civStudyRate(c, f) { const R = civRace(c); return 10 * R.lang * (c.met ? 2 : 1) * Math.min(2, f.ships.filter(sh => shipHas(sh, 'lab')).length); }
function processCivs() {
  if (!S.civs) return;
  // empty Assault Pods refill at any star where we have a colony with people
  const home = new Set(colonies().map(b => b.star));
  for (const f of S.fleets) if (f.dest == null && home.has(f.star)) for (const sh of f.ships) if (shipPods(sh)) sh.troops = shipPods(sh) * TROOPS_PER_POD;
  for (const c of S.civs) {
    if (c.status === 'dead') continue;
    const R = civRace(c), s = ST(c.star);
    // language study by Science Lab ships in orbit
    for (const f of S.fleets) if (f.task && f.task.type === 'study' && f.star === c.star && f.dest == null) {
      if (c.lang >= 100 || !fleetHas(f, 'lab')) { f.task = null; continue; }
      c.lang = Math.min(100, c.lang + civStudyRate(c, f));
      if (c.lang >= 100) { f.task = null; msg('We have learned the language of the ' + R.name + '. Their culture is now in our files. ' + (c.met ? 'We can talk with them in Diplomacy.' : 'A landing party can now speak with them.'), c.star, 'contact'); journal('Learned the language of the ' + R.name + '.', c.star); }
    }
    if (c.status === 'free') {
      // being spotted
      if (!c.aware && !c.met) {
        const present = S.fleets.some(f => f.star === c.star && f.dest == null) || s.bodies.some(id => B(id).owner === 0);
        if (present && rnd() < SPOT_BASE[c.stage] * R.spot) {
          c.aware = true; c.trust = clamp(c.trust + (R.awe ? 5 : -5), 0, 100);
          msg('The ' + R.name + ' have spotted our presence at ' + s.name + '. Our cover is blown; they now know they are not alone.', c.star, 'contact');
          journal('The ' + R.name + ' spotted us.', c.star);
        }
      }
      // relations
      if (c.met && c.lang >= 100) {
        if (c.mode === 'trade') { S.bc = r1(S.bc + TRADE_BC[c.stage]); civTech(c, 1.2); c.trust = Math.min(90, c.trust + 1); }
        if (c.mode === 'give') {
          const g = Math.min(c.give, Math.max(0, S.bc));
          if (g > 0) { const r = giveRate(c, g); S.bc = r1(S.bc - g); civTech(c, r.tech); c.trust = Math.min(100, c.trust + r.trust); }
        }
      }
    }
    if (c.status === 'enslaved') civGarrisonYear(c);
  }
}
function giveRate(c, g) { const R = civRace(c), slow = c.race === 'dusk' && c.stage < 2; return {tech: g / 10 * (R.give || 1) * (slow ? 0.5 : 1), trust: g / 10 * (R.trustMul || 1) * (slow ? 0.3 : 1)}; }
function civTech(c, v) {
  if (c.stage >= 3) { c.tech = 100; return; }
  c.tech += v;
  if (c.tech >= 100) {
    c.stage++; c.tech = c.stage >= 3 ? 100 : 0;
    msg('The ' + civRace(c).name + ' have entered the ' + CIV_STAGES[c.stage].toLowerCase() + ' age.', c.star, 'contact');
    journal('The ' + civRace(c).name + ' advanced to ' + CIV_STAGES[c.stage].toLowerCase() + '.', c.star);
    if (c.stage === 3 && c.status === 'free') civModernOutposts(c);
  }
}
// ----- landing parties -----
function landRisk(c) { const R = civRace(c); let r = R.hostile; if (c.lang >= 100) r *= R.instinct ? 0.9 : 0.5; return clamp(r, 0, 0.95); }
function landParty(f) {
  const c = civAt(f.star); if (!c || c.status !== 'free' || c.met) return null;
  const R = civRace(c);
  if (rnd() < landRisk(c)) {
    const sh = f.ships.find(x => shipHas(x, 'lab')); if (sh) (sh.lost = sh.lost || []).push('lab');
    c.aware = true;
    f.task = f.task && f.task.type === 'study' && !fleetHas(f, 'lab') ? null : f.task;
    msg('Our landing party on ' + B(c.body).name + ' was attacked by the ' + R.name + '. The science team was lost; the ship survived but its Science Lab is gone.', c.star, 'lost');
    journal('A landing party was lost among the ' + R.name + '.', c.star);
    return false;
  }
  c.met = true; c.aware = true; c.trust = clamp(c.trust + (c.lang >= 100 ? 10 : 0), 0, 100);
  msg('Our landing party has met the ' + R.name + ' face to face. ' + (c.lang >= 100 ? 'Knowing their language, we can now talk in Diplomacy.' : 'Learning their language goes twice as fast now.'), c.star, 'contact');
  journal('Met the ' + R.name + ' in person.', c.star);
  return true;
}
// ----- ground combat -----
function shipPods(sh) { return design(sh.d).mods.filter(m => m === 'assault').length; }
function shipTroops(sh) { const cap = shipPods(sh) * TROOPS_PER_POD; return sh.troops == null ? cap : Math.min(cap, sh.troops); }
function fleetTroops(f) { return f.ships.reduce((a, sh) => a + shipTroops(sh), 0); }
function perPod() { return HUMAN_STR + (has('plasma_rifles') ? 15 : has('laser_rifles') ? 5 : 0) + (has('combat_exo') ? 15 : has('powered_armor') ? 5 : 0); }
function harshFactor(c) { let p = HARSH_PEN[civRace(c).harsh] || 0; if (has('sealed_suits')) p *= 0.5; else if (has('field_biosuits')) p *= 0.75; return 1 - p; }
function ourStrength(c, troops) { return troops / TROOPS_PER_POD * perPod() * harshFactor(c); }
function theirStrength(c, ext) { return civRace(c).base * STAGE_STR[c.stage] * (c.boost || 1) * (ext ? 1.1 : 1); }
function winChance(r) { return clamp((r - 0.5) / 0.7, 0.02, 0.98); }
function assaultPreview(f, ext) { const c = civAt(f.star), t = fleetTroops(f), us = ourStrength(c, t), them = theirStrength(c, ext); return {c, troops: t, us, them, ratio: us / them, chance: winChance(us / them), loss: clamp(0.35 * them / Math.max(1, us), 0.05, 0.6)}; }
function assault(f, ext) {
  const p = assaultPreview(f, ext), c = p.c, R = civRace(c), wb = B(c.body);
  const won = rnd() < p.chance;
  const lost = won ? Math.round(p.troops * p.loss / 1000) * 1000 : p.troops, left = p.troops - lost;
  for (const sh of f.ships) if (shipPods(sh)) sh.troops = 0;
  c.aware = true; c.trust = won ? 5 : 0;
  if (!won) {
    msg('Our assault on ' + wb.name + ' failed. All ' + people(p.troops / 1e6) + ' troops were lost against the ' + R.name + '.', c.star, 'lost');
    journal('An assault on the ' + R.name + ' failed.', c.star);
    return {won: false, lost};
  }
  for (const id of c.outs) { const ob = B(id); if (ob.civ === c.id) ob.civ = null; } c.outs = [];
  if (ext) {
    c.status = 'dead'; wb.civ = null; wb.ruins = c.race; S.stats.extinct = (S.stats.extinct || 0) + 1;
    // survivors go back to their pods
    let back = left; for (const sh of f.ships) { const cap = shipPods(sh) * TROOPS_PER_POD; const n = Math.min(cap, back); sh.troops = n; back -= n; }
    msg('The ' + R.name + ' are gone. ' + wb.name + ' is empty and can be settled. We lost ' + people(lost / 1e6) + ' troops.', c.star, 'lost');
    journal('Exterminated the ' + R.name + ' on ' + wb.name + '.', c.star);
  } else {
    c.status = 'enslaved'; c.garrison = left; c.unrest = false; c.enslavedYear = S.year; c.mode = 'none';
    wb.owner = 0; wb.col = {pop: 0, outpost: true, enslaved: c.id, mode: 'build', focus: 'balanced', proj: {}, queue: [], prog: 0, founded: S.year};
    msg('The ' + R.name + ' on ' + wb.name + ' are under our control. ' + people(left / 1e6) + ' troops hold the world; ' + people(lost / 1e6) + ' were lost.', c.star, 'colony');
    journal('Enslaved the ' + R.name + ' on ' + wb.name + '.', c.star);
  }
  return {won: true, lost};
}
function garrisonRatio(c) { return ourStrength(c, c.garrison) / Math.max(1, theirStrength(c) * (civRace(c).revolt || 1)); }
function civGarrisonYear(c) {
  const R = civRace(c), wb = B(c.body), r = garrisonRatio(c), occ = has('occupation_logistics') ? 0.75 : 1;
  const grow = (R.revoltGrow || 0) * (S.year - c.enslavedYear);
  if (S.year - c.enslavedYear >= 5) c.seenRevolt = true;
  if (!c.unrest) {
    if (rnd() < (clamp(0.25 * (1.2 - r), 0, 0.5) + grow) * R.revolt * occ) { c.unrest = true; c.seenRevolt = true; msg('Uprising on ' + wb.name + '! The ' + R.name + ' have stopped working. Send more troops to restore order, or it may become a full revolt.', c.star, 'warn'); }
  } else if (r >= 1.2) { c.unrest = false; msg('Order is restored on ' + wb.name + '.', c.star, 'colony'); }
  else if (rnd() < clamp(0.3 * (1.2 - r), 0.05, 0.6) * occ) {
    c.status = 'free'; c.unrest = false; const lost = c.garrison; c.garrison = 0; c.boost = (c.boost || 1) * 1.25; c.trust = 0; civTech(c, 50);
    wb.owner = null; wb.col = null;
    msg('Full revolt on ' + wb.name + '! Our garrison of ' + people(lost / 1e6) + ' was wiped out. The ' + R.name + ' are free again and armed with our captured weapons.', c.star, 'lost');
    journal('The ' + R.name + ' threw off our rule on ' + wb.name + '.', c.star);
  }
}
function civUpkeep() { let u = 0; for (const c of S.civs || []) if (c.status === 'enslaved') u += c.garrison / TROOPS_PER_POD * 2; for (const f of S.fleets) u += fleetTroops(f) / TROOPS_PER_POD * 0.5; return u * (has('occupation_logistics') ? 0.75 : 1); }
function slaveProd(b) { const c = (S.civs || []).find(x => x.id === b.col.enslaved); if (!c || c.unrest) return 0; return SLAVE_PROD[c.stage] * (civRace(c).prod || 1); }
