import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/VentasGenerales.css';

export default function VentasGenerales() {
  const { userProfile } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState('all');

  useEffect(() => {
    // Cargar todas las ventas sin filtro
    Promise.all([
      axios.get('/api/ventas?limit=1000'),
      axios.get('/api/usuarios')
    ])
      .then(([ventasRes, usuariosRes]) => {
        const ventasData = ventasRes.data.items || [];
        const usuarios = usuariosRes?.data?.usuarios || [];
        
        // Enriquecer ventas con información del agente
        const ventasEnriquecidas = ventasData.map(v => {
          const agente = usuarios.find(u => u.agenteId === v.agenteId);
          return {
            ...v,
            agenteNombre: agente?.nombre || v.agenteId,
            agencia: agente?.agencia || 'Sin agencia'
          };
        });
        
        setVentas(ventasEnriquecidas);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando ventas:', err);
        setLoading(false);
      });
  }, []);

  // Agrupar por agencia
  const ventasPorAgencia = {};
  ventas.forEach(v => {
    const agencia = v.agencia || 'Sin agencia';
    if (!ventasPorAgencia[agencia]) {
      ventasPorAgencia[agencia] = {
        ventas: [],
        totalVentas: 0,
        proyeccion12m: 0,
        terminales: 0,
        accesorios: 0,
        agentes: {}
      };
    }
    
    ventasPorAgencia[agencia].ventas.push(v);
    ventasPorAgencia[agencia].totalVentas++;
    ventasPorAgencia[agencia].proyeccion12m += (v.planPrice || 0) * 12;
    
    // Contar terminales y accesorios
    if (Array.isArray(v.imeis)) {
      ventasPorAgencia[agencia].terminales += v.imeis.length;
    } else if (v.imei) {
      ventasPorAgencia[agencia].terminales += 1;
    }
    
    if (Array.isArray(v.accesorios)) {
      ventasPorAgencia[agencia].accesorios += v.accesorios.length;
    } else if (v.accesorioSerie) {
      ventasPorAgencia[agencia].accesorios += 1;
    }
    
    // Agrupar por agente
    const agenteId = v.agenteId || 'sin_agente';
    if (!ventasPorAgencia[agencia].agentes[agenteId]) {
      ventasPorAgencia[agencia].agentes[agenteId] = {
        nombre: v.agenteNombre,
        ventas: 0,
        proyeccion12m: 0,
        terminales: 0,
        accesorios: 0
      };
    }
    
    const agente = ventasPorAgencia[agencia].agentes[agenteId];
    agente.ventas++;
    agente.proyeccion12m += (v.planPrice || 0) * 12;
    
    if (Array.isArray(v.imeis)) {
      agente.terminales += v.imeis.length;
    } else if (v.imei) {
      agente.terminales += 1;
    }
    
    if (Array.isArray(v.accesorios)) {
      agente.accesorios += v.accesorios.length;
    } else if (v.accesorioSerie) {
      agente.accesorios += 1;
    }
  });

  const agencias = Object.keys(ventasPorAgencia);
  const agenciasFiltradas = agenciaSeleccionada === 'all' 
    ? agencias 
    : agencias.filter(a => a === agenciaSeleccionada);

  if (userProfile?.rol !== 'admin') {
    return (
      <div className="ventas-generales-container">
        <div className="access-denied">
          <span className="denied-icon">🔒</span>
          <h2>Acceso Denegado</h2>
          <p>Solo los administradores pueden ver las ventas generales.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ventas-generales-container">
      <div className="page-header">
        <h2>📊 Ventas Generales</h2>
        <p>Resumen consolidado por agencia y agente</p>
      </div>

      {/* Filtro por agencia */}
      <div className="filters-bar">
        <label>Filtrar por agencia:</label>
        <select value={agenciaSeleccionada} onChange={e => setAgenciaSeleccionada(e.target.value)}>
          <option value="all">📊 Todas las agencias</option>
          {agencias.map(ag => (
            <option key={ag} value={ag}>{ag}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Cargando ventas generales...</div>
      ) : (
        <div className="agencias-list">
          {agenciasFiltradas.map(agencia => {
            const data = ventasPorAgencia[agencia];
            const agentes = Object.entries(data.agentes);
            
            return (
              <div key={agencia} className="agencia-section">
                <div className="agencia-header-card">
                  <h3>🏪 {agencia}</h3>
                  <div className="agencia-metrics">
                    <div className="metric">
                      <span className="metric-label">Total Ventas</span>
                      <span className="metric-value">{data.totalVentas}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Proyección 12m</span>
                      <span className="metric-value">₡{data.proyeccion12m.toLocaleString()}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Terminales</span>
                      <span className="metric-value">{data.terminales}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Accesorios</span>
                      <span className="metric-value">{data.accesorios}</span>
                    </div>
                  </div>
                </div>

                {/* Agentes de la agencia */}
                <div className="agentes-grid">
                  {agentes.map(([agenteId, agenteData]) => (
                    <div key={agenteId} className="agente-card">
                      <div className="agente-header">
                        <span className="agente-nombre">👤 {agenteData.nombre}</span>
                      </div>
                      <div className="agente-stats">
                        <div className="stat-item">
                          <span className="stat-label">Ventas</span>
                          <span className="stat-number">{agenteData.ventas}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Proyección</span>
                          <span className="stat-number">₡{agenteData.proyeccion12m.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Terminales</span>
                          <span className="stat-number">{agenteData.terminales}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Accesorios</span>
                          <span className="stat-number">{agenteData.accesorios}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
