'use strict';

/* =========================================================
   UPTIME TYCOON — build a server hosting empire
   1 tick = 1 in-game hour
   ========================================================= */

/* ---------------- Game data ---------------- */

const PRODUCTS = {
  compute: { name: 'Compute', unit: 'vCPU', price: 1.0, base: 15, color: '#38bdf8' },
  storage: { name: 'Storage', unit: 'TB',   price: 0.6, base: 10, color: '#a78bfa' },
  gpu:     { name: 'GPU',     unit: 'GPU',  price: 9,   base: 4,  color: '#f472b6' },
};

const LOCATIONS = [
  { id: 'garage',   name: 'Garage Closet',        cost: 0,     slots: 4,   power: 3,     cooling: 2.5,   rent: 2,     desc: 'A shelf, a fan and a dream. Every empire starts somewhere.' },
  { id: 'basement', name: "Your House's Basement",      cost: 8000,  slots: 12,  power: 15,    cooling: 12,    rent: 25,    desc: 'Raised floor? More like raised eyebrows from the landlord.' },
  { id: 'colo',     name: 'Colocation Cage',      cost: 90000, slots: 24,  power: 60,    cooling: 55,    rent: 180,   desc: 'A locked cage inside somebody else\'s data center.' },
  { id: 'tier3',    name: 'Tier III Data Center', cost: 1.2e6, slots: 48,  power: 400,   cooling: 380,   rent: 1500,  desc: 'Redundant everything. N+1 all the way down.' },
  { id: 'hyper',    name: 'Hyperscale Campus',    cost: 2.5e7, slots: 96,  power: 4000,  cooling: 3800,  rent: 15000, desc: 'Its own substation. Possibly its own weather system.' },
  { id: 'arctic',   name: 'Arctic Megasite',      cost: 4e8,   slots: 160, power: 30000, cooling: 36000, rent: 90000, desc: 'Free cooling, courtesy of the Arctic Circle.' },
];
const LOC = Object.fromEntries(LOCATIONS.map(l => [l.id, l]));

const SERVERS = [
  { id: 'micro',   name: 'Micro VPS Box',        abbr: 'μVPS', product: 'compute', cap: 2,    power: 0.15, cost: 200,    color: '#4ade80' },
  { id: 'web1u',   name: '1U Web Server',        abbr: '1U',   product: 'compute', cap: 8,    power: 0.4,  cost: 1200,   color: '#22d3ee' },
  { id: 'nas',     name: 'NAS Storage Shelf',    abbr: 'NAS',  product: 'storage', cap: 12,   power: 0.3,  cost: 900,    color: '#a78bfa' },
  { id: 'comp2u',  name: '2U Compute Node',      abbr: '2U',   product: 'compute', cap: 32,   power: 1.1,  cost: 7000,   color: '#38bdf8' },
  { id: 'san',     name: 'SAN Array',            abbr: 'SAN',  product: 'storage', cap: 80,   power: 1.5,  cost: 9000,   color: '#c084fc' },
  { id: 'blade',   name: 'Blade Chassis',        abbr: 'BLADE',product: 'compute', cap: 180,  power: 5,    cost: 55000,  color: '#60a5fa', req: 'virt' },
  { id: 'gpu',     name: 'GPU Node',             abbr: 'GPU',  product: 'gpu',     cap: 8,    power: 3,    cost: 30000,  color: '#f472b6', req: 'gpulic' },
  { id: 'pod',     name: 'Petabyte Storage Pod', abbr: 'POD',  product: 'storage', cap: 600,  power: 6,    cost: 120000, color: '#e879f9', req: 'dedup' },
  { id: 'hpc',     name: 'HPC Rack',             abbr: 'HPC',  product: 'compute', cap: 1500, power: 30,   cost: 600000, color: '#818cf8', req: 'auto' },
  { id: 'ai',      name: 'AI Training Cluster',  abbr: 'AI',   product: 'gpu',     cap: 220,  power: 40,   cost: 900000, color: '#fb7185', req: 'liquid' },
  { id: 'quantum', name: 'Quantum Coprocessor',  abbr: 'QPU',  product: 'gpu',     cap: 2500, power: 80,   cost: 1.5e7,  color: '#facc15', req: 'quantum' },
];
const SRV = Object.fromEntries(SERVERS.map(s => [s.id, s]));

const RESEARCH = [
  { id: 'aisle',   name: 'Hot/Cold Aisle Containment', cost: 8000,   desc: '+20% cooling in every facility.' },
  { id: 'virt',    name: 'Virtualization',             cost: 15000,  desc: '+25% compute capacity. Unlocks Blade Chassis.' },
  { id: 'dedup',   name: 'Dedup & Compression',        cost: 40000,  desc: '+30% storage capacity. Unlocks Petabyte Pods.' },
  { id: 'ddos',    name: 'DDoS Scrubbing Network',     cost: 50000,  desc: 'Shrug off DDoS attacks entirely.' },
  { id: 'gpulic',  name: 'GPU Partner Program',        cost: 60000,  desc: 'Opens the GPU market. Unlocks GPU Nodes.' },
  { id: 'solar',   name: 'Solar Power Purchase',       cost: 120000, desc: '-30% electricity cost.' },
  { id: 'auto',    name: 'Fleet Automation',           cost: 350000, desc: 'Engineers cover and repair 2× more. Unlocks HPC Racks.' },
  { id: 'cdn',     name: 'Global CDN Service',                 cost: 500000, desc: '+25% demand for every product.' },
  { id: 'liquid',  name: 'Liquid Immersion Cooling',   cost: 2e6,    desc: '+40% cooling. Unlocks AI Training Clusters.', req: 'gpulic' },
  { id: 'aiops',   name: 'AIOps Autopilot',            cost: 5e6,    desc: '-50% hardware failures, +10% reputation gain.', req: 'auto' },
  { id: 'smr',     name: 'Small Modular Nuclear Reactor',      cost: 2e7,    desc: '-50% electricity cost, +25% power capacity.', req: 'solar' },
  { id: 'quantum', name: 'Quantum Research Lab',       cost: 8e7,    desc: 'Unlocks Quantum Coprocessors.', req: 'liquid' },
];
const RES = Object.fromEntries(RESEARCH.map(r => [r.id, r]));

const ROLES = {
  eng:     { name: 'Site Engineer', icon: '🔧', salary: 12, fee: 150, desc: 'Each covers 20 servers (fewer failures) and repairs broken hardware automatically.' },
  sales:   { name: 'Sales Rep',     icon: '📈', salary: 15, fee: 200, desc: '+5% demand for every product line.' },
  support: { name: 'Support Agent', icon: '🎧', salary: 8,  fee: 100, desc: 'Each handles ~250 units of customers. Understaffing erodes reputation.' },
};

const CAMPAIGNS = [
  { id: 'forum',   name: 'Forum Sponsorship',    cost: 400,   hours: 24,  boost: 0.15, desc: 'Banner on a sysadmin forum.' },
  { id: 'ads',     name: 'Search Ads Blitz',     cost: 5000,  hours: 48,  boost: 0.35, desc: 'Own the "cheap vps" keyword.' },
  { id: 'conf',    name: 'Tech Conference Booth',cost: 60000, hours: 72,  boost: 0.6,  desc: 'Free stickers. So many stickers.' },
  { id: 'podcast', name: 'Podcast Network Deal', cost: 750000,hours: 120, boost: 0.9,  desc: '"This episode is brought to you by…"' },
  { id: 'stadium', name: 'Stadium Naming Rights',cost: 3e7,   hours: 240, boost: 1.5,  desc: 'Your logo, 50 meters tall.' },
];
const CAMP = Object.fromEntries(CAMPAIGNS.map(c => [c.id, c]));

const EFFECTS = {
  ddos:       { name: 'DDoS attack',   kind: 'bad'  },
  heatwave:   { name: 'Heatwave',      kind: 'bad'  },
  powerspike: { name: 'Power spike',   kind: 'bad'  },
  viral:      { name: 'Viral startup', kind: 'good' },
  gpuboom:    { name: 'AI gold rush',  kind: 'good' },
};

const MAX_UPGRADE = 5;

/* ---------------- State ---------------- */

const SAVE_KEY = 'uptimeTycoon.v1';

function newState() {
  return {
    v: 1,
    name: 'NimbusStack',
    cash: 1500,
    rep: 50,
    brand: 0,
    hour: 8,
    speed: 1,
    facilities: [{ id: 'garage', servers: [], pLvl: 0, cLvl: 0 }],
    sel: 0,
    staff: { eng: 0, sales: 0, support: 0 },
    research: {},
    campaigns: {},
    effects: {},
    demand: { compute: 10, storage: 6, gpu: 0 },
    price: { compute: 1, storage: 1, gpu: 1 },
    repairPool: 0,
    debtHours: 0,
    nextEvent: 70,
    stats: { revTotal: 0, failures: 0 },
    milestones: {},
    log: [],
    logSeq: 0,
    last: { rev: 0, exp: 0, power: 0, rent: 0, salaries: 0, served: {}, cap: {}, uptime: 1 },
    gameOver: false,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const base = newState();
    return Object.assign(base, data, {
      staff: Object.assign(base.staff, data.staff),
      demand: Object.assign(base.demand, data.demand),
      price: Object.assign(base.price, data.price),
      stats: Object.assign(base.stats, data.stats),
      last: Object.assign(base.last, data.last),
    });
  } catch (e) {
    return null;
  }
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
}

let S = load();
const firstRun = !S;
if (!S) S = newState();

const ui = {
  tab: 'hardware',
  slot: null,
  panelDirty: true,
  rackSig: '',
  selSig: '',
  facTabsSig: '',
  logSeq: -1,
  msSig: '',
};

/* ---------------- Helpers ---------------- */

const $ = sel => document.querySelector(sel);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const has = id => !!S.research[id];

const trimZeros = s => (s.includes('.') ? s.replace(/\.?0+$/, '') : s);

function fmt(n) {
  const a = Math.abs(n);
  const units = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [v, s] of units) {
    if (a >= v) {
      const x = n / v;
      return trimZeros(Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(Math.abs(x) >= 10 ? 1 : 2)) + s;
    }
  }
  if (a > 0 && a < 10 && a % 1) return n.toFixed(2);
  return Math.round(n).toString();
}
const money = n => (n < 0 ? '-$' : '$') + fmt(Math.abs(n));
const kw = n => (n >= 1000 ? fmt(n / 1000) + ' MW' : (n < 10 ? trimZeros(n.toFixed(2)) : fmt(n)) + ' kW');

function curFac() {
  if (!S.facilities[S.sel]) S.sel = 0;
  return S.facilities[S.sel];
}
function totalServers() { return S.facilities.reduce((s, f) => s + f.servers.length, 0); }
function totalBroken() { return S.facilities.reduce((s, f) => s + f.servers.filter(x => x.b).length, 0); }

function capMult(p) {
  let m = 1;
  if (p === 'compute' && has('virt')) m *= 1.25;
  if (p === 'storage' && has('dedup')) m *= 1.3;
  return m;
}
function coolMult() {
  let m = 1;
  if (has('aisle')) m *= 1.2;
  if (has('liquid')) m *= 1.4;
  if (S.effects.heatwave) m *= 0.75;
  return m;
}
function elecPrice() {
  let p = 0.8;
  if (has('solar')) p *= 0.7;
  if (has('smr')) p *= 0.5;
  if (S.effects.powerspike) p *= 2.5;
  return p;
}
const facPower = f => LOC[f.id].power * (1 + 0.3 * f.pLvl) * (has('smr') ? 1.25 : 1);
const facCool = f => LOC[f.id].cooling * (1 + 0.3 * f.cLvl) * coolMult();
const facLoad = f => f.servers.reduce((s, x) => s + (x.b ? 0 : SRV[x.t].power), 0);
const facInstalled = f => f.servers.reduce((s, x) => s + SRV[x.t].power, 0);
const upgradeCost = f => lvl => Math.round(Math.max(600, LOC[f.id].cost * 0.15) * Math.pow(1.7, lvl));
const hireCost = role => Math.round(ROLES[role].fee * Math.pow(1.12, S.staff[role]));
const repairCost = x => Math.round(SRV[x.t].cost * 0.15);
const productUnlocked = p => p !== 'gpu' || has('gpulic');

function capacity() {
  const c = { compute: 0, storage: 0, gpu: 0 };
  for (const f of S.facilities) {
    for (const x of f.servers) {
      if (!x.b) { const d = SRV[x.t]; c[d.product] += d.cap; }
    }
  }
  for (const p in c) c[p] *= capMult(p);
  return c;
}

function mktBoost() {
  let b = 0;
  for (const id in S.campaigns) b += CAMP[id].boost;
  return b;
}

function demandTarget(p) {
  if (!productUnlocked(p)) return 0;
  let t = PRODUCTS[p].base * Math.pow(1 + S.brand, 0.75);
  t *= 0.5 + S.rep / 50;
  t *= 1 + S.staff.sales * 0.05;
  t *= 1 + mktBoost();
  if (has('cdn')) t *= 1.25;
  if (p === 'compute' && S.effects.viral) t *= 1.6;
  if (p === 'gpu' && S.effects.gpuboom) t *= 2;
  t *= Math.pow(S.price[p], -1.5);
  return t;
}

function assetValue() {
  let v = 0;
  for (const f of S.facilities) {
    v += LOC[f.id].cost * 0.6;
    for (const x of f.servers) v += SRV[x.t].cost * 0.5;
  }
  return v;
}
function valuation() {
  const profit = S.last.rev - S.last.exp;
  return Math.max(0, S.cash + assetValue() + Math.max(0, profit) * 8760 * 1.5);
}

function log(msg, type = 'info') {
  S.log.unshift({ h: S.hour, msg, type, id: ++S.logSeq });
  if (S.log.length > 60) S.log.length = 60;
}

function clockStr(h) {
  return `D${Math.floor(h / 24) + 1} ${String(h % 24).padStart(2, '0')}:00`;
}

/* ---------------- Events ---------------- */

const EVENTS = [
  { id: 'ddos', w: 3, run() {
      if (has('ddos')) { log('DDoS attack absorbed by your scrubbing network. 🛡️', 'good'); return; }
      S.effects.ddos = S.hour + 12; S.rep = clamp(S.rep - 2, 0, 100);
      log('Godammit DDoS attack! Revenue -40% for 12h. Reputation -2.', 'bad');
  } },
  { id: 'heatwave', w: 3, run() {
      S.effects.heatwave = S.hour + 24;
      log('Heatwave! Cooling capacity -25% for 24h. Watch your temperatures.', 'bad');
  } },
  { id: 'viral', w: 3, run() {
      S.effects.viral = S.hour + 36;
      log('A startup on your platform went viral. Compute demand +60% for 36h.', 'good');
  } },
  { id: 'powerspike', w: 2, run() {
      S.effects.powerspike = S.hour + 24;
      log('Grid emergency: electricity costs ×2.5 for 24h.', 'bad');
  } },
  { id: 'recall', w: 2, cond: () => totalServers() >= 6, run() {
      const all = [];
      S.facilities.forEach(f => f.servers.forEach(x => { if (!x.b) all.push(x); }));
      const n = Math.max(1, Math.round(all.length * 0.1));
      for (let i = 0; i < n && all.length; i++) {
        all.splice(Math.floor(Math.random() * all.length), 1)[0].b = true;
      }
      log(`Oh no... Vendor firmware bug bricked ${n} server${n > 1 ? 's' : ''}.`, 'bad');
  } },
  { id: 'investor', w: 2, run() {
      const g = Math.round(Math.max(1000, S.last.rev * 12));
      S.cash += g;
      log(`Somehow Elon wired you ${money(g)}. 💸`, 'good');
  } },
  { id: 'review', w: 2, run() {
      if (S.rep >= 60) { S.rep = clamp(S.rep + 4, 0, 100); log('Glowing review on a big tech blog. Reputation +4.', 'good'); }
      else { S.rep = clamp(S.rep - 4, 0, 100); log('Scathing review: "slower than dial-up." Reputation -4.', 'bad'); }
  } },
  { id: 'gpuboom', w: 2, cond: () => has('gpulic'), run() {
      S.effects.gpuboom = S.hour + 48;
      log('AI gold rush! GPU demand ×2 for 48h.', 'good');
  } },
];

function randomEvent() {
  const pool = EVENTS.filter(e => !S.effects[e.id] && (!e.cond || e.cond()));
  const total = pool.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= e.w; if (r <= 0) { e.run(); return; } }
}

/* ---------------- Milestones ---------------- */

const MILESTONES = [
  { id: 'first',   name: 'Hello, World',     desc: 'Serve your first customer',  check: () => S.stats.revTotal > 0 },
  { id: 'rev100',  name: 'Side Hustle',      desc: 'Earn $100/h',               check: () => S.last.rev >= 100 },
  { id: 'fac2',    name: 'Moving Out',       desc: 'Own 2 facilities',          check: () => S.facilities.length >= 2 },
  { id: 'rev1k',   name: 'Real Business',    desc: 'Earn $1K/h',                check: () => S.last.rev >= 1000 },
  { id: 'srv50',   name: 'Server Farm',      desc: 'Run 50 servers',            check: () => totalServers() >= 50 },
  { id: 'rep90',   name: 'Five Nines',       desc: 'Reach 90 reputation',       check: () => S.rep >= 90 },
  { id: 'rev10k',  name: 'Scale-Up',         desc: 'Earn $10K/h',               check: () => S.last.rev >= 1e4 },
  { id: 'rev100k', name: 'Hyperscaler',      desc: 'Earn $100K/h',              check: () => S.last.rev >= 1e5 },
  { id: 'unicorn', name: 'Unicorn',          desc: 'Reach a $1B valuation',     check: () => valuation() >= 1e9 },
  { id: 'allfac',  name: 'Global Footprint', desc: 'Own every facility',        check: () => S.facilities.length === LOCATIONS.length },
  { id: 'rev1m',   name: 'Cloud Titan',      desc: 'Earn $1M/h',                check: () => S.last.rev >= 1e6 },
];

function checkMilestones() {
  for (const m of MILESTONES) {
    if (!S.milestones[m.id] && m.check()) {
      S.milestones[m.id] = S.hour;
      log(`Milestone unlocked: ${m.name}`, 'good');
      toast(`🏆 <b>${m.name}</b> — ${m.desc}`, true);
    }
  }
}

/* ---------------- Simulation tick ---------------- */

function tick() {
  if (S.gameOver) return;
  S.hour++;

  // Expire campaigns & effects
  for (const id in S.campaigns) {
    if (S.hour >= S.campaigns[id]) { delete S.campaigns[id]; log(`${CAMP[id].name} campaign ended.`); ui.panelDirty = true; }
  }
  for (const id in S.effects) {
    if (S.hour >= S.effects[id]) { delete S.effects[id]; log(`${EFFECTS[id].name} is over.`); }
  }

  // Hardware failures
  const total = totalServers();
  const engCover = S.staff.eng * 20 * (has('auto') ? 2 : 1);
  const coverage = total ? Math.min(1, engCover / total) : 1;
  let baseFail = 0.0012 * (1 - 0.7 * coverage);
  if (has('aiops')) baseFail *= 0.5;
  let broke = 0, hotBroke = 0;
  for (const f of S.facilities) {
    const ratio = facLoad(f) / facCool(f);
    const heat = ratio > 1 ? 1 + (ratio - 1) * 40 : 1;
    for (const x of f.servers) {
      if (!x.b && Math.random() < baseFail * heat) {
        x.b = true; broke++;
        if (ratio > 1) hotBroke++;
      }
    }
  }
  if (broke) {
    S.stats.failures += broke;
    log(`${broke} server${broke > 1 ? 's' : ''} failed${hotBroke ? ' — overheating!' : '.'}`, 'bad');
  }

  // Automatic repairs by engineers
  const rate = S.staff.eng * 0.35 * (has('auto') ? 2 : 1);
  S.repairPool = Math.min(S.repairPool + rate, S.staff.eng * 2 + 1);
  let fixed = 0;
  outer: for (const f of S.facilities) {
    for (const x of f.servers) {
      if (S.repairPool < 1) break outer;
      if (x.b) { x.b = false; S.repairPool--; fixed++; }
    }
  }
  if (fixed) log(`Engineers repaired ${fixed} server${fixed > 1 ? 's' : ''}.`);

  // Market
  const cap = capacity();
  const served = {};
  let rev = 0;
  for (const p in PRODUCTS) {
    const tgt = demandTarget(p);
    S.demand[p] += (tgt - S.demand[p]) * 0.08;
    served[p] = Math.min(S.demand[p], cap[p]);
    rev += served[p] * PRODUCTS[p].price * S.price[p];
  }
  if (S.effects.ddos) rev *= 0.6;

  // Expenses
  const load = S.facilities.reduce((s, f) => s + facLoad(f), 0);
  const power = load * elecPrice();
  const rent = S.facilities.reduce((s, f) => s + LOC[f.id].rent, 0);
  const salaries = Object.keys(ROLES).reduce((s, r) => s + S.staff[r] * ROLES[r].salary, 0);
  const exp = power + rent + salaries;

  S.cash += rev - exp;
  S.stats.revTotal += rev;
  S.brand += rev / 400;

  // Reputation
  const broken = totalBroken();
  const uptime = total ? (total - broken) / total : 1;
  let dRep = 0;
  if (total > 0) {
    if (uptime >= 0.98) dRep += 0.03 * (1 + S.staff.support * 0.1) * (has('aiops') ? 1.1 : 1);
    else dRep -= (1 - uptime) * 0.4;
  }
  const servedTotal = Object.values(served).reduce((a, b) => a + b, 0);
  const need = servedTotal / 250;
  if (need > S.staff.support) dRep -= 0.025 * (1 - S.staff.support / need);
  for (const p in PRODUCTS) {
    if (productUnlocked(p) && S.demand[p] > 20 && S.demand[p] > cap[p] * 2.5) dRep -= 0.01;
  }
  S.rep = clamp(S.rep + dRep, 0, 100);

  S.last = { rev, exp, power, rent, salaries, served, cap, uptime, load };

  // Insolvency
  if (S.cash < 0) {
    S.debtHours++;
    if (S.debtHours === 1) log('Cash is negative! Recover within 72h or go bankrupt.', 'warn');
    if (S.debtHours >= 72) return gameOver();
  } else if (S.debtHours) {
    S.debtHours = 0;
    log('Back in the black. Phew.', 'good');
  }

  // Random events
  if (S.hour >= S.nextEvent) {
    randomEvent();
    S.nextEvent = S.hour + 60 + Math.floor(Math.random() * 80);
  }

  checkMilestones();
  if (S.hour % 12 === 0) save();
}

function gameOver() {
  S.gameOver = true;
  S.speed = 0;
  save();
  showModal(`
    <h2>Bankrupt 💀</h2>
    <p class="muted">Your creditors pulled the plug on ${S.name} after ${Math.floor(S.hour / 24)} days.</p>
    <div class="kv"><span>Lifetime revenue</span><span>${money(S.stats.revTotal)}</span></div>
    <div class="kv"><span>Servers deployed</span><span>${totalServers()}</span></div>
    <div class="kv"><span>Milestones</span><span>${Object.keys(S.milestones).length}/${MILESTONES.length}</span></div>
    <div class="actions"><button class="btn" data-action="restart">Found a new company</button></div>
  `);
}

/* ---------------- Actions ---------------- */

function check(action, id) {
  switch (action) {
    case 'buyServer': {
      const d = SRV[id];
      if (d.req && !has(d.req)) return `Requires ${RES[d.req].name}`;
      const f = curFac();
      if (f.servers.length >= LOC[f.id].slots) return 'No free slots here';
      if (facInstalled(f) + d.power > facPower(f) + 1e-9) return 'Not enough power here';
      if (S.cash < d.cost) return `Need ${money(d.cost)}`;
      return '';
    }
    case 'buyFacility': {
      if (S.facilities.some(f => f.id === id)) return 'Owned';
      if (S.cash < LOC[id].cost) return `Need ${money(LOC[id].cost)}`;
      return '';
    }
    case 'upPower':
    case 'upCool': {
      const f = S.facilities[+id];
      const lvl = action === 'upPower' ? f.pLvl : f.cLvl;
      if (lvl >= MAX_UPGRADE) return 'Maxed';
      const c = upgradeCost(f)(lvl);
      if (S.cash < c) return `Need ${money(c)}`;
      return '';
    }
    case 'hire': return S.cash < hireCost(id) ? `Need ${money(hireCost(id))}` : '';
    case 'fire': return S.staff[id] <= 0 ? 'Nobody to let go' : '';
    case 'research': {
      const r = RES[id];
      if (has(id)) return 'Completed';
      if (r.req && !has(r.req)) return `Requires ${RES[r.req].name}`;
      if (S.cash < r.cost) return `Need ${money(r.cost)}`;
      return '';
    }
    case 'campaign': {
      if (S.campaigns[id]) return `Running · ${S.campaigns[id] - S.hour}h left`;
      if (S.cash < CAMP[id].cost) return `Need ${money(CAMP[id].cost)}`;
      return '';
    }
    case 'repairAll': {
      const f = curFac();
      const cost = f.servers.filter(x => x.b).reduce((s, x) => s + repairCost(x), 0);
      if (!cost) return 'Nothing broken';
      if (S.cash < cost) return `Need ${money(cost)}`;
      return '';
    }
    default: return '';
  }
}

function act(a, id) {
  if (S.gameOver && !['restart', 'reset', 'closeModal'].includes(a)) return;
  if (check(a, id)) return;

  switch (a) {
    case 'tab': ui.tab = id; break;

    case 'buyServer': {
      const d = SRV[id], f = curFac();
      S.cash -= d.cost;
      f.servers.push({ t: id, b: false });
      log(`Racked a ${d.name} in ${LOC[f.id].name}.`);
      break;
    }
    case 'buyFacility': {
      S.cash -= LOC[id].cost;
      S.facilities.push({ id, servers: [], pLvl: 0, cLvl: 0 });
      S.sel = S.facilities.length - 1;
      ui.slot = null;
      log(`Signed the lease on ${LOC[id].name}! 🏢`, 'good');
      break;
    }
    case 'upPower':
    case 'upCool': {
      const f = S.facilities[+id];
      const isP = a === 'upPower';
      S.cash -= upgradeCost(f)(isP ? f.pLvl : f.cLvl);
      if (isP) f.pLvl++; else f.cLvl++;
      log(`${LOC[f.id].name}: ${isP ? 'power feed' : 'cooling'} upgraded to level ${isP ? f.pLvl : f.cLvl}.`);
      break;
    }
    case 'hire':
      S.cash -= hireCost(id);
      S.staff[id]++;
      log(`Hired a ${ROLES[id].name}.`);
      break;
    case 'fire':
      S.staff[id]--;
      log(`Let a ${ROLES[id].name} go.`, 'warn');
      break;
    case 'research':
      S.cash -= RES[id].cost;
      S.research[id] = true;
      log(`R&D complete: ${RES[id].name}.`, 'good');
      toast(`🔬 ${RES[id].name} researched`);
      break;
    case 'campaign':
      S.cash -= CAMP[id].cost;
      S.campaigns[id] = S.hour + CAMP[id].hours;
      log(`Launched ${CAMP[id].name} (+${Math.round(CAMP[id].boost * 100)}% demand).`, 'good');
      break;

    case 'selFac':
      S.sel = +id; ui.slot = null; break;
    case 'slot':
      ui.slot = ui.slot === +id ? null : +id; break;
    case 'sell': {
      const f = curFac(), x = f.servers[+id];
      if (!x) return;
      const refund = Math.round(SRV[x.t].cost * 0.5);
      S.cash += refund;
      f.servers.splice(+id, 1);
      ui.slot = null;
      log(`Sold a ${SRV[x.t].name} for ${money(refund)}.`);
      break;
    }
    case 'repair': {
      const x = curFac().servers[+id];
      if (!x || !x.b || S.cash < repairCost(x)) return;
      S.cash -= repairCost(x);
      x.b = false;
      log(`Paid an emergency techician to fix a ${SRV[x.t].name}.`);
      break;
    }
    case 'repairAll': {
      const f = curFac();
      let n = 0;
      for (const x of f.servers) if (x.b) { S.cash -= repairCost(x); x.b = false; n++; }
      log(`Emergency repair of ${n} server${n > 1 ? 's' : ''}.`);
      break;
    }

    case 'speed':
      S.speed = +id; break;
    case 'save':
      save(); toast('💾 Game saved'); break;
    case 'exportReport':
      exportHostingReport();
      return;
    case 'reset':
      if (!confirm('Caution! Wipe your company and start over?')) return;
      // falls through
    case 'restart':
      S = newState();
      Object.assign(ui, { slot: null, rackSig: '', selSig: '', facTabsSig: '', logSeq: -1, msSig: '' });
      log('Founded a hosting company in a garage. Let\'s go! 🚀', 'good');
      save();
      closeModal();
      break;
    case 'rename': {
      const n = prompt('Company name:', S.name);
      if (n && n.trim()) S.name = n.trim().slice(0, 28);
      break;
    }
    case 'help': showHelp(); return;
    case 'closeModal': closeModal(); break;
  }
  ui.panelDirty = true;
  render();
}

/* ---------------- Rendering: top bar ---------------- */

function renderTop() {
  $('#companyName').textContent = S.name;
  const cash = $('#cash');
  cash.textContent = money(S.cash);
  cash.classList.toggle('neg', S.cash < 0);

  const net = S.last.rev - S.last.exp;
  const netEl = $('#net');
  netEl.textContent = (net >= 0 ? '+' : '') + money(net) + '/h';
  netEl.classList.toggle('neg', net < 0);
  netEl.classList.toggle('pos', net > 0);

  $('#rep').textContent = S.rep.toFixed(1);
  const bar = $('#repBar');
  bar.style.width = S.rep + '%';
  $('#valuation').textContent = money(valuation());
  $('#clock').textContent = `Day ${Math.floor(S.hour / 24) + 1} · ${String(S.hour % 24).padStart(2, '0')}:00`;
  $('#eventCountdown').textContent = `${Math.max(0, S.nextEvent - S.hour)}h`;

  document.querySelectorAll('.speed button').forEach(b => b.classList.toggle('active', +b.dataset.id === S.speed));

  let chips = '';
  for (const id in S.effects) {
    chips += `<span class="chip ${EFFECTS[id].kind}">${EFFECTS[id].name} · ${S.effects[id] - S.hour}h</span>`;
  }
  for (const id in S.campaigns) {
    chips += `<span class="chip mkt">📣 ${CAMP[id].name} · ${S.campaigns[id] - S.hour}h</span>`;
  }
  const broken = totalBroken();
  if (broken) chips += `<span class="chip bad">⚠ ${broken} server${broken > 1 ? 's' : ''} down</span>`;
  if (S.facilities.some(f => facLoad(f) > facCool(f))) chips += `<span class="chip bad">🔥 Overheating</span>`;
  $('#effects').innerHTML = chips;

  const debt = $('#debt');
  debt.hidden = S.debtHours === 0;
  if (S.debtHours) debt.textContent = `Insolvent — ${72 - S.debtHours}h until bankruptcy`;
}

/* ---------------- Rendering: left panel ---------------- */

function renderTab() {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.id === ui.tab));
  const el = $('#tabContent');
  const btn = (action, id, label, cls = 'btn') =>
    `<button class="${cls}" data-action="${action}" data-id="${id}" data-check="1">${label}</button><span class="reason"></span>`;

  let html = '';
  if (ui.tab === 'hardware') {
    const f = curFac();
    html += `<p class="tab-intro">Installing into <b>${LOC[f.id].name}</b>. Switch facility above the rack view.</p>`;
    for (const d of SERVERS) {
      const locked = d.req && !has(d.req);
      const P = PRODUCTS[d.product];
      html += `
        <div class="card ${locked ? 'locked' : ''}">
          <div class="card-head">
            <span class="swatch" style="--c:${d.color}"></span><b>${d.name}</b>
            <span class="tag tag-${d.product}">${P.name}</span>
          </div>
          <div class="card-meta">
            +<span class="mono">${fmt(d.cap * capMult(d.product))}</span> ${P.unit} ·
            <span class="mono">${kw(d.power)}</span> ·
            ≈<span class="mono">${money(d.cap * capMult(d.product) * P.price)}</span>/h at list price
          </div>
          <div class="card-row">${btn('buyServer', d.id, `Purchase · ${money(d.cost)}`)}</div>
        </div>`;
    }
  }

  if (ui.tab === 'facilities') {
    html += `<p class="tab-intro">More space means more racks. Upgrade power feeds to fit hungrier hardware, and cooling to keep it alive.</p>`;
    for (const L of LOCATIONS) {
      const idx = S.facilities.findIndex(f => f.id === L.id);
      const owned = idx >= 0;
      html += `<div class="card ${owned ? 'done' : ''}">
        <div class="card-head"><b>${L.name}</b>${owned ? '<span class="tag tag-done">Owned</span>' : ''}</div>
        <div class="card-meta">${L.desc}<br>
          <span class="mono">${L.slots}</span> slots ·
          <span class="mono">${kw(L.power)}</span> power ·
          <span class="mono">${kw(L.cooling)}</span> cooling ·
          rent <span class="mono">${money(L.rent)}</span>/h
        </div>`;
      if (owned) {
        const f = S.facilities[idx];
        const uc = upgradeCost(f);
        html += `
          <div class="kv"><span>Power feed L${f.pLvl}/${MAX_UPGRADE}</span><span>${kw(facPower(f))}</span></div>
          <div class="card-row" style="margin-bottom:6px">${btn('upPower', idx, f.pLvl >= MAX_UPGRADE ? 'Maxed' : `+30% power · ${money(uc(f.pLvl))}`, 'btn secondary small')}</div>
          <div class="kv"><span>Cooling L${f.cLvl}/${MAX_UPGRADE}</span><span>${kw(facCool(f))}</span></div>
          <div class="card-row" style="margin-bottom:6px">${btn('upCool', idx, f.cLvl >= MAX_UPGRADE ? 'Maxed' : `+30% cooling · ${money(uc(f.cLvl))}`, 'btn secondary small')}</div>
          <div class="card-row"><button class="btn small" data-action="selFac" data-id="${idx}">View floor</button></div>`;
      } else {
        html += `<div class="card-row">${btn('buyFacility', L.id, `Lease · ${money(L.cost)}`)}</div>`;
      }
      html += `</div>`;
    }
  }

  if (ui.tab === 'staff') {
    html += `<div class="card" id="staffStats"></div>`;
    for (const r in ROLES) {
      const R = ROLES[r];
      html += `<div class="card">
        <div class="card-head"><span>${R.icon}</span><b>${R.name}</b><span class="count">${S.staff[r]}</span></div>
        <div class="card-meta">${R.desc}<br>Salary <span class="mono">${money(R.salary)}</span>/h each</div>
        <div class="card-row">
          ${btn('hire', r, `Hire · ${money(hireCost(r))}`)}
          <button class="btn danger small" data-action="fire" data-id="${r}" data-check="1">Let go</button>
        </div>
      </div>`;
    }
  }

  if (ui.tab === 'research') {
    html += `<p class="tab-intro">One-time investments that permanently improve your operation.</p>`;
    for (const r of RESEARCH) {
      const done = has(r.id);
      const locked = r.req && !has(r.req);
      html += `<div class="card ${done ? 'done' : ''} ${locked ? 'locked' : ''}">
        <div class="card-head"><b>${r.name}</b>${done ? '<span class="tag tag-done">✓ Done</span>' : ''}</div>
        <div class="card-meta">${r.desc}${r.req ? `<br>Requires: ${RES[r.req].name}` : ''}</div>
        ${done ? '' : `<div class="card-row">${btn('research', r.id, `Research · ${money(r.cost)}`)}</div>`}
      </div>`;
    }
  }

  if (ui.tab === 'marketing') {
    html += `<div class="card" id="brandStats"></div>`;
    for (const c of CAMPAIGNS) {
      html += `<div class="card">
        <div class="card-head"><b>${c.name}</b><span class="tag tag-compute">+${Math.round(c.boost * 100)}%</span></div>
        <div class="card-meta">${c.desc}<br>Boosts demand for <span class="mono">${c.hours}h</span>.</div>
        <div class="card-row">${btn('campaign', c.id, `Launch · ${money(c.cost)}`)}</div>
      </div>`;
    }
  }

  el.innerHTML = html;
}

function updateTab() {
  document.querySelectorAll('#tabContent [data-check]').forEach(b => {
    const r = check(b.dataset.action, b.dataset.id);
    b.disabled = !!r;
    const reason = b.nextElementSibling;
    if (reason && reason.classList.contains('reason')) reason.textContent = r && !r.startsWith('Need') ? r : '';
  });

  const ss = $('#staffStats');
  if (ss) {
    const total = totalServers();
    const cover = S.staff.eng * 20 * (has('auto') ? 2 : 1);
    const served = Object.values(S.last.served || {}).reduce((a, b) => a + b, 0);
    const needSupport = Math.ceil(served / 250);
    ss.innerHTML = `
      <div class="kv"><span>Engineer coverage</span><span class="${cover >= total ? 'good' : 'warn'}">${Math.min(cover, total)}/${total} servers</span></div>
      <div class="kv"><span>Support needed</span><span class="${S.staff.support >= needSupport ? 'good' : 'bad'}">${S.staff.support}/${needSupport} agents</span></div>
      <div class="kv"><span>Payroll</span><span>${money(S.last.salaries)}/h</span></div>`;
  }
  const bs = $('#brandStats');
  if (bs) {
    bs.innerHTML = `
      <div class="kv"><span>Brand awareness</span><span>${fmt(S.brand)}</span></div>
      <div class="kv"><span>Reputation multiplier</span><span>×${(0.5 + S.rep / 50).toFixed(2)}</span></div>
      <div class="kv"><span>Active campaign boost</span><span>+${Math.round(mktBoost() * 100)}%</span></div>`;
  }
}

/* ---------------- Rendering: center ---------------- */

function renderCenter() {
  const f = curFac(), L = LOC[f.id];

  const tabSig = S.facilities.map(x => x.id + (facLoad(x) > facCool(x) ? '!' : '')).join() + '|' + S.sel;
  if (tabSig !== ui.facTabsSig) {
    ui.facTabsSig = tabSig;
    $('#facTabs').innerHTML = S.facilities.map((x, i) =>
      `<button class="${i === S.sel ? 'active' : ''}" data-action="selFac" data-id="${i}">
        ${LOC[x.id].name}${facLoad(x) > facCool(x) ? ' <span class="hot">🔥</span>' : ''}
      </button>`).join('');
  }

  $('#facName').textContent = L.name;
  $('#facDesc').textContent = L.desc;

  const brokenHere = f.servers.filter(x => x.b);
  const rcost = brokenHere.reduce((s, x) => s + repairCost(x), 0);
  $('#facActions').innerHTML = brokenHere.length
    ? `<button class="btn" data-action="repairAll" ${check('repairAll') ? 'disabled' : ''}>Repair ${brokenHere.length} broken · ${money(rcost)}</button>`
    : '';

  const pCap = facPower(f), pUse = facInstalled(f);
  const cCap = facCool(f), cUse = facLoad(f);
  setMeter('power', pUse, pCap, `${kw(pUse)} / ${kw(pCap)}`);
  setMeter('cool', cUse, cCap, `${kw(cUse)} / ${kw(cCap)}${cUse > cCap ? ' 🔥' : ''}`);
  setMeter('slot', f.servers.length, L.slots, `${f.servers.length} / ${L.slots}`);

  const hot = cUse > cCap;
  const sig = `${S.sel}|${L.slots}|${hot}|` + f.servers.map(x => x.t + (x.b ? '!' : '')).join(',');
  if (sig !== ui.rackSig) {
    ui.rackSig = sig;
    let html = '';
    for (let i = 0; i < L.slots; i++) {
      const x = f.servers[i];
      if (!x) { html += `<div class="slot">EMPTY U${String(i + 1).padStart(2, '0')}</div>`; continue; }
      const d = SRV[x.t];
      const delay = ((i * 37) % 13) / 10;
      html += `<div class="slot filled ${x.b ? 'broken' : ''} ${hot ? 'hot' : ''}" style="--c:${d.color}" data-action="slot" data-id="${i}" title="${d.name}${x.b ? ' (DOWN)' : ''}">
        <span class="leds"><span class="led" style="animation-delay:${delay}s"></span><span class="led" style="animation-delay:${delay / 2}s"></span></span>
        <span class="lbl">${d.abbr}</span>
        <span class="sub">${x.b ? 'DOWN' : '+' + fmt(d.cap * capMult(d.product))}</span>
      </div>`;
    }
    $('#rack').innerHTML = html;
  }
  document.querySelectorAll('#rack .slot.filled').forEach(s => s.classList.toggle('selected', +s.dataset.id === ui.slot));

  // selection panel
  const x = ui.slot != null ? f.servers[ui.slot] : null;
  const selSig = x ? `${S.sel}|${ui.slot}|${x.t}|${x.b}|${S.cash >= repairCost(x)}` : `none|${f.servers.length === 0}`;
  if (selSig !== ui.selSig) {
    ui.selSig = selSig;
    if (x) {
      const d = SRV[x.t], P = PRODUCTS[d.product];
      $('#selection').innerHTML = `
        <span class="swatch" style="--c:${d.color}"></span>
        <div class="grow">
          <b>${d.name}</b> — <span class="${x.b ? 'bad' : 'good'}">${x.b ? 'DOWN' : 'Online'}</span><br>
          <span class="muted">${fmt(d.cap * capMult(d.product))} ${P.unit} ${P.name.toLowerCase()} · ${kw(d.power)}</span>
        </div>
        ${x.b ? `<button class="btn small" data-action="repair" data-id="${ui.slot}" ${S.cash < repairCost(x) ? 'disabled' : ''}>Repair · ${money(repairCost(x))}</button>` : ''}
        <button class="btn danger small" data-action="sell" data-id="${ui.slot}">Sell · ${money(d.cost * 0.5)}</button>`;
    } else {
      $('#selection').innerHTML = f.servers.length
        ? `<span class="muted">Click a server to inspect, repair or sell it.</span>`
        : `<span class="muted">This floor is empty. Buy hardware from the <b>Hardware</b> tab to start serving customers.</span>`;
    }
  }
}

function setMeter(key, use, cap, txt) {
  $(`#${key}Txt`).textContent = txt;
  const pct = cap > 0 ? use / cap : 0;
  const bar = $(`#${key}Bar`);
  bar.style.width = Math.min(100, pct * 100) + '%';
  bar.className = pct > 1 ? 'bad' : pct > 0.85 ? 'warn' : '';
}

/* ---------------- Rendering: right panel ---------------- */

function buildMarket() {
  let html = '';
  for (const p in PRODUCTS) {
    const P = PRODUCTS[p];
    html += `<div class="mkt" style="--c:${P.color}">
      <div class="mkt-head"><span class="dot"></span>${P.name}<span class="status" id="st-${p}"></span></div>
      <div class="mkt-nums" id="nums-${p}"></div>
      <div class="mkt-bar"><div class="cap" id="cap-${p}"></div><div class="fill" id="fill-${p}"></div><div class="marker" id="mark-${p}"></div></div>
      <div class="mkt-price">
        <span>Price</span>
        <input type="range" min="0.5" max="2.5" step="0.05" id="price-${p}" data-product="${p}" aria-label="${P.name} price">
        <span class="mono" id="plbl-${p}"></span>
      </div>
      <div class="mkt-lock" id="lock-${p}" hidden><span>🔒 Research <b>GPU Partner Program</b> to enter this market</span></div>
    </div>`;
  }
  $('#market').innerHTML = html;
  document.querySelectorAll('#market input[type=range]').forEach(inp => {
    inp.value = S.price[inp.dataset.product];
    inp.addEventListener('input', () => {
      S.price[inp.dataset.product] = +inp.value;
      renderMarket();
    });
  });
}

function renderMarket() {
  const cap = capacity();
  for (const p in PRODUCTS) {
    const P = PRODUCTS[p];
    const unlocked = productUnlocked(p);
    $(`#lock-${p}`).hidden = unlocked;
    const inp = $(`#price-${p}`);
    if (document.activeElement !== inp) inp.value = S.price[p];
    $(`#plbl-${p}`).textContent = `$${(P.price * S.price[p]).toFixed(2)}/${P.unit}·h`;

    const d = S.demand[p], c = cap[p], served = Math.min(d, c);
    const scale = Math.max(d, c, 1) * 1.1;
    $(`#cap-${p}`).style.width = (c / scale * 100) + '%';
    $(`#fill-${p}`).style.width = (served / scale * 100) + '%';
    $(`#mark-${p}`).style.left = `calc(${d / scale * 100}% - 1px)`;
    $(`#nums-${p}`).textContent = `serving ${fmt(served)} / ${fmt(c)} ${P.unit} · demand ${fmt(d)}`;

    const st = $(`#st-${p}`);
    if (!unlocked) { st.textContent = ''; continue; }
    if (c === 0 && d > 0.5) { st.textContent = 'No capacity'; st.className = 'status bad'; }
    else if (d > c * 1.02) { st.textContent = `Waitlist +${fmt(d - c)}`; st.className = 'status warn'; }
    else if (c > 0) { st.textContent = `${Math.round(served / c * 100)}% utilized`; st.className = 'status good'; }
    else { st.textContent = ''; }
  }
}

function renderFinance() {
  const L = S.last;
  const net = L.rev - L.exp;
  $('#finance').innerHTML = `
    <div class="kv"><span>Revenue</span><span class="good">+${money(L.rev)}</span></div>
    <div class="kv"><span>Electricity <span class="muted">(${kw(L.load || 0)} @ $${elecPrice().toFixed(2)})</span></span><span class="bad">-${money(L.power)}</span></div>
    <div class="kv"><span>Facility rent</span><span class="bad">-${money(L.rent)}</span></div>
    <div class="kv"><span>Payroll</span><span class="bad">-${money(L.salaries)}</span></div>
    <div class="kv total"><span>Net profit</span><span class="${net >= 0 ? 'good' : 'bad'}">${net >= 0 ? '+' : ''}${money(net)}</span></div>
    <div class="kv"><span>Fleet uptime</span><span class="${L.uptime >= 0.98 ? 'good' : L.uptime >= 0.9 ? 'warn' : 'bad'}">${(L.uptime * 100).toFixed(1)}%</span></div>`;
}

function exportHostingReport() {
  const cap = capacity();
  const uptime = S.last.uptime * 100;
  const report = $('#printReport');
  const safeName = S.name.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  const facilities = S.facilities.map(f => `
    <li><b>${LOC[f.id].name}</b><span>${f.servers.length} servers · ${kw(facLoad(f))} active load</span></li>
  `).join('');
  const products = Object.keys(PRODUCTS).map(id => `
    <tr><th>${PRODUCTS[id].name}</th><td>${fmt(S.last.served[id] || 0)} / ${fmt(cap[id])} ${PRODUCTS[id].unit}</td></tr>
  `).join('');

  report.innerHTML = `
    <article class="report-card">
      <header class="report-head">
        <div><p class="report-kicker">Your Company's Report Card!</p><h1>${safeName}</h1></div>
        <div class="report-date">${clockStr(S.hour)}<br>Generated ${new Date().toLocaleString()}</div>
      </header>
      <div class="report-score"><span>Company reputation</span><strong>${S.rep.toFixed(1)}<small> / 100</small></strong></div>
      <section class="report-grid">
        <div><span>Cash</span><b>${money(S.cash)}</b></div>
        <div><span>Net profit / hour</span><b>${money(S.last.rev - S.last.exp)}/h</b></div>
        <div><span>Valuation</span><b>${money(valuation())}</b></div>
        <div><span>Fleet uptime</span><b>${uptime.toFixed(1)}%</b></div>
      </section>
      <section class="report-section"><h2>Service &amp; Capacity</h2><table>${products}</table></section>
      <section class="report-section"><h2>Facilities (${S.facilities.length})</h2><ul>${facilities}</ul></section>
      <footer class="report-foot">${totalServers()} servers deployed  ${Object.keys(S.milestones).length}/${MILESTONES.length} milestones · Lifetime revenue ${money(S.stats.revTotal)}</footer>
    </article>`;
  window.print();
}

function renderLog() {
  if (ui.logSeq === S.logSeq) return;
  const prev = ui.logSeq;
  ui.logSeq = S.logSeq;
  $('#log').innerHTML = S.log.map(e =>
    `<li class="${e.type} ${e.id > prev && prev >= 0 ? 'new' : ''}"><span class="t">${clockStr(e.h)}</span>${e.msg}</li>`).join('');
}

function renderMilestones() {
  const sig = Object.keys(S.milestones).join();
  if (sig === ui.msSig) return;
  ui.msSig = sig;
  $('#msCount').textContent = `${Object.keys(S.milestones).length}/${MILESTONES.length}`;
  $('#milestones').innerHTML = MILESTONES.map(m => {
    const done = S.milestones[m.id] != null;
    return `<li class="${done ? 'done' : ''}"><span class="ic">${done ? '✔' : '○'}</span><span><b>${m.name}</b></span><small>${m.desc}</small></li>`;
  }).join('');
}

function render() {
  renderTop();
  if (ui.panelDirty) { renderTab(); ui.panelDirty = false; }
  updateTab();
  renderCenter();
  renderMarket();
  renderFinance();
  renderLog();
  renderMilestones();
}

/* ---------------- Toasts & modals ---------------- */

function toast(html, gold = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (gold ? ' gold' : '');
  t.innerHTML = html;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

let speedBeforeModal = null;
function showModal(html) {
  $('#modalCard').innerHTML = html;
  $('#modal').hidden = false;
}
function closeModal() {
  $('#modal').hidden = true;
  if (speedBeforeModal != null && !S.gameOver) { S.speed = speedBeforeModal; }
  speedBeforeModal = null;
}

function showHelp() {
  if (speedBeforeModal == null) { speedBeforeModal = S.speed; S.speed = 0; }
  showModal(`
    <h2>Welcome to Uptime Tycoon</h2>
    <p class="muted">You run a tiny hosting company out of a garage. Turn it into a planet-scale cloud.</p>
    <ul>
      <li><b>Buy servers</b> to add capacity for Compute, Storage and GPU customers. Your revenue = customers served × price.</li>
      <li><b>Make sure you watch the market panel.</b> The white marker is demand. If it's past your capacity you have a waitlist — raise prices or add hardware. Idle capacity? Lower prices to attract more customers.</li>
      <li><b>Power</b> is a hard limit per facility. <b>Cooling</b> is soft — exceed it and servers start dying fast.</li>
      <li><b>Broken servers</b> earn nothing and tank your reputation. Hire engineers to prevent and fix failures automatically.</li>
      <li><b>Support agents</b> keep customers happy as you grow. <b>Reputation</b> multiplies demand.</li>
      <li>Expand into bigger facilities, unlock R&amp;D, and run marketing campaigns.</li>
      <li>If cash stays negative for 72 hours, you're bankrupt.</li>
    </ul>
    <p class="muted">Space pauses. Progress autosaves in your browser.</p>
    <div class="actions"><button class="btn" data-action="closeModal">Got it!</button></div>
  `);
}

/* ---------------- Input & loop ---------------- */

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  act(el.dataset.action, el.dataset.id);
});

$('#modal').addEventListener('click', e => {
  if (e.target.id === 'modal' && !S.gameOver) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (!$('#modal').hidden) return;
    S.speed = S.speed ? 0 : 1;
    render();
  }
});

window.addEventListener('beforeunload', save);

function loop() {
  if (S.speed > 0 && !S.gameOver && $('#modal').hidden) {
    tick();
    render();
  }
  setTimeout(loop, S.speed > 0 ? 1000 / S.speed : 200);
}

/* ---------------- Boot ---------------- */

buildMarket();
if (firstRun) log('Founded a hosting company in a garage. Let\'s go! 🚀', 'good');
render();
if (firstRun) showHelp();
if (S.gameOver) gameOver();
loop();