import { ABILITIES } from "../config/abilityConfig.js";
import { FUSIONS, STARTER_CARDS, DECK_MIN, DECK_MAX } from "../config/deckConfig.js";
import { CAMPAIGN, ENEMY_IDS } from "../config/campaignConfig.js";
import { CHARACTERS } from "../config/characterConfig.js";
import { t } from "../services/I18n.js";
import { gameIcon } from "./GameIcons.js";

export function arsenalMarkup(profile,back="select") {
  const {deck,forgedCards,bentoCards,completedRuns,storyClears}=profile.data,lang=profile.data.language;
  return `<section class="progression-panel"><button class="text-button" data-action="${back}">← ${t(lang,"back")}</button><h2>${t(lang,"arsenal")}</h2>
    <p>${t(lang,"deckCount",{count:deck.length,max:DECK_MAX})} · ${t(lang,"deckHint",{min:DECK_MIN})}</p>
    <div class="arsenal-grid">${[...STARTER_CARDS,...forgedCards,...bentoCards].map(id=>{
      const active=deck.includes(id);
      return `<button class="arsenal-card ${active?"selected":""}" data-action="deck:${id}" aria-pressed="${active}" ${active&&deck.length<=DECK_MIN||!active&&deck.length>=DECK_MAX?"disabled":""}><span class="arsenal-icon">${gameIcon(id)}</span><strong>${t(lang,"ability."+id)}</strong><small>${active?t(lang,"equipped"):t(lang,"equip")}</small></button>`;
    }).join("")}</div><h3>${t(lang,"forge")}</h3><div class="fusion-grid">${Object.entries(FUSIONS).map(([id,recipe])=>{
      const forged=forgedCards.includes(id),open=!recipe.after||Boolean(storyClears[recipe.after]),ready=recipe.ingredients.every(item=>deck.includes(item));
      const status=forged?t(lang,"forged"):!open?t(lang,"clearStage",{stage:t(lang,"map."+recipe.after)}):!ready?t(lang,"equipIngredients"):t(lang,"combine");
      return `<button class="fusion-card" data-action="forge:${id}" ${forged||!open||!ready||completedRuns<1?"disabled":""}><span class="arsenal-icon">${gameIcon(id)}</span><strong>${t(lang,"ability."+id)}</strong><small>${recipe.ingredients.map(item=>t(lang,"ability."+item)).join(" + ")}</small><span>${status}</span></button>`;
    }).join("")}</div></section>`;
}

export function bestiaryMarkup(profile,back="select") {
  const lang=profile.data.language,found=profile.data.discoveries;
  const enemies=ENEMY_IDS.map(id=>({id,boss:false}));
  const bosses=Object.values(CAMPAIGN).flatMap(stage=>stage.bosses.map(b=>({...b,boss:true})));
  const render=entry=>{
    const {id,boss}=entry,known=found[boss?"bosses":"enemies"].includes(id),seen=boss&&found.encounteredBosses.includes(id);
    const name=known||seen?t(lang,(boss?"boss.":"enemy.")+id):t(lang,"unknownCreature");
    const info=known?`<p>${t(lang,"lore."+id)}</p>${boss?`<p>${t(lang,"bossStats",entry)}</p><small>${t(lang,"bossPattern",{pattern:t(lang,"pattern."+entry.pattern)})} · ${t(lang,"weakness")}: ${t(lang,"ability."+entry.weakness)} · ${t(lang,"counter")}: ${CHARACTERS[entry.counter].name}</small>`:`<small>${t(lang,"weakness")}: ${t(lang,"weakness."+id)}</small>`}`:seen?`<p>${t(lang,"encounteredBoss")}</p><small>${t(lang,"bossPattern",{pattern:t(lang,"pattern."+entry.pattern)})} · ${t(lang,"bossStats",{hp:entry.hp,damage:"?",armor:"?",speed:"?"})}</small>`:`<p>${t(lang,"discoverCreature")}</p>`;
    return `<article class="bestiary-card ${known?"":seen?"is-encountered":"is-unknown"}"><span class="bestiary-glyph" aria-hidden="true">${known?(boss?"☠":"✦"):seen?"!":"?"}</span><div><h3>${name}</h3>${info}</div></article>`;
  };
  return `<section class="progression-panel"><button class="text-button" data-action="${back}">← ${t(lang,"back")}</button><h2>${t(lang,"bestiary")}</h2><p>${t(lang,"bestiaryCount",{count:found.enemies.length+found.bosses.length,total:enemies.length+bosses.length})}</p><h3>${t(lang,"creatures")}</h3><div class="bestiary-grid">${enemies.map(render).join("")}</div><h3>${t(lang,"bosses")}</h3><div class="bestiary-grid">${bosses.map(render).join("")}</div></section>`;
}
