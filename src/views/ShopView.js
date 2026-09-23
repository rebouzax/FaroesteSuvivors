import { PERMANENT_UPGRADES, temporaryPrice } from "../config/shopConfig.js";
import { ABILITIES, cardDescription } from "../config/abilityConfig.js";

export function permanentProducts(profile) {
  return Object.entries(PERMANENT_UPGRADES)
    .map(([id, item]) => {
      const price = profile.price(id),
        valid = Number.isSafeInteger(price);
      return `<article class="market-product"><span class="product-symbol" aria-hidden="true">${item.icon}</span><p class="eyebrow">PERMANENTE · NÍVEL ${profile.data[item.field]}</p><h3>${item.name}</h3><p>${item.description}</p><button data-action="buy:${id}" ${!valid || profile.data.coins < price ? "disabled" : ""}>${valid ? `Comprar · ◈ ${price.toLocaleString("pt-BR")}` : "Limite de compra atingido"}</button></article>`;
    })
    .join("");
}
export function permanentShopMarkup(profile, back) {
  return `<header class="topline"><button class="text-button" data-action="${back}">← Voltar</button><span>MERCADO DO BENTO</span><span id="shop-wallet">◈ ${profile.data.coins} guardadas</span></header>
    <section class="merchant-layout"><div class="merchant-side"><div id="merchant-preview" aria-label="Mercador em 3D"></div><div class="merchant-caption"><p class="eyebrow">BENTO, O ANDARILHO</p><h2>Prepare-se para<br>a próxima jornada.</h2><p id="merchant-speech" role="status">“O que você compra aqui fica com você.”</p></div></div><div class="shop-products"><p class="eyebrow">MELHORIAS PERMANENTES</p><div id="permanent-products" class="permanent-products">${permanentProducts(profile)}</div><p>Usa apenas moedas guardadas. Cada produto fica mais caro a cada compra. Velocidade de ataque respeita o tempo mínimo das animações.</p></div></section>`;
}
export function runShopMarkup(run) {
  return `<p class="eyebrow">BENTO NO DESERTO · PARTIDA PAUSADA</p><h2 id="run-dialog-title">Um reforço para a jornada</h2><p>◈ <strong>${run.coins}</strong> moedas desta partida · saldo separado do menu.</p><p>As compras abaixo duram somente esta partida. Apenas habilidades já adquiridas aparecem.</p><div class="run-shop-products">${run.merchantCards
    .map((id) => {
      const price = temporaryPrice(run.shopPurchases[id]);
      const name = id === "whip" ? "Chicote de João" : ABILITIES[id].name;
      const description =
        id === "whip"
          ? `+3 de dano. Próximo dano: ${run.primaryDamage + (run.whipRank + 1) * 3}.`
          : cardDescription(id, run.abilities[id] + 1, run.attackRate);
      const rank = id === "whip" ? run.whipRank : run.abilities[id];
      return `<article class="market-product"><span class="product-symbol" aria-hidden="true">${id === "whip" ? "~" : ABILITIES[id].icon}</span><p class="eyebrow">SÓ NESTA PARTIDA · ${id === "whip" ? "MELHORIAS" : "NÍVEL"} ${rank}</p><h3>${name}</h3><p>${description}</p><button data-action="run-buy:${id}" ${!Number.isSafeInteger(price) || run.coins < price ? "disabled" : ""}>${Number.isSafeInteger(price) ? `Comprar · ◈ ${price}` : "Limite atingido"}</button></article>`;
    })
    .join(
      "",
    )}</div><p id="run-shop-status" role="status"></p><button class="primary" data-action="leave-merchant">Voltar à partida →</button>`;
}
