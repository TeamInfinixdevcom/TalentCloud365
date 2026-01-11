const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

// Service account JSON already in project root
const serviceAccountPath = path.join(__dirname, '..', 'talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Planes y precios (colones)
const PLAN_PRICES = {
  'K1 plus': 12000,
  'K2 plus': 16500,
  'K3 plus': 21500,
  'K4 plus': 29500,
  'K5 plus': 35000,
  'K6 plus': 44000
};

function computeProjections(planPrice, saleDate) {
  const projection12 = planPrice * 12;
  const monthIndex = saleDate.getMonth(); // 0 = Jan, 5 = Jun
  const monthsRemainingInclusive = 12 - monthIndex; // e.g. Jun (5) -> 7
  const monthsRemainingExcludingCurrent = Math.max(1, 12 - monthIndex - 1); // e.g. Jun -> 6

  return {
    projection12,
    monthsRemainingInclusive,
    monthsRemainingExcludingCurrent,
    projectionToYearEnd_inclusive: planPrice * monthsRemainingInclusive,
    projectionToYearEnd_excludingCurrent: planPrice * monthsRemainingExcludingCurrent
  };
}

app.post('/ventas', async (req, res) => {
  try {
    const body = req.body || {};

    const {
      agenteId,
      tipoPedido,
      numeroPedido,
      plan,
      imei,
      accesorioSerie,
      cedulaCliente,
      numeroCliente,
      fechaVenta
    } = body;

    if (!agenteId || !tipoPedido || !numeroPedido || !plan || !cedulaCliente) {
      return res.status(400).json({ error: 'Faltan campos requeridos (agenteId, tipoPedido, numeroPedido, plan, cedulaCliente).' });
    }

    const planPrice = PLAN_PRICES[plan];
    if (!planPrice) {
      return res.status(400).json({ error: 'Plan desconocido. Use uno de: ' + Object.keys(PLAN_PRICES).join(', ') });
    }

    const createdAt = fechaVenta ? new Date(fechaVenta) : new Date();

    const projections = computeProjections(planPrice, createdAt);

    const doc = {
      agenteId,
      tipoPedido,
      numeroPedido,
      plan,
      planPrice,
      imei: imei || null,
      accesorioSerie: accesorioSerie || null,
      cedulaCliente,
      numeroCliente: numeroCliente || null,
      createdAt: admin.firestore.Timestamp.fromDate(createdAt),
      projections
    };

    const docRef = await db.collection('ventas').add(doc);

    return res.status(201).json({ id: docRef.id, doc });
  } catch (error) {
    console.error('Error en /ventas:', error, error && error.stack);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// List ventas with optional pagination and agent filter
app.get('/ventas', async (req, res) => {
  try {
    const { agenteId, limit = 20, startAfterId } = req.query;
    let q = db.collection('ventas').orderBy('createdAt', 'desc').limit(Number(limit));

    if (agenteId) q = q.where('agenteId', '==', agenteId);

    if (startAfterId) {
      const startDoc = await db.collection('ventas').doc(startAfterId).get();
      if (startDoc.exists) q = q.startAfter(startDoc);
    }

    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ items });
  } catch (error) {
    console.error('Error en GET /ventas:', error, error && error.stack);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Metrics: counts and projections
app.get('/metrics', async (req, res) => {
  try {
    const { agenteId } = req.query;
    let q = db.collection('ventas');
    if (agenteId) q = q.where('agenteId', '==', agenteId);

    const snap = await q.get();

    let totalPlanRevenue = 0;
    let totalProjection12 = 0;
    let totalProjectionYearEnd = 0;
    let accessoriesCount = 0;
    let terminalsCount = 0;

    snap.forEach(doc => {
      const v = doc.data();
      const price = v.planPrice || 0;
      totalPlanRevenue += price;
      totalProjection12 += price * 12;

      const createdAt = v.createdAt && v.createdAt.toDate ? v.createdAt.toDate() : new Date(v.createdAt);
      const monthIndex = createdAt.getMonth(); // 0-based
      const monthsRemainingExcludingCurrent = Math.max(1, 12 - monthIndex - 1);
      totalProjectionYearEnd += price * monthsRemainingExcludingCurrent;

      if (v.accesorioSerie) accessoriesCount += 1;
      if (v.imei) terminalsCount += 1;
    });

    return res.json({
      totalPlanRevenue,
      totalProjection12,
      totalProjectionToYearEnd: totalProjectionYearEnd,
      accessoriesCount,
      terminalsCount,
      ventasCount: snap.size
    });
  } catch (error) {
    console.error('Error en GET /metrics:', error, error && error.stack);
    return res.status(500).json({ error: 'Error interno' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
