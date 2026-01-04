import { json, getCookie, setCookie } from "../_lib.js";

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  if (!env || !env.DB) return json({ message: "DB binding \"DB\" belum tersedia di environment ini (Preview/Production). Pastikan D1 binding bernama DB ditambahkan di Cloudflare Pages Settings untuk environment yang kamu pakai (Preview atau Production)." }, { status: 500 });
  const token = getCookie(request, "session");
  if (token) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  const clear = setCookie("session", "", { maxAge: 0 });
  return json({ ok: true }, { headers: { "Set-Cookie": clear } });
}
