import { json, authUserId } from "../_lib.js";

export async function onRequest(ctx) {
  const { request, env } = ctx;

  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  if (request.method !== "POST") {
    return json({ message: "Method tidak didukung. Gunakan POST." }, { status: 405 });
  }

  const { request, env } = ctx;
  if (!env || !env.DB) return json({ message: "DB binding \"DB\" belum tersedia di environment ini (Preview/Production). Pastikan D1 binding bernama DB ditambahkan di Cloudflare Pages Settings untuk environment yang kamu pakai (Preview atau Production)." }, { status: 500 });
  const userId = await authUserId(request, env);
  if (!userId) return json({ error: "unauthorized", message: "Belum login." }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return json({ message: "Invalid JSON" }, { status: 400 }); }

  const data = body.data ?? null;
  if (!data) return json({ message: "No data" }, { status: 400 });

  const now = Math.floor(Date.now() / 1000);
  const payload = typeof data === "string" ? data : JSON.stringify(data);

  await env.DB.prepare(
    `INSERT INTO saves (user_id, data, updated_at, version)
     VALUES (?,?,?,1)
     ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at, version=version+1`
  ).bind(userId, payload, now).run();

  return json({ ok: true });
}
