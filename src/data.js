'use strict';
// ===================== STARWAKE — STATIC GAME DATA =====================
const GAME_VERSION = 1;
const SAVE_FORMAT = 1;

// fert = food produced per population unit; popF = habitability factor
const PT = {
  gaia:     {name:'Gaia',      fert:1.5,  popF:5, color:'#4fd06b', c2:'#1f7a3a'},
  terran:   {name:'Terran',    fert:1.25, popF:4, color:'#4a9be0', c2:'#2e7d3a'},
  ocean:    {name:'Ocean',     fert:1.25, popF:4, color:'#2f6fd8', c2:'#123a80'},
  jungle:   {name:'Jungle',    fert:1.0,  popF:3, color:'#5f9a3a', c2:'#2a4a14'},
  arid:     {name:'Arid',      fert:0.75, popF:3, color:'#d0a060', c2:'#7a5426'},
  tundra:   {name:'Tundra',    fert:0.75, popF:3, color:'#c4d4e0', c2:'#6a8090'},
  desert:   {name:'Desert',    fert:0.5,  popF:2, color:'#e3bc66', c2:'#9a6a24'},
  barren:   {name:'Barren',    fert:0,    popF:1, color:'#9a948c', c2:'#4a4642'},
  toxic:    {name:'Toxic',     fert:0,    popF:0, hostile:true, color:'#9fcf3a', c2:'#4a6a10'},
  radiated: {name:'Radiated',  fert:0,    popF:0, hostile:true, color:'#c25ae0', c2:'#5a1a70'},
  molten:   {name:'Molten',    fert:0,    popF:0, hostile:true, color:'#e8582e', c2:'#7a1a08'},
  gasgiant: {name:'Gas Giant', fert:0,    popF:0, outpostOnly:true, color:'#d6b088', c2:'#8a5a3a'},
  asteroids:{name:'Asteroid Belt', fert:0, popF:0, outpostOnly:true, color:'#8a8a8a', c2:'#444'},
};
const TERRAFORM = {toxic:'barren', radiated:'barren', molten:'barren', barren:'desert', desert:'arid', tundra:'arid', arid:'terran', jungle:'terran'};
const SIZE_NAMES = ['', 'Tiny', 'Small', 'Medium', 'Large', 'Huge'];
const SIZE_BASE = [0, 2, 4, 6, 8, 10];
const SIZE_SLOTS = [0, 2, 3, 4, 5, 6];
const MIN_NAMES = ['Ultra Poor', 'Poor', 'Abundant', 'Rich', 'Ultra Rich'];
const MIN_MULT = [0.5, 0.75, 1, 1.5, 2];

const STAR_TYPES = {
  yellow: {name:'Yellow', color:'#ffe27a', w:{terran:4, ocean:3, arid:3, jungle:2, tundra:2, desert:2, barren:2, gaia:1, toxic:1, molten:1, radiated:0.5, gasgiant:3, asteroids:2}},
  orange: {name:'Orange', color:'#ffb05a', w:{terran:2, ocean:2, arid:3, jungle:2, tundra:3, desert:3, barren:3, gaia:0.5, toxic:1, molten:1, radiated:1, gasgiant:3, asteroids:2}},
  red:    {name:'Red',    color:'#ff6a5a', w:{terran:1, ocean:1, tundra:4, barren:4, desert:2, jungle:2, toxic:2, radiated:1, molten:0.5, gasgiant:2, asteroids:2}},
  white:  {name:'White',  color:'#eef4ff', w:{terran:2, ocean:3, tundra:3, barren:3, arid:2, desert:2, radiated:2, toxic:2, molten:1, jungle:1, gasgiant:3, asteroids:2}},
  blue:   {name:'Blue',   color:'#7fb2ff', w:{molten:4, radiated:4, toxic:2, barren:3, desert:1, arid:1, terran:0.5, gasgiant:3, asteroids:3}},
};
const STAR_FREQ = {yellow:3, orange:3, red:4, white:2, blue:1};

const PSPECIAL = {
  gold:      {name:'Gold Deposits',     desc:'+5 credits per turn'},
  gems:      {name:'Crystal Veins',     desc:'+8 credits per turn'},
  artifacts: {name:'Precursor Ruins',   desc:'+5 research per turn; the first colony here uncovers a free tech'},
  fertile:   {name:'Fertile Soil',      desc:'+0.5 food per population'},
};

const RACES = [
  {id:'human',    name:'Terran Concord',     species:'Humans',   icon:'human',  bc:1.3, diplo:20,
    desc:'Adaptable traders and diplomats. +30% credits; other empires like them more.'},
  {id:'vashari',  name:'Vashari Collective', species:'Vashari',  icon:'vashari', research:1.5, attack:-1,
    desc:'Brilliant, frail scientists. +50% research, -1 ship attack.'},
  {id:'thrunn',   name:'Thrunn Hive',        species:'Thrunn',   icon:'thrunn', prodPop:0.5, growth:1.25, research:0.8, aggressive:1.3,
    desc:'Tireless insectoid workers. +0.5 production per population, +25% growth, -20% research.'},
  {id:'ixari',    name:'Ixari Dominion',     species:'Ixari',    icon:'ixari', attack:2, ground:1.5, aggressive:1.6,
    desc:'Born hunters. +2 ship attack, +50% ground troop strength.'},
  {id:'ondine',   name:'Ondine Tides',       species:'Ondine',   icon:'ondine', aquatic:true, foodPop:0.25,
    desc:'Amphibious. Ocean and Jungle worlds are paradise to them; +0.25 food per population.'},
  {id:'groak',    name:'Groak Monolith',     species:'Groak',    icon:'groak', lithovore:true, growth:0.6, aggressive:1.1,
    desc:'Silicon rock-eaters. Need no food and can live on any solid world, even hostile ones. -40% growth.'},
  {id:'myrrhine', name:'Myrrhine Aerie',     species:'Myrrhine', icon:'myrrhine', creative:true, research:0.85,
    desc:'Creative avians. Learn EVERY option in a tech tier at once. -15% research.'},
  {id:'selari',   name:'Selari Mind',        species:'Selari',   icon:'selari', defense:1, ground:2, bc:1.1, research:0.9,
    desc:'Telepaths. +1 ship defense, double ground troop strength, +10% credits, -10% research.'},
];
const RACE = {}; RACES.forEach(r => RACE[r.id] = r);
const EMP_COLORS = ['#4aa8ff', '#ff5a5a', '#5ad76a', '#ffd23f', '#c77dff', '#ff9f43', '#2ee6d6', '#ff6fb5'];

// ---------- Ship components ----------
const HULLS = {
  corvette:   {name:'Corvette',    space:25,  hp:8,   cost:10,  def:2,  armorMult:1,   cspeed:5, size:1, tech:null},
  destroyer:  {name:'Destroyer',   space:60,  hp:20,  cost:30,  def:1,  armorMult:2.5, cspeed:4, size:2, tech:null},
  cruiser:    {name:'Cruiser',     space:120, hp:40,  cost:60,  def:0,  armorMult:5,   cspeed:4, size:3, tech:'hull_cruiser', drydock:true},
  battleship: {name:'Battleship',  space:250, hp:80,  cost:120, def:-1, armorMult:10,  cspeed:3, size:4, tech:'hull_battleship', drydock:true},
  dreadnought:{name:'Dreadnought', space:500, hp:160, cost:250, def:-2, armorMult:20,  cspeed:3, size:5, tech:'hull_dreadnought', drydock:true},
};
const HULL_ORDER = ['corvette', 'destroyer', 'cruiser', 'battleship', 'dreadnought'];
const ARMOR = [
  {name:'Composite Plate', hp:5,  tech:null},
  {name:'Ceramite Plate',  hp:10, tech:'ceramite_armor'},
  {name:'Lattice Armor',   hp:18, tech:'lattice_armor'},
  {name:'Voidsteel Armor', hp:30, tech:'voidsteel_armor'},
];
const SHIELDS = [
  {name:'None', val:0, tech:null},
  {name:'Barrier Mk 1', val:1, tech:'barrier_1'},
  {name:'Barrier Mk 2', val:2, tech:'barrier_2'},
  {name:'Barrier Mk 3', val:3, tech:'barrier_3'},
  {name:'Barrier Mk 4', val:5, tech:'barrier_4'},
  {name:'Barrier Mk 5', val:7, tech:'barrier_5'},
];
const COMPUTERS = [
  {name:'None', val:0, tech:null},
  {name:'Targeting Array Mk 1', val:1, tech:'targeting_1'},
  {name:'Targeting Array Mk 2', val:2, tech:'targeting_2'},
  {name:'Targeting Array Mk 3', val:3, tech:'targeting_3'},
  {name:'Targeting Array Mk 4', val:4, tech:'targeting_4'},
  {name:'Targeting Array Mk 5', val:5, tech:'targeting_5'},
];
const DRIVES = [
  {name:'Chemical Thrusters', speed:2, tech:null},
  {name:'Ion Drive',          speed:3, tech:'ion_drive'},
  {name:'Fusion Drive',       speed:4, tech:'fusion_drive'},
  {name:'Fold Drive',         speed:5, tech:'fold_drive'},
  {name:'Lightwake Drive',    speed:6, tech:'lightwake_drive'},
  {name:'Starwake Drive',     speed:8, tech:'starwake_drive'},
];
const WEAPONS = {
  pulse_laser:     {name:'Pulse Laser',       type:'beam',    dmg:[1,4],   range:5, space:10, cost:3,  tech:null,                 color:'#ff4a4a'},
  railgun:         {name:'Railgun',           type:'beam',    dmg:[2,6],   range:6, space:12, cost:4,  tech:'railgun',            color:'#ffd060'},
  ion_lance:       {name:'Ion Lance',         type:'beam',    dmg:[3,9],   range:6, space:14, cost:6,  tech:'ion_lance',          color:'#5ad1ff'},
  graviton_shear:  {name:'Graviton Shear',    type:'beam',    dmg:[5,14],  range:6, space:16, cost:8,  tech:'graviton_shear',     color:'#b070ff'},
  plasma_torrent:  {name:'Plasma Torrent',    type:'beam',    dmg:[7,20],  range:5, space:20, cost:12, tech:'plasma_torrent',     color:'#40ff90'},
  singularity:     {name:'Singularity Cannon',type:'beam',    dmg:[10,30], range:7, space:24, cost:16, tech:'singularity_cannon', color:'#ff70ff'},
  fission_rocket:  {name:'Fission Rocket',    type:'missile', dmg:[5,5],   range:9, space:8,  cost:3,  tech:null,                 color:'#ffffff', ammo:3},
  hunter_missile:  {name:'Hunter Missile',    type:'missile', dmg:[8,8],   range:10,space:10, cost:5,  tech:'hunter_missile',     color:'#ffffff', ammo:3},
  swarm_torpedo:   {name:'Swarm Torpedo',     type:'missile', dmg:[14,14], range:10,space:14, cost:8,  tech:'swarm_torpedo',      color:'#a0d0ff', ammo:3},
  nova_torpedo:    {name:'Nova Torpedo',      type:'missile', dmg:[26,26], range:11,space:18, cost:12, tech:'nova_torpedo',       color:'#ffa0ff', ammo:3},
};
// modules: space is a fraction of hull space
const MODULES = {
  thrusters: {name:'Combat Thrusters', space:0.10, cost:0.15, tech:null,           desc:'+2 movement in battle'},
  plating:   {name:'Extra Plating',    space:0.15, cost:0.15, tech:null,           desc:'+50% armor hit points'},
  troopbay:  {name:'Troop Bay',        space:0.20, cost:0.10, tech:null,           desc:'Carries 2 marines per ship for invasions'},
  ecm:       {name:'ECM Jammer',       space:0.10, cost:0.20, tech:'ecm_suite',    desc:'Missiles fired at this ship are 30% less likely to hit'},
  drones:    {name:'Repair Drones',    space:0.15, cost:0.25, tech:'nanite_repair',desc:'Repairs 10% of hit points each battle round'},
};
const SPECIAL_SHIPS = {
  scout:     {name:'Scout',           cost:15,  hp:6,  cspeed:6, desc:'Fast explorer with long-range sensors.'},
  colony:    {name:'Colony Ship',     cost:110, hp:12, cspeed:3, desc:'Founds a new colony of 1 population on a habitable world.'},
  outpost:   {name:'Outpost Ship',    cost:45,  hp:8,  cspeed:3, desc:'Claims any planet, including gas giants and asteroid belts. Extends fuel range.'},
  transport: {name:'Troop Transport', cost:40,  hp:16, cspeed:4, desc:'Carries 4 marines to invade enemy colonies.'},
};

// ---------- Buildings (each uses one building slot) ----------
// e: effects. Pop = per population unit. All descriptions are generated from effects.
const BUILDINGS = {
  shipyard:         {name:'Shipyard',          cost:60,  up:1, e:{shipyard:1},                cat:'military', tech:null},
  foundry:          {name:'Foundry',           cost:50,  up:1, e:{prodPop:0.5, prodFlat:2},   cat:'industry', tech:null},
  research_station: {name:'Research Station',  cost:50,  up:1, e:{rpPop:0.5, rpFlat:2},       cat:'science',  tech:null},
  market:           {name:'Market',            cost:50,  up:0, e:{bcPop:0.5, bcFlat:2},       cat:'trade',    tech:null},
  hydroponic_bays:  {name:'Hydroponic Bays',   cost:50,  up:1, e:{foodFlat:3},                cat:'food',     tech:null},
  orbital_smelter:  {name:'Orbital Smelter',   cost:120, up:2, e:{prodPop:0.75, prodFlat:3},  cat:'industry', tech:'orbital_smelter'},
  core_tap:         {name:'Core Tap',          cost:260, up:3, e:{prodPop:1, prodFlat:6},     cat:'industry', tech:'core_tap'},
  xeno_lab:         {name:'Xeno Laboratory',   cost:120, up:2, e:{rpPop:0.75, rpFlat:3},      cat:'science',  tech:'xeno_lab'},
  quantum_archive:  {name:'Quantum Archive',   cost:260, up:3, e:{rpPop:1, rpFlat:6},         cat:'science',  tech:'quantum_archive'},
  exchange_spire:   {name:'Exchange Spire',    cost:120, up:1, e:{bcPop:0.75, bcFlat:3},      cat:'trade',    tech:'exchange_spire'},
  free_port:        {name:'Free Port',         cost:220, up:1, e:{bcPop:1, bcFlat:6},         cat:'trade',    tech:'free_port'},
  agri_domes:       {name:'Agri-Domes',        cost:90,  up:1, e:{foodPop:0.5},               cat:'food',     tech:'agri_domes', fertile:true},
  weather_grid:     {name:'Weather Grid',      cost:160, up:2, e:{foodPop:0.5},               cat:'food',     tech:'weather_grid', fertile:true},
  protein_vats:     {name:'Protein Vats',      cost:160, up:2, e:{foodFlat:8},                cat:'food',     tech:'protein_vats'},
  habitat_ring:     {name:'Habitat Ring',      cost:90,  up:1, e:{maxPop:3},                  cat:'growth',   tech:'habitat_ring'},
  clone_vats:       {name:'Clone Vats',        cost:90,  up:1, e:{growth:1},                  cat:'growth',   tech:'clone_vats'},
  arcology:         {name:'Arcology',          cost:220, up:2, e:{maxPop:6},                  cat:'growth',   tech:'arcology'},
  drydock:          {name:'Drydock',           cost:150, up:2, e:{drydock:1},                 cat:'military', tech:'drydock'},
  barracks:         {name:'Barracks',          cost:60,  up:1, e:{troops:6},                  cat:'military', tech:'barracks'},
  defense_battery:  {name:'Defense Battery',   cost:100, up:1, e:{defN:4, defHp:40},          cat:'defense',  tech:'defense_battery'},
  orbital_bastion:  {name:'Orbital Bastion',   cost:180, up:2, e:{defN:8, defHp:100},         cat:'defense',  tech:'orbital_bastion'},
  planetary_citadel:{name:'Planetary Citadel', cost:340, up:3, e:{defN:16, defHp:260},        cat:'defense',  tech:'planetary_citadel'},
  shield_lattice:   {name:'Shield Lattice',    cost:100, up:1, e:{shield:3},                  cat:'defense',  tech:'shield_lattice'},
  aegis_dome:       {name:'Aegis Dome',        cost:220, up:2, e:{shield:8},                  cat:'defense',  tech:'aegis_dome'},
};
const BLD_CAT = {industry:'#ffb84a', science:'#5ad1ff', trade:'#ffe060', food:'#5be08a', growth:'#c77dff', military:'#ff7a5a', defense:'#ff5d8a'};
function effText(e) {
  const out = [];
  const pp = (v, w) => (v > 0 ? '+' : '') + v + ' ' + w;
  if (e.prodPop || e.prodFlat) out.push([e.prodPop ? pp(e.prodPop, 'production per pop') : '', e.prodFlat ? pp(e.prodFlat, 'production') : ''].filter(Boolean).join(', '));
  if (e.rpPop || e.rpFlat) out.push([e.rpPop ? pp(e.rpPop, 'research per pop') : '', e.rpFlat ? pp(e.rpFlat, 'research') : ''].filter(Boolean).join(', '));
  if (e.bcPop || e.bcFlat) out.push([e.bcPop ? pp(e.bcPop, 'credits per pop') : '', e.bcFlat ? pp(e.bcFlat, 'credits') : ''].filter(Boolean).join(', '));
  if (e.foodPop) out.push(pp(e.foodPop, 'food per pop (fertile worlds only)'));
  if (e.foodFlat) out.push(pp(e.foodFlat, 'food'));
  if (e.maxPop) out.push(pp(e.maxPop, 'max population'));
  if (e.growth) out.push('+100% population growth');
  if (e.shipyard) out.push('Builds ships here; fully repairs fleets in orbit');
  if (e.drydock) out.push('Allows Cruiser and larger hulls to be built here (needs a Shipyard)');
  if (e.troops) out.push(pp(e.troops, 'defending marines'));
  if (e.defN) out.push('Defense guns: ' + e.defN + ' mounts of your best beam weapon, ' + e.defHp + ' hit points');
  if (e.shield) out.push('Planet defenses ignore ' + e.shield + ' damage from every hit');
  return out.join('. ');
}
const PROJECTS = {
  terraform: {name:'Terraforming',        tech:'terraforming',        desc:'Improve this planet one step toward Terran (more population and food)'},
  gaia:      {name:'Gaia Transformation', tech:'gaia_transformation', desc:'Turn a Terran or Ocean world into a Gaia paradise'},
};

// ---------- Technology ----------
const FIELDS = [
  {id:'eng', name:'Engineering', color:'#e8a84a', tiers:[
    {cost:60,   opts:['orbital_smelter', 'defense_battery']},
    {cost:150,  opts:['ceramite_armor', 'reinforced_frames'], bonus:['hull_cruiser', 'drydock']},
    {cost:300,  opts:['orbital_bastion', 'arcology']},
    {cost:520,  opts:['lattice_armor', 'hardened_colonies'], bonus:['hull_battleship']},
    {cost:850,  opts:['core_tap', 'planetary_citadel']},
    {cost:1300, opts:['voidsteel_armor', 'bastion_frames'], bonus:['hull_dreadnought']},
  ]},
  {id:'prop', name:'Propulsion', color:'#5ac8ff', tiers:[
    {cost:50,   opts:['ion_drive', 'fuel_cells']},
    {cost:140,  opts:['fusion_drive', 'deep_scanners']},
    {cost:300,  opts:['fold_drive', 'subspace_tanks']},
    {cost:520,  opts:['lightwake_drive', 'vector_thrusters']},
    {cost:850,  opts:['starwake_drive', 'phase_dampers']},
  ]},
  {id:'wpn', name:'Weapons', color:'#ff6060', tiers:[
    {cost:60,   opts:['railgun', 'hunter_missile']},
    {cost:150,  opts:['ion_lance', 'assault_armor']},
    {cost:300,  opts:['graviton_shear', 'swarm_torpedo']},
    {cost:520,  opts:['plasma_torrent', 'heavy_mounts']},
    {cost:850,  opts:['nova_torpedo', 'drop_pods']},
    {cost:1300, opts:['singularity_cannon', 'fire_control_ai']},
  ]},
  {id:'shd', name:'Shields', color:'#7ad0ff', tiers:[
    {cost:60,   opts:['barrier_1', 'shield_lattice']},
    {cost:150,  opts:['barrier_2', 'personal_shields']},
    {cost:300,  opts:['barrier_3', 'nanite_repair']},
    {cost:520,  opts:['barrier_4', 'aegis_dome']},
    {cost:850,  opts:['barrier_5', 'hardlight_shields']},
  ]},
  {id:'bio', name:'Biology', color:'#6ae07a', tiers:[
    {cost:50,   opts:['agri_domes', 'habitat_ring']},
    {cost:130,  opts:['clone_vats', 'hostile_habitats']},
    {cost:280,  opts:['weather_grid', 'terraforming']},
    {cost:480,  opts:['protein_vats', 'gene_crafting']},
    {cost:800,  opts:['gaia_transformation', 'hyper_growth']},
  ]},
  {id:'cmp', name:'Computing', color:'#d07aff', tiers:[
    {cost:60,   opts:['xeno_lab', 'targeting_1']},
    {cost:150,  opts:['targeting_2', 'ecm_suite']},
    {cost:300,  opts:['quantum_archive', 'targeting_3']},
    {cost:520,  opts:['neural_net', 'targeting_4']},
    {cost:850,  opts:['sentient_core', 'targeting_5']},
  ]},
  {id:'soc', name:'Society', color:'#ffd860', tiers:[
    {cost:60,   opts:['exchange_spire', 'xeno_relations']},
    {cost:150,  opts:['barracks', 'civil_engineering']},
    {cost:300,  opts:['free_port', 'galactic_bank']},
    {cost:520,  opts:['unified_government', 'war_college']},
    {cost:850,  opts:['imperial_charter', 'xeno_psychology']},
  ]},
];
const TECH = {
  hull_cruiser:      {name:'Cruiser Hull', desc:'Ship hull with 120 space (needs a Drydock to build).'},
  hull_battleship:   {name:'Battleship Hull', desc:'Ship hull with 250 space (needs a Drydock).'},
  hull_dreadnought:  {name:'Dreadnought Hull', desc:'Ship hull with 500 space (needs a Drydock).'},
  ceramite_armor:    {name:'Ceramite Plate', desc:'Ship armor: 10 hit points per hull class.'},
  lattice_armor:     {name:'Lattice Armor', desc:'Ship armor: 18 hit points per hull class.'},
  voidsteel_armor:   {name:'Voidsteel Armor', desc:'Ship armor: 30 hit points per hull class.'},
  reinforced_frames: {name:'Reinforced Frames', desc:'+25% hull hit points on all ships.'},
  bastion_frames:    {name:'Bastion Frames', desc:'+50% hull hit points on all ships.'},
  hardened_colonies: {name:'Hardened Colonies', desc:'+50% planet defense hit points and defending marines.'},
  ion_drive:         {name:'Ion Drive', desc:'Fleets travel 3 parsecs per turn.'},
  fusion_drive:      {name:'Fusion Drive', desc:'Fleets travel 4 parsecs per turn; +1 battle movement.'},
  fold_drive:        {name:'Fold Drive', desc:'Fleets travel 5 parsecs per turn.'},
  lightwake_drive:   {name:'Lightwake Drive', desc:'Fleets travel 6 parsecs per turn; +1 battle movement.'},
  starwake_drive:    {name:'Starwake Drive', desc:'Fleets travel 8 parsecs per turn.'},
  fuel_cells:        {name:'Fuel Cells', desc:'+2 parsecs fuel range.'},
  subspace_tanks:    {name:'Subspace Tanks', desc:'+4 parsecs fuel range.'},
  deep_scanners:     {name:'Deep Scanners', desc:'+2 sensor range for colonies and fleets.'},
  vector_thrusters:  {name:'Vector Thrusters', desc:'+1 battle movement for all ships.'},
  phase_dampers:     {name:'Phase Dampers', desc:'+2 defense for all ships.'},
  railgun:           {name:'Railgun', desc:'Beam weapon: 2-6 damage, range 6.'},
  ion_lance:         {name:'Ion Lance', desc:'Beam weapon: 3-9 damage, range 6.'},
  graviton_shear:    {name:'Graviton Shear', desc:'Beam weapon: 5-14 damage, range 6.'},
  plasma_torrent:    {name:'Plasma Torrent', desc:'Beam weapon: 7-20 damage, range 5.'},
  singularity_cannon:{name:'Singularity Cannon', desc:'Beam weapon: 10-30 damage, range 7.'},
  hunter_missile:    {name:'Hunter Missile', desc:'Missile: 8 damage, range 10, 3 volleys per battle, +10% to hit, half effect from shields.'},
  swarm_torpedo:     {name:'Swarm Torpedo', desc:'Missile: 14 damage, range 10.'},
  nova_torpedo:      {name:'Nova Torpedo', desc:'Missile: 26 damage, range 11.'},
  assault_armor:     {name:'Assault Armor', desc:'+50% attacking marine strength.'},
  heavy_mounts:      {name:'Heavy Mounts', desc:'+25% damage for all ship and planet weapons.'},
  drop_pods:         {name:'Drop Pods', desc:'Troop Transports carry 8 marines instead of 4.'},
  fire_control_ai:   {name:'Fire Control AI', desc:'+2 attack for ships and planets.'},
  barrier_1:         {name:'Barrier Mk 1', desc:'Ship shield: ignores 1 damage from every hit.'},
  barrier_2:         {name:'Barrier Mk 2', desc:'Ship shield: ignores 2 damage from every hit.'},
  barrier_3:         {name:'Barrier Mk 3', desc:'Ship shield: ignores 3 damage from every hit.'},
  barrier_4:         {name:'Barrier Mk 4', desc:'Ship shield: ignores 5 damage from every hit.'},
  barrier_5:         {name:'Barrier Mk 5', desc:'Ship shield: ignores 7 damage from every hit.'},
  personal_shields:  {name:'Personal Shields', desc:'+50% defending marine strength.'},
  nanite_repair:     {name:'Nanite Repair', desc:'Ships repair 25% per turn anywhere. Unlocks the Repair Drones ship module.'},
  hardlight_shields: {name:'Hardlight Shields', desc:'Ship shields block 50% more damage.'},
  hostile_habitats:  {name:'Hostile Habitats', desc:'Toxic, Radiated and Molten worlds can be colonized (small populations).'},
  terraforming:      {name:'Terraforming', desc:'Project: improve a planet one step toward Terran.'},
  gene_crafting:     {name:'Gene Crafting', desc:'+2 max population on every colony.'},
  gaia_transformation:{name:'Gaia Transformation', desc:'Project: turn Terran or Ocean worlds into Gaia worlds.'},
  hyper_growth:      {name:'Hyper-Growth', desc:'+50% population growth and +3 max population on every colony.'},
  targeting_1:       {name:'Targeting Array Mk 1', desc:'Ship computer: +1 attack.'},
  targeting_2:       {name:'Targeting Array Mk 2', desc:'Ship computer: +2 attack.'},
  targeting_3:       {name:'Targeting Array Mk 3', desc:'Ship computer: +3 attack.'},
  targeting_4:       {name:'Targeting Array Mk 4', desc:'Ship computer: +4 attack.'},
  targeting_5:       {name:'Targeting Array Mk 5', desc:'Ship computer: +5 attack.'},
  ecm_suite:         {name:'ECM Suite', desc:'+1 defense for all ships. Unlocks the ECM Jammer ship module.'},
  neural_net:        {name:'Neural Net', desc:'+20% research on every colony.'},
  sentient_core:     {name:'Sentient Core', desc:'+5 research on every colony.'},
  xeno_relations:    {name:'Xeno Relations', desc:'+20 relations with all empires; trade treaties earn 50% more.'},
  civil_engineering: {name:'Civil Engineering', desc:'Buildings cost 20% less.'},
  galactic_bank:     {name:'Galactic Bank', desc:'+20% credits.'},
  unified_government:{name:'Unified Government', desc:'+10% production and credits.'},
  war_college:       {name:'War College', desc:'Ship upkeep halved, +1 ship attack.'},
  imperial_charter:  {name:'Imperial Charter', desc:'+20% production and research.'},
  xeno_psychology:   {name:'Xeno Psychology', desc:'Conquered colonies keep all their population; +30 relations.'},
};
for (const k in BUILDINGS) if (BUILDINGS[k].tech === k) TECH[k] = {name:BUILDINGS[k].name, desc:'Building: ' + effText(BUILDINGS[k].e) + '.'};
TECH.drydock = {name:'Drydock', desc:'Building: ' + effText(BUILDINGS.drydock.e) + '.'};
const TECH_LOC = {};
FIELDS.forEach((f, fi) => f.tiers.forEach((t, ti) => {
  t.opts.forEach(o => TECH_LOC[o] = {f:fi, t:ti});
  (t.bonus || []).forEach(o => TECH_LOC[o] = {f:fi, t:ti, bonus:true});
}));

const SYL1 = ['Al','Bel','Cor','Dra','El','Fen','Gar','Hel','Ix','Jor','Kal','Lor','Mor','Nex','Or','Pra','Qua','Ryl','Sol','Tar','Ul','Vel','Xan','Yr','Zan','Ath','Ces','Dor','Eph','Gal','Kor','Myr','Ner','Pol','Rho','Sar','Tal','Vor','Aur','Bry','Cy','Dun','Ess','Fal','Gry','Hal','Ist','Kes','Lyr','Mal','Nor','Ost','Ren','Syl','Thal','Var','Wyn','Zir'];
const SYL2 = ['a','ar','eth','ion','is','on','us','ara','ex','or','ia','um','ix','os','ane','esh','ir','ova','en','ys','oth','ea','ul','ani'];

// galaxy settings
const GAL = {
  small:  {n:18, w:26, h:20, rivals:2, min:1, max:3, label:'Small'},
  medium: {n:30, w:36, h:26, rivals:3, min:1, max:5, label:'Medium'},
  large:  {n:44, w:44, h:32, rivals:5, min:2, max:6, label:'Large'},
  huge:   {n:60, w:52, h:38, rivals:7, min:3, max:7, label:'Huge'},
};
const SHAPES = {round:'Round', spiral:'Spiral', clusters:'Clusters', ring:'Ring'};
const SKILL = {relaxed:'Relaxed', standard:'Standard', cunning:'Cunning'};
