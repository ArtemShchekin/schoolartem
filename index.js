import express from 'express';
import db from './db.js';
import documentsRouter from './routes/documents.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Проверка подключения к БД
async function startServer() {
  try {
    const isConnected = await db.testConnection();
    if (!isConnected) throw new Error('Database connection failed');
    
    await db.initDB();
    
    // Маршруты
    app.use('/documents', documentsRouter);
    
    app.get('/', (req, res) => {
      res.json({ status: 'API is working' });
    });
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('FATAL ERROR:', err.message);
    process.exit(1);
  }
}

startServer();