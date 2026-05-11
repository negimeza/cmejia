/**
 * keyboard-shortcuts.js - Atajos de teclado para accesibilidad
 */
window.KeyboardShortcuts = {
  init() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  },

  handleKeydown(e) {
    // Ignorar si el usuario está en un input o textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }

    // Atajos de teclado
    switch (e.key) {
      case '/':
        // Focus en búsqueda (si existe)
        e.preventDefault();
        const searchInput = document.getElementById('inventory-search');
        if (searchInput) {
          searchInput.focus();
        }
        break;

      case 'c':
        // Abrir/cerrar carrito
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          window.toggleCart?.();
        }
        break;

      case 'Escape':
        // Cerrar modales y menús
        window.CatalogModal?.close();
        window.Cart?.close();
        window.App?.closeMenu();
        break;

      case 'Home':
        // Ir al inicio de la página
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        break;

      case 'End':
        // Ir al final de la página
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
        break;
    }
  },

  /**
   * Muestra ayuda de atajos de teclado
   */
  showHelp() {
    const shortcuts = [
      { key: 'Escape', action: 'Cerrar modales y menús' },
      { key: 'Ctrl/Cmd + C', action: 'Abrir/cerrar carrito' },
      { key: 'Ctrl/Cmd + Home', action: 'Ir al inicio' },
      { key: 'Ctrl/Cmd + End', action: 'Ir al final' },
      { key: 'Tab', action: 'Navegar entre elementos' },
      { key: 'Shift + Tab', action: 'Navegar hacia atrás' },
    ];

    console.log('🎹 Atajos de teclado disponibles:');
    shortcuts.forEach(({ key, action }) => {
      console.log(`  ${key.padEnd(20)} - ${action}`);
    });
  }
};

// Inicializar atajos de teclado
if (typeof window !== 'undefined') {
  window.KeyboardShortcuts.init();
}
