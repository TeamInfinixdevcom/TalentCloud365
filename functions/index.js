const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Lazy init to avoid deploy-time analysis timeouts.
let firestoreDb;
function getDb() {
  if (!firestoreDb) {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    firestoreDb = admin.firestore();
  }
  return firestoreDb;
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Router that we mount at both '/' and '/api'.
// Firebase Hosting rewrites to Functions do not strip the matched prefix, so
// requests like '/api/ventas' will reach the function with that same path.
const router = express.Router();

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
  const monthIndex = saleDate.getMonth();
  const monthsRemainingInclusive = 12 - monthIndex;
  const monthsRemainingExcludingCurrent = Math.max(1, 12 - monthIndex - 1);

  return {
    projection12,
    monthsRemainingInclusive,
    monthsRemainingExcludingCurrent,
    projectionToYearEnd_inclusive: planPrice * monthsRemainingInclusive,
    projectionToYearEnd_excludingCurrent: planPrice * monthsRemainingExcludingCurrent
  };
}

router.post('/ventas', async (req, res) => {
  try {
    const db = getDb();
    const body = req.body || {};
    const {
      agenteId,
      categoria,
      tipoPedido,
      numeroPedido,
      plan,
      planPrice: planPriceFromClient,
      imei,
      imeis,
      accesorioSerie,
      accesorios,
      cedulaCliente,
      numeroCliente,
      homeNumber,
      customerName,
      fechaVenta
    } = body;

    if (!agenteId || !plan || !cedulaCliente) {
      return res.status(400).json({ error: 'Faltan campos requeridos (agenteId, plan, cedulaCliente).' });
    }

    // Determine plan price: prefer client-provided price (useful for hogar), otherwise lookup
    let planPrice = null;
    if (planPriceFromClient) {
      planPrice = Number(planPriceFromClient);
    } else if (PLAN_PRICES[plan]) {
      planPrice = PLAN_PRICES[plan];
    }

    if (!planPrice || Number.isNaN(planPrice)) {
      return res.status(400).json({ error: 'Precio del plan desconocido o inválido. Envíe `planPrice` o use un `plan` conocido.' });
    }

    const createdAt = fechaVenta ? new Date(fechaVenta) : new Date();
    const projections = computeProjections(planPrice, createdAt);

    const doc = {
      agenteId,
      tipoPedido: tipoPedido || null,
      numeroPedido: numeroPedido || null,
      plan,
      planPrice,
      // Compatibilidad: guardar ambos campos individuales y arrays
      imei: imei || null,
      imeis: Array.isArray(imeis) ? imeis : (imei ? [imei] : []),
      accesorioSerie: accesorioSerie || null,
      accesorios: Array.isArray(accesorios) ? accesorios : (accesorioSerie ? [accesorioSerie] : []),
      cedulaCliente,
      numeroCliente: numeroCliente || null,
      homeNumber: homeNumber || null,
      customerName: customerName || null,
      createdAt: admin.firestore.Timestamp.fromDate(createdAt),
      projections
    };
    // Decide collection: hogar orders are stored separately.
    // Importante: NO inferir hogar por `customerName`, porque en móvil también se usa.
    const categoriaNorm = (categoria || '').toString().toLowerCase();
    const tipoPedidoNorm = (tipoPedido || '').toString().toLowerCase();
    const isHogar = categoriaNorm === 'hogar' || tipoPedidoNorm === 'hogar';
    const collectionName = isHogar ? 'ventas_hogar' : 'ventas';
    const docRef = await db.collection(collectionName).add(doc);
    return res.status(201).json({ id: docRef.id, doc });
  } catch (error) {
    console.error('Error en /ventas:', error, error && error.stack);
    return res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/ventas', async (req, res) => {
  try {
    const db = getDb();
    const { agenteId, limit = 50, startAfterId, categoria } = req.query;
    const limitNumber = Number(limit) || 50;
    const sortByCreatedAtDesc = (a, b) => {
      const dateA = a.createdAt?._seconds || a.createdAt?.seconds || 0;
      const dateB = b.createdAt?._seconds || b.createdAt?.seconds || 0;
      return dateB - dateA;
    };
    
    // Si categoria es 'all' o no se especifica, traer ambas colecciones
    if (!categoria || categoria === 'all') {
      let qMovil = db.collection('ventas');
      let qHogar = db.collection('ventas_hogar');
      
      if (agenteId) {
        // Nota: evitar (where + orderBy) para no requerir índice compuesto.
        qMovil = qMovil.where('agenteId', '==', agenteId).limit(limitNumber);
        qHogar = qHogar.where('agenteId', '==', agenteId).limit(limitNumber);
      } else {
        qMovil = qMovil.orderBy('createdAt', 'desc').limit(limitNumber);
        qHogar = qHogar.orderBy('createdAt', 'desc').limit(limitNumber);
      }
      
      const [snapMovil, snapHogar] = await Promise.all([qMovil.get(), qHogar.get()]);
      
      const itemsMovil = snapMovil.docs.map(d => ({ id: d.id, categoria: 'movil', ...d.data() }));
      const itemsHogar = snapHogar.docs.map(d => ({ id: d.id, categoria: 'hogar', ...d.data() }));
      
      // Combinar y ordenar por fecha
      const items = [...itemsMovil, ...itemsHogar]
        .sort(sortByCreatedAtDesc)
        .slice(0, limitNumber);
      
      return res.json({ items });
    }
    
    const useHogar = categoria.toLowerCase() === 'hogar';
    const collectionName = useHogar ? 'ventas_hogar' : 'ventas';
    let q = db.collection(collectionName);

    if (agenteId) {
      // Nota: evitar (where + orderBy) para no requerir índice compuesto.
      q = q.where('agenteId', '==', agenteId).limit(limitNumber);
      const snap = await q.get();
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort(sortByCreatedAtDesc)
        .slice(0, limitNumber);
      return res.json({ items });
    }

    // Admin (sin filtro por agente): mantener orderBy y paginación por cursor
    q = q.orderBy('createdAt', 'desc').limit(limitNumber);
    if (startAfterId) {
      const startDoc = await db.collection(collectionName).doc(startAfterId).get();
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

router.get('/metrics', async (req, res) => {
  try {
    const db = getDb();
    const { agenteId, categoria } = req.query;
    const categoriaNorm = (categoria || '').toString().toLowerCase();

    const computeFromSnap = (snap) => {
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
        const monthIndex = createdAt.getMonth();
        const monthsRemainingExcludingCurrent = Math.max(1, 12 - monthIndex - 1);
        totalProjectionYearEnd += price * monthsRemainingExcludingCurrent;
        // Contar accesorios y terminales (IMEIs) como suma de arrays, o 1 si solo hay campo individual
        if (Array.isArray(v.accesorios) && v.accesorios.length > 0) {
          accessoriesCount += v.accesorios.length;
        } else if (v.accesorioSerie) {
          accessoriesCount += 1;
        }
        if (Array.isArray(v.imeis) && v.imeis.length > 0) {
          terminalsCount += v.imeis.length;
        } else if (v.imei) {
          terminalsCount += 1;
        }
      });

      return {
        totalPlanRevenue,
        totalProjection12,
        totalProjectionYearEnd,
        accessoriesCount,
        terminalsCount,
        ventasCount: snap.size,
        totalSales: snap.size
      };
    };

    // Si no hay categoria o es 'all', combinar móvil + hogar
    if (!categoriaNorm || categoriaNorm === 'all') {
      try {
        let qMovil = db.collection('ventas');
        let qHogar = db.collection('ventas_hogar');
        if (agenteId) {
          qMovil = qMovil.where('agenteId', '==', agenteId);
          qHogar = qHogar.where('agenteId', '==', agenteId);
        }
        const [snapMovil, snapHogar] = await Promise.all([qMovil.get(), qHogar.get()]);
        const m = computeFromSnap(snapMovil);
        const h = computeFromSnap(snapHogar);

        return res.json({
          collection: 'ventas+ventas_hogar',
          totalPlanRevenue: m.totalPlanRevenue + h.totalPlanRevenue,
          totalProjection12: m.totalProjection12 + h.totalProjection12,
          totalProjectionToYearEnd: m.totalProjectionYearEnd + h.totalProjectionYearEnd,
          accessoriesCount: m.accessoriesCount + h.accessoriesCount,
          terminalsCount: m.terminalsCount + h.terminalsCount,
          ventasCount: m.ventasCount + h.ventasCount,
          totalSales: m.totalSales + h.totalSales
        });
      } catch (err) {
        console.error('Error en GET /metrics (all):', err);
        return res.status(500).json({ error: 'Error al combinar métricas' });
      }
    }

    const useHogar = categoriaNorm === 'hogar';
    const collectionName = useHogar ? 'ventas_hogar' : 'ventas';
    let q = db.collection(collectionName);
    if (agenteId) q = q.where('agenteId', '==', agenteId);
    const snap = await q.get();
    const result = computeFromSnap(snap);

    return res.json({
      collection: collectionName,
      totalPlanRevenue: result.totalPlanRevenue,
      totalProjection12: result.totalProjection12,
      totalProjectionToYearEnd: result.totalProjectionYearEnd,
      accessoriesCount: result.accessoriesCount,
      terminalsCount: result.terminalsCount,
      ventasCount: result.ventasCount,
      totalSales: result.totalSales
    });
  } catch (error) {
    console.error('Error en GET /metrics:', error, error && error.stack);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /ventas/:id - Eliminar una venta
router.delete('/ventas/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { categoria } = req.query;
    const collectionName = categoria === 'hogar' ? 'ventas_hogar' : 'ventas';
    
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Intentar en la otra colección
      const altCollection = collectionName === 'ventas' ? 'ventas_hogar' : 'ventas';
      const altDocRef = db.collection(altCollection).doc(id);
      const altDoc = await altDocRef.get();
      if (altDoc.exists) {
        await altDocRef.delete();
        return res.json({ success: true, id, collection: altCollection });
      }
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    await docRef.delete();
    return res.json({ success: true, id, collection: collectionName });
  } catch (error) {
    console.error('Error en DELETE /ventas:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// PUT /ventas/:id - Actualizar una venta
router.put('/ventas/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { categoria } = req.query;
    const body = req.body || {};
    const collectionName = categoria === 'hogar' ? 'ventas_hogar' : 'ventas';
    
    // Función auxiliar para actualizar con recálculo de proyecciones
    async function updateDocWithProjections(docRef, existingData) {
      const updateData = { ...body };
      
      // Si se actualiza el precio, recalcular proyecciones
      if (body.planPrice !== undefined && body.planPrice !== existingData.planPrice) {
        const newPrice = Number(body.planPrice);
        // Usar la fecha original de creación para calcular proyecciones
        let createdAt;
        if (existingData.createdAt && existingData.createdAt.toDate) {
          createdAt = existingData.createdAt.toDate();
        } else if (existingData.createdAt) {
          createdAt = new Date(existingData.createdAt);
        } else {
          createdAt = new Date();
        }
        
        // Recalcular proyecciones con el nuevo precio
        const newProjections = computeProjections(newPrice, createdAt);
        updateData.projections = newProjections;
        updateData.planPrice = newPrice;
      }
      
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await docRef.update(updateData);
      const updated = await docRef.get();
      return updated.data();
    }
    
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Intentar en la otra colección
      const altCollection = collectionName === 'ventas' ? 'ventas_hogar' : 'ventas';
      const altDocRef = db.collection(altCollection).doc(id);
      const altDoc = await altDocRef.get();
      if (altDoc.exists) {
        const updatedData = await updateDocWithProjections(altDocRef, altDoc.data());
        return res.json({ success: true, id, collection: altCollection, doc: updatedData });
      }
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    const updatedData = await updateDocWithProjections(docRef, doc.data());
    return res.json({ success: true, id, collection: collectionName, doc: updatedData });
  } catch (error) {
    console.error('Error en PUT /ventas:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// GET /usuarios - Obtener todos los usuarios (solo para admins)
router.get('/usuarios', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('usuarios').get();
    const usuarios = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    return res.json({ usuarios });
  } catch (error) {
    console.error('Error en GET /usuarios:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Mount router for both '/ventas' and '/api/ventas' paths.
app.use('/api', router);
app.use(router);

exports.api = functions.https.onRequest(app);
