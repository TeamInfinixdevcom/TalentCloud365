import React, { useEffect, useState, useMemo } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminPanel.css';

const USERS_PER_PAGE = 6;

export default function AdminPanel() {
  const { userProfile } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agencias, setAgencias] = useState([]);
  const [filtroAgencia, setFiltroAgencia] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [mensaje, setMensaje] = useState(null);

  const db = getFirestore();

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'usuarios'));
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(users);
      
      // Extraer agencias únicas
      const agenciasUnicas = [...new Set(users.map(u => u.agencia).filter(Boolean))];
      setAgencias(agenciasUnicas);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    return filtroAgencia === 'all' 
      ? usuarios 
      : usuarios.filter(u => u.agencia === filtroAgencia);
  }, [usuarios, filtroAgencia]);

  // Paginación
  const totalPages = Math.ceil(usuariosFiltrados.length / USERS_PER_PAGE);
  const usuariosPaginados = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return usuariosFiltrados.slice(start, start + USERS_PER_PAGE);
  }, [usuariosFiltrados, currentPage]);

  // Reset página al cambiar filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroAgencia]);

  const startEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      nombre: user.nombre || '',
      agenteId: user.agenteId || '',
      rol: user.rol || 'agente',
      agencia: user.agencia || '',
      activo: user.activo !== false
    });
  };

  const handleSave = async () => {
    try {
      const userRef = doc(db, 'usuarios', editingUser.id);
      await updateDoc(userRef, {
        ...editForm,
        updatedAt: new Date()
      });
      
      // Actualizar lista local
      setUsuarios(usuarios.map(u => 
        u.id === editingUser.id ? { ...u, ...editForm } : u
      ));
      
      setEditingUser(null);
      setMensaje({ tipo: 'success', texto: 'Usuario actualizado correctamente' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar: ' + error.message });
    }
  };

  // Agrupar usuarios paginados por agencia
  const usuariosPorAgencia = useMemo(() => {
    const grupos = {};
    usuariosPaginados.forEach(u => {
      const ag = u.agencia || 'Sin agencia';
      if (!grupos[ag]) grupos[ag] = [];
      grupos[ag].push(u);
    });
    return grupos;
  }, [usuariosPaginados]);

  if (userProfile?.rol !== 'admin') {
    return (
      <div className="admin-panel-container">
        <div className="access-denied">
          <span className="denied-icon">🔒</span>
          <h2>Acceso Denegado</h2>
          <p>Solo los administradores pueden acceder a este panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h2>🏢 Panel de Administración</h2>
        <p>Gestiona usuarios y agencias</p>
      </div>

      {mensaje && (
        <div className={`admin-mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Filtro por agencia */}
      <div className="admin-filters">
        <div className="filter-group">
          <label>Filtrar por Agencia:</label>
          <select value={filtroAgencia} onChange={e => setFiltroAgencia(e.target.value)}>
            <option value="all">📊 Todas las agencias ({usuarios.length})</option>
            {agencias.map(ag => (
              <option key={ag} value={ag}>
                🏪 {ag} ({usuarios.filter(u => u.agencia === ag).length})
              </option>
            ))}
          </select>
        </div>
        <div className="results-info">
          Mostrando {usuariosPaginados.length} de {usuariosFiltrados.length} usuarios
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : (
        <>
          <div className="agencias-container">
            {Object.entries(usuariosPorAgencia).map(([agencia, users]) => (
              <div key={agencia} className="agencia-card">
                <div className="agencia-header">
                  <h3>🏪 {agencia}</h3>
                  <span className="agencia-count">{users.length} agente(s)</span>
                </div>
                
                <div className="usuarios-grid">
                  {users.map(user => (
                    <div key={user.id} className={`usuario-card ${!user.activo ? 'inactivo' : ''}`}>
                      <div className="usuario-header">
                        <span className="usuario-nombre">{user.nombre || 'Sin nombre'}</span>
                        <span className={`usuario-rol ${user.rol}`}>
                          {user.rol === 'admin' ? '👑 Admin' : '👤 Agente'}
                        </span>
                      </div>
                      <div className="usuario-info">
                        <div><strong>ID:</strong> {user.agenteId}</div>
                        <div><strong>Email:</strong> {user.email}</div>
                        <div><strong>Estado:</strong> {user.activo !== false ? '✅ Activo' : '❌ Inactivo'}</div>
                      </div>
                      <button className="btn-edit" onClick={() => startEdit(user)}>
                        ✏️ Editar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ⏮️
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ◀️
              </button>
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                ▶️
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                ⏭️
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de edición */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>✏️ Editar Usuario</h3>
            
            <div className="edit-field">
              <label>Nombre</label>
              <input 
                value={editForm.nombre}
                onChange={e => setEditForm({...editForm, nombre: e.target.value})}
              />
            </div>

            <div className="edit-field">
              <label>Agente ID</label>
              <input 
                value={editForm.agenteId}
                onChange={e => setEditForm({...editForm, agenteId: e.target.value})}
              />
            </div>

            <div className="edit-field">
              <label>Rol</label>
              <select 
                value={editForm.rol}
                onChange={e => setEditForm({...editForm, rol: e.target.value})}
              >
                <option value="agente">👤 Agente</option>
                <option value="admin">👑 Administrador</option>
              </select>
            </div>

            <div className="edit-field">
              <label>Agencia</label>
              <input 
                value={editForm.agencia}
                onChange={e => setEditForm({...editForm, agencia: e.target.value})}
                placeholder="Ej: Tibas Kolbi ICE"
              />
            </div>

            <div className="edit-field">
              <label>Estado</label>
              <select 
                value={editForm.activo ? 'true' : 'false'}
                onChange={e => setEditForm({...editForm, activo: e.target.value === 'true'})}
              >
                <option value="true">✅ Activo</option>
                <option value="false">❌ Inactivo</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingUser(null)}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleSave}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
