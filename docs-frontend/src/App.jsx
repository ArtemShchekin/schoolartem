import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DocumentsPage from './pages/DocumentsPage';
import Navbar from './components/Navbar';
import api from './services/api';

const decodeJWT = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'manager');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.role) {
        setUserRole(decoded.role);
        localStorage.setItem('role', decoded.role);
      }
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      {isLoggedIn && <Navbar onLogout={handleLogout} />}
      
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/" /> : <LoginPage onLogin={() => setIsLoggedIn(true)} />
        } />
        <Route path="/" element={
          isLoggedIn ? <DocumentsPage userRole={userRole} /> : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;