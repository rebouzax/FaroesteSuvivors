export class MainMenuViewModel {
  constructor(model, { onNewGame = () => {} } = {}) {
    this.model = model;
    this.onNewGame = onNewGame;
    this.screen = 'menu';
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() { return { screen: this.screen, ...this.model.settings }; }
  notify() { for (const listener of this.listeners) listener(this.snapshot()); }
  navigate(screen) {
    if (!['menu', 'settings', 'exit', 'new-game'].includes(screen)) return;
    this.screen = screen;
    this.notify();
    if (screen === 'new-game') this.onNewGame();
  }
  setWind(enabled) {
    const saved = this.model.setWind(enabled);
    this.notify();
    return saved;
  }
}
