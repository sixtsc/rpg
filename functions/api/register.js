import { json, randToken, hashPasswordPBKDF2, checkRateLimit, logSecurityEvent } from "../_lib.js";

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
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const limit = await checkRateLimit(env, `register:${ip}`, 8, 60);
    if (!limit.ok) {
      return json({ message: "Terlalu banyak request register. Coba lagi nanti." }, { status: 429 });
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
    if (!password || password.length < 6) return json({ message: "Password minimal 6 karakter." }, { status: 400 });

    const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
    if (exists) return json({ message: "Username sudah dipakai." }, { status: 409 });

    const id = randToken(16);
    const pass = await hashPasswordPBKDF2(password, 100000);
    const now = Math.floor(Date.now() / 1000);

    await env.DB
      .prepare("INSERT INTO users (id, username, pass_hash, pass_salt, pass_algo, pass_iters, created_at) VALUES (?,?,?,?,?,?,?)")
      .bind(id, username, pass.hashB64, pass.saltB64, pass.algo, pass.iterations, now)
      .run();

    await logSecurityEvent(env, id, "register", `username=${username}`);
    return json({ ok: true });
  } catch (e) {
    return json({ message: "Server error (register): " + (e?.message || String(e)) }, { status: 500 });
  }
}
