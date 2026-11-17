'use strict';
// ===================== STARWAKE — SIDE PANELS =====================
function renderSide() {
  const el = $('#side');
  if (!S || !UI.view) { el.classList.remove('show'); return; }
  let html = '';
  if (UI.view === 'star') html = starPanel(UI.viewId);
  else if (UI.view === 'colony') { const pl = P(UI.viewId); html = pl.owner === 0 ? colonyPanel(pl) : starPanel(pl.star); }
  else if (UI.view === 'fleet') { const f = S.fleets.find(x => x.id === UI.viewId); if (!f) { closeSide(); return; } html = fleetPanel(f); }
  const st = el.scrollTop;
  el.innerHTML = html; el.classList.add('show'); el.scrollTop = st;
  updateHint(); renderTop();
}
ACT.close = () => { UI.selFleet = null; closeSide(); };
ACT.star = v => selectStar(+v);
ACT.colony = v => selectColony(+v);
ACT.fleet = v => { selectFleet(+v); const f = S.fleets.find(x => x.id === +v); if (f) centerOn(f.x, f.y); };
ACT.goStar = v => { selectStar(+v); const s = ST(+v); centerOn(s.x, s.y); };

function planetLine(pl) {
  const p = player();
  const mp = maxPop(p, pl);
  const bits = [`${SIZE_NAMES[pl.size]} ${PT[pl.type].name}`];
  if (!PT[pl.type].outpostOnly) bits.push(MIN_NAMES[pl.minerals] + ' minerals');
  return bits.join(' · ');
}
function planetFacts(pl) {
  const p = player(); const mp = maxPop(p, pl); const f = baseFert(p, pl);
  const out = [];
  if (PT[pl.type].outpostOnly) out.push('<span class="tag">Outposts only</span>');
  else if (mp > 0) out.push(`<span class="tag">Max pop ${mp}</span>`, `<span class="tag">${SIZE_SLOTS[pl.size]} building slots</span>`, `<span class="tag">Food ${f > 0 ? f : 'none'}/pop</span>`);
  else out.push(`<span class="tag" style="color:#ff8a8a">Uninhabitable for ${esc(R(p).species)}${PT[pl.type].hostile ? ' (needs Hostile Habitats)' : ''}</span>`);
  if (pl.special) out.push(`<span class="tag sp" title="${esc(PSPECIAL[pl.special].desc)}">${PSPECIAL[pl.special].name}: ${PSPECIAL[pl.special].desc}</span>`);
  return out.join('');
}
function playerFleetsAt(sid) { return S.fleets.filter(f => f.owner === 0 && f.star === sid && f.dest == null); }
function planetActions(pl) {
  const p = player(); const acts = [];
  for (const f of playerFleetsAt(pl.star)) {
    const hasCol = f.ships.some(s => s.d === 's_colony'), hasOut = f.ships.some(s => s.d === 's_outpost');
    if ((hasCol || hasOut) && (pl.owner == null || (pl.owner === 0 && pl.col.outpost))) {
      const err = colonizeCheck(p, f, pl);
      const mp = maxPop(p, pl);
      if (!err) {
        if (hasCol && mp > 0) acts.push(`<button class="btn sm primary" data-a="colonize" data-v="${f.id}:${pl.id}:c">Colonize</button>`);
        if (hasOut && pl.owner == null) acts.push(`<button class="btn sm" data-a="colonize" data-v="${f.id}:${pl.id}:o">Build outpost</button>`);
      } else acts.push(`<span class="tiny bad">${esc(err)}</span>`);
      break;
    }
  }
  if (pl.owner != null && pl.owner > 0) for (const f of playerFleetsAt(pl.star)) {
    const err = invadeCheck(p, f, pl);
    if (fleetTroops(f) || armed(p, f)) {
      if (!err) acts.push(`<button class="btn sm danger" data-a="invade" data-v="${f.id}:${pl.id}">${pl.col.outpost ? 'Seize outpost' : `Invade (${fleetTroops(f)} marines vs ~${garrison(pl)})`}</button>`);
      else if (hostile(0, pl.owner)) acts.push(`<span class="tiny warn">${esc(err)}</span>`);
      break;
    }
  }
  return acts.join(' ');
}
ACT.colonize = v => {
  const [fid, pid, k] = v.split(':'); const f = S.fleets.find(x => x.id === +fid); const pl = P(+pid);
  if (colonize(player(), f, pl, k === 'o')) { toast(k === 'o' ? 'Outpost established' : 'Colony founded on ' + planetName(pl)); if (k !== 'o') selectColony(pl.id); else renderSide(); autosave(); }
};
ACT.invade = v => {
  const [fid, pid] = v.split(':'); const f = S.fleets.find(x => x.id === +fid); const pl = P(+pid);
  const r = invade(player(), f, pl); if (!r) return;
  showReport(S.msgs.slice(-1), 'Invasion');
  renderSide();
};

function starPanel(sid) {
  const s = ST(sid), p = player(); const ex = !!p.explored[sid];
  let h = `<div class="hdr"><div><h2>${esc(s.name)}</h2><div class="dim small">${STAR_TYPES[s.type].name} star${ex ? ' · ' + {poor: 'Poor system', normal: 'Average system', rich: 'Rich system'}[s.rich] : ''}</div></div><button class="x" data-a="close">✕</button></div>`;
  if (!ex) { h += `<div class="card dim">Unexplored. Send a scout (or any ship) here, or bring it inside your sensor range.</div>`; }
  else {
    const mon = S.fleets.find(f => f.owner === -1 && f.star === sid);
    if (mon) h += `<div class="card" style="border-color:#6a2a2a"><b class="bad">Danger:</b> a ${esc(designOf(S.monster, mon.ships[0].d).name)} guards this system. Ships arriving here will be attacked.</div>`;
    h += `<div class="sec">Planets</div>`;
    for (const pid of s.planets) {
      const pl = P(pid); const own = pl.owner;
      let status = '';
      if (own === 0 && !pl.col.outpost) status = `<div class="row sb" style="margin-top:6px"><span class="good small">Our colony · pop ${fmt(pl.col.pop)}/${maxPop(p, pl)}</span><button class="btn sm" data-a="colony" data-v="${pl.id}">Manage</button></div>`;
      else if (own === 0) status = `<div class="small good" style="margin-top:4px">Our outpost</div>`;
      else if (own != null) { const o = E(own); status = `<div class="small" style="margin-top:4px;color:${o.color}">${pl.col.outpost ? 'Outpost' : 'Colony'} of the ${esc(o.name)}${pl.col.outpost ? '' : ' · pop ' + Math.floor(pl.col.pop)}${planetDef(pl) ? ' · defended' : ''}</div>`; }
      const acts = planetActions(pl);
      h += `<div class="card ${own === 0 && !pl.col.outpost ? 'click' : ''}" ${own === 0 && !pl.col.outpost ? `data-a="colony" data-v="${pl.id}"` : ''}>
        <div class="row">${planetBall(pl.type, 34, pl.special)}<div style="flex:1;min-width:0"><b>${esc(planetName(pl))}</b>${pl.col && pl.col.capital ? ' <span class="tag sp">Capital</span>' : ''}<div class="dim small">${planetLine(pl)}</div></div></div>
        <div style="margin-top:5px">${planetFacts(pl)}</div>${status}${acts ? `<div class="row wrap" style="margin-top:6px">${acts}</div>` : ''}</div>`;
    }
    if (!s.planets.length) h += `<div class="dim">No planets.</div>`;
  }
  const fl = visibleFleets().filter(f => f.star === sid && f.dest == null);
  if (fl.length) {
    h += `<div class="sec">Fleets in orbit</div>`;
    for (const f of fl) {
      const o = E(f.owner);
      h += `<div class="card ${f.owner === 0 ? 'click' : ''}" ${f.owner === 0 ? `data-a="fleet" data-v="${f.id}"` : ''}><div class="row sb"><span style="color:${o.color}">${f.owner === 0 ? 'Our fleet' : esc(o.name)}</span><span class="dim small">${fleetSummary(f)}</span></div></div>`;
    }
  }
  return h;
}
function fleetSummary(f) {
  const emp = E(f.owner); const cnt = {};
  for (const s of f.ships) { const n = designOf(emp, s.d).name; cnt[n] = (cnt[n] || 0) + 1; }
  return Object.entries(cnt).map(([n, c]) => (c > 1 ? c + '× ' : '') + esc(n)).join(', ');
}

// ---------- Colony ----------
function turnsFor(cost, prog, prod) { if (prod <= 0) return '∞'; return Math.max(1, Math.ceil((cost - prog) / prod)); }
function colonyPanel(pl) {
  const p = player(), c = pl.col;
  if (c.outpost) return starPanel(pl.star);
  const st = colStats(pl);
  const pct = Math.min(100, c.pop / Math.max(1, st.maxPop) * 100);
  let h = `<div class="hdr"><div class="row">${planetBall(pl.type, 40, pl.special)}<div><h2>${esc(planetName(pl))}</h2><div class="dim small">${planetLine(pl)}${c.capital ? ' · <span class="amber">Capital</span>' : ''}</div></div></div><button class="x" data-a="close">✕</button></div>
  <div class="row small"><a class="acc" style="cursor:pointer" data-a="star" data-v="${pl.star}">◂ ${esc(ST(pl.star).name)} system</a></div>
  <div class="sec">Population</div>
  <div class="row sb small"><span><b>${fmt(c.pop)}</b> / ${st.maxPop}</span><span class="${st.growth >= 0 ? 'good' : 'bad'}">${st.growth ? sgn(r1(st.growth)) + ' per turn' : 'At maximum'}</span></div>
  <div class="bar g" style="margin-top:4px"><i style="width:${pct}%"></i></div>
  <div class="sec">Output</div>
  <div class="grid2 small">
    <div>Food <b>${fmt(st.food)}</b> <span class="dim">(eats ${fmt(st.use)})</span></div><div>Production <b>${fmt(st.prod)}</b></div>
    <div>Research <b>${fmt(st.rp)}</b></div><div>Credits <b>${fmt(st.bc)}</b> <span class="dim">upkeep −${st.up}</span></div>
  </div>
  <div class="tiny dim" style="margin-top:4px">Each population makes ${st.fpp} food, ${st.ppp} production, ${fmt(0.5 + (st.e.rpPop || 0))} research and ${fmt(0.4 + (st.e.bcPop || 0))} credits before multipliers.</div>`;
  // buildings
  const slots = slotsOf(pl), used = Object.keys(c.bld).length, queued = c.queue.filter(q => q.kind === 'bld').length;
  h += `<div class="sec">Buildings · ${used + queued}/${slots} slots</div><div>`;
  for (const k of Object.keys(c.bld)) { const b = BUILDINGS[k]; h += `<div class="qitem" title="${esc(effText(b.e))}"><i class="swatch" style="background:${BLD_CAT[b.cat]}"></i><span class="nm">${b.name}<div class="tiny dim">${esc(effText(b.e))}</div></span><span class="tiny dim">−${b.up}</span><button class="x" title="Demolish to free the slot" data-a="demolish" data-v="${pl.id}:${k}">✕</button></div>`; }
  for (let i = 0; i < queued; i++) h += `<div class="qitem faint"><span class="nm">(slot reserved for queued building)</span></div>`;
  for (let i = used + queued; i < slots; i++) h += `<div class="qitem faint"><span class="nm">Empty slot</span></div>`;
  h += `</div>`;
  // production
  h += `<div class="sec">Production</div>`;
  if (c.queue.length) {
    const it = c.queue[0], cost = itemCost(p, pl, it);
    const bc = buyCost(p, pl);
    h += `<div class="card"><div class="row sb"><b>${esc(itemName(p, it))}${it.n > 1 ? ' ×' + it.n : ''}</b><span class="dim small">${turnsFor(cost, c.prog, st.prod)} turns</span></div>
      <div class="bar a" style="margin:5px 0"><i style="width:${Math.min(100, c.prog / cost * 100)}%"></i></div>
      <div class="row sb small"><span class="dim">${Math.floor(c.prog)} / ${cost}</span><button class="btn sm amber" data-a="buy" data-v="${pl.id}" ${p.bc < bc || c.prog >= cost ? 'disabled' : ''} title="Finish next turn">Buy · ${bc} cr</button></div></div>`;
    c.queue.forEach((q, i) => {
      h += `<div class="qitem"><span class="dim tiny">${i + 1}</span><span class="nm">${esc(itemName(p, q))}</span>${q.kind === 'ship' ? `<button class="btn sm" data-a="qn" data-v="${pl.id}:${i}:-1">−</button><b class="small">${q.n || 1}</b><button class="btn sm" data-a="qn" data-v="${pl.id}:${i}:1">+</button>` : ''}${i ? `<button class="x" title="Move up" data-a="qup" data-v="${pl.id}:${i}">▲</button>` : ''}<button class="x" title="Remove" data-a="qdel" data-v="${pl.id}:${i}">✕</button></div>`;
    });
  } else h += `<div class="card small dim">Nothing queued: production becomes credits (Trade Goods, ${Math.floor(st.prod / 2)} credits per turn).</div>`;
  // build menu
  const tab = UI.buildTab;
  h += `<div class="row" style="margin:8px 0 4px;gap:4px"><button class="btn sm ${tab === 'bld' ? 'on' : ''}" data-a="btab" data-v="bld">Buildings</button><button class="btn sm ${tab === 'ship' ? 'on' : ''}" data-a="btab" data-v="ship">Ships</button><button class="btn sm ${tab === 'proj' ? 'on' : ''}" data-a="btab" data-v="proj">Projects</button></div><div>`;
  if (tab === 'bld') {
    const ids = Object.keys(BUILDINGS).filter(id => avail(p, BUILDINGS[id].tech) && !c.bld[id]);
    for (const id of ids) {
      const b = BUILDINGS[id], why = bldReason(p, pl, id), cost = bldCost(p, id);
      h += `<div class="opt" ${why ? `style="opacity:.45;cursor:default" title="${esc(why)}"` : `data-a="qadd" data-v="${pl.id}:bld:${id}"`}><i class="swatch" style="background:${BLD_CAT[b.cat]}"></i><span class="nm">${b.name}<div class="tiny dim">${esc(why || effText(b.e))}</div></span><span class="tiny dim">${cost} · ${turnsFor(cost, 0, st.prod)}t</span></div>`;
    }
  } else if (tab === 'ship') {
    if (!c.bld.shipyard) h += `<div class="small dim" style="padding:6px">This colony needs a Shipyard (Buildings tab) to build ships.</div>`;
    for (const d of p.designs.filter(d => !d.obsolete)) {
      const why = shipReason(p, pl, d), cost = designCost(p, d);
      h += `<div class="opt" ${why ? `style="opacity:.45;cursor:default" title="${esc(why)}"` : `data-a="qadd" data-v="${pl.id}:ship:${d.id}"`}><img src="${shipIcon(d.special || d.hull, p.color, 22)}" width="22" height="22"><span class="nm">${esc(d.name)}<div class="tiny dim">${d.special ? esc(SPECIAL_SHIPS[d.special].desc) : HULLS[d.hull].name + ' · ' + designBrief(p, d)}</div></span><span class="tiny dim">${cost} · ${turnsFor(cost, 0, st.prod)}t</span></div>`;
    }
  } else {
    let any = false;
    for (const id in PROJECTS) { if (!has(p, PROJECTS[id].tech)) continue; any = true; const ok = canProject(p, pl, id); const cost = itemCost(p, pl, {kind: 'proj', id});
      h += `<div class="opt" ${ok ? `data-a="qadd" data-v="${pl.id}:proj:${id}"` : 'style="opacity:.45;cursor:default"'}><span class="nm">${PROJECTS[id].name}<div class="tiny dim">${PROJECTS[id].desc}${id === 'terraform' && TERRAFORM[pl.type] ? ' → ' + PT[TERRAFORM[pl.type]].name : ''}</div></span><span class="tiny dim">${cost} · ${turnsFor(cost, 0, st.prod)}t</span></div>`; }
    if (!any) h += `<div class="small dim" style="padding:6px">No projects researched yet (Terraforming, Gaia Transformation).</div>`;
  }
  h += `</div><div class="sec">Defense</div><div class="small">Marines: <b>${garrison(pl)}</b>${planetDef(pl) ? ` · Defenses: <b>${Math.round(c.defHp)}/${planetDefMax(pl)}</b> hp, ${bldEff(c).defN} guns` : ' · No planetary guns'}</div>`;
  return h;
}
function designBrief(emp, d) { const st = shipStats(emp, d); return `${st.hp} hp, ${st.weapons.map(w => w.n + '× ' + w.name).join(', ') || 'unarmed'}`; }
ACT.btab = v => { UI.buildTab = v; renderSide(); };
ACT.qadd = v => {
  const [pid, kind, id] = v.split(':'); const pl = P(+pid); const c = pl.col;
  if (kind === 'ship') { const last = c.queue[c.queue.length - 1]; if (last && last.kind === 'ship' && last.id === id) last.n = (last.n || 1) + 1; else c.queue.push({kind, id, n: 1}); }
  else c.queue.push({kind, id});
  renderSide();
};
ACT.qdel = v => { const [pid, i] = v.split(':').map(Number); const c = P(pid).col; if (i === 0) c.prog = Math.floor(c.prog * 0.5); c.queue.splice(i, 1); renderSide(); };
ACT.qup = v => { const [pid, i] = v.split(':').map(Number); const q = P(pid).col.queue; [q[i - 1], q[i]] = [q[i], q[i - 1]]; renderSide(); };
ACT.qn = v => { const [pid, i, d] = v.split(':').map(Number); const it = P(pid).col.queue[i]; it.n = Math.max(1, (it.n || 1) + d); renderSide(); };
ACT.buy = v => { const pl = P(+v); if (buyItem(player(), pl)) toast('Bought: completes next turn'); renderSide(); };
ACT.demolish = v => {
  const [pid, id] = v.split(':'); const pl = P(+pid);
  confirmBox('Demolish ' + BUILDINGS[id].name + '?', 'The slot is freed and nothing is refunded.' + (id === 'shipyard' ? ' The Drydock and queued ships here are lost too.' : ''), () => { demolish(player(), pl, id); renderSide(); });
};

// ---------- Fleet ----------
function fleetPanel(f) {
  const emp = E(f.owner); const own = f.owner === 0;
  let h = `<div class="hdr"><div><h2 style="color:${emp.color}">${own ? 'Our fleet' : esc(emp.name)}</h2><div class="dim small">${f.dest != null ? `En route to ${esc(ST(f.dest).name)} · ${eta(f, f.dest)} turn${eta(f, f.dest) > 1 ? 's' : ''}` : f.star != null ? 'In orbit at ' + esc(ST(f.star).name) : 'In deep space'}</div></div><button class="x" data-a="close">✕</button></div>`;
  if (own) {
    const troops = fleetTroops(f);
    let hp = 0, dpr = 0; for (const s of f.ships) { const st = shipStats(emp, designOf(emp, s.d)); hp += s.hp; dpr += st.dpr; }
    h += `<div class="small dim">Speed ${fleetSpeed(f)} parsecs/turn · Fuel range ${emp.range} from your planets${troops ? ' · ' + troops + ' marines' : ''} · Firepower ${fmt(dpr)}/round</div>`;
    h += `<div class="small acc" style="margin-top:6px">Click any star on the map to send this fleet.</div>`;
    if (f.dest != null && f.star != null) h += `<div style="margin-top:6px"><button class="btn sm" data-a="stopFleet" data-v="${f.id}">Cancel move</button></div>`;
  }
  h += `<div class="sec">Ships (${f.ships.length})</div>`;
  const groups = {};
  for (const s of f.ships) (groups[s.d] = groups[s.d] || []).push(s);
  for (const did in groups) {
    const d = designOf(emp, did), st = shipStats(emp, d), list = groups[did];
    const selN = list.filter(s => UI.fleetSel[s.id]).length;
    h += `<div class="card"><div class="row"><img src="${shipIcon(d.fixed ? 'monster' : (d.special || d.hull), emp.color, 26)}" width="26" height="26"><div style="flex:1"><b>${esc(d.name)}</b> <span class="dim">×${list.length}</span><div class="tiny dim">${d.fixed ? 'Monster' : d.special ? esc(SPECIAL_SHIPS[d.special].desc) : HULLS[d.hull].name + ' · ' + designBrief(emp, d)}</div></div>
      ${own && f.ships.length > 1 ? `<div class="row" style="gap:3px"><button class="btn sm" data-a="fsel" data-v="${did}:-1">−</button><span class="small" title="Selected for splitting">${selN}</span><button class="btn sm" data-a="fsel" data-v="${did}:1">+</button></div>` : ''}</div>`;
    const dmg = list.filter(s => s.hp < st.hp);
    if (dmg.length) h += `<div class="tiny warn" style="margin-top:3px">${dmg.length} damaged (repair at a Shipyard)</div>`;
    h += `</div>`;
  }
  if (own) {
    const nSel = Object.values(UI.fleetSel).filter(Boolean).length;
    const others = f.star != null ? S.fleets.filter(x => x.owner === 0 && x.star === f.star && x.dest == null && x !== f) : [];
    h += `<div class="row wrap" style="gap:5px;margin-top:6px">
      <button class="btn sm" data-a="split" data-v="${f.id}" ${nSel && nSel < f.ships.length ? '' : 'disabled'}>Split off selected (${nSel})</button>
      <button class="btn sm" data-a="mergeAll" data-v="${f.id}" ${others.length ? '' : 'disabled'}>Merge fleets here (${others.length})</button>
      <button class="btn sm danger" data-a="scrap" data-v="${f.id}" ${nSel ? '' : 'disabled'}>Scrap selected</button></div>`;
    if (f.star != null && f.dest == null) {
      const acts = ST(f.star).planets.map(P).map(planetActions).filter(Boolean);
      if (acts.length) h += `<div class="sec">Actions here</div>` + acts.map(a => `<div class="row wrap" style="margin-bottom:4px">${a}</div>`).join('');
      h += `<div style="margin-top:8px"><a class="acc small" style="cursor:pointer" data-a="star" data-v="${f.star}">View ${esc(ST(f.star).name)} system ▸</a></div>`;
    }
  }
  return h;
}
ACT.stopFleet = v => { const f = S.fleets.find(x => x.id === +v); if (f && f.star != null) f.dest = null; renderSide(); };
ACT.fsel = v => {
  const [did, d] = v.split(':'); const f = S.fleets.find(x => x.id === UI.viewId); if (!f) return;
  const list = f.ships.filter(s => s.d === did);
  if (+d > 0) { const s = list.find(s => !UI.fleetSel[s.id]); if (s) UI.fleetSel[s.id] = true; }
  else { const s = list.slice().reverse().find(s => UI.fleetSel[s.id]); if (s) delete UI.fleetSel[s.id]; }
  renderSide();
};
ACT.split = v => { const f = S.fleets.find(x => x.id === +v); const ids = f.ships.filter(s => UI.fleetSel[s.id]).map(s => s.id); if (!ids.length || ids.length >= f.ships.length) return; const nf = splitFleet(f, ids); UI.fleetSel = {}; selectFleet(nf.id); toast('New fleet created: click a star to send it'); };
ACT.mergeAll = v => { const f = S.fleets.find(x => x.id === +v); for (const o of S.fleets.filter(x => x.owner === 0 && x.star === f.star && x.dest == null && x !== f)) mergeFleets(f, o); UI.fleetSel = {}; renderSide(); };
ACT.scrap = v => {
  const f = S.fleets.find(x => x.id === +v); const ids = f.ships.filter(s => UI.fleetSel[s.id]).map(s => s.id);
  confirmBox('Scrap ' + ids.length + ' ship' + (ids.length > 1 ? 's' : '') + '?', 'They are destroyed and stop costing upkeep. Nothing is refunded.', () => { f.ships = f.ships.filter(s => !ids.includes(s.id)); cleanupFleets(); UI.fleetSel = {}; if (!S.fleets.includes(f)) closeSide(); else renderSide(); });
};
