const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'talentcloud365'
});

const firestore = admin.firestore();

async function checkUsers() {
  console.log('📋 Listando todos los usuarios en Firestore:\n');
  
  try {
    const snapshot = await firestore.collection('usuarios').get();
    
    if (snapshot.empty) {
      console.log('❌ No hay usuarios en Firestore');
      process.exit(1);
    }

    snapshot.forEach(doc => {
      const userData = doc.data();
      console.log('─'.repeat(50));
      console.log(`✅ ${userData.nombre}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Agente ID: ${userData.agenteId}`);
      console.log(`   Rol: ${userData.rol}`);
      console.log(`   UID: ${userData.uid}`);
      console.log('');
    });

    console.log('─'.repeat(50));
    console.log(`\n📊 Total: ${snapshot.size} usuarios\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
