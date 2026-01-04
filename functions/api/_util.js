// Cloudflare Pages Function utilities (D1 + sessions)
const JSON_HEADERS = { "content-type": "application/json;charset=UTF-8" };

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

export function err(message, status = 400) {
  return json({ ok: false, error: message }, status);
}

export function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  header.split(";").forEach((part) => {
    const p = part.trim();
    if (!p) return;
    const eq = p.indexOf("=");
    if (eq === -1) return;
    const k = p.slice(0, eq).trim();
    const v = p.slice(eq + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

export function b64FromU8(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}

export function u8FromB64(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

export function b64urlFromU8(u8) {
  return b64FromU8(u8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function hashPassword(password, saltB64 = null) {
  const enc = new TextEncoder();
  const salt = saltB64 ? u8FromB64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  const hashB64 = b64FromU8(new Uint8Array(bits));
  return { hashB64, saltB64: b64FromU8(salt) };
}

export function validUsername(u) {
  return typeof u === "string" && /^[a-zA-Z0-9_]{3,20}$/.test(u);
}

export function validPassword(p) {
  return typeof p === "string" && p.length >= 6 && p.length <= 72;
}

export async function getSessionUser(request, env) {
  const cookies = parseCookies(request);
  const token = cookies.session;
  if (!token) return null;

  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT s.token as token, s.user_id as userId, s.expires_at as expiresAt, u.username as username
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ?1`
  ).bind(token).first();

  if (!row) return null;

  if (row.expiresAt && row.expiresAt < now) {
    await env.DB.prepare(`DELETE FROM sessions WHERE token=?1`).bind(token).run();
    return null;
  }

  return { token: row.token, userId: row.userId, username: row.username };
}

export function sessionCookie(token, maxAgeSec) {
  // Secure + HttpOnly so JS cannot steal session
  // SameSite=Lax is ok for same-site
  return `session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function clearSessionCookie() {
  return `session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
