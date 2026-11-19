'use strict';
// ===================== STARWAKE v2 — GAME FLOW =====================
function refresh() { renderTop(); renderSide(); UI.dirty = true; }
function startPlaying(isNew) {
  $('#title').classList.remove('show'); $('#app').style.display = 'flex';
  UI.selFleet = null; UI.selStar = null; UI.view = null; closeSide(); FAR = null;
  requestAnimationFrame(() => {
    UI.cam.yaw = 0.6; UI.cam.pitch = 0.95; UI.cam.zoom = clamp(Math.min(mapSize().w, mapSize().h) / 30, 10, 40); centerOn(0);
    selectStar(0); refresh(); UI.busy = false; showNews();
    if (isNew) { autosave(); ACT.openIntro().then(() => { if (!S.res) ACT.openResearch(); }); }
  });
}
const FF_QUIET = new Set(['spot', 'info']);
async function runEndTurn(skip) {
  if (UI.busy || !S || S.over || modalOpen()) return;
  UI.busy = true; $('#endturn').disabled = true; $('#ffwd').disabled = true; sfx('turn');
  try {
    let n = 0; const allMsgs = [];
    do {
      endTurn(); n++; allMsgs.push(...S.msgs);
      if (!skip) break;
      const loud = S.msgs.some(m => !FF_QUIET.has(m.kind)) || (!S.res && availableTechs().length) || S.over;
      if (loud) break;
    } while (n < 40);
    if (skip) S.msgs = allMsgs;
    autosave();
    refresh(); showNews(); newsSound(S.msgs);
    if (S.over) { await showEnd(); return; }
    if (!S.res && availableTechs().length) await ACT.openResearch();
  } catch (e) { console.error(e); toast('Error: ' + e.message, 6000); }
  finally { if (!S.over) UI.busy = false; $('#endturn').disabled = false; $('#ffwd').disabled = false; refresh(); }
}
ACT.endTurn = () => runEndTurn(false);
ACT.skip = () => runEndTurn(true);
const KEY_DO = {endTurn: () => runEndTurn(false), skip: () => runEndTurn(true), idle: () => ACT.attnGo(), research: () => ACT.openResearch(),
  design: () => ACT.openDesign(), colonies: () => ACT.openColonies(), journal: () => ACT.openJournal(), home: () => centerOn(0),
  near: () => { if (SETTINGS.near > 0) { SETTINGS.nearLast = SETTINGS.near; SETTINGS.near = 0; } else SETTINGS.near = SETTINGS.nearLast || 3; saveSettings(); UI.dirty = true; renderSide(); toast(SETTINGS.near ? 'Nearest-star lines: ' + SETTINGS.near : 'Nearest-star lines off'); },
  diplo: () => ACT.openDiplo()};
document.addEventListener('keydown', e => {
  if (UI.keyCap && !modalOpen('hotkeys')) UI.keyCap = null;
  if (UI.keyCap) { e.preventDefault(); e.stopPropagation(); hotkeyCaptured(e); return; }
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Escape') { if (modalOpen() && !UI.modalNoClose) ACT.mclose(); else { UI.selFleet = null; closeSide(); } return; }
  if (modalOpen() || $('#title').classList.contains('show') || !S) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const act = keyAction(normKey(e.key)); if (!act) return;
  e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  if (!e.repeat || act === 'idle') KEY_DO[act]();
}, true);
// stop Space/Enter from also "clicking" a focused button when they are hotkeys
document.addEventListener('keyup', e => { if (!UI.keyCap && S && !modalOpen() && keyAction(normKey(e.key)) && e.target.tagName === 'BUTTON') e.preventDefault(); }, true);
keyTitles();
function titleBg() {
  const c = $('#titlebg');
  if (c && $('#title').classList.contains('show')) {
    const dpr = window.devicePixelRatio || 1, W = c.clientWidth, H = c.clientHeight;
    if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    const t = performance.now() / 1000;
    if (!titleBg.st) { titleBg.st = []; for (let i = 0; i < 500; i++) titleBg.st.push([Math.random(), Math.random(), Math.random() * 1.2 + 0.2, Math.random()]); }
    for (const [sx, sy, sr, tw] of titleBg.st) { const z = (sx + t * 0.01 * (0.3 + sr)) % 1; x.fillStyle = `rgba(200,215,255,${0.2 + 0.5 * Math.abs(Math.sin(t * 0.7 + tw * 9))})`; x.fillRect(z * W, sy * H, sr * 1.4, sr * 1.4); }
    const wx = ((t * 50) % (W + 600)) - 300, wy = H * 0.28;
    const g = x.createLinearGradient(wx - 300, wy, wx, wy); g.addColorStop(0, 'rgba(90,209,255,0)'); g.addColorStop(1, 'rgba(90,209,255,.35)');
    x.strokeStyle = g; x.lineWidth = 2; x.beginPath(); x.moveTo(wx - 300, wy + 30); x.quadraticCurveTo(wx - 120, wy + 5, wx, wy); x.stroke();
    x.fillStyle = '#d8f4ff'; x.beginPath(); x.arc(wx, wy, 2.5, 0, TAU); x.fill();
  }
  requestAnimationFrame(titleBg);
}
window.addEventListener('load', () => { initMapInput(); requestAnimationFrame(mapLoop); requestAnimationFrame(titleBg); showTitle(); });
