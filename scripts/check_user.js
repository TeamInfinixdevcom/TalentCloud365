const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'talentcloud365'
});

const firestore = admin.firestore();

async function checkUser() {
  try {
    // Buscar por agenteId
    const snapshot = await firestore.collection('usuarios')
      .where('agenteId', '==', 'rmadrigalj')
      .get();

    if (snapshot.empty) {
      console.log('❌ Usuario rmadrigalj no encontrado en Firestore');
      process.exit(1);
    }

    snapshot.forEach(doc => {
      const userData = doc.data();
      console.log('\n📋 INFORMACIÓN DEL USUARIO:');
      console.log('================================');
      console.log(`Nombre: ${userData.nombre}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Agente ID: ${userData.agenteId}`);
      console.log(`Rol: ${userData.rol}`);
      console.log(`UID: ${userData.uid}`);
      console.log(`Activo: ${userData.activo ? 'Sí' : 'No'}`);
      console.log('================================\n');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUser();
