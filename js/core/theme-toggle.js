/**
 * theme-toggle.js — Cambio de tema claro/oscuro.
 * Cambia data-theme en <html> y persiste en localStorage.
 */
window.ThemeToggle = {
  _key: 'lupe_theme',

  init() {
    const saved = localStorage.getItem(this._key);
    if (saved) {
      this._apply(saved);
    }
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this._apply(next);
  },

  _apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this._key, theme);
  }
};