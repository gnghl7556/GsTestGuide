/* eslint-disable no-console */
const admin = require('firebase-admin');

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    apply: args.includes('--apply'),
    limitArg: args.find((arg) => arg.startsWith('--limit=')),
    projectIdArg: args.find((arg) => arg.startsWith('--projectId='))
  };
}

async function main() {
  const { apply, limitArg, projectIdArg } = parseArgs();
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
  const projectId = projectIdArg ? projectIdArg.split('=')[1] : undefined;

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();
  const agreementDocs = db.collection('agreementDocs');
  let query = agreementDocs;
  if (limit && Number.isFinite(limit)) {
    query = query.limit(limit);
  }

  const snap = await query.get();
  if (snap.empty) {
    console.log('No agreementDocs found.');
    return;
  }

  const deleteFields = {
    'parsed.companyName': admin.firestore.FieldValue.delete(),
    'parsed.productNameKo': admin.firestore.FieldValue.delete(),
    'parsed.applicantName': admin.firestore.FieldValue.delete(),
    'parsed.productName': admin.firestore.FieldValue.delete()
  };

  console.log(`Found ${snap.size} docs. Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);

  let batch = db.batch();
  let batchCount = 0;
  let updated = 0;

  const commitBatch = async () => {
    if (batchCount === 0) return;
    if (apply) await batch.commit();
    batch = db.batch();
    batchCount = 0;
  };

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const parsed = data.parsed || {};
    const hasTargetFields =
      Object.prototype.hasOwnProperty.call(parsed, 'companyName') ||
      Object.prototype.hasOwnProperty.call(parsed, 'productNameKo') ||
      Object.prototype.hasOwnProperty.call(parsed, 'applicantName') ||
      Object.prototype.hasOwnProperty.call(parsed, 'productName');

    if (!hasTargetFields) continue;

    updated += 1;
    console.log(`- ${doc.id}: will remove companyName/productName fields from parsed`);

    if (apply) {
      batch.update(doc.ref, deleteFields);
      batchCount += 1;
      if (batchCount >= 400) {
        await commitBatch();
      }
    }
  }

  await commitBatch();
  console.log(`Done. ${updated} docs ${apply ? 'updated' : 'would be updated'}.`);
}

main().catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
