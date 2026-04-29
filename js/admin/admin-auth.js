/**
 * admin-auth.js — Gestión de sesiones y seguridad.
 */
window.AdminAuth = {
  init() {
    sb.auth.onAuthStateChange((_, session) => {
      session ? this.showDashboard(session.user) : this.showLogin();
    });

    const loginForm = document.getElementById('login-form');
    loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
  },

  showDashboard(user) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('admin-nav')?.classList.remove('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('user-email').textContent  = user.email;
    document.getElementById('user-avatar').textContent = user.email.charAt(0).toUpperCase();
    
    // Disparar carga inicial de datos
    window.AdminCategories?.load();
    window.AdminInventory?.load();
  },

  showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('admin-nav')?.classList.add('hidden');
    document.getElementById('user-info').classList.add('hidden');
  },

  async handleLogin(e) {
    e.preventDefault();
    const btn      = document.getElementById('btn-login');
    const errorDiv = document.getElementById('login-error');
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    btn.textContent = 'Verificando...';
    btn.disabled    = true;
    errorDiv.classList.add('hidden');

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      errorDiv.textContent = '❌ ' + this.translateError(error.message);
      errorDiv.classList.remove('hidden');
      btn.textContent = 'Iniciar sesión';
      btn.disabled    = false;
    }
  },

  async signOut() {
    await sb.auth.signOut();
    showToast('👋 Sesión cerrada correctamente');
  },

  translateError(msg) {
    const map = {
      'Invalid login credentials': 'Correo o contraseña incorrectos.',
      'Email not confirmed':       'Confirma tu correo electrónico primero.',
      'Too many requests':         'Demasiados intentos. Espera un momento.',
    };
    return map[msg] || msg;
  }
};
