import { json, authUserId } from "../_lib.js";

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  if (!env || !env.DB) return json({ message: "DB binding \"DB\" belum tersedia di environment ini (Preview/Production). Pastikan D1 binding bernama DB ditambahkan di Cloudflare Pages Settings untuk environment yang kamu pakai (Preview atau Production)." }, { status: 500 });
  const userId = await authUserId(request, env);
  if (!userId) return json({ error: "unauthorized", message: "Belum login." }, { status: 401 });

  const row = await env.DB.prepare(
    "SELECT data, updated_at, version FROM saves WHERE user_id = ?"
  ).bind(userId).first();

  if (!row) return json({ data: null });

  return json({ data: row.data, updated_at: row.updated_at, version: row.version });
}
