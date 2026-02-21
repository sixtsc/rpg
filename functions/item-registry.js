function toPositiveInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

function normalizeInventory(inv, verifiedItemsById, unknownIds) {
  if (!inv || typeof inv !== "object" || Array.isArray(inv)) return {};

  const out = {};
  for (const [rawId, rawEntry] of Object.entries(inv)) {
    const id = String(rawId).trim();
    if (!/^\d+$/.test(id)) {
      unknownIds.push(rawId);
      continue;
    }

    const item = verifiedItemsById.get(Number(id));
    if (!item) {
      unknownIds.push(rawId);
      continue;
    }

    const qty = toPositiveInt(rawEntry?.qty, 0);
    if (qty <= 0) continue;

    out[id] = {
      id: item.id,
      name: item.name,
      kind: item.kind,
      amount: item.amount,
      desc: item.desc,
      qty,
    };
  }

  return out;
}

export async function fetchVerifiedItems(env) {
  const rows = await env.DB
    .prepare("SELECT id, name, kind, amount, desc FROM game_items WHERE is_active = 1")
    .all();

  const list = Array.isArray(rows?.results) ? rows.results : [];
  return new Map(list.map((row) => [Number(row.id), {
    id: Number(row.id),
    name: String(row.name || ""),
    kind: String(row.kind || ""),
    amount: Number(row.amount || 0),
    desc: String(row.desc || ""),
  }]));
}

export function enforceVerifiedInventory(payload, verifiedItemsById) {
  const unknownIds = [];

  if (payload?.player && typeof payload.player === "object") {
    payload.player = {
      ...payload.player,
      inv: normalizeInventory(payload.player.inv, verifiedItemsById, unknownIds),
    };
  }

  if (Array.isArray(payload?.slots)) {
    payload.slots = payload.slots.map((slot) => {
      if (!slot || typeof slot !== "object") return slot;
      return {
        ...slot,
        inv: normalizeInventory(slot.inv, verifiedItemsById, unknownIds),
      };
    });
  }

  return { payload, unknownIds };
}
