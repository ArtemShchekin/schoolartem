import { useState } from 'react';
import { TextField, Button, Container, Box, Typography } from '@mui/material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const decodeJWT = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', { username, password });
      const token = res.data.token;
      localStorage.setItem('token', token);
      
      // Декодируем роль из JWT
      const decoded = decodeJWT(token);
      if (!decoded) throw new Error('Ошибка декодирования токена');
      
      localStorage.setItem('role', decoded.role || 'manager');
      localStorage.setItem('userId', decoded.userId);
      
      onLogin();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5">Вход в систему</Typography>
        {error && <Typography color="error">{error}</Typography>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            label="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
            Войти
          </Button>
        </Box>
      </Box>
    </Container>
  );
}