// Ejemplo de actualización y eliminación de una venta en Firestore usando Node.js y Firebase Admin SDK

const admin = require('firebase-admin');
const serviceAccount = require('./infinix-kpihub-firebase-adminsdk-fbsvc-a3f42309a6.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Actualizar una venta
async function actualizarVenta(ventaId, nuevosDatos) {
  try {
    await db.collection('ventas').doc(ventaId).update(nuevosDatos);
    console.log('Venta actualizada:', ventaId);
  } catch (error) {
    console.error('Error actualizando venta:', error);
  }
}

// Eliminar una venta
async function eliminarVenta(ventaId) {
  try {
    await db.collection('ventas').doc(ventaId).delete();
    console.log('Venta eliminada:', ventaId);
  } catch (error) {
    console.error('Error eliminando venta:', error);
  }
}

// Ejemplo de uso:
// actualizarVenta('ID_DE_LA_VENTA', { plan: 'K2 plus', planPrice: 16500 });
// eliminarVenta('ID_DE_LA_VENTA');

// Recuerda recalcular métricas después de editar o eliminar una venta.