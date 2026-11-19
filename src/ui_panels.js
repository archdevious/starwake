'use strict';
// ===================== STARWAKE v2 — SIDE PANELS =====================
function renderSide() {
  renderAttn();
  const el = $('#side');
  if (!S || !UI.view) { el.classList.remove('show'); return; }
  let html = '';
  if (UI.view === 'star') html = starPanel(UI.viewId);
  else if (UI.view === 'colony') { const b = B(UI.viewId); html = b.owner === 0 && b.col ? (b.col.outpost ? outpostPanel(b) : colonyPanel(b)) : starPanel(b.star); }
  else if (UI.view === 'fleet') { const f = S.fleets.find(x => x.id === UI.viewId); if (!f) { closeSide(); return; } html = fleetPanel(f); }
  const st = el.scrollTop; el.innerHTML = html; el.classList.add('show'); el.scrollTop = st;
  renderTop(); updateHint();
}
ACT.close = () => {
  if (UI.view === 'colony') { selectStar(B(UI.viewId).star); return; }
  if (UI.view === 'fleet') { const f = S.fleets.find(x => x.id === UI.viewId); if (f && f.star != null && f.dest == null) { selectStar(f.star); return; } }
  UI.selFleet = null; UI.selStar = null; closeSide();
};
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
    if (fleetHas(f, 'colony') && !(b.col && (b.col.home || b.col.pop > popCap(b) * 0.5))) { const e = colonizeCheck(f, b, 'colony'); if (!e) out.push(`<button class="btn sm primary" data-a="colonize" data-v="${f.id}:${b.id}:colony">${b.owner === 0 && b.col ? (b.col.outpost ? 'Turn outpost into colony' : 'Add settlers') : 'Found colony'}</button>${!(b.owner === 0 && b.col && !b.col.outpost) && ST(b.star).bodies.some(x => x !== b.id && B(x).owner === 0 && B(x).col && !B(x).col.outpost) ? '<span class="tiny amber">Cheaper as a Settle project from your colony here.</span>' : ''}`); }
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
  let h = `<div class="hdr"><div><h2>${esc(s.name)}${canRenameStar(s) ? ` <button class="x ren" data-a="renStar" data-v="${s.id}" title="Rename this star">✎</button>` : ''}</h2>${s.orig ? `<div class="tiny faint">Charted as ${esc(s.orig)}</div>` : ''}<div class="dim small">${starTitle(s)}</div></div><button class="x" data-a="close">✕</button></div>`;
  h += `<div class="sdesc">${esc(starDesc(s))}</div>`;
  if (s.guardKnown) h += `<div class="card" style="border-color:#7a2a2a"><b class="bad">Guardian machines.</b> Ancient automated defenses destroy any ship that enters this system.</div>`;
  h += civStarHTML(s);
  if (!worldsKnown(s)) {
    h += `<div class="card dim"><b>Unexplored.</b> Its worlds are unknown. Send any ship into orbit here, or get a ship's telescope within range (2.5 or 4 light-years, by module), to chart it.</div>`;
  } else {
    if (!S.surveyed[sid]) h += `<div class="card small dim"><b>Charted.</b> Its worlds are known, but not their life or minerals. A ship with a Science Lab can survey it.</div>`;
    if (s.anom && !s.anomDone && S.visited[sid]) {
      const sci = S.fleets.find(f => f.star === sid && f.dest == null && fleetHas(f, 'lab'));
      h += `<div class="card" style="border-color:#6a5020"><b class="amber">◆ Strange readings</b><div class="small dim" style="margin-top:3px">Something here is worth a closer look. A ship with a Science Lab can investigate.</div>${sci ? `<button class="btn sm amber" style="margin-top:6px" data-a="investigate" data-v="${sci.id}">Investigate</button>` : ''}</div>`;
    }
    h += `<div class="row sb" style="margin-top:6px"><div class="sec" style="margin:0">Worlds</div><span class="small ${S.surveyed[sid] ? 'good' : 'dim'}">${S.surveyed[sid] ? 'Surveyed' : 'Not surveyed'}</span></div>`;
    if (!s.bodies.length) h += `<div class="card dim">No planets orbit this star.</div>`;
    for (const bid of s.bodies) {
      const b = B(bid), ours = b.owner === 0 && b.col;
      const st = ours ? stageOf(b) : null;
      const idle = ours && !b.col.queue.length && !supplyTarget(b);
      h += `<div class="card ${ours ? 'click' : ''} ${idle ? 'idlecard' : ''}" ${ours ? `data-a="colony" data-v="${b.id}"` : ''} ${idle ? 'title="Nothing is being built here"' : ''}><div class="body">${planetBall(b, 32)}<div style="flex:1;min-width:0"><b>${bodyName(b)}</b><div class="dim small">${sizeWord(b)}${lc(PCLASS[b.cls].name)}</div>${civBodyLine(b)}${bodyFacts(b)}
        ${ours ? `<div class="row sb small" style="margin-top:5px"><span class="good">Ours · ${STAGES[st].name}${b.col.outpost ? '' : ' · ' + people(b.col.pop)}</span><span class="acc" style="white-space:nowrap">Manage ▸</span></div><div class="small" style="margin-top:2px">${buildLine(b)}</div>` : ''}
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
function budgetHTML() {
  const v = spaceBudget(), B0 = S.budget || {temp: []};
  const temps = B0.temp.filter(t => S.year < t.until);
  return `<div class="sec">Space budget</div><div class="card small"><div><b class="amber" style="font-size:16px">${v}%</b> of Earth's economy goes to the space programme</div>
    <div class="tiny dim" style="margin-top:4px">Earth's production, research and credits below are that share of its whole economy. Discoveries, danger, public mood and some technologies change it.${has('spacefaring') ? ' Spacefaring Society keeps it at 20% or more.' : ''}</div>
    ${temps.map(t => `<div class="tiny bad" style="margin-top:3px">${esc(t.name || 'Temporary change')}: ${t.v > 0 ? '+' : ''}${t.v} until ${t.until}</div>`).join('')}</div>`;
}
function buildLine(b) {
  const c = b.col, sup = supplyTarget(b);
  if (sup) return `<span class="dim">Supplying ${esc(sup.name)}</span>`;
  if (!c.queue.length) return `<span class="bad">Nothing being built</span>`;
  const it = c.queue[0], o = colOut(b), cost = itemCost(b, it), yrs = o.prod > 0 ? Math.max(1, Math.ceil((cost - c.prog) / o.prod)) : '∞';
  return `<span class="dim">Building:</span> ${esc(itemName(it))}${it.n > 1 ? ' ×' + it.n : ''} <span class="dim">(${yrs} yr)${c.queue.length > 1 ? ' +' + (c.queue.length - 1) + ' more' : ''}</span>`;
}
function shipNotes(list) { const lost = list.filter(sh => sh.lost && sh.lost.length).length, pods = list.reduce((a, sh) => a + shipPods(sh), 0), tr = list.reduce((a, sh) => a + shipTroops(sh), 0); return (lost ? `<div class="tiny bad">Science Lab lost on ${lost === list.length ? (list.length > 1 ? 'all' : 'this ship') : lost}</div>` : '') + (pods ? `<div class="tiny ${tr ? 'good' : 'dim'}">Troops ${people(tr / 1e6)} of ${people(pods * TROOPS_PER_POD / 1e6)}${tr < pods * TROOPS_PER_POD ? ' (refill at a star with one of our colonies)' : ''}</div>` : ''); }
function fleetName(f) { const cnt = {}; for (const sh of f.ships) { const n = design(sh.d).name; cnt[n] = (cnt[n] || 0) + 1; } return Object.entries(cnt).map(([n, c]) => (c > 1 ? c + '× ' : '') + esc(n)).join(', '); }
function taskText(f) { const t = f.task; if (!t) return ''; if (t.type === 'survey') return (t.probe ? 'probe survey' : 'surveying') + ' (' + t.left + ' yr left)'; if (t.type === 'route') return 'trade route ' + esc(routeName(t)); if (t.type === 'study') { const c = civAt(f.star); return 'studying their language' + (c ? ' (' + Math.floor(c.lang) + '%)' : ''); } return ''; }

// ---------- colony ----------
function outputHTML(b, o) {
  const sf = systemFood(b.star), bad = ST(b.star).short || sf.net < 0;
  const tg = (t, tip) => `<span class="otag" title="${tip}">${t}</span>`;
  const loc = tg('local', 'Production is used only by this colony (or by outposts supplying it).');
  const emp = tg('empire', 'Research and credits from every colony go into one empire-wide total.');
  return `<div class="grid2 small"><div>Production <b>${o.prod}</b> ${loc}</div><div>Research <b>${o.rp}</b> ${emp}</div><div>Credits <b>${o.bc}</b> ${emp}</div><div>Food <b>${o.food}</b> <span class="dim">(eats ${o.eat})</span> ${tg('system', 'Food is shared by everything at the same star.')}</div></div>
    <div class="tiny ${bad ? 'bad' : 'dim'}" style="margin-top:3px">${esc(ST(b.star).name)} system food: ${sf.net >= 0 ? '+' : ''}${sf.net} a year${sf.net >= 0 ? ' surplus' : ' shortfall'}, ${sf.stock} stored</div>`;
}
function colonyPanel(b) {
  const c = b.col, o = colOut(b), st = stageOf(b);
  const cap = o.cap, g = growthRate(b);
  const nextT = {settlement: 0.1, city: 10}[st];
  let h = `<div class="hdr"><div class="row">${planetBall(b, 42)}<div><h2>${esc(b.name)} <button class="x ren" data-a="renBody" data-v="${b.id}" title="Rename this world">✎</button></h2><div class="dim small">${STAGES[st].name} · ${HAB[o.hab].name} ${lc(PCLASS[b.cls].name)}</div></div></div><button class="x" data-a="close">✕</button></div>
    <div class="small"><a class="acc" style="cursor:pointer" data-a="star" data-v="${b.star}">◂ ${esc(ST(b.star).name)} system</a></div>
    <div class="sec">Population</div>
    <div class="row sb small"><span><b>${people(c.pop)}</b> of ${people(cap)}</span><span class="${ST(b.star).short ? 'bad' : 'good'}">${ST(b.star).short ? 'Shrinking (hunger)' : c.pop >= cap ? 'Full' : '+' + (g * (1 - c.pop / cap) * 100).toFixed(1) + '% per year'}</span></div>
    <div class="bar g" style="margin-top:4px"><i style="width:${Math.min(100, Math.log10(1 + c.pop * 1e6) / Math.log10(1 + cap * 1e6) * 100)}%"></i></div>
    ${nextT ? `<div class="tiny dim" style="margin-top:3px">Becomes a ${STAGES[st === 'settlement' ? 'city' : 'core'].name} at ${people(nextT)}.</div>` : ''}
    ${c.home ? budgetHTML() : ''}
    <div class="sec">Output per year</div>
    ${outputHTML(b, o)}
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
  const ots = outpostTargets(b), sts = settleTargets(b), ownOut = sts.filter(t => t.owner === 0);
  const nWorlds = ots.length + ownOut.length;
  h += `<div class="row" style="margin:8px 0 4px;gap:4px"><button class="btn sm ${tab === 'proj' ? 'on' : ''}" data-a="btab" data-v="proj">Projects</button><button class="btn sm ${tab === 'outp' ? 'on' : ''}" data-a="btab" data-v="outp">New colonies${nWorlds ? ' (' + nWorlds + ')' : ''}</button><button class="btn sm ${tab === 'ship' ? 'on' : ''}" data-a="btab" data-v="ship">Ships</button></div>`;
  if (tab === 'outp') {
    h += `<div class="tiny dim" style="padding:2px 6px 6px">Interplanetary expansion within this star system: no ship needed. The outpost or settlement appears as soon as the project is done.</div>`;
    if (!nWorlds) h += `<div class="small dim" style="padding:6px">Every world in this system is already claimed.</div>`;
    const robo = ots.filter(t => HAB[habSeen(t)].cap <= 0), live = ots.filter(t => HAB[habSeen(t)].cap > 0);
    const claim = t => claimedAt(t), anyQ = t => !!claim(t);
    const row = (t, kind) => { const cost = itemCost(b, {kind, id: t.id}), hs = habSeen(t), q = anyQ(t), own = t.owner === 0;
      const label = kind === 'settle' ? (own ? 'Turn the outpost on ' + esc(t.name) + ' into a colony' : 'Settle ' + esc(t.name)) : 'Outpost on ' + esc(t.name);
      const info = kind === 'settle' ? `${people(settlerCount())} settlers · grows to ${people(popCap(t))}` : `${lc(PCLASS[t.cls].name)}${S.surveyed[b.star] ? ' · ' + MINERALS[t.min].toLowerCase() + ' minerals' : ''}${HAB[hs].cap > 0 ? ` · <span style="color:${HAB[hs].color}">${HAB[hs].name}</span> · ${people(popCap(t, hs))}` : ''}`;
      const qb = q ? claim(t) : null; return `<div class="opt" ${q ? 'style="opacity:.45;cursor:default"' : `data-a="qadd" data-v="${b.id}:${kind}:${t.id}"`}><span class="nm">${label}<div class="tiny dim">${info}${q ? (qb === b ? ' · queued' : ' · queued at ' + esc(qb.name)) : ''}</div></span><span class="tiny dim">${cost} · ${o.prod > 0 ? Math.ceil(cost / o.prod) : '∞'} yr</span></div>`; };
    if (robo.length) h += `<div class="sec" style="margin-top:4px">Robotic only</div>` + robo.map(t => row(t, 'outpost')).join('');
    if (live.length || ownOut.length) {
      h += `<div class="sec">Could hold people</div><div class="tiny dim" style="padding:0 6px 4px">Settle a world to found a colony, or claim it as an outpost first and settle it later.</div>`;
      for (const t of live) { h += row(t, 'outpost'); if (sts.includes(t)) h += row(t, 'settle'); }
      h += ownOut.map(t => row(t, 'settle')).join('');
    }
  } else if (tab === 'proj') {
    if (c.home) h += `<div class="tiny dim" style="padding:2px 6px 6px">Earth's own economy is not yours to build on: it grows through the space budget. Only space projects can be built here.</div>`;
    for (const id in PROJECTS) {
      const P = PROJECTS[id]; if (P.unique || P.outpostOnly || (P.tech && !has(P.tech)) || (c.home && !P.space)) continue; if (c.proj[id] && !P.repeat) continue;
      if (Object.keys(c.proj).some(k => PROJECTS[k] && PROJECTS[k].replaces === id)) continue;
      const why = projReason(b, id), cost = projCost(id);
      h += `<div class="opt" ${why ? `style="opacity:.45;cursor:default"` : `data-a="qadd" data-v="${b.id}:proj:${id}"`}><span class="nm">${P.name}<div class="tiny dim">${esc(why || P.desc)}</div></span><span class="tiny dim">${cost} · ${o.prod > 0 ? Math.ceil(cost / o.prod) : '∞'} yr</span></div>`;
    }
  } else {
    h += shipListHTML(b, o);
  }
  return h;
}
function shipListHTML(b, o) {
  let h = '';
  const base = shipReason(b);
  if (base) h += `<div class="small dim" style="padding:6px">${base}. Build one first (Projects tab).</div>`;
  for (const d of S.designs) {
    const why = base || shipReason(b, d), cost = shipCost(d, b);
    h += `<div class="opt" ${why ? 'style="opacity:.45;cursor:default"' : `data-a="qadd" data-v="${b.id}:ship:${d.id}"`}>${designIcon(d, 30)}<span class="nm">${esc(d.name)}<div class="tiny dim">${!base && why ? esc(why) : designSummary(d)}</div>${!why && designHas(d, 'cargo') && colonyStars().length < 2 ? '<div class="tiny amber">Trade routes need a colony at both ends.</div>' : ''}</span><span class="tiny dim">${cost} · ${o.prod > 0 ? Math.ceil(cost / o.prod) : '∞'} yr</span></div>`;
  }
  return h;
}
function designSummary(d) {
  const ab = [];
  if (designHas(d, 'colony')) ab.push('settlers'); if (designHas(d, 'outpost')) ab.push('outposts'); if (designHas(d, 'lab')) ab.push('science lab'); if (designHas(d, 'cargo')) ab.push('cargo');
  if (designHas(d, 'booster')) ab.push('booster');
  return pct(designSpeed(d)) + ' light speed' + (designTel(d) ? ' · telescope ' + telText(designTel(d)) : '') + (ab.length ? ' · ' + ab.join(', ') : '') + (designHas(d, 'outpost') ? ' · for systems without a colony of ours' : '');
}
ACT.focus = v => { const [bid, k] = v.split(':'); B(+bid).col.focus = k; renderSide(); };
ACT.btab = v => { UI.buildTab = v; renderSide(); };
ACT.qadd = v => { const [bid, kind, id] = v.split(':'); const c = B(+bid).col; if (kind === 'outpost' || kind === 'settle') { if (claimedAt(B(+id))) { toast('Already queued at ' + claimedAt(B(+id)).name); return; } c.queue.push({kind, id: +id}); renderSide(); return; } if (kind === 'ship') { const last = c.queue[c.queue.length - 1]; if (last && last.kind === 'ship' && last.id === id) last.n = (last.n || 1) + 1; else c.queue.push({kind, id, n: 1}); } else c.queue.push({kind, id}); renderSide(); };
ACT.qdel = v => { const [bid, i] = v.split(':').map(Number); const c = B(bid).col; if (i === 0) c.prog = Math.floor(c.prog * 0.5); c.queue.splice(i, 1); renderSide(); };
ACT.qup = v => { const [bid, i] = v.split(':').map(Number); const c = B(bid).col, q = c.queue; if (i === 1) c.prog = Math.floor(c.prog * 0.5); [q[i - 1], q[i]] = [q[i], q[i - 1]]; renderSide(); };
ACT.qn = v => { const [bid, i, d] = v.split(':').map(Number); const it = B(bid).col.queue[i]; it.n = Math.max(1, (it.n || 1) + d); renderSide(); };
ACT.buy = v => { if (buyItem(B(+v))) toast('Bought: finishes next year'); renderSide(); };

// ---------- fleet ----------
function fleetPanel(f) {
  const where = f.dest != null ? `En route to ${esc(ST(f.dest).name)} · ${etaTo(f, f.dest)} year${etaTo(f, f.dest) > 1 ? 's' : ''} left` : f.star != null ? 'At ' + esc(ST(f.star).name) : 'In deep space';
  let h = `<div class="hdr"><div><h2>${fleetName(f)}</h2><div class="dim small">${where}</div></div><button class="x" data-a="close">✕</button></div>
    <div class="small dim">Speed ${pct(fleetSpeed(f))} of light (${fleetSpeed(f).toFixed(2)} ly per year)${fleetTel(f) ? ' · telescope ' + telText(fleetTel(f)) : ''}${fleetCargo(f) ? ' · carries ' + people(cargoCap(f).pop) + ' settlers and ' + Math.round(cargoCap(f).food) + ' food per trip' : ''}</div>
    <div class="small acc" style="margin-top:6px">Click any known star to send this ship there.</div>
    <div style="margin-top:6px"><button class="btn sm ${f.auto ? 'on' : ''}" data-a="autoExp" data-v="${f.id}">${f.auto ? 'Auto-explore: on (click to stop)' : 'Auto-explore'}</button></div>`;
  if (f.task && f.task.type === 'route') {
    const t = f.task;
    h += `<div class="card small" style="margin-top:8px"><b>Trade route</b>: settlers and food go ${esc(ST(t.a).name)} → ${esc(ST(t.b).name)}, trade comes back to ${esc(ST(t.a).name)}.
      ${t.warn ? `<div class="bad tiny" style="margin-top:3px">Not at full value: ${esc(t.warn)}.</div>` : ''}
      <div class="row" style="gap:5px;margin-top:6px"><button class="btn sm" data-a="routeSetup" data-v="${f.id}">Change route</button><button class="btn sm" data-a="endRoute" data-v="${f.id}">End route</button></div></div>`;
  } else if (f.task) h += `<div class="card small" style="margin-top:8px">${taskText(f)}</div>`;
  if (f.cargo && (f.cargo.pop > 0 || f.cargo.food > 0 || f.cargo.trade)) {
    const c = f.cargo, bits = [];
    if (c.pop > 0) bits.push(people(c.pop) + ' settlers'); if (c.food > 0) bits.push(Math.round(c.food) + ' food'); if (c.trade) bits.push('trade goods worth ' + c.trade.prod + ' production and ' + c.trade.bc + ' credits');
    h += `<div class="small" style="margin-top:6px">Carrying: <b>${bits.join(', ')}</b>${f.dest == null && !f.task && (c.pop > 0 || c.food > 0) ? '<div class="tiny dim">Unloads when it reaches one of your colonies, or when a colony is founded here.</div>' : ''}</div>`;
  }
  if (fleetCargo(f) && !(f.task && f.task.type === 'route')) h += `<div style="margin-top:6px"><button class="btn sm" data-a="routeSetup" data-v="${f.id}">Start a trade route</button></div>`;
  if (UI.routeSetup === f.id) h += routeSetupHTML(f);
  if (f.star != null && f.dest == null) {
    const s = ST(f.star), acts = [];
    if (fleetHas(f, 'lab') && !S.surveyed[s.id] && !(f.task && f.task.type === 'survey')) acts.push(`<button class="btn sm primary" data-a="survey" data-v="${f.id}">Survey system (${has('survey_drones') ? 1 : 3} yr)</button>`);
    const scope = has('biosignatures') && fleetHas(f, 'tel_l') && !fleetHas(f, 'lab') && !S.surveyed[s.id] && !(f.task && f.task.type === 'survey');
    if (scope) acts.push(`<button class="btn sm primary" data-a="scopeSurvey" data-v="${f.id}" title="Uses the Large Telescope with Biosignature Spectroscopy. The ship is not used up.">Telescope survey (3 yr)</button>`);
    if (!scope && canProbeSurvey(f) && !fleetHas(f, 'lab')) acts.push(`<button class="btn sm" data-a="probeSurvey" data-v="${f.id}" title="The ship is used up when the survey finishes">Probe survey (5 yr, uses up the ship)</button>`);
    acts.push(...civActions(f));
    if (canInvestigate(f)) acts.push(`<button class="btn sm amber" data-a="investigate" data-v="${f.id}">Investigate strange readings</button>`);
    if (fleetHas(f, 'colony') || fleetHas(f, 'outpost')) acts.push(`<button class="btn sm" data-a="star" data-v="${s.id}">Choose a world to settle ▸</button>`);
    if (acts.length) h += `<div class="sec">Actions</div><div class="row wrap" style="gap:5px">${acts.join('')}</div>`;
  }
  h += `<div class="sec">Ships (${f.ships.length})</div>`;
  const groups = {}; for (const sh of f.ships) (groups[sh.d] = groups[sh.d] || []).push(sh);
  for (const did in groups) {
    const d = design(did), list = groups[did], selN = list.filter(sh => UI.fleetSel[sh.id]).length;
    h += `<div class="card"><div class="row">${designIcon(d, 32)}<div style="flex:1;margin-left:6px"><b>${esc(d.name)}</b> <span class="dim">×${list.length}</span><div class="tiny dim">${designSummary(d)}</div>${shipNotes(list)}</div>${f.ships.length > 1 ? `<div class="row" style="gap:3px"><button class="btn sm" data-a="fsel" data-v="${did}:-1">−</button><span class="small">${selN}</span><button class="btn sm" data-a="fsel" data-v="${did}:1">+</button></div>` : ''}</div></div>`;
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
ACT.scopeSurvey = v => { const f = S.fleets.find(x => x.id === +v); f.task = {type: 'survey', left: 3}; f.auto = false; renderSide(); toast('Telescope survey started'); };
ACT.survey = v => { const f = S.fleets.find(x => x.id === +v); f.task = {type: 'survey', left: has('survey_drones') ? 1 : 3}; renderSide(); toast('Survey started'); };
ACT.endRoute = v => { const f = S.fleets.find(x => x.id === +v); f.task = null; renderSide(); };
function routeSetupHTML(f) {
  const stars = colonyStars();
  if (stars.length < 2) return `<div class="card small" style="margin-top:8px">Trade routes need a colony at both ends. Found a colony at another star first.</div>`;
  const R = UI.route || {};
  if (R.f !== f.id) {
    const pops = sid => ourColoniesAt(sid).reduce((t, b) => t + b.col.pop, 0);
    const big = stars.slice().sort((x, y) => pops(y) - pops(x));
    let a = big[0], b = f.star != null && f.star !== a && stars.includes(f.star) ? f.star : big[1];
    if (f.task && f.task.type === 'route') { a = f.task.a; b = f.task.b; }
    UI.route = {f: f.id, a, b};
  }
  const r = UI.route, opts = sel => stars.map(x => `<option value="${x}" ${x === sel ? 'selected' : ''}>${esc(ST(x).name)}</option>`).join('');
  const taken = r.a !== r.b && routeTaken(r.a, r.b, f);
  return `<div class="card small" style="margin-top:8px"><b>Trade route</b>
    <div class="row" style="gap:5px;margin:6px 0;align-items:center"><select data-c="routeA" style="flex:1">${opts(r.a)}</select><button class="btn sm" data-a="routeSwap" title="Swap direction">⇄</button><select data-c="routeB" style="flex:1">${opts(r.b)}</select></div>
    <div class="tiny dim">Settlers and food go ${esc(ST(r.a).name)} → ${esc(ST(r.b).name)}. Trade comes back to ${esc(ST(r.a).name)}, paid by the size of the colony at ${esc(ST(r.b).name)}. ${r.a !== r.b ? 'About ' + (etaTo({x: ST(r.a).x, y: ST(r.a).y, z: ST(r.a).z, ships: f.ships}, r.b)) + ' years each way.' : ''}</div>
    ${r.a === r.b ? '<div class="tiny bad">Pick two different systems.</div>' : taken ? '<div class="tiny bad">Another freighter already runs a route between these systems.</div>' : ''}
    <div class="row" style="gap:5px;margin-top:6px"><button class="btn sm primary" data-a="routeGo" data-v="${f.id}" ${r.a === r.b || taken ? 'disabled' : ''}>${f.task && f.task.type === 'route' ? 'Change route' : 'Start route'}</button><button class="btn sm" data-a="routeCancel">Cancel</button></div></div>`;
}
ACT.routeSetup = v => { UI.routeSetup = +v; UI.route = null; renderSide(); };
ACT.routeCancel = () => { UI.routeSetup = null; UI.route = null; renderSide(); };
ACT.routeA = v => { UI.route.a = +v; renderSide(); };
ACT.routeB = v => { UI.route.b = +v; renderSide(); };
ACT.routeSwap = () => { const r = UI.route; [r.a, r.b] = [r.b, r.a]; renderSide(); };
ACT.routeGo = v => {
  const f = S.fleets.find(x => x.id === +v), r = UI.route; if (!f || !r || r.a === r.b || routeTaken(r.a, r.b, f)) return;
  startRoute(f, r.a, r.b); UI.routeSetup = null; UI.route = null; UI.dirty = true; renderSide(); toast('Trade route: ' + routeName(f.task));
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
  let h = `<div class="hdr"><div class="row">${planetBall(b, 42)}<div><h2>${esc(b.name)} <button class="x ren" data-a="renBody" data-v="${b.id}" title="Rename this world">✎</button></h2><div class="dim small">Outpost · ${lc(PCLASS[b.cls].name)}</div></div></div><button class="x" data-a="close">✕</button></div>
    <div class="small"><a class="acc" style="cursor:pointer" data-a="star" data-v="${b.star}">◂ ${esc(ST(b.star).name)} system</a></div>
    ${c.enslaved ? garrisonHTML(b) : ''}
    <div class="sec">Output per year</div>
    <div class="grid2 small"><div>Production <b>${o.prod}</b> <span class="dim">(${MINERALS[b.min].toLowerCase()} minerals)</span></div><div>${o.bc < 0 ? `Upkeep <b class="bad">${-o.bc} credit a year</b>` : `Credits <b class="good">+${o.bc}</b> <span class="dim">(after upkeep)</span>`}</div>${o.rp ? `<div>Research <b>${o.rp}</b></div>` : ''}</div>
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
      if (P.giantOnly && b.cls !== 'gasgiant' && b.cls !== 'icegiant') continue; if (P.replaces && c.proj[P.replaces] == null && !P.req) continue; if (P.req === 'shallow' && c.proj.mines) continue;
      const why = projReason(b, id), cost = projCost(id);
      h += `<div class="opt" ${why ? `style="opacity:.45;cursor:default"` : `data-a="qadd" data-v="${b.id}:proj:${id}"`}><span class="nm">${P.name}<div class="tiny dim">${esc(why || P.desc)}</div></span><span class="tiny dim">${cost} · ${o.prod > 0 ? Math.ceil(cost / o.prod) : '∞'} yr</span></div>`;
    }
  } else {
    h += shipListHTML(b, o);
  }
  return h;
}
ACT.opMode = v => { const [bid, m] = v.split(':'); const c = B(+bid).col; if (m === 'build') { c.mode = 'build'; c.supplyTo = null; } else { c.mode = 'supply'; c.supplyTo = +m; } renderSide(); renderTop(); };

function askName(title, cur, done) {
  modal({title, w: 420, body: `<input type="text" id="rnInput" maxlength="24" value="${esc(cur)}" style="width:100%"><div class="tiny dim" style="margin-top:6px">Up to 24 characters.</div>`,
    foot: `<button class="btn" data-a="mclose">Cancel</button><button class="btn primary" data-a="rnOk">Rename</button>`,
    after: () => { const i = $('#rnInput'); if (i) { i.addEventListener('keydown', e => { if (e.key === 'Enter') ACT.rnOk(); }); setTimeout(() => { i.focus(); i.select(); }, 30); } }});
  UI.rnDone = done;
}
ACT.rnOk = () => { const v = $('#rnInput') ? $('#rnInput').value : ''; const f = UI.rnDone; ACT.mclose(); if (f && f(v)) { UI.dirty = true; renderSide(); toast('Renamed'); } };
ACT.renStar = v => { const s = ST(+v); askName('Rename ' + s.name, s.name, t => renameStar(s, t)); };
ACT.renBody = v => { const b = B(+v); askName('Rename ' + b.name, b.name, t => renameBody(b, t)); };
