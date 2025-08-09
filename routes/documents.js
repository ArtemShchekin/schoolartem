const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Создание документа (только админ)
router.post('/', authMiddleware, checkRole('administrator'), async (req, res) => {
  const { code, subject, sender, receiver, message } = req.body;
  const status = 'Черновик';

  if (!code || code === 0 || !subject || !sender || !receiver) {
    return res.status(400).json({ message: 'Ошибка валидации: заполните обязательные поля' });
  }

  try {
    // Проверка на существование документа
    const existingDoc = await db.query(
      'SELECT * FROM documents WHERE code = $1', 
      [code]
    );

    if (existingDoc.rows.length > 0) {
      return res.status(409).json({ message: 'Документ с таким кодом уже существует' });
    }

    // Создание документа
    const newDoc = await db.query(
      `INSERT INTO documents 
       (code, subject, sender, receiver, message, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, status`,
      [code, subject, sender, receiver, message, status]
    );

    res.status(201).json(newDoc.rows[0]);
  } catch (err) {
    console.error('Ошибка при создании документа:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отправка документа
router.post('/:id/send', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Проверка документа
    const doc = await db.query(
      'SELECT * FROM documents WHERE id = $1', 
      [id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ message: 'Документ не найден' });
    }

    if (doc.rows[0].status === 'Отправлен') {
      return res.status(400).json({ message: 'Документ уже отправлен' });
    }

    // Обновление статуса
    await db.query(
      `UPDATE documents 
       SET status = 'Отправлен', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Документ отправлен' });
  } catch (err) {
    console.error('Ошибка при отправке:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Редактирование документа
router.patch('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { code, subject, sender, message } = req.body;

  try {
    // Получение текущего документа
    const currentDoc = await db.query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );

    if (currentDoc.rows.length === 0) {
      return res.status(404).json({ message: 'Документ не найден' });
    }

    if (currentDoc.rows[0].status === 'Отправлен') {
      return res.status(403).json({ message: 'Отправленные документы нельзя редактировать' });
    }

    // Проверка кода (если изменен)
    if (code && code !== currentDoc.rows[0].code) {
      const existingCode = await db.query(
        'SELECT * FROM documents WHERE code = $1 AND id != $2',
        [code, id]
      );

      if (existingCode.rows.length > 0) {
        return res.status(409).json({ message: 'Документ с таким кодом уже существует' });
      }
    }

    // Подготовка данных для обновления
    const updatedData = {
      code: code || currentDoc.rows[0].code,
      subject: subject || currentDoc.rows[0].subject,
      sender: sender || currentDoc.rows[0].sender,
      message: message !== undefined ? message : currentDoc.rows[0].message
    };

    // Обновление документа
    const updatedDoc = await db.query(
      `UPDATE documents 
       SET code = $1, subject = $2, sender = $3, message = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [updatedData.code, updatedData.subject, updatedData.sender, updatedData.message, id]
    );

    res.json({ 
      message: 'Документ обновлен', 
      document: updatedDoc.rows[0] 
    });
  } catch (err) {
    console.error('Ошибка при обновлении:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление документа
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Проверка документа
    const doc = await db.query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ message: 'Документ не найден' });
    }

    if (doc.rows[0].status === 'Отправлен') {
      return res.status(403).json({ message: 'Нельзя удалить отправленный документ' });
    }

    // Удаление
    const result = await db.query(
      'DELETE FROM documents WHERE id = $1',
      [id]
    );

    res.json({ message: 'Документ удален' });
  } catch (err) {
    console.error('Ошибка при удалении:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение документа по ID
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID должен быть числом' });
  }

  try {
    const doc = await db.query(
      `SELECT id, code, subject, sender, receiver, message, status
       FROM documents WHERE id = $1`,
      [id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ message: 'Документ не найден' });
    }

    res.json(doc.rows[0]);
  } catch (err) {
    console.error('Ошибка при получении документа:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение списка документов
router.get('/', authMiddleware, async (req, res) => {
  try {
    const docs = await db.query(
      `SELECT id, code, subject, sender, receiver, status
       FROM documents ORDER BY created_at DESC`
    );
    res.json(docs.rows);
  } catch (err) {
    console.error('Ошибка при получении списка:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;