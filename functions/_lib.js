export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json; charset=utf-8", ...(init.headers || {}) },
    ...init,
  });
}

export function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const parts = cookie.split(";").map(s => s.trim());
  for (const p of parts) {
    if (!p) continue;
    const [k, ...rest] = p.split("=");
    if (k === name) return decodeURIComponent(rest.join("=") || "");
  }
  return null;
}

export function setCookie(name, value, opts = {}) {
  const { maxAge, path = "/", httpOnly = true, sameSite = "Lax", secure = true } = opts;
  const segs = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];
  if (httpOnly) segs.push("HttpOnly");
  if (secure) segs.push("Secure");
  if (typeof maxAge === "number") segs.push(`Max-Age=${maxAge}`);
  return segs.join("; ");
}

export function randToken(bytes = 24) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(16).padStart(2,"0")).join("");
}

export async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map(b => b.toString(16).padStart(2,"0")).join("");
}

function b64FromU8(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i += 1) s += String.fromCharCode(u8[i]);
  return btoa(s);
}

function u8FromB64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export async function hashPasswordPBKDF2(password, iterations = 180000) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return {
    algo: "pbkdf2-sha256",
    iterations,
    saltB64: b64FromU8(salt),
    hashB64: b64FromU8(new Uint8Array(bits)),
  };
}

export async function verifyPBKDF2(password, saltB64, expectedHashB64, iterations = 180000) {
  const enc = new TextEncoder();
  const salt = u8FromB64(saltB64);
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  const actual = b64FromU8(new Uint8Array(bits));
  return actual === expectedHashB64;
}

export async function authUserId(request, env) {
  const token = getCookie(request, "session");
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    `SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?`
  ).bind(token, now).first();
  return row?.user_id || null;
}

export async function checkRateLimit(env, scopeKey, maxHits, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSec;

  await env.DB.prepare("DELETE FROM api_rate_limits WHERE scope_key = ?1 AND hit_at < ?2")
    .bind(scopeKey, windowStart)
    .run();

  const row = await env.DB
    .prepare("SELECT COUNT(*) as cnt FROM api_rate_limits WHERE scope_key = ?1 AND hit_at >= ?2")
    .bind(scopeKey, windowStart)
    .first();

  const count = Number(row?.cnt || 0);
  if (count >= maxHits) return { ok: false, retryAfter: windowSec };

  await env.DB.prepare("INSERT INTO api_rate_limits (scope_key, hit_at) VALUES (?1, ?2)")
    .bind(scopeKey, now)
    .run();

  return { ok: true };
}

export async function logSecurityEvent(env, userId, eventType, detail = "") {
  const now = Math.floor(Date.now() / 1000);
  await env.DB
    .prepare("INSERT INTO security_events (id, user_id, event_type, detail, created_at) VALUES (?1, ?2, ?3, ?4, ?5)")
    .bind(crypto.randomUUID(), userId || null, eventType, detail, now)
    .run();
}
