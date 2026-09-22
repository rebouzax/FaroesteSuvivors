export class MainMenuView {
  constructor(root, viewModel) {
    this.root = root;
    this.vm = viewModel;
    this.controller = new AbortController();
    root.innerHTML = `
      <header class="topline"><span>EST. 1887 / TERRAS SEM LEI</span><span>CAPÍTULO ZERO</span></header>
      <section class="menu-panel" aria-label="Menu principal">
        <p class="eyebrow">UM SOL IMPLACÁVEL. UMA ÚLTIMA CHANCE.</p>
        <h1>FAROESTE<span>SURVIVORS</span></h1>
        <p class="tagline">O deserto não enterra seus mortos.<br>Ele os devolve.</p>
        <div class="ornament" aria-hidden="true">────── ✦ ──────</div>
        <nav aria-label="Opções do jogo">
          <button class="primary" data-screen="new-game">Novo jogo <span aria-hidden="true">↗</span></button>
          <button data-screen="settings">Configurações <span aria-hidden="true">⚙</span></button>
          <button data-screen="exit">Sair <span aria-hidden="true">→</span></button>
        </nav>
        <p class="menu-note">SOBREVIVA ATÉ O ÚLTIMO PÔR DO SOL</p>
      </section>
      <section class="farewell" hidden tabindex="-1"><p class="eyebrow">ATÉ A PRÓXIMA, FORASTEIRO.</p><h2>O deserto espera.</h2><p>Você pode fechar esta aba ou voltar ao menu.</p><button data-screen="menu">Voltar ao menu</button></section>
      <footer><span>UM SURVIVOR NO VELHO OESTE</span><span>MENU PROTÓTIPO / 0.1</span></footer>
      <dialog aria-labelledby="dialog-title"><div class="dialog-content"></div></dialog>`;
    this.dialog = root.querySelector('dialog');
    const options = { signal: this.controller.signal };
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-screen]');
      if (button) this.vm.navigate(button.dataset.screen);
    }, options);
    root.addEventListener('change', event => {
      if (event.target.id === 'wind-toggle') {
        const saved = this.vm.setWind(event.target.checked);
        root.querySelector('.save-status').textContent = saved ? 'Preferência salva neste navegador.' : 'Aplicado nesta sessão; não foi possível salvar.';
      }
    }, options);
    this.dialog.addEventListener('cancel', event => {
      event.preventDefault();
      this.vm.navigate('menu');
    }, options);
    this.unsubscribe = this.vm.subscribe(state => this.render(state));
  }

  render(state) {
    const exiting = state.screen === 'exit';
    this.root.querySelector('.menu-panel').hidden = exiting;
    const farewell = this.root.querySelector('.farewell');
    farewell.hidden = !exiting;
    if (state.screen === 'settings' || state.screen === 'new-game') {
      if (!this.dialog.open) {
        this.root.querySelector('.dialog-content').innerHTML = state.screen === 'settings'
          ? `<p class="eyebrow">AJUSTE SUA JORNADA</p><h2 id="dialog-title">Configurações</h2><label class="setting"><span>Vento e areia animados</span><input id="wind-toggle" type="checkbox" ${state.wind ? 'checked' : ''}></label><p>O modo de movimento reduzido do sistema também é respeitado.</p><p class="save-status" role="status"></p><button data-screen="menu">Voltar</button>`
          : `<p class="eyebrow">A JORNADA COMEÇA AQUI</p><h2 id="dialog-title">Prepare seu revólver.</h2><p>O menu está pronto. A partida será implementada na próxima etapa.</p><button data-screen="menu">Voltar ao menu</button>`;
        this.dialog.showModal();
      }
    } else {
      if (this.dialog.open) this.dialog.close();
      if (exiting) farewell.focus();
    }
  }

  dispose() { this.unsubscribe(); this.controller.abort(); this.dialog.close(); this.root.replaceChildren(); }
}
