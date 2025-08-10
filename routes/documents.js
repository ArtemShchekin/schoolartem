import express from 'express';
import db from '../db.js';
import authMiddleware from '../middleware/auth.js';
import checkRole from '../middleware/checkRole.js';

const router = express.Router();

/**
 * @api {post} /documents Создание документа
 * @apiName CreateDocument
 * @apiGroup Documents
 * @apiPermission administrator
 */
router.post('/', authMiddleware, checkRole('administrator'), async (req, res) => {
  const { code, subject, sender, receiver, message } = req.body;
  const status = 'Черновик';

  // Валидация входных данных
  if (!code || !subject || !sender || !receiver) {
    return res.status(400).json({ 
      success: false,
      message: 'Не заполнены обязательные поля: code, subject, sender, receiver' 
    });
  }

  try {
    // Проверка уникальности кода документа
    const existingDoc = await db.query(
      'SELECT id FROM documents WHERE code = $1', 
      [code]
    );

    if (existingDoc.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: 'Документ с таким кодом уже существует' 
      });
    }

    // Создание нового документа
    const newDoc = await db.query(
      `INSERT INTO documents 
       (code, subject, sender, receiver, message, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, status, created_at`,
      [code, subject, sender, receiver, message, status]
    );

    res.status(201).json({
      success: true,
      data: newDoc.rows[0]
    });
  } catch (err) {
    console.error('Ошибка при создании документа:', err);
    res.status(500).json({ 
      success: false,
      message: 'Внутренняя ошибка сервера' 
    });
  }
});

/**
 * @api {post} /documents/:id/send Отправка документа
 * @apiName SendDocument
 * @apiGroup Documents
 */
router.post('/:id/send', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Проверка существования документа
    const docResult = await db.query(
      'SELECT id, status FROM documents WHERE id = $1', 
      [id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Документ не найден' 
      });
    }

    const document = docResult.rows[0];
    
    if (document.status === 'Отправлен') {
      return res.status(400).json({ 
        success: false,
        message: 'Документ уже был отправлен ранее' 
      });
    }

    // Обновление статуса документа
    await db.query(
      `UPDATE documents 
       SET status = 'Отправлен', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    res.json({ 
      success: true,
      message: 'Документ успешно отправлен' 
    });
  } catch (err) {
    console.error('Ошибка при отправке документа:', err);
    res.status(500).json({ 
      success: false,
      message: 'Не удалось отправить документ' 
    });
  }
});

/**
 * @api {patch} /documents/:id Обновление документа
 * @apiName UpdateDocument
 * @apiGroup Documents
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { code, subject, sender, message } = req.body;

  try {
    // Получение текущей версии документа
    const currentDoc = await db.query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );

    if (currentDoc.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Документ не найден' 
      });
    }

    const document = currentDoc.rows[0];
    
    if (document.status === 'Отправлен') {
      return res.status(403).json({ 
        success: false,
        message: 'Редактирование отправленных документов запрещено' 
      });
    }

    // Проверка уникальности кода (если он изменен)
    if (code && code !== document.code) {
      const existingCode = await db.query(
        'SELECT id FROM documents WHERE code = $1 AND id != $2',
        [code, id]
      );

      if (existingCode.rows.length > 0) {
        return res.status(409).json({ 
          success: false,
          message: 'Документ с таким кодом уже существует' 
        });
      }
    }

    // Подготовка данных для обновления
    const updatedData = {
      code: code || document.code,
      subject: subject || document.subject,
      sender: sender || document.sender,
      message: message ?? document.message
    };

    // Обновление документа
    const updatedDoc = await db.query(
      `UPDATE documents 
       SET code = $1, subject = $2, sender = $3, message = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, code, subject, sender, receiver, status, created_at, updated_at`,
      [updatedData.code, updatedData.subject, updatedData.sender, 
       updatedData.message, id]
    );

    res.json({ 
      success: true,
      data: updatedDoc.rows[0],
      message: 'Документ успешно обновлен'
    });
  } catch (err) {
    console.error('Ошибка при обновлении документа:', err);
    res.status(500).json({ 
      success: false,
      message: 'Не удалось обновить документ' 
    });
  }
});

/**
 * @api {delete} /documents/:id Удаление документа
 * @apiName DeleteDocument
 * @apiGroup Documents
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Проверка документа
    const doc = await db.query(
      'SELECT id, status FROM documents WHERE id = $1',
      [id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Документ не найден' 
      });
    }

    if (doc.rows[0].status === 'Отправлен') {
      return res.status(403).json({ 
        success: false,
        message: 'Удаление отправленных документов запрещено' 
      });
    }

    // Удаление документа
    const result = await db.query(
      'DELETE FROM documents WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Документ не найден' 
      });
    }

    res.json({ 
      success: true,
      message: 'Документ успешно удален',
      deletedId: result.rows[0].id
    });
  } catch (err) {
    console.error('Ошибка при удалении документа:', err);
    res.status(500).json({ 
      success: false,
      message: 'Не удалось удалить документ' 
    });
  }
});

/**
 * @api {get} /documents/:id Получение документа
 * @apiName GetDocument
 * @apiGroup Documents
 */
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'ID документа должен быть числом' 
    });
  }

  try {
    const doc = await db.query(
      `SELECT id, code, subject, sender, receiver, message, status, 
       created_at, updated_at
       FROM documents WHERE id = $1`,
      [id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Документ не найден' 
      });
    }

    res.json({ 
      success: true,
      data: doc.rows[0] 
    });
  } catch (err) {
    console.error('Ошибка при получении документа:', err);
    res.status(500).json({ 
      success: false,
      message: 'Не удалось получить документ' 
    });
  }
});

/**
 * @api {get} /documents Получение списка документов
 * @apiName GetDocuments
 * @apiGroup Documents
 */
router.get('/', authMiddleware, async (req, res) => {
  const { status, limit = 10, offset = 0 } = req.query;

  try {
    let query = `SELECT id, code, subject, sender, receiver, status, 
                created_at, updated_at FROM documents`;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` WHERE status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC 
              LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(Number(limit), Number(offset));

    const docs = await db.query(query, params);

    // Получаем общее количество для пагинации
    const countQuery = status 
      ? `SELECT COUNT(*) FROM documents WHERE status = $1`
      : `SELECT COUNT(*) FROM documents`;
    const countParams = status ? [status] : [];
    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: docs.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (err) {
    console.error('Ошибка при получении списка документов:', err);
    res.status(500).json({ 
      success: false,
      message: 'Не удалось получить список документов' 
    });
  }
});

export default router;