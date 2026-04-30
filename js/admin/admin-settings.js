/**
 * admin-settings.js — Configuración de la tienda.
 */
window.AdminSettings = {
  load() {
    if (typeof ConfigService === 'undefined') return;
    const cfg = ConfigService.get();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    set('cfg-name',       cfg.storeName);
    set('cfg-hero-title',  cfg.heroTitle);
    set('cfg-hero-sub',    cfg.heroSubtitle);
    set('cfg-city',       cfg.city);
    set('cfg-instagram',  cfg.instagram);
    set('cfg-wa',         cfg.waNumber.replace(/^57/, ''));
  },

  async save() {
    const get = (id) => document.getElementById(id)?.value.trim() || '';

    const waRaw = get('cfg-wa').replace(/\D/g, '');
    if (!waRaw || waRaw.length < 7) {
      showToast('WhatsApp no válido.', true);
      return;
    }

    const btn = document.querySelector('button[onclick="saveConfig()"]');
    if (btn) btn.textContent = 'Guardando...';

    try {
      await ConfigService.save({
        storeName:    get('cfg-name') || 'Mi Tienda',
        heroTitle:    get('cfg-hero-title'),
        heroSubtitle: get('cfg-hero-sub'),
        city:         get('cfg-city') || 'Tu Ciudad',
        instagram:    get('cfg-instagram'),
        waNumber:     '57' + waRaw,
      });

      BrandConfig.apply();
      showToast('✅ Configuración global guardada');
    } catch (err) {
      showToast('❌ Error al guardar en la nube', true);
    } finally {
      if (btn) btn.textContent = 'Guardar Cambios';
    }
  },

  async reset() {
    if (!confirm('¿Restablecer configuración a valores por defecto?')) return;
    await ConfigService.reset();
    this.load();
    BrandConfig.apply();
    showToast('Restablecido a valores por defecto.');
  }
};
