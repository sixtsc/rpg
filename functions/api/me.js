import { json, authUserId } from "../_lib.js";

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  if (!env || !env.DB) return json({ message: "DB binding \"DB\" belum tersedia di environment ini (Preview/Production). Pastikan D1 binding bernama DB ditambahkan di Cloudflare Pages Settings untuk environment yang kamu pakai (Preview atau Production)." }, { status: 500 });
  const userId = await authUserId(request, env);
  if (!userId) return json({ error: "unauthorized" }, { status: 401 });

  const user = await env.DB.prepare("SELECT id, username, created_at FROM users WHERE id = ?")
    .bind(userId).first();

  return json({ user });
}
