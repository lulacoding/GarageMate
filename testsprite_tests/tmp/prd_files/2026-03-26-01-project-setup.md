# GarageMate — Plan 01: Project Setup & Firebase Config

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialise the Expo project, install all dependencies, configure Firebase, set up Firestore indexes and security rules, and verify the app boots on all three platforms.

**Architecture:** Expo Router for file-based navigation. Firebase SDK initialised once in `lib/firebase.ts` and imported everywhere. Environment variables via `app.config.ts` (not committed). TypeScript throughout.

**Tech Stack:** Expo SDK, Expo Router, TypeScript, Firebase JS SDK v10, `geofire-common`, `react-native-maps`, `react-leaflet`, `expo-location`, `expo-image-picker`, `@react-navigation/native`, `react-native-google-places-autocomplete`

**Skills:** `@expo-best-practices` (Expo patterns + pitfalls), `@mobile-developer` (React Native reference), `@claude-md-architect` (generate CLAUDE.md in Task 10), `@code-quality` (TypeScript strictness, SOLID)

---

## File Structure

```
GarageMate/
├── app.config.ts                    # Expo config with env vars (gitignored secrets)
├── .env.local                       # Firebase + API keys (gitignored)
├── tsconfig.json
├── jest.config.js
├── app/
│   ├── _layout.tsx                  # Root navigator (auth gate)
│   └── (tabs)/
│       └── _layout.tsx              # Tab bar placeholder
├── lib/
│   └── firebase.ts                  # Firebase app + auth + firestore + storage init
├── types/
│   └── index.ts                     # Shared TypeScript types (Listing, SavedItem)
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Composite index definitions
└── __tests__/
    └── lib/
        └── firebase.test.ts         # Smoke test: Firebase initialises without error
```

---

### Task 1: Initialise Expo project

**Files:**
- Create: project root (run in `C:/Users/cthvh/OneDrive - RMIT University/CODE/GarageMate`)

- [ ] **Step 1: Create Expo app with TypeScript template**

```bash
npx create-expo-app@latest . --template blank-typescript
```

Expected: Expo project scaffolded in current directory.

- [ ] **Step 2: Verify it boots**

```bash
npx expo start --web
```

Expected: Metro bundler starts, web version loads at localhost.

- [ ] **Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: initialise Expo TypeScript project"
```

---

### Task 2: Install all dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npx expo install firebase expo-location expo-image-picker react-native-maps react-leaflet leaflet
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack @react-navigation/native-stack
npx expo install expo-router react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated
npm install react-native-google-places-autocomplete geofire-common
npm install leaflet @types/leaflet
```

- [ ] **Step 2: Install dev/test dependencies**

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install all project dependencies"
```

---

### Task 3: Configure TypeScript and Jest

**Files:**
- Modify: `tsconfig.json`
- Create: `jest.config.js`
- Create: `jest.setup.js`

- [ ] **Step 1: Update tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 2: Create jest.config.js**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

- [ ] **Step 3: Create jest.setup.js**

```js
require('@testing-library/jest-native/extend-expect');
```

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json jest.config.js jest.setup.js
git commit -m "chore: configure TypeScript paths and Jest"
```

---

### Task 4: Configure environment variables and app.config.ts

**Files:**
- Create: `.env.local`
- Create: `app.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create .env.local (fill in your Firebase values)**

```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your-places-key
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=your-android-maps-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id-from-firebase-console
```

- [ ] **Step 2: Create app.config.ts**

```ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GarageMate',
  slug: 'garagemate',
  version: '1.0.0',
  extra: {
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    googlePlacesApiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
  },
  plugins: [
    'expo-router',
    'expo-location',
    ['expo-image-picker', { photosPermission: 'Allow GarageMate to select photos for listings.' }],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY,
      },
    ],
  ],
  scheme: 'garagemate',
  web: { bundler: 'metro' },
  ios: { supportsTablet: true, bundleIdentifier: 'com.garagemate.app' },
  android: { package: 'com.garagemate.app', adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#ffffff' } },
});
```

- [ ] **Step 3: Add .env.local to .gitignore**

Add this line to `.gitignore`:
```
.env.local
```

- [ ] **Step 4: Commit**

```bash
git add app.config.ts .gitignore
git commit -m "chore: add app config with environment variable support"
```

---

### Task 5: Initialise Firebase

**Files:**
- Create: `lib/firebase.ts`
- Create: `__tests__/lib/firebase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/firebase.test.ts`:
```ts
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/firebase.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/firebase'`

- [ ] **Step 3: Create lib/firebase.ts**

```ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/firebase.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/firebase.ts __tests__/lib/firebase.test.ts
git commit -m "feat: initialise Firebase app, auth, firestore, and storage"
```

---

### Task 6: Define shared TypeScript types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Create types/index.ts**

```ts
import { Timestamp } from 'firebase/firestore';

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string;
  images: string[];
  address: string;
  geohash: string;
  lat: number;
  lng: number;
  startDate: Timestamp;
  endDate: Timestamp | null;
  startTime: string;
  endTime: string;
  expiresAt: Timestamp;
  active: boolean;
  createdAt: Timestamp;
}

export interface SavedItem {
  listingId: string;
  savedAt: Timestamp;
}

export interface LocationCoords {
  lat: number;
  lng: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 7: Set up Firestore security rules and indexes

**Files:**
- Create: `firestore.rules`
- Create: `firestore.indexes.json`

- [ ] **Step 1: Create firestore.rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /listings/{listingId} {
      allow read: if request.auth != null &&
        (resource.data.active == true || resource.data.userId == request.auth.uid);
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /users/{userId}/saved/{savedId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

- [ ] **Step 2: Create firestore.indexes.json**

```json
{
  "indexes": [
    {
      "collectionGroup": "listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "geohash", "order": "ASCENDING" },
        { "fieldPath": "active", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "expiresAt", "order": "ASCENDING" },
        { "fieldPath": "active", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 3: Deploy rules and indexes (requires Firebase CLI)**

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your Firebase project
firebase deploy --only firestore:rules,firestore:indexes
```

Expected: Rules and indexes deployed successfully.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules firestore.indexes.json
git commit -m "feat: add Firestore security rules and composite indexes"
```

---

### Task 8: Create root navigator shell

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create app/_layout.tsx (auth gate shell)**

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create app/(tabs)/_layout.tsx (tab bar shell)**

```tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="add" options={{ title: 'Add' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Create placeholder screens so the app boots**

Create `app/(tabs)/index.tsx`, `app/(tabs)/map.tsx`, `app/(tabs)/add.tsx`, `app/(tabs)/saved.tsx`, `app/(tabs)/profile.tsx` — each with:

```tsx
import { View, Text } from 'react-native';
export default function ScreenName() {
  return <View><Text>ScreenName</Text></View>;
}
```

Also create `app/(auth)/login.tsx` and `app/(auth)/register.tsx` as placeholders so Expo Router can resolve the `(auth)` group before Plan 02 implements them:

```tsx
// app/(auth)/login.tsx
import { View, Text } from 'react-native';
export default function LoginPlaceholder() {
  return <View><Text>Login</Text></View>;
}
```

```tsx
// app/(auth)/register.tsx
import { View, Text } from 'react-native';
export default function RegisterPlaceholder() {
  return <View><Text>Register</Text></View>;
}
```

- [ ] **Step 4: Verify app boots on web**

```bash
npx expo start --web
```

Expected: Tab bar visible with 5 tabs, no errors.

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: add root navigator and tab bar shell"
```

---

### Task 10: Generate project CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

> **Invoke `@claude-md-architect`** — this skill reads the codebase and writes a CLAUDE.md tailored to the project.

- [ ] **Step 1: Run claude-md-architect**

Invoke the `claude-md-architect` skill. It will scan the project structure, installed dependencies, Firebase config, and Expo setup, then generate a `CLAUDE.md` at the project root.

Expected output includes: project overview, key commands (`npx expo start`, `npx jest`, `firebase deploy`), architecture decisions (Expo Router, Firebase SDK v10, geohash radius queries), skill references, and any gotchas captured during setup.

- [ ] **Step 2: Review and adjust CLAUDE.md**

Read the generated file and verify it accurately describes the project. Add any important notes not captured (e.g. `.env.local` is gitignored, Apple Sign-In is iOS-only, `expiresAt` is denormalized).

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add project CLAUDE.md via claude-md-architect"
```

---

### Task 9: Run TestSprite baseline scan

- [ ] **Step 1: Call TestSprite MCP to run baseline test scan**

Use the TestSprite MCP tool available in Claude Code to scan the project and establish a baseline. This confirms TestSprite is connected and will be used in subsequent plans.

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "chore: project setup complete — baseline established"
```
