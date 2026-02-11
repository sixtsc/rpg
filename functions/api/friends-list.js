import { json, authUserId } from "../_lib.js";

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return json({ message: "Gunakan GET." }, { status: 405 });

  try {
    const userId = await authUserId(request, env);
    if (!userId) return json({ message: "Belum login." }, { status: 401 });

    const url = new URL(request.url);
    const characterUid = Number(url.searchParams.get("characterUid"));
    if (!Number.isInteger(characterUid) || characterUid <= 0) {
      return json({ message: "characterUid invalid." }, { status: 400 });
    }

    const owner = await env.DB.prepare("SELECT uid FROM characters WHERE uid = ?1 AND user_id = ?2")
      .bind(characterUid, userId)
      .first();
    if (!owner) return json({ message: "Karakter tidak dimiliki akun ini." }, { status: 403 });

    const result = await env.DB
      .prepare(
        `SELECT f.id, f.requester_uid, f.addressee_uid, f.status, f.created_at, f.updated_at,
                c.uid as other_uid, c.name as other_name
         FROM character_friends f
         JOIN characters c ON c.uid = CASE WHEN f.requester_uid = ?1 THEN f.addressee_uid ELSE f.requester_uid END
         WHERE f.requester_uid = ?1 OR f.addressee_uid = ?1
         ORDER BY f.updated_at DESC`
      )
      .bind(characterUid)
      .all();

    const items = (result?.results || []).map((row) => ({
      id: row.id,
      status: row.status,
      requesterUid: row.requester_uid,
      addresseeUid: row.addressee_uid,
      otherUid: row.other_uid,
      otherName: row.other_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return json({ ok: true, items });
  } catch (e) {
    return json({ message: "Server error (friends-list): " + (e?.message || String(e)) }, { status: 500 });
  }
}
