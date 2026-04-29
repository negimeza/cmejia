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

  escapeAttr(str) {
    if (!str) return '';
    return str.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  },

  formatCurrency(num) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(num);
  }
};
