import { ENEMY_NAMES } from "./data.js";

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const randFloat = (a, b) => (Math.random() * (b - a)) + a;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const MAX_CHAR_SLOTS = 6;
export const STAT_POINTS_PER_LEVEL = 1;
export const MAX_LEVEL = 10;
export const MAX_ALLIES = 2;

export function applyDerivedStats(p) {
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

export function genEnemy(plv) {
  const lvl = clamp(plv + pick([-1, 0, 0, 1]), 1, MAX_LEVEL);
  const name = pick(ENEMY_NAMES);
  const enemy = {
    name,
    level: lvl,
    maxHp: 28 + lvl * 10,
    maxMp: 12 + lvl * 4,
    hp: 28 + lvl * 10,
    mp: 12 + lvl * 4,
    atk: 7 + lvl * 3,
    def: 3 + lvl * 2,
    spd: 4 + lvl * 2,
    str: Math.max(0, lvl),
    dex: Math.max(0, Math.floor(lvl * 0.6)),
    int: Math.max(0, Math.floor(lvl * 0.6)),
    vit: Math.max(0, Math.floor(lvl * 1.2)),
    critChance: clamp(5 + Math.floor(lvl / 3), 5, 35),
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
    xpReward: 18 + lvl * 6,
    goldReward: 8 + lvl * 4,
  };
  applyDerivedStats(enemy);
  enemy.blockRate = 0;
  return enemy;
}

export function calcDamage(attAtk, defDef, basePower, defending) {
  const variance = randInt(-2, 3);
  const raw = (attAtk + basePower) - defDef + variance;
  let dmg = clamp(raw, 1, 9999);
  if (defending) dmg = Math.max(1, Math.floor(dmg / 2));
  return dmg;
}

export function resolveAttack(att, def, basePower, opts = {}) {
  const dodgeBonus = opts.dodgeBonus || 0;

  const evasion = clamp((def.evasion || 0) + dodgeBonus, 0, 95);
  const rollEv = randInt(1, 100);
  if (rollEv <= evasion) {
    return { missed: true, crit: false, combustion: false, dmg: 0, evasion, rollEv, rollCrit: null, rollComb: null };
  }

  let dmg = calcDamage(att.atk, def.def, basePower, false);

  const critChance = clamp(att.critChance || 0, 0, 100);
  const rollCrit = randInt(1, 100);
  let crit = false;
  if (rollCrit <= critChance) {
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

export function escapeChance(p, e) {
  return clamp(50 + (p.spd - e.spd) * 8, 10, 90);
}

export function dodgeChance(p, e) {
  return clamp(10 + (p.spd - e.spd) * 6, 5, 45);
}
