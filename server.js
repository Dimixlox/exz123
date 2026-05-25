require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sequelize, User, Room } = require('./models');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

const seedDatabase = async () => {
  const adminLogin = process.env.ADMIN_LOGIN;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const adminExists = await User.findOne({ where: { login: adminLogin } });
  if (!adminExists) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await User.create({
      login: adminLogin,
      password: hashed,
      fullName: 'Администратор системы',
      phone: '+7 (000) 000-00-00',
      email: 'admin@conferences.rf',
      role: 'admin'
    });
    console.log('Администратор создан');
  }

  const roomCount = await Room.count();
  if (roomCount === 0) {
    await Room.bulkCreate([
      {
        name: 'Аудитория №1',
        type: 'auditorium',
        description: 'Вместительная аудитория для проведения крупных конференций. Оснащена современным проекционным оборудованием, системой видеоконференций и удобными креслами для 100 участников.',
        capacity: 100,
        pricePerHour: 5000,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop'
      },
      {
        name: 'Коворкинг «Инновации»',
        type: 'coworking',
        description: 'Современное open-space пространство для деловых встреч и семинаров. Оборудовано эргономичными рабочими местами, высокоскоростным интернетом и кофе-зоной.',
        capacity: 50,
        pricePerHour: 3000,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop'
      },
      {
        name: 'Кинозал «Панорама»',
        type: 'cinema',
        description: 'Профессиональный кинозал с большим экраном 4K и системой объёмного звука Dolby. Идеально подходит для крупных презентаций и корпоративных показов.',
        capacity: 200,
        pricePerHour: 8000,
        imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop'
      }
    ]);
    console.log('Помещения добавлены в базу данных');
  }
};

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(async () => {
    console.log('База данных синхронизирована');
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
      console.log(`Откройте http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Ошибка синхронизации базы данных:', err);
    process.exit(1);
  });
