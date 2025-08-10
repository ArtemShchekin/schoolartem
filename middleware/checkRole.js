export default (requiredRole) => {
  return (req, res, next) => {
    // Проверяем, что middleware auth уже добавил user в запрос
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Требуется авторизация' 
      });
    }

    // Проверяем роль пользователя
    if (req.user.role !== requiredRole) {
      console.warn(`Попытка доступа без прав. User: ${req.user.username}, Required role: ${requiredRole}`);
      return res.status(403).json({ 
        success: false,
        message: 'Недостаточно прав для выполнения этого действия' 
      });
    }

    next();
  };
};