// Ejemplo de inserción de una venta en Firestore usando Node.js y Firebase Admin SDK

const admin = require('firebase-admin');
const serviceAccount = require('./infinix-kpihub-firebase-adminsdk-fbsvc-a3f42309a6.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function agregarVenta(venta) {
  try {
    const docRef = await db.collection('ventas').add(venta);
    console.log('Venta agregada con ID:', docRef.id);
  } catch (error) {
    console.error('Error agregando venta:', error);
  }
}

// Ejemplo de uso:
const ventaMovil = {
  agentId: "uid-del-agente",
  orderType: "Komercial",
  orderNumber: "KO-53421499",
  plan: "K1 plus",
  planPrice: 12000,
  imei: "123456789012345",
  accessorySerial: null,
  customerId: "123456789",
  customerPhone: "88889999",
  homeNumber: null,
  createdAt: new Date()
};

agregarVenta(ventaMovil);

// Para hogar, cambia los campos según corresponda.