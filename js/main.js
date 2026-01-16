import { newState, newPlayer, normalizePlayer } from "./state.js";
import {
  genEnemy,
  resolveAttack,
  escapeChance,
  randInt,
  clamp,
  STAT_POINTS_PER_LEVEL,
  MAX_LEVEL,
  MAX_CHAR_SLOTS,
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
import { addLog, refresh, modal, playCritShake, playDodgeFade, escapeHtml } from "./ui.js";

window.__APP_BOOTED__ = true;

const byId = (id) => document.getElementById(id);
const onClick = (id, handler) => {
  const el = byId(id);
  if (el) el.onclick = handler;
};

const state = newState();
const clearLog = () => {
  const logEl = byId("log");
  if (logEl) logEl.innerHTML = "";
};

/* ----------------------------- Core helpers ----------------------------- */

function setTurn(turn) {
  const prev = state.turn;
  state.turn = turn;

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

  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp;

  if (state.player && Array.isArray(state.player.skills)) {
    state.player.skills.forEach((s) => { if (s) s.cdLeft = 0; });
  }

  autosave(state);

  (async () => {
    try {
      const r = await cloudTrySaveCurrentProfile(state);
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

  p.maxHp += 10;
  p.maxMp += 5;
  p.atk += 1;

  p.hp = p.maxHp;
  p.mp = p.maxMp;

  p.xpToLevel = Math.floor(p.xpToLevel * 1.25);

  const dhp = p.maxHp - prevMaxHp;
  const dmp = p.maxMp - prevMaxMp;
  addLog("LEVEL", `Naik ke Lv${p.level}! HP/MP Meningkat +${dhp}/+${dmp}. +${STAT_POINTS_PER_LEVEL} Stat Points.`);
}

function gainXp(amount) {
  const p = state.player;

  addLog("XP", `+${amount} XP`);
  p.xp += amount;

  while (p.level < MAX_LEVEL && p.xp >= p.xpToLevel) {
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
  alert("Kamu kalah... Game Over.\nKamu bisa ganti karakter atau buat karakter baru.");
  endBattle("Kembali ke Town.");
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

  setTurn("enemy");
  refresh(state);

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
    setTimeout(() => {
      enemyTurn();
      refresh(state);
    }, 450);
    return;
  }

  state.battleTurn = (state.battleTurn || 0) + 1;
  setTurn("player");
  addLog("TURN", "Kamu lebih cepat!");

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

  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp;

  autosave(state);

  (async () => {
    try {
      const r = await cloudTrySaveCurrentProfile(state);
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

function applyAttributeDelta(statKey, delta) {
  const p = state.player;
  if (!p) return false;

  p.statPoints = (p.statPoints || 0);

  const key = String(statKey || "").toLowerCase();

  if (delta > 0 && p.statPoints < delta) return false;
  if (delta < 0 && (p[key] || 0) < (-delta)) return false;

  p[key] = (p[key] || 0) + delta;
  p.statPoints -= delta;

  if (key === "str") {
    p.atk = (p.atk || 0) + (2 * delta);
    p.combustionChance = clamp((p.combustionChance || 0) + (3 * delta), 0, 100);
  }
  if (key === "dex") {
    p.evasion = clamp((p.evasion || 0) + (1 * delta), 0, 100);
    p.acc = Math.max(0, (p.acc || 0) + (2 * delta));
    p.spd = Math.max(0, (p.spd || 0) + (1 * delta));
  }
  if (key === "int") {
    p.maxMp = Math.max(0, (p.maxMp || 0) + (5 * delta));
    p.mp = clamp((p.mp || 0) + (5 * delta), 0, p.maxMp);
  }
  if (key === "vit") {
    p.maxHp = Math.max(1, (p.maxHp || 1) + (8 * delta));
    p.hp = clamp((p.hp || 0) + (8 * delta), 0, p.maxHp);
    p.def = Math.max(0, (p.def || 0) + (2 * delta));
  }
  if (key === "foc") {
    p.critChance = clamp((p.critChance || 0) + (2 * delta), 0, 100);
    p.critDamage = Math.max(0, (p.critDamage || 0) + (5 * delta));
  }

  p.atk = Math.max(0, p.atk || 0);
  p.def = Math.max(0, p.def || 0);
  p.spd = Math.max(0, p.spd || 0);
  p.critDamage = Math.max(0, p.critDamage || 0);
  p.combustionChance = clamp(p.combustionChance || 0, 0, 100);
  p.statPoints = Math.max(0, p.statPoints || 0);

  if (Array.isArray(state.slots)) state.slots[state.activeSlot] = p;

  autosave(state);
  (async () => { try { await cloudTrySaveCurrentProfile(state); } catch (e) {} })();
  refresh(state);

  return true;
}

function openProfileModal() {
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
      mk("str", "STR", "Meningkatkan ATK dan Combustion Chance (DMG x2 - x2.5)"),
      mk("dex", "DEX", "Meningkatkan Evasion, Accuracy, dan SPD"),
      mk("int", "INT", "Meningkatkan MP"),
      mk("vit", "VIT", "Meningkatkan HP dan DEF"),
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
      if (!ok) {
        openProfileModal();
        return;
      }
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
      { title: `ATK : ${e.atk}`, desc: "", meta: "" },
      { title: `DEF : ${e.def}`, desc: "", meta: "" },
      { title: `SPD : ${e.spd}`, desc: "", meta: "" },
      { title: `ACC : ${e.acc || 0}`, desc: "", meta: "" },
      { title: `FOC : ${e.foc || 0}`, desc: "", meta: "" },
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
      { title: `Lv ${p.level}`, desc: "", meta: "", className: "xpRow", style: `--xp:${xpPct}%` },
      { title: `ATK : ${p.atk}`, desc: "", meta: "" },
      { title: `DEF : ${p.def}`, desc: "", meta: "" },
      { title: `SPD : ${p.spd}`, desc: "", meta: "" },
      { title: `ACC : ${p.acc || 0}`, desc: "", meta: "" },
      { title: `FOC : ${p.foc || 0}`, desc: "", meta: "" },
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

function openTownMenu() {
  if (state.inBattle) return;

  modal.open(
    "Menu",
    [
      { title: "Load Cloud", desc: "Load progress dari cloud.", meta: "", value: "cloud_load" },
      { title: "Save Cloud", desc: "Save progress ke cloud.", meta: "", value: "cloud_save" },
      { title: "Ganti Karakter", desc: "Pilih slot karakter lain.", meta: "", value: "switch_char" },
      { title: "Log out", desc: "Keluar dari akun cloud dan kembali ke halaman login.", meta: "", value: "logout", className: "danger" },
    ],
    (pick) => {
      if (pick === "cloud_save") {
        (async () => {
          try {
            const r = await cloudTrySaveCurrentProfile(state);
            if (r.skipped && r.reason === "unauth") {
              addLog("WARN", "Belum login cloud. Silakan login dulu.");
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

                clearLog();
                addLog("LOAD", "Cloud dimuat. Pilih karakter.");

                autosave(state);
                openCharacterMenu("Cloud berhasil dimuat. Pilih karakter.");
                refresh(state);
                return;
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
        autosave(state);
        (async () => { try { await cloudTrySaveCurrentProfile(state); } catch (e) {} })();
        openCharacterMenu("Pilih karakter yang akan dimainkan.");
        return;
      }

      if (pick === "logout") {
        (async () => {
          try { await cloudLogout(); } catch (e) {}
          showCharCreate(false);
          showCharMenu(false);
          showAuth(true);
          setAuthMsg("Kamu sudah logout. Silakan login lagi.", false);
        })();
      }
    }
  );
}

/* --------------------------------- Bind -------------------------------- */

function bind() {
  modal.bind();

  onClick("btnExplore", explore);
  onClick("btnRest", rest);
  onClick("btnInventory", openInventoryReadOnly);
  onClick("btnStats", openStatsModal);
  onClick("btnRecruit", () => addLog("INFO", "Recruit (coming soon)."));
  onClick("btnStatsBattle", openStatsModal);
  onClick("btnEnemyStats", openEnemyStatsModal);
  onClick("btnMenu", openTownMenu);
  onClick("btnProfile", openProfileModal);
  onClick("btnShop", () => addLog("INFO", "Shop (coming soon)."));

  onClick("ccCreate", handleCreateCharacter);
  onClick("ccCancel", cancelCreateCharacter);

  onClick("btnAttack", () => {
    if (!state.inBattle || state.turn !== "player") return;
    attack();
    afterPlayerAction();
  });

  onClick("btnDefend", () => {
    if (!state.inBattle || state.turn !== "player") return;
    dodge();
    afterPlayerAction();
  });

  onClick("btnRun", () => {
    if (!state.inBattle || state.turn !== "player") return;
    const ok = runAway();
    if (!ok) afterPlayerAction();
  });

  onClick("btnSkill", () => {
    if (!state.inBattle || state.turn !== "player") return;
    openSkillModal();
  });

  onClick("btnItem", () => {
    if (!state.inBattle || state.turn !== "player") return;
    openItemModal();
  });
}

/* --------------------------------- Boot -------------------------------- */

function applyLoaded(payload) {
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

function startNewGame(slotIdx) {
  const idx = clamp(
    (typeof slotIdx === "number" ? slotIdx : (state.activeSlot || 0)),
    0,
    MAX_CHAR_SLOTS - 1
  );

  const prev = (state.slots && state.slots[idx]) ? state.slots[idx] : state.player;

  const p = normalizePlayer(newPlayer());
  if (prev) {
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

  clearLog();
  addLog("INFO", "Game baru dimulai (slot di-reset)." );

  autosave(state);

  (async () => {
    try { await cloudTrySaveCurrentProfile(state); } catch (e) {}
  })();

  refresh(state);
}

function showOverlay(id, show) {
  const el = byId(id);
  if (!el) return;
  el.classList.toggle("hidden", !show);
}

function showMenu(show) { showOverlay("mainMenu", show); }
function showAuth(show) { showOverlay("mainMenu", show); }
function showCharMenu(show) { showOverlay("charMenu", show); }
function showCharCreate(show) { showOverlay("charCreateMenu", show); }

function setAuthMsg(msg, isError = false) {
  const el = byId("authMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.opacity = "1";
  el.style.color = isError ? "#ffb4b4" : "";
}

let pendingCreateSlot = 0;

function setCharMsg(msg, isError = false) {
  const el = byId("charMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = isError ? "#ffb4b4" : "";
}
function setCcMsg(msg, isError = false) {
  const el = byId("ccMsg");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = isError ? "#ffb4b4" : "";
}

function genderLabel(g) {
  const v = String(g || "other").toLowerCase();
  if (v === "male") return "Male";
  if (v === "female") return "Female";
  return "Other";
}

function renderCharacterSlots() {
  const wrap = byId("charSlots");
  if (!wrap) return;

  wrap.innerHTML = "";

  for (let i = 0; i < MAX_CHAR_SLOTS; i++) {
    const slot = state.slots && state.slots[i] ? state.slots[i] : null;

    const item = document.createElement("div");
    item.className = "charSlotWrap";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "charSlot" + (i === state.activeSlot ? " active" : "");

    const actions = document.createElement("div");
    actions.className = "charSlotActions";

    if (slot) {
      btn.innerHTML = `
        <div class="charSlotTop">
          <span class="charName">${escapeHtml(slot.name || "Hero")}</span>
          <span class="pill muted">Lv${slot.level || 1}</span>
        </div>
        <div class="charSlotSub">${escapeHtml(genderLabel(slot.gender))}</div>
      `;
      btn.onclick = () => enterTownWithSlot(i);

      const bNew = document.createElement("button");
      bNew.type = "button";
      bNew.className = "charSlotMini";
      bNew.textContent = "New";
      bNew.onclick = (ev) => {
        ev.stopPropagation();
        if (!confirm(`Buat karakter baru untuk overwrite Slot #${i + 1}?`)) return;
        openCreateCharacter(i, true);
      };

      const bDel = document.createElement("button");
      bDel.type = "button";
      bDel.className = "charSlotMini danger";
      bDel.textContent = "Hapus";
      bDel.onclick = (ev) => {
        ev.stopPropagation();
        deleteCharacter(i);
      };

      actions.appendChild(bNew);
      actions.appendChild(bDel);
    } else {
      btn.innerHTML = `
        <div class="charSlotTop">
          <span class="charName muted">Empty Slot</span>
          <span class="pill muted">#${i + 1}</span>
        </div>
        <div class="charSlotSub">Buat karakter baru</div>
      `;
      btn.onclick = () => openCreateCharacter(i, false);

      const spacer = document.createElement("button");
      spacer.type = "button";
      spacer.className = "charSlotMini";
      spacer.textContent = "—";
      spacer.disabled = true;
      actions.appendChild(spacer);
    }

    item.appendChild(btn);
    item.appendChild(actions);
    wrap.appendChild(item);
  }
}

function openCharacterMenu(msg = "") {
  renderCharacterSlots();
  setCharMsg(msg || "Pilih karakter atau buat baru.");
  showCharMenu(true);
  showCharCreate(false);
}

function openCreateCharacter(slotIdx, overwrite = false) {
  pendingCreateSlot = clamp(slotIdx || 0, 0, MAX_CHAR_SLOTS - 1);

  const sub = byId("ccSub");
  if (sub) sub.textContent = `Slot #${pendingCreateSlot + 1}`;

  const slot = (state.slots && state.slots[pendingCreateSlot]) ? state.slots[pendingCreateSlot] : null;

  const nameEl = byId("ccName");
  const genderEl = byId("ccGender");

  if (nameEl) nameEl.value = (overwrite && slot && slot.name) ? String(slot.name) : "";
  if (genderEl) genderEl.value = (overwrite && slot && slot.gender) ? String(slot.gender) : "male";

  setCcMsg(overwrite ? "Overwrite karakter: isi nama/gender baru." : "Isi nama dan gender.");
  showCharMenu(false);
  showCharCreate(true);
}

function cancelCreateCharacter() {
  showCharCreate(false);
  showCharMenu(true);
  setCcMsg("");
}

function deleteCharacter(slotIdx) {
  const idx = clamp(slotIdx || 0, 0, MAX_CHAR_SLOTS - 1);
  const slot = state.slots && state.slots[idx] ? state.slots[idx] : null;
  if (!slot) return;

  const nm = slot.name || `Slot #${idx + 1}`;
  if (!confirm(`Hapus karakter "${nm}"? (Slot #${idx + 1})`)) return;

  state.slots[idx] = null;

  if (idx === state.activeSlot) {
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
  (async () => { try { await cloudTrySaveCurrentProfile(state); } catch (e) {} })();

  renderCharacterSlots();
  setCharMsg("Karakter dihapus.", false);
  showCharMenu(true);
  showCharCreate(false);
  refresh(state);
}

function handleCreateCharacter() {
  const nameEl = byId("ccName");
  const genderEl = byId("ccGender");
  const name = (nameEl?.value || "").toString().trim();
  const gender = (genderEl?.value || "other").toString();

  if (!name) {
    setCcMsg("Nama tidak boleh kosong.", true);
    return;
  }

  const p = normalizePlayer(newPlayer());
  p.name = name;
  p.gender = gender;

  state.slots[pendingCreateSlot] = p;
  state.activeSlot = pendingCreateSlot;
  state.player = p;

  state.enemy = null;
  state.inBattle = false;
  state.playerDefending = false;
  state.playerDodging = false;
  setTurn("town");
  state.battleTurn = 0;

  clearLog();
  addLog("INFO", `Karakter dibuat: ${p.name} (${genderLabel(p.gender)})`);
  autosave(state);

  (async () => {
    try { await cloudTrySaveCurrentProfile(state); } catch (e) {}
  })();

  showCharCreate(false);
  showCharMenu(false);
  refresh(state);
}

function enterTownWithSlot(slotIdx) {
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

  clearLog();
  addLog("INFO", `Masuk sebagai ${state.player.name} (Lv${state.player.level}).`);

  autosave(state);

  (async () => {
    try { await cloudTrySaveCurrentProfile(state); } catch (e) {}
  })();

  showCharCreate(false);
  showCharMenu(false);
  refresh(state);
}

async function syncCloudOrLocalAndShowCharacterMenu() {
  let profile = null;
  let cloudHadSave = false;

  try {
    const me = await ensureCloudUser();
    if (me) {
      setAuthMsg("Memuat cloud save...", false);
      const cloud = await cloudLoadPayload();

      if (cloud.ok && cloud.data && cloud.data.hasSave && cloud.data.data) {
        cloudHadSave = true;
        const raw = cloud.data.data;
        const payload = (typeof raw === "string") ? JSON.parse(raw) : raw;
        profile = normalizeProfilePayload(payload);
      }
    }
  } catch (e) {
    console.error("[CLOUD LOAD] error", e);
  }

  const local = load();
  if (!profile && local) {
    profile = normalizeProfilePayload(local);

    try {
      const me = await ensureCloudUser();
      if (me && !cloudHadSave) {
        setAuthMsg("Cloud kosong. Upload save lokal ke cloud...", false);
        await cloudSavePayload(profile);
        addLog("CLOUD", "Save lokal berhasil di-upload ke cloud.");
      }
    } catch (e) {
      console.error("[CLOUD UPLOAD] error", e);
    }
  }

  if (!profile) profile = emptyProfilePayload();

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

  clearLog();
  refresh(state);

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

  showMenu(true);

  const getCreds = () => {
    const username = (userEl?.value || "").toString().trim().toLowerCase();
    const password = (passEl?.value || "").toString();
    return { username, password };
  };

  const doLogin = async () => {
    const { username, password } = getCreds();
    if (!username || !password) {
      setAuthMsg("Isi username & password dulu.", true);
      return;
    }

    setAuthMsg("Login...", false);

    const { res, data } = await apiJson("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      setAuthMsg(data?.message || "Login gagal.", true);
      return;
    }

    await ensureCloudUser();

    await syncCloudOrLocalAndShowCharacterMenu();
  };

  const doRegister = async () => {
    const { username, password } = getCreds();
    if (!username || !password) {
      setAuthMsg("Isi username & password dulu.", true);
      return;
    }

    setAuthMsg("Register...", false);

    const { res, data } = await apiJson("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      setAuthMsg(data?.message || "Register gagal.", true);
      return;
    }

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

  if (passEl) {
    passEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });
  }

  (async () => {
    try {
      setAuthMsg("Cek login...", false);
      const me = await ensureCloudUser();
      if (me) {
        setAuthMsg("Login terdeteksi. Memuat save...", false);
        await syncCloudOrLocalAndShowCharacterMenu();
      } else {
        setAuthMsg("Silakan login / register untuk cloud save.", false);
      }
    } catch (e) {
      console.error("[AUTH INIT] error", e);
      setAuthMsg("Gagal cek session. Silakan login.", true);
    }
  })();

  refresh(state);
})();
