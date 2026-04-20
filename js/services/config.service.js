/**
 * config.service.js — Gestión de configuración local de la tienda.
 * Almacena en localStorage con la clave 'lupe_config'.
 */

const CONFIG_KEY = 'lupe_config';

const CONFIG_DEFAULTS = {
  storeName:       'LupeOutfit',
  waNumber:        '573207101121', // PRUEBA — original: 573206419934
  city:            'Medellín',
  heroTitle:       'Tu Estilo, Tu Regla.',
  heroSubtitle:    'Moda boutique exclusiva para quienes buscan destacar. Envíos rápidos y atención personalizada.',
  shippingMsg:     '* Envío gratis en Medellín',
  instagram:       '',
};

window.ConfigService = {
  get() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? { ...CONFIG_DEFAULTS, ...JSON.parse(saved) } : { ...CONFIG_DEFAULTS };
    } catch {
      return { ...CONFIG_DEFAULTS };
    }
  },

  save(data) {
    const current = this.get();
    const merged  = { ...current, ...data };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
    return merged;
  },

  reset() {
    localStorage.removeItem(CONFIG_KEY);
    return { ...CONFIG_DEFAULTS };
  },
};
