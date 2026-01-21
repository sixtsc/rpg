import { json, authUserId, getCookie } from "../_lib.js";

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (request.method !== "GET") {
    return json({ message: "Method tidak didukung. Gunakan GET." }, { status: 405 });
  }

  if (!env || !env.DB) {
    return json({ message: "D1 binding 'DB' tidak ditemukan di environment ini. Pastikan Pages -> Settings -> Functions -> D1 bindings sudah di-set untuk environment yang kamu pakai (Preview/Production), lalu redeploy." }, { status: 500 });
  }

  try {
    const session = getCookie(request, "session");
    const userId = await authUserId(request, env);
    return json({ ok: true, session: session || null, userId: userId || null });
  } catch (e) {
    return json({ message: "Server error (debug-cookie): " + (e?.message || String(e)) }, { status: 500 });
  }
}
