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
    const result = await env.DB
      .prepare(
        `UPDATE mailbox_messages
         SET claimed_at = ?1
         WHERE user_id = ?2
           AND claimed_at IS NULL
           AND (expires_at IS NULL OR expires_at > ?1)
           AND json_valid(attachments) = 1
           AND json_array_length(attachments) > 0`
      )
      .bind(now, userId)
      .run();

    return json({ ok: true, claimedCount: Number(result?.changes || 0) });
  } catch (e) {
    return json({ message: "Server error (mailbox-claim-all): " + (e?.message || String(e)) }, { status: 500 });
  }
}
