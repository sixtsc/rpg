import { clamp, resolveAttack, MAX_LEVEL } from "./engine.js";

const $ = (id) => document.getElementById(id);
const getState = () => window.__GAME_STATE__;
const getApi = () => window.__GAME_API__ || {};

export function playCritShake(target) {
  const el = $(target === "player" ? "pAvatarBox" : "eAvatarBox");
  if (!el) return;
  el.classList.remove("critShake");
  void el.offsetWidth;
  el.classList.add("critShake");
  setTimeout(() => el.classList.remove("critShake"), 450);
}

export function playDodgeFade(target) {
  const el = $(target === "player" ? "pAvatarBox" : "eAvatarBox");
  if (!el) return;
  el.classList.remove("dodgeFade");
  void el.offsetWidth;
  el.classList.add("dodgeFade");
  setTimeout(() => el.classList.remove("dodgeFade"), 450);
}

export function playSlash(target, delay = 0) {
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

export function timeStr() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function escapeHtml(s) {
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

export function addLog(tag, msg) {
  if (tag !== "SKILL") return;
  showToast(msg, tag);
}

export function showBattleResultOverlay(summary, onClose) {
  const backdrop = $("battleResultBackdrop");
  if (!backdrop) return;
  $("battleResultTitle").textContent = summary.outcome === "win" ? "Victory" : "Defeat";
  $("battleResultEnemy").textContent = summary.enemyName ? `Vs ${summary.enemyName}` : "";
  $("battleResultGold").textContent = `Gold +${summary.gold || 0}`;
  $("battleResultXp").textContent = `XP +${summary.xp || 0}`;

  const dropEl = $("battleResultDrops");
  const drops = Array.isArray(summary.drops) ? summary.drops : [];
  if (!drops.length) {
    dropEl.textContent = "Drop: -";
  } else {
    dropEl.textContent = `Drop: ${drops.map((d) => `${d.name} x${d.qty || 1}`).join(", ")}`;
  }

  backdrop.style.display = "flex";
  const btn = $("battleResultClose");
  if (btn) {
    btn.onclick = () => {
      backdrop.style.display = "none";
      if (onClose) onClose();
    };
  }
}

function getSkillByName(player, name) {
  if (!player || !Array.isArray(player.skills) || !name) return null;
  return player.skills.find((s) => s && s.name === name) || null;
}

function skillIconHtml(skill) {
  if (!skill || !skill.icon) return "";
  return `<span class="skillIconWrap"><img class="skillIcon" src="${escapeHtml(skill.icon)}" alt="" /></span>`;
}

function normalizeEnemyQueue() {
  const state = getState();
  if (!Array.isArray(state?.enemyQueue)) return [];
  state.enemyQueue = state.enemyQueue.filter((enemy) => enemy && enemy.hp > 0);
  return state.enemyQueue;
}

function setActiveEnemyByIndex(index) {
  const state = getState();
  const queue = normalizeEnemyQueue();
  if (!queue.length) return false;
  const idx = clamp(index, 0, queue.length - 1);
  state.enemy = queue[idx];
  state.enemyTargetIndex = idx;
  return true;
}

function renderAllyRow() {
  const state = getState();
  const row = $("allyRow");
  if (!row) return;
  const allies = Array.isArray(state?.allies) ? state.allies : [];
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
      nameEl.textContent = ally.name || `NPC ${slotIndex}`;
      lvlEl.textContent = `Lv${ally.level || 1}`;
      subEl.textContent = ally.role || "Partner";
      hpText.textContent = `${ally.hp}/${ally.maxHp}`;
      mpText.textContent = `${ally.mp}/${ally.maxMp}`;
      setBar(hpBar, ally.hp, ally.maxHp);
      setBar(mpBar, ally.mp, ally.maxMp);
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

function renderEnemyRow() {
  const state = getState();
  const row = $("enemyRow");
  if (!row) return;
  row.querySelectorAll(".enemyCard.extra").forEach((el) => el.remove());

  const queue = Array.isArray(state?.enemyQueue) && state.enemyQueue.length
    ? normalizeEnemyQueue()
    : (state?.enemy ? [state.enemy] : []);

  const activeEnemy = state?.enemy;
  queue.slice(1, 3).forEach((enemy, offset) => {
    const card = document.createElement("div");
    card.className = "card enemyCard extra";
    const hpPct = enemy.maxHp ? clamp((enemy.hp / enemy.maxHp) * 100, 0, 100) : 0;
    if (enemy === activeEnemy) card.classList.add("active");
    card.innerHTML = `
      <div class="sectionTitle">
        <div><b>${escapeHtml(enemy.name)}</b> <span class="pill">Lv${enemy.level}</span></div>
      </div>
      <div class="enemyMiniMeta">
        <div class="bar"><div class="fill hp" style="width:${hpPct}%"></div></div>
        <div class="muted">${enemy.hp}/${enemy.maxHp}</div>
      </div>
    `;
    const targetIndex = offset + 1;
    card.onclick = () => {
      if (setActiveEnemyByIndex(targetIndex)) {
        addLog("TARGET", `Target: ${enemy.name}`);
        refresh(state);
      }
    };
    row.appendChild(card);
  });
}

const damageTimers = { player: null, enemy: null };
function showDamageText(target, text) {
  const el = $(target === "player" ? "playerDamage" : "enemyDamage");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  if (damageTimers[target]) clearTimeout(damageTimers[target]);
  damageTimers[target] = setTimeout(() => {
    el.classList.remove("show");
  }, 1400);
}

function formatDamageText(res, dmg) {
  if (!res || res.missed) return "MISS";
  const tags = [];
  if (res.crit) tags.push("CRIT");
  if (res.combustion) tags.push("COMBUST");
  if (res.blocked > 0) tags.push("BLOCK");
  const base = dmg > 0 ? `-${dmg}` : "0";
  return tags.length ? `${base} (${tags.join(" ")})` : base;
}

function renderSkillSlots() {
  const state = getState();
  const grid = $("skillSlots");
  if (!grid || !state?.player) return;
  const p = state.player;
  if (!Array.isArray(p.skillSlots)) {
    p.skillSlots = Array.from({ length: 8 }, () => null);
  }
  const slots = Array.from({ length: 8 });
  slots.forEach((_, i) => {
    let btn = grid.querySelector(`[data-slot="${i}"]`);
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "skillSlot";
      btn.setAttribute("data-slot", `${i}`);
      grid.appendChild(btn);
    }
    const slotName = p.skillSlots ? p.skillSlots[i] : null;
    const skill = slotName ? getSkillByName(p, slotName) : null;
    if (skill) {
      const cdLeft = skill.cdLeft || 0;
      const icon = skillIconHtml(skill);
      const cdBadge = cdLeft > 0 ? `<span class="skillCooldown">${cdLeft}</span>` : "";
      btn.innerHTML = `${icon}${cdBadge}`;
      btn.disabled = (state.turn !== "player") || p.mp < skill.mpCost || cdLeft > 0;
      btn.classList.toggle("cooldown", cdLeft > 0);
      btn.onclick = () => useSkillAtIndex(i);
    } else {
      btn.textContent = "-";
      btn.disabled = true;
      btn.onclick = null;
    }
  });
}

function useSkillAtIndex(idx) {
  const state = getState();
  const api = getApi();
  const p = state?.player;
  const e = state?.enemy;
  if (!p || !e || !Array.isArray(p.skills)) return;
  const slotName = p.skillSlots ? p.skillSlots[idx] : null;
  const s = slotName ? getSkillByName(p, slotName) : null;
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

  addLog("SKILL", s.name);
  const res = resolveAttack(p, e, s.power);
  if (res.missed) {
    playDodgeFade("enemy");
    showDamageText("enemy", "MISS");
  } else {
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
  }

  s.cdLeft = s.cooldown || 0;
  if (p.hp <= 0) {
    if (api.loseBattle) api.loseBattle();
    return;
  }

  if (api.afterPlayerAction) api.afterPlayerAction();
}

function statusLabel(entity) {
  if (!entity || !Array.isArray(entity.statuses)) return "";
  const active = entity.statuses.filter((s) => (s.turns || 0) > 0);
  if (!active.length) return "";
  return active
    .map((s) => `${(s.type || "Effect").toUpperCase()} (${s.turns} turn${s.turns > 1 ? "s" : ""})`)
    .join(" • ");
}

export function setBar(el, cur, max) {
  const pctRaw = max <= 0 ? 0 : (cur / max) * 100;
  const pct = clamp(pctRaw, 0, 100);

  el.style.width = `${pct}%`;

  if (el.classList && el.classList.contains("xp")) return;

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
    loss.style.transition = "none";
    loss.style.width = `${prev}%`;
    loss.style.opacity = "0.9";

    requestAnimationFrame(() => {
      loss.style.transition = "width 420ms ease-out, opacity 650ms ease-out";
      loss.style.width = `${pct}%`;
      setTimeout(() => {
        loss.style.opacity = "0";
      }, 420);
    });
  } else {
    loss.style.transition = "none";
    loss.style.width = `${pct}%`;
    loss.style.opacity = "0";
  }

  bar.dataset.prevPct = `${pct}`;
}

export const modal = {
  open(title, choices, onPick) {
    $("modalTitle").textContent = title;

    const meta = $("modalMeta");
    if (meta) {
      const lowerTitle = String(title || "").toLowerCase();
      const showCurrency = lowerTitle.includes("shop") || lowerTitle.includes("market") || lowerTitle.includes("inventory");
      if (showCurrency) {
        const gold = getState()?.player?.gold ?? 0;
        meta.innerHTML = `<img class="currencyIcon" src="./assets/icons/coin.svg" alt="" /><span>Gold ${gold}</span>`;
        meta.style.display = "inline-flex";
      } else {
        meta.textContent = "";
        meta.style.display = "none";
      }
    }

    const body = $("modalBody");
    body.innerHTML = "";

    const backBtn = $("modalBack");
    let backChoice = null;
    if (Array.isArray(choices)) {
      backChoice = choices.find((c) => c && c.value === "back") || null;
      if (backChoice) {
        choices = choices.filter((c) => c !== backChoice);
      }
    }
    if (backBtn) {
      backBtn.style.display = backChoice ? "inline-flex" : "none";
      backBtn.onclick = backChoice
        ? () => onPick("back")
        : null;
    }

    body.classList.remove("statsGrid", "marketGrid", "equipmentGrid", "marketSubCompact");
    const lowerTitle = String(title).toLowerCase();
    if (lowerTitle.includes("stats")) body.classList.add("statsGrid");
    if (lowerTitle.includes("market") || lowerTitle.includes("inventory")) body.classList.add("marketGrid");
    if (lowerTitle.includes("equipment")) body.classList.add("equipmentGrid");
    if (choices.some((c) => String(c.className || "").includes("marketSub"))) {
      body.classList.add("marketSubCompact");
    }

    choices.forEach((c) => {
      const row = document.createElement("div");
      row.className = "choice";

      if (c.className) row.classList.add(...String(c.className).split(/\s+/).filter(Boolean));
      if (c.style) row.style.cssText += String(c.style);

      const left = document.createElement("div");
      const iconHtml = c.icon ? `<span class="skillIconWrap"><img class="skillIcon" src="${escapeHtml(c.icon)}" alt="" /></span>` : "";
      const descHtml = c.descHtml ? String(c.descHtml) : escapeHtml(c.desc || "");
      left.innerHTML = `
        <div class="titleRow">${iconHtml}<b>${escapeHtml(c.title)}</b></div>
        <div class="desc">${descHtml}</div>
      `;

      const right = document.createElement("div");
      right.className = "right muted";

      if (Array.isArray(c.buttons) && c.buttons.length) {
        right.classList.add("btnGroup");
        right.innerHTML = c.buttons.map((b) => {
          const dis = b.disabled ? "disabled" : "";
          const cls = ["miniBtn", b.className || ""].join(" ").trim();
          return `<button type="button" class="${escapeHtml(cls)}" data-v="${escapeHtml(String(b.value))}" ${dis}>${escapeHtml(b.text)}</button>`;
        }).join("");
      } else {
        right.textContent = c.meta || "";
      }

      row.appendChild(left);
      row.appendChild(right);

      if (c.value !== undefined && (!(Array.isArray(c.buttons) && c.buttons.length) || c.allowClick)) {
        row.onclick = () => {
          if (!c.keepOpen) modal.close();
          onPick(c.value);
        };
      } else {
        row.classList.add("readonly");
      }

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
    const back = $("modalBack");
    if (back) back.onclick = () => modal.close();
    const c = $("modalCancel");
    if (c) c.onclick = () => modal.close();
  },
};

export function refresh(state) {
  const p = state.player;

  const turnCountEl = $("turnCount");
  if (turnCountEl) {
    turnCountEl.style.display = "none";
    turnCountEl.textContent = "";
  }
  const actionHint = $("actionHint");
  if (actionHint) {
    actionHint.style.display = "none";
    actionHint.textContent = "";
  }
  const battleHintEl = $("battleHint");
  if (battleHintEl) {
    battleHintEl.style.display = "none";
    battleHintEl.textContent = "";
  }

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
    goldPill.textContent = `Gold: ${p.gold}`;
    goldPill.style.display = "none";
  }
  const goldValue = $("goldValue");
  if (goldValue) goldValue.textContent = `${p.gold}`;
  const gemValue = $("gemValue");
  if (gemValue) gemValue.textContent = `${p.gems || 0}`;

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

    const eNameTitle = $("eNameTitle");
    if (eNameTitle) eNameTitle.textContent = e.name;

    const eSub = $("eSub");
    if (eSub) {
      const label = statusLabel(e);
      eSub.textContent = label;
      eSub.style.display = label ? "block" : "none";
    }

    $("eLvl").textContent = `Lv${e.level}`;

    $("enemyBars").style.display = "grid";
    $("eHpText").textContent = `${e.hp}/${e.maxHp}`;
    $("eMpText").textContent = `${e.mp}/${e.maxMp}`;
    setBar($("eHpBar"), e.hp, e.maxHp);
    setBar($("eMpBar"), e.mp, e.maxMp);

    $("townBtns").style.display = "none";
    $("battleBtns").style.display = "flex";
    if (state.battleResult) {
      $("battleBtns").classList.add("disabled");
      $("battleBtns").querySelectorAll("button").forEach((b) => { b.disabled = true; });
    } else {
      $("battleBtns").classList.remove("disabled");
      $("battleBtns").querySelectorAll("button").forEach((b) => { b.disabled = false; });
    }

    const actionCard = $("actionCard");
    if (actionCard) actionCard.style.display = "block";

    const pAv = $("pAvatarWrap");
    if (pAv) pAv.style.display = "flex";
    const eAv = $("eAvatarWrap");
    if (eAv) eAv.style.display = "flex";

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
    const enemyCard = $("enemyCard");
    if (enemyCard) {
      enemyCard.classList.toggle("active", !state.enemyQueue || state.enemyTargetIndex === 0);
      enemyCard.onclick = () => {
        if (setActiveEnemyByIndex(0)) {
          addLog("TARGET", `Target: ${state.enemy?.name || "Musuh"}`);
          refresh(state);
        }
      };
    }
  } else {
    $("modePill").textContent = "Town";

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
    const enemyCard = $("enemyCard");
    if (enemyCard) {
      enemyCard.classList.remove("active");
      enemyCard.onclick = null;
    }
  }
  renderAllyRow();
  renderEnemyRow();
}
