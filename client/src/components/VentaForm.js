import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/VentaForm.css';

// Mapeo de planes con precios para autocarga
const PLAN_PRICES = {
  // Planes móvil K
  'K1 plus': 12000,
  'K2 plus': 16500,
  'K3 plus': 21500,
  'K4 plus': 29500,
  'K5 plus': 35000,
  'K6 plus': 44000,
  // Planes prepago
  'KIT PREPAGO': 1000,
  'Do. Prepago 6,065': 6065,
  'Do. Prepago 12,095': 12095,
  // Dominio K
  'Dominio k2': 10458,
  'Dominio k3': 14380,
  'Dominio k4': 18738,
  'Dominio k5': 25710
};

const PLANS = [
  'K1 plus',
  'K2 plus',
  'K3 plus',
  'K4 plus',
  'K5 plus',
  'K6 plus',
  'KIT PREPAGO',
  'Do. Prepago 6,065',
  'Do. Prepago 12,095',
  'Dominio k2',
  'Dominio k3',
  'Dominio k4',
  'Dominio k5'
];

const DEFAULT_API = process.env.REACT_APP_API_URL || '/api/ventas';

export default function VentaForm({ apiUrl = DEFAULT_API }) {
  const { userProfile } = useAuth();
  const [form, setForm] = useState({
    agenteId: '',
    categoria: 'movil', // 'movil' or 'hogar'
    tipoPedido: 'Komercial',
    numeroPedido: '',
    plan: PLANS[0],
    planPrice: PLAN_PRICES[PLANS[0]].toString(), // Autocargar precio inicial
    cedulaCliente: '',
    numeroCliente: '',
    homeNumber: '',
    customerName: ''
  });
  // Arrays para múltiples IMEIs y accesorios
  const [imeis, setImeis] = useState(['']);
  const [accesorios, setAccesorios] = useState(['']);
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
    if (field === 'plan' && PLAN_PRICES[value]) {
      updatedForm.planPrice = PLAN_PRICES[value].toString();
    }
    
    setForm(updatedForm);
  }

  // Funciones para manejar arrays de IMEIs
  function updateImei(index, value) {
    const newImeis = [...imeis];
    newImeis[index] = value;
    setImeis(newImeis);
  }

  function addImei() {
    setImeis([...imeis, '']);
  }

  function removeImei(index) {
    if (imeis.length > 1) {
      setImeis(imeis.filter((_, i) => i !== index));
    }
  }

  // Funciones para manejar arrays de accesorios
  function updateAccesorio(index, value) {
    const newAccesorios = [...accesorios];
    newAccesorios[index] = value;
    setAccesorios(newAccesorios);
  }

  function addAccesorio() {
    setAccesorios([...accesorios, '']);
  }

  function removeAccesorio(index) {
    if (accesorios.length > 1) {
      setAccesorios(accesorios.filter((_, i) => i !== index));
    }
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Basic validation
    if (!form.agenteId || !form.numeroPedido || !form.cedulaCliente) {
      setResult({ error: 'Complete agenteId, numeroPedido y cedulaCliente.' });
      setLoading(false);
      return;
    }

    // Filtrar IMEIs y accesorios vacíos
    const imeisFiltered = imeis.filter(i => i.trim() !== '');
    const accesoriosFiltered = accesorios.filter(a => a.trim() !== '');

    try {
      const payload = {
        ...form,
        imeis: imeisFiltered,
        accesorios: accesoriosFiltered,
        // Mantener compatibilidad con campo individual
        imei: imeisFiltered[0] || null,
        accesorioSerie: accesoriosFiltered[0] || null
      };

      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) throw data;
      setResult({ success: data });
      // Reset form
      setForm({
        agenteId: userProfile?.agenteId || '',
        tipoPedido: 'Komercial',
        numeroPedido: '',
        plan: PLANS[0],
        planPrice: PLAN_PRICES[PLANS[0]].toString(),
        cedulaCliente: '',
        numeroCliente: '',
        homeNumber: '',
        customerName: '',
        categoria: 'movil'
      });
      setImeis(['']);
      setAccesorios(['']);
    } catch (err) {
      setResult({ error: err.error || JSON.stringify(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="venta-form-container">
      <form onSubmit={submit} className="form-wrapper">
        <div className="form-group">
          <label>Agente</label>
          <input 
            value={userProfile?.nombre || 'Cargando...'} 
            readOnly 
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', color: '#666' }}
          />
        </div>

        <div className="form-section">
          <span className="form-section-title">Tipo de Venta</span>

          <div className="form-group">
            <label>Tipo Pedido</label>
            <select value={form.tipoPedido} onChange={e => update('tipoPedido', e.target.value)}>
              <option>Komercial</option>
              <option>Siebel</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Número Pedido</label>
          <input value={form.numeroPedido} onChange={e => update('numeroPedido', e.target.value)} />
        </div>

        <div className="form-section">
          <span className="form-section-title">Datos del Plan</span>
          <div className="form-group">
            <label>Plan</label>
            <select value={form.plan} onChange={e => update('plan', e.target.value)} style={{ fontSize: 14, fontWeight: 500 }}>
              <optgroup label="📱 K Plus">
                <option>K1 plus</option>
                <option>K2 plus</option>
                <option>K3 plus</option>
                <option>K4 plus</option>
                <option>K5 plus</option>
                <option>K6 plus</option>
              </optgroup>
              <optgroup label="🔄 Prepago">
                <option>KIT PREPAGO</option>
                <option>Do. Prepago 6,065</option>
                <option>Do. Prepago 12,095</option>
              </optgroup>
              <optgroup label="🎁 Dominio K">
                <option>Dominio k2</option>
                <option>Dominio k3</option>
                <option>Dominio k4</option>
                <option>Dominio k5</option>
              </optgroup>
            </select>
            <div style={{ fontSize: 13, color: '#007AFF', fontWeight: 600, marginTop: 6 }}>
              Precio: ₡{form.planPrice ? parseInt(form.planPrice).toLocaleString() : '0'}
            </div>
          </div>

          <div className="form-group">
            <label style={{ opacity: 0.6 }}>Precio del plan (se autocarga)</label>
            <input 
              type="text"
              value={form.planPrice ? `₡${parseInt(form.planPrice).toLocaleString()}` : ''} 
              readOnly 
              style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
              placeholder="Se autocarga al seleccionar plan"
            />
          </div>
        </div>

        {form.categoria === 'movil' && (
          <div className="form-section">
            <span className="form-section-title">📱 Terminales (IMEIs)</span>
            {imeis.map((imei, index) => (
              <div key={index} className="form-group array-field">
                <div className="array-input-row">
                  <input 
                    value={imei} 
                    onChange={e => updateImei(index, e.target.value)} 
                    placeholder={`IMEI ${index + 1}`}
                  />
                  {imeis.length > 1 && (
                    <button type="button" className="remove-btn" onClick={() => removeImei(index)}>✕</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="add-btn" onClick={addImei}>
              + Agregar otro terminal
            </button>

            <span className="form-section-title" style={{ marginTop: 16 }}>🎧 Accesorios</span>
            {accesorios.map((acc, index) => (
              <div key={index} className="form-group array-field">
                <div className="array-input-row">
                  <input 
                    value={acc} 
                    onChange={e => updateAccesorio(index, e.target.value)} 
                    placeholder={`Serie accesorio ${index + 1}`}
                  />
                  {accesorios.length > 1 && (
                    <button type="button" className="remove-btn" onClick={() => removeAccesorio(index)}>✕</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="add-btn" onClick={addAccesorio}>
              + Agregar otro accesorio
            </button>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Teléfono Cliente (opcional)</label>
              <input value={form.numeroCliente} onChange={e => update('numeroCliente', e.target.value)} />
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Cédula Cliente</label>
          <input value={form.cedulaCliente} onChange={e => update('cedulaCliente', e.target.value)} />
        </div>

        <button type="submit" disabled={loading} className="form-button">
          {loading ? 'Guardando...' : 'Guardar venta'}
        </button>

        {result && (
          <div className={`form-result ${result.error ? 'error' : 'success'}`}>
            <strong>{result.error ? '❌ Error' : '✅ Éxito'}</strong>
            <p>{result.error || `Venta registrada: ${result.success.id}`}</p>
          </div>
        )}
      </form>
    </div>
  );
}
