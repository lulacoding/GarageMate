import { buildListingPayload } from '@/lib/listings';
import { Timestamp } from 'firebase/firestore';

jest.mock('@/lib/firebase', () => ({ db: {}, storage: {} }));
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: (d: Date) => ({ toMillis: () => d.getTime(), seconds: d.getTime() / 1000, nanoseconds: 0 }),
    now: () => ({ toMillis: () => Date.now() }),
  },
  addDoc: jest.fn(),
  collection: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => 'server-ts'),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));
jest.mock('@/lib/geohash', () => ({
  encodeGeohash: jest.fn(() => 'r1r0u'),
}));

describe('buildListingPayload', () => {
  it('sets expiresAt to startDate when endDate is null', () => {
    const start = Timestamp.fromDate(new Date('2026-04-01'));
    const payload = buildListingPayload({
      userId: 'u1',
      title: 'Test Sale',
      description: 'desc',
      images: ['https://img'],
      address: '123 Main St',
      lat: -37.8,
      lng: 144.9,
      startDate: start,
      endDate: null,
      startTime: '09:00',
      endTime: '14:00',
    });
    expect(payload.expiresAt.toMillis()).toBe(start.toMillis());
    expect(payload.active).toBe(true);
    expect(payload.geohash).toBeTruthy();
  });

  it('sets expiresAt to endDate when endDate is provided', () => {
    const start = Timestamp.fromDate(new Date('2026-04-01'));
    const end = Timestamp.fromDate(new Date('2026-04-02'));
    const payload = buildListingPayload({
      userId: 'u1', title: 'T', description: 'd', images: [],
      address: 'a', lat: -37.8, lng: 144.9,
      startDate: start, endDate: end, startTime: '09:00', endTime: '14:00',
    });
    expect(payload.expiresAt.toMillis()).toBe(end.toMillis());
  });
});
