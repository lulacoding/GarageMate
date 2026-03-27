"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireListedSales = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const expireListings_1 = require("./expireListings");
(0, app_1.initializeApp)();
exports.expireListedSales = (0, scheduler_1.onSchedule)({
    // 14:00 UTC = midnight AEST (UTC+10). During AEDT (Oct–Apr, UTC+11) fires at 01:00 local — acceptable.
    schedule: '0 14 * * *',
    timeZone: 'UTC',
    region: 'australia-southeast1',
}, async (_event) => {
    const db = (0, firestore_1.getFirestore)();
    await (0, expireListings_1.expireListings)(db, new Date());
    console.log('expireListings complete');
});
//# sourceMappingURL=index.js.map