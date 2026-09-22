export class ScreenView {
  constructor(root, onAction, onSetting) {
    this.root = root;
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };
    root.addEventListener(
      "click",
      (e) => {
        const button = e.target.closest("[data-action]");
        if (button && !button.disabled) onAction(button.dataset.action);
      },
      options,
    );
    root.addEventListener(
      "change",
      (e) => {
        if (e.target.dataset.setting)
          onSetting(e.target.dataset.setting, e.target.checked);
      },
      options,
    );
  }
  menu() {
    this.root.className = "";
    this.root.innerHTML = `<header class="topline"><span>EST. 1887 / TERRAS SEM LEI</span><span>CAPÍTULO UM</span></header><section class="menu-panel"><p class="eyebrow">UM SOL IMPLACÁVEL. UMA ÚLTIMA CHANCE.</p><h1>FAROESTE<span>SURVIVORS</span></h1><p class="tagline">O deserto não enterra seus mortos.<br>Ele os devolve.</p><div class="ornament" aria-hidden="true">────── ✦ ──────</div><nav aria-label="Menu principal"><button class="primary" data-action="select">Novo jogo <span>↗</span></button><button data-action="settings">Configurações <span>⚙</span></button><button data-action="exit">Sair <span>→</span></button></nav><p class="menu-note">SOBREVIVA ATÉ O ÚLTIMO PÔR DO SOL</p></section><footer><span>UM SURVIVOR NO VELHO OESTE</span><span>CARTAS DO SERTÃO / 0.3</span></footer>`;
  }
  selection(profile, character, map) {
    this.root.className = "selection-screen";
    this.root.innerHTML = `<header class="topline"><button class="text-button" data-action="menu">← Menu</button><span>PREPARE SUA JORNADA</span><button class="text-button" data-action="shop">Loja · ◈ ${profile.data.coins}</button></header><div class="selection-heading"><p class="eyebrow">ESCOLHA QUEM ENFRENTA A NOITE</p><h2>Uma lenda começa<br>na poeira.</h2></div><section class="selection-grid"><article class="selection-card"><div class="card-caption">01 / PERSONAGEM</div><div id="character-preview" aria-label="Modelo 3D de João Vaqueiro"></div><h3>João Vaqueiro</h3><p>Couro gasto, coragem de sobra.<br>Seu velho chicote ainda conta histórias.</p><div class="stats"><span>CHICOTE <b>10 dano</b></span><span>VIDA <b>${profile.startingHealth}</b></span></div><button aria-pressed="${character}" data-action="character" class="${character ? "primary" : ""}">${character ? "✓ João selecionado" : "Escolher João"}</button></article><article class="selection-card map-card"><div class="card-caption">02 / FASE</div><div class="map-art" aria-hidden="true"><i class="map-sun"></i><i class="map-mesa one"></i><i class="map-mesa two"></i><i class="map-dune"></i></div><h3>Deserto dos Esquecidos</h3><p>Um vasto sertão de areia, pedras e cactos.<br>Ao cair do sol, os morcegos despertam.</p><div class="stats"><span>DURAÇÃO <b>15 minutos</b></span><span>AMEAÇA <b>Morcegos + chupacabras</b></span></div><button aria-pressed="${map}" data-action="map" class="${map ? "primary" : ""}">${map ? "✓ Deserto selecionado" : "Escolher deserto"}</button></article></section><div class="selection-bottom"><p>WASD / setas ou controle de toque.<br>Caminhada e chicote automáticos.</p><button class="primary" data-action="play" ${character && map ? "" : "disabled"}>Jogar →</button></div>`;
    return this.root.querySelector("#character-preview");
  }
  shop(profile) {
    this.root.className = "shop-screen";
    this.root.innerHTML = `<header class="topline"><button class="text-button" data-action="select">← Preparação</button><span>O ARMAZÉM DA ÚLTIMA ESTRADA</span><span id="shop-wallet"></span></header>
      <section class="merchant-layout"><div class="merchant-side"><div id="merchant-preview" aria-label="Mercador encapuzado em 3D"></div><div class="merchant-caption"><p class="eyebrow">BENTO, O ANDARILHO</p><h2>O amanhã custa<br>algumas moedas.</h2><p id="merchant-speech" role="status">“Um coração forte vale mais que uma arma nova.”</p></div></div>
      <div class="shop-products"><p class="eyebrow">PRODUTOS / MELHORIAS PERMANENTES</p><article class="health-product"><span class="product-heart" aria-hidden="true">♥</span><p id="health-rank" class="eyebrow"></p><h3>Fôlego de Vaqueiro</h3><p>Comece cada jornada com <strong>+20 de vida</strong> por compra. A melhoria fica com você nas próximas partidas.</p><div class="product-stats"><span>VIDA INICIAL<b id="starting-health"></b></span><span>PRÓXIMA COMPRA<b id="next-health"></b></span></div><button class="primary" data-action="buy-health" id="buy-health"></button><p id="shop-help"></p></article><p class="shop-footnote">A cada compra o preço aumenta. Melhorias de cartas duram apenas a partida; esta melhoria é permanente.</p></div></section>`;
    this.updateShop(profile);
    return this.root.querySelector("#merchant-preview");
  }
  updateShop(profile) {
    const price = profile.healthPrice,
      affordable = Number.isSafeInteger(price) && profile.data.coins >= price;
    this.root.querySelector("#shop-wallet").textContent =
      "◈ " + profile.data.coins + " moedas";
    this.root.querySelector("#health-rank").textContent =
      "MELHORIA " + profile.data.healthRank;
    this.root.querySelector("#starting-health").textContent =
      profile.startingHealth + " HP";
    this.root.querySelector("#next-health").textContent =
      profile.startingHealth + 20 + " HP";
    const button = this.root.querySelector("#buy-health");
    button.disabled = !affordable;
    button.textContent =
      "Comprar +20 HP · ◈ " +
      (Number.isSafeInteger(price) ? price.toLocaleString("pt-BR") : "—");
    this.root.querySelector("#shop-help").textContent = affordable
      ? "Disponível para compra."
      : "Recolha mais moedas nas partidas.";
  }
  settings(profile) {
    this.root.className = "selection-screen";
    this.root.innerHTML = `<section class="settings-panel"><p class="eyebrow">AJUSTE SUA JORNADA</p><h2>Configurações</h2><label class="setting">Vento do menu<input type="checkbox" data-setting="wind" ${profile.data.wind ? "checked" : ""}></label><label class="setting">Sons do jogo<input type="checkbox" data-setting="sound" ${profile.data.sound ? "checked" : ""}></label><label class="setting">Música de faroeste<input type="checkbox" data-setting="music" ${profile.data.music ? "checked" : ""}></label><p>O cenário do menu respeita a preferência de movimento reduzido do sistema.</p><p id="save-status" role="status"></p><button data-action="menu">Voltar ao menu</button></section>`;
  }
  audioSettings() {
    this.root.querySelector("#save-status").insertAdjacentHTML(
      "afterend",
      `
      <p>O som começa após um clique, toque ou tecla. Mantenha o volume do aparelho ligado e esta aba sem silenciar.</p>
      <button data-action="test-audio">Testar áudio / tentar novamente</button>
      <p id="audio-status" role="status" aria-live="polite"></p>
    `,
    );
  }
  exit() {
    this.root.className = "selection-screen";
    this.root.innerHTML =
      '<section class="farewell"><p class="eyebrow">ATÉ A PRÓXIMA, FORASTEIRO.</p><h2>O deserto espera.</h2><p>Você pode fechar esta aba ou voltar ao menu.</p><button data-action="menu">Voltar ao menu</button></section>';
  }
  game() {
    this.root.className = "playing-screen";
    this.root.innerHTML = `<div id="game-host"></div><section class="hud" aria-label="Estado da partida"><div class="xp-track"><div id="xp-fill"></div></div><div class="hud-row"><div><strong>JOÃO VAQUEIRO</strong><div class="hp-track"><div id="hp-fill"></div></div><small id="hp-label"></small></div><div class="clock"><strong id="timer">15:00</strong><small>DESERTO DOS ESQUECIDOS</small></div><button class="pause-button" data-action="pause" aria-label="Pausar partida">Ⅱ</button></div><div class="hud-stats"><span id="level"></span><span id="xp-label"></span><span id="kills"></span><span id="coins"></span></div></section><div class="ability-bar" id="ability-bar"></div><div id="intro-caption" aria-live="polite"></div><div id="level-toast" role="status" hidden></div><div id="joystick" role="group" aria-label="Controle de direção por toque"><i></i></div><div class="controls-hint">WASD / SETAS · MOVIMENTO AUTOMÁTICO<br>ESC · PAUSAR</div><dialog id="run-dialog" aria-labelledby="run-dialog-title"></dialog>`;
    this.hud = {};
    for (const id of [
      "xp-fill",
      "hp-fill",
      "hp-label",
      "timer",
      "level",
      "xp-label",
      "kills",
      "coins",
      "intro-caption",
      "level-toast",
    ])
      this.hud[id] = this.root.querySelector("#" + id);
    return {
      host: this.root.querySelector("#game-host"),
      pad: this.root.querySelector("#joystick"),
      dialog: this.root.querySelector("#run-dialog"),
    };
  }
  updateHud(run) {
    const p = run.player,
      remaining = Math.ceil(900 - run.time),
      minutes = String(Math.floor(remaining / 60)).padStart(2, "0"),
      seconds = String(remaining % 60).padStart(2, "0");
    this.hud["timer"].textContent = `${minutes}:${seconds}`;
    this.hud["hp-label"].textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    this.hud["hp-fill"].style.width = `${(p.hp / p.maxHp) * 100}%`;
    this.hud["xp-fill"].style.width = `${(p.xp / run.requiredXp) * 100}%`;
    this.hud.level.textContent = `NÍVEL ${p.level}`;
    this.hud["xp-label"].textContent = `${p.xp} / ${run.requiredXp} XP`;
    this.hud.kills.textContent = `☠ ${run.kills}`;
    this.hud.coins.textContent = `◈ ${run.coins}`;
    this.root.querySelector("#ability-bar").textContent =
      `✦ Pistola ${run.abilities.pistol}  ·  ♨ Molotov ${run.abilities.molotov}  ·  ♥ Vida ${run.abilities.heart}` +
      (run.empowered.remaining > 0
        ? `  |  Sequência ${run.chain} · ${Math.ceil(run.empowered.remaining)}s`
        : "");
    this.hud["intro-caption"].textContent =
      run.phase === "intro"
        ? `JOÃO VAQUEIRO · ${Math.max(1, Math.ceil(6 - run.introTime))}`
        : "";
    this.hud["level-toast"].hidden = run.levelFlash <= 0;
    this.hud["level-toast"].textContent = `NÍVEL ${p.level} · A LENDA CRESCE`;
  }
  dispose() {
    this.controller.abort();
    this.root.replaceChildren();
  }
}
