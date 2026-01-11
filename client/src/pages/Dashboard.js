import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const { userProfile, isAdminMode } = useAuth();
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalProjection12: 0,
    totalProjectionToYearEnd: 0,
    accessoriesCount: 0,
    terminalsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si es agente o admin en modo agente, filtrar por su agenteId
    const shouldFilterByAgent = !isAdminMode();
    const agentParam = shouldFilterByAgent && userProfile?.agenteId ? `?agenteId=${userProfile.agenteId}` : '';
    
    axios.get(`/api/metrics${agentParam}`)
      .then(r => {
        setMetrics(r.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [userProfile, isAdminMode]);

  return (
    <div className="dashboard-container">
      {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Cargando métricas...</div>}
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-label">Total Ventas</span>
          <div className="stat-value">{metrics.totalSales || 0}</div>
          <div className="stat-subtitle">Móvil + Hogar</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Proyección 12m</span>
          <div className="stat-value">₡{(metrics.totalProjection12 || 0).toLocaleString()}</div>
          <div className="stat-subtitle">Total esperado</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Terminales</span>
          <div className="stat-value">{metrics.terminalsCount || 0}</div>
          <div className="stat-subtitle">IMEIs vendidos</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Accesorios</span>
          <div className="stat-value">{metrics.accessoriesCount || 0}</div>
          <div className="stat-subtitle">Unidades</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Proyecciones de Ingresos</h3>
        <div className="chart-wrapper">
          <Line 
            data={{ 
              labels: ['12 meses', 'Año restante'], 
              datasets: [{ 
                label: 'Colones', 
                data: [metrics.totalProjection12 || 0, metrics.totalProjectionToYearEnd || 0], 
                borderColor: '#007AFF', 
                backgroundColor: 'rgba(0,122,255,0.1)', 
                borderWidth: 3, 
                tension: 0.4,
                fill: true
              }] 
            }} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  min: 0,
                  max: Math.max(metrics.totalProjection12 || 1000, metrics.totalProjectionToYearEnd || 1000) * 1.2
                }
              }
            }} 
          />
        </div>
      </div>

      <div className="chart-container">
        <h3>Distribución por Tipo</h3>
        <div className="chart-wrapper">
          <Bar 
            data={{ 
              labels: ['Accesorios', 'Terminales'], 
              datasets: [{ 
                label: 'Unidades', 
                data: [metrics.accessoriesCount || 0, metrics.terminalsCount || 0], 
                backgroundColor: ['#34c759', '#007AFF'],
                borderColor: ['#2d9e4d', '#0056b3'],
                borderWidth: 2
              }] 
            }} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  min: 0,
                  max: Math.max(metrics.accessoriesCount || 5, metrics.terminalsCount || 5) * 1.3
                }
              }
            }} 
          />
        </div>
      </div>
    </div>
  );
}
