document.addEventListener('DOMContentLoaded', async () => {
  if (!api.requireAuth()) return;
  const user = api.getUser();
  if (user?.role === 'admin') { window.location.href = '/admin.html'; return; }

  document.getElementById('userName').textContent = user?.fullName || user?.login || '';
  document.getElementById('logoutBtn').addEventListener('click', () => api.logout());

  const form = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('submitBtn');
  const successBlock = document.getElementById('successBlock');
  const roomSelect = document.getElementById('roomId');
  const dateInput = document.getElementById('conferenceDate');
  const paymentSelect = document.getElementById('paymentMethod');
  const roomPreview = document.getElementById('roomPreview');

  let rooms = [];

  // Загружаем помещения
  try {
    const res = await api.get('/bookings/rooms');
    if (!res) return;
    rooms = await res.json();

    rooms.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.name} — до ${r.capacity} чел., ${r.pricePerHour.toLocaleString('ru')} ₽/ч`;
      roomSelect.appendChild(opt);
    });
  } catch {
    showToast('Не удалось загрузить список помещений', 'error');
  }

  // Устанавливаем минимальную дату (завтра)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = tomorrow.toISOString().split('T')[0];

  // Показ превью помещения
  roomSelect.addEventListener('change', () => {
    const room = rooms.find(r => r.id == roomSelect.value);
    if (!room) { roomPreview.classList.add('hidden'); return; }

    document.getElementById('previewImg').src = room.imageUrl;
    document.getElementById('previewImg').onerror = function() {
      this.src = `https://placehold.co/600x200/2563eb/white?text=${encodeURIComponent(room.name)}`;
    };
    document.getElementById('previewName').textContent = room.name;
    document.getElementById('previewDesc').textContent = room.description;
    document.getElementById('previewCapacity').textContent = `до ${room.capacity} чел.`;
    document.getElementById('previewPrice').textContent = `${room.pricePerHour.toLocaleString('ru')} ₽/ч`;
    roomPreview.classList.remove('hidden');
    roomPreview.classList.add('bounce-in');
  });

  // Форматирование даты в заголовке поля
  dateInput.addEventListener('change', () => {
    if (dateInput.value) {
      const d = new Date(dateInput.value);
      document.getElementById('dateDisplay').textContent = d.toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    }
  });

  // Валидация полей
  const showError = (el, msg) => {
    el.classList.add('is-invalid');
    let err = el.parentElement.querySelector('.form-error');
    if (!err) { err = document.createElement('div'); err.className = 'form-error'; el.parentElement.appendChild(err); }
    err.innerHTML = `<i class="bi bi-exclamation-circle"></i> ${msg}`;
  };

  const clearError = (el) => {
    el.classList.remove('is-invalid', 'is-valid');
    const err = el.parentElement.querySelector('.form-error');
    if (err) err.remove();
  };

  [roomSelect, dateInput, paymentSelect].forEach(el => el.addEventListener('change', () => clearError(el)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    if (!roomSelect.value) { showError(roomSelect, 'Выберите помещение'); valid = false; }
    if (!dateInput.value) { showError(dateInput, 'Укажите дату конференции'); valid = false; }
    else if (new Date(dateInput.value) <= new Date()) { showError(dateInput, 'Выберите будущую дату'); valid = false; }
    if (!paymentSelect.value) { showError(paymentSelect, 'Выберите способ оплаты'); valid = false; }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Отправка...';

    try {
      const res = await api.post('/bookings', {
        roomId: parseInt(roomSelect.value),
        conferenceDate: dateInput.value,
        paymentMethod: paymentSelect.value,
        notes: document.getElementById('notes').value.trim()
      });

      if (!res) return;
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'Ошибка при создании заявки', 'error');
      } else {
        const d = new Date(data.conferenceDate);
        document.getElementById('successRoom').textContent = data.room?.name || '';
        document.getElementById('successDate').textContent = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
        form.classList.add('hidden');
        successBlock.classList.remove('hidden');
        successBlock.classList.add('bounce-in');
      }
    } catch {
      showToast('Ошибка соединения с сервером', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-send"></i> Подать заявку';
    }
  });
});
