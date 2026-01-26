import { SKILLS, ITEMS } from "./data.js";

export function newPlayer(){
  return {
    name:"Hero",
    level:1,
    maxHp:60, maxMp:25,
    hp:60, mp:25,
    atk:10, def:4, spd:7,
    xp:0, xpToLevel:50,
    gold:0,
    allies: [],
    skills: [],
    inv: { "Potion": { ...ITEMS.potion, qty:2 }, "Ether": { ...ITEMS.ether, qty:1 } }
  };
}

export function newState(){
  const player = newPlayer();
  return {
    player,
    allies: player.allies,
    enemy: null,
    inBattle: false,
    playerDefending: false,
    turn: "town",
    battleTurn: 0 // "town" | "player" | "enemy"
  };
}
