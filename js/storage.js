import { ITEMS, SKILLS } from "./data.js";

const SAVE_KEY = "text_rpg_save_modular_v1";

function migrateInventory(inv){
  if (!inv || typeof inv !== "object") return inv;
  const nameToId = Object.values(ITEMS).reduce((acc, item) => {
    if (item?.name && item?.id) acc[item.name] = item.id;
    return acc;
  }, {});
  const slugToId = Object.entries(ITEMS).reduce((acc, [slug, item]) => {
    if (item?.id) acc[slug] = item.id;
    return acc;
  }, {});
  const idToItem = Object.values(ITEMS).reduce((acc, item) => {
    if (item?.id !== undefined) acc[String(item.id)] = item;
    return acc;
  }, {});
  const migrated = {};
  Object.keys(inv).forEach((key) => {
    const entry = inv[key];
    const targetId = slugToId[key] || nameToId[key] || key;
    const targetKey = String(targetId);
    if (!migrated[targetKey]) {
      migrated[targetKey] = { ...entry };
      if (!migrated[targetKey].id && idToItem[targetKey]?.id !== undefined) {
        migrated[targetKey].id = idToItem[targetKey].id;
      }
      if (!migrated[targetKey].name && idToItem[targetKey]?.name) {
        migrated[targetKey].name = idToItem[targetKey].name;
      }
      if (!migrated[targetKey].desc && idToItem[targetKey]?.desc) {
        migrated[targetKey].desc = idToItem[targetKey].desc;
      }
      if (!migrated[targetKey].kind && idToItem[targetKey]?.kind) {
        migrated[targetKey].kind = idToItem[targetKey].kind;
      }
      if (migrated[targetKey].amount === undefined && idToItem[targetKey]?.amount !== undefined) {
        migrated[targetKey].amount = idToItem[targetKey].amount;
      }
    } else if (typeof entry?.qty === "number") {
      migrated[targetKey].qty = (migrated[targetKey].qty || 0) + entry.qty;
    }
  });
  return migrated;
}

function migrateSkills(skills){
  if (!Array.isArray(skills)) return skills;
  const nameToId = Object.values(SKILLS).reduce((acc, skill) => {
    if (skill?.name && skill?.id) acc[skill.name] = skill.id;
    return acc;
  }, {});
  const slugToId = Object.entries(SKILLS).reduce((acc, [slug, skill]) => {
    if (skill?.id) acc[slug] = skill.id;
    return acc;
  }, {});
  return skills.map((skill) => {
    if (!skill || typeof skill !== "object") return skill;
    if (!skill.id) {
      if (skill.name && nameToId[skill.name]) {
        return { ...skill, id: nameToId[skill.name] };
      }
      return skill;
    }
    if (typeof skill.id === "string") {
      const nextId = slugToId[skill.id] || nameToId[skill.name];
      if (nextId) return { ...skill, id: nextId };
    }
    return skill;
  });
}

// Beberapa browser / mode (mis. Safari Private, embedded webview tertentu,
// atau ketika storage diblokir) bisa melempar error saat akses localStorage.
// Kalau error ini tidak ditangani, setelah klik Save script bisa error dan
// terasa seperti tombol lain "tidak bisa disentuh".
function safeSet(key, value){
  try{
    localStorage.setItem(key, value);
    return true;
  }catch(err){
    console.error("[SAVE] localStorage.setItem gagal:", err);
    return false;
  }
}

function safeGet(key){
  try{
    return localStorage.getItem(key);
  }catch(err){
    console.error("[LOAD] localStorage.getItem gagal:", err);
    return null;
  }
}

export function autosave(state){
  const payload = { v:1, t:Date.now(), player: state.player };
  return safeSet(SAVE_KEY, JSON.stringify(payload));
}

export function save(state){
  return autosave(state) === true;
}

export function load(){
  const raw = safeGet(SAVE_KEY);
  if(!raw) return null;
  try{
    const payload = JSON.parse(raw);
    if (payload?.player) {
      payload.player.inv = migrateInventory(payload.player.inv);
      payload.player.skills = migrateSkills(payload.player.skills);
    }
    return payload?.player ? payload : null;
  }catch{
    return null;
  }
}
