const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'talentcloud365-firebase-adminsdk-fbsvc-5253bd71a2.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

(async () => {
  try {
    const docRef = await db.collection('ventas').add({ testAdd: true, createdAt: new Date() });
    console.log('Added test doc:', docRef.id);
    process.exit(0);
  } catch (err) {
    console.error('Error adding test doc:', err, err && err.stack);
    process.exit(2);
  }
})();
