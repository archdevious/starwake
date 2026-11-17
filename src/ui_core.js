'use strict';
// ===================== STARWAKE — UI CORE, ART, GALAXY MAP =====================
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = v => (Math.round(v * 10) / 10).toLocaleString();
const sgn = v => (v >= 0 ? '+' : '') + fmt(v);
const UI = {selStar: null, selFleet: null, view: null, viewId: null, cam: {x: 0, y: 0, z: 30}, hoverStar: null, hoverFleet: null, fleetBoxes: [], drag: null,
  showRange: false, busy: false, buildTab: 'bld', designEdit: null, fleetSel: {}, t0: performance.now()};
const ACT = {}; // click actions: data-a="name" data-v="value"
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.a]; if (f) { e.stopPropagation(); f(el.dataset.v, el, e); }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-c]'); if (!el) return;
  const f = ACT[el.dataset.c]; if (f) f(el.value, el, e);
});
function toast(t, ms) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(UI._tt); UI._tt = setTimeout(() => el.classList.remove('show'), ms || 2200); }
function hexA(c, a) { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function planetBall(type, px, special) {
  const t = PT[type]; px = px || 30;
  const ring = type === 'gasgiant' ? `,0 0 0 2px ${hexA('#d6b088', 0.25)}` : '';
  const bg = type === 'asteroids' ? `radial-gradient(circle at 30% 30%,#aaa 0 10%,transparent 11%),radial-gradient(circle at 70% 60%,#888 0 12%,transparent 13%),radial-gradient(circle at 45% 75%,#999 0 9%,transparent 10%),radial-gradient(circle at 60% 25%,#777 0 7%,transparent 8%)`
    : `radial-gradient(circle at 32% 30%, ${t.color} 0%, ${t.c2} 70%, #05070d 100%)`;
  return `<div class="pball" style="width:${px}px;height:${px}px;background:${bg}${type === 'asteroids' ? ';box-shadow:none' : ''};${special ? `outline:1px dashed #ffb84a88;outline-offset:2px` : ''}${ring ? ';box-shadow:inset -6px -6px 10px #0009' + ring : ''}"></div>`;
}
// ---------- vector ship art ----------
const HULL_SHAPES = {
  corvette:   [[1, 0], [-0.7, 0.55], [-0.4, 0], [-0.7, -0.55]],
  destroyer:  [[1, 0], [0.2, 0.35], [-0.2, 0.8], [-0.8, 0.45], [-0.6, 0], [-0.8, -0.45], [-0.2, -0.8], [0.2, -0.35]],
  cruiser:    [[1, 0], [0.5, 0.25], [0.1, 0.3], [-0.1, 0.75], [-0.6, 0.75], [-0.5, 0.3], [-1, 0.25], [-1, -0.25], [-0.5, -0.3], [-0.6, -0.75], [-0.1, -0.75], [0.1, -0.3], [0.5, -0.25]],
  battleship: [[1, 0], [0.7, 0.3], [0.2, 0.4], [0, 0.85], [-0.5, 0.85], [-0.6, 0.45], [-1, 0.4], [-1, -0.4], [-0.6, -0.45], [-0.5, -0.85], [0, -0.85], [0.2, -0.4], [0.7, -0.3]],
  dreadnought:[[1, 0], [0.8, 0.22], [0.4, 0.3], [0.3, 0.6], [0.1, 0.95], [-0.3, 0.95], [-0.4, 0.55], [-0.75, 0.6], [-1, 0.35], [-0.85, 0], [-1, -0.35], [-0.75, -0.6], [-0.4, -0.55], [-0.3, -0.95], [0.1, -0.95], [0.3, -0.6], [0.4, -0.3], [0.8, -0.22]],
  scout:      [[1, 0], [0, 0.4], [-0.8, 0], [0, -0.4]],
  colony:     [[0.8, 0.2], [0.6, 0.55], [-0.7, 0.55], [-0.9, 0.2], [-0.9, -0.2], [-0.7, -0.55], [0.6, -0.55], [0.8, -0.2]],
  outpost:    [[0.7, 0.5], [-0.7, 0.5], [-0.7, -0.5], [0.7, -0.5]],
  transport:  [[0.9, 0.3], [0.5, 0.6], [-0.9, 0.6], [-0.9, -0.6], [0.5, -0.6], [0.9, -0.3]],
};
const HULL_SCALE = {corvette: 0.55, destroyer: 0.7, cruiser: 0.85, battleship: 1, dreadnought: 1.2, scout: 0.5, colony: 0.75, outpost: 0.6, transport: 0.7, monster: 1.25};
function drawShip(ctx, x, y, r, hull, color, ang) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
  if (hull === 'monster') {
    const t = (performance.now() - UI.t0) / 600;
    ctx.fillStyle = hexA('#9fe060', 0.85); ctx.strokeStyle = '#e8ffd0'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; const rr = r * (0.75 + 0.18 * Math.sin(a * 5 + t)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a2a08'; ctx.beginPath(); ctx.arc(r * 0.25, 0, r * 0.22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.arc(r * 0.3, 0, r * 0.08, 0, TAU); ctx.fill();
    ctx.restore(); return;
  }
  const pts = HULL_SHAPES[hull] || HULL_SHAPES.corvette;
  const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#e8eef8'); g.addColorStop(0.45, color); g.addColorStop(1, '#101624');
  ctx.fillStyle = g; ctx.strokeStyle = hexA('#ffffff', 0.7); ctx.lineWidth = 1;
  ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px * r, py * r) : ctx.moveTo(px * r, py * r)); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = hexA('#9fe8ff', 0.9); ctx.beginPath(); ctx.arc(-r * 0.75, 0, Math.max(1.2, r * 0.12), 0, TAU); ctx.fill();
  ctx.restore();
}
function shipIconCanvas(hull, color, px) {
  const c = document.createElement('canvas'); c.width = c.height = px * 2; c.style.width = c.style.height = px + 'px';
  const x = c.getContext('2d'); x.scale(2, 2); drawShip(x, px / 2, px / 2, px * 0.42 * (HULL_SCALE[hull] || 1) / 1.1, hull, color, -Math.PI / 4);
  return c.toDataURL();
}
const _iconCache = {};
function shipIcon(hull, color, px) { const k = hull + color + px; return _iconCache[k] || (_iconCache[k] = shipIconCanvas(hull, color, px)); }
function hullOf(emp, did) { const d = designOf(emp, did); return d.fixed ? 'monster' : (d.special || d.hull); }
// race emblems
function drawEmblem(ctx, id, s, color) {
  ctx.save(); ctx.translate(s / 2, s / 2);
  const r = s * 0.42;
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g.addColorStop(0, hexA(color, 0.9)); g.addColorStop(1, '#0a0f1c');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#eef4ff'; ctx.strokeStyle = '#eef4ff'; ctx.lineWidth = 2;
  const poly = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)); ctx.closePath(); ctx.fill(); };
  switch (id) {
    case 'human': ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.7, r * 0.22, -0.5, 0, TAU); ctx.stroke(); break;
    case 'vashari': poly([[0, -0.65], [0.18, -0.1], [0.6, 0.35], [0, 0.15], [-0.6, 0.35], [-0.18, -0.1]]); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -0.15 * r, r * 0.12, 0, TAU); ctx.fill(); break;
    case 'thrunn': for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, r * 0.16, 0, TAU); ctx.fill(); } break;
    case 'ixari': poly([[0, -0.7], [0.15, -0.1], [0.55, 0.55], [0, 0.25], [-0.55, 0.55], [-0.15, -0.1]]); break;
    case 'ondine': for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let i = 0; i <= 20; i++) { const x = (-0.6 + i * 0.06) * r; const y = (-0.3 + k * 0.3) * r + Math.sin(i / 20 * TAU * 1.5) * r * 0.08; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); } break;
    case 'groak': poly([[-0.45, 0.45], [-0.55, -0.1], [-0.15, -0.55], [0.4, -0.4], [0.55, 0.15], [0.2, 0.5]]); ctx.strokeStyle = '#0a0f1c'; ctx.beginPath(); ctx.moveTo(-0.3 * r, 0); ctx.lineTo(0.3 * r, -0.2 * r); ctx.stroke(); break;
    case 'myrrhine': poly([[0, -0.2], [0.7, -0.45], [0.35, 0.1], [0, 0.55], [-0.35, 0.1], [-0.7, -0.45]]); break;
    case 'selari': ctx.beginPath(); ctx.ellipse(0, 0, r * 0.62, r * 0.32, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, TAU); ctx.fill(); break;
  }
  ctx.restore();
}
function emblemURL(id, color, px) { const k = 'em' + id + color + px; if (_iconCache[k]) return _iconCache[k]; const c = document.createElement('canvas'); c.width = c.height = px * 2; const x = c.getContext('2d'); x.scale(2, 2); drawEmblem(x, id, px, color); return _iconCache[k] = c.toDataURL(); }

// ---------- Top bar ----------
function renderTop() {
  if (!S) return;
  const p = player(), t = empTotals(p);
  const res = p.res ? TECH[p.res.tech] : null;
  const loc = p.res ? TECH_LOC[p.res.tech] : null;
  const cost = loc ? techCost(loc.f, loc.t) : 0;
  const idle = S.fleets.filter(f => f.owner === 0 && f.dest == null && fleetRole(f) !== 'empty').length;
  $('#res').innerHTML = `
    <div class="chip"><span class="k">Turn</span><b>${S.turn}</b></div>
    <div class="chip" title="Credits: income minus building and ship upkeep"><span class="k">Credits</span><b>${fmt(Math.floor(p.bc))}</b><span class="${t.net >= 0 ? 'good' : 'bad'}">${sgn(t.net)}</span></div>
    <div class="chip" title="Food produced minus food eaten. Surplus is sold for credits; a shortage starves colonies."><span class="k">Food</span><span class="${t.foodNet >= 0 ? 'good' : 'bad'}">${sgn(t.foodNet)}</span></div>
    <div class="chip"><span class="k">Production</span><b>${fmt(t.prod)}</b></div>
    <div class="chip click" data-a="openResearch" title="Open research"><span class="k">Research</span>${res ? `<span>${esc(res.name)}</span><span class="dim">${Math.floor(p.res.prog + p.rpBank)}/${cost}</span>` : '<span class="warn">Choose a tech!</span>'}<span class="acc">+${fmt(t.rp)}</span></div>
    ${idle ? `<div class="chip click" data-a="nextIdle" title="Cycle through idle fleets (N)"><span class="k">Idle fleets</span><b>${idle}</b></div>` : ''}`;
}
ACT.nextIdle = () => {
  const list = S.fleets.filter(f => f.owner === 0 && f.dest == null);
  if (!list.length) return;
  UI._idleIdx = ((UI._idleIdx || 0) + 1) % list.length;
  const f = list[UI._idleIdx]; selectFleet(f.id); centerOn(f.x, f.y);
};

// ---------- Galaxy map ----------
const cv = () => $('#map');
function mapSize() { const c = cv(); return {w: c.clientWidth, h: c.clientHeight}; }
function w2s(x, y) { const {w, h} = mapSize(); return [(x - UI.cam.x) * UI.cam.z + w / 2, (y - UI.cam.y) * UI.cam.z + h / 2]; }
function s2w(sx, sy) { const {w, h} = mapSize(); return [(sx - w / 2) / UI.cam.z + UI.cam.x, (sy - h / 2) / UI.cam.z + UI.cam.y]; }
function centerOn(x, y) { UI.cam.x = x; UI.cam.y = y; }
function fitGalaxy() {
  const {w, h} = mapSize(); const xs = S.stars.map(s => s.x), ys = S.stars.map(s => s.y);
  const x0 = Math.min(...xs) - 1.5, x1 = Math.max(...xs) + 1.5, y0 = Math.min(...ys) - 1.5, y1 = Math.max(...ys) + 2;
  const pw = UI.view ? w - 390 : w;
  UI.cam.z = clamp(Math.min((pw - 40) / (x1 - x0), (h - 40) / (y1 - y0)), 8, 90); UI.cam.x = (x0 + x1) / 2 + (UI.view ? 195 / UI.cam.z : 0); UI.cam.y = (y0 + y1) / 2;
}
function ensureNebulae() {
  if (S.neb) return;
  S.neb = []; const cols = ['#3a2a7a', '#1e4a7a', '#6a2050', '#1e5a5a', '#4a2a6a'];
  for (let i = 0; i < 7; i++) S.neb.push({x: rnd() * S.W, y: rnd() * S.H, r: 4 + rnd() * 8, c: pick(cols)});
}
let BGSTARS = null;
function bgStars() { if (BGSTARS) return BGSTARS; BGSTARS = []; for (let i = 0; i < 500; i++) BGSTARS.push([rnd(), rnd(), rnd() * 1.2 + 0.2, rnd()]); return BGSTARS; }
function knownOwners(starId) {
  const p = player(); if (!p.explored[starId]) return [];
  const o = new Set(); for (const pid of ST(starId).planets) { const pl = P(pid); if (pl.owner != null) o.add(pl.owner); } return [...o];
}
function visibleFleets() {
  const cs = scanCircles(player());
  return S.fleets.filter(f => f.owner === 0 || inCircles(cs, f.x, f.y) || (f.owner === -1 && player().explored[f.star]));
}
function drawMap() {
  const c = cv(); if (!c || !S) return;
  const dpr = window.devicePixelRatio || 1; const {w, h} = mapSize();
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const z = UI.cam.z, now = performance.now();
  ctx.fillStyle = '#03050b'; ctx.fillRect(0, 0, w, h);
  // parallax background stars
  for (const [sx, sy, sr, tw] of bgStars()) {
    const x = ((sx * w * 1.6 - UI.cam.x * z * 0.12) % w + w) % w, y = ((sy * h * 1.6 - UI.cam.y * z * 0.12) % h + h) % h;
    ctx.fillStyle = `rgba(200,215,255,${0.25 + 0.35 * Math.abs(Math.sin(now / 1800 + tw * 10))})`; ctx.fillRect(x, y, sr, sr);
  }
  ensureNebulae();
  for (const n of S.neb) { const [x, y] = w2s(n.x, n.y); const r = n.r * z; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, hexA(n.c, 0.22)); g.addColorStop(1, hexA(n.c, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  const p = player();
  const selF = UI.selFleet != null ? S.fleets.find(f => f.id === UI.selFleet) : null;
  // fuel range overlay
  if ((selF && selF.owner === 0) || UI.showRange) {
    const off = UI._off || (UI._off = document.createElement('canvas'));
    off.width = c.width; off.height = c.height; const o = off.getContext('2d'); o.setTransform(dpr, 0, 0, dpr, 0, 0);
    o.fillStyle = '#2e6fb0';
    const seen = new Set();
    for (const pl of S.planets) if (pl.owner === 0 && pl.star >= 0 && !seen.has(pl.star)) { seen.add(pl.star); const s = ST(pl.star); const [x, y] = w2s(s.x, s.y); o.beginPath(); o.arc(x, y, p.range * z, 0, TAU); o.fill(); }
    ctx.globalAlpha = 0.12; ctx.drawImage(off, 0, 0, w, h); ctx.globalAlpha = 1;
  }
  // scan circles faint
  // stars
  const starR = clamp(z * 0.28, 4, 11);
  ctx.textAlign = 'center'; ctx.font = `${clamp(z * 0.38, 10, 13)}px Segoe UI, system-ui, sans-serif`;
  for (const s of S.stars) {
    const [x, y] = w2s(s.x, s.y); if (x < -60 || y < -60 || x > w + 60 || y > h + 60) continue;
    const ex = !!p.explored[s.id]; const col = STAR_TYPES[s.type].color;
    const g = ctx.createRadialGradient(x, y, 0, x, y, starR * 3); g.addColorStop(0, hexA(col, ex ? 0.55 : 0.25)); g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, starR * 3, 0, TAU); ctx.fill();
    ctx.fillStyle = ex ? col : hexA(col, 0.55); ctx.beginPath(); ctx.arc(x, y, starR * (ex ? 0.55 : 0.4), 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, starR * 0.22, 0, TAU); ctx.fill();
    const owners = knownOwners(s.id);
    if (owners.length) {
      const seg = TAU / owners.length;
      owners.forEach((o, i) => { ctx.strokeStyle = E(o).color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, starR * 1.35, i * seg - Math.PI / 2 + 0.08, (i + 1) * seg - Math.PI / 2 - 0.08); ctx.stroke(); });
    }
    if (UI.selStar === s.id) { ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -now / 60; ctx.beginPath(); ctx.arc(x, y, starR * 2, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    if (UI.hoverStar === s.id) { ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, starR * 1.9, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = owners.length === 1 ? E(owners[0]).color : ex ? '#c8d2e8' : '#5a6684';
    ctx.fillText(s.name, x, y + starR * 1.6 + 11);
    if (ex) { const n = s.planets.length; for (let i = 0; i < n; i++) { ctx.fillStyle = '#8fa0c0'; ctx.fillRect(x - n * 2.5 + i * 5 + 1, y + starR * 1.6 + 15, 3, 3); } }
  }
  // fleets
  UI.fleetBoxes = [];
  const vis = visibleFleets();
  const atStar = {};
  for (const f of vis) {
    if (f.star != null && f.dest == null) { (atStar[f.star] = atStar[f.star] || []).push(f); continue; }
    // in transit
    const d = f.dest != null ? ST(f.dest) : null; const [x, y] = w2s(f.x, f.y);
    const ang = d ? Math.atan2(d.y - f.y, d.x - f.x) : 0;
    if (d && f.owner === 0) {
      const [dx, dy] = w2s(d.x, d.y);
      ctx.strokeStyle = hexA(E(0).color, 0.6); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(dx, dy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#cfe6ff'; ctx.font = '11px Segoe UI, sans-serif'; ctx.fillText(eta(f, f.dest) + 't', (x + dx) / 2, (y + dy) / 2 - 5);
    }
    const r = clamp(z * 0.3, 6, 10);
    drawShip(ctx, x, y, r, f.owner === -1 ? 'monster' : hullOf(E(f.owner), f.ships[0].d), E(f.owner).color, ang);
    if (UI.selFleet === f.id) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, TAU); ctx.stroke(); }
    UI.fleetBoxes.push({x: x - r - 2, y: y - r - 2, w: r * 2 + 4, h: r * 2 + 4, f: f.id});
  }
  for (const sid in atStar) {
    const s = ST(+sid); const [x, y] = w2s(s.x, s.y);
    atStar[sid].forEach((f, i) => {
      const fx = x + starR * 1.9 + 9, fy = y - starR * 1.6 + i * 15;
      const r = 6;
      drawShip(ctx, fx, fy, r, f.owner === -1 ? 'monster' : hullOf(E(f.owner), f.ships[0].d), E(f.owner).color, 0);
      ctx.fillStyle = '#e8eef8'; ctx.font = '10px Segoe UI, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(f.ships.length, fx + 9, fy + 3.5); ctx.textAlign = 'center';
      if (UI.selFleet === f.id) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.strokeRect(fx - 9, fy - 7, 26, 14); }
      UI.fleetBoxes.push({x: fx - 9, y: fy - 7, w: 26, h: 14, f: f.id});
    });
  }
  // move preview
  if (selF && selF.owner === 0 && UI.hoverStar != null && UI.hoverStar !== selF.star) {
    const s = ST(UI.hoverStar); const [x, y] = w2s(selF.x, selF.y); const [dx, dy] = w2s(s.x, s.y);
    const ok = inRange(p, s.id);
    ctx.strokeStyle = ok ? '#7fe0ff' : '#ff6060'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(dx, dy); ctx.stroke();
    ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.fillStyle = ok ? '#7fe0ff' : '#ff8080';
    ctx.fillText(ok ? eta(selF, s.id) + ' turn' + (eta(selF, s.id) > 1 ? 's' : '') : 'Out of fuel range', dx, dy - starR * 2 - 6);
  }
}
function mapLoop() { if (S && $('#app').style.display !== 'none') drawMap(); requestAnimationFrame(mapLoop); }
function hitStar(sx, sy) { let best = null, bd = 18; for (const s of S.stars) { const [x, y] = w2s(s.x, s.y); const d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = s.id; } } return best; }
function hitFleet(sx, sy) { for (let i = UI.fleetBoxes.length - 1; i >= 0; i--) { const b = UI.fleetBoxes[i]; if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) return b.f; } return null; }
function initMapInput() {
  const c = cv();
  c.addEventListener('contextmenu', e => e.preventDefault());
  c.addEventListener('pointerdown', e => { UI.drag = {x: e.clientX, y: e.clientY, cx: UI.cam.x, cy: UI.cam.y, moved: false, btn: e.button}; c.setPointerCapture(e.pointerId); });
  c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top;
    if (UI.drag && UI.drag.btn === 0) {
      const dx = e.clientX - UI.drag.x, dy = e.clientY - UI.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) UI.drag.moved = true;
      if (UI.drag.moved) { UI.cam.x = UI.drag.cx - dx / UI.cam.z; UI.cam.y = UI.drag.cy - dy / UI.cam.z; c.style.cursor = 'grabbing'; }
    }
    UI.hoverStar = hitStar(sx, sy); UI.hoverFleet = hitFleet(sx, sy);
    c.style.cursor = UI.drag && UI.drag.moved ? 'grabbing' : (UI.hoverFleet != null || UI.hoverStar != null ? 'pointer' : 'default');
    updateHint();
  });
  c.addEventListener('pointerup', e => {
    const d = UI.drag; UI.drag = null; c.style.cursor = 'default';
    if (!d || d.moved || UI.busy) return;
    const r = c.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const fid = hitFleet(sx, sy), sid = hitStar(sx, sy);
    const selF = UI.selFleet != null ? S.fleets.find(f => f.id === UI.selFleet) : null;
    if (e.button === 2) { if (selF && selF.owner === 0 && sid != null) sendFleet(selF, sid); return; }
    if (fid != null) { selectFleet(fid); return; }
    if (sid != null) {
      if (selF && selF.owner === 0 && sid !== selF.star) { sendFleet(selF, sid); return; }
      selectStar(sid); return;
    }
    UI.selFleet = null; UI.selStar = null; closeSide();
  });
  c.addEventListener('wheel', e => {
    e.preventDefault();
    const r = c.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const [wx, wy] = s2w(sx, sy);
    UI.cam.z = clamp(UI.cam.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 8, 90);
    const [nx, ny] = s2w(sx, sy); UI.cam.x += wx - nx; UI.cam.y += wy - ny;
  }, {passive: false});
}
function updateHint() {
  const el = $('#hint'); const selF = UI.selFleet != null ? S.fleets.find(f => f.id === UI.selFleet) : null;
  if (selF && selF.owner === 0) el.textContent = 'Fleet selected: click a star to send it there (or right-click). Click empty space to deselect.';
  else if (UI.hoverStar != null) { const s = ST(UI.hoverStar); el.textContent = s.name + ' — ' + STAR_TYPES[s.type].name + ' star' + (player().explored[s.id] ? ', ' + s.planets.length + ' planet' + (s.planets.length !== 1 ? 's' : '') : ', unexplored'); }
  else el.textContent = 'Drag to pan, scroll to zoom. Click a star or fleet. Enter ends the turn.';
}
function sendFleet(f, sid) {
  const err = orderMove(f, sid);
  if (err) { toast(err); return; }
  toast('Fleet heading to ' + ST(sid).name + ' — ' + eta(f, sid) + ' turn' + (eta(f, sid) > 1 ? 's' : ''));
  renderSide();
}
function selectStar(sid) { UI.selStar = sid; UI.selFleet = null; UI.view = 'star'; UI.viewId = sid; renderSide(); }
function selectFleet(fid) { const f = S.fleets.find(x => x.id === fid); if (!f) return; UI.selFleet = fid; UI.selStar = f.star; UI.view = 'fleet'; UI.viewId = fid; UI.fleetSel = {}; renderSide(); }
function selectColony(pid) { UI.selStar = P(pid).star; UI.selFleet = null; UI.view = 'colony'; UI.viewId = pid; renderSide(); }
function closeSide() { UI.view = null; $('#side').classList.remove('show'); updateHint(); }
