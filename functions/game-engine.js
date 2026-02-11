function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calcDamage(atk, def, variance = 3, isDefending = false) {
  const spread = randInt(-variance, variance);
  let raw = atk - Math.floor(def * 0.6) + spread;
  if (isDefending) raw = Math.floor(raw * 0.6);
  return clamp(raw, 1, 999999);
}

export function escapeChance(player, enemy) {
  const base = 40 + (player.spd - enemy.spd) * 3;
  return clamp(base, 15, 90);
}

const ENEMIES = [
  { name: "Slime", hp: 42, mp: 8, atk: 8, def: 2, spd: 4, xp: 20, gold: 12 },
  { name: "Goblin", hp: 58, mp: 12, atk: 10, def: 4, spd: 7, xp: 28, gold: 16 },
  { name: "Wolf", hp: 66, mp: 10, atk: 12, def: 5, spd: 9, xp: 36, gold: 20 },
  { name: "Bandit", hp: 78, mp: 18, atk: 14, def: 7, spd: 8, xp: 46, gold: 26 },
  { name: "Skeleton", hp: 92, mp: 22, atk: 16, def: 9, spd: 7, xp: 58, gold: 34 },
];

export function genEnemy(level = 1) {
  const template = ENEMIES[randInt(0, ENEMIES.length - 1)];
  const grow = Math.max(0, level - 1);
  const maxHp = template.hp + grow * 10;
  const maxMp = template.mp + grow * 4;
  return {
    id: crypto.randomUUID(),
    name: template.name,
    level,
    maxHp,
    hp: maxHp,
    maxMp,
    mp: maxMp,
    atk: template.atk + grow * 2,
    def: template.def + grow,
    spd: template.spd + Math.floor(grow * 0.5),
    xpReward: template.xp + grow * 8,
    goldReward: template.gold + grow * 4,
  };
}

function levelUp(player, logs) {
  player.level += 1;
  player.maxHp += 10;
  player.maxMp += 5;
  player.atk += 2;
  player.def += 1;
  player.spd += 1;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.xpToLevel = Math.floor(player.xpToLevel * 1.25);
  logs.push({ type: "level", text: `Naik ke Lv${player.level}!` });
}

function gainXp(player, amount, logs) {
  player.xp += amount;
  logs.push({ type: "xp", text: `+${amount} XP` });
  while (player.xp >= player.xpToLevel) {
    player.xp -= player.xpToLevel;
    levelUp(player, logs);
  }
}

export function createBattleState(player) {
  const enemy = genEnemy(player.level);
  const playerFirst = player.spd >= enemy.spd;
  return {
    id: crypto.randomUUID(),
    turn: playerFirst ? "player" : "enemy",
    playerDefending: false,
    battleTurn: playerFirst ? 1 : 0,
    finished: false,
    player,
    enemy,
    logs: [{ type: "start", text: `Musuh muncul: ${enemy.name} (Lv${enemy.level})` }],
  };
}

function runEnemyTurn(state) {
  if (state.finished) return;
  state.turn = "enemy";
  const useRage = state.enemy.mp >= 5 && Math.random() < 0.25;
  let dmg;
  if (useRage) {
    state.enemy.mp -= 5;
    dmg = calcDamage(state.enemy.atk, state.player.def, 8, state.playerDefending);
    state.logs.push({ type: "enemy", text: `${state.enemy.name} memakai Rage Strike! Damage ${dmg}.` });
  } else {
    dmg = calcDamage(state.enemy.atk, state.player.def, 2, state.playerDefending);
    state.logs.push({ type: "enemy", text: `${state.enemy.name} menyerang! Damage ${dmg}.` });
  }
  state.player.hp = clamp(state.player.hp - dmg, 0, state.player.maxHp);
  state.playerDefending = false;

  if (state.player.hp <= 0) {
    state.finished = true;
    state.turn = "town";
    state.logs.push({ type: "lose", text: "Kamu kalah..." });
    return;
  }

  state.turn = "player";
  state.battleTurn += 1;
}

function completeWin(state) {
  state.finished = true;
  state.turn = "town";
  state.player.gold += state.enemy.goldReward;
  state.logs.push({ type: "gold", text: `+${state.enemy.goldReward} gold` });
  gainXp(state.player, state.enemy.xpReward, state.logs);
}

export function resolveBattleAction(state, action, skill = null) {
  if (state.finished) return state;
  if (state.turn !== "player") {
    throw new Error("Bukan giliran player.");
  }

  if (action === "attack") {
    const dmg = calcDamage(state.player.atk, state.enemy.def, 3, false);
    state.enemy.hp = clamp(state.enemy.hp - dmg, 0, state.enemy.maxHp);
    state.logs.push({ type: "you", text: `Attack! Damage ${dmg}.` });
  } else if (action === "defend") {
    state.playerDefending = true;
    state.logs.push({ type: "you", text: "Kamu bertahan." });
  } else if (action === "run") {
    const chance = escapeChance(state.player, state.enemy);
    const roll = randInt(1, 100);
    if (roll <= chance) {
      state.finished = true;
      state.turn = "town";
      state.logs.push({ type: "info", text: `Berhasil kabur! (Chance ${chance}%, Roll ${roll})` });
      return state;
    }
    state.logs.push({ type: "info", text: `Gagal kabur. (Chance ${chance}%, Roll ${roll})` });
  } else if (action === "skill") {
    if (!skill || typeof skill.mpCost !== "number" || typeof skill.power !== "number") {
      throw new Error("Data skill tidak valid.");
    }
    if (state.player.mp < skill.mpCost) {
      throw new Error("MP tidak cukup.");
    }
    state.player.mp -= skill.mpCost;
    const dmg = calcDamage(state.player.atk, state.enemy.def, skill.power, false);
    state.enemy.hp = clamp(state.enemy.hp - dmg, 0, state.enemy.maxHp);
    state.logs.push({ type: "you", text: `${skill.name || "Skill"}! Damage ${dmg}.` });
  } else {
    throw new Error("Action tidak didukung.");
  }

  if (state.enemy.hp <= 0) {
    completeWin(state);
    return state;
  }

  runEnemyTurn(state);
  return state;
}
