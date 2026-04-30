/**
 * catalog-config.js — Aplicación de marca y configuración en la tienda.
 */
window.CatalogConfig = {
  apply() {
    try {
      const cfg = ConfigService.get();
      if (!cfg) return;

      // 1. Branding (Logo y Títulos)
      if (cfg.storeName) {
        document.title = `${cfg.storeName} – Catálogo Premium`;
        const logo = document.getElementById('header-logo');
        if (logo) logo.innerHTML = this.formatBoutiqueText(cfg.storeName);
      }

      // 2. Hero Section
      const heroTitle = document.getElementById('hero-title');
      if (heroTitle && cfg.storeName) {
        heroTitle.innerHTML = this.formatBoutiqueText(cfg.storeName);
      }
      
      const heroCity = document.getElementById('hero-badge');
      if (heroCity && cfg.city) {
        heroCity.textContent = `📍 ${cfg.city} · Colección 2026`;
      }

      // 3. Contacto y Footer
      const waNum = cfg.waNumber || '573207101121';
      const waLocal = waNum.replace(/^57/, '');
      
      // WhatsApp Links
      document.querySelectorAll('.wa-link-btn').forEach(a => a.href = `https://wa.me/${waNum}`);
      const waLink = document.getElementById('footer-wa-link');
      if (waLink) waLink.href = `https://wa.me/${waNum}`;
      const waText = document.getElementById('footer-wa-text');
      if (waText) waText.textContent = `+57 ${waLocal.slice(0,3)} ${waLocal.slice(3,6)} ${waLocal.slice(6)}`;

      // Botón flotante WA
      const waFloatBtn = document.getElementById('wa-float-btn');
      if (waFloatBtn) {
        waFloatBtn.href = `https://wa.me/${waNum}?text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20productos`;
      }

      // Instagram
      const igLink = document.getElementById('footer-ig-link');
      if (cfg.instagram && igLink) {
        igLink.href = `https://www.instagram.com/${cfg.instagram}`;
        const igText = document.getElementById('footer-ig-text');
        if (igText) igText.textContent = `@${cfg.instagram}`;
        igLink.classList.remove('hidden');
      }

      // Footer Logo (nuevo layout)
      const footerLogo = document.getElementById('footer-logo-link');
      if (footerLogo && cfg.storeName) footerLogo.innerHTML = this.formatBoutiqueText(cfg.storeName);

    } catch (e) {
      console.warn('Error aplicando config:', e);
    }
  },

  /** 
   * Formatea el texto con el estilo Boutique (última palabra en itálica/gradiente)
   */
  formatBoutiqueText(text) {
    if (!text) return '';
    const t = text.trim();
    if (t.toLowerCase() === 'lupeoutfit') return 'Lupe<em>Outfit</em>';
    
    const words = t.split(/\s+/);
    if (words.length > 1) {
      const last = words.pop();
      return `${words.join(' ')} <em>${last}</em>`;
    }
    
    const mid = Math.floor(t.length / 2);
    return `${t.substring(0, mid)}<em>${t.substring(mid)}</em>`;
  }
};
