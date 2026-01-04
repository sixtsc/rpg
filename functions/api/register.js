import { json, randToken, sha256Hex } from "../_lib.js";

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

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid JSON" }, { status: 400 });
  }

  const username = (body.username || "").toString().trim().toLowerCase();
  const password = (body.password || "").toString();

  if (!username || username.length < 3) return json({ message: "Username minimal 3 karakter." }, { status: 400 });
  if (!password || password.length < 4) return json({ message: "Password minimal 4 karakter." }, { status: 400 });

  const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (exists) return json({ message: "Username sudah dipakai." }, { status: 409 });

  const id = randToken(16);
  const salt = randToken(16);
  const pass_hash = await sha256Hex(salt + ":" + password);
  const now = Math.floor(Date.now() / 1000);

  await env.DB
    .prepare("INSERT INTO users (id, username, pass_hash, pass_salt, created_at) VALUES (?,?,?,?,?)")
    .bind(id, username, pass_hash, salt, now)
    .run();

  return json({ ok: true });
}
