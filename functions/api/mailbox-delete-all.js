import { json, authUserId } from "../_lib.js";

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

  if (request.method !== "POST") {
    return json({ message: "Method tidak didukung. Gunakan POST." }, { status: 405 });
  }

  if (!env || !env.DB) {
    return json({ message: "D1 binding 'DB' tidak ditemukan di environment ini. Pastikan Pages -> Settings -> Functions -> D1 bindings sudah di-set untuk environment yang kamu pakai (Preview/Production), lalu redeploy." }, { status: 500 });
  }

  try {
    const userId = await authUserId(request, env);
    if (!userId) return json({ error: "unauthorized", message: "Belum login." }, { status: 401 });

    const now = Math.floor(Date.now() / 1000);
    const unclaimedRewards = await env.DB
      .prepare(
        `SELECT COUNT(*) AS cnt
         FROM mailbox_messages
         WHERE user_id = ?1
           AND claimed_at IS NULL
           AND (expires_at IS NULL OR expires_at > ?2)
           AND json_valid(attachments) = 1
           AND json_array_length(attachments) > 0`
      )
      .bind(userId, now)
      .first();

    const pendingRewards = Number(unclaimedRewards?.cnt || 0);
    if (pendingRewards > 0) {
      return json(
        {
          message: "Masih ada reward belum di-claim. Claim semua reward dulu sebelum hapus pesan.",
          pendingRewards,
        },
        { status: 400 }
      );
    }

    const result = await env.DB
      .prepare("DELETE FROM mailbox_messages WHERE user_id = ?1")
      .bind(userId)
      .run();

    return json({ ok: true, deletedCount: Number(result?.changes || 0) });
  } catch (e) {
    return json({ message: "Server error (mailbox-delete-all): " + (e?.message || String(e)) }, { status: 500 });
  }
}
