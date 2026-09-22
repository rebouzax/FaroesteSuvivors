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
    this.root.innerHTML = `<header class="topline"><span>EST. 1887 / TERRAS SEM LEI</span><span>CAPÍTULO UM</span></header><section class="menu-panel"><p class="eyebrow">UM SOL IMPLACÁVEL. UMA ÚLTIMA CHANCE.</p><h1>FAROESTE<span>SURVIVORS</span></h1><p class="tagline">O deserto não enterra seus mortos.<br>Ele os devolve.</p><div class="ornament" aria-hidden="true">────── ✦ ──────</div><nav aria-label="Menu principal"><button class="primary" data-action="select">Novo jogo <span>↗</span></button><button data-action="settings">Configurações <span>⚙</span></button><button data-action="exit">Sair <span>→</span></button></nav><p class="menu-note">SOBREVIVA ATÉ O ÚLTIMO PÔR DO SOL</p></section><footer><span>UM SURVIVOR NO VELHO OESTE</span><span>PROTÓTIPO JOGÁVEL / 0.2</span></footer>`;
  }
  selection(profile, character, map) {
    this.root.className = "selection-screen";
    this.root.innerHTML = `<header class="topline"><button class="text-button" data-action="menu">← Menu</button><span>PREPARE SUA JORNADA</span><button class="text-button" data-action="shop">Loja · ◈ ${profile.data.coins}</button></header><div class="selection-heading"><p class="eyebrow">ESCOLHA QUEM ENFRENTA A NOITE</p><h2>Uma lenda começa<br>na poeira.</h2></div><section class="selection-grid"><article class="selection-card"><div class="card-caption">01 / PERSONAGEM</div><div id="character-preview" aria-label="Modelo 3D de João Vaqueiro"></div><h3>João Vaqueiro</h3><p>Couro gasto, coragem de sobra.<br>Seu velho chicote ainda conta histórias.</p><div class="stats"><span>CHICOTE <b>10 dano</b></span><span>VIDA <b>100</b></span></div><button aria-pressed="${character}" data-action="character" class="${character ? "primary" : ""}">${character ? "✓ João selecionado" : "Escolher João"}</button></article><article class="selection-card map-card"><div class="card-caption">02 / FASE</div><div class="map-art" aria-hidden="true"><i class="map-sun"></i><i class="map-mesa one"></i><i class="map-mesa two"></i><i class="map-dune"></i></div><h3>Deserto dos Esquecidos</h3><p>Um vasto sertão de areia, pedras e cactos.<br>Ao cair do sol, os morcegos despertam.</p><div class="stats"><span>DURAÇÃO <b>15 minutos</b></span><span>AMEAÇA <b>Morcegos</b></span></div><button aria-pressed="${map}" data-action="map" class="${map ? "primary" : ""}">${map ? "✓ Deserto selecionado" : "Escolher deserto"}</button></article></section><div class="selection-bottom"><p>WASD / setas ou controle de toque.<br>Caminhada e chicote automáticos.</p><button class="primary" data-action="play" ${character && map ? "" : "disabled"}>Jogar →</button></div>`;
    return this.root.querySelector("#character-preview");
  }
  shop(profile) {
    this.root.className = "selection-screen";
    this.root.innerHTML = `<header class="topline"><button class="text-button" data-action="select">← Preparação</button><span>ARMAZÉM DO VAQUEIRO</span><span>◈ ${profile.data.coins} moedas</span></header><section class="empty-shop"><p class="eyebrow">O BALCÃO AINDA ESTÁ VAZIO</p><h2>Loja de habilidades</h2><div class="shop-symbol" aria-hidden="true">✦</div><p>Novas habilidades chegarão em breve.<br>Recolha moedas nas partidas e guarde para depois.</p><p class="muted">Nenhuma habilidade disponível nesta versão.</p><button data-action="select">Voltar à preparação</button></section>`;
  }
  settings(profile) {
    this.root.className = "selection-screen";
    this.root.innerHTML = `<section class="settings-panel"><p class="eyebrow">AJUSTE SUA JORNADA</p><h2>Configurações</h2><label class="setting">Vento do menu<input type="checkbox" data-setting="wind" ${profile.data.wind ? "checked" : ""}></label><label class="setting">Sons do jogo<input type="checkbox" data-setting="sound" ${profile.data.sound ? "checked" : ""}></label><p>O cenário do menu respeita a preferência de movimento reduzido do sistema.</p><p id="save-status" role="status"></p><button data-action="menu">Voltar ao menu</button></section>`;
  }
  exit() {
    this.root.className = "selection-screen";
    this.root.innerHTML =
      '<section class="farewell"><p class="eyebrow">ATÉ A PRÓXIMA, FORASTEIRO.</p><h2>O deserto espera.</h2><p>Você pode fechar esta aba ou voltar ao menu.</p><button data-action="menu">Voltar ao menu</button></section>';
  }
  game() {
    this.root.className = "playing-screen";
    this.root.innerHTML = `<div id="game-host"></div><section class="hud" aria-label="Estado da partida"><div class="xp-track"><div id="xp-fill"></div></div><div class="hud-row"><div><strong>JOÃO VAQUEIRO</strong><div class="hp-track"><div id="hp-fill"></div></div><small id="hp-label"></small></div><div class="clock"><strong id="timer">15:00</strong><small>DESERTO DOS ESQUECIDOS</small></div><button class="pause-button" data-action="pause" aria-label="Pausar partida">Ⅱ</button></div><div class="hud-stats"><span id="level"></span><span id="xp-label"></span><span id="kills"></span><span id="coins"></span></div></section><div id="intro-caption" aria-live="polite"></div><div id="level-toast" role="status" hidden></div><div id="joystick" role="group" aria-label="Controle de direção por toque"><i></i></div><div class="controls-hint">WASD / SETAS · MOVIMENTO AUTOMÁTICO<br>ESC · PAUSAR</div><dialog id="run-dialog" aria-labelledby="run-dialog-title"></dialog>`;
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
    this.hud["hp-label"].textContent = `${p.hp} / 100`;
    this.hud["hp-fill"].style.width = `${p.hp}%`;
    this.hud["xp-fill"].style.width = `${(p.xp / run.requiredXp) * 100}%`;
    this.hud.level.textContent = `NÍVEL ${p.level}`;
    this.hud["xp-label"].textContent = `${p.xp} / ${run.requiredXp} XP`;
    this.hud.kills.textContent = `☠ ${run.kills}`;
    this.hud.coins.textContent = `◈ ${run.coins}`;
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
