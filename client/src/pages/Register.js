import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    agenteId: '',
    rol: 'agente'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { signup, userProfile } = useAuth();
  const navigate = useNavigate();

  // Solo admin puede crear usuarios
  if (!userProfile || userProfile.rol !== 'admin') {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2>❌ Acceso Denegado</h2>
          <p>Solo los administradores pueden crear nuevos usuarios.</p>
          <button 
            onClick={() => navigate('/')}
            className="auth-button"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (!formData.nombre || !formData.email || !formData.password || !formData.agenteId) {
      setError('Completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      await signup(
        formData.email,
        formData.password,
        formData.nombre,
        formData.agenteId,
        formData.rol
      );
      setSuccess('✅ Usuario creado exitosamente');
      setFormData({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        agenteId: '',
        rol: 'agente'
      });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>👤 Crear Nuevo Usuario</h1>
          <p>Registra un nuevo agente</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="agente@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>ID del Agente</label>
            <input
              type="text"
              name="agenteId"
              value={formData.agenteId}
              onChange={handleChange}
              placeholder="ej: agente_001"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>Rol</label>
            <select name="rol" value={formData.rol} onChange={handleChange}>
              <option value="agente">Agente</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Creando usuario...' : 'Crear Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}
