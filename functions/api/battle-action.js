import { json, authUserId, checkRateLimit } from "../_lib.js";
import { resolveBattleAction, runEnemyTurn } from "../game-engine.js";

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (request.method !== "POST") return json({ message: "Gunakan POST." }, { status: 405 });

  try {
    const userId = await authUserId(request, env);
    if (!userId) return json({ message: "Belum login." }, { status: 401 });

    const limiter = await checkRateLimit(env, `battle-action:${userId}`, 80, 60);
    if (!limiter.ok) return json({ message: "Rate limit battle action." }, { status: 429 });

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ message: "Invalid JSON" }, { status: 400 });
    }

    const action = (body.action || "").toString();
    const battleId = (body.battleId || "").toString();

    const row = await env.DB.prepare("SELECT id, state FROM active_battles WHERE user_id = ?1").bind(userId).first();
    if (!row?.state) return json({ message: "Battle belum dimulai." }, { status: 404 });
    if (battleId && row.id !== battleId) return json({ message: "battleId mismatch." }, { status: 409 });

    const state = JSON.parse(row.state);
    if (state.finished) return json({ ok: true, state, finished: true });

    if (state.turn === "enemy") {
      runEnemyTurn(state);
      if (state.finished) {
        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare("UPDATE active_battles SET state = ?1, updated_at = ?2 WHERE user_id = ?3")
          .bind(JSON.stringify(state), now, userId)
          .run();
        return json({ ok: true, state, finished: true });
      }
    }

    const requestedSkill = body && typeof body.skill === "object" && body.skill !== null
      ? { name: (body.skill.name || "").toString() }
      : null;

    try {
      resolveBattleAction(state, action, requestedSkill);
    } catch (err) {
      return json({ message: err.message || "Action invalid" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("UPDATE active_battles SET state = ?1, updated_at = ?2 WHERE user_id = ?3")
      .bind(JSON.stringify(state), now, userId)
      .run();

    if (state.finished) {
      await env.DB
        .prepare(
          `INSERT INTO saves (user_id, data, updated_at, version)
           VALUES (?1, ?2, ?3, 1)
           ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at, version=version+1`
        )
        .bind(userId, JSON.stringify({ player: state.player }), now)
        .run();
    }

    return json({ ok: true, state });
  } catch (e) {
    return json({ message: "Server error (battle-action): " + (e?.message || String(e)) }, { status: 500 });
  }
}
