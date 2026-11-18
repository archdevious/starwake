'use strict';
// ===================== STARWAKE — MUSIC & SOUND (generated live, no files) =====================
const SND = {ctx: null, master: null, music: null, sfx: null, verb: null, chordTimer: null, bellTimer: null, voices: [], chord: 0, started: false};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// slow progression in D: Dm(add9) · Bbmaj7 · Gm9 · Asus
const CHORDS = [[50, 57, 62, 64, 65], [46, 53, 57, 62, 65], [43, 50, 57, 58, 62], [45, 52, 57, 62, 64]];
const BELL_NOTES = [74, 76, 77, 79, 81, 84, 86];

function audioInit() {
  if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const c = SND.ctx = new AC();
  SND.master = c.createGain(); SND.master.gain.value = 0.9;
  const lim = c.createDynamicsCompressor(); lim.threshold.value = -12; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.25;
  SND.master.connect(lim); lim.connect(c.destination);
  // shared space-echo: two filtered feedback delays
  SND.verb = c.createGain(); SND.verb.gain.value = 1;
  for (const [t, fb] of [[0.37, 0.55], [0.61, 0.5]]) {
    const d = c.createDelay(2), g = c.createGain(), lp = c.createBiquadFilter(), out = c.createGain();
    d.delayTime.value = t; g.gain.value = fb; lp.type = 'lowpass'; lp.frequency.value = 1800; out.gain.value = 0.35;
    SND.verb.connect(d); d.connect(lp); lp.connect(g); g.connect(d); lp.connect(out); out.connect(SND.master);
  }
  SND.music = c.createGain(); SND.music.connect(SND.master); SND.music.connect(SND.verb);
  SND.sfx = c.createGain(); SND.sfx.connect(SND.master); SND.sfx.connect(SND.verb);
  audioVolumes();
  musicStart();
}
function audioVolumes() {
  if (!SND.ctx) return;
  const t = SND.ctx.currentTime;
  SND.music.gain.setTargetAtTime(Math.pow(SETTINGS.music / 100, 1.5) * 2.5, t, 0.3);
  SND.sfx.gain.setTargetAtTime(Math.pow(SETTINGS.sfx / 100, 1.5) * 1.6, t, 0.05);
}
// ---------- music ----------
function padVoice(midi, t0, len, vol) {
  const c = SND.ctx, g = c.createGain(), lp = c.createBiquadFilter(), pan = c.createStereoPanner ? c.createStereoPanner() : null;
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(500 + Math.random() * 300, t0); lp.frequency.linearRampToValueAtTime(900 + Math.random() * 700, t0 + len * 0.5); lp.frequency.linearRampToValueAtTime(450, t0 + len);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + len * 0.35); g.gain.setValueAtTime(vol, t0 + len * 0.6); g.gain.linearRampToValueAtTime(0, t0 + len);
  const oscs = [['sine', 0], ['triangle', 5], ['sine', -6]].map(([type, cents]) => { const o = c.createOscillator(); o.type = type; o.frequency.value = mtof(midi); o.detune.value = cents; o.connect(lp); o.start(t0); o.stop(t0 + len + 0.1); return o; });
  lp.connect(g); if (pan) { pan.pan.value = (Math.random() - 0.5) * 0.8; g.connect(pan); pan.connect(SND.music); } else g.connect(SND.music);
  oscs[0].onended = () => { try { g.disconnect(); lp.disconnect(); if (pan) pan.disconnect(); } catch (e) {} };
}
function playChord() {
  if (!SND.ctx) return;
  const t0 = SND.ctx.currentTime + 0.05, len = 22, ch = CHORDS[SND.chord % CHORDS.length];
  SND.chord += Math.random() < 0.8 ? 1 : 2;
  padVoice(ch[0] - 12, t0, len, 0.10); // low root
  for (const n of ch) padVoice(n, t0 + Math.random() * 1.5, len, 0.045);
  SND.chordTimer = setTimeout(playChord, 15000); // overlaps the previous chord as it fades
}
function bell(midi, t0, vol, dest) {
  const c = SND.ctx, g = c.createGain(), pan = c.createStereoPanner ? c.createStereoPanner() : null;
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.5);
  for (const [mul, v] of [[1, 1], [2.76, 0.25], [5.4, 0.08]]) { const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = mtof(midi) * mul; og.gain.value = v; o.connect(og); og.connect(g); o.start(t0); o.stop(t0 + 3.6); }
  if (pan) { pan.pan.value = (Math.random() - 0.5) * 1.2; g.connect(pan); pan.connect(dest); } else g.connect(dest);
}
function bells() {
  if (!SND.ctx) return;
  const t = SND.ctx.currentTime + 0.05, n = BELL_NOTES[Math.floor(Math.random() * BELL_NOTES.length)];
  bell(n, t, 0.05, SND.music);
  if (Math.random() < 0.35) bell(BELL_NOTES[Math.floor(Math.random() * BELL_NOTES.length)], t + 0.6 + Math.random(), 0.035, SND.music);
  SND.bellTimer = setTimeout(bells, 4000 + Math.random() * 7000);
}
function musicStart() { if (SND.started) return; SND.started = true; playChord(); SND.bellTimer = setTimeout(bells, 3000); }
// ---------- sound effects ----------
function tone(midi, t0, len, vol, type) {
  const c = SND.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.value = mtof(midi);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
  o.connect(g); g.connect(SND.sfx); o.start(t0); o.stop(t0 + len + 0.05);
}
function whoosh(t0) {
  const c = SND.ctx, len = 0.7, buf = c.createBuffer(1, c.sampleRate * len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(300, t0); bp.frequency.exponentialRampToValueAtTime(2400, t0 + len);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.12, t0 + 0.25); g.gain.linearRampToValueAtTime(0, t0 + len);
  src.connect(bp); bp.connect(g); g.connect(SND.sfx); src.start(t0);
}
const SFX = {
  click: t => tone(88, t, 0.06, 0.06, 'triangle'),
  turn: t => whoosh(t),
  arrive: t => { tone(76, t, 0.6, 0.12); tone(83, t + 0.12, 0.9, 0.11); },
  discover: t => { [69, 74, 78, 81].forEach((n, i) => bell(n + 12, t + i * 0.13, 0.1, SND.sfx)); },
  tech: t => { [72, 76, 79, 84].forEach((n, i) => tone(n, t + i * 0.09, 0.7, 0.08, 'triangle')); },
  build: t => { tone(55, t, 0.25, 0.16, 'triangle'); tone(67, t + 0.06, 0.5, 0.07); },
  colony: t => { [62, 66, 69].forEach((n, i) => tone(n, t + i * 0.05, 1.4, 0.07)); tone(74, t + 0.3, 1.6, 0.06); },
  warn: t => { tone(45, t, 0.5, 0.18, 'sawtooth'); tone(44, t + 0.45, 0.6, 0.16, 'sawtooth'); },
  idle: t => { tone(71, t, 0.35, 0.07); tone(67, t + 0.18, 0.5, 0.07); },
  lost: t => { tone(50, t, 1.2, 0.18, 'sawtooth'); tone(41, t + 0.2, 1.4, 0.14, 'triangle'); },
  end: t => { [50, 57, 62, 66, 69, 74].forEach((n, i) => bell(n + 12, t + i * 0.18, 0.08, SND.sfx)); },
};
function sfx(name) { if (!SND.ctx || SETTINGS.sfx <= 0 || !SFX[name]) return; try { SFX[name](SND.ctx.currentTime + 0.02); } catch (e) {} }
// one sound for a whole year's news, the most important kind first
const NEWS_SOUND = [['lost', 'lost'], ['warn', 'warn'], ['survey', 'discover'], ['arrive', 'arrive'], ['tech', 'tech'], ['colony', 'colony'], ['stage', 'colony'], ['ship', 'build'], ['build', 'build'], ['idle', 'idle']];
function newsSound(msgs) {
  for (const [kind, s] of NEWS_SOUND) if (msgs.some(m => m.kind === kind && !(kind === 'survey' && !/life|probes/.test(m.text)))) { sfx(s); return; }
}
// browsers only allow sound after the first click or key press
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => audioInit(), {capture: true}));
