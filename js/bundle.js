(function(){
'use strict';
window.__BUNDLE_LOADED__=true;
try{var _el=document.getElementById('menuSub'); if(_el && _el.textContent && _el.textContent.indexOf('JS')===0){ _el.textContent='Pilih opsi:'; }}catch(e){}
/* ===== data.js ===== */
const SKILLS = {
  fireball: {
    name:"Fireball",
    icon:"",
    element:"fire",
    mpCost:6,
    power:10,
    desc:"Serangan api (damage tinggi).",
    id:101,
  },
  fireArrow: {
    name:"Fire Arrow",
    icon:"",
    element:"fire",
    mpCost:9,
    power:14,
    cooldown:4,
    desc:"Fire flame arrow that pierce to enemy",
    id:102,
  },
  blazingShield: {
    name:"Blazing Aura",
    icon:"",
    element:"fire",
    mpCost:14,
    power:0,
    cooldown:4,
    desc:"Menyelimuti tubuh dengan aura api selama 2 turn. Apply effect Strengthen 20% selama durasi.",
    id:103,
  },
  echoStrike: {
    name:"Echo Strike",
    icon:"",
    element:"physical",
    mpCost:25,
    power:10,
    cooldown:8,
    desc:"Memberikan Stun kepada target selama 3 turn.",
    id:104,
  }
};
const ITEMS = {
  potion: { name:"Potion", kind:"heal_hp", amount:25, desc:"Memulihkan 25 HP", id:1 },
  ether:  { name:"Ether", kind:"heal_mp", amount:10, desc:"Memulihkan 10 MP", id:2 }
};
const ENEMY_NAMES = ["Slime","Goblin","Bandit","Wolf","Skeleton"];
const ENEMY_AVATARS = {
  Slime: { image: "./assets/enemies/slime.png" },
  Goblin: { image: "./assets/enemies/goblin.png" },
  Bandit: { image: "./assets/enemies/bandit1.png" },
  "Leader Bandit": { image: "./assets/enemies/leaderbandit.png" },
  Wolf: { image: "./assets/enemies/wolf.png" },
  Skeleton: { image: "./assets/enemies/skeleton.png" },
};
const RECRUIT_TEMPLATES = [
  {
    id: "guardian",
    name: "Guardian",
    role: "Tank",
    desc: "HP tinggi, cocok jadi tameng tim.",
    base: { maxHp: 70, maxMp: 15, atk: 6, def: 7, spd: 4 },
    growth: { maxHp: 8, maxMp: 2, atk: 1, def: 2, spd: 1 },
    costBase: 35,
    costPerLevel: 7,
  },
  {
    id: "ranger",
    name: "Ranger",
    role: "Striker",
    desc: "Serangan cepat dengan damage stabil.",
    base: { maxHp: 50, maxMp: 20, atk: 8, def: 4, spd: 7 },
    growth: { maxHp: 6, maxMp: 3, atk: 2, def: 1, spd: 2 },
    costBase: 30,
    costPerLevel: 6,
  },
  {
    id: "mystic",
    name: "Mystic",
    role: "Support",
    desc: "MP tinggi, membantu lewat serangan sihir.",
    base: { maxHp: 45, maxMp: 30, atk: 7, def: 3, spd: 5 },
    growth: { maxHp: 5, maxMp: 5, atk: 2, def: 1, spd: 1 },
    costBase: 32,
    costPerLevel: 6,
  },
];

/* ===== engine.js ===== */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
function genEnemy(plv){
  const lvl = clamp(plv + pick([-1,0,0,1]), 1, 99);
  return {
    name: pick(ENEMY_NAMES),
    level:lvl,
    maxHp:25 + lvl*8, maxMp:10 + lvl*3,
    hp:25 + lvl*8, mp:10 + lvl*3,
    atk:6 + lvl*2, def:2 + lvl, spd:4 + lvl,
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
function escapeChance(p,e){
  return clamp(50 + (p.spd - e.spd)*8, 10, 90);
}

/* ===== state.js ===== */
function newPlayer(){
  return {
    name:"Hero",
    level:1,
    maxHp:60, maxMp:25,
    hp:60, mp:25,
    atk:10, def:4, spd:7,
    xp:0, xpToLevel:50,
    gold:0,
    allies: [],
    skills:[SKILLS.fireball],
    inv: { "1": { ...ITEMS.potion, qty:2 }, "2": { ...ITEMS.ether, qty:1 } }
  };
}
function newState(){
  const player = newPlayer();
  return {
    player,
    allies: player.allies,
    enemy: null,
    inBattle: false,
    playerDefending: false,
    autoBattleEnabled: false,
    autoBattleUseConsumable: false,
    _autoBattlePending: false,
    skillShopCategory: "fire",
    turn: "town",
    battleTurn: 0 // "town" | "player" | "enemy"
  };
}

/* ===== storage.js ===== */

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
  const validSkillIds = new Set(Object.values(SKILLS).map((entry) => entry?.id).filter((id) => id !== undefined));
  return skills.map((skill) => {
    if (!skill || typeof skill !== "object") return skill;
    if (!skill.id) {
      if (skill.name && nameToId[skill.name]) {
        return { ...skill, id: nameToId[skill.name] };
      }
      return skill;
    }
    if (typeof skill.id === "string") {
      const trimmedId = skill.id.trim();
      if (/^\d+$/.test(trimmedId)) {
        const numericId = Number(trimmedId);
        if (validSkillIds.has(numericId)) return { ...skill, id: numericId };
      }
      const nextId = slugToId[trimmedId] || nameToId[skill.name];
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
function autosave(state){
  const payload = { v:1, t:Date.now(), player: state.player };
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
    if (payload?.player) {
      payload.player.inv = migrateInventory(payload.player.inv);
      payload.player.skills = migrateSkills(payload.player.skills);
    }
    return payload?.player ? payload : null;
  }catch{
    return null;
  }
}

/* ===== ui.js ===== */

const $ = (id) => document.getElementById(id);
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
function addLog(tag, msg) {
  const logEl = $("log");
  const div = document.createElement("div");
  div.className = "entry";

  // Color helpers (tag-based)
  const t = String(tag || "").toUpperCase();
  if (t === "XP" || t === "EXP") div.classList.add("log-xp");
  if (t === "GOLD") div.classList.add("log-gold");

  div.innerHTML = `<span class="tag">${escapeHtml(tag)}</span>${escapeHtml(msg)}<span class="time"> ${timeStr()}</span>`;
  logEl.prepend(div);
  logEl.scrollTop = 0;
}
function setBar(el, cur, max) {
  const pct = max <= 0 ? 0 : (cur / max) * 100;
  el.style.width = `${clamp(pct, 0, 100)}%`;
}

function renderAllyRow(state) {
  const row = $("allyRow");
  if (!row) return;
  const allies = Array.isArray(state.allies) ? state.allies : [];
  [1, 2].forEach((slotIndex, i) => {
    const ally = allies[i] || null;
    const nameEl = row.querySelector(`[data-ally-name="${slotIndex}"]`);
    const lvlEl = row.querySelector(`[data-ally-lvl="${slotIndex}"]`);
    const subEl = row.querySelector(`[data-ally-sub="${slotIndex}"]`);
    const hpText = row.querySelector(`[data-ally-hp="${slotIndex}"]`);
    const mpText = row.querySelector(`[data-ally-mp="${slotIndex}"]`);
    const hpBar = row.querySelector(`[data-ally-hpbar="${slotIndex}"]`);
    const mpBar = row.querySelector(`[data-ally-mpbar="${slotIndex}"]`);
    const card = row.querySelector(`.allyCard.extra[data-ally-slot="${slotIndex}"]`);

    if (!nameEl || !lvlEl || !subEl || !hpText || !mpText || !hpBar || !mpBar || !card) return;

    if (ally) {
      const prevHp = (typeof ally._prevHp === "number") ? ally._prevHp : ally.hp;
      nameEl.textContent = ally.name || `NPC ${slotIndex}`;
      lvlEl.textContent = `Lv${ally.level || 1}`;
      subEl.textContent = ally.role || "Partner";
      hpText.textContent = `${ally.hp}/${ally.maxHp}`;
      mpText.textContent = `${ally.mp}/${ally.maxMp}`;
      setBar(hpBar, ally.hp, ally.maxHp);
      setBar(mpBar, ally.mp, ally.maxMp);
      const hpBarWrap = hpBar.parentElement;
      if (hpBarWrap && ally.hp < prevHp) {
        if (hpBarWrap._hpPulseTimer) clearTimeout(hpBarWrap._hpPulseTimer);
        hpBarWrap.classList.remove("hpPulse");
        void hpBarWrap.offsetWidth;
        hpBarWrap.classList.add("hpPulse");
        hpBarWrap._hpPulseTimer = setTimeout(() => {
          hpBarWrap.classList.remove("hpPulse");
        }, 360);
      }
      ally._prevHp = ally.hp;
      card.classList.remove("empty");
      card.classList.add("active");
      card.style.display = "block";
    } else {
      nameEl.textContent = `NPC ${slotIndex}`;
      lvlEl.textContent = "Lv-";
      subEl.textContent = "Slot kosong";
      hpText.textContent = "0/0";
      mpText.textContent = "0/0";
      hpBar.style.width = "0%";
      mpBar.style.width = "0%";
      card.classList.add("empty");
      card.classList.remove("active");
      card.style.display = "none";
    }
  });
}

function updateAllySlotBadge(state) {
  const badgeText = $("allySlotText");
  if (!badgeText) return;
  const allies = Array.isArray(state.allies) ? state.allies : [];
  const filled = allies.filter(Boolean).length;
  const totalSlots = document.querySelectorAll(".allyCard.extra").length || 2;
  badgeText.textContent = `${filled}/${totalSlots}`;
}
const modal = {
  open(title, choices, onPick) {
    $("modalTitle").textContent = title;

    const body = $("modalBody");
    body.innerHTML = "";

    choices.forEach((c) => {
      const row = document.createElement("div");
      row.className = "choice";

      // Optional styling
      if (c.className) row.classList.add(...String(c.className).split(/\s+/).filter(Boolean));
      if (c.style) row.style.cssText += String(c.style);
      row.innerHTML = `
        <div>
          <b>${escapeHtml(c.title)}</b>
          <div class="desc">${escapeHtml(c.desc || "")}</div>
        </div>
        <div class="right muted">${escapeHtml(c.meta || "")}</div>
      `;
      // Only clickable if value is provided
      if (c.value !== undefined) {
        row.onclick = () => {
          modal.close();
          onPick(c.value);
        };
      } else {
        row.classList.add("readonly");
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
    window.dispatchEvent(new Event("rpg:modal-closed"));
  },

  bind() {
    $("modalClose").onclick = () => modal.close();
    const c = $("modalCancel"); if (c) c.onclick = () => modal.close();
  },
};

// TURN INDICATOR: state.turn = "player" | "enemy" | "town"
function refresh(state) {
  const p = state.player;

  // Stats button (battle) — simple label only, XP shown di dalam stats modal
  const btnStatsBattle = $("btnStatsBattle");
  if (btnStatsBattle) {
    btnStatsBattle.textContent = "Stats";
  }

  // Town stats button — simple label only
  const btnStatsTown = $("btnStats");
  if (btnStatsTown) {
    btnStatsTown.textContent = "Stats";
  }

  const autoLabel = state.autoBattleEnabled ? "Auto: ON" : "Auto: OFF";
  const btnAutoBattle = $("btnAutoBattle");
  if (btnAutoBattle) {
    btnAutoBattle.textContent = autoLabel;
  }

  const btnAutoBattleFloating = $("btnAutoBattleFloating");
  if (btnAutoBattleFloating) {
    btnAutoBattleFloating.classList.toggle("active", !!state.autoBattleEnabled);
    btnAutoBattleFloating.setAttribute("aria-label", autoLabel);
    btnAutoBattleFloating.setAttribute("title", autoLabel);
  }

  const autoItemLabel = state.autoBattleUseConsumable ? "Auto Item: ON" : "Auto Item: OFF";
  const btnAutoBattleSettingsFloating = $("btnAutoBattleSettingsFloating");
  if (btnAutoBattleSettingsFloating) {
    const showSetting = !!state.inBattle && !!state.autoBattleEnabled;
    btnAutoBattleSettingsFloating.style.display = showSetting ? "inline-flex" : "none";
    btnAutoBattleSettingsFloating.classList.toggle("on", !!state.autoBattleUseConsumable);
    btnAutoBattleSettingsFloating.setAttribute("aria-label", autoItemLabel);
    btnAutoBattleSettingsFloating.setAttribute("title", autoItemLabel);
  }

  // Log hint / Turn indicator
  const logHint = $("logHint");
  if (logHint) {
    if (state.inBattle && state.enemy) {
      logHint.textContent = state.turn === "enemy" ? "Turn: Musuh" : "Turn: Kamu";
    } else {
      logHint.textContent = "Town";
    }
  }

  // Player title + name
  const pNameTitle = $("pNameTitle");
  if (pNameTitle) pNameTitle.textContent = p.name;

  const pSub = $("pSub");
  if (pSub) { pSub.textContent = ""; pSub.style.display = "none"; }

  $("pLvl").textContent = `Lv${p.level}`;
  $("goldPill").textContent = `Gold: ${p.gold}`;

  // Player bars
  const prevPlayerHp = (typeof p._prevHp === "number") ? p._prevHp : p.hp;
  $("hpText").textContent = `${p.hp}/${p.maxHp}`;
  $("mpText").textContent = `${p.mp}/${p.maxMp}`;
  $("xpText").textContent = `${p.xp}/${p.xpToLevel}`;

  const playerHpBar = $("hpBar");
  setBar(playerHpBar, p.hp, p.maxHp);
  const playerHpBarWrap = playerHpBar ? playerHpBar.parentElement : null;
  if (playerHpBarWrap && p.hp < prevPlayerHp) {
    if (playerHpBarWrap._hpPulseTimer) clearTimeout(playerHpBarWrap._hpPulseTimer);
    playerHpBarWrap.classList.remove("hpPulse");
    void playerHpBarWrap.offsetWidth;
    playerHpBarWrap.classList.add("hpPulse");
    playerHpBarWrap._hpPulseTimer = setTimeout(() => {
      playerHpBarWrap.classList.remove("hpPulse");
    }, 360);
  }
  p._prevHp = p.hp;
  setBar($("mpBar"), p.mp, p.maxMp);
  setBar($("xpBar"), p.xp, p.xpToLevel);

  const inBattle = state.inBattle && state.enemy;

  if (inBattle) {
    const e = state.enemy;

    $("modePill").textContent = "Battle";
    $("battleHint").textContent = `Turn: ${Math.max(1, state.battleTurn || 0)}`;

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
    $("battleBtns").style.display = (state.turn === "player" && !state.autoBattleEnabled) ? "flex" : "none";

    const enemyBtns = $("enemyBtns");
    if (enemyBtns) enemyBtns.style.display = "flex";
  } else {
    $("modePill").textContent = "Town";
    $("battleHint").textContent = "Explore untuk cari musuh";

    const eNameTitle = $("eNameTitle");
    if (eNameTitle) eNameTitle.textContent = "-";

    const eSub = $("eSub");
    if (eSub) { eSub.textContent = ""; eSub.style.display = "none"; }

    $("eLvl").textContent = "-";
    $("enemyBars").style.display = "none";

    $("townBtns").style.display = "flex";
    $("battleBtns").style.display = "none";

    const enemyBtns = $("enemyBtns");
    if (enemyBtns) enemyBtns.style.display = "none";
  }

  const turnIndicator = $("turnIndicator");
  if (turnIndicator) {
    if (inBattle) {
      const listEl = $("turnIndicatorList");
      const aliveAllies = (state.allies || []).filter((ally) => ally && ally.hp > 0);
      const cycle = [
        { kind: "player", label: "Kamu" },
        ...aliveAllies.map((ally) => ({ kind: "ally", label: ally.name })),
        { kind: "enemy", label: "Musuh" },
      ];
      const currentKind = state.turn === "enemy" ? "enemy" : "player";
      const currentIndex = cycle.findIndex((entry) => entry.kind === currentKind);
      const startIndex = currentIndex >= 0 ? currentIndex : 0;
      const slots = Math.min(3, cycle.length);

      if (listEl) {
        listEl.innerHTML = "";
        for (let i = 0; i < slots; i += 1) {
          const entry = cycle[(startIndex + i) % cycle.length];
          if (!entry) continue;
          const badge = document.createElement("span");
          badge.className = `turnBadge ${entry.kind}${i === 0 ? " current" : ""}`;
          badge.textContent = `${i === 0 ? "Now" : "Next"}: ${entry.label}`;
          listEl.appendChild(badge);
        }
      }
      turnIndicator.style.display = "flex";
    } else {
      turnIndicator.style.display = "none";
    }
  }

  const metaEl = $("meta");
  if (metaEl) metaEl.textContent = "";

  renderAllyRow(state);
  updateAllySlotBadge(state);
}

/* ===== main.js ===== */





const byId = (id) => document.getElementById(id);

const state = newState();
const MAX_ALLIES = 2;
const TURN_DELAY_MS = 650;
const ALLY_ACTION_GAP_MS = 420;
const AUTO_TURN_DELAY_MS = 380;

let autoBattleTimer = null;

/* ----------------------------- Core helpers ----------------------------- */

function ensureAllies() {
  if (!state.player) return [];
  if (!Array.isArray(state.player.allies)) state.player.allies = [];
  state.allies = state.player.allies;
  return state.allies;
}

function restoreAllies() {
  const allies = ensureAllies();
  allies.forEach((ally) => {
    if (!ally) return;
    ally.hp = ally.maxHp;
    ally.mp = ally.maxMp;
  });
}

function clearAutoBattleTimer() {
  if (autoBattleTimer) {
    clearTimeout(autoBattleTimer);
    autoBattleTimer = null;
  }
  state._autoBattlePending = false;
}

function setAutoBattleEnabled(enabled) {
  state.autoBattleEnabled = !!enabled;
  if (!state.autoBattleEnabled) clearAutoBattleTimer();
}

function setAutoBattleUseConsumable(enabled) {
  state.autoBattleUseConsumable = !!enabled;
}

function isActionModalOpen() {
  const backdrop = byId("modalBackdrop");
  return !!(backdrop && backdrop.style.display !== "none");
}

function scheduleAutoBattleTurn() {
  clearAutoBattleTimer();
  if (!state.autoBattleEnabled || !state.inBattle || state.turn !== "player" || !state.enemy) return;
  if (isActionModalOpen()) return;

  state._autoBattlePending = true;
  autoBattleTimer = setTimeout(() => {
    autoBattleTimer = null;
    state._autoBattlePending = false;
    performAutoBattleTurn();
  }, AUTO_TURN_DELAY_MS);
}

function setTurn(turn) {
  state.turn = turn; // "town" | "player" | "enemy"
  if (turn === "player") scheduleAutoBattleTurn();
  else clearAutoBattleTimer();
}

function endBattle(reason) {
  addLog("INFO", reason);
  state.inBattle = false;
  state.enemy = null;
  state.playerDefending = false;
  setTurn("town");
  state.battleTurn = 0;

  // Setelah battle selesai (menang/kalah/kabur), pulihkan HP & MP player
  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp;
  restoreAllies();

  autosave(state);
  refresh(state);
}

function levelUp() {
  const p = state.player;
  const prevMaxHp = p.maxHp;
  const prevMaxMp = p.maxMp;
  p.level += 1;

  p.maxHp += 10;
  p.maxMp += 5;
  p.atk += 2;
  p.def += 1;
  p.spd += 1;

  p.hp = p.maxHp;
  p.mp = p.maxMp;

  p.xpToLevel = Math.floor(p.xpToLevel * 1.25);

  const dhp = p.maxHp - prevMaxHp;
  const dmp = p.maxMp - prevMaxMp;
  addLog("LEVEL", `Naik ke Lv${p.level}! HP/MP Meningkat +${dhp}/+${dmp}.`);
}

function gainXp(amount) {
  const p = state.player;

  addLog("XP", `+${amount} XP`);
  p.xp += amount;

  while (p.xp >= p.xpToLevel) {
    p.xp -= p.xpToLevel;
    levelUp();
  }
}

function winBattle() {
  const p = state.player;
  const e = state.enemy;

  addLog("WIN", `Menang melawan ${e.name}!`);
  p.gold += e.goldReward;
  addLog("GOLD", `+${e.goldReward} gold (Total: ${p.gold})`);

  gainXp(e.xpReward);
  endBattle("Pertarungan selesai.");
}

function loseBattle() {
  addLog("LOSE", "Kamu kalah... Game Over.");
  alert("Kamu kalah... Game Over.\nKamu bisa Load atau New Game.");
  endBattle("Kembali ke Town.");
}

/* ----------------------------- Enemy & turns ---------------------------- */

function enemyTurn() {
  setTurn("enemy");

  const p = state.player;
  const e = state.enemy;
  if (!e) return;

  const allies = ensureAllies().filter((ally) => ally && ally.hp > 0);
  const roll = randInt(1, 100);
  const target = allies.length && roll > 60 ? allies[randInt(0, allies.length - 1)] : p;

  const isRage = e.mp >= 5 && Math.random() < 0.25;

  if (isRage) {
    e.mp -= 5;
    const dmg = calcDamage(e.atk, target.def, 8, target === p && state.playerDefending);
    target.hp = clamp(target.hp - dmg, 0, target.maxHp);
    const targetLabel = target === p ? "kamu" : target.name;
    addLog("ENEMY", `${e.name} memakai Rage Strike ke ${targetLabel}! Damage ${dmg}.`);
  } else {
    const dmg = calcDamage(e.atk, target.def, 2, target === p && state.playerDefending);
    target.hp = clamp(target.hp - dmg, 0, target.maxHp);
    const targetLabel = target === p ? "kamu" : target.name;
    addLog("ENEMY", `${e.name} menyerang ${targetLabel}! Damage ${dmg}.`);
  }

  state.playerDefending = false;

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

  if (state.inBattle) {
    const allies = ensureAllies();
    setTurn("enemy");
    refresh(state);
    setTimeout(() => {
      const aliveAllies = allies.filter((ally) => ally && ally.hp > 0);
      aliveAllies.forEach((ally, idx) => {
        setTimeout(() => {
          if (!ally || ally.hp <= 0 || !state.enemy) return;
          const dmg = calcDamage(ally.atk, state.enemy.def, 2, false);
          state.enemy.hp = clamp(state.enemy.hp - dmg, 0, state.enemy.maxHp);
          addLog("ALLY", `${ally.name} menyerang! Damage ${dmg}.`);
          refresh(state);
          if (state.enemy && state.enemy.hp <= 0) {
            winBattle();
          }
        }, idx * ALLY_ACTION_GAP_MS);
      });

      const totalAllyDelay = aliveAllies.length ? (aliveAllies.length - 1) * ALLY_ACTION_GAP_MS : 0;
      setTimeout(() => {
        if (!state.enemy || state.enemy.hp <= 0) return;
        setTimeout(() => {
          if (!state.enemy || state.enemy.hp <= 0) return;
          enemyTurn();
          refresh(state);
        }, TURN_DELAY_MS);
      }, totalAllyDelay + TURN_DELAY_MS);
    }, TURN_DELAY_MS);
    return;
  }

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
  }, TURN_DELAY_MS);
}

/* ----------------------------- Town actions ----------------------------- */

function explore() {
  if (state.inBattle) return;

  state.enemy = genEnemy(state.player.level);
  state.inBattle = true;
  state._animateEnemyIn = true;
  state.playerDefending = false;
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
    }, TURN_DELAY_MS);
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
  restoreAllies();

  addLog("TOWN", `Istirahat... HP ${hb}→${p.hp}, MP ${mb}→${p.mp}`);

  setTurn("town");

  autosave(state);
  refresh(state);
}

/* ---------------------------- Battle actions ---------------------------- */

function attack() {
  setTurn("player");

  const p = state.player;
  const e = state.enemy;

  const dmg = calcDamage(p.atk, e.def, 3, false);
  e.hp = clamp(e.hp - dmg, 0, e.maxHp);

  addLog("YOU", `Attack! Damage ${dmg}.`);
}

/* ------------------------------ Recruit ------------------------------ */

function recruitCost(template, level) {
  return template.costBase + (level - 1) * template.costPerLevel;
}

function buildRecruit(template, level) {
  const maxHp = template.base.maxHp + (level - 1) * template.growth.maxHp;
  const maxMp = template.base.maxMp + (level - 1) * template.growth.maxMp;
  return {
    id: template.id,
    name: template.name,
    role: template.role,
    level,
    maxHp,
    maxMp,
    hp: maxHp,
    mp: maxMp,
    atk: template.base.atk + (level - 1) * template.growth.atk,
    def: template.base.def + (level - 1) * template.growth.def,
    spd: template.base.spd + (level - 1) * template.growth.spd,
  };
}

function addRecruit(ally) {
  const allies = ensureAllies();
  if (allies.length >= MAX_ALLIES) return false;
  allies.push(ally);
  return true;
}

function dismissRecruit(index) {
  const allies = ensureAllies();
  if (!allies[index]) return false;
  allies.splice(index, 1);
  return true;
}

function openRecruitModal() {
  if (state.inBattle) return;

  const p = state.player;
  const allies = ensureAllies();
  const level = p.level;
  const slotsFilled = allies.length;
  const slotsLeft = Math.max(0, MAX_ALLIES - slotsFilled);

  const header = [{
    title: `Slot Ally ${slotsFilled}/${MAX_ALLIES}`,
    desc: slotsLeft ? "Pilih NPC untuk direkrut." : "Slot penuh. Lepas ally dulu.",
    meta: "",
  }];

  const recruitChoices = RECRUIT_TEMPLATES.map((template) => {
    const price = recruitCost(template, level);
    const canHire = slotsLeft > 0 && p.gold >= price;
    let meta = `${price} gold`;
    if (!slotsLeft) meta += " (Slot penuh)";
    else if (p.gold < price) meta += " (Gold kurang)";
    return {
      title: `${template.name} (Lv${level})`,
      desc: template.desc,
      meta,
      value: canHire ? `hire:${template.id}` : undefined,
    };
  });

  const dismissChoices = allies.map((ally, idx) => ({
    title: `Lepas ${ally.name}`,
    desc: `Kosongkan slot ally (${ally.role || "Ally"}).`,
    meta: "",
    value: `dismiss:${idx}`,
  }));

  modal.open(
    "Recruit Ally",
    header.concat(recruitChoices, dismissChoices),
    (pick) => {
      if (String(pick).startsWith("hire:")) {
        const id = String(pick).replace("hire:", "");
        const template = RECRUIT_TEMPLATES.find((t) => t.id === id);
        if (!template) return;
        const price = recruitCost(template, level);
        if (p.gold < price) {
          addLog("WARN", "Gold tidak cukup.");
          refresh(state);
          return;
        }
        if (!addRecruit(buildRecruit(template, level))) {
          addLog("WARN", "Slot ally penuh.");
          refresh(state);
          return;
        }
        p.gold -= price;
        addLog("GOLD", `Rekrut ${template.name} (-${price} gold).`);
        autosave(state);
        refresh(state);
        return;
      }

      if (String(pick).startsWith("dismiss:")) {
        const idx = Number(String(pick).replace("dismiss:", ""));
        const ally = allies[idx];
        if (ally && dismissRecruit(idx)) {
          addLog("INFO", `${ally.name} dilepas dari party.`);
          autosave(state);
          refresh(state);
        }
      }
    }
  );
}


function getAutoSkillCandidates(player) {
  if (!player || !Array.isArray(player.skills)) return [];
  const byName = new Map(player.skills.filter(Boolean).map((skill, idx) => [skill.name, { skill, idx }]));
  if (!Array.isArray(player.skillSlots) || !player.skillSlots.length) {
    return player.skills
      .map((skill, idx) => ({ skill, idx }))
      .filter(({ skill }) => !!skill);
  }

  const picked = [];
  player.skillSlots.forEach((slotName) => {
    if (!slotName || !byName.has(slotName)) return;
    const candidate = byName.get(slotName);
    if (!candidate) return;
    if (picked.some((entry) => entry.idx === candidate.idx)) return;
    picked.push(candidate);
  });
  return picked;
}

function performAutoBattleTurn() {
  if (!state.autoBattleEnabled || !state.inBattle || state.turn !== "player") return;
  if (isActionModalOpen()) return;
  const p = state.player;
  const e = state.enemy;
  if (!p || !e || e.hp <= 0) return;

  const hpRatio = p.maxHp > 0 ? p.hp / p.maxHp : 1;
  if (state.autoBattleUseConsumable && hpRatio <= 0.35) {
    const healId = Object.keys(p.inv || {}).find((id) => {
      const item = p.inv[id];
      return item && item.qty > 0 && item.kind === "heal_hp";
    });
    if (healId) {
      const ok = useItem(healId);
      if (ok) {
        afterPlayerAction();
        return;
      }
    }
  }

  const usableSkills = getAutoSkillCandidates(p)
    .filter(({ skill }) => skill && (skill.cdLeft || 0) <= 0 && p.mp >= (skill.mpCost || 0));

  if (usableSkills.length) {
    const selected = usableSkills.sort((a, b) => (b.skill.power || 0) - (a.skill.power || 0))[0];
    const skill = selected.skill;
    setTurn("player");
    p.mp -= skill.mpCost || 0;
    const dmg = calcDamage(p.atk, e.def, skill.power || 2, false);
    e.hp = clamp(e.hp - dmg, 0, e.maxHp);
    addLog("YOU", `${skill.name}! Damage ${dmg}.`);
    afterPlayerAction();
    return;
  }

  attack();
  afterPlayerAction();
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

function useItem(id) {
  setTurn("player");

  const p = state.player;
  const it = p.inv[id];

  if (!it || it.qty <= 0) {
    addLog("WARN", "Item tidak ada/habis.");
    return false;
  }
  const displayName = it.name || id;

  if (it.kind === "heal_hp") {
    const before = p.hp;
    p.hp = clamp(p.hp + it.amount, 0, p.maxHp);
    addLog("ITEM", `Memakai ${displayName}. HP ${before}→${p.hp}`);
  } else if (it.kind === "heal_mp") {
    const before = p.mp;
    p.mp = clamp(p.mp + it.amount, 0, p.maxMp);
    addLog("ITEM", `Memakai ${displayName}. MP ${before}→${p.mp}`);
  }

  it.qty -= 1;
  if (it.qty <= 0) delete p.inv[id];

  return true;
}

function openSkillModal() {
  const p = state.player;

  if (!p.skills.length) {
    addLog("WARN", "Kamu belum punya skill.");
    return;
  }

  modal.open(
    "Pilih Skill",
    p.skills.map((s, idx) => ({
      title: s.name,
      desc: s.desc,
      meta: `MP ${s.mpCost} | Power ${s.power}`,
      value: idx,
    })),
    (idx) => {
      setTurn("player");
      const s = p.skills[idx];

      if (p.mp < s.mpCost) {
        addLog("WARN", "MP tidak cukup.");
        refresh(state);
        return;
      }

      p.mp -= s.mpCost;

      const dmg = calcDamage(p.atk, state.enemy.def, s.power, false);
      state.enemy.hp = clamp(state.enemy.hp - dmg, 0, state.enemy.maxHp);

      addLog("YOU", `${s.name}! Damage ${dmg}.`);
      afterPlayerAction();
    }
  );
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
    keys.map((id) => ({
      title: `${inv[id].name || id} x${inv[id].qty}`,
      desc: inv[id].desc,
      meta: inv[id].kind === "heal_hp" ? `+${inv[id].amount} HP` : `+${inv[id].amount} MP`,
      value: id,
    })),
    (id) => {
      const ok = useItem(id);
      if (ok) afterPlayerAction();
      else refresh(state);
    }
  );
}

/* --------------------------- Read-only modals --------------------------- */

function openEnemyStatsModal() {
  const e = state.enemy;
  if (!state.inBattle || !e) return;

  modal.open(
    "Enemy Stats",
    [
      // Enemy: only show core combat stats (no name/level/HP/MP)
      { title: `ATK ${e.atk} | DEF ${e.def} | SPD ${e.spd}`, desc: "", meta: "" },
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
      // Player: keep level + combat stats. Level row shows XP progress as a subtle yellow fill.
      { title: `Lv ${p.level}`, desc: "", meta: "", className: "xpRow", style: `--xp:${xpPct}%` },
      { title: `ATK ${p.atk} | DEF ${p.def} | SPD ${p.spd}`, desc: "", meta: "" },
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
      keys.map((id) => ({
        title: `${inv[id].name || id} x${inv[id].qty}`,
        desc: inv[id].desc,
        meta: inv[id].kind === "heal_hp" ? `+${inv[id].amount} HP` : `+${inv[id].amount} MP`,
        value: id,
      }))
    ),
    () => {}
  );
}


/* ------------------------------ Town MENU ------------------------------ */

function openTownMenu(){
  if (state.inBattle) return;

  modal.open(
    "MENU",
    [
      { title: "Save", desc: "Simpan progress ke perangkat.", meta: "", value: "save" },
      { title: "Load", desc: "Muat progress terakhir yang tersimpan.", meta: "", value: "load" },
      { title: "New Game", desc: "Mulai dari awal (progress sekarang tidak otomatis hilang sampai kamu Save).", meta: "", value: "new" },
    ],
    (pick) => {
      if (pick === "save") {
        const ok = save(state);
        addLog(ok ? "SAVE" : "WARN", ok ? "Progress tersimpan." : "Gagal menyimpan (storage diblokir/ penuh).");
        refresh(state);
        return;
      }

      if (pick === "load") {
        const payload = load();
        if (!payload) {
          addLog("LOAD", "Belum ada save.");
          alert("Belum ada save.");
          return;
        }

        state.player = payload.player;
        state.enemy = null;
        state.inBattle = false;
        state.playerDefending = false;
        setTurn("town");
  state.battleTurn = 0;

        addLog("LOAD", "Berhasil load progress.");
        refresh(state);
        return;
      }

      if (pick === "new") {
        if (!confirm("Mulai game baru?")) return;

        state.player = newPlayer();
        state.enemy = null;
        state.inBattle = false;
        state.playerDefending = false;
        setTurn("town");
  state.battleTurn = 0;

        byId("log").innerHTML = "";
        addLog("INFO", "Game baru dimulai.");

        autosave(state);
        refresh(state);
        return;
      }
    }
  );
}

/* --------------------------------- Bind -------------------------------- */

function bind() {
  modal.bind();
  window.addEventListener("rpg:modal-closed", () => {
    if (!state.autoBattleEnabled) return;
    if (!state.inBattle || state.turn !== "player") return;
    scheduleAutoBattleTurn();
  });
  const appRoot = document.querySelector(".wrap");
  if (appRoot) {
    appRoot.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }

  // Town
  byId("btnExplore").onclick = explore;
  const br=byId("btnRest"); if(br) br.onclick = rest;
  byId("btnInventory").onclick = openInventoryReadOnly;
  const btnRecruit = byId("btnRecruit");
  if (btnRecruit) btnRecruit.onclick = openRecruitModal;
  const allySlotBadge = byId("allySlotBadge");
  if (allySlotBadge) {
    allySlotBadge.onclick = () => {
      if (state.inBattle) return;
      openRecruitModal();
    };
  }
  const btnStats = byId("btnStats");
  if (btnStats) btnStats.onclick = openStatsModal;

  const btnStatsBattle = byId("btnStatsBattle");
  if (btnStatsBattle) btnStatsBattle.onclick = openStatsModal;

  const btnEnemyStats = byId("btnEnemyStats");
  if (btnEnemyStats) btnEnemyStats.onclick = openEnemyStatsModal;
  // MENU (Save/Load/New Game)
  const btnMenu = byId("btnMenu");
  if (btnMenu) btnMenu.onclick = openTownMenu;

  // Battle
  byId("btnAttack").onclick = () => {
    if (!state.inBattle || state.turn !== "player") return;
    attack();
    afterPlayerAction();
  };

  const toggleAutoBattle = () => {
    if (!state.inBattle) return;
    setAutoBattleEnabled(!state.autoBattleEnabled);
    addLog("INFO", state.autoBattleEnabled ? "Auto Battle aktif." : "Auto Battle nonaktif.");
    if (state.autoBattleEnabled && state.turn === "player") scheduleAutoBattleTurn();
    refresh(state);
  };

  const btnAutoBattle = byId("btnAutoBattle");
  if (btnAutoBattle) btnAutoBattle.onclick = toggleAutoBattle;

  const btnAutoBattleFloating = byId("btnAutoBattleFloating");
  if (btnAutoBattleFloating) btnAutoBattleFloating.onclick = toggleAutoBattle;

  const btnAutoBattleSettingsFloating = byId("btnAutoBattleSettingsFloating");
  if (btnAutoBattleSettingsFloating) {
    btnAutoBattleSettingsFloating.onclick = () => {
      if (!state.inBattle || !state.autoBattleEnabled) return;
      setAutoBattleUseConsumable(!state.autoBattleUseConsumable);
      addLog("INFO", state.autoBattleUseConsumable ? "Auto Battle: consumable aktif." : "Auto Battle: consumable nonaktif.");
      refresh(state);
    };
  }

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
  if (payload?.player) {
    state.player = payload.player;
    ensureAllies();
    state.enemy = null;
    state.inBattle = false;
    state.playerDefending = false;
    setAutoBattleEnabled(false);
    setTurn("town");
  state.battleTurn = 0;
    byId("log").innerHTML = "";
    addLog("LOAD", "Progress dimuat.");
    refresh(state);
    return true;
  }
  return false;
}

function startNewGame(){
  state.player = newPlayer();
  ensureAllies();
  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  setAutoBattleEnabled(false);
  setTurn("town");
  state.battleTurn = 0;
  byId("log").innerHTML = "";
  addLog("INFO", "Game baru dimulai.");
  autosave(state);
  refresh(state);
}

function showMenu(show){
  const el = byId("mainMenu");
  if (!el) return;
  el.classList.toggle("hidden", !show);
}

(function boot() {
  bind();

  // Main menu buttons (overlay)
  const menuNew = byId("menuNew");
  const menuLoad = byId("menuLoad");
  const menuExit = byId("menuExit");

  if (menuNew && menuLoad && menuExit) {
    showMenu(true);

    menuNew.onclick = () => {
      showMenu(false);
      startNewGame();
    };

    menuLoad.onclick = () => {
      const payload = load();
      if (applyLoaded(payload)) {
        showMenu(false);
      } else {
        alert("Belum ada save.");
      }
    };

    menuExit.onclick = () => {
      // Beberapa browser akan memblokir window.close jika tab tidak dibuka via script
      try { window.close(); } catch (e) {}
      alert("Jika tab tidak tertutup otomatis, silakan tutup tab secara manual.");
    };

    // Jangan autoload otomatis; biarkan user memilih.
    refresh(state);
    return;
  }

  // Fallback: kalau overlay tidak ada, tetap coba autoload seperti sebelumnya.
  const payload = load();
  if (!applyLoaded(payload)) addLog("INFO", "Selamat datang! Klik Explore untuk bertarung.");

  refresh(state);
})();

})();
