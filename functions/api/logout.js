import { json, getCookie, setCookie } from "../_lib.js";

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

  const token = getCookie(request, "session");
  if (token) {
    try {
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    } catch {
      // ignore
    }
  }

  // clear cookie
  const cleared = setCookie("session", "", { maxAge: 0 });
  return json({ ok: true }, { headers: { "Set-Cookie": cleared } });
}
