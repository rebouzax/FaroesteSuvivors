import { CHARACTERS, CHARACTER_IDS } from "../config/characterConfig.js";
import { MAP_IDS } from "../config/mapConfig.js";
import { t } from "../services/I18n.js";
import { HERO_PORTRAITS } from "../config/portraitConfig.js";
import { CAMPAIGN, previousStage, HERO_REWARDS, stageUnlocked, heroUnlocked } from "../config/campaignConfig.js";
import { gameIcon } from "./GameIcons.js";
import { STAGE_ART } from "../config/stageArtConfig.js";

export function modeMarkup(profile) {
  const lang=profile.data.language,free=Boolean(profile.data.storyClears.desert);
  return `<section class="mode-panel"><button class="text-button" data-action="menu">← ${t(lang,"backMenu")}</button><h2>${t(lang,"chooseMode")}</h2><div class="mode-choices">
    <button class="mode-card" data-action="story"><span class="mode-symbol">✦</span><strong>${t(lang,"storyMode")}</strong><small>${t(lang,"storyIntro")}</small></button>
    <button class="mode-card" data-action="free" ${free?"":"disabled"}><span class="mode-symbol">♠</span><strong>${t(lang,"freeMode")}</strong><small>${free?t(lang,"freeIntro"):t(lang,"freeLock")}</small></button>
  </div></section>`;
}

export function preparationMarkup(profile,step,selectedCharacter="joao",selectedMap="desert",mode="story") {
  const lang=profile.data.language,character=step==="character",stats=profile.data;
  const ids=character?CHARACTER_IDS:MAP_IDS;
  const id=character?selectedCharacter:selectedMap;
  const index=Math.max(0,ids.indexOf(id));
  const unlocked=character?heroUnlocked(stats,id):stageUnlocked(stats,id);
  const hero=character?CHARACTERS[id]:null;
  const name=character?(unlocked?hero.name:t(lang,"hiddenHero")):t(lang,"map."+id);
  const hint=character?t(lang,"clearStage",{stage:t(lang,"map."+HERO_REWARDS[id])}):t(lang,"clearStage",{stage:t(lang,"map."+previousStage(id))});
  const artwork=character
    ? unlocked?`<img src="${HERO_PORTRAITS[id]}" alt="${hero.name}" loading="eager">`:`<span class="carousel-mystery" aria-label="${t(lang,"hiddenHero")}">?</span>`
    : `<span class="carousel-landscape map-${id}"><img src="${STAGE_ART[id]}" alt="" loading="eager">${unlocked?"":'<span class="stage-lock" aria-hidden="true">?</span>'}</span>`;
  const details=unlocked
    ? character?`<p>${t(lang,"hero."+id)}</p><p class="hero-facts">${t(lang,"life")} ${hero.hp+stats.healthRank*20} · ${t(lang,"damage")} ${hero.damage+stats.primaryRank*2} · ${t(lang,"speed")} ${hero.speed} · ${t(lang,"armor")} ${hero.armor||0}</p>`
      : `<p>${t(lang,"mapDesc."+id)}</p><p>${t(lang,"storyGoals")}: ${CAMPAIGN[id].missions.length} + ${CAMPAIGN[id].bosses.length}</p>`
    : `<p>${hint}</p>`;
  const tools=`<nav class="carousel-tools" aria-label="${t(lang,"progressionTools")}"><button data-action="arsenal" ${stats.completedRuns?"":"disabled"}>${gameIcon("learning")}<span>${t(lang,"arsenal")}</span></button><button data-action="bestiary">${gameIcon("boneStorm")}<span>${t(lang,"bestiary")}</span></button><button data-action="shop">${gameIcon("merchant")}<span>${t(lang,"market")}</span></button></nav>`;
  return `<section class="carousel-preparation"><header class="carousel-heading"><button class="text-button" data-action="${character?"modes":"select"}">← ${t(lang,"back")}</button><small>${t(lang,mode==="story"?"storyMode":"freeMode")} · ${index+1}/${ids.length}</small><h2>${t(lang,character?"chooseCharacter":"chooseMap")}</h2></header>
    <div class="carousel-selection" role="group" aria-label="${t(lang,character?"chooseCharacter":"chooseMap")}">
      <button class="carousel-arrow" type="button" data-action="cycle:-1" aria-label="${t(lang,"back")}">‹</button>
      <article class="carousel-focus ${unlocked?"":"carousel-locked"}" aria-live="polite"><div class="carousel-art">${artwork}</div><div class="carousel-details"><h3>${name}</h3>${details}</div></article>
      <button class="carousel-arrow" type="button" data-action="cycle:1" aria-label="${t(lang,"continue")}">›</button>
    </div><div class="carousel-dots" aria-hidden="true">${ids.map((_,i)=>`<span class="${i===index?"active":""}"></span>`).join("")}</div>
    ${character?"":tools}<button class="primary carousel-continue" data-action="${character?"character":"play"}" ${unlocked?"":"disabled"}>${t(lang,character?"continue":"play")} →</button></section>`;
}
