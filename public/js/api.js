const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('conf_token');
  },
  setToken(token) {
    localStorage.setItem('conf_token', token);
  },
  removeToken() {
    localStorage.removeItem('conf_token');
    localStorage.removeItem('conf_user');
  },
  getUser() {
    const u = localStorage.getItem('conf_user');
    return u ? JSON.parse(u) : null;
  },
  setUser(user) {
    localStorage.setItem('conf_user', JSON.stringify(user));
  },
  requireAuth() {
    if (!this.getToken()) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  },
  requireAdmin() {
    const user = this.getUser();
    if (!user || user.role !== 'admin') {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  },
  logout() {
    this.removeToken();
    window.location.href = '/index.html';
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
      this.removeToken();
      window.location.href = '/index.html';
      return null;
    }
    return res;
  },

  get(ep) { return this.request(ep, { method: 'GET' }); },
  post(ep, data) { return this.request(ep, { method: 'POST', body: JSON.stringify(data) }); },
  put(ep, data) { return this.request(ep, { method: 'PUT', body: JSON.stringify(data) }); },
  delete(ep) { return this.request(ep, { method: 'DELETE' }); }
};

// ===== Toast уведомления =====
function showToast(message, type = 'info', detail = '') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="bi ${icons[type] || icons.info} toast-icon ${type}"></i>
    <div class="toast-body">
      <p>${message}</p>
      ${detail ? `<span>${detail}</span>` : ''}
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ===== Форматирование даты =====
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isoToInput(dateStr) {
  if (!dateStr) return '';
  return dateStr.substring(0, 10);
}

// ===== Бейдж статуса =====
function statusBadge(status) {
  const map = {
    'Новая': 'badge-new',
    'Мероприятие назначено': 'badge-scheduled',
    'Мероприятие завершено': 'badge-completed'
  };
  const icons = {
    'Новая': 'bi-clock',
    'Мероприятие назначено': 'bi-calendar-check',
    'Мероприятие завершено': 'bi-check2-all'
  };
  const cls = map[status] || 'badge-new';
  const icon = icons[status] || 'bi-circle';
  return `<span class="badge ${cls}"><i class="bi ${icon}"></i> ${status}</span>`;
}

// ===== Тип помещения =====
function roomTypeName(type) {
  const map = { auditorium: 'Аудитория', coworking: 'Коворкинг', cinema: 'Кинозал' };
  return map[type] || type;
}
