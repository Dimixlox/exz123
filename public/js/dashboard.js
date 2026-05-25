document.addEventListener('DOMContentLoaded', async () => {
  if (!api.requireAuth()) return;
  const user = api.getUser();
  if (user?.role === 'admin') { window.location.href = '/admin.html'; return; }

  document.getElementById('userName').textContent = user?.fullName || user?.login || '';
  document.getElementById('logoutBtn').addEventListener('click', () => api.logout());

  let rooms = [];
  let bookings = [];

  await Promise.all([loadRooms(), loadBookings()]);

  function initSwiper() {
    if (rooms.length === 0) return;
    new Swiper('#roomSwiper', {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: rooms.length > 1,
      autoplay: { delay: 4000, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      breakpoints: {
        640: { slidesPerView: 1 },
        900: { slidesPerView: rooms.length >= 2 ? 2 : 1 }
      }
    });
  }

  async function loadRooms() {
    try {
      const res = await api.get('/bookings/rooms');
      if (!res) return;
      rooms = await res.json();
      renderSlider();
      initSwiper();
    } catch { /* silent */ }
  }

  function renderSlider() {
    const wrap = document.getElementById('swiperWrapper');
    const typeIcons = { auditorium: 'bi-mortarboard', coworking: 'bi-laptop', cinema: 'bi-camera-video' };

    wrap.innerHTML = rooms.map(r => `
      <div class="swiper-slide">
        <div class="slide-card">
          <img src="${r.imageUrl}" alt="${r.name}" onerror="this.src='https://placehold.co/800x300/2563eb/white?text=${encodeURIComponent(r.name)}'">
          <div class="slide-overlay">
            <h3><i class="bi ${typeIcons[r.type] || 'bi-building'}"></i> ${r.name}</h3>
            <p>${r.description.substring(0, 90)}...</p>
            <div class="slide-meta">
              <span><i class="bi bi-people"></i> до ${r.capacity} чел.</span>
              <span><i class="bi bi-cash"></i> ${r.pricePerHour.toLocaleString('ru')} ₽/ч</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  async function loadBookings() {
    const list = document.getElementById('bookingsList');
    list.innerHTML = '<div class="empty-state"><span class="spinner dark"></span></div>';
    try {
      const res = await api.get('/bookings');
      if (!res) return;
      bookings = await res.json();
      renderBookings();
    } catch {
      list.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> Ошибка загрузки заявок</div>';
    }
  }

  function renderBookings() {
    const list = document.getElementById('bookingsList');
    document.getElementById('bookingsCount').textContent = bookings.length;

    if (bookings.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-calendar-x"></i>
          <h3>Заявок пока нет</h3>
          <p>Создайте первую заявку на бронирование</p>
          <a href="/booking.html" class="btn btn-primary mt-2"><i class="bi bi-plus-circle"></i> Создать заявку</a>
        </div>`;
      return;
    }

    list.innerHTML = bookings.map(b => buildBookingCard(b)).join('');
    attachReviewHandlers();
  }

  function buildBookingCard(b) {
    const statusCls = {
      'Новая': 'status-new',
      'Мероприятие назначено': 'status-scheduled',
      'Мероприятие завершено': 'status-completed'
    }[b.status] || 'status-new';

    const canReview = b.status !== 'Новая' && !b.review;
    const hasReview = !!b.review;

    return `
      <div class="booking-card ${statusCls}">
        <div class="booking-info">
          <h4><i class="bi bi-building"></i> ${b.room?.name || 'Помещение'}</h4>
          <p>
            <i class="bi bi-calendar3"></i> ${formatDate(b.conferenceDate)} &nbsp;|&nbsp;
            <i class="bi bi-credit-card"></i> ${b.paymentMethod} &nbsp;|&nbsp;
            <i class="bi bi-clock-history"></i> ${formatDate(b.createdAt)}
          </p>
          ${b.notes ? `<p class="mt-1 text-muted"><i class="bi bi-chat-left-text"></i> ${b.notes}</p>` : ''}
          ${hasReview ? `<p class="mt-1" style="color:var(--warning)">
            ${'★'.repeat(b.review.rating)}${'☆'.repeat(5 - b.review.rating)} <em style="color:var(--text-muted);font-size:.8rem">${b.review.text}</em>
          </p>` : ''}
        </div>
        <div class="booking-actions">
          ${statusBadge(b.status)}
          ${canReview ? `<button class="btn btn-outline btn-sm review-btn" data-id="${b.id}"><i class="bi bi-star"></i> Отзыв</button>` : ''}
        </div>
      </div>`;
  }

  function attachReviewHandlers() {
    document.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', () => openReviewModal(parseInt(btn.dataset.id)));
    });
  }

  // ===== Модалка отзыва =====
  let selectedRating = 0;
  let currentBookingId = null;

  function openReviewModal(bookingId) {
    currentBookingId = bookingId;
    selectedRating = 0;
    document.getElementById('reviewText').value = '';
    updateStars(0);
    document.getElementById('reviewModal').classList.remove('hidden');
  }

  document.getElementById('closeReviewModal').addEventListener('click', () => {
    document.getElementById('reviewModal').classList.add('hidden');
  });

  document.getElementById('reviewModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('reviewModal')) {
      document.getElementById('reviewModal').classList.add('hidden');
    }
  });

  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.star);
      updateStars(selectedRating);
    });
    btn.addEventListener('mouseenter', () => updateStars(parseInt(btn.dataset.star)));
    btn.addEventListener('mouseleave', () => updateStars(selectedRating));
  });

  function updateStars(n) {
    document.querySelectorAll('.star-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.star) <= n);
    });
  }

  document.getElementById('submitReviewBtn').addEventListener('click', async () => {
    const text = document.getElementById('reviewText').value.trim();
    if (!selectedRating) { showToast('Выберите оценку', 'warning'); return; }
    if (text.length < 5) { showToast('Напишите отзыв (минимум 5 символов)', 'warning'); return; }

    const btn = document.getElementById('submitReviewBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      const res = await api.post('/reviews', { bookingId: currentBookingId, text, rating: selectedRating });
      if (!res) return;
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message, 'error');
      } else {
        showToast('Отзыв успешно добавлен!', 'success');
        document.getElementById('reviewModal').classList.add('hidden');
        await loadBookings();
      }
    } catch {
      showToast('Ошибка при отправке отзыва', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send"></i> Отправить';
    }
  });
});
