import { json, randToken, sha256Hex, setCookie } from "../_lib.js";

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  if (!env || !env.DB) return json({ message: "DB binding \"DB\" belum tersedia di environment ini (Preview/Production). Pastikan D1 binding bernama DB ditambahkan di Cloudflare Pages Settings untuk environment yang kamu pakai (Preview atau Production)." }, { status: 500 });
  let body;
  try { body = await request.json(); } catch { return json({ message: "Invalid JSON" }, { status: 400 }); }

  const username = (body.username || "").toString().trim().toLowerCase();
  const password = (body.password || "").toString();

  const user = await env.DB.prepare("SELECT id, pass_hash, pass_salt FROM users WHERE username = ?")
    .bind(username).first();

  if (!user) return json({ message: "Username / password salah." }, { status: 401 });

  const check = await sha256Hex(user.pass_salt + ":" + password);
  if (check !== user.pass_hash) return json({ message: "Username / password salah." }, { status: 401 });

  const token = randToken(24);
  const now = Math.floor(Date.now() / 1000);
  const expires = now + 60 * 60 * 24 * 30; // 30 days

  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?,?,?,?)"
  ).bind(token, user.id, expires, now).run();

  const cookie = setCookie("session", token, { maxAge: 60 * 60 * 24 * 30 });

  return json({ ok: true }, { headers: { "Set-Cookie": cookie } });
}
