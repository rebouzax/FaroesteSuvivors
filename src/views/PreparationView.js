export function preparationMarkup(profile, step) {
  const character = step === "character";
  return `<section class="preparation-panel">
    <button class="text-button" data-action="${character ? "menu" : "select"}">← ${character ? "Menu" : "Personagem"}</button>
    <p class="eyebrow">PREPARE SUA JORNADA · ${character ? "1 / 2" : "2 / 2"}</p>
    <h2>${character ? "Escolha seu personagem" : "Escolha sua fase"}</h2>
    <ol class="selection-steps" aria-label="Etapas"><li aria-current="${character ? "step" : "false"}">1. Personagem</li><li aria-current="${character ? "false" : "step"}">2. Fase</li></ol>
    <article class="selection-card focused-card">
      ${
        character
          ? `<div id="character-preview" aria-label="João Vaqueiro em 3D"></div><h3>João Vaqueiro</h3><p>Couro gasto, coragem de sobra.<br>Seu chicote abre caminho no deserto.</p><div class="stats"><span>VIDA <b>${profile.startingHealth}</b></span><span>CHICOTE <b>${10 + profile.data.primaryRank * 2} dano</b></span></div><button class="primary" data-action="character">Escolher João e continuar →</button>`
          : `<div class="map-art" aria-hidden="true"><i class="map-sun"></i><i class="map-mesa one"></i><i class="map-mesa two"></i><i class="map-dune"></i></div><h3>Deserto dos Esquecidos</h3><p>Morcegos, chupacabras e bandos de urubus.<br>Encontre Bento entre as dunas.</p><div class="stats"><span>PERSONAGEM <b>João Vaqueiro</b></span><span>DURAÇÃO <b>15 minutos</b></span></div><button class="primary" data-action="play">Escolher deserto e jogar →</button>`
      }
    </article>
    <button class="market-callout" data-action="shop"><span class="market-icon" aria-hidden="true">◈</span><span><strong>Mercado do Bento</strong><small>Melhorias permanentes · ${profile.data.coins} moedas guardadas</small></span><span aria-hidden="true">→</span></button>
    <p class="preparation-help">${character ? "As melhorias do mercado acompanham você em todas as partidas." : "WASD / setas ou controle por toque. Ataques automáticos."}</p>
  </section>`;
}
