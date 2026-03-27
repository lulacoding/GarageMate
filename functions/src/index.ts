import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { expireListings } from './expireListings';

initializeApp();

export const expireListedSales = onSchedule(
  {
    // 14:00 UTC = midnight AEST (UTC+10). During AEDT (Oct–Apr, UTC+11) fires at 01:00 local — acceptable.
    schedule: '0 14 * * *',
    timeZone: 'UTC',
    region: 'australia-southeast1',
  },
  async (_event) => {
    const db = getFirestore();
    await expireListings(db, new Date());
    console.log('expireListings complete');
  }
);
