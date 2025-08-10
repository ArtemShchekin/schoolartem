import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Конфигурация подключения к PostgreSQL
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

const pool = new Pool(poolConfig);

// Обработка событий пула соединений
pool.on('connect', () => {
  console.log('Установлено новое подключение к БД');
});

pool.on('error', (err) => {
  console.error('Ошибка в пуле соединений:', err);
});

// Инициализация структуры базы данных
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Создание таблицы пользователей
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы документов
    await client.query(`
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

    // Создание индексов для улучшения производительности
    await client.query(`
      CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status)
    `);

    await client.query('COMMIT');
    console.log('Структура базы данных успешно инициализирована');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при инициализации БД:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Проверка и инициализация подключения
(async () => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    console.log('Успешное подключение к PostgreSQL. Текущее время сервера:', rows[0].now);
    await initializeDatabase();
  } catch (error) {
    console.error('Критическая ошибка подключения к PostgreSQL:', error);
    process.exit(1);
  }
})();

// Метод для выполнения транзакций
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Экспорт методов для работы с базой
export default {
  // Основной метод для запросов
  query: (text, params) => pool.query(text, params),
  
  // Получение клиента для ручного управления
  getClient: () => pool.connect(),
  
  // Пул соединений
  pool,
  
  // Инициализация БД
  initializeDatabase,
  
  // Выполнение транзакций
  transaction,
  
  // Закрытие всех соединений (для graceful shutdown)
  close: () => pool.end()
};