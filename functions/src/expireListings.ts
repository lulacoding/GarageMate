import { Firestore, Timestamp } from 'firebase-admin/firestore';

const BATCH_SIZE = 499;

export async function expireListings(db: Firestore, now: Date): Promise<void> {
  const nowTs = Timestamp.fromDate(now);
  const snapshot = await db
    .collection('listings')
    .where('expiresAt', '<', nowTs)
    .where('active', '==', true)
    .get();

  if (snapshot.empty) return;

  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach((docSnap) => batch.update(docSnap.ref, { active: false }));
    await batch.commit();
  }
}
