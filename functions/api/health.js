const json = (obj, status=200) => new Response(JSON.stringify(obj), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});

export async function onRequest(ctx) {
  const { request } = ctx;

  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  if (request.method !== "GET") return json({ message: "Method tidak didukung. Gunakan GET." }, 405);
  return onRequestGet(ctx);
}

export async function onRequestGet({ env }) {
  // json helper moved to module scope
// const json ...
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });

  try {
    if (!env.DB) {
      return json({ ok:false, hasDB:false, message:"D1 binding 'DB' tidak ditemukan di environment ini." }, 500);
    }

    // List tables to confirm schema
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all();

    return json({
      ok: true,
      hasDB: true,
      tables: (tables?.results || []).map(r => r.name),
      hint: "Kalau tables belum ada users/sessions/saves, jalankan schema di D1 database yang ter-bind."
    });
  } catch (err) {
    return json({ ok:false, hasDB: !!env.DB, message: String(err?.message || err) }, 500);
  }
}
