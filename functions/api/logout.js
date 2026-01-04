import { json, getCookie, setCookie } from "../_lib.js";

export async function onRequest(ctx) {
  const { request, env } = ctx;

  // CORS preflight (safe even for same-origin)
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

  // Always return JSON for wrong methods (avoid Cloudflare HTML 405)
  if (request.method !== "POST") {
    return json({ message: "Method tidak didukung. Gunakan POST." }, { status: 405 });
  }

  const { request, env } = ctx;
  if (!env || !env.DB) return json({ message: "DB binding \"DB\" belum tersedia di environment ini (Preview/Production). Pastikan D1 binding bernama DB ditambahkan di Cloudflare Pages Settings untuk environment yang kamu pakai (Preview atau Production)." }, { status: 500 });
  const token = getCookie(request, "session");
  if (token) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  const clear = setCookie("session", "", { maxAge: 0 });
  return json({ ok: true }, { headers: { "Set-Cookie": clear } });
}
