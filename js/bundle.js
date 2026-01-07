(function(){
'use strict';
window.__BUNDLE_LOADED__=true;
try{var _el=document.getElementById('menuSub'); if(_el && _el.textContent && _el.textContent.indexOf('JS')===0){ _el.textContent='Pilih opsi:'; }}catch(e){}

/* ===== data.js ===== */
const SKILLS = {
  fireball: { name:"Fireball", mpCost:6, power:10, cooldown:3, desc:"Serangan api (damage tinggi)." }
};
const ITEMS = {
  potion: { name:"Potion", kind:"heal_hp", amount:25, desc:"Memulihkan 25 HP" },
  ether:  { name:"Ether",  kind:"heal_mp", amount:10, desc:"Memulihkan 10 MP" },
  woodenSword: { name:"Wooden Sword", kind:"gear", slot:"hand", desc:"Senjata kayu sederhana.", atk:2 },
  clothHat: { name:"Cloth Hat", kind:"gear", slot:"head", desc:"Topi kain lusuh.", def:1 },
  leatherArmor: { name:"Leather Armor", kind:"gear", slot:"armor", desc:"Armor kulit ringan.", def:2 },
  leatherPants: { name:"Leather Pants", kind:"gear", slot:"pant", desc:"Celana kulit sederhana.", def:1 },
  oldBoots: { name:"Old Boots", kind:"gear", slot:"shoes", desc:"Sepatu tua tapi nyaman.", spd:1 }
};
const ENEMY_NAMES = ["Slime","Goblin","Bandit","Wolf","Skeleton"];
const SHOP_GOODS = [
  { name:"Potion", price:12, ref: ITEMS.potion },
  { name:"Ether", price:18, ref: ITEMS.ether },
  { name:"Wooden Sword", price:30, ref: ITEMS.woodenSword },
  { name:"Cloth Hat", price:20, ref: ITEMS.clothHat },
  { name:"Leather Armor", price:40, ref: ITEMS.leatherArmor },
  { name:"Leather Pants", price:28, ref: ITEMS.leatherPants },
  { name:"Old Boots", price:22, ref: ITEMS.oldBoots },
];
const STAGES = [
  { id:"s1", name:"Stage 1", range:[1,2] },
  { id:"s2", name:"Stage 2", range:[2,3] },
  { id:"s3", name:"Stage 3", range:[3,4] },
  { id:"s4", name:"Stage 4", range:[4,5] },
  { id:"s5", name:"Stage 5", range:[5,6] },
  { id:"s6", name:"Stage 6", range:[6,7] },
  { id:"s7", name:"Stage 7", range:[7,8] },
  { id:"s8", name:"Stage 8", range:[8,9] },
  { id:"s9", name:"Stage 9", range:[9,10] },
  { id:"s10", name:"Stage 10", range:[10,10] },
];


/* ===== engine.js ===== */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const randFloat = (a,b) => (Math.random()*(b-a))+a;
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
const MAX_CHAR_SLOTS = 6;
const STAT_POINTS_PER_LEVEL = 1;
const MAX_LEVEL = 10;
function genEnemy(plv){
  const lvl = clamp(plv + pick([-1,0,0,1]), 1, MAX_LEVEL);
  const name = pick(ENEMY_NAMES);
  const enemy = {
    name,
    level:lvl,
    maxHp:25 + lvl*8, maxMp:10 + lvl*3,
    hp:25 + lvl*8, mp:10 + lvl*3,
    atk:6 + lvl*2, def:2 + lvl, spd:4 + lvl,
    str: Math.max(0, lvl - 1),
    dex: Math.max(0, Math.floor(lvl / 2)),
    int: Math.max(0, Math.floor(lvl / 2)),
    vit: Math.max(0, lvl),
    critChance: clamp(5 + Math.floor(lvl/3), 5, 35),
    critDamage: 0,
    acc: Math.max(0, Math.floor(lvl / 6)),
    foc: 0,
    combustionChance: 0,
    evasion: clamp(2 + Math.floor(lvl / 8), 2, 10),
    baseBlockRate: 0,
    baseEscapeChance: clamp(2 + Math.floor(lvl / 8), 2, 10),
    blockRate: 0,
    escapeChance: 0,
    manaRegen: 0,
    statuses: [],
    xpReward:18 + lvl*6, goldReward:8 + lvl*4
  };
  applyDerivedStats(enemy);
  enemy.blockRate = 0;
  return enemy;
}
function calcDamage(attAtk, defDef, basePower, defending){
  const variance = randInt(-2,3);
  let raw = (attAtk + basePower) - defDef + variance;
  let dmg = clamp(raw, 1, 9999);
  if(defending) dmg = Math.max(1, Math.floor(dmg/2));
  return dmg;
}

function resolveAttack(att, def, basePower, opts = {}) {
  // opts: { dodgeBonus: number }
  const dodgeBonus = opts.dodgeBonus || 0;

  const evasion = clamp((def.evasion || 0) + dodgeBonus, 0, 95);
  const rollEv = randInt(1, 100);
  if (rollEv <= evasion) {
    return { missed: true, crit: false, combustion: false, dmg: 0, evasion, rollEv, rollCrit: null, rollComb: null };
  }

  let dmg = calcDamage(att.atk, def.def, basePower, false);

  const critChance = clamp(att.critChance || 0, 0, 100);
  const rollCrit = randInt(1, 100);
  let crit = false;
  if (rollCrit <= critChance) {
    // Critical damage starts from 0% bonus.
    // Base crit multiplier: 1.8x - 2.0x, then multiplied by (1 + critDamage%).
    const baseMult = randFloat(1.8, 2.0);
    const bonus = Math.max(0, (att.critDamage || 0)) / 100;
    dmg = Math.max(1, Math.round(dmg * baseMult * (1 + bonus)));
    crit = true;
  }

  const combustionChance = clamp(att.combustionChance || 0, 0, 100);
  const rollComb = randInt(1, 100);
  let combustion = false;
  if (rollComb <= combustionChance) {
    const combMult = randFloat(2.0, 2.5);
    dmg = Math.max(1, Math.round(dmg * combMult));
    combustion = true;
  }

  const blockPct = clamp(def.blockRate || 0, 0, 90);
  let blocked = 0;
  let reflected = 0;
  if (blockPct > 0) {
    blocked = Math.round(dmg * (blockPct / 100));
    if (blocked > 0) {
      dmg = Math.max(0, dmg - blocked);
      reflected = blocked;
    }
  }

  return { missed: false, crit, combustion, dmg, evasion, rollEv, rollCrit, rollComb, blocked, reflected };
}
function escapeChance(p,e){
  return clamp(50 + (p.spd - e.spd)*8, 10, 90);
}

function dodgeChance(p,e){
  // Base dodge chance based on SPD difference
  return clamp(10 + (p.spd - e.spd) * 6, 5, 45);
}


/* ===== state.js ===== */
function newPlayer(){
  return {
    name:"Hero",
    gender:"male",
    level:1,

    // Base stats (for future scaling)
    str:0, dex:0, int:0, vit:0, foc:0,
    statPoints:1,
    _spBaseGranted:true,
    baseBlockRate:0,
    baseEscapeChance:0,

    // Derived / combat stats (currently flat)
    maxHp:60, maxMp:25,
    hp:60, mp:25,
    atk:10, def:4, spd:7,
    acc:0,
    critChance:5, critDamage:0, combustionChance:0, evasion:5,
    manaRegen:5,
    blockRate:0,
    escapeChance:0,
    statuses: [],
    equipment: { hand:null, head:null, pant:null, armor:null, shoes:null },

    deprecatedSkillCooldown:0,
    xp:0, xpToLevel:50,
    gold:0,
    skills:[{ ...SKILLS.fireball, cdLeft:0 }],
    inv: { "Potion": { ...ITEMS.potion, qty:2 }, "Ether": { ...ITEMS.ether, qty:1 } }
  };
}


function normalizePlayer(p){
  if (!p) return p;

  // Base stats
  if (typeof p.gender !== "string") p.gender = "male";
  if (typeof p.str !== "number") p.str = 0;
  if (typeof p.dex !== "number") p.dex = 0;
  if (typeof p.int !== "number") p.int = 0;
  if (typeof p.vit !== "number") p.vit = 0;
  if (typeof p.foc !== "number") {
    // migrate from older saves using `luk`
    if (typeof p.luk === "number") p.foc = p.luk;
    else p.foc = 0;
  }
  if (typeof p.statPoints !== "number") p.statPoints = 0;

  // Grant 1 stat point at level 1 (migration-safe)
  if (!p._spBaseGranted) {
    p.statPoints += 1;
    p._spBaseGranted = true;
  }

  // Derived / combat stats
  if (typeof p.acc !== "number") p.acc = 0;
  if (typeof p.combustionChance !== "number") p.combustionChance = 0;

  if (typeof p.critDamage !== "number") {
    p.critDamage = 0; // critical damage bonus % (starts at 0)
  } else if (p.critDamage >= 100) {
    // Migration from old system (e.g., 150% meaning +50%) → store bonus only.
    p.critDamage = Math.max(0, p.critDamage - 100);
  }
  if (typeof p.critChance !== "number") p.critChance = 0;
  if (typeof p.evasion !== "number") p.evasion = 0;
  if (typeof p.baseBlockRate !== "number") p.baseBlockRate = 0;
  if (typeof p.baseEscapeChance !== "number") p.baseEscapeChance = 0;
  if (typeof p.manaRegen !== "number") p.manaRegen = 5;
  if (typeof p.blockRate !== "number") p.blockRate = 0;
  if (typeof p.escapeChance !== "number") p.escapeChance = 0;
  if (!Array.isArray(p.statuses)) p.statuses = [];
  if (typeof p.equipment !== "object" || p.equipment === null) {
    p.equipment = { hand:null, head:null, pant:null, armor:null, shoes:null };
  } else {
    p.equipment.hand ??= null;
    p.equipment.head ??= null;
    p.equipment.pant ??= null;
    p.equipment.armor ??= null;
    p.equipment.shoes ??= null;
  }

  // Safety defaults (older saves)
  if (typeof p.level !== "number") p.level = 1;
  if (typeof p.name !== "string") p.name = "Hero";

  applyDerivedStats(p);
  return p;
}

function applyDerivedStats(p){
  if (!p) return;
  if (typeof p.baseBlockRate !== "number") p.baseBlockRate = 0;
  if (typeof p.baseEscapeChance !== "number") p.baseEscapeChance = 0;
  if (!Array.isArray(p.statuses)) p.statuses = [];

  const intVal = Math.max(0, p.int || 0);
  const vitVal = Math.max(0, p.vit || 0);

  p.manaRegen = Math.max(1, Math.floor((p.maxMp || 0) * 0.06) + Math.floor(intVal * 0.8));
  p.blockRate = clamp(Math.round(p.baseBlockRate + vitVal * 1.2), 0, 80);
  p.escapeChance = clamp(Math.round(p.baseEscapeChance + intVal * 1.3), 0, 95);
}


function newState(){
  return {
    // Character profiles
    slots: Array.from({ length: MAX_CHAR_SLOTS }, () => null),
    activeSlot: 0,

    // Current runtime
    player: normalizePlayer(newPlayer()),
    enemy: null,
    inBattle: false,
    playerDefending: false,
    playerDodging: false,
    turn: "town",
    battleTurn: 0 // "town" | "player" | "enemy"
  };
}



/* ===== storage.js ===== */
const SAVE_KEY = "text_rpg_save_modular_v1";

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
function emptyProfilePayload(){
  return {
    v: 2,
    t: Date.now(),
    activeSlot: 0,
    slots: Array.from({ length: MAX_CHAR_SLOTS }, () => null),
  };
}

function normalizeProfilePayload(payload){
  if (!payload) return emptyProfilePayload();

  // New format: {slots, activeSlot}
  if (Array.isArray(payload.slots)) {
    const out = emptyProfilePayload();
    out.t = payload.t || Date.now();
    out.activeSlot = clamp(
      (typeof payload.activeSlot === "number" ? payload.activeSlot : 0),
      0,
      MAX_CHAR_SLOTS - 1
    );

    for (let i = 0; i < MAX_CHAR_SLOTS; i++){
      const slot = payload.slots[i];
      out.slots[i] = slot ? normalizePlayer(slot) : null;
    }
    return out;
  }

  // Old format: {player}
  if (payload.player) {
    const out = emptyProfilePayload();
    out.t = payload.t || Date.now();
    out.activeSlot = 0;
    out.slots[0] = normalizePlayer(payload.player);
    return out;
  }

  return emptyProfilePayload();
}

function getProfilePayloadFromState(){
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

  // Persist current player into active slot
  if (state.player) out.slots[out.activeSlot] = normalizePlayer(state.player);

  out.t = Date.now();
  return out;
}

function autosave(state){
  const payload = getProfilePayloadFromState();
  return safeSet(SAVE_KEY, JSON.stringify(payload));
}
function save(state){
  return autosave(state) === true;
}
function load(){
  const raw = safeGet(SAVE_KEY);
  if(!raw) return null;
  try{
    const payload = JSON.parse(raw);
    return payload || null;
  }catch{
    return null;
  }
}



// ===== cloud save (Pages Functions + D1) =====
async function apiJson(path, opts = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { res, data };
}

async function cloudMe() {
  const { res, data } = await apiJson("/api/me");
  if (!res.ok) return null;
  return data?.user || null;
}

async function cloudSavePayload(payload) {
  const { res, data } = await apiJson("/api/save", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  return { ok: res.ok, data };
}

async function cloudLoadPayload() {
  const { res, data } = await apiJson("/api/load");
  if (res.status === 401) return { ok: false, unauth: true, data };
  return { ok: res.ok, data };
}

async function cloudLogout(){
  // Backend may implement /api/logout to clear cookie session.
  try { await apiJson("/api/logout", { method: "POST" }); } catch (e) {}
  cloudUserCache = null;
  return true;
}



let cloudUserCache = null;
async function ensureCloudUser() {
  if (cloudUserCache) return cloudUserCache;
  cloudUserCache = await cloudMe();
  return cloudUserCache;
}

async function cloudTrySaveCurrentProfile() {
  const me = await ensureCloudUser();
  if (!me) return { ok: false, skipped: true, reason: "unauth" };

  const payload = getProfilePayloadFromState();
  const r = await cloudSavePayload(payload);
  return { ok: !!r.ok, skipped: false, data: r.data };
}

/* ===== ui.js ===== */
const $ = (id) => document.getElementById(id);

// Avatar animations (critical / dodge)
function playCritShake(target) {
  const el = $(target === "player" ? "pAvatarBox" : "eAvatarBox");
  if (!el) return;
  el.classList.remove("critShake");
  // restart animation
  void el.offsetWidth;
  el.classList.add("critShake");
  setTimeout(() => el.classList.remove("critShake"), 450);
}

function playDodgeFade(target) {
  const el = $(target === "player" ? "pAvatarBox" : "eAvatarBox");
  if (!el) return;
  el.classList.remove("dodgeFade");
  void el.offsetWidth;
  el.classList.add("dodgeFade");
  setTimeout(() => el.classList.remove("dodgeFade"), 450);
}

function playSlash(target, delay = 0) {
  const el = $(target === "player" ? "pAvatarBox" : "eAvatarBox");
  if (!el) return;
  const spawn = () => {
    const prev = el.querySelector(".slashHit");
    if (prev) prev.remove();
    const slash = document.createElement("div");
    slash.className = "slashHit";
    el.appendChild(slash);
    slash.addEventListener("animationend", () => slash.remove(), { once: true });
  };
  if (delay > 0) setTimeout(spawn, delay);
  else spawn();
}

function timeStr() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

let toastTimer = null;
function showToast(msg, tag) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast";

  const t = String(tag || "").toLowerCase();
  if (["xp", "exp", "gold", "win", "level", "save", "good"].includes(t)) el.classList.add("good");
  else if (["warn", "lose", "danger"].includes(t)) el.classList.add("warn");
  else if (t === "error") el.classList.add("danger");

  void el.offsetWidth;
  el.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function addLog(tag, msg) {
  showToast(msg, tag);
}

function renderSkillSlots(){
  const grid = $("skillSlots");
  if (!grid) return;
  const p = state.player;
  const slots = Array.from({ length: 8 });
  slots.forEach((_, i) => {
    let btn = grid.querySelector(`[data-slot="${i}"]`);
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "skillSlot";
      btn.setAttribute("data-slot", `${i}`);
      grid.appendChild(btn);
    }
    const skill = p.skills && p.skills[i];
    if (skill) {
      const cdLeft = skill.cdLeft || 0;
      btn.textContent = cdLeft > 0 ? `${skill.name} (CD ${cdLeft})` : skill.name;
      btn.disabled = (state.turn !== "player") || p.mp < skill.mpCost || cdLeft > 0;
      btn.onclick = () => useSkillAtIndex(i);
    } else {
      btn.textContent = "-";
      btn.disabled = true;
      btn.onclick = null;
    }
  });
}

function useSkillAtIndex(idx){
  const p = state.player;
  const e = state.enemy;
  if (!p || !e || !Array.isArray(p.skills)) return;
  const s = p.skills[idx];
  if (!s) return;
  if (state.turn !== "player") return;
  const cdLeft = s.cdLeft || 0;
  if (cdLeft > 0) {
    addLog("WARN", `${s.name} cooldown ${cdLeft} turn.`);
    refresh(state);
    return;
  }
  if (p.mp < s.mpCost) {
    addLog("WARN", "MP tidak cukup.");
    refresh(state);
    return;
  }

  p.mp -= s.mpCost;

  const res = resolveAttack(p, e, s.power);
  if (res.missed) {
    playDodgeFade("enemy");
    addLog("ENEMY", `${e.name} menghindar! (Evasion ${res.evasion}%)`);
  } else {
    if (res.blocked > 0) addLog("INFO", `${e.name} memblokir skillmu!`);
    if (res.dmg > 0) {
      e.hp = clamp(e.hp - res.dmg, 0, e.maxHp);
      playSlash("enemy", 80);
    }
    if (res.reflected > 0) {
      p.hp = clamp(p.hp - res.reflected, 0, p.maxHp);
      playSlash("player", 150);
    }
    if (res.crit || res.combustion) {
      playCritShake("enemy");
      if (res.crit && res.combustion) addLog("YOU", `CRITICAL + COMBUSTION! ${s.name}! Damage ${res.dmg}.`);
      else if (res.crit) addLog("YOU", `CRITICAL! ${s.name}! Damage ${res.dmg}.`);
      else addLog("YOU", `COMBUSTION! ${s.name}! Damage ${res.dmg}.`);
    } else {
      addLog("YOU", `${s.name}! Damage ${res.dmg}.`);
    }
  }

  s.cdLeft = s.cooldown || 0;
  if (p.hp <= 0) {
    loseBattle();
    return;
  }

  afterPlayerAction();
}
function statusLabel(entity) {
  if (!entity || !Array.isArray(entity.statuses)) return "";
  const active = entity.statuses.filter((s) => (s.turns || 0) > 0);
  if (!active.length) return "";
  return active
    .map((s) => `${(s.type || "Effect").toUpperCase()} (${s.turns} turn${s.turns > 1 ? "s" : ""})`)
    .join(" • ");
}
function setBar(el, cur, max) {
  const pctRaw = max <= 0 ? 0 : (cur / max) * 100;
  const pct = clamp(pctRaw, 0, 100);

  // Always update main fill
  el.style.width = `${pct}%`;

  // XP bar tidak perlu animasi loss (merah). Hanya HP/MP.
  if (el.classList && el.classList.contains("xp")) return;

  // Damage / loss overlay: show red trailing bar when value decreases
  const bar = el && el.parentElement;
  if (!bar || !bar.classList || !bar.classList.contains("bar")) return;

  let loss = bar.querySelector(".loss");
  if (!loss) {
    loss = document.createElement("div");
    loss.className = "loss";
    bar.insertBefore(loss, el);
  }

  const prev = bar.dataset.prevPct ? parseFloat(bar.dataset.prevPct) : pct;

  if (pct < prev - 0.01) {
    // Reset loss to previous width and show
    loss.style.transition = "none";
    loss.style.width = `${prev}%`;
    loss.style.opacity = "0.9";

    // Animate loss to new width, then fade out
    requestAnimationFrame(() => {
      loss.style.transition = "width 420ms ease-out, opacity 650ms ease-out";
      loss.style.width = `${pct}%`;
      setTimeout(() => {
        loss.style.opacity = "0";
      }, 420);
    });
  } else {
    // Heal / same: sync loss and hide
    loss.style.transition = "none";
    loss.style.width = `${pct}%`;
    loss.style.opacity = "0";
  }

  bar.dataset.prevPct = `${pct}`;
}
const modal = {
  open(title, choices, onPick) {
    $("modalTitle").textContent = title;

    const body = $("modalBody");
    body.innerHTML = "";

    // Layout: make Stats modals show 2-3 columns
    body.classList.remove("statsGrid");
    if (String(title).toLowerCase().includes("stats")) body.classList.add("statsGrid");

    choices.forEach((c) => {
      const row = document.createElement("div");
      row.className = "choice";

      // Optional styling
      if (c.className) row.classList.add(...String(c.className).split(/\s+/).filter(Boolean));
      if (c.style) row.style.cssText += String(c.style);

      const left = document.createElement("div");
      left.innerHTML = `
        <b>${escapeHtml(c.title)}</b>
        <div class="desc">${escapeHtml(c.desc || "")}</div>
      `;

      const right = document.createElement("div");
      right.className = "right muted";

      // Optional: render buttons in right area (used by Profile stat allocation)
      if (Array.isArray(c.buttons) && c.buttons.length) {
        right.classList.add("btnGroup");
        right.innerHTML = c.buttons.map((b, idx) => {
          const dis = b.disabled ? "disabled" : "";
          const cls = ["miniBtn", b.className || ""].join(" ").trim();
          return `<button type="button" class="${escapeHtml(cls)}" data-v="${escapeHtml(String(b.value))}" ${dis}>${escapeHtml(b.text)}</button>`;
        }).join("");
      } else {
        right.textContent = c.meta || "";
      }

      row.appendChild(left);
      row.appendChild(right);

      // Clickable row (only if value provided and no buttons)
      if (c.value !== undefined && !(Array.isArray(c.buttons) && c.buttons.length)) {
        row.onclick = () => {
          if (!c.keepOpen) modal.close();
          onPick(c.value);
        };
      } else {
        row.classList.add("readonly");
      }

      // Button handlers
      if (Array.isArray(c.buttons) && c.buttons.length) {
        right.querySelectorAll("button").forEach((btn) => {
          btn.onclick = (e) => {
            e.stopPropagation();
            if (btn.disabled) return;
            const v = btn.getAttribute("data-v");
            if (!c.keepOpen) modal.close();
            onPick(v);
          };
        });
      }

      body.appendChild(row);
    });

    $("modalBackdrop").style.display = "flex";
    $("modalBackdrop").onclick = (e) => {
      if (e.target.id === "modalBackdrop") modal.close();
    };
  },

  close() {
    $("modalBackdrop").style.display = "none";
  },

  bind() {
    $("modalClose").onclick = () => modal.close();
    const c = $("modalCancel"); if (c) c.onclick = () => modal.close();
  },
};

// TURN INDICATOR: state.turn = "player" | "enemy" | "town"
function refresh(state) {
  const p = state.player;

  // Player title + name
  const pNameTitle = $("pNameTitle");
  if (pNameTitle) pNameTitle.textContent = p.name;

  const pSub = $("pSub");
  if (pSub) {
    const label = statusLabel(p);
    pSub.textContent = label;
    pSub.style.display = label ? "block" : "none";
  }

  $("pLvl").textContent = `Lv${p.level}`;
  const goldPill = $("goldPill");
  if (goldPill) {
    // Gold dipindah ke ACTION card (Town), jadi sembunyikan dari Player card
    goldPill.textContent = `Gold: ${p.gold}`;
    goldPill.style.display = "none";
  }

  // Player bars
  $("hpText").textContent = `${p.hp}/${p.maxHp}`;
  $("mpText").textContent = `${p.mp}/${p.maxMp}`;
  $("xpText").textContent = (p.level >= MAX_LEVEL) ? "MAX" : `${p.xp}/${p.xpToLevel}`;

  setBar($("hpBar"), p.hp, p.maxHp);
  setBar($("mpBar"), p.mp, p.maxMp);
  setBar($("xpBar"), (p.level >= MAX_LEVEL ? p.xpToLevel : p.xp), p.xpToLevel);
  renderSkillSlots();

  const inBattle = state.inBattle && state.enemy;

  document.body.classList.toggle("inBattle", !!inBattle);
  document.body.classList.toggle("inTown", !inBattle);

  if (inBattle) {
    const e = state.enemy;

    $("modePill").textContent = "Battle";

    const battleHintEl = $("battleHint");
    if (battleHintEl) {
      battleHintEl.style.display = "none";
      battleHintEl.textContent = "";
    }

    const turnCountEl = $("turnCount");
    if (turnCountEl) {
      turnCountEl.style.display = "inline-flex";
      turnCountEl.textContent = `Turn: ${Math.max(1, state.battleTurn || 0)}`;
    }

    const actionHint = $("actionHint");
    if (actionHint) {
      actionHint.style.display = "inline-flex";
      actionHint.textContent = (state.turn === "player" ? "Giliran: Kamu" : "Giliran: Musuh");
    }

    // Enemy title + name
    const eNameTitle = $("eNameTitle");
    if (eNameTitle) eNameTitle.textContent = e.name;

    const eSub = $("eSub");
    if (eSub) {
      const label = statusLabel(e);
      eSub.textContent = label;
      eSub.style.display = label ? "block" : "none";
    }

    $("eLvl").textContent = `Lv${e.level}`;

    // Enemy bars
    $("enemyBars").style.display = "grid";
    $("eHpText").textContent = `${e.hp}/${e.maxHp}`;
    $("eMpText").textContent = `${e.mp}/${e.maxMp}`;
    setBar($("eHpBar"), e.hp, e.maxHp);
    setBar($("eMpBar"), e.mp, e.maxMp);

    // Buttons visibility
    $("townBtns").style.display = "none";
    $("battleBtns").style.display = "flex";

    const actionCard = $("actionCard");
    if (actionCard) actionCard.style.display = "block";

    const pAv = $("pAvatarWrap");
    if (pAv) pAv.style.display = "flex";
    const eAv = $("eAvatarWrap");
    if (eAv) eAv.style.display = "flex";

    // Animate player & enemy card muncul saat mulai battle dari Town
    if (state._animateEnemyIn) {
      const playerCard = $("playerCard");
      const enemyCard = $("enemyCard");

      const pop = (el) => {
        if (!el) return;
        el.classList.remove("popIn");
        void el.offsetWidth;
        el.classList.add("popIn");
        el.addEventListener("animationend", () => el.classList.remove("popIn"), { once: true });
      };

      pop(playerCard);
      pop(enemyCard);

      state._animateEnemyIn = false;
    }
    const xpGroup = $("xpGroup");
    if (xpGroup) xpGroup.style.display = "none";

    const enemyBtns = $("enemyBtns");
    if (enemyBtns) enemyBtns.style.display = "flex";
  } else {
    $("modePill").textContent = "Town";
    const battleHintEl = $("battleHint");
    if (battleHintEl) {
      battleHintEl.style.display = "inline-flex";
      battleHintEl.textContent = "Explore untuk cari musuh";
    }
    const turnCountEl = $("turnCount");
    if (turnCountEl) {
      // Town: gunakan pill kecil kanan atas untuk Gold
      turnCountEl.style.display = "inline-flex";
      turnCountEl.textContent = `Gold: ${p.gold}`;
    }

    const actionHint = $("actionHint");
    if (actionHint) {
      actionHint.textContent = "";
      actionHint.style.display = "none";
    }

    const eNameTitle = $("eNameTitle");
    if (eNameTitle) eNameTitle.textContent = "-";

    const eSub = $("eSub");
    if (eSub) { eSub.textContent = ""; eSub.style.display = "none"; }

    $("eLvl").textContent = "-";
    $("enemyBars").style.display = "none";

    $("townBtns").style.display = "flex";
    $("battleBtns").style.display = "none";
    const actionCard = $("actionCard");
    if (actionCard) actionCard.style.display = "block";

    const pAv = $("pAvatarWrap");
    if (pAv) pAv.style.display = "none";
    const eAv = $("eAvatarWrap");
    if (eAv) eAv.style.display = "none";
    const xpGroup = $("xpGroup");
    if (xpGroup) xpGroup.style.display = "block";

    const enemyBtns = $("enemyBtns");
    if (enemyBtns) enemyBtns.style.display = "none";
  }
}


/* ===== main.js ===== */
const byId = (id) => document.getElementById(id);

const state = newState();

function ensureStatuses(entity){
  if (!entity) return [];
  if (!Array.isArray(entity.statuses)) entity.statuses = [];
  return entity.statuses;
}

function clearStatuses(entity){
  if (!entity) return;
  entity.statuses = [];
}

function addStatusEffect(entity, status){
  if (!entity || !status || !status.type) return;
  const list = ensureStatuses(entity);
  const existing = list.find((s) => s.type === status.type);
  if (existing){
    existing.turns = Math.max(existing.turns || 0, status.turns || 0);
    existing.debuff = status.debuff ?? existing.debuff;
  } else {
    list.push({ ...status });
  }
}

function hasStatus(entity, type){
  return ensureStatuses(entity).find((s) => s.type === type && (s.turns || 0) > 0);
}

function tickStatuses(entity){
  if (!entity || !entity.statuses) return 0;
  let removed = 0;
  entity.statuses = entity.statuses
    .map((s) => ({ ...s, turns: (s.turns || 0) - 1 }))
    .filter((s) => {
      const alive = (s.turns || 0) > 0;
      if (!alive) removed += 1;
      return alive;
    });
  return removed;
}

function tryEscapeStatuses(entity){
  if (!entity || !Array.isArray(entity.statuses) || !entity.statuses.length) return 0;
  const chance = clamp(entity.escapeChance || 0, 0, 95);
  if (chance <= 0) return 0;
  let removed = 0;
  entity.statuses = entity.statuses.filter((s) => {
    if (!s.debuff) return true;
    const roll = randInt(1, 100);
    if (roll <= chance) { removed += 1; return false; }
    return true;
  });
  return removed;
}

function applyManaRegen(entity){
  if (!entity) return 0;
  const regen = Math.max(0, Math.round(entity.manaRegen || 0));
  if (regen <= 0 || typeof entity.mp !== "number") return 0;
  const before = entity.mp;
  entity.mp = clamp(entity.mp + regen, 0, entity.maxMp || 0);
  return entity.mp - before;
}

function applyDamageAfterDelay(target, dmg, slashTarget, delay = 200){
  if (!target || dmg <= 0) return 0;
  setTimeout(() => {
    target.hp = clamp((target.hp || 0) - dmg, 0, target.maxHp || 0);
    if (slashTarget) playSlash(slashTarget);
    refresh(state);
  }, delay);
  return delay;
}

function equipItem(slot, itemName){
  const p = state.player;
  if (!p || !p.equipment) return false;
  const inv = p.inv || {};
  const it = inv[itemName];
  if (!it || (it.qty || 0) <= 0) return false;
  if (it.kind !== "gear") return false;
  if (it.slot !== slot) return false;
  p.equipment[slot] = itemName;
  autosave(state);
  addLog("INFO", `${itemName} dipakai di slot ${slot}.`);
  refresh(state);
  return true;
}

function unequipSlot(slot){
  const p = state.player;
  if (!p || !p.equipment) return false;
  if (!p.equipment[slot]) return false;
  const name = p.equipment[slot];
  p.equipment[slot] = null;
  autosave(state);
  addLog("INFO", `${name} dilepas dari slot ${slot}.`);
  refresh(state);
  return true;
}

function getShopItem(name){
  return SHOP_GOODS.find((g) => g.name === name);
}

function buyItem(name){
  const p = state.player;
  const g = getShopItem(name);
  if (!p || !g || !g.ref) return false;
  if (p.gold < g.price) return false;
  p.gold -= g.price;
  const inv = p.inv || (p.inv = {});
  if (inv[name]) inv[name].qty += 1;
  else inv[name] = { ...g.ref, qty:1 };
  autosave(state);
  addLog("GOLD", `Beli ${name} (-${g.price} gold)`);
  refresh(state);
  return true;
}

function sellItem(name){
  const p = state.player;
  if (!p || !p.inv || !p.inv[name]) return false;
  const inv = p.inv[name];
  const base = getShopItem(name)?.price || 10;
  const gain = Math.max(1, Math.floor(base / 2));
  inv.qty -= 1;
  if (inv.qty <= 0) delete p.inv[name];
  p.gold += gain;
  autosave(state);
  addLog("GOLD", `Jual ${name} (+${gain} gold)`);
  refresh(state);
  return true;
}

function openShopModal(mode = "menu"){
  if (state.inBattle) return;
  if (mode === "menu"){
    modal.open(
      "Shop",
      [
        { title: "Market", desc: "Beli / jual item.", meta: "", value: "market" },
        { title: "Learn Skill", desc: "Pelajari skill baru (coming soon).", meta: "", value: "learn" },
      ],
      (pick) => openShopModal(String(pick || "menu"))
    );
    return;
  }

  if (mode === "learn"){
    modal.open(
      "Shop - Learn Skill",
      [
        { title: "Skill belum tersedia", desc: "Trainer belum membuka skill baru.", meta: "", value: undefined, className:"readonly" },
      ],
      () => {}
    );
    return;
  }

  if (mode === "market"){
    modal.open(
      "Market",
      [
        { title: "Beli", desc: "Beli item.", meta: "", value: "buy" },
        { title: "Jual", desc: "Jual item di inventory.", meta: "", value: "sell" },
      ],
      (pick) => openShopModal(String(pick || "market"))
    );
    return;
  }

  if (mode === "buy"){
    modal.open(
      "Shop - Beli",
      SHOP_GOODS.map((g) => ({
        title: `${g.name}`,
        desc: g.ref.desc || "Item",
        meta: `${g.price} gold`,
        value: `buy:${g.name}`,
      })),
      (pick) => {
        const name = String(pick || "").replace(/^buy:/, "");
        const ok = buyItem(name);
        if (!ok) addLog("WARN", "Gold tidak cukup atau item tidak tersedia.");
        openShopModal("buy");
      }
    );
    return;
  }

  if (mode === "sell"){
    const inv = state.player.inv || {};
    const keys = Object.keys(inv);
    const rows = keys.length
      ? keys.map((k) => {
          const price = Math.max(1, Math.floor((getShopItem(k)?.price || 10) / 2));
          return { title: `${k} x${inv[k].qty}`, desc: inv[k].desc || "Item", meta: `+${price} gold`, value: `sell:${k}` };
        })
      : [{ title: "Tidak ada item", desc: "Inventory kosong.", meta: "", value: undefined, className: "readonly" }];

    modal.open(
      "Shop - Jual",
      rows,
      (pick) => {
        const name = String(pick || "").replace(/^sell:/, "");
        const ok = sellItem(name);
        if (!ok) addLog("WARN", "Item tidak bisa dijual.");
        openShopModal("sell");
      }
    );
  }
}

/* ----------------------------- Core helpers ----------------------------- */

function setTurn(turn) {
  const prev = state.turn;
  state.turn = turn; // "town" | "player" | "enemy"

  // Per-skill cooldown ticks down when turn returns to player
  if (prev === "enemy" && turn === "player") {
    const p = state.player;
    if (p && Array.isArray(p.skills)) {
      p.skills.forEach((s) => {
        if (s && typeof s.cdLeft === "number" && s.cdLeft > 0) s.cdLeft -= 1;
        if (s && typeof s.cdLeft === "number" && s.cdLeft < 0) s.cdLeft = 0;
      });
    }
  }
}

function prepareTurn(turn){
  if (!state.inBattle) return { skipped: false };
  const actor = turn === "player" ? state.player : state.enemy;
  if (!actor) return { skipped: false };

  const escaped = tryEscapeStatuses(actor);
  if (escaped > 0) addLog("GOOD", turn === "player" ? "Kamu lolos dari debuff!" : `${actor.name} bebas dari debuff.`);

  const stunned = !!hasStatus(actor, "stun");
  return { skipped: stunned };
}

function beginPlayerTurn(){
  setTurn("player");
  const prep = prepareTurn("player");
  if (prep.skipped) {
    addLog("WARN", "Kamu sedang stun! Giliran dilewati.");
    tickStatuses(state.player);
    state.battleTurn = (state.battleTurn || 0) + 1;
    setTurn("enemy");
    refresh(state);
    setTimeout(() => {
      if (state.inBattle) enemyTurn();
    }, 380);
    return false;
  }
  refresh(state);
  return true;
}

function beginEnemyTurn(){
  setTurn("enemy");
  const prep = prepareTurn("enemy");
  if (prep.skipped) {
    addLog("INFO", `${state.enemy?.name || "Musuh"} sedang stun! Giliran mereka hilang.`);
    tickStatuses(state.enemy);
    state.playerDefending = false;
    state.playerDodging = false;
    state.battleTurn = (state.battleTurn || 0) + 1;
    beginPlayerTurn();
    return false;
  }
  refresh(state);
  return true;
}

function endBattle(reason, summary) {
  addLog("INFO", reason);
  state.inBattle = false;
  clearStatuses(state.enemy);
  state.enemy = null;
  state.playerDefending = false;
  state.playerDodging = false;
  clearStatuses(state.player);
  setTurn("town");
  state.battleTurn = 0;

  // Setelah battle selesai (menang/kalah/kabur), pulihkan HP & MP player
  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp;

  // Reset skill cooldowns after battle
  if (state.player && Array.isArray(state.player.skills)) {
    state.player.skills.forEach((s) => { if (s) s.cdLeft = 0; });
  }

  autosave(state);

  // Also sync to cloud (if logged in) so progress can be used cross-device
  (async () => {
    try {
      const r = await cloudTrySaveCurrentProfile();
      if (r.ok) addLog("SAVE", "Cloud save tersinkron (battle selesai).");
    } catch (e) {
      console.error("[CLOUD AUTOSAVE] error", e);
    }
  })();

  refresh(state);
  if (summary) showBattleResultModal(summary);
}

function levelUp() {
  const p = state.player;
  if (!p) return;
  if (p.level >= MAX_LEVEL) return;

  const prevMaxHp = p.maxHp;
  const prevMaxMp = p.maxMp;

  p.level += 1;
  p.statPoints = (p.statPoints || 0) + STAT_POINTS_PER_LEVEL;

  // Level-up growth (simple): HP, MP, slight ATK
  p.maxHp += 10;
  p.maxMp += 5;
  p.atk += 1;

  // Keep other stats unchanged
  p.hp = p.maxHp;
  p.mp = p.maxMp;
  applyDerivedStats(p);

  p.xpToLevel = Math.floor(p.xpToLevel * 1.25);

  const dhp = p.maxHp - prevMaxHp;
  const dmp = p.maxMp - prevMaxMp;
  addLog("LEVEL", `Naik ke Lv${p.level}! HP/MP Meningkat +${dhp}/+${dmp}. +${STAT_POINTS_PER_LEVEL} Stat Points.`);
}

function gainXp(amount) {
  const p = state.player;

  // Freeze XP at max level
  if (p.level >= MAX_LEVEL) {
    p.xp = p.xpToLevel;
    return;
  }

  addLog("XP", `+${amount} XP`);
  p.xp += amount;

  while (p.level < MAX_LEVEL && p.xp >= p.xpToLevel) {
    p.xp -= p.xpToLevel;
    levelUp();
  }

  // If we just hit cap, lock XP bar
  if (p.level >= MAX_LEVEL) {
    p.xp = p.xpToLevel;
  }
}

function rollBattleDrops(enemy){
  const drops = [];
  const lvl = enemy?.level || 1;
  if (randInt(1, 100) <= 35) drops.push({ ...ITEMS.potion, qty: 1 });
  if (randInt(1, 100) <= (lvl >= 4 ? 28 : 18)) drops.push({ ...ITEMS.ether, qty: 1 });
  return drops;
}

function grantDropsToPlayer(drops){
  if (!drops || !drops.length) return;
  const inv = state.player.inv || (state.player.inv = {});
  drops.forEach((d) => {
    if (!d || !d.name) return;
    const qty = d.qty || 1;
    if (inv[d.name]) inv[d.name].qty += qty;
    else inv[d.name] = { ...d, qty };
  });
}

function showBattleResultModal(summary){
  if (!summary) return;
  const title = summary.outcome === "win" ? "Kamu Menang!" : "Kamu Kalah";
  const drops = Array.isArray(summary.drops) ? summary.drops : [];
  const lines = [
    { title, desc: summary.enemyName ? `Melawan ${summary.enemyName}` : "Pertarungan selesai.", meta: "" },
    { title: `Gold: +${summary.gold || 0}`, desc: "", meta: "" },
    { title: `XP: +${summary.xp || 0}`, desc: "", meta: "" },
  ];

  if (drops.length) {
    drops.forEach((d) => {
      lines.push({ title: `Drop: ${d.name} x${d.qty || 1}`, desc: d.desc || "Reward", meta: "" });
    });
  } else {
    lines.push({ title: "Drop: -", desc: "Tidak ada drop.", meta: "" });
  }

  modal.open("Hasil Pertarungan", lines, () => {});
}

function winBattle() {
  const p = state.player;
  const e = state.enemy;

  const drops = rollBattleDrops(e);
  const goldGain = e.goldReward || 0;
  const xpGain = e.xpReward || 0;

  addLog("WIN", `Menang melawan ${e.name}!`);
  p.gold += goldGain;

  gainXp(xpGain);
  grantDropsToPlayer(drops);

  const summary = { outcome: "win", gold: goldGain, xp: xpGain, drops, enemyName: e.name };
  endBattle("Pertarungan selesai.", summary);
}

function loseBattle() {
  const eName = state.enemy?.name || "musuh";
  addLog("LOSE", "Kamu kalah... Game Over.");
  const summary = { outcome: "lose", gold: 0, xp: 0, drops: [], enemyName: eName };
  endBattle("Kembali ke Town.", summary);
}

/* ----------------------------- Enemy & turns ---------------------------- */

function enemyTurn() {
  if (!state.enemy || !state.inBattle) return;
  if (!beginEnemyTurn()) return;

  const p = state.player;
  const e = state.enemy;
  if (!e) return;

  const isRage = e.mp >= 5 && Math.random() < 0.25;
  const endTurnAfter = (waitMs = 0) => {
    setTimeout(() => {
      state.playerDefending = false;
      state.playerDodging = false;

      if (p.hp <= 0) {
        loseBattle();
        return;
      }
      if (e.hp <= 0) {
        winBattle();
        return;
      }

      state.battleTurn = (state.battleTurn || 0) + 1;
      beginPlayerTurn();
    }, waitMs);
  };

  if (isRage) {
    e.mp -= 5;
    const res = resolveAttack(e, p, 8, { dodgeBonus: state.playerDodging ? 30 : 0 });

    if (res.missed) {
      playDodgeFade("player");
      playDodgeFade("player");
      if (state.playerDodging) addLog("YOU", "Dodge berhasil! Serangan musuh meleset.");
      else addLog("YOU", "Menghindar! Serangan musuh meleset.");
      addLog("ENEMY", `${e.name} memakai Rage Strike, tapi meleset!`);
      endTurnAfter(0);
    } else {
      const delays = [];
      if (res.blocked > 0) addLog("INFO", "Serangan diblokir sebagian!");
      if (res.dmg > 0) {
        delays.push(applyDamageAfterDelay(p, res.dmg, "player", 230));
      }
      if (res.reflected > 0) {
        delays.push(applyDamageAfterDelay(e, res.reflected, "enemy", 430));
      }
      if (res.crit || res.combustion) {
        playCritShake("player");
        if (res.crit && res.combustion) addLog("ENEMY", `CRITICAL + COMBUSTION! ${e.name} memakai Rage Strike! Damage ${res.dmg}.`);
        else if (res.crit) addLog("ENEMY", `CRITICAL! ${e.name} memakai Rage Strike! Damage ${res.dmg}.`);
        else addLog("ENEMY", `COMBUSTION! ${e.name} memakai Rage Strike! Damage ${res.dmg}.`);
      } else {
        addLog("ENEMY", `${e.name} memakai Rage Strike! Damage ${res.dmg}.`);
      }
      const wait = delays.length ? Math.max(...delays, 180) + 40 : 0;
      endTurnAfter(wait);
    }
  } else {
    const res = resolveAttack(e, p, 2, { dodgeBonus: state.playerDodging ? 30 : 0 });

    if (res.missed) {
      if (state.playerDodging) addLog("YOU", "Dodge berhasil! Serangan musuh meleset.");
      else addLog("YOU", "Menghindar! Serangan musuh meleset.");
      addLog("ENEMY", `${e.name} menyerang, tapi meleset!`);
      endTurnAfter(0);
    } else {
      const delays = [];
      if (res.blocked > 0) addLog("INFO", "Serangan diblokir sebagian!");
      if (res.dmg > 0) {
        delays.push(applyDamageAfterDelay(p, res.dmg, "player", 230));
      }
      if (res.reflected > 0) {
        delays.push(applyDamageAfterDelay(e, res.reflected, "enemy", 430));
      }
      if (res.crit || res.combustion) {
        playCritShake("player");
        if (res.crit && res.combustion) addLog("ENEMY", `CRITICAL + COMBUSTION! ${e.name} menyerang! Damage ${res.dmg}.`);
        else if (res.crit) addLog("ENEMY", `CRITICAL! ${e.name} menyerang! Damage ${res.dmg}.`);
        else addLog("ENEMY", `COMBUSTION! ${e.name} menyerang! Damage ${res.dmg}.`);
      } else {
        addLog("ENEMY", `${e.name} menyerang! Damage ${res.dmg}.`);
      }
      const wait = delays.length ? Math.max(...delays, 180) + 40 : 0;
      endTurnAfter(wait);
    }
  }
}

function afterPlayerAction() {
  if (!state.inBattle) return;
  if (state.player && state.player.hp <= 0) {
    loseBattle();
    return;
  }

  const e = state.enemy;
  if (!e) return;

  if (e.hp <= 0) {
    winBattle();
    return;
  }

  tickStatuses(state.player);

  // Lock ke giliran musuh dulu supaya player tidak bisa spam tombol
  setTurn("enemy");
  refresh(state);

  // Small delay sebelum enemy acts, biar terasa lebih seperti RPG turn-based
  setTimeout(() => {
    enemyTurn();
    refresh(state);
  }, 450);
}

/* ----------------------------- Town actions ----------------------------- */

function explore() {
  if (state.inBattle) return;

  modal.open(
    "Pilih Stage",
    STAGES.map((s) => ({
      title: s.name,
      desc: `Lv ${s.range[0]} - ${s.range[1]}`,
      meta: "",
      value: s.id,
    })),
    (id) => {
      const stage = STAGES.find((s) => s.id === id) || STAGES[0];
      const [lo, hi] = stage.range;
      const targetLv = clamp(randInt(lo, hi), 1, MAX_LEVEL);
      startAdventureBattle(targetLv, stage.name);
    }
  );
}

function startAdventureBattle(targetLevel, stageName){
  state.enemy = genEnemy(targetLevel);
  state.inBattle = true;
  state._animateEnemyIn = true;
  state.playerDefending = false;
  state.playerDodging = false;
  state.battleTurn = 0;
  clearStatuses(state.enemy);
  ensureStatuses(state.enemy);
  ensureStatuses(state.player);
  addLog("INFO", `Stage ${stageName}: Musuh muncul: ${state.enemy.name} (Lv${state.enemy.level})`);

  if (state.enemy.spd > state.player.spd) {
    setTurn("enemy");
    addLog("TURN", `${state.enemy.name} lebih cepat! Musuh duluan.`);
    refresh(state);
    setTimeout(() => {
      enemyTurn();
      refresh(state);
    }, 450);
    return;
  } else {
    state.battleTurn = (state.battleTurn||0)+1;
    beginPlayerTurn();
    addLog("TURN", "Kamu lebih cepat!");
  }

  refresh(state);
}

function rest() {
  if (state.inBattle) return;

  const p = state.player;
  const hb = p.hp;
  const mb = p.mp;

  p.hp = clamp(p.hp + Math.floor(p.maxHp * 0.35), 0, p.maxHp);
  p.mp = clamp(p.mp + Math.floor(p.maxMp * 0.4), 0, p.maxMp);

  addLog("TOWN", `Istirahat... HP ${hb}→${p.hp}, MP ${mb}→${p.mp}`);

  setTurn("town");

  // Setelah battle selesai (menang/kalah/kabur), pulihkan HP & MP player
  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp;

  autosave(state);

  // Also sync to cloud (if logged in) so progress can be used cross-device
  (async () => {
    try {
      const r = await cloudTrySaveCurrentProfile();
      if (r.ok) addLog("SAVE", "Cloud save tersinkron (battle selesai).");
    } catch (e) {
      console.error("[CLOUD AUTOSAVE] error", e);
    }
  })();

  refresh(state);
}

/* ---------------------------- Battle actions ---------------------------- */

function attack() {
  setTurn("player");

  const p = state.player;
  const e = state.enemy;

  const res = resolveAttack(p, e, 3);
  if (res.missed) {
    playDodgeFade("enemy");
    playDodgeFade("enemy");
    addLog("ENEMY", `${e.name} menghindar! (Evasion ${res.evasion}%)`);
    return;
  }

  if (res.blocked > 0) addLog("INFO", `${e.name} memblokir seranganmu!`);
  if (res.dmg > 0) {
    e.hp = clamp(e.hp - res.dmg, 0, e.maxHp);
    playSlash("enemy", 80);
  }
  if (res.reflected > 0) {
    p.hp = clamp(p.hp - res.reflected, 0, p.maxHp);
    playSlash("player", 150);
  }

  if (res.crit || res.combustion) {
    playCritShake("enemy");
    if (res.crit && res.combustion) addLog("YOU", `CRITICAL + COMBUSTION! Attack Damage ${res.dmg}.`);
    else if (res.crit) addLog("YOU", `CRITICAL! Attack Damage ${res.dmg}.`);
    else addLog("YOU", `COMBUSTION! Attack Damage ${res.dmg}.`);
  } else {
    addLog("YOU", `Attack! Damage ${res.dmg}.`);
  }

  if (p.hp <= 0) {
    loseBattle();
  }
}

function charge(){
  if (!state.inBattle || state.turn !== "player") return;
  setTurn("player");
  const p = state.player;
  const gain = Math.max(1, Math.round(p.manaRegen || 0));
  const before = p.mp;
  p.mp = clamp(p.mp + gain, 0, p.maxMp);
  addLog("INFO", `Charge! MP ${before}→${p.mp} (+${gain})`);
  afterPlayerAction();
}

function dodge() {
  setTurn("player");
  state.playerDodging = true;
  addLog("YOU", "Dodge! Chance menghindar meningkat (1 turn).");
}

function runAway() {
  setTurn("player");

  const p = state.player;
  const e = state.enemy;

  const chance = escapeChance(p, e);
  const roll = randInt(1, 100);

  if (roll <= chance) {
    endBattle(`Berhasil kabur! (Chance ${chance}%, Roll ${roll})`);
    return true;
  }

  addLog("YOU", `Gagal kabur. (Chance ${chance}%, Roll ${roll})`);
  return false;
}

function useItem(name) {
  setTurn("player");

  const p = state.player;
  const it = p.inv[name];

  if (!it || it.qty <= 0) {
    addLog("WARN", "Item tidak ada/habis.");
    return false;
  }

  if (it.kind === "heal_hp") {
    const before = p.hp;
    p.hp = clamp(p.hp + it.amount, 0, p.maxHp);
    addLog("ITEM", `Memakai ${name}. HP ${before}→${p.hp}`);
  } else if (it.kind === "heal_mp") {
    const before = p.mp;
    p.mp = clamp(p.mp + it.amount, 0, p.maxMp);
    addLog("ITEM", `Memakai ${name}. MP ${before}→${p.mp}`);
  }

  it.qty -= 1;
  if (it.qty <= 0) delete p.inv[name];

  return true;
}

function openSkillModal() {
  const p = state.player;
  if (!p || !state.enemy) return;

  const choices = p.skills.map((s, i) => {
    const cdLeft = s.cdLeft || 0;
    const cdText = (s.cooldown ? `CD ${cdLeft}/${s.cooldown}` : "CD -");
    const meta = `MP ${s.mpCost} • ${cdText}`;

    // If on cooldown, make it readonly by omitting value
    if (cdLeft > 0) {
      return { title: `${s.name}`, desc: `${s.desc}`, meta, value: undefined, className: "readonly" };
    }
    return { title: `${s.name}`, desc: `${s.desc}`, meta, value: i };
  });

  modal.open("Skill", choices, (idx) => {
    setTurn("player");
    const s = p.skills[idx];

    const cdLeft = s.cdLeft || 0;
    if (cdLeft > 0) {
      addLog("WARN", `${s.name} cooldown ${cdLeft} turn.`);
      refresh(state);
      return;
    }

    if (p.mp < s.mpCost) {
      addLog("WARN", "MP tidak cukup.");
      refresh(state);
      return;
    }

    p.mp -= s.mpCost;

    const res = resolveAttack(p, state.enemy, s.power);
    if (res.missed) {
      playDodgeFade("enemy");
      addLog("ENEMY", `${state.enemy.name} menghindar! (Evasion ${res.evasion}%)`);
    } else {
      if (res.blocked > 0) addLog("INFO", `${state.enemy.name} memblokir skillmu!`);
      if (res.dmg > 0) {
        state.enemy.hp = clamp(state.enemy.hp - res.dmg, 0, state.enemy.maxHp);
        playSlash("enemy", 80);
      }
      if (res.reflected > 0) {
        p.hp = clamp(p.hp - res.reflected, 0, p.maxHp);
        playSlash("player", 150);
      }
      if (res.crit || res.combustion) {
        if (res.crit && res.combustion) addLog("YOU", `CRITICAL + COMBUSTION! ${s.name}! Damage ${res.dmg}.`);
        else if (res.crit) addLog("YOU", `CRITICAL! ${s.name}! Damage ${res.dmg}.`);
        else addLog("YOU", `COMBUSTION! ${s.name}! Damage ${res.dmg}.`);
      } else {
        addLog("YOU", `${s.name}! Damage ${res.dmg}.`);
      }
    }

    // Set per-skill cooldown
    s.cdLeft = s.cooldown || 0;

    if (p.hp <= 0) {
      loseBattle();
      return;
    }

    afterPlayerAction();
  });
}

function openItemModal() {
  const inv = state.player.inv;
  const keys = Object.keys(inv);

  if (!keys.length) {
    addLog("WARN", "Inventory kosong.");
    return;
  }

  modal.open(
    "Pilih Item",
    keys.map((k) => ({
      title: `${k} x${inv[k].qty}`,
      desc: inv[k].desc,
      meta: inv[k].kind === "heal_hp" ? `+${inv[k].amount} HP` : `+${inv[k].amount} MP`,
      value: k,
    })),
    (name) => {
      const ok = useItem(name);
      if (ok) afterPlayerAction();
      else refresh(state);
    }
  );
}

/* --------------------------- Read-only modals --------------------------- */


function applyAttributeDelta(statKey, delta){
  const p = state.player;
  if (!p) return false;

  p.statPoints = (p.statPoints || 0);

  const key = String(statKey || "").toLowerCase();

  if (delta > 0 && p.statPoints < delta) return false;
  if (delta < 0 && (p[key] || 0) < (-delta)) return false;

  // apply to base attr
  p[key] = (p[key] || 0) + delta;
  p.statPoints -= delta;

  // apply derived changes (rebalanced)
  if (key === "str") {
    // STR: ATK +2, Combustion Chance +3%
    p.atk = (p.atk || 0) + (2 * delta);
    p.combustionChance = clamp((p.combustionChance || 0) + (3 * delta), 0, 100);
  }
  if (key === "dex") {
    // DEX: Evasion +1%, Accuracy +2, SPD +1
    p.evasion = clamp((p.evasion || 0) + (1 * delta), 0, 100);
    p.acc = Math.max(0, (p.acc || 0) + (2 * delta));
    p.spd = Math.max(0, (p.spd || 0) + (1 * delta));
  }
  if (key === "int") {
    // INT: Max MP +5
    p.maxMp = Math.max(0, (p.maxMp || 0) + (5 * delta));
    p.mp = clamp((p.mp || 0) + (5 * delta), 0, p.maxMp);
  }
  if (key === "vit") {
    // VIT: Max HP +8, DEF +2
    p.maxHp = Math.max(1, (p.maxHp || 1) + (8 * delta));
    p.hp = clamp((p.hp || 0) + (8 * delta), 0, p.maxHp);
    p.def = Math.max(0, (p.def || 0) + (2 * delta));
  }
  if (key === "foc") {
    // FOC: Crit Chance +2%, Crit Damage +5% bonus
    p.critChance = clamp((p.critChance || 0) + (2 * delta), 0, 100);
    p.critDamage = Math.max(0, (p.critDamage || 0) + (5 * delta)); // bonus % (starts at 0)
  }

  // Hard clamps
  p.atk = Math.max(0, p.atk || 0);
  p.def = Math.max(0, p.def || 0);
  p.spd = Math.max(0, p.spd || 0);
  p.critDamage = Math.max(0, p.critDamage || 0);
  p.combustionChance = clamp(p.combustionChance || 0, 0, 100);
  p.statPoints = Math.max(0, p.statPoints || 0);
  applyDerivedStats(p);

  // persist to current slot
  if (Array.isArray(state.slots)) state.slots[state.activeSlot] = p;

  autosave(state);
  (async () => { try { await cloudTrySaveCurrentProfile(); } catch(e) {} })();
  refresh(state);

  return true;
}

function openProfileModal(){
  modal.open(
    "Profile",
    [
      { title: "Equipment", desc: "Kelola gear (hand, head, pant, armor, shoes).", meta: "", value: "equip" },
      { title: "Stat", desc: "Atur stat poin.", meta: "", value: "stat" },
    ],
    (pick) => {
      if (pick === "equip") return openEquipmentModal();
      if (pick === "stat") return openProfileStatModal();
    }
  );
}

function openProfileStatModal(){
  const p = state.player || {};
  const pts = p.statPoints || 0;

  const mk = (key, label, desc) => {
    const v = p[key] || 0;
    return {
      title: `${label} : ${v}`,
      desc,
      meta: "",
      buttons: [
        { text: "−", value: `${key}:-1`, disabled: v <= 0 },
        { text: "+", value: `${key}:+1`, disabled: pts <= 0 },
      ],
      keepOpen: true,
    };
  };

  modal.open(
    "Stat",
    [
      { title: `Stat Points : ${pts}`, desc: "Dapatkan dari level up. Gunakan tombol + untuk menambah stat.", meta: "" },
      mk("str", "STR", "Meningkatkan ATK dan Combustion Chance"),
      mk("dex", "DEX", "Meningkatkan Evasion, Accuracy, dan SPD"),
      mk("int", "INT", "Meningkatkan MP, Mana Regen, dan Escape Chance"),
      mk("vit", "VIT", "Meningkatkan HP, DEF, dan Block Rate"),
      mk("foc", "FOC", "Meningkatkan Critical Chance dan Critical Damage"),
    ],
    (pick) => {
      const s = String(pick || "");
      const m = s.match(/^(str|dex|int|vit|foc):([+-]?\d+)$/);
      if (!m) return;

      const key = m[1];
      const delta = parseInt(m[2], 10) || 0;
      if (!delta) return;

      const ok = applyAttributeDelta(key, delta);
      if (!ok){
        openProfileStatModal();
        return;
      }
      openProfileStatModal();
    }
  );
}

function openEquipmentModal(){
  const p = state.player;
  if (!p || !p.equipment) return;
  const slots = [
    { key:"hand", label:"Hand" },
    { key:"head", label:"Head" },
    { key:"pant", label:"Pant" },
    { key:"armor", label:"Armor" },
    { key:"shoes", label:"Shoes" },
  ];
  const hasGear = (p.inv && Object.values(p.inv).some((it) => it.kind === "gear")) || false;

  const choices = slots.map((s) => {
    const cur = p.equipment[s.key] || null;
    const desc = cur ? `Memakai: ${cur}` : "Kosong";
    return {
      title: `${s.label} : ${cur || "-"}`,
      desc,
      meta: "",
      buttons: [
        { text: "Equip", value: `equip:${s.key}`, disabled: !hasGear },
        { text: "Unequip", value: `unequip:${s.key}`, disabled: !cur },
      ],
      keepOpen: true,
    };
  });

  modal.open(
    "Equipment",
    choices,
    (pick) => {
      const [action, slot] = String(pick || "").split(":");
      if (!slot) return;
      if (action === "equip") {
        openEquipSelect(slot);
        return;
      }
      if (action === "unequip") {
        unequipSlot(slot);
        openEquipmentModal();
      }
    }
  );
}

function openEquipSelect(slot){
  const p = state.player;
  if (!p || !p.inv) return;
  const keys = Object.keys(p.inv).filter((k) => {
    const it = p.inv[k];
    return it && it.kind === "gear" && it.slot === slot;
  });
  if (!keys.length) {
    addLog("WARN", `Tidak ada gear untuk slot ${slot}.`);
    return;
  }

  modal.open(
    `Pilih item untuk ${slot}`,
    keys.map((k) => ({
      title: `${k} x${p.inv[k].qty}`,
      desc: p.inv[k].desc || "Perlengkapan",
      meta: `Equip (${p.inv[k].slot || "-"})`,
      value: k,
    })),
    (name) => {
      const ok = equipItem(slot, name);
      if (!ok) addLog("WARN", "Item tidak bisa dipakai.");
      openEquipmentModal();
    }
  );
}




function openEnemyStatsModal() {
  const e = state.enemy;
  if (!state.inBattle || !e) return;

  modal.open(
    "Enemy Stats",
    [
      // Enemy: show core combat stats in simple lines
      { title: `ATK : ${e.atk}`, desc: "", meta: "" },
      { title: `DEF : ${e.def}`, desc: "", meta: "" },
      { title: `SPD : ${e.spd}`, desc: "", meta: "" },
      { title: `ACC : ${e.acc || 0}`, desc: "", meta: "" },
      { title: `COMBUST : ${e.combustionChance || 0}%`, desc: "", meta: "" },
            { title: `CRIT : ${e.critChance}%`, desc: "", meta: "" },
      { title: `CRIT DMG : ${e.critDamage}%`, desc: "", meta: "" },
      { title: `EVASION : ${e.evasion}%`, desc: "", meta: "" },
      { title: `BLOCK : ${e.blockRate || 0}%`, desc: "", meta: "" },
      { title: `ESCAPE : ${e.escapeChance || 0}%`, desc: "", meta: "" },
      { title: `MANA REGEN : ${e.manaRegen || 0}`, desc: "", meta: "" },
    ],
    () => {}
  );
}

function openStatsModal() {
  const p = state.player;

  const xpPct = p.xpToLevel > 0 ? clamp((p.xp / p.xpToLevel) * 100, 0, 100) : 0;

  modal.open(
    "Stats",
    [
      // Player: level row with XP background + simple combat stats per line
      { title: `Lv ${p.level}`, desc: "", meta: "", className: "xpRow", style: `--xp:${xpPct}%` },
      { title: `ATK : ${p.atk}`, desc: "", meta: "" },
      { title: `DEF : ${p.def}`, desc: "", meta: "" },
      { title: `SPD : ${p.spd}`, desc: "", meta: "" },
      { title: `ACC : ${p.acc || 0}`, desc: "", meta: "" },
      { title: `COMBUST : ${p.combustionChance || 0}%`, desc: "", meta: "" },
            { title: `CRIT : ${p.critChance}%`, desc: "", meta: "" },
      { title: `CRIT DMG : ${p.critDamage}%`, desc: "", meta: "" },
      { title: `EVASION : ${p.evasion}%`, desc: "", meta: "" },
      { title: `BLOCK : ${p.blockRate || 0}%`, desc: "", meta: "" },
      { title: `ESCAPE : ${p.escapeChance || 0}%`, desc: "", meta: "" },
      { title: `MANA REGEN : ${p.manaRegen || 0}`, desc: "", meta: "" },
    ],
    () => {}
  );
}

function openInventoryReadOnly() {
  const inv = state.player.inv;
  const keys = Object.keys(inv);

  const header = [{ title: `Gold: ${state.player.gold}`, desc: "", meta: "" }];

  if (!keys.length) {
    modal.open(
      "Inventory",
      header.concat([{ title: "Kosong", desc: "Belum punya item.", meta: "" }]),
      () => {}
    );
    return;
  }

  modal.open(
    "Inventory",
    header.concat(
      keys.map((k) => ({
        title: `${k} x${inv[k].qty}`,
        desc: inv[k].desc,
        meta: inv[k].kind === "heal_hp" ? `+${inv[k].amount} HP` : `+${inv[k].amount} MP`,
        value: k,
      }))
    ),
    () => {}
  );
}


/* ------------------------------ Town MENU ------------------------------ */

function openTownMenu(){
  if (state.inBattle) return;

  modal.open(
    "Menu",
    [
      { title: "Load Cloud", desc: "Load progress dari cloud.", meta: "", value: "cloud_load" },
      { title: "Save Cloud", desc: "Save progress ke cloud.", meta: "", value: "cloud_save" },
      { title: "Ganti Karakter", desc: "Pilih slot karakter lain.", meta: "", value: "switch_char" },
      { title: "Log out", desc: "Keluar dari akun cloud dan kembali ke halaman login.", meta: "", value: "logout", className:"danger" },
    ],
    (pick) => {
      if (pick === "cloud_save") {
        (async () => {
          try {
            const r = await cloudTrySaveCurrentProfile();
            if (r.skipped && r.reason === "unauth") {
              addLog("WARN", "Belum login cloud. Silakan login dulu.");
              // munculkan overlay login yang sudah ada di halaman
              showMenu(true);
              return;
            }
            addLog(r.ok ? "SAVE" : "WARN", r.ok ? "Cloud save berhasil." : "Cloud save gagal.");
          } catch (e) {
            console.error("[CLOUD SAVE] error", e);
            addLog("WARN", "Cloud save error.");
          }
          refresh(state);
        })();
        return;
      }

      if (pick === "cloud_load") {
        (async () => {
          try {
            // cek login dulu (biar kalau belum login langsung diarahkan ke overlay login)
            const me = await ensureCloudUser();
            if (!me) {
              addLog("WARN", "Belum login cloud. Silakan login dulu.");
              showMenu(true);
              return;
            }

            const cloud = await cloudLoadPayload();

            if (cloud.unauth) {
              addLog("WARN", "Session cloud habis. Silakan login lagi.");
              showMenu(true);
              return;
            }

            if (cloud.ok && cloud.data && cloud.data.hasSave && cloud.data.data) {
              try {
                const payload =
                  (typeof cloud.data.data === "string") ? JSON.parse(cloud.data.data) : cloud.data.data;

                {
                  const profile = normalizeProfilePayload(payload);

                  state.slots = profile.slots;
                  state.activeSlot = profile.activeSlot;

                  state.player = state.slots[state.activeSlot]
                    ? normalizePlayer(state.slots[state.activeSlot])
                    : normalizePlayer(newPlayer());

                  state.enemy = null;
                  state.inBattle = false;
                  state.playerDefending = false;
                  state.playerDodging = false;
                  setTurn("town");
                  state.battleTurn = 0;

                  addLog("LOAD", "Cloud dimuat. Pilih karakter.");

                  autosave(state);
                  openCharacterMenu("Cloud berhasil dimuat. Pilih karakter.");
                  refresh(state);
                  return;
                }
              } catch (e) {
                console.error("[CLOUD LOAD] parse error", e);
              }
            }

            addLog("LOAD", "Cloud belum ada save / data tidak valid.");
          } catch (e) {
            console.error("[CLOUD LOAD] error", e);
            addLog("WARN", "Cloud load error.");
          }

          refresh(state);
        })();
        return;
      }

      if (pick === "switch_char") {
        // Save current progress then open character select
        autosave(state);
        (async () => { try { await cloudTrySaveCurrentProfile(); } catch(e) {} })();
        openCharacterMenu("Pilih karakter yang akan dimainkan.");
        return;
      }

      if (pick === "logout") {
        (async () => {
          try { await cloudLogout(); } catch(e) {}
          // Hide any character overlays and show auth overlay
          showCharCreate(false);
          showCharMenu(false);
          showAuth(true);
          setAuthMsg("Kamu sudah logout. Silakan login lagi.", false);
        })();
        return;
      }
    }
  );
}

/* --------------------------------- Bind -------------------------------- */

function bind() {
  modal.bind();

  // Town
  byId("btnExplore").onclick = explore;
  const br=byId("btnRest"); if(br) br.onclick = rest;
  byId("btnInventory").onclick = openInventoryReadOnly;
  const btnEnemyStats = byId("btnEnemyStats");
  if (btnEnemyStats) btnEnemyStats.onclick = openEnemyStatsModal;
  // MENU (Save/Load/New Game)
  const btnMenu = byId("btnMenu");
  if (btnMenu) btnMenu.onclick = openTownMenu;

  // Profile & Shop
  const btnProfile = byId("btnProfile");
  if (btnProfile) btnProfile.onclick = openProfileModal;
  const btnShop = byId("btnShop");
  if (btnShop) btnShop.onclick = () => openShopModal();
  const playerStatLink = byId("playerStatLink");
  if (playerStatLink) playerStatLink.onclick = openStatsModal;

  // Character create menu buttons
  const ccCreate = byId("ccCreate");
  if (ccCreate) ccCreate.onclick = handleCreateCharacter;
  const ccCancel = byId("ccCancel");
  if (ccCancel) ccCancel.onclick = cancelCreateCharacter;


  // Battle
  byId("btnAttack").onclick = () => {
    if (!state.inBattle || state.turn !== "player") return;
    attack();
    afterPlayerAction();
  };
  const btnCharge = byId("btnCharge");
  if (btnCharge) btnCharge.onclick = () => {
    if (!state.inBattle || state.turn !== "player") return;
    charge();
  };

  byId("btnDefend").onclick = () => {
    if (!state.inBattle || state.turn !== "player") return;
    dodge();
    afterPlayerAction();
  };

  byId("btnRun").onclick = () => {
    if (!state.inBattle || state.turn !== "player") return;
    const ok = runAway();
    if (!ok) afterPlayerAction();
  };

  byId("btnItem").onclick = () => {
    if (!state.inBattle || state.turn !== "player") return;
    openItemModal();
  };
}

/* --------------------------------- Boot -------------------------------- */

/* ----------------------------- Boot + Main Menu ----------------------------- */

function applyLoaded(payload){
  const profile = normalizeProfilePayload(payload);
  state.slots = profile.slots;
  state.activeSlot = profile.activeSlot;

  state.player = state.slots[state.activeSlot]
    ? normalizePlayer(state.slots[state.activeSlot])
    : normalizePlayer(newPlayer());

  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  state.playerDodging = false;
  setTurn("town");
  state.battleTurn = 0;

  return state.slots.some(Boolean);
}


function startNewGame(slotIdx){
  const idx = clamp(
    (typeof slotIdx === "number" ? slotIdx : (state.activeSlot || 0)),
    0,
    MAX_CHAR_SLOTS - 1
  );

  const prev = (state.slots && state.slots[idx]) ? state.slots[idx] : state.player;

  const p = normalizePlayer(newPlayer());
  if (prev){
    if (prev.name) p.name = prev.name;
    if (prev.gender) p.gender = prev.gender;
  }

  state.slots[idx] = p;
  state.activeSlot = idx;
  state.player = p;

  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  state.playerDodging = false;
  setTurn("town");
  state.battleTurn = 0;

  addLog("INFO", "Game baru dimulai (slot di-reset).");

  autosave(state);

  (async () => {
    try { await cloudTrySaveCurrentProfile(); } catch (e) {}
  })();

  refresh(state);
}



function showOverlay(id, show){
  const el = byId(id);
  if (!el) return;
  el.classList.toggle("hidden", !show);
}

// Backward-compat: showMenu() used for auth overlay
function showMenu(show){ showOverlay("mainMenu", show); }

function showAuth(show){ showOverlay("mainMenu", show); }
function showCharMenu(show){ showOverlay("charMenu", show); }
function showCharCreate(show){ showOverlay("charCreateMenu", show); }

function setAuthMsg(msg, isError=false){
  const el = byId("authMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.opacity = "1";
  el.style.color = isError ? "#ffb4b4" : "";
}


let pendingCreateSlot = 0;
let selectedCharSlot = 0;

function setCharMsg(msg, isError=false){
  const el = byId("charMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = isError ? "#ffb4b4" : "";
}
function setCcMsg(msg, isError=false){
  const el = byId("ccMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = isError ? "#ffb4b4" : "";
}

function genderLabel(g){
  const v = String(g || "male").toLowerCase();
  if (v === "male") return "Male";
  if (v === "female") return "Female";
  return "Other";
}

function renderCharacterSlots(){
  const wrap = byId("charSlots");
  if (!wrap) return;

  wrap.innerHTML = "";

  for (let i = 0; i < MAX_CHAR_SLOTS; i++){
    const slot = state.slots && state.slots[i] ? state.slots[i] : null;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "charSlot" + (i === selectedCharSlot ? " active" : "");

    if (slot){
      btn.innerHTML = `
        <div class="charSlotTop">
          <span class="charName">${escapeHtml(slot.name || "Hero")}</span>
          <span class="pill muted">Lv${slot.level || 1}</span>
        </div>
        <div class="charSlotSub">${escapeHtml(genderLabel(slot.gender))}</div>
      `;
    } else {
      btn.innerHTML = `
        <div class="charSlotTop">
          <span class="charName muted">Empty Slot</span>
          <span class="pill muted">#${i+1}</span>
        </div>
        <div class="charSlotSub">Buat karakter baru</div>
      `;
    }

    btn.onclick = () => selectCharSlot(i);
    wrap.appendChild(btn);
  }
}

function selectCharSlot(i){
  selectedCharSlot = clamp(i, 0, MAX_CHAR_SLOTS - 1);
  renderCharacterSlots();
  renderCharActions();
}

function renderCharActions(){
  const wrap = byId("charActions");
  if (!wrap) return;

  wrap.innerHTML = "";

  const idx = clamp(selectedCharSlot || 0, 0, MAX_CHAR_SLOTS - 1);
  const slot = state.slots && state.slots[idx] ? state.slots[idx] : null;

  if (!slot){
    const bCreate = document.createElement("button");
    bCreate.type = "button";
    bCreate.className = "primary";
    bCreate.textContent = "Create";
    bCreate.onclick = () => openCreateCharacter(idx, false);
    wrap.appendChild(bCreate);
    return;
  }

  const bPlay = document.createElement("button");
  bPlay.type = "button";
  bPlay.className = "good";
  bPlay.textContent = "Play";
  bPlay.onclick = () => enterTownWithSlot(idx);

  const bDel = document.createElement("button");
  bDel.type = "button";
  bDel.className = "danger";
  bDel.textContent = "Hapus";
  bDel.onclick = () => deleteCharacter(idx);

  wrap.appendChild(bPlay);
  wrap.appendChild(bDel);
}

function openCharacterMenu(msg=""){
  // pick a sensible default selection
  const preferred = clamp((typeof state.activeSlot === "number" ? state.activeSlot : 0), 0, MAX_CHAR_SLOTS - 1);
  const hasPreferred = state.slots && state.slots[preferred];
  const firstFilled = state.slots ? state.slots.findIndex(Boolean) : -1;
  selectedCharSlot = hasPreferred ? preferred : (firstFilled >= 0 ? firstFilled : 0);

  renderCharacterSlots();
  renderCharActions();
  setCharMsg(msg || "Pilih karakter atau buat baru.");
  showCharMenu(true);
  showCharCreate(false);
}

function openCreateCharacter(slotIdx, overwrite=false){
  pendingCreateSlot = clamp(slotIdx || 0, 0, MAX_CHAR_SLOTS - 1);

  const sub = byId("ccSub");
  if (sub) sub.textContent = `Slot #${pendingCreateSlot + 1}`;

  const slot = (state.slots && state.slots[pendingCreateSlot]) ? state.slots[pendingCreateSlot] : null;

  const nameEl = byId("ccName");
  const genderEl = byId("ccGender");

  // If overwrite: prefill existing values for convenience
  if (nameEl) nameEl.value = (overwrite && slot && slot.name) ? String(slot.name) : "";
  if (genderEl) genderEl.value = (overwrite && slot && slot.gender) ? String(slot.gender) : "male";

  setCcMsg(overwrite ? "Overwrite karakter: isi nama/gender baru." : "Isi nama dan gender.");
  showCharMenu(false);
  showCharCreate(true);
}

function cancelCreateCharacter(){
  showCharCreate(false);
  showCharMenu(true);
  renderCharacterSlots();
  renderCharActions();
  setCcMsg("");
}

function deleteCharacter(slotIdx){
  const idx = clamp(slotIdx || 0, 0, MAX_CHAR_SLOTS - 1);
  const slot = state.slots && state.slots[idx] ? state.slots[idx] : null;
  if (!slot) return;

  const nm = slot.name || `Slot #${idx+1}`;
  if (!confirm(`Hapus karakter "${nm}"? (Slot #${idx+1})`)) return;

  state.slots[idx] = null;

  // If active slot deleted, move active slot to the first available character (or 0)
  if (idx === state.activeSlot){
    const next = state.slots.findIndex(Boolean);
    state.activeSlot = next >= 0 ? next : 0;
    state.player = state.slots[state.activeSlot]
      ? normalizePlayer(state.slots[state.activeSlot])
      : normalizePlayer(newPlayer());

    state.enemy = null;
    state.inBattle = false;
    state.playerDefending = false;
    state.playerDodging = false;
    setTurn("town");
    state.battleTurn = 0;
  }

  autosave(state);
  (async () => { try { await cloudTrySaveCurrentProfile(); } catch(e) {} })();

  // Keep selection on the same index (now empty) so user can press Create.
  selectedCharSlot = clamp(idx, 0, MAX_CHAR_SLOTS - 1);
  renderCharacterSlots();
  renderCharActions();
  setCharMsg("Karakter dihapus.", false);
  showCharMenu(true);
  showCharCreate(false);
  refresh(state);
}

function handleCreateCharacter(){
  const nameEl = byId("ccName");
  const genderEl = byId("ccGender");
  const name = (nameEl?.value || "").toString().trim();
  const genderRaw = (genderEl?.value || "male").toString().toLowerCase();
  const gender = genderRaw === "female" ? "female" : "male";

  if (!name){
    setCcMsg("Nama tidak boleh kosong.", true);
    return;
  }

  const p = normalizePlayer(newPlayer());
  p.name = name;
  p.gender = gender;

  state.slots[pendingCreateSlot] = p;
  state.activeSlot = pendingCreateSlot;
  state.player = p;

  // Reset runtime state
  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  state.playerDodging = false;
  setTurn("town");
  state.battleTurn = 0;

  addLog("INFO", `Karakter dibuat: ${p.name} (${genderLabel(p.gender)})`);
  autosave(state);

  // Sync to cloud if logged in
  (async () => {
    try { await cloudTrySaveCurrentProfile(); } catch (e) {}
  })();

  showCharCreate(false);
  showCharMenu(false);
  refresh(state);
}

function enterTownWithSlot(slotIdx){
  const idx = clamp(slotIdx || 0, 0, MAX_CHAR_SLOTS - 1);
  const slot = state.slots && state.slots[idx] ? state.slots[idx] : null;
  if (!slot) return;

  state.activeSlot = idx;
  state.player = normalizePlayer(slot);

  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  state.playerDodging = false;
  setTurn("town");
  state.battleTurn = 0;

  addLog("INFO", `Masuk sebagai ${state.player.name} (Lv${state.player.level}).`);

  autosave(state);

  (async () => {
    try { await cloudTrySaveCurrentProfile(); } catch (e) {}
  })();

  showCharCreate(false);
  showCharMenu(false);
  refresh(state);
}


async function syncCloudOrLocalAndShowCharacterMenu(){
  let profile = null;
  let cloudHadSave = false;

  // 1) coba load cloud dulu (kalau login)
  try{
    const me = await ensureCloudUser();
    if (me){
      setAuthMsg("Memuat cloud save...", false);
      const cloud = await cloudLoadPayload();

      if (cloud.ok && cloud.data && cloud.data.hasSave && cloud.data.data){
        cloudHadSave = true;
        const raw = cloud.data.data;
        const payload = (typeof raw === "string") ? JSON.parse(raw) : raw;
        profile = normalizeProfilePayload(payload);
      }
    }
  }catch(e){
    console.error("[CLOUD LOAD] error", e);
  }

  // 2) kalau cloud belum ada save, pakai lokal (kalau ada), lalu upload ke cloud
  const local = load();
  if (!profile && local){
    profile = normalizeProfilePayload(local);

    try{
      const me = await ensureCloudUser();
      if (me && !cloudHadSave){
        setAuthMsg("Cloud kosong. Upload save lokal ke cloud...", false);
        await cloudSavePayload(profile);
        addLog("CLOUD", "Save lokal berhasil di-upload ke cloud.");
      }
    }catch(e){
      console.error("[CLOUD UPLOAD] error", e);
    }
  }

  // 3) tidak ada apa-apa → profile kosong (user akan buat karakter)
  if (!profile) profile = emptyProfilePayload();

  // Apply to runtime state
  state.slots = profile.slots;
  state.activeSlot = profile.activeSlot;

  // Set player to active slot if exists, otherwise placeholder (will be replaced after create/select)
  state.player = state.slots[state.activeSlot]
    ? normalizePlayer(state.slots[state.activeSlot])
    : normalizePlayer(newPlayer());

  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  state.playerDodging = false;
  setTurn("town");
  state.battleTurn = 0;

  refresh(state);

  // Show character menu
  showAuth(false);
  openCharacterMenu();

  return true;
}


(function boot() {
  bind();

  const userEl = byId("authUser");
  const passEl = byId("authPass");
  const btnLogin = byId("authLogin");
  const btnRegister = byId("authRegister");
  const btnOffline = byId("authOffline");

  // Always show auth overlay first
  showMenu(true);

  const getCreds = () => {
    const username = (userEl?.value || "").toString().trim().toLowerCase();
    const password = (passEl?.value || "").toString();
    return { username, password };
  };

  const doLogin = async () => {
    const { username, password } = getCreds();
    if (!username || !password){
      setAuthMsg("Isi username & password dulu.", true);
      return;
    }

    setAuthMsg("Login...", false);

    const { res, data } = await apiJson("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    if (!res.ok){
      setAuthMsg(data?.message || "Login gagal.", true);
      return;
    }

    // refresh cached user after cookie is set
    cloudUserCache = null;
    await ensureCloudUser();

    await syncCloudOrLocalAndShowCharacterMenu();
  };

  const doRegister = async () => {
    const { username, password } = getCreds();
    if (!username || !password){
      setAuthMsg("Isi username & password dulu.", true);
      return;
    }

    setAuthMsg("Register...", false);

    const { res, data } = await apiJson("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    if (!res.ok){
      setAuthMsg(data?.message || "Register gagal.", true);
      return;
    }

    // auto login after register
    await doLogin();
  };

  if (btnLogin) btnLogin.onclick = () => doLogin();
  if (btnRegister) btnRegister.onclick = () => doRegister();

  if (btnOffline) btnOffline.onclick = () => {
    showAuth(false);
    const payload = load();
    applyLoaded(payload);
    openCharacterMenu("Mode offline. Pilih karakter / buat baru.");
  };

  // Enter key triggers login
  if (passEl){
    passEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });
  }

  // If already logged in, auto-load cloud save
  (async () => {
    try{
      setAuthMsg("Cek login...", false);
      const me = await ensureCloudUser();
      if (me){
        setAuthMsg("Login terdeteksi. Memuat save...", false);
        await syncCloudOrLocalAndShowCharacterMenu();
      }else{
        setAuthMsg("Silakan login / register untuk cloud save.", false);
      }
    }catch(e){
      console.error("[AUTH INIT] error", e);
      setAuthMsg("Gagal cek session. Silakan login.", true);
    }
  })();

  refresh(state);
})();

})();
