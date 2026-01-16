import { ENEMY_NAMES } from "./data.js";

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const randFloat = (a, b) => (Math.random() * (b - a)) + a;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const MAX_CHAR_SLOTS = 6;
export const STAT_POINTS_PER_LEVEL = 1;
export const MAX_LEVEL = 10;

export function genEnemy(plv) {
  const lvl = clamp(plv + pick([-1, 0, 0, 1]), 1, MAX_LEVEL);
  return {
    name: pick(ENEMY_NAMES),
    level: lvl,
    maxHp: 25 + lvl * 8,
    maxMp: 10 + lvl * 3,
    hp: 25 + lvl * 8,
    mp: 10 + lvl * 3,
    atk: 6 + lvl * 2,
    def: 2 + lvl,
    spd: 4 + lvl,
    critChance: clamp(5 + Math.floor(lvl / 3), 5, 35),
    critDamage: 0,
    acc: 0,
    foc: 0,
    combustionChance: 0,
    evasion: clamp(5 + Math.floor((4 + lvl) / 4), 5, 30),
    xpReward: 18 + lvl * 6,
    goldReward: 8 + lvl * 4,
  };
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
    const combMult = randFloat(2.0, 2.5);
    dmg = Math.max(1, Math.round(dmg * combMult));
    combustion = true;
  }

  return { missed: false, crit, combustion, dmg, evasion, rollEv, rollCrit, rollComb };
}

export function escapeChance(p, e) {
  return clamp(50 + (p.spd - e.spd) * 8, 10, 90);
}

export function dodgeChance(p, e) {
  return clamp(10 + (p.spd - e.spd) * 6, 5, 45);
}
