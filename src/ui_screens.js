'use strict';
// ===================== STARWAKE v2 — SCREENS =====================
function modal(o) {
  return new Promise(res => {
    const m = $('#modal');
    m.innerHTML = `<div class="mbox" style="max-width:${o.w || 900}px">${o.title ? `<div class="mhead"><h2>${o.title}</h2>${o.noClose ? '' : '<button class="x" data-a="mclose">✕</button>'}</div>` : ''}<div class="mbody">${o.body || ''}</div>${o.foot ? `<div class="mfoot">${o.foot}</div>` : ''}</div>`;
    m.classList.add('show'); m.dataset.kind = o.kind || ''; UI.modalNoClose = !!o.noClose;
    UI.modalRes = v => { m.classList.remove('show'); m.innerHTML = ''; m.dataset.kind = ''; UI.modalRes = null; res(v); };
    if (o.after) o.after(m);
  });
}
function modalBody(html) { const b = $('#modal .mbody'); if (b) { const st = b.scrollTop; b.innerHTML = html; b.scrollTop = st; } }
function modalOpen(kind) { return $('#modal').classList.contains('show') && (!kind || $('#modal').dataset.kind === kind); }
ACT.mclose = v => { if (UI.modalRes) UI.modalRes(v === undefined ? null : v); };
ACT.mres = v => { if (UI.modalRes) UI.modalRes(v); };
function confirmBox(title, text, yes) { modal({title, w: 460, body: `<div>${text}</div>`, foot: `<button class="btn" data-a="mres" data-v="no">Cancel</button><button class="btn danger" data-a="mres" data-v="yes">Confirm</button>`}).then(v => { if (v === 'yes') yes(); }); }

// ---------- news feed ----------
const NEWS_ICON = {info: 'ℹ️', tech: '🔬', build: '🏗️', ship: '🚀', colony: '🪐', warn: '⚠️', arrive: '🔭', spot: '✧', survey: '🧪', lost: '💥', stage: '🏙️', idle: '💤'};
function showNews() {
  const el = $('#news'); if (!S) return;
  const list = S.msgs.slice(-14);
  if (!list.length || !UI.newsOpen) { el.classList.toggle('show', false); return; }
  el.innerHTML = `<div class="nh"><span>Year ${S.year - (S.msgs === UI._lastMsgs ? 0 : 0)} news</span><button class="x" data-a="newsClose">✕</button></div>` +
    list.map(m => `<div class="ni ${m.star != null ? 'click' : ''}" ${m.star != null ? `data-a="goStar" data-v="${m.star}"` : ''}>${NEWS_ICON[m.kind] || 'ℹ️'} ${esc(m.text)}</div>`).join('');
  el.classList.add('show');
}
ACT.newsClose = () => { $('#news').classList.remove('show'); };

// ---------- anomaly events ----------
function openEvent(f) {
  const s = ST(f.star), ev = eventOf(s); sfx('discover');
  const body = `<div class="evt"><div class="dim small">${esc(s.name)} · ${S.year}</div><p>${esc(ev.text)}</p>${ev.ch.map((c, i) => `<button class="btn choice" data-a="mres" data-v="${i}">${esc(c.t)}</button>`).join('')}</div>`;
  modal({title: '◆ ' + esc(ev.title), w: 620, noClose: true, kind: 'event', body}).then(v => {
    const r = resolveChoice(f, +v);
    modal({title: '◆ ' + esc(ev.title), w: 620, noClose: true, body: `<div class="evt"><p>${esc(r.text)}</p>${r.gains.length ? `<div class="card small">${r.gains.map(g => `<div>${esc(g)}</div>`).join('')}</div>` : ''}</div>`, foot: `<button class="btn primary" data-a="mclose">Continue</button>`}).then(() => { UI.dirty = true; renderSide(); renderTop(); autosave(); });
  });
}

// ---------- research ----------
function researchHTML() {
  const t = totals();
  let h = `<div class="row sb" style="margin-bottom:10px"><div>Research: <b class="acc">+${fmt(t.rp)}</b> per year${S.rpBank ? ` · <span class="dim">${Math.floor(S.rpBank)} banked</span>` : ''}</div><div class="small dim">Every technology can be learned eventually. The order is up to you.</div></div>`;
  if (S.res) { const c = techCost(S.res.tech); h += `<div class="card"><div class="row sb"><span>Researching <b class="amber">${TECH[S.res.tech].name}</b></span><span class="dim small">${Math.floor(S.res.prog + S.rpBank)} / ${c} · ${t.rp > 0 ? Math.max(1, Math.ceil((c - S.res.prog - S.rpBank) / t.rp)) : '∞'} years</span></div><div class="bar a" style="margin-top:5px"><i style="width:${Math.min(100, (S.res.prog + S.rpBank) / c * 100)}%"></i></div></div>`; }
  h += `<div class="tgrid">`;
  for (const fk in FIELDS) {
    h += `<div class="tcol"><div class="rname" style="border-color:${FIELDS[fk].color};width:auto"><b>${FIELDS[fk].name}</b></div>`;
    for (const tk of TECHS.filter(x => x.f === fk)) {
      const known = has(tk.id), cur = S.res && S.res.tech === tk.id, ok = tk.req.every(has);
      const cls = known ? 'known' : cur ? 'res' : ok ? 'avail' : 'lock';
      h += `<div class="tech ${cls}" ${cls === 'avail' ? `data-a="pickTech" data-v="${tk.id}"` : ''}><b>${tk.name}</b> <span class="faint tiny">${known ? '✓' : techCost(tk.id)}</span><div class="d">${esc(tk.desc)}</div>${!ok && !known ? `<div class="req">Needs ${tk.req.filter(r => !has(r)).map(r => TECH[r].name).join(', ')}</div>` : ''}</div>`;
    }
    h += `</div>`;
  }
  h += `</div><div class="sec">Breakthroughs (found only by exploring)</div><div class="row wrap" style="gap:6px">${Object.keys(BREAKTHROUGHS).map(k => has(k) ? `<div class="tech known" style="max-width:260px"><b>${BREAKTHROUGHS[k].name}</b><div class="d">${esc(BREAKTHROUGHS[k].desc)}</div></div>` : `<div class="tech lock" style="max-width:260px"><b>???</b><div class="d">Not yet discovered</div></div>`).join('')}</div>`;
  return h;
}
ACT.openResearch = () => modal({title: 'Research', w: 1300, kind: 'research', body: researchHTML(), foot: `<button class="btn primary" data-a="mclose">Done</button>`}).then(() => renderTop());
ACT.pickTech = v => { setResearch(v); modalBody(researchHTML()); renderTop(); toast('Researching ' + TECH[v].name); };

// ---------- ship design ----------
function designHTML() {
  const d = UI.designEdit, H = HULLS[d.hull];
  while (d.mods.length > H.slots) d.mods.pop();
  let h = `<div class="dgrid" style="grid-template-columns:240px 1fr 280px"><div><div class="sec" style="margin-top:0">Your designs</div>`;
  for (const x of S.designs.filter(x => !x.hidden)) h += `<div class="opt" data-a="loadDesign" data-v="${x.id}" ${x.obsolete ? 'style="opacity:.5"' : ''}><span class="nm">${esc(x.name)}<div class="tiny dim">${HULLS[x.hull].name} · ${designCost(x)} cost${x.obsolete ? ' · hidden' : ''}</div></span><button class="x" data-a="obsDesign" data-v="${x.id}" title="${x.obsolete ? 'Show in build lists' : 'Hide from build lists'}">${x.obsolete ? '↺' : '🗑'}</button></div>`;
  h += `<div class="tiny dim" style="margin-top:8px">Load a design to copy it, change it, and save it as a new design.</div></div>`;
  h += `<div><input type="text" id="dname" value="${esc(d.name)}" maxlength="28" style="width:100%"><div class="sec">Hull</div><div class="hullbtns">${Object.keys(HULLS).map(k => `<button class="btn sm ${d.hull === k ? 'on' : ''}" data-a="setHull" data-v="${k}">${HULLS[k].name} (${HULLS[k].slots} slots)</button>`).join('')}</div>
    <div class="sec">Modules</div>`;
  for (let i = 0; i < H.slots; i++) h += `<div class="slotrow"><span class="small dim" style="width:52px">Slot ${i + 1}</span><select data-c="setSlot" data-i="${i}"><option value="">— empty —</option>${Object.keys(MODULES).map(k => `<option value="${k}" ${d.mods[i] === k ? 'selected' : ''}>${MODULES[k].name} · mass ${MODULES[k].mass} · ${MODULES[k].cost} cost</option>`).join('')}</select></div>`;
  h += `<div class="small dim" style="margin-top:8px">${d.mods.filter(Boolean).map(m => `<div>• <b>${MODULES[m].name}</b>: ${MODULES[m].desc}</div>`).join('')}</div></div>`;
  const dd = {hull: d.hull, mods: d.mods.filter(Boolean)};
  h += `<div><table class="statt small"><tr><td>Mass</td><td>${designMass(dd)}</td></tr><tr><td>Speed now</td><td><b>${pct(designSpeed(dd))}</b> of light</td></tr><tr><td>Telescope</td><td>${Math.round(designTel(dd))} ly</td></tr><tr><td>Build cost</td><td><b class="amber">${designCost(dd)}</b></td></tr><tr><td>Upkeep</td><td>${fmt(designCost(dd) * 0.01)} credits/yr</td></tr></table>
    <div class="tiny dim" style="margin-top:8px">Heavier ships fly at a lower share of your top engine speed.</div>
    <button class="btn primary" style="width:100%;margin-top:12px" data-a="saveDesign" ${dd.mods.length ? '' : 'disabled'}>Save as new design</button></div></div>`;
  return h;
}
ACT.openDesign = () => { UI.designEdit = {name: 'New Design', hull: 'light', mods: ['tel_m', '']}; return modal({title: 'Ship Design', w: 1050, kind: 'design', body: designHTML(), foot: `<button class="btn" data-a="mclose">Close</button>`}).then(() => renderSide()); };
function rerenderDesign() { const n = $('#dname'); if (n) UI.designEdit.name = n.value; modalBody(designHTML()); }
ACT.setHull = v => { UI.designEdit.hull = v; rerenderDesign(); };
ACT.setSlot = (v, el) => { UI.designEdit.mods[+el.dataset.i] = v; rerenderDesign(); };
ACT.loadDesign = v => { const x = design(v); UI.designEdit = {name: x.name + ' II', hull: x.hull, mods: x.mods.slice()}; rerenderDesign(); };
ACT.obsDesign = v => { const x = design(v); x.obsolete = !x.obsolete; rerenderDesign(); };
ACT.saveDesign = () => { const d = UI.designEdit; const n = $('#dname'); const nd = {id: 'u' + (S.nextDesign++), name: (n && n.value.trim()) || 'Design', hull: d.hull, mods: d.mods.filter(Boolean)}; S.designs.push(nd); toast('Saved design: ' + nd.name); rerenderDesign(); };

// ---------- colonies list ----------
function coloniesHTML() {
  const cols = colonies(true).sort((a, b) => (a.col.outpost ? 1 : 0) - (b.col.outpost ? 1 : 0)).sort((a, b) => (b.col.home ? 1 : 0) - (a.col.home ? 1 : 0) || b.col.pop - a.col.pop);
  return `<table class="list"><tr><th>World</th><th>Stage</th><th>Population</th><th>Focus</th><th>Prod</th><th>Research</th><th>Credits</th><th>Food</th><th>Building</th></tr>${cols.map(b => { const o = colOut(b), q = b.col.queue[0];
    return `<tr class="click" data-a="colGo" data-v="${b.id}"><td>${esc(b.name)} <span class="dim tiny">${esc(ST(b.star).name)}</span></td><td>${STAGES[o.stage].name}</td><td>${b.col.outpost ? '—' : people(b.col.pop)}</td><td>${b.col.outpost ? (supplyTarget(b) ? 'Supplying ' + esc(supplyTarget(b).name) : 'Outpost') : FOCUS[b.col.focus].name}</td><td>${o.prod}</td><td>${o.rp}</td><td>${o.bc}</td><td class="${o.food - o.eat >= 0 ? 'good' : 'bad'}">${sgn(r1(o.food - o.eat))}</td><td>${q ? esc(itemName(q)) : supplyTarget(b) ? '<span class="dim">—</span>' : b.col.outpost ? '<span class="dim">Nothing (selling)</span>' : '<span class="warn">Nothing: idle</span>'}</td></tr>`; }).join('')}</table>`;
}
ACT.openColonies = () => modal({title: 'Colonies', w: 1050, body: coloniesHTML(), foot: `<button class="btn primary" data-a="mclose">Close</button>`});
ACT.colGo = v => { ACT.mclose(); const b = B(+v); if (b.col.outpost) selectStar(b.star); else selectColony(b.id); centerOn(b.star); };

// ---------- journal ----------
ACT.openJournal = () => modal({title: 'Journal of Discovery', w: 760, body: S.journal.length ? S.journal.slice().reverse().map(j => `<div class="msgi ${j.star != null ? 'click' : ''}" ${j.star != null ? `data-a="jGo" data-v="${j.star}"` : ''}><span class="ic small dim" style="width:42px">${j.year}</span><span>${esc(j.text)}</span></div>`).join('') : '<div class="dim">Nothing recorded yet. Go and explore!</div>', foot: `<button class="btn primary" data-a="mclose">Close</button>`});
ACT.jGo = v => { ACT.mclose(); ACT.goStar(v); };

// ---------- saves ----------
const SKEY = s => 'starwake2.save.' + s;
function readSlot(s) { try { const r = localStorage.getItem(SKEY(s)); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function saveTo(slot) {
  try { const data = JSON.stringify(S, (k, v) => k[0] === '_' ? undefined : v);
    localStorage.setItem(SKEY(slot), JSON.stringify({format: SAVE_FORMAT, version: GAME_VERSION, saved: Date.now(), year: S.year, turn: S.turn, name: S.empire.name, color: S.empire.color, len: S.len, data})); return true;
  } catch (e) { console.warn('save failed', e); return false; }
}
function autosave() { if (S && !S.over) saveTo('auto'); }
function migrateSave(d) { d.version = GAME_VERSION; for (const x of d.designs || []) if (x.id === 'scout' && x.mods.length === 1 && x.mods[0] === 'tel_m') x.mods.push('booster'); for (const b of d.bodies || []) if (b.col && b.col.outpost && !b.col.mode) b.col.mode = 'build'; for (const x of d.designs || []) if (x.id === 'probe') x.name = 'Pathfinder Probe'; d.msgs = d.msgs || []; d.journal = d.journal || []; d.hist = d.hist || []; return d; }
function loadFrom(slot) { const r = readSlot(slot); if (!r) return false; try { S = migrateSave(JSON.parse(r.data)); } catch (e) { toast('That save could not be read.'); return false; } startPlaying(false); return true; }
function savesHTML(canSave) {
  let h = `<table class="list"><tr><th>Slot</th><th>Civilisation</th><th>Year</th><th>Saved</th><th></th></tr>`;
  for (const s of ['auto', 1, 2, 3, 4, 5]) { const r = readSlot(s);
    h += `<tr><td>${s === 'auto' ? 'Autosave' : 'Slot ' + s}</td><td>${r ? `<span class="swatch" style="background:${r.color}"></span> ${esc(r.name)} <span class="dim tiny">${LENGTHS[r.len] ? LENGTHS[r.len].label : ''}</span>` : '<span class="dim">Empty</span>'}</td><td>${r ? r.year : ''}</td><td class="small dim">${r ? new Date(r.saved).toLocaleString() : ''}</td>
      <td style="text-align:right;white-space:nowrap">${canSave && s !== 'auto' ? `<button class="btn sm" data-a="doSave" data-v="${s}">Save here</button> ` : ''}${r ? `<button class="btn sm primary" data-a="doLoad" data-v="${s}">Load</button> <button class="x" data-a="delSave" data-v="${s}">✕</button>` : ''}</td></tr>`; }
  return h + '</table><div class="tiny dim" style="margin-top:8px">The game autosaves every year. Saves are kept in this browser and carry over to new versions.</div>';
}
ACT.openSaves = v => modal({title: v === 'load' ? 'Load game' : 'Save / Load', w: 760, kind: 'saves', body: savesHTML(v !== 'load'), foot: `<button class="btn" data-a="mclose">Close</button>`});
ACT.doSave = v => { if (saveTo(v)) toast('Saved to slot ' + v); modalBody(savesHTML(true)); };
ACT.doLoad = v => { const inGame = S && $('#app').style.display !== 'none'; const go = () => { ACT.mclose(); loadFrom(v === 'auto' ? 'auto' : +v); }; if (inGame) confirmBox('Load this save?', 'Progress since your last save in this game will be lost.', go); else go(); };
ACT.delSave = v => confirmBox('Delete this save?', 'This cannot be undone.', () => { try { localStorage.removeItem(SKEY(v)); } catch (e) {} ACT.openSaves(S && $('#app').style.display !== 'none' ? '' : 'load'); });

// ---------- menu & help ----------
ACT.openMenu = () => modal({title: 'Menu', w: 420, body: `<div style="display:flex;flex-direction:column;gap:8px">
  <button class="btn" data-a="menuGo" data-v="saves">Save / Load</button><button class="btn" data-a="menuGo" data-v="settings">Settings</button><button class="btn" data-a="menuGo" data-v="help">How to play</button>
  <button class="btn" data-a="menuGo" data-v="retire">Retire (end this game and see your score)</button><button class="btn" data-a="menuGo" data-v="title">Exit to main menu</button></div>`});
ACT.menuGo = v => {
  ACT.mclose();
  if (v === 'saves') ACT.openSaves(); else if (v === 'help') ACT.openHelp(); else if (v === 'settings') ACT.openSettings();
  else if (v === 'retire') confirmBox('Retire from this game?', 'The game ends now and your score goes into the Hall of Fame.', () => { S.over = {result: 'retired', why: 'You chose to end your story in the year ' + S.year + '.'}; showEnd(); });
  else if (v === 'title') { autosave(); showTitle(); }
};
const HELP = `<div class="small" style="line-height:1.65">
<h3>The setting</h3><p>It is ${START_YEAR}. Humanity has never met anyone else and has just learned to travel between the stars, slowly. Nothing goes faster than light: one year passes each turn, and your first ships fly at 30% of light speed, so a star 5 light-years away takes about 17 years to reach. The map uses real nearby stars at their real positions.</p>
<h3>Seeing</h3><p>Colonies' telescopes show where stars are within 16 light-years; ships see 4 (8 or 16 with telescope modules). You only learn what worlds orbit a star by flying a ship there. A Science Vessel can then <b>survey</b> the system to learn about life and minerals, and <b>investigate</b> strange readings (◆).</p>
<h3>Settling</h3><p>A Colony Ship founds a colony on a world people can live on, or adds settlers to one you already have. An Outpost Ship builds a mining outpost on almost anything. Colonies grow over decades from Settlement to City to Core World. Give each one a <b>focus</b> and order big <b>projects</b>. Ships can only be built at a colony with an Orbital Shipyard.</p>
<h3>Food</h3><p>Food cannot travel between stars by itself: each star system feeds itself. Set a colony to Farming, build Agri-Domes, or run a Freighter trade route to carry food from a system with a surplus.</p>
<h3>Danger</h3><p>A few systems hold ancient guardian machines that destroy any ship entering them. They show as ⚠ once found.</p>
<h3>Map controls</h3><p>Drag to rotate, right-drag or Shift-drag to pan, scroll to zoom. Stars sit on pins above or below a flat reference plane through the Sun. Click a star or ship; with a ship selected, click a star to send it.</p>
<h3>Keys</h3><p>Enter: end the year · F: skip ahead until something happens · R: research · D: ship design · C: colonies · J: journal · Esc: close</p></div>`;
ACT.openHelp = () => modal({title: 'How to play', w: 760, body: HELP, foot: `<button class="btn primary" data-a="mclose">Got it</button>`});

// ---------- end screen ----------
function drawHistChart(cvs) {
  const dpr = window.devicePixelRatio || 1, W = cvs.clientWidth, H = cvs.clientHeight;
  cvs.width = W * dpr; cvs.height = H * dpr; const c = cvs.getContext('2d'); c.scale(dpr, dpr);
  const hist = S.hist; if (hist.length < 2) return;
  const series = [{k: 'score', name: 'Score', color: '#ffb84a'}, {k: 'exp', name: 'Systems visited (×20)', color: '#5ad1ff', mul: 20}];
  let max = 1; for (const r of hist) for (const s of series) max = Math.max(max, r[s.k] * (s.mul || 1));
  const L = 50, Bm = 26, T = 10, Rr = 10; const X = i => L + (W - L - Rr) * i / (hist.length - 1), Y = v => H - Bm - (H - Bm - T) * v / max;
  c.strokeStyle = '#22314f'; c.fillStyle = '#8695b3'; c.font = '11px Segoe UI, sans-serif';
  for (let k = 0; k <= 4; k++) { const v = max * k / 4; c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(W - Rr, Y(v)); c.stroke(); c.textAlign = 'right'; c.fillText(Math.round(v), L - 6, Y(v) + 4); }
  c.textAlign = 'center'; const step = Math.max(1, Math.ceil(hist.length / 8)); for (let i = 0; i < hist.length; i += step) c.fillText(hist[i].y, X(i), H - 8);
  for (const s of series) { c.strokeStyle = s.color; c.lineWidth = 2.4; c.beginPath(); hist.forEach((r, i) => { const v = r[s.k] * (s.mul || 1); i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)); }); c.stroke(); }
}
async function showEnd() {
  UI.busy = true; const o = S.over, sc = score(); sfx('end');
  if (!S.recorded) { S.recorded = true; try { const hof = JSON.parse(localStorage.getItem('starwake.hof') || '[]');
    hof.push({date: Date.now(), name: S.empire.name, race: 'Humans', color: S.empire.color, result: o.result, turn: S.turn, year: S.year, score: sc.total, size: LENGTHS[S.len].label, shape: '', rivals: 0, version: GAME_VERSION});
    localStorage.setItem('starwake.hof', JSON.stringify(hof)); localStorage.removeItem(SKEY('auto')); } catch (e) {} }
  const rows = [['Systems visited', sc.explored], ['Systems surveyed', sc.surveyed], ['Life discovered', sc.life], ['Anomalies', sc.anomalies], ['Breakthroughs', sc.breakthroughs], ['Technologies', sc.techs], ['Colonies', sc.colonies], ['Population', sc.population]];
  await modal({title: o.result === 'retired' ? 'Retired' : 'The Age of Exploration Ends', w: 980, noClose: true, kind: 'end',
    body: `<p>${esc(o.why)}</p><div class="row" style="gap:16px;align-items:stretch;flex-wrap:wrap">
      <div class="card" style="flex:1;min-width:240px"><div class="sec" style="margin-top:0">Final score</div><div style="font-size:38px;font-weight:700" class="amber">${sc.total}</div><table class="statt small"><tr><td class="dim tiny">Points from</td><td></td></tr>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table></div>
      <div class="card" style="flex:3;min-width:420px"><div class="sec" style="margin-top:0">Humanity over time</div><canvas id="histc" style="width:100%;height:240px;display:block"></canvas><div class="row small" style="gap:14px;margin-top:6px"><span><span class="swatch" style="background:#ffb84a"></span> Score</span><span><span class="swatch" style="background:#5ad1ff"></span> Systems visited</span></div></div></div>
      <div class="sec">Your history</div><div class="small dim">${ERAS.map((e, i) => { const c = e.opts.find(x => x.id === S.story['e' + i]); return c ? `<div><b>${e.years}</b> ${esc(c.name)}</div>` : ''; }).join('')}</div>`,
    foot: `<button class="btn" data-a="mres" data-v="hof">Hall of Fame</button><button class="btn primary" data-a="mres" data-v="title">Main menu</button>`,
    after: () => setTimeout(() => drawHistChart($('#histc')), 30)}).then(v => { showTitle(); if (v === 'hof') ACT.openHof(); });
}
ACT.openHof = () => {
  let hof = []; try { hof = JSON.parse(localStorage.getItem('starwake.hof') || '[]'); } catch (e) {}
  hof = hof.filter(g => (g.version || 1) >= 2).sort((a, b) => b.score - a.score);
  const body = hof.length ? `<table class="list"><tr><th>#</th><th>Civilisation</th><th>Result</th><th>Score</th><th>Years</th><th>Game</th><th>Date</th></tr>${hof.map((g, i) => `<tr><td>${i + 1}</td><td><span class="swatch" style="background:${g.color}"></span> ${esc(g.name)}</td><td class="dim">${{complete: 'Completed', retired: 'Retired', victory: 'Victory', defeat: 'Defeat'}[g.result] || g.result}</td><td><b class="amber">${g.score}</b></td><td>${START_YEAR}–${g.year || ''}</td><td class="small">${esc(g.size)}</td><td class="small dim">${new Date(g.date).toLocaleDateString()}</td></tr>`).join('')}</table>` : `<div class="dim" style="padding:20px;text-align:center">No finished games yet.</div>`;
  modal({title: '🏆 Hall of Fame', w: 900, body, foot: `<button class="btn primary" data-a="mclose">Close</button>`});
};

// ---------- title & new game ----------
const NG = {step: 0, story: {}, len: 'standard', name: 'United Earth', color: '#4aa8ff'};
const COLORS = ['#4aa8ff', '#5ad76a', '#ffd23f', '#c77dff', '#ff9f43', '#2ee6d6', '#ff6fb5', '#ff5a5a'];
function showTitle() { UI.busy = true; $('#app').style.display = 'none'; $('#title').classList.add('show'); renderTitleMenu(); }
function renderTitleMenu() {
  const auto = readSlot('auto');
  $('#tcontent').innerHTML = `<div class="logo">STAR<b>WAKE</b></div><div class="sub">HUMANITY AMONG THE STARS</div>
    <div style="max-width:340px;margin:30px auto;display:flex;flex-direction:column;gap:10px">
      ${auto ? `<button class="btn primary" style="padding:12px" data-a="tContinue">Continue <span class="dim small">· ${esc(auto.name)}, ${auto.year}</span></button>` : ''}
      <button class="btn ${auto ? '' : 'primary'}" style="padding:12px" data-a="tNew">New Game</button>
      <button class="btn" style="padding:12px" data-a="openSaves" data-v="load">Load Game</button>
      <button class="btn" style="padding:12px" data-a="openHof">🏆 Hall of Fame</button>
      <button class="btn" style="padding:12px" data-a="openHelp">How to Play</button>
      <button class="btn" style="padding:12px" data-a="openSettings">Settings</button></div>
    <div style="position:fixed;right:14px;bottom:10px" class="tiny faint">Starwake v${GAME_VERSION}</div>`;
}
ACT.tContinue = () => loadFrom('auto');
ACT.tNew = () => { NG.step = 0; NG.story = {}; renderNewGame(); };
ACT.tBack = () => { if (NG.step > 0) { NG.step--; renderNewGame(); } else renderTitleMenu(); };
function renderNewGame() {
  const steps = `<div class="steps">${[0, 1, 2, 3, 4].map(i => `<i class="${i <= NG.step ? 'on' : ''}"></i>`).join('')}</div>`;
  let h = `<div class="logo" style="font-size:28px">STAR<b>WAKE</b></div>${steps}`;
  if (NG.step < 4) {
    const e = ERAS[NG.step];
    h += `<div class="era"><div class="sub" style="margin:10px 0 2px">${e.years}</div><h2 style="text-align:center;font-size:24px">${e.name}</h2><p style="text-align:center" class="dim">${e.q}</p>
      <div class="eraopts">${e.opts.map(o => `<div class="eraopt ${NG.story['e' + NG.step] === o.id ? 'sel' : ''}" data-a="ngPick" data-v="${o.id}"><h3>${o.name}</h3><p>${o.text}</p>${o.why ? `<p class="why">${o.why}</p>` : ''}<ul>${o.fx.map(f => `<li>${f}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="row" style="gap:10px;margin-top:22px;justify-content:center"><button class="btn" data-a="tBack">Back</button></div></div>`;
  } else {
    h += `<div class="era"><h2 style="text-align:center;font-size:24px;margin-top:10px">${START_YEAR}: First Light</h2><div class="card" style="margin-top:12px">${ERAS.map((e, i) => { const o = e.opts.find(x => x.id === NG.story['e' + i]); return `<div style="margin:4px 0"><span class="dim">${e.years}</span> · <b>${o.name}</b> <span class="small dim">${o.text}</span></div>`; }).join('')}</div>
      <div class="setrow" style="justify-content:center"><label>Name of your civilisation<input type="text" id="ngname" value="${esc(NG.name)}" maxlength="30" style="width:240px"></label>
        <label>Colour<div class="colors">${COLORS.map(c => `<i style="background:${c}" class="${NG.color === c ? 'sel' : ''}" data-a="ngColor" data-v="${c}"></i>`).join('')}</div></label>
        <label>Game length<div class="row" style="gap:4px">${Object.keys(LENGTHS).map(k => `<button class="btn sm ${NG.len === k ? 'on' : ''}" data-a="ngLen" data-v="${k}">${LENGTHS[k].label} (${LENGTHS[k].turns} years)</button>`).join('')}</div></label></div>
      <p class="small dim" style="text-align:center">Everything else about the galaxy is for you to discover.</p>
      <div class="row" style="gap:10px;justify-content:center;margin-top:16px"><button class="btn" data-a="tBack">Back</button><button class="btn primary" style="padding:10px 30px;font-size:16px" data-a="tStart">Launch</button></div></div>`;
  }
  h += `<div style="position:fixed;right:14px;bottom:10px" class="tiny faint">Starwake v${GAME_VERSION}</div>`;
  $('#tcontent').innerHTML = h;
}
function ngKeepName() { const n = $('#ngname'); if (n) NG.name = n.value; }
ACT.ngPick = v => { NG.story['e' + NG.step] = v; NG.step++; renderNewGame(); };
ACT.ngColor = v => { ngKeepName(); NG.color = v; renderNewGame(); };
ACT.ngLen = v => { ngKeepName(); NG.len = v; renderNewGame(); };
ACT.tStart = () => { ngKeepName(); newGame({len: NG.len, story: NG.story, name: NG.name.trim() || 'United Earth', color: NG.color}); FAR = null; startPlaying(true); };

// ---------- settings ----------
function settingsHTML() {
  const slider = (key, label, hint) => `<div class="setline"><div><b>${label}</b><div class="tiny dim">${hint}</div></div><div class="row" style="gap:8px"><input type="range" min="0" max="100" step="5" value="${SETTINGS[key]}" data-c="setVol" data-k="${key}" style="width:150px"><span class="small" style="width:36px;text-align:right">${SETTINGS[key] ? SETTINGS[key] + '%' : 'Off'}</span></div></div>`;
  return slider('music', 'Music', 'Slow ambient music, generated live as you play.') + slider('sfx', 'Sound effects', 'Buttons, arrivals, discoveries and warnings.') +
    `<div class="setline"><div><b>Nearest systems</b><div class="tiny dim">When you select a star, number its closest systems on the map and list them.</div></div>
    <select data-c="setNear">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}" ${SETTINGS.near === n ? 'selected' : ''}>${n ? n : 'Off'}</option>`).join('')}</select></div>
    <div class="tiny dim" style="margin-top:12px">Settings are kept in this browser and apply to every game. Sound starts after your first click.</div>`;
}
ACT.setVol = (v, el) => { SETTINGS[el.dataset.k] = +v; saveSettings(); audioVolumes(); if (el.dataset.k === 'sfx') sfx('arrive'); modalBody(settingsHTML()); };
ACT.openSettings = () => modal({title: 'Settings', w: 520, body: settingsHTML(), foot: `<button class="btn primary" data-a="mclose">Done</button>`});
ACT.setNear = v => { SETTINGS.near = +v; saveSettings(); UI.dirty = true; if (S) renderSide(); };
