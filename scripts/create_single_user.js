const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'talentcloud365'
});

const auth = admin.auth();
const firestore = admin.firestore();

const user = {
  nombre: 'Ruben Madrigal Jimenez',
  agenteId: 'rmadrigalj',
  email: 'rmadrigalj@ice.go.cr',
  rol: 'agente'
};

const password = 'Kolbi200';

async function createUser() {
  console.log('🚀 Creando usuario en Firebase Auth y Firestore...\n');
  
  try {
    // Crear usuario en Firebase Authentication
    const userRecord = await auth.createUser({
      email: user.email,
      password: password,
      displayName: user.nombre
    });

    // Crear perfil en Firestore
    await firestore.collection('usuarios').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: user.email,
      nombre: user.nombre,
      agenteId: user.agenteId,
      rol: user.rol,
      activo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date()
    });

    console.log('✅ Usuario creado exitosamente\n');
    console.log('📋 INFORMACIÓN:');
    console.log('================================');
    console.log(`Nombre: ${user.nombre}`);
    console.log(`Email: ${user.email}`);
    console.log(`Agente ID: ${user.agenteId}`);
    console.log(`Rol: ${user.rol}`);
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Contraseña: ${password}`);
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear el usuario:', error.message);
    process.exit(1);
  }
}

createUser();
