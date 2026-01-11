import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import VentaForm from './components/VentaForm';
import PrivateRoute from './components/PrivateRoute';
import SplashScreen from './components/SplashScreen';
import Dashboard from './pages/Dashboard';
import VentasList from './pages/VentasList';
import RegistroHogar from './pages/RegistroHogar';
import AdminPanel from './pages/AdminPanel';
import VentasGenerales from './pages/VentasGenerales';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles/App.css';
import logo from './components/images/Logo_talent365.png';

function AppContent() {
  const { currentUser, userProfile, logout, viewMode, switchViewMode, isAdminMode } = useAuth();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Mostrar splash screen solo en la carga inicial o cuando no hay usuario
    if (!currentUser) {
      setShowSplash(true);
    }
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }

  // Mostrar splash screen si hay que mostrarlo
  if (showSplash && !currentUser) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Mostrar solo login si no está autenticado
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <header>
        <div className="header-top">
          <div className="header-logo-title">
            <img src={logo} alt="TalentCloud365" className="main-logo" />
            <h1>TalentCloud365</h1>
          </div>
          {/* Toggle de modo para admin */}
          {userProfile?.rol === 'admin' && (
            <div className="mode-toggle">
              <span className="mode-label">Modo:</span>
              <button 
                className={`mode-btn ${viewMode !== 'agente' ? 'active' : ''}`}
                onClick={() => switchViewMode('admin')}
              >
                👑 Admin
              </button>
              <button 
                className={`mode-btn ${viewMode === 'agente' ? 'active' : ''}`}
                onClick={() => switchViewMode('agente')}
              >
                👤 Agente
              </button>
            </div>
          )}
        </div>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/">Dashboard</Link>
          <Link to="/ventas">Ventas</Link>
          <Link to="/registrar">Registrar venta móvil</Link>
          <Link to="/registrar-hogar">Registro Ventas Hogar</Link>
          {isAdminMode() && (
            <>
              <Link to="/ventas-generales" className="ventas-generales-link">📊 Ventas Generales</Link>
              <Link to="/admin" className="admin-link">🏢 Panel Admin</Link>
              <Link to="/registrar-usuario">Crear Usuario</Link>
            </>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>{userProfile?.nombre || userProfile?.email}</span>
            {userProfile?.agencia && (
              <span className="agencia-badge">🏪 {userProfile.agencia}</span>
            )}
            <button 
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff3b30',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/ventas" element={<PrivateRoute><VentasList /></PrivateRoute>} />
          <Route path="/registrar" element={<PrivateRoute><VentaForm /></PrivateRoute>} />
          <Route path="/registrar-hogar" element={<PrivateRoute><RegistroHogar /></PrivateRoute>} />
          <Route path="/ventas-generales" element={<PrivateRoute><VentasGenerales /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
          <Route path="/registrar-usuario" element={<PrivateRoute><Register /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span className="footer-brand">TalentCloud365</span>
          <span className="footer-credits">
            Creado por <strong>Arquitecto de Soluciones Digitales</strong> — Ruben Madrigal
          </span>
          <span className="footer-company">by <strong>Infinix Dev</strong> © 2026</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
