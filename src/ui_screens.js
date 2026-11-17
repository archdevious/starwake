'use strict';
// ===================== STARWAKE — MODAL SCREENS =====================
function modal(o) {
  return new Promise(res => {
    const m = $('#modal');
    m.innerHTML = `<div class="mbox" style="max-width:${o.w || 900}px">${o.title ? `<div class="mhead"><h2>${o.title}</h2>${o.noClose ? '' : '<button class="x" data-a="mclose">✕</button>'}</div>` : ''}<div class="mbody">${o.body || ''}</div>${o.foot ? `<div class="mfoot">${o.foot}</div>` : ''}</div>`;
    m.classList.add('show'); m.dataset.kind = o.kind || '';
    UI.modalNoClose = !!o.noClose;
    UI.modalRes = v => { m.classList.remove('show'); m.innerHTML = ''; m.dataset.kind = ''; UI.modalRes = null; res(v); };
    if (o.after) o.after(m);
  });
}
function modalBody(html) { const b = $('#modal .mbody'); if (b) { const st = b.scrollTop; b.innerHTML = html; b.scrollTop = st; } }
function modalOpen(kind) { return $('#modal').classList.contains('show') && (!kind || $('#modal').dataset.kind === kind); }
ACT.mclose = v => { if (UI.modalRes) UI.modalRes(v === undefined ? null : v); };
ACT.mres = v => { if (UI.modalRes) UI.modalRes(v); };
function confirmBox(title, text, yes) {
  modal({title, w: 440, body: `<div>${text}</div>`, foot: `<button class="btn" data-a="mres" data-v="no">Cancel</button><button class="btn danger" data-a="mres" data-v="yes">Confirm</button>`}).then(v => { if (v === 'yes') yes(); });
}
const MSG_ICON = {info: 'ℹ️', tech: '🔬', design: '🛠️', build: '🏗️', ship: '🚀', colony: '🪐', war: '⚔️', diplo: '🤝', warn: '⚠️'};
function showReport(msgs, title) {
  if (!msgs.length) return Promise.resolve();
  const body = msgs.map((m, i) => `<div class="msgi ${m.star != null ? 'click' : ''}" ${m.star != null ? `data-a="repGo" data-v="${m.star}"` : ''}><span class="ic">${MSG_ICON[m.kind] || 'ℹ️'}</span><span>${esc(m.text)}</span></div>`).join('');
  return modal({title: title || 'Turn ' + S.turn + ' report', w: 640, body, foot: `<button class="btn primary" data-a="mclose">Continue</button>`});
}
ACT.repGo = v => { ACT.mclose(); ACT.goStar(v); };

// ---------- Research ----------
function researchHTML() {
  const p = player(), t = empTotals(p);
  const cur = p.res;
  let h = `<div class="row sb" style="margin-bottom:10px"><div>Research: <b class="acc">+${fmt(t.rp)}</b> per turn${p.rpBank ? ` · <span class="dim">${Math.floor(p.rpBank)} stored</span>` : ''}</div>
    <div class="small dim">Each tier offers options: researching one <b>locks the others out for good</b>${R(p).creative ? ' — except for you: Myrrhine learn every option in a tier' : ''}.</div></div>`;
  if (cur) { const loc = TECH_LOC[cur.tech], cost = techCost(loc.f, loc.t); h += `<div class="card"><div class="row sb"><span>Researching <b class="amber">${TECH[cur.tech].name}</b></span><span class="dim small">${Math.floor(cur.prog + p.rpBank)} / ${cost} · ${t.rp > 0 ? Math.max(1, Math.ceil((cost - cur.prog - p.rpBank) / t.rp)) : '∞'} turns</span></div><div class="bar a" style="margin-top:5px"><i style="width:${Math.min(100, (cur.prog + p.rpBank) / cost * 100)}%"></i></div></div>`; }
  FIELDS.forEach((f, fi) => {
    h += `<div class="rfield"><div class="rname" style="border-color:${f.color}"><b>${f.name}</b><span class="tiny dim">Tier ${Math.min(p.tier[fi] + 1, f.tiers.length)} of ${f.tiers.length}</span></div><div class="rtiers">`;
    f.tiers.forEach((tier, ti) => {
      const curT = p.tier[fi] === ti;
      h += `<div class="rtier ${curT ? 'cur' : ''}"><div class="tc"><span>Tier ${ti + 1}</span><span>${techCost(fi, ti)} RP</span></div>`;
      for (const o of tier.opts) {
        const known = has(p, o), res = cur && cur.tech === o;
        let cls = known ? 'known' : res ? 'res' : ti < p.tier[fi] ? 'skip' : curT ? 'avail' : 'lock';
        h += `<div class="tech ${cls}" ${cls === 'avail' ? `data-a="pickTech" data-v="${o}"` : ''} title="${esc(TECH[o].desc)}"><b>${TECH[o].name}</b><div class="d">${esc(TECH[o].desc)}</div></div>`;
      }
      if (tier.bonus) h += `<div class="tiny dim">Also grants: ${tier.bonus.map(b => TECH[b].name).join(', ')}</div>`;
      h += `</div>`;
    });
    h += `</div></div>`;
  });
  return h;
}
ACT.openResearch = () => modal({title: 'Research', w: 1180, kind: 'research', body: researchHTML(), foot: `<button class="btn primary" data-a="mclose">Done</button>`}).then(() => { renderTop(); });
ACT.pickTech = v => { setResearch(player(), v); modalBody(researchHTML()); renderTop(); toast('Researching ' + TECH[v].name); };

// ---------- Ship design ----------
function newEdit(hull) { const p = player(); const d = autoDesign(p, hull || HULL_ORDER.filter(h => avail(p, HULLS[h].tech)).pop()); return {name: d.name, hull: d.hull, armor: d.armor, shield: d.shield, comp: d.comp, weapons: d.weapons.map(w => ({...w})), mods: d.mods.slice()}; }
function designHTML() {
  const p = player(); const d = UI.designEdit; const h = HULLS[d.hull];
  const space = designSpace(d), over = space > h.space;
  const st = shipStats(p, Object.assign({}, d, {_s: null}));
  const list = p.designs.filter(x => x.hull);
  let out = `<div class="dgrid"><div class="dlist"><div class="sec" style="margin-top:0">Your designs</div>`;
  for (const x of list) out += `<div class="opt" data-a="loadDesign" data-v="${x.id}" ${x.obsolete ? 'style="opacity:.5"' : ''}><img src="${shipIcon(x.hull, p.color, 22)}" width="22"><span class="nm">${esc(x.name)}<div class="tiny dim">${HULLS[x.hull].name} · ${designCost(p, x)} cost${x.obsolete ? ' · hidden' : ''}</div></span><button class="x" title="${x.obsolete ? 'Show in build lists' : 'Hide from build lists'}" data-a="obsDesign" data-v="${x.id}">${x.obsolete ? '↺' : '🗑'}</button></div>`;
  out += `<div class="tiny dim" style="margin-top:8px">Saved designs can't be changed (ships already use them). Load one to copy it, edit, and save as a new design.</div></div>`;
  out += `<div><div class="row" style="gap:8px;margin-bottom:8px"><input type="text" id="dname" value="${esc(d.name)}" style="flex:1" maxlength="28"><button class="btn sm" data-a="autoDesign">Auto-fill best</button></div>
    <div class="sec" style="margin-top:0">Hull</div><div class="hullbtns">`;
  for (const k of HULL_ORDER) { const H = HULLS[k]; const ok = avail(p, H.tech); out += `<button class="btn sm ${d.hull === k ? 'on' : ''}" ${ok ? `data-a="setHull" data-v="${k}"` : 'disabled'} title="${H.space} space, ${H.hp} hull hp${H.drydock ? ', needs Drydock' : ''}">${H.name}</button>`; }
  out += `</div><div class="sec">Systems</div>
    <div class="wrow"><span style="width:80px" class="small dim">Armor</span><select data-c="setArmor">${ARMOR.map((a, i) => avail(p, a.tech) ? `<option value="${i}" ${d.armor === i ? 'selected' : ''}>${a.name} (+${Math.round(a.hp * h.armorMult)} hp)</option>` : '').join('')}</select></div>
    <div class="wrow"><span style="width:80px" class="small dim">Shield</span><select data-c="setShield">${SHIELDS.map((a, i) => avail(p, a.tech) ? `<option value="${i}" ${d.shield === i ? 'selected' : ''}>${a.name}${i ? ` (blocks ${a.val}/hit, ${Math.ceil(h.space * 0.12)} space)` : ''}</option>` : '').join('')}</select></div>
    <div class="wrow"><span style="width:80px" class="small dim">Computer</span><select data-c="setComp">${COMPUTERS.map((a, i) => avail(p, a.tech) ? `<option value="${i}" ${d.comp === i ? 'selected' : ''}>${a.name}${i ? ` (+${a.val} attack, ${Math.ceil(h.space * 0.08)} space)` : ''}</option>` : '').join('')}</select></div>
    <div class="sec">Weapons</div>`;
  const kw = knownWeapons(p);
  for (let i = 0; i < 4; i++) {
    const w = d.weapons[i];
    out += `<div class="wrow"><select data-c="setWeapon" data-i="${i}"><option value="">— empty —</option>${kw.map(k => `<option value="${k}" ${w && w.id === k ? 'selected' : ''}>${WEAPONS[k].name} · ${WEAPONS[k].dmg[0] === WEAPONS[k].dmg[1] ? WEAPONS[k].dmg[0] : WEAPONS[k].dmg.join('-')} dmg · range ${WEAPONS[k].range}${WEAPONS[k].ammo ? ' · ' + WEAPONS[k].ammo + ' volleys' : ''} · ${WEAPONS[k].space} space</option>`).join('')}</select>
      ${w ? `<button class="btn sm" data-a="wn" data-v="${i}:-1">−</button><b style="width:24px;text-align:center">${w.n}</b><button class="btn sm" data-a="wn" data-v="${i}:1">+</button>` : ''}</div>`;
  }
  out += `<div class="sec">Modules</div>`;
  for (const k in MODULES) { const M = MODULES[k]; const ok = avail(p, M.tech); out += `<label class="opt" style="${ok ? '' : 'opacity:.4'}"><input type="checkbox" ${ok ? `data-c="setMod" value="${k}"` : 'disabled'} ${d.mods.includes(k) ? 'checked' : ''}><span class="nm">${M.name}<div class="tiny dim">${M.desc} · ${Math.ceil(h.space * M.space)} space${ok ? '' : ' · not researched'}</div></span></label>`; }
  out += `</div><div><div style="text-align:center;margin-bottom:8px"><img src="${shipIcon(d.hull, p.color, 96)}" width="96" height="96"></div>
    <div class="small dim">Space used ${space} / ${h.space}</div><div class="spacebar ${over ? 'over' : ''}" style="margin:4px 0 10px"><i style="width:${Math.min(100, space / h.space * 100)}%"></i></div>
    <table class="statt small"><tr><td>Hit points</td><td><b>${st.hp}</b></td></tr><tr><td>Attack</td><td>${st.attack}</td></tr><tr><td>Defense</td><td>${st.defense}</td></tr><tr><td>Shield</td><td>${st.shield}</td></tr>
    <tr><td>Battle movement</td><td>${st.cspeed} hexes</td></tr><tr><td>Damage per round</td><td>~${fmt(st.dpr)}</td></tr>${st.troops ? `<tr><td>Marines</td><td>${st.troops}</td></tr>` : ''}
    <tr><td>Build cost</td><td><b class="amber">${designCost(p, d)}</b></td></tr><tr><td>Upkeep</td><td>${fmt(designCost(p, d) * 0.02 * (has(p, 'war_college') ? 0.5 : 1))} credits/turn</td></tr>
    ${h.drydock ? `<tr><td colspan="2" class="warn">Needs a Drydock to build</td></tr>` : ''}</table>
    ${over ? `<div class="bad small" style="margin-top:8px">Over capacity by ${space - h.space} space.</div>` : ''}
    <button class="btn primary" style="width:100%;margin-top:12px" data-a="saveDesign" ${over || !d.weapons.some(w => w.n > 0) && !d.mods.includes('troopbay') ? 'disabled' : ''}>Save as new design</button></div></div>`;
  return out;
}
ACT.openDesign = () => { UI.designEdit = newEdit(); return modal({title: 'Ship Design', w: 1100, kind: 'design', body: designHTML(), foot: `<button class="btn" data-a="mclose">Close</button>`}).then(() => { renderSide(); }); };
function rerenderDesign() { const n = $('#dname'); if (n) UI.designEdit.name = n.value; modalBody(designHTML()); }
ACT.setHull = v => { const d = UI.designEdit; d.hull = v; const nd = newEdit(v); Object.assign(d, nd); rerenderDesign(); };
ACT.autoDesign = () => { UI.designEdit = newEdit(UI.designEdit.hull); rerenderDesign(); };
ACT.setArmor = v => { UI.designEdit.armor = +v; rerenderDesign(); };
ACT.setShield = v => { UI.designEdit.shield = +v; rerenderDesign(); };
ACT.setComp = v => { UI.designEdit.comp = +v; rerenderDesign(); };
ACT.setWeapon = (v, el) => { const i = +el.dataset.i; const w = UI.designEdit.weapons; if (!v) w.splice(i, 1); else if (w[i]) w[i].id = v; else w.push({id: v, n: 1}); rerenderDesign(); };
ACT.wn = v => { const [i, d] = v.split(':').map(Number); const w = UI.designEdit.weapons[i]; if (!w) return; w.n = Math.max(0, w.n + d); if (!w.n) UI.designEdit.weapons.splice(i, 1); rerenderDesign(); };
ACT.setMod = (v, el) => { const m = UI.designEdit.mods; if (el.checked) { if (!m.includes(v)) m.push(v); } else m.splice(m.indexOf(v), 1); rerenderDesign(); };
ACT.loadDesign = v => { const x = designOf(player(), v); UI.designEdit = {name: x.name + ' B', hull: x.hull, armor: x.armor, shield: x.shield, comp: x.comp, weapons: x.weapons.map(w => ({...w})), mods: (x.mods || []).slice()}; rerenderDesign(); };
ACT.obsDesign = v => { const x = designOf(player(), v); x.obsolete = !x.obsolete; rerenderDesign(); };
ACT.saveDesign = () => {
  const p = player(); const n = $('#dname'); const d = UI.designEdit; d.name = (n && n.value.trim()) || d.name;
  const nd = {name: d.name, hull: d.hull, armor: d.armor, shield: d.shield, comp: d.comp, weapons: d.weapons.filter(w => w.n > 0).map(w => ({...w})), mods: d.mods.slice()};
  addDesign(p, nd); toast('Design saved: ' + nd.name); UI.designEdit = newEdit(d.hull); UI.designEdit.name = autoDesign(p, d.hull).name; rerenderDesign();
};

// ---------- Planets list ----------
function coloniesHTML() {
  const p = player();
  const cols = colonies(p, true).sort((a, b) => (b.col.capital - a.col.capital) || (b.col.pop - a.col.pop));
  let h = `<table class="list"><tr><th>Planet</th><th>Pop</th><th>Food</th><th>Prod</th><th>Research</th><th>Credits</th><th>Slots</th><th>Building</th></tr>`;
  for (const pl of cols) {
    if (pl.col.outpost) { h += `<tr class="click" data-a="colGo" data-v="${pl.id}"><td>${esc(planetName(pl))} <span class="dim tiny">outpost · ${PT[pl.type].name}</span></td><td colspan="7" class="dim">—</td></tr>`; continue; }
    const s = colStats(pl); const q = pl.col.queue[0];
    h += `<tr class="click" data-a="colGo" data-v="${pl.id}"><td>${pl.col.capital ? '★ ' : ''}${esc(planetName(pl))} <span class="dim tiny">${PT[pl.type].name}</span></td><td>${fmt(pl.col.pop)}/${s.maxPop}</td>
      <td class="${s.food - s.use >= 0 ? 'good' : 'bad'}">${sgn(r1(s.food - s.use))}</td><td>${s.prod}</td><td>${s.rp}</td><td>${s.bc}</td><td>${Object.keys(pl.col.bld).length}/${slotsOf(pl)}</td>
      <td>${q ? esc(itemName(p, q)) + ` <span class="dim tiny">${turnsFor(itemCost(p, pl, q), pl.col.prog, s.prod)}t</span>` : '<span class="dim">Trade Goods</span>'}</td></tr>`;
  }
  return h + '</table>';
}
ACT.openColonies = () => modal({title: 'Planets', w: 1000, body: coloniesHTML(), foot: `<button class="btn primary" data-a="mclose">Close</button>`});
ACT.colGo = v => { ACT.mclose(); const pl = P(+v); selectColony(pl.id); const s = ST(pl.star); centerOn(s.x, s.y); };

// ---------- Empires & diplomacy ----------
function empiresHTML() {
  const p = player(); const myS = empStrength(p);
  const known = S.empires.filter(e => e.id !== 0 && p.rel[e.id].contact);
  let h = `<div class="small dim" style="margin-bottom:10px">Empires you have met. Strength compares fleets, planetary defenses and population.</div><div class="emp">`;
  if (!known.length) h += `<div class="dim">You haven't met any other empire yet. Explore!</div>`;
  for (const e of known) {
    const rel = p.rel[e.id], them = e.rel[0]; const s = empStrength(e);
    const ratio = s / Math.max(1, myS);
    h += `<div class="empcard" style="border-color:${hexA(e.color, 0.5)}"><div class="row"><img src="${emblemURL(e.raceId, e.color, 48)}" width="48" height="48"><div style="flex:1"><h3 style="color:${e.color}">${esc(e.name)}</h3><div class="small dim">${R(e).species}${e.alive ? '' : ' · <span class="bad">destroyed</span>'}</div></div>
      <div style="text-align:right"><div class="${rel.status === 'war' ? 'bad' : 'good'}"><b>${rel.status === 'war' ? 'AT WAR' : 'Peace'}</b></div>${rel.treaty ? '<div class="tiny acc">Trade treaty</div>' : ''}</div></div>
      <div class="small" style="margin-top:8px">Attitude toward you: <b>${attText(them.att)}</b></div>
      <div class="small">Strength: <b>${ratio > 1.5 ? 'Much stronger' : ratio > 1.1 ? 'Stronger' : ratio > 0.9 ? 'About equal' : ratio > 0.6 ? 'Weaker' : 'Much weaker'}</b> <span class="dim">(${Math.round(ratio * 100)}% of yours)</span></div>
      <div class="small dim">Planets known: ${colonies(e, true).filter(pl => p.explored[pl.star]).length}</div>
      ${e.alive ? `<div class="row wrap" style="gap:5px;margin-top:8px">
        ${rel.status === 'war' ? `<button class="btn sm" data-a="dipPeace" data-v="${e.id}">Propose peace</button>` : `<button class="btn sm danger" data-a="dipWar" data-v="${e.id}">Declare war</button>`}
        ${rel.status !== 'war' && !rel.treaty ? `<button class="btn sm" data-a="dipTrade" data-v="${e.id}">Propose trade treaty</button>` : ''}
        ${rel.status !== 'war' ? `<button class="btn sm" data-a="dipDemand" data-v="${e.id}">Demand tribute</button><button class="btn sm" data-a="dipGift" data-v="${e.id}">Gift 50 credits</button>` : ''}</div>` : ''}</div>`;
  }
  return h + '</div>';
}
ACT.openEmpires = () => modal({title: 'Empires', w: 960, kind: 'emp', body: empiresHTML(), foot: `<button class="btn primary" data-a="mclose">Close</button>`});
function dipAsked(e) { const r = player().rel[e.id]; if (r.askedTurn === S.turn) { toast('They will not consider another proposal this turn.'); return true; } r.askedTurn = S.turn; return false; }
ACT.dipWar = v => { const e = E(+v); confirmBox('Declare war on the ' + esc(e.name) + '?', 'Other empires will think less of you' + (player().rel[e.id].treaty ? ', especially since you are breaking a trade treaty' : '') + '.', () => { declareWar(player(), e); toast('War declared'); ACT.openEmpires(); }); };
ACT.dipPeace = v => { const e = E(+v); if (dipAsked(e)) return; if (aiAcceptPeace(e, player())) { makePeace(player(), e); toast('The ' + e.name + ' accept peace.'); } else toast('The ' + e.name + ' refuse peace.'); modalBody(empiresHTML()); };
ACT.dipTrade = v => { const e = E(+v); if (dipAsked(e)) return; if (aiAcceptTrade(e, player())) { signTrade(player(), e); toast('Trade treaty signed.'); } else toast('The ' + e.name + ' decline.'); modalBody(empiresHTML()); };
ACT.dipDemand = v => {
  const e = E(+v); if (dipAsked(e)) return; const amt = tributeAmount(e);
  if (e.bc >= 20 && aiAcceptDemand(e, player())) { const got = payTribute(e, player(), amt); toast('The ' + e.name + ' pay ' + got + ' credits.'); }
  else { e.rel[0].att -= 15; toast('The ' + e.name + ' refuse, and are insulted.'); if (rnd() < 0.25) { declareWar(e, player()); toast('The ' + e.name + ' declare war!'); } }
  modalBody(empiresHTML()); renderTop();
};
ACT.dipGift = v => { const e = E(+v), p = player(); if (p.bc < 50) { toast('Not enough credits'); return; } p.bc -= 50; e.bc += 50; e.rel[0].att += 8; toast('Gift sent. Relations improve.'); modalBody(empiresHTML()); renderTop(); };
async function handlePrompt(pr) {
  const e = E(pr.from); if (!e.alive) return;
  const head = `<div class="row"><img src="${emblemURL(e.raceId, e.color, 56)}" width="56"><div><h3 style="color:${e.color}">${esc(e.name)}</h3><div class="dim small">${R(e).species} · attitude ${attText(e.rel[0].att)}</div></div></div>`;
  if (pr.type === 'trade') {
    const v = await modal({title: 'Trade proposal', w: 520, noClose: true, body: head + `<p>The ${esc(e.name)} propose a trade treaty. Both empires earn extra credits each turn.</p>`, foot: `<button class="btn" data-a="mres" data-v="no">Decline</button><button class="btn primary" data-a="mres" data-v="yes">Accept</button>`});
    if (v === 'yes') signTrade(player(), e); else e.rel[0].att -= 3;
  } else if (pr.type === 'peace') {
    const v = await modal({title: 'Peace offer', w: 520, noClose: true, body: head + `<p>The ${esc(e.name)} offer to end the war.</p>`, foot: `<button class="btn" data-a="mres" data-v="no">Fight on</button><button class="btn primary" data-a="mres" data-v="yes">Make peace</button>`});
    if (v === 'yes') makePeace(player(), e);
  } else if (pr.type === 'demand') {
    if (player().rel[e.id].status === 'war') return;
    const v = await modal({title: 'Demand', w: 520, noClose: true, body: head + `<p>The ${esc(e.name)} demand <b class="amber">${pr.amount} credits</b> in tribute. Refusing will anger them and may mean war.</p><p class="dim small">You have ${Math.floor(player().bc)} credits. Their strength is about ${Math.round(empStrength(e) / Math.max(1, empStrength(player())) * 100)}% of yours.</p>`, foot: `<button class="btn danger" data-a="mres" data-v="no">Refuse</button><button class="btn primary" data-a="mres" data-v="yes">Pay</button>`});
    if (v === 'yes') { payTribute(player(), e, pr.amount); e.rel[0].att += 15; }
    else { e.rel[0].att -= 20; if (rnd() < 0.4) declareWar(e, player()); }
  }
}

// ---------- Saves ----------
function slotKey(s) { return 'starwake.save.' + s; }
function readSlot(s) { try { const raw = localStorage.getItem(slotKey(s)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function saveTo(slot) {
  try {
    const data = JSON.stringify(S, (k, v) => k[0] === '_' ? undefined : v);
    const p = player();
    localStorage.setItem(slotKey(slot), JSON.stringify({format: SAVE_FORMAT, version: GAME_VERSION, saved: Date.now(), turn: S.turn, name: p.name, race: R(p).species, color: p.color, data}));
    return true;
  } catch (e) { console.warn('save failed', e); return false; }
}
function autosave() { if (S && !S.over) saveTo('auto'); }
function migrateSave(d) {
  // future versions upgrade older saves here; every field added later gets a default
  d.version = GAME_VERSION; d.format = SAVE_FORMAT;
  d.hist = d.hist || []; d.prompts = []; d.pendingBattles = []; d.msgs = d.msgs || [];
  return d;
}
function loadFrom(slot) {
  const r = readSlot(slot); if (!r) return false;
  try { S = migrateSave(JSON.parse(r.data)); } catch (e) { toast('That save could not be read.'); return false; }
  startPlaying(false);
  return true;
}
function savesHTML(canSave) {
  let h = `<table class="list"><tr><th>Slot</th><th>Empire</th><th>Turn</th><th>Saved</th><th></th></tr>`;
  for (const s of ['auto', 1, 2, 3, 4, 5]) {
    const r = readSlot(s);
    h += `<tr><td>${s === 'auto' ? 'Autosave' : 'Slot ' + s}</td><td>${r ? `<span class="swatch" style="background:${r.color}"></span> ${esc(r.name)} <span class="dim tiny">${esc(r.race)}</span>` : '<span class="dim">Empty</span>'}</td><td>${r ? r.turn : ''}</td><td class="small dim">${r ? new Date(r.saved).toLocaleString() : ''}</td>
      <td style="text-align:right;white-space:nowrap">${canSave && s !== 'auto' ? `<button class="btn sm" data-a="doSave" data-v="${s}">Save here</button> ` : ''}${r ? `<button class="btn sm primary" data-a="doLoad" data-v="${s}">Load</button> <button class="x" title="Delete" data-a="delSave" data-v="${s}">✕</button>` : ''}</td></tr>`;
  }
  return h + '</table><div class="tiny dim" style="margin-top:8px">The game autosaves every turn. Saves are kept in this browser and carry over to new versions.</div>';
}
ACT.openSaves = v => modal({title: v === 'load' ? 'Load game' : 'Save / Load', w: 760, kind: 'saves', body: savesHTML(v !== 'load'), foot: `<button class="btn" data-a="mclose">Close</button>`});
ACT.doSave = v => { if (saveTo(v)) toast('Saved to slot ' + v); modalBody(savesHTML(true)); };
ACT.doLoad = v => { const inGame = S && !S.over && $('#app').style.display !== 'none'; const go = () => { ACT.mclose(); loadFrom(v === 'auto' ? 'auto' : +v); }; if (inGame) confirmBox('Load this save?', 'Unsaved progress in the current game will be lost (the autosave keeps your latest turn).', go); else go(); };
ACT.delSave = v => confirmBox('Delete this save?', 'This cannot be undone.', () => { try { localStorage.removeItem(slotKey(v)); } catch (e) {} ACT.openSaves(S && $('#app').style.display !== 'none' ? '' : 'load'); });

// ---------- Menu & help ----------
ACT.openMenu = () => modal({title: 'Menu', w: 420, body: `<div style="display:flex;flex-direction:column;gap:8px">
  <button class="btn" data-a="menuGo" data-v="saves">Save / Load</button>
  <button class="btn" data-a="menuGo" data-v="help">How to play</button>
  <button class="btn" data-a="menuGo" data-v="range">${UI.showRange ? 'Hide' : 'Show'} fuel range on map</button>
  <button class="btn" data-a="menuGo" data-v="retire">Retire (end this game and see your score)</button>
  <button class="btn" data-a="menuGo" data-v="title">Exit to main menu</button></div>`});
ACT.menuGo = v => {
  ACT.mclose();
  if (v === 'saves') ACT.openSaves();
  else if (v === 'help') ACT.openHelp();
  else if (v === 'range') UI.showRange = !UI.showRange;
  else if (v === 'retire') confirmBox('Retire from this game?', 'The game ends now and your score goes into the Hall of Fame.', () => { S.over = {result: 'retired', why: 'You retired from the galaxy.', turn: S.turn}; showEnd(); });
  else if (v === 'title') { autosave(); showTitle(); }
};
const HELP = `<div class="small" style="line-height:1.6">
<h3>Goal</h3><p>Conquer every rival empire. (The council vote, the invaders' gateway and the tech wonder arrive in later versions.)</p>
<h3>Colonies</h3><p>Population produces food, production, research and credits on its own. <b>Buildings</b> decide what each world is good at, and each planet only has a few <b>building slots</b> (Tiny 2 … Huge 6, +1 on your capital). Make forge worlds, research worlds, trade worlds and farm worlds. Food is shared across the empire: fertile worlds feed barren ones.</p>
<p><b>Ships are only built at colonies with a Shipyard</b>; Cruisers and bigger also need a Drydock. Shipyards fully repair fleets in orbit.</p>
<h3>Research</h3><p>Each tier of a field offers options. Researching one option locks the others out for good, so your empire specializes.</p>
<h3>Movement</h3><p>Fleets can fly to any star within <b>fuel range</b> of your planets. Outposts on gas giants and asteroid belts extend that range.</p>
<h3>Battles</h3><p>When your ships meet enemies you choose to fight on the hex grid or auto-resolve. In battle each stack of ships moves, then fires every weapon in range at one target. Missiles have long range but only 3 volleys. Battles last up to 30 rounds.</p>
<h3>Invasion</h3><p>Destroy a planet's defenses, then bring Troop Transports (or warships with Troop Bays) and press Invade.</p>
<h3>Keys</h3><p>Enter: end turn · N: next idle fleet · R: research · D: ship design · P: planets · E: empires · Esc: close</p></div>`;
ACT.openHelp = () => modal({title: 'How to play', w: 720, body: HELP, foot: `<button class="btn primary" data-a="mclose">Got it</button>`});

// ---------- End screen ----------
function drawHistoryChart(cv) {
  const dpr = window.devicePixelRatio || 1; const W = cv.clientWidth, H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const hist = S.hist; if (hist.length < 2) return;
  let max = 1; for (const r of hist) for (const k in r.p) max = Math.max(max, r.p[k]);
  const L = 44, B = 26, T = 10, Rr = 10;
  const x = i => L + (W - L - Rr) * i / (hist.length - 1), y = v => H - B - (H - B - T) * v / max;
  c.strokeStyle = '#22314f'; c.fillStyle = '#8695b3'; c.font = '11px Segoe UI, sans-serif'; c.lineWidth = 1;
  for (let k = 0; k <= 4; k++) { const v = max * k / 4; c.beginPath(); c.moveTo(L, y(v)); c.lineTo(W - Rr, y(v)); c.stroke(); c.textAlign = 'right'; c.fillText(Math.round(v), L - 6, y(v) + 4); }
  c.textAlign = 'center';
  const step = Math.max(1, Math.ceil(hist.length / 8));
  for (let i = 0; i < hist.length; i += step) c.fillText('T' + hist[i].t, x(i), H - 8);
  for (const e of S.empires) {
    c.strokeStyle = e.color; c.lineWidth = e.id === 0 ? 3 : 1.8; c.beginPath();
    hist.forEach((r, i) => { const v = r.p[e.id] || 0; i ? c.lineTo(x(i), y(v)) : c.moveTo(x(i), y(v)); }); c.stroke();
  }
}
async function showEnd() {
  UI.busy = true;
  const o = S.over; const sc = finalScore(); const p = player();
  if (!S.recorded) {
    S.recorded = true;
    try {
      const hof = JSON.parse(localStorage.getItem('starwake.hof') || '[]');
      hof.push({date: Date.now(), name: p.name, race: R(p).species, color: p.color, result: o.result, turn: S.turn, score: sc.total, size: GAL[S.size].label, shape: SHAPES[S.shape], rivals: S.empires.length - 1, version: GAME_VERSION});
      localStorage.setItem('starwake.hof', JSON.stringify(hof));
      localStorage.removeItem(slotKey('auto'));
    } catch (e) {}
  }
  const title = o.result === 'victory' ? 'VICTORY' : o.result === 'retired' ? 'Retired' : 'DEFEAT';
  const rows = S.empires.map(e => `<tr><td><span class="swatch" style="background:${e.color}"></span> ${esc(e.name)}${e.id === 0 ? ' <span class="tiny acc">(you)</span>' : ''}</td><td>${e.alive ? 'Alive' : '<span class="bad">Destroyed T' + (e.diedTurn || '?') + '</span>'}</td><td>${colonies(e, true).length}</td><td>${Math.round(empPop(e))}</td><td>${Object.keys(e.techs).length}</td><td>${powerIndex(e)}</td></tr>`).join('');
  await modal({title: `<span class="${o.result === 'victory' ? 'good' : o.result === 'defeat' ? 'bad' : ''}">${title}</span>`, w: 980, noClose: true, kind: 'end',
    body: `<p>${esc(o.why)} <span class="dim">(turn ${S.turn})</span></p>
      <div class="row" style="gap:16px;align-items:stretch;flex-wrap:wrap">
        <div class="card" style="flex:1;min-width:220px"><div class="sec" style="margin-top:0">Final score</div><div style="font-size:38px;font-weight:700" class="amber">${sc.total}</div>
          <div class="small dim">Empire: ${sc.base}<br>Rivals destroyed: ${sc.rivalBonus}<br>Victory bonus: ${sc.bonus}</div></div>
        <div class="card" style="flex:3;min-width:420px"><div class="sec" style="margin-top:0">Strength over time</div><canvas id="histc" style="width:100%;height:240px;display:block"></canvas>
          <div class="row wrap small" style="gap:10px;margin-top:6px">${S.empires.map(e => `<span><span class="swatch" style="background:${e.color}"></span> ${esc(e.name)}</span>`).join('')}</div></div></div>
      <div class="sec">Empires</div><table class="list"><tr><th>Empire</th><th>Status</th><th>Planets</th><th>Population</th><th>Techs</th><th>Strength</th></tr>${rows}</table>`,
    foot: `<button class="btn" data-a="mres" data-v="hof">Hall of Fame</button><button class="btn primary" data-a="mres" data-v="title">Main menu</button>`,
    after: () => setTimeout(() => drawHistoryChart($('#histc')), 30)}).then(v => { if (v === 'hof') { showTitle(); ACT.openHof(); } else showTitle(); });
}
// ---------- Hall of Fame ----------
ACT.openHof = () => {
  let hof = []; try { hof = JSON.parse(localStorage.getItem('starwake.hof') || '[]'); } catch (e) {}
  hof.sort((a, b) => b.score - a.score);
  const body = hof.length ? `<table class="list"><tr><th>#</th><th>Empire</th><th>Result</th><th>Score</th><th>Turns</th><th>Galaxy</th><th>Date</th></tr>${hof.map((g, i) => `<tr><td>${i + 1}</td><td><span class="swatch" style="background:${g.color}"></span> ${esc(g.name)} <span class="dim tiny">${esc(g.race)}</span></td><td class="${g.result === 'victory' ? 'good' : g.result === 'defeat' ? 'bad' : 'dim'}">${{victory: 'Victory', defeat: 'Defeat', retired: 'Retired'}[g.result] || g.result}</td><td><b class="amber">${g.score}</b></td><td>${g.turn}</td><td class="small">${esc(g.size)} ${esc(g.shape)}, ${g.rivals} rival${g.rivals > 1 ? 's' : ''}</td><td class="small dim">${new Date(g.date).toLocaleDateString()}</td></tr>`).join('')}</table>`
    : `<div class="dim" style="padding:20px;text-align:center">No finished games yet. Every game you win, lose or retire from is recorded here.</div>`;
  modal({title: '🏆 Hall of Fame', w: 900, body, foot: `<button class="btn primary" data-a="mclose">Close</button>`});
};

// ---------- Title / new game ----------
const NG = {raceId: 'human', color: EMP_COLORS[0], size: 'medium', shape: 'round', rivals: 3, skill: 'standard', name: ''};
function showTitle() {
  UI.busy = true; $('#app').style.display = 'none'; $('#title').classList.add('show'); renderTitleMenu();
}
function renderTitleMenu() {
  const auto = readSlot('auto');
  $('#tcontent').innerHTML = `<div class="logo">STAR<b>WAKE</b></div><div class="sub">A GALAXY OF EMPIRES</div>
    <div style="max-width:340px;margin:30px auto;display:flex;flex-direction:column;gap:10px">
      ${auto ? `<button class="btn primary" style="padding:12px" data-a="tContinue">Continue <span class="dim small">· ${esc(auto.name)}, turn ${auto.turn}</span></button>` : ''}
      <button class="btn ${auto ? '' : 'primary'}" style="padding:12px" data-a="tNew">New Game</button>
      <button class="btn" style="padding:12px" data-a="openSaves" data-v="load">Load Game</button>
      <button class="btn" style="padding:12px" data-a="openHof">🏆 Hall of Fame</button>
      <button class="btn" style="padding:12px" data-a="openHelp">How to Play</button>
    </div>
    <div style="position:fixed;right:14px;bottom:10px" class="tiny faint">Starwake v${GAME_VERSION}</div>`;
}
ACT.tContinue = () => loadFrom('auto');
ACT.tNew = () => renderNewGame();
function renderNewGame() {
  const g = GAL[NG.size];
  NG.rivals = clamp(NG.rivals, g.min, g.max);
  $('#tcontent').innerHTML = `<div class="logo" style="font-size:30px">STAR<b>WAKE</b></div><div class="sub">NEW GAME</div>
    <div class="sec">Choose your race</div><div class="races">${RACES.map(r => `<div class="race ${NG.raceId === r.id ? 'sel' : ''}" data-a="ngRace" data-v="${r.id}"><div class="row"><img class="racepic" src="${emblemURL(r.id, NG.raceId === r.id ? NG.color : '#5a6a8a', 44)}"><div><h3>${r.name}</h3><div class="sp">${r.species}</div></div></div><p>${r.desc}</p></div>`).join('')}</div>
    <div class="setrow">
      <label>Empire name<input type="text" id="ngname" value="${esc(NG.name || RACE[NG.raceId].name)}" maxlength="30" style="width:220px"></label>
      <label>Color<div class="colors">${EMP_COLORS.map(c => `<i style="background:${c}" class="${NG.color === c ? 'sel' : ''}" data-a="ngColor" data-v="${c}"></i>`).join('')}</div></label>
    </div>
    <div class="setrow">
      <label>Galaxy size<div class="row" style="gap:4px">${Object.keys(GAL).map(k => `<button class="btn sm ${NG.size === k ? 'on' : ''}" data-a="ngSize" data-v="${k}">${GAL[k].label} (${GAL[k].n})</button>`).join('')}</div></label>
      <label>Shape<div class="row" style="gap:4px">${Object.keys(SHAPES).map(k => `<button class="btn sm ${NG.shape === k ? 'on' : ''}" data-a="ngShape" data-v="${k}">${SHAPES[k]}</button>`).join('')}</div></label>
      <label>Rival empires<div class="row" style="gap:4px"><button class="btn sm" data-a="ngRiv" data-v="-1">−</button><b style="width:22px;text-align:center">${NG.rivals}</b><button class="btn sm" data-a="ngRiv" data-v="1">+</button><span class="tiny dim">(${g.min}–${g.max} for this size)</span></div></label>
      <label>AI tactics<div class="row" style="gap:4px">${Object.keys(SKILL).map(k => `<button class="btn sm ${NG.skill === k ? 'on' : ''}" data-a="ngSkill" data-v="${k}">${SKILL[k]}</button>`).join('')}</div></label>
    </div>
    <div class="tiny dim">AI empires never get bonuses or cheats. "AI tactics" only changes how cleverly they research, build and fight.</div>
    <div class="row" style="gap:10px;margin-top:22px"><button class="btn" data-a="tBack">Back</button><button class="btn primary" style="padding:10px 30px;font-size:16px" data-a="tStart">Launch</button></div>
    <div style="position:fixed;right:14px;bottom:10px" class="tiny faint">Starwake v${GAME_VERSION}</div>`;
}
function ngKeepName() { const n = $('#ngname'); if (n) NG.name = n.value; }
ACT.ngRace = v => { ngKeepName(); if (!NG.name || RACES.some(r => r.name === NG.name)) NG.name = RACE[v].name; NG.raceId = v; renderNewGame(); };
ACT.ngColor = v => { ngKeepName(); NG.color = v; renderNewGame(); };
ACT.ngSize = v => { ngKeepName(); NG.size = v; NG.rivals = GAL[v].rivals; renderNewGame(); };
ACT.ngShape = v => { ngKeepName(); NG.shape = v; renderNewGame(); };
ACT.ngRiv = v => { ngKeepName(); NG.rivals += +v; renderNewGame(); };
ACT.ngSkill = v => { ngKeepName(); NG.skill = v; renderNewGame(); };
ACT.tBack = () => renderTitleMenu();
ACT.tStart = () => {
  ngKeepName();
  newGame({raceId: NG.raceId, color: NG.color, size: NG.size, shape: NG.shape, rivals: NG.rivals, skill: NG.skill, empName: (NG.name || '').trim() || RACE[NG.raceId].name});
  startPlaying(true);
};
