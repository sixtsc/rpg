import { clamp } from "./engine.js";

const $ = (id) => document.getElementById(id);

const setText = (id, value) => {
  const el = $(id);
  if (el) el.textContent = value;
};

const setDisplay = (id, value) => {
  const el = $(id);
  if (el) el.style.display = value;
};

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
  if (!logEl) return;
  const div = document.createElement("div");
  div.className = "entry";

  const t = String(tag || "").toUpperCase();
  if (t === "XP" || t === "EXP") div.classList.add("log-xp");
  if (t === "GOLD") div.classList.add("log-gold");

  div.innerHTML = `<span class="tag">${escapeHtml(tag)}</span>${escapeHtml(msg)}<span class="time"> ${timeStr()}</span>`;
  logEl.prepend(div);
  logEl.scrollTop = 0;
}

export function setBar(el, cur, max) {
  if (!el) return;
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

    body.classList.remove("statsGrid");
    if (String(title).toLowerCase().includes("stats")) body.classList.add("statsGrid");

    choices.forEach((c) => {
      const row = document.createElement("div");
      row.className = "choice";

      if (c.className) row.classList.add(...String(c.className).split(/\s+/).filter(Boolean));
      if (c.style) row.style.cssText += String(c.style);

      const left = document.createElement("div");
      left.innerHTML = `
        <b>${escapeHtml(c.title)}</b>
        <div class="desc">${escapeHtml(c.desc || "")}</div>
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

      if (c.value !== undefined && !(Array.isArray(c.buttons) && c.buttons.length)) {
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

    setDisplay("modalBackdrop", "flex");
    const backdrop = $("modalBackdrop");
    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e.target.id === "modalBackdrop") modal.close();
      };
    }
  },

  close() {
    setDisplay("modalBackdrop", "none");
  },

  bind() {
    const closeBtn = $("modalClose");
    if (closeBtn) closeBtn.onclick = () => modal.close();
    const c = $("modalCancel");
    if (c) c.onclick = () => modal.close();
  },
};

export function refresh(state) {
  const p = state.player;
  const inBattle = state.inBattle && state.enemy;

  document.body.classList.toggle("inBattle", !!inBattle);
  document.body.classList.toggle("inTown", !inBattle);

  const btnStatsBattle = $("btnStatsBattle");
  if (btnStatsBattle) {
    btnStatsBattle.textContent = "Stats";
  }
  const btnStatsTown = $("btnStats");
  if (btnStatsTown) {
    btnStatsTown.textContent = "Stats";
  }

  const logHint = $("logHint");
  if (logHint) {
    if (state.inBattle && state.enemy) {
      logHint.style.display = "none";
      logHint.textContent = "";
    } else {
      logHint.style.display = "inline-flex";
      logHint.textContent = "Town";
    }
  }

  const pNameTitle = $("pNameTitle");
  if (pNameTitle) pNameTitle.textContent = p.name;

  const pSub = $("pSub");
  if (pSub) { pSub.textContent = ""; pSub.style.display = "none"; }

  setText("pLvl", `Lv${p.level}`);
  const goldPill = $("goldPill");
  if (goldPill) {
    goldPill.textContent = `Gold: ${p.gold}`;
    goldPill.style.display = "none";
  }
  setText("goldValue", String(p.gold ?? 0));

  setText("hpText", `${p.hp}/${p.maxHp}`);
  setText("mpText", `${p.mp}/${p.maxMp}`);
  setText("xpText", `${p.xp}/${p.xpToLevel}`);

  setBar($("hpBar"), p.hp, p.maxHp);
  setBar($("mpBar"), p.mp, p.maxMp);
  setBar($("xpBar"), p.xp, p.xpToLevel);

  if (inBattle) {
    const e = state.enemy;

    setText("modePill", "Battle");

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

    const eNameTitle = $("eNameTitle");
    if (eNameTitle) eNameTitle.textContent = e.name;

    const eSub = $("eSub");
    if (eSub) { eSub.textContent = ""; eSub.style.display = "none"; }

    setText("eLvl", `Lv${e.level}`);

    setDisplay("enemyBars", "grid");
    setText("eHpText", `${e.hp}/${e.maxHp}`);
    setText("eMpText", `${e.mp}/${e.maxMp}`);
    setBar($("eHpBar"), e.hp, e.maxHp);
    setBar($("eMpBar"), e.mp, e.maxMp);

    setDisplay("townBtns", "none");
    setDisplay("battleBtns", "flex");

    const btnSkill = $("btnSkill");
    if (btnSkill) {
      btnSkill.textContent = "Skill";
      btnSkill.disabled = (state.turn !== "player");
    }

    setDisplay("actionCard", "block");

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
  } else {
    setText("modePill", "Town");

    const battleHintEl = $("battleHint");
    if (battleHintEl) {
      battleHintEl.style.display = "inline-flex";
      battleHintEl.textContent = "Explore untuk cari musuh";
    }

    const turnCountEl = $("turnCount");
    if (turnCountEl) {
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

    setText("eLvl", "-");
    setDisplay("enemyBars", "none");

    setDisplay("townBtns", "flex");
    setDisplay("battleBtns", "none");
    const btnSkill = $("btnSkill");
    if (btnSkill) { btnSkill.disabled = false; btnSkill.textContent = "Skill"; }

    setDisplay("actionCard", "block");

    const pAv = $("pAvatarWrap");
    if (pAv) pAv.style.display = "none";
    const eAv = $("eAvatarWrap");
    if (eAv) eAv.style.display = "none";
    const xpGroup = $("xpGroup");
    if (xpGroup) xpGroup.style.display = "block";

    const enemyBtns = $("enemyBtns");
    if (enemyBtns) enemyBtns.style.display = "none";
  }

  const metaEl = $("meta");
  if (metaEl) metaEl.textContent = "";

  renderAllyRow(state);
}
