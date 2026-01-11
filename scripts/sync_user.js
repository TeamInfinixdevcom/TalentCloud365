const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'talentcloud365'
});

const auth = admin.auth();
const firestore = admin.firestore();

const userData = {
  nombre: 'Ruben Madrigal Jimenez',
  agenteId: 'rmadrigalj',
  email: 'rmadrigalj@ice.go.cr',
  rol: 'agente'
};

const newPassword = 'Kolbi200';

async function syncUser() {
  console.log('🔄 Sincronizando usuario entre Auth y Firestore...\n');
  
  try {
    // Buscar usuario en Firebase Auth por email
    const userRecord = await auth.getUserByEmail(userData.email);
    console.log(`✅ Usuario encontrado en Auth`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}\n`);

    // Actualizar contraseña
    await auth.updateUser(userRecord.uid, {
      password: newPassword
    });
    console.log(`✅ Contraseña actualizada\n`);

    // Crear/actualizar perfil en Firestore
    await firestore.collection('usuarios').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userData.email,
      nombre: userData.nombre,
      agenteId: userData.agenteId,
      rol: userData.rol,
      activo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date()
    });

    console.log('✅ Perfil creado en Firestore\n');
    console.log('📋 INFORMACIÓN FINAL:');
    console.log('================================');
    console.log(`Nombre: ${userData.nombre}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Agente ID: ${userData.agenteId}`);
    console.log(`Rol: ${userData.rol}`);
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Contraseña: ${newPassword}`);
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

syncUser();
