/* eslint-disable no-console */
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || process.argv[2];
if (!projectId) {
  console.error('Usage: node scripts/migrate-defects-report-fields.js <projectId>');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

const DEFAULTS = {
  reportVersion: 1,
  isDerived: false
};

const updateDefectDocs = async () => {
  const projectsSnap = await db.collection('projects').get();
  let updated = 0;
  for (const projectDoc of projectsSnap.docs) {
    const defectsRef = projectDoc.ref.collection('defects');
    let lastDoc = null;
    while (true) {
      let query = defectsRef.orderBy(admin.firestore.FieldPath.documentId()).limit(300);
      if (lastDoc) query = query.startAfter(lastDoc);
      const snap = await query.get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const patch = {};
        if (typeof data.reportVersion !== 'number') patch.reportVersion = DEFAULTS.reportVersion;
        if (typeof data.isDerived !== 'boolean') patch.isDerived = DEFAULTS.isDerived;
        if (Object.keys(patch).length > 0) {
          batch.set(docSnap.ref, patch, { merge: true });
          updated += 1;
        }
      });
      if (updated > 0) {
        await batch.commit();
      }
      lastDoc = snap.docs[snap.docs.length - 1];
    }
  }
  console.log(`[migrate] completed. updated defects: ${updated}`);
};

updateDefectDocs().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
