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

function validateProfilePayload(data) {
  if (!Array.isArray(data.slots)) return { ok: false, message: "payload.slots wajib array" };
  if (data.slots.length > 12) return { ok: false, message: "Jumlah slot terlalu banyak" };

  for (const slot of data.slots) {
    if (!slot) continue;
    const valid = validatePlayerSnapshot(slot);
    if (!valid.ok) return valid;
  }

  return { ok: true };
}

export function validateSavePayload(data) {
  if (!isObj(data)) return { ok: false, message: "payload harus object" };
  if (isObj(data.player)) return validatePlayerSnapshot(data.player);
  if (Array.isArray(data.slots)) return validateProfilePayload(data);
  return { ok: false, message: "payload harus berisi player atau slots" };
}

function estimateProgress(player) {
  if (!player) {
    return {
      level: 0,
      gold: 0,
      xp: 0,
      xpToLevel: 0,
      stableXpScore: 0,
    };
  }

  const level = Number(player.level || 0);
  const gold = Number(player.gold || 0);
  const xp = Number(player.xp || 0);
  const xpToLevel = Number(player.xpToLevel || 0);
  const stableXpScore = level * 1000000 + xp;

  return {
    level,
    gold,
    xp,
    xpToLevel,
    stableXpScore,
  if (!player) return { level: 0, gold: 0, totalXp: 0 };
  return {
    level: Number(player.level || 0),
    gold: Number(player.gold || 0),
    totalXp: Number(player.level || 0) * Number(player.xpToLevel || 0) + Number(player.xp || 0),
  };
}

function extractMainPlayer(payload) {
  if (payload?.player) return payload.player;
  if (Array.isArray(payload?.slots)) {
    const idx = typeof payload.activeSlot === "number" ? payload.activeSlot : 0;
    return payload.slots[idx] || payload.slots.find(Boolean) || null;
  }
  return null;
}

export function validateProgression(prevParsed, nextParsed, maxGain = { gold: 25000, xp: 100000 }) {
  const prev = extractMainPlayer(prevParsed);
  const next = extractMainPlayer(nextParsed);
  if (!next) return { ok: false, message: "Karakter utama tidak ditemukan." };
  if (!prev) return { ok: true };

  const prevStats = estimateProgress(prev);
  const nextStats = estimateProgress(next);

  if (nextStats.level < prevStats.level) {
    return { ok: false, message: "Level tidak boleh turun di cloud save." };
  }

  if (nextStats.gold - prevStats.gold > maxGain.gold) {
    return { ok: false, message: "Kenaikan gold terlalu besar." };
  }

  if (nextStats.xpToLevel < prevStats.xpToLevel) {
    return { ok: false, message: "xpToLevel tidak boleh turun di cloud save." };
  }

  if (nextStats.stableXpScore < prevStats.stableXpScore) {
    return { ok: false, message: "Progress XP tidak boleh mundur." };
  }

  if (nextStats.stableXpScore - prevStats.stableXpScore > maxGain.xp) {
  if (nextStats.totalXp - prevStats.totalXp > maxGain.xp) {
    return { ok: false, message: "Kenaikan XP terlalu besar." };
  }

  return { ok: true };
}
