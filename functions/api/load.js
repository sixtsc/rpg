import { json, authUserId } from "../_lib.js";

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
  const userId = await authUserId(request, env);
  if (!userId) return json({ error: "unauthorized", message: "Belum login." }, { status: 401 });

  const row = await env.DB.prepare("SELECT data, version, updated_at FROM saves WHERE user_id = ?").bind(userId).first();
  if (!row) return json({ ok: true, hasSave: false });

  let parsed = row.data;
  try {
    parsed = JSON.parse(row.data);
  } catch {
    // keep raw string
  }

  return json({ ok: true, hasSave: true, data: parsed, version: row.version, updated_at: row.updated_at });
  } catch (e) {
    return json({ message: "Server error (cloud-load): " + (e?.message || String(e)) }, { status: 500 });
  }
}
