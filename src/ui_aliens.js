'use strict';
// ===================== STARWAKE — ALIENS: scans, diplomacy, ground actions =====================
// ----- rotating 3D wireframe scan (one animates at a time) -----
let WIRE_TOK = 0;
function WIRE(root, o) {
  const tok = ++WIRE_TOK;
  const SC = o.scale, CX = o.cx, GY = o.gy, PIT = 0.12, REV = 24000, SCAN = 5000, ZR = o.zr || 1.3, H = o.h;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nz = a => { const l = Math.hypot(...a) || 1; return mul(a, 1 / l); };
  function cat(p, n) { const P = [p[0], ...p, p[p.length - 1]], q = []; for (let i = 1; i < P.length - 2; i++) { const [a, b, c, d] = [P[i - 1], P[i], P[i + 1], P[i + 2]]; for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; q.push(b.map((_, j) => .5 * (2 * b[j] + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t3))); } } q.push(p[p.length - 1]); return q; }
  function tube(ctrl, seg, n) { const pts = cat(ctrl.map(p => [p[0], p[1], p[2], p[3], p[4] == null ? 1 : p[4]]), n), R = []; pts.forEach((p, i) => { const t = nz(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)])); const rf = Math.abs(dot(t, [0, 0, 1])) > .9 ? [0, 1, 0] : [0, 0, 1]; const u = nz(cr(t, rf)), w = nz(cr(t, u)), r = []; for (let k = 0; k < seg; k++) { const g = 2 * Math.PI * k / seg; r.push(add(p, add(mul(u, Math.cos(g) * p[3]), mul(w, Math.sin(g) * p[3] * p[4])))); } R.push(r); }); return R; }
  const SEG = [];
  for (const pt of o.parts) for (const sd of pt.m ? [1, -1] : [1]) {
    const R = tube(pt.p.map(q => [q[0] - o.ox, q[1], q[2] * sd, q[3], q[4]]), pt.s || 12, pt.n || 4), col = pt.c || '#5EC8E8', op = pt.o || 1;
    R.forEach(r => r.forEach((a, k) => SEG.push([a, r[(k + 1) % r.length], col, op])));
    for (let k = 0; k < R[0].length; k++) for (let i = 0; i < R.length - 1; i++) SEG.push([R[i][k], R[i + 1][k], col, op * .85]);
  }
  const SP = (o.spots || []).map(p => [p[0] - o.ox, p[1], p[2]]), EY = (o.eyes || []).map(([p, r]) => [[p[0] - o.ox, p[1], p[2]], r]);
  const mesh = root.querySelector('.mesh'), scan = root.querySelector('.scan'), AN = o.anchors || {}, lines = {};
  for (const k in AN) lines[k] = root.querySelector('.' + k);
  function frame(t) {
    const yaw = (o.yaw0 || 0.55) + 2 * Math.PI * ((t % REV) / REV), c = Math.cos(yaw), s = Math.sin(yaw), cp = Math.cos(PIT), sp = Math.sin(PIT);
    const pr = p => { const x = p[0] * c + p[2] * s, z = -p[0] * s + p[2] * c; return [CX + x * SC, GY - (p[1] * cp - z * sp) * SC, p[1] * sp + z * cp]; };
    const sy = H * (0.5 - 0.5 * Math.cos(2 * Math.PI * ((t % SCAN) / SCAN))), Bk = {}, HI = [];
    for (const [a, b, col, op] of SEG) {
      const A = pr(a), Q = pr(b), f = Math.max(0, Math.min(.999, ((A[2] + Q[2]) / 2 + ZR) / (2 * ZR)));
      const d = `M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${Q[0].toFixed(1)} ${Q[1].toFixed(1)}`;
      if (Math.abs((a[1] + b[1]) / 2 - sy) < .12 * (o.unit || 1)) HI.push(d); else { const key = col + '|' + op + '|' + (f * 5 | 0); (Bk[key] = Bk[key] || []).push(d); }
    }
    let h = '';
    for (const key in Bk) { const [col, op, q] = key.split('|'); const f = (+q + .5) / 5; h += `<path d="${Bk[key].join('')}" stroke="${col}" stroke-opacity="${((.1 + .8 * f ** 1.6) * op).toFixed(2)}" stroke-width="${(.5 + .6 * f).toFixed(2)}" fill="none"/>`; }
    h += `<path d="${HI.join('')}" stroke="#E6F7FF" stroke-opacity="0.9" stroke-width="1.2" fill="none"/>`;
    for (const p0 of SP) { const p = pr(p0), f = Math.max(0, Math.min(1, (p[2] + ZR) / (2 * ZR))); h += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(1.1 + f).toFixed(1)}" fill="#FAC775" fill-opacity="${(.15 + .85 * f).toFixed(2)}"/>`; }
    for (const [e, r] of EY) { const p = pr(e), f = Math.max(0, Math.min(1, (p[2] + ZR) / (2 * ZR))); h += `<ellipse cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" rx="${(r * SC * .85).toFixed(1)}" ry="${(r * SC).toFixed(1)}" fill="#06121C" fill-opacity="${(.2 + .8 * f).toFixed(2)}" stroke="#5EC8E8" stroke-opacity="${(.2 + .8 * f).toFixed(2)}" stroke-width="1.1"/>`; }
    mesh.innerHTML = h;
    if (scan) { let d = ''; for (let i = 0; i <= 48; i++) { const g = 2 * Math.PI * i / 48, x = Math.cos(g) * o.ring[0], z = Math.sin(g) * o.ring[1]; d += (i ? 'L' : 'M') + (CX + x * SC).toFixed(1) + ' ' + (GY - (sy * cp - z * sp) * SC).toFixed(1); } scan.setAttribute('d', d); scan.setAttribute('stroke-opacity', (.55 + .25 * Math.sin(t / 180)).toFixed(2)); }
    for (const k in AN) { const a = AN[k], p = pr([a[0] - o.ox, a[1], a[2]]), f = Math.max(0, Math.min(1, (p[2] + ZR) / (2 * ZR))); if (lines[k]) { lines[k].setAttribute('points', `${p[0].toFixed(0)},${p[1].toFixed(0)} ${a[3]}`); lines[k].setAttribute('stroke-opacity', (.25 + .75 * f).toFixed(2)); } }
  }
  let last = 0;
  function loop(t) { if (!root.isConnected || tok !== WIRE_TOK) return; if (t - last > 33) { last = t; frame(t); } requestAnimationFrame(loop); }
  frame(0); requestAnimationFrame(loop);
}
const THUMB_SCALE = {tide: 32, dusk: 26, crag: 25, stone: 24, shell: 36, wire: 27, cat: 28, veil: 22};
function thumbSVG() { return `<svg viewBox="0 0 200 230" width="200" height="230" class="civthumb" style="background:#06121C;border-radius:6px;flex:none"><line x1="10" y1="214" x2="190" y2="214" stroke="#1E4A5E"/><g class="mesh"></g><path class="scan" fill="none" stroke="#5EC8E8" stroke-width="1.2"/></svg>`; }
function startThumb(race) { const el = $('#modal .civthumb'); if (!el) return; const m = RACE_MODELS[race]; WIRE(el, Object.assign({}, m, {anchors: {}, gy: 214, cx: 100, scale: THUMB_SCALE[race] || 26})); }
function fullScanSVG(race) {
  const sp = RACE_MODELS[race], S0 = sp.scale, maxft = sp.maxft, bt = sp.bottom;
  let ticks = '', labels = '';
  for (let i = 0; i <= maxft; i++) ticks += `<line x1="${i % 2 === 0 ? 226 : 228}" y1="${(432 - S0 * i).toFixed(0)}" x2="${i % 2 === 0 ? 238 : 236}" y2="${(432 - S0 * i).toFixed(0)}"/>`;
  for (let i = 0; i <= maxft; i += 2) labels += `<text x="222" y="${(436 - S0 * i).toFixed(0)}">${i} ft</text>`;
  const lines = Object.keys(sp.anchors).map(k => `<polyline class="${k}" points="0,0 ${sp.anchors[k][3]}"/>`).join('');
  const calls = sp.callouts.map(([x, y, anch, t, l1, l2]) => { const ta = anch === 'end' ? ' text-anchor="end"' : ''; return `<text x="${x}" y="${y}"${ta}>${t}</text><text x="${x}" y="${y + 14}"${ta} fill="#3E7A90">${l1}</text>` + (l2 ? `<text x="${x}" y="${y + 27}"${ta} fill="#3E7A90">${l2}</text>` : ''); }).join('');
  return `<svg viewBox="0 0 680 530" width="100%" class="civscan" style="display:block"><defs><pattern id="scangrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0 L0 0 0 20" fill="none" stroke="#0F2A3A" stroke-width="1"/></pattern></defs>
<rect width="680" height="530" rx="10" fill="#06121C"/><rect width="680" height="530" rx="10" fill="url(#scangrid)"/><rect x="6" y="6" width="668" height="518" rx="7" fill="none" stroke="#1E4A5E"/>
<path d="M14 28 L14 14 L28 14 M652 14 L666 14 L666 28 M14 502 L14 516 L28 516 M652 516 L666 516 L666 502" stroke="#5EC8E8" stroke-width="2" fill="none"/>
<g font-family="ui-monospace, Menlo, Consolas, monospace"><text x="32" y="36" fill="#5EC8E8" font-size="14" letter-spacing="2">XENOBIOLOGY DATABASE</text>
<text x="32" y="54" fill="#3E7A90" font-size="11" letter-spacing="1">SURVEY FILE ${sp.file} · ${sp.name.toUpperCase()} · ADULT · SOURCE: ORBITAL IMAGING</text>
<text x="648" y="36" fill="#5DCAA5" font-size="11" text-anchor="end">● 3D SCAN COMPLETE</text><line x1="32" y1="66" x2="648" y2="66" stroke="#1E4A5E"/>
<g stroke="#3E7A90"><line x1="232" y1="432" x2="232" y2="${(432 - S0 * maxft).toFixed(0)}"/>${ticks}</g><g fill="#3E7A90" font-size="11" text-anchor="end">${labels}</g>
<line x1="232" y1="432" x2="620" y2="432" stroke="#1E4A5E"/><g class="mesh"></g><path class="scan" fill="none" stroke="#5EC8E8" stroke-width="1.5"/>
<g stroke="#3E7A90" stroke-width="0.8" fill="none">${lines}</g><g font-size="11" fill="#9ED8EA">${calls}</g><line x1="32" y1="462" x2="648" y2="462" stroke="#1E4A5E"/>
<g font-size="11"><text x="32" y="482" fill="#3E7A90">HEIGHT</text><text x="84" y="482" fill="#9ED8EA">${bt.height}</text><text x="170" y="482" fill="#3E7A90">MASS</text><text x="208" y="482" fill="#9ED8EA">${bt.mass}</text>
<text x="290" y="482" fill="#3E7A90">HABITAT</text><text x="346" y="482" fill="#9ED8EA">${bt.habitat}</text><text x="32" y="502" fill="#3E7A90">VOICE</text><text x="84" y="502" fill="#9ED8EA">${bt.v1}</text><text x="84" y="517" fill="#9ED8EA">${bt.v2}</text></g></g></svg>`;
}
ACT.openScan = race => {
  UI.scanBack = UI.diploSel;
  modal({title: RACE_MODELS[race].name + ' · scan file', kind: 'scan', w: 760, body: fullScanSVG(race), foot: `<button class="btn" data-a="openDiplo">◂ Diplomacy</button><button class="btn primary" data-a="mclose">Close</button>`});
  WIRE($('#modal .civscan'), RACE_MODELS[race]);
};
// ----- diplomacy screen -----
function trustWord(t) { return t >= 90 ? 'Worshipful' : t >= 70 ? 'Devoted' : t >= 55 ? 'Friendly' : t >= 40 ? 'Wary' : t >= 20 ? 'Hostile' : 'Hateful'; }
function civStatusText(c) {
  if (c.status === 'dead') return 'Exterminated';
  if (c.status === 'enslaved') return 'Under our rule' + (c.unrest ? ' · UPRISING' : '');
  const f = S.fleets.find(x => x.task && x.task.type === 'study' && x.star === c.star);
  return (c.met ? 'Met in person' : c.aware ? 'They know we exist' : 'Unaware of us') + ' · ' + (c.lang >= 100 ? 'language learned' : f ? 'studying language' : c.lang > 0 ? 'language ' + Math.floor(c.lang) + '%' : 'language unknown');
}
function knownCivs() { return (S.civs || []).filter(c => c.known); }
ACT.openDiplo = v => {
  const list = knownCivs();
  if (!list.length) { toast('We have not found any other civilization.'); return; }
  if (v != null && v !== '') UI.diploSel = +v;
  else if (UI.scanBack != null) UI.diploSel = UI.scanBack;
  UI.scanBack = null;
  if (!list.some(c => c.id === UI.diploSel)) UI.diploSel = list[0].id;
  UI.diploTab = 'pre';
  modal({title: 'Diplomacy', kind: 'diplo', w: 980, body: diploHTML(), foot: `<button class="btn primary" data-a="mclose">Close</button>`});
  startThumb(diploCiv().race);
};
function diploCiv() { return (S.civs || []).find(c => c.id === UI.diploSel); }
ACT.diploSel = v => { UI.diploSel = +v; modalBody(diploHTML()); startThumb(diploCiv().race); };
ACT.diploTab = v => { UI.diploTab = v; modalBody(diploHTML()); if (v === 'pre') startThumb(diploCiv().race); };
const unk = t => `<span class="dim" style="font-style:italic">${t}</span>`;
function diploHTML() {
  const list = knownCivs();
  let h = `<div class="row" style="gap:6px;margin-bottom:10px"><button class="btn sm ${UI.diploTab === 'pre' ? 'on' : ''}" data-a="diploTab" data-v="pre">Prespacers (${list.length})</button><button class="btn sm ${UI.diploTab === 'space' ? 'on' : ''}" data-a="diploTab" data-v="space">Spacefarers (0)</button></div>`;
  if (UI.diploTab === 'space') return h + `<div class="card dim">No spacefaring civilizations have been found.</div>`;
  const c = diploCiv(), R = civRace(c), wb = B(c.body);
  h += `<div style="display:grid;grid-template-columns:200px minmax(0,1fr);gap:12px"><div>`;
  for (const x of list) h += `<div class="card click ${x.id === c.id ? 'on' : ''}" style="${x.id === c.id ? 'border-color:#5EC8E8' : ''}" data-a="diploSel" data-v="${x.id}"><b>${RACES[x.race].name}</b><div class="tiny dim">${x.status === 'dead' ? 'Exterminated' : CIV_STAGES[x.stage] + ' · ' + (x.met ? 'trust ' + Math.round(x.trust) : 'not met')}</div></div>`;
  h += `</div><div>`;
  const nextStage = c.stage >= 3 ? 'Spacefaring (not in this version)' : CIV_STAGES[c.stage + 1];
  h += `<div class="card" style="display:flex;gap:12px;align-items:flex-start">${thumbSVG()}<div style="flex:1;min-width:0">
    <h2 style="margin:0">${R.name}</h2><div class="small dim">${esc(R.home)} · <a class="acc" style="cursor:pointer" data-a="jGo" data-v="${c.star}">${esc(wb.name)}, ${esc(ST(c.star).name)}</a></div>
    <div class="small" style="margin:6px 0"><span class="otag">${CIV_STAGES[c.stage]}</span> <span class="otag">${civStatusText(c)}</span></div>
    <div class="sec" style="margin-top:6px">Tech · ${CIV_STAGES[c.stage]} → ${nextStage}</div><div class="bar"><i style="width:${Math.min(100, c.tech)}%;background:#4aa8ff"></i></div>
    <div class="sec">Trust</div>${c.met ? `<div class="row sb small"><span>${Math.round(c.trust)} / 100</span><span>${trustWord(c.trust)}</span></div><div class="bar"><i style="width:${c.trust}%;background:#5DCAA5"></i></div>` : unk('Unknown: shown once we meet them in person')}
    <div class="sec">Language</div><div class="bar"><i style="width:${c.lang}%;background:#9FE1CB"></i></div><div class="tiny dim">${c.lang >= 100 ? 'Learned' : Math.floor(c.lang) + '% learned'}</div>
    <div style="margin-top:8px"><button class="btn sm" data-a="openScan" data-v="${c.race}">Open scan file ▸</button></div></div></div>`;
  h += `<div class="sec">Body (from survey)</div><div class="small">${esc(R.body)} ${esc(R.comm)}</div>`;
  h += `<div class="sec">Culture (from language)</div><div class="small">${c.lang >= 100 ? R.culture.map(x => `<span class="otag">${x}</span>`).join(' ') : unk('Unknown: learn their language')}</div>`;
  h += `<div class="sec">How they see us (from meeting)</div><div class="small">${c.met ? esc(R.feel) : unk('Unknown: needs a meeting in person')}</div>`;
  h += `<div class="sec">Revolt tendency</div><div class="small">${c.seenRevolt ? (R.revolt >= 1.25 ? 'Rebellious: they rise up often.' : R.revolt <= 0.7 ? 'Submissive: they rarely rise up.' : 'They rise up when guards are few.') + (R.revoltGrow ? ' Their anger grows the longer they are held.' : '') : unk('Unknown: learned only by ruling them')}</div>`;
  h += `<div class="sec">View on interference</div><div class="small">${c.aware ? (R.awe ? 'They see visitors from the sky with awe.' : 'They distrust outsiders who watch or meddle.') : unk('Unknown: revealed once they notice us')}</div>`;
  h += `<div class="sec">Relations</div><div class="card small">${relHTML(c)}</div>`;
  return h + `</div></div>`;
}
function relHTML(c) {
  if (c.status === 'dead') return unk('They are gone.');
  if (c.status === 'enslaved') return `They are under our rule. Garrison: ${people(c.garrison / 1e6)} troops${c.unrest ? ' · <span class="bad">uprising</span>' : ''}. <a class="acc" style="cursor:pointer" data-a="colonyGo" data-v="${c.body}">Manage ${esc(B(c.body).name)} ▸</a>`;
  if (!(c.met && c.lang >= 100)) return unk(c.lang >= 100 ? 'Land a party from a Science Lab ship (ship panel) to meet them and open talks.' : 'Learn their language with a Science Lab ship in orbit, and meet them with a landing party, to open talks.');
  const m = c.mode || 'none', left = 100 - c.tech;
  let h = `<div class="row" style="gap:6px;margin-bottom:6px">${['none', 'trade', 'give'].map(k => `<button class="btn sm ${m === k ? 'on' : ''}" data-a="civMode" data-v="${k}">${{none: 'None', trade: 'Trade', give: 'Give'}[k]}</button>`).join('')}</div>`;
  const yrs = r => c.stage >= 3 ? 'they are as advanced as they can get here' : 'next age in about ' + Math.max(1, Math.ceil(left / r)) + ' years';
  if (m === 'none') h += `<div class="dim">No exchange. Their development stays where it is.</div>`;
  if (m === 'trade') h += `<div>+${TRADE_BC[c.stage]} credits a year · their tech rises slowly (${yrs(1.2)}) · trust +1 a year (up to 90)</div>`;
  if (m === 'give') { const r = giveRate(c, c.give); h += `<div class="row sb"><span>Give <b>${c.give}</b> credits a year</span><span class="dim">${yrs(r.tech)} · trust +${r.trust.toFixed(1)} a year</span></div><input type="range" min="5" max="100" step="5" value="${c.give}" data-c="civGive" style="width:100%"><div class="tiny dim">Costs credits every year, but raises them much faster than trade and wins their loyalty.</div>`; }
  return h;
}
ACT.civMode = v => { const c = diploCiv(); c.mode = v; modalBody(diploHTML()); startThumb(c.race); renderTop(); };
ACT.civGive = v => { const c = diploCiv(); c.give = +v; modalBody(diploHTML()); startThumb(c.race); };
ACT.colonyGo = v => { ACT.mclose(); selectColony(+v); };
// ----- star panel pieces -----
function civStarHTML(s) {
  const c = (S.civs || []).find(x => x.star === s.id && x.known); if (!c) return '';
  const R = civRace(c);
  if (c.status === 'dead') return `<div class="card small" style="border-color:#5a3030"><b>Ruins of the ${R.name}</b><div class="dim">${esc(B(c.body).name)} is empty now.</div></div>`;
  return `<div class="card" style="border-color:#2a6a8a"><div class="row sb"><b class="acc">◉ The ${R.name}</b><span class="small dim">${CIV_STAGES[c.stage]}</span></div><div class="small dim" style="margin-top:3px">${civStatusText(c)}</div>
    <button class="btn sm" style="margin-top:6px" data-a="openDiplo" data-v="${c.id}">Diplomacy ▸</button></div>`;
}
function civBodyLine(b) {
  const c = civOfBody(b); if (!c || !c.known) return b.ruins ? `<div class="tiny dim">Ruins of the ${RACES[b.ruins].name}</div>` : '';
  const R = civRace(c);
  return c.body === b.id ? `<div class="tiny acc">Homeworld of the ${R.name}${c.status === 'enslaved' ? ' · under our rule' : ''}</div>` : `<div class="tiny acc">${R.one} outpost</div>`;
}
// ----- ship actions -----
function civActions(f) {
  const c = civAt(f.star); if (!c || !c.known) return [];
  const R = civRace(c), out = [], tr = fleetTroops(f);
  if (fleetHas(f, 'lab') && c.lang < 100 && !(f.task && f.task.type === 'study') && c.status !== 'dead') out.push(`<button class="btn sm primary" data-a="civStudy" data-v="${f.id}" title="Science Lab ships in orbit learn their language from afar (twice as fast after meeting them)">Study their language</button>`);
  if (fleetHas(f, 'lab') && !c.met && c.status === 'free') out.push(`<button class="btn sm" data-a="civLand" data-v="${f.id}">Send a landing party (risk ${Math.round(landRisk(c) * 100)}%)</button>`);
  if (tr > 0 && c.status === 'free') out.push(`<button class="btn sm danger" data-a="civAssault" data-v="${f.id}">Assault ${esc(B(c.body).name)} ▸</button>`);
  if (c.status === 'enslaved' && tr > 0) out.push(`<button class="btn sm" data-a="civTroopsDown" data-v="${f.id}">Land ${people(tr / 1e6)} troops</button>`);
  if (c.status === 'enslaved' && c.garrison > 0 && fleetPodRoom(f) > 0) out.push(`<button class="btn sm" data-a="civTroopsUp" data-v="${f.id}">Load ${people(Math.min(c.garrison, fleetPodRoom(f)) / 1e6)} troops</button>`);
  return out;
}
function fleetPodRoom(f) { return f.ships.reduce((a, sh) => a + shipPods(sh) * TROOPS_PER_POD - shipTroops(sh), 0); }
const FL = v => S.fleets.find(x => x.id === +v);
ACT.civStudy = v => { const f = FL(v); f.task = {type: 'study'}; f.auto = false; renderSide(); toast('Studying their language'); };
ACT.civLand = v => {
  const f = FL(v), c = civAt(f.star), R = civRace(c);
  modal({title: 'Landing party', w: 460, body: `<div>Send a science team down to meet the ${R.name} face to face?</div><div class="small dim" style="margin-top:6px">Risk they attack the party: <b>${Math.round(landRisk(c) * 100)}%</b>${c.lang < 100 ? '. Learning their language first makes it safer.' : '.'} If they attack, the team and the ship's Science Lab are lost; the ship itself survives.</div>`,
    foot: `<button class="btn" data-a="mclose">Cancel</button><button class="btn primary" data-a="mclose" data-v="go">Land</button>`}).then(r => { if (r !== 'go') return; landParty(f); showNews(); renderSide(); renderTop(); UI.dirty = true; autosave(); });
};
ACT.civAssault = v => {
  const f = FL(v), c = civAt(f.star), R = civRace(c), p = assaultPreview(f, false), px = assaultPreview(f, true);
  const hp = Math.round((1 - harshFactor(c)) * 100);
  const line = (q, ext) => `<div class="card small"><b>${ext ? 'Exterminate' : 'Enslave'}</b> · their strength ${Math.round(q.them)}${ext ? ' (they fight 10% harder for their lives)' : ''}<div>Chance to win: <b class="${q.chance >= 0.6 ? 'good' : q.chance >= 0.35 ? 'amber' : 'bad'}">${Math.round(q.chance * 100)}%</b> · expected losses if we win: about ${people(Math.round(q.troops * q.loss / 1000) * 1000 / 1e6)} troops. If we lose, every troop dies.</div></div>`;
  modal({title: 'Assault on ' + esc(B(c.body).name), w: 560, body: `<div class="small">Our ${people(p.troops / 1e6)} troops: strength <b>${Math.round(p.us)}</b> (${perPod()} per pod${hp ? `, −${hp}% on a world harsh to us` : ''}). The ${R.name} (${CIV_STAGES[c.stage].toLowerCase()}): ground troops only.</div>
    ${line(p, false)}${line(px, true)}
    <div class="tiny dim" style="margin-top:6px">Enslaved: the world becomes our outpost, worked by them under guard. Garrisons cost upkeep, and too few guards invite uprisings. Exterminated: the world is free to settle, but the loss costs us 15 score.</div>`,
    foot: `<button class="btn" data-a="mclose">Cancel</button><button class="btn danger" data-a="mclose" data-v="ext">Exterminate</button><button class="btn primary" data-a="mclose" data-v="ens">Enslave</button>`}).then(r => {
    if (r !== 'ens' && r !== 'ext') return;
    assault(f, r === 'ext'); showNews(); renderSide(); renderTop(); UI.dirty = true; autosave();
  });
};
ACT.civTroopsDown = v => { const f = FL(v), c = civAt(f.star); c.garrison += fleetTroops(f); for (const sh of f.ships) if (shipPods(sh)) sh.troops = 0; if (c.unrest && garrisonRatio(c) >= 1.2) { c.unrest = false; toast('Order restored'); } renderSide(); renderTop(); };
ACT.civTroopsUp = v => { const f = FL(v), c = civAt(f.star); let n = Math.min(c.garrison, fleetPodRoom(f)); c.garrison -= n; for (const sh of f.ships) { const room = shipPods(sh) * TROOPS_PER_POD - shipTroops(sh); const k = Math.min(room, n); if (k > 0) { sh.troops = shipTroops(sh) + k; n -= k; } } renderSide(); renderTop(); };
// ----- enslaved world panel section -----
function garrisonHTML(b) {
  const c = (S.civs || []).find(x => x.id === b.col.enslaved); if (!c) return '';
  const R = civRace(c), r = garrisonRatio(c), need = Math.ceil(theirStrength(c) * (R.revolt || 1) * 1.2 / (perPod() * harshFactor(c))) * TROOPS_PER_POD;
  return `<div class="sec">The ${R.name}</div><div class="card small">${c.unrest ? '<b class="bad">Uprising!</b> They have stopped working. Land more troops to restore order, or it may become a full revolt.' : `Working under guard: +${r1(slaveProd(b))} production a year.`}
    <div style="margin-top:4px">Garrison <b>${people(c.garrison / 1e6)}</b> troops · <span class="${r >= 1.2 ? 'good' : r >= 0.8 ? 'amber' : 'bad'}">${r >= 1.2 ? 'secure' : r >= 0.8 ? 'stretched' : 'too few'}</span> · about ${people(need / 1e6)} keeps order · upkeep ${r1(c.garrison / TROOPS_PER_POD * 2 * (has('occupation_logistics') ? 0.75 : 1))} credits a year</div>
    <div class="tiny dim" style="margin-top:3px">Ships with Assault Pods in orbit can land or load troops.</div></div>`;
}
// ----- milestone popups (first ecosystem, first contact, first colony at another star) -----
function planetArt(b, o) {
  o = o || {};
  const id = 'pa' + Math.floor(Math.random() * 1e6), seed = (b.id * 7 + 3) % 97 + 1;
  const living = b.life === 'ecosystem' || hab(b) === 'garden';
  const cx = 70, cy = 72, r = 46;
  let stars = '';
  for (let i = 0; i < 26; i++) { const sx = Math.random() * 140, sy = Math.random() * 140, sz = Math.random() < 0.15 ? 1.1 : 0.4 + Math.random() * 0.5; stars += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sz.toFixed(2)}" fill="#cfe6f2" fill-opacity="${(0.35 + Math.random() * 0.6).toFixed(2)}"/>`; }
  const rect = `x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"`;
  let defs = `<clipPath id="${id}c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <radialGradient id="${id}s" cx="32%" cy="29%" r="80%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.45" stop-color="#000" stop-opacity="0.1"/><stop offset="0.7" stop-color="#01040a" stop-opacity="0.82"/><stop offset="1" stop-color="#01040a" stop-opacity="0.96"/></radialGradient>
    <radialGradient id="${id}l" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>`;
  let body, rim = null;
  if (living) {
    const land = b.cls === 'ocean' ? -0.62 : -0.42;
    rim = '#7fc4ff';
    defs += `<radialGradient id="${id}o" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#1f6496"/><stop offset="1" stop-color="#0a2742"/></radialGradient>
      <filter id="${id}f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="5" seed="${seed}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.7 0 0 0 ${land}" result="a"/><feComponentTransfer in="a" result="m"><feFuncA type="discrete" tableValues="0 0 0 0 0 1 1 1 1 1"/></feComponentTransfer><feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="3" seed="${seed + 5}" result="n2"/><feColorMatrix in="n2" type="matrix" values="0.55 0 0 0 0.04  0.62 0 0 0 0.13  0.22 0 0 0 0.03  0 0 0 0 1" result="col"/><feComposite in="col" in2="m" operator="in"/></filter>
      <filter id="${id}k" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.1" numOctaves="4" seed="${seed + 9}"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.4 0 0 0 -1.22"/></filter>`;
    body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}o)"/><g clip-path="url(#${id}c)"><rect ${rect} filter="url(#${id}f)"/><rect ${rect} filter="url(#${id}k)" opacity="0.9"/>`;
  } else {
    const pal = b.cls === 'ice' || b.temp === 'frozen' ? [0.8, 0.88, 0.96, '#b8ccd8', '#34495a'] : b.cls === 'moon' || b.cls === 'dwarf' ? [0.7, 0.7, 0.68, '#8e8e8a', '#2e2e2b'] : [0.9, 0.6, 0.4, '#9a6a46', '#3c2416'];
    if (b.atm && b.atm !== 'none') rim = '#ffb07a';
    defs += `<radialGradient id="${id}o" cx="38%" cy="34%" r="72%"><stop offset="0" stop-color="${pal[3]}"/><stop offset="1" stop-color="${pal[4]}"/></radialGradient>
      <filter id="${id}f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="5" seed="${seed}"/><feColorMatrix type="matrix" values="${pal[0]} 0 0 0 0.05  ${pal[1]} 0 0 0 0.04  ${pal[2]} 0 0 0 0.02  0 0 0 0 0.75"/></filter>
      <filter id="${id}k" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="2" seed="${seed + 3}"/><feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.04  2.6 0 0 0 -1.35"/></filter>`;
    body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}o)"/><g clip-path="url(#${id}c)"><rect ${rect} filter="url(#${id}f)"/><rect ${rect} filter="url(#${id}k)"/>`;
  }
  body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}s)"/>`;
  if (o.lights) { const lx = cx + 18, ly = cy + 22; body += `<circle cx="${lx}" cy="${ly}" r="6" fill="url(#${id}l)" opacity="0.55"/>` + [[0, 0, 1.1], [-3, -2, 0.7], [3, 2, 0.7], [-2, 3, 0.6], [4, -2, 0.5], [-5, 1, 0.5]].map(([dx, dy, rr]) => `<circle cx="${lx + dx}" cy="${ly + dy}" r="${rr}" fill="#ffd88a"/>`).join(''); }
  body += `</g>`;
  if (rim) { defs += `<radialGradient id="${id}a" cx="50%" cy="50%" r="50%"><stop offset="0.86" stop-color="${rim}" stop-opacity="0"/><stop offset="0.92" stop-color="${rim}" stop-opacity="0.3"/><stop offset="1" stop-color="${rim}" stop-opacity="0"/></radialGradient>`; body = `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="url(#${id}a)"/>` + body + `<circle cx="${cx}" cy="${cy}" r="${r + 0.5}" fill="none" stroke="${rim}" stroke-width="0.8" stroke-opacity="0.45"/>`; }
  if (o.ship) body += `<path d="M30 50 A62 18 -18 0 1 128 20" fill="none" stroke="#9fd6ee" stroke-width="0.6" stroke-opacity="0.35" stroke-dasharray="2 3"/><g transform="translate(112 25) rotate(-22)"><rect x="-7" y="-1.6" width="12" height="3.2" rx="1" fill="#c9d6e3"/><rect x="-10" y="-3.2" width="3.5" height="6.4" rx="0.6" fill="#8fa3b8"/><rect x="-2" y="-4.5" width="1.4" height="9" fill="#6f8aa3"/><circle cx="-11.5" cy="0" r="1.6" fill="#7fd4ff"/></g>`;
  return `<svg width="148" height="148" viewBox="0 0 140 140"><defs>${defs}</defs>${stars}${body}</svg>`;
}
const STAGE_WORDS = ['stone age', 'medieval age', 'industrial age', 'modern age'];
function milestoneHTML(p) {
  const s = ST(p.star), b = B(p.body);
  let title, text, art, extra = '';
  if (p.k === 'eco') { title = 'Life beyond Earth'; art = planetArt(b); text = [`Our survey of ${esc(s.name)} has found a living world. ${esc(b.name)} is covered in a diverse ecosystem: forests, oceans and alien animals we never knew could exist.`, 'For the first time, humanity knows Earth is not the only living world. The news is on every screen on Earth.']; }
  if (p.k === 'contact') { const c = (S.civs || []).find(x => x.id === p.civ), R = RACES[c.race]; title = 'We are not alone'; art = thumbSVG(); text = [`Our survey of ${esc(s.name)} found a civilization on ${esc(b.name)}: the ${R.name}, a people in their ${STAGE_WORDS[c.stage]}. They cannot reach space, and they do not know we exist.`, 'Earth will never see the stars the same way again.']; extra = `<button class="btn" data-a="mclose" data-v="diplo">Open Diplomacy</button>`; }
  if (p.k === 'colony') { title = 'Humanity among the stars'; art = planetArt(b, {lights: true, ship: true}); text = [`${Math.round(p.pop * 1e6).toLocaleString()} settlers have founded a colony on ${esc(b.name)}. For the first time, people live and work under the light of another sun.`, 'Humanity is no longer a one-star species, and millions on Earth are inspired.']; }
  return {body: `<div class="mile"><div class="mtag">HISTORIC MOMENT · ${p.year}</div><div class="mbd"><div class="mart">${art}</div><div><h3>${title}</h3>${text.map(t => `<p>${t}</p>`).join('')}</div></div>${p.fx.length ? `<div class="mfx">${p.fx.map(esc).join('<br>')}</div>` : ''}</div>`,
    foot: `<button class="btn" data-a="mclose" data-v="go">Go to ${esc(p.k === 'colony' ? b.name : s.name)}</button>${extra}<button class="btn primary" data-a="mclose">Continue</button>`};
}
async function showMilestones() {
  while (S && S.popq && S.popq.length) {
    const p = S.popq.shift(); autosave();
    const h = milestoneHTML(p);
    sfx('turn');
    const pr = modal({w: 600, kind: 'mile', body: h.body, foot: h.foot});
    if (p.k === 'contact') startThumb(S.civs.find(x => x.id === p.civ).race);
    const r = await pr;
    if (r === 'go') { centerOn(p.star); if (p.k === 'colony') selectColony(p.body); else selectStar(p.star); addPulse(p.star); }
    if (r === 'diplo') { ACT.openDiplo(p.civ); return; }
  }
}
function addPulse(sid) { UI.pulses = (UI.pulses || []).filter(p => p.star !== sid); UI.pulses.push({star: sid, t: performance.now()}); UI.dirty = true; }
