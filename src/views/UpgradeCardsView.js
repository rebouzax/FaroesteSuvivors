import {
  ABILITIES,
  cardDescription,
} from "../config/abilityConfig.js";
export function upgradeCardsMarkup(run) {
  return `<p class="eyebrow">NÍVEL ${run.player.level} · ${run.pendingChoices} ESCOLHA(S) PENDENTE(S)</p>
    <h2 id="run-dialog-title">Escreva seu destino.</h2>
    <p class="cards-intro">Escolha uma carta. A partida fica parada enquanto você decide.</p>
    <div class="upgrade-cards">${run.cardOffers.map((id) => {
      const card = ABILITIES[id],
        level = run.abilities[id],
        chain =
          run.lastCard && run.lastCard !== id ? Math.min(3, run.chain + 1) : 1;
      const bonus =
        chain > 1
          ? id === "heart"
            ? `Cura extra de ${10 * (chain - 1)} de vida.`
            : `+${20 * (chain - 1)}% de dano por 20 s.`
          : "Inicia uma nova sequência.";
      return `<button class="upgrade-card ${card.color}" data-action="card:${id}:${run.pendingChoices}" aria-label="Escolher ${card.name}"><span class="card-corner">${card.suit} / ${level + 1}</span><span class="card-icon" aria-hidden="true">${card.icon}</span><strong>${card.name}</strong><span class="card-rank">${level ? "EVOLUIR" : "DESBLOQUEAR"} · GRAU ${level + 1}</span><span class="card-description">${cardDescription(id, level + 1, run.attackRate)}</span><span class="card-combo">SEQUÊNCIA ${chain} · ${bonus}</span></button>`;
    }).join(
      "",
    )}</div><p class="deck-rule">TRINCA DO SERTÃO · Alternar o naipe aumenta a sequência até 3. Repetir melhora a carta e reinicia a sequência em 1.</p>`;
}
