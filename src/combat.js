'use strict';
// ===================== SPACE COMBAT =====================
function resolveAllCombat() {
  const byStar = {};
  for (const f of S.fleets) if (f.star != null && f.dest == null) (byStar[f.star] = byStar[f.star] || []).push(f);
  for (const sid in byStar) battleAt(+sid, byStar[sid]);
  cleanupFleets();
}
function unitCanShoot(u) { return u.alive && u.weapons.some(w => w.type !== 'missile' || w.ammoLeft > 0); }
function canFight(units) {
  for (const a of units) { if (!unitCanShoot(a)) continue; for (const b of units) if (b.alive && hostile(a.owner, b.owner)) return true; }
  return false;
}
function battleAt(starId, fleets) {
  const star = ST(starId);
  const owners = new Set(fleets.map(f => f.owner));
  for (const pid of star.planets) { const p = P(pid); if (p.owner != null) owners.add(p.owner); }
  if (owners.size < 2) return;
  let anyHostile = false;
  for (const a of owners) for (const b of owners) if (hostile(a, b)) anyHostile = true;
  if (!anyHostile) return;
  const units = []; let uid = 0;
  for (const f of fleets) {
    const emp = E(f.owner);
    for (const s of f.ships) {
      const d = designOf(emp, s.d), st = shipStats(emp, d);
      units.push({uid: uid++, owner: f.owner, kind: 'ship', ref: s, name: d.name, hull: d.fixed ? 'monster' : (d.special || d.hull), hp: s.hp, hp0: s.hp, maxHp: st.hp,
        attack: st.attack, defense: st.defense, shield: st.shield, weapons: st.weapons.map(w => Object.assign({}, w, {ammoLeft: w.ammo})), alive: true, civ: !st.weapons.length});
    }
  }
  for (const pid of star.planets) {
    const p = P(pid); if (p.owner == null) continue;
    const d = planetDef(p); if (!d || p.col.defHp <= 0) continue;
    units.push({uid: uid++, owner: p.owner, kind: 'planet', ref: p, name: planetName(p), hull: 'planet', ptype: p.type, hp: p.col.defHp, hp0: p.col.defHp, maxHp: d.maxHp,
      attack: d.attack, defense: d.defense, shield: d.shield, weapons: d.weapons.map(w => Object.assign({}, w, {ammoLeft: 0})), alive: true, civ: false});
  }
  if (!canFight(units)) return;
  const rounds = [];
  const ecm = {}; for (const o of owners) ecm[o] = o !== -1 && has(E(o), 'ecm_jammer');
  for (let r = 0; r < 12 && canFight(units); r++) {
    const ev = [];
    for (const u of shuffle(units.slice())) {
      if (!u.alive) continue;
      for (const w of u.weapons) {
        if (w.type === 'missile') { if (w.ammoLeft <= 0) continue; w.ammoLeft--; }
        let shots = w.n;
        while (shots > 0) {
          const t = pickTarget(u, units); if (!t) break;
          let hits = 0, dmg = 0, fired = 0;
          while (shots > 0 && t.alive) {
            shots--; fired++;
            let hc = 0.6 + 0.1 * (u.attack - t.defense) + (w.type === 'missile' && !ecm[t.owner] ? 0.1 : 0);
            if (t.kind === 'planet') hc += 0.15;
            hc = clamp(hc, 0.05, 0.95);
            if (rnd() < hc) {
              hits++;
              const sh = w.type === 'missile' ? Math.floor(t.shield / 2) : t.shield;
              const dd = Math.max(0, ri(w.dmg[0], w.dmg[1]) - sh);
              dmg += dd; t.hp -= dd;
              if (t.hp <= 0) { t.hp = 0; t.alive = false; }
            }
          }
          ev.push({a: u.uid, t: t.uid, w: w.name, c: w.color, m: w.type === 'missile', s: fired, h: hits, d: dmg, k: !t.alive});
        }
      }
    }
    rounds.push(ev);
  }
  // write back
  for (const u of units) {
    if (u.kind === 'ship') { u.ref.hp = Math.max(0, Math.round(u.hp)); u.ref.dead = !u.alive; }
    else u.ref.col.defHp = Math.max(0, Math.round(u.hp));
  }
  for (const f of fleets) f.ships = f.ships.filter(s => !s.dead);
  // report
  const lost = {}; const had = {};
  for (const u of units) { if (u.kind !== 'ship') continue; had[u.owner] = (had[u.owner] || 0) + 1; if (!u.alive) lost[u.owner] = (lost[u.owner] || 0) + 1; }
  const involved = [...new Set(units.map(u => u.owner))];
  if (involved.includes(0)) {
    const enemyLost = Object.keys(lost).filter(k => +k !== 0).reduce((a, k) => a + lost[k], 0);
    const foes = involved.filter(o => o !== 0).map(o => E(o).name).join(', ');
    msg(0, 'Battle at ' + star.name + ' vs ' + foes + ': we lost ' + (lost[0] || 0) + ' of ' + (had[0] || 0) + ' ships; enemy lost ' + enemyLost + '.', starId, 'war');
    S.battles.push({star: starId, units: units.map(u => ({uid: u.uid, owner: u.owner, kind: u.kind, name: u.name, hull: u.hull, ptype: u.ptype, maxHp: u.maxHp, hp0: u.hp0, hpEnd: Math.round(u.hp)})), rounds});
  } else {
    for (const o of involved) if (o >= 0 && E(o).ai) E(o).aiData.lastBattle = starId;
  }
}
function pickTarget(u, units) {
  let tot = 0; const c = [];
  for (const t of units) {
    if (!t.alive || !hostile(u.owner, t.owner)) continue;
    const w = t.kind === 'planet' ? 3 : t.civ ? 1 : 2 + (t.hull === 'monster' ? 2 : 0);
    tot += w; c.push([t, w]);
  }
  if (!c.length) return null;
  let r = rnd() * tot; for (const [t, w] of c) { r -= w; if (r <= 0) return t; }
  return c[c.length - 1][0];
}
