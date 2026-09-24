import { ABILITIES } from "../config/abilityConfig.js";
import { t, localizedCardDescription } from "../services/I18n.js";
import { gameIcon } from "./GameIcons.js";
export function upgradeCardsMarkup(run, lang = "en") {
  return `<p class="eyebrow">${t(lang, "cardPending", { level: run.player.level, choices: run.pendingChoices })}</p>
    <h2 id="run-dialog-title">${t(lang, "cardHeading")}</h2>
    <p class="cards-intro">${t(lang, "cardPrompt")}</p>
    <div class="upgrade-cards">${run.cardOffers
      .map((id) => {
        const card = ABILITIES[id],
          level = run.abilities[id],
          chain =
            run.lastCard && run.lastCard !== id
              ? Math.min(3, run.chain + 1)
              : 1;
        const bonus =
          chain > 1
            ? id === "heart"
              ? t(lang, "comboHealth", { heal: 10 * (chain - 1) })
              : t(lang, "comboDamage", { damage: 20 * (chain - 1) })
            : t(lang, "comboStart");
        return `<button class="upgrade-card ${card.color}" data-action="card:${id}:${run.pendingChoices}" aria-label="${t(lang, "ability." + id)}"><span class="card-corner">${t(lang, "suit." + card.suit)} / ${level + 1}</span><span class="card-icon" aria-hidden="true">${gameIcon(id)}</span><strong>${t(lang, "ability." + id)}</strong><span class="card-rank">${t(lang, level ? "evolve" : "unlock")} · ${t(lang, "grade")} ${level + 1}</span><span class="card-description">${localizedCardDescription(lang, id, level + 1, run.attackRate)}</span><span class="card-combo">${t(lang, "combo")} ${chain} · ${bonus}</span></button>`;
      })
      .join("")}</div><p class="deck-rule">${t(lang, "deckRule")}</p>`;
}
export function missionRewardMarkup(run, lang = "en") {
  return `<p class="eyebrow">${t(lang, "missionSuccess")}</p><h2 id="run-dialog-title">${t(lang, "chooseReward")}</h2>
    <div class="reward-grid"><button class="upgrade-card" data-action="reward:card"><span class="card-icon">${gameIcon("learning")}</span><strong>${t(lang, "missionCard")}</strong></button><button class="upgrade-card" data-action="reward:coins"><span class="card-icon">${gameIcon("coins")}</span><strong>${t(lang, "missionCoins")}</strong></button><button class="upgrade-card" data-action="reward:health"><span class="card-icon">${gameIcon("heart")}</span><strong>${t(lang, "missionHealth")}</strong></button></div>`;
}
export function missionCardMarkup(run, lang = "en") {
  return `<p class="eyebrow">${t(lang, "missionSuccess")}</p><h2 id="run-dialog-title">${t(lang, "missionCard")}</h2><div class="upgrade-cards">${run.missionOffers.map((id) => `<button class="upgrade-card ${ABILITIES[id].color}" data-action="mission-card:${id}"><span class="card-icon">${gameIcon(id)}</span><strong>${t(lang, "ability." + id)}</strong><span>${localizedCardDescription(lang, id, run.abilities[id] + 1, run.attackRate)}</span></button>`).join("")}</div>`;
}
