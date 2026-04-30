/**
 * admin-settings.js — Configuración de la tienda.
 */
window.AdminSettings = {
  load() {
    if (typeof ConfigService === 'undefined') return;
    const cfg = ConfigService.get();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    set('cfg-name',       cfg.storeName);
    set('cfg-city',       cfg.city);
    set('cfg-instagram',  cfg.instagram);
    set('cfg-wa',         cfg.waNumber.replace(/^57/, ''));
  },

  save() {
    const get = (id) => document.getElementById(id)?.value.trim() || '';

    const waRaw = get('cfg-wa').replace(/\D/g, '');
    if (!waRaw || waRaw.length < 7) {
      showToast('WhatsApp no válido.', true);
      return;
    }

    ConfigService.save({
      storeName:    get('cfg-name') || 'LupeOutfit',
      city:         get('cfg-city') || 'Medellín',
      instagram:    get('cfg-instagram'),
      waNumber:     '57' + waRaw,
    });

    BrandConfig.apply();
    showToast('Configuración guardada.');
  },

  reset() {
    ConfigService.reset();
    this.load();
    showToast('Restablecido a valores por defecto.');
  }
};
