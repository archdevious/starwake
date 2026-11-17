'use strict';
// ===================== STARWAKE — BATTLE SCREEN =====================
const BUI = {B: null, s: 30, ox: 0, oy: 0, fx: [], disp: {}, pendingDeath: new Set(), pendingRetreat: new Set(), speed: 1, hover: null, waiting: false, log: [], resolve: null, skip: false};
const SQ3 = Math.sqrt(3);
function hexCenter(c, r) { return [BUI.ox + BUI.s * SQ3 * (c + 0.5 * (r & 1)) + BUI.s * SQ3 / 2, BUI.oy + BUI.s * 1.5 * r + BUI.s]; }
function pixToHex(x, y) {
  let best = null, bd = 1e9;
  for (let r = 0; r < BH; r++) for (let c = 0; c < BW; c++) { const [hx, hy] = hexCenter(c, r); const d = Math.hypot(hx - x, hy - y); if (d < bd) { bd = d; best = {c, r}; } }
  return bd <= BUI.s ? best : null;
}
function unitAt(c, r) { return BUI.B.units.find(u => u.c === c && u.r === r && ((u.alive && !u.retreated) || BUI.pendingDeath.has(u.uid) || BUI.pendingRetreat.has(u.uid))); }
function sideSummary(B, side) {
  const us = B.units.filter(u => side === 'me' ? u.owner === 0 : hostile(0, u.owner));
  let hp = 0, dpr = 0; const lines = [];
  for (const u of us) { hp += unitHp(u); dpr += unitDpr(u); lines.push(`${u.kind === 'planet' ? '🪐 ' + esc(u.name) + ' defenses' : esc(u.name) + (u.ships.length > 1 ? ' ×' + u.ships.length : '')} <span class="dim">(${E(u.owner).name === player().name ? '' : esc(E(u.owner).name)})</span>`); }
  return {pow: powerOf(hp, dpr), lines};
}
async function handleBattle(sid) {
  const owners = battleOwners(sid);
  if (owners.length < 2) return;
  if (!owners.includes(0)) { autoBattle(sid); return; }
  const B = createBattle(sid, true);
  const me = sideSummary(B, 'me'), them = sideSummary(B, 'them');
  const ratio = me.pow / Math.max(0.1, them.pow);
  const verdict = ratio > 2 ? '<span class="good">Overwhelming advantage</span>' : ratio > 1.25 ? '<span class="good">Advantage</span>' : ratio > 0.8 ? '<span class="warn">Even fight</span>' : ratio > 0.45 ? '<span class="bad">Disadvantage</span>' : '<span class="bad">Hopeless odds</span>';
  const v = await modal({title: '⚔️ Battle at ' + esc(ST(sid).name), w: 720, noClose: true,
    body: `<div class="row" style="gap:14px;align-items:flex-start"><div class="card" style="flex:1"><div class="sec" style="margin-top:0">Our forces</div><div class="small">${me.lines.join('<br>') || '<span class="dim">none</span>'}</div><div class="small dim" style="margin-top:6px">Strength ${Math.round(me.pow)}</div></div>
      <div class="card" style="flex:1"><div class="sec" style="margin-top:0">Enemy forces</div><div class="small">${them.lines.join('<br>')}</div><div class="small dim" style="margin-top:6px">Strength ${Math.round(them.pow)}</div></div></div>
      <div style="text-align:center;margin-top:6px">Estimate: <b>${verdict}</b></div>`,
    foot: `<button class="btn" data-a="mres" data-v="auto">Auto-resolve</button><button class="btn primary" data-a="mres" data-v="fight">Fight it yourself</button>`});
  if (v === 'auto') { runAutoBattle(B); const rep = finishBattle(B); await battleResultModal(rep); }
  else await fightBattle(B);
}
function battleResultModal(rep) {
  const rows = rep.owners.map(o => { const e = E(o); const lost = rep.lost[o] || 0, had = rep.had[o] || 0;
    const planets = rep.units.filter(u => u.owner === o && u.kind === 'planet');
    return `<tr><td><span class="swatch" style="background:${e.color}"></span> ${o === 0 ? 'Us' : esc(e.name)}</td><td>${had ? (had - lost) + ' of ' + had + ' ships remain' : '—'}</td><td>${planets.map(p => p.alive ? '<span class="good">defenses hold</span>' : '<span class="bad">defenses destroyed</span>').join(', ')}</td><td>${rep.units.some(u => u.owner === o && u.retreated) ? '<span class="warn">retreated</span>' : ''}</td></tr>`; }).join('');
  return modal({title: 'Battle result · ' + esc(ST(rep.star).name), w: 640, body: `<table class="list">${rows}</table><div class="small dim" style="margin-top:8px">${rep.rounds} round${rep.rounds !== 1 ? 's' : ''} fought.</div>`, foot: `<button class="btn primary" data-a="mclose">Continue</button>`});
}
function fightBattle(B) {
  return new Promise(resolve => {
    BUI.B = B; BUI._overShown = false; BUI.fx = []; BUI.log = []; BUI.pendingDeath = new Set(); BUI.pendingRetreat = new Set(); BUI.waiting = false; BUI.resolve = resolve; BUI.skip = false;
    const m = $('#modal');
    m.innerHTML = `<div class="mbox" style="max-width:1500px;height:92vh"><div class="mhead"><h2>⚔️ Battle at ${esc(ST(B.star).name)}</h2><div id="bround" class="amber"></div></div>
      <div class="mbody" style="display:flex;gap:12px;padding:10px;overflow:hidden"><div id="bwrap" style="flex:1;position:relative;min-width:0"><canvas id="bcv" style="position:absolute;inset:0;width:100%;height:100%"></canvas></div>
      <div style="width:290px;display:flex;flex-direction:column;gap:8px;min-height:0"><div id="binfo" class="card small" style="min-height:170px"></div><div class="card small" style="flex:1;overflow:auto" id="blog"></div></div></div>
      <div class="mfoot"><span id="bhint" class="small dim" style="flex:1"></span>
        <button class="btn sm" data-a="bSpeed" id="bspd">Speed 1×</button>
        <button class="btn" data-a="bEnd" id="bend">End ship's turn (Space)</button>
        <button class="btn" data-a="bAuto">Auto-play rest</button>
        <button class="btn danger" data-a="bRetreat">Retreat</button></div></div>`;
    m.classList.add('show'); m.dataset.kind = 'battle'; UI.modalNoClose = true;
    const cvs = $('#bcv');
    cvs.addEventListener('mousemove', e => { const r = cvs.getBoundingClientRect(); BUI.hover = pixToHex(e.clientX - r.left, e.clientY - r.top); renderBInfo(); });
    cvs.addEventListener('mouseleave', () => { BUI.hover = null; renderBInfo(); });
    cvs.addEventListener('click', e => { const r = cvs.getBoundingClientRect(); const h = pixToHex(e.clientX - r.left, e.clientY - r.top); if (h) bClick(h); });
    for (const u of B.units) BUI.disp[u.uid] = null;
    requestAnimationFrame(bFrame);
    setTimeout(bLoop, 50);
  });
}
function bLog(t) { BUI.log.unshift(t); if (BUI.log.length > 80) BUI.log.pop(); const el = $('#blog'); if (el) el.innerHTML = BUI.log.map(x => `<div style="margin-bottom:3px">${x}</div>`).join(''); }
function uName(u) { return `<span style="color:${E(u.owner).color}">${esc(u.name)}${u.kind === 'stack' && u.count0 > 1 ? '' : ''}</span>`; }
function bLoop() {
  const B = BUI.B; if (!B) return;
  if (BUI.skip) { runAutoBattle(B); BUI.fx = []; return bOver(); }
  const r = battleStep(B);
  playEvents().then(() => {
    if (r === 'input') { BUI.waiting = true; renderBInfo(); bHint(); const u = B.active; if (u && !targetsInRange(B, u).length && !enemiesOf(B, u).length) { playerEndUnit(B); BUI.waiting = false; bLoop(); } }
    else if (r === 'over' || B.over) bOver();
    else setTimeout(bLoop, 10);
  });
}
function bHint() {
  const B = BUI.B, u = B.active, el = $('#bhint'); if (!el) return;
  $('#bround').textContent = 'Round ' + Math.min(B.round, MAX_ROUNDS) + ' / ' + MAX_ROUNDS;
  if (!BUI.waiting || !u) { el.textContent = 'Enemy turn…'; return; }
  const tr = targetsInRange(B, u);
  el.innerHTML = `<b style="color:${E(0).color}">${esc(u.name)}${u.ships.length > 1 ? ' ×' + u.ships.length : ''}</b>: ` + (!u.moved ? 'click a highlighted hex to move' : 'moved') + ' · ' + (u.fired ? 'fired' : tr.length ? 'click a red-ringed enemy to fire' : 'no enemy in range');
}
function bClick(h) {
  const B = BUI.B; if (!BUI.waiting || !B.active) return;
  const u = B.active; const t = unitAt(h.c, h.r);
  if (t && t.alive && hostile(0, t.owner)) {
    if (u.fired) { toast('This ship already fired this round'); return; }
    if (hexDist(u, t) > maxRange(u)) { toast('Out of range (max ' + maxRange(u) + ' hexes)'); return; }
    fireAt(B, u, t); BUI.waiting = false;
    playEvents().then(() => { if (B.over || !battleContinues(B)) { playerEndUnit(B); return bLoop(); } if (u.moved || !u.alive) { playerEndUnit(B); bLoop(); } else { BUI.waiting = true; bHint(); renderBInfo(); } });
    return;
  }
  if (!t && !u.moved) {
    if (!reachable(B, u).has(h.c + ',' + h.r)) return;
    moveUnit(B, u, h.c, h.r); BUI.waiting = false;
    playEvents().then(() => { if (u.fired || !targetsInRange(B, u).length) { playerEndUnit(B); bLoop(); } else { BUI.waiting = true; bHint(); renderBInfo(); } });
  }
}
ACT.bEnd = () => { const B = BUI.B; if (!B || !BUI.waiting) return; BUI.waiting = false; playerEndUnit(B); bLoop(); };
ACT.bAuto = () => { const B = BUI.B; if (!B) return; B.autoPlayer = true; if (BUI.waiting) { BUI.waiting = false; aiActUnit(B, B.active); B.idx++; bLoop(); } };
ACT.bSpeed = () => { BUI.speed = BUI.speed === 1 ? 2 : BUI.speed === 2 ? 4 : BUI.speed === 4 ? 0 : 1; $('#bspd').textContent = BUI.speed ? 'Speed ' + BUI.speed + '×' : 'Instant'; if (!BUI.speed) { BUI.skip = true; if (BUI.waiting) { BUI.waiting = false; BUI.B.autoPlayer = true; bLoop(); } } };
ACT.bRetreat = () => {
  const B = BUI.B; if (!B) return;
  retreatOwner(B, 0); bLog('<span class="warn">Our ships withdraw from the battle.</span>');
  if (BUI.waiting) { BUI.waiting = false; playerEndUnit(B); }
  playEvents().then(() => { if (!battleContinues(B)) B.over = true; bLoop(); });
};
function bOver() {
  const B = BUI.B; if (BUI._overShown) return; BUI._overShown = true;
  B.active = null; BUI.waiting = false;
  if ($('#bhint')) $('#bhint').textContent = 'Battle over.'; renderBInfo();
  for (const id of ['bend', 'bspd']) { const b = $('#' + id); if (b) b.disabled = true; }
  const rep = finishBattle(B);
  const mine = B.units.filter(u => u.owner === 0);
  const won = !B.units.some(u => hostile(0, u.owner) && u.alive && !u.retreated) && mine.some(u => u.alive && !u.retreated);
  const text = won ? '<span class="good">Victory!</span>' : !mine.some(u => u.alive) ? '<span class="bad">Our forces were destroyed.</span>' : B.timeout ? '<span class="warn">The battle reached the 30-round limit.</span>' : '<span class="warn">The battle is over.</span>';
  const ov = document.createElement('div');
  ov.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a';
  ov.innerHTML = `<div class="card" style="padding:20px 30px;text-align:center;min-width:320px"><h2 style="margin-bottom:8px">${text}</h2><div class="small dim">${rep.owners.map(o => `${o === 0 ? 'We' : esc(E(o).name)} lost ${rep.lost[o] || 0} of ${rep.had[o] || 0} ships`).join('<br>')}</div><button class="btn primary" style="margin-top:14px" data-a="bClose">Continue</button></div>`;
  $('#bwrap').appendChild(ov);
}
ACT.bClose = () => { const r = BUI.resolve; BUI.B = null; BUI._overShown = false; const m = $('#modal'); m.classList.remove('show'); m.innerHTML = ''; m.dataset.kind = ''; if (r) r(); };

// ---------- event animation ----------
function playEvents() {
  const B = BUI.B; const evs = B.events.splice(0);
  if (!evs.length) return Promise.resolve();
  for (const e of evs) { if (e.type === 'fire' && e.dead) BUI.pendingDeath.add(e.t); if (e.type === 'retreat') BUI.pendingRetreat.add(e.uid); }
  if (BUI.skip || !BUI.speed) { for (const e of evs) logEvent(e); BUI.pendingDeath.clear(); BUI.pendingRetreat.clear(); BUI.disp = {}; return Promise.resolve(); }
  return evs.reduce((pr, e) => pr.then(() => animEvent(e)), Promise.resolve());
}
function unitByUid(uid) { return BUI.B.units.find(u => u.uid === uid); }
function logEvent(e) {
  if (e.type === 'fire') { const a = unitByUid(e.a), t = unitByUid(e.t); bLog(`${uName(a)} → ${uName(t)}: ${e.w}, ${e.hits}/${e.shots} hit${e.dmg ? ', ' + e.dmg + ' dmg' : ''}${e.kills ? `, <b class="bad">${t.kind === 'planet' ? 'defenses destroyed' : e.kills + ' destroyed'}</b>` : ''}`); }
  else if (e.type === 'round') bLog(`<span class="acc">— Round ${e.round} —</span>`);
}
function wait(ms) { return new Promise(r => setTimeout(r, ms / BUI.speed)); }
async function animEvent(e) {
  logEvent(e);
  if (e.type === 'move') {
    const [x0, y0] = hexCenter(e.from.c, e.from.r), [x1, y1] = hexCenter(e.to.c, e.to.r);
    const t0 = performance.now(), dur = 260 / BUI.speed;
    await new Promise(res => { const step = () => { const k = Math.min(1, (performance.now() - t0) / dur); BUI.disp[e.uid] = [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]; if (k < 1) requestAnimationFrame(step); else { BUI.disp[e.uid] = null; res(); } }; step(); });
  } else if (e.type === 'fire') {
    const a = unitByUid(e.a), t = unitByUid(e.t);
    const [x0, y0] = hexCenter(a.c, a.r), [x1, y1] = hexCenter(t.c, t.r);
    const now = performance.now(), dur = (e.missile ? 520 : 380) / BUI.speed;
    BUI.fx.push({kind: e.missile ? 'missile' : 'beam', x0, y0, x1, y1, t0: now, dur, color: e.color, n: Math.min(6, Math.max(1, Math.round(e.shots / 2)))});
    await wait(e.missile ? 420 : 240);
    BUI.fx.push({kind: 'text', x: x1, y: y1 - BUI.s * 0.6, t0: performance.now(), dur: 900 / BUI.speed, text: e.hits ? (e.dmg ? '-' + e.dmg : 'blocked') : 'miss', color: e.dmg ? '#ffd0a0' : '#a0b0c8'});
    if (e.hits) BUI.fx.push({kind: 'flash', x: x1, y: y1, t0: performance.now(), dur: 250 / BUI.speed, color: e.color});
    if (e.kills) BUI.fx.push({kind: 'boom', x: x1, y: y1, t0: performance.now(), dur: 700 / BUI.speed, big: e.dead});
    await wait(220);
    if (e.dead) BUI.pendingDeath.delete(e.t);
  } else if (e.type === 'retreat') { await wait(200); BUI.pendingRetreat.delete(e.uid); }
  else if (e.type === 'round') { $('#bround') && ($('#bround').textContent = 'Round ' + Math.min(e.round, MAX_ROUNDS) + ' / ' + MAX_ROUNDS); await wait(250); }
}
function renderBInfo() {
  const B = BUI.B, el = $('#binfo'); if (!B || !el) return;
  let u = BUI.hover ? unitAt(BUI.hover.c, BUI.hover.r) : null; if (!u) u = B.active;
  if (!u) { el.innerHTML = '<span class="dim">Hover over a ship to see its details.</span>'; return; }
  const e = E(u.owner);
  el.innerHTML = `<div class="row"><b style="color:${e.color}">${esc(u.name)}</b>${u.kind === 'stack' && u.ships.length > 1 ? ` <span class="dim">×${u.ships.length}</span>` : ''}</div><div class="tiny dim">${u.owner === 0 ? 'Ours' : esc(e.name)}${u === B.active ? ' · acting now' : ''}</div>
    <div style="margin-top:5px">Hit points: <b>${Math.round(unitHp(u))}</b>${u.kind === 'stack' ? ` <span class="dim">(${u.maxHp} each)</span>` : ` / ${u.maxHp}`}</div>
    <div>Attack ${u.attack} · Defense ${u.defense} · Shield ${u.shield}</div>${u.kind === 'stack' ? `<div>Movement ${u.speed} hexes</div>` : ''}
    <div style="margin-top:5px">${u.weapons.map(w => `${w.n * (u.kind === 'stack' ? u.ships.length : 1)}× ${esc(w.name)} <span class="dim">${w.dmg[0] === w.dmg[1] ? w.dmg[0] : w.dmg.join('-')} dmg, range ${w.range}${w.type === 'missile' ? ', ' + w.ammoLeft + ' volleys left' : ''}</span>`).join('<br>') || '<span class="dim">Unarmed</span>'}</div>
    ${u.ecm ? '<div class="tiny acc">ECM Jammer</div>' : ''}${u.drones ? '<div class="tiny acc">Repair Drones</div>' : ''}`;
}
function bFrame() {
  const B = BUI.B; const cvs = $('#bcv'); if (!B || !cvs) return;
  const dpr = window.devicePixelRatio || 1; const W = cvs.clientWidth, H = cvs.clientHeight;
  if (cvs.width !== Math.round(W * dpr)) { cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr); }
  const c = cvs.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  BUI.s = Math.min((W - 10) / (SQ3 * (BW + 0.5)), (H - 10) / (1.5 * BH + 0.5));
  BUI.ox = (W - BUI.s * SQ3 * (BW + 0.5)) / 2; BUI.oy = (H - BUI.s * (1.5 * BH + 0.5)) / 2;
  const s = BUI.s, now = performance.now();
  c.fillStyle = '#04070f'; c.fillRect(0, 0, W, H);
  const sc = STAR_TYPES[ST(B.star).type].color; const g = c.createRadialGradient(W * 0.5, -H * 0.3, 0, W * 0.5, -H * 0.3, H * 1.1); g.addColorStop(0, hexA(sc, 0.22)); g.addColorStop(1, hexA(sc, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 140; i++) { const x = (i * 9301 + 49297) % 233280 / 233280 * W, y = (i * 4096 + 150889) % 714025 / 714025 * H; c.fillStyle = 'rgba(200,215,255,.35)'; c.fillRect(x, y, 1.2, 1.2); }
  const act = BUI.waiting ? B.active : null;
  const reach = act && !act.moved ? reachable(B, act) : null;
  const inRangeSet = new Set(act && !act.fired ? targetsInRange(B, act).map(t => t.uid) : []);
  for (let r = 0; r < BH; r++) for (let col = 0; col < BW; col++) {
    const [x, y] = hexCenter(col, r);
    c.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const px = x + Math.cos(a) * s * 0.97, py = y + Math.sin(a) * s * 0.97; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath();
    const k = col + ',' + r;
    if (reach && reach.has(k) && reach.get(k) > 0 && !unitAt(col, r)) { c.fillStyle = 'rgba(90,209,255,.13)'; c.fill(); }
    c.strokeStyle = BUI.hover && BUI.hover.c === col && BUI.hover.r === r ? 'rgba(255,255,255,.5)' : 'rgba(80,110,170,.18)'; c.lineWidth = 1; c.stroke();
  }
  for (const u of B.units) {
    const visible = (u.alive && !u.retreated) || BUI.pendingDeath.has(u.uid) || BUI.pendingRetreat.has(u.uid);
    if (!visible) continue;
    const p = BUI.disp[u.uid] || hexCenter(u.c, u.r); const [x, y] = p;
    const col = E(u.owner).color;
    if (u.kind === 'planet') {
      const t = PT[u.ptype]; const rr = s * 0.9; const gg = c.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 1, x, y, rr); gg.addColorStop(0, t.color); gg.addColorStop(0.75, t.c2); gg.addColorStop(1, '#05070d');
      c.fillStyle = gg; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(x, y, rr + 3, 0, TAU); c.stroke();
    } else {
      const rr = s * 0.55 * (HULL_SCALE[u.hull] || 1);
      drawShip(c, x, y, rr, u.hull, col, u.side === 'L' ? 0 : Math.PI);
      if (u.ships.length > 1) { c.fillStyle = '#0b1120dd'; c.fillRect(x + s * 0.25, y + s * 0.18, s * 0.6, s * 0.38); c.fillStyle = '#fff'; c.font = `bold ${Math.round(s * 0.32)}px Segoe UI, sans-serif`; c.textAlign = 'center'; c.fillText('×' + u.ships.length, x + s * 0.55, y + s * 0.47); }
    }
    // hp bar
    const tot = u.kind === 'planet' ? u.maxHp : Math.max(1, u.ships.length) * u.maxHp;
    const frac = clamp(unitHp(u) / tot, 0, 1);
    c.fillStyle = '#0008'; c.fillRect(x - s * 0.5, y - s * 0.78, s, 4); c.fillStyle = frac > 0.5 ? '#5be08a' : frac > 0.25 ? '#ffcf4a' : '#ff5d5d'; c.fillRect(x - s * 0.5, y - s * 0.78, s * frac, 4);
    if (u === act) { c.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(now / 200)})`; c.lineWidth = 2; c.beginPath(); c.arc(x, y, s * 0.8, 0, TAU); c.stroke(); }
    if (inRangeSet.has(u.uid)) { c.strokeStyle = '#ff5050'; c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.arc(x, y, s * 0.85, 0, TAU); c.stroke(); c.setLineDash([]); }
    if (BUI.pendingRetreat.has(u.uid)) { c.fillStyle = 'rgba(4,7,15,.5)'; c.beginPath(); c.arc(x, y, s * 0.7, 0, TAU); c.fill(); }
  }
  // effects
  BUI.fx = BUI.fx.filter(f => now - f.t0 < f.dur);
  for (const f of BUI.fx) {
    const k = (now - f.t0) / f.dur;
    if (f.kind === 'beam') {
      c.strokeStyle = hexA(f.color, 1 - k); c.lineWidth = 2.5; c.shadowColor = f.color; c.shadowBlur = 10;
      for (let i = 0; i < f.n; i++) { const off = (i - (f.n - 1) / 2) * 3; c.beginPath(); c.moveTo(f.x0, f.y0 + off); c.lineTo(f.x1 + (i * 7 % 5 - 2), f.y1 + off); c.stroke(); }
      c.shadowBlur = 0;
    } else if (f.kind === 'missile') {
      for (let i = 0; i < f.n; i++) { const kk = clamp(k * 1.25 - i * 0.06, 0, 1); const x = f.x0 + (f.x1 - f.x0) * kk, y = f.y0 + (f.y1 - f.y0) * kk + Math.sin(kk * Math.PI) * (i - f.n / 2) * 6; c.fillStyle = f.color; c.beginPath(); c.arc(x, y, 2.5, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,180,80,.6)'; c.beginPath(); c.arc(x - (f.x1 - f.x0) * 0.02, y, 1.8, 0, TAU); c.fill(); }
    } else if (f.kind === 'flash') { c.fillStyle = hexA(f.color, 0.6 * (1 - k)); c.beginPath(); c.arc(f.x, f.y, s * 0.5 * (0.5 + k), 0, TAU); c.fill(); }
    else if (f.kind === 'boom') { for (let i = 0; i < 3; i++) { c.strokeStyle = `rgba(255,${180 - i * 50},60,${1 - k})`; c.lineWidth = 3 - i; c.beginPath(); c.arc(f.x, f.y, s * (0.3 + k * (f.big ? 1.2 : 0.7)) * (1 - i * 0.2), 0, TAU); c.stroke(); } }
    else if (f.kind === 'text') { c.fillStyle = hexA(f.color.length === 7 ? f.color : '#ffffff', 1 - k); c.font = `bold ${Math.round(s * 0.42)}px Segoe UI, sans-serif`; c.textAlign = 'center'; c.fillText(f.text, f.x, f.y - k * s * 0.6); }
  }
  requestAnimationFrame(bFrame);
}
