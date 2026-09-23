import { ProfileService } from "../services/ProfileService.js";
import { AudioService } from "../services/AudioService.js";
import { InputService } from "../services/InputService.js";
import { GameViewModel } from "../viewmodels/GameViewModel.js";
import { ScreenView } from "../views/ScreenView.js";
import { DesertBackgroundView } from "../views/DesertBackgroundView.js";
import { GameView } from "../views/GameView.js";
import { CharacterPreview } from "../views/CharacterPreview.js";
import { MerchantView } from "../views/MerchantView.js";
import { upgradeCardsMarkup } from "../views/UpgradeCardsView.js";
import { preparationMarkup } from "../views/PreparationView.js";
import {
  permanentShopMarkup,
  permanentProducts,
  runShopMarkup,
} from "../views/ShopView.js";

export class GameApplication {
  constructor(root, canvas) {
    this.root = root;
    this.canvas = canvas;
    this.profile = new ProfileService();
    this.audio = new AudioService();
    this.screen = new ScreenView(
      root,
      (action) => this.action(action),
      (key, value) => this.setting(key, value),
    );
    this.character = false;
    this.current = "menu";
    this.shopReturn = "menu";
    this.controller = new AbortController();
    this.audio.setPreferences(this.profile.data.sound, this.profile.data.music);
    const activateAudio = () => this.audio.unlock();
    // Touch browsers may grant audio activation only on release/click.
    // Capture also handles controls that stop propagation.
    for (const event of [
      "pointerdown",
      "pointerup",
      "touchend",
      "click",
      "keydown",
    ])
      document.addEventListener(event, activateAudio, {
        signal: this.controller.signal,
        capture: true,
        passive: true,
      });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (
          document.hidden &&
          this.vm &&
          ["intro", "playing", "upgrade"].includes(this.vm.model.phase)
        ) {
          this.vm.paused = true;
          this.input.clear();
          this.showRunDialog();
        }
        if (document.hidden) this.audio.suspend();
        else this.audio.resume();
      },
      { signal: this.controller.signal },
    );
    this.show("menu");
  }
  ensureBackground() {
    this.canvas.hidden = false;
    if (!this.background)
      this.background = new DesertBackgroundView(this.canvas);
    this.background.setWind(this.profile.data.wind);
  }
  show(name) {
    if (name === "shop" && this.current !== "shop")
      this.shopReturn = ["select", "map-select"].includes(this.current)
        ? this.current
        : "menu";
    this.merchant?.dispose();
    this.merchant = null;
    this.preview?.dispose();
    this.preview = null;
    this.current = name;
    this.ensureBackground();
    this.audio.setPaused(false);
    this.audio.setMusic(name === "exit" ? null : "menu");
    if (name === "menu") {
      this.screen.menu();
      this.root
        .querySelector('[data-action="select"]')
        .insertAdjacentHTML(
          "afterend",
          `<button class="market-callout" data-action="shop"><span>◈ Mercado do Bento<small>Melhorias permanentes · ${this.profile.data.coins} moedas</small></span><span>→</span></button>`,
        );
      this.root.querySelector("footer span:last-child").textContent =
        "MERCADORES DO DESERTO / 0.4";
    } else if (name === "select" || name === "map-select") {
      this.root.className = "selection-screen preparation-screen";
      this.root.innerHTML = preparationMarkup(
        this.profile,
        name === "select" ? "character" : "map",
      );
      const host = this.root.querySelector("#character-preview");
      if (host) {
        try {
          this.preview = new CharacterPreview(host);
        } catch {
          host.textContent =
            "João Vaqueiro · chapéu de couro, gibão gasto e chicote";
        }
      }
    } else if (name === "shop") {
      this.root.className = "shop-screen";
      this.root.innerHTML = permanentShopMarkup(this.profile, this.shopReturn);
      const host = this.root.querySelector("#merchant-preview");
      try {
        this.merchant = new MerchantView(host);
      } catch {
        host.textContent = "Bento, o Andarilho";
      }
    } else if (name === "settings") {
      this.screen.settings(this.profile);
      this.screen.audioSettings();
    } else if (name === "exit") this.screen.exit();
    this.root.querySelector("h2, h1")?.setAttribute("tabindex", "-1");
  }
  action(action) {
    if (action === "test-audio") {
      const status = this.root.querySelector("#audio-status");
      if (status) status.textContent = "Carregando e testando os sons…";
      this.audio.test().then((message) => {
        if (status?.isConnected) status.textContent = message;
      });
      return;
    }
    if (action.startsWith("run-buy:")) {
      if (
        !this.vm ||
        this.vm.paused ||
        !this.vm.model.buyRunUpgrade(action.slice(8))
      )
        return;
      const id = action.slice(8);
      this.runDialog.innerHTML = runShopMarkup(this.vm.model);
      this.runDialog.querySelector("#run-shop-status").textContent =
        "“Bom negócio, viajante.” Melhoria aplicada somente nesta partida.";
      (
        this.runDialog.querySelector(
          `[data-action="run-buy:${id}"]:not(:disabled)`,
        ) || this.runDialog.querySelector('[data-action="leave-merchant"]')
      ).focus();
      this.audio.play("purchase", { ui: true });
      this.screen.updateHud(this.vm.model);
      return;
    }
    if (action === "leave-merchant") {
      this.vm?.model.leaveMerchant();
      this.input?.clear();
      this.accumulator = 0;
      this.last = null;
      this.showRunDialog();
      return;
    }
    if (action.startsWith("buy:")) {
      if (this.current !== "shop") return;
      const id = action.slice(4);
      if (this.profile.buyUpgrade(id)) {
        this.root.querySelector("#permanent-products").innerHTML =
          permanentProducts(this.profile);
        this.root.querySelector("#shop-wallet").textContent =
          `◈ ${this.profile.data.coins} guardadas`;
        this.root
          .querySelector(`[data-action="buy:${id}"]:not(:disabled)`)
          ?.focus();
        this.root.querySelector("#merchant-speech").textContent = this.profile
          .available
          ? "“Obrigado, viajante. Esta melhoria fica com você.”"
          : "“Obrigado, viajante.” Melhoria aplicada nesta sessão; não foi possível salvar.";
        this.merchant?.thank();
        this.audio.play("purchase");
      }
      return;
    }
    if (action.startsWith("card:")) {
      const [, id, token] = action.split(":");
      if (
        this.vm &&
        !this.vm.paused &&
        Number(token) === this.vm.model.pendingChoices &&
        this.vm.model.chooseAbility(id)
      ) {
        this.input.clear();
        this.accumulator = 0;
        this.screen.updateHud(this.vm.model);
        this.showRunDialog();
      }
      return;
    }
    if (
      ["menu", "select", "map-select", "shop", "settings", "exit"].includes(
        action,
      )
    ) {
      if (this.vm) this.endRun();
      this.show(action);
      return;
    }
    if (action === "character") {
      this.character = true;
      this.show("map-select");
      this.root.querySelector('[data-action="play"]').focus();
    }
    if (action === "play" && this.character && this.current === "map-select")
      this.startRun();
    if (action === "pause" || action === "resume") {
      this.vm?.togglePause();
      this.input?.clear();
      this.showRunDialog();
    }
    if (action === "retry") {
      this.endRun();
      this.startRun();
    }
  }
  setting(key, value) {
    if (!["sound", "wind", "music"].includes(key)) return;
    this.profile.data[key] = value;
    this.profile.save();
    this.audio.setPreferences(this.profile.data.sound, this.profile.data.music);
    this.background?.setWind(this.profile.data.wind);
    const status = this.root.querySelector("#save-status");
    if (status)
      status.textContent = this.profile.available
        ? "Preferência salva."
        : "Aplicado nesta sessão; salvamento indisponível.";
  }
  startRun() {
    if (this.vm) return;
    this.preview?.dispose();
    this.preview = null;
    this.merchant?.dispose();
    this.merchant = null;
    this.background?.dispose();
    this.background = null;
    this.canvas.hidden = true;
    this.audio.setPreferences(this.profile.data.sound, this.profile.data.music);
    this.audio.unlock();
    this.audio.setPaused(false);
    this.audio.setMusic("game");
    this.current = "game";
    this.vm = new GameViewModel(this.profile, this.audio);
    const elements = this.screen.game();
    try {
      this.gameView = new GameView(elements.host, this.vm.model);
    } catch (error) {
      this.vm = null;
      this.show("select");
      const message = document.createElement("p");
      message.setAttribute("role", "alert");
      message.textContent =
        "Não foi possível iniciar o 3D. Verifique WebGL e a aceleração de hardware do navegador.";
      this.root.append(message);
      console.error(error);
      return;
    }
    this.input = new InputService(elements.pad, () => {
      this.vm.togglePause();
      this.input.clear();
      this.showRunDialog();
    });
    this.runDialog = elements.dialog;
    this.runController = new AbortController();
    this.runDialog.addEventListener(
      "cancel",
      (event) => {
        event.preventDefault();
        if (this.vm.model.phase === "merchant") this.action("leave-merchant");
        else if (this.vm.paused) this.action("resume");
      },
      { signal: this.runController.signal },
    );
    this.last = null;
    this.accumulator = 0;
    this.hudTime = 0;
    this.dialogState = "";
    this.screen.updateHud(this.vm.model);
    this.frame = requestAnimationFrame(this.tick);
  }
  tick = (now) => {
    if (!this.vm) return;
    const delta =
      this.last === null ? 0 : Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (!this.vm.paused && ["intro", "playing"].includes(this.vm.model.phase)) {
      this.accumulator += delta;
      while (this.accumulator >= 1 / 60) {
        this.vm.update(1 / 60, this.input.read());
        this.accumulator -= 1 / 60;
        if (!["intro", "playing"].includes(this.vm.model.phase)) {
          this.accumulator = 0;
          break;
        }
      }
    } else this.accumulator = 0;
    this.gameView.render(this.vm.model);
    this.hudTime += delta;
    if (this.hudTime >= 0.1) {
      this.screen.updateHud(this.vm.model);
      this.hudTime = 0;
    }
    this.showRunDialog();
    this.frame = requestAnimationFrame(this.tick);
  };
  showRunDialog() {
    if (!this.vm || !this.runDialog) return;
    const run = this.vm.model,
      ended = ["defeat", "victory"].includes(run.phase),
      state = ended
        ? run.phase
        : this.vm.paused
          ? "paused"
          : run.phase === "upgrade"
            ? `upgrade:${run.pendingChoices}`
            : run.phase === "merchant"
              ? "merchant"
              : "";
    if (state === this.dialogState) return;
    this.dialogState = state;
    if (state) this.input?.clear();
    this.audio.setPaused(Boolean(state));
    this.runDialog.classList.toggle(
      "upgrade-dialog",
      state.startsWith("upgrade:"),
    );
    this.runDialog.classList.toggle("merchant-dialog", state === "merchant");
    if (!state) {
      this.runDialog.close();
      return;
    }
    this.runDialog.innerHTML =
      state === "merchant"
        ? runShopMarkup(run)
        : state.startsWith("upgrade:")
          ? upgradeCardsMarkup(run)
          : ended
            ? `<p class="eyebrow">${run.phase === "victory" ? "O SOL NASCE PARA OS FORTES" : "A POEIRA COBRE MAIS UMA HISTÓRIA"}</p><h2 id="run-dialog-title">${run.phase === "victory" ? "Você sobreviveu!" : "Fim da jornada"}</h2><p>${run.kills} inimigos · Nível ${run.player.level}<br>${run.coins} moedas restantes guardadas</p><p>${this.profile.available ? "Seu saldo foi salvo." : "Saldo disponível apenas nesta sessão."}</p><div class="dialog-actions"><button class="primary" data-action="retry">Jogar novamente</button><button data-action="select">Voltar à seleção</button></div>`
            : '<p class="eyebrow">RESPIRAR TAMBÉM É SOBREVIVER</p><h2 id="run-dialog-title">Partida pausada</h2><div class="dialog-actions"><button class="primary" data-action="resume">Continuar</button><button data-action="select">Encerrar e voltar</button></div>';
    if (!this.runDialog.open) this.runDialog.showModal();
  }
  endRun() {
    this.vm?.settle();
    this.audio.stopEffects();
    this.audio.setMusic(null);
    cancelAnimationFrame(this.frame);
    this.runController?.abort();
    this.runDialog?.close();
    this.input?.dispose();
    this.gameView?.dispose();
    this.vm = null;
    this.input = null;
    this.gameView = null;
    this.runDialog = null;
    this.last = null;
  }
  dispose() {
    this.endRun();
    this.preview?.dispose();
    this.merchant?.dispose();
    this.background?.dispose();
    this.audio.dispose();
    this.screen.dispose();
    this.controller.abort();
  }
}
