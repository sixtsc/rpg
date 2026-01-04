import { ENEMY_NAMES } from "./data.js";

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
export const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

export function genEnemy(plv){
  const lvl = clamp(plv + pick([-1,0,0,1]), 1, 99);
  return {
    name: pick(ENEMY_NAMES),
    level:lvl,
    maxHp:25 + lvl*8, maxMp:10 + lvl*3,
    hp:25 + lvl*8, mp:10 + lvl*3,
    atk:6 + lvl*2, def:2 + lvl, spd:4 + lvl,
    xpReward:18 + lvl*6, goldReward:8 + lvl*4
  };
}

export function calcDamage(attAtk, defDef, basePower, defending){
  const variance = randInt(-2,3);
  let raw = (attAtk + basePower) - defDef + variance;
  let dmg = clamp(raw, 1, 9999);
  if(defending) dmg = Math.max(1, Math.floor(dmg/2));
  return dmg;
}

export function escapeChance(p,e){
  return clamp(50 + (p.spd - e.spd)*8, 10, 90);
}
