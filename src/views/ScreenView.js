import logoUrl from "../assets/logo-faroeste-survivors.webp";
import { ABILITY_IDS } from "../config/abilityConfig.js";
import { CHARACTERS } from "../config/characterConfig.js";
import { t, LANGUAGES } from "../services/I18n.js";
import { gameIcon } from "./GameIcons.js";
import { CAMPAIGN } from "../config/campaignConfig.js";
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
          onSetting(
            e.target.dataset.setting,
            e.target.type === "checkbox" ? e.target.checked : e.target.value,
          );
      },
      options,
    );
  }
  languageSelect(lang) {
    return `<label class="language-picker"><span>${t(lang, "language")}</span><select data-setting="language" aria-label="${t(lang, "language")}">${Object.entries(
      LANGUAGES,
    )
      .map(
        ([id, name]) =>
          `<option value="${id}" ${lang === id ? "selected" : ""}>${name}</option>`,
      )
      .join("")}</select></label>`;
  }
  menu(lang = "en") {
    this.root.className = "";
    this.root.innerHTML = `<header class="topline menu-topline">${this.languageSelect(lang)}</header><section class="menu-panel"><h1 class="game-logo"><img src="${logoUrl}" alt="Faroeste Survivors"></h1><nav aria-label="${t(lang, "menu")}"><button class="primary" data-action="modes">${t(lang, "newGame")} <span>↗</span></button><button data-action="settings">${t(lang, "settings")} <span>⚙</span></button><button data-action="exit">${t(lang, "exit")} <span>→</span></button></nav></section>`;
  }
  settings(profile) {
    const lang = profile.data.language;
    this.root.className = "selection-screen";
    this.root.innerHTML = `<section class="settings-panel"><h2>${t(lang, "settingsTitle")}</h2>${this.languageSelect(lang)}<label class="setting">${t(lang, "wind")}<input type="checkbox" data-setting="wind" ${profile.data.wind ? "checked" : ""}></label><label class="setting">${t(lang, "sound")}<input type="checkbox" data-setting="sound" ${profile.data.sound ? "checked" : ""}></label><label class="setting">${t(lang, "music")}<input type="checkbox" data-setting="music" ${profile.data.music ? "checked" : ""}></label><section class="tutorial-settings"><h3>${t(lang, "tutorialTitle")}</h3><ul><li>${t(lang, "tutorialMove")}</li><li>${t(lang, "tutorialAttack")}</li><li>${t(lang, "tutorialLoot")}</li><li>${t(lang, "tutorialShop")}</li><li>${t(lang, "tutorialCards")}</li></ul></section><p id="save-status" role="status"></p><button data-action="menu">${t(lang, "backMenu")}</button></section>`;
  }
  audioSettings(lang = "en") {
    this.root
      .querySelector("#save-status")
      .insertAdjacentHTML(
        "afterend",
        `<button data-action="test-audio">${t(lang, "testAudio")}</button><p id="audio-status" role="status" aria-live="polite"></p>`,
      );
  }
  exit(lang = "en") {
    this.root.className = "selection-screen";
    this.root.innerHTML = `<section class="farewell"><p class="eyebrow">${t(lang, "goodbye")}</p><h2>${t(lang, "farewell")}</h2><p>${t(lang, "closeTab")}</p><button data-action="menu">${t(lang, "backMenu")}</button></section>`;
  }
  game(run, lang = "en") {
    this.root.className = "playing-screen";
    this.root.innerHTML = `<div id="game-host"></div><section class="hud" aria-label="HUD"><div class="xp-track"><div id="xp-fill"></div></div><div class="hud-row"><div class="hud-hero"><strong>${CHARACTERS[run.characterId].name.toUpperCase()}</strong><div class="hp-track"><div id="hp-fill"></div></div><small id="hp-label"></small></div><div class="clock"><strong id="timer">15:00</strong><small>${t(lang, "map." + run.mapId)}</small></div><button class="pause-button" data-action="pause" aria-label="${t(lang, "pause")}">Ⅱ</button></div><div class="hud-stats"><span id="level"></span><span id="xp-label"></span><span id="kills"></span><span id="coins"></span></div><div id="mission-hud" class="mission-hud" hidden></div><div id="weather-hud" class="weather-hud" hidden></div><p id="vulture-warning" class="vulture-warning" role="status" hidden></p><div id="boss-hud" class="boss-hud" role="status" hidden><strong id="boss-name"></strong><div class="boss-health"><i id="boss-health-fill"></i></div><small id="boss-health-label"></small></div></section><div id="merchant-compass" class="merchant-compass" role="status" hidden><span class="merchant-compass-arrow" aria-hidden="true">▲</span>${gameIcon("merchant")}<span class="merchant-compass-distance" id="merchant-range"></span></div><div class="ability-bar" id="ability-bar" aria-label="${t(lang, "abilitiesTitle")}"></div><div id="intro-caption" aria-live="polite"></div><div id="level-toast" role="status" hidden></div><div id="joystick" aria-hidden="true"><i></i></div><dialog id="run-dialog" aria-labelledby="run-dialog-title"></dialog>`;
    if (run.mode === "story")
      this.root.querySelector(".hud-stats").insertAdjacentHTML("beforeend", '<span id="story-progress"></span>');
    this.abilityKey = "";
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
  updateHud(run, lang = "en", merchantPosition = null) {
    const p = run.player,
      remaining = Math.max(0, Math.ceil(900 - run.time));
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0"),
      seconds = String(remaining % 60).padStart(2, "0");
    const hint = this.root.querySelector("#merchant-compass");
    hint.hidden = !run.merchant || !merchantPosition;
    if (run.merchant && merchantPosition) {
      const dx = run.merchant.x - p.x,
        dz = run.merchant.z - p.z;
      const arrows = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
      hint.setAttribute(
        "aria-label",
        t(lang, "merchantHint", {
          arrow:
            arrows[(Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) + 8) % 8],
          distance: Math.round(Math.hypot(dx, dz)),
          time: Math.ceil(run.merchant.leavesAt - run.time),
        }),
      );
      hint.style.left = `${merchantPosition.x}px`;
      hint.style.top = `${merchantPosition.y}px`;
      hint.style.setProperty("--bearing", `${merchantPosition.bearing}deg`);
      hint.classList.toggle("on-screen", merchantPosition.onScreen);
      this.root.querySelector("#merchant-range").textContent =
        `${Math.round(Math.hypot(dx, dz))} m`;
    }
    const warning = this.root.querySelector("#vulture-warning");
    warning.hidden = !run.enemies.some((e)=>e.type==="vulture"&&e.warning>0) && !run.bossTelegraph;
    warning.textContent = run.bossTelegraph ? `${t(lang,"boss."+run.bossEncounter.bossId)} · ${t(lang,"pattern."+run.bossTelegraph.pattern)}`:t(lang,"warningVultures");
    const boss = run.enemies.find(
        (e) => ["boss", "marshal"].includes(e.type) && e.hp > 0,
      ),
      bossHud = this.root.querySelector("#boss-hud");
    bossHud.hidden = !run.bossEncounter.active || !boss;
    if (boss) {
      this.root.querySelector("#boss-name").textContent = t(
        lang,
        boss.bossId ? "boss." + boss.bossId : boss.type === "marshal" ? "bossMarshal" : "bossFire",
      );
      this.root.querySelector("#boss-health-fill").style.width =
        `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
      this.root.querySelector("#boss-health-label").textContent = t(
        lang,
        "bossLife",
        { hp: Math.ceil(boss.hp), max: boss.maxHp },
      );
    }
    const mission = this.root.querySelector("#mission-hud");
    mission.hidden = !run.mission;
    if (run.mission)
      mission.textContent = `✦ ${t(lang, "mission")} · ${t(lang, "mission" + run.mission.kind[0].toUpperCase() + run.mission.kind.slice(1))} ${run.mission.progress}/${run.mission.target} · ${t(lang, "missionTime", { time: Math.ceil(run.mission.expiresAt - run.time) })}`;
    const weather = this.root.querySelector("#weather-hud");
    weather.hidden = !(run.time < run.weather.alertUntil);
    if (!weather.hidden)
      weather.textContent = t(
        lang,
        run.weather.alert === "wind" ? "stormWarning" : "missionFailed",
      );
    this.hud.timer.textContent = `${minutes}:${seconds}`;
    this.hud["hp-label"].textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    this.hud["hp-fill"].style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
    this.hud["xp-fill"].style.width = `${(p.xp / run.requiredXp) * 100}%`;
    this.hud.level.textContent = `${t(lang, "level")} ${p.level}`;
    this.hud["xp-label"].textContent = `${p.xp} / ${run.requiredXp} XP`;
    this.hud.kills.textContent = `☠ ${run.kills}`;
    this.hud.coins.textContent = `◈ ${run.coins}`;
    if (run.mode === "story")
      this.root.querySelector("#story-progress").textContent = t(lang,"storyProgress",{
        missions:run.missionsCompleted,total:CAMPAIGN[run.mapId].missions.length,bosses:run.bossEncounter.nextBoss,all:CAMPAIGN[run.mapId].bosses.length,
      });
    // Ícones só mudam quando uma carta é adquirida; evita reconstruir vários
    // SVGs a cada atualização da HUD durante o combate.
    const abilityKey = `${lang}:${ABILITY_IDS.map((id) => run.abilities[id]).join(",")}`;
    if (abilityKey !== this.abilityKey) {
      this.abilityKey = abilityKey;
      this.root.querySelector("#ability-bar").innerHTML = ABILITY_IDS
        .filter((id) => run.abilities[id])
        .map((id) => `<span class="ability-item" title="${t(lang, "ability." + id)}" aria-label="${t(lang, "ability." + id)} ${run.abilities[id]}">${gameIcon(id)}</span>`)
        .join("");
    }
    this.hud["intro-caption"].textContent =
      run.phase === "intro"
        ? `${CHARACTERS[run.characterId].name.toUpperCase()} · ${Math.max(1, Math.ceil(6 - run.introTime))}`
        : "";
    this.hud["level-toast"].hidden = run.levelFlash <= 0;
    this.hud["level-toast"].textContent = t(lang, "perkAlert", {
      level: p.level,
    });
  }
  dispose() {
    this.controller.abort();
    this.root.replaceChildren();
  }
}
