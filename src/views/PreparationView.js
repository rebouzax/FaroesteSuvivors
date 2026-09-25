import { CHARACTERS, CHARACTER_IDS } from "../config/characterConfig.js";
import { MAP_IDS } from "../config/mapConfig.js";
import { t } from "../services/I18n.js";
import { HERO_PORTRAITS } from "../config/portraitConfig.js";
import { CAMPAIGN, previousStage, HERO_REWARDS, stageUnlocked, heroUnlocked } from "../config/campaignConfig.js";

export function modeMarkup(profile) {
  const lang=profile.data.language,free=Boolean(profile.data.storyClears.desert);
  return `<section class="mode-panel"><button class="text-button" data-action="menu">← ${t(lang,"backMenu")}</button><h2>${t(lang,"chooseMode")}</h2><div class="mode-choices">
    <button class="mode-card" data-action="story"><span class="mode-symbol">✦</span><strong>${t(lang,"storyMode")}</strong><small>${t(lang,"storyIntro")}</small></button>
    <button class="mode-card" data-action="free" ${free?"":"disabled"}><span class="mode-symbol">♠</span><strong>${t(lang,"freeMode")}</strong><small>${free?t(lang,"freeIntro"):t(lang,"freeLock")}</small></button>
  </div></section>`;
}
export function preparationMarkup(profile,step,selectedCharacter="joao",selectedMap="desert",mode="story") {
  const lang=profile.data.language,character=step==="character",hero=CHARACTERS[selectedCharacter],stats=profile.data;
  const toolbar=`<nav class="preparation-tools" aria-label="${t(lang,"progressionTools")}"><button data-action="arsenal" ${stats.completedRuns?"":"disabled"}>♠ ${t(lang,"arsenal")}</button><button data-action="bestiary">☠ ${t(lang,"bestiary")}</button><button data-action="shop">◈ ${t(lang,"market")} <small>${stats.coins}</small></button></nav>`;
  const heroes=CHARACTER_IDS.map(id=>{
    const unlocked=heroUnlocked(stats,id),h=CHARACTERS[id],stage=HERO_REWARDS[id];
    const hint=unlocked?t(lang,"weapon."+h.primary):t(lang,"clearStage",{stage:t(lang,"map."+stage)});
    return `<button class="choice-card ${unlocked&&selectedCharacter===id?"active":""} ${unlocked?"":"locked-choice"}" data-action="choose-character:${id}" aria-label="${unlocked?h.name+" · "+hint:t(lang,"hiddenHero")+" · "+hint}" ${unlocked?"":"disabled"}><span class="choice-thumb">${unlocked?`<img src="${HERO_PORTRAITS[id]}" alt="" loading="lazy">`:`<span class="mystery-thumb" aria-hidden="true">?</span>`}</span><strong>${unlocked?h.name:t(lang,"hiddenHero")}</strong><small>${unlocked?hint:t(lang,"map."+stage)}</small></button>`;
  }).join("");
  const maps=MAP_IDS.map(id=>{
    const unlocked=stageUnlocked(stats,id),previous=previousStage(id);
    return `<button class="choice-card map-choice ${unlocked&&selectedMap===id?"active":""} ${unlocked?"":"locked-choice"}" data-action="choose-map:${id}" aria-label="${unlocked?t(lang,"map."+id):t(lang,"clearStage",{stage:t(lang,"map."+previous)})}" ${unlocked?"":"disabled"}><span class="map-swatch map-${id}">${unlocked?"":"?"}</span><strong>${unlocked?t(lang,"map."+id):"???"}</strong><small>${unlocked?t(lang,"mapDesc."+id):t(lang,"map."+previous)}</small></button>`;
  }).join("");
  return `<section class="preparation-panel compact-preparation">${toolbar}<header class="preparation-heading"><button class="text-button" data-action="${character?"modes":"select"}">← ${t(lang,character?"chooseMode":"character")}</button><h2>${t(lang,character?"chooseCharacter":"chooseMap")} <small class="mode-label">${t(lang,mode==="story"?"storyMode":"freeMode")}</small></h2><ol class="selection-steps"><li aria-current="${character?"step":"false"}">1. ${t(lang,"character")}</li><li aria-current="${character?"false":"step"}">2. ${t(lang,"stage")}</li></ol></header>
    <div class="preparation-content"><div class="choice-grid" role="group" aria-label="${t(lang,character?"chooseCharacter":"chooseMap")}">${character?heroes:maps}</div>
      <article class="selection-card focused-card ${character?"character-focus":""}">${character?`<div class="portrait-stage" aria-label="${hero.name}"><img src="${HERO_PORTRAITS[selectedCharacter]}" alt="${hero.name}"></div><div class="focus-copy"><h3>${hero.name}</h3><p>${t(lang,"hero."+selectedCharacter)}</p><p class="hero-facts">${t(lang,"life")} ${hero.hp+stats.healthRank*20} · ${t(lang,"damage")} ${hero.damage+stats.primaryRank*2} · ${t(lang,"speed")} ${hero.speed} · ${t(lang,"armor")} ${hero.armor||0}</p><button class="primary" data-action="character">${t(lang,"continue")} →</button></div>`:`<div class="focus-copy"><h3>${t(lang,"map."+selectedMap)}</h3><p>${t(lang,"mapDesc."+selectedMap)}</p><p>${t(lang,"storyGoals")}: ${CAMPAIGN[selectedMap].missions.length} + ${CAMPAIGN[selectedMap].bosses.length}</p><button class="primary" data-action="play">${t(lang,"play")} →</button></div>`}</article>
    </div></section>`;
}
