import { json, authUserId } from "../_lib.js";

function parseAttachments(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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

    const row = await env.DB
      .prepare(
        "SELECT id, attachments, expires_at, claimed_at FROM mailbox_messages WHERE id = ?1 AND user_id = ?2"
      )
      .bind(id, userId)
      .first();

    if (!row) {
      return json({ message: "Message tidak ditemukan." }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (row.expires_at && row.expires_at <= now) {
      return json({ message: "Message sudah expired." }, { status: 400 });
    }

    if (row.claimed_at) {
      return json({ ok: true, claimed: true, alreadyClaimed: true });
    }

    // NOTE: Integrate inventory grant here before marking claimed.
    await env.DB
      .prepare("UPDATE mailbox_messages SET claimed_at = ?1 WHERE id = ?2 AND user_id = ?3 AND claimed_at IS NULL")
      .bind(now, id, userId)
      .run();

    return json({ ok: true, claimed: true, attachments: parseAttachments(row.attachments) });
  } catch (e) {
    return json({ message: "Server error (mailbox-claim): " + (e?.message || String(e)) }, { status: 500 });
  }
}
