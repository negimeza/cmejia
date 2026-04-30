/**
 * config.service.js — Gestión de configuración GLOBAL de la tienda en Supabase.
 * Mantiene un caché local para acceso síncrono.
 */

const CONFIG_CACHE_KEY = 'lupe_config_cache';

const CONFIG_DEFAULTS = {
  storeName:       'Mi Tienda',
  waNumber:        '570000000000',
  city:            'Tu Ciudad',
  heroTitle:       'Tu Estilo, Tu Regla.',
  heroSubtitle:    'Ropa espectacular para que te veas y te sientas increíble todos los días.',
  shippingMsg:     '* Envío a domicilio disponible',
  instagram:       '',
};

window.ConfigService = {
  _cache: JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY)) || { ...CONFIG_DEFAULTS },

  /**
   * Obtiene la configuración del caché (síncrono).
   */
  get() {
    return this._cache;
  },

  /**
   * Carga la configuración desde Supabase y actualiza el caché.
   */
  async load() {
    try {
      const { data, error } = await sb
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      if (data) {
        this._cache = {
          storeName:    data.store_name,
          waNumber:     data.wa_number,
          city:         data.city,
          heroTitle:    data.hero_title,
          heroSubtitle: data.hero_subtitle,
          shippingMsg:  data.shipping_msg,
          instagram:    data.instagram
        };
        localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(this._cache));
      }
      return this._cache;
    } catch (err) {
      console.warn('Usando configuración local (error Supabase):', err);
      return this._cache;
    }
  },

  /**
   * Guarda la configuración en Supabase y actualiza el caché.
   */
  async save(data) {
    try {
      // Mapeo de CamelCase a SnakeCase para Supabase
      const updateData = {
        store_name:    data.storeName,
        wa_number:     data.waNumber,
        city:          data.city,
        hero_title:    data.heroTitle,
        hero_subtitle: data.heroSubtitle,
        shipping_msg:  data.shippingMsg,
        instagram:     data.instagram,
        updated_at:    new Date()
      };

      const { error } = await sb
        .from('settings')
        .update(updateData)
        .eq('id', 1);

      if (error) throw error;

      // Actualizar caché local
      this._cache = { ...this._cache, ...data };
      localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(this._cache));
      return this._cache;
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      throw err;
    }
  },

  async reset() {
    // Para resetear, volvemos a los defaults en Supabase
    await this.save(CONFIG_DEFAULTS);
    return this._cache;
  }
};
