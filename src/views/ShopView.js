import { PERMANENT_UPGRADES, temporaryPrice } from "../config/shopConfig.js";
import { t, localizedCardDescription } from "../services/I18n.js";
import { gameIcon } from "./GameIcons.js";
import { BENTO_PORTRAIT } from "../config/portraitConfig.js";
import { BENTO_CARDS } from "../config/deckConfig.js";
export function permanentProducts(profile) {
  const lang = profile.data.language;
  return Object.entries(PERMANENT_UPGRADES)
    .map(([id, item]) => {
      const price = profile.price(id),valid=Number.isSafeInteger(price),locked=item.after&&!profile.data.storyClears[item.after];
      return `<article class="market-product ${locked?"is-locked":""}" data-kind="upgrades"><span class="product-symbol" aria-hidden="true">${gameIcon(id)}</span><p class="eyebrow">${t(lang, "permanent", { rank: profile.data[item.field] })}</p><h3>${t(lang, "shop." + id)}</h3><p>${locked?t(lang,"clearStage",{stage:t(lang,"map."+item.after)}):t(lang, "shopDesc." + id)}</p><button data-action="buy:${id}" ${!valid || locked || profile.data.coins < price ? "disabled" : ""}>${valid ? t(lang, "buy", { price: price.toLocaleString(lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US") }) : t(lang, "limit")}</button></article>`;
    })
    .join("")+Object.entries(BENTO_CARDS).map(([id,item])=>{
      const owned=profile.data.bentoCards.includes(id),locked=!profile.data.storyClears[item.after];
      return `<article class="market-product bento-product ${locked?"is-locked":""}" data-kind="cards"><span class="product-symbol" aria-hidden="true">${gameIcon(id)}</span><p class="eyebrow">${t(lang,"exclusiveBento")}</p><h3>${locked?"???":t(lang,"ability."+id)}</h3><p>${locked?t(lang,"clearStage",{stage:t(lang,"map."+item.after)}):t(lang,"bentoDesc."+id)}</p><button data-action="buy-card:${id}" ${owned||locked||profile.data.coins<item.price?"disabled":""}>${owned?t(lang,"ownedCard"):t(lang,"buy",{price:item.price})}</button></article>`;
    }).join("");
}
export function permanentShopMarkup(profile, back) {
  const lang = profile.data.language;
  return `<header class="topline"><button class="text-button" data-action="${back}">← ${t(lang, "back")}</button><span>${t(lang, "shopTitle")}</span><span id="shop-wallet">${t(lang, "savedCoins", { coins: profile.data.coins })}</span></header>
    <section class="merchant-layout"><div class="merchant-side"><div id="merchant-preview" class="portrait-stage merchant-portrait" aria-label="${t(lang, "merchantName")}"><img src="${BENTO_PORTRAIT}" alt="${t(lang, "merchantName")}" fetchpriority="high"></div><div class="merchant-caption"><h2>${t(lang, "merchantName")}</h2><p id="merchant-speech" role="status"></p></div></div><div class="shop-products"><p class="eyebrow">${t(lang, "shopPermanent")} · ${t(lang,"bentoCollection")}</p><div class="shop-filters" role="group" aria-label="${t(lang,"shopFilter")}"><button class="active" aria-pressed="true" data-action="shop-filter:all">${t(lang,"shopAll")}</button><button aria-pressed="false" data-action="shop-filter:upgrades">${t(lang,"shopUpgrades")}</button><button aria-pressed="false" data-action="shop-filter:cards">${t(lang,"shopCards")}</button></div><div id="permanent-products" class="permanent-products">${permanentProducts(profile)}</div></div></section>`;
}
export function runShopMarkup(run, lang = "en") {
  return `<h2 id="run-dialog-title">${t(lang, "runShopTitle")}</h2><p>${t(lang, "runMoney", { coins: run.coins })}</p><div class="run-shop-products">${run.merchantCards
    .map((id) => {
      const price = temporaryPrice(run.shopPurchases[id]);
      const name =
        id === "whip"
          ? t(lang, "primaryShop")
          : id === "haste"
            ? t(lang, "haste")
            : id === "spur"
              ? t(lang, "spur")
              : t(lang, "ability." + id);
      const description =
        id === "whip"
          ? t(lang, "primaryDesc", {
              damage: run.primaryDamage + (run.whipRank + 1) * 3,
            })
          : id === "haste"
            ? t(lang, "hasteDesc")
            : id === "spur"
              ? t(lang, "spurDesc")
              : localizedCardDescription(
                  lang,
                  id,
                  run.abilities[id] + 1,
                  run.attackRate,
                );
      const rank = ["whip", "haste", "spur"].includes(id)
        ? run.shopPurchases[id]
        : run.abilities[id];
      return `<article class="market-product"><span class="product-symbol" aria-hidden="true">${gameIcon(id)}</span><p class="eyebrow">${t(lang, "runRank", { type: t(lang, ["whip", "haste", "spur"].includes(id) ? "runUpgrade" : "runLevel"), rank })}</p><h3>${name}</h3><p>${description}</p><button data-action="run-buy:${id}" ${!Number.isSafeInteger(price) || run.coins < price ? "disabled" : ""}>${Number.isSafeInteger(price) ? t(lang, "buy", { price }) : t(lang, "limit")}</button></article>`;
    })
    .join(
      "",
    )}</div><p id="run-shop-status" role="status"></p><button class="primary" data-action="leave-merchant">${t(lang, "leaveMerchant")}</button>`;
}
