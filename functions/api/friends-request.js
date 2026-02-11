import { json, authUserId, checkRateLimit } from "../_lib.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ message: "Gunakan POST." }, { status: 405 });

  try {
    const userId = await authUserId(request, env);
    if (!userId) return json({ message: "Belum login." }, { status: 401 });

    const limiter = await checkRateLimit(env, `friend-request:${userId}`, 20, 60);
    if (!limiter.ok) return json({ message: "Terlalu banyak request pertemanan." }, { status: 429 });

    const body = await request.json();
    const requesterUid = Number(body.requesterUid);
    const targetUid = Number(body.targetUid);

    if (!Number.isInteger(requesterUid) || !Number.isInteger(targetUid)) {
      return json({ message: "requesterUid/targetUid wajib integer." }, { status: 400 });
    }
    if (requesterUid <= 0 || targetUid <= 0) return json({ message: "UID harus > 0." }, { status: 400 });
    if (requesterUid === targetUid) return json({ message: "Tidak bisa add diri sendiri." }, { status: 400 });

    const requester = await env.DB.prepare("SELECT uid FROM characters WHERE uid = ?1 AND user_id = ?2")
      .bind(requesterUid, userId)
      .first();
    if (!requester) return json({ message: "Karakter requester tidak valid." }, { status: 403 });

    const target = await env.DB.prepare("SELECT uid FROM characters WHERE uid = ?1")
      .bind(targetUid)
      .first();
    if (!target) return json({ message: "UID target tidak ditemukan." }, { status: 404 });

    const low = Math.min(requesterUid, targetUid);
    const high = Math.max(requesterUid, targetUid);
    const now = Math.floor(Date.now() / 1000);

    const existing = await env.DB.prepare("SELECT id, status FROM character_friends WHERE uid_low = ?1 AND uid_high = ?2")
      .bind(low, high)
      .first();

    if (existing) {
      if (existing.status === "accepted") return json({ ok: true, alreadyFriends: true, id: existing.id });
      if (existing.status === "pending") return json({ ok: true, alreadyPending: true, id: existing.id });
      await env.DB.prepare("UPDATE character_friends SET requester_uid = ?1, addressee_uid = ?2, status = 'pending', updated_at = ?3 WHERE id = ?4")
        .bind(requesterUid, targetUid, now, existing.id)
        .run();
      return json({ ok: true, id: existing.id, status: "pending" });
    }

    const id = crypto.randomUUID();
    await env.DB
      .prepare(
        "INSERT INTO character_friends (id, requester_uid, addressee_uid, uid_low, uid_high, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6, ?7)"
      )
      .bind(id, requesterUid, targetUid, low, high, now, now)
      .run();

    return json({ ok: true, id, status: "pending" });
  } catch (e) {
    return json({ message: "Server error (friends-request): " + (e?.message || String(e)) }, { status: 500 });
  }
}
