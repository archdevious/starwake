'use strict';
// ===================== STARWAKE — GAME FLOW =====================
function refresh() { renderTop(); renderSide(); }
function startPlaying(isNew) {
  $('#title').classList.remove('show'); $('#app').style.display = 'flex';
  UI.selFleet = null; UI.selStar = null; UI.view = null; closeSide();
  BGSTARS = null;
  requestAnimationFrame(() => {
    fitGalaxy();
    const cap = P(player().capital); if (cap) { const s = ST(cap.star); UI.cam.z = Math.max(UI.cam.z, 34); centerOn(s.x, s.y); selectStar(s.id); }
    refresh();
    UI.busy = false;
    if (isNew) { autosave(); showReport(S.msgs, 'Welcome').then(() => { if (!player().res) ACT.openResearch(); }); }
  });
}
async function runEndTurn() {
  if (UI.busy || !S || S.over) return;
  if (modalOpen()) return;
  UI.busy = true; $('#endturn').disabled = true;
  try {
    endTurnStart();
    const battles = S.pendingBattles.slice(); S.pendingBattles = [];
    for (const sid of battles) await handleBattle(sid);
    endTurnFinish();
    refresh();
    for (const pr of S.prompts) await handlePrompt(pr);
    S.prompts = [];
    if (S.over) { autosave(); await showEnd(); return; }
    autosave();
    refresh();
    if (S.msgs.length) await showReport(S.msgs);
    if (!player().res && availableTechs(player()).length) await ACT.openResearch();
  } catch (e) { console.error(e); toast('Error: ' + e.message, 6000); }
  finally { if (!S.over) UI.busy = false; $('#endturn').disabled = false; refresh(); }
}
ACT.endTurn = () => runEndTurn();
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (modalOpen('battle')) { if (e.key === ' ') { e.preventDefault(); ACT.bEnd(); } return; }
  if (e.key === 'Escape') { if (modalOpen() && !UI.modalNoClose) ACT.mclose(); else { UI.selFleet = null; closeSide(); } return; }
  if (modalOpen() || $('#title').classList.contains('show') || !S) return;
  const k = e.key.toLowerCase();
  if (e.key === 'Enter') { e.preventDefault(); runEndTurn(); }
  else if (k === 'n') ACT.nextIdle();
  else if (k === 'r') ACT.openResearch();
  else if (k === 'd') ACT.openDesign();
  else if (k === 'p') ACT.openColonies();
  else if (k === 'e') ACT.openEmpires();
  else if (k === 'h') { const cap = P(player().capital); if (cap) { const s = ST(cap.star); centerOn(s.x, s.y); } }
});
ACT.zoom = v => { UI.cam.z = clamp(UI.cam.z * (+v > 0 ? 1.25 : 0.8), 8, 90); };
ACT.fit = () => fitGalaxy();
// title background
function titleBg() {
  const c = $('#titlebg'); if (!c) return;
  if ($('#title').classList.contains('show')) {
    const dpr = window.devicePixelRatio || 1, W = c.clientWidth, H = c.clientHeight;
    if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    const t = performance.now() / 1000;
    for (const [sx, sy, sr, tw] of bgStars()) {
      const z = (sx + t * 0.02 * (0.3 + sr)) % 1;
      x.fillStyle = `rgba(200,215,255,${0.2 + 0.5 * Math.abs(Math.sin(t * 0.7 + tw * 9))})`; x.fillRect(z * W, sy * H, sr * 1.4, sr * 1.4);
    }
    // a wake of light crossing
    const wx = ((t * 60) % (W + 600)) - 300, wy = H * 0.28;
    const g = x.createLinearGradient(wx - 300, wy, wx, wy); g.addColorStop(0, 'rgba(90,209,255,0)'); g.addColorStop(1, 'rgba(90,209,255,.35)');
    x.strokeStyle = g; x.lineWidth = 2; x.beginPath(); x.moveTo(wx - 300, wy + 30); x.quadraticCurveTo(wx - 120, wy + 5, wx, wy); x.stroke();
    x.fillStyle = '#d8f4ff'; x.beginPath(); x.arc(wx, wy, 2.5, 0, TAU); x.fill();
  }
  requestAnimationFrame(titleBg);
}
window.addEventListener('load', () => {
  initMapInput();
  requestAnimationFrame(mapLoop);
  requestAnimationFrame(titleBg);
  showTitle();
});
