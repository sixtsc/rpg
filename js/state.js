import { SKILLS, ITEMS } from "./data.js";
import { MAX_CHAR_SLOTS } from "./engine.js";

export function newPlayer() {
  return {
    name: "Hero",
    gender: "other",
    level: 1,
    str: 0,
    dex: 0,
    int: 0,
    vit: 0,
    foc: 0,
    statPoints: 0,
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
    deprecatedSkillCooldown: 0,
    xp: 0,
    xpToLevel: 50,
    gold: 0,
    skills: [{ ...SKILLS.fireball, cdLeft: 0 }],
    inv: { "Potion": { ...ITEMS.potion, qty: 2 }, "Ether": { ...ITEMS.ether, qty: 1 } },
  };
}

export function normalizePlayer(p) {
  if (!p) return p;

  if (typeof p.gender !== "string") p.gender = "other";
  if (typeof p.str !== "number") p.str = 0;
  if (typeof p.dex !== "number") p.dex = 0;
  if (typeof p.int !== "number") p.int = 0;
  if (typeof p.vit !== "number") p.vit = 0;
  if (typeof p.foc !== "number") {
    if (typeof p.luk === "number") p.foc = p.luk;
    else p.foc = 0;
  }
  if (typeof p.statPoints !== "number") p.statPoints = 0;

  if (typeof p.acc !== "number") p.acc = 0;
  if (typeof p.combustionChance !== "number") p.combustionChance = 0;

  if (typeof p.critDamage !== "number") {
    p.critDamage = 0;
  } else if (p.critDamage >= 100) {
    p.critDamage = Math.max(0, p.critDamage - 100);
  }
  if (typeof p.critChance !== "number") p.critChance = 0;
  if (typeof p.evasion !== "number") p.evasion = 0;

  if (typeof p.level !== "number") p.level = 1;
  if (typeof p.name !== "string") p.name = "Hero";

  return p;
}

export function newState() {
  return {
    slots: Array.from({ length: MAX_CHAR_SLOTS }, () => null),
    activeSlot: 0,
    player: normalizePlayer(newPlayer()),
    enemy: null,
    inBattle: false,
    playerDefending: false,
    playerDodging: false,
    turn: "town",
    battleTurn: 0,
  };
}
