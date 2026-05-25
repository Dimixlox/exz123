document.addEventListener('DOMContentLoaded', async () => {
  if (!api.requireAuth()) return;
  if (!api.requireAdmin()) return;

  document.getElementById('logoutBtn').addEventListener('click', () => api.logout());

  let state = {
    page: 1,
    limit: 8,
    status: '',
    roomId: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    total: 0,
    totalPages: 0
  };

  let pendingBookingId = null;
  let pendingStatus = null;

  // Загрузка статистики
  async function loadStats() {
    try {
      const res = await api.get('/admin/stats');
      if (!res) return;
      const data = await res.json();
      document.getElementById('statTotal').textContent = data.total;
      document.getElementById('statNew').textContent = data.new;
      document.getElementById('statScheduled').textContent = data.scheduled;
      document.getElementById('statCompleted').textContent = data.completed;
    } catch { /* silent */ }
  }

  // Загрузка заявок
  async function loadBookings() {
    const tbody = document.getElementById('bookingsTbody');
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:2rem"><span class="spinner dark"></span></td></tr>`;

    const params = new URLSearchParams({
      page: state.page,
      limit: state.limit,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder
    });
    if (state.status) params.set('status', state.status);
    if (state.roomId) params.set('roomId', state.roomId);

    try {
      const res = await api.get(`/admin/bookings?${params}`);
      if (!res) return;
      const data = await res.json();

      state.total = data.total;
      state.totalPages = data.totalPages;

      renderTable(data.bookings);
      renderPagination();
    } catch {
      tbody.innerHTML = '<tr><td colspan="7"><div class="alert alert-danger m-2"><i class="bi bi-exclamation-triangle"></i> Ошибка загрузки</div></td></tr>';
    }
  }

  function renderTable(bookings) {
    const tbody = document.getElementById('bookingsTbody');
    document.getElementById('totalCount').textContent = state.total;

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">
            <i class="bi bi-inbox"></i>
            <h3>Заявок не найдено</h3>
            <p>Попробуйте изменить фильтры</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong>#${b.id}</strong></td>
        <td>
          <div><strong>${b.user?.fullName || '—'}</strong></div>
          <div class="text-muted" style="font-size:.8rem">${b.user?.login || ''}</div>
          <div class="text-muted" style="font-size:.8rem">${b.user?.phone || ''}</div>
        </td>
        <td>
          <div><strong>${b.room?.name || '—'}</strong></div>
          <div class="text-muted" style="font-size:.8rem">${roomTypeName(b.room?.type)}</div>
        </td>
        <td>${formatDate(b.conferenceDate)}</td>
        <td>${b.paymentMethod}</td>
        <td>${statusBadge(b.status)}</td>
        <td>
          <div class="d-flex gap-1 flex-wrap">
            ${b.status !== 'Мероприятие назначено' ? `
              <button class="btn btn-sm" style="background:var(--primary-light);color:var(--primary)"
                onclick="openStatusModal(${b.id}, 'Мероприятие назначено')" title="Назначить">
                <i class="bi bi-calendar-check"></i>
              </button>` : ''}
            ${b.status !== 'Мероприятие завершено' ? `
              <button class="btn btn-sm" style="background:#d1fae5;color:var(--success)"
                onclick="openStatusModal(${b.id}, 'Мероприятие завершено')" title="Завершить">
                <i class="bi bi-check2-all"></i>
              </button>` : ''}
            ${b.status !== 'Новая' ? `
              <button class="btn btn-sm" style="background:#fef3c7;color:var(--warning)"
                onclick="openStatusModal(${b.id}, 'Новая')" title="Вернуть">
                <i class="bi bi-arrow-counterclockwise"></i>
              </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderPagination() {
    const pag = document.getElementById('pagination');
    if (state.totalPages <= 1) { pag.innerHTML = ''; return; }

    let html = `
      <button class="page-btn" onclick="changePage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''}>
        <i class="bi bi-chevron-left"></i>
      </button>`;

    for (let i = 1; i <= state.totalPages; i++) {
      if (i === 1 || i === state.totalPages || Math.abs(i - state.page) <= 1) {
        html += `<button class="page-btn ${i === state.page ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
      } else if (Math.abs(i - state.page) === 2) {
        html += `<span class="page-info">...</span>`;
      }
    }

    html += `
      <button class="page-btn" onclick="changePage(${state.page + 1})" ${state.page >= state.totalPages ? 'disabled' : ''}>
        <i class="bi bi-chevron-right"></i>
      </button>
      <span class="page-info">Стр. ${state.page} из ${state.totalPages} (${state.total} заявок)</span>`;

    pag.innerHTML = html;
  }

  // Открытие модального окна смены статуса
  window.openStatusModal = (bookingId, newStatus) => {
    pendingBookingId = bookingId;
    pendingStatus = newStatus;
    const statusLabels = {
      'Новая': '<span class="badge badge-new">Новая</span>',
      'Мероприятие назначено': '<span class="badge badge-scheduled">Мероприятие назначено</span>',
      'Мероприятие завершено': '<span class="badge badge-completed">Мероприятие завершено</span>'
    };
    document.getElementById('newStatusLabel').innerHTML = statusLabels[newStatus] || newStatus;
    document.getElementById('statusModal').classList.remove('hidden');
  };

  document.getElementById('closeStatusModal').addEventListener('click', () => {
    document.getElementById('statusModal').classList.add('hidden');
  });

  document.getElementById('cancelStatusBtn').addEventListener('click', () => {
    document.getElementById('statusModal').classList.add('hidden');
  });

  document.getElementById('confirmStatusBtn').addEventListener('click', async () => {
    const btn = document.getElementById('confirmStatusBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      const res = await api.put(`/admin/bookings/${pendingBookingId}/status`, { status: pendingStatus });
      if (!res) return;
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'Ошибка', 'error');
      } else {
        showToast('Статус успешно изменён!', 'success', `Заявка #${pendingBookingId} → ${pendingStatus}`);
        document.getElementById('statusModal').classList.add('hidden');
        await Promise.all([loadBookings(), loadStats()]);
      }
    } catch {
      showToast('Ошибка соединения', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Подтвердить';
    }
  });

  // Пагинация
  window.changePage = (p) => {
    if (p < 1 || p > state.totalPages) return;
    state.page = p;
    loadBookings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Фильтры
  document.getElementById('filterStatus').addEventListener('change', (e) => {
    state.status = e.target.value;
    state.page = 1;
    loadBookings();
  });

  document.getElementById('filterRoom').addEventListener('change', (e) => {
    state.roomId = e.target.value;
    state.page = 1;
    loadBookings();
  });

  document.getElementById('resetFilters').addEventListener('click', () => {
    state.status = '';
    state.roomId = '';
    state.page = 1;
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterRoom').value = '';
    loadBookings();
  });

  // Сортировка
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortBy === field) {
        state.sortOrder = state.sortOrder === 'ASC' ? 'DESC' : 'ASC';
      } else {
        state.sortBy = field;
        state.sortOrder = 'DESC';
      }

      document.querySelectorAll('th[data-sort]').forEach(t => {
        t.classList.remove('active');
        t.querySelector('.sort-icon').className = 'sort-icon bi bi-arrow-down-up';
      });
      th.classList.add('active');
      th.querySelector('.sort-icon').className = `sort-icon bi bi-arrow-${state.sortOrder === 'ASC' ? 'up' : 'down'}`;

      state.page = 1;
      loadBookings();
    });
  });

  // Загрузка фильтра помещений
  async function loadRoomFilter() {
    try {
      const res = await api.get('/bookings/rooms');
      if (!res) return;
      const rooms = await res.json();
      const sel = document.getElementById('filterRoom');
      rooms.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name;
        sel.appendChild(opt);
      });
    } catch { /* silent */ }
  }

  await Promise.all([loadStats(), loadBookings(), loadRoomFilter()]);
});
