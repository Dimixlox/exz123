document.addEventListener('DOMContentLoaded', () => {
  if (api.getToken()) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('submitBtn');
  const successBlock = document.getElementById('successBlock');

  const fields = {
    login: { el: document.getElementById('login'), rules: [
      { test: v => v.trim().length > 0, msg: 'Введите логин' },
      { test: v => /^[a-zA-Z0-9]{6,}$/.test(v.trim()), msg: 'Логин: только латинские буквы и цифры, минимум 6 символов' }
    ]},
    password: { el: document.getElementById('password'), rules: [
      { test: v => v.length > 0, msg: 'Введите пароль' },
      { test: v => v.length >= 8, msg: 'Пароль должен содержать не менее 8 символов' }
    ]},
    fullName: { el: document.getElementById('fullName'), rules: [
      { test: v => v.trim().length >= 3, msg: 'Введите ФИО (минимум 3 символа)' }
    ]},
    phone: { el: document.getElementById('phone'), rules: [
      { test: v => v.trim().length > 0, msg: 'Введите номер телефона' }
    ]},
    email: { el: document.getElementById('email'), rules: [
      { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Введите корректный e-mail' }
    ]}
  };

  const clearError = (input) => {
    input.classList.remove('is-invalid', 'is-valid');
    const err = input.parentElement.querySelector('.form-error');
    if (err) err.remove();
  };

  const showFieldError = (input, msg) => {
    clearError(input);
    input.classList.add('is-invalid');
    const err = document.createElement('div');
    err.className = 'form-error';
    err.innerHTML = `<i class="bi bi-exclamation-circle"></i> ${msg}`;
    input.parentElement.appendChild(err);
  };

  const setValid = (input) => {
    clearError(input);
    input.classList.add('is-valid');
  };

  Object.values(fields).forEach(({ el, rules }) => {
    el.addEventListener('input', () => {
      const v = el.value;
      const fail = rules.find(r => !r.test(v));
      if (fail) showFieldError(el, fail.msg);
      else setValid(el);
    });
  });

  const validateAll = () => {
    let ok = true;
    Object.values(fields).forEach(({ el, rules }) => {
      const fail = rules.find(r => !r.test(el.value));
      if (fail) { showFieldError(el, fail.msg); ok = false; }
      else setValid(el);
    });
    return ok;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Регистрация...';

    try {
      const res = await api.post('/auth/register', {
        login: fields.login.el.value.trim(),
        password: fields.password.el.value,
        fullName: fields.fullName.el.value.trim(),
        phone: fields.phone.el.value.trim(),
        email: fields.email.el.value.trim()
      });

      if (!res) return;
      const data = await res.json();

      if (!res.ok) {
        if (data.field && fields[data.field]) {
          showFieldError(fields[data.field].el, data.message);
        } else {
          showToast(data.message || 'Ошибка регистрации', 'error');
        }
      } else {
        api.setToken(data.token);
        api.setUser(data.user);
        form.classList.add('hidden');
        successBlock.classList.remove('hidden');
        successBlock.classList.add('bounce-in');
        setTimeout(() => window.location.href = '/dashboard.html', 2000);
      }
    } catch {
      showToast('Ошибка соединения с сервером', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-person-plus"></i> Зарегистрироваться';
    }
  });
});
