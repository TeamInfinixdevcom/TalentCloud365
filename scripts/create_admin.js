const admin = require('firebase-admin');
const serviceAccount = require('../talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'talentcloud365'
});

const auth = admin.auth();
const db = admin.firestore();

// Datos del primer admin
const adminEmail = 'admin@talentcloud.com';
const adminPassword = 'Admin123456';
const adminNombre = 'Administrador TalentCloud';
const adminAgenteId = 'admin_001';

async function createFirstAdmin() {
  try {
    console.log('🔐 Creando primer usuario admin...');
    
    // Crear usuario en Authentication
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: adminNombre
    });

    console.log(`✅ Usuario creado en Auth: ${userRecord.uid}`);

    // Crear documento en Firestore
    await db.collection('usuarios').doc(userRecord.uid).set({
      email: adminEmail,
      nombre: adminNombre,
      agenteId: adminAgenteId,
      rol: 'admin',
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Perfil creado en Firestore`);
    console.log('\n=== CREDENCIALES DE ACCESO ===');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Contraseña: ${adminPassword}`);
    console.log(`👤 Nombre: ${adminNombre}`);
    console.log(`🆔 Agente ID: ${adminAgenteId}`);
    console.log('\n⚠️  IMPORTANTE: Cambiar la contraseña después del primer acceso');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error.message);
    process.exit(1);
  }
}

createFirstAdmin();
