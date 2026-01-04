import { json } from "../_lib.js";

export async function onRequest({ request, env }) {
  // CORS preflight (safe even for same-origin)
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

  // Always return JSON (avoid Cloudflare HTML 405 pages)
  if (request.method !== "GET") {
    return json({ message: "Method tidak didukung. Gunakan GET." }, { status: 405 });
  }

  if (!env || !env.DB) {
    return json(
      { ok: false, hasDB: false, message: "D1 binding 'DB' tidak ditemukan di environment ini." },
      { status: 500 }
    );
  }

  try {
    const res = await env.DB.prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name"
    ).all();

    const tables = (res?.results || []).map((r) => r.name);
    return json({
      ok: true,
      hasDB: true,
      tables,
      hint: "Kalau tables belum ada users/sessions/saves, jalankan schema di D1 database yang ter-bind.",
    });
  } catch (e) {
    return json(
      { ok: false, hasDB: true, message: "DB query error: " + (e?.message || String(e)) },
      { status: 500 }
    );
  }
}
