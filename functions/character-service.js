export function normalizeProfile(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (!Array.isArray(payload.slots)) return null;
  const activeSlot = typeof payload.activeSlot === "number" ? payload.activeSlot : 0;
  return {
    activeSlot,
    slots: payload.slots.map((slot) => (slot && typeof slot === "object" ? slot : null)),
  };
}

export async function syncCharacterUidsFromProfile(env, userId, profile) {
  if (!profile || !Array.isArray(profile.slots)) return profile;

  const now = Math.floor(Date.now() / 1000);
  const out = {
    activeSlot: profile.activeSlot,
    slots: profile.slots.map((slot) => (slot && typeof slot === "object" ? { ...slot } : null)),
  };

  for (let i = 0; i < out.slots.length; i += 1) {
    const slot = out.slots[i];
    if (!slot) {
      await env.DB
        .prepare("DELETE FROM characters WHERE user_id = ?1 AND slot_index = ?2")
        .bind(userId, i)
        .run();
      continue;
    }

    const row = await env.DB
      .prepare("SELECT uid FROM characters WHERE user_id = ?1 AND slot_index = ?2")
      .bind(userId, i)
      .first();

    const name = (slot.name || "Hero").toString().slice(0, 32);
    const gender = (slot.gender || "male").toString().slice(0, 12);
    const payload = JSON.stringify(slot);

    if (row?.uid) {
      await env.DB
        .prepare("UPDATE characters SET name = ?1, gender = ?2, payload = ?3, updated_at = ?4 WHERE uid = ?5")
        .bind(name, gender, payload, now, row.uid)
        .run();
      out.slots[i].uid = Number(row.uid);
    } else {
      const inserted = await env.DB
        .prepare(
          "INSERT INTO characters (user_id, slot_index, name, gender, payload, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING uid"
        )
        .bind(userId, i, name, gender, payload, now, now)
        .first();

      out.slots[i].uid = Number(inserted.uid);
    }
  }

  return out;
}

export async function applyCharacterUidsToProfile(env, userId, profile) {
  if (!profile || !Array.isArray(profile.slots)) return profile;
  const out = {
    activeSlot: profile.activeSlot,
    slots: profile.slots.map((slot) => (slot && typeof slot === "object" ? { ...slot } : null)),
  };

  const rows = await env.DB
    .prepare("SELECT uid, slot_index FROM characters WHERE user_id = ?1")
    .bind(userId)
    .all();

  for (const row of rows?.results || []) {
    const idx = Number(row.slot_index);
    if (out.slots[idx] && typeof out.slots[idx] === "object") {
      out.slots[idx].uid = Number(row.uid);
    }
  }

  return out;
}
