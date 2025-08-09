const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'docs.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Создаем таблицу пользователей
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  // Создаем таблицу документов
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code INTEGER UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      sender TEXT NOT NULL,
      receiver TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL CHECK (status IN ('Черновик', 'Отправлен'))
    )
  `);
});

module.exports = db;
