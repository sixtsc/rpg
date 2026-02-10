import { json, authUserId, checkRateLimit } from "../_lib.js";
import { createBattleState } from "../game-engine.js";

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (request.method !== "POST") return json({ message: "Gunakan POST." }, { status: 405 });

  try {
    const userId = await authUserId(request, env);
    if (!userId) return json({ message: "Belum login." }, { status: 401 });

    const limiter = await checkRateLimit(env, `battle-start:${userId}`, 10, 60);
    if (!limiter.ok) return json({ message: "Terlalu sering start battle." }, { status: 429 });

    const saveRow = await env.DB.prepare("SELECT data FROM saves WHERE user_id = ?1").bind(userId).first();
    if (!saveRow?.data) return json({ message: "Save belum ada." }, { status: 400 });

    const parsed = JSON.parse(saveRow.data);
    const player = parsed?.player;
    if (!player) return json({ message: "Data player invalid." }, { status: 400 });

    const battle = createBattleState(player);
    const now = Math.floor(Date.now() / 1000);

    await env.DB
      .prepare(
        `INSERT INTO active_battles (id, user_id, state, updated_at)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(user_id) DO UPDATE SET id=excluded.id, state=excluded.state, updated_at=excluded.updated_at`
      )
      .bind(battle.id, userId, JSON.stringify(battle), now)
      .run();

    return json({ ok: true, battle });
  } catch (e) {
    return json({ message: "Server error (battle-start): " + (e?.message || String(e)) }, { status: 500 });
  }
}
