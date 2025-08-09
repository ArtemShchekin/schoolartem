// middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'supersecretkey'; // Должен совпадать с ключом в index.js

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Добавляем данные пользователя в запрос
    next();
  } catch (err) {
    res.status(401).json({ message: 'Неверный токен' });
  }
};