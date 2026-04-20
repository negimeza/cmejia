/**
 * supabase-client.js — Cliente singleton de Supabase.
 * Depende de: supabase CDN (window.supabase) y supabase-config.js (window.SUPABASE_CONFIG)
 */
window.sb = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.key
);
