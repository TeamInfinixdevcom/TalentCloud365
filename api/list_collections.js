const admin = require('firebase-admin');
const path = require('path');

// Carga credenciales del service account que ya existe en el repo
const serviceAccountPath = path.join(__dirname, '..', 'talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function listCollections() {
  try {
    const collections = await db.listCollections();
    if (!collections.length) {
      console.log('No se encontraron colecciones.');
      return;
    }

    console.log(`Se encontraron ${collections.length} colecciones:`);

    for (const col of collections) {
      try {
        const snap = await col.get();
        console.log(`- ${col.id}: ${snap.size} documentos`);
      } catch (err) {
        console.error(`- ${col.id}: error al leer documentos:`, err.message || err);
      }
    }
  } catch (err) {
    console.error('Error listando colecciones:', err, err && err.stack);
  }
}

listCollections().then(() => process.exit(0));
