/**
 * admin-ui.js — Orquestación de la interfaz (Tabs, Menú Móvil).
 */
window.AdminUI = {
  init() {
    // Escuchar tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeMobileNav();
    });

    // Checkbox de activo
    const activeCheck = document.getElementById('p-active');
    activeCheck?.addEventListener('change', () => {
      const label = document.getElementById('toggle-label-text');
      if (label) label.textContent = activeCheck.checked ? 'Visible' : 'Oculto';
    });
  },

  switchTab(tabId, btnEl) {
    document.querySelectorAll('.tab-content').forEach(t => {
      t.classList.remove('active');
      t.classList.add('hidden');
    });
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById('tab-' + tabId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }
    btnEl?.classList.add('active');

    // Cargas perezosas
    if (tabId === 'inventory')  window.AdminInventory?.load();
    if (tabId === 'categories') window.AdminCategories?.load();
    if (tabId === 'settings')   window.AdminSettings?.load();
  },

  toggleMobileNav() {
    const nav = document.getElementById('mobile-nav');
    const overlay = document.getElementById('mobile-nav-overlay');
    const btn = document.getElementById('hamburger-btn');
    const isOpen = nav.classList.contains('visible');

    if (isOpen) {
      this.closeMobileNav();
    } else {
      nav.classList.add('visible');
      overlay.classList.add('visible');
      btn.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeMobileNav() {
    const nav = document.getElementById('mobile-nav');
    const overlay = document.getElementById('mobile-nav-overlay');
    const btn = document.getElementById('hamburger-btn');
    if (nav) nav.classList.remove('visible');
    if (overlay) overlay.classList.remove('visible');
    if (btn) btn.classList.remove('open');
    document.body.style.overflow = '';
  },

  switchTabMobile(tabId, clickedBtn) {
    document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
    clickedBtn?.classList.add('active');

    const desktopBtn = document.querySelector(`.tab-btn[onclick*="'${tabId}'"]`);
    this.switchTab(tabId, desktopBtn);
    this.closeMobileNav();
  }
};
