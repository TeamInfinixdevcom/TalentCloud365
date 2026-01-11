const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function updateVentasAgenteId() {
  console.log('🔄 Actualizando agenteId en ventas...\n');
  
  try {
    // Actualizar ventas móvil
    const ventasSnap = await db.collection('ventas').get();
    let countMovil = 0;
    for (const doc of ventasSnap.docs) {
      await doc.ref.update({ agenteId: 'rmadrigalj' });
      countMovil++;
      console.log(`✅ Venta móvil ${doc.id} -> agenteId: rmadrigalj`);
    }
    
    // Actualizar ventas hogar
    const ventasHogarSnap = await db.collection('ventas_hogar').get();
    let countHogar = 0;
    for (const doc of ventasHogarSnap.docs) {
      await doc.ref.update({ agenteId: 'rmadrigalj' });
      countHogar++;
      console.log(`✅ Venta hogar ${doc.id} -> agenteId: rmadrigalj`);
    }
    
    console.log(`\n✅ Actualizadas ${countMovil} ventas móvil y ${countHogar} ventas hogar`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateVentasAgenteId();
