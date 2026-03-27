"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireListings = expireListings;
const firestore_1 = require("firebase-admin/firestore");
const BATCH_SIZE = 499;
async function expireListings(db, now) {
    const nowTs = firestore_1.Timestamp.fromDate(now);
    const snapshot = await db
        .collection('listings')
        .where('expiresAt', '<', nowTs)
        .where('active', '==', true)
        .get();
    if (snapshot.empty)
        return;
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const chunk = docs.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        chunk.forEach((docSnap) => batch.update(docSnap.ref, { active: false }));
        await batch.commit();
    }
}
//# sourceMappingURL=expireListings.js.map