(function(){
'use strict';
window.__BUNDLE_LOADED__=true;
try{var _el=document.getElementById('menuSub'); if(_el && _el.textContent && _el.textContent.indexOf('JS')===0){ _el.textContent='Pilih opsi:'; }}catch(e){}

/* ===== data.js ===== */
const SKILLS = {
  fireball: { name:"Fireball", icon:"", element:"fire", mpCost:6, power:10, cooldown:3, desc:"Serangan api (damage tinggi)." },
  fireArrow: { name:"Fire Arrow", icon:"", element:"fire", mpCost:9, power:14, cooldown:4, desc:"Fire flame arrow that pierce to enemy" },
  blazingShield: { name:"Blazing Aura", icon:"", element:"fire", mpCost:14, power:0, cooldown:4, desc:"Menyelimuti tubuh dengan aura api. Apply effect Strengthen 40% for 2 turn to user" },
  echoStrike: { name:"Echo Strike", icon:"", element:"physical", mpCost:25, power:10, cooldown:8, desc:"Memberikan Stun kepada target selama 3 turn." }
};
const ITEMS = {
  potion: { name:"Potion", kind:"heal_hp", amount:25, desc:"Memulihkan 25 HP", level:1 },
  ether:  { name:"Ether",  kind:"heal_mp", amount:10, desc:"Memulihkan 10 MP", level:1 },
  woodenSword: { name:"Wooden Sword", kind:"gear", slot:"hand", desc:"Senjata kayu sederhana.", atk:2, level:1 },
  clothHat: { name:"Cloth Hat", kind:"gear", slot:"head", desc:"Topi kain lusuh.", def:1, level:1 },
  leatherArmor: { name:"Leather Armor", kind:"gear", slot:"armor", desc:"Armor kulit ringan.", def:2, level:1 },
  leatherPants: { name:"Leather Pants", kind:"gear", slot:"pant", desc:"Celana kulit sederhana.", def:1, level:1 },
  oldBoots: { name:"Old Boots", kind:"gear", slot:"shoes", desc:"Sepatu tua tapi nyaman.", spd:1, level:1 },
  bronzeSword: { name:"Bronze Sword", kind:"gear", slot:"hand", desc:"Pedang Lv3 dengan serangan stabil.", atk:4, level:3 },
  ironSword: { name:"Iron Sword", kind:"gear", slot:"hand", desc:"Pedang Lv6 yang kokoh.", atk:6, level:6 },
  runeBlade: { name:"Rune Blade", kind:"gear", slot:"hand", desc:"Pedang Lv9 dengan rune kuno.", atk:9, level:9 },
  leatherHood: { name:"Leather Hood", kind:"gear", slot:"head", desc:"Pelindung kepala Lv2.", def:2, level:2 },
  ironHelm: { name:"Iron Helm", kind:"gear", slot:"head", desc:"Helm Lv7 yang berat.", def:4, level:7 },
  chainVest: { name:"Chain Vest", kind:"gear", slot:"armor", desc:"Armor Lv4 berbahan rantai.", def:4, level:4 },
  steelArmor: { name:"Steel Armor", kind:"gear", slot:"armor", desc:"Armor Lv8 dengan pertahanan tinggi.", def:7, level:8 },
  travelerPants: { name:"Traveler Pants", kind:"gear", slot:"pant", desc:"Celana Lv3 untuk perjalanan.", def:2, spd:1, level:3 },
  ironGreaves: { name:"Iron Greaves", kind:"gear", slot:"pant", desc:"Greaves Lv7 kokoh.", def:4, level:7 },
  swiftBoots: { name:"Swift Boots", kind:"gear", slot:"shoes", desc:"Sepatu Lv5 meningkatkan kecepatan.", spd:2, level:5 },
  banditsDagger: { name:"Bandit's Dagger", kind:"gear", slot:"hand", desc:"Dagger bandit. Basic attack punya 25% chance memberi Poison 3% selama 1 turn.", atk:17, level:10, basicPoisonChance:25, poisonPct:3, poisonTurns:1 },
  banditsHood: { name:"Bandit's Hood", kind:"gear", slot:"head", desc:"Hood bandit yang meningkatkan evasion.", evasion:4, level:10 },
  banditsArmour: { name:"Bandit's Armour", kind:"gear", slot:"armor", desc:"Armor bandit dengan pertahanan tinggi dan sedikit speed.", def:10, spd:2, level:10 },
  banditsBoots: { name:"Bandit's Boots", kind:"gear", slot:"shoes", desc:"Boots bandit yang sangat ringan.", spd:7, level:10 },
  wyrmScale: { name:"Wyrm Scale", kind:"material", desc:"Sisik naga purba yang masih menyimpan panas mana." },
  moltenCore: { name:"Molten Core", kind:"material", desc:"Inti bara dari Ancient Wyrm." },
  behemothHorn: { name:"Behemoth Horn", kind:"material", desc:"Tanduk keras milik Crimson Behemoth." },
  bloodCrystal: { name:"Blood Crystal", kind:"material", desc:"Kristal merah pekat yang memuat energi brutal." },
  eclipsedRunebreaker: {
    name:"Eclipsed Runebreaker",
    kind:"gear",
    slot:"hand",
    desc:"Pedang transenden hasil fusi Rune Blade dan relic boss. Saat tebasan dasar mengenai target, aura eclipse-nya menyesatkan pandangan musuh dan menurunkan Accuracy mereka 20%.",
    atk:25,
    penetrationDef:7,
    basicAccDownPct:20,
    basicAccDownTurns:1,
    level:1,
  }
};
const ENEMY_NAMES = ["Slime","Goblin","Bandit","Wolf","Skeleton"];
const ENEMY_AVATARS = {
  Slime: { image: "./assets/enemies/slime.png" },
  Goblin: { image: "./assets/enemies/goblin.png" },
  Bandit: { image: "./assets/enemies/bandit1.png" },
  "Leader Bandit": { image: "./assets/enemies/leaderbandit.png" },
  Wolf: { image: "./assets/enemies/wolf.png" },
  Skeleton: { image: "./assets/enemies/skeleton.png" }
};
const ALLY_AVATARS = {
  Guardian: { icon: "🛡️", bg: "linear-gradient(135deg, #7ad5ff, #1f4b78)" },
  Ranger: { icon: "🏹", bg: "linear-gradient(135deg, #8be77b, #2c6b2a)" },
  Mystic: { icon: "🔮", bg: "linear-gradient(135deg, #c59bff, #4c2a7a)" },
  Glenn: { icon: "⚔️", bg: "linear-gradient(135deg, #8ec5ff, #2e4f96)" }
};
const GLENN_BASE = {
  id: "glenn",
  name: "Glenn",
  role: "Knight Vanguard",
  level: 0,
  maxHp: 66,
  maxMp: 20,
  hp: 66,
  mp: 20,
  atk: 11,
  def: 6,
  spd: 6,
  critChance: 5,
  critDamage: 0,
  combustionChance: 0,
  evasion: 4,
  blockRate: 0,
  escapeChance: 0,
  manaRegen: 0,
  description: "Ksatria garis depan dengan pertahanan kokoh dan serangan stabil.",
  story: "Glenn adalah mantan penjaga gerbang utara yang meninggalkan pos demi melindungi desa-desa kecil dari serangan bandit.",
  basicAttack: { name: "Iron Slash", desc: "Serangan pedang standar yang konsisten untuk membuka pertarungan." },
  activeSkills: [
    { name: "Shield Break", desc: "Tebasan berat yang menurunkan DEF target sebesar 15% selama 2 turn.", power: 10, mpCost: 4, cooldown: 3, type: "debuff" },
    { name: "Guard Stance", desc: "Menaikkan DEF Glenn 25% selama 2 turn.", power: 6, mpCost: 6, cooldown: 5, type: "buff" }
  ],
  passiveSkill: { name: "Last Bastion", desc: "Saat HP di bawah 35%, DEF bertambah 20% otomatis." },
  xp: 0,
  xpToLevel: 50,
  equipment: { hand:null, head:null, pant:null, armor:null, shoes:null },
  equipmentBonus: { atk:0, def:0, spd:0, evasion:0 },
  statuses: []
};
const SHOP_GOODS = [
  { name:"Potion", price:12, ref: ITEMS.potion },
  { name:"Ether", price:18, ref: ITEMS.ether },
  { name:"Wooden Sword", price:30, ref: ITEMS.woodenSword },
  { name:"Cloth Hat", price:20, ref: ITEMS.clothHat },
  { name:"Leather Armor", price:40, ref: ITEMS.leatherArmor },
  { name:"Leather Pants", price:28, ref: ITEMS.leatherPants },
  { name:"Old Boots", price:22, ref: ITEMS.oldBoots },
  { name:"Bronze Sword", price:55, ref: ITEMS.bronzeSword },
  { name:"Iron Sword", price:85, ref: ITEMS.ironSword },
  { name:"Rune Blade", price:120, ref: ITEMS.runeBlade },
  { name:"Leather Hood", price:35, ref: ITEMS.leatherHood },
  { name:"Iron Helm", price:75, ref: ITEMS.ironHelm },
  { name:"Chain Vest", price:60, ref: ITEMS.chainVest },
  { name:"Steel Armor", price:110, ref: ITEMS.steelArmor },
  { name:"Traveler Pants", price:48, ref: ITEMS.travelerPants },
  { name:"Iron Greaves", price:90, ref: ITEMS.ironGreaves },
  { name:"Swift Boots", price:68, ref: ITEMS.swiftBoots },
];
const SHOP_SKILLS = [
  { key:"fireball", level:1, price:18 },
  { key:"fireArrow", level:3, price:65 },
  { key:"blazingShield", level:10, price:180 },
  { key:"echoStrike", level:10, price:180 },
];
const SKILL_SHOP_CATEGORIES = [
  { key:"fire", label:"Fire", iconSrc:"./assets/icons/fire.svg" },
  { key:"wind", label:"Wind", iconSrc:"./assets/icons/wind.svg" },
  { key:"thunder", label:"Thunder", iconSrc:"./assets/icons/lightning.svg" },
  { key:"rock", label:"Rock", iconSrc:"./assets/icons/earth.svg" },
  { key:"water", label:"Water", iconSrc:"./assets/icons/water.svg" },
  { key:"physical", label:"Physical Arts", iconSrc:"./assets/icons/physical.svg" },
  { key:"universal", label:"Universal", iconSrc:"./assets/icons/universal.svg" },
];


/* ===== engine.js ===== */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const randFloat = (a,b) => (Math.random()*(b-a))+a;
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
const MAX_CHAR_SLOTS = 6;
const STAT_POINTS_PER_LEVEL = 1;
const MAX_LEVEL = 10;
const MAX_ALLIES = 2;
const TURN_DELAY_MS = 650;
const ALLY_ACTION_GAP_MS = 420;
const ENEMY_ACTION_GAP_MS = 360;
const AUTO_TURN_DELAY_MS = 380;
function genEnemy(plv){
  const lvl = clamp(plv + pick([-1,0,0,1]), 1, MAX_LEVEL);
  const name = pick(ENEMY_NAMES);
  const enemy = {
    name,
    level:lvl,
    maxHp:28 + lvl*10, maxMp:12 + lvl*4,
    hp:28 + lvl*10, mp:12 + lvl*4,
    atk:7 + lvl*3, def:3 + lvl*2, spd:4 + lvl*2,
    str: Math.max(0, lvl),
    dex: Math.max(0, Math.floor(lvl * 0.6)),
    int: Math.max(0, Math.floor(lvl * 0.6)),
    vit: Math.max(0, Math.floor(lvl * 1.2)),
    critChance: clamp(5 + Math.floor(lvl/3), 5, 35),
    critDamage: 0,
    acc: Math.max(0, Math.floor(lvl / 6)),
    foc: 0,
    combustionChance: 0,
    evasion: clamp(2 + Math.floor(lvl / 8), 2, 10),
    baseBlockRate: 0,
    baseEscapeChance: clamp(2 + Math.floor(lvl / 8), 2, 10),
    blockRate: 0,
    escapeChance: 0,
    manaRegen: 0,
    statuses: [],
    xpReward:18 + lvl*6, goldReward:8 + lvl*4
  };
  applyDerivedStats(enemy);
  enemy.blockRate = 0;
  return enemy;
}
function genEnemyWithName(plv, name) {
  const enemy = genEnemy(plv);
  enemy.name = name;
  return enemy;
}
function calcDamage(attAtk, defDef, basePower, defending){
  const variance = randInt(-2,3);
  let raw = (attAtk + basePower) - defDef + variance;
  let dmg = clamp(raw, 1, 9999);
  if(defending) dmg = Math.max(1, Math.floor(dmg/2));
  return dmg;
}

function resolveAttack(att, def, basePower, opts = {}) {
  // opts: { dodgeBonus: number }
  const dodgeBonus = opts.dodgeBonus || 0;

  const accuracyDown = hasStatus(att, "accuracyDown") ? 0.8 : 1;
  const effectiveAcc = Math.max(0, Math.round((att.acc || 0) * accuracyDown));
  const evasion = clamp(((def.evasion || 0) + dodgeBonus) - effectiveAcc, 0, 95);
  const rollEv = randInt(1, 100);
  if (rollEv <= evasion) {
    return { missed: true, crit: false, combustion: false, dmg: 0, evasion, rollEv, rollCrit: null, rollComb: null };
  }

  const atkPower = hasStatus(att, "strengthen")
    ? Math.round((att.atk || 0) * 1.2)
    : (att.atk || 0);
  const guardDefBoost = hasStatus(def, "guardStance") ? Math.round((def.def || 0) * 0.35) : 0;
  const armorBreakPenalty = hasStatus(def, "armorBreak") ? Math.round((def.def || 0) * 0.15) : 0;
  const penetrationDef = Math.max(0, Number(att.penetrationDef || 0));
  const effectiveDef = Math.max(0, (def.def || 0) + guardDefBoost - armorBreakPenalty - penetrationDef);
  let dmg = calcDamage(atkPower, effectiveDef, basePower, false);

  const critChance = clamp(att.critChance || 0, 0, 100);
  const rollCrit = randInt(1, 100);
  let crit = false;
  if (rollCrit <= critChance) {
    // Critical damage starts from 0% bonus.
    // Base crit multiplier: 1.8x - 2.0x, then multiplied by (1 + critDamage%).
    const baseMult = randFloat(1.8, 2.0);
    const bonus = Math.max(0, (att.critDamage || 0)) / 100;
    dmg = Math.max(1, Math.round(dmg * baseMult * (1 + bonus)));
    crit = true;
  }

  const combustionChance = clamp(att.combustionChance || 0, 0, 100);
  const rollComb = randInt(1, 100);
  let combustion = false;
  if (rollComb <= combustionChance) {
    const combMult = randFloat(1.5, 1.9);
    dmg = Math.max(1, Math.round(dmg * combMult));
    combustion = true;
  }

  const blockPct = clamp(def.blockRate || 0, 0, 90);
  let blocked = 0;
  let reflected = 0;
  if (blockPct > 0) {
    blocked = Math.round(dmg * (blockPct / 100));
    if (blocked > 0) {
      dmg = Math.max(0, dmg - blocked);
      reflected = blocked;
    }
  }

  return { missed: false, crit, combustion, dmg, evasion, rollEv, rollCrit, rollComb, blocked, reflected };
}
function escapeChance(p,e){
  return clamp(50 + (p.spd - e.spd)*8, 10, 90);
}

function dodgeChance(p,e){
  // Base dodge chance based on SPD difference
  return clamp(10 + (p.spd - e.spd) * 6, 5, 45);
}


/* ===== state.js ===== */
function createStarterAlly(level = 0){
  const lv = clamp(Number(level) || 0, 0, MAX_LEVEL);
  const maxHp = GLENN_BASE.maxHp + (lv - 1) * 10;
  const maxMp = GLENN_BASE.maxMp + (lv - 1) * 4;
  return {
    ...GLENN_BASE,
    level: lv,
    maxHp,
    maxMp,
    hp: maxHp,
    mp: maxMp,
    atk: GLENN_BASE.atk + (lv - 1) * 2,
    def: GLENN_BASE.def + (lv - 1) * 2,
    spd: GLENN_BASE.spd + (lv - 1),
    xp: 0,
    xpToLevel: Math.max(50, 50 + (lv - 1) * 15),
    activeSkills: GLENN_BASE.activeSkills.map((s) => ({ ...s })),
    passiveSkill: { ...GLENN_BASE.passiveSkill },
    basicAttack: { ...GLENN_BASE.basicAttack },
    equipment: { hand:null, head:null, pant:null, armor:null, shoes:null },
    equipmentBonus: { atk:0, def:0, spd:0, evasion:0 },
    statuses: []
  };
}

function newPlayer(){
  return {
    name:"Hero",
    gender:"male",
    level:1,

    // Base stats (for future scaling)
    str:0, dex:0, int:0, vit:0, foc:0,
    statPoints:1,
    _spBaseGranted:true,
    baseBlockRate:0,
    baseEscapeChance:0,

    // Derived / combat stats (currently flat)
    maxHp:60, maxMp:25,
    hp:60, mp:25,
    atk:10, def:4, spd:7,
    acc:0,
    penetrationDef:0,
    critChance:5, critDamage:0, combustionChance:0, evasion:5,
    manaRegen:5,
    blockRate:0,
    escapeChance:0,
    statuses: [],
    equipment: { hand:null, head:null, pant:null, armor:null, shoes:null },
    equipmentBonus: { atk:0, def:0, spd:0, evasion:0, penetrationDef:0 },

    deprecatedSkillCooldown:0,
    xp:0, xpToLevel:50,
    gold:0,
    gems:0,
    allies: [],
    glennUnlocked: false,
    highestStageCleared: 0,
    skills:[{ ...SKILLS.fireball, cdLeft:0 }],
    skillSlots: ["Fireball", null, null, null, null, null, null, null],
    inv: { "Potion": { ...ITEMS.potion, qty:2 }, "Ether": { ...ITEMS.ether, qty:1 } }
  };
}

function normalizeAlly(ally){
  if (!ally) return null;
  const level = clamp(Number(ally.level) || 0, 0, MAX_LEVEL);
  const maxHp = Math.max(1, Number(ally.maxHp) || 1);
  const maxMp = Math.max(0, Number(ally.maxMp) || 0);
  const hpRaw = Number(ally.hp);
  const mpRaw = Number(ally.mp);
  const hp = clamp(Number.isFinite(hpRaw) ? hpRaw : maxHp, 0, maxHp);
  const mp = clamp(Number.isFinite(mpRaw) ? mpRaw : maxMp, 0, maxMp);
  return {
    ...ally,
    level,
    maxHp,
    maxMp,
    hp,
    mp,
    atk: Number(ally.atk) || 1,
    def: Number(ally.def) || 0,
    spd: Number(ally.spd) || 0,
    critChance: Number(ally.critChance) || 0,
    critDamage: Number(ally.critDamage) || 0,
    combustionChance: Number(ally.combustionChance) || 0,
    evasion: Number(ally.evasion) || 0,
    blockRate: Number(ally.blockRate) || 0,
    escapeChance: Number(ally.escapeChance) || 0,
    manaRegen: Number(ally.manaRegen) || 0,
    statuses: Array.isArray(ally.statuses) ? ally.statuses : [],
    role: ally.role || "Ally",
    name: ally.name || "Ally",
    description: ally.description || "",
    story: ally.story || "",
    xp: Math.max(0, Number(ally.xp) || 0),
    xpToLevel: Math.max(1, Number(ally.xpToLevel) || 50),
    basicAttack: {
      name: ally.basicAttack?.name || GLENN_BASE.basicAttack.name,
      desc: ally.basicAttack?.desc || GLENN_BASE.basicAttack.desc
    },
    activeSkills: Array.isArray(ally.activeSkills) && ally.activeSkills.length
      ? ally.activeSkills.slice(0, 2).map((skill, idx) => {
        const skillName = skill?.name || GLENN_BASE.activeSkills[idx]?.name || `Active ${idx + 1}`;
        const baseRef = GLENN_BASE.activeSkills.find((baseSkill) => baseSkill.name === skillName) || GLENN_BASE.activeSkills[idx] || {};
        return {
          name: skillName,
          desc: baseRef.desc || skill?.desc || "",
          cooldown: Math.max(1, Number(baseRef.cooldown) || Number(skill?.cooldown) || 1),
          cdLeft: Math.max(0, Number(skill?.cdLeft) || 0),
          power: Math.max(1, Number(baseRef.power) || Number(skill?.power) || 4),
          mpCost: Math.max(0, Number(baseRef.mpCost) || Number(skill?.mpCost) || 0),
          type: baseRef.type || skill?.type || "damage"
        };
      })
      : GLENN_BASE.activeSkills.map((skill) => ({ ...skill, cdLeft: 0 })),
    passiveSkill: {
      name: ally.passiveSkill?.name || GLENN_BASE.passiveSkill.name,
      desc: ally.passiveSkill?.desc || GLENN_BASE.passiveSkill.desc
    },
    equipment: { hand:null, head:null, pant:null, armor:null, shoes:null },
    equipmentBonus: { atk:0, def:0, spd:0, evasion:0 }
  };
}


function normalizePlayer(p){
  if (!p) return p;

  if (!Array.isArray(p.allies)) p.allies = [];
  p.allies = p.allies.map(normalizeAlly).filter(Boolean).slice(0, 1);
  if (typeof p.glennUnlocked !== "boolean") p.glennUnlocked = p.allies.some((ally) => ally?.id === "glenn" || ally?.name === "Glenn");
  p.highestStageCleared = Math.max(0, Number(p.highestStageCleared) || 0);
  if (typeof p._allyStarterInit !== "boolean") p._allyStarterInit = false;

  // Base stats
  if (typeof p.gender !== "string") p.gender = "male";
  if (typeof p.str !== "number") p.str = 0;
  if (typeof p.dex !== "number") p.dex = 0;
  if (typeof p.int !== "number") p.int = 0;
  if (typeof p.vit !== "number") p.vit = 0;
  if (typeof p.foc !== "number") {
    // migrate from older saves using `luk`
    if (typeof p.luk === "number") p.foc = p.luk;
    else p.foc = 0;
  }
  if (typeof p.statPoints !== "number") p.statPoints = 0;

  // Grant 1 stat point at level 1 (migration-safe)
  if (!p._spBaseGranted) {
    p.statPoints += 1;
    p._spBaseGranted = true;
  }

  // Derived / combat stats
  if (typeof p.acc !== "number") p.acc = 0;
  if (typeof p.penetrationDef !== "number") p.penetrationDef = 0;
  if (typeof p.combustionChance !== "number") p.combustionChance = 0;

  if (typeof p.critDamage !== "number") {
    p.critDamage = 0; // critical damage bonus % (starts at 0)
  } else if (p.critDamage >= 100) {
    // Migration from old system (e.g., 150% meaning +50%) → store bonus only.
    p.critDamage = Math.max(0, p.critDamage - 100);
  }
  if (typeof p.critChance !== "number") p.critChance = 0;
  if (typeof p.evasion !== "number") p.evasion = 0;
  if (typeof p.baseBlockRate !== "number") p.baseBlockRate = 0;
  if (typeof p.baseEscapeChance !== "number") p.baseEscapeChance = 0;
  if (typeof p.manaRegen !== "number") p.manaRegen = 5;
  if (typeof p.blockRate !== "number") p.blockRate = 0;
  if (typeof p.escapeChance !== "number") p.escapeChance = 0;
  if (!Array.isArray(p.statuses)) p.statuses = [];
  if (typeof p.equipment !== "object" || p.equipment === null) {
    p.equipment = { hand:null, head:null, pant:null, armor:null, shoes:null };
  } else {
    p.equipment.hand ??= null;
    p.equipment.head ??= null;
    p.equipment.pant ??= null;
    p.equipment.armor ??= null;
    p.equipment.shoes ??= null;
  }
  if (!p.equipmentBonus || typeof p.equipmentBonus !== "object") {
    p.equipmentBonus = { atk:0, def:0, spd:0, evasion:0, penetrationDef:0 };
  } else {
    p.equipmentBonus.atk = Number(p.equipmentBonus.atk || 0);
    p.equipmentBonus.def = Number(p.equipmentBonus.def || 0);
    p.equipmentBonus.spd = Number(p.equipmentBonus.spd || 0);
    p.equipmentBonus.evasion = Number(p.equipmentBonus.evasion || 0);
    p.equipmentBonus.penetrationDef = Number(p.equipmentBonus.penetrationDef || 0);
  }
  if (!Array.isArray(p.skills)) p.skills = [];
  p.skills = p.skills.map((skill) => {
    if (!skill || !skill.name) return skill;
    if (skill.name === "Blazing Shield") skill.name = "Blazing Aura";
    const template = Object.values(SKILLS).find((entry) => entry && entry.name === skill.name);
    if (!template) return skill;
    return { ...template, ...skill, icon: skill.icon || template.icon };
  });
  if (!Array.isArray(p.skillSlots)) {
    const slots = Array.from({ length: 8 }, (_, i) => {
      const skill = p.skills[i];
      return skill ? skill.name : null;
    });
    p.skillSlots = slots;
  } else {
    p.skillSlots = Array.from({ length: 8 }, (_, i) => {
      const entry = p.skillSlots[i];
      if (!entry) return null;
      if (typeof entry === "string") return entry;
      if (typeof entry === "object" && entry.name) return entry.name;
      return null;
    });
    p.skillSlots = p.skillSlots.map((entry) => (entry === "Blazing Shield" ? "Blazing Aura" : entry));
  }

  // Safety defaults (older saves)
  if (typeof p.level !== "number") p.level = 1;
  if (typeof p.name !== "string") p.name = "Hero";
  if (typeof p.gems !== "number") p.gems = 0;

  applyDerivedStats(p);
  applyEquipmentStats(p);
  return p;
}

function applyDerivedStats(p){
  if (!p) return;
  if (typeof p.baseBlockRate !== "number") p.baseBlockRate = 0;
  if (typeof p.baseEscapeChance !== "number") p.baseEscapeChance = 0;
  if (!Array.isArray(p.statuses)) p.statuses = [];

  const intVal = Math.max(0, p.int || 0);
  const vitVal = Math.max(0, p.vit || 0);

  p.manaRegen = Math.max(1, Math.floor((p.maxMp || 0) * 0.06) + Math.floor(intVal * 0.8));
  p.blockRate = clamp(Math.round(p.baseBlockRate + vitVal * 1.2), 0, 80);
  p.escapeChance = clamp(Math.round(p.baseEscapeChance + intVal * 1.3), 0, 95);
}

function getItemRef(name, player){
  if (!name) return null;
  const p = player || state?.player;
  const invItem = p && p.inv ? p.inv[name] : null;
  if (invItem) return invItem;
  const shopItem = getShopItem(name);
  return shopItem ? shopItem.ref : null;
}

function calcEquipmentBonus(player){
  const p = player;
  const bonus = { atk:0, def:0, spd:0, evasion:0, penetrationDef:0 };
  if (!p || !p.equipment) return bonus;
  Object.values(p.equipment).forEach((name) => {
    const it = getItemRef(name, p);
    if (!it) return;
    if (typeof it.atk === "number") bonus.atk += it.atk;
    if (typeof it.def === "number") bonus.def += it.def;
    if (typeof it.spd === "number") bonus.spd += it.spd;
    if (typeof it.evasion === "number") bonus.evasion += it.evasion;
    if (typeof it.penetrationDef === "number") bonus.penetrationDef += it.penetrationDef;
  });
  return bonus;
}

function applyEquipmentStats(player){
  const p = player;
  if (!p) return;
  const prev = p.equipmentBonus || { atk:0, def:0, spd:0, evasion:0, penetrationDef:0 };
  const next = calcEquipmentBonus(p);
  p.atk = Math.max(0, (p.atk || 0) - (prev.atk || 0) + next.atk);
  p.def = Math.max(0, (p.def || 0) - (prev.def || 0) + next.def);
  p.spd = Math.max(0, (p.spd || 0) - (prev.spd || 0) + next.spd);
  p.evasion = clamp((p.evasion || 0) - (prev.evasion || 0) + next.evasion, 0, 100);
  p.penetrationDef = Math.max(0, (p.penetrationDef || 0) - (prev.penetrationDef || 0) + (next.penetrationDef || 0));
  p.equipmentBonus = next;
}


function newState(){
  const player = normalizePlayer(newPlayer());
  return {
    // Character profiles
    slots: Array.from({ length: MAX_CHAR_SLOTS }, () => null),
    activeSlot: 0,

    // Current runtime
    player,
    allies: player.allies,
    enemy: null,
    enemyTargetIndex: 0,
    inBattle: false,
    battleResult: null,
    shopMarketCategory: "consumable",
    shopEquipCategory: "weapon",
    skillShopCategory: "fire",
    inventoryCategory: "item",
    playerDefending: false,
    autoBattleEnabled: false,
    autoBattleUseConsumable: false,
    _autoBattlePending: false,
    monsterHuntSelectedBoss: "wyrm10",
    turn: "town",
    battleTurn: 0 // "town" | "player" | "enemy"
  };
}



/* ===== storage.js ===== */
const SAVE_KEY = "text_rpg_save_modular_v1";

// Beberapa browser / mode (mis. Safari Private, embedded webview tertentu,
// atau ketika storage diblokir) bisa melempar error saat akses localStorage.
// Kalau error ini tidak ditangani, setelah klik Save script bisa error dan
// terasa seperti tombol lain "tidak bisa disentuh".
function safeSet(key, value){
  try{
    localStorage.setItem(key, value);
    return true;
  }catch(err){
    console.error("[SAVE] localStorage.setItem gagal:", err);
    return false;
  }
}

function safeGet(key){
  try{
    return localStorage.getItem(key);
  }catch(err){
    console.error("[LOAD] localStorage.getItem gagal:", err);
    return null;
  }
}
function safeRemove(key){
  try{
    localStorage.removeItem(key);
    return true;
  }catch(err){
    console.error("[SAVE] localStorage.removeItem gagal:", err);
    return false;
  }
}
function emptyProfilePayload(){
  return {
    v: 2,
    t: Date.now(),
    activeSlot: 0,
    slots: Array.from({ length: MAX_CHAR_SLOTS }, () => null),
  };
}

function normalizeProfilePayload(payload){
  if (!payload) return emptyProfilePayload();

  // New format: {slots, activeSlot}
  if (Array.isArray(payload.slots)) {
    const out = emptyProfilePayload();
    out.t = payload.t || Date.now();
    out.activeSlot = clamp(
      (typeof payload.activeSlot === "number" ? payload.activeSlot : 0),
      0,
      MAX_CHAR_SLOTS - 1
    );

    for (let i = 0; i < MAX_CHAR_SLOTS; i++){
      const slot = payload.slots[i];
      const normalized = slot ? normalizePlayer(slot) : null;
      if (normalized && typeof normalized.charId !== "number") {
        normalized.charId = i;
      }
      out.slots[i] = normalized;
    }
    return out;
  }

  // Old format: {player}
  if (payload.player) {
    const out = emptyProfilePayload();
    out.t = payload.t || Date.now();
    out.activeSlot = 0;
    out.slots[0] = normalizePlayer(payload.player);
    return out;
  }

  return emptyProfilePayload();
}

function getProfilePayloadFromState(){
  const out = emptyProfilePayload();
  out.activeSlot = clamp(
    (typeof state.activeSlot === "number" ? state.activeSlot : 0),
    0,
    MAX_CHAR_SLOTS - 1
  );
  out.slots = Array.from({ length: MAX_CHAR_SLOTS }, (_, i) => {
    const slot = state.slots && state.slots[i];
    if (!slot) return null;
    const normalized = normalizePlayer(slot);
    if (typeof normalized.charId !== "number") normalized.charId = i;
    return normalized;
  });

  // Persist current player into active slot
  if (state.player) {
    const normalized = normalizePlayer(state.player);
    if (typeof normalized.charId !== "number") normalized.charId = out.activeSlot;
    out.slots[out.activeSlot] = normalized;
  }

  out.t = Date.now();
  return out;
}

function resetToEmptyProfile(){
  const profile = emptyProfilePayload();
  state.slots = profile.slots;
  state.activeSlot = profile.activeSlot;
  state.player = normalizePlayer(newPlayer());
  ensureAllies();

  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  setAutoBattleEnabled(false);
  setTurn("town");
  state.battleTurn = 0;
  refresh(state);
}

function autosave(state){
  const payload = getProfilePayloadFromState();
  return safeSet(SAVE_KEY, JSON.stringify(payload));
}
function save(state){
  return autosave(state) === true;
}
function load(){
  const raw = safeGet(SAVE_KEY);
  if(!raw) return null;
  try{
    const payload = JSON.parse(raw);
    return payload || null;
  }catch{
    return null;
  }
}



// ===== cloud save (Pages Functions + D1) =====
async function apiJson(path, opts = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { res, data };
}

async function mailboxList() {
  return apiJson("/api/mailbox-list?limit=50");
}

async function mailboxMarkRead(id) {
  return apiJson("/api/mailbox-read", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

async function mailboxClaim(id) {
  return apiJson("/api/mailbox-claim", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

async function mailboxClaimAll() {
  return apiJson("/api/mailbox-claim-all", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

async function mailboxDeleteAll() {
  return apiJson("/api/mailbox-delete-all", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

function formatMailboxTime(epochSec) {
  if (!epochSec) return "";
  try {
    return new Date(epochSec * 1000).toLocaleString("id-ID");
  } catch {
    return "";
  }
}

const mailboxState = {
  items: [],
  tab: "all",
  selected: null,
};

function hasUnclaimedMailboxRewards(items) {
  if (!Array.isArray(items)) return false;
  const now = Math.floor(Date.now() / 1000);
  return items.some((item) => {
    const attachments = Array.isArray(item?.attachments) ? item.attachments : [];
    const isExpired = Number(item?.expires_at || 0) > 0 && Number(item.expires_at) <= now;
    return attachments.length > 0 && !item?.claimed_at && !isExpired;
  });
}

function updateMailboxHeaderActions() {
  const claimAllBtn = byId("mailboxClaimAll");
  if (claimAllBtn) {
    const hasClaimable = hasUnclaimedMailboxRewards(mailboxState.items);
    claimAllBtn.disabled = !hasClaimable;
  }

  const deleteAllBtn = byId("mailboxDeleteAll");
  if (deleteAllBtn) {
    deleteAllBtn.disabled = hasUnclaimedMailboxRewards(mailboxState.items);
  }
}

function updateMailboxBadge(items) {
  const btn = byId("mailButton");
  if (!btn) return;
  const hasUnread = Array.isArray(items) && items.some((item) => !item.read_at);
  btn.classList.toggle("hasUnread", hasUnread);
}

async function refreshMailboxBadge() {
  const { res, data } = await mailboxList();
  if (!res.ok) {
    updateMailboxBadge([]);
    return;
  }
  updateMailboxBadge(data?.items || []);
}

function getMailboxOverlay() {
  return byId("mailboxOverlay");
}

function setMailboxOverlayVisible(visible) {
  const overlay = getMailboxOverlay();
  if (!overlay) return;
  overlay.classList.toggle("hidden", !visible);
  overlay.setAttribute("aria-hidden", visible ? "false" : "true");
}

function renderMailboxList() {
  const list = byId("mailboxList");
  if (!list) return;
  list.innerHTML = "";

  const filtered = mailboxState.tab === "unclaimed"
    ? mailboxState.items.filter((item) => !item.claimed_at)
    : mailboxState.items.slice();

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "mailboxEmptyText";
    empty.textContent = mailboxState.tab === "unclaimed" ? "Tidak ada pesan belum claim." : "Inbox kosong.";
    list.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("div");
    const unread = !item.read_at;
    card.className = `mailItem${unread ? " mailItemUnread" : ""}`;

    const hasRewards = Array.isArray(item.attachments) && item.attachments.length > 0 && !item.claimed_at;
    const metaText = [formatMailboxTime(item.created_at), item.source].filter(Boolean).join(" • ");
    const statusIcon = item.claimed_at
      ? `<span class="mailStatusIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M6 12.5 10 16l8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>`
      : (!item.read_at ? "" : `<span class="mailStatusIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 7.5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17V9A1.5 1.5 0 0 1 4 7.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="m3.5 9 8.5 5 8.5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>`);
    const statusText = item.claimed_at ? "Claimed" : (item.read_at ? "Read" : "");

    card.innerHTML = `
      <div class="mailAvatar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6.5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 17.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="m3.5 8 8.5 5 8.5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ${hasRewards ? "<span class=\"mailRewardBadge\">★</span>" : ""}
      </div>
      <div>
        <div class="mailTitle">${escapeHtml(item.title || "Mailbox")}</div>
        <div class="mailBody">${escapeHtml(item.body || "")}</div>
        <div class="mailMeta">${escapeHtml(metaText)}</div>
      </div>
      <div class="mailStatus">${statusIcon}${escapeHtml(statusText)}</div>
    `;
    card.onclick = () => openMailboxDetail(item.id);
    list.appendChild(card);
  });
}

function renderMailboxDetail(item) {
  const detail = byId("mailboxDetail");
  if (!detail) return;
  const title = byId("mailboxDetailTitle");
  const sender = byId("mailboxDetailSender");
  const body = byId("mailboxDetailBody");
  const grid = byId("mailboxRewardsGrid");
  const claimBtn = byId("mailboxClaimBtn");

  if (title) title.textContent = item?.title || "Mail";
  if (sender) sender.textContent = item?.source || "System";
  if (body) body.textContent = item?.body || "";
  if (grid) grid.innerHTML = "";

  const attachments = Array.isArray(item?.attachments) ? item.attachments : [];
  if (grid) {
    if (attachments.length === 0) {
      const empty = document.createElement("div");
      empty.className = "rewardCard";
      empty.innerHTML = `
        <div class="rewardAvatar">?</div>
        <div>Tidak ada hadiah</div>
      `;
      grid.appendChild(empty);
    } else {
      attachments.forEach((reward) => {
        const card = document.createElement("div");
        card.className = "rewardCard";
        const name = reward?.name || reward?.type || "Reward";
        const amount = reward?.amount ? `x${reward.amount}` : "";
        card.innerHTML = `
          <div class="rewardAvatar">${escapeHtml(String(name).slice(0, 1).toUpperCase())}</div>
          <div>${escapeHtml(`${name} ${amount}`.trim())}</div>
        `;
        grid.appendChild(card);
      });
    }
  }

  if (claimBtn) {
    const canClaim = attachments.length > 0 && !item?.claimed_at;
    claimBtn.disabled = !canClaim;
    claimBtn.textContent = item?.claimed_at ? "Claimed" : "Claim";
  }
}

function setMailboxDetailOpen(open) {
  const detail = byId("mailboxDetail");
  if (!detail) return;
  detail.classList.toggle("open", open);
  detail.setAttribute("aria-hidden", open ? "false" : "true");
}

async function openMailboxDetail(id) {
  const item = mailboxState.items.find((entry) => entry.id === id);
  if (!item) return;
  if (!item.read_at) {
    await mailboxMarkRead(id);
    await refreshMailboxItems();
  }
  mailboxState.selected = id;
  const refreshed = mailboxState.items.find((entry) => entry.id === id) || item;
  renderMailboxDetail(refreshed);
  setMailboxDetailOpen(true);
}

async function refreshMailboxItems() {
  const { res, data } = await mailboxList();
  if (!res.ok) {
    mailboxState.items = [];
    renderMailboxList();
    updateMailboxBadge([]);
    updateMailboxHeaderActions();
    return;
  }
  mailboxState.items = Array.isArray(data?.items) ? data.items : [];
  updateMailboxBadge(mailboxState.items);
  renderMailboxList();
  updateMailboxHeaderActions();
}

async function openMailboxOverlay() {
  setMailboxOverlayVisible(true);
  await refreshMailboxItems();
  setMailboxDetailOpen(false);
}

function closeMailboxOverlay() {
  setMailboxOverlayVisible(false);
  setMailboxDetailOpen(false);
  mailboxState.selected = null;
}

async function cloudMe() {
  const { res, data } = await apiJson("/api/me");
  if (!res.ok) return null;
  return data?.user || null;
}

async function cloudSavePayload(payload) {
  const { res, data } = await apiJson("/api/save", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  return { ok: res.ok, data };
}

async function cloudLoadPayload() {
  const { res, data } = await apiJson("/api/load");
  if (res.status === 401) return { ok: false, unauth: true, data };
  return { ok: res.ok, data };
}

async function cloudLogout(){
  // Backend may implement /api/logout to clear cookie session.
  try { await apiJson("/api/logout", { method: "POST" }); } catch (e) {}
  cloudUserCache = null;
  return true;
}



let cloudUserCache = null;
async function ensureCloudUser() {
  if (cloudUserCache) return cloudUserCache;
  cloudUserCache = await cloudMe();
  return cloudUserCache;
}

async function cloudTrySaveCurrentProfile() {
  const me = await ensureCloudUser();
  if (!me) return { ok: false, skipped: true, reason: "unauth" };

  const payload = getProfilePayloadFromState();
  const r = await cloudSavePayload(payload);
  return { ok: !!r.ok, skipped: false, data: r.data };
}

/* ===== ui.js ===== */
const $ = (id) => document.getElementById(id);

// Avatar animations (critical / dodge)
function playCritShake(target) {
  const el = $(target === "player" ? "pAvatarBox" : "eAvatarBox");
  if (!el) return;
  el.classList.remove("critShake");
  // restart animation
  void el.offsetWidth;
  el.classList.add("critShake");
  setTimeout(() => el.classList.remove("critShake"), 450);
}

function playDodgeFade(target) {
  const el = $(target === "player" ? "pAvatarBox" : "eAvatarBox");
  if (!el) return;
  el.classList.remove("dodgeFade");
  void el.offsetWidth;
  el.classList.add("dodgeFade");
  setTimeout(() => el.classList.remove("dodgeFade"), 450);
}

function playSlash(target, delay = 0) {
  const el = $(target === "player" ? "pAvatarBox" : "eAvatarBox");
  if (!el) return;
  const spawn = () => {
    const prev = el.querySelector(".slashHit");
    if (prev) prev.remove();
    const slash = document.createElement("div");
    slash.className = "slashHit";
    el.appendChild(slash);
    slash.addEventListener("animationend", () => slash.remove(), { once: true });
  };
  if (delay > 0) setTimeout(spawn, delay);
  else spawn();
}

function getEnemyAvatarBoxByIndex(index){
  if (index === 0) return $("eAvatarBox");
  return document.querySelector(`.enemyCard.extra[data-enemy-index="${index}"] .enemyAvatarBox`);
}

function isEnemyAliveByIndex(enemyIndex){
  const idx = Number(enemyIndex);
  if (!Number.isFinite(idx)) return false;
  if (idx !== 0) {
    const card = document.querySelector(`.enemyCard.extra[data-enemy-index="${idx}"]`);
    if (card && (card.classList.contains("down") || card.classList.contains("enemyDown"))) {
      return false;
    }
  }
  const queue = getEnemyQueue();
  const enemy = queue[idx];
  return !!(enemy && enemy.hp > 0);
}

function playEnemySlash(enemyIndex, delay = 0){
  if (!isEnemyAliveByIndex(enemyIndex)) return;
  const el = getEnemyAvatarBoxByIndex(enemyIndex);
  if (!el) return;
  const spawn = () => {
    const prev = el.querySelector(".slashHit");
    if (prev) prev.remove();
    const slash = document.createElement("div");
    slash.className = "slashHit";
    el.appendChild(slash);
    slash.addEventListener("animationend", () => slash.remove(), { once: true });
  };
  if (delay > 0) setTimeout(spawn, delay);
  else spawn();
}

function playEnemyDodgeFade(enemyIndex){
  if (!isEnemyAliveByIndex(enemyIndex)) return;
  const el = getEnemyAvatarBoxByIndex(enemyIndex);
  if (!el) return;
  el.classList.remove("dodgeFade");
  void el.offsetWidth;
  el.classList.add("dodgeFade");
  setTimeout(() => el.classList.remove("dodgeFade"), 450);
}

function playEnemyCritShake(enemyIndex){
  if (!isEnemyAliveByIndex(enemyIndex)) return;
  const el = getEnemyAvatarBoxByIndex(enemyIndex);
  if (!el) return;
  el.classList.remove("critShake");
  void el.offsetWidth;
  el.classList.add("critShake");
  setTimeout(() => el.classList.remove("critShake"), 450);
}

function getAllyAvatarBox(ally){
  if (!ally) return null;
  if (ally.id) {
    const byId = document.querySelector(`.allyAvatarBox[data-ally-id="${ally.id}"]`);
    if (byId) return byId;
  }
  if (!Array.isArray(state.allies)) return null;
  const idx = state.allies.indexOf(ally);
  if (idx < 0) return null;
  const slotIndex = idx + 1;
  return document.querySelector(`.allyCard.extra[data-ally-slot="${slotIndex}"] .allyAvatarBox`);
}

function playAllySlash(ally, delay = 0){
  const el = getAllyAvatarBox(ally);
  if (!el) return;
  const spawn = () => {
    const prev = el.querySelector(".slashHit");
    if (prev) prev.remove();
    const slash = document.createElement("div");
    slash.className = "slashHit";
    el.appendChild(slash);
    slash.addEventListener("animationend", () => slash.remove(), { once: true });
  };
  if (delay > 0) setTimeout(spawn, delay);
  else spawn();
}

function playAllyDodgeFade(ally){
  const el = getAllyAvatarBox(ally);
  if (!el) return;
  el.classList.remove("dodgeFade");
  void el.offsetWidth;
  el.classList.add("dodgeFade");
  setTimeout(() => el.classList.remove("dodgeFade"), 450);
}

function playAllyCritShake(ally){
  const el = getAllyAvatarBox(ally);
  if (!el) return;
  el.classList.remove("critShake");
  void el.offsetWidth;
  el.classList.add("critShake");
  setTimeout(() => el.classList.remove("critShake"), 450);
}

function timeStr() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

let toastTimer = null;
function showToast(msg, tag) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast";

  const t = String(tag || "").toLowerCase();
  if (["xp", "exp", "gold", "win", "level", "save", "good"].includes(t)) el.classList.add("good");
  else if (["warn", "lose", "danger"].includes(t)) el.classList.add("warn");
  else if (t === "error") el.classList.add("danger");

  void el.offsetWidth;
  el.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function addLog(tag, msg) {
  if (tag !== "SKILL") return;
  showToast(msg, tag);
}

function pulseGold(){
  const targets = [$("goldValue"), $("marketGoldValue"), $("goldPill")].filter(Boolean);
  if (!targets.length) return;
  targets.forEach((el) => {
    el.classList.remove("goldPulse");
    void el.offsetWidth;
    el.classList.add("goldPulse");
    setTimeout(() => el.classList.remove("goldPulse"), 600);
  });
}

function pulseMarketGrid(){
  const grid = $("marketItemsGrid");
  if (!grid) return;
  grid.classList.remove("marketPulse");
  void grid.offsetWidth;
  grid.classList.add("marketPulse");
  setTimeout(() => grid.classList.remove("marketPulse"), 450);
}

function getBattleRewardIcon(entry) {
  if (!entry) return "./assets/icons/universal.svg";
  if (entry.type === "gold") return "./assets/icons/coin.svg";
  if (entry.type === "xp") return "./assets/icons/universal.svg";
  const slot = entry.slot || "";
  if (slot === "hand") return "./assets/icons/weapon.svg";
  if (slot === "head") return "./assets/icons/head.svg";
  if (slot === "armor") return "./assets/icons/armor.svg";
  if (slot === "pant") return "./assets/icons/pant.svg";
  if (slot === "shoes") return "./assets/icons/shoes.svg";
  return "./assets/icons/universal.svg";
}

function createBattleRewardItem({ icon, name, amount }) {
  const card = document.createElement("div");
  card.className = "battleRewardItem";
  card.innerHTML = `
    <div class="battleRewardFrame">
      <img class="battleRewardIcon" src="${escapeHtml(icon || "./assets/icons/universal.svg")}" alt="" />
    </div>
    <div class="battleRewardName">${escapeHtml(name || "Reward")}</div>
    <div class="battleRewardAmount">${escapeHtml(amount || "")}</div>
  `;
  return card;
}

function renderBattleRewardXpList(summary) {
  const xpList = $("battleRewardXpList");
  if (!xpList) return;
  xpList.innerHTML = "";
  if (summary.outcome !== "win") {
    xpList.style.display = "none";
    return;
  }
  const progress = Array.isArray(summary.expProgress) ? summary.expProgress : [];
  if (!progress.length) {
    xpList.style.display = "none";
    return;
  }
  xpList.style.display = "flex";
  progress.forEach((entry, idx) => {
    const beforeLevel = Number(entry.beforeLevel) || 0;
    const afterLevel = Number(entry.afterLevel) || beforeLevel;
    const beforeToLevel = Math.max(1, Number(entry.beforeXpToLevel) || 1);
    const afterToLevel = Math.max(1, Number(entry.afterXpToLevel) || beforeToLevel);
    const beforeXpRaw = Number(entry.beforeXp) || 0;
    const afterXpRaw = Number(entry.afterXp) || 0;
    const maxedBefore = beforeLevel >= MAX_LEVEL;
    const maxedAfter = afterLevel >= MAX_LEVEL;
    const resetOnLevelUp = !maxedAfter && afterLevel > beforeLevel;
    const startXp = maxedBefore ? beforeToLevel : clamp(resetOnLevelUp ? 0 : beforeXpRaw, 0, resetOnLevelUp ? afterToLevel : beforeToLevel);
    const startToLevel = resetOnLevelUp ? afterToLevel : beforeToLevel;
    const endXp = maxedAfter ? afterToLevel : clamp(afterXpRaw, 0, afterToLevel);
    const icon = entry.avatarIcon || ((entry.name || "?").slice(0, 1).toUpperCase());
    const bg = entry.avatarBg || "linear-gradient(135deg, #4b5c6e, #202934)";
    const gain = Math.max(0, Number(entry.gainXp) || 0);

    const card = document.createElement("div");
    card.className = "battleRewardXpCard" + (maxedAfter ? " maxed" : "");
    card.innerHTML = `
      <div class="battleRewardXpAvatar" style="background:${escapeHtml(bg)}">${escapeHtml(icon)}</div>
      <div class="battleRewardXpMain">
        <div class="battleRewardXpTop">
          <div class="battleRewardXpName">${escapeHtml(entry.name || `Unit ${idx + 1}`)}</div>
          <div class="battleRewardXpGain">+${escapeHtml(String(gain))} EXP</div>
        </div>
        <div class="battleRewardXpBar"><div class="battleRewardXpFill"></div></div>
        <div class="battleRewardXpText"></div>
      </div>
    `;
    card.dataset.startXp = String(startXp);
    card.dataset.startXpToLevel = String(startToLevel);
    card.dataset.endXp = String(endXp);
    card.dataset.endXpToLevel = String(afterToLevel);
    card.dataset.maxedAfter = maxedAfter ? "1" : "0";
    xpList.appendChild(card);
  });
}

function animateBattleRewardXpList(summary) {
  const xpList = $("battleRewardXpList");
  if (!xpList || summary.outcome !== "win") return;
  const cards = Array.from(xpList.querySelectorAll(".battleRewardXpCard"));
  cards.forEach((card, idx) => {
    const fill = card.querySelector(".battleRewardXpFill");
    const text = card.querySelector(".battleRewardXpText");
    if (!fill || !text) return;
    const startXp = Number(card.dataset.startXp) || 0;
    const startToLevel = Math.max(1, Number(card.dataset.startXpToLevel) || 1);
    const endXp = Number(card.dataset.endXp) || 0;
    const endToLevel = Math.max(1, Number(card.dataset.endXpToLevel) || 1);
    const maxed = card.dataset.maxedAfter === "1";

    const setState = (xp, toLevel, isMax) => {
      const safeToLevel = Math.max(1, toLevel || 1);
      const safeXp = clamp(xp || 0, 0, safeToLevel);
      fill.style.width = `${(safeXp / safeToLevel) * 100}%`;
      text.textContent = isMax ? "MAX" : `${Math.round(safeXp)}/${safeToLevel}`;
    };

    setTimeout(() => {
      if (maxed) {
        setState(endToLevel, endToLevel, true);
        return;
      }
      const duration = 900;
      const startedAt = performance.now();
      const tick = (now) => {
        const t = clamp((now - startedAt) / duration, 0, 1);
        const curr = startXp + ((endXp - startXp) * t);
        setState(curr, endToLevel, false);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, idx * 180);
  });
}

function showBattleResultOverlay(summary, onClose) {
  const backdrop = $("battleResultBackdrop");
  if (!backdrop) return;
  $("battleResultTitle").textContent = summary.outcome === "win" ? "Victory" : "Defeat";
  $("battleResultEnemy").textContent = summary.enemyName ? `Vs ${summary.enemyName}` : "";

  const isWin = summary.outcome === "win";
  const coreGrid = $("battleRewardCoreGrid");
  const dropGrid = $("battleRewardDropGrid");
  const dropTitle = $("battleDropTitle");
  if (coreGrid) {
    coreGrid.innerHTML = "";
    if (isWin) {
      coreGrid.appendChild(createBattleRewardItem({
        icon: getBattleRewardIcon({ type: "gold" }),
        name: "Gold",
        amount: `+${summary.gold || 0}`,
      }));
      coreGrid.appendChild(createBattleRewardItem({
        icon: getBattleRewardIcon({ type: "xp" }),
        name: "EXP",
        amount: `+${summary.xp || 0}`,
      }));
    } else {
      const empty = document.createElement("div");
      empty.className = "battleRewardItem battleRewardEmpty";
      empty.innerHTML = `<div class="battleRewardName">Tidak ada reward karena kalah.</div>`;
      coreGrid.appendChild(empty);
    }
  }

  renderBattleRewardXpList(summary);

  const drops = Array.isArray(summary.drops) ? summary.drops : [];
  if (dropTitle) dropTitle.style.display = isWin ? "block" : "none";
  if (dropGrid) {
    dropGrid.style.display = isWin ? "grid" : "none";
    dropGrid.innerHTML = "";
    if (isWin) {
      if (!drops.length) {
        const empty = document.createElement("div");
        empty.className = "battleRewardItem battleRewardEmpty";
        empty.innerHTML = `<div class="battleRewardName">Tidak ada drop item</div>`;
        dropGrid.appendChild(empty);
      } else {
        drops.forEach((drop) => {
          dropGrid.appendChild(createBattleRewardItem({
            icon: getBattleRewardIcon(drop),
            name: drop.name || "Item",
            amount: `x${drop.qty || 1}`,
          }));
        });
      }
    }
  }

  backdrop.style.display = "flex";
  animateBattleRewardXpList(summary);
  const btn = $("battleResultClose");
  if (btn) {
    btn.onclick = () => {
      backdrop.style.display = "none";
      if (onClose) onClose();
    };
  }
}

function getSkillByName(player, name){
  if (!player || !Array.isArray(player.skills) || !name) return null;
  return player.skills.find((s) => s && s.name === name) || null;
}

function skillIconHtml(skill){
  if (!skill || !skill.icon) return "";
  return `<span class="skillIconWrap"><img class="skillIcon" src="${escapeHtml(skill.icon)}" alt="" /></span>`;
}

function normalizeEnemyQueue(){
  if (!Array.isArray(state.enemyQueue)) return [];
  state.enemyQueue = state.enemyQueue.filter((enemy) => enemy);
  return state.enemyQueue;
}

function getAliveEnemyQueue(){
  return getEnemyQueue().filter((enemy) => enemy && enemy.hp > 0);
}

function getDefeatedEnemies(){
  return getEnemyQueue().filter((enemy) => enemy && enemy.hp <= 0 && !enemy._defeated);
}

function getEnemyQueue(){
  if (Array.isArray(state.enemyQueue) && state.enemyQueue.length) return normalizeEnemyQueue();
  return state.enemy ? [state.enemy] : [];
}

function getDefaultEnemyTargetIndex(queue){
  if (!Array.isArray(queue) || !queue.length) return 0;
  if (queue.length === 3) return 0;
  return clamp(Math.floor(queue.length / 2), 0, queue.length - 1);
}

function getPrimaryEnemy(){
  const queue = getEnemyQueue();
  return queue[0] || null;
}

function getTargetEnemy(){
  const queue = getEnemyQueue();
  if (!queue.length) return null;
  let idx = clamp(state.enemyTargetIndex || 0, 0, queue.length - 1);
  if (!queue[idx] || queue[idx].hp <= 0) {
    const aliveIndex = queue.findIndex((enemy) => enemy && enemy.hp > 0);
    if (aliveIndex === -1) return null;
    idx = aliveIndex;
    state.enemyTargetIndex = idx;
  }
  return queue[idx];
}

function getEnemyIndex(enemy){
  const queue = getEnemyQueue();
  return queue.indexOf(enemy);
}

function setActiveEnemyByIndex(index){
  const queue = getEnemyQueue();
  if (!queue.length) return false;
  const target = queue[index];
  if (!target || target.hp <= 0) return false;
  state.enemyTargetIndex = clamp(index, 0, queue.length - 1);
  return true;
}

function renderAllyRow() {
  const row = $("allyRow");
  if (!row) return;
  const allies = Array.isArray(state.allies) ? state.allies : [];
  [1, 2].forEach((slotIndex, i) => {
    const ally = allies[i] || null;
    const nameEl = row.querySelector(`[data-ally-name="${slotIndex}"]`);
    const lvlEl = row.querySelector(`[data-ally-lvl="${slotIndex}"]`);
    const subEl = row.querySelector(`[data-ally-sub="${slotIndex}"]`);
    const hpText = row.querySelector(`[data-ally-hp="${slotIndex}"]`);
    const mpText = row.querySelector(`[data-ally-mp="${slotIndex}"]`);
    const hpBar = row.querySelector(`[data-ally-hpbar="${slotIndex}"]`);
    const mpBar = row.querySelector(`[data-ally-mpbar="${slotIndex}"]`);
    const statusWrap = row.querySelector(`[data-ally-status="${slotIndex}"]`);
    const card = row.querySelector(`.allyCard.extra[data-ally-slot="${slotIndex}"]`);

    if (!nameEl || !lvlEl || !subEl || !hpText || !mpText || !hpBar || !mpBar || !card) return;
    let avatarBox = card.querySelector(".allyAvatarBox");
    if (!avatarBox) {
      const wrap = document.createElement("div");
      wrap.className = "avatarWrap allyAvatarWrap";
      wrap.innerHTML = `<div class="avatarBox allyAvatarBox"></div>`;
      const insertAfter = card.querySelector(".nameSub");
      if (insertAfter && insertAfter.parentNode) {
        insertAfter.parentNode.insertBefore(wrap, insertAfter.nextSibling);
      } else {
        card.appendChild(wrap);
      }
      avatarBox = wrap.querySelector(".allyAvatarBox");
    }

    if (ally) {
      const prevHp = (typeof ally._prevHp === "number") ? ally._prevHp : ally.hp;
      nameEl.textContent = ally.name || `NPC ${slotIndex}`;
      lvlEl.textContent = `Lv${ally.level ?? 0}`;
      subEl.textContent = "";
      subEl.style.display = "none";
      hpText.textContent = `${ally.hp}/${ally.maxHp}`;
      mpText.textContent = `${ally.mp}/${ally.maxMp}`;
      setBar(hpBar, ally.hp, ally.maxHp);
      setBar(mpBar, ally.mp, ally.maxMp);
      const hpBarWrap = hpBar.parentElement;
      if (hpBarWrap && ally.hp < prevHp) {
        if (hpBarWrap._hpPulseTimer) clearTimeout(hpBarWrap._hpPulseTimer);
        hpBarWrap.classList.remove("hpPulse");
        void hpBarWrap.offsetWidth;
        hpBarWrap.classList.add("hpPulse");
        hpBarWrap._hpPulseTimer = setTimeout(() => {
          hpBarWrap.classList.remove("hpPulse");
        }, 360);
      }
      ally._prevHp = ally.hp;
      card.classList.remove("empty");
      card.classList.add("active");
      card.style.display = "flex";
      const wasAlive = card.dataset.allyAlive === "true";
      const isAlive = ally.hp > 0;
      card.classList.toggle("down", !isAlive);
      if (wasAlive && !isAlive) {
        card.classList.remove("allyDown");
        void card.offsetWidth;
        card.classList.add("allyDown");
      }
      if (isAlive) card.classList.remove("allyDown");
      card.dataset.allyAlive = isAlive ? "true" : "false";
      if (ally.id) {
        card.dataset.allyId = ally.id;
        avatarBox.dataset.allyId = ally.id;
      } else {
        delete card.dataset.allyId;
        delete avatarBox.dataset.allyId;
      }
      applyAllyAvatar(avatarBox, ally);
      renderStatusBadges(isAlive ? ally : null, statusWrap);
      bindLongPress(card, () => {
        const currentAllies = Array.isArray(state.allies) ? state.allies : [];
        const currentAlly = currentAllies[i];
        if (currentAlly) openAllyStatsModal(currentAlly);
      });
    } else {
      nameEl.textContent = `NPC ${slotIndex}`;
      lvlEl.textContent = "Lv-";
      subEl.textContent = "Slot kosong";
      subEl.style.display = "block";
      hpText.textContent = "0/0";
      mpText.textContent = "0/0";
      hpBar.style.width = "0%";
      mpBar.style.width = "0%";
      card.classList.add("empty");
      card.classList.remove("active");
      card.classList.remove("down", "allyDown");
      delete card.dataset.allyAlive;
      card.style.display = "none";
      delete card.dataset.allyId;
      delete avatarBox.dataset.allyId;
      applyAllyAvatar(avatarBox, null);
      renderStatusBadges(null, statusWrap);
    }
  });
}

function updateAllySlotBadge() {
  const badgeText = $("allySlotText");
  if (!badgeText) return;
  const allies = Array.isArray(state.allies) ? state.allies : [];
  const filled = allies.filter(Boolean).length;
  const totalSlots = 1;
  badgeText.textContent = `${filled}/${totalSlots}`;
}

function applyEnemyAvatar(box, enemy) {
  if (!box) return;
  if (!enemy) {
    const iconEl = box.querySelector(".avatarIcon");
    if (iconEl) iconEl.textContent = "";
    box.style.background = "transparent";
    const imgEl = box.querySelector(".avatarImg");
    if (imgEl) imgEl.remove();
    box.removeAttribute("title");
    return;
  }
  const config = ENEMY_AVATARS[enemy.name] || {};
  const imgSrc = config.image;
  if (imgSrc) {
    const iconEl = box.querySelector(".avatarIcon");
    if (iconEl) iconEl.remove();
    let imgEl = box.querySelector(".avatarImg");
    if (!imgEl) {
      imgEl = document.createElement("img");
      imgEl.className = "avatarImg";
      box.appendChild(imgEl);
    }
    if (imgEl.getAttribute("src") !== imgSrc) imgEl.setAttribute("src", imgSrc);
    imgEl.setAttribute("alt", enemy.name);
    box.style.background = "transparent";
  } else {
    const fallback = enemy.name ? enemy.name.slice(0, 1).toUpperCase() : "?";
    const icon = config.icon || fallback;
    let iconEl = box.querySelector(".avatarIcon");
    if (!iconEl) {
      iconEl = document.createElement("span");
      iconEl.className = "avatarIcon";
      box.appendChild(iconEl);
    }
    if (iconEl.textContent !== icon) iconEl.textContent = icon;
    const bg = config.bg || "linear-gradient(135deg, #4b5c6e, #202934)";
    if (box.style.background !== bg) box.style.background = bg;
    const imgEl = box.querySelector(".avatarImg");
    if (imgEl) imgEl.remove();
  }
  box.setAttribute("title", enemy.name);
}

function applyAllyAvatar(box, ally) {
  if (!box) return;
  if (!ally) {
    const iconEl = box.querySelector(".avatarIcon");
    if (iconEl) iconEl.textContent = "";
    box.style.background = "rgba(255,255,255,0.03)";
    box.removeAttribute("title");
    return;
  }
  const config = ALLY_AVATARS[ally.name] || ALLY_AVATARS[ally.role] || {};
  const fallback = ally.name ? ally.name.slice(0, 1).toUpperCase() : "?";
  const icon = config.icon || fallback;
  let iconEl = box.querySelector(".avatarIcon");
  if (!iconEl) {
    iconEl = document.createElement("span");
    iconEl.className = "avatarIcon";
    box.appendChild(iconEl);
  }
  if (iconEl.textContent !== icon) iconEl.textContent = icon;
  const bg = config.bg || "linear-gradient(135deg, #4b5c6e, #202934)";
  if (box.style.background !== bg) box.style.background = bg;
  box.setAttribute("title", ally.name);
}

function allyAvatarIcon(name){
  return (ALLY_AVATARS[name] && ALLY_AVATARS[name].icon) ? ALLY_AVATARS[name].icon : "🙂";
}

function renderEnemyRow() {
  const row = $("enemyRow");
  if (!row) return;

  const queue = getEnemyQueue();
  const activeEnemy = getTargetEnemy();
  const visibleEnemies = queue.slice(1, 3);
  const activeIndices = new Set();

  visibleEnemies.forEach((enemy, offset) => {
    const enemyIndex = offset + 1;
    activeIndices.add(String(enemyIndex));

    let card = row.querySelector(`.enemyCard.extra[data-enemy-index="${enemyIndex}"]`);
    const cardTemplate = `
      <div class="damageText enemyDamage"></div>
      <div class="sectionTitle">
        <div><b class="enemyName"></b> <span class="pill enemyLevel"></span></div>
      </div>
      <div class="statusIndicator enemyStatusBadges" aria-label="Status enemy"></div>
      <div class="avatarWrap">
        <div class="avatarBox enemyAvatarBox"></div>
      </div>
      <div class="bars enemyMiniMeta">
        <div>
          <div class="bar">
            <div class="fill hp enemyHpFill"></div>
            <span class="barText enemyHpText"></span>
          </div>
        </div>
        <div>
          <div class="bar">
            <div class="fill mp enemyMpFill"></div>
            <span class="barText enemyMpText"></span>
          </div>
        </div>
      </div>
    `;

    if (!card) {
      card = document.createElement("div");
      card.className = "card enemyCard extra";
      card.dataset.enemyIndex = `${enemyIndex}`;
    }
    if (card.dataset.templateVersion !== "bartext") {
      card.innerHTML = cardTemplate;
      card.dataset.templateVersion = "bartext";
    }
    row.appendChild(card);

    const hpPct = enemy.maxHp ? clamp((enemy.hp / enemy.maxHp) * 100, 0, 100) : 0;
    const mpPct = enemy.maxMp ? clamp((enemy.mp / enemy.maxMp) * 100, 0, 100) : 0;

    const nameEl = card.querySelector(".enemyName");
    const lvlEl = card.querySelector(".enemyLevel");
    const hpText = card.querySelector(".enemyHpText");
    const mpText = card.querySelector(".enemyMpText");
    const hpFill = card.querySelector(".enemyHpFill");
    const mpFill = card.querySelector(".enemyMpFill");
    const statusWrap = card.querySelector(".enemyStatusBadges");
    const prevHp = (typeof enemy._prevHp === "number") ? enemy._prevHp : enemy.hp;
    const prevHpPct = enemy.maxHp ? clamp((prevHp / enemy.maxHp) * 100, 0, 100) : 0;
    const wasAlive = enemy._alive === true;
    const isAlive = enemy.hp > 0;

    if (nameEl) nameEl.textContent = enemy.name || "-";
    if (lvlEl) lvlEl.textContent = `Lv${enemy.level || 1}`;
    if (hpText) hpText.textContent = `${enemy.hp}/${enemy.maxHp}`;
    if (mpText) mpText.textContent = `${enemy.mp}/${enemy.maxMp}`;
    if (hpFill) {
      const hpBar = hpFill.parentElement;
      const prevHpFillPct = hpFill.style.width
        ? parseFloat(hpFill.style.width)
        : prevHpPct;
      if (hpBar) hpBar.dataset.prevPct = `${prevHpPct}`;
      if (!Number.isNaN(prevHpFillPct)) {
        hpFill.style.transition = "none";
        hpFill.style.width = `${prevHpFillPct}%`;
        void hpFill.offsetWidth;
        hpFill.style.transition = "";
      }
      if (!isAlive) {
        hpFill.style.width = `${hpPct}%`;
        if (hpBar) {
          hpBar.dataset.prevPct = `${hpPct}`;
          const loss = hpBar.querySelector(".loss");
          if (loss) {
            loss.style.transition = "none";
            loss.style.width = `${hpPct}%`;
            loss.style.opacity = "0";
          }
          if (hpBar._hpPulseTimer) clearTimeout(hpBar._hpPulseTimer);
          hpBar.classList.remove("hpPulse");
        }
      } else {
        setBar(hpFill, enemy.hp, enemy.maxHp);
        if (hpBar && enemy.hp < prevHp) {
          if (hpBar._hpPulseTimer) clearTimeout(hpBar._hpPulseTimer);
          hpBar.classList.remove("hpPulse");
          void hpBar.offsetWidth;
          hpBar.classList.add("hpPulse");
          hpBar._hpPulseTimer = setTimeout(() => {
            hpBar.classList.remove("hpPulse");
          }, 360);
        }
      }
    }
    if (mpFill) {
      const mpBar = mpFill.parentElement;
      if (!isAlive) {
        const mpPct = enemy.maxMp ? clamp((enemy.mp / enemy.maxMp) * 100, 0, 100) : 0;
        mpFill.style.width = `${mpPct}%`;
        if (mpBar) {
          mpBar.dataset.prevPct = `${mpPct}`;
          const loss = mpBar.querySelector(".loss");
          if (loss) {
            loss.style.transition = "none";
            loss.style.width = `${mpPct}%`;
            loss.style.opacity = "0";
          }
        }
      } else {
        setBar(mpFill, enemy.mp, enemy.maxMp);
      }
    }

    card.classList.toggle("active", enemy === activeEnemy);
    card.classList.toggle("down", !isAlive);
    card.classList.toggle("noFx", !isAlive);
    if (wasAlive && !isAlive) card.classList.add("enemyDown");
    if (isAlive) card.classList.remove("enemyDown");
    enemy._alive = isAlive;
    enemy._prevHp = enemy.hp;

    applyEnemyAvatar(card.querySelector(".enemyAvatarBox"), enemy);
    renderStatusBadges(isAlive ? enemy : null, statusWrap);

    if (isAlive) {
      const targetIndex = enemyIndex;
      card.onclick = () => {
        if (card.dataset.longPressTriggered === "true") {
          delete card.dataset.longPressTriggered;
          return;
        }
        if (setActiveEnemyByIndex(targetIndex)) {
          addLog("TARGET", `Target: ${enemy.name}`);
          refresh(state);
        }
      };
      bindLongPress(card, () => {
        const queue = getEnemyQueue();
        const target = queue[targetIndex];
        if (target) openEnemyStatsModal(target);
      });
    } else {
      card.onclick = null;
    }
  });

  row.querySelectorAll(".enemyCard.extra").forEach((card) => {
    if (!activeIndices.has(card.dataset.enemyIndex)) {
      card.remove();
    }
  });
}

const damageTimers = { player: null, enemy: null, ally: {} };
function showDamageText(target, text){
  const el = $(target === "player" ? "playerDamage" : "enemyDamage");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  if (damageTimers[target]) clearTimeout(damageTimers[target]);
  damageTimers[target] = setTimeout(() => {
    el.classList.remove("show");
  }, 1400);
}

function showEnemyDamageText(text, enemyIndex){
  const idx = Number.isFinite(enemyIndex) ? enemyIndex : (state.enemyTargetIndex || 0);
  if (!isEnemyAliveByIndex(idx)) return;
  let el = null;
  if (idx === 0) {
    el = $("enemyDamage");
  } else {
    el = document.querySelector(`.enemyCard.extra[data-enemy-index="${idx}"] .enemyDamage`);
  }
  if (!el) return;
  el.textContent = text;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  if (damageTimers.enemy) clearTimeout(damageTimers.enemy);
  damageTimers.enemy = setTimeout(() => {
    el.classList.remove("show");
  }, 1400);
}

function showAllyDamageText(text, ally){
  if (!ally || !Array.isArray(state.allies)) return;
  const idx = state.allies.indexOf(ally);
  if (idx < 0) return;
  const slotIndex = idx + 1;
  const el = document.querySelector(`.allyCard.extra[data-ally-slot="${slotIndex}"] .allyDamage`);
  if (!el) return;
  el.textContent = text;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  if (damageTimers.ally[slotIndex]) clearTimeout(damageTimers.ally[slotIndex]);
  damageTimers.ally[slotIndex] = setTimeout(() => {
    el.classList.remove("show");
  }, 1400);
}

function formatDamageText(res, dmg){
  if (!res || res.missed) return "MISS";
  const tags = [];
  if (res.crit) tags.push("CRIT");
  if (res.combustion) tags.push("COMBUST");
  if (res.blocked > 0) tags.push("BLOCK");
  const base = dmg > 0 ? `-${dmg}` : "0";
  return tags.length ? `${base} (${tags.join(" ")})` : base;
}

function ensureSkillFloatingDetail(){
  let el = document.getElementById("skillFloatingDetail");
  if (el) return el;
  el = document.createElement("div");
  el.id = "skillFloatingDetail";
  el.className = "skillFloatingDetail";
  document.body.appendChild(el);
  return el;
}

function hideSkillFloatingDetail(){
  const el = document.getElementById("skillFloatingDetail");
  if (!el) return;
  el.classList.remove("show");
}

function showSkillFloatingDetail(skill, anchorEl){
  if (!skill || !anchorEl) return;
  const el = ensureSkillFloatingDetail();
  el.innerHTML = `
    <div class="skillFloatingTitle">${escapeHtml(skill.name || "Skill")}</div>
    <div class="skillFloatingDesc">${escapeHtml(skill.desc || "Tidak ada deskripsi.")}</div>
    <div class="skillFloatingMeta">MP ${skill.mpCost || 0} • DMG ${skill.power || 0} • CD ${skill.cooldown || 0} turn</div>
  `;
  const r = anchorEl.getBoundingClientRect();
  const vw = window.innerWidth || document.documentElement.clientWidth || 360;
  const vh = window.innerHeight || document.documentElement.clientHeight || 640;
  const margin = 8;
  const bubbleW = Math.min(240, vw - margin * 2);
  const bubbleH = el.offsetHeight || 92;

  const left = Math.max(margin, Math.min(vw - bubbleW - margin, r.left + (r.width / 2) - (bubbleW / 2)));

  const aboveTop = r.top - bubbleH - 10;
  const belowTop = r.bottom + 10;
  const top = aboveTop >= margin
    ? aboveTop
    : Math.min(vh - bubbleH - margin, Math.max(margin, belowTop));

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.classList.add("show");
}

function renderSkillSlots(){
  const grid = $("skillSlots");
  if (!grid) return;
  const p = state.player;
  if (!Array.isArray(p.skillSlots)) {
    p.skillSlots = Array.from({ length: 8 }, () => null);
  }
  const slots = Array.from({ length: 8 });
  slots.forEach((_, i) => {
    let btn = grid.querySelector(`[data-slot="${i}"]`);
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "skillSlot";
      btn.setAttribute("data-slot", `${i}`);
      grid.appendChild(btn);
    }
    const slotName = p.skillSlots ? p.skillSlots[i] : null;
    const skill = slotName ? getSkillByName(p, slotName) : null;
    if (skill) {
      const cdLeft = skill.cdLeft || 0;
      const icon = skillIconHtml(skill);
      const cdBadge = cdLeft > 0 ? `<span class="skillCooldown">${cdLeft}</span>` : "";
      btn.innerHTML = `${icon}${cdBadge}`;
      btn.disabled = (state.turn !== "player") || p.mp < skill.mpCost || cdLeft > 0;
      btn.classList.toggle("cooldown", cdLeft > 0);
      btn.onclick = () => {
        if (btn.dataset.longPressTriggered === "true") {
          delete btn.dataset.longPressTriggered;
          return;
        }
        useSkillAtIndex(i);
      };
      bindLongPress(btn, () => showSkillFloatingDetail(skill, btn));
    } else {
      btn.textContent = "-";
      btn.disabled = true;
      btn.onclick = null;
    }
  });
}

function useSkillAtIndex(idx){
  hideSkillFloatingDetail();
  const p = state.player;
  const e = getTargetEnemy();
  if (!p || !e || !Array.isArray(p.skills)) return;
  const slotName = p.skillSlots ? p.skillSlots[idx] : null;
  const s = slotName ? getSkillByName(p, slotName) : null;
  if (!s) return;
  if (state.turn !== "player") return;
  const cdLeft = s.cdLeft || 0;
  if (cdLeft > 0) {
    addLog("WARN", `${s.name} cooldown ${cdLeft} turn.`);
    refresh(state);
    return;
  }
  if (p.mp < s.mpCost) {
    addLog("WARN", "MP tidak cukup.");
    refresh(state);
    return;
  }

  p.mp -= s.mpCost;

  addLog("SKILL", s.name);
  if (s.name === "Blazing Aura") {
    addStatusEffect(p, { type: "strengthen", turns: 2, debuff: false });
    s.cdLeft = s.cooldown || 0;
    afterPlayerAction();
    return;
  }
  const res = resolveAttack(p, e, s.power);
  const targetIndex = getEnemyIndex(e);
  if (res.missed) {
    playEnemyDodgeFade(targetIndex);
    showEnemyDamageText("MISS", targetIndex);
  } else {
    if (res.dmg > 0) {
      e.hp = clamp(e.hp - res.dmg, 0, e.maxHp);
      playEnemyCritShake(targetIndex);
    }
    if (res.reflected > 0) {
      p.hp = clamp(p.hp - res.reflected, 0, p.maxHp);
      playCritShake("player");
    }
    showEnemyDamageText(formatDamageText(res, res.dmg), targetIndex);
    if (res.reflected > 0) {
      showDamageText("player", `-${res.reflected} (REFLECT)`);
    }
  }
  if (s.name === "Echo Strike" && !res.missed) {
    addStatusEffect(e, { type: "stun", turns: 3, debuff: true });
  }

  s.cdLeft = s.cooldown || 0;
  if (p.hp <= 0) {
    loseBattle();
    return;
  }

  afterPlayerAction();
}
function statusLabel(entity) {
  if (!entity || !Array.isArray(entity.statuses)) return "";
  const active = entity.statuses.filter((s) => (s.turns || 0) > 0);
  if (!active.length) return "";
  return active
    .map((s) => `${(s.type || "Effect").toUpperCase()} (${s.turns} turn${s.turns > 1 ? "s" : ""})`)
    .join(" • ");
}
const STATUS_DEFS = {
  strengthen: {
    label: "Strengthen",
    desc: "Increases all output damage by X%.",
    kind: "buff",
  },
  guardStance: {
    label: "Guard Stance",
    desc: "Meningkatkan DEF signifikan selama beberapa turn.",
    kind: "buff",
  },
  stance: {
    label: "Stance",
    desc: "Mengalihkan semua serangan ke pengguna stance.",
    kind: "buff",
  },
  armorBreak: {
    label: "Armor Break",
    desc: "Menurunkan DEF target sebesar 15% selama beberapa turn.",
    kind: "debuff",
  },
  stun: {
    label: "Stun",
    desc: (turns) => `Restricted from action for ${turns} Turn.`,
    kind: "debuff",
  },
  poison: {
    label: "Poison",
    desc: "Setiap akhir turn target, Max HP berkurang sebesar persentase poison.",
    kind: "debuff",
  },
  accuracyDown: {
    label: "Accuracy Down",
    desc: (turns) => `Accuracy berkurang 20% selama ${turns} turn.`,
    kind: "debuff",
  },
};

function getStatusDefinition(status) {
  if (!status) return { label: "Effect", desc: "Status aktif.", kind: "buff" };
  const def = STATUS_DEFS[status.type] || {};
  const descValue = typeof def.desc === "function" ? def.desc(status.turns || 0) : def.desc;
  return {
    label: def.label || status.type || "Effect",
    desc: descValue || "Status aktif.",
    kind: def.kind || (status.debuff ? "debuff" : "buff"),
  };
}

function renderStatusBadges(entity, container) {
  if (!container) return;
  const statuses = Array.isArray(entity?.statuses)
    ? entity.statuses.filter((s) => (s.turns || 0) > 0)
    : [];
  if (!statuses.length) {
    container.innerHTML = "";
    container.style.display = "none";
    return;
  }
  container.innerHTML = "";
  container.style.display = "flex";
  statuses.forEach((status) => {
    const meta = getStatusDefinition(status);
    const turns = Math.max(0, status.turns || 0);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `statusBadge ${meta.kind}`.trim();
    btn.setAttribute("aria-label", `${meta.label} (${turns} turn)`);
    btn.title = `${meta.label} (${turns} turn${turns > 1 ? "s" : ""})`;
    btn.innerHTML = `
      <span class="statusBadgeIcon" aria-hidden="true"></span>
      ${turns ? `<span class="statusBadgeTurns">${turns}</span>` : ""}
    `;
    btn.onclick = (event) => {
      event.stopPropagation();
      const turnText = turns ? ` (${turns} turn${turns > 1 ? "s" : ""})` : "";
      modal.open(
        `Status: ${meta.label}`,
        [{ title: "Detail", desc: `${meta.desc}${turnText}`, meta: "", value: undefined, className: "readonly" }],
        () => {}
      );
    };
    container.appendChild(btn);
  });
}
function setBar(el, cur, max) {
  const pctRaw = max <= 0 ? 0 : (cur / max) * 100;
  const pct = clamp(pctRaw, 0, 100);

  // Always update main fill
  el.style.width = `${pct}%`;

  // XP bar tidak perlu animasi loss (merah). Hanya HP/MP.
  if (el.classList && el.classList.contains("xp")) return;

  // Damage / loss overlay: show red trailing bar when value decreases
  const bar = el && el.parentElement;
  if (!bar || !bar.classList || !bar.classList.contains("bar")) return;

  let loss = bar.querySelector(".loss");
  if (!loss) {
    loss = document.createElement("div");
    loss.className = "loss";
    bar.insertBefore(loss, el);
  }

  const prev = bar.dataset.prevPct ? parseFloat(bar.dataset.prevPct) : pct;

  if (pct < prev - 0.01) {
    // Reset loss to previous width and show
    loss.style.transition = "none";
    loss.style.width = `${prev}%`;
    loss.style.opacity = "0.9";

    // Animate loss to new width, then fade out
    requestAnimationFrame(() => {
      loss.style.transition = "width 420ms ease-out, opacity 650ms ease-out";
      loss.style.width = `${pct}%`;
      setTimeout(() => {
        loss.style.opacity = "0";
      }, 420);
    });
  } else {
    // Heal / same: sync loss and hide
    loss.style.transition = "none";
    loss.style.width = `${pct}%`;
    loss.style.opacity = "0";
  }

  bar.dataset.prevPct = `${pct}`;
}

const modal = {
  open(title, choices, onPick) {
    $("modalTitle").textContent = title;

    const meta = $("modalMeta");
    if (meta) {
      const lowerTitle = String(title || "").toLowerCase();
      const showCurrency = lowerTitle.includes("shop") || lowerTitle.includes("market") || lowerTitle.includes("inventory");
      if (showCurrency) {
        const gold = state.player?.gold ?? 0;
        meta.innerHTML = `<img class="currencyIcon" src="./assets/icons/coin.svg" alt="" /><span>Gold ${gold}</span>`;
        meta.style.display = "inline-flex";
      } else {
        meta.textContent = "";
        meta.style.display = "none";
      }
    }

    const body = $("modalBody");
    body.innerHTML = "";

    const backBtn = $("modalBack");
    let backChoice = null;
    if (Array.isArray(choices)) {
      backChoice = choices.find((c) => c && c.value === "back") || null;
      if (backChoice) {
        choices = choices.filter((c) => c !== backChoice);
      }
    }
    if (backBtn) {
      backBtn.style.display = backChoice ? "inline-flex" : "none";
      backBtn.onclick = backChoice
        ? () => onPick("back")
        : null;
    }

    // Layout: make Stats modals show 2-3 columns
    const modalEl = document.querySelector(".modal");
    body.classList.remove("statsGrid");
    body.classList.remove("statModal");
    body.classList.remove("marketGrid");
    body.classList.remove("equipmentGrid");
    body.classList.remove("marketSubCompact");
    body.classList.remove("confirmPopup");
    if (modalEl) modalEl.classList.remove("confirmPopup");
    const lowerTitle = String(title).toLowerCase();
    if (String(title).toLowerCase().includes("stats")) body.classList.add("statsGrid");
    if (lowerTitle.includes("stat")) body.classList.add("statModal");
    if (lowerTitle.includes("market") || lowerTitle.includes("inventory")) body.classList.add("marketGrid");
    if (String(title).toLowerCase().includes("equipment")) body.classList.add("equipmentGrid");
    if (choices.some((c) => String(c.className || "").includes("marketSub"))) {
      body.classList.add("marketSubCompact");
    }
    if (lowerTitle.includes("konfirmasi") || choices.some((c) => String(c.className || "").includes("confirmDetails"))) {
      body.classList.add("confirmPopup");
      if (modalEl) modalEl.classList.add("confirmPopup");
    }

    choices.forEach((c) => {
      const row = document.createElement("div");
      row.className = "choice";

      // Optional styling
      if (c.className) row.classList.add(...String(c.className).split(/\s+/).filter(Boolean));
      if (c.style) row.style.cssText += String(c.style);

      const left = document.createElement("div");
      left.className = "left";
      const iconWrapClass = ["skillIconWrap", c.iconFrameOnly ? "frameOnly" : ""].filter(Boolean).join(" ");
      const iconHtml = (c.icon || c.iconFrameOnly)
        ? `<span class="${iconWrapClass}">${c.icon ? `<img class="skillIcon" src="${escapeHtml(c.icon)}" alt="" />` : ""}${c.cooldownBadge ? `<span class="skillCooldown allySkillCooldownBadge">${escapeHtml(String(c.cooldownBadge))}</span>` : ""}</span>`
        : "";
      const descHtml = c.descHtml ? String(c.descHtml) : escapeHtml(c.desc || "");
      left.innerHTML = `
        <div class="titleRow">${iconHtml}<b>${escapeHtml(c.title)}</b></div>
        <div class="desc">${descHtml}</div>
      `;

      const right = document.createElement("div");
      right.className = "right muted";

      // Optional: render buttons in right area (used by Profile stat allocation)
      if (Array.isArray(c.buttons) && c.buttons.length) {
        right.classList.add("btnGroup");
        right.innerHTML = c.buttons.map((b, idx) => {
          const dis = b.disabled ? "disabled" : "";
          const cls = ["miniBtn", b.className || ""].join(" ").trim();
          return `<button type="button" class="${escapeHtml(cls)}" data-v="${escapeHtml(String(b.value))}" ${dis}>${escapeHtml(b.text)}</button>`;
        }).join("");
      } else {
        right.textContent = c.meta || "";
      }

      row.appendChild(left);
      row.appendChild(right);

      // Clickable row (only if value provided and no buttons)
      if (c.value !== undefined && (!(Array.isArray(c.buttons) && c.buttons.length) || c.allowClick)) {
        row.onclick = () => {
          if (!c.keepOpen) modal.close();
          onPick(c.value);
        };
      } else {
        row.classList.add("readonly");
      }

      // Button handlers
      if (Array.isArray(c.buttons) && c.buttons.length) {
        right.querySelectorAll("button").forEach((btn) => {
          btn.onclick = (e) => {
            e.stopPropagation();
            if (btn.disabled) return;
            const v = btn.getAttribute("data-v");
            if (!c.keepOpen) modal.close();
            onPick(v);
          };
        });
      }

      body.appendChild(row);
    });

    $("modalBackdrop").style.display = "flex";
    $("modalBackdrop").onclick = (e) => {
      if (e.target.id === "modalBackdrop") modal.close();
    };
  },

  close() {
    $("modalBackdrop").style.display = "none";
    window.dispatchEvent(new Event("rpg:modal-closed"));
  },

  bind() {
    $("modalClose").onclick = () => modal.close();
    const back = $("modalBack"); if (back) back.onclick = () => modal.close();
    const c = $("modalCancel"); if (c) c.onclick = () => modal.close();
  },
};

// TURN INDICATOR: state.turn = "player" | "enemy" | "town"
function refresh(state) {
  const p = state.player;
  const inBattle = state.inBattle && state.enemy;

  const turnCountEl = $("turnCount");
  if (turnCountEl) {
    turnCountEl.style.display = "none";
    turnCountEl.textContent = "";
  }
  const actionHint = $("actionHint");
  if (actionHint) {
    actionHint.style.display = "none";
    actionHint.textContent = "";
  }
  const battleHintEl = $("battleHint");
  if (battleHintEl) {
    battleHintEl.style.display = "none";
    battleHintEl.textContent = "";
  }

  const autoLabel = state.autoBattleEnabled ? "Auto: ON" : "Auto: OFF";
  const btnAutoBattle = $("btnAutoBattle");
  if (btnAutoBattle) {
    btnAutoBattle.textContent = autoLabel;
  }

  const btnAutoBattleFloating = $("btnAutoBattleFloating");
  if (btnAutoBattleFloating) {
    btnAutoBattleFloating.classList.toggle("active", !!state.autoBattleEnabled);
    btnAutoBattleFloating.setAttribute("aria-label", autoLabel);
    btnAutoBattleFloating.setAttribute("title", autoLabel);
  }

  const autoItemLabel = state.autoBattleUseConsumable ? "Auto Item: ON" : "Auto Item: OFF";
  const btnAutoBattleSettingsFloating = $("btnAutoBattleSettingsFloating");
  if (btnAutoBattleSettingsFloating) {
    const showSetting = !!state.inBattle && !!state.autoBattleEnabled;
    btnAutoBattleSettingsFloating.style.display = showSetting ? "inline-flex" : "none";
    btnAutoBattleSettingsFloating.classList.toggle("on", !!state.autoBattleUseConsumable);
    btnAutoBattleSettingsFloating.setAttribute("aria-label", autoItemLabel);
    btnAutoBattleSettingsFloating.setAttribute("title", autoItemLabel);
  }

  // Player title + name
  const pNameTitle = $("pNameTitle");
  if (pNameTitle) pNameTitle.textContent = p.name;

  const pSub = $("pSub");
  if (pSub) {
    const label = inBattle ? "" : statusLabel(p);
    pSub.textContent = label;
    pSub.style.display = label ? "block" : "none";
  }
  renderStatusBadges(p, $("pStatusBadges"));

  $("pLvl").textContent = `Lv${p.level}`;
  const goldPill = $("goldPill");
  if (goldPill) {
    // Gold dipindah ke ACTION card (Town), jadi sembunyikan dari Player card
    goldPill.textContent = `Gold: ${p.gold}`;
    goldPill.style.display = "none";
  }
  const goldValue = $("goldValue");
  if (goldValue) goldValue.textContent = `${p.gold}`;
  const marketGoldValue = $("marketGoldValue");
  if (marketGoldValue) marketGoldValue.textContent = `${p.gold}`;
  const skillShopGoldValue = $("skillShopGoldValue");
  if (skillShopGoldValue) skillShopGoldValue.textContent = `${p.gold}`;
  const gemValue = $("gemValue");
  if (gemValue) gemValue.textContent = `${p.gems || 0}`;
  const marketGemValue = $("marketGemValue");
  if (marketGemValue) marketGemValue.textContent = `${p.gems || 0}`;
  const skillShopGemValue = $("skillShopGemValue");
  if (skillShopGemValue) skillShopGemValue.textContent = `${p.gems || 0}`;
  const allyPageGoldValue = $("allyPageGoldValue");
  if (allyPageGoldValue) allyPageGoldValue.textContent = `${p.gold}`;
  const allyPageGemValue = $("allyPageGemValue");
  if (allyPageGemValue) allyPageGemValue.textContent = `${p.gems || 0}`;

  // Player bars
  const prevPlayerHp = (typeof p._prevHp === "number") ? p._prevHp : p.hp;
  $("hpText").textContent = `${p.hp}/${p.maxHp}`;
  $("mpText").textContent = `${p.mp}/${p.maxMp}`;
  $("xpText").textContent = (p.level >= MAX_LEVEL) ? "MAX" : `${p.xp}/${p.xpToLevel}`;

  const playerHpBar = $("hpBar");
  setBar(playerHpBar, p.hp, p.maxHp);
  const playerHpBarWrap = playerHpBar ? playerHpBar.parentElement : null;
  if (playerHpBarWrap && p.hp < prevPlayerHp) {
    if (playerHpBarWrap._hpPulseTimer) clearTimeout(playerHpBarWrap._hpPulseTimer);
    playerHpBarWrap.classList.remove("hpPulse");
    void playerHpBarWrap.offsetWidth;
    playerHpBarWrap.classList.add("hpPulse");
    playerHpBarWrap._hpPulseTimer = setTimeout(() => {
      playerHpBarWrap.classList.remove("hpPulse");
    }, 360);
  }
  p._prevHp = p.hp;
  setBar($("mpBar"), p.mp, p.maxMp);
  setBar($("xpBar"), (p.level >= MAX_LEVEL ? p.xpToLevel : p.xp), p.xpToLevel);
  renderSkillSlots();
  const skillShopPage = $("skillShopPage");
  if (skillShopPage && !skillShopPage.classList.contains("hidden")) {
    renderSkillShopPage();
  }
  const allyPage = $("allyPage");
  if (allyPage && !allyPage.classList.contains("hidden")) {
    renderAllyPage();
  }

  document.body.classList.toggle("inBattle", !!inBattle);
  document.body.classList.toggle("inTown", !inBattle);
  document.body.classList.toggle("enemySingle", inBattle && getEnemyQueue().length <= 1);
  document.body.classList.toggle("enemyTriple", inBattle && getEnemyQueue().length === 3);
  if (inBattle) {
    const turnIndicator = $("turnIndicator");
    if (turnIndicator) {
      const listEl = $("turnIndicatorList");
      const aliveAllies = getAliveAllies();
      const cycle = [
        { kind: "player", label: "Kamu" },
        ...aliveAllies.map((ally) => ({ kind: "ally", label: ally.name })),
        { kind: "enemy", label: "Musuh" },
      ];
      const currentKind = state.turn === "enemy" ? "enemy" : "player";
      const currentIndex = cycle.findIndex((entry) => entry.kind === currentKind);
      const startIndex = currentIndex >= 0 ? currentIndex : 0;
      const slots = Math.min(3, cycle.length);

      if (listEl) {
        listEl.innerHTML = "";
        for (let i = 0; i < slots; i += 1) {
          const entry = cycle[(startIndex + i) % cycle.length];
          if (!entry) continue;
          const badge = document.createElement("span");
          badge.className = `turnBadge ${entry.kind}${i === 0 ? " current" : ""}`;
          badge.textContent = `${i === 0 ? "Now" : "Next"}: ${entry.label}`;
          listEl.appendChild(badge);
        }
      }
      turnIndicator.style.display = "flex";
    }
    closeMailboxOverlay();
  }

  const allyRow = $("allyRow");
  const playerCard = $("playerCard");
  if (allyRow && playerCard) {
    if (inBattle) {
      const allySlotTop = allyRow.querySelector('.allyCard.extra[data-ally-slot="1"]');
      const allySlotBottom = allyRow.querySelector('.allyCard.extra[data-ally-slot="2"]');
      if (allySlotBottom) {
        allyRow.insertBefore(playerCard, allySlotBottom);
      } else if (allySlotTop) {
        allySlotTop.insertAdjacentElement("afterend", playerCard);
      } else if (playerCard.parentElement !== allyRow) {
        allyRow.prepend(playerCard);
      }
    } else if (playerCard.parentElement !== allyRow) {
      allyRow.prepend(playerCard);
    }
  }

  if (inBattle) {
    const e = getPrimaryEnemy();

    $("modePill").textContent = "Battle";

    // turnCount/actionHint/battleHint hidden globally above

    // Enemy title + name
    const eNameTitle = $("eNameTitle");
    if (eNameTitle) eNameTitle.textContent = e ? e.name : "-";

    const eSub = $("eSub");
    if (eSub) {
      const label = inBattle ? "" : (e ? statusLabel(e) : "");
      eSub.textContent = label;
      eSub.style.display = label ? "block" : "none";
    }
    renderStatusBadges(e && e.hp > 0 ? e : null, $("eStatusBadges"));

    if (e) {
      $("eLvl").textContent = `Lv${e.level}`;
      const eAvatarBox = $("eAvatarBox");
      if (eAvatarBox) applyEnemyAvatar(eAvatarBox, e);
    } else {
      $("eLvl").textContent = "-";
    }

    // Enemy bars
    if (e) {
      $("enemyBars").style.display = "grid";
      $("eHpText").textContent = `${e.hp}/${e.maxHp}`;
      $("eMpText").textContent = `${e.mp}/${e.maxMp}`;
      const prevHp = (typeof e._prevHp === "number") ? e._prevHp : e.hp;
      const prevHpPct = e.maxHp ? clamp((prevHp / e.maxHp) * 100, 0, 100) : 0;
      const hpBar = $("eHpBar");
      if (hpBar) {
        const barWrap = hpBar.parentElement;
        if (barWrap) barWrap.dataset.prevPct = `${prevHpPct}`;
        setBar(hpBar, e.hp, e.maxHp);
        if (barWrap && e.hp < prevHp) {
          if (barWrap._hpPulseTimer) clearTimeout(barWrap._hpPulseTimer);
          barWrap.classList.remove("hpPulse");
          void barWrap.offsetWidth;
          barWrap.classList.add("hpPulse");
          barWrap._hpPulseTimer = setTimeout(() => {
            barWrap.classList.remove("hpPulse");
          }, 360);
        }
      }
      const mpBar = $("eMpBar");
      if (mpBar) setBar(mpBar, e.mp, e.maxMp);
      e._prevHp = e.hp;
    } else {
      $("enemyBars").style.display = "none";
    }

    // Buttons visibility
    $("townBtns").style.display = "none";
    $("battleBtns").style.display = (state.turn === "player" && !state.autoBattleEnabled) ? "flex" : "none";
    if (state.battleResult) {
      $("battleBtns").classList.add("disabled");
      $("battleBtns").querySelectorAll("button").forEach((b) => { b.disabled = true; });
    } else {
      $("battleBtns").classList.remove("disabled");
      $("battleBtns").querySelectorAll("button").forEach((b) => { b.disabled = false; });
    }

    const actionCard = $("actionCard");
    if (actionCard) actionCard.style.display = "block";

    const pAv = $("pAvatarWrap");
    if (pAv) pAv.style.display = "flex";
    const eAv = $("eAvatarWrap");
    if (eAv) eAv.style.display = "flex";

    // Animate player & enemy card muncul saat mulai battle dari Town
    if (state._animateEnemyIn) {
      const playerCard = $("playerCard");
      const enemyCard = $("enemyCard");

      const pop = (el) => {
        if (!el) return;
        el.classList.remove("popIn");
        void el.offsetWidth;
        el.classList.add("popIn");
        el.addEventListener("animationend", () => el.classList.remove("popIn"), { once: true });
      };

      pop(playerCard);
      pop(enemyCard);

      state._animateEnemyIn = false;
    }
    const xpGroup = $("xpGroup");
    if (xpGroup) xpGroup.style.display = "none";

    const enemyBtns = $("enemyBtns");
    if (enemyBtns) enemyBtns.style.display = "flex";
    const enemyCard = $("enemyCard");
    if (enemyCard) {
      const wasAlive = enemyCard.dataset.enemyAlive === "true";
      const isAlive = e ? e.hp > 0 : false;
      enemyCard.classList.toggle("down", !isAlive && !!e);
      if (wasAlive && !isAlive) {
        enemyCard.classList.remove("enemyDown");
        void enemyCard.offsetWidth;
        enemyCard.classList.add("enemyDown");
      }
      if (isAlive) enemyCard.classList.remove("enemyDown");
      if (e) {
        enemyCard.dataset.enemyAlive = isAlive ? "true" : "false";
      } else {
        delete enemyCard.dataset.enemyAlive;
      }
      enemyCard.classList.toggle("active", state.enemyTargetIndex === 0);
      enemyCard.onclick = () => {
        if (enemyCard.dataset.longPressTriggered === "true") {
          delete enemyCard.dataset.longPressTriggered;
          return;
        }
        if (setActiveEnemyByIndex(0)) {
          addLog("TARGET", `Target: ${getTargetEnemy()?.name || "Musuh"}`);
          refresh(state);
        }
      };
      bindLongPress(enemyCard, () => {
        const primary = getPrimaryEnemy();
        if (primary) openEnemyStatsModal(primary);
      });
    }
  } else {
    const turnIndicator = $("turnIndicator");
    if (turnIndicator) turnIndicator.style.display = "none";
    $("modePill").textContent = "Town";
    // turnCount/actionHint/battleHint hidden globally above

    const eNameTitle = $("eNameTitle");
    if (eNameTitle) eNameTitle.textContent = "-";

    const eSub = $("eSub");
    if (eSub) { eSub.textContent = ""; eSub.style.display = "none"; }

    $("eLvl").textContent = "-";
    $("enemyBars").style.display = "none";
    const eAv = $("eAvatarWrap");
    if (eAv) eAv.style.display = "none";
    const eAvatarBox = $("eAvatarBox");
    if (eAvatarBox) applyEnemyAvatar(eAvatarBox, null);

    $("townBtns").style.display = "flex";
    $("battleBtns").style.display = "none";
    const actionCard = $("actionCard");
    if (actionCard) actionCard.style.display = "block";

    const pAv = $("pAvatarWrap");
    if (pAv) pAv.style.display = "none";
    const xpGroup = $("xpGroup");
    if (xpGroup) xpGroup.style.display = "block";

    const enemyBtns = $("enemyBtns");
    if (enemyBtns) enemyBtns.style.display = "none";
    const enemyCard = $("enemyCard");
    if (enemyCard) {
      enemyCard.classList.remove("active");
      enemyCard.classList.remove("down", "enemyDown");
      delete enemyCard.dataset.enemyAlive;
      enemyCard.onclick = null;
    }
  }
  renderAllyRow();
  updateAllySlotBadge();
  renderEnemyRow();
  const playerCardLongPress = $("playerCard");
  if (playerCardLongPress) bindLongPress(playerCardLongPress, openStatsModal);
}


/* ===== main.js ===== */
const byId = (id) => document.getElementById(id);

const state = newState();
let autoBattleTimer = null;

function hasGlennUnlockRequirements(){
  const player = state.player;
  if (!player) return false;
  return (Number(player.level) || 0) >= 9 && (Number(player.highestStageCleared) || 0) >= 7;
}

function ensureGlennUnlockState({ source = "" } = {}){
  if (!state.player) return false;
  if (state.player.glennUnlocked) return true;
  if (!hasGlennUnlockRequirements()) return false;
  state.player.glennUnlocked = true;
  addLog("ALLY", `Glenn terbuka! (${source || "Syarat terpenuhi"})`);
  return true;
}

function ensureAllies(){
  if (!state.player) return [];
  ensureGlennUnlockState();
  if (!Array.isArray(state.player.allies)) state.player.allies = [];
  state.player.allies = state.player.allies.map(normalizeAlly).filter(Boolean);
  if (state.player.allies.length > 1) state.player.allies = [state.player.allies[0]];
  if (!state.player.glennUnlocked) {
    state.player.allies = [];
  } else if (!state.player.allies.length) {
    state.player.allies.push(normalizeAlly(createStarterAlly(0)));
  }
  if (state.player.glennUnlocked && state.player.allies[0] && state.player.allies[0].id !== "glenn") {
    state.player.allies[0] = normalizeAlly({ ...createStarterAlly(0), ...state.player.allies[0], id:"glenn", name:"Glenn", level:0, xp:0 });
  }
  if (state.player.glennUnlocked && !state.player._allyStarterInit) {
    state.player.allies[0] = normalizeAlly({ ...createStarterAlly(0), id:"glenn", name:"Glenn" });
    state.player._allyStarterInit = true;
  }
  state.allies = state.player.allies;
  return state.allies;
}

function restoreAllies(){
  const allies = ensureAllies();
  allies.forEach((ally) => {
    if (!ally) return;
    ally.hp = ally.maxHp;
    ally.mp = ally.maxMp;
  });
}

function getAliveAllies(){
  return ensureAllies().filter((ally) => ally && ally.hp > 0);
}

function pickEnemyTarget(){
  const allies = getAliveAllies();
  const stanceHolder = allies.find((ally) => hasStatus(ally, "stance"));
  if (stanceHolder) return { target: stanceHolder, isPlayer: false };
  if (!allies.length) return { target: state.player, isPlayer: true };
  const roll = randInt(1, 100);
  if (roll <= 60) return { target: state.player, isPlayer: true };
  return { target: pick(allies), isPlayer: false };
}

/* ------------------------------ Ally Page ------------------------------ */

const ALLY_TILE_ICONS = ["🛡️", "⚔️", "✨", "🏹", "🌙", "🔥"];
const ALLY_TILE_BACKGROUNDS = [
  "linear-gradient(135deg, #6f8dff, #334e9b)",
  "linear-gradient(135deg, #7ce1ff, #3f7896)",
  "linear-gradient(135deg, #ffb47c, #9c4c2c)",
  "linear-gradient(135deg, #c69bff, #5b3b95)",
  "linear-gradient(135deg, #8bd6a3, #2d6646)"
];

function getAllyVisual(ally, idx = 0){
  const seed = `${ally?.id || "ally"}-${idx}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
  const icon = ALLY_TILE_ICONS[Math.abs(hash) % ALLY_TILE_ICONS.length];
  const background = ALLY_TILE_BACKGROUNDS[Math.abs(hash) % ALLY_TILE_BACKGROUNDS.length];
  return { icon, background };
}

function setAllyPageVisible(show){
  const page = byId("allyPage");
  const marketPage = byId("marketPage");
  const skillPage = byId("skillShopPage");
  const blacksmithPage = byId("blacksmithPage");
  const huntPage = byId("monsterHuntPage");
  const wrap = document.querySelector(".wrap");
  if (!page || !wrap) return;
  if (show) {
    page.classList.remove("hidden");
    page.setAttribute("aria-hidden", "false");
    wrap.classList.add("hidden");
    if (marketPage) {
      marketPage.classList.add("hidden");
      marketPage.setAttribute("aria-hidden", "true");
    }
    if (skillPage) {
      skillPage.classList.add("hidden");
      skillPage.setAttribute("aria-hidden", "true");
    }
    if (blacksmithPage) {
      blacksmithPage.classList.add("hidden");
      blacksmithPage.setAttribute("aria-hidden", "true");
    }
    if (huntPage) {
      huntPage.classList.add("hidden");
      huntPage.setAttribute("aria-hidden", "true");
    }
  } else {
    page.classList.add("hidden");
    page.setAttribute("aria-hidden", "true");
    wrap.classList.remove("hidden");
    closeAllyDetailPopup();
  }
}



function levelUpAlly(allyIndex){
  const ally = ensureAllies()[allyIndex];
  if (!ally) return { ok:false, message:"Ally tidak ditemukan." };
  if ((ally.level || 0) >= MAX_LEVEL) return { ok:false, message:"Level Glenn sudah maksimal." };
  const cost = (ally.level + 1) * 120;
  if ((state.player.gold || 0) < cost) return { ok:false, message:`Gold tidak cukup. Butuh ${cost}.` };

  state.player.gold -= cost;
  ally.level += 1;
  ally.xp = 0;
  ally.xpToLevel = Math.round((ally.xpToLevel || 50) * 1.18);
  ally.maxHp += 10;
  ally.maxMp += 4;
  ally.atk += 2;
  ally.def += 2;
  ally.spd += 1;
  ally.hp = ally.maxHp;
  ally.mp = ally.maxMp;
  autosave(state);
  refresh(state);
  return { ok:true, message:`Glenn naik ke level ${ally.level}!` };
}

function openAllyDetailPopup(ally, idx = 0){
  const popup = byId("allyDetailPopup");
  if (!popup || !ally) return;
  const visual = getAllyVisual(ally, idx);
  const avatar = byId("allyDetailAvatar");
  const name = byId("allyDetailName");
  const role = byId("allyDetailRole");
  const stats = byId("allyDetailStats");
  const desc = byId("allyDetailDesc");
  const story = byId("allyDetailStory");
  const basic = byId("allyBasicAttack");
  const active = byId("allyActiveSkills");
  const passive = byId("allyPassiveSkill");
  const levelBtn = byId("allyDetailLevelUp");
  const progress = byId("allyDetailProgress");
  const xpText = byId("allyDetailXpText");
  const xpBar = byId("allyDetailXpBar");
  if (avatar) {
    avatar.textContent = visual.icon;
    avatar.style.background = visual.background;
  }
  if (name) name.textContent = ally.name || `Ally ${idx + 1}`;
  if (role) role.textContent = `${ally.role || "Ally"} • Lv ${ally.level ?? 0}/10`;
  if (stats) {
    const rows = [
      ["HP", `${ally.hp}/${ally.maxHp}`],
      ["MP", `${ally.mp}/${ally.maxMp}`],
      ["ATK", `${ally.atk || 0}`],
      ["DEF", `${ally.def || 0}`],
      ["SPD", `${ally.spd || 0}`],
      ["CRIT", `${ally.critChance || 0}%`]
    ];
    stats.innerHTML = rows.map(([label, value]) => `
      <div class="allyDetailStat">
        <span class="allyDetailStatLabel">${escapeHtml(label)}</span>
        <span class="allyDetailStatValue">${escapeHtml(value)}</span>
      </div>
    `).join("");
  }
  if (desc) desc.textContent = ally.description || "Belum ada deskripsi.";
  if (story) story.textContent = ally.story || "Belum ada story.";
  if (basic) basic.innerHTML = `<h5>${escapeHtml(ally.basicAttack?.name || "Basic Attack")}</h5><p>${escapeHtml(ally.basicAttack?.desc || "-")}</p>`;
  if (active) {
    active.innerHTML = (ally.activeSkills || []).slice(0, 2).map((skill, i) => `
      <div class="allySkillCard">
        <h5>${escapeHtml(skill.name || `Active ${i + 1}`)}</h5>
        <p>${escapeHtml(skill.desc || "-")}</p>
        <span class="allySkillCooldown">Cooldown ${escapeHtml(String(skill.cooldown || 1))} turn</span>
      </div>
    `).join("");
  }
  if (passive) {
    passive.innerHTML = `<h5>${escapeHtml(ally.passiveSkill?.name || "Passive")}</h5><p>${escapeHtml(ally.passiveSkill?.desc || "-")}</p>`;
  }
  if (progress) {
    progress.textContent = `Progress Level: Lv ${ally.level ?? 0}/10`;
  }
  const currentXp = Math.max(0, Number(ally.xp) || 0);
  const nextXp = Math.max(1, Number(ally.xpToLevel) || 1);
  const xpPct = (Number(ally.level) || 0) >= MAX_LEVEL ? 100 : clamp((currentXp / nextXp) * 100, 0, 100);
  if (xpText) xpText.textContent = (Number(ally.level) || 0) >= MAX_LEVEL ? "MAX" : `${currentXp}/${nextXp}`;
  if (xpBar) xpBar.style.width = `${xpPct}%`;
  if (levelBtn) {
    levelBtn.textContent = (Number(ally.level) || 0) >= MAX_LEVEL ? "Level Max (Lv10)" : `Level Up (Cost ${(Number(ally.level) + 1) * 120} Gold)`;
    levelBtn.disabled = (Number(ally.level) || 0) >= MAX_LEVEL;
    levelBtn.onclick = () => {
      const result = levelUpAlly(idx);
      addLog(result.ok ? "INFO" : "WARN", result.message);
      if (!result.ok && String(result.message || "").includes("Gold tidak cukup")) {
        modal.open(
          "Gold Tidak Cukup",
          [{ title: "Tutup", desc: result.message, value: "close" }],
          () => modal.close()
        );
      }
      openAllyDetailPopup(ensureAllies()[idx], idx);
      renderAllyPage();
    };
  }
  popup.classList.remove("hidden");
  popup.setAttribute("aria-hidden", "false");
}

function closeAllyDetailPopup(){
  const popup = byId("allyDetailPopup");
  if (!popup) return;
  popup.classList.add("hidden");
  popup.setAttribute("aria-hidden", "true");
}

function renderAllyPage(){
  ensureAllies();
  const grid = byId("allyGrid");
  if (!grid) return;
  const allies = Array.isArray(state.player?.allies) ? state.player.allies : [];
  if (!allies.length) {
    const p = state.player || {};
    const stageProgress = Math.min(7, Number(p.highestStageCleared) || 0);
    const levelProgress = Math.min(9, Number(p.level) || 0);
    grid.innerHTML = `<div class="marketEmptyState"><h3>Glenn masih terkunci</h3><p>Syarat: clear Stage 7 & capai level 9.</p><p>Progress: Stage ${stageProgress}/7 • Lv ${levelProgress}/9</p></div>`;
    return;
  }
  grid.innerHTML = "";
  allies.forEach((ally, idx) => {
    if (!ally) return;
    const visual = getAllyVisual(ally, idx);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "allyAvatarCard";
    card.innerHTML = `
      <div class="allyAvatarLevel">${escapeHtml(String(ally.level ?? 0))}</div>
      <div class="allyAvatarPortrait" style="background:${escapeHtml(visual.background)}">${escapeHtml(visual.icon)}</div>
      <div class="allyAvatarName">${escapeHtml(ally.name || `Ally ${idx + 1}`)}</div>
      <div class="allyAvatarMeta">${escapeHtml(ally.role || "Ally")}</div>
    `;
    card.onclick = () => openAllyDetailPopup(ally, idx);
    grid.appendChild(card);
  });
}

function openAllyPage(){
  if (state.inBattle) return;
  modal.close();
  setAllyPageVisible(true);
  renderAllyPage();
}

function ensureStatuses(entity){
  if (!entity) return [];
  if (!Array.isArray(entity.statuses)) entity.statuses = [];
  return entity.statuses;
}

function clearStatuses(entity){
  if (!entity) return;
  entity.statuses = [];
}

function addStatusEffect(entity, status){
  if (!entity || !status || !status.type) return;
  const list = ensureStatuses(entity);
  const existing = list.find((s) => s.type === status.type);
  const keepGraceTick = status.type !== "poison";
  if (existing){
    existing.turns = Math.max(existing.turns || 0, status.turns || 0);
    existing.debuff = status.debuff ?? existing.debuff;
    if (typeof status.pct === "number") existing.pct = status.pct;
    existing.justApplied = keepGraceTick;
  } else {
    list.push({ ...status, justApplied: keepGraceTick });
  }
}

function applyPoisonAtTurnEnd(entity){
  if (!entity || !Array.isArray(entity.statuses) || entity.maxHp <= 1) return 0;
  const poison = entity.statuses.find((s) => s.type === "poison" && (s.turns || 0) > 0);
  if (!poison) return 0;
  const pct = Math.max(0, Number(poison.pct || 0));
  if (pct <= 0) return 0;
  const reduce = Math.max(1, Math.floor((entity.maxHp || 0) * pct / 100));
  const beforeMaxHp = entity.maxHp || 0;
  entity.maxHp = Math.max(1, beforeMaxHp - reduce);
  if (typeof entity.hp === "number") entity.hp = clamp(entity.hp, 0, entity.maxHp);
  return beforeMaxHp - entity.maxHp;
}

function hasStatus(entity, type){
  return ensureStatuses(entity).find((s) => s.type === type && (s.turns || 0) > 0);
}

function tickStatuses(entity){
  if (!entity || !entity.statuses) return 0;
  const poisonLoss = applyPoisonAtTurnEnd(entity);
  if (poisonLoss > 0) {
    const label = entity === state.player ? "Kamu" : (entity.name || "Target");
    addLog("DEBUFF", `${label} terkena Poison: Max HP -${poisonLoss}.`);
  }
  let removed = 0;
  entity.statuses = entity.statuses
    .map((s) => {
      if (s.justApplied) {
        return { ...s, justApplied: false };
      }
      return { ...s, turns: (s.turns || 0) - 1 };
    })
    .filter((s) => {
      const alive = (s.turns || 0) > 0;
      if (!alive) removed += 1;
      return alive;
    });
  return removed;
}

function tryEscapeStatuses(entity){
  if (!entity || !Array.isArray(entity.statuses) || !entity.statuses.length) return 0;
  const chance = clamp(entity.escapeChance || 0, 0, 95);
  if (chance <= 0) return 0;
  let removed = 0;
  entity.statuses = entity.statuses.filter((s) => {
    if (!s.debuff) return true;
    const roll = randInt(1, 100);
    if (roll <= chance) { removed += 1; return false; }
    return true;
  });
  return removed;
}

function applyManaRegen(entity){
  if (!entity) return 0;
  const regen = Math.max(0, Math.round(entity.manaRegen || 0));
  if (regen <= 0 || typeof entity.mp !== "number") return 0;
  const before = entity.mp;
  entity.mp = clamp(entity.mp + regen, 0, entity.maxMp || 0);
  return entity.mp - before;
}

function applyDamageAfterDelay(target, dmg, slashTarget, delay = 200){
  if (!target || dmg <= 0) return 0;
  setTimeout(() => {
    target.hp = clamp((target.hp || 0) - dmg, 0, target.maxHp || 0);
    if (slashTarget === "player" || slashTarget === "enemy") {
      if (slashTarget === "player") {
        playCritShake("player");
      } else {
        playCritShake("enemy");
      }
    } else if (slashTarget && typeof slashTarget.enemyIndex === "number") {
      playEnemyCritShake(slashTarget.enemyIndex);
    } else if (slashTarget && slashTarget.ally) {
      playAllyCritShake(slashTarget.ally);
    }
    refresh(state);
  }, delay);
  return delay;
}

function equipItem(slot, itemName){
  const p = state.player;
  if (!p || !p.equipment) return false;
  const inv = p.inv || {};
  const it = inv[itemName];
  if (!it || (it.qty || 0) <= 0) return false;
  if (it.kind !== "gear") return false;
  if (it.slot !== slot) return false;
  const requiredLevel = Number(it.level || 1);
  if (Number.isFinite(requiredLevel) && (p.level || 1) < requiredLevel) {
    addLog("WARN", `Butuh Lv${requiredLevel} untuk memakai ${itemName}.`);
    return false;
  }
  p.equipment[slot] = itemName;
  applyEquipmentStats(p);
  autosave(state);
  addLog("INFO", `${itemName} dipakai di slot ${slot}.`);
  refresh(state);
  return true;
}

function unequipSlot(slot){
  const p = state.player;
  if (!p || !p.equipment) return false;
  if (!p.equipment[slot]) return false;
  const name = p.equipment[slot];
  p.equipment[slot] = null;
  applyEquipmentStats(p);
  autosave(state);
  addLog("INFO", `${name} dilepas dari slot ${slot}.`);
  refresh(state);
  return true;
}

function formatItemStats(item){
  if (!item) return "";
  const stats = [];
  if (typeof item.atk === "number" && item.atk !== 0) stats.push(`ATK +${item.atk}`);
  if (typeof item.def === "number" && item.def !== 0) stats.push(`DEF +${item.def}`);
  if (typeof item.spd === "number" && item.spd !== 0) stats.push(`SPD +${item.spd}`);
  return stats.length ? stats.join(" | ") : "";
}

function getShopItem(name){
  return SHOP_GOODS.find((g) => g.name === name);
}

function getMarketGoods(){
  const category = state.shopMarketCategory || "consumable";
  const equipCategory = state.shopEquipCategory || "weapon";
  if (category === "equipment") {
    const slot = equipCategory === "weapon" ? "hand" : equipCategory;
    return SHOP_GOODS.filter((g) => g.ref && g.ref.kind === "gear" && g.ref.slot === slot);
  }
  return SHOP_GOODS.filter((g) => g.ref && g.ref.kind !== "gear");
}

function getMarketSellGoods(){
  const inv = state.player.inv || {};
  const keys = Object.keys(inv);
  const category = state.shopMarketCategory || "consumable";
  const equipCategory = state.shopEquipCategory || "weapon";
  return keys.filter((name) => {
    const ref = inv[name];
    if (!ref) return false;
    if (category === "equipment") {
      const slot = equipCategory === "weapon" ? "hand" : equipCategory;
      return ref.kind === "gear" && ref.slot === slot;
    }
    return ref.kind !== "gear";
  });
}

function openMarketConfirm(mode, name){
  const g = getShopItem(name);
  const inv = state.player.inv || {};
  const ref = g?.ref || inv[name];
  if (!ref) return openShopModal(mode);
  const isBuy = mode === "buy";
  if (isBuy && !g) return openShopModal(mode);
  const basePrice = g?.price || 10;
  const gain = Math.max(1, Math.floor(basePrice / 2));
  const maxQty = !isBuy ? Math.max(1, Number(inv[name]?.qty || 1)) : 1;
  const startQty = !isBuy ? Math.min(Math.max(1, Number(state.marketSellQty || 1)), maxQty) : 1;
  state.marketSellQty = startQty;
  const priceValue = isBuy ? basePrice : gain * startQty;
  const priceText = `${priceValue} gold`;
  const actionLabel = isBuy ? "Beli" : "Jual";
  const title = name;
  const typeLabel = ref.kind === "gear" ? "Equipment" : "Consumable";
  const stats = [
    { label: "Tipe", value: typeLabel },
    { label: "Harga", value: priceText },
    !isBuy && maxQty > 1 ? { label: "Jumlah", value: String(startQty) } : null,
    ref.atk ? { label: "ATK", value: `+${ref.atk}` } : null,
    ref.def ? { label: "DEF", value: `+${ref.def}` } : null,
    ref.spd ? { label: "SPD", value: `+${ref.spd}` } : null,
  ].filter(Boolean);
  const statsHtml = stats.map((s) => {
    const statKey = s.label === "Harga" ? "price" : (s.label === "Jumlah" ? "qty" : "");
    const keyAttr = statKey ? ` data-stat="${statKey}"` : "";
    return `<div class="confirmStatRow"><span>${escapeHtml(s.label)}:</span><b${keyAttr}>${escapeHtml(String(s.value))}</b></div>`;
  }).join("");
  const qtyControls = !isBuy && maxQty > 1
    ? `
      <div class="confirmQtyRow">
        <button type="button" class="confirmQtyBtn" data-action="minus">-</button>
        <span class="confirmQtyValue" data-qty>${startQty}</span>
        <button type="button" class="confirmQtyBtn" data-action="plus">+</button>
      </div>
    `
    : "";
  const descHtml = `
    <div class="confirmDetailCard">
      <div class="confirmThumb">📦</div>
      <div class="confirmStats">
        ${statsHtml}
        ${qtyControls}
      </div>
    </div>
    <div class="confirmDesc">${escapeHtml(ref.desc || "Item")}</div>
  `;
  modal.open(
    title,
    [
      { title: "Detail", descHtml, meta: "", value: undefined, className: "confirmDetails" },
      {
        title: "",
        desc: "",
        meta: "",
        value: undefined,
        className: "confirmActions",
        buttons: [
          { text: "Batal", value: "back", className: "ghost wide" },
          { text: actionLabel.toUpperCase(), value: `confirm:${name}`, className: "primary wide" },
        ],
      },
    ],
    (pick) => {
      if (pick === "back") {
        modal.close();
        renderMarketPage();
        return;
      }
      if (!String(pick || "").startsWith("confirm:")) return;
      const qty = isBuy ? 1 : Math.min(Math.max(1, Number(state.marketSellQty || 1)), maxQty);
      const ok = isBuy ? buyItem(name) : sellItem(name, qty);
      if (!ok) showToast(isBuy ? "Gold tidak cukup atau item tidak tersedia." : "Item tidak bisa dijual.", "warn");
      renderMarketPage();
    }
  );

  if (!isBuy && maxQty > 1) {
    const modalBody = $("modalBody");
    const qtyValue = modalBody?.querySelector(".confirmQtyValue");
    const priceValueEl = modalBody?.querySelector('[data-stat="price"]');
    const qtyStatEl = modalBody?.querySelector('[data-stat="qty"]');
    const updateQtyDisplay = (nextQty) => {
      state.marketSellQty = nextQty;
      if (qtyValue) qtyValue.textContent = String(nextQty);
      if (qtyStatEl) qtyStatEl.textContent = String(nextQty);
      if (priceValueEl) priceValueEl.textContent = `${gain * nextQty} gold`;
    };
    modalBody?.querySelectorAll(".confirmQtyBtn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const action = btn.getAttribute("data-action");
        let nextQty = Number(state.marketSellQty || 1);
        if (action === "minus") nextQty = Math.max(1, nextQty - 1);
        if (action === "plus") nextQty = Math.min(maxQty, nextQty + 1);
        updateQtyDisplay(nextQty);
      };
    });
  }
}

function buyItem(name){
  const p = state.player;
  const g = getShopItem(name);
  if (!p || !g || !g.ref) return false;
  if (p.gold < g.price) return false;
  p.gold -= g.price;
  const inv = p.inv || (p.inv = {});
  if (inv[name]) inv[name].qty += 1;
  else inv[name] = { ...g.ref, qty:1 };
  autosave(state);
  addLog("GOLD", `Beli ${name} (-${g.price} gold)`);
  showToast(`Beli ${name} (-${g.price} gold)`, "gold");
  pulseGold();
  pulseMarketGrid();
  refresh(state);
  return true;
}

function sellItem(name, qty = 1){
  const p = state.player;
  if (!p || !p.inv || !p.inv[name]) return false;
  const inv = p.inv[name];
  const base = getShopItem(name)?.price || 10;
  const gain = Math.max(1, Math.floor(base / 2));
  const sellQty = Math.min(Math.max(1, Number(qty || 1)), inv.qty);
  if (!sellQty) return false;
  inv.qty -= sellQty;
  if (inv.qty <= 0) delete p.inv[name];
  p.gold += gain * sellQty;
  autosave(state);
  addLog("GOLD", `Jual ${name} x${sellQty} (+${gain * sellQty} gold)`);
  showToast(`Jual ${name} x${sellQty} (+${gain * sellQty} gold)`, "gold");
  pulseGold();
  pulseMarketGrid();
  refresh(state);
  return true;
}

function learnSkill(skillKey){
  const p = state.player;
  const skill = SKILLS[skillKey];
  const entry = SHOP_SKILLS.find((s) => s.key === skillKey);
  if (!p || !skill || !entry) return { ok:false, reason:"not_found" };
  const already = Array.isArray(p.skills) && p.skills.some((s) => s.name === skill.name);
  if (already) return { ok:false, reason:"learned" };
  if ((p.level || 1) < entry.level) return { ok:false, reason:"level" };
  if ((p.gold || 0) < entry.price) return { ok:false, reason:"gold" };
  p.gold -= entry.price;
  if (!Array.isArray(p.skills)) p.skills = [];
  p.skills.push({ ...skill, cdLeft:0, level: entry.level });
  if (!Array.isArray(p.skillSlots)) {
    p.skillSlots = Array.from({ length: 8 }, () => null);
  }
  const emptyIdx = p.skillSlots.findIndex((slot) => !slot);
  if (emptyIdx >= 0) p.skillSlots[emptyIdx] = skill.name;
  autosave(state);
  addLog("GOLD", `Belajar ${skill.name} (-${entry.price} gold)`);
  refresh(state);
  return { ok:true };
}

function setMarketPageVisible(show){
  const page = byId("marketPage");
  const skillPage = byId("skillShopPage");
  const allyPage = byId("allyPage");
  const blacksmithPage = byId("blacksmithPage");
  const huntPage = byId("monsterHuntPage");
  const wrap = document.querySelector(".wrap");
  if (!page || !wrap) return;
  if (show) {
    page.classList.remove("hidden");
    page.setAttribute("aria-hidden", "false");
    wrap.classList.add("hidden");
    if (skillPage) {
      skillPage.classList.add("hidden");
      skillPage.setAttribute("aria-hidden", "true");
    }
    if (allyPage) {
      allyPage.classList.add("hidden");
      allyPage.setAttribute("aria-hidden", "true");
    }
    if (blacksmithPage) {
      blacksmithPage.classList.add("hidden");
      blacksmithPage.setAttribute("aria-hidden", "true");
    }
    if (huntPage) {
      huntPage.classList.add("hidden");
      huntPage.setAttribute("aria-hidden", "true");
    }
  } else {
    page.classList.add("hidden");
    page.setAttribute("aria-hidden", "true");
    wrap.classList.remove("hidden");
  }
}

function setSkillShopPageVisible(show){
  const page = byId("skillShopPage");
  const marketPage = byId("marketPage");
  const allyPage = byId("allyPage");
  const blacksmithPage = byId("blacksmithPage");
  const huntPage = byId("monsterHuntPage");
  const wrap = document.querySelector(".wrap");
  if (!page || !wrap) return;
  if (show) {
    page.classList.remove("hidden");
    page.setAttribute("aria-hidden", "false");
    wrap.classList.add("hidden");
    if (marketPage) {
      marketPage.classList.add("hidden");
      marketPage.setAttribute("aria-hidden", "true");
    }
    if (allyPage) {
      allyPage.classList.add("hidden");
      allyPage.setAttribute("aria-hidden", "true");
    }
    if (blacksmithPage) {
      blacksmithPage.classList.add("hidden");
      blacksmithPage.setAttribute("aria-hidden", "true");
    }
    if (huntPage) {
      huntPage.classList.add("hidden");
      huntPage.setAttribute("aria-hidden", "true");
    }
  } else {
    page.classList.add("hidden");
    page.setAttribute("aria-hidden", "true");
    wrap.classList.remove("hidden");
  }
}

function ensureMarketState(){
  if (!state.marketMode) state.marketMode = "buy";
  if (!state.shopMarketCategory) state.shopMarketCategory = "equipment";
  if (!state.shopEquipCategory) state.shopEquipCategory = "weapon";
}

function createMarketToggleButton(label, isActive, onClick){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `marketToggleBtn${isActive ? " active" : ""}`;
  btn.textContent = label;
  btn.onclick = onClick;
  return btn;
}

function createMarketTabButton({ label, desc, icon, iconSrc, isActive, onClick, onlyIcon }){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `marketTabBtn${isActive ? " active" : ""}${onlyIcon ? " iconOnly" : ""}`;
  if (label) btn.setAttribute("aria-label", label);
  if (iconSrc) {
    btn.innerHTML = `<img class="marketTabIcon" src="${escapeHtml(iconSrc)}" alt="" />`;
  } else {
    btn.innerHTML = `${icon ? `${icon} ` : ""}${label}${desc ? `<small>${desc}</small>` : ""}`;
  }
  btn.onclick = onClick;
  return btn;
}

function renderMarketToggle(){
  const toggle = byId("marketModeToggle");
  if (!toggle) return;
  toggle.innerHTML = "";
  toggle.appendChild(createMarketToggleButton("Beli", state.marketMode === "buy", () => {
    state.marketMode = "buy";
    renderMarketPage();
  }));
  toggle.appendChild(createMarketToggleButton("Jual", state.marketMode === "sell", () => {
    state.marketMode = "sell";
    renderMarketPage();
  }));
}

function renderMarketTabs(){
  const categoryTabs = byId("marketCategoryTabs");
  const equipTabs = byId("marketEquipTabs");
  if (!categoryTabs || !equipTabs) return;
  categoryTabs.innerHTML = "";
  equipTabs.innerHTML = "";
  const categories = [
    { key:"equipment", label:"Equipment", icon:"🛡️", desc:"Senjata & armor." },
    { key:"consumable", label:"Consumable", icon:"🧪", desc:"Potion & item sekali pakai." },
  ];
  const equipCategories = [
    { key:"weapon", label:"Weapon", iconSrc:"./assets/icons/weapon.svg" },
    { key:"head", label:"Head", iconSrc:"./assets/icons/head.svg" },
    { key:"armor", label:"Armor", iconSrc:"./assets/icons/armor.svg" },
    { key:"pant", label:"Pant", iconSrc:"./assets/icons/pant.svg" },
    { key:"shoes", label:"Shoes", iconSrc:"./assets/icons/shoes.svg" },
  ];
  categories.forEach((c) => {
    categoryTabs.appendChild(createMarketTabButton({
      label: c.label,
      desc: c.desc,
      icon: c.icon,
      isActive: state.shopMarketCategory === c.key,
      onClick: () => {
        state.shopMarketCategory = c.key;
        if (c.key !== "equipment") state.shopEquipCategory = "weapon";
        renderMarketPage();
      },
    }));
  });
  if (state.shopMarketCategory === "equipment") {
    equipCategories.forEach((c) => {
      equipTabs.appendChild(createMarketTabButton({
        label: c.label,
        iconSrc: c.iconSrc,
        isActive: state.shopEquipCategory === c.key,
        onlyIcon: true,
        onClick: () => {
          state.shopEquipCategory = c.key;
          renderMarketPage();
        },
      }));
    });
  }
}

function renderMarketItems(){
  const grid = byId("marketItemsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const mode = state.marketMode || "buy";
  const emptyState = () => {
    const empty = document.createElement("div");
    empty.className = "marketEmptyState";
    empty.innerHTML = "<h3>Belum ada item</h3><p>Silakan pilih kategori lain atau kembali lagi nanti.</p>";
    grid.appendChild(empty);
  };
  if (mode === "buy") {
    const goods = getMarketGoods().slice(0, 9);
    if (!goods.length) return emptyState();
    goods.forEach((g) => {
      const ref = g.ref || {};
      const level = ref?.level;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "marketItemCard compact";
      card.setAttribute("aria-label", `${g.name} (${g.price} gold)`);
      card.innerHTML = `
        <div class="marketItemThumb">📦${level ? `<span class="marketItemLevel">Lv.${level}</span>` : ""}</div>
        <span class="marketItemLabel">${g.name}</span>
      `;
      card.onclick = () => openMarketConfirm("buy", g.name);
      grid.appendChild(card);
    });
    return;
  }
  const inv = state.player.inv || {};
  const sellKeys = getMarketSellGoods().slice(0, 9);
  if (!sellKeys.length) return emptyState();
  sellKeys.forEach((name) => {
    const ref = inv[name];
    const price = Math.max(1, Math.floor((getShopItem(name)?.price || 10) / 2));
    const level = ref?.level;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "marketItemCard compact";
    card.setAttribute("aria-label", `${name} x${ref.qty} (+${price} gold)`);
    card.innerHTML = `
      <div class="marketItemThumb">📤${level ? `<span class="marketItemLevel">Lv.${level}</span>` : ""}</div>
      <span class="marketItemLabel">${name}</span>
      <span class="marketItemBadge">x${ref.qty}</span>
    `;
    card.onclick = () => openMarketConfirm("sell", name);
    grid.appendChild(card);
  });
}

function renderMarketPage(){
  ensureMarketState();
  renderMarketToggle();
  renderMarketTabs();
  renderMarketItems();
}

function openMarketPage(){
  if (state.inBattle) return;
  modal.close();
  setMarketPageVisible(true);
  state.shopMarketCategory = "equipment";
  renderMarketPage();
}

function ensureSkillShopState(){
  if (!state.skillShopCategory) state.skillShopCategory = "fire";
}

function createSkillCategoryButton({ label, iconSrc, isActive, onClick }){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `skillCategoryBtn${isActive ? " active" : ""}`;
  btn.innerHTML = `<img src="${escapeHtml(iconSrc)}" alt="" /><span>${escapeHtml(label)}</span>`;
  btn.onclick = onClick;
  return btn;
}

function getSkillShopEntries(){
  return SHOP_SKILLS.map((entry) => {
    const skill = SKILLS[entry.key];
    if (!skill) return null;
    return { ...entry, skill };
  }).filter(Boolean);
}

function renderSkillShopTabs(){
  const tabs = byId("skillShopCategoryTabs");
  if (!tabs) return;
  tabs.innerHTML = "";
  SKILL_SHOP_CATEGORIES.forEach((category) => {
    const btn = createSkillCategoryButton({
      label: category.label,
      iconSrc: category.iconSrc,
      isActive: state.skillShopCategory === category.key,
      onClick: () => {
        state.skillShopCategory = category.key;
        renderSkillShopItems();
        renderSkillShopTabs();
      },
    });
    if (category.key === "physical") btn.classList.add("divider");
    tabs.appendChild(btn);
  });
}

function renderSkillShopItems(){
  const label = byId("skillShopLabel");
  const grid = byId("skillShopItemsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  if (label) {
    const categoryLabel = SKILL_SHOP_CATEGORIES.find((category) => category.key === state.skillShopCategory)?.label || "Skill";
    label.textContent = `${categoryLabel} Skill`.toUpperCase();
  }
  const entries = getSkillShopEntries()
    .filter((entry) => entry.skill && entry.skill.element === state.skillShopCategory);
  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "skillShopEmpty";
    empty.innerHTML = "<h3>Belum ada skill</h3><p>Skill elemen ini belum tersedia.</p>";
    grid.appendChild(empty);
    return;
  }
  entries.forEach((entry) => {
    const skill = entry.skill;
    const learned = Array.isArray(state.player.skills)
      && state.player.skills.some((s) => s && s.name === skill.name);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "skillShopCard";
    card.innerHTML = `
      <div class="skillShopCardHeader">
        <div class="skillShopThumb">
          ${skill.icon ? `<img src="${escapeHtml(skill.icon)}" alt="" />` : ""}
        </div>
        <div class="skillShopInfo">
          <div class="skillShopCardTitle">${escapeHtml(skill.name)}</div>
          <div class="skillShopLevel">Lv ${escapeHtml(String(entry.level || 1))}</div>
        </div>
      </div>
      <span class="skillShopBadge">${learned ? "Owned" : `${entry.price} gold`}</span>
    `;
    card.onclick = () => openSkillConfirm(entry.key);
    grid.appendChild(card);
  });
}

function renderSkillShopPage(){
  ensureSkillShopState();
  renderSkillShopTabs();
  renderSkillShopItems();
}

function openSkillShopPage(){
  if (state.inBattle) return;
  modal.close();
  setSkillShopPageVisible(true);
  renderSkillShopPage();
}

function openSkillConfirm(skillKey){
  const entry = SHOP_SKILLS.find((s) => s.key === skillKey);
  const skill = SKILLS[skillKey];
  if (!entry || !skill) {
    openSkillShopPage();
    return;
  }
  const learned = Array.isArray(state.player.skills)
    && state.player.skills.some((s) => s && s.name === skill.name);
  const stats = [
    { label: "Level", value: `Lv ${entry.level}` },
    { label: "MP", value: `${skill.mpCost}`, icon: "./assets/icons/mp.svg" },
    { label: "Damage", value: `${skill.power}`, icon: "./assets/icons/damage.svg" },
    { label: "Cooldown", value: `${skill.cooldown || 0}`, icon: "./assets/icons/cooldown.svg" },
  ];
  const statsHtml = stats.map((s) => {
    const iconHtml = s.icon ? `<img src="${escapeHtml(s.icon)}" alt="" />` : "";
    return `<div class="confirmStatRow icon"><span>${iconHtml}${escapeHtml(s.label)}:</span><b>${escapeHtml(String(s.value))}</b></div>`;
  }).join("");
  const descText = skill.desc || "Skill";
  let descEscaped = escapeHtml(descText);
  if (descText.includes("Stun")) {
    descEscaped = descEscaped.replace(/Stun/g, `<span class="skillEffectHighlight">Stun</span>`);
  }
  const descHtmlText = `${descEscaped}`;
  const descHtml = `
    <div class="confirmDetailCard">
      <div class="confirmThumb">${skill.icon ? `<img src="${escapeHtml(skill.icon)}" alt="" />` : "✨"}</div>
      <div class="confirmStats">${statsHtml}</div>
    </div>
    <div class="confirmDesc">${descHtmlText}</div>
    <div class="skillConfirmPrice">
      <img src="./assets/icons/coin.svg" alt="" />
      <span>${entry.price}</span>
    </div>
  `;
  modal.open(
    skill.name,
    [
      { title: "Detail", descHtml, meta: "", value: undefined, className: "confirmDetails" },
      {
        title: "",
        desc: "",
        meta: "",
        value: undefined,
        className: "confirmActions",
        buttons: [
          { text: "Batal", value: "back", className: "ghost wide" },
          { text: learned ? "Owned" : "Beli", value: `confirm:${skillKey}`, className: "primary wide", disabled: learned },
        ],
      },
    ],
    (pick) => {
      if (pick === "back") {
        modal.close();
        renderSkillShopPage();
        return;
      }
      if (!String(pick || "").startsWith("confirm:")) return;
      const res = learnSkill(skillKey);
      if (!res.ok) {
        if (res.reason === "gold") showToast("Gold tidak cukup.", "warn");
        if (res.reason === "learned") showToast("Skill sudah dimiliki.", "warn");
        return;
      }
      modal.close();
      renderSkillShopPage();
    }
  );
}

function openShopModal(mode = "menu"){
  if (state.inBattle) return;
  if (mode === "menu"){
    modal.open(
      "Shop",
      [
        { title: "Market", desc: "Beli / jual item.", meta: "", value: "market" },
        { title: "Skill Shop", desc: "Pilih & beli skill element.", meta: "", value: "skill-shop" },
      ],
      (pick) => {
        if (pick === "market") return openMarketPage();
        if (pick === "skill-shop") return openSkillShopPage();
        openShopModal(String(pick || "menu"));
      }
    );
    return;
  }

  if (mode === "market"){
    modal.open(
      "Market",
      [
        { title: "Back", desc: "Kembali ke menu Shop.", meta: "", value: "back", className: "subMenuBack" },
        { title: "Beli", desc: "Beli item.", meta: "", value: "buy" },
        { title: "Jual", desc: "Jual item di inventory.", meta: "", value: "sell" },
      ],
      (pick) => {
        if (pick === "back") return openShopModal("menu");
        openShopModal(String(pick || "market"));
      }
    );
    return;
  }

  if (mode === "buy"){
    const categories = [
      { key:"consumable", label:"Consumable", icon:"🧪", desc:"Potion & item sekali pakai." },
      { key:"equipment", label:"Equipment", icon:"🛡️", desc:"Senjata & armor." },
    ];
    const equipCategories = [
      { key:"weapon", label:"Weapon", icon:"🗡️", slot:"hand", desc:"Slot: Hand" },
      { key:"head", label:"Head", icon:"🪖", slot:"head", desc:"Slot: Head" },
      { key:"armor", label:"Armor", icon:"🥋", slot:"armor", desc:"Slot: Armor" },
      { key:"pant", label:"Pant", icon:"👖", slot:"pant", desc:"Slot: Pant" },
      { key:"shoes", label:"Shoes", icon:"🥾", slot:"shoes", desc:"Slot: Shoes" },
    ];
    const categoryChoices = categories.map((c) => ({
      title: `${c.icon} ${c.label}`,
      desc: c.desc || "",
      meta: "",
      value: `cat:${c.key}`,
      className: `marketCategory marketPrimary ${state.shopMarketCategory === c.key ? "active" : ""}`.trim(),
    }));
    const equipChoices = (state.shopMarketCategory === "equipment")
      ? equipCategories.map((c) => ({
          title: c.icon || c.label,
          desc: "",
          meta: "",
          value: `equipcat:${c.key}`,
          className: `marketCategory marketSub ${state.shopEquipCategory === c.key ? "active" : ""}`.trim(),
        }))
      : [];

    const goods = getMarketGoods();
    modal.open(
      "Market - Beli",
      [{ title: "Back", desc: "Kembali ke Market.", meta: "", value: "back", className: "subMenuBack" }]
        .concat(categoryChoices)
        .concat(equipChoices)
        .concat([{ title: "Item Market", desc: "", meta: "", value: undefined, className: "marketDivider readonly" }])
        .concat(
          goods.map((g) => ({
            title: `${g.name}`,
            desc: g.ref.desc || "Item",
            meta: `${g.price} gold`,
            value: `buy:${g.name}`,
          }))
        ),
      (pick) => {
        if (pick === "back") return openShopModal("market");
        const name = String(pick || "").replace(/^buy:/, "");
        if (String(pick || "").startsWith("cat:")) {
          state.shopMarketCategory = String(pick || "").replace("cat:", "");
          if (state.shopMarketCategory !== "equipment") state.shopEquipCategory = "weapon";
          openShopModal("buy");
          return;
        }
        if (String(pick || "").startsWith("equipcat:")) {
          state.shopEquipCategory = String(pick || "").replace("equipcat:", "");
          openShopModal("buy");
          return;
        }
        openMarketConfirm("buy", name);
      }
    );
    return;
  }

  if (mode === "sell"){
    const categories = [
      { key:"consumable", label:"Consumable", icon:"🧪", desc:"Potion & item sekali pakai." },
      { key:"equipment", label:"Equipment", icon:"🛡️", desc:"Gear & perlengkapan." },
    ];
    const equipCategories = [
      { key:"weapon", label:"Weapon", icon:"🗡️", slot:"hand", desc:"Slot: Hand" },
      { key:"head", label:"Head", icon:"🪖", slot:"head", desc:"Slot: Head" },
      { key:"armor", label:"Armor", icon:"🥋", slot:"armor", desc:"Slot: Armor" },
      { key:"pant", label:"Pant", icon:"👖", slot:"pant", desc:"Slot: Pant" },
      { key:"shoes", label:"Shoes", icon:"🥾", slot:"shoes", desc:"Slot: Shoes" },
    ];
    const categoryChoices = categories.map((c) => ({
      title: `${c.icon} ${c.label}`,
      desc: c.desc || "",
      meta: "",
      value: `cat:${c.key}`,
      className: `marketCategory marketPrimary ${state.shopMarketCategory === c.key ? "active" : ""}`.trim(),
    }));
    const equipChoices = (state.shopMarketCategory === "equipment")
      ? equipCategories.map((c) => ({
          title: c.icon || c.label,
          desc: "",
          meta: "",
          value: `equipcat:${c.key}`,
          className: `marketCategory marketSub ${state.shopEquipCategory === c.key ? "active" : ""}`.trim(),
        }))
      : [];

    const inv = state.player.inv || {};
    const sellKeys = getMarketSellGoods();
    const rows = sellKeys.length
      ? sellKeys.map((k) => {
          const price = Math.max(1, Math.floor((getShopItem(k)?.price || 10) / 2));
          return { title: `${k} x${inv[k].qty}`, desc: inv[k].desc || "Item", meta: `+${price} gold`, value: `sell:${k}` };
        })
      : [{ title: "Tidak ada item", desc: "Inventory kosong.", meta: "", value: undefined, className: "readonly" }];

    modal.open(
      "Market - Jual",
      [{ title: "Back", desc: "Kembali ke Market.", meta: "", value: "back", className: "subMenuBack" }]
        .concat(categoryChoices)
        .concat(equipChoices)
        .concat([{ title: "Item Dijual", desc: "", meta: "", value: undefined, className: "marketDivider readonly" }])
        .concat(rows),
      (pick) => {
        if (pick === "back") return openShopModal("market");
        const name = String(pick || "").replace(/^sell:/, "");
        if (String(pick || "").startsWith("cat:")) {
          state.shopMarketCategory = String(pick || "").replace("cat:", "");
          if (state.shopMarketCategory !== "equipment") state.shopEquipCategory = "weapon";
          openShopModal("sell");
          return;
        }
        if (String(pick || "").startsWith("equipcat:")) {
          state.shopEquipCategory = String(pick || "").replace("equipcat:", "");
          openShopModal("sell");
          return;
        }
        openMarketConfirm("sell", name);
      }
    );
  }
}

const MONSTER_HUNT_BOSSES = [
  {
    id: "wyrm10",
    level: 10,
    name: "Ancient Wyrm",
    avatar: "🐉",
    note: "Boss starter untuk material craft dasar.",
    story: "Wyrm kuno yang bangkit dari reruntuhan gua api. Sisiknya keras, tapi inti mana di dadanya mulai retak.",
    drops: ["Wyrm Scale", "Ancient Bone", "Molten Core"],
  },
  {
    id: "behemoth20",
    level: 20,
    name: "Crimson Behemoth",
    avatar: "🦏",
    note: "Boss elite dengan material craft langka.",
    story: "Raksasa merah penjaga altar darah. Setiap hentakan kakinya mengguncang tanah dan memecah armor biasa.",
    drops: ["Behemoth Horn", "Crimson Carapace", "Blood Crystal"],
  },
];

const BLACKSMITH_RECIPES = [
  {
    id: "eclipsed-runebreaker",
    resultName: "Eclipsed Runebreaker",
    resultRef: ITEMS.eclipsedRunebreaker,
    materials: [
      { name: "Rune Blade", qty: 1 },
      { name: "Wyrm Scale", qty: 3 },
      { name: "Molten Core", qty: 1 },
      { name: "Behemoth Horn", qty: 2 },
      { name: "Blood Crystal", qty: 1 },
    ],
  },
];

function getInventoryQty(name){
  return Math.max(0, Number(state.player?.inv?.[name]?.qty || 0));
}

function canCraftRecipe(recipe){
  if (!recipe || !Array.isArray(recipe.materials)) return false;
  return recipe.materials.every((m) => getInventoryQty(m.name) >= m.qty);
}

function consumeMaterial(name, qty){
  const inv = state.player?.inv;
  if (!inv || !inv[name]) return false;
  inv[name].qty = Math.max(0, Number(inv[name].qty || 0) - qty);
  if (inv[name].qty <= 0) delete inv[name];
  return true;
}

function craftBlacksmithRecipe(recipeId){
  const recipe = BLACKSMITH_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { ok:false, reason:"recipe" };
  if (!canCraftRecipe(recipe)) return { ok:false, reason:"material" };
  recipe.materials.forEach((m) => consumeMaterial(m.name, m.qty));
  const resultName = recipe.resultName;
  const inv = state.player.inv || (state.player.inv = {});
  if (inv[resultName]) inv[resultName].qty += 1;
  else inv[resultName] = { ...recipe.resultRef, qty:1 };
  autosave(state);
  return { ok:true, resultName };
}

function openBlacksmithRecipeDetail(recipeId){
  const recipe = BLACKSMITH_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return;
  const canCraft = canCraftRecipe(recipe);
  const levelBadge = Number(recipe.resultRef?.level || 1);
  const mats = recipe.materials
    .map((m) => {
      const own = getInventoryQty(m.name);
      return `${m.name} ${own}/${m.qty}`;
    })
    .join(" • ");

  modal.open(
    recipe.resultName,
    [
      {
        title: `Lv ${levelBadge} Weapon`,
        desc: recipe.resultRef?.desc || "",
        meta: "",
        value: undefined,
        className: "readonly",
      },
      {
        title: "Stat",
        desc: "+25 ATK • +7 DEF Penetration • Basic Hit: Accuracy musuh -20% (1 turn)",
        meta: "",
        value: undefined,
        className: "readonly",
      },
      {
        title: "Resep",
        desc: mats,
        meta: "",
        value: undefined,
        className: "readonly",
      },
      {
        title: canCraft ? "Forge" : "Material belum cukup",
        desc: canCraft ? "Tempa senjata ini sekarang." : "Farm material dari Monster Hunting dulu.",
        meta: "",
        value: canCraft ? `forge:${recipe.id}` : undefined,
        className: canCraft ? "" : "readonly",
      },
    ],
    (pick) => {
      if (!String(pick || "").startsWith("forge:")) return;
      const targetId = String(pick).replace("forge:", "");
      const res = craftBlacksmithRecipe(targetId);
      if (!res.ok) {
        showToast("Material belum cukup untuk forging.", "warn");
        return;
      }
      addLog("FORGE", `${res.resultName} berhasil ditempa di Blacksmith.`);
      showToast(`${res.resultName} forged!`, "good");
      refresh(state);
      renderBlacksmithPage();
      openBlacksmithRecipeDetail(targetId);
    }
  );
}

function renderBlacksmithPage(){
  const grid = byId("blacksmithCraftGrid");
  if (!grid) return;
  const goldEl = byId("blacksmithGoldValue");
  const gemEl = byId("blacksmithGemValue");
  if (goldEl) goldEl.textContent = String(state.player?.gold || 0);
  if (gemEl) gemEl.textContent = String(state.player?.gems || 0);

  grid.classList.add("blacksmithAvatarGrid");
  grid.innerHTML = BLACKSMITH_RECIPES.map((recipe) => {
    const levelBadge = Number(recipe.resultRef?.level || 1);
    return `
      <button type="button" class="blacksmithAvatarBtn" data-recipe-id="${escapeHtml(recipe.id)}" aria-label="${escapeHtml(recipe.resultName)}">
        <span class="blacksmithLevelBadge">Lv ${levelBadge}</span>
        <span class="blacksmithAvatarIcon" aria-hidden="true">⚔️</span>
        <span class="blacksmithAvatarName">${escapeHtml(recipe.resultName)}</span>
      </button>
    `;
  }).join("");

  grid.querySelectorAll("[data-recipe-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const recipeId = btn.getAttribute("data-recipe-id") || "";
      openBlacksmithRecipeDetail(recipeId);
    });
  });
}

function setBlacksmithPageVisible(show){
  const page = byId("blacksmithPage");
  const marketPage = byId("marketPage");
  const skillPage = byId("skillShopPage");
  const allyPage = byId("allyPage");
  const huntPage = byId("monsterHuntPage");
  const wrap = document.querySelector(".wrap");
  if (!page || !wrap) return;
  if (show) {
    renderBlacksmithPage();
    page.classList.remove("hidden");
    page.setAttribute("aria-hidden", "false");
    wrap.classList.add("hidden");
    if (marketPage) marketPage.classList.add("hidden");
    if (skillPage) skillPage.classList.add("hidden");
    if (allyPage) allyPage.classList.add("hidden");
    if (huntPage) huntPage.classList.add("hidden");
  } else {
    page.classList.add("hidden");
    page.setAttribute("aria-hidden", "true");
    wrap.classList.remove("hidden");
  }
}

function createBossEnemy(level, name){
  const lv = Math.max(1, Number(level) || 1);
  const isAncientWyrm = String(name || "").toLowerCase() === "ancient wyrm";
  const isCrimsonBehemoth = String(name || "").toLowerCase() === "crimson behemoth";
  const enemy = {
    name,
    level: lv,
    maxHp: 80 + lv * 14,
    maxMp: 30 + lv * 5,
    hp: 80 + lv * 14,
    mp: 30 + lv * 5,
    atk: 10 + lv * 3,
    def: 5 + lv * 2,
    spd: 6 + lv,
    str: lv,
    dex: Math.max(0, Math.floor(lv * 0.7)),
    int: Math.max(0, Math.floor(lv * 0.7)),
    vit: Math.max(0, Math.floor(lv * 1.4)),
    critChance: clamp(8 + Math.floor(lv / 2), 8, 40),
    critDamage: 0,
    acc: Math.max(0, Math.floor(lv / 4)),
    foc: 0,
    combustionChance: 0,
    evasion: clamp(4 + Math.floor(lv / 8), 4, 18),
    baseBlockRate: 0,
    baseEscapeChance: clamp(2 + Math.floor(lv / 10), 2, 14),
    blockRate: 0,
    escapeChance: 0,
    manaRegen: 0,
    statuses: [],
    xpReward: 35 + lv * 8,
    goldReward: 20 + lv * 5,
  };

  if (isAncientWyrm) {
    enemy.maxHp = Math.round(enemy.maxHp * 1.9);
    enemy.hp = enemy.maxHp;
    enemy.def = Math.round(enemy.def * 1.8);
  }

  if (isCrimsonBehemoth) {
    enemy.maxHp = Math.round(enemy.maxHp * 2.4);
    enemy.hp = enemy.maxHp;
    enemy.def = Math.round(enemy.def * 2.2);
  }

  applyDerivedStats(enemy);
  enemy.blockRate = 0;
  return enemy;
}

function startBossBattle(level, name){
  setMonsterHuntPageVisible(false);
  state.currentStageName = `Boss Hunt Lv${level}`;
  state.enemyQueue = null;
  state.enemy = createBossEnemy(level, name);
  state.enemyTargetIndex = getDefaultEnemyTargetIndex([state.enemy]);
  state.inBattle = true;
  state._animateEnemyIn = true;
  state.playerDefending = false;
  state.battleTurn = 0;
  clearStatuses(state.enemy);
  clearStatuses(state.player);
  ensureStatuses(state.enemy);
  ensureStatuses(state.player);
  const allies = ensureAllies();
  allies.forEach((ally) => {
    if (!ally) return;
    clearStatuses(ally);
    ensureStatuses(ally);
    if (Array.isArray(ally.activeSkills)) {
      ally.activeSkills.forEach((skill) => {
        if (skill) skill.cdLeft = 0;
      });
    }
  });
  addLog("INFO", `Monster Hunting: ${state.enemy.name} (Lv${state.enemy.level}) muncul!`);
  if (state.enemy.spd > state.player.spd) {
    setTurn("enemy");
    addLog("TURN", `${state.enemy.name} lebih cepat! Musuh duluan.`);
    refresh(state);
    setTimeout(() => {
      enemyTurn();
      refresh(state);
    }, TURN_DELAY_MS);
    return;
  }
  state.battleTurn = (state.battleTurn || 0) + 1;
  beginPlayerTurn();
  addLog("TURN", "Kamu lebih cepat!");
  refresh(state);
}

function renderMonsterHuntPage(){
  const stageList = byId("monsterHuntStageList");
  const detailPane = byId("monsterHuntDetailPane");
  if (!stageList || !detailPane) return;
  byId("monsterHuntGoldValue").textContent = String(state.player?.gold || 0);
  byId("monsterHuntGemValue").textContent = String(state.player?.gems || 0);
  if (!state.monsterHuntSelectedBoss) state.monsterHuntSelectedBoss = MONSTER_HUNT_BOSSES[0]?.id || "";
  const selectedId = state.monsterHuntSelectedBoss;
  const selectedBoss = MONSTER_HUNT_BOSSES.find((row) => row.id === selectedId) || MONSTER_HUNT_BOSSES[0];

  stageList.innerHTML = MONSTER_HUNT_BOSSES.map((boss) => `
    <button type="button" class="monsterHuntStageBtn ${boss.id === selectedBoss.id ? "active" : ""}" data-boss-id="${escapeHtml(boss.id)}">
      <div class="monsterHuntStageName">${escapeHtml(boss.name)}</div>
      <div class="monsterHuntStageMeta">Stage Boss • Lv ${boss.level}</div>
    </button>
  `).join("");

  detailPane.innerHTML = `
    <div class="monsterHuntHead">
      <div class="monsterHuntAvatar">${escapeHtml(selectedBoss.avatar || "👹")}</div>
      <div>
        <h3 class="monsterHuntName">${escapeHtml(selectedBoss.name)}</h3>
        <p class="monsterHuntLevel">Boss Level ${selectedBoss.level}</p>
        <p class="monsterHuntLevel">${escapeHtml(selectedBoss.note || "")}</p>
      </div>
    </div>
    <div class="monsterHuntSection">
      <h4>Story</h4>
      <p>${escapeHtml(selectedBoss.story || "Belum ada cerita.")}</p>
    </div>
    <div class="monsterHuntSection">
      <h4>Drop Material</h4>
      <div class="monsterHuntDrops">
        ${(selectedBoss.drops || []).map((drop) => `<span class="monsterHuntDropChip">${escapeHtml(drop)}</span>`).join("")}
      </div>
    </div>
    <div class="monsterHuntBattleWrap">
      <button type="button" class="marketActionBtn buy" id="monsterHuntBattleBtn">Battle ${escapeHtml(selectedBoss.name)}</button>
    </div>
  `;

  stageList.querySelectorAll("[data-boss-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const boss = MONSTER_HUNT_BOSSES.find((row) => row.id === btn.getAttribute("data-boss-id"));
      if (!boss) return;
      state.monsterHuntSelectedBoss = boss.id;
      renderMonsterHuntPage();
    });
  });

  const battleBtn = byId("monsterHuntBattleBtn");
  if (battleBtn) battleBtn.onclick = () => startBossBattle(selectedBoss.level, selectedBoss.name);
}

function setMonsterHuntPageVisible(show){
  const page = byId("monsterHuntPage");
  const marketPage = byId("marketPage");
  const skillPage = byId("skillShopPage");
  const allyPage = byId("allyPage");
  const blacksmithPage = byId("blacksmithPage");
  const wrap = document.querySelector(".wrap");
  if (!page || !wrap) return;
  if (show) {
    renderMonsterHuntPage();
    page.classList.remove("hidden");
    page.setAttribute("aria-hidden", "false");
    wrap.classList.add("hidden");
    if (marketPage) marketPage.classList.add("hidden");
    if (skillPage) skillPage.classList.add("hidden");
    if (allyPage) allyPage.classList.add("hidden");
    if (blacksmithPage) blacksmithPage.classList.add("hidden");
  } else {
    page.classList.add("hidden");
    page.setAttribute("aria-hidden", "true");
    wrap.classList.remove("hidden");
  }
}

function openBlacksmithPage(){
  if (state.inBattle) return;
  modal.close();
  setBlacksmithPageVisible(true);
}

function openMonsterHuntPage(){
  if (state.inBattle) return;
  modal.close();
  setMonsterHuntPageVisible(true);
}

function openSkillLearnDetail(skillKey){

}

/* ----------------------------- Core helpers ----------------------------- */

function clearAutoBattleTimer(){
  if (autoBattleTimer) {
    clearTimeout(autoBattleTimer);
    autoBattleTimer = null;
  }
  state._autoBattlePending = false;
}

function setAutoBattleEnabled(enabled){
  state.autoBattleEnabled = !!enabled;
  if (!state.autoBattleEnabled) clearAutoBattleTimer();
}

function setAutoBattleUseConsumable(enabled){
  state.autoBattleUseConsumable = !!enabled;
}

function isActionModalOpen(){
  const backdrop = byId("modalBackdrop");
  return !!(backdrop && backdrop.style.display !== "none");
}

function scheduleAutoBattleTurn(){
  clearAutoBattleTimer();
  if (!state.autoBattleEnabled || !state.inBattle || state.turn !== "player" || !getTargetEnemy()) return;
  if (state.battleResult) return;
  if (isActionModalOpen()) return;

  state._autoBattlePending = true;
  autoBattleTimer = setTimeout(() => {
    autoBattleTimer = null;
    state._autoBattlePending = false;
    performAutoBattleTurn();
  }, AUTO_TURN_DELAY_MS);
}

function setTurn(turn) {
  const prev = state.turn;
  state.turn = turn; // "town" | "player" | "enemy"

  // Per-skill cooldown ticks down when turn returns to player
  if (prev === "enemy" && turn === "player") {
    const p = state.player;
    if (p && Array.isArray(p.skills)) {
      p.skills.forEach((s) => {
        if (s && typeof s.cdLeft === "number" && s.cdLeft > 0) s.cdLeft -= 1;
        if (s && typeof s.cdLeft === "number" && s.cdLeft < 0) s.cdLeft = 0;
      });
    }
    const allies = ensureAllies();
    allies.forEach((ally) => {
      if (!Array.isArray(ally?.activeSkills)) return;
      ally.activeSkills.forEach((skill) => {
        if (skill && typeof skill.cdLeft === "number" && skill.cdLeft > 0) skill.cdLeft -= 1;
        if (skill && typeof skill.cdLeft === "number" && skill.cdLeft < 0) skill.cdLeft = 0;
      });
    });
  }

  if (turn === "player") scheduleAutoBattleTurn();
  else clearAutoBattleTimer();
}

function prepareTurn(turn){
  if (!state.inBattle) return { skipped: false };
  const actor = turn === "player" ? state.player : state.enemy;
  if (!actor) return { skipped: false };

  const escaped = tryEscapeStatuses(actor);
  if (escaped > 0) addLog("GOOD", turn === "player" ? "Kamu lolos dari debuff!" : `${actor.name} bebas dari debuff.`);

  const stunned = !!hasStatus(actor, "stun");
  return { skipped: stunned };
}

function beginPlayerTurn(){
  setTurn("player");
  const prep = prepareTurn("player");
  if (prep.skipped) {
    addLog("WARN", "Kamu sedang stun! Giliran dilewati.");
    tickStatuses(state.player);
    state.battleTurn = (state.battleTurn || 0) + 1;
    setTurn("enemy");
    refresh(state);
    setTimeout(() => {
      if (state.inBattle) enemyTurn();
    }, 380);
    return false;
  }
  applyManaRegen(state.player);
  refresh(state);
  return true;
}

function beginEnemyTurn(){
  setTurn("enemy");
  const prep = prepareTurn("enemy");
  if (prep.skipped) {
    addLog("INFO", `${state.enemy?.name || "Musuh"} sedang stun! Giliran mereka hilang.`);
    tickStatuses(state.enemy);
    state.playerDefending = false;
    state.battleTurn = (state.battleTurn || 0) + 1;
    beginPlayerTurn();
    return false;
  }
  refresh(state);
  return true;
}

function endBattle(reason, summary) {
  addLog("INFO", reason);
  if (summary) {
    state.battleResult = summary;
    refresh(state);
    showBattleResultOverlay(summary, () => finalizeBattle(reason));
    return;
  }
  finalizeBattle(reason);
}

function finalizeBattle(reason){
  state.inBattle = false;
  state.battleResult = null;
  state.enemyQueue = null;
  state.currentStageName = null;
  clearStatuses(state.enemy);
  state.enemy = null;
  state.playerDefending = false;
  clearStatuses(state.player);
  setTurn("town");
  state.battleTurn = 0;

  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp;
  restoreAllies();

  if (state.player && Array.isArray(state.player.skills)) {
    state.player.skills.forEach((s) => { if (s) s.cdLeft = 0; });
  }

  autosave(state);
  (async () => {
    try {
      const r = await cloudTrySaveCurrentProfile();
      if (r.ok) addLog("SAVE", "Cloud save tersinkron (battle selesai).");
    } catch (e) {
      console.error("[CLOUD AUTOSAVE] error", e);
    }
  })();

  refresh(state);
}

function levelUp() {
  const p = state.player;
  if (!p) return;
  if (p.level >= MAX_LEVEL) return;

  const prevMaxHp = p.maxHp;
  const prevMaxMp = p.maxMp;

  p.level += 1;
  p.statPoints = (p.statPoints || 0) + STAT_POINTS_PER_LEVEL;

  // Level-up growth (simple): HP, MP, slight ATK
  p.maxHp += 10;
  p.maxMp += 5;
  p.atk += 1;

  // Keep other stats unchanged
  p.hp = p.maxHp;
  p.mp = p.maxMp;
  applyDerivedStats(p);

  p.xpToLevel = Math.floor(p.xpToLevel * 1.4);

  const dhp = p.maxHp - prevMaxHp;
  const dmp = p.maxMp - prevMaxMp;
  addLog("LEVEL", `Naik ke Lv${p.level}! HP/MP Meningkat +${dhp}/+${dmp}. +${STAT_POINTS_PER_LEVEL} Stat Points.`);
  ensureGlennUnlockState({ source: "Sampai level 9" });
}

function gainXp(amount) {
  const p = state.player;

  // Freeze XP at max level
  if (p.level >= MAX_LEVEL) {
    p.xp = p.xpToLevel;
    return;
  }

  addLog("XP", `+${amount} XP`);
  p.xp += amount;

  while (p.level < MAX_LEVEL && p.xp >= p.xpToLevel) {
    p.xp -= p.xpToLevel;
    levelUp();
  }

  // If we just hit cap, lock XP bar
  if (p.level >= MAX_LEVEL) {
    p.xp = p.xpToLevel;
  }
}

function gainAllyXp(amount) {
  const allies = ensureAllies();
  if (!allies.length || amount <= 0) return;

  const share = Math.max(1, Math.floor(amount * 0.7));
  allies.forEach((ally) => {
    if (!ally) return;
    if ((ally.level || 0) >= MAX_LEVEL) {
      ally.xp = ally.xpToLevel;
      return;
    }
    ally.xp = (ally.xp || 0) + share;
    while ((ally.level || 0) < MAX_LEVEL && ally.xp >= (ally.xpToLevel || 1)) {
      ally.xp -= ally.xpToLevel;
      ally.level += 1;
      ally.xpToLevel = Math.round((ally.xpToLevel || 50) * 1.2);
      ally.maxHp += 10;
      ally.maxMp += 4;
      ally.atk += 2;
      ally.def += 2;
      ally.spd += 1;
      ally.hp = ally.maxHp;
      ally.mp = ally.maxMp;
          addLog("ALLY", `${ally.name} naik ke Lv${ally.level} dari EXP battle!`);
    }
    if ((ally.level || 0) >= MAX_LEVEL) ally.xp = ally.xpToLevel;
  });
}

function rollBattleDrops(enemy){
  const drops = [];
  const lvl = enemy?.level || 1;
  if (randInt(1, 100) <= 35) drops.push({ ...ITEMS.potion, qty: 1 });
  if (randInt(1, 100) <= (lvl >= 4 ? 28 : 18)) drops.push({ ...ITEMS.ether, qty: 1 });

  const isStage10 = Number((state.currentStageName || "").replace(/\D+/g, "")) === 10;
  const isBanditStageEnemy = enemy && (enemy.name === "Bandit" || enemy.name === "Leader Bandit");
  if (isStage10 && isBanditStageEnemy) {
    if (randInt(1, 100) <= 4) drops.push({ ...ITEMS.banditsDagger, qty: 1 });
    if (randInt(1, 100) <= 5) drops.push({ ...ITEMS.banditsHood, qty: 1 });
    if (randInt(1, 100) <= 4) drops.push({ ...ITEMS.banditsArmour, qty: 1 });
    if (randInt(1, 100) <= 4) drops.push({ ...ITEMS.banditsBoots, qty: 1 });
  }

  const isBossHunt = String(state.currentStageName || "").startsWith("Boss Hunt");
  if (isBossHunt && enemy?.name === "Ancient Wyrm") {
    drops.push({ ...ITEMS.wyrmScale, qty: randInt(2, 4) });
    if (randInt(1, 100) <= 75) drops.push({ ...ITEMS.moltenCore, qty: 1 });
  }

  if (isBossHunt && enemy?.name === "Crimson Behemoth") {
    drops.push({ ...ITEMS.behemothHorn, qty: randInt(1, 2) });
    drops.push({ ...ITEMS.bloodCrystal, qty: 1 });
  }

  return drops;
}

function grantDropsToPlayer(drops){
  if (!drops || !drops.length) return;
  const inv = state.player.inv || (state.player.inv = {});
  drops.forEach((d) => {
    if (!d || !d.name) return;
    const qty = d.qty || 1;
    if (inv[d.name]) inv[d.name].qty += qty;
    else inv[d.name] = { ...d, qty };
  });
}

function collectBattleExpProgress(beforePlayer, beforeAllies, xpGain) {
  const result = [];
  const player = state.player;
  if (player) {
    const before = beforePlayer || {};
    const playerIcon = String(player.gender || "male").toLowerCase() === "female" ? "♀" : "♂";
    result.push({
      id: "player",
      name: player.name || "Player",
      avatarIcon: playerIcon,
      avatarBg: "linear-gradient(135deg, #79c8ff, #4a5dff)",
      gainXp: xpGain,
      beforeLevel: Number(before.level) || 0,
      beforeXp: Number(before.xp) || 0,
      beforeXpToLevel: Number(before.xpToLevel) || 1,
      afterLevel: Number(player.level) || 0,
      afterXp: Number(player.xp) || 0,
      afterXpToLevel: Number(player.xpToLevel) || 1,
    });
  }

  const allies = ensureAllies();
  allies.forEach((ally, idx) => {
    if (!ally) return;
    const before = Array.isArray(beforeAllies) ? beforeAllies[idx] || {} : {};
    const visual = getAllyVisual(ally, idx);
    result.push({
      id: ally.id || `ally-${idx}`,
      name: ally.name || `Ally ${idx + 1}`,
      avatarIcon: visual.icon,
      avatarBg: visual.background,
      gainXp: Math.max(1, Math.floor((xpGain || 0) * 0.7)),
      beforeLevel: Number(before.level) || 0,
      beforeXp: Number(before.xp) || 0,
      beforeXpToLevel: Number(before.xpToLevel) || 1,
      afterLevel: Number(ally.level) || 0,
      afterXp: Number(ally.xp) || 0,
      afterXpToLevel: Number(ally.xpToLevel) || 1,
    });
  });
  return result;
}

function winBattle() {
  const p = state.player;
  const e = state.enemy;

  const drops = rollBattleDrops(e);
  const goldGain = e.goldReward || 0;
  const xpGain = e.xpReward || 0;
  const beforePlayer = {
    level: Number(p.level) || 0,
    xp: Number(p.xp) || 0,
    xpToLevel: Number(p.xpToLevel) || 1,
  };
  const beforeAllies = ensureAllies().map((ally) => ally ? ({
    level: Number(ally.level) || 0,
    xp: Number(ally.xp) || 0,
    xpToLevel: Number(ally.xpToLevel) || 1,
  }) : null);

  addLog("WIN", `Menang melawan ${e.name}!`);
  p.gold += goldGain;

  gainXp(xpGain);
  gainAllyXp(xpGain);
  grantDropsToPlayer(drops);
  const expProgress = collectBattleExpProgress(beforePlayer, beforeAllies, xpGain);

  if (Array.isArray(state.enemyQueue) && state.enemyQueue.length > 1) {
    state.enemyQueue.shift();
    state.enemy = state.enemyQueue[0];
    state._animateEnemyIn = true;
    state.playerDefending = false;
    state.battleTurn = 0;
    clearStatuses(state.enemy);
    ensureStatuses(state.enemy);
    ensureStatuses(state.player);
    addLog("INFO", `${state.currentStageName || "Stage"}: Musuh berikutnya muncul: ${state.enemy.name} (Lv${state.enemy.level})`);

    if (state.enemy.spd > state.player.spd) {
      setTurn("enemy");
      addLog("TURN", `${state.enemy.name} lebih cepat! Musuh duluan.`);
      refresh(state);
      setTimeout(() => {
        enemyTurn();
        refresh(state);
      }, TURN_DELAY_MS);
      return;
    }
    state.battleTurn = (state.battleTurn || 0) + 1;
    beginPlayerTurn();
    addLog("TURN", "Kamu lebih cepat!");
    refresh(state);
    return;
  }

  const stageNumber = Number((state.currentStageName || "").replace(/\D+/g, ""));
  if (Number.isFinite(stageNumber) && stageNumber > 0) {
    state.player.highestStageCleared = Math.max(Number(state.player.highestStageCleared) || 0, stageNumber);
    ensureGlennUnlockState({ source: `Stage ${stageNumber} clear` });
  }

  const summary = { outcome: "win", gold: goldGain, xp: xpGain, drops, enemyName: e.name, expProgress };
  endBattle("Pertarungan selesai.", summary);
}

function loseBattle() {
  const eName = state.enemy?.name || "musuh";
  addLog("LOSE", "Kamu kalah... Game Over.");
  const summary = { outcome: "lose", gold: 0, xp: 0, drops: [], enemyName: eName };
  endBattle("Kembali ke Town.", summary);
}

/* ----------------------------- Enemy & turns ---------------------------- */

function enemyTurn() {
  if (!state.enemy || !state.inBattle) return;
  if (!beginEnemyTurn()) return;

  const p = state.player;
  const enemies = Array.isArray(state.enemyQueue) && state.enemyQueue.length
    ? getAliveEnemyQueue()
    : (state.enemy && state.enemy.hp > 0 ? [state.enemy] : []);

  const endTurnAfter = (waitMs = 0) => {
    setTimeout(() => {
      state.playerDefending = false;

      if (p.hp <= 0) {
        loseBattle();
        return;
      }

      if (Array.isArray(state.enemyQueue)) {
        const aliveEnemies = getAliveEnemyQueue();
        if (!aliveEnemies.length) {
          state.enemyQueue = [];
          winBattle();
          return;
        }
        if (!state.enemy) setActiveEnemyByIndex(0);
      }

      state.battleTurn = (state.battleTurn || 0) + 1;
      beginPlayerTurn();
    }, waitMs);
  };

  const enemyAttackOnce = (enemy, done) => {
    if (!enemy || enemy.hp <= 0) {
      done(0);
      return;
    }
    if (hasStatus(enemy, "stun")) {
      addLog("ENEMY", `${enemy.name} terkena Stun dan tidak bisa bergerak.`);
      tickStatuses(enemy);
      done(ENEMY_ACTION_GAP_MS);
      return;
    }
    const { target, isPlayer } = pickEnemyTarget();
    if (!target) {
      done(0);
      return;
    }
    const isRage = enemy.mp >= 5 && Math.random() < 0.25;
    if (isRage) enemy.mp -= 5;
    const res = resolveAttack(
      enemy,
      target,
      isRage ? 8 : 2,
      { dodgeBonus: 0 }
    );
    if (res.missed) {
      if (isPlayer) showDamageText("player", "MISS");
      else {
        playAllyDodgeFade(target);
        showAllyDamageText("MISS", target);
        addLog("ENEMY", `${enemy.name} meleset menyerang ${target.name}.`);
      }
      tickStatuses(enemy);
      done(0);
      return;
    }
    const delays = [];
    if (res.dmg > 0) {
      if (isPlayer) {
        delays.push(applyDamageAfterDelay(p, res.dmg, "player", 230));
      } else {
        target.hp = clamp(target.hp - res.dmg, 0, target.maxHp);
        playAllyCritShake(target);
      }
    }
    if (res.reflected > 0) {
      if (isPlayer) {
        delays.push(applyDamageAfterDelay(enemy, res.reflected, { enemyIndex: getEnemyIndex(enemy) }, 430));
      } else {
        enemy.hp = clamp(enemy.hp - res.reflected, 0, enemy.maxHp);
      }
    }
    if (isPlayer) {
      showDamageText("player", formatDamageText(res, res.dmg));
      if (res.reflected > 0) {
        showEnemyDamageText(`-${res.reflected} (REFLECT)`, getEnemyIndex(enemy));
      }
    } else {
      addLog("ENEMY", `${enemy.name} menyerang ${target.name}! Damage ${res.dmg}.`);
      showAllyDamageText(formatDamageText(res, res.dmg), target);
      if (res.reflected > 0) {
        addLog("ALLY", `${target.name} memantulkan ${res.reflected} damage.`);
      }
    }
    if (!isPlayer && target.hp <= 0) {
      addLog("ALLY", `${target.name} tumbang!`);
    }
    tickStatuses(enemy);
    const wait = delays.length ? Math.max(...delays, 180) + 40 : 0;
    done(wait + ENEMY_ACTION_GAP_MS);
  };

  let idx = 0;
  const next = () => {
    if (p.hp <= 0) {
      loseBattle();
      return;
    }
    const enemy = enemies[idx];
    if (!enemy) {
      endTurnAfter(0);
      return;
    }
    idx += 1;
    enemyAttackOnce(enemy, (waitMs) => {
      setTimeout(() => {
        if (p.hp <= 0) {
          loseBattle();
          return;
        }
        normalizeEnemyQueue();
        next();
      }, waitMs);
    });
  };

  next();
}

function handleEnemyDefeat(){
  const queue = getEnemyQueue();
  const aliveEnemies = getAliveEnemyQueue();
  if (!aliveEnemies.length) {
    if (Array.isArray(state.enemyQueue)) state.enemyQueue = [];
    winBattle();
    return true;
  }
  if (Array.isArray(state.enemyQueue)) {
    normalizeEnemyQueue();
    if (aliveEnemies.length) {
      state.enemy = aliveEnemies[0];
      const nextIndex = queue.indexOf(state.enemy);
      state.enemyTargetIndex = clamp(
        Number.isFinite(nextIndex) ? nextIndex : (state.enemyTargetIndex || 0),
        0,
        queue.length - 1
      );
      addLog("INFO", `Musuh tersisa: ${aliveEnemies.length}`);
      setTurn("enemy");
      refresh(state);
      setTimeout(() => {
        enemyTurn();
        refresh(state);
      }, TURN_DELAY_MS);
      return true;
    }
  }
  winBattle();
  return true;
}

function alliesAct(done){
  const allies = getAliveAllies()
    .slice()
    .sort((a, b) => (Number(b.spd) || 0) - (Number(a.spd) || 0));
  if (!allies.length || !getTargetEnemy()) {
    if (done) done();
    return;
  }

  const pickAllySkill = (ally) => {
    const skills = Array.isArray(ally?.activeSkills) ? ally.activeSkills : [];
    const ready = skills.filter((skill) => skill && (skill.cdLeft || 0) <= 0 && (ally.mp || 0) >= (skill.mpCost || 0));
    if (!ready.length) return null;
    if (ready.length === 1) return ready[0];
    return Math.random() < 0.55 ? ready[0] : ready[1];
  };

  const maxSpd = Math.max(...allies.map((ally) => Number(ally.spd) || 0), 0);
  const baseDelay = 260;
  const orderGap = ALLY_ACTION_GAP_MS;
  let lastDelay = 0;
  allies.forEach((ally, index) => {
    const spd = Number(ally.spd) || 0;
    const speedLag = Math.max(0, maxSpd - spd) * 20;
    const delay = baseDelay + (index * orderGap) + speedLag;
    lastDelay = Math.max(lastDelay, delay);
    setTimeout(() => {
      const currentTarget = getTargetEnemy();
      if (!currentTarget || ally.hp <= 0) return;
      if (hasStatus(ally, "stun")) {
        addLog("ALLY", `${ally.name} terkena Stun dan tidak bisa bergerak.`);
        tickStatuses(ally);
        refresh(state);
        return;
      }
      const targetIndex = getEnemyIndex(currentTarget);
      if (targetIndex < 0) return;

      const skill = pickAllySkill(ally);
      let basePower = 3;
      if (skill) {
        ally.mp = clamp((ally.mp || 0) - (skill.mpCost || 0), 0, ally.maxMp || 0);
        skill.cdLeft = skill.cooldown || 0;
        basePower = Math.max(3, Number(skill.power) || 3);
        addLog("SKILL", `${ally.name} • ${skill.name}`);
      }

      const res = resolveAttack(ally, currentTarget, basePower);
      if (res.missed) {
        addLog("ALLY", `${ally.name} meleset.`);
        tickStatuses(ally);
        refresh(state);
        return;
      }

      if (res.dmg > 0) {
        currentTarget.hp = clamp(currentTarget.hp - res.dmg, 0, currentTarget.maxHp);
        playEnemyCritShake(targetIndex);
      }
      if (skill?.type === "buff") {
        addStatusEffect(ally, { type: "guardStance", turns: 2, debuff: false });
        addStatusEffect(ally, { type: "stance", turns: 2, debuff: false });
      }
      if (skill?.type === "debuff") {
        addStatusEffect(currentTarget, { type: "armorBreak", turns: 2, debuff: true });
      }

      if (res.reflected > 0) {
        ally.hp = clamp(ally.hp - res.reflected, 0, ally.maxHp);
        addLog("ALLY", `${ally.name} terkena pantulan ${res.reflected} damage.`);
      }
      addLog("ALLY", `${ally.name} ${skill ? `menggunakan ${skill.name}` : "menyerang"}! Damage ${res.dmg}.`);
      tickStatuses(ally);
      setTimeout(() => {
        showEnemyDamageText(formatDamageText(res, res.dmg), targetIndex);
      }, skill ? 260 : 0);
      refresh(state);
    }, delay);
  });
  if (done) setTimeout(done, lastDelay + ALLY_ACTION_GAP_MS + 300);
}

function afterPlayerAction() {
  if (!state.inBattle) return;
  if (state.player && state.player.hp <= 0) {
    loseBattle();
    return;
  }

  const defeated = getDefeatedEnemies();
  if (defeated.length) {
    defeated.forEach((enemy) => { enemy._defeated = true; });
    refresh(state);
    handleEnemyDefeat();
    return;
  }

  const e = getTargetEnemy();
  if (!e) return;

  tickStatuses(state.player);
  setTurn("enemy");
  refresh(state);
  setTimeout(() => {
    alliesAct(() => {
      if (!state.inBattle) return;
      const target = getTargetEnemy();
      const defeated = getDefeatedEnemies();
      if (defeated.length || (target && target.hp <= 0)) {
        defeated.forEach((enemy) => { enemy._defeated = true; });
        refresh(state);
        handleEnemyDefeat();
        return;
      }

      // Small delay sebelum enemy acts, biar terasa lebih seperti RPG turn-based
      setTimeout(() => {
        enemyTurn();
        refresh(state);
      }, TURN_DELAY_MS);
    });
  }, TURN_DELAY_MS);
}

/* ----------------------------- Town actions ----------------------------- */

function explore() {
  if (state.inBattle) return;

  openAdventureLevels();
}

function openAdventureLevels(){
  const stages = [1, 3, 5, 7, 8, 10];
  modal.open(
    "Adventure - Level",
    stages.map((lv) => ({
      title: `Stage ${lv}`,
      desc: lv === 10
        ? "Stage spesial: 3 musuh."
        : lv === 8
          ? "Stage spesial: 2 musuh."
          : "Pilih stage petualangan",
      meta: "",
      value: lv,
    })),
    (level) => {
      const targetLv = clamp(Number(level) || 1, 1, MAX_LEVEL);
      startAdventureBattle(targetLv, `Stage ${targetLv}`);
    }
  );
}

function startAdventureBattle(targetLevel, stageName){
  state.currentStageName = stageName;
  if (targetLevel === 8 || targetLevel === 10) {
    if (targetLevel === 10) {
      const leaderBandit = genEnemyWithName(targetLevel, "Leader Bandit");
      leaderBandit.maxHp = Math.round(leaderBandit.maxHp * 1.2);
      leaderBandit.hp = leaderBandit.maxHp;
      leaderBandit.atk = Math.round(leaderBandit.atk * 1.15);
      leaderBandit.def = Math.round(leaderBandit.def * 1.1);
      leaderBandit.spd = Math.round(leaderBandit.spd * 1.05);
      leaderBandit.xpReward = Math.round(leaderBandit.xpReward * 1.25);
      leaderBandit.goldReward = Math.round(leaderBandit.goldReward * 1.2);
      state.enemyQueue = [
        leaderBandit,
        genEnemyWithName(targetLevel, "Bandit"),
        genEnemyWithName(targetLevel, "Bandit")
      ];
    } else {
      state.enemyQueue = Array.from({ length: 2 }, () => genEnemy(targetLevel));
    }
    state.enemy = state.enemyQueue[0];
    state.enemyTargetIndex = getDefaultEnemyTargetIndex(state.enemyQueue);
  } else {
    state.enemyQueue = null;
    state.enemy = genEnemy(targetLevel);
    state.enemyTargetIndex = getDefaultEnemyTargetIndex([state.enemy]);
  }
  state.inBattle = true;
  state._animateEnemyIn = true;
  state.playerDefending = false;
  state.battleTurn = 0;
  clearStatuses(state.enemy);
  clearStatuses(state.player);
  ensureStatuses(state.enemy);
  ensureStatuses(state.player);
  const allies = ensureAllies();
  allies.forEach((ally) => {
    if (!ally) return;
    clearStatuses(ally);
    ensureStatuses(ally);
    if (Array.isArray(ally.activeSkills)) {
      ally.activeSkills.forEach((skill) => {
        if (skill) skill.cdLeft = 0;
      });
    }
  });
  addLog("INFO", `Stage ${stageName}: Musuh muncul: ${state.enemy.name} (Lv${state.enemy.level})`);

  if (state.enemy.spd > state.player.spd) {
    setTurn("enemy");
    addLog("TURN", `${state.enemy.name} lebih cepat! Musuh duluan.`);
    refresh(state);
    setTimeout(() => {
      enemyTurn();
      refresh(state);
    }, TURN_DELAY_MS);
    return;
  } else {
    state.battleTurn = (state.battleTurn||0)+1;
    beginPlayerTurn();
    addLog("TURN", "Kamu lebih cepat!");
  }

  refresh(state);
}

function rest() {
  if (state.inBattle) return;

  const p = state.player;
  const hb = p.hp;
  const mb = p.mp;

  p.hp = clamp(p.hp + Math.floor(p.maxHp * 0.35), 0, p.maxHp);
  p.mp = clamp(p.mp + Math.floor(p.maxMp * 0.4), 0, p.maxMp);
  restoreAllies();

  addLog("TOWN", `Istirahat... HP ${hb}→${p.hp}, MP ${mb}→${p.mp}`);

  setTurn("town");

  autosave(state);

  // Also sync to cloud (if logged in) so progress can be used cross-device
  (async () => {
    try {
      const r = await cloudTrySaveCurrentProfile();
      if (r.ok) addLog("SAVE", "Cloud save tersinkron (battle selesai).");
    } catch (e) {
      console.error("[CLOUD AUTOSAVE] error", e);
    }
  })();

  refresh(state);
}

function openRecruitModal(){
  // Backward compatibility alias: Recruit diganti menjadi Ally page.
  openAllyPage();
}



/* ---------------------------- Battle actions ---------------------------- */

function tryApplyBasicAttackPoison(attacker, target){
  if (!attacker || !target || !attacker.equipment || !attacker.inv) return;
  const weaponName = attacker.equipment.hand;
  if (!weaponName) return;
  const weapon = attacker.inv[weaponName];
  if (!weapon || !weapon.basicPoisonChance) return;
  if (randInt(1, 100) > Number(weapon.basicPoisonChance || 0)) return;
  const poisonPct = Math.max(1, Number(weapon.poisonPct || 0));
  const poisonTurns = Math.max(1, Number(weapon.poisonTurns || 1));
  addStatusEffect(target, { type: "poison", turns: poisonTurns, pct: poisonPct, debuff: true });
  addLog("DEBUFF", `${target.name} terkena Poison ${poisonPct}% selama ${poisonTurns} turn.`);
}

function tryApplyBasicAttackAccuracyDown(attacker, target){
  if (!attacker || !target || !attacker.equipment || !attacker.inv) return;
  const weaponName = attacker.equipment.hand;
  if (!weaponName) return;
  const weapon = attacker.inv[weaponName];
  const accDownPct = Math.max(0, Number(weapon?.basicAccDownPct || 0));
  if (!weapon || accDownPct <= 0) return;
  const turns = Math.max(1, Number(weapon.basicAccDownTurns || 1));
  addStatusEffect(target, { type: "accuracyDown", turns, debuff: true, pct: accDownPct });
  addLog("DEBUFF", `${target.name} kehilangan fokus! Accuracy turun ${accDownPct}% selama ${turns} turn.`);
}

function attack() {
  setTurn("player");

  const p = state.player;
  const e = getTargetEnemy();
  if (!e) return;
  const targetIndex = getEnemyIndex(e);

  const res = resolveAttack(p, e, 3);
  if (res.missed) {
    playEnemyDodgeFade(targetIndex);
    showEnemyDamageText("MISS", targetIndex);
    return;
  }

  if (res.dmg > 0) {
    e.hp = clamp(e.hp - res.dmg, 0, e.maxHp);
    playEnemyCritShake(targetIndex);
    tryApplyBasicAttackPoison(p, e);
    tryApplyBasicAttackAccuracyDown(p, e);
  }
  if (res.reflected > 0) {
    p.hp = clamp(p.hp - res.reflected, 0, p.maxHp);
    playCritShake("player");
  }

  showEnemyDamageText(formatDamageText(res, res.dmg), targetIndex);
  if (res.reflected > 0) {
    showDamageText("player", `-${res.reflected} (REFLECT)`);
  }

  if (p.hp <= 0) {
    loseBattle();
  }
}

function charge(){
  if (!state.inBattle || state.turn !== "player") return;
  setTurn("player");
  const p = state.player;
  const gain = Math.max(1, Math.round(p.manaRegen || 0));
  const before = p.mp;
  p.mp = clamp(p.mp + gain, 0, p.maxMp);
  addLog("INFO", `Charge! MP ${before}→${p.mp} (+${gain})`);
  afterPlayerAction();
}

function runAway() {
  setTurn("player");

  const p = state.player;
  const e = getTargetEnemy();
  if (!e) return false;

  endBattle("Berhasil kabur!");
  return true;
}

function useItem(name) {
  setTurn("player");

  const p = state.player;
  const it = p.inv[name];

  if (!it || it.qty <= 0) {
    addLog("WARN", "Item tidak ada/habis.");
    return false;
  }

  if (it.kind === "heal_hp") {
    const before = p.hp;
    p.hp = clamp(p.hp + it.amount, 0, p.maxHp);
    addLog("ITEM", `Memakai ${name}. HP ${before}→${p.hp}`);
  } else if (it.kind === "heal_mp") {
    const before = p.mp;
    p.mp = clamp(p.mp + it.amount, 0, p.maxMp);
    addLog("ITEM", `Memakai ${name}. MP ${before}→${p.mp}`);
  } else {
    addLog("WARN", "Item ini bukan consumable.");
    return false;
  }

  it.qty -= 1;
  if (it.qty <= 0) delete p.inv[name];

  return true;
}

function getAutoHealItemName(){
  const inv = state.player?.inv || {};
  return Object.keys(inv).find((name) => {
    const item = inv[name];
    return item && item.qty > 0 && item.kind === "heal_hp";
  });
}

function getAutoSkillCandidates(player){
  if (!player || !Array.isArray(player.skills)) return [];
  const byName = new Map(player.skills.filter(Boolean).map((skill, idx) => [skill.name, { skill, idx }]));
  if (!Array.isArray(player.skillSlots) || !player.skillSlots.length) {
    return player.skills
      .map((skill, idx) => ({ skill, idx }))
      .filter(({ skill }) => !!skill);
  }

  const picked = [];
  player.skillSlots.forEach((slotName) => {
    if (!slotName || !byName.has(slotName)) return;
    const candidate = byName.get(slotName);
    if (!candidate) return;
    if (picked.some((entry) => entry.idx === candidate.idx)) return;
    picked.push(candidate);
  });
  return picked;
}

function pickAutoSkillIndex(){
  const p = state.player;
  const ranked = getAutoSkillCandidates(p)
    .filter(({ skill }) => skill && (skill.cdLeft || 0) <= 0 && p.mp >= (skill.mpCost || 0))
    .sort((a, b) => (b.skill.power || 0) - (a.skill.power || 0));
  return ranked.length ? ranked[0].idx : -1;
}

function castSkillByIndex(idx){
  const p = state.player;
  const s = p?.skills?.[idx];
  if (!p || !s) return false;
  if ((s.cdLeft || 0) > 0) return false;
  if (p.mp < s.mpCost) return false;

  setTurn("player");
  p.mp -= s.mpCost;

  const target = getTargetEnemy();
  if (!target) return false;
  const targetIndex = getEnemyIndex(target);
  const res = resolveAttack(p, target, s.power);
  if (res.missed) {
    playEnemyDodgeFade(targetIndex);
    showEnemyDamageText("MISS", targetIndex);
  } else {
    if (res.dmg > 0) {
      target.hp = clamp(target.hp - res.dmg, 0, target.maxHp);
      playEnemyCritShake(targetIndex);
    }
    if (res.reflected > 0) {
      p.hp = clamp(p.hp - res.reflected, 0, p.maxHp);
      playCritShake("player");
      showDamageText("player", `-${res.reflected} (REFLECT)`);
    }
    showEnemyDamageText(formatDamageText(res, res.dmg), targetIndex);
  }

  s.cdLeft = s.cooldown || 0;

  if (p.hp <= 0) {
    loseBattle();
    return true;
  }

  return true;
}

function performAutoBattleTurn(){
  if (!state.autoBattleEnabled || !state.inBattle || state.turn !== "player") return;
  if (isActionModalOpen()) return;
  if (state._autoBattlePending) return;

  const p = state.player;
  const target = getTargetEnemy();
  if (!p || !target || target.hp <= 0) return;

  const hpRatio = p.maxHp > 0 ? (p.hp / p.maxHp) : 1;
  if (state.autoBattleUseConsumable && hpRatio <= 0.35) {
    const healName = getAutoHealItemName();
    if (healName) {
      const ok = useItem(healName);
      if (ok) {
        afterPlayerAction();
        return;
      }
    }
  }

  const skillIdx = pickAutoSkillIndex();
  if (skillIdx >= 0) {
    const used = castSkillByIndex(skillIdx);
    if (used) {
      afterPlayerAction();
      return;
    }
  }

  attack();
  afterPlayerAction();
}

function openSkillModal() {
  const p = state.player;
  if (!p || !getTargetEnemy()) return;

  const choices = p.skills.map((s, i) => {
    const cdLeft = s.cdLeft || 0;
    const cdText = (s.cooldown ? `CD ${cdLeft}/${s.cooldown}` : "CD -");
    const meta = `MP ${s.mpCost} • ${cdText}`;
    const title = `${s.name}`;

    // If on cooldown, make it readonly by omitting value
    if (cdLeft > 0) {
      return { title, icon: s.icon, desc: `${s.desc}`, meta, value: undefined, className: "readonly" };
    }
    return { title, icon: s.icon, desc: `${s.desc}`, meta, value: i };
  });

  modal.open("Skill", choices, (idx) => {
    const used = castSkillByIndex(idx);
    if (!used) {
      addLog("WARN", "Skill tidak bisa dipakai.");
      refresh(state);
      return;
    }
    afterPlayerAction();
  });
}

function openItemModal() {
  const inv = state.player.inv;
  const keys = Object.keys(inv).filter((k) => {
    const it = inv[k];
    return it && (it.kind === "heal_hp" || it.kind === "heal_mp");
  });

  if (!keys.length) {
    addLog("WARN", "Tidak ada item consumable.");
    return;
  }

  modal.open(
    "Pilih Item",
    keys.map((k) => ({
      title: `${k} x${inv[k].qty}`,
      desc: inv[k].desc,
      meta: inv[k].kind === "heal_hp" ? `+${inv[k].amount} HP` : `+${inv[k].amount} MP`,
      value: k,
    })),
    (name) => {
      const ok = useItem(name);
      if (ok) afterPlayerAction();
      else refresh(state);
    }
  );
}

/* --------------------------- Read-only modals --------------------------- */


function applyAttributeDelta(statKey, delta){
  const p = state.player;
  if (!p) return false;

  p.statPoints = (p.statPoints || 0);

  const key = String(statKey || "").toLowerCase();

  if (delta > 0 && p.statPoints < delta) return false;
  if (delta < 0 && (p[key] || 0) < (-delta)) return false;

  // apply to base attr
  p[key] = (p[key] || 0) + delta;
  p.statPoints -= delta;

  // apply derived changes (rebalanced)
  if (key === "str") {
    // STR: ATK +2, Combustion Chance +2%
    p.atk = (p.atk || 0) + (2 * delta);
    p.combustionChance = clamp((p.combustionChance || 0) + (2 * delta), 0, 100);
  }
  if (key === "dex") {
    // DEX: Evasion +1%, Accuracy +2, SPD +1
    p.evasion = clamp((p.evasion || 0) + (1 * delta), 0, 100);
    p.acc = Math.max(0, (p.acc || 0) + (2 * delta));
    p.spd = Math.max(0, (p.spd || 0) + (1 * delta));
  }
  if (key === "int") {
    // INT: Max MP +5
    p.maxMp = Math.max(0, (p.maxMp || 0) + (5 * delta));
    p.mp = clamp((p.mp || 0) + (5 * delta), 0, p.maxMp);
  }
  if (key === "vit") {
    // VIT: Max HP +8, DEF +2
    p.maxHp = Math.max(1, (p.maxHp || 1) + (8 * delta));
    p.hp = clamp((p.hp || 0) + (8 * delta), 0, p.maxHp);
    p.def = Math.max(0, (p.def || 0) + (2 * delta));
  }
  if (key === "foc") {
    // FOC: Crit Chance +2%, Crit Damage +5% bonus
    p.critChance = clamp((p.critChance || 0) + (2 * delta), 0, 100);
    p.critDamage = Math.max(0, (p.critDamage || 0) + (5 * delta)); // bonus % (starts at 0)
  }

  // Hard clamps
  p.atk = Math.max(0, p.atk || 0);
  p.def = Math.max(0, p.def || 0);
  p.spd = Math.max(0, p.spd || 0);
  p.critDamage = Math.max(0, p.critDamage || 0);
  p.combustionChance = clamp(p.combustionChance || 0, 0, 100);
  p.statPoints = Math.max(0, p.statPoints || 0);
  applyDerivedStats(p);

  // persist to current slot
  if (Array.isArray(state.slots)) state.slots[state.activeSlot] = p;

  autosave(state);
  (async () => { try { await cloudTrySaveCurrentProfile(); } catch(e) {} })();
  refresh(state);

  return true;
}

function openProfileModal(){
  const charId = (state.player && typeof state.player.charId === "number") ? state.player.charId : state.activeSlot;
  const charMeta = charId === 0 ? "Admin" : "";
  modal.open(
    "Profile",
    [
      { title: `ID: ${charId}`, desc: "ID karakter.", meta: charMeta },
      { title: "Equipment", desc: "Kelola gear (hand, head, pant, armor, shoes).", meta: "", value: "equip" },
      { title: "Stat", desc: "Atur stat poin.", meta: "", value: "stat" },
      { title: "Skill Slot", desc: "Pilih skill untuk slot battle.", meta: "", value: "skill_slot" },
    ],
    (pick) => {
      if (pick === "equip") return openEquipmentModal();
      if (pick === "stat") return openProfileStatModal();
      if (pick === "skill_slot") return openSkillSlotModal();
    }
  );
}

function openProfileStatModal(){
  const p = state.player || {};
  const pts = p.statPoints || 0;

  const mk = (key, label, desc, icon) => {
    const v = p[key] || 0;
    return {
      title: `${label} : ${v}`,
      desc,
      meta: "",
      icon,
      buttons: [
        { text: "−", value: `${key}:-1`, disabled: v <= 0 },
        { text: "+", value: `${key}:+1`, disabled: pts <= 0 },
      ],
      keepOpen: true,
    };
  };

  modal.open(
    "Stat",
    [
      { title: "Back", desc: "Kembali ke Profile.", meta: "", value: "back", className: "subMenuBack" },
      { title: `Stat Points : ${pts}`, desc: "Dapatkan dari level up. Gunakan tombol + untuk menambah stat.", meta: "" },
      mk("str", "Fire", "Meningkatkan ATK dan Combustion Chance", "./assets/icons/fire.svg"),
      mk("dex", "Wind", "Meningkatkan Evasion, Accuracy, dan SPD", "./assets/icons/wind.svg"),
      mk("int", "Water", "Meningkatkan MP, Mana Regen, dan Escape Chance", "./assets/icons/water.svg"),
      mk("vit", "Earth", "Meningkatkan HP, DEF, dan Block Rate", "./assets/icons/earth.svg"),
      mk("foc", "Lightning", "Meningkatkan Critical Chance dan Critical Damage", "./assets/icons/lightning.svg"),
    ],
    (pick) => {
      if (pick === "back") return openProfileModal();
      const s = String(pick || "");
      const m = s.match(/^(str|dex|int|vit|foc):([+-]?\d+)$/);
      if (!m) return;

      const key = m[1];
      const delta = parseInt(m[2], 10) || 0;
      if (!delta) return;

      const ok = applyAttributeDelta(key, delta);
      if (!ok){
        openProfileStatModal();
        return;
      }
      openProfileStatModal();
    }
  );
}

function openSkillSlotModal(){
  const p = state.player;
  if (!p) return;
  if (!Array.isArray(p.skillSlots)) {
    p.skillSlots = Array.from({ length: 8 }, () => null);
  }
  const choices = [{ title: "Back", desc: "Kembali ke Profile.", meta: "", value: "back", className: "subMenuBack" }]
    .concat(Array.from({ length: 8 }, (_, i) => {
    const slotName = p.skillSlots[i];
    const skill = slotName ? getSkillByName(p, slotName) : null;
    const title = skill ? `${skill.name}` : "Kosong";
    return {
      title: `Slot ${i + 1}`,
      desc: skill ? skill.desc : "Kosong",
      meta: skill ? title : "Klik untuk pilih",
      icon: skill ? skill.icon : "",
      value: `slot:${i}`,
      allowClick: true,
      buttons: [
        { text: "Clear", value: `clear:${i}`, disabled: !skill },
      ],
      keepOpen: true,
    };
  }));

  modal.open(
    "Skill Slot",
    choices,
    (pick) => {
      if (pick === "back") return openProfileModal();
      const [action, rawIdx] = String(pick || "").split(":");
      const idx = parseInt(rawIdx, 10);
      if (Number.isNaN(idx)) return;
      if (action === "slot") {
        openSkillSlotSelect(idx);
        return;
      }
      if (action === "clear") {
        p.skillSlots[idx] = null;
        if (Array.isArray(state.slots)) state.slots[state.activeSlot] = p;
        autosave(state);
        refresh(state);
        openSkillSlotModal();
      }
    }
  );
}

function openSkillSlotSelect(slotIdx){
  const p = state.player;
  if (!p || !Array.isArray(p.skills)) return;
  if (!Array.isArray(p.skillSlots)) {
    p.skillSlots = Array.from({ length: 8 }, () => null);
  }
  const rows = [{ title: "Back", desc: "Kembali ke Skill Slot.", meta: "", value: "back", className: "subMenuBack" }]
    .concat(p.skills.map((skill) => {
    const equippedIndex = p.skillSlots.findIndex((name) => name === skill.name);
    const alreadyEquipped = equippedIndex !== -1 && equippedIndex !== slotIdx;
    const meta = `MP ${skill.mpCost} • DMG ${skill.power}${alreadyEquipped ? " • Equipped" : ""}`;
    return {
      title: skill.name,
      icon: skill.icon,
      desc: skill.desc || "Skill",
      meta,
      value: alreadyEquipped ? undefined : `pick:${skill.name}`,
      className: alreadyEquipped ? "readonly" : "",
    };
  }));

  modal.open(
    `Pilih Skill (Slot ${slotIdx + 1})`,
    rows.length ? rows : [{ title: "Belum ada skill", desc: "Pelajari skill di Shop.", meta: "", value: undefined, className:"readonly" }],
    (pick) => {
      if (pick === "back") return openSkillSlotModal();
      const name = String(pick || "").replace(/^pick:/, "");
      const skill = getSkillByName(p, name);
      if (!skill) return;
      p.skillSlots[slotIdx] = skill.name;
      if (Array.isArray(state.slots)) state.slots[state.activeSlot] = p;
      autosave(state);
      refresh(state);
      openSkillSlotModal();
    }
  );
}

function openEquipmentModal(){
  const p = state.player;
  if (!p || !p.equipment) return;
  const slots = [
    { key:"hand", label:"Hand" },
    { key:"head", label:"Head" },
    { key:"pant", label:"Pant" },
    { key:"armor", label:"Armor" },
    { key:"shoes", label:"Shoes" },
  ];
  const hasGear = (p.inv && Object.values(p.inv).some((it) => it.kind === "gear")) || false;

  const choices = [{ title: "Back", desc: "Kembali ke Profile.", meta: "", value: "back", className: "subMenuBack" }]
    .concat(slots.map((s) => {
    const cur = p.equipment[s.key] || null;
    const curItem = cur ? getItemRef(cur, p) : null;
    const statText = curItem ? formatItemStats(curItem) : "";
    const desc = cur
      ? `Memakai: ${cur}${statText ? ` (${statText})` : ""}`
      : "Kosong";
    const meta = cur
      ? "Klik untuk ganti"
      : (hasGear ? "Klik untuk equip" : "Tidak ada gear");
    return {
      title: `${s.label}`,
      desc,
      meta,
      value: `equip:${s.key}`,
      allowClick: true,
      buttons: [
        { text: "Unequip", value: `unequip:${s.key}`, disabled: !cur },
      ],
      keepOpen: true,
    };
  }));

  modal.open(
    "Equipment",
    choices.map((c) => ({ ...c, className: `equipmentCard ${c.className || ""}`.trim(), value: c.value })),
    (pick) => {
      if (pick === "back") return openProfileModal();
      const [action, slot] = String(pick || "").split(":");
      if (!slot) return;
      if (action === "equip") {
        openEquipSelect(slot);
        return;
      }
      if (action === "unequip") {
        unequipSlot(slot);
        openEquipmentModal();
      }
    }
  );
}

function openEquipSelect(slot){
  const p = state.player;
  if (!p || !p.inv) return;
  const keys = Object.keys(p.inv).filter((k) => {
    const it = p.inv[k];
    return it && it.kind === "gear" && it.slot === slot;
  });
  if (!keys.length) {
    addLog("WARN", `Tidak ada gear untuk slot ${slot}.`);
    return;
  }

  modal.open(
    `Pilih item untuk ${slot}`,
    [{ title: "Back", desc: "Kembali ke Equipment.", meta: "", value: "back", className: "subMenuBack" }]
      .concat(keys.map((k) => {
        const entry = p.inv[k];
        const requiredLevel = Number(entry.level || 1);
        const isLocked = Number.isFinite(requiredLevel) && (p.level || 1) < requiredLevel;
        const stats = formatItemStats(entry);
        const metaParts = [];
        if (Number.isFinite(requiredLevel)) metaParts.push(`Lv ${requiredLevel}`);
        if (stats) metaParts.push(stats);
        return {
          title: `${k} x${entry.qty}`,
          desc: entry.desc || "Perlengkapan",
          meta: metaParts.join(" • ") || `Equip (${entry.slot || "-"})`,
          value: isLocked ? undefined : k,
          className: isLocked ? "readonly" : "",
        };
      })),
    (name) => {
      if (name === "back") return openEquipmentModal();
      const ok = equipItem(slot, name);
      if (!ok) addLog("WARN", "Item tidak bisa dipakai.");
      openEquipmentModal();
    }
  );
}




const LONG_PRESS_DELAY = 520;
function bindLongPress(el, onLongPress, delay = LONG_PRESS_DELAY) {
  if (!el || typeof onLongPress !== "function") return;
  el._longPressCallback = onLongPress;
  if (el.dataset.longPressBound === "true") return;
  el.dataset.longPressBound = "true";
  let timer = null;
  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const start = (event) => {
    if (event.type === "mousedown" && event.button !== 0) return;
    clearTimer();
    timer = setTimeout(() => {
      el.dataset.longPressTriggered = "true";
      if (typeof el._longPressCallback === "function") el._longPressCallback();
    }, delay);
  };
  const cancel = () => {
    clearTimer();
    hideSkillFloatingDetail();
    setTimeout(() => {
      delete el.dataset.longPressTriggered;
    }, 220);
  };
  el.addEventListener("touchstart", start, { passive: true });
  el.addEventListener("touchend", cancel);
  el.addEventListener("touchcancel", cancel);
  el.addEventListener("touchmove", cancel, { passive: true });
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", cancel);
  el.addEventListener("mouseleave", cancel);
}

function buildCombatStatRows(entity) {
  if (!entity) return [];
  return [
    { title: `ATK : ${entity.atk}`, desc: "", meta: "" },
    { title: `DEF : ${entity.def}`, desc: "", meta: "" },
    { title: `SPD : ${entity.spd}`, desc: "", meta: "" },
    { title: `ACC : ${entity.acc || 0}`, desc: "", meta: "" },
    { title: `COMBUST : ${entity.combustionChance || 0}%`, desc: "", meta: "" },
    { title: `CRIT : ${entity.critChance}%`, desc: "", meta: "" },
    { title: `CRIT DMG : ${entity.critDamage}%`, desc: "", meta: "" },
    { title: `EVASION : ${entity.evasion}%`, desc: "", meta: "" },
    { title: `BLOCK : ${entity.blockRate || 0}%`, desc: "", meta: "" },
    { title: `ESCAPE : ${entity.escapeChance || 0}%`, desc: "", meta: "" },
    { title: `MANA REGEN : ${entity.manaRegen || 0}`, desc: "", meta: "" },
  ];
}

function openEnemyStatsModal(enemy = state.enemy) {
  const e = enemy;
  if (!state.inBattle || !e) return;

  modal.open(
    `${e.name} Stats`,
    buildCombatStatRows(e),
    () => {}
  );
}

function getAllySkillIconSrc(skill, fallback = "./assets/icons/universal.svg") {
  const n = String(skill?.name || "").toLowerCase();
  if (n.includes("guard")) return "./assets/icons/earth.svg";
  if (n.includes("shield")) return "./assets/icons/physical.svg";
  if (n.includes("slash") || n.includes("attack")) return "./assets/icons/physical.svg";
  if (n.includes("bastion") || n.includes("passive")) return "./assets/icons/universal.svg";
  return fallback;
}

function openAllyStatsModal(ally) {
  if (!ally) return;

  const buildSkillCards = () => {
    const cards = [];
    const basic = ally.basicAttack || {};
    cards.push({
      title: `Basic • ${basic.name || "Basic Attack"}`,
      iconFrameOnly: true,
      descHtml: `${escapeHtml(basic.desc || "-")}<br><span class="muted">CD - • Basic Attack</span>`,
      meta: "READY",
      value: undefined,
      className: "allySkillRow allySkillCardRow",
      keepOpen: true,
      skillRef: { name: basic.name || "Basic Attack", desc: basic.desc || "-", mpCost: 0, power: 2, cooldown: 0 }
    });

    const passive = ally.passiveSkill || {};
    cards.push({
      title: `Passive • ${passive.name || "Passive"}`,
      iconFrameOnly: true,
      descHtml: `${escapeHtml(passive.desc || "-")}<br><span class="muted">Selalu aktif</span>`,
      meta: "PASSIVE",
      value: undefined,
      className: "allySkillRow allySkillCardRow",
      keepOpen: true,
      skillRef: { name: passive.name || "Passive", desc: passive.desc || "-", mpCost: 0, power: 0, cooldown: 0 }
    });

    (ally.activeSkills || []).forEach((skill, idx) => {
      cards.push({
        title: `Active ${idx + 1} • ${skill.name || "Skill"}`,
        iconFrameOnly: true,
        cooldownBadge: (skill.cdLeft || 0) > 0 ? `${skill.cdLeft}` : "",
        descHtml: `${escapeHtml(skill.desc || "-")}<br><span class="muted">MP ${skill.mpCost || 0} • Power ${skill.power || 0} • CD ${skill.cdLeft || 0}/${skill.cooldown || 0}</span>`,
        meta: (skill.cdLeft || 0) > 0 ? `CD ${skill.cdLeft}` : "READY",
        value: undefined,
        className: "allySkillRow allySkillCardRow",
        keepOpen: true,
        skillRef: skill
      });
    });

    return cards;
  };

  const choices = buildSkillCards().concat(buildCombatStatRows(ally));

  modal.open(`${ally.name} Stats`, choices, () => {});

  const skillRows = Array.from(document.querySelectorAll('#modalBody .choice.allySkillRow'));
  const skillData = choices.filter((c) => String(c.className || "").includes("allySkillRow"));
  skillRows.forEach((row, idx) => {
    const skill = skillData[idx]?.skillRef;
    if (!skill) return;
    bindLongPress(row, () => showSkillFloatingDetail(skill, row));
    const iconWrap = row.querySelector('.skillIconWrap');
    if (iconWrap) bindLongPress(iconWrap, () => showSkillFloatingDetail(skill, row));
  });
}

function openStatsModal() {
  const p = state.player;

  const xpPct = p.xpToLevel > 0 ? clamp((p.xp / p.xpToLevel) * 100, 0, 100) : 0;

  modal.open(
    "Stats",
    [
      // Player: level row with XP background + simple combat stats per line
      { title: `Lv ${p.level}`, desc: "", meta: "", className: "xpRow", style: `--xp:${xpPct}%` },
      { title: `ATK : ${p.atk}`, desc: "", meta: "" },
      { title: `DEF : ${p.def}`, desc: "", meta: "" },
      { title: `SPD : ${p.spd}`, desc: "", meta: "" },
      { title: `ACC : ${p.acc || 0}`, desc: "", meta: "" },
      { title: `COMBUST : ${p.combustionChance || 0}%`, desc: "", meta: "" },
            { title: `CRIT : ${p.critChance}%`, desc: "", meta: "" },
      { title: `CRIT DMG : ${p.critDamage}%`, desc: "", meta: "" },
      { title: `EVASION : ${p.evasion}%`, desc: "", meta: "" },
      { title: `BLOCK : ${p.blockRate || 0}%`, desc: "", meta: "" },
      { title: `ESCAPE : ${p.escapeChance || 0}%`, desc: "", meta: "" },
      { title: `MANA REGEN : ${p.manaRegen || 0}`, desc: "", meta: "" },
    ],
    () => {}
  );
}

function openInventoryReadOnly() {
  const inv = state.player.inv;
  const category = state.inventoryCategory || "item";
  const keys = Object.keys(inv).filter((k) => {
    const it = inv[k];
    if (!it) return false;
    return category === "equipment" ? it.kind === "gear" : it.kind !== "gear";
  });

  const header = [
    { title: "Item", desc: "Consumable & item pakai.", meta: "", value: "invcat:item", className: `marketCategory marketPrimary ${category === "item" ? "active" : ""}`.trim() },
    { title: "Equipment", desc: "Gear & perlengkapan.", meta: "", value: "invcat:equipment", className: `marketCategory marketPrimary ${category === "equipment" ? "active" : ""}`.trim() },
  ];

  if (!keys.length) {
    modal.open(
      "Inventory",
      header.concat([{ title: "Kosong", desc: "Belum ada item di kategori ini.", meta: "" }]),
      (pick) => {
        if (String(pick || "").startsWith("invcat:")) {
          state.inventoryCategory = String(pick || "").replace("invcat:", "");
          openInventoryReadOnly();
        }
      }
    );
    return;
  }

  modal.open(
    "Inventory",
    header.concat(
      keys.map((k) => ({
        title: `${k} x${inv[k].qty}`,
        desc: inv[k].desc,
        meta: inv[k].kind === "heal_hp" ? `+${inv[k].amount} HP` : `+${inv[k].amount} MP`,
        value: k,
      }))
    ),
    (pick) => {
      if (String(pick || "").startsWith("invcat:")) {
        state.inventoryCategory = String(pick || "").replace("invcat:", "");
        openInventoryReadOnly();
      }
    }
  );
}


/* ------------------------------ Town MENU ------------------------------ */

function openTownMenu(){
  if (state.inBattle) return;

  modal.open(
    "Menu",
    [
      { title: "Load Cloud", desc: "Load progress dari cloud.", meta: "", value: "cloud_load" },
      { title: "Save Cloud", desc: "Save progress ke cloud.", meta: "", value: "cloud_save" },
      { title: "Ganti Karakter", desc: "Pilih slot karakter lain.", meta: "", value: "switch_char" },
      { title: "Log out", desc: "Keluar dari akun cloud dan kembali ke halaman login.", meta: "", value: "logout", className:"danger" },
    ],
    (pick) => {
      if (pick === "cloud_save") {
        (async () => {
          try {
            const r = await cloudTrySaveCurrentProfile();
            if (r.skipped && r.reason === "unauth") {
              addLog("WARN", "Belum login cloud. Silakan login dulu.");
              // munculkan overlay login yang sudah ada di halaman
              showMenu(true);
              return;
            }
            addLog(r.ok ? "SAVE" : "WARN", r.ok ? "Cloud save berhasil." : "Cloud save gagal.");
          } catch (e) {
            console.error("[CLOUD SAVE] error", e);
            addLog("WARN", "Cloud save error.");
          }
          refresh(state);
        })();
        return;
      }

      if (pick === "cloud_load") {
        (async () => {
          try {
            // cek login dulu (biar kalau belum login langsung diarahkan ke overlay login)
            const me = await ensureCloudUser();
            if (!me) {
              addLog("WARN", "Belum login cloud. Silakan login dulu.");
              showMenu(true);
              return;
            }

            const cloud = await cloudLoadPayload();

            if (cloud.unauth) {
              addLog("WARN", "Session cloud habis. Silakan login lagi.");
              showMenu(true);
              return;
            }

            if (cloud.ok && cloud.data && cloud.data.hasSave && cloud.data.data) {
              try {
                const payload =
                  (typeof cloud.data.data === "string") ? JSON.parse(cloud.data.data) : cloud.data.data;

                {
                  const profile = normalizeProfilePayload(payload);

                  state.slots = profile.slots;
                  state.activeSlot = profile.activeSlot;

                  state.player = state.slots[state.activeSlot]
                    ? normalizePlayer(state.slots[state.activeSlot])
                    : normalizePlayer(newPlayer());
                  ensureAllies();

                  state.enemy = null;
                  state.inBattle = false;
                  state.playerDefending = false;
                  setTurn("town");
                  state.battleTurn = 0;

                  addLog("LOAD", "Cloud dimuat. Pilih karakter.");

                  autosave(state);
                  openCharacterMenu("Cloud berhasil dimuat. Pilih karakter.");
                  refresh(state);
                  return;
                }
              } catch (e) {
                console.error("[CLOUD LOAD] parse error", e);
              }
            }

            addLog("LOAD", "Cloud belum ada save / data tidak valid.");
          } catch (e) {
            console.error("[CLOUD LOAD] error", e);
            addLog("WARN", "Cloud load error.");
          }

          refresh(state);
        })();
        return;
      }

      if (pick === "switch_char") {
        // Save current progress then open character select
        autosave(state);
        (async () => { try { await cloudTrySaveCurrentProfile(); } catch(e) {} })();
        openCharacterMenu("Pilih karakter yang akan dimainkan.");
        return;
      }

      if (pick === "logout") {
        (async () => {
          try { await cloudLogout(); } catch(e) {}
          safeRemove(SAVE_KEY);
          resetToEmptyProfile();
          updateMailboxBadge([]);
          closeMailboxOverlay();
          // Hide any character overlays and show auth overlay
          showCharCreate(false);
          showCharMenu(false);
          showAuth(true);
          setAuthMsg("Kamu sudah logout. Silakan login lagi.", false);
        })();
        return;
      }
    }
  );
}

/* --------------------------------- Bind -------------------------------- */

function bind() {
  const setClick = (id, handler) => {
    const el = byId(id);
    if (el) el.onclick = handler;
    else console.warn(`[BIND] elemen #${id} tidak ditemukan, skip binding.`);
  };

  modal.bind();
  window.addEventListener("rpg:modal-closed", () => {
    if (!state.autoBattleEnabled) return;
    if (!state.inBattle || state.turn !== "player") return;
    scheduleAutoBattleTurn();
  });
  const appRoot = document.querySelector(".wrap");
  if (appRoot) {
    appRoot.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }

  // Town
  setClick("btnExplore", explore);
  const br=byId("btnRest"); if(br) br.onclick = rest;
  setClick("btnInventory", openInventoryReadOnly);
  const btnRecruit = byId("btnRecruit");
  if (btnRecruit) btnRecruit.onclick = openAllyPage;
  const allySlotBadge = byId("allySlotBadge");
  if (allySlotBadge) {
    allySlotBadge.onclick = () => {
      if (state.inBattle) return;
      openAllyPage();
    };
  }
  const btnEnemyStats = byId("btnEnemyStats");
  if (btnEnemyStats) btnEnemyStats.onclick = openEnemyStatsModal;
  // MENU (Save/Load/New Game)
  const btnMenu = byId("btnMenu");
  if (btnMenu) btnMenu.onclick = openTownMenu;

  // Profile & Shop
  const btnProfile = byId("btnProfile");
  if (btnProfile) btnProfile.onclick = openProfileModal;
  const btnShop = byId("btnShop");
  if (btnShop) btnShop.onclick = () => openShopModal();
  const btnBlacksmith = byId("btnBlacksmith");
  if (btnBlacksmith) btnBlacksmith.onclick = openBlacksmithPage;
  const btnMonsterHunt = byId("btnMonsterHunt");
  if (btnMonsterHunt) btnMonsterHunt.onclick = openMonsterHuntPage;
  const marketBack = byId("marketBack");
  if (marketBack) marketBack.onclick = () => setMarketPageVisible(false);
  const skillShopBack = byId("skillShopBack");
  if (skillShopBack) skillShopBack.onclick = () => setSkillShopPageVisible(false);
  const blacksmithBack = byId("blacksmithBack");
  if (blacksmithBack) blacksmithBack.onclick = () => setBlacksmithPageVisible(false);
  const monsterHuntBack = byId("monsterHuntBack");
  if (monsterHuntBack) monsterHuntBack.onclick = () => setMonsterHuntPageVisible(false);
  const allyBack = byId("allyBack");
  if (allyBack) allyBack.onclick = () => setAllyPageVisible(false);
  const allyDetailClose = byId("allyDetailClose");
  if (allyDetailClose) allyDetailClose.onclick = closeAllyDetailPopup;
  const allyDetailPopup = byId("allyDetailPopup");
  if (allyDetailPopup) {
    allyDetailPopup.addEventListener("click", (event) => {
      if (event.target === allyDetailPopup) closeAllyDetailPopup();
    });
  }
  const playerStatLink = byId("playerStatLink");
  if (playerStatLink) playerStatLink.onclick = openStatsModal;
  const mailButton = byId("mailButton");
  if (mailButton) {
    mailButton.onclick = () => {
      if (state.inBattle) return;
      openMailboxOverlay();
    };
  }

  const mailboxOverlay = byId("mailboxOverlay");
  if (mailboxOverlay) {
    mailboxOverlay.addEventListener("click", (event) => {
      if (event.target === mailboxOverlay) closeMailboxOverlay();
    });
  }

  document.querySelectorAll(".mailboxTab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const value = tab.getAttribute("data-tab") || "all";
      mailboxState.tab = value;
      document.querySelectorAll(".mailboxTab").forEach((btn) => {
        btn.classList.toggle("active", btn === tab);
      });
      renderMailboxList();
    });
  });

  const mailboxClose = byId("mailboxCloseBtn");
  if (mailboxClose) mailboxClose.onclick = () => setMailboxDetailOpen(false);

  const mailboxOverlayClose = byId("mailboxClose");
  if (mailboxOverlayClose) mailboxOverlayClose.onclick = () => closeMailboxOverlay();

  const mailboxClaimAllBtn = byId("mailboxClaimAll");
  if (mailboxClaimAllBtn) {
    mailboxClaimAllBtn.onclick = async () => {
      mailboxClaimAllBtn.disabled = true;
      await mailboxClaimAll();
      await refreshMailboxItems();
    };
  }

  const mailboxDeleteAllBtn = byId("mailboxDeleteAll");
  if (mailboxDeleteAllBtn) {
    mailboxDeleteAllBtn.onclick = async () => {
      if (hasUnclaimedMailboxRewards(mailboxState.items)) return;
      mailboxDeleteAllBtn.disabled = true;
      const { res } = await mailboxDeleteAll();
      await refreshMailboxItems();
      if (res.ok) {
        mailboxState.selected = null;
        setMailboxDetailOpen(false);
      }
    };
  }

  const mailboxClaimBtn = byId("mailboxClaimBtn");
  if (mailboxClaimBtn) {
    mailboxClaimBtn.onclick = async () => {
      const id = mailboxState.selected;
      if (!id) return;
      await mailboxClaim(id);
      await refreshMailboxItems();
      const updated = mailboxState.items.find((entry) => entry.id === id);
      if (updated) renderMailboxDetail(updated);
    };
  }

  // Character create menu buttons
  const ccCreate = byId("ccCreate");
  if (ccCreate) ccCreate.onclick = handleCreateCharacter;
  const ccCancel = byId("ccCancel");
  if (ccCancel) ccCancel.onclick = cancelCreateCharacter;
  document.querySelectorAll(".genderOption").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".genderOption").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const genderEl = byId("ccGender");
      if (genderEl) genderEl.value = btn.getAttribute("data-gender") || "male";
    };
  });


  // Battle
  setClick("btnAttack", () => {
    if (!state.inBattle || state.turn !== "player") return;
    attack();
    afterPlayerAction();
  });
  const btnCharge = byId("btnCharge");
  if (btnCharge) btnCharge.onclick = () => {
    if (!state.inBattle || state.turn !== "player") return;
    charge();
  };

  const toggleAutoBattle = () => {
    if (!state.inBattle) return;
    setAutoBattleEnabled(!state.autoBattleEnabled);
    addLog("INFO", state.autoBattleEnabled ? "Auto Battle aktif." : "Auto Battle nonaktif.");
    if (state.autoBattleEnabled && state.turn === "player") scheduleAutoBattleTurn();
    refresh(state);
  };

  const btnAutoBattle = byId("btnAutoBattle");
  if (btnAutoBattle) btnAutoBattle.onclick = toggleAutoBattle;

  const btnAutoBattleFloating = byId("btnAutoBattleFloating");
  if (btnAutoBattleFloating) btnAutoBattleFloating.onclick = toggleAutoBattle;

  const btnAutoBattleSettingsFloating = byId("btnAutoBattleSettingsFloating");
  if (btnAutoBattleSettingsFloating) {
    btnAutoBattleSettingsFloating.onclick = () => {
      if (!state.inBattle || !state.autoBattleEnabled) return;
      setAutoBattleUseConsumable(!state.autoBattleUseConsumable);
      addLog("INFO", state.autoBattleUseConsumable ? "Auto Battle: consumable aktif." : "Auto Battle: consumable nonaktif.");
      refresh(state);
    };
  }

  const runBackdrop = byId("runConfirmBackdrop");
  const runConfirm = byId("btnRunConfirm");
  const runCancel = byId("btnRunCancel");

  const openRunConfirm = () => {
    if (runBackdrop) runBackdrop.style.display = "flex";
  };
  const closeRunConfirm = () => {
    if (runBackdrop) runBackdrop.style.display = "none";
  };

  if (runCancel) runCancel.onclick = closeRunConfirm;
  if (runBackdrop) {
    runBackdrop.onclick = (event) => {
      if (event.target === runBackdrop) closeRunConfirm();
    };
  }

  setClick("btnRun", () => {
    if (!state.inBattle || state.turn !== "player") return;
    openRunConfirm();
  });

  if (runConfirm) {
    runConfirm.onclick = () => {
      if (!state.inBattle || state.turn !== "player") return;
      closeRunConfirm();
      const ok = runAway();
      if (!ok) afterPlayerAction();
    };
  }

  setClick("btnItem", () => {
    if (!state.inBattle || state.turn !== "player") return;
    openItemModal();
  });
}

/* --------------------------------- Boot -------------------------------- */

/* ----------------------------- Boot + Main Menu ----------------------------- */

function applyLoaded(payload){
  const profile = normalizeProfilePayload(payload);
  state.slots = profile.slots;
  state.activeSlot = profile.activeSlot;

  state.player = state.slots[state.activeSlot]
    ? normalizePlayer(state.slots[state.activeSlot])
    : normalizePlayer(newPlayer());
  ensureAllies();

  ensureAllies();
  state.enemy = null;
  state.enemyTargetIndex = 0;
  state.inBattle = false;
  state.playerDefending = false;
  setAutoBattleEnabled(false);
  setTurn("town");
  state.battleTurn = 0;

  return state.slots.some(Boolean);
}


function startNewGame(slotIdx){
  const idx = clamp(
    (typeof slotIdx === "number" ? slotIdx : (state.activeSlot || 0)),
    0,
    MAX_CHAR_SLOTS - 1
  );

  const prev = (state.slots && state.slots[idx]) ? state.slots[idx] : state.player;

  const p = normalizePlayer(newPlayer());
  if (prev){
    if (prev.name) p.name = prev.name;
    if (prev.gender) p.gender = prev.gender;
  }

  state.slots[idx] = p;
  state.activeSlot = idx;
  state.player = p;
  ensureAllies();

  ensureAllies();
  state.enemy = null;
  state.enemyTargetIndex = 0;
  state.inBattle = false;
  state.playerDefending = false;
  setAutoBattleEnabled(false);
  setTurn("town");
  state.battleTurn = 0;

  addLog("INFO", "Game baru dimulai (slot di-reset).");

  autosave(state);

  (async () => {
    try { await cloudTrySaveCurrentProfile(); } catch (e) {}
  })();

  refresh(state);
}



function showOverlay(id, show){
  const el = byId(id);
  if (!el) return;
  el.classList.toggle("hidden", !show);
}

// Backward-compat: showMenu() used for auth overlay
function showMenu(show){ showOverlay("mainMenu", show); }

function showAuth(show){ showOverlay("mainMenu", show); }
function showCharMenu(show){ showOverlay("charMenu", show); }
function showCharCreate(show){ showOverlay("charCreateMenu", show); }

function setAuthMsg(msg, isError=false){
  const el = byId("authMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.opacity = "1";
  el.style.color = isError ? "#ffb4b4" : "";
}


let pendingCreateSlot = 0;
let selectedCharSlot = 0;

function setCharMsg(msg, isError=false){
  const el = byId("charMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = isError ? "#ffb4b4" : "";
}
function setCcMsg(msg, isError=false){
  const el = byId("ccMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = isError ? "#ffb4b4" : "";
}

function genderLabel(g){
  const v = String(g || "male").toLowerCase();
  if (v === "male") return "Male";
  if (v === "female") return "Female";
  return "Other";
}

function renderCharacterSlots(){
  const wrap = byId("charSlots");
  if (!wrap) return;

  wrap.innerHTML = "";

  for (let i = 0; i < MAX_CHAR_SLOTS; i++){
    const slot = state.slots && state.slots[i] ? state.slots[i] : null;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "charSlot" + (i === selectedCharSlot ? " active" : "");

    if (slot){
      btn.innerHTML = `
        <div class="charSlotTop">
          <span class="charName">${escapeHtml(slot.name || "Hero")}</span>
          <span class="pill muted">Lv${slot.level || 1}</span>
        </div>
        <div class="charSlotSub">${escapeHtml(genderLabel(slot.gender))}</div>
      `;
    } else {
      btn.innerHTML = `
        <div class="charSlotTop">
          <span class="charName muted">Empty Slot</span>
          <span class="pill muted">#${i+1}</span>
        </div>
        <div class="charSlotSub">Buat karakter baru</div>
      `;
    }

    btn.onclick = () => selectCharSlot(i);
    wrap.appendChild(btn);
  }
}

function selectCharSlot(i){
  selectedCharSlot = clamp(i, 0, MAX_CHAR_SLOTS - 1);
  renderCharacterSlots();
  renderCharActions();
}

function renderCharActions(){
  const wrap = byId("charActions");
  if (!wrap) return;

  wrap.innerHTML = "";

  const idx = clamp(selectedCharSlot || 0, 0, MAX_CHAR_SLOTS - 1);
  const slot = state.slots && state.slots[idx] ? state.slots[idx] : null;

  if (!slot){
    const bCreate = document.createElement("button");
    bCreate.type = "button";
    bCreate.className = "primary";
    bCreate.textContent = "Create";
    bCreate.onclick = () => openCreateCharacter(idx, false);
    wrap.appendChild(bCreate);
    return;
  }

  const bPlay = document.createElement("button");
  bPlay.type = "button";
  bPlay.className = "good";
  bPlay.textContent = "Play";
  bPlay.onclick = () => enterTownWithSlot(idx);

  const bDel = document.createElement("button");
  bDel.type = "button";
  bDel.className = "danger";
  bDel.textContent = "Hapus";
  bDel.onclick = () => deleteCharacter(idx);

  wrap.appendChild(bPlay);
  wrap.appendChild(bDel);
}

function openCharacterMenu(msg=""){
  // pick a sensible default selection
  const preferred = clamp((typeof state.activeSlot === "number" ? state.activeSlot : 0), 0, MAX_CHAR_SLOTS - 1);
  const hasPreferred = state.slots && state.slots[preferred];
  const firstFilled = state.slots ? state.slots.findIndex(Boolean) : -1;
  selectedCharSlot = hasPreferred ? preferred : (firstFilled >= 0 ? firstFilled : 0);

  renderCharacterSlots();
  renderCharActions();
  setCharMsg(msg || "Pilih karakter atau buat baru.");
  showCharMenu(true);
  showCharCreate(false);
}

function openCreateCharacter(slotIdx, overwrite=false){
  pendingCreateSlot = clamp(slotIdx || 0, 0, MAX_CHAR_SLOTS - 1);

  const sub = byId("ccSub");
  if (sub) sub.textContent = `Slot #${pendingCreateSlot + 1}`;

  const slot = (state.slots && state.slots[pendingCreateSlot]) ? state.slots[pendingCreateSlot] : null;

  const nameEl = byId("ccName");
  const genderEl = byId("ccGender");

  // If overwrite: prefill existing values for convenience
  if (nameEl) nameEl.value = (overwrite && slot && slot.name) ? String(slot.name) : "";
  if (genderEl) genderEl.value = (overwrite && slot && slot.gender) ? String(slot.gender) : "male";

  setCcMsg(overwrite ? "Overwrite karakter: isi nama/gender baru." : "Isi nama dan gender.");
  showCharMenu(false);
  showCharCreate(true);
}

function cancelCreateCharacter(){
  showCharCreate(false);
  showCharMenu(true);
  renderCharacterSlots();
  renderCharActions();
  setCcMsg("");
}

function deleteCharacter(slotIdx){
  const idx = clamp(slotIdx || 0, 0, MAX_CHAR_SLOTS - 1);
  const slot = state.slots && state.slots[idx] ? state.slots[idx] : null;
  if (!slot) return;

  const nm = slot.name || `Slot #${idx+1}`;
  if (!confirm(`Hapus karakter "${nm}"? (Slot #${idx+1})`)) return;

  state.slots[idx] = null;

  // If active slot deleted, move active slot to the first available character (or 0)
  if (idx === state.activeSlot){
    const next = state.slots.findIndex(Boolean);
    state.activeSlot = next >= 0 ? next : 0;
    state.player = state.slots[state.activeSlot]
      ? normalizePlayer(state.slots[state.activeSlot])
      : normalizePlayer(newPlayer());
    ensureAllies();

    state.enemy = null;
    state.inBattle = false;
    state.playerDefending = false;
    setTurn("town");
    state.battleTurn = 0;
  }

  autosave(state);
  (async () => { try { await cloudTrySaveCurrentProfile(); } catch(e) {} })();

  // Keep selection on the same index (now empty) so user can press Create.
  selectedCharSlot = clamp(idx, 0, MAX_CHAR_SLOTS - 1);
  renderCharacterSlots();
  renderCharActions();
  setCharMsg("Karakter dihapus.", false);
  showCharMenu(true);
  showCharCreate(false);
  refresh(state);
}

function handleCreateCharacter(){
  const nameEl = byId("ccName");
  const genderEl = byId("ccGender");
  const name = (nameEl?.value || "").toString().trim();
  const genderRaw = (genderEl?.value || "male").toString().toLowerCase();
  const gender = genderRaw === "female" ? "female" : "male";

  if (!name){
    setCcMsg("Nama tidak boleh kosong.", true);
    return;
  }

  const p = normalizePlayer(newPlayer());
  p.name = name;
  p.gender = gender;
  p.charId = pendingCreateSlot;

  state.slots[pendingCreateSlot] = p;
  state.activeSlot = pendingCreateSlot;
  state.player = p;
  ensureAllies();

  // Reset runtime state
  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  setAutoBattleEnabled(false);
  setTurn("town");
  state.battleTurn = 0;

  addLog("INFO", `Karakter dibuat: ${p.name} (${genderLabel(p.gender)})`);
  autosave(state);

  // Sync to cloud if logged in
  (async () => {
    try { await cloudTrySaveCurrentProfile(); } catch (e) {}
  })();

  showCharCreate(false);
  showCharMenu(false);
  refresh(state);
}

function enterTownWithSlot(slotIdx){
  const idx = clamp(slotIdx || 0, 0, MAX_CHAR_SLOTS - 1);
  const slot = state.slots && state.slots[idx] ? state.slots[idx] : null;
  if (!slot) return;

  state.activeSlot = idx;
  state.player = normalizePlayer(slot);
  ensureAllies();

  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  setAutoBattleEnabled(false);
  setTurn("town");
  state.battleTurn = 0;

  addLog("INFO", `Masuk sebagai ${state.player.name} (Lv${state.player.level}).`);

  autosave(state);

  (async () => {
    try { await cloudTrySaveCurrentProfile(); } catch (e) {}
  })();

  showCharCreate(false);
  showCharMenu(false);
  refresh(state);
}


async function syncCloudOrLocalAndShowCharacterMenu(){
  let profile = null;
  let cloudHadSave = false;

  // 1) coba load cloud dulu (kalau login)
  try{
    const me = await ensureCloudUser();
    if (me){
      setAuthMsg("Memuat cloud save...", false);
      const cloud = await cloudLoadPayload();

      if (cloud.ok && cloud.data && cloud.data.hasSave && cloud.data.data){
        cloudHadSave = true;
        const raw = cloud.data.data;
        const payload = (typeof raw === "string") ? JSON.parse(raw) : raw;
        profile = normalizeProfilePayload(payload);
      }
    }
  }catch(e){
    console.error("[CLOUD LOAD] error", e);
  }

  // 2) kalau cloud belum ada save, pakai lokal (kalau ada), lalu upload ke cloud
  const local = load();
  if (!profile && local){
    profile = normalizeProfilePayload(local);

    try{
      const me = await ensureCloudUser();
      if (me && !cloudHadSave){
        setAuthMsg("Cloud kosong. Upload save lokal ke cloud...", false);
        await cloudSavePayload(profile);
        addLog("CLOUD", "Save lokal berhasil di-upload ke cloud.");
      }
    }catch(e){
      console.error("[CLOUD UPLOAD] error", e);
    }
  }

  // 3) tidak ada apa-apa → profile kosong (user akan buat karakter)
  if (!profile) profile = emptyProfilePayload();

  // Apply to runtime state
  state.slots = profile.slots;
  state.activeSlot = profile.activeSlot;

  // Set player to active slot if exists, otherwise placeholder (will be replaced after create/select)
  state.player = state.slots[state.activeSlot]
    ? normalizePlayer(state.slots[state.activeSlot])
    : normalizePlayer(newPlayer());
  ensureAllies();

  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  setAutoBattleEnabled(false);
  setTurn("town");
  state.battleTurn = 0;

  refresh(state);

  // Show character menu
  showAuth(false);
  openCharacterMenu();

  try {
    await refreshMailboxItems();
  } catch (e) {
    console.error("[MAILBOX] gagal refresh badge", e);
  }

  return true;
}


(function boot() {
  bind();

  const userEl = byId("authUser");
  const passEl = byId("authPass");
  const btnLogin = byId("authLogin");
  const btnRegister = byId("authRegister");

  // Always show auth overlay first
  showMenu(true);

  const getCreds = () => {
    const username = (userEl?.value || "").toString().trim().toLowerCase();
    const password = (passEl?.value || "").toString();
    return { username, password };
  };

  const doLogin = async () => {
    const { username, password } = getCreds();
    if (!username || !password){
      setAuthMsg("Isi username & password dulu.", true);
      return;
    }

    setAuthMsg("Login...", false);

    const { res, data } = await apiJson("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    if (!res.ok){
      setAuthMsg(data?.message || "Login gagal.", true);
      return;
    }

    // refresh cached user after cookie is set
    cloudUserCache = null;
    await ensureCloudUser();

    await syncCloudOrLocalAndShowCharacterMenu();
  };

  const doRegister = async () => {
    const { username, password } = getCreds();
    if (!username || !password){
      setAuthMsg("Isi username & password dulu.", true);
      return;
    }

    setAuthMsg("Register...", false);

    const { res, data } = await apiJson("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    if (!res.ok){
      setAuthMsg(data?.message || "Register gagal.", true);
      return;
    }

    // auto login after register
    await doLogin();
  };

  if (btnLogin) btnLogin.onclick = () => doLogin();
  if (btnRegister) btnRegister.onclick = () => doRegister();

  // Enter key triggers login
  if (passEl){
    passEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });
  }

  // If already logged in, auto-load cloud save
  (async () => {
    try{
      setAuthMsg("Cek login...", false);
      const me = await ensureCloudUser();
      if (me){
        setAuthMsg("Login terdeteksi. Memuat save...", false);
        await syncCloudOrLocalAndShowCharacterMenu();
      }else{
        setAuthMsg("Silakan login / register untuk cloud save.", false);
      }
    }catch(e){
      console.error("[AUTH INIT] error", e);
      setAuthMsg("Gagal cek session. Silakan login.", true);
    }
  })();

  refresh(state);
})();

})();
