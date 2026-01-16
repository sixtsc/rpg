import { SKILLS, ITEMS, RECRUIT_TEMPLATES, SHOP_GOODS, getShopItem } from "./data.js";
import { newState, newPlayer, normalizePlayer, normalizeAlly, applyEquipmentStats } from "./state.js";
import {
  genEnemy,
  resolveAttack,
  escapeChance,
  dodgeChance,
  randInt,
  randFloat,
  pick,
  clamp,
  STAT_POINTS_PER_LEVEL,
  MAX_LEVEL,
  MAX_ALLIES,
  applyDerivedStats,
} from "./engine.js";
import {
  autosave,
  save,
  load,
  emptyProfilePayload,
  normalizeProfilePayload,
  cloudTrySaveCurrentProfile,
  cloudSavePayload,
  cloudLoadPayload,
  ensureCloudUser,
  cloudLogout,
  apiJson,
} from "./storage.js";
import {
  addLog,
  refresh,
  modal,
  playCritShake,
  playDodgeFade,
  playSlash,
  showDamageText,
  formatDamageText,
  showBattleResultOverlay,
  escapeHtml,
  normalizeEnemyQueue,
  setActiveEnemyByIndex,
} from "./ui.js";

window.__APP_BOOTED__ = true;

const byId = (id) => document.getElementById(id);
const onClick = (id, handler) => {
  const el = byId(id);
  if (el) el.onclick = handler;
};

const state = newState();
window.__GAME_STATE__ = state;

const clearLog = () => {
  const logEl = byId("log");
  if (logEl) logEl.innerHTML = "";
};


function ensureAllies(){
  if (!state.player) return [];
  if (!Array.isArray(state.player.allies)) state.player.allies = [];
  state.player.allies = state.player.allies.map(normalizeAlly).filter(Boolean);
  state.allies = state.player.allies;
  return state.allies;
}

function restoreAllies(){
  const allies = ensureAllies();
  allies.forEach((ally) => {
    if (!ally) return;
    ally.hp = ally.maxHp;
    ally.mp = ally.maxMp;
  });
}

function getAliveAllies(){
  return ensureAllies().filter((ally) => ally && ally.hp > 0);
}

function pickEnemyTarget(){
  const allies = getAliveAllies();
  if (!allies.length) return { target: state.player, isPlayer: true };
  const roll = randInt(1, 100);
  if (roll <= 60) return { target: state.player, isPlayer: true };
  return { target: pick(allies), isPlayer: false };
}

function recruitCost(template, level){
  return template.costBase + (level - 1) * template.costPerLevel;
}

function buildRecruit(template, level){
  const maxHp = template.base.maxHp + (level - 1) * template.growth.maxHp;
  const maxMp = template.base.maxMp + (level - 1) * template.growth.maxMp;
  return normalizeAlly({
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
    critChance: 5,
    critDamage: 0,
    combustionChance: 0,
    evasion: 4,
    blockRate: 0,
    escapeChance: 0,
    manaRegen: 0
  });
}

function addRecruit(ally){
  const allies = ensureAllies();
  if (allies.length >= MAX_ALLIES) return false;
  allies.push(ally);
  return true;
}

function dismissRecruit(index){
  const allies = ensureAllies();
  if (!allies[index]) return false;
  allies.splice(index, 1);
  return true;
}

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
  applyEquipmentStats(p);
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
  applyEquipmentStats(p);
  autosave(state);
  addLog("INFO", `${name} dilepas dari slot ${slot}.`);
  refresh(state);
  return true;
}

function formatItemStats(item){
  if (!item) return "";
  const stats = [];
  if (typeof item.atk === "number" && item.atk !== 0) stats.push(`ATK +${item.atk}`);
  if (typeof item.def === "number" && item.def !== 0) stats.push(`DEF +${item.def}`);
  if (typeof item.spd === "number" && item.spd !== 0) stats.push(`SPD +${item.spd}`);
  return stats.length ? stats.join(" | ") : "";
}

function getMarketGoods(){
  const category = state.shopMarketCategory || "consumable";
  const equipCategory = state.shopEquipCategory || "weapon";
  if (category === "equipment") {
    const slot = equipCategory === "weapon" ? "hand" : equipCategory;
    return SHOP_GOODS.filter((g) => g.ref && g.ref.kind === "gear" && g.ref.slot === slot);
  }
  return SHOP_GOODS.filter((g) => g.ref && g.ref.kind !== "gear");
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

function learnSkill(skillKey){
  const p = state.player;
  const skill = SKILLS[skillKey];
  const entry = SHOP_SKILLS.find((s) => s.key === skillKey);
  if (!p || !skill || !entry) return { ok:false, reason:"not_found" };
  const already = Array.isArray(p.skills) && p.skills.some((s) => s.name === skill.name);
  if (already) return { ok:false, reason:"learned" };
  if ((p.gold || 0) < entry.price) return { ok:false, reason:"gold" };
  p.gold -= entry.price;
  if (!Array.isArray(p.skills)) p.skills = [];
  p.skills.push({ ...skill, cdLeft:0 });
  if (!Array.isArray(p.skillSlots)) {
    p.skillSlots = Array.from({ length: 8 }, () => null);
  }
  const emptyIdx = p.skillSlots.findIndex((slot) => !slot);
  if (emptyIdx >= 0) p.skillSlots[emptyIdx] = skill.name;
  autosave(state);
  addLog("GOLD", `Belajar ${skill.name} (-${entry.price} gold)`);
  refresh(state);
  return { ok:true };
}

function openShopModal(mode = "menu"){
  if (state.inBattle) return;
  if (mode === "menu"){
    modal.open(
      "Shop",
      [
        { title: "Market", desc: "Beli / jual item.", meta: "", value: "market" },
        { title: "Learn Skill", desc: "Pelajari skill baru.", meta: "", value: "learn" },
      ],
      (pick) => openShopModal(String(pick || "menu"))
    );
    return;
  }

  if (mode === "learn"){
    const p = state.player;
    const header = [{ title: "Back", desc: "Kembali ke menu Shop.", meta: "", value: "back", className: "subMenuBack" }];
    const rows = SHOP_SKILLS.map((entry) => {
      const skill = SKILLS[entry.key];
      const learned = Array.isArray(p.skills) && p.skills.some((s) => s.name === skill.name);
      const meta = learned ? "Learned" : `${entry.price} gold`;
      const title = `${learned ? "✓ " : ""}${skill.name}`;
      return {
        title,
        icon: skill.icon,
        desc: `Lv ${entry.level}`,
        meta,
        value: `detail:${entry.key}`,
        className: learned ? "skillLearned" : "",
      };
    });
    modal.open(
      "Shop - Learn Skill",
      header.concat(rows.length ? rows : [
        { title: "Skill belum tersedia", desc: "Trainer belum membuka skill baru.", meta: "", value: undefined, className:"readonly" },
      ]),
      (pick) => {
        if (pick === "back") return openShopModal("menu");
        const key = String(pick || "").replace(/^detail:/, "");
        openSkillLearnDetail(key);
      }
    );
    return;
  }

  if (mode === "market"){
    modal.open(
      "Market",
      [
        { title: "Back", desc: "Kembali ke menu Shop.", meta: "", value: "back", className: "subMenuBack" },
        { title: "Beli", desc: "Beli item.", meta: "", value: "buy" },
        { title: "Jual", desc: "Jual item di inventory.", meta: "", value: "sell" },
      ],
      (pick) => {
        if (pick === "back") return openShopModal("menu");
        openShopModal(String(pick || "market"));
      }
    );
    return;
  }

  if (mode === "buy"){
    const categories = [
      { key:"consumable", label:"Consumable", icon:"🧪", desc:"Potion & item sekali pakai." },
      { key:"equipment", label:"Equipment", icon:"🛡️", desc:"Senjata & armor." },
    ];
    const equipCategories = [
      { key:"weapon", label:"Weapon", icon:"🗡️", slot:"hand", desc:"Slot: Hand" },
      { key:"head", label:"Head", icon:"🪖", slot:"head", desc:"Slot: Head" },
      { key:"armor", label:"Armor", icon:"🥋", slot:"armor", desc:"Slot: Armor" },
      { key:"pant", label:"Pant", icon:"👖", slot:"pant", desc:"Slot: Pant" },
      { key:"shoes", label:"Shoes", icon:"🥾", slot:"shoes", desc:"Slot: Shoes" },
    ];
    const categoryChoices = categories.map((c) => ({
      title: `${c.icon} ${c.label}`,
      desc: c.desc || "",
      meta: "",
      value: `cat:${c.key}`,
      className: `marketCategory marketPrimary ${state.shopMarketCategory === c.key ? "active" : ""}`.trim(),
    }));
    const equipChoices = (state.shopMarketCategory === "equipment")
      ? equipCategories.map((c) => ({
          title: c.icon || c.label,
          desc: "",
          meta: "",
          value: `equipcat:${c.key}`,
          className: `marketCategory marketSub ${state.shopEquipCategory === c.key ? "active" : ""}`.trim(),
        }))
      : [];

    const goods = getMarketGoods();
    modal.open(
      "Market - Beli",
      [{ title: "Back", desc: "Kembali ke Market.", meta: "", value: "back", className: "subMenuBack" }]
        .concat(categoryChoices)
        .concat(equipChoices)
        .concat([{ title: "Item Market", desc: "", meta: "", value: undefined, className: "marketDivider readonly" }])
        .concat(
          goods.map((g) => ({
            title: `${g.name}`,
            desc: g.ref.desc || "Item",
            meta: `${g.price} gold`,
            value: `buy:${g.name}`,
          }))
        ),
      (pick) => {
        if (pick === "back") return openShopModal("market");
        const name = String(pick || "").replace(/^buy:/, "");
        if (String(pick || "").startsWith("cat:")) {
          state.shopMarketCategory = String(pick || "").replace("cat:", "");
          if (state.shopMarketCategory !== "equipment") state.shopEquipCategory = "weapon";
          openShopModal("buy");
          return;
        }
        if (String(pick || "").startsWith("equipcat:")) {
          state.shopEquipCategory = String(pick || "").replace("equipcat:", "");
          openShopModal("buy");
          return;
        }
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
      "Market - Jual",
      [{ title: "Back", desc: "Kembali ke Market.", meta: "", value: "back", className: "subMenuBack" }].concat(rows),
      (pick) => {
        if (pick === "back") return openShopModal("market");
        const name = String(pick || "").replace(/^sell:/, "");
        const ok = sellItem(name);
        if (!ok) addLog("WARN", "Item tidak bisa dijual.");
        openShopModal("sell");
      }
    );
  }
}

function openSkillLearnDetail(skillKey){
  const p = state.player;
  const entry = SHOP_SKILLS.find((s) => s.key === skillKey);
  const skill = SKILLS[skillKey];
  if (!entry || !skill) {
    openShopModal("learn");
    return;
  }
  const learned = Array.isArray(p.skills) && p.skills.some((s) => s.name === skill.name);
  const detailDesc = `
    <div class="skillDetailStats">
      <div class="statRow"><img class="statIcon" src="./assets/icons/mp.svg" alt="" /><span>MP ${skill.mpCost}</span></div>
      <div class="statRow"><img class="statIcon" src="./assets/icons/damage.svg" alt="" /><span>Damage ${skill.power}</span></div>
      <div class="statRow"><img class="statIcon" src="./assets/icons/cooldown.svg" alt="" /><span>Cooldown ${skill.cooldown || 0}</span></div>
    </div>
    <div class="skillDetailDesc">${escapeHtml(skill.desc || "Skill")}</div>
  `;
  const price = entry.price;
  modal.open(
    "Skill Detail",
    [
      { title: "Back", desc: "Kembali ke Learn Skill.", meta: "", value: "back", className: "subMenuBack" },
      {
        title: skill.name,
        icon: skill.icon,
        descHtml: detailDesc,
        meta: "",
        value: undefined,
        className: "skillDetail readonly",
      },
      {
        title: learned ? "Sudah dimiliki" : "Learn Skill",
        desc: learned ? "Skill sudah dipelajari." : "",
        meta: learned ? "Learned" : `${price} gold`,
        buttons: [
          { text: learned ? "Owned" : "Learn", value: `learn:${skillKey}`, disabled: learned },
        ],
        keepOpen: true,
      },
    ],
    (pick) => {
      if (pick === "back") return openShopModal("learn");
      const key = String(pick || "").replace(/^learn:/, "");
      if (!key) return;
      const res = learnSkill(key);
      if (!res.ok) {
        if (res.reason === "gold") addLog("WARN", "Gold tidak cukup.");
        if (res.reason === "learned") addLog("INFO", "Skill sudah dipelajari.");
      }
      openSkillLearnDetail(key);
    }
  );
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
  applyManaRegen(state.player);
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
  if (summary) {
    state.battleResult = summary;
    refresh(state);
    showBattleResultOverlay(summary, () => finalizeBattle(reason));
    return;
  }
  finalizeBattle(reason);
}

function finalizeBattle(reason){
  state.inBattle = false;
  state.battleResult = null;
  state.enemyQueue = null;
  state.currentStageName = null;
  clearStatuses(state.enemy);
  state.enemy = null;
  state.playerDefending = false;
  state.playerDodging = false;
  clearStatuses(state.player);
  setTurn("town");
  state.battleTurn = 0;

  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp;
  restoreAllies();

  if (state.player && Array.isArray(state.player.skills)) {
    state.player.skills.forEach((s) => { if (s) s.cdLeft = 0; });
  }

  autosave(state);
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
  applyDerivedStats(p);

  p.xpToLevel = Math.floor(p.xpToLevel * 1.4);

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

  if (Array.isArray(state.enemyQueue) && state.enemyQueue.length > 1) {
    state.enemyQueue.shift();
    state.enemy = state.enemyQueue[0];
    state._animateEnemyIn = true;
    state.playerDefending = false;
    state.playerDodging = false;
    state.battleTurn = 0;
    clearStatuses(state.enemy);
    ensureStatuses(state.enemy);
    ensureStatuses(state.player);
    addLog("INFO", `${state.currentStageName || "Stage"}: Musuh berikutnya muncul: ${state.enemy.name} (Lv${state.enemy.level})`);

    if (state.enemy.spd > state.player.spd) {
      setTurn("enemy");
      addLog("TURN", `${state.enemy.name} lebih cepat! Musuh duluan.`);
      refresh(state);
      setTimeout(() => {
        enemyTurn();
        refresh(state);
      }, 450);
      return;
    }
    state.battleTurn = (state.battleTurn || 0) + 1;
    beginPlayerTurn();
    addLog("TURN", "Kamu lebih cepat!");
    refresh(state);
    return;
  }

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
  const enemies = Array.isArray(state.enemyQueue) && state.enemyQueue.length
    ? normalizeEnemyQueue()
    : (state.enemy ? [state.enemy] : []);

  const endTurnAfter = (waitMs = 0) => {
    setTimeout(() => {
      state.playerDefending = false;
      state.playerDodging = false;

      if (p.hp <= 0) {
        loseBattle();
        return;
      }

      if (Array.isArray(state.enemyQueue)) {
        normalizeEnemyQueue();
        if (!state.enemyQueue.length) {
          winBattle();
          return;
        }
        if (!state.enemy) setActiveEnemyByIndex(0);
      }

      state.battleTurn = (state.battleTurn || 0) + 1;
      beginPlayerTurn();
    }, waitMs);
  };

  const enemyAttackOnce = (enemy, done) => {
    if (!enemy || enemy.hp <= 0) {
      done(0);
      return;
    }
    const { target, isPlayer } = pickEnemyTarget();
    if (!target) {
      done(0);
      return;
    }
    const isRage = enemy.mp >= 5 && Math.random() < 0.25;
    if (isRage) enemy.mp -= 5;
    const res = resolveAttack(
      enemy,
      target,
      isRage ? 8 : 2,
      { dodgeBonus: (isPlayer && state.playerDodging) ? 30 : 0 }
    );
    if (res.missed) {
      if (isPlayer) showDamageText("player", "MISS");
      else addLog("ENEMY", `${enemy.name} meleset menyerang ${target.name}.`);
      done(0);
      return;
    }
    const delays = [];
    if (res.dmg > 0) {
      if (isPlayer) {
        delays.push(applyDamageAfterDelay(p, res.dmg, "player", 230));
      } else {
        target.hp = clamp(target.hp - res.dmg, 0, target.maxHp);
      }
    }
    if (res.reflected > 0) {
      if (isPlayer) delays.push(applyDamageAfterDelay(enemy, res.reflected, "enemy", 430));
      else enemy.hp = clamp(enemy.hp - res.reflected, 0, enemy.maxHp);
    }
    if (isPlayer && (res.crit || res.combustion)) playCritShake("player");
    if (isPlayer) {
      showDamageText("player", formatDamageText(res, res.dmg));
      if (res.reflected > 0) {
        showDamageText("enemy", `-${res.reflected} (REFLECT)`);
      }
    } else {
      addLog("ENEMY", `${enemy.name} menyerang ${target.name}! Damage ${res.dmg}.`);
      if (res.reflected > 0) {
        addLog("ALLY", `${target.name} memantulkan ${res.reflected} damage.`);
      }
    }
    if (!isPlayer && target.hp <= 0) {
      addLog("ALLY", `${target.name} tumbang!`);
    }
    const wait = delays.length ? Math.max(...delays, 180) + 40 : 0;
    done(wait);
  };

  let idx = 0;
  const next = () => {
    if (p.hp <= 0) {
      loseBattle();
      return;
    }
    const enemy = enemies[idx];
    if (!enemy) {
      endTurnAfter(0);
      return;
    }
    idx += 1;
    enemyAttackOnce(enemy, (waitMs) => {
      setTimeout(() => {
        if (p.hp <= 0) {
          loseBattle();
          return;
        }
        normalizeEnemyQueue();
        next();
      }, waitMs);
    });
  };

  next();
}

function handleEnemyDefeat(){
  if (!state.enemy) return true;
  if (Array.isArray(state.enemyQueue)) {
    normalizeEnemyQueue();
    if (state.enemyQueue.length) {
      setActiveEnemyByIndex(0);
      addLog("INFO", `Musuh tersisa: ${state.enemyQueue.length}`);
      setTurn("enemy");
      refresh(state);
      setTimeout(() => {
        enemyTurn();
        refresh(state);
      }, 450);
      return true;
    }
  }
  winBattle();
  return true;
}

function alliesAct(){
  const allies = getAliveAllies();
  if (!allies.length || !state.enemy) return;
  allies.forEach((ally) => {
    if (!state.enemy || ally.hp <= 0) return;
    const res = resolveAttack(ally, state.enemy, 2);
    if (res.missed) {
      addLog("ALLY", `${ally.name} meleset.`);
      return;
    }
    if (res.dmg > 0) {
      state.enemy.hp = clamp(state.enemy.hp - res.dmg, 0, state.enemy.maxHp);
    }
    if (res.reflected > 0) {
      ally.hp = clamp(ally.hp - res.reflected, 0, ally.maxHp);
      addLog("ALLY", `${ally.name} terkena pantulan ${res.reflected} damage.`);
    }
    addLog("ALLY", `${ally.name} menyerang! Damage ${res.dmg}.`);
    if (res.crit || res.combustion) playCritShake("enemy");
    showDamageText("enemy", formatDamageText(res, res.dmg));
  });
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
    handleEnemyDefeat();
    return;
  }

  alliesAct();

  if (state.enemy && state.enemy.hp <= 0) {
    handleEnemyDefeat();
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

  openAdventureLevels();
}

function openAdventureLevels(){
  const stages = [1, 3, 5, 7, 10, 11];
  modal.open(
    "Adventure - Level",
    stages.map((lv) => ({
      title: `Stage ${lv}`,
      desc: lv === 11
        ? "Stage spesial: 3 musuh."
        : lv === 10
          ? "Stage spesial: 2 musuh."
          : "Pilih stage petualangan",
      meta: "",
      value: lv,
    })),
    (level) => {
      const targetLv = clamp(Number(level) || 1, 1, MAX_LEVEL);
      startAdventureBattle(targetLv, `Stage ${targetLv}`);
    }
  );
}

function startAdventureBattle(targetLevel, stageName){
  state.currentStageName = stageName;
  if (targetLevel === 10 || targetLevel === 11) {
    const count = targetLevel === 11 ? 3 : 2;
    state.enemyQueue = Array.from({ length: count }, () => genEnemy(targetLevel));
    state.enemy = state.enemyQueue[0];
    state.enemyTargetIndex = 0;
  } else {
    state.enemyQueue = null;
    state.enemy = genEnemy(targetLevel);
    state.enemyTargetIndex = 0;
  }
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
  restoreAllies();

  addLog("TOWN", `Istirahat... HP ${hb}→${p.hp}, MP ${mb}→${p.mp}`);

  setTurn("town");

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

function openRecruitModal(){
  if (state.inBattle) return;
  const p = state.player;
  const allies = ensureAllies();
  const level = p.level;
  const slotsFilled = allies.length;
  const slotsLeft = Math.max(0, MAX_ALLIES - slotsFilled);

  const header = [{
    title: `Slot Ally ${slotsFilled}/${MAX_ALLIES}`,
    desc: slotsLeft ? "Pilih NPC untuk direkrut." : "Slot penuh. Lepas ally dulu.",
    meta: ""
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
      value: canHire ? `hire:${template.id}` : undefined
    };
  });

  const dismissChoices = allies.map((ally, idx) => ({
    title: `Lepas ${ally.name}`,
    desc: `Kosongkan slot ally (${ally.role || "Ally"}).`,
    meta: "",
    value: `dismiss:${idx}`
  }));

  modal.open("Recruit Ally", header.concat(recruitChoices, dismissChoices), (pick) => {
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
      (async () => {
        try { await cloudTrySaveCurrentProfile(); } catch (e) {}
      })();
      refresh(state);
      return;
    }

    if (String(pick).startsWith("dismiss:")) {
      const idx = Number(String(pick).replace("dismiss:", ""));
      const ally = allies[idx];
      if (ally && dismissRecruit(idx)) {
        addLog("INFO", `${ally.name} dilepas dari party.`);
        autosave(state);
        (async () => {
          try { await cloudTrySaveCurrentProfile(); } catch (e) {}
        })();
        refresh(state);
      }
    }
  });
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
    showDamageText("enemy", "MISS");
    return;
  }

  if (res.dmg > 0) {
    e.hp = clamp(e.hp - res.dmg, 0, e.maxHp);
    playSlash("enemy", 80);
  }
  if (res.reflected > 0) {
    p.hp = clamp(p.hp - res.reflected, 0, p.maxHp);
    playSlash("player", 150);
  }

  if (res.crit || res.combustion) playCritShake("enemy");
  showDamageText("enemy", formatDamageText(res, res.dmg));
  if (res.reflected > 0) {
    showDamageText("player", `-${res.reflected} (REFLECT)`);
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
  } else {
    addLog("WARN", "Item ini bukan consumable.");
    return false;
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
    const title = `${s.name}`;

    // If on cooldown, make it readonly by omitting value
    if (cdLeft > 0) {
      return { title, icon: s.icon, desc: `${s.desc}`, meta, value: undefined, className: "readonly" };
    }
    return { title, icon: s.icon, desc: `${s.desc}`, meta, value: i };
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
      showDamageText("enemy", "MISS");
    } else {
      if (res.dmg > 0) {
        state.enemy.hp = clamp(state.enemy.hp - res.dmg, 0, state.enemy.maxHp);
        playSlash("enemy", 80);
      }
      if (res.reflected > 0) {
        p.hp = clamp(p.hp - res.reflected, 0, p.maxHp);
        playSlash("player", 150);
      }
      if (res.crit || res.combustion) playCritShake("enemy");
      showDamageText("enemy", formatDamageText(res, res.dmg));
      if (res.reflected > 0) {
        showDamageText("player", `-${res.reflected} (REFLECT)`);
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
  const keys = Object.keys(inv).filter((k) => {
    const it = inv[k];
    return it && (it.kind === "heal_hp" || it.kind === "heal_mp");
  });

  if (!keys.length) {
    addLog("WARN", "Tidak ada item consumable.");
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
    // STR: ATK +2, Combustion Chance +2%
    p.atk = (p.atk || 0) + (2 * delta);
    p.combustionChance = clamp((p.combustionChance || 0) + (2 * delta), 0, 100);
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
      { title: "Skill Slot", desc: "Pilih skill untuk slot battle.", meta: "", value: "skill_slot" },
    ],
    (pick) => {
      if (pick === "equip") return openEquipmentModal();
      if (pick === "stat") return openProfileStatModal();
      if (pick === "skill_slot") return openSkillSlotModal();
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
      { title: "Back", desc: "Kembali ke Profile.", meta: "", value: "back", className: "subMenuBack" },
      { title: `Stat Points : ${pts}`, desc: "Dapatkan dari level up. Gunakan tombol + untuk menambah stat.", meta: "" },
      mk("str", "STR", "Meningkatkan ATK dan Combustion Chance"),
      mk("dex", "DEX", "Meningkatkan Evasion, Accuracy, dan SPD"),
      mk("int", "INT", "Meningkatkan MP, Mana Regen, dan Escape Chance"),
      mk("vit", "VIT", "Meningkatkan HP, DEF, dan Block Rate"),
      mk("foc", "FOC", "Meningkatkan Critical Chance dan Critical Damage"),
    ],
    (pick) => {
      if (pick === "back") return openProfileModal();
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

function openSkillSlotModal(){
  const p = state.player;
  if (!p) return;
  if (!Array.isArray(p.skillSlots)) {
    p.skillSlots = Array.from({ length: 8 }, () => null);
  }
  const choices = [{ title: "Back", desc: "Kembali ke Profile.", meta: "", value: "back", className: "subMenuBack" }]
    .concat(Array.from({ length: 8 }, (_, i) => {
    const slotName = p.skillSlots[i];
    const skill = slotName ? getSkillByName(p, slotName) : null;
    const title = skill ? `${skill.name}` : "Kosong";
    return {
      title: `Slot ${i + 1}`,
      desc: skill ? skill.desc : "Kosong",
      meta: skill ? title : "Klik untuk pilih",
      icon: skill ? skill.icon : "",
      value: `slot:${i}`,
      allowClick: true,
      buttons: [
        { text: "Clear", value: `clear:${i}`, disabled: !skill },
      ],
      keepOpen: true,
    };
  }));

  modal.open(
    "Skill Slot",
    choices,
    (pick) => {
      if (pick === "back") return openProfileModal();
      const [action, rawIdx] = String(pick || "").split(":");
      const idx = parseInt(rawIdx, 10);
      if (Number.isNaN(idx)) return;
      if (action === "slot") {
        openSkillSlotSelect(idx);
        return;
      }
      if (action === "clear") {
        p.skillSlots[idx] = null;
        if (Array.isArray(state.slots)) state.slots[state.activeSlot] = p;
        autosave(state);
        refresh(state);
        openSkillSlotModal();
      }
    }
  );
}

function openSkillSlotSelect(slotIdx){
  const p = state.player;
  if (!p || !Array.isArray(p.skills)) return;
  if (!Array.isArray(p.skillSlots)) {
    p.skillSlots = Array.from({ length: 8 }, () => null);
  }
  const rows = [{ title: "Back", desc: "Kembali ke Skill Slot.", meta: "", value: "back", className: "subMenuBack" }]
    .concat(p.skills.map((skill) => {
    const equippedIndex = p.skillSlots.findIndex((name) => name === skill.name);
    const alreadyEquipped = equippedIndex !== -1 && equippedIndex !== slotIdx;
    const meta = `MP ${skill.mpCost} • Power ${skill.power}${alreadyEquipped ? " • Equipped" : ""}`;
    return {
      title: skill.name,
      icon: skill.icon,
      desc: skill.desc || "Skill",
      meta,
      value: alreadyEquipped ? undefined : `pick:${skill.name}`,
      className: alreadyEquipped ? "readonly" : "",
    };
  }));

  modal.open(
    `Pilih Skill (Slot ${slotIdx + 1})`,
    rows.length ? rows : [{ title: "Belum ada skill", desc: "Pelajari skill di Shop.", meta: "", value: undefined, className:"readonly" }],
    (pick) => {
      if (pick === "back") return openSkillSlotModal();
      const name = String(pick || "").replace(/^pick:/, "");
      const skill = getSkillByName(p, name);
      if (!skill) return;
      p.skillSlots[slotIdx] = skill.name;
      if (Array.isArray(state.slots)) state.slots[state.activeSlot] = p;
      autosave(state);
      refresh(state);
      openSkillSlotModal();
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

  const choices = [{ title: "Back", desc: "Kembali ke Profile.", meta: "", value: "back", className: "subMenuBack" }]
    .concat(slots.map((s) => {
    const cur = p.equipment[s.key] || null;
    const curItem = cur ? getItemRef(cur, p) : null;
    const statText = curItem ? formatItemStats(curItem) : "";
    const desc = cur
      ? `Memakai: ${cur}${statText ? ` (${statText})` : ""}`
      : "Kosong";
    const meta = cur
      ? "Klik untuk ganti"
      : (hasGear ? "Klik untuk equip" : "Tidak ada gear");
    return {
      title: `${s.label}`,
      desc,
      meta,
      value: `equip:${s.key}`,
      allowClick: true,
      buttons: [
        { text: "Unequip", value: `unequip:${s.key}`, disabled: !cur },
      ],
      keepOpen: true,
    };
  }));

  modal.open(
    "Equipment",
    choices.map((c) => ({ ...c, className: `equipmentCard ${c.className || ""}`.trim(), value: c.value })),
    (pick) => {
      if (pick === "back") return openProfileModal();
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
    [{ title: "Back", desc: "Kembali ke Equipment.", meta: "", value: "back", className: "subMenuBack" }]
      .concat(keys.map((k) => ({
        title: `${k} x${p.inv[k].qty}`,
        desc: p.inv[k].desc || "Perlengkapan",
        meta: formatItemStats(p.inv[k]) || `Equip (${p.inv[k].slot || "-"})`,
        value: k,
      }))),
    (name) => {
      if (name === "back") return openEquipmentModal();
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
  const category = state.inventoryCategory || "item";
  const keys = Object.keys(inv).filter((k) => {
    const it = inv[k];
    if (!it) return false;
    return category === "equipment" ? it.kind === "gear" : it.kind !== "gear";
  });

  const header = [
    { title: "Item", desc: "Consumable & item pakai.", meta: "", value: "invcat:item", className: `marketCategory marketPrimary ${category === "item" ? "active" : ""}`.trim() },
    { title: "Equipment", desc: "Gear & perlengkapan.", meta: "", value: "invcat:equipment", className: `marketCategory marketPrimary ${category === "equipment" ? "active" : ""}`.trim() },
  ];

  if (!keys.length) {
    modal.open(
      "Inventory",
      header.concat([{ title: "Kosong", desc: "Belum ada item di kategori ini.", meta: "" }]),
      (pick) => {
        if (String(pick || "").startsWith("invcat:")) {
          state.inventoryCategory = String(pick || "").replace("invcat:", "");
          openInventoryReadOnly();
        }
      }
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
    (pick) => {
      if (String(pick || "").startsWith("invcat:")) {
        state.inventoryCategory = String(pick || "").replace("invcat:", "");
        openInventoryReadOnly();
      }
    }
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
                  ensureAllies();

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
  const btnRecruit = byId("btnRecruit");
  if (btnRecruit) btnRecruit.onclick = openRecruitModal;
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
  document.querySelectorAll(".genderOption").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".genderOption").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const genderEl = byId("ccGender");
      if (genderEl) genderEl.value = btn.getAttribute("data-gender") || "male";
    };
  });


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
  ensureAllies();

  ensureAllies();
  state.enemy = null;
  state.enemyTargetIndex = 0;
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
  ensureAllies();

  ensureAllies();
  state.enemy = null;
  state.enemyTargetIndex = 0;
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
    ensureAllies();

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
  ensureAllies();

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
  ensureAllies();

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
  ensureAllies();

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
window.__GAME_API__ = { afterPlayerAction, loseBattle };
