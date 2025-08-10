import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkey';

export default (req, res, next) => {
  // Получаем токен из заголовка Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'Требуется авторизация. Пожалуйста, предоставьте токен.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Верификация токена
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Добавляем данные пользователя в объект запроса
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (err) {
    console.error('Ошибка верификации токена:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Срок действия токена истек. Пожалуйста, войдите снова.' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: 'Неверный или поврежденный токен авторизации' 
    });
  }
};