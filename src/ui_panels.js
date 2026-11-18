'use strict';
// ===================== STARWAKE v2 — SIDE PANELS =====================
function renderSide() {
  const el = $('#side');
  if (!S || !UI.view) { el.classList.remove('show'); return; }
  let html = '';
  if (UI.view === 'star') html = starPanel(UI.viewId);
  else if (UI.view === 'colony') { const b = B(UI.viewId); html = b.owner === 0 && b.col ? (b.col.outpost ? outpostPanel(b) : colonyPanel(b)) : starPanel(b.star); }
  else if (UI.view === 'fleet') { const f = S.fleets.find(x => x.id === UI.viewId); if (!f) { closeSide(); return; } html = fleetPanel(f); }
  const st = el.scrollTop; el.innerHTML = html; el.classList.add('show'); el.scrollTop = st;
  renderTop(); updateHint();
}
ACT.close = () => { UI.selFleet = null; closeSide(); };
ACT.star = v => selectStar(+v);
ACT.colony = v => selectColony(+v);
ACT.fleet = v => selectFleet(+v);

function starTitle(s) {
  const k = starKind(s.sp);
  return `${k.word}${s.cnt > 1 ? ' · ' + s.cnt + ' stars' : ''} · ${s.id === 0 ? 'home' : s.ly + ' light-years from the Sun'}${s.real ? ` <span class="faint" title="Moved slightly inward so it fits on the map">(really ${s.real} ly)</span>` : ''}`;
}
function bodyFacts(b) {
  const s = ST(b.star), tags = [];
  const P = PCLASS[b.cls];
  if (!P.belt) tags.push(`<span class="tag">${TEMPS[b.temp]}</span>`, `<span class="tag">${ATMS[b.atm]}</span>`);
  if (lifeKnown(b)) tags.push(`<span class="tag" style="color:${b.life === 'ecosystem' ? '#5be08a' : b.life === 'microbial' ? '#2ee6d6' : 'var(--dim)'}">${LIFE[b.life]}${b.life === 'ecosystem' && b.toxicLife ? ' (toxic to humans)' : ''}</span>`);
  else tags.push(`<span class="tag faint">Life: unknown (survey needed)</span>`);
  if (S.surveyed[b.star] || b.owner === 0) tags.push(`<span class="tag">${MINERALS[b.min]} minerals</span>`);
  for (const t of b.traits) tags.push(`<span class="tag sp" title="${esc(TRAITS[t].desc)}">${TRAITS[t].name}</span>`);
  const h = habSeen(b), unsure = !lifeKnown(b) && HAB[h].cap > 0;
  const cap = popCap(b, h);
  return `<div class="facts">${tags.join('')}</div><div class="small" style="margin-top:4px">For humans: <span class="habtag" style="color:${HAB[h].color}">${HAB[h].name}${unsure ? '?' : ''}</span>${cap > 0 ? ` · room for ${people(cap)}${unsure ? '?' : ''}` : ''} <span class="faint">· ${HAB[h].desc}${unsure ? ' (until surveyed, unknown native life could change this)' : ''}</span></div>`;
}
function bodyName(b) { return esc(b.name) + (b.of ? ` <span class="faint">(moon of ${esc(b.of)})</span>` : ''); }
function sizeWord(b) { if (PCLASS[b.cls].belt) return ''; return ['', 'Small ', 'Medium ', 'Large ', 'Large ', 'Giant '][b.size] || ''; }
function bodyActions(b) {
  const out = [];
  for (const f of S.fleets.filter(f => f.star === b.star && f.dest == null)) {
    if (fleetHas(f, 'colony') && !(b.col && (b.col.home || b.col.pop > popCap(b) * 0.5))) { const e = colonizeCheck(f, b, 'colony'); if (!e) out.push(`<button class="btn sm primary" data-a="colonize" data-v="${f.id}:${b.id}:colony">${b.owner === 0 && b.col && !b.col.outpost ? 'Add settlers' : 'Found colony'}</button>`); }
    if (fleetHas(f, 'outpost') && b.owner !== 0) { const e = colonizeCheck(f, b, 'outpost'); if (!e) { const cheap = ST(b.star).bodies.some(x => B(x).owner === 0 && B(x).col && !B(x).col.outpost); out.push(`<button class="btn sm" data-a="colonize" data-v="${f.id}:${b.id}:outpost">Build outpost</button>${cheap ? '<span class="tiny amber">Cheaper as a project from your colony here.</span>' : ''}`); } }
    if (out.length) break;
  }
  return out.join(' ');
}
ACT.colonize = v => {
  const [fid, bid, kind] = v.split(':'); const f = S.fleets.find(x => x.id === +fid), b = B(+bid);
  if (colonize(f, b, kind)) { showNews(); if (kind === 'colony') selectColony(b.id); else renderSide(); UI.dirty = true; autosave(); }
};
function starPanel(sid) {
  const s = ST(sid);
  let h = `<div class="hdr"><div><h2>${esc(s.name)}</h2><div class="dim small">${starTitle(s)}</div></div><button class="x" data-a="close">✕</button></div>`;
  h += `<div class="sdesc">${esc(starDesc(s))}</div>`;
  if (s.guardKnown) h += `<div class="card" style="border-color:#7a2a2a"><b class="bad">Guardian machines.</b> Ancient automated defenses destroy any ship that enters this system.</div>`;
  if (!worldsKnown(s)) {
    h += `<div class="card dim">Only seen through telescopes. Send any ship here to see its worlds; a ship passing within 1 light-year will do.</div>`;
    if (lifeVisible(s)) { const eco = s.bodies.map(B).some(b => b.life === 'ecosystem'), mic = s.bodies.map(B).some(b => b.life === 'microbial'); h += `<div class="card small">Biosignatures: ${eco ? '<span class="good">signs of a living ecosystem</span>' : mic ? '<span class="acc">faint signs of microbial life</span>' : '<span class="dim">no signs of life</span>'}</div>`; }
  } else {
    if (!S.visited[sid]) h += `<div class="card small dim">Mapped by the Great Telescope. No ship has been here yet.</div>`;
    if (s.anom && !s.anomDone && S.visited[sid]) {
      const sci = S.fleets.find(f => f.star === sid && f.dest == null && fleetHas(f, 'lab'));
      h += `<div class="card" style="border-color:#6a5020"><b class="amber">◆ Strange readings</b><div class="small dim" style="margin-top:3px">Something here is worth a closer look. A ship with a Science Lab can investigate.</div>${sci ? `<button class="btn sm amber" style="margin-top:6px" data-a="investigate" data-v="${sci.id}">Investigate</button>` : ''}</div>`;
    }
    h += `<div class="row sb" style="margin-top:6px"><div class="sec" style="margin:0">Worlds</div><span class="small ${S.surveyed[sid] ? 'good' : 'dim'}">${S.surveyed[sid] ? 'Surveyed' : 'Not surveyed'}</span></div>`;
    if (!s.bodies.length) h += `<div class="card dim">No planets orbit this star.</div>`;
    for (const bid of s.bodies) {
      const b = B(bid), ours = b.owner === 0 && b.col;
      const st = ours ? stageOf(b) : null;
      h += `<div class="card ${ours ? 'click' : ''}" ${ours ? `data-a="colony" data-v="${b.id}"` : ''}><div class="body">${planetBall(b, 32)}<div style="flex:1;min-width:0"><b>${bodyName(b)}</b><div class="dim small">${sizeWord(b)}${lc(PCLASS[b.cls].name)}</div>${bodyFacts(b)}
        ${ours ? `<div class="row sb small" style="margin-top:5px"><span class="good">Ours · ${STAGES[st].name}${b.col.outpost ? '' : ' · ' + people(b.col.pop)}</span><span class="acc">Manage ▸</span></div>` : ''}
        ${bodyActions(b) ? `<div class="row wrap" style="margin-top:6px;gap:5px">${bodyActions(b)}</div>` : ''}</div></div></div>`;
    }
  }
  const nn = nearest3(sid);
  if (nn.length) h += `<div class="sec">Nearest systems</div><div class="small">${nn.map(({s: t, d}, i) => `<div><span class="nnum">${i + 1}</span><a class="acc" style="cursor:pointer" data-a="star" data-v="${t.id}">${esc(t.name)}</a> <span class="dim">${d.toFixed(1)} ly</span></div>`).join('')}</div>`;
  const fl = S.fleets.filter(f => f.star === sid && f.dest == null);
  if (fl.length) { h += `<div class="sec">Our ships here</div>`; for (const f of fl) h += `<div class="card click" data-a="fleet" data-v="${f.id}"><div class="row sb"><span>${fleetName(f)}</span><span class="dim small">${f.task ? taskText(f) : 'idle'}</span></div></div>`; }
  if (colonyStars().includes(sid)) { const fd = systemFood(sid); h += `<div class="sec">System food</div><div class="small">Grown ${fd.made} · eaten ${fd.eaten} · <span class="${fd.net >= 0 ? 'good' : 'bad'}">${sgn(fd.net)}/yr</span> · stored ${fd.stock}</div>`; }
  return h;
}
function fleetName(f) { const cnt = {}; for (const sh of f.ships) { const n = design(sh.d).name; cnt[n] = (cnt[n] || 0) + 1; } return Object.entries(cnt).map(([n, c]) => (c > 1 ? c + '× ' : '') + esc(n)).join(', '); }
function taskText(f) { const t = f.task; if (!t) return ''; if (t.type === 'survey') return (t.probe ? 'probe survey' : 'surveying') + ' (' + t.left + ' yr left)'; if (t.type === 'route') return 'trade route: ' + ST(t.a).name + ' ⇄ ' + ST(t.b).name + ' (' + t.cargo + ')'; return ''; }

// ---------- colony ----------
function colonyPanel(b) {
  const c = b.col, o = colOut(b), st = stageOf(b);
  const cap = o.cap, g = growthRate(b);
  const nextT = {settlement: 0.1, city: 10}[st];
  let h = `<div class="hdr"><div class="row">${planetBall(b, 42)}<div><h2>${esc(b.name)}</h2><div class="dim small">${STAGES[st].name} · ${HAB[o.hab].name} ${lc(PCLASS[b.cls].name)}</div></div></div><button class="x" data-a="close">✕</button></div>
    <div class="small"><a class="acc" style="cursor:pointer" data-a="star" data-v="${b.star}">◂ ${esc(ST(b.star).name)} system</a></div>
    <div class="sec">Population</div>
    <div class="row sb small"><span><b>${people(c.pop)}</b> of ${people(cap)}</span><span class="${ST(b.star).short ? 'bad' : 'good'}">${ST(b.star).short ? 'Shrinking (hunger)' : c.pop >= cap ? 'Full' : '+' + (g * (1 - c.pop / cap) * 100).toFixed(1) + '% per year'}</span></div>
    <div class="bar g" style="margin-top:4px"><i style="width:${Math.min(100, Math.log10(1 + c.pop * 1e6) / Math.log10(1 + cap * 1e6) * 100)}%"></i></div>
    ${nextT ? `<div class="tiny dim" style="margin-top:3px">Becomes a ${STAGES[st === 'settlement' ? 'city' : 'core'].name} at ${people(nextT)}.</div>` : ''}
    <div class="sec">Output per year</div>
    <div class="grid2 small"><div>Production <b>${o.prod}</b></div><div>Research <b>${o.rp}</b></div><div>Credits <b>${o.bc}</b></div><div>Food <b>${o.food}</b> <span class="dim">(eats ${o.eat})</span></div></div>
    <div class="sec">Focus</div><div class="row wrap" style="gap:4px">${Object.keys(FOCUS).map(k => `<button class="btn sm ${c.focus === k ? 'on' : ''}" data-a="focus" data-v="${b.id}:${k}" title="${esc(FOCUS[k].desc)}">${FOCUS[k].name}</button>`).join('')}</div>
    <div class="tiny dim" style="margin-top:3px">${esc(FOCUS[c.focus].desc)}</div>`;
  const built = Object.keys(c.proj).filter(k => PROJECTS[k]);
  h += `<div class="sec">Projects built</div><div class="small">${built.length ? built.map(k => `<span class="tag" title="${esc(PROJECTS[k].desc)}">${PROJECTS[k].name}</span>`).join('') : '<span class="dim">None yet</span>'}${b.tf ? ` <span class="tag sp">Terraformed ×${b.tf}</span>` : ''}</div>`;
  h += `<div class="sec">Building</div>`;
  if (c.queue.length) {
    const it = c.queue[0], cost = itemCost(b, it), k = buyCost(b);
    h += `<div class="card"><div class="row sb"><b>${esc(itemName(it))}${it.n > 1 ? ' ×' + it.n : ''}</b><span class="dim small">${o.prod > 0 ? Math.max(1, Math.ceil((cost - c.prog) / o.prod)) : '∞'} yr</span></div><div class="bar a" style="margin:5px 0"><i style="width:${Math.min(100, c.prog / cost * 100)}%"></i></div>
      <div class="row sb small"><span class="dim">${Math.floor(c.prog)} / ${cost}</span><button class="btn sm amber" data-a="buy" data-v="${b.id}" ${S.bc < k || c.prog >= cost ? 'disabled' : ''}>Buy · ${k} credits</button></div></div>`;
    c.queue.forEach((q, i) => { h += `<div class="qitem"><span class="dim tiny">${i + 1}</span><span class="nm">${esc(itemName(q))}</span>${q.kind === 'ship' ? `<button class="btn sm" data-a="qn" data-v="${b.id}:${i}:-1">−</button><b class="small">${q.n || 1}</b><button class="btn sm" data-a="qn" data-v="${b.id}:${i}:1">+</button>` : ''}${i ? `<button class="x" data-a="qup" data-v="${b.id}:${i}">▲</button>` : ''}<button class="x" data-a="qdel" data-v="${b.id}:${i}">✕</button></div>`; });
  } else h += `<div class="card small dim">Nothing being built: production is sold for ${Math.floor(o.prod / 2)} credit${Math.floor(o.prod / 2) === 1 ? '' : 's'} a year.</div>`;
  const tab = UI.buildTab;
  h += `<div class="row" style="margin:8px 0 4px;gap:4px"><button class="btn sm ${tab === 'proj' ? 'on' : ''}" data-a="btab" data-v="proj">Projects</button><button class="btn sm ${tab === 'ship' ? 'on' : ''}" data-a="btab" data-v="ship">Ships</button></div>`;
  if (tab === 'proj') {
    for (const t of outpostTargets(b)) {
      if (c.queue.some(q => q.kind === 'outpost' && q.id === t.id)) continue;
      const cost = itemCost(b, {kind: 'outpost', id: t.id});
      h += `<div class="opt" data-a="qadd" data-v="${b.id}:outpost:${t.id}"><span class="nm">Outpost on ${esc(t.name)}<div class="tiny dim">A robotic outpost in this system: production, no people. Costs 1 credit a year.</div></span><span class="tiny dim">${cost} · ${o.prod > 0 ? Math.ceil(cost / o.prod) : '∞'} yr</span></div>`;
    }
    for (const id in PROJECTS) {
      const P = PROJECTS[id]; if (P.unique || P.outpostOnly || (P.tech && !has(P.tech))) continue; if (c.proj[id] && !P.repeat) continue;
      const why = projReason(b, id), cost = projCost(id);
      h += `<div class="opt" ${why ? `style="opacity:.45;cursor:default"` : `data-a="qadd" data-v="${b.id}:proj:${id}"`}><span class="nm">${P.name}<div class="tiny dim">${esc(why || P.desc)}</div></span><span class="tiny dim">${cost} · ${o.prod > 0 ? Math.ceil(cost / o.prod) : '∞'} yr</span></div>`;
    }
  } else {
    const why = shipReason(b);
    if (why) h += `<div class="small dim" style="padding:6px">${why}. Build an Orbital Shipyard first (Projects tab).</div>`;
    for (const d of S.designs.filter(d => !d.hidden && !d.obsolete)) {
      const cost = shipCost(d, b);
      h += `<div class="opt" ${why ? 'style="opacity:.45;cursor:default"' : `data-a="qadd" data-v="${b.id}:ship:${d.id}"`}><span class="nm">${esc(d.name)}<div class="tiny dim">${designSummary(d)}</div></span><span class="tiny dim">${cost} · ${o.prod > 0 ? Math.ceil(cost / o.prod) : '∞'} yr</span></div>`;
    }
  }
  return h;
}
function designSummary(d) {
  const ab = [];
  if (designHas(d, 'colony')) ab.push('settlers'); if (designHas(d, 'outpost')) ab.push('outposts'); if (designHas(d, 'lab')) ab.push('science lab'); if (designHas(d, 'cargo')) ab.push('cargo');
  if (designHas(d, 'booster')) ab.push('booster');
  return pct(designSpeed(d)) + ' light speed · telescope ' + Math.round(designTel(d)) + ' ly' + (ab.length ? ' · ' + ab.join(', ') : '') + (designHas(d, 'outpost') ? ' · for systems without a colony of ours' : '');
}
ACT.focus = v => { const [bid, k] = v.split(':'); B(+bid).col.focus = k; renderSide(); };
ACT.btab = v => { UI.buildTab = v; renderSide(); };
ACT.qadd = v => { const [bid, kind, id] = v.split(':'); const c = B(+bid).col; if (kind === 'outpost') { c.queue.push({kind, id: +id}); renderSide(); return; } if (kind === 'ship') { const last = c.queue[c.queue.length - 1]; if (last && last.kind === 'ship' && last.id === id) last.n = (last.n || 1) + 1; else c.queue.push({kind, id, n: 1}); } else c.queue.push({kind, id}); renderSide(); };
ACT.qdel = v => { const [bid, i] = v.split(':').map(Number); const c = B(bid).col; if (i === 0) c.prog = Math.floor(c.prog * 0.5); c.queue.splice(i, 1); renderSide(); };
ACT.qup = v => { const [bid, i] = v.split(':').map(Number); const q = B(bid).col.queue; [q[i - 1], q[i]] = [q[i], q[i - 1]]; renderSide(); };
ACT.qn = v => { const [bid, i, d] = v.split(':').map(Number); const it = B(bid).col.queue[i]; it.n = Math.max(1, (it.n || 1) + d); renderSide(); };
ACT.buy = v => { if (buyItem(B(+v))) toast('Bought: finishes next year'); renderSide(); };

// ---------- fleet ----------
function fleetPanel(f) {
  const where = f.dest != null ? `En route to ${esc(ST(f.dest).name)} · ${etaTo(f, f.dest)} year${etaTo(f, f.dest) > 1 ? 's' : ''} left` : f.star != null ? 'At ' + esc(ST(f.star).name) : 'In deep space';
  let h = `<div class="hdr"><div><h2>${fleetName(f)}</h2><div class="dim small">${where}</div></div><button class="x" data-a="close">✕</button></div>
    <div class="small dim">Speed ${pct(fleetSpeed(f))} of light (${fleetSpeed(f).toFixed(2)} ly per year) · telescope ${Math.round(fleetTel(f))} ly${fleetCargo(f) ? ' · carries ' + fleetCargo(f) * 4 + ' food per trip' : ''}</div>
    <div class="small acc" style="margin-top:6px">Click any known star to send this ship there.</div>
    <div style="margin-top:6px"><button class="btn sm ${f.auto ? 'on' : ''}" data-a="autoExp" data-v="${f.id}">${f.auto ? 'Auto-explore: on (click to stop)' : 'Auto-explore'}</button></div>`;
  if (f.task) h += `<div class="card small" style="margin-top:8px">${taskText(f)} ${f.task.type === 'route' ? `<button class="btn sm" data-a="endRoute" data-v="${f.id}">End route</button>` : ''}</div>`;
  if (f.star != null && f.dest == null) {
    const s = ST(f.star), acts = [];
    if (fleetHas(f, 'lab') && !S.surveyed[s.id] && !(f.task && f.task.type === 'survey')) acts.push(`<button class="btn sm primary" data-a="survey" data-v="${f.id}">Survey system (${has('survey_drones') ? 1 : 3} yr)</button>`);
    if (canProbeSurvey(f) && !fleetHas(f, 'lab')) acts.push(`<button class="btn sm" data-a="probeSurvey" data-v="${f.id}" title="The ship is used up when the survey finishes">Probe survey (5 yr, uses up the ship)</button>`);
    if (canInvestigate(f)) acts.push(`<button class="btn sm amber" data-a="investigate" data-v="${f.id}">Investigate strange readings</button>`);
    if (fleetCargo(f) && colonyStars().includes(s.id)) acts.push(`<button class="btn sm" data-a="routeSetup" data-v="${f.id}">Start a trade route from here</button>`);
    if (fleetHas(f, 'colony') || fleetHas(f, 'outpost')) acts.push(`<button class="btn sm" data-a="star" data-v="${s.id}">Choose a world to settle ▸</button>`);
    if (acts.length) h += `<div class="sec">Actions</div><div class="row wrap" style="gap:5px">${acts.join('')}</div>`;
    if (UI.routeSetup === f.id) {
      const dests = colonyStars().filter(x => x !== s.id);
      h += `<div class="card" style="margin-top:8px"><div class="small">Trade route from <b>${esc(s.name)}</b> to:</div><select id="rdest" style="width:100%;margin:5px 0">${dests.map(x => `<option value="${x}">${esc(ST(x).name)} (${etaTo(f, x)} yr each way)</option>`).join('')}</select>
        <div class="small">Carry: <select id="rcargo"><option value="food">Food (from this system's store)</option><option value="settlers">Settlers</option></select></div>
        ${dests.length ? `<button class="btn sm primary" style="margin-top:6px" data-a="routeGo" data-v="${f.id}">Start route</button>` : '<div class="small bad">You need a second colony system first.</div>'}</div>`;
    }
  }
  h += `<div class="sec">Ships (${f.ships.length})</div>`;
  const groups = {}; for (const sh of f.ships) (groups[sh.d] = groups[sh.d] || []).push(sh);
  for (const did in groups) {
    const d = design(did), list = groups[did], selN = list.filter(sh => UI.fleetSel[sh.id]).length;
    h += `<div class="card"><div class="row"><div style="flex:1"><b>${esc(d.name)}</b> <span class="dim">×${list.length}</span><div class="tiny dim">${designSummary(d)}</div></div>${f.ships.length > 1 ? `<div class="row" style="gap:3px"><button class="btn sm" data-a="fsel" data-v="${did}:-1">−</button><span class="small">${selN}</span><button class="btn sm" data-a="fsel" data-v="${did}:1">+</button></div>` : ''}</div></div>`;
  }
  const nSel = Object.values(UI.fleetSel).filter(Boolean).length;
  const others = f.star != null ? S.fleets.filter(x => x.star === f.star && x.dest == null && x !== f) : [];
  h += `<div class="row wrap" style="gap:5px;margin-top:6px"><button class="btn sm" data-a="split" data-v="${f.id}" ${nSel && nSel < f.ships.length ? '' : 'disabled'}>Split off selected (${nSel})</button>
    <button class="btn sm" data-a="mergeAll" data-v="${f.id}" ${others.length ? '' : 'disabled'}>Merge ships here (${others.length})</button>
    <button class="btn sm danger" data-a="scrap" data-v="${f.id}">Scrap ${nSel ? 'selected' : 'fleet'}</button></div>`;
  if (f.star != null) h += `<div style="margin-top:8px"><a class="acc small" style="cursor:pointer" data-a="star" data-v="${f.star}">View the ${esc(ST(f.star).name)} system ▸</a></div>`;
  return h;
}
ACT.probeSurvey = v => { const f = S.fleets.find(x => x.id === +v); f.task = {type: 'survey', left: 5, probe: true}; f.auto = false; renderSide(); toast('Probe survey started'); };
ACT.autoExp = v => { const f = S.fleets.find(x => x.id === +v); f.auto = !f.auto; if (f.auto && f.dest == null && !f.task) { const t = exploreTarget(f); if (t) { orderMove(f, t.id); toast('Exploring: heading to ' + ST(t.id).name); } else { f.auto = false; toast('No unexplored stars on our charts'); } } UI.dirty = true; renderSide(); };
ACT.survey = v => { const f = S.fleets.find(x => x.id === +v); f.task = {type: 'survey', left: has('survey_drones') ? 1 : 3}; renderSide(); toast('Survey started'); };
ACT.endRoute = v => { const f = S.fleets.find(x => x.id === +v); f.task = null; renderSide(); };
ACT.routeSetup = v => { UI.routeSetup = +v; renderSide(); };
ACT.routeGo = v => {
  const f = S.fleets.find(x => x.id === +v); const b2 = +$('#rdest').value, cargo = $('#rcargo').value;
  f.task = {type: 'route', a: f.star, b: b2, cargo, load: 0};
  routeArrive(f); UI.routeSetup = null; UI.dirty = true; renderSide(); toast('Trade route started');
};
ACT.fsel = v => { const [did, d] = v.split(':'); const f = S.fleets.find(x => x.id === UI.viewId); const list = f.ships.filter(sh => sh.d === did); if (+d > 0) { const sh = list.find(sh => !UI.fleetSel[sh.id]); if (sh) UI.fleetSel[sh.id] = true; } else { const sh = list.slice().reverse().find(sh => UI.fleetSel[sh.id]); if (sh) delete UI.fleetSel[sh.id]; } renderSide(); };
ACT.split = v => { const f = S.fleets.find(x => x.id === +v); const ids = f.ships.filter(sh => UI.fleetSel[sh.id]).map(sh => sh.id); const nf = splitFleet(f, ids); UI.fleetSel = {}; selectFleet(nf.id); };
ACT.mergeAll = v => { const f = S.fleets.find(x => x.id === +v); for (const o of S.fleets.filter(x => x.star === f.star && x.dest == null && x !== f)) mergeFleets(f, o); f.task = null; UI.fleetSel = {}; renderSide(); UI.dirty = true; };
ACT.scrap = v => {
  const f = S.fleets.find(x => x.id === +v); const ids = Object.keys(UI.fleetSel).length ? f.ships.filter(sh => UI.fleetSel[sh.id]).map(sh => sh.id) : f.ships.map(sh => sh.id);
  confirmBox('Scrap ' + ids.length + ' ship' + (ids.length > 1 ? 's' : '') + '?', 'They are dismantled and stop costing upkeep. Nothing is refunded.', () => { f.ships = f.ships.filter(sh => !ids.includes(sh.id)); cleanupFleets(); UI.fleetSel = {}; if (!S.fleets.includes(f)) closeSide(); else renderSide(); UI.dirty = true; });
};
ACT.investigate = v => { const f = S.fleets.find(x => x.id === +v); if (canInvestigate(f)) openEvent(f); };

// ---------- outpost ----------
function outpostPanel(b) {
  const c = b.col, o = colOut(b);
  const targets = ST(b.star).bodies.map(B).filter(x => x.owner === 0 && x.col && !x.col.outpost);
  const sup = supplyTarget(b);
  let h = `<div class="hdr"><div class="row">${planetBall(b, 42)}<div><h2>${esc(b.name)}</h2><div class="dim small">Outpost · ${lc(PCLASS[b.cls].name)}</div></div></div><button class="x" data-a="close">✕</button></div>
    <div class="small"><a class="acc" style="cursor:pointer" data-a="star" data-v="${b.star}">◂ ${esc(ST(b.star).name)} system</a></div>
    <div class="sec">Output per year</div>
    <div class="grid2 small"><div>Production <b>${o.prod}</b> <span class="dim">(${MINERALS[b.min].toLowerCase()} minerals)</span></div><div>Upkeep <b class="bad">${-o.bc} credit a year</b></div>${o.rp ? `<div>Research <b>${o.rp}</b></div>` : ''}</div>
    <div class="sec">Production goes to</div>
    <div class="row wrap" style="gap:4px"><button class="btn sm ${sup ? '' : 'on'}" data-a="opMode" data-v="${b.id}:build">Build here</button>${targets.map(t => `<button class="btn sm ${sup === t ? 'on' : ''}" data-a="opMode" data-v="${b.id}:${t.id}">Supply ${esc(t.name)}</button>`).join('')}</div>
    <div class="tiny dim" style="margin-top:3px">${sup ? `Sends ${r1(o.prod * supplyRate())} production a year to ${esc(sup.name)}'s build queue${supplyRate() < 1 ? ' (20% is lost in transport until Orbital Logistics)' : ''}.` : targets.length ? 'Builds its own projects and ships, or can supply a colony in this system.' : 'Builds its own projects and ships. With a colony in this system, it could supply that colony instead.'}</div>`;
  if (sup) return h;
  const built = Object.keys(c.proj).filter(k => PROJECTS[k]);
  h += `<div class="sec">Projects built</div><div class="small">${built.length ? built.map(k => `<span class="tag" title="${esc(PROJECTS[k].desc)}">${PROJECTS[k].name}</span>`).join('') : '<span class="dim">None yet</span>'}</div>`;
  h += `<div class="sec">Building</div>`;
  if (c.queue.length) {
    const it = c.queue[0], cost = itemCost(b, it), k = buyCost(b);
    h += `<div class="card"><div class="row sb"><b>${esc(itemName(it))}${it.n > 1 ? ' ×' + it.n : ''}</b><span class="dim small">${o.prod > 0 ? Math.max(1, Math.ceil((cost - c.prog) / o.prod)) : '∞'} yr</span></div><div class="bar a" style="margin:5px 0"><i style="width:${Math.min(100, c.prog / cost * 100)}%"></i></div>
      <div class="row sb small"><span class="dim">${Math.floor(c.prog)} / ${cost}</span><button class="btn sm amber" data-a="buy" data-v="${b.id}" ${S.bc < k || c.prog >= cost ? 'disabled' : ''}>Buy · ${k} credits</button></div></div>`;
    c.queue.forEach((q, i) => { h += `<div class="qitem"><span class="dim tiny">${i + 1}</span><span class="nm">${esc(itemName(q))}</span>${q.kind === 'ship' ? `<button class="btn sm" data-a="qn" data-v="${b.id}:${i}:-1">−</button><b class="small">${q.n || 1}</b><button class="btn sm" data-a="qn" data-v="${b.id}:${i}:1">+</button>` : ''}${i ? `<button class="x" data-a="qup" data-v="${b.id}:${i}">▲</button>` : ''}<button class="x" data-a="qdel" data-v="${b.id}:${i}">✕</button></div>`; });
  } else h += `<div class="card small dim">Nothing being built: production is sold for ${r1(o.prod / 2)} credit${r1(o.prod / 2) === 1 ? '' : 's'} a year.</div>`;
  const tab = UI.buildTab;
  h += `<div class="row" style="margin:8px 0 4px;gap:4px"><button class="btn sm ${tab === 'proj' ? 'on' : ''}" data-a="btab" data-v="proj">Projects</button><button class="btn sm ${tab === 'ship' ? 'on' : ''}" data-a="btab" data-v="ship">Ships</button></div>`;
  if (tab === 'proj') {
    for (const id in PROJECTS) {
      const P = PROJECTS[id]; if (!P.outpost || (c.proj[id] && !P.repeat)) continue;
      const why = projReason(b, id), cost = projCost(id);
      h += `<div class="opt" ${why ? `style="opacity:.45;cursor:default"` : `data-a="qadd" data-v="${b.id}:proj:${id}"`}><span class="nm">${P.name}<div class="tiny dim">${esc(why || P.desc)}</div></span><span class="tiny dim">${cost} · ${o.prod > 0 ? Math.ceil(cost / o.prod) : '∞'} yr</span></div>`;
    }
  } else {
    const why = shipReason(b);
    if (why) h += `<div class="small dim" style="padding:6px">${why}. An automated Orbital Shipyard can be built here (Projects tab).</div>`;
    for (const d of S.designs.filter(d => !d.hidden && !d.obsolete)) {
      const cost = shipCost(d, b);
      h += `<div class="opt" ${why ? 'style="opacity:.45;cursor:default"' : `data-a="qadd" data-v="${b.id}:ship:${d.id}"`}><span class="nm">${esc(d.name)}<div class="tiny dim">${designSummary(d)}</div></span><span class="tiny dim">${cost} · ${o.prod > 0 ? Math.ceil(cost / o.prod) : '∞'} yr</span></div>`;
    }
  }
  return h;
}
ACT.opMode = v => { const [bid, m] = v.split(':'); const c = B(+bid).col; if (m === 'build') { c.mode = 'build'; c.supplyTo = null; } else { c.mode = 'supply'; c.supplyTo = +m; } renderSide(); renderTop(); };
