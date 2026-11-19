'use strict';
// ===================== STARWAKE v2 — UI CORE & 3D STAR MAP =====================
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = v => (Math.round(v * 10) / 10).toLocaleString();
const sgn = v => (v >= 0 ? '+' : '') + fmt(v);
function people(m) { // millions -> words
  if (m <= 0) return 'none';
  if (m >= 1000) return (m / 1000).toFixed(1).replace(/\.0$/, '') + ' billion';
  if (m >= 1) return (m >= 100 ? Math.round(m) : +m.toFixed(1)) + ' million';
  const n = m * 1e6; return (n < 10000 ? Math.round(n / 100) * 100 : Math.round(n / 1000) * 1000).toLocaleString();
}
function pct(v) { return v >= 0.9999 ? '99.99%' : Math.round(v * 100) + '%'; }
function hexA(c, a) { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
const UI = {cam: {tx: 0, ty: 0, tz: 0, yaw: 0.6, pitch: 0.95, zoom: 14}, selStar: null, selFleet: null, view: null, viewId: null, hoverStar: null, busy: false,
  dirty: true, drag: null, pts: [], fleetBoxes: [], newsOpen: true, buildTab: 'proj', fleetSel: {}, routeSetup: null};
const ACT = {};
document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; const f = ACT[el.dataset.a]; if (f) { e.stopPropagation(); if (el.tagName === 'BUTTON' || el.classList.contains('opt') || el.classList.contains('tech')) sfx('click'); f(el.dataset.v, el, e); } });
document.addEventListener('change', e => { const el = e.target.closest('[data-c]'); if (!el) return; const f = ACT[el.dataset.c]; if (f) f(el.value, el, e); });
function toast(t, ms) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(UI._tt); UI._tt = setTimeout(() => el.classList.remove('show'), ms || 2400); }
function bodyColor(b) {
  const m = {gasgiant: ['#d6b088', '#7a5a3a'], icegiant: ['#8fd0e8', '#2a5a7a'], minineptune: ['#9ec4e8', '#3a5a8a'], ocean: ['#3a7ae0', '#123a80'], ice: ['#dfeaf2', '#7890a0'],
    molten: ['#ff7a3a', '#6a1a08'], belt: ['#9a948c', '#4a4642'], dwarf: ['#b8b0a8', '#5a5450'], moon: ['#bdb6ae', '#55504a'], rocky: ['#b08a6a', '#5a3a2a'], superearth: ['#a8906a', '#4a3a2a']}[b.cls] || ['#aaa', '#444'];
  if (b.life === 'ecosystem' && (lifeKnown(b))) return ['#5fc070', '#1f5a2a'];
  if (b.name === 'Earth') return ['#4a9be0', '#2e7d3a'];
  if (b.temp === 'scorching' && b.cls !== 'molten') return ['#e0a070', '#7a3a1a'];
  return m;
}
function habSeen(b) { // before life is known, the rating ignores hidden native life
  if (lifeKnown(b) || !b.toxicLife) return hab(b);
  b.toxicLife = false; const h = hab(b); b.toxicLife = true; return h;
}
const SETTINGS = (() => { try { return Object.assign({near: 3, music: 40, sfx: 60}, JSON.parse(localStorage.getItem('starwake.settings') || '{}')); } catch (e) { return {near: 3, music: 40, sfx: 60}; } })();
function saveSettings() { try { localStorage.setItem('starwake.settings', JSON.stringify(SETTINGS)); } catch (e) {} }
// ---------- hotkeys (editable in Settings) ----------
const HOTKEYS = [['endTurn', 'End the year', 'Enter'], ['skip', 'Skip ahead until something happens', 'f'], ['idle', 'Next idle colony or ship', ' '],
  ['research', 'Research', 'r'], ['design', 'Ship design', 'd'], ['colonies', 'Colonies', 'c'], ['journal', 'Journal', 'j'], ['home', 'Center the map on the Sun', 'h'], ['near', 'Show or hide nearest-star lines', 'n'], ['diplo', 'Diplomacy', 'p']];
const normKey = k => k.length === 1 ? k.toLowerCase() : k;
function hotkey(act) { const s = SETTINGS.keys && SETTINGS.keys[act]; return s != null ? s : HOTKEYS.find(h => h[0] === act)[2]; }
function keyName(k) { return k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k.replace(/^Arrow/, '').replace(/^./, c => c.toUpperCase()); }
function keyAction(k) { const h = HOTKEYS.find(h => hotkey(h[0]) === k); return h ? h[0] : null; }
function keyTitles() {
  const a = $('#ffwd'), b = $('#endturn');
  if (a) a.title = `Skip years until something happens (${keyName(hotkey('skip'))})`;
  if (b) b.title = `End the year (${keyName(hotkey('endTurn'))})`;
}
function nearest3(sid) { const s0 = ST(sid); return S.stars.filter(s => s.id !== sid && S.known[s.id]).map(s => ({s, d: d3(s0, s)})).sort((a, b) => a.d - b.d).slice(0, SETTINGS.near); }
function telText(r) { return r > 0 ? (Math.round(r * 10) / 10) + ' ly' : 'none (sees worlds only in orbit)'; }
function lifeKnown(b) { return b.star === 0 || b.owner === 0 || !!S.surveyed[b.star]; }
function planetBall(b, px) {
  px = px || 30; const [c1, c2] = bodyColor(b);
  const bg = b.cls === 'belt' ? `radial-gradient(circle at 30% 30%,#aaa 0 10%,transparent 11%),radial-gradient(circle at 70% 60%,#888 0 12%,transparent 13%),radial-gradient(circle at 45% 75%,#999 0 9%,transparent 10%),radial-gradient(circle at 60% 25%,#777 0 7%,transparent 8%)`
    : `radial-gradient(circle at 32% 30%, ${c1} 0%, ${c2} 70%, #05070d 100%)`;
  const ring = b.traits.includes('rings') ? ';box-shadow:inset -6px -6px 10px #0009,0 0 0 2px #d6b08855' : '';
  return `<div class="pball" style="width:${px}px;height:${px}px;background:${bg}${b.cls === 'belt' ? ';box-shadow:none' : ring}"></div>`;
}

// ---------- top bar ----------
function renderTop() {
  if (!S) return;
  const t = totals(); const res = S.res ? TECH[S.res.tech] : null;
  const short = colonyStars().filter(s => ST(s).short);
  $('#res').innerHTML = `
    <div class="chip" title="Year (turn)"><span class="k">Year</span><b>${S.year}</b><span class="dim small">${S.turn}/${S.maxTurns}</span></div>
    <div class="chip" title="Credits (income minus ship upkeep)"><span class="k">Credits</span><b>${fmt(Math.floor(S.bc))}</b><span class="${t.net >= 0 ? 'good' : 'bad'}">${sgn(t.net)}</span></div>
    <div class="chip" title="Population"><span class="k">Population</span><b>${people(t.pop)}</b></div>
    <div class="chip click rchip ${!res && availableTechs().length ? 'residle' : ''}" data-a="openResearch" title="${!res && availableTechs().length ? 'Nothing is being researched. Click to choose.' : 'Research'}"><span class="k">Research</span>${res ? `<span class="ell" title="${esc(res.name)}">${esc(res.name)}</span><span class="dim">${Math.floor(S.res.prog + S.rpBank)}/${techCost(S.res.tech)}</span>` : (availableTechs().length ? '<span class="bad">Choose research!</span>' : '<span class="dim">All known</span>')}<span class="acc">+${fmt(t.rp)}</span></div>
    ${short.length ? `<div class="chip click" data-a="goStar" data-v="${short[0]}"><span class="bad">Food shortage: ${short.map(s => esc(ST(s).name)).join(', ')}</span></div>` : ''}
    <div class="chip" title="Top ship speed, as a share of light speed"><span class="k">Top speed</span><b>${pct(topSpeed())}</b></div><span id="attn"></span>`;
  renderAttn();
  const db = $('#diplobtn'); if (db) db.style.display = S.contact ? '' : 'none';
}
// ---------- "needs attention" button ----------
const starOrder = () => { const o = {}; S.stars.forEach((s, i) => o[s.id] = i); return o; };
function idleWorlds() {
  const o = starOrder();
  return S.bodies.filter(b => b.owner === 0 && b.col && !b.col.queue.length && !supplyTarget(b))
    .map(b => ({b, k: o[b.star] * 1000 + ST(b.star).bodies.indexOf(b.id)})).sort((a, b) => a.k - b.k);
}
function idleFleets() { return S.fleets.filter(f => f.ships.length && ((f.dest == null && f.star != null && !f.task && !f.auto) || (f.task && f.task.type === 'route' && f.task.warn))).sort((a, b) => a.id - b.id); }
function attnKinds() {
  const k = [];
  const w = idleWorlds(); if (w.length) k.push({kind: 'world', n: w.length, list: w});
  const f = idleFleets(); if (f.length) k.push({kind: 'fleet', n: f.length, list: f});
  return k;
}
// What the next click (or hotkey) goes to: the next idle colony or ship after the last one shown; past the last of a kind it
// moves on to the other kind, so it goes round colonies → ships → colonies. Research has its own red box on the research bar.
function attnPlan(ks) {
  if (!ks.length) return null;
  const i = ks.findIndex(x => x.kind === UI.attnKind);
  if (i < 0) { const ord = ['world', 'fleet'], at = ord.indexOf(UI.attnKind); const n = ks.find(x => ord.indexOf(x.kind) > at) || ks[0]; return {a: n, item: n.list[0]}; }
  const a = ks[i];
  if (a.kind === 'world') { const j = UI.attnWorld == null ? 0 : a.list.findIndex(x => x.k > UI.attnWorld); if (j >= 0) return {a, item: a.list[j]}; }
  else { const f = UI.attnFleet == null ? a.list[0] : a.list.find(f => f.id > UI.attnFleet); if (f) return {a, item: f}; }
  const n = ks[(i + 1) % ks.length]; return {a: n, item: n.list[0]};
}
function renderAttn() {
  const el = $('#attn'); if (!el || !S) return;
  const ks = attnKinds();
  if (!ks.length) { el.innerHTML = `<div class="chip dim" title="Nothing needs your attention">Nothing idle</div>`; return; }
  const word = a => a.kind === 'world' ? `${a.n} ${a.n === 1 ? 'colony' : 'colonies'}` : `${a.n} ${a.n === 1 ? 'ship' : 'ships'}`;
  // underline the kind you are looking at now (the one the button last took you to)
  const parts = ks.map(a => `<span class="${a.kind === 'fleet' ? 'warn' : 'bad'} ${a.kind === UI.attnKind ? 'attnnext' : ''}">${word(a)}</span>`).join('<span class="dim">·</span>');
  el.innerHTML = `<div class="chip click attn" data-a="attnGo" title="Colonies with nothing being built, and ships waiting for orders (or freighters whose route is not at full value). Click or press ${keyName(hotkey('idle'))} to go to the next one: colonies first, then ships. The underlined one is what you are looking at."><span class="k">Idle</span>${parts}</div>`;
}
ACT.attnGo = () => {
  if (!S) return;
  const p = attnPlan(attnKinds()); if (!p) return;
  UI.attnKind = p.a.kind;
  if (p.a.kind === 'world') { UI.attnWorld = p.item.k; selectColony(p.item.b.id); centerOn(p.item.b.star); }
  else { const f = p.item; UI.attnFleet = f.id; selectFleet(f.id); if (f.star != null) centerOn(f.star); else { const [ox, oy] = sideShift(); UI.cam.tx = f.x + ox; UI.cam.ty = f.y + oy; UI.cam.tz = 0; UI.dirty = true; } }
  renderAttn();
};

// ---------- 3D map ----------
const cv = () => $('#map');
function mapSize() { const c = cv(); return {w: c.clientWidth, h: c.clientHeight}; }
function proj(x, y, z) {
  const C = UI.cam, {w, h} = mapSize();
  const dx = x - C.tx, dy = y - C.ty, dz = z - C.tz;
  const cy = Math.cos(C.yaw), sy = Math.sin(C.yaw);
  const x1 = dx * cy - dy * sy, y1 = dx * sy + dy * cy;
  return [w / 2 + x1 * C.zoom, h / 2 + (y1 * Math.sin(C.pitch) - dz * Math.cos(C.pitch)) * C.zoom, y1 * Math.cos(C.pitch) + dz * Math.sin(C.pitch)];
}
let FAR = null;
function farField() {
  if (FAR) return FAR;
  let sd = 12345; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const g = () => r() + r() + r() - 1.5;
  FAR = {pts: [], haze: [], bg: []};
  const R = S.radius;
  for (let i = 0; i < 9000; i++) { const a = r() * TAU, d = R + 2 + Math.pow(r(), 0.55) * 90; FAR.pts.push([Math.cos(a) * d, Math.sin(a) * d, g() * (2.5 + d * 0.1), d, r()]); }
  for (let i = 0; i < 360; i++) { const a = r() * TAU, d = R + 3 + Math.pow(r(), 0.7) * 80; FAR.haze.push([Math.cos(a) * d, Math.sin(a) * d, g() * (2 + d * 0.08), d, 18 + r() * 40, Math.floor(r() * 4)]); }
  for (let i = 0; i < 500; i++) FAR.bg.push([r(), r(), r()]);
  return FAR;
}
function fleetsAtStar(sid) { return S.fleets.filter(f => f.star === sid && f.dest == null); }
// where a travelling ship's icon is drawn: kept clear of nearby stars so stars stay easy to click.
// A ship still at its starting star is pushed out along its route, so it sits on its own path line.
function movePos(f) {
  const p = proj(f.x, f.y, f.z), d = ST(f.dest), q = proj(d.x, d.y, d.z);
  const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
  let px = p[0], py = p[1];
  for (const sp of UI.pts) {
    const dx = px - sp.x, dy = py - sp.y, dd = Math.hypot(dx, dy); if (dd >= 38) continue;
    const ux = dd > 0.5 ? dx / dd : Math.cos(ang), uy = dd > 0.5 ? dy / dd : Math.sin(ang);
    px = sp.x + ux * 38; py = sp.y + uy * 38;
    if (dd <= 0.5) {
      // also slide clear of the ships parked in orbit at this star
      const n = S.fleets.filter(o => o.star === sp.id && o.dest == null).length, top = sp.y - (n - 1) * 13.5;
      for (let k = 0; k < 20; k++) {
        let hit = false; for (let i = 0; i < n; i++) if (Math.hypot(px - (sp.x + 42), py - (top + i * 27)) < 24) { hit = true; break; }
        if (!hit) break; px += ux * 6; py += uy * 6;
      }
    }
  }
  return {px, py, ang};
}
function drawMap() {
  const c = cv(); if (!c || !S) return;
  const dpr = window.devicePixelRatio || 1, {w, h} = mapSize();
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const C = UI.cam, R = S.radius, F = farField();
  const g0 = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.8); g0.addColorStop(0, '#071022'); g0.addColorStop(1, '#010208'); x.fillStyle = g0; x.fillRect(0, 0, w, h);
  for (const [a, b2, t] of F.bg) { x.fillStyle = `rgba(200,215,255,${t * 0.35})`; x.fillRect(a * w, b2 * h, 1, 1); }
  // distant galaxy beyond reach
  const hz = ['120,100,170', '170,120,90', '90,120,180', '150,90,130'];
  for (const p of F.haze) { const [sx, sy] = proj(p[0], p[1], p[2]); const al = Math.max(0, 0.05 - (p[3] - R) / 2400); const rad = p[4] * C.zoom / 14; const g = x.createRadialGradient(sx, sy, 0, sx, sy, rad); g.addColorStop(0, `rgba(${hz[p[5]]},${al})`); g.addColorStop(1, `rgba(${hz[p[5]]},0)`); x.fillStyle = g; x.fillRect(sx - rad, sy - rad, rad * 2, rad * 2); }
  for (const p of F.pts) { const [sx, sy] = proj(p[0], p[1], p[2]); if (sx < -5 || sy < -5 || sx > w + 5 || sy > h + 5) continue; const fade = Math.min(1, (p[3] - R) / 6); const al = Math.max(0.05, 0.85 - (p[3] - R) / 110) * fade; x.fillStyle = p[4] < 0.55 ? `rgba(255,175,135,${al})` : p[4] < 0.85 ? `rgba(255,238,205,${al})` : `rgba(175,200,255,${al})`; const sz = p[4] < 0.04 ? 1.8 : p[4] < 0.3 ? 1.2 : 0.8; x.fillRect(sx, sy, sz, sz); }
  // grid on the reference plane (through the Sun)
  const ring = (rad, cx0, cy0, style, width, dash) => { x.strokeStyle = style; x.lineWidth = width || 1; if (dash) x.setLineDash(dash); x.beginPath(); for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU; const [sx, sy] = proj(cx0 + Math.cos(a) * rad, cy0 + Math.sin(a) * rad, 0); i ? x.lineTo(sx, sy) : x.moveTo(sx, sy); } x.stroke(); x.setLineDash([]); };
  for (let r = 5; r <= R; r += 5) { ring(r, 0, 0, 'rgba(70,100,160,.16)'); const [lx, ly] = proj(r, 0, 0); x.fillStyle = 'rgba(120,150,200,.45)'; x.font = '10px Segoe UI, sans-serif'; x.textAlign = 'left'; x.fillText(r + ' ly', lx + 3, ly - 2); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; const [ax, ay] = proj(0, 0, 0), [bx, by] = proj(Math.cos(a) * R, Math.sin(a) * R, 0); x.strokeStyle = 'rgba(70,100,160,.09)'; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); }
  ring(R + 1, 0, 0, 'rgba(120,200,255,.5)', 1.5, [7, 6]);
  { const [ex, ey] = proj(0, -(R + 1), 0); x.fillStyle = 'rgba(150,210,255,.7)'; x.font = 'italic 12px Segoe UI, sans-serif'; x.textAlign = 'center'; x.fillText('Limit of reach: beyond lies centuries of travel', ex, ey + 16); }
  // distant beacons
  x.textAlign = 'left';
  for (const f of FAR_STARS) { const [sx, sy] = proj(f.d[0] * (R + 9), f.d[1] * (R + 9), f.d[2] * (R + 9)); x.fillStyle = 'rgba(150,165,200,.6)'; x.font = '13px Segoe UI, sans-serif'; x.fillText('✧', sx - 5, sy + 4); x.font = 'italic 10.5px Segoe UI, sans-serif'; x.fillStyle = 'rgba(130,145,180,.6)'; x.fillText(f.n + ' · ' + f.ly + ' ly', sx + 8, sy + 4); }
  // stars
  const showPins = C.pitch < 1.45;
  const items = [];
  UI.pts = [];
  for (const s of S.stars) { if (!S.known[s.id]) continue; const p = proj(s.x, s.y, s.z); items.push({s, p}); UI.pts.push({id: s.id, x: p[0], y: p[1]}); }
  items.sort((a, b) => a.p[2] - b.p[2]);
  const LABELS = [];
  for (const {s, p} of items) {
    const vis = !!S.visited[s.id]; const k = starKind(s.sp);
    if (showPins) { const f = proj(s.x, s.y, 0); x.strokeStyle = s.z >= 0 ? 'rgba(140,170,220,.33)' : 'rgba(150,120,180,.3)'; x.lineWidth = 1; x.beginPath(); x.moveTo(f[0], f[1]); x.lineTo(p[0], p[1]); x.stroke(); x.beginPath(); x.ellipse(f[0], f[1], 3, 3 * Math.cos(C.pitch), 0, 0, TAU); x.stroke(); }
    const rr = (vis ? 5 : 3.4) * clamp(C.zoom / 14, 0.75, 1.6) * (k.giant || k.cls === 'A' || k.cls === 'B' ? 1.3 : 1);
    const gg = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr * 3.2); gg.addColorStop(0, k.color + (vis ? 'cc' : '4d')); gg.addColorStop(1, k.color + '00'); x.fillStyle = gg; x.beginPath(); x.arc(p[0], p[1], rr * 3.2, 0, TAU); x.fill();
    x.fillStyle = vis ? k.color : k.color + '88'; x.beginPath(); x.arc(p[0], p[1], rr * 0.6, 0, TAU); x.fill();
    const ours = s.bodies.some(bid => B(bid).owner === 0);
    if (ours) { x.strokeStyle = S.empire.color; x.lineWidth = 2; x.beginPath(); x.arc(p[0], p[1], rr + 4, 0, TAU); x.stroke(); }
    if (UI.selStar === s.id) { x.strokeStyle = '#ffffffcc'; x.lineWidth = 1.5; x.setLineDash([4, 4]); x.beginPath(); x.arc(p[0], p[1], rr + 9, 0, TAU); x.stroke(); x.setLineDash([]); }
    if (UI.hoverStar === s.id) { x.strokeStyle = '#ffffff66'; x.lineWidth = 1; x.beginPath(); x.arc(p[0], p[1], rr + 8, 0, TAU); x.stroke(); }
    let mk = '';
    if (s.guardKnown) mk += '⚠';
    if (vis && s.anom && !s.anomDone) mk += '◆';
    if (mk) { x.font = '12px Segoe UI, sans-serif'; x.textAlign = 'left'; x.fillStyle = s.guardKnown ? '#ff5d5d' : '#ffb84a'; x.fillText(mk, p[0] + rr + 3, p[1] - rr - 1); }
    if (lifeVisible(s)) { const lf = s.bodies.map(B).some(b => b.life === 'ecosystem' && b.star !== 0) ? '#5be08a' : s.bodies.map(B).some(b => b.life === 'microbial' && b.star !== 0) ? '#2ee6d6' : null; if (lf) { x.fillStyle = lf; x.beginPath(); x.arc(p[0] - rr - 4, p[1] - rr - 2, 2.6, 0, TAU); x.fill(); } }
    LABELS.push({s, p, rr, pri: s.id === 0 ? 4 : ours ? 3 : UI.selStar === s.id ? 3.5 : vis ? 2 : 1});
  }
  // the 3 nearest systems to the selected star
  if (UI.selStar != null && S.known[UI.selStar]) {
    const s0 = ST(UI.selStar), p0 = proj(s0.x, s0.y, s0.z);
    nearest3(UI.selStar).forEach(({s, d}, i) => {
      const p = proj(s.x, s.y, s.z);
      x.strokeStyle = 'rgba(255,214,120,.45)'; x.lineWidth = 1.2; x.setLineDash([3, 5]); x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p[0], p[1]); x.stroke(); x.setLineDash([]);
      x.strokeStyle = '#ffd678'; x.lineWidth = 1.5; x.beginPath(); x.arc(p[0], p[1], 11, 0, TAU); x.stroke();
      x.fillStyle = '#ffd678'; x.beginPath(); x.arc(p[0] - 13, p[1] - 11, 7.5, 0, TAU); x.fill();
      x.fillStyle = '#1a1206'; x.font = 'bold 10.5px Segoe UI, sans-serif'; x.textAlign = 'center'; x.fillText(String(i + 1), p[0] - 13, p[1] - 7.3);
      const mx = (p0[0] + p[0]) / 2, my = (p0[1] + p[1]) / 2; x.fillStyle = '#ffd678cc'; x.font = '10px Segoe UI, sans-serif'; x.fillText(d.toFixed(1) + ' ly', mx, my - 3);
    });
  }
  // fleets in transit (drawn over the nearest-system guides so paths always show)
  for (const f of S.fleets) { if (f.dest == null) continue; const d = ST(f.dest); const mp = movePos(f), ax = mp.px, ay = mp.py, [bx, by] = proj(d.x, d.y, d.z); x.strokeStyle = f.task && f.task.type === 'route' ? 'rgba(255,200,90,.45)' : 'rgba(127,224,255,.6)'; x.setLineDash([5, 5]); x.lineWidth = 1.6; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); x.setLineDash([]); }
  // labels with de-cluttering
  const boxes = []; x.textAlign = 'center';
  const dots = LABELS.map(L => ({x: L.p[0] - L.rr, y: L.p[1] - L.rr, w: L.rr * 2, h: L.rr * 2}));
  for (const L of LABELS.sort((a, b) => b.pri - a.pri)) {
    const {s, p, rr} = L; const vis = !!S.visited[s.id];
    x.font = vis ? '600 11.5px Segoe UI, sans-serif' : '10.5px Segoe UI, sans-serif';
    const wd = x.measureText(s.name).width + 6; const bx = {x: p[0] - wd / 2, y: p[1] + rr + 3, w: wd, h: 14};
    if (L.pri < 3 && boxes.some(o => bx.x < o.x + o.w && bx.x + bx.w > o.x && bx.y < o.y + o.h && bx.y + bx.h > o.y)) continue;
    boxes.push(bx); x.fillStyle = s.bodies.some(bid => B(bid).owner === 0) ? '#8ccaff' : vis ? '#e8eef8' : '#626b80'; x.fillText(s.name, p[0], p[1] + rr + 13);
  }
  boxes.push(...dots);
  // fleets
  UI.fleetBoxes = [];
  const byStar = {}, moving = [];
  for (const f of S.fleets) {
    if (f.dest == null && f.star != null) { (byStar[f.star] = byStar[f.star] || []).push(f); continue; }
    const mp = movePos(f); moving.push({f, px: mp.px, py: mp.py, ang: mp.ang});
  }
  // spread ships that would sit on top of each other
  const groups = [];
  for (const m of moving) { const g = groups.find(g => Math.hypot(g[0].px - m.px, g[0].py - m.py) < 20); if (g) g.push(m); else groups.push([m]); }
  for (const g of groups) {
    if (g.length > 3) {
      const m = g[0]; drawShipIcon(x, m.px, m.py, m.f, m.ang, g.some(z => UI.selFleet === z.f.id));
      x.fillStyle = '#ffd678'; x.font = 'bold 10px Segoe UI, sans-serif'; x.textAlign = 'left'; x.fillText('×' + g.length, m.px + 13, m.py + 4);
      UI.fleetBoxes.push({x: m.px - 13, y: m.py - 12, w: 40, h: 24, group: g.map(z => z.f.id)});
      continue;
    }
    g.forEach((m, i) => {
      const off = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 24;
      m.px += -Math.sin(m.ang) * off; m.py += Math.cos(m.ang) * off;
      const f = m.f;
      drawShipIcon(x, m.px, m.py, f, m.ang, UI.selFleet === f.id);
      if (!(f.task && f.task.type === 'route')) {
        x.font = '10.5px Segoe UI, sans-serif'; const t = etaTo(f, f.dest) + ' yr', tw = x.measureText(t).width + 4;
        const cands = [[15, -19], [15, 7], [-15 - tw, -19], [-15 - tw, 7]].map(([dx, dy]) => ({x: m.px + dx, y: m.py + dy, w: tw, h: 12}));
        const free = cands.find(b => !boxes.some(o => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y)) || (UI.selFleet === f.id ? cands[0] : null);
        if (free) { boxes.push(free); x.fillStyle = '#a8dcff'; x.textAlign = 'left'; x.fillText(t, free.x + 2, free.y + 10); }
      }
      UI.fleetBoxes.push({x: m.px - 15, y: m.py - 13, w: 30, h: 26, f: f.id});
    });
  }
  for (const sid in byStar) {
    const s = ST(+sid); const p = proj(s.x, s.y, s.z);
    const list = byStar[sid], top = p[1] - (list.length - 1) * 13.5;
    list.forEach((f, i) => { const fx = p[0] + 42, fy = top + i * 27; drawShipIcon(x, fx, fy, f, 0, UI.selFleet === f.id); UI.fleetBoxes.push({x: fx - 16, y: fy - 13, w: 32, h: 26, f: f.id}); });
  }
  // move preview
  const sf = UI.selFleet != null ? S.fleets.find(f => f.id === UI.selFleet) : null;
  if (sf && UI.hoverStar != null && UI.hoverStar !== sf.star) {
    const s = ST(UI.hoverStar); const a = proj(sf.x, sf.y, sf.z), b = proj(s.x, s.y, s.z);
    x.strokeStyle = '#7fe0ff'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
    const yrs = etaTo(sf, s.id), dist = d3(sf, s);
    x.font = 'bold 12px Segoe UI, sans-serif'; x.textAlign = 'center'; x.fillStyle = '#7fe0ff';
    x.fillText(dist.toFixed(1) + ' ly · ' + yrs + ' year' + (yrs > 1 ? 's' : '') + ' at ' + pct(fleetSpeed(sf)) + ' light speed', b[0], b[1] - 18);
  }
  UI.dirty = false;
}
function fleetLook(f) { const d = design(f.ships[0].d) || {}; return d; }
function drawShipIcon(x, px, py, f, ang, sel) {
  const d = fleetLook(f);
  x.save(); x.translate(px, py); x.rotate(ang);
  iconCanvas(x, d.icon || 'dart', S.empire.color, d.acc || '#eef2f8', 0.72);
  x.restore();
  if (f.ships.length > 1) { x.fillStyle = '#ffffff'; x.font = 'bold 9.5px Segoe UI, sans-serif'; x.textAlign = 'left'; x.fillText(f.ships.length, px + 12, py + 12); }
  if (sel) { x.strokeStyle = '#fff'; x.lineWidth = 1.3; x.beginPath(); x.arc(px, py, 16, 0, TAU); x.stroke(); }
}
function mapLoop() { if (S && UI.dirty && $('#app').style.display !== 'none') drawMap(); requestAnimationFrame(mapLoop); }
function hitStar(sx, sy) { let best = null, bd = 16; for (const p of UI.pts) { const d = Math.hypot(p.x - sx, p.y - sy); if (d < bd) { bd = d; best = p.id; } } return best; }
function hitFleet(sx, sy) { for (let i = UI.fleetBoxes.length - 1; i >= 0; i--) { const b = UI.fleetBoxes[i]; if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) return b.group ? {group: b.group} : b.f; } return null; }
function initMapInput() {
  const c = cv();
  c.addEventListener('contextmenu', e => e.preventDefault());
  c.addEventListener('pointerdown', e => { UI.drag = {x: e.clientX, y: e.clientY, moved: false, btn: e.button, shift: e.shiftKey, cam: Object.assign({}, UI.cam)}; c.setPointerCapture(e.pointerId); });
  c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const D = UI.drag;
    if (D) {
      const dx = e.clientX - D.x, dy = e.clientY - D.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) D.moved = true;
      if (D.moved) {
        if (D.btn === 2 || D.shift) { // pan along the plane
          const C = UI.cam; const cy = Math.cos(C.yaw), syw = Math.sin(C.yaw);
          const mx = -dx / C.zoom, my = -dy / C.zoom / Math.max(0.3, Math.sin(C.pitch));
          C.tx = D.cam.tx + mx * cy + my * syw; C.ty = D.cam.ty - mx * syw + my * cy;
        } else { UI.cam.yaw = D.cam.yaw + dx * 0.006; UI.cam.pitch = clamp(D.cam.pitch + dy * 0.005, 0.2, Math.PI / 2); }
        UI.dirty = true;
      }
    }
    const hs = hitStar(sx, sy); if (hs !== UI.hoverStar) { UI.hoverStar = hs; UI.dirty = true; }
    c.style.cursor = D && D.moved ? 'grabbing' : (hs != null || hitFleet(sx, sy) != null ? 'pointer' : 'default');
    updateHint();
  });
  c.addEventListener('pointerup', e => {
    const D = UI.drag; UI.drag = null; c.style.cursor = 'default';
    if (!D || D.moved || UI.busy) return;
    const r = c.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const sid = hitStar(sx, sy), sp = sid != null ? UI.pts.find(p => p.id === sid) : null;
    const nearStar = sp && Math.hypot(sp.x - sx, sp.y - sy) < 10;
    const fid = nearStar ? null : hitFleet(sx, sy);
    const sf = UI.selFleet != null ? S.fleets.find(f => f.id === UI.selFleet) : null;
    if (e.button === 2) { if (sf && sid != null) sendFleet(sf, sid); return; }
    if (fid != null && typeof fid === 'object') { pickFleet(fid.group); return; }
    if (fid != null) { selectFleet(fid); return; }
    if (sid != null) { if (sf && sid !== sf.star) { sendFleet(sf, sid); return; } selectStar(sid); return; }
    UI.selFleet = null; UI.selStar = null; closeSide();
  });
  c.addEventListener('dblclick', e => { const r = c.getBoundingClientRect(); const sid = hitStar(e.clientX - r.left, e.clientY - r.top); if (sid != null) centerOn(sid); });
  c.addEventListener('wheel', e => { e.preventDefault(); UI.cam.zoom = clamp(UI.cam.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 4, 120); UI.dirty = true; }, {passive: false});
  window.addEventListener('resize', () => UI.dirty = true);
}
function sideShift() { const o = UI.view ? 190 / UI.cam.zoom : 0; return [o * Math.cos(UI.cam.yaw), -o * Math.sin(UI.cam.yaw)]; }
function centerOn(sid) { const s = ST(sid), [ox, oy] = sideShift(); UI.cam.tx = s.x + ox; UI.cam.ty = s.y + oy; UI.cam.tz = 0; UI.dirty = true; }
function fitView() { const {w, h} = mapSize(); UI.cam.zoom = clamp(Math.min((w - (UI.view ? 400 : 40)) / (2 * S.radius + 14), (h - 60) / (2 * S.radius + 10)), 4, 120); const [ox, oy] = sideShift(); UI.cam.tx = ox; UI.cam.ty = oy; UI.cam.tz = 0; UI.dirty = true; }
ACT.camTop = () => { UI.cam.pitch = Math.abs(UI.cam.pitch - Math.PI / 2) < 0.05 ? 0.95 : Math.PI / 2; UI.dirty = true; };
ACT.camRot = v => { UI.cam.yaw += (+v) * Math.PI / 8; UI.dirty = true; };
ACT.camZoom = v => { UI.cam.zoom = clamp(UI.cam.zoom * (+v > 0 ? 1.25 : 0.8), 4, 120); UI.dirty = true; };
ACT.camSun = () => { centerOn(0); };
ACT.camFit = () => fitView();
function updateHint() {
  const el = $('#hint'); const sf = UI.selFleet != null ? S.fleets.find(f => f.id === UI.selFleet) : null;
  if (sf) el.textContent = 'Fleet selected: click a star to send it there. Click empty space to deselect.';
  else if (UI.hoverStar != null) { const s = ST(UI.hoverStar); el.textContent = s.name + ' · ' + starKind(s.sp).word + ' · ' + s.ly + ' ly from the Sun' + (S.surveyed[s.id] ? ' · surveyed' : S.visited[s.id] ? ' · charted' : ' · unexplored'); }
  else el.textContent = 'Drag to rotate · right-drag or Shift-drag to pan · scroll to zoom · Enter ends the year';
}
function sendFleet(f, sid) {
  f.auto = false;
  const err = orderMove(f, sid); if (err) { toast(err); return; }
  toast('Heading to ' + ST(sid).name + ': ' + etaTo(f, sid) + ' year' + (etaTo(f, sid) > 1 ? 's' : ''));
  UI.dirty = true; renderSide();
}
function pickFleet(ids) {
  modal({title: 'Choose a ship', w: 420, body: ids.map(id => { const f = S.fleets.find(x => x.id === id); return f ? `<div class="opt" data-a="pickF" data-v="${id}"><span class="nm">${fleetName(f)}<div class="tiny dim">to ${esc(ST(f.dest).name)} · ${etaTo(f, f.dest)} yr</div></span></div>` : ''; }).join('')});
}
ACT.pickF = v => { ACT.mclose(); selectFleet(+v); };
function selectStar(sid) { UI.selStar = sid; UI.selFleet = null; UI.view = 'star'; UI.viewId = sid; UI.dirty = true; renderSide(); }
function selectFleet(fid) { const f = S.fleets.find(x => x.id === fid); if (!f) return; UI.selFleet = fid; UI.selStar = f.star; UI.view = 'fleet'; UI.viewId = fid; UI.fleetSel = {}; UI.routeSetup = null; UI.dirty = true; renderSide(); }
function selectColony(bid) { UI.selStar = B(bid).star; UI.selFleet = null; UI.view = 'colony'; UI.viewId = bid; UI.dirty = true; renderSide(); }
function closeSide() { UI.view = null; $('#side').classList.remove('show'); UI.dirty = true; updateHint(); }
ACT.goStar = v => { selectStar(+v); centerOn(+v); };
