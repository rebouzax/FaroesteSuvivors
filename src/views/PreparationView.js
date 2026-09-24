import { CHARACTERS, CHARACTER_IDS } from "../config/characterConfig.js";
import { MAPS, MAP_IDS } from "../config/mapConfig.js";
import { t } from "../services/I18n.js";
import { gameIcon } from "./GameIcons.js";
import { HERO_PORTRAITS } from "../config/portraitConfig.js";
export function preparationMarkup(
  profile,
  step,
  selectedCharacter = "joao",
  selectedMap = "desert",
) {
  const character = step === "character",
    lang = profile.data.language;
  return `<section class="preparation-panel">
    <button class="text-button" data-action="${character ? "menu" : "select"}">← ${t(lang, character ? "menu" : "character")}</button>
    <h2>${t(lang, character ? "chooseCharacter" : "chooseMap")}</h2>
    <ol class="selection-steps" aria-label="${t(lang, "steps")}"><li aria-current="${character ? "step" : "false"}">1. ${t(lang, "character")}</li><li aria-current="${character ? "false" : "step"}">2. ${t(lang, "stage")}</li></ol>
    <div class="choice-grid">${
      character
        ? CHARACTER_IDS.map((id) => {
            const hero = CHARACTERS[id];
            return `<button class="choice-card ${selectedCharacter === id ? "active" : ""}" data-action="choose-character:${id}" aria-pressed="${selectedCharacter === id}"><span class="choice-thumb"><img src="${HERO_PORTRAITS[id]}" alt="" loading="eager"></span><strong>${hero.name}</strong><span>${gameIcon(hero.primary === "whip" ? "whip" : hero.primary === "bow" ? "bow" : "pistol")}</span></button>`;
          }).join("")
        : MAP_IDS.map(
            (id) =>
              `<button class="choice-card map-choice ${selectedMap === id ? "active" : ""}" data-action="choose-map:${id}" aria-pressed="${selectedMap === id}"><span class="map-swatch map-${id}"></span><strong>${t(lang, "map." + id)}</strong><small>${t(lang, "mapDesc." + id)}</small></button>`,
          ).join("")
    }</div>
    <article class="selection-card focused-card ${character ? "character-focus" : ""}">
      ${character ? `<div id="character-preview" class="portrait-stage" aria-label="${CHARACTERS[selectedCharacter].name}"><img src="${HERO_PORTRAITS[selectedCharacter]}" alt="${CHARACTERS[selectedCharacter].name}" fetchpriority="high"></div><div class="focus-copy"><h3>${CHARACTERS[selectedCharacter].name}</h3><p>${t(lang, "hero." + selectedCharacter)}</p><p class="hero-facts">${t(lang, "life")} ${CHARACTERS[selectedCharacter].hp + profile.data.healthRank * 20} · ${t(lang, "damage")} ${CHARACTERS[selectedCharacter].damage + profile.data.primaryRank * 2}</p><button class="primary" data-action="character">${t(lang, "continue")} →</button></div>` : `<h3>${t(lang, "map." + selectedMap)}</h3><p>${t(lang, "mapDesc." + selectedMap)}</p><div class="stats"><span>${t(lang, "character")} <b>${CHARACTERS[selectedCharacter].name}</b></span><span>${t(lang, "duration")} <b>15 ${t(lang, "minutes")}</b></span></div><button class="primary" data-action="play">${t(lang, "play")} →</button>`}
    </article>
    <button class="market-callout" data-action="shop"><span class="market-icon" aria-hidden="true">${gameIcon("merchant")}</span><span><strong>${t(lang, "market")}</strong><small>${t(lang, "permanentUpgrades")} · ${profile.data.coins} ${t(lang, "coins")}</small></span><span aria-hidden="true">→</span></button>
  </section>`;
}
