/**
 * utils.js — Utilidades comunes.
 */
window.Utils = {
  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  },

  escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  escapeAttr(str) {
    return this.escapeHTML(str);
  },

  safeParse(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },

  formatCurrency(num) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(num ?? 0);
  },

  _scrollLock: 0,
  lockScroll() {
    if (this._scrollLock === 0) {
      document.body.style.overflow = 'hidden';
    }
    this._scrollLock++;
  },
  unlockScroll() {
    this._scrollLock = Math.max(0, this._scrollLock - 1);
    if (this._scrollLock === 0) {
      document.body.style.overflow = '';
    }
  }
};
