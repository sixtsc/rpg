import { clamp, MAX_CHAR_SLOTS } from "./engine.js";
import { normalizePlayer } from "./state.js";

const SAVE_KEY = "text_rpg_save_modular_v1";

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error("[SAVE] localStorage.setItem gagal:", err);
    return false;
  }
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.error("[LOAD] localStorage.getItem gagal:", err);
    return null;
  }
}

export function emptyProfilePayload() {
  return {
    v: 2,
    t: Date.now(),
    activeSlot: 0,
    slots: Array.from({ length: MAX_CHAR_SLOTS }, () => null),
  };
}

export function normalizeProfilePayload(payload) {
  if (!payload) return emptyProfilePayload();

  if (Array.isArray(payload.slots)) {
    const out = emptyProfilePayload();
    out.t = payload.t || Date.now();
    out.activeSlot = clamp(
      (typeof payload.activeSlot === "number" ? payload.activeSlot : 0),
      0,
      MAX_CHAR_SLOTS - 1
    );

    for (let i = 0; i < MAX_CHAR_SLOTS; i++) {
      const slot = payload.slots[i];
      out.slots[i] = slot ? normalizePlayer(slot) : null;
    }
    return out;
  }

  if (payload.player) {
    const out = emptyProfilePayload();
    out.t = payload.t || Date.now();
    out.activeSlot = 0;
    out.slots[0] = normalizePlayer(payload.player);
    return out;
  }

  return emptyProfilePayload();
}

function getProfilePayloadFromState(state) {
  const out = emptyProfilePayload();
  out.activeSlot = clamp(
    (typeof state.activeSlot === "number" ? state.activeSlot : 0),
    0,
    MAX_CHAR_SLOTS - 1
  );
  out.slots = Array.from({ length: MAX_CHAR_SLOTS }, (_, i) => {
    const slot = state.slots && state.slots[i];
    return slot ? normalizePlayer(slot) : null;
  });

  if (state.player) out.slots[out.activeSlot] = normalizePlayer(state.player);

  out.t = Date.now();
  return out;
}

export function autosave(state) {
  const payload = getProfilePayloadFromState(state);
  return safeSet(SAVE_KEY, JSON.stringify(payload));
}

export function save(state) {
  return autosave(state) === true;
}

export function load() {
  const raw = safeGet(SAVE_KEY);
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw);
    return payload || null;
  } catch {
    return null;
  }
}

export async function apiJson(path, opts = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

export async function cloudMe() {
  const { res, data } = await apiJson("/api/me");
  if (!res.ok) return null;
  return data?.user || null;
}

export async function cloudSavePayload(payload) {
  const { res, data } = await apiJson("/api/save", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  return { ok: res.ok, data };
}

export async function cloudLoadPayload() {
  const { res, data } = await apiJson("/api/load");
  if (res.status === 401) return { ok: false, unauth: true, data };
  return { ok: res.ok, data };
}

export async function cloudLogout() {
  try {
    await apiJson("/api/logout", { method: "POST" });
  } catch (e) {
    console.error("[CLOUD LOGOUT] error", e);
  }
  cloudUserCache = null;
  return true;
}

let cloudUserCache = null;
export async function ensureCloudUser() {
  if (cloudUserCache) return cloudUserCache;
  cloudUserCache = await cloudMe();
  return cloudUserCache;
}

export async function cloudTrySaveCurrentProfile(state) {
  const me = await ensureCloudUser();
  if (!me) return { ok: false, skipped: true, reason: "unauth" };

  const payload = getProfilePayloadFromState(state);
  const r = await cloudSavePayload(payload);
  return { ok: !!r.ok, skipped: false, data: r.data };
}
