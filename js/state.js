import { SKILLS, ITEMS, getShopItem } from "./data.js";
import { clamp, MAX_CHAR_SLOTS, MAX_LEVEL, applyDerivedStats } from "./engine.js";

export function newPlayer() {
  return {
    name: "Hero",
    gender: "male",
    level: 1,
    str: 0,
    dex: 0,
    int: 0,
    vit: 0,
    foc: 0,
    statPoints: 1,
    _spBaseGranted: true,
    baseBlockRate: 0,
    baseEscapeChance: 0,
    maxHp: 60,
    maxMp: 25,
    hp: 60,
    mp: 25,
    atk: 10,
    def: 4,
    spd: 7,
    acc: 0,
    critChance: 5,
    critDamage: 0,
    combustionChance: 0,
    evasion: 5,
    manaRegen: 5,
    blockRate: 0,
    escapeChance: 0,
    statuses: [],
    equipment: { hand: null, head: null, pant: null, armor: null, shoes: null },
    equipmentBonus: { atk: 0, def: 0, spd: 0 },
    deprecatedSkillCooldown: 0,
    xp: 0,
    xpToLevel: 50,
    gold: 0,
    gems: 0,
    allies: [],
    skills: [{ ...SKILLS.fireball, cdLeft: 0 }],
    skillSlots: ["Fireball", null, null, null, null, null, null, null],
    inv: { "Potion": { ...ITEMS.potion, qty: 2 }, "Ether": { ...ITEMS.ether, qty: 1 } },
  };
}

export function normalizeAlly(ally) {
  if (!ally) return null;
  const level = clamp(Number(ally.level) || 1, 1, MAX_LEVEL);
  const maxHp = Math.max(1, Number(ally.maxHp) || 1);
  const maxMp = Math.max(0, Number(ally.maxMp) || 0);
  const hp = clamp(Number(ally.hp) || maxHp, 0, maxHp);
  const mp = clamp(Number(ally.mp) || maxMp, 0, maxMp);
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
    role: ally.role || "Ally",
    name: ally.name || "Ally",
  };
}

export function normalizePlayer(p) {
  if (!p) return p;

  if (!Array.isArray(p.allies)) p.allies = [];
  p.allies = p.allies.map(normalizeAlly).filter(Boolean);

  if (typeof p.gender !== "string") p.gender = "male";
  if (typeof p.str !== "number") p.str = 0;
  if (typeof p.dex !== "number") p.dex = 0;
  if (typeof p.int !== "number") p.int = 0;
  if (typeof p.vit !== "number") p.vit = 0;
  if (typeof p.foc !== "number") {
    if (typeof p.luk === "number") p.foc = p.luk;
    else p.foc = 0;
  }
  if (typeof p.statPoints !== "number") p.statPoints = 0;

  if (!p._spBaseGranted) {
    p.statPoints += 1;
    p._spBaseGranted = true;
  }

  if (typeof p.acc !== "number") p.acc = 0;
  if (typeof p.combustionChance !== "number") p.combustionChance = 0;

  if (typeof p.critDamage !== "number") {
    p.critDamage = 0;
  } else if (p.critDamage >= 100) {
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
    p.equipment = { hand: null, head: null, pant: null, armor: null, shoes: null };
  } else {
    p.equipment.hand ??= null;
    p.equipment.head ??= null;
    p.equipment.pant ??= null;
    p.equipment.armor ??= null;
    p.equipment.shoes ??= null;
  }
  if (!p.equipmentBonus || typeof p.equipmentBonus !== "object") {
    p.equipmentBonus = { atk: 0, def: 0, spd: 0 };
  } else {
    p.equipmentBonus.atk = Number(p.equipmentBonus.atk || 0);
    p.equipmentBonus.def = Number(p.equipmentBonus.def || 0);
    p.equipmentBonus.spd = Number(p.equipmentBonus.spd || 0);
  }
  if (!Array.isArray(p.skills)) p.skills = [];
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
  }

  if (typeof p.level !== "number") p.level = 1;
  if (typeof p.name !== "string") p.name = "Hero";
  if (typeof p.gems !== "number") p.gems = 0;

  applyDerivedStats(p);
  applyEquipmentStats(p);
  return p;
}

function getItemRef(name, player) {
  if (!name) return null;
  const p = player || window.__GAME_STATE__?.player;
  const invItem = p && p.inv ? p.inv[name] : null;
  if (invItem) return invItem;
  const shopItem = getShopItem(name);
  return shopItem ? shopItem.ref : null;
}

function calcEquipmentBonus(player) {
  const p = player;
  const bonus = { atk: 0, def: 0, spd: 0 };
  if (!p || !p.equipment) return bonus;
  Object.values(p.equipment).forEach((name) => {
    const it = getItemRef(name, p);
    if (!it) return;
    if (typeof it.atk === "number") bonus.atk += it.atk;
    if (typeof it.def === "number") bonus.def += it.def;
    if (typeof it.spd === "number") bonus.spd += it.spd;
  });
  return bonus;
}

export function applyEquipmentStats(player) {
  const p = player;
  if (!p) return;
  const prev = p.equipmentBonus || { atk: 0, def: 0, spd: 0 };
  const next = calcEquipmentBonus(p);
  p.atk = Math.max(0, (p.atk || 0) - (prev.atk || 0) + next.atk);
  p.def = Math.max(0, (p.def || 0) - (prev.def || 0) + next.def);
  p.spd = Math.max(0, (p.spd || 0) - (prev.spd || 0) + next.spd);
  p.equipmentBonus = next;
}

export function newState() {
  const player = normalizePlayer(newPlayer());
  return {
    slots: Array.from({ length: MAX_CHAR_SLOTS }, () => null),
    activeSlot: 0,
    player,
    allies: player.allies,
    enemy: null,
    enemyQueue: null,
    enemyTargetIndex: 0,
    inBattle: false,
    battleResult: null,
    shopMarketCategory: "consumable",
    shopEquipCategory: "weapon",
    inventoryCategory: "item",
    playerDefending: false,
    playerDodging: false,
    turn: "town",
    battleTurn: 0,
  };
}
