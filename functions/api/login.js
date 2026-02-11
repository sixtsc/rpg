import { json, randToken, sha256Hex, setCookie, verifyPBKDF2, hashPasswordPBKDF2, checkRateLimit, logSecurityEvent } from "../_lib.js";

async function ensureUsersPasswordColumns(env) {
  try {
    await env.DB.prepare("ALTER TABLE users ADD COLUMN pass_algo TEXT NOT NULL DEFAULT 'legacy-sha256'").run();
  } catch (err) {
    if (!String(err?.message || "").toLowerCase().includes("duplicate column name")) {
      throw err;
    }
  }

  try {
    await env.DB.prepare("ALTER TABLE users ADD COLUMN pass_iters INTEGER").run();
  } catch (err) {
    if (!String(err?.message || "").toLowerCase().includes("duplicate column name")) {
      throw err;
    }
  }
}

async function loadUserByUsername(env, username) {
  try {
    return await env.DB
      .prepare("SELECT id, pass_hash, pass_salt, pass_algo, pass_iters FROM users WHERE username = ?")
      .bind(username)
      .first();
  } catch (err) {
    const message = String(err?.message || "").toLowerCase();
    if (!message.includes("no such column")) {
      throw err;
    }

    await ensureUsersPasswordColumns(env);
    return env.DB
      .prepare("SELECT id, pass_hash, pass_salt, COALESCE(pass_algo, 'legacy-sha256') AS pass_algo, pass_iters FROM users WHERE username = ?")
      .bind(username)
      .first();
  }
}

async function verifyPassword(user, password) {
  if (user.pass_algo === "pbkdf2-sha256") {
    return verifyPBKDF2(password, user.pass_salt, user.pass_hash, Number(user.pass_iters || 180000));
  }
  const legacy = await sha256Hex(user.pass_salt + ":" + password);
  return legacy === user.pass_hash;
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
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const limit = await checkRateLimit(env, `login:${ip}`, 20, 60);
    if (!limit.ok) {
      return json({ message: "Terlalu banyak percobaan login. Coba lagi nanti." }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ message: "Invalid JSON" }, { status: 400 });
    }

    const username = (body.username || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();

    const user = await loadUserByUsername(env, username);

    if (!user) {
      await logSecurityEvent(env, null, "login_failed", `username=${username}`);
      return json({ message: "Username / password salah." }, { status: 401 });
    }

    const verified = await verifyPassword(user, password);
    if (!verified) {
      await logSecurityEvent(env, user.id, "login_failed", `username=${username}`);
      return json({ message: "Username / password salah." }, { status: 401 });
    }

    if (user.pass_algo !== "pbkdf2-sha256") {
      const upgraded = await hashPasswordPBKDF2(password, 180000);
      await env.DB
        .prepare("UPDATE users SET pass_hash = ?1, pass_salt = ?2, pass_algo = ?3, pass_iters = ?4 WHERE id = ?5")
        .bind(upgraded.hashB64, upgraded.saltB64, upgraded.algo, upgraded.iterations, user.id)
        .run();
    }

    const token = randToken(24);
    const now = Math.floor(Date.now() / 1000);
    const expires = now + 60 * 60 * 24 * 30;

    await env.DB
      .prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?,?,?,?)")
      .bind(token, user.id, expires, now)
      .run();

    const cookie = setCookie("session", token, { maxAge: 60 * 60 * 24 * 30 });
    await logSecurityEvent(env, user.id, "login_success", `username=${username}`);

    return json({ ok: true }, { headers: { "Set-Cookie": cookie } });
  } catch (e) {
    return json({ message: "Server error (login): " + (e?.message || String(e)) }, { status: 500 });
  }
}
