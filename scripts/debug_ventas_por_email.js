// Debug: localizar ventas por email de usuario (colecciones: usuarios, ventas, ventas_hogar)
// Uso:
//   node scripts/debug_ventas_por_email.js ntorrez@ice.go.cr

const admin = require('firebase-admin');

const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/debug_ventas_por_email.js <email>');
  process.exit(1);
}

// IMPORTANT: no imprimir credenciales
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

function toIso(createdAt) {
  try {
    if (!createdAt) return null;
    if (createdAt.toDate) return createdAt.toDate().toISOString();
    if (createdAt._seconds) return new Date(createdAt._seconds * 1000).toISOString();
    return new Date(createdAt).toISOString();
  } catch {
    return null;
  }
}

async function findUserByEmail(userEmail) {
  const snap = await db.collection('usuarios').where('email', '==', userEmail).limit(5).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { uid: doc.id, ...doc.data() };
}

async function fetchSalesByAgenteId(agenteId, limit = 10) {
  // Nota: no usamos orderBy para evitar requerir índices compuestos.
  // Traemos un lote y ordenamos en memoria.
  const scanLimit = Math.max(limit * 25, 100);

  const [movilSnap, hogarSnap] = await Promise.all([
    db.collection('ventas').where('agenteId', '==', agenteId).limit(scanLimit).get(),
    db.collection('ventas_hogar').where('agenteId', '==', agenteId).limit(scanLimit).get()
  ]);

  const movilAll = movilSnap.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'ventas' }));
  const hogarAll = hogarSnap.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'ventas_hogar' }));

  const sortDesc = (a, b) => {
    const sa = a?.createdAt?._seconds ?? a?.createdAt?.seconds ?? 0;
    const sb = b?.createdAt?._seconds ?? b?.createdAt?.seconds ?? 0;
    return sb - sa;
  };

  const movil = movilAll.sort(sortDesc).slice(0, limit);
  const hogar = hogarAll.sort(sortDesc).slice(0, limit);

  return { movil, hogar, movilCount: movilAll.length, hogarCount: hogarAll.length };
}

async function main() {
  const user = await findUserByEmail(email);
  if (!user) {
    console.log(JSON.stringify({ email, foundUser: false }, null, 2));
    return;
  }

  const agenteId = user.agenteId;
  const payload = {
    email,
    foundUser: true,
    uid: user.uid,
    nombre: user.nombre || null,
    rol: user.rol || null,
    activo: user.activo !== undefined ? user.activo : null,
    agencia: user.agencia || null,
    agenteId: agenteId || null
  };

  if (!agenteId) {
    console.log(JSON.stringify({ ...payload, error: 'El usuario no tiene agenteId en Firestore.' }, null, 2));
    return;
  }

  const { movil, hogar, movilCount, hogarCount } = await fetchSalesByAgenteId(agenteId, 10);

  const compact = (v) => ({
    id: v.id,
    collection: v._collection,
    createdAt: toIso(v.createdAt),
    plan: v.plan || null,
    numeroPedido: v.numeroPedido || null,
    homeNumber: v.homeNumber || null,
    cedulaCliente: v.cedulaCliente || null,
    customerName: v.customerName || null,
    agenteId: v.agenteId || null
  });

  console.log(
    JSON.stringify(
      {
        ...payload,
        ventas: {
          movilCount,
          hogarCount,
          movilLatest: movil.map(compact),
          hogarLatest: hogar.map(compact)
        }
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('Error debug:', err?.message || err);
  process.exit(1);
});
