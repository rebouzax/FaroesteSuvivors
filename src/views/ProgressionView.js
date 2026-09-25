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
      return `<button class="arsenal-card ${active?"selected":""}" data-action="deck:${id}" aria-pressed="${active}" ${active&&deck.length<=DECK_MIN||!active&&deck.length>=DECK_MAX?"disabled":""}><span class="arsenal-status ${active?"is-equipped":""}">${active?"✓ "+t(lang,"equipped"):"+ "+t(lang,"equip")}</span><span class="arsenal-icon">${gameIcon(id)}</span><strong>${t(lang,"ability."+id)}</strong></button>`;
    }).join("")}</div><h3>${t(lang,"forge")}</h3><div class="fusion-grid">${Object.entries(FUSIONS).map(([id,recipe])=>{
      const forged=forgedCards.includes(id),open=!recipe.after||Boolean(storyClears[recipe.after]),ready=recipe.ingredients.every(item=>deck.includes(item));
      const status=forged?t(lang,"forged"):!open?t(lang,"clearStage",{stage:t(lang,"map."+recipe.after)}):!ready?t(lang,"equipIngredients"):t(lang,"combine");
      return `<button class="fusion-card" data-action="forge:${id}" ${forged||!open||!ready||completedRuns<1?"disabled":""}><span class="arsenal-icon">${gameIcon(id)}</span><strong>${t(lang,"ability."+id)}</strong><small>${recipe.ingredients.map(item=>t(lang,"ability."+item)).join(" + ")}</small><span>${status}</span></button>`;
    }).join("")}</div></section>`;
}

const CATEGORY_LABELS={
  en:{beasts:"Beasts of the frontier",undead:"Restless dead",spirits:"Cursed spirits",bosses:"Apex monsters"},
  pt:{beasts:"Feras da fronteira",undead:"Mortos inquietos",spirits:"Espíritos amaldiçoados",bosses:"Monstros lendários"},
  es:{beasts:"Bestias de la frontera",undead:"Muertos errantes",spirits:"Espíritus malditos",bosses:"Monstruos legendarios"},
};
const BESTIARY_IMAGES=import.meta.glob("../assets/bestiary/*.svg",{eager:true,query:"?url",import:"default"});
function creatureImage(id) { return BESTIARY_IMAGES[`../assets/bestiary/${id}.svg`] ?? ""; }
export function bestiaryMarkup(profile,back="select") {
  const lang=profile.data.language,found=profile.data.discoveries,labels=CATEGORY_LABELS[lang]??CATEGORY_LABELS.en;
  const enemies=ENEMY_IDS.map(id=>({id,boss:false}));
  const bosses=Object.values(CAMPAIGN).flatMap(stage=>stage.bosses.map(b=>({...b,boss:true})));
  const render=entry=>{
    const {id,boss}=entry,known=found[boss?"bosses":"enemies"].includes(id),seen=boss&&found.encounteredBosses.includes(id);
    const name=known||seen?t(lang,(boss?"boss.":"enemy.")+id):t(lang,"unknownCreature");
    return `<button class="bestiary-card ${known?"":seen?"is-encountered":"is-unknown"}" data-action="creature:${id}" aria-label="${name}"><span class="bestiary-list-image" aria-hidden="true"><img src="${creatureImage(id)}" alt="" loading="lazy"></span><span class="bestiary-glyph" aria-hidden="true">${known?(boss?"☠":"✦"):seen?"!":"?"}</span><span>${name}</span></button>`;
  };
  const section=(label,list)=>`<section class="creature-section"><h3>${label}</h3><div class="bestiary-grid">${list.map(render).join("")}</div></section>`;
  const beastBosses=new Set(["giantBat","fireChupacabra","giantMoth","boneHound","ashSerpent","stormVulture"]);
  const spiritBosses=new Set(["cryptMother","deadPreacher"]);
  return `<section class="progression-panel bestiary-panel"><button class="text-button" data-action="${back}">← ${t(lang,"back")}</button><h2>${t(lang,"bestiary")}</h2><p>${t(lang,"bestiaryCount",{count:found.enemies.length+found.bosses.length,total:enemies.length+bosses.length})}</p>
    ${section(labels.beasts,[...enemies.filter(e=>["bat","dog","vulture","crow"].includes(e.id)),...bosses.filter(e=>beastBosses.has(e.id))])}
    ${section(labels.undead,[...enemies.filter(e=>["skeleton","miner"].includes(e.id)),...bosses.filter(e=>!beastBosses.has(e.id)&&!spiritBosses.has(e.id))])}
    ${section(labels.spirits,[...enemies.filter(e=>e.id==="wraith"),...bosses.filter(e=>spiritBosses.has(e.id))])}
    <dialog id="bestiary-detail" class="bestiary-detail"></dialog></section>`;
}
export function creatureDetailMarkup(profile,id) {
  const lang=profile.data.language,found=profile.data.discoveries;
  const boss=Object.values(CAMPAIGN).flatMap(stage=>stage.bosses).find(b=>b.id===id);
  if(!boss && !ENEMY_IDS.includes(id))return "";
  const known=found[boss?"bosses":"enemies"].includes(id),seen=boss&&found.encounteredBosses.includes(id);
  const name=known||seen?t(lang,(boss?"boss.":"enemy.")+id):t(lang,"unknownCreature");
  const lore=known?t(lang,"lore."+id):seen?t(lang,"encounteredBoss"):t(lang,"discoverCreature");
  const stats=boss?(known?`<p>${t(lang,"bossStats",boss)}</p><p>${t(lang,"bossPattern",{pattern:t(lang,"pattern."+boss.pattern)})}</p><p>${t(lang,"weakness")}: ${t(lang,"ability."+boss.weakness)}</p><p>${t(lang,"counter")}: ${CHARACTERS[boss.counter].name}</p>`
    :seen?`<p>${t(lang,"bossStats",{hp:boss.hp,damage:"?",armor:"?",speed:"?"})}</p><p>${t(lang,"bossPattern",{pattern:t(lang,"pattern."+boss.pattern)})}</p>`:"")
    :known?`<p>${t(lang,"weakness")}: ${t(lang,"weakness."+id)}</p>`:"";
  return `<button class="bestiary-close" data-action="close-creature" aria-label="${t(lang,"back")}">×</button><h2 id="bestiary-title">${name}</h2><div class="bestiary-detail-content"><div class="bestiary-art ${known||seen?"":"unknown-art"}"><img src="${creatureImage(id)}" alt="${known||seen?name:""}"></div><div class="bestiary-description"><p>${lore}</p>${stats}</div></div>`;
}
