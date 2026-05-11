/**
 * admin-link.js — Muestra el ícono de acceso al panel admin en el header
 * solo cuando hay una sesión Supabase activa.
 * Depende de: window.sb (supabase-client.js).
 */
window.AdminLink = {
  init() {
    if (!window.sb?.auth) return;

    const update = (session) => {
      document.querySelectorAll('[data-admin-link]').forEach((el) => {
        el.classList.toggle('hidden', !session);
      });
    };

    sb.auth.getSession().then(({ data }) => update(data.session));
    sb.auth.onAuthStateChange((_, session) => update(session));
  },
};

window.AdminLink.init();
