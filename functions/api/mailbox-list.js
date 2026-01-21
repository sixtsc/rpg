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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (request.method !== "GET") {
    return json({ message: "Method tidak didukung. Gunakan GET." }, { status: 405 });
  }

  if (!env || !env.DB) {
    return json({ message: "D1 binding 'DB' tidak ditemukan di environment ini. Pastikan Pages -> Settings -> Functions -> D1 bindings sudah di-set untuk environment yang kamu pakai (Preview/Production), lalu redeploy." }, { status: 500 });
  }

  try {
    const userId = await authUserId(request, env);
    if (!userId) return json({ error: "unauthorized", message: "Belum login." }, { status: 401 });

    const url = new URL(request.url);
    const limitRaw = Number.parseInt(url.searchParams.get("limit") || "50", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;
    const beforeRaw = Number.parseInt(url.searchParams.get("before") || "", 10);
    const before = Number.isFinite(beforeRaw) ? beforeRaw : null;
    const only = (url.searchParams.get("only") || "").toLowerCase();
    const onlyUnclaimed = only === "unclaimed";

    let query = "SELECT id, title, body, attachments, created_at, expires_at, read_at, claimed_at, source FROM mailbox_messages WHERE user_id = ?";
    const binds = [userId];

    if (onlyUnclaimed) {
      query += " AND claimed_at IS NULL";
    }

    if (before !== null) {
      query += " AND created_at < ?";
      binds.push(before);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    binds.push(limit);

    const result = await env.DB.prepare(query).bind(...binds).all();
    const items = (result?.results || []).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      attachments: parseAttachments(row.attachments),
      created_at: row.created_at,
      expires_at: row.expires_at,
      read_at: row.read_at,
      claimed_at: row.claimed_at,
      source: row.source,
    }));

    return json({ ok: true, items });
  } catch (e) {
    return json({ message: "Server error (mailbox-list): " + (e?.message || String(e)) }, { status: 500 });
  }
}
