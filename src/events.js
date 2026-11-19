// ---------- random events: each happens at most once per game, spread out, with good and bad kept in balance ----------
const EV_GAP = 8, EV_CHANCE = 0.15, EV_START = 10;
function evState() { if (!S.ev) S.ev = {done: {}, last: START_YEAR, goods: 0, bads: 0, streak: 0, decq: []}; S.ev.decq = S.ev.decq || []; return S.ev; }
function people_(b) { return b.col && !b.col.outpost && b.col.pop > 0; }
function settled(noHome) { return colonies().filter(b => people_(b) && !(noHome && b.col.home)); }
function activeRoutes() { return S.fleets.filter(f => f.task && f.task.type === 'route'); }
function addFx(b, fx) { b.col.fx = (b.col.fx || []).filter(x => x.id !== fx.id); b.col.fx.push(fx); }
function colFx(b) {
  const r = {prod: 1, rp: 1, bc: 1, grow: 1, keep: false}, c = b.col;
  for (const x of c.fx || []) { if (x.until && S.year >= x.until) continue; if (x.prod != null) r.prod *= x.prod; if (x.rp != null) r.rp *= x.rp; if (x.bc != null) r.bc *= x.bc; if (x.grow != null) r.grow *= x.grow; if (x.keep) r.keep = true; }
  const inv = S.ev && S.ev.inv; if (inv && !inv.cured && inv.star === b.star) r.grow = 0;
  return r;
}
function lose(b, share) { const n = b.col.pop * share; b.col.pop = Math.max(0.001, b.col.pop - n); return n; }
function pplText(m) { return people(m); }
function evMsg(good, text, star) { msg(text, star, good ? 'evgood' : 'evbad'); journal(text, star); }
// ----- the events -----
const RANDOM_EVENTS = {
  // good
  pet: {type: 'good', ok: () => activeRoutes().some(f => !S.ev.pet), fire() {
    const f = pick(activeRoutes()); const t = f.task; S.ev.pet = {a: t.a, b: t.b};
    evMsg(true, 'A Freighter brought back a small, gentle animal from ' + ST(t.b).name + '. It has become the most popular pet in the ' + ST(t.a).name + ' system: trade coming back on the ' + routeName(t) + ' route is doubled.', t.a); }},
  mining: {type: 'good', ok: () => colonies(true).some(b => b.col.outpost && b.min < 2), fire() {
    const b = pick(colonies(true).filter(b => b.col.outpost && b.min < 2)); b.min = 2;
    evMsg(true, 'Mining boom! The outpost on ' + b.name + ' struck a rich vein. Its minerals are now rich.', b.star); }},
  genius: {type: 'good', ok: () => settled().length > 0, fire() {
    const b = pick(settled()); addFx(b, {id: 'genius', name: 'Brilliant mind', rp: 1.25, until: S.year + 30});
    evMsg(true, 'A brilliant mind has emerged on ' + b.name + '. Its research is 25% higher for 30 years.', b.star); }},
  cargo: {type: 'good', ok: () => S.fleets.some(f => f.dest == null && f.star !== 0 && f.ships.length), fire() {
    const f = pick(S.fleets.filter(f => f.dest == null && f.star !== 0 && f.ships.length)), v = ri(80, 150); S.bc = r1(S.bc + v);
    evMsg(true, 'Our ' + fleetName0(f) + ' at ' + ST(f.star).name + ' found a lost freighter container drifting in the system. Its cargo was worth ' + v + ' credits.', f.star); }},
  eureka: {type: 'good', ok: () => !!S.res, fire() {
    const c = techCost(S.res.tech), v = Math.round(c * 0.25); S.res.prog += v;
    evMsg(true, 'Eureka! A lucky insight puts our work on ' + TECH[S.res.tech].name + ' a quarter of the way ahead (+' + v + ' research).', null); }},
  donor: {type: 'good', ok: () => S.designs.some(d => d.mods.includes('colony') && !designReason(d)), fire() {
    const d = S.designs.find(d => d.mods.includes('colony') && !designReason(d)); const f = newFleetAt(0, d.id);
    evMsg(true, 'A billionaire has paid for a ' + d.name + ' as a gift to humanity. It is waiting in orbit at Earth.', 0); }},
  renaissance: {type: 'good', ok: () => colonies().some(b => ['city', 'core'].includes(stageOf(b)) && !b.col.home), fire() {
    const b = pick(colonies().filter(b => ['city', 'core'].includes(stageOf(b)) && !b.col.home)); addFx(b, {id: 'renaissance', name: 'Renaissance', bc: 1.25, until: S.year + 20});
    evMsg(true, b.name + ' has entered a cultural golden age. Its credits are 25% higher for 20 years.', b.star); }},
  // bad
  invasive: {type: 'bad', ok: () => activeRoutes().some(f => ST(f.task.a).bodies.some(id => people_(B(id)))), fire() {
    const f = pick(activeRoutes().filter(f => ST(f.task.a).bodies.some(id => people_(B(id))))), sid = f.task.a, s = ST(sid);
    const cols = s.bodies.map(B).filter(b => b.owner === 0 && b.col);
    let R = 0, P = 0; for (const b of cols) { const o = colOut(b); R += o.rp; P += o.prod; }
    R = Math.max(1, R); P = Math.max(1, P);
    S.ev.inv = {star: sid, need: 10 * R, prog: 0, k: 0.93 * R / P, since: S.year}; s.stock = 0;
    evMsg(false, 'An invasive species came back on a Freighter from ' + ST(f.task.b).name + ' and is destroying crops across the ' + s.name + ' system. Its food stores are gone, food output is halved and growth has stopped until a cure is found. Half the system\'s research now goes to the cure; its colonies can also put production toward it.', sid); }},
  comet: {type: 'bad', ok: () => settled(true).length > 0, fire() {
    const b = pick(settled(true)), cost = Math.max(40, Math.round(colOut(b).prod * 3.5));
    S.ev.comet = {body: b.id, by: S.year + 5, cost};
    S.ev.decq.push({k: 'comet', body: b.id});
    evMsg(false, 'A comet is on course for ' + b.name + '. Unless a deflector is built within 5 years, it will strike.', b.star); }},
  quake: {type: 'bad', ok: () => settled(true).length > 0, fire() {
    const b = pick(settled(true)), n = lose(b, 0.1); addFx(b, {id: 'quake', name: 'Quake swarm', prod: 0.5, grow: 0, until: S.year + 10});
    evMsg(false, 'A quake swarm has struck ' + b.name + ': ' + pplText(n) + ' people died. Its production is halved and growth has stopped for 10 years.', b.star); }},
  recession: {type: 'bad', ok: () => true, fire() {
    const e = colonies().find(b => b.col.home); addFx(e, {id: 'recession', name: 'Recession', prod: 0.75, bc: 0.75, until: S.year + 12});
    evMsg(false, 'A deep recession has hit Earth. Its production and credits are 25% lower for 12 years.', 0); }},
  disease: {type: 'bad', ok: () => colonies().some(b => ['settlement', 'city'].includes(stageOf(b)) && !b.col.home), fire() {
    const b = pick(colonies().filter(b => ['settlement', 'city'].includes(stageOf(b)) && !b.col.home)), n = lose(b, 0.15); addFx(b, {id: 'disease', name: 'Disease', grow: 0, until: S.year + 8});
    evMsg(false, 'Disease outbreak on ' + b.name + ': ' + pplText(n) + ' people died, and growth has stopped for 8 years.', b.star); }},
  strike: {type: 'bad', ok: () => settled(true).length > 0, fire() { const b = pick(settled(true)); S.ev.decq.push({k: 'strike', body: b.id}); }},
  // choices
  independence: {type: 'choice', ok: () => colonies().some(b => stageOf(b) === 'city' && d3(ST(b.star), ST(0)) > 10), fire() {
    const b = pick(colonies().filter(b => stageOf(b) === 'city' && d3(ST(b.star), ST(0)) > 10)); S.ev.decq.push({k: 'independence', body: b.id}); }},
  refugees: {type: 'choice', ok: () => settled(true).some(b => popCap(b) - b.col.pop >= 1), fire() { S.ev.decq.push({k: 'refugees'}); }},
};
function processEvents() {
  const E = evState();
  // running effects
  for (const b of colonies(true)) if (b.col.fx) {
    for (const x of b.col.fx) if (x.until && S.year >= x.until && !x.ended) { x.ended = true; msg(b.name + ': ' + x.name + ' has ended.', b.star, 'info'); }
    b.col.fx = b.col.fx.filter(x => !x.ended);
  }
  const inv = E.inv;
  if (inv && !inv.cured) {
    if (inv.prog >= inv.need || S.year - inv.since >= 30) { inv.cured = true; for (const b of ST(inv.star).bodies.map(B)) if (b.col) b.col.queue = b.col.queue.filter(it => it.kind !== 'cure'); evMsg(true, 'A cure for the invasive species in the ' + ST(inv.star).name + ' system has been found. Crops recover and growth resumes.', inv.star); }
  }
  const cm = E.comet;
  if (cm && !cm.done && S.year >= cm.by) {
    cm.done = true; const b = B(cm.body);
    if (b && b.owner === 0 && b.col) { const n = lose(b, 1 / 3); b.col.queue = b.col.queue.filter(it => it.kind !== 'deflect'); evMsg(false, 'The comet struck ' + b.name + '. ' + pplText(n) + ' people died.', b.star); }
  }
  // a new event?
  if (S.year < START_YEAR + EV_START || S.year - E.last < EV_GAP || rnd() > EV_CHANCE) return;
  const avail = t => Object.keys(RANDOM_EVENTS).filter(k => RANDOM_EVENTS[k].type === t && !E.done[k] && RANDOM_EVENTS[k].ok());
  let type;
  if (E.streak >= 2) type = 'good';
  else if (avail('choice').length && rnd() < 0.15) type = 'choice';
  else type = rnd() < clamp(0.5 - 0.15 * (E.goods - E.bads), 0.2, 0.85) ? 'good' : 'bad';
  let list = avail(type);
  if (!list.length && type !== 'bad') list = avail(type === 'good' ? 'choice' : 'good');
  if (!list.length) return;
  const k = pick(list); E.done[k] = S.year; E.last = S.year;
  const t = RANDOM_EVENTS[k].type;
  if (t === 'good') { E.goods++; E.streak = 0; } else if (t === 'bad') { E.bads++; E.streak++; }
  RANDOM_EVENTS[k].fire();
}
// ----- decisions (answered in a popup) -----
function decisionHTML(d) {
  const b = d.body != null ? B(d.body) : null;
  if (d.k === 'comet') { const cm = S.ev.comet; return {title: 'Comet threat', text: `A comet is on course for ${esc(b.name)}. It will strike in 5 years unless we build a deflector there (${cm.cost} production).`,
    opts: [['later', 'Decide later', 'The deflector can be ordered from the colony at any time before the deadline.'], ['build', 'Build the deflector now', 'It goes to the front of ' + esc(b.name) + '\'s build queue.']], go: b.id}; }
  if (d.k === 'strike') return {title: 'Strike on ' + esc(b.name), text: `Workers on ${esc(b.name)} have walked off the job, demanding better pay for the hard years of building a new world.`,
    opts: [['refuse', 'Refuse', esc(b.name) + ' makes 25% less production for 5 years.'], ['pay', 'Pay 50 credits', 'Work resumes at once.']], go: b.id};
  if (d.k === 'independence') return {title: 'Independence movement', text: `${esc(b.name)}, ${d3(ST(b.star), ST(0)).toFixed(1)} light-years from Earth, demands the right to govern itself.`,
    opts: [['refuse', 'Refuse', esc(b.name) + ' makes 25% less production for 10 years.'], ['grant', 'Grant self-rule', 'It keeps its own credits from now on, but grows 25% faster.']], go: b.id};
  if (d.k === 'refugees') { const cand = settled(true).filter(b => popCap(b) - b.col.pop >= 1);
    return {title: 'Refugee wave', text: `A crisis on Earth has left a million people wanting to leave for the colonies. Resettling them costs 350 credits.<div style="margin-top:8px">Settle them on: <select id="refpick">${cand.map(b => `<option value="${b.id}">${esc(b.name)} (${esc(ST(b.star).name)})</option>`).join('')}</select></div>`,
      opts: [['away', 'Turn them away', 'Nothing changes.'], ['take', 'Take them in', '−350 credits. The colony gains a million people and the space budget rises by 1.']]}; }
}
function resolveDecision(d, r) {
  const b = d.body != null ? B(d.body) : null;
  if (d.k === 'comet') { if (r === 'build' && b.col && !b.col.queue.some(it => it.kind === 'deflect')) b.col.queue.unshift({kind: 'deflect'}); return; }
  if (d.k === 'strike') { if (r === 'pay' && S.bc >= 50) { S.bc = r1(S.bc - 50); evMsg(true, 'Strike on ' + b.name + ': we paid 50 credits and work resumed.', b.star); } else { addFx(b, {id: 'strike', name: 'Strike', prod: 0.75, until: S.year + 5}); evMsg(false, 'Strike on ' + b.name + ': we refused. ' + b.name + ' makes 25% less production for 5 years.', b.star); } return; }
  if (d.k === 'independence') { if (r === 'grant') { addFx(b, {id: 'selfrule', name: 'Self-rule', keep: true, grow: 1.25}); evMsg(true, b.name + ' now governs itself: it keeps its own credits but grows 25% faster.', b.star); } else { addFx(b, {id: 'refused', name: 'Unrest', prod: 0.75, until: S.year + 10}); evMsg(false, 'We refused ' + b.name + '\'s demand for self-rule. It makes 25% less production for 10 years.', b.star); } return; }
  if (d.k === 'refugees') { if (r === 'take' && S.bc >= 350) { const t = B(+d.pick) || settled(true)[0]; S.bc = r1(S.bc - 350); t.col.pop += 1; evMsg(true, 'A million refugees from Earth have been resettled on ' + t.name + '.', t.star); budgetEvent(null, 1, 'Earth admires how the colonies took in its refugees.', t.star); } else { msg('We turned away the refugees from Earth.', 0, 'info'); journal('Turned away a wave of refugees from Earth.', 0); } }
}
