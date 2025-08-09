const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { createUsersTable, insertInitialUsers } = require('./models');
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

const SECRET_KEY = 'supersecretkey'; // позже лучше вынести в .env

app.use(cors());
app.use(bodyParser.json());

createUsersTable();
insertInitialUsers();

// Простой маршрут для проверки работы API
app.get('/', (req, res) => {
  res.json({ message: 'API работает' });
});

// Получение всех пользователей
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка при получении пользователей' });
    }
    res.json(rows);
  });
});

// Логин
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Введите имя пользователя и пароль' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({ token });
  });
});
const documentsRouter = require('./routes/documents');
app.use('/documents', documentsRouter);
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
