const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Создание документа (только админ)
router.post('/', authMiddleware, checkRole('administrator'), (req, res) => {
  const { code, subject, sender, receiver, message } = req.body;
  const status = 'Черновик';

  if (!code || code === 0 || !subject || !sender || !receiver) {
    return res.status(400).json({ message: 'Ошибка валидации: заполните обязательные поля' });
  }

  db.get('SELECT * FROM documents WHERE code = ?', [code], (err, doc) => {
    if (doc) return res.status(409).json({ message: 'Документ с таким кодом уже существует' });

    db.run(
      'INSERT INTO documents (code, subject, sender, receiver, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [code, subject, sender, receiver, message, status],
      function(err) {
        if (err) return res.status(500).json({ message: 'Ошибка при создании документа' });
        res.status(201).json({ id: this.lastID, status: 'Черновик' });
      }
    );
  });
});

// Отправка документа (меняет статус на "Отправлен")
router.post('/:id/send', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, doc) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    if (!doc) return res.status(404).json({ message: 'Документ не найден' });
    if (doc.status === 'Отправлен') return res.status(400).json({ message: 'Документ уже отправлен' });

    db.run(
      'UPDATE documents SET status = "Отправлен" WHERE id = ?',
      [id],
      function(err) {
        if (err) return res.status(500).json({ message: 'Ошибка при отправке' });
        res.status(200).json({ message: 'Документ отправлен' });
      }
    );
  });
});

// Редактирование документа (PATCH)
router.patch('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { code, subject, sender, message } = req.body;

  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, doc) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    if (!doc) return res.status(404).json({ message: 'Документ не найден' });
    if (doc.status === 'Отправлен') return res.status(403).json({ message: 'Отправленные документы нельзя редактировать' });

    // Проверка уникальности нового кода (если он изменен)
    if (code && code !== doc.code) {
      db.get('SELECT * FROM documents WHERE code = ?', [code], (err, existingDoc) => {
        if (existingDoc) return res.status(409).json({ message: 'Документ с таким кодом уже существует' });
        updateDocument();
      });
    } else {
      updateDocument();
    }

    function updateDocument() {
      const updatedDoc = {
        code: code || doc.code,
        subject: subject || doc.subject,
        sender: sender || doc.sender,
        message: message !== undefined ? message : doc.message,
      };

      db.run(
        'UPDATE documents SET code = ?, subject = ?, sender = ?, message = ? WHERE id = ?',
        [updatedDoc.code, updatedDoc.subject, updatedDoc.sender, updatedDoc.message, id],
        function(err) {
          if (err) return res.status(500).json({ message: 'Ошибка при обновлении' });
          res.json({ message: 'Документ обновлен' });
        }
      );
    }
  });
});

// Удаление документа (только для черновиков)
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, doc) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    if (!doc) return res.status(404).json({ message: 'Документ не найден' });
    if (doc.status === 'Отправлен') return res.status(403).json({ message: 'Нельзя удалить отправленный документ' });

    db.run('DELETE FROM documents WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ message: 'Ошибка при удалении' });
      res.json({ message: 'Документ удален' });
    });
  });
});

// Получение документа по ID
router.get('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) return res.status(400).json({ message: 'ID должен быть числом' });

  db.get(
    'SELECT id, code, subject, sender, receiver, message, status FROM documents WHERE id = ?',
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ message: 'Ошибка сервера' });
      if (!row) return res.status(404).json({ message: 'Документ не найден' });
      res.json(row);
    }
  );
});

// Получение списка документов
router.get('/', authMiddleware, (req, res) => {
  db.all(
    'SELECT id, code, subject, sender, receiver, status FROM documents',
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Ошибка при получении документов' });
      res.json(rows);
    }
  );
});

module.exports = router;