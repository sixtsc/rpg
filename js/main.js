import { newState, newPlayer } from "./state.js";
import { genEnemy, calcDamage, escapeChance, randInt, clamp } from "./engine.js";
import { autosave, save, load } from "./storage.js";
import { addLog, refresh, modal } from "./ui.js";
import { ITEMS } from "./data.js";

const byId = (id) => document.getElementById(id);

const state = newState();

/* ----------------------------- Core helpers ----------------------------- */

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

function rollBattleDrops(){
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
    reward.drops.forEach((d) => rows.push({ title: d.name, desc: d.desc || "Item drop.", meta: `x${d.qty || 1}` }));
  } else {
    rows.push({ title: "Drop", desc: "Tidak ada drop.", meta: "" });
  }

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
    const dmg = calcDamage(e.atk, p.def, 8, state.playerDefending);
    p.hp = clamp(p.hp - dmg, 0, p.maxHp);
    addLog("ENEMY", `${e.name} memakai Rage Strike! Damage ${dmg}.`);
  } else {
    const dmg = calcDamage(e.atk, p.def, 2, state.playerDefending);
    p.hp = clamp(p.hp - dmg, 0, p.maxHp);
    addLog("ENEMY", `${e.name} menyerang! Damage ${dmg}.`);
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

        const logEl = byId("log");
        if (logEl) logEl.innerHTML = "";
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
    state.enemy = null;
    state.inBattle = false;
    state.playerDefending = false;
  state.playerDodging = false;
    setTurn("town");
  state.battleTurn = 0;
    const logEl = byId("log");
    if (logEl) logEl.innerHTML = "";
    addLog("LOAD", "Progress dimuat.");
    refresh(state);
    return true;
  }
  return false;
}

function startNewGame(){
  state.player = newPlayer();
  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  state.playerDodging = false;
  setTurn("town");
  state.battleTurn = 0;
  const logEl = byId("log");
  if (logEl) logEl.innerHTML = "";
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
