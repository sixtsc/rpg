import { json, randToken } from "../_lib.js";

function normalizeAttachments(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [];
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
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
    if (!env.MAILBOX_ADMIN_TOKEN) {
      return json({ message: "MAILBOX_ADMIN_TOKEN belum di-set." }, { status: 500 });
    }

    const adminToken = request.headers.get("X-Admin-Token") || "";
    if (adminToken !== env.MAILBOX_ADMIN_TOKEN) {
      return json({ message: "Unauthorized." }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ message: "Invalid JSON" }, { status: 400 });
    }

    const userId = (body.userId || "").toString().trim();
    const title = (body.title || "").toString().trim();
    const message = (body.body || "").toString().trim();
    const attachments = normalizeAttachments(body.attachments);
    const expiresInRaw = Number.parseInt(body.expiresInSec, 10);
    const expiresInSec = Number.isFinite(expiresInRaw) ? Math.max(0, expiresInRaw) : null;
    const source = (body.source || "").toString().trim();

    if (!userId) return json({ message: "userId wajib diisi" }, { status: 400 });
    if (!title) return json({ message: "title wajib diisi" }, { status: 400 });
    if (!message) return json({ message: "body wajib diisi" }, { status: 400 });

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = expiresInSec ? now + expiresInSec : null;
    const id = randToken(16);
    const payload = attachments.length > 0 ? JSON.stringify(attachments) : null;

    await env.DB
      .prepare(
        "INSERT INTO mailbox_messages (id, user_id, title, body, attachments, created_at, expires_at, source) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
      )
      .bind(id, userId, title, message, payload, now, expiresAt, source || null)
      .run();

    return json({ ok: true, id });
  } catch (e) {
    return json({ message: "Server error (mailbox-send): " + (e?.message || String(e)) }, { status: 500 });
  }
}
