const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const TOKEN_EXPIRES = '7d';

const register = async (req, res) => {
  try {
    const { login, password, fullName, phone, email } = req.body;

    if (!login || !password || !fullName || !phone || !email) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }

    if (!/^[a-zA-Z0-9]{6,}$/.test(login)) {
      return res.status(400).json({
        field: 'login',
        message: 'Логин должен содержать только латинские буквы и цифры, минимум 6 символов'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        field: 'password',
        message: 'Пароль должен содержать не менее 8 символов'
      });
    }

    const existingLogin = await User.findOne({ where: { login } });
    if (existingLogin) {
      return res.status(409).json({ field: 'login', message: 'Этот логин уже занят' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ field: 'email', message: 'Этот email уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ login, password: hashedPassword, fullName, phone, email });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

    res.status(201).json({
      token,
      user: { id: user.id, login: user.login, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: 'Введите логин и пароль' });
    }

    const user = await User.findOne({ where: { login } });
    if (!user) {
      return res.status(401).json({ field: 'login', message: 'Пользователь с таким логином не найден' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ field: 'password', message: 'Неверный пароль' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

    res.json({
      token,
      user: { id: user.id, login: user.login, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, me };
