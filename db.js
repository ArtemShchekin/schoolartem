import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Проверяем наличие DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL не установлен в .env файле');
  process.exit(1);
}

// Форматируем строку подключения для Render
const connectionString = process.env.DATABASE_URL.startsWith('postgres://') 
  ? process.env.DATABASE_URL.replace('postgres://', 'postgresql://')
  : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Тестовое подключение
async function testConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Подключение к PostgreSQL успешно');
    return true;
  } catch (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
    return false;
  }
}

// Инициализация таблиц
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query('COMMIT');
    console.log('✅ Таблицы БД инициализированы');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка инициализации БД:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

export default {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection,
  initDB
};