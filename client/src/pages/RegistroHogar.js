import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/RegistroHogar.css';

// Mapeo de planes hogar con precios - Kolbi 2026
const PLAN_PRICES_HOGAR = {
  // Internet Individual
  'Internet 200 Mbps': 23900,
  'Internet 300 Mbps': 25900,
  'Internet 500 Mbps': 27900,
  'Internet 800 Mbps': 146700,
  'Internet 1 Gbps': 181800,
  // Dúo (Internet + TV)
  'Dúo 100 Mbps': 38900,
  'Dúo 200 Mbps': 42500,
  'Dúo 500 Mbps': 72800,
  'Dúo 800 Mbps': 164700,
  'Dúo 1 Gbps': 199800,
  // Triple (Internet + TV + Telefonía)
  'Triple 100 Mbps': 45500,
  'Triple 200 Mbps': 48900,
  'Triple 500 Mbps': 76900,
  'Triple 800 Mbps': 167400,
  'Triple 1 Gbps': 202500
};

const PLANES_HOGAR = [
  // Internet Individual
  'Internet 200 Mbps',
  'Internet 300 Mbps',
  'Internet 500 Mbps',
  'Internet 800 Mbps',
  'Internet 1 Gbps',
  // Dúo
  'Dúo 100 Mbps',
  'Dúo 200 Mbps',
  'Dúo 500 Mbps',
  'Dúo 800 Mbps',
  'Dúo 1 Gbps',
  // Triple
  'Triple 100 Mbps',
  'Triple 200 Mbps',
  'Triple 500 Mbps',
  'Triple 800 Mbps',
  'Triple 1 Gbps'
];

const DEFAULT_API = process.env.REACT_APP_API_URL || '/api/ventas';

export default function RegistroHogar({ apiUrl = DEFAULT_API }) {
  const { userProfile } = useAuth();
  const [form, setForm] = useState({
    agenteId: '',
    ordenSimo: '',           // Número de orden Simo (ej: 33620704)
    cedulaCliente: '',       // Cédula del cliente
    customerName: '',        // Nombre del cliente
    plan: PLANES_HOGAR[0],
    planPrice: PLAN_PRICES_HOGAR[PLANES_HOGAR[0]].toString(), // Autocargar precio inicial
    homeNumber: '',          // Número de teléfono o referencia de hogar (opcional)
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Auto-cargar el Agente ID cuando el usuario se autentica
  useEffect(() => {
    if (userProfile?.agenteId) {
      setForm(prev => ({
        ...prev,
        agenteId: userProfile.agenteId
      }));
    }
  }, [userProfile]);

  function update(field, value) {
    const updatedForm = { ...form, [field]: value };
    
    // Si se cambió el plan, autocargar el precio
    if (field === 'plan' && PLAN_PRICES_HOGAR[value]) {
      updatedForm.planPrice = PLAN_PRICES_HOGAR[value].toString();
    }
    
    setForm(updatedForm);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Validación
    if (!form.agenteId) {
      setResult({ error: 'El ID del agente es requerido.' });
      setLoading(false);
      return;
    }
    if (!form.ordenSimo) {
      setResult({ error: 'El número de orden Simo es requerido.' });
      setLoading(false);
      return;
    }
    if (!form.cedulaCliente) {
      setResult({ error: 'La cédula del cliente es requerida.' });
      setLoading(false);
      return;
    }
    if (!form.customerName) {
      setResult({ error: 'El nombre del cliente es requerido.' });
      setLoading(false);
      return;
    }

    try {
      // Preparar datos para enviar
      const payload = {
        agenteId: form.agenteId,
        tipoPedido: 'hogar',
        numeroPedido: null,      // Hogar no usa numeroPedido
        plan: form.plan,
        planPrice: form.planPrice ? parseInt(form.planPrice) : null,
        cedulaCliente: form.cedulaCliente,
        customerName: form.customerName,
        homeNumber: form.ordenSimo,  // La orden Simo va en homeNumber
        imei: null,
        accesorioSerie: null,
        numeroCliente: null
      };

      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok) throw data;

      setResult({ 
        success: true,
        message: `✅ Venta hogar registrada exitosamente`,
        docId: data.id
      });

      // Limpiar formulario
      setForm({
        agenteId: form.agenteId,  // Mantener el agente para próximas ventas
        ordenSimo: '',
        cedulaCliente: '',
        customerName: '',
        plan: PLANES_HOGAR[0],
        planPrice: '',
        homeNumber: '',
      });
    } catch (err) {
      setResult({ error: err.error || JSON.stringify(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="registro-hogar-container">
      <div className="registro-hogar-header">
        <h2>📱 Registro de Ventas Hogar</h2>
        <p>Registra nuevas ventas de servicios hogar desde el sistema Simo</p>
      </div>

      <form onSubmit={submit} className="hogar-form-wrapper">
        
        <div className="hogar-form-group">
          <label className="hogar-required">Agente</label>
          <input 
            type="text"
            value={userProfile?.nombre || 'Cargando...'} 
            readOnly
            placeholder="ej: agente_001"
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', color: '#666' }}
          />
        </div>

        <div className="hogar-form-group">
          <label className="hogar-required">Número de Orden Simo (ej: 33620704)</label>
          <input 
            type="text"
            value={form.ordenSimo} 
            onChange={e => update('ordenSimo', e.target.value)}
            placeholder="Ej: 33620704"
          />
        </div>

        <div className="hogar-form-group">
          <label className="hogar-required">Cédula del Cliente</label>
          <input 
            type="text"
            value={form.cedulaCliente} 
            onChange={e => update('cedulaCliente', e.target.value)}
            placeholder="ej: 123456789"
          />
        </div>

        <div className="hogar-form-group">
          <label className="hogar-required">Nombre del Cliente</label>
          <input 
            type="text"
            value={form.customerName} 
            onChange={e => update('customerName', e.target.value)}
            placeholder="ej: Juan Pérez García"
          />
        </div>

        <div className="hogar-form-group">
          <label>Plan de Hogar (Velocidad)</label>
          <select 
            value={form.plan} 
            onChange={e => update('plan', e.target.value)}
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            <optgroup label="📱 Internet Individual">
              <option>Internet 200 Mbps</option>
              <option>Internet 300 Mbps</option>
              <option>Internet 500 Mbps</option>
              <option>Internet 800 Mbps</option>
              <option>Internet 1 Gbps</option>
            </optgroup>
            <optgroup label="📺 Dúo (Internet + kölbi TV)">
              <option>Dúo 100 Mbps</option>
              <option>Dúo 200 Mbps</option>
              <option>Dúo 500 Mbps</option>
              <option>Dúo 800 Mbps</option>
              <option>Dúo 1 Gbps</option>
            </optgroup>
            <optgroup label="☎️ Triple (Internet + TV + Telefonía)">
              <option>Triple 100 Mbps</option>
              <option>Triple 200 Mbps</option>
              <option>Triple 500 Mbps</option>
              <option>Triple 800 Mbps</option>
              <option>Triple 1 Gbps</option>
            </optgroup>
          </select>
          <div style={{ fontSize: 13, color: '#34c759', fontWeight: 600, marginTop: 6 }}>
            Precio: ₡{form.planPrice ? parseInt(form.planPrice).toLocaleString() : '0'}
          </div>
        </div>

        <div className="hogar-form-group">
          <label style={{ opacity: 0.6 }}>Precio del Plan (se autocarga)</label>
          <input 
            type="text"
            value={form.planPrice ? `₡${parseInt(form.planPrice).toLocaleString()}` : ''} 
            readOnly 
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
            placeholder="Se autocarga al seleccionar plan"
          />
        </div>

        <div className="hogar-form-group">
          <label>Número de Teléfono Hogar (opcional)</label>
          <input 
            type="text"
            value={form.homeNumber} 
            onChange={e => update('homeNumber', e.target.value)}
            placeholder="ej: 22123456"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="hogar-form-button"
        >
          {loading ? 'Registrando...' : 'Registrar Venta Hogar'}
        </button>
      </form>

      {result && (
        <div className={`hogar-result ${result.error ? 'error' : 'success'}`}>
          {result.error && <strong>❌ Error:</strong>}
          {result.success && <strong>✅ Éxito:</strong>}
          <p style={{ marginTop: 8 }}>
            {result.error || result.message}
          </p>
          {result.docId && (
            <p className="hogar-result-doc-id">
              ID de documento: {result.docId}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
