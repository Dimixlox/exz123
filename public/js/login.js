document.addEventListener('DOMContentLoaded', () => {
  if (api.getToken()) {
    const user = api.getUser();
    window.location.href = user?.role === 'admin' ? '/admin.html' : '/dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const loginInput = document.getElementById('login');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submitBtn');
  const globalError = document.getElementById('globalError');

  const clearError = (input) => {
    input.classList.remove('is-invalid');
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

  [loginInput, passwordInput].forEach(inp => inp.addEventListener('input', () => clearError(inp)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    globalError.classList.add('hidden');
    let valid = true;

    if (!loginInput.value.trim()) {
      showFieldError(loginInput, 'Введите логин');
      valid = false;
    }
    if (!passwordInput.value) {
      showFieldError(passwordInput, 'Введите пароль');
      valid = false;
    }
    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Вход...';

    try {
      const res = await api.post('/auth/login', {
        login: loginInput.value.trim(),
        password: passwordInput.value
      });

      if (!res) return;
      const data = await res.json();

      if (!res.ok) {
        if (data.field === 'login') showFieldError(loginInput, data.message);
        else if (data.field === 'password') showFieldError(passwordInput, data.message);
        else {
          globalError.textContent = data.message;
          globalError.classList.remove('hidden');
        }
      } else {
        api.setToken(data.token);
        api.setUser(data.user);
        showToast('Добро пожаловать!', 'success', data.user.fullName);
        setTimeout(() => {
          window.location.href = data.user.role === 'admin' ? '/admin.html' : '/dashboard.html';
        }, 600);
      }
    } catch {
      globalError.textContent = 'Ошибка соединения с сервером';
      globalError.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Войти';
    }
  });
});
