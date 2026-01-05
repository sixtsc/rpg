import { clamp } from "./engine.js";

const $ = (id) => document.getElementById(id);

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

export function addLog() {}

export function setBar(el, cur, max) {
  const pct = max <= 0 ? 0 : (cur / max) * 100;
  el.style.width = `${clamp(pct, 0, 100)}%`;
}

export const modal = {
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
  },

  bind() {
    $("modalClose").onclick = () => modal.close();
    const c = $("modalCancel"); if (c) c.onclick = () => modal.close();
  },
};

// TURN INDICATOR: state.turn = "player" | "enemy" | "town"
export function refresh(state) {
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

  // Player title + name
  const pNameTitle = $("pNameTitle");
  if (pNameTitle) pNameTitle.textContent = p.name;

  const pSub = $("pSub");
  if (pSub) { pSub.textContent = ""; pSub.style.display = "none"; }

  $("pLvl").textContent = `Lv${p.level}`;
  $("goldPill").textContent = `Gold: ${p.gold}`;

  // Player bars
  $("hpText").textContent = `${p.hp}/${p.maxHp}`;
  $("mpText").textContent = `${p.mp}/${p.maxMp}`;
  $("xpText").textContent = `${p.xp}/${p.xpToLevel}`;

  setBar($("hpBar"), p.hp, p.maxHp);
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
    $("battleBtns").style.display = "flex";

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

}
