const STORAGE_KEY = 'faroeste-survivors:menu:v1';

export class MenuModel {
  constructor(storage) {
    this.storage = storage;
    this.settings = { wind: true };
    try {
      const saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null');
      if (typeof saved?.wind === 'boolean') this.settings.wind = saved.wind;
    } catch { /* Storage may be unavailable or contain obsolete data. */ }
  }

  setWind(enabled) {
    this.settings.wind = Boolean(enabled);
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      return true;
    } catch { return false; }
  }
}
