import { json, authUserId, checkRateLimit, logSecurityEvent } from "../_lib.js";
import { validateSavePayload, validateProgression } from "../game-save.js";
import { normalizeProfile, syncCharacterUidsFromProfile } from "../character-service.js";

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
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

  try {
    const userId = await authUserId(request, env);
    if (!userId) return json({ error: "unauthorized", message: "Belum login." }, { status: 401 });

    const limiter = await checkRateLimit(env, `save:${userId}`, 30, 60);
    if (!limiter.ok) return json({ message: "Terlalu sering save. Tunggu sebentar." }, { status: 429 });

    const idemKey = (request.headers.get("Idempotency-Key") || "").trim();
    if (idemKey) {
      const exists = await env.DB.prepare("SELECT id FROM idempotency_keys WHERE user_id = ?1 AND idem_key = ?2").bind(userId, idemKey).first();
      if (exists) return json({ ok: true, duplicate: true });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ message: "Invalid JSON" }, { status: 400 });
    }

    let data = body.data ?? null;
    if (data == null) return json({ message: "No data" }, { status: 400 });

    const validated = validateSavePayload(data);
    if (!validated.ok) {
      await logSecurityEvent(env, userId, "save_rejected", validated.message);
      return json({ message: validated.message }, { status: 400 });
    }

    const current = await env.DB.prepare("SELECT data FROM saves WHERE user_id = ?1").bind(userId).first();
    if (current?.data) {
      let prevParsed = null;
      try {
        prevParsed = JSON.parse(current.data);
      } catch {
        prevParsed = null;
      }
      const progression = validateProgression(prevParsed, data);
      if (!progression.ok) {
        await logSecurityEvent(env, userId, "save_rejected", progression.message);
        return json({ message: progression.message }, { status: 400 });
      }
    }

    const profile = normalizeProfile(data);
    if (profile) {
      data = await syncCharacterUidsFromProfile(env, userId, profile);
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify(data);

    await env.DB
      .prepare(
        `INSERT INTO saves (user_id, data, updated_at, version)
         VALUES (?,?,?,1)
         ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at, version=version+1`
      )
      .bind(userId, payload, now)
      .run();

    if (idemKey) {
      await env.DB.prepare("INSERT INTO idempotency_keys (id, user_id, idem_key, created_at) VALUES (?1, ?2, ?3, ?4)")
        .bind(crypto.randomUUID(), userId, idemKey, now)
        .run();
    }

    return json({ ok: true, data });
  } catch (e) {
    return json({ message: "Server error (cloud-save): " + (e?.message || String(e)) }, { status: 500 });
  }
}
