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

export async function authUserId(request, env) {
  const token = getCookie(request, "session");
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    `SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?`
  ).bind(token, now).first();
  return row?.user_id || null;
}
