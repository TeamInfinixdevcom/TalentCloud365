import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/VentasList.css';

const ITEMS_PER_PAGE = 6;

export default function VentasList() {
  const { userProfile, isAdminMode } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'movil', 'hogar'
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Estados para búsqueda y paginación
  const [searchPedido, setSearchPedido] = useState('');
  const [searchSimo, setSearchSimo] = useState('');
  const [searchCedula, setSearchCedula] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchVentas = () => {
    setLoading(true);
    // Si es agente o admin en modo agente, filtrar por su agenteId
    const shouldFilterByAgent = !isAdminMode();
    const agentParam = shouldFilterByAgent && userProfile?.agenteId ? `&agenteId=${userProfile.agenteId}` : '';
    const url = filter === 'all' 
      ? `/api/ventas?limit=500${agentParam}` 
      : `/api/ventas?limit=500&categoria=${filter}${agentParam}`;
    
    axios.get(url)
      .then(r => {
        setItems(r.data.items || []);
        setCurrentPage(1); // Reset a página 1 al cargar
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVentas();
  }, [filter, userProfile, isAdminMode]);

  // Filtrar items según búsqueda
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchPedido = !searchPedido || 
        (item.numeroPedido && item.numeroPedido.toLowerCase().includes(searchPedido.toLowerCase()));
      const matchSimo = !searchSimo || 
        (item.homeNumber && item.homeNumber.toLowerCase().includes(searchSimo.toLowerCase()));
      const matchCedula = !searchCedula || 
        (item.cedulaCliente && item.cedulaCliente.toLowerCase().includes(searchCedula.toLowerCase()));
      return matchPedido && matchSimo && matchCedula;
    });
  }, [items, searchPedido, searchSimo, searchCedula]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Reset página al cambiar búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchPedido, searchSimo, searchCedula]);

  const handleDelete = async (item) => {
    try {
      const cat = item.categoria || (item.tipoPedido === 'hogar' ? 'hogar' : 'movil');
      await axios.delete(`/api/ventas/${item.id}?categoria=${cat}`);
      setItems(items.filter(i => i.id !== item.id));
      setDeleteConfirm(null);
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      plan: item.plan || '',
      planPrice: item.planPrice || '',
      cedulaCliente: item.cedulaCliente || '',
      customerName: item.customerName || '',
      imei: item.imei || '',
      accesorioSerie: item.accesorioSerie || '',
      homeNumber: item.homeNumber || ''
    });
  };

  const handleEdit = async () => {
    try {
      const cat = editingItem.categoria || (editingItem.tipoPedido === 'hogar' ? 'hogar' : 'movil');
      await axios.put(`/api/ventas/${editingItem.id}?categoria=${cat}`, editForm);
      // Actualizar la lista localmente
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...editForm } : i));
      setEditingItem(null);
      setEditForm({});
    } catch (err) {
      alert('Error al editar: ' + (err.response?.data?.error || err.message));
    }
  };

  const formatDate = (createdAt) => {
    if (!createdAt) return '-';
    const seconds = createdAt._seconds || createdAt.seconds;
    if (seconds) return new Date(seconds * 1000).toLocaleDateString('es-CR');
    return new Date(createdAt).toLocaleDateString('es-CR');
  };

  return (
    <div className="ventas-list-container">
      <div className="ventas-header">
        <h2>Listado de Ventas</h2>
        <div className="ventas-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            📊 Todas
          </button>
          <button 
            className={`filter-btn ${filter === 'movil' ? 'active' : ''}`}
            onClick={() => setFilter('movil')}
          >
            📱 Móvil
          </button>
          <button 
            className={`filter-btn ${filter === 'hogar' ? 'active' : ''}`}
            onClick={() => setFilter('hogar')}
          >
            🏠 Hogar
          </button>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="search-filters">
        <div className="search-field">
          <label>🔍 Nº Pedido</label>
          <input 
            type="text"
            placeholder="Buscar por pedido..."
            value={searchPedido}
            onChange={e => setSearchPedido(e.target.value)}
          />
        </div>
        <div className="search-field">
          <label>📋 Orden Simo</label>
          <input 
            type="text"
            placeholder="Buscar por orden..."
            value={searchSimo}
            onChange={e => setSearchSimo(e.target.value)}
          />
        </div>
        <div className="search-field">
          <label>🪪 Cédula</label>
          <input 
            type="text"
            placeholder="Buscar por cédula..."
            value={searchCedula}
            onChange={e => setSearchCedula(e.target.value)}
          />
        </div>
        {(searchPedido || searchSimo || searchCedula) && (
          <button 
            className="clear-search-btn"
            onClick={() => { setSearchPedido(''); setSearchSimo(''); setSearchCedula(''); }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      {!loading && (
        <div className="results-count">
          Mostrando {paginatedItems.length} de {filteredItems.length} ventas
          {filteredItems.length !== items.length && ` (filtradas de ${items.length} total)`}
        </div>
      )}
      
      {loading ? (
        <div className="empty-ventas">Cargando ventas...</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-ventas">
          <div className="empty-ventas-icon">📭</div>
          <div className="empty-ventas-text">
            {items.length === 0 ? 'No hay ventas registradas' : 'No se encontraron resultados'}
          </div>
        </div>
      ) : (
        <>
        <div className="ventas-grid">
          {paginatedItems.map(it => {
            const isHogar = it.categoria === 'hogar' || it.tipoPedido === 'hogar';
            return (
              <div key={it.id} className={`venta-card ${isHogar ? 'hogar' : 'movil'}`}>
                <div className="venta-card-header">
                  <div className={`venta-type-badge ${isHogar ? 'hogar' : 'movil'}`}>
                    {isHogar ? '🏠 Hogar' : '📱 Móvil'}
                  </div>
                  <div className="venta-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => startEdit(it)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => setDeleteConfirm(it)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="venta-plan">{it.plan}</div>

                <div className="venta-detail">
                  <span className="venta-detail-label">Agente:</span>
                  <span>{it.agenteId}</span>
                </div>

                {it.customerName && (
                  <div className="venta-detail">
                    <span className="venta-detail-label">Cliente:</span>
                    <span>{it.customerName}</span>
                  </div>
                )}

                {it.cedulaCliente && (
                  <div className="venta-detail">
                    <span className="venta-detail-label">Cédula:</span>
                    <span>{it.cedulaCliente}</span>
                  </div>
                )}

                {!isHogar && it.imei && (
                  <div className="venta-detail">
                    <span className="venta-detail-label">IMEI:</span>
                    <span>{it.imei}</span>
                  </div>
                )}

                {!isHogar && it.imeis && it.imeis.length > 0 && (
                  <div className="venta-detail">
                    <span className="venta-detail-label">IMEIs:</span>
                    <span>{it.imeis.length} terminal(es)</span>
                  </div>
                )}

                {!isHogar && it.accesorios && it.accesorios.length > 0 && (
                  <div className="venta-detail">
                    <span className="venta-detail-label">Accesorios:</span>
                    <span>{it.accesorios.length} accesorio(s)</span>
                  </div>
                )}

                {it.homeNumber && (
                  <div className="venta-detail">
                    <span className="venta-detail-label">{isHogar ? 'Orden Simo:' : 'Teléfono:'}</span>
                    <span>{it.homeNumber}</span>
                  </div>
                )}

                <div className="venta-detail">
                  <span className="venta-detail-label">Fecha:</span>
                  <span>{formatDate(it.createdAt)}</span>
                </div>

                {it.planPrice && (
                  <div className="venta-price">
                    ₡{it.planPrice.toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
              title="Primera página"
            >
              ⏮️
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
            >
              ◀️ Anterior
            </button>
            
            <span className="page-info">
              Página {currentPage} de {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
            >
              Siguiente ▶️
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages}
              title="Última página"
            >
              ⏭️
            </button>
          </div>
        )}
        </>
      )}

      {/* Modal de confirmación para eliminar */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>⚠️ Confirmar eliminación</h3>
            <p>¿Estás seguro de eliminar esta venta?</p>
            <p><strong>{deleteConfirm.plan}</strong> - {deleteConfirm.cedulaCliente}</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </button>
              <button className="btn-delete" onClick={() => handleDelete(deleteConfirm)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <h3>✏️ Editar Venta</h3>
            
            <div className="edit-field">
              <label>Plan</label>
              <input 
                value={editForm.plan} 
                onChange={e => setEditForm({...editForm, plan: e.target.value})}
              />
            </div>

            <div className="edit-field">
              <label>Precio Plan (₡)</label>
              <input 
                type="number"
                value={editForm.planPrice} 
                onChange={e => setEditForm({...editForm, planPrice: Number(e.target.value)})}
              />
            </div>

            <div className="edit-field">
              <label>Cédula Cliente</label>
              <input 
                value={editForm.cedulaCliente} 
                onChange={e => setEditForm({...editForm, cedulaCliente: e.target.value})}
              />
            </div>

            <div className="edit-field">
              <label>Nombre Cliente</label>
              <input 
                value={editForm.customerName} 
                onChange={e => setEditForm({...editForm, customerName: e.target.value})}
              />
            </div>

            {editingItem.tipoPedido !== 'hogar' && editingItem.categoria !== 'hogar' && (
              <>
                <div className="edit-field">
                  <label>IMEI</label>
                  <input 
                    value={editForm.imei} 
                    onChange={e => setEditForm({...editForm, imei: e.target.value})}
                  />
                </div>
                <div className="edit-field">
                  <label>Serie Accesorio</label>
                  <input 
                    value={editForm.accesorioSerie} 
                    onChange={e => setEditForm({...editForm, accesorioSerie: e.target.value})}
                  />
                </div>
              </>
            )}

            {(editingItem.tipoPedido === 'hogar' || editingItem.categoria === 'hogar') && (
              <div className="edit-field">
                <label>Orden Simo / Teléfono Hogar</label>
                <input 
                  value={editForm.homeNumber} 
                  onChange={e => setEditForm({...editForm, homeNumber: e.target.value})}
                />
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingItem(null)}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleEdit}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
