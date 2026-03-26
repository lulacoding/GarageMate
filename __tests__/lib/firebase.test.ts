jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'test-app' })),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ app: { name: 'test-app' }, currentUser: null })),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ app: { name: 'test-app' } })),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({ app: { name: 'test-app' } })),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        firebaseApiKey: 'test-api-key',
        firebaseAuthDomain: 'test.firebaseapp.com',
        firebaseProjectId: 'test-project',
        firebaseStorageBucket: 'test.appspot.com',
        firebaseMessagingSenderId: '123456',
        firebaseAppId: '1:123456:web:abc',
      },
    },
  },
}));

import { auth, db, storage } from '@/lib/firebase';

describe('Firebase initialisation', () => {
  it('exports a valid auth instance', () => {
    expect(auth).toBeDefined();
    expect(auth.app).toBeDefined();
  });

  it('exports a valid firestore instance', () => {
    expect(db).toBeDefined();
  });

  it('exports a valid storage instance', () => {
    expect(storage).toBeDefined();
  });
});
