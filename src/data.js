'use strict';
// ===================== STARWAKE v2 — STATIC DATA =====================
const GAME_VERSION = 3;
const SAVE_FORMAT = 2;
const START_YEAR = 2326;
const LENGTHS = {
  standard: {label: 'Standard', turns: 300, radius: 26},
  long:     {label: 'Long',     turns: 500, radius: 35},
};
const COLONY_TEL = 16, SHIP_TEL = 4, DETAIL_RANGE = 1;

// ---------- Planets ----------
const PCLASS = {
  rocky:       {name: 'Rocky world',   solid: true},
  superearth:  {name: 'Super-Earth',   solid: true},
  ocean:       {name: 'Ocean world',   solid: true},
  ice:         {name: 'Ice world',     solid: true},
  molten:      {name: 'Molten world',  solid: true, burning: true},
  minineptune: {name: 'Mini-Neptune',  solid: false},
  gasgiant:    {name: 'Gas giant',     solid: false},
  icegiant:    {name: 'Ice giant',     solid: false},
  belt:        {name: 'Asteroid belt', solid: true, belt: true},
  moon:        {name: 'Moon',          solid: true},
  dwarf:       {name: 'Dwarf planet',  solid: true},
};
const TEMPS = {scorching: 'Scorching', hot: 'Hot', temperate: 'Temperate', cold: 'Cold', frozen: 'Frozen'};
const ATMS = {none: 'No atmosphere', thin: 'Thin atmosphere', thick: 'Thick atmosphere', toxic: 'Toxic atmosphere', breathable: 'Breathable air'};
const LIFE = {none: 'Lifeless', microbial: 'Microbial life', ecosystem: 'Diverse ecosystem'};
const MINERALS = ['Poor', 'Average', 'Rich'];
const MIN_MULT = [0.6, 1, 1.5];
const TRAITS = {
  locked:   {name: 'Tidally locked', desc: 'One side always faces the star'},
  flares:   {name: 'Flare star', desc: 'Its red dwarf sun throws violent flares'},
  rings:    {name: 'Rings', desc: 'A ring system'},
  subocean: {name: 'Subsurface ocean', desc: 'Liquid water under the ice'},
  volcanic: {name: 'Volcanic', desc: 'Active volcanoes'},
  moons:    {name: 'Many moons', desc: 'A large family of moons'},
};
// habitability for humans: label, pop capacity per size (millions), food per stage unit, growth rate
const HAB = {
  garden:  {name: 'Garden world', cap: 400, fert: 2,   grow: 0.045, color: '#5be08a', desc: 'Humans can walk outside'},
  livable: {name: 'Livable',      cap: 60,  fert: 1,   grow: 0.04,  color: '#9fd86a', desc: 'Pressure suits outdoors, open towns under domes'},
  harsh:   {name: 'Harsh',        cap: 10,  fert: 0.5, grow: 0.03,  color: '#ffcf4a', desc: 'Sealed cities, greenhouse farming'},
  hostile: {name: 'Hostile',      cap: 1.5, fert: 0.3, grow: 0.022, color: '#ff9f43', desc: 'Small domed or buried habitats'},
  outpost: {name: 'Outposts only',cap: 0,   fert: 0,   grow: 0,     color: '#8a94aa', desc: 'Robotic mining outposts only'},
  none:    {name: 'Uninhabitable',cap: 0,   fert: 0,   grow: 0,     color: '#ff5d5d', desc: 'Nothing can be built here'},
};
const HAB_ORDER = ['none', 'outpost', 'hostile', 'harsh', 'livable', 'garden'];
// colony stages
const STAGES = {
  outpost:    {name: 'Outpost',    prod: 1,  rp: 0.5, bc: 0.5, food: 0,  eat: 0},
  settlement: {name: 'Settlement', prod: 2,  rp: 1,   bc: 1,   food: 1,  eat: 1},
  city:       {name: 'City',       prod: 6,  rp: 4,   bc: 4,   food: 4,  eat: 4},
  core:       {name: 'Core World', prod: 15, rp: 10,  bc: 10,  food: 10, eat: 10},
  home:       {name: 'Homeworld',  prod: 40, rp: 25,  bc: 30,  food: 30, eat: 40},
};
const STAGE_ORDER = ['outpost', 'settlement', 'city', 'core', 'home'];
const FOCUS = {
  balanced: {name: 'Balanced', desc: 'No specialty'},
  industry: {name: 'Industry', desc: '+75% production, -20% research and credits'},
  science:  {name: 'Science',  desc: '+75% research, -20% production and credits'},
  trade:    {name: 'Trade',    desc: '+75% credits, -20% production and research'},
  farming:  {name: 'Farming',  desc: 'Double food, -20% production, research and credits'},
};
const PROJECTS = {
  shipyard:    {name: 'Orbital Shipyard',     cost: 150, stage: 'settlement', desc: 'This colony can build ships.'},
  mines:       {name: 'Deep Mines',           cost: 180, stage: 'settlement', desc: '+50% production here.'},
  campus:      {name: 'Research Campus',      cost: 180, stage: 'settlement', desc: '+50% research here.'},
  tradeport:   {name: 'Trade Port',           cost: 180, stage: 'settlement', desc: '+50% credits here.'},
  agridomes:   {name: 'Agri-Domes',           cost: 120, stage: 'settlement', desc: '+3 food, plus 3 more for each stage above Settlement.'},
  habitat:     {name: 'Habitat Expansion',    cost: 250, stage: 'settlement', desc: '+50% population capacity here.'},
  elevator:    {name: 'Space Elevator',       cost: 400, stage: 'city', tech: 'space_elevator', desc: 'Ships built here cost 25% less.'},
  greatscope:  {name: 'The Great Telescope',  cost: 0, stage: 'settlement', unique: true, desc: 'Unique. Earth\'s telescope sees 24 light-years away, and knows worlds within 8.6 light-years of Earth and any signs of life on them.'},
  observatory: {name: 'Deep Sky Observatory', cost: 300, stage: 'settlement', tech: 'deep_sky', desc: 'Telescopes here see 24 light-years instead of 16.'},
  terraform:   {name: 'Terraforming',         cost: 600, stage: 'settlement', tech: 'terraforming', repeat: true, desc: 'Improves habitability one step (Hostile → Harsh → Livable → Garden). Destroys any native ecosystem.'},
};

// ---------- Ships ----------
const HULLS = {
  light:  {name: 'Light hull',  mass: 1, cost: 20,  slots: 2},
  medium: {name: 'Medium hull', mass: 3, cost: 50,  slots: 3},
  heavy:  {name: 'Heavy hull',  mass: 6, cost: 110, slots: 5},
};
const MODULES = {
  tel_m:   {name: 'Medium Telescope', mass: 1, cost: 25,  desc: 'Telescope range 8 light-years (instead of 4).'},
  tel_l:   {name: 'Large Telescope',  mass: 3, cost: 90,  desc: 'Telescope range 16 light-years.'},
  lab:     {name: 'Science Lab',      mass: 1, cost: 40,  desc: 'Surveys systems and investigates anomalies.'},
  colony:  {name: 'Colony Pod',       mass: 4, cost: 120, desc: 'Carries 20,000 settlers to found or grow a colony (twice as many with Hibernation).'},
  outpost: {name: 'Outpost Kit',      mass: 2, cost: 50,  desc: 'Builds a robotic mining outpost on any world, even gas giants.'},
  cargo:   {name: 'Cargo Bay',        mass: 2, cost: 40,  desc: 'Carries 4 food or 2,000 settlers per trip on a trade route.'},
};
const DEFAULT_DESIGNS = [
  {id: 'scout',    name: 'Scout',          hull: 'light',  mods: ['tel_m']},
  {id: 'science',  name: 'Science Vessel', hull: 'light',  mods: ['lab', 'tel_m']},
  {id: 'colony',   name: 'Colony Ship',    hull: 'medium', mods: ['colony']},
  {id: 'outposter',name: 'Outpost Ship',   hull: 'light',  mods: ['outpost']},
  {id: 'freighter',name: 'Freighter',      hull: 'medium', mods: ['cargo', 'cargo']},
];
const DRIVE_SPEEDS = [0.30, 0.40, 0.55, 0.70, 0.85, 0.95, 0.9999];
const DRIVE_TECH = [null, 'fusion_torch', 'antimatter_catalysis', 'laser_sails', 'antimatter_drive', 'relativistic', 'near_light'];

// ---------- Research ----------
const FIELDS = {prop: {name: 'Propulsion', color: '#5ac8ff'}, sens: {name: 'Sensors', color: '#d07aff'}, bio: {name: 'Biology', color: '#6ae07a'},
  eng: {name: 'Engineering', color: '#e8a84a'}, phys: {name: 'Physics', color: '#ff7a7a'}, soc: {name: 'Society', color: '#ffd860'}};
const TECHS = [
  {id: 'fusion_torch', f: 'prop', cost: 200, req: [], name: 'Fusion Torch Drive', desc: 'Top speed 40% of light speed.'},
  {id: 'antimatter_catalysis', f: 'prop', cost: 550, req: ['fusion_torch'], name: 'Antimatter-Catalysed Fusion', desc: 'Top speed 55% of light speed.'},
  {id: 'laser_sails', f: 'prop', cost: 1100, req: ['antimatter_catalysis', 'orbital_construction'], name: 'Laser Sail Network', desc: 'Top speed 70% of light speed.'},
  {id: 'antimatter_drive', f: 'prop', cost: 2000, req: ['laser_sails', 'antimatter_production'], name: 'Antimatter Drive', desc: 'Top speed 85% of light speed.'},
  {id: 'relativistic', f: 'prop', cost: 3400, req: ['antimatter_drive'], name: 'Relativistic Flight', desc: 'Top speed 95% of light speed.'},
  {id: 'near_light', f: 'prop', cost: 5600, req: ['relativistic', 'exotic_matter'], name: 'Near-Light Drive', desc: 'Top speed 99.99% of light speed.'},
  {id: 'survey_drones', f: 'sens', cost: 250, req: [], name: 'Survey Drones', desc: 'System surveys take 1 year instead of 3.'},
  {id: 'biosignatures', f: 'sens', cost: 650, req: ['survey_drones'], name: 'Biosignature Spectroscopy', desc: 'Your telescopes show whether a known system holds life, without visiting it.'},
  {id: 'deep_sky', f: 'sens', cost: 950, req: ['biosignatures'], name: 'Deep Sky Surveys', desc: 'Unlocks the Deep Sky Observatory project (a colony\'s telescopes reach 24 light-years).'},
  {id: 'interferometry', f: 'sens', cost: 1700, req: ['deep_sky'], name: 'Interferometry', desc: 'Every ship and colony telescope reaches 50% farther.'},
  {id: 'closed_ecology', f: 'bio', cost: 250, req: [], name: 'Closed Ecology', desc: 'Harsh and Hostile colonies make 50% more food.'},
  {id: 'hibernation', f: 'bio', cost: 500, req: [], name: 'Hibernation', desc: 'Colony Pods carry 40,000 settlers instead of 20,000.'},
  {id: 'gene_adaptation', f: 'bio', cost: 950, req: ['closed_ecology'], name: 'Genetic Adaptation', desc: 'Harsh worlds hold 50% more people and grow 50% faster.'},
  {id: 'xenobiochem', f: 'bio', cost: 1500, req: ['gene_adaptation'], name: 'Xenobiochemistry', desc: 'Worlds whose native life is toxic to humans become fully livable, without destroying the ecosystem.'},
  {id: 'terraforming', f: 'bio', cost: 2300, req: ['gene_adaptation', 'space_elevator'], name: 'Terraforming', desc: 'Unlocks the Terraforming project.'},
  {id: 'longevity', f: 'bio', cost: 3000, req: ['gene_adaptation'], name: 'Longevity Treatments', desc: 'Population grows 25% faster everywhere.'},
  {id: 'orbital_construction', f: 'eng', cost: 300, req: [], name: 'Orbital Construction', desc: 'Ships cost 15% less.'},
  {id: 'autofactories', f: 'eng', cost: 650, req: [], name: 'Autofactories', desc: '+20% production everywhere.'},
  {id: 'space_elevator', f: 'eng', cost: 1100, req: ['orbital_construction'], name: 'Space Elevators', desc: 'Unlocks the Space Elevator project (ships built there cost 25% less).'},
  {id: 'arcologies', f: 'eng', cost: 1600, req: ['autofactories'], name: 'Arcologies', desc: '+25% population capacity everywhere.'},
  {id: 'megastructures', f: 'eng', cost: 3600, req: ['space_elevator', 'arcologies'], name: 'Megastructures', desc: 'Colony projects cost 25% less.'},
  {id: 'quantum_computing', f: 'phys', cost: 400, req: [], name: 'Quantum Computing', desc: '+15% research everywhere.'},
  {id: 'antimatter_production', f: 'phys', cost: 1300, req: ['quantum_computing'], name: 'Antimatter Production', desc: '+10% production everywhere; needed for antimatter drives.'},
  {id: 'exotic_matter', f: 'phys', cost: 3200, req: ['antimatter_production'], name: 'Exotic Matter', desc: 'The physics needed for near-light flight, and perhaps one day more.'},
  {id: 'interstellar_commerce', f: 'soc', cost: 300, req: [], name: 'Interstellar Commerce', desc: '+20% credits; Cargo Bays carry twice as much.'},
  {id: 'colonial_charter', f: 'soc', cost: 550, req: [], name: 'Colonial Charters', desc: 'Settlements grow 50% faster.'},
  {id: 'unified_science', f: 'soc', cost: 1300, req: ['quantum_computing'], name: 'Unified Science Academy', desc: '+20% research everywhere.'},
  {id: 'xenology', f: 'soc', cost: 1800, req: ['biosignatures'], name: 'Xenology', desc: 'Anomalies give 50% more research.'},
];
const TECH = {}; TECHS.forEach(t => TECH[t.id] = t);
// breakthroughs: only found by exploring
const BREAKTHROUGHS = {
  bt_alloys:   {name: 'Precursor Alloys',          desc: 'Lighter hulls: every ship flies 10% closer to your top speed.'},
  bt_genome:   {name: 'Alien Genome Library',      desc: 'Colonies on worlds with native life grow 25% faster.'},
  bt_lensing:  {name: 'Stellar Lensing',           desc: 'Every telescope reaches 4 light-years farther.'},
  bt_exotic:   {name: 'Exotic Matter Sample',      desc: 'Exotic Matter research costs half as much.'},
  bt_seeds:    {name: 'Cryo-Seed Vault',           desc: 'Agri-Domes produce twice as much food.'},
  bt_signal:   {name: 'Mathematics of the Signal', desc: '+15% research everywhere.'},
  bt_machines: {name: 'Guardian Machine Logic',    desc: 'Your ships sense guardian machines from 4 light-years away and stop before entering their systems.'},
  bt_fusion:   {name: 'Stellar Fusion Insight',    desc: '+15% production everywhere.'},
};
for (const k in BREAKTHROUGHS) TECH[k] = Object.assign({id: k, f: 'bt', cost: 0, req: [], breakthrough: true}, BREAKTHROUGHS[k]);

// ---------- Backstory (2026–2326) ----------
const ERAS = [
  {years: '2026–2101', name: 'A New Order', q: 'How did humanity organise itself?', opts: [
    {id: 'united', name: 'United Earth', text: 'The nations joined under a single world government that set policy for the whole planet.', why: 'The united government organised emigration on a planetary scale, through incentives and quotas.', fx: ['Colony Ships carry 50% more settlers']},
    {id: 'blocs', name: 'Rival Blocs', text: 'A few large blocs of nations competed for resources, influence and a foothold in space.', why: 'The race between them kept every bloc\'s factories running at full stretch.', fx: ['+15% production']},
    {id: 'corporate', name: 'The Corporate Age', text: 'Corporations took over much of what governments once did, from power grids to spaceports.', why: 'Private investment and global markets built up deep reserves of wealth for the journey ahead.', fx: ['+25% credits', '+300 starting credits']},
  ]},
  {years: '2101–2176', name: 'Leaving the Cradle', q: 'How did we spread through the Solar System?', opts: [
    {id: 'moonmars', name: 'The Moon and Mars', text: 'Mining bases on the Moon and domed settlements on Mars became humanity\'s first homes beyond Earth.', why: 'Both grew from research outposts into permanent settlements.', fx: ['Start with Settlements on the Moon and Mars', 'Mars can grow to 20 million people; the Moon stays small']},
    {id: 'belt', name: 'The Belt Rush', text: 'Prospectors swarmed the asteroid belt and pushed on to the moons of Saturn.', why: 'Mining crews followed the ice and metal outward as far as Titan.', fx: ['Start with Settlements on Ceres and Titan, plus a mining outpost in the belt', 'All three stay small, but the outpost adds production from the start']},
    {id: 'venus', name: 'Cloud Cities of Venus', text: 'Floating cities were built in Venus\' upper air, where pressure and temperature are close to Earth\'s.', why: 'The first cloud cities were small, but the upper air of Venus has room for far more.', fx: ['Start with a Settlement floating above Venus', 'It can grow to 40 million people, the most of any starting choice']},
  ]},
  {years: '2176–2251', name: 'The Long Stride', q: 'Where did humanity put its effort?', opts: [
    {id: 'medicine', name: 'Medicine', text: 'Research focused on longer, healthier lives and on self-sufficient habitats.', why: 'Life-support research made sealed farms far more productive.', fx: ['Free tech, Closed Ecology: Harsh and Hostile colonies make 50% more food']},
    {id: 'outer', name: 'The Outer Planets', text: 'Shipyards around Jupiter built the first truly large spacecraft.', why: 'Building in orbit, free of Earth\'s gravity, made every hull cheaper.', fx: ['Free tech, Orbital Construction: ships cost 15% less']},
    {id: 'transcend', name: 'Transcendence', text: 'Genetic and cybernetic enhancement changed what it means to be human.', why: 'Adapted people settled worlds too harsh for unaltered humans.', fx: ['Free tech, Genetic Adaptation: Harsh worlds hold 50% more people and grow 50% faster']},
  ]},
  {years: '2251–2326', name: 'First Light', q: 'What was our first step toward the stars?', opts: [
    {id: 'ark', name: 'The Ark Program', text: 'A great colony ship was completed in orbit.', why: 'It was built before anyone chose where it would go.', fx: ['Start with 1 extra Colony Ship']},
    {id: 'telescope', name: 'The Great Telescope', text: 'A telescope array mapped the nearby stars and the worlds around them.', why: 'Its main mirror was placed in orbit around Earth and is still in service.', fx: ['A unique building on Earth. Its telescope sees 24 light-years away, and knows worlds within 8.6 light-years of Earth and any signs of life on them']},
    {id: 'probes', name: 'The Pathfinder Probes', text: 'Small, fast probes were built and launched toward the two nearest stars in the early 2300s.', why: 'After a couple of decades in transit, both have now arrived at Alpha Centauri and Barnard\'s Star, and the science vessel built to follow up on their findings is ready at Earth.', fx: ['Start with 2 Pathfinder Probes at Alpha Centauri and Barnard\'s Star, plus a free Science Vessel at Earth']},
  ]},
];

// ---------- The Solar System ----------
const SOL_BODIES = [
  {name: 'Mercury', cls: 'rocky', size: 1, temp: 'scorching', atm: 'none', min: 2, traits: []},
  {name: 'Venus', cls: 'rocky', size: 3, temp: 'scorching', atm: 'toxic', min: 1, traits: ['volcanic']},
  {name: 'Earth', cls: 'rocky', size: 3, temp: 'temperate', atm: 'breathable', life: 'ecosystem', min: 1, traits: []},
  {name: 'Moon', cls: 'moon', size: 1, temp: 'cold', atm: 'none', min: 1, traits: ['locked'], of: 'Earth'},
  {name: 'Mars', cls: 'rocky', size: 2, temp: 'cold', atm: 'thin', min: 1, traits: []},
  {name: 'Ceres', cls: 'dwarf', size: 1, temp: 'frozen', atm: 'none', min: 1, traits: ['subocean']},
  {name: 'Asteroid belt', cls: 'belt', size: 1, temp: 'cold', atm: 'none', min: 2, traits: []},
  {name: 'Jupiter', cls: 'gasgiant', size: 5, temp: 'frozen', atm: 'thick', min: 1, traits: ['moons']},
  {name: 'Europa', cls: 'moon', size: 1, temp: 'frozen', atm: 'none', life: 'microbial', min: 0, traits: ['subocean'], of: 'Jupiter'},
  {name: 'Ganymede', cls: 'moon', size: 1, temp: 'frozen', atm: 'none', min: 1, traits: ['subocean'], of: 'Jupiter'},
  {name: 'Saturn', cls: 'gasgiant', size: 5, temp: 'frozen', atm: 'thick', min: 1, traits: ['rings', 'moons']},
  {name: 'Titan', cls: 'moon', size: 2, temp: 'frozen', atm: 'thick', min: 1, traits: [], of: 'Saturn'},
  {name: 'Enceladus', cls: 'moon', size: 1, temp: 'frozen', atm: 'none', min: 0, traits: ['subocean'], of: 'Saturn'},
  {name: 'Uranus', cls: 'icegiant', size: 4, temp: 'frozen', atm: 'thick', min: 1, traits: ['rings']},
  {name: 'Neptune', cls: 'icegiant', size: 4, temp: 'frozen', atm: 'thick', min: 1, traits: []},
  {name: 'Triton', cls: 'moon', size: 1, temp: 'frozen', atm: 'thin', min: 1, traits: [], of: 'Neptune'},
];
// Known exoplanets (from published discoveries; uncertain details are filled in by the game)
const KNOWN_PLANETS = {
  'Alpha Centauri': [['Proxima b', 'rocky', 2, 'temperate', ['locked', 'flares']], ['Proxima d', 'rocky', 1, 'hot', ['flares']]],
  "Barnard's Star": [['b', 'rocky', 1, 'hot'], ['c', 'rocky', 1, 'hot'], ['d', 'rocky', 1, 'hot'], ['e', 'rocky', 1, 'hot']],
  'Lalande 21185': [['b', 'superearth', 3, 'hot'], ['c', 'minineptune', 4, 'cold']],
  'Epsilon Eridani': [['b', 'gasgiant', 5, 'cold'], ['Inner belt', 'belt', 1, 'cold'], ['Outer belt', 'belt', 1, 'frozen']],
  'Ross 128': [['b', 'superearth', 2, 'temperate', ['locked']]],
  "Luyten's Star": [['b', 'superearth', 3, 'temperate', ['locked']], ['c', 'superearth', 3, 'hot']],
  'Tau Ceti': [['g', 'superearth', 2, 'scorching'], ['h', 'superearth', 2, 'hot'], ['e', 'superearth', 3, 'hot'], ['f', 'superearth', 3, 'cold'], ['Debris belt', 'belt', 1, 'frozen']],
  'Wolf 1061': [['b', 'rocky', 1, 'scorching'], ['c', 'superearth', 3, 'temperate', ['locked']], ['d', 'superearth', 4, 'frozen']],
  'Gliese 876': [['d', 'superearth', 3, 'scorching'], ['c', 'gasgiant', 5, 'temperate'], ['b', 'gasgiant', 5, 'temperate'], ['e', 'icegiant', 4, 'cold']],
  'Gliese 581': [['e', 'rocky', 1, 'scorching'], ['b', 'minineptune', 4, 'hot'], ['c', 'superearth', 3, 'hot']],
  'Gliese 667': [['b', 'superearth', 3, 'scorching'], ['c', 'superearth', 3, 'temperate', ['locked']], ['d', 'superearth', 3, 'cold']],
  "Teegarden's Star": [['b', 'rocky', 2, 'temperate', ['locked']], ['c', 'rocky', 2, 'cold'], ['d', 'rocky', 2, 'frozen']],
  'Gliese 1061': [['b', 'rocky', 2, 'hot'], ['c', 'superearth', 2, 'temperate', ['locked']], ['d', 'superearth', 2, 'temperate', ['locked']]],
  'Gliese 1002': [['b', 'rocky', 2, 'temperate', ['locked']], ['c', 'rocky', 2, 'temperate', ['locked']]],
  'YZ Ceti': [['b', 'rocky', 1, 'scorching'], ['c', 'rocky', 1, 'hot'], ['d', 'rocky', 1, 'hot']],
  'Lacaille 9352': [['b', 'superearth', 3, 'hot'], ['c', 'superearth', 3, 'hot'], ['d', 'superearth', 3, 'temperate']],
  'Gliese 687': [['b', 'minineptune', 4, 'cold']],
  'Gliese 682': [['b', 'superearth', 3, 'temperate'], ['c', 'superearth', 3, 'hot']],
  'Epsilon Indi': [['Ab', 'gasgiant', 5, 'frozen']],
  'Groombridge 34': [['Ab', 'superearth', 2, 'hot'], ['Ac', 'minineptune', 4, 'cold']],
  'Gliese 832': [['b', 'gasgiant', 5, 'frozen']],
  'Gliese 229': [['Ac', 'minineptune', 4, 'hot']],
  '82 Eridani': [['b', 'superearth', 2, 'scorching'], ['c', 'superearth', 2, 'scorching'], ['d', 'superearth', 3, 'hot']],
  'Fomalhaut': [['Dust belt', 'belt', 1, 'frozen']],
  'Vega': [['Debris disc', 'belt', 1, 'frozen']],
  'Pollux': [['b', 'gasgiant', 5, 'hot']],
  'TRAPPIST-1': [['b', 'rocky', 1, 'scorching', ['locked']], ['c', 'rocky', 1, 'hot', ['locked']], ['d', 'rocky', 1, 'temperate', ['locked']], ['e', 'rocky', 1, 'temperate', ['locked']], ['f', 'rocky', 1, 'temperate', ['locked']], ['g', 'rocky', 1, 'cold', ['locked']], ['h', 'rocky', 1, 'frozen', ['locked']]],
  'Sirius': [], 'Procyon': [], "Van Maanen's Star": [], 'Altair': [], '61 Cygni': [], 'Arcturus': [],
};

// ---------- Anomaly stories (grounded mystery) ----------
// Each outcome: {p: chance, t: text, rp, bc, bt (breakthrough), lose (ship lost), reveal (stars), score}
const EVENTS = [
  {id: 'probe', title: 'Derelict Probe', text: 'A small machine drifts silently through the system: tumbling, cold, unmistakably artificial. Its hull is pitted by thousands of years of dust.',
    ch: [{t: 'Bring it aboard', o: [{p: 0.55, t: 'Its frame is made of an alloy our metallurgists cannot explain. They are thrilled.', bt: 'bt_alloys', score: 20}, {p: 0.45, t: 'It is long dead, but its construction teaches us a great deal.', rp: 120, score: 10}]},
         {t: 'Scan it from a safe distance', o: [{p: 1, t: 'Careful scans give us a detailed picture of a machine no human built.', rp: 90, score: 8}]}]},
  {id: 'ringing', title: 'The Ringing Moon', text: 'A small moon vibrates with regular, almost musical seismic pulses, as if something deep inside it were still running.',
    ch: [{t: 'Drill toward the source', o: [{p: 0.5, t: 'The drill breaks into a hollow chamber lined with patterns. Mathematicians spend years on them.', bt: 'bt_signal', score: 25}, {p: 0.3, t: 'The chamber is empty, though clearly carved. Fascinating.', rp: 150, score: 10}, {p: 0.2, t: 'The moon shudders. Debris tears through the ship. Contact is lost.', lose: true}]},
         {t: 'Map it with seismometers', o: [{p: 1, t: 'A beautiful map of an interior that should not exist.', rp: 110, score: 8}]}]},
  {id: 'rogue', title: 'Rogue Planet', text: 'A starless planet is drifting through the system on its endless journey between the stars.',
    ch: [{t: 'Study it as it passes', o: [{p: 1, t: 'A frozen world from another star, perhaps billions of years old.', rp: 160, score: 10}]},
         {t: 'Mine its surface on the fly', o: [{p: 0.75, t: 'Rare metals worth a fortune are hauled aboard.', bc: 200, score: 5}, {p: 0.25, t: 'The ship cannot match its speed safely and is torn apart.', lose: true}]}]},
  {id: 'flare', title: 'Superflare', text: 'The star is building toward a massive flare. Instruments are already overloading.',
    ch: [{t: 'Shelter behind a planet', o: [{p: 1, t: 'The ship rides it out safely and records the whole event.', rp: 70, score: 5}]},
         {t: 'Observe from up close', o: [{p: 0.55, t: 'The data reveal how starlight bends near the star. Our telescopes will never be the same.', bt: 'bt_lensing', score: 20}, {p: 0.45, t: 'The flare overwhelms the ship\'s shielding.', lose: true}]}]},
  {id: 'spores', title: 'Frozen Spores', text: 'A comet passing the star carries dormant microscopic life frozen in its ice.',
    ch: [{t: 'Collect samples', o: [{p: 0.5, t: 'Their genetic machinery is entirely unlike ours, and very useful.', bt: 'bt_genome', score: 20}, {p: 0.5, t: 'The samples are fragile but valuable.', rp: 130, score: 10}]},
         {t: 'Leave them undisturbed', o: [{p: 1, t: 'We record them in place and leave the comet as we found it.', rp: 60, score: 15}]}]},
  {id: 'beacon', title: 'The Silent Beacon', text: 'A faint radio beacon repeats a sequence of prime numbers. Its source has no heat signature.',
    ch: [{t: 'Decode the full message', o: [{p: 0.6, t: 'Hidden in the primes is a lesson in mathematics we were not ready for.', bt: 'bt_signal', score: 25}, {p: 0.4, t: 'The sequence ends abruptly. We learn little, but the effort sharpens our methods.', rp: 140, score: 10}]},
         {t: 'Triangulate where it was aimed', o: [{p: 1, t: 'The beacon points toward other stars. We now know where they are.', reveal: 3, rp: 60, score: 12}]}]},
  {id: 'gravity', title: 'Gravitational Anomaly', text: 'Something with the mass of a mountain is orbiting the star, but nothing can be seen there.',
    ch: [{t: 'Approach and sample', o: [{p: 0.5, t: 'A speck of matter with negative energy density. The physicists are speechless.', bt: 'bt_exotic', score: 25}, {p: 0.5, t: 'Space folds around the ship. Contact is lost.', lose: true}]},
         {t: 'Measure from a distance', o: [{p: 1, t: 'Measurements alone rewrite several textbooks.', rp: 180, score: 10}]}]},
  {id: 'geysers', title: 'Organic Geysers', text: 'Ice geysers spray complex organic chemistry hundreds of kilometres into space.',
    ch: [{t: 'Fly through the plumes', o: [{p: 0.8, t: 'Samples collected; the chemistry is rich and strange.', rp: 150, score: 10}, {p: 0.2, t: 'Ice fragments shred the hull.', lose: true}]},
         {t: 'Drop sensor probes', o: [{p: 1, t: 'Probes will report for decades.', rp: 100, score: 8}]}]},
  {id: 'crystal', title: 'Crystal Caverns', text: 'Radar shows vast caverns lined with enormous crystals beneath a world\'s crust.',
    ch: [{t: 'Prospect them', o: [{p: 1, t: 'The crystals are worth a fortune to industry at home.', bc: 250, score: 5}]},
         {t: 'Study how they formed', o: [{p: 1, t: 'Their growth tells the geological history of the system.', rp: 120, score: 8}]}]},
  {id: 'ruins', title: 'Ruins on an Airless World', text: 'Geometric shapes cover a small airless world: walls, channels, buried towers, far older than humanity.',
    ch: [{t: 'Excavate', o: [{p: 0.5, t: 'Buried machinery yields alloys and design principles we can use.', bt: 'bt_alloys', score: 25}, {p: 0.5, t: 'The ruins are empty shells, but their age and layout are a revelation.', rp: 220, score: 20}]},
         {t: 'Document without disturbing', o: [{p: 1, t: 'A careful record of someone who was here long before us.', rp: 160, score: 20}]}]},
  {id: 'oldprobe', title: 'A Probe from Earth', text: 'Our sensors pick up a tiny, ancient human-made probe, launched centuries ago by one of Earth\'s first interstellar projects. It made it.',
    ch: [{t: 'Recover it and bring it home', o: [{p: 1, t: 'The probe goes on display on Earth. Millions come to see it.', bc: 120, score: 25}]},
         {t: 'Read its data and let it fly on', o: [{p: 1, t: 'Its long journey continues, now with a new chapter in its log.', rp: 90, score: 20}]}]},
  {id: 'lightocean', title: 'The Glowing Sea', text: 'At night, one world\'s oceans glow blue for thousands of kilometres. Something living is causing it.',
    ch: [{t: 'Send a submersible down', o: [{p: 0.7, t: 'The light comes from vast colonies of drifting organisms.', rp: 170, bt: 'bt_genome', score: 20}, {p: 0.3, t: 'The submersible is lost in the deep. The ship remains, the mystery too.', rp: 40, score: 5}]},
         {t: 'Observe from orbit', o: [{p: 1, t: 'Years of observation reveal the glow follows a daily rhythm.', rp: 110, score: 12}]}]},
  {id: 'debris', title: 'Debris Field', text: 'A cloud of shattered metal plates orbits the star: the remains of something large and artificial.',
    ch: [{t: 'Salvage the metal', o: [{p: 0.85, t: 'The salvage is worth a great deal.', bc: 220, score: 5}, {p: 0.15, t: 'A dormant mechanism wakes as we touch it. The ship is destroyed.', lose: true}]},
         {t: 'Study how it was destroyed', o: [{p: 1, t: 'Analysing the wreck reveals how these machines think, and how to spot them.', bt: 'bt_machines', score: 20}]}]},
  {id: 'orbit', title: 'An Impossible Orbit', text: 'A planet here moves in an orbit that should not be stable, yet it has been stable for millions of years.',
    ch: [{t: 'Model the orbit', o: [{p: 1, t: 'The answer involves a hidden companion body we had never detected.', rp: 200, score: 10}]}]},
  {id: 'vault', title: 'Cryogenic Vault', text: 'Buried in permafrost, a sealed vault holds frozen seeds and spores from many different worlds.',
    ch: [{t: 'Open the vault', o: [{p: 0.7, t: 'Hardy crops from unknown worlds; our farmers are amazed.', bt: 'bt_seeds', score: 20}, {p: 0.3, t: 'Most contents are dead, but a few samples survive.', rp: 120, score: 10}]},
         {t: 'Leave it sealed and catalogue it', o: [{p: 1, t: 'Whoever built it meant it to last. We respect that.', rp: 80, score: 18}]}]},
  {id: 'starcore', title: 'Strange Starlight', text: 'The star\'s spectrum shows elements in proportions that make no sense for a natural star.',
    ch: [{t: 'Dive close and take readings', o: [{p: 0.6, t: 'The star has been tampered with, by someone, long ago. What we learn transforms our fusion technology.', bt: 'bt_fusion', score: 25}, {p: 0.4, t: 'The heat is too much for the ship.', lose: true}]},
         {t: 'Observe from a distance', o: [{p: 1, t: 'Enough data for a generation of research.', rp: 170, score: 12}]}]},
];
// For the end screen and score
const SCORE_W = {explored: 3, surveyed: 4, microbial: 10, ecosystem: 25, anomaly: 1, breakthrough: 30, tech: 6, settlement: 15, city: 40, core: 100, popLog: 20};
