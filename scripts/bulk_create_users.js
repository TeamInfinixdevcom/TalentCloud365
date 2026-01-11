const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'talentcloud365'
});

const auth = admin.auth();
const firestore = admin.firestore();

const users = [
  {
    nombre: 'Nahima Torrez Valladares',
    agenteId: 'ntorrez',
    email: 'ntorrez@ice.go.cr',
    rol: 'agente'
  },
  {
    nombre: 'Lucia Reyes Fernandez',
    agenteId: 'lfernandez',
    email: 'lfernandezre@ice.go.cr',
    rol: 'agente'
  },
  {
    nombre: 'Ana Graciela Rodriguez Jimenez',
    agenteId: 'arodriguezj',
    email: 'arodriguezj@ice.go.cr',
    rol: 'agente'
  },
  {
    nombre: 'Miguel Salas Garro',
    agenteId: 'msalasg',
    email: 'msalasg@ice.go.cr',
    rol: 'agente'
  },
  {
    nombre: 'Allan Arguedas Villalobos',
    agenteId: 'aarguedasv',
    email: 'aarguedasv@ice.go.cr',
    rol: 'agente'
  }
];

const password = 'Kolbi200';

async function createUsers() {
  console.log('🚀 Creando usuarios en Firebase Auth y Firestore...\n');
  
  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (const user of users) {
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

      results.push({
        nombre: user.nombre,
        email: user.email,
        agenteId: user.agenteId,
        uid: userRecord.uid,
        estado: '✅ CREADO'
      });

      console.log(`✅ ${user.nombre}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Agente ID: ${user.agenteId}`);
      console.log(`   UID: ${userRecord.uid}\n`);

      successCount++;
    } catch (error) {
      results.push({
        nombre: user.nombre,
        email: user.email,
        agenteId: user.agenteId,
        estado: '❌ ERROR: ' + error.message
      });

      console.log(`❌ Error al crear ${user.nombre}`);
      console.log(`   Error: ${error.message}\n`);
      failureCount++;
    }
  }

  console.log('\n========================================');
  console.log('📊 RESUMEN DE CREACIÓN');
  console.log('========================================');
  console.log(`✅ Creados: ${successCount}`);
  console.log(`❌ Errores: ${failureCount}`);
  console.log('========================================');
  console.log('\n🔑 Contraseña para todos los usuarios: Kolbi200');
  console.log('\n📋 USUARIOS CREADOS:');
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.nombre}`);
    console.log(`   Email: ${r.email}`);
    console.log(`   Agente ID: ${r.agenteId}`);
    console.log(`   Estado: ${r.estado}`);
    if (r.uid) console.log(`   UID: ${r.uid}`);
  });

  console.log('\n⚠️  IMPORTANTE: Los usuarios deben cambiar la contraseña después del primer acceso');

  process.exit(failureCount > 0 ? 1 : 0);
}

createUsers().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
