import { json, authUserId } from "../_lib.js";

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return json({ message: "Gunakan GET." }, { status: 405 });

  try {
    const userId = await authUserId(request, env);
    if (!userId) return json({ message: "Belum login." }, { status: 401 });

    const row = await env.DB.prepare("SELECT id, state, updated_at FROM active_battles WHERE user_id = ?1")
      .bind(userId)
      .first();
    if (!row) return json({ ok: true, hasBattle: false });

    return json({ ok: true, hasBattle: true, battleId: row.id, state: JSON.parse(row.state), updated_at: row.updated_at });
  } catch (e) {
    return json({ message: "Server error (battle-state): " + (e?.message || String(e)) }, { status: 500 });
  }
}
