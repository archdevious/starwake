'use strict';
// ===================== STARWAKE — SHIP ICONS (two colours: p = civilisation colour, a = design's secondary) =====================
// Shapes are drawn in a 40×30 box centred on 0,0, pointing right (+x).
const SHIP_ICONS = {
  dart:     {name: 'Dart', s: [['path', 'M16 0 L-10 -8 L-6 0 L-10 8 Z', 'p'], ['path', 'M-10 -8 L-14 -11 L-6 -3 Z M-10 8 L-14 11 L-6 3 Z', 'a'], ['circle', 4, 0, 2, 'a']]},
  needle:   {name: 'Needle', s: [['path', 'M18 0 L-12 -3 L-14 0 L-12 3 Z', 'p'], ['rect', -16, -6, 6, 12, 1.5, 'a'], ['path', 'M18 0 L12 -1.5 L12 1.5 Z', 'a']]},
  disc:     {name: 'Disc', s: [['circle', 0, 0, 13, 'p'], ['ring', 0, 0, 13, 2.5, 'a'], ['circle', 0, 0, 4.5, 'a']]},
  ring:     {name: 'Ring', s: [['ring', 0, 0, 12, 5, 'p'], ['rect', -2, -12, 4, 24, 0, 'p'], ['circle', 0, 0, 4, 'a'], ['circle', 12, 0, 2.5, 'a']]},
  capsule:  {name: 'Capsule', s: [['rect', -15, -7, 30, 14, 7, 'p'], ['rect', -6, -7, 3, 14, 0, 'a'], ['rect', 2, -7, 3, 14, 0, 'a'], ['circle', 11, 0, 2.2, 'a']]},
  hauler:   {name: 'Hauler', s: [['rect', -14, -9, 24, 18, 2, 'p'], ['path', 'M10 -6 L16 0 L10 6 Z', 'p'], ['rect', -11, -6, 6, 5, 0, 'a'], ['rect', -3, -6, 6, 5, 0, 'a'], ['rect', -11, 1, 6, 5, 0, 'a'], ['rect', -3, 1, 6, 5, 0, 'a']]},
  drill:    {name: 'Drill', s: [['rect', -15, -8, 17, 16, 4, 'p'], ['rect', -5, -11, 5, 22, 1.5, 'p'], ['path', 'M2 -7 L18 0 L2 7 Z', 'a'], ['circle', -9, 0, 2.6, 'a']]},
  arrow:    {name: 'Arrowhead', s: [['path', 'M16 0 L-12 -13 L-5 0 L-12 13 Z', 'p'], ['path', 'M8 -3.5 L-8 -9 L-6 -5 Z M8 3.5 L-8 9 L-6 5 Z', 'a']]},
  crescent: {name: 'Crescent', s: [['path', 'M7 -10.95 A13 13 0 1 0 7 10.95 A11 11 0 1 1 7 -10.95 Z', 'p'], ['circle', -9, 0, 2.6, 'a'], ['path', 'M-12 -5 L-17 -7 L-17 7 L-12 5 Z', 'a']]},
  trident:  {name: 'Trident', s: [['path', 'M18 0 L7 -3.5 L-13 -3.5 L-15 0 L-13 3.5 L7 3.5 Z', 'p'], ['rect', -6, -10, 5, 20, 1, 'p'], ['path', 'M13 -10 L8 -12.5 L-11 -12.5 L-11 -7.5 L8 -7.5 Z M13 10 L8 12.5 L-11 12.5 L-11 7.5 L8 7.5 Z', 'p'], ['rect', -15, -12, 4, 4, 0, 'a'], ['rect', -15, 8, 4, 4, 0, 'a'], ['rect', -18, -2, 4, 4, 0, 'a'], ['path', 'M14 -1.5 L10 -1.5 L10 1.5 L14 1.5 Z', 'a']]},
  kite:     {name: 'Kite', s: [['path', 'M18 0 L-1 -11 L-13 0 L-1 11 Z', 'p'], ['path', 'M11 0 L-1 -5 L-6 0 L-1 5 Z', 'a'], ['path', 'M-13 0 L-18 -4 L-18 4 Z', 'a']]},
  hexcore:  {name: 'Hexcore', s: [['path', 'M12 0 L6 -11 L-6 -11 L-12 0 L-6 11 L6 11 Z', 'p'], ['path', 'M6 0 L3 -5.5 L-3 -5.5 L-6 0 L-3 5.5 L3 5.5 Z', 'a'], ['rect', 12, -2, 5, 4, 0, 'a']]},
  rocket:   {name: 'Rocket', s: [['path', 'M-10 -4 L-5 -4 L-12 -10 L-15 -10 Z M-10 4 L-5 4 L-12 10 L-15 10 Z', 'a'], ['path', 'M-12 -4.5 L6 -4.5 C11 -4.5 15 -2.4 18 0 C15 2.4 11 4.5 6 4.5 L-12 4.5 Z', 'p'], ['path', 'M11 -3.7 C13.5 -2.8 16 -1.4 18 0 C16 1.4 13.5 2.8 11 3.7 Z', 'a'], ['circle', 4, 0, 1.9, 'a'], ['path', 'M-12 -2.5 L-17 0 L-12 2.5 Z', 'a']]},
  bastion:  {name: 'Bastion', s: [['path', 'M18 0 L2 -6 L-6 -11 L-13 -11 L-11 -5 L-15 -5 L-15 5 L-11 5 L-13 11 L-6 11 L2 6 Z', 'p'], ['rect', -18, -4, 3, 3, 0, 'a'], ['rect', -18, 1, 3, 3, 0, 'a'], ['rect', -5, -2, 7, 4, 0, 'a'], ['circle', -6, -6, 2, 'a'], ['rect', -6, -6.6, 7, 1.2, 0, 'a'], ['circle', -6, 6, 2, 'a'], ['rect', -6, 5.4, 7, 1.2, 0, 'a'], ['rect', 5, -1, 9, 2, 0, 'a']]},
};
const ICON_ORDER = Object.keys(SHIP_ICONS);
function iconSVG(icon, p, a, w) {
  const I = SHIP_ICONS[icon] || SHIP_ICONS.dart, col = c => c === 'p' ? p : a;
  const parts = I.s.map(e => {
    if (e[0] === 'path') return `<path d="${e[1]}" fill="${col(e[2])}"/>`;
    if (e[0] === 'circle') return `<circle cx="${e[1]}" cy="${e[2]}" r="${e[3]}" fill="${col(e[4])}"/>`;
    if (e[0] === 'ring') return `<circle cx="${e[1]}" cy="${e[2]}" r="${e[3]}" fill="none" stroke="${col(e[5])}" stroke-width="${e[4]}"/>`;
    if (e[0] === 'rect') return `<rect x="${e[1]}" y="${e[2]}" width="${e[3]}" height="${e[4]}" rx="${e[5]}" fill="${col(e[6])}"/>`;
    return '';
  }).join('');
  return `<svg width="${w}" height="${Math.round(w * 0.75)}" viewBox="-20 -15 40 30" style="flex-shrink:0">${parts}</svg>`;
}
const P2D = {};
function iconCanvas(x, icon, p, a, scale) {
  const I = SHIP_ICONS[icon] || SHIP_ICONS.dart, col = c => c === 'p' ? p : a;
  x.save(); x.scale(scale, scale);
  for (const e of I.s) {
    if (e[0] === 'path') { const k = e[1]; const path = P2D[k] || (P2D[k] = new Path2D(k)); x.fillStyle = col(e[2]); x.fill(path); }
    else if (e[0] === 'circle') { x.fillStyle = col(e[4]); x.beginPath(); x.arc(e[1], e[2], e[3], 0, TAU); x.fill(); }
    else if (e[0] === 'ring') { x.strokeStyle = col(e[5]); x.lineWidth = e[4]; x.beginPath(); x.arc(e[1], e[2], e[3], 0, TAU); x.stroke(); }
    else if (e[0] === 'rect') { x.fillStyle = col(e[6]); x.beginPath(); if (e[5] && x.roundRect) x.roundRect(e[1], e[2], e[3], e[4], e[5]); else x.rect(e[1], e[2], e[3], e[4]); x.fill(); }
  }
  x.restore();
}
function designIcon(d, w) { return iconSVG(d.icon || 'dart', S.empire.color, d.acc || '#eef2f8', w); }
// ---------- default looks remembered between games ----------
function loadLooks() { try { return JSON.parse(localStorage.getItem('starwake.looks') || '{}'); } catch (e) { return {}; } }
function saveLook(id, icon, acc) { try { const L = loadLooks(); L[id] = {icon, acc}; localStorage.setItem('starwake.looks', JSON.stringify(L)); } catch (e) {} }
