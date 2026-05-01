/**
 * brand-config.js — Aplicación universal de marca y configuración.
 * Centraliza la identidad de la tienda en todas las páginas.
 */
window.BrandConfig = {
  apply() {
    try {
      const cfg = window.ConfigService?.get();
      if (!cfg) return;

      this.applyRandomHero();

      const storeName = cfg.storeName || 'LupeOutfit';

      // 1. Títulos de Pestaña
      const isAdmin = window.location.pathname.includes('admin.html');
      document.title = isAdmin 
        ? `${storeName} Admin — Panel de Control`
        : `${storeName} – Catálogo Premium | Ropa Medellín`;

      // 1.5 Meta Tags (SEO / Sharing)
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTitle) metaTitle.content = `${storeName} – Colección Premium 2026`;
      
      // La descripción se deja "quemada" (hardcoded) en el HTML como pidió el usuario

      // 2. Logos (Header, Admin, Footer)
      const logos = [
        document.getElementById('header-logo'),
        document.getElementById('admin-logo'),
        document.getElementById('footer-logo-link')
      ];

      logos.forEach(logo => {
        if (logo) {
          // Si es el logo del admin, mantenemos el sufijo "Admin"
          const suffix = logo.id === 'admin-logo' ? ' <span class="logo-sep">·</span> <span class="logo-admin">Admin</span>' : '';
          logo.innerHTML = this.formatBrandText(storeName) + suffix;
        }
      });

      // 3. Hero Section (Página Principal)
      const heroTitle = document.getElementById('hero-title');
      if (heroTitle) {
        heroTitle.innerHTML = this.formatBrandText(cfg.heroTitle || storeName);
      }
      
      const heroSub = document.getElementById('hero-sub');
      if (heroSub) {
        heroSub.textContent = cfg.heroSubtitle || '';
      }
      
      const heroBadge = document.getElementById('hero-badge');
      if (heroBadge && cfg.city) {
        heroBadge.textContent = `📍 ${cfg.city} · Colección 2026`;
      }

      // 4. Contacto WhatsApp
      const waNum = cfg.waNumber || '573207101121';
      const waLocal = waNum.replace(/^57/, '');
      
      // Enlaces WhatsApp dinámicos
      document.querySelectorAll('.wa-link-btn').forEach(a => a.href = `https://wa.me/${waNum}`);
      
      const footerWaLink = document.getElementById('footer-wa-link');
      if (footerWaLink) footerWaLink.href = `https://wa.me/${waNum}`;
      
      const footerWaText = document.getElementById('footer-wa-text');
      if (footerWaText) {
        footerWaText.textContent = `+57 ${waLocal.slice(0,3)} ${waLocal.slice(3,6)} ${waLocal.slice(6)}`;
      }

      const waFloatBtn = document.getElementById('wa-float-btn');
      if (waFloatBtn) {
        waFloatBtn.href = `https://wa.me/${waNum}?text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20productos`;
      }

      // 5. Instagram
      const igLink = document.getElementById('footer-ig-link');
      if (igLink) {
        if (cfg.instagram) {
          igLink.href = `https://www.instagram.com/${cfg.instagram}`;
          const igText = document.getElementById('footer-ig-text');
          if (igText) igText.textContent = `@${cfg.instagram}`;
          igLink.classList.remove('hidden');
        } else {
          igLink.classList.add('hidden');
        }
      }

      // 6. Footer Copyright
      const footerCopy = document.getElementById('footer-copy');
      if (footerCopy) {
        footerCopy.innerHTML = `&copy; ${new Date().getFullYear()} ${storeName} &middot; Todos los derechos reservados`;
      }

    } catch (e) {
      console.warn('Error aplicando BrandConfig:', e);
    }
  },

  /**
   * Selecciona una imagen aleatoria para el fondo del Hero.
   */
  applyRandomHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Generamos un número del 1 al 5
    const randomNum = Math.floor(Math.random() * 5) + 1;
    const imgPath = `url('../mockups/hero-${randomNum}.png')`;
    
    console.log(`[Hero] Imagen aleatoria seleccionada: hero-${randomNum}.png`);
    
    hero.style.setProperty('--hero-bg', imgPath);
  },

  /** 
   * Formatea el nombre de la tienda.
   * Si tiene varias palabras, aplica itálica/gradiente a la última.
   * Si es una sola palabra, se mantiene uniforme (según solicitud del usuario).
   */
  formatBrandText(text) {
    if (!text) return '';
    const t = text.trim();
    
    const words = t.split(/\s+/);
    if (words.length > 1) {
      const last = words.pop();
      return `${words.join(' ')} <em>${last}</em>`;
    }
    
    // Una sola palabra: sin <em> para que sea un solo color como pidió el usuario
    return t;
  }
};
