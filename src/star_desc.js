'use strict';
// ===================== STARWAKE — STAR DESCRIPTIONS =====================
// What astronomers knew about each star (facts about the star only; planets stay a mystery until revealed).
const STAR_DESC = {
  'Sun': 'Our own star, a yellow dwarf about 4.6 billion years old.',
  'Alpha Centauri': 'The nearest star system: two Sun-like stars that circle each other every 80 years, with the small red dwarf Proxima Centauri far out around them.',
  "Barnard's Star": 'An old, dim red dwarf that moves across our sky faster than any other star.',
  'Wolf 359': 'One of the faintest and least massive stars known, a young red dwarf that flares often.',
  'Lalande 21185': 'A red dwarf just too faint to see without binoculars, one of the brightest red dwarfs in the northern sky.',
  'Luyten 726-8': 'A pair of tiny red dwarfs. One of them, UV Ceti, gave its name to a whole class of flare stars.',
  'Sirius': 'The brightest star in the night sky, about twice the Sun\'s mass, with a tiny white dwarf companion, Sirius B.',
  'Ross 154': 'A young red dwarf that flares often.',
  'Ross 248': 'A small red dwarf heading our way. In about 36,000 years it will briefly be the closest star to the Sun.',
  'Epsilon Eridani': 'A young orange star, less than a billion years old, and one of the first stars ever searched for alien radio signals, in 1960.',
  'Lacaille 9352': 'A red dwarf in the southern sky, bright enough to see with binoculars.',
  'Ross 128': 'A quiet red dwarf that rarely flares, unlike most of its kind.',
  'EZ Aqr': 'A triple system of three faint red dwarfs.',
  '61 Cygni': 'A pair of orange dwarfs, and the first star after the Sun to have its distance measured, by Friedrich Bessel in 1838.',
  'Procyon': 'One of the brightest stars in the sky, a yellow-white star a little bigger than the Sun, with a white dwarf companion.',
  'Struve 2398': 'A pair of red dwarfs orbiting each other.',
  'Groombridge 34': 'A pair of red dwarfs; the smaller one is a flare star.',
  'Epsilon Indi': 'An orange star with a pair of brown dwarfs, "failed stars", far out in orbit.',
  'Gliese 1111': 'One of the faintest stars nearby, a tiny flare star.',
  'Tau Ceti': 'The closest lone Sun-like star, a little smaller and older than the Sun. One of the first stars ever searched for alien radio signals, in 1960.',
  'YZ Ceti': 'A small red dwarf that flares.',
  "Luyten's Star": 'A red dwarf named after the astronomer Willem Luyten. In 2017, a radio message was beamed toward it from Earth.',
  "Teegarden's Star": 'One of the smallest and dimmest stars nearby, only discovered in 2003.',
  "Kapteyn's Star": 'One of the oldest stars nearby. It orbits the galaxy backwards and probably came from a small galaxy the Milky Way swallowed long ago.',
  'Lacaille 8760': 'The brightest red dwarf in our sky, just at the edge of what the naked eye can see.',
  'Kruger 60': 'A pair of red dwarfs; the smaller one flares.',
  'Ross 614': 'A red dwarf with a tiny companion that was once among the smallest stars known.',
  "Van Maanen's Star": 'The nearest lone white dwarf: the burnt-out core of a star like the Sun, discovered in 1917.',
  'Gliese 1061': 'A faint red dwarf, only recognised as one of the Sun\'s close neighbours in 1997.',
  'Wolf 1061': 'A quiet red dwarf in the constellation Ophiuchus.',
  'Gliese 473': 'A pair of tiny red dwarfs.',
  'Gliese 1': 'A red dwarf in the southern sky.',
  'TZ Arietis': 'A small flare star in the constellation Aries.',
  'Gliese 687': 'A red dwarf far to the north, in the constellation Draco.',
  'Gliese 674': 'A small red dwarf in the southern constellation Ara.',
  'Gliese 876': 'A small red dwarf in the constellation Aquarius.',
  'Gliese 1002': 'A faint, quiet red dwarf that rarely flares.',
  'Gliese 832': 'A red dwarf in the southern constellation Grus.',
  '40 Eridani': 'A triple star: an orange dwarf, a red dwarf and a white dwarf. The white dwarf was one of the first ever found.',
  'Gliese 682': 'A red dwarf in Scorpius, toward the centre of the Milky Way.',
  '70 Ophiuchi': 'A pair of orange stars that orbit each other every 88 years.',
  'Altair': 'One of the brightest stars in the sky. It spins so fast that it bulges at its equator.',
  'Gliese 229': 'A red dwarf with the first brown dwarf ever confirmed. In 2024 that brown dwarf turned out to be a pair of twins.',
  'Sigma Draconis': 'A Sun-like orange star far to the north, in Draco.',
  '36 Ophiuchi': 'A triple system of three orange stars.',
  'Eta Cassiopeiae': 'A Sun-like yellow star with an orange companion, visible to the naked eye.',
  '82 Eridani': 'A Sun-like star, older than the Sun, visible to the naked eye.',
  'Delta Pavonis': 'One of the most Sun-like stars nearby, but older; it is starting to swell into a subgiant.',
  'Gliese 581': 'A dim red dwarf in Libra. In 2008, a radio message was sent toward it from Earth.',
  'Xi Bootis': 'A young pair: a yellow star and an orange star in Boötes.',
  'Gliese 667': 'A triple system in Scorpius: two orange stars and a red dwarf.',
  'Beta Hydri': 'The nearest subgiant: a Sun-like star older than the Sun, starting to swell.',
  'Vega': 'One of the brightest stars in the sky, the North Star about 14,000 years ago. It spins very fast.',
  'Fomalhaut': 'A bright white star in the southern sky, ringed by a wide disc of dust.',
  'Gliese 713': 'Also known as Chi Draconis: a pair of yellow-white stars far to the north.',
  'Gliese 695': 'Also known as Mu Herculis: a Sun-like star starting to swell, with a pair of red dwarf companions.',
  'Chara': 'A star very like the Sun, a favourite target in the search for alien life.',
  '61 Virginis': 'A star very like the Sun, a little older and visible to the naked eye.',
  'Gliese 17': 'Also known as Zeta Tucanae: a Sun-like star in the southern sky, a little brighter than the Sun.',
  'Gliese 222': 'Also known as Chi1 Orionis: a young Sun-like star in Orion.',
  'Gliese 216': 'Also known as Gamma Leporis: a yellow-white star with an orange companion.',
  'Groombridge 1830': 'An ancient star from the galaxy\'s outer halo, racing across our sky.',
  'Gliese 502': 'Also known as Beta Comae Berenices: a Sun-like star, a little bigger and brighter than the Sun.',
  'Gliese 137': 'Also known as Kappa1 Ceti: a young Sun-like star, studied as a picture of the Sun in its youth.',
  'Gliese 827': 'Also known as Gamma Pavonis: a yellow-white star in the southern sky.',
  'Gliese 434': 'Also known as 61 Ursae Majoris: a Sun-like star in the Great Bear.',
  'Gliese 231': 'Also known as Alpha Mensae: a Sun-like star deep in the southern sky.',
  'Gliese 635': 'Also known as Zeta Herculis: a pair of stars, one starting to swell into a subgiant.',
  'Pollux': 'The brightest star in Gemini, an orange giant that has used up the hydrogen in its core.',
  'Alula Australis': 'One of the first double stars to have its orbit worked out, in 1828.',
  'Arcturus': 'The brightest star in the northern sky, an orange giant much older than the Sun.',
  'TRAPPIST-1': 'An ultra-cool red dwarf barely bigger than Jupiter.',
};
const STAR_ALIAS = {'Gliese 506': '61 Virginis', 'Gliese 83.1': 'TZ Arietis'};
const NUMW = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const an = p => (/^[aeiou]/i.test(p) ? 'an ' : 'a ') + p;
const lc = t => t.toLowerCase().replace('sun-', 'Sun-').replace('earth', 'Earth').replace('neptune', 'Neptune');
function starFact(s) {
  const n = s.orig || s.name, t = STAR_DESC[n] || STAR_DESC[STAR_ALIAS[n]];
  if (t) return t;
  const w = lc(starKind(s.sp).word), cnt = s.cnt || s.c || 1;
  const a = an(w); return a[0].toUpperCase() + a.slice(1) + (cnt > 2 ? ' with two companion stars.' : cnt > 1 ? ' with a companion star.' : '.');
}
function worldPhrase(b) {
  let p = lc(TEMPS[b.temp] + ' ' + PCLASS[b.cls].name);
  if (lifeKnown(b) && b.life === 'ecosystem') p += ' with a living ecosystem';
  else if (lifeKnown(b) && b.life === 'microbial') p += ' with microbial life';
  return an(p);
}
function worldsSummary(s) {
  const all = s.bodies.map(B), bs = all.filter(b => !PCLASS[b.cls].belt);
  if (!bs.length) return all.length ? 'No planets, only a belt of dust and rock.' : 'No planets.';
  const rank = b => (lifeKnown(b) ? {ecosystem: 100, microbial: 50}[b.life] || 0 : 0) + ({garden: 40, livable: 30, harsh: 20, hostile: 10}[hab(b)] || 0) + (b.traits.some(t => t === 'rings' || t === 'subocean' || t === 'volcanic') ? 5 : 0) + b.size;
  const best = bs.slice().sort((a, b) => rank(b) - rank(a))[0], n = bs.length;
  return n === 1 ? `One world: ${worldPhrase(best)}.` : `${NUMW[n] || n} worlds, including ${worldPhrase(best)}.`;
}
function starDesc(s) { return starFact(s) + (s.id !== 0 && worldsKnown(s) ? ' ' + worldsSummary(s) : ''); }
