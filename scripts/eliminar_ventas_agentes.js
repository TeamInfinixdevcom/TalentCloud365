const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function eliminarVentasAgentes() {
  console.log('🗑️ Eliminando ventas de Allan y Ana...\n');
  
  try {
    // Eliminar ventas de Allan
    const ventasAllan = await db.collection('ventas')
      .where('agenteId', '==', 'aarguedasv')
      .get();
    
    for (const doc of ventasAllan.docs) {
      await doc.ref.delete();
      console.log(`✅ Eliminada venta móvil de Allan: ${doc.id}`);
    }
    
    const ventasHogarAllan = await db.collection('ventas_hogar')
      .where('agenteId', '==', 'aarguedasv')
      .get();
    
    for (const doc of ventasHogarAllan.docs) {
      await doc.ref.delete();
      console.log(`✅ Eliminada venta hogar de Allan: ${doc.id}`);
    }
    
    // Eliminar ventas de Ana
    const ventasAna = await db.collection('ventas')
      .where('agenteId', '==', 'arodriguezj')
      .get();
    
    for (const doc of ventasAna.docs) {
      await doc.ref.delete();
      console.log(`✅ Eliminada venta móvil de Ana: ${doc.id}`);
    }
    
    const ventasHogarAna = await db.collection('ventas_hogar')
      .where('agenteId', '==', 'arodriguezj')
      .get();
    
    for (const doc of ventasHogarAna.docs) {
      await doc.ref.delete();
      console.log(`✅ Eliminada venta hogar de Ana: ${doc.id}`);
    }
    
    const totalEliminadas = ventasAllan.size + ventasHogarAllan.size + ventasAna.size + ventasHogarAna.size;
    console.log(`\n✅ Total eliminadas: ${totalEliminadas} ventas`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

eliminarVentasAgentes();
