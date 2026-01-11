import { newState, newPlayer } from "./state.js";
import { genEnemy, calcDamage, escapeChance, randInt, clamp } from "./engine.js";
import { autosave, save, load } from "./storage.js";
import { addLog, refresh, modal } from "./ui.js";
import { RECRUIT_TEMPLATES } from "./data.js";

const byId = (id) => document.getElementById(id);

const state = newState();
const MAX_ALLIES = 2;

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

function setTurn(turn) {
  state.turn = turn; // "town" | "player" | "enemy"
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

  if (state.inBattle) {
    const allies = ensureAllies();
    allies.forEach((ally) => {
      if (!ally || ally.hp <= 0 || !state.enemy) return;
      const dmg = calcDamage(ally.atk, state.enemy.def, 2, false);
      state.enemy.hp = clamp(state.enemy.hp - dmg, 0, state.enemy.maxHp);
      addLog("ALLY", `${ally.name} menyerang! Damage ${dmg}.`);
    });
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

function dodge(){
  setTurn("player");
  state.playerDodging = true;
  addLog("YOU","Dodge! Chance menghindar meningkat (1 turn).");
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
  state.playerDodging = false;
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
  state.playerDodging = false;
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

  // Town
  byId("btnExplore").onclick = explore;
  const br=byId("btnRest"); if(br) br.onclick = rest;
  byId("btnInventory").onclick = openInventoryReadOnly;
  const btnRecruit = byId("btnRecruit");
  if (btnRecruit) btnRecruit.onclick = openRecruitModal;
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
  if (payload?.player) {
    state.player = payload.player;
    ensureAllies();
    state.enemy = null;
    state.inBattle = false;
    state.playerDefending = false;
  state.playerDodging = false;
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
  state.playerDodging = false;
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
