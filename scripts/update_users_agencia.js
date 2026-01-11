const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'talentcloud365'
});

const firestore = admin.firestore();

async function updateUsersAgencia() {
  console.log('🏢 Actualizando usuarios con campo agencia...\n');
  
  try {
    const snapshot = await firestore.collection('usuarios').get();
    
    if (snapshot.empty) {
      console.log('❌ No hay usuarios en Firestore');
      process.exit(1);
    }

    const batch = firestore.batch();
    let count = 0;

    snapshot.forEach(doc => {
      const userData = doc.data();
      // Solo actualizar si no tiene agencia
      if (!userData.agencia) {
        batch.update(doc.ref, {
          agencia: 'Tibas Kolbi ICE',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ ${userData.nombre || userData.email} -> Tibas Kolbi ICE`);
        count++;
      } else {
        console.log(`⏭️  ${userData.nombre || userData.email} ya tiene agencia: ${userData.agencia}`);
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`\n✅ ${count} usuarios actualizados con agencia "Tibas Kolbi ICE"\n`);
    } else {
      console.log('\n⏭️  Todos los usuarios ya tienen agencia asignada\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateUsersAgencia();
