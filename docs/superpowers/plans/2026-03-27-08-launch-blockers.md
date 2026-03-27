# Launch Blockers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Security hardening, legal compliance screens, account deletion, and EAS Build setup required before App Store / Play Store submission.

**Architecture:** Storage rules deployed via Firebase CLI. Legal screens are static Expo Router screens. Account deletion in standalone `lib/userDeletion.ts`. EAS config in `eas.json`.

**Tech Stack:** Firebase Storage Rules, Firebase Firestore Rules, expo-updates, EAS CLI, React Native, TypeScript, Jest

---

### Task 1: Firebase Storage Rules

**Files:**
- Create: `storage.rules`
- Modify: `firebase.json`

- [ ] **Step 1: Create storage.rules at project root**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /listings/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: Add storage section to firebase.json**

```json
{
  "functions": [{ "source": "functions", "codebase": "default", "ignore": ["node_modules",".git","firebase-debug.log","firebase-debug.*.log","*.local"] }],
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
  "storage": { "rules": "storage.rules" }
}
```

- [ ] **Step 3: Deploy storage rules**

```bash
firebase deploy --only storage
```

Expected: `+ storage: released rules`

- [ ] **Step 4: Commit**

```bash
git add storage.rules firebase.json
git commit -m "feat: add Firebase Storage security rules"
```

---

### Task 2: Image Validation Before Upload

**Files:**
- Modify: `lib/listings.ts`
- Modify: `__tests__/lib/listings.test.ts`

- [ ] **Step 1: Add failing tests to __tests__/lib/listings.test.ts**

Add at top with other imports:

```ts
import { validateImageForUpload } from '@/lib/listings';
```

Add after existing describe blocks:

```ts
describe('validateImageForUpload', () => {
  it('accepts valid JPEG under 5MB', () => {
    const blob = new Blob(['x'.repeat(100)], { type: 'image/jpeg' });
    expect(() => validateImageForUpload(blob)).not.toThrow();
  });
  it('throws if over 5MB', () => {
    const blob = new Blob(['x'.repeat(5 * 1024 * 1024 + 1)], { type: 'image/jpeg' });
    expect(() => validateImageForUpload(blob)).toThrow('Image must be under 5MB');
  });
  it('throws if not an image', () => {
    const blob = new Blob(['data'], { type: 'application/pdf' });
    expect(() => validateImageForUpload(blob)).toThrow('Only image files are allowed');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx jest --no-coverage __tests__/lib/listings.test.ts
```

Expected: FAIL — `validateImageForUpload` not exported

- [ ] **Step 3: Add function to lib/listings.ts**

Add before `uploadListingImages`:

```ts
export function validateImageForUpload(blob: Blob): void {
  if (!blob.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5MB');
  }
}
```

Inside `uploadListingImages`, after `const blob = await response.blob();` add:

```ts
validateImageForUpload(blob);
```

- [ ] **Step 4: Run tests**

```bash
npx jest --no-coverage __tests__/lib/listings.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/listings.ts __tests__/lib/listings.test.ts
git commit -m "feat: validate image type and size before upload"
```

---

### Task 3: Firestore Field Validation

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Replace listings match block in firestore.rules**

```
match /listings/{listingId} {
  allow read: if true;
  allow create: if request.auth != null
                && request.auth.uid == request.resource.data.userId
                && request.resource.data.title is string
                && request.resource.data.title.size() <= 100
                && request.resource.data.description is string
                && request.resource.data.description.size() <= 1000;
  allow update: if request.auth != null
                && request.auth.uid == resource.data.userId;
  allow delete: if request.auth != null
                && request.auth.uid == resource.data.userId;
}
```

- [ ] **Step 2: Deploy**

```bash
firebase deploy --only firestore:rules
```

Expected: `+ firestore: released rules`

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add field-level validation to Firestore rules"
```

---

### Task 4: Privacy Policy and Terms of Service Screens

**Files:**
- Create: `app/privacy-policy.tsx`
- Create: `app/terms-of-service.tsx`
- Modify: `app/_layout.tsx`
- Modify: `app/(auth)/login.tsx`
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Create app/privacy-policy.tsx**

```tsx
import { ScrollView, Text, StyleSheet } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Privacy Policy</Text>
      <Text style={styles.date}>Last updated: March 2026</Text>
      <Text style={styles.section}>1. Information We Collect</Text>
      <Text style={styles.body}>GarageMate collects your name, email address, and profile photo when you register. When you post a listing, we collect the address, description, and images you provide. We collect your approximate location (with permission) to show nearby garage sales.</Text>
      <Text style={styles.section}>2. How We Use Your Information</Text>
      <Text style={styles.body}>We use your information to operate the GarageMate service, display your listings to other users, and send verification and reset emails. We do not sell your data to third parties.</Text>
      <Text style={styles.section}>3. Firebase and Google Services</Text>
      <Text style={styles.body}>GarageMate uses Firebase (Google) for authentication, data storage, and file hosting. Your data is stored in Google Cloud infrastructure.</Text>
      <Text style={styles.section}>4. Data Retention</Text>
      <Text style={styles.body}>Your listings are stored until you delete them or delete your account. Deleting your account permanently removes all your data from our systems.</Text>
      <Text style={styles.section}>5. Your Rights (GDPR)</Text>
      <Text style={styles.body}>You have the right to access, correct, and delete your personal data. Use Export my data and Delete Account in your Profile to exercise these rights.</Text>
      <Text style={styles.section}>6. Contact</Text>
      <Text style={styles.body}>For privacy questions: support@garagemate.app</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  date: { fontSize: 13, color: '#9ca3af', marginBottom: 24 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 6 },
  body: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
```

- [ ] **Step 2: Create app/terms-of-service.tsx**

```tsx
import { ScrollView, Text, StyleSheet } from 'react-native';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Terms of Service</Text>
      <Text style={styles.date}>Last updated: March 2026</Text>
      <Text style={styles.section}>1. Acceptance</Text>
      <Text style={styles.body}>By using GarageMate, you agree to these terms. If you do not agree, do not use the app.</Text>
      <Text style={styles.section}>2. Your Listings</Text>
      <Text style={styles.body}>You are responsible for the accuracy of listings you post. Listings must be for genuine garage sales at real addresses. Spam or offensive listings will be removed.</Text>
      <Text style={styles.section}>3. Prohibited Content</Text>
      <Text style={styles.body}>You must not post illegal items, adult content, or content that infringes third-party rights. GarageMate may remove any listing at its discretion.</Text>
      <Text style={styles.section}>4. No Warranty</Text>
      <Text style={styles.body}>GarageMate is provided as-is without warranty. We are not responsible for the accuracy of listings or the outcome of any sale.</Text>
      <Text style={styles.section}>5. Contact</Text>
      <Text style={styles.body}>Questions: support@garagemate.app</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  date: { fontSize: 13, color: '#9ca3af', marginBottom: 24 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 6 },
  body: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
```

- [ ] **Step 3: Register both screens in app/_layout.tsx**

Inside the `<Stack>` add:

```tsx
<Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy', headerShown: true }} />
<Stack.Screen name="terms-of-service" options={{ title: 'Terms of Service', headerShown: true }} />
```

- [ ] **Step 4: Add legal links to login screen**

In `app/(auth)/login.tsx`, after the Forgot password Link, add:

```tsx
<View style={styles.legalRow}>
  <Link href="/privacy-policy" style={styles.legalLink}>Privacy Policy</Link>
  <Text style={{ color: '#9ca3af', fontSize: 12 }}> · </Text>
  <Link href="/terms-of-service" style={styles.legalLink}>Terms of Service</Link>
</View>
```

Add to styles:

```ts
legalRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
legalLink: { color: '#9ca3af', fontSize: 12 },
```

- [ ] **Step 5: Add legal links to profile screen**

In `app/(tabs)/profile.tsx`, add `{ Link }` to expo-router import. Before closing `</View>`:

```tsx
<View style={styles.legalRow}>
  <Link href="/privacy-policy" style={styles.legalLink}>Privacy Policy</Link>
  <Text style={{ color: '#9ca3af', fontSize: 12 }}> · </Text>
  <Link href="/terms-of-service" style={styles.legalLink}>Terms of Service</Link>
</View>
```

Add to styles:

```ts
legalRow: { flexDirection: 'row', marginTop: 'auto', paddingTop: 24 },
legalLink: { color: '#9ca3af', fontSize: 12 },
```

- [ ] **Step 6: Commit**

```bash
git add app/privacy-policy.tsx app/terms-of-service.tsx app/_layout.tsx app/(auth)/login.tsx app/(tabs)/profile.tsx
git commit -m "feat: Privacy Policy and Terms of Service screens with navigation links"
```

---

### Task 5: Account Deletion and Data Export

**Files:**
- Create: `lib/userDeletion.ts`
- Create: `lib/dataExport.ts`
- Create: `__tests__/lib/userDeletion.test.ts`
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/lib/userDeletion.test.ts`:

```ts
import { deleteUserAccount } from '@/lib/userDeletion';

const mockDelete = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/firebase', () => ({
  db: {},
  storage: {},
  auth: { currentUser: { uid: 'user123', delete: mockDelete } },
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'col'),
  query: jest.fn(() => 'q'),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  doc: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  deleteObject: jest.fn().mockResolvedValue(undefined),
}));

describe('deleteUserAccount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls auth.currentUser.delete', async () => {
    await deleteUserAccount();
    expect(mockDelete).toHaveBeenCalled();
  });

  it('throws if no current user', async () => {
    const { auth } = require('@/lib/firebase');
    const orig = auth.currentUser;
    auth.currentUser = null;
    await expect(deleteUserAccount()).rejects.toThrow('No authenticated user');
    auth.currentUser = orig;
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx jest --no-coverage __tests__/lib/userDeletion.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create lib/userDeletion.ts**

```ts
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';

export async function deleteUserAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const listingsSnap = await getDocs(
    query(collection(db, 'listings'), where('userId', '==', user.uid))
  );
  for (const listingDoc of listingsSnap.docs) {
    const data = listingDoc.data();
    if (Array.isArray(data.images)) {
      for (const imageUrl of data.images) {
        try { await deleteObject(ref(storage, imageUrl)); } catch { /* already gone */ }
      }
    }
    await deleteDoc(doc(db, 'listings', listingDoc.id));
  }

  const savedSnap = await getDocs(collection(db, 'users', user.uid, 'saved'));
  for (const savedDoc of savedSnap.docs) {
    await deleteDoc(doc(db, 'users', user.uid, 'saved', savedDoc.id));
  }

  await user.delete();
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest --no-coverage __tests__/lib/userDeletion.test.ts
```

Expected: PASS

- [ ] **Step 5: Create lib/dataExport.ts**

```ts
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Share, Platform } from 'react-native';

export async function exportUserData(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const listingsSnap = await getDocs(
    query(collection(db, 'listings'), where('userId', '==', user.uid))
  );
  const savedSnap = await getDocs(collection(db, 'users', user.uid, 'saved'));

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: { uid: user.uid, email: user.email, displayName: user.displayName },
    listings: listingsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    savedListings: savedSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  };

  const json = JSON.stringify(exportData, null, 2);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'garagemate-data.json';
    a.click();
    URL.revokeObjectURL(url);
  } else {
    await Share.share({ message: json, title: 'GarageMate Data Export' });
  }
}
```

- [ ] **Step 6: Update profile.tsx**

Add to imports at top:

```tsx
import { Alert } from 'react-native';
import { deleteUserAccount } from '@/lib/userDeletion';
import { exportUserData } from '@/lib/dataExport';
```

Add handlers in the component (after `handleSignOut`):

```tsx
const handleDeleteAccount = () => {
  Alert.alert(
    'Delete Account',
    'This permanently deletes your account and all listings. This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteUserAccount();
          router.replace('/(auth)/login');
        } catch {
          Alert.alert('Error', 'Failed to delete account. Please try again.');
        }
      }},
    ]
  );
};

const handleExportData = async () => {
  try { await exportUserData(); }
  catch { Alert.alert('Error', 'Failed to export data. Please try again.'); }
};
```

Add buttons after My Listings TouchableOpacity:

```tsx
<TouchableOpacity style={styles.btn} onPress={handleExportData}>
  <Text style={styles.btnText}>Export My Data</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={handleDeleteAccount}>
  <Text style={[styles.btnText, styles.deleteText]}>Delete Account</Text>
</TouchableOpacity>
```

Add to styles:

```ts
deleteBtn: { borderColor: '#fca5a5' },
deleteText: { color: '#dc2626' },
```

- [ ] **Step 7: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 8: Commit**

```bash
git add lib/userDeletion.ts lib/dataExport.ts __tests__/lib/userDeletion.test.ts app/(tabs)/profile.tsx
git commit -m "feat: account deletion, data export, GDPR compliance"
```

---

### Task 6: EAS Build and Update Setup

**Files:**
- Create: `eas.json`
- Modify: `app.config.ts`

- [ ] **Step 1: Install expo-updates**

```bash
npx expo install expo-updates
```

- [ ] **Step 2: Create eas.json at project root**

```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

- [ ] **Step 3: Update app.config.ts**

Add alongside `version: '1.0.0'`:

```ts
runtimeVersion: { policy: 'appVersion' },
updates: { url: 'https://u.expo.dev/REPLACE_WITH_EAS_PROJECT_ID' },
```

Add inside `extra`:

```ts
eas: { projectId: 'REPLACE_WITH_EAS_PROJECT_ID' },
```

- [ ] **Step 4: Link to EAS (run interactively)**

```bash
npx eas-cli init
```

Replace all `REPLACE_WITH_EAS_PROJECT_ID` occurrences with the shown project ID.

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add eas.json app.config.ts package.json package-lock.json
git commit -m "feat: EAS Build and EAS Update configuration"
```
