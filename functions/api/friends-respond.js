import { json, authUserId, checkRateLimit } from "../_lib.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ message: "Gunakan POST." }, { status: 405 });

  try {
    const userId = await authUserId(request, env);
    if (!userId) return json({ message: "Belum login." }, { status: 401 });

    const limiter = await checkRateLimit(env, `friend-respond:${userId}`, 30, 60);
    if (!limiter.ok) return json({ message: "Terlalu banyak aksi pertemanan." }, { status: 429 });

    const body = await request.json();
    const requestId = (body.requestId || "").toString();
    const accept = Boolean(body.accept);
    const characterUid = Number(body.characterUid);

    if (!requestId) return json({ message: "requestId wajib diisi." }, { status: 400 });
    if (!Number.isInteger(characterUid) || characterUid <= 0) return json({ message: "characterUid invalid." }, { status: 400 });

    const owner = await env.DB.prepare("SELECT uid FROM characters WHERE uid = ?1 AND user_id = ?2")
      .bind(characterUid, userId)
      .first();
    if (!owner) return json({ message: "Karakter tidak dimiliki akun ini." }, { status: 403 });

    const rel = await env.DB.prepare("SELECT id, requester_uid, addressee_uid, status FROM character_friends WHERE id = ?1")
      .bind(requestId)
      .first();
    if (!rel) return json({ message: "Request tidak ditemukan." }, { status: 404 });
    if (rel.status !== "pending") return json({ ok: true, status: rel.status, noChange: true });
    if (Number(rel.addressee_uid) !== characterUid) return json({ message: "Bukan target request ini." }, { status: 403 });

    const now = Math.floor(Date.now() / 1000);
    const next = accept ? "accepted" : "rejected";

    await env.DB.prepare("UPDATE character_friends SET status = ?1, updated_at = ?2 WHERE id = ?3")
      .bind(next, now, requestId)
      .run();

    return json({ ok: true, id: requestId, status: next });
  } catch (e) {
    return json({ message: "Server error (friends-respond): " + (e?.message || String(e)) }, { status: 500 });
  }
}
