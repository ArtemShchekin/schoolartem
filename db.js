const { Pool } = require('pg');
require('dotenv').config();

// Настройка подключения к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false
});

// Функция для инициализации таблиц
async function initializeDatabase() {
  try {
    // Создаем таблицу пользователей
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создаем таблицу документов
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        code INTEGER UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        sender VARCHAR(255) NOT NULL,
        receiver VARCHAR(255) NOT NULL,
        message TEXT,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Черновик', 'Отправлен')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Таблицы базы данных успешно инициализированы');
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    throw error;
  }
}

// Проверка подключения и инициализация
(async function checkConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Успешное подключение к PostgreSQL');
    await initializeDatabase();
  } catch (error) {
    console.error('Ошибка подключения к PostgreSQL:', error);
    process.exit(1); // Завершаем процесс с ошибкой
  }
})();

// Экспортируем объект для работы с базой
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
  initializeDatabase: initializeDatabase,
  
  // Дополнительные методы для удобства
  getClient: async () => {
    const client = await pool.connect();
    return {
      client,
      query: client.query.bind(client),
      release: client.release.bind(client)
    };
  },
  
  // Метод для транзакций
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};