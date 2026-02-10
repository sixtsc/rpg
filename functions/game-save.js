function isObj(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function inRange(n, min, max) {
  return Number.isFinite(n) && n >= min && n <= max;
}

export function validatePlayerSnapshot(player) {
  if (!isObj(player)) return { ok: false, message: "player harus object" };

  const numericChecks = [
    ["level", 1, 500],
    ["maxHp", 1, 99999],
    ["maxMp", 0, 99999],
    ["hp", 0, 99999],
    ["mp", 0, 99999],
    ["atk", 1, 99999],
    ["def", 0, 99999],
    ["spd", 0, 99999],
    ["xp", 0, 99999999],
    ["xpToLevel", 1, 99999999],
    ["gold", 0, 99999999],
  ];

  for (const [field, min, max] of numericChecks) {
    if (!inRange(player[field], min, max)) {
      return { ok: false, message: `Field ${field} tidak valid` };
    }
  }

  if (player.hp > player.maxHp || player.mp > player.maxMp) {
    return { ok: false, message: "HP/MP melebihi maksimum" };
  }

  if (typeof player.name !== "string" || player.name.trim().length < 1 || player.name.length > 24) {
    return { ok: false, message: "Nama karakter tidak valid" };
  }

  if (!Array.isArray(player.skills) || player.skills.length > 32) {
    return { ok: false, message: "skills tidak valid" };
  }

  if (!isObj(player.inv) || Object.keys(player.inv).length > 64) {
    return { ok: false, message: "inventory tidak valid" };
  }

  if (player.allies && (!Array.isArray(player.allies) || player.allies.length > 2)) {
    return { ok: false, message: "allies tidak valid" };
  }

  return { ok: true };
}

export function validateSavePayload(data) {
  if (!isObj(data)) return { ok: false, message: "payload harus object" };
  if (!isObj(data.player)) return { ok: false, message: "payload.player wajib" };
  return validatePlayerSnapshot(data.player);
}

export function validateProgression(prevParsed, nextParsed, maxGain = { gold: 25000, xp: 100000 }) {
  if (!prevParsed || !prevParsed.player) return { ok: true };
  const prev = prevParsed.player;
  const next = nextParsed.player;

  if (next.level < prev.level) {
    return { ok: false, message: "Level tidak boleh turun di cloud save." };
  }

  if (next.gold - prev.gold > maxGain.gold) {
    return { ok: false, message: "Kenaikan gold terlalu besar." };
  }

  const prevTotalXp = prev.level * prev.xpToLevel + prev.xp;
  const nextTotalXp = next.level * next.xpToLevel + next.xp;
  if (nextTotalXp - prevTotalXp > maxGain.xp) {
    return { ok: false, message: "Kenaikan XP terlalu besar." };
  }

  return { ok: true };
}
