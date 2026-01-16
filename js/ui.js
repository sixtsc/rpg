import { clamp } from "./engine.js";

const $ = (id) => document.getElementById(id);
let toastTimer;

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function setDisplay(id, value) {
  const el = $(id);
  if (el) el.style.display = value;
}

function showToast(message, tone) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("good", "warn", "danger");
  if (tone) toast.classList.add(tone);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
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

export function addLog(tag, msg) {
  const logEl = $("log");
  if (!logEl) {
    const tone = tag === "LOSE" ? "danger" : tag === "WIN" ? "good" : undefined;
    showToast(`${tag ? `[${tag}] ` : ""}${msg}`, tone);
    return;
  }
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

export function setBar(el, cur, max) {
  if (!el) return;
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

export const modal = {
  open(title, choices, onPick) {
    setText("modalTitle", title);

    const body = $("modalBody");
    if (!body) return;
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

    setDisplay("modalBackdrop", "flex");
    const backdrop = $("modalBackdrop");
    if (!backdrop) return;
    backdrop.onclick = (e) => {
      if (e.target.id === "modalBackdrop") modal.close();
    };
  },

  close() {
    setDisplay("modalBackdrop", "none");
  },

  bind() {
    const closeBtn = $("modalClose");
    if (closeBtn) closeBtn.onclick = () => modal.close();
    const c = $("modalCancel"); if (c) c.onclick = () => modal.close();
  },
};

// TURN INDICATOR: state.turn = "player" | "enemy" | "town"
export function refresh(state) {
  const p = state.player;
  const inBattle = state.inBattle && state.enemy;

  document.body.classList.toggle("inBattle", inBattle);
  document.body.classList.toggle("inTown", !inBattle);

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

  setText("pLvl", `Lv${p.level}`);
  setText("goldPill", `Gold: ${p.gold}`);

  // Player bars
  setText("hpText", `${p.hp}/${p.maxHp}`);
  setText("mpText", `${p.mp}/${p.maxMp}`);
  setText("xpText", `${p.xp}/${p.xpToLevel}`);

  setBar($("hpBar"), p.hp, p.maxHp);
  setBar($("mpBar"), p.mp, p.maxMp);
  setBar($("xpBar"), p.xp, p.xpToLevel);

  const turnLabel = inBattle && state.enemy
    ? (state.turn === "enemy" ? "Turn: Musuh" : "Turn: Kamu")
    : "Town";

  setText("actionHint", turnLabel);
  setText("battleHint", inBattle ? `Turn: ${Math.max(1, state.battleTurn || 0)}` : "Explore untuk cari musuh");
  setText("turnCount", `Turn: ${Math.max(1, state.battleTurn || 0)}`);
  setDisplay("actionCard", "block");

  if (inBattle) {
    const e = state.enemy;

    setText("modePill", "Battle");

    // Enemy title + name
    const eNameTitle = $("eNameTitle");
    if (eNameTitle) eNameTitle.textContent = e.name;

    const eSub = $("eSub");
    if (eSub) { eSub.textContent = ""; eSub.style.display = "none"; }

    setText("eLvl", `Lv${e.level}`);

    // Enemy bars
    setDisplay("enemyBars", "grid");
    setText("eHpText", `${e.hp}/${e.maxHp}`);
    setText("eMpText", `${e.mp}/${e.maxMp}`);
    setBar($("eHpBar"), e.hp, e.maxHp);
    setBar($("eMpBar"), e.mp, e.maxMp);

    // Buttons visibility
    setDisplay("townBtns", "none");
    setDisplay("battleBtns", "flex");

    const enemyBtns = $("enemyBtns");
    if (enemyBtns) enemyBtns.style.display = "flex";
  } else {
    setText("modePill", "Town");

    const eNameTitle = $("eNameTitle");
    if (eNameTitle) eNameTitle.textContent = "-";

    const eSub = $("eSub");
    if (eSub) { eSub.textContent = ""; eSub.style.display = "none"; }

    setText("eLvl", "-");
    setDisplay("enemyBars", "none");

    setDisplay("townBtns", "flex");
    setDisplay("battleBtns", "none");

    const enemyBtns = $("enemyBtns");
    if (enemyBtns) enemyBtns.style.display = "none";
  }

  const metaEl = $("meta");
  if (metaEl) metaEl.textContent = "";

  renderAllyRow(state);
}
