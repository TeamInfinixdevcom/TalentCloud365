const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function distribuirVentas() {
  console.log('📊 Distribuyendo ventas entre agentes...\n');
  
  try {
    // Agentes de Tibas Kolbi ICE
    const agentesTibas = ['aarguedasv', 'arodriguezj', 'lfernandez', 'ntorrez', 'msalasg'];
    
    // Obtener todas las ventas
    const ventasMovilSnap = await db.collection('ventas').get();
    const ventasHogarSnap = await db.collection('ventas_hogar').get();
    
    const allDocs = [...ventasMovilSnap.docs, ...ventasHogarSnap.docs];
    
    // Distribuir ventas: 2 para Ruben, las demás para agentes de Tibas
    let index = 0;
    for (const doc of allDocs) {
      let nuevoAgente;
      if (index < 2) {
        nuevoAgente = 'rmadrigalj'; // Ruben se queda con 2
      } else {
        nuevoAgente = agentesTibas[(index - 2) % agentesTibas.length]; // Rotar entre agentes de Tibas
      }
      
      await doc.ref.update({ agenteId: nuevoAgente });
      console.log(`✅ ${doc.ref.path} -> agenteId: ${nuevoAgente}`);
      index++;
    }
    
    console.log(`\n✅ Distribuidas ${allDocs.length} ventas entre los agentes`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

distribuirVentas();
