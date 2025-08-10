import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Вручную парсим строку подключения
function getConfig() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL не установлен');
    process.exit(1);
  }

  try {
    const url = new URL(process.env.DATABASE_URL);
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port,
      database: url.pathname.slice(1),
      ssl: {
        rejectUnauthorized: false
      }
    };
  } catch (err) {
    console.error('❌ Ошибка парсинга DATABASE_URL:', err.message);
    process.exit(1);
  }
}

const pool = new Pool(getConfig());

// Проверка подключения с подробным логированием
export async function testConnection() {
  let client;
  try {
    console.log('⌛ Проверка подключения к PostgreSQL...');
    client = await pool.connect();
    const { rows } = await client.query('SELECT NOW() as time, current_database() as db');
    console.log('✅ Подключение успешно:');
    console.log(`   Время БД: ${rows[0].time}`);
    console.log(`   Имя БД: ${rows[0].db}`);
    return true;
  } catch (err) {
    console.error('❌ Ошибка подключения:');
    console.error(err);
    return false;
  } finally {
    client?.release();
  }
}

export default {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection
};