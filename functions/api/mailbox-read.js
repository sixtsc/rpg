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

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ message: "Invalid JSON" }, { status: 400 });
    }

    const id = (body.id || "").toString().trim();
    if (!id) return json({ message: "id wajib diisi" }, { status: 400 });

    const now = Math.floor(Date.now() / 1000);
    const result = await env.DB
      .prepare("UPDATE mailbox_messages SET read_at = COALESCE(read_at, ?1) WHERE id = ?2 AND user_id = ?3")
      .bind(now, id, userId)
      .run();

    if (!result || result.changes === 0) {
      return json({ message: "Message tidak ditemukan." }, { status: 404 });
    }

    return json({ ok: true });
  } catch (e) {
    return json({ message: "Server error (mailbox-read): " + (e?.message || String(e)) }, { status: 500 });
  }
}
