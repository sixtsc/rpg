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
  ether:  { name:"Ether",  kind:"heal_mp", amount:10, desc:"Memulihkan 10 MP" }
};
const ENEMY_NAMES = ["Slime","Goblin","Bandit","Wolf","Skeleton"];


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
  return {
    name: pick(ENEMY_NAMES),
    level:lvl,
    maxHp:25 + lvl*8, maxMp:10 + lvl*3,
    hp:25 + lvl*8, mp:10 + lvl*3,
    atk:6 + lvl*2, def:2 + lvl, spd:4 + lvl,
    critChance: clamp(5 + Math.floor(lvl/3), 5, 35),
    critDamage: 0,
    acc: 0,
    foc: 0,
    combustionChance: 0,
    evasion: clamp(5 + Math.floor((4+lvl)/4), 5, 30),
    xpReward:18 + lvl*6, goldReward:8 + lvl*4
  };
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

  return { missed: false, crit, combustion, dmg, evasion, rollEv, rollCrit, rollComb };
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

    // Derived / combat stats (currently flat)
    maxHp:60, maxMp:25,
    hp:60, mp:25,
    atk:10, def:4, spd:7,
    acc:0,
    critChance:5, critDamage:0, combustionChance:0, evasion:5,

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

  // Safety defaults (older saves)
  if (typeof p.level !== "number") p.level = 1;
  if (typeof p.name !== "string") p.name = "Hero";

  return p;
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
function addLog() {}
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

  // Stats button — simple label only, XP shown di dalam stats modal
  const btnStatsBattle = $("btnStatsBattle");
  if (btnStatsBattle) {
    btnStatsBattle.textContent = "Stats";
  }
  const btnStatsTown = $("btnStats");
  if (btnStatsTown) {
    btnStatsTown.textContent = "Stats";
  }

  // Player title + name
  const pNameTitle = $("pNameTitle");
  if (pNameTitle) pNameTitle.textContent = p.name;

  const pSub = $("pSub");
  if (pSub) { pSub.textContent = ""; pSub.style.display = "none"; }

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
    if (eSub) { eSub.textContent = ""; eSub.style.display = "none"; }

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

    const btnSkill = $("btnSkill");
    if (btnSkill) {
      btnSkill.textContent = "Skill";
      btnSkill.disabled = (state.turn !== "player");
    }

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
    const btnSkill = $("btnSkill");
    if (btnSkill) { btnSkill.disabled = false; btnSkill.textContent = "Skill"; }

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

function endBattle(reason) {
  addLog("INFO", reason);
  state.inBattle = false;
  state.enemy = null;
  state.playerDefending = false;
  state.playerDodging = false;
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
  const table = [
    { key:"potion", chance:0.35, qty:1 },
    { key:"ether", chance:0.25, qty:1 },
  ];

  const drops = [];
  table.forEach((entry) => {
    if (Math.random() < entry.chance) {
      const item = ITEMS[entry.key];
      if (item) drops.push({ ...item, key: entry.key, qty: entry.qty || 1 });
    }
  });
  return drops;
}

function applyDropsToInventory(drops){
  const inv = state.player.inv || {};
  const rewarded = [];

  drops.forEach((drop) => {
    if (!drop || !drop.name) return;
    const name = drop.name;
    if (!inv[name]) inv[name] = { ...drop, qty: 0 };
    inv[name].qty = (inv[name].qty || 0) + (drop.qty || 1);
    rewarded.push({ name, qty: drop.qty || 1, desc: drop.desc || "" });
  });

  state.player.inv = inv;
  return rewarded;
}

function showVictoryPopup(reward){
  const rows = [
    { title: "Kemenangan!", desc: reward.enemyName ? `Mengalahkan ${reward.enemyName}.` : "Menang!", meta: "" },
    { title: `Gold +${reward.gold}`, desc: "", meta: "" },
    { title: `EXP +${reward.xp}`, desc: "", meta: "" },
  ];

  if (reward.drops && reward.drops.length){
    rows.push({ title: "Drop", desc: "", meta: "", className: "readonly" });
    reward.drops.forEach((d) => {
      rows.push({ title: d.name, desc: d.desc || "Item drop.", meta: `x${d.qty || 1}` });
    });
  } else {
    rows.push({ title: "Drop", desc: "Tidak ada drop.", meta: "" });
  }

  setStatus("Kemenangan! Cek reward kemenangan.", "good");
  modal.open("Battle Victory", rows, () => {});
}
function showResultOverlay(type, reward){
  const overlay = document.getElementById("resultOverlay");
  const titleEl = document.getElementById("resultTitle");
  const listEl = document.getElementById("resultList");
  const cardEl = document.getElementById("resultCard");
  const btn = document.getElementById("resultClose");
  if (!overlay || !titleEl || !listEl || !cardEl || !btn) return;

  overlay.classList.remove("hidden");
  titleEl.textContent = type === "lose" ? "defeat" : "victory";
  cardEl.classList.remove("win", "lose");
  cardEl.classList.add(type === "lose" ? "lose" : "win");

  listEl.innerHTML = "";
  const addRow = (text, cls="") => {
    const div = document.createElement("div");
    div.textContent = text;
    if (cls) div.className = cls;
    listEl.appendChild(div);
  };

  addRow(type === "lose" ? "Kamu kalah." : `+ Gold ${reward.gold}`);
  if (type === "lose") {
    addRow("Coba lagi!", "dropItem");
  } else {
    addRow(`+ XP ${reward.xp}`);
    if (reward.drops && reward.drops.length){
      reward.drops.forEach((d) => addRow(`${d.name} x${d.qty || 1}`, "dropItem"));
    }
  }

  btn.onclick = () => {
    overlay.classList.add("hidden");
    endBattle(type === "lose" ? "Kalah dalam battle." : "Pertarungan selesai.");
  };
}

function winBattle() {
  const p = state.player;
  const e = state.enemy;

  const reward = {
    enemyName: e?.name || "musuh",
    gold: e?.goldReward || 0,
    xp: e?.xpReward || 0,
    drops: [],
  };

  addLog("WIN", `Menang melawan ${reward.enemyName}!`);
  p.gold += reward.gold;
  addLog("GOLD", `+${reward.gold} gold (Total: ${p.gold})`);

  gainXp(reward.xp);

  const drops = rollBattleDrops(e);
  reward.drops = applyDropsToInventory(drops);

  showResultOverlay("win", reward);
}

function loseBattle() {
  addLog("LOSE", "Kamu kalah...");
  showResultOverlay("lose", { gold:0, xp:0, drops:[] });
}

/* ----------------------------- Enemy & turns ---------------------------- */

function enemyTurn() {
  setTurn("enemy");

  const p = state.player;
  const e = state.enemy;
  if (!e) return;

  const isRage = e.mp >= 5 && Math.random() < 0.25;

  if (isRage) {
    e.mp -= 5;
    const res = resolveAttack(e, p, 8, { dodgeBonus: state.playerDodging ? 30 : 0 });

    if (res.missed) {
      playDodgeFade("player");
      playDodgeFade("player");
      if (state.playerDodging) addLog("YOU", "Dodge berhasil! Serangan musuh meleset.");
      else addLog("YOU", "Menghindar! Serangan musuh meleset.");
      addLog("ENEMY", `${e.name} memakai Rage Strike, tapi meleset!`);
    } else {
      p.hp = clamp(p.hp - res.dmg, 0, p.maxHp);
      if (res.crit || res.combustion) {
        playCritShake("player");
        if (res.crit && res.combustion) addLog("ENEMY", `CRITICAL + COMBUSTION! ${e.name} memakai Rage Strike! Damage ${res.dmg}.`);
        else if (res.crit) addLog("ENEMY", `CRITICAL! ${e.name} memakai Rage Strike! Damage ${res.dmg}.`);
        else addLog("ENEMY", `COMBUSTION! ${e.name} memakai Rage Strike! Damage ${res.dmg}.`);
      } else {
        addLog("ENEMY", `${e.name} memakai Rage Strike! Damage ${res.dmg}.`);
      }
    }
  } else {
    const res = resolveAttack(e, p, 2, { dodgeBonus: state.playerDodging ? 30 : 0 });

    if (res.missed) {
      if (state.playerDodging) addLog("YOU", "Dodge berhasil! Serangan musuh meleset.");
      else addLog("YOU", "Menghindar! Serangan musuh meleset.");
      addLog("ENEMY", `${e.name} menyerang, tapi meleset!`);
    } else {
      p.hp = clamp(p.hp - res.dmg, 0, p.maxHp);
      if (res.crit || res.combustion) {
        playCritShake("player");
        if (res.crit && res.combustion) addLog("ENEMY", `CRITICAL + COMBUSTION! ${e.name} menyerang! Damage ${res.dmg}.`);
        else if (res.crit) addLog("ENEMY", `CRITICAL! ${e.name} menyerang! Damage ${res.dmg}.`);
        else addLog("ENEMY", `COMBUSTION! ${e.name} menyerang! Damage ${res.dmg}.`);
      } else {
        addLog("ENEMY", `${e.name} menyerang! Damage ${res.dmg}.`);
      }
    }
  }

  state.playerDefending = false;
  state.playerDodging = false;

  if (p.hp <= 0) {
    loseBattle();
    return;
  }

  // Player turn counter
  state.battleTurn = (state.battleTurn || 0) + 1;
  setTurn("player");
}

function afterPlayerAction() {
  const e = state.enemy;
  if (!e) return;

  if (e.hp <= 0) {
    winBattle();
    return;
  }

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

  state.enemy = genEnemy(state.player.level);
  state.inBattle = true;
  state._animateEnemyIn = true;
  state.playerDefending = false;
  state.playerDodging = false;
  state.battleTurn = 0;
addLog("INFO", `Musuh muncul: ${state.enemy.name} (Lv${state.enemy.level})`);

  if (state.enemy.spd > state.player.spd) {
    setTurn("enemy");
    addLog("TURN", `${state.enemy.name} lebih cepat! Musuh duluan.`);
    refresh(state);
    // Delay serangan pertama musuh sedikit, biar berasa gantian
    setTimeout(() => {
      enemyTurn();
      refresh(state);
    }, 450);
    return;
  } else {
    state.battleTurn = (state.battleTurn||0)+1;
  setTurn("player");
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

  e.hp = clamp(e.hp - res.dmg, 0, e.maxHp);

  if (res.crit || res.combustion) {
    playCritShake("enemy");
    if (res.crit && res.combustion) addLog("YOU", `CRITICAL + COMBUSTION! Attack Damage ${res.dmg}.`);
    else if (res.crit) addLog("YOU", `CRITICAL! Attack Damage ${res.dmg}.`);
    else addLog("YOU", `COMBUSTION! Attack Damage ${res.dmg}.`);
  } else {
    addLog("YOU", `Attack! Damage ${res.dmg}.`);
  }
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
  addLog("ENEMY", `${state.enemy.name} menghindar! (Evasion ${res.evasion}%)`);
    } else {
      state.enemy.hp = clamp(state.enemy.hp - res.dmg, 0, state.enemy.maxHp);
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

  // persist to current slot
  if (Array.isArray(state.slots)) state.slots[state.activeSlot] = p;

  autosave(state);
  (async () => { try { await cloudTrySaveCurrentProfile(); } catch(e) {} })();
  refresh(state);

  return true;
}

function openProfileModal(){
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
    "Profile",
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
        // re-render anyway to refresh disabled buttons
        openProfileModal();
        return;
      }
      // re-render to update values + points
      openProfileModal();
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

                  const logEl = byId("log");
                  if (logEl) logEl.innerHTML = "";
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
  const btnStats = byId("btnStats");
  if (btnStats) btnStats.onclick = openStatsModal;

  const btnStatsBattle = byId("btnStatsBattle");
  if (btnStatsBattle) btnStatsBattle.onclick = openStatsModal;

  const btnEnemyStats = byId("btnEnemyStats");
  if (btnEnemyStats) btnEnemyStats.onclick = openEnemyStatsModal;
  // MENU (Save/Load/New Game)
  const btnMenu = byId("btnMenu");
  if (btnMenu) btnMenu.onclick = openTownMenu;

  // Profile & Shop
  const btnProfile = byId("btnProfile");
  if (btnProfile) btnProfile.onclick = openProfileModal;
  const btnShop = byId("btnShop");
  if (btnShop) btnShop.onclick = () => addLog("INFO", "Shop (coming soon).");

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

  byId("btnSkill").onclick = () => {
    if (!state.inBattle || state.turn !== "player") return;
    openSkillModal();
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

  const logEl = byId("log");
  if (logEl) logEl.innerHTML = "";
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
  const v = String(g || "other").toLowerCase();
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
  const gender = (genderEl?.value || "male").toString();

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

  const logEl = byId("log");
  if (logEl) logEl.innerHTML = "";
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

  const logEl = byId("log");
  if (logEl) logEl.innerHTML = "";
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

  const logEl = byId("log");
  if (logEl) logEl.innerHTML = "";
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
