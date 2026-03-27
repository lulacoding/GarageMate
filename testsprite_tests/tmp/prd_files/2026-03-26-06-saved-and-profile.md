# GarageMate — Plan 06: Saved & Profile Screens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Saved screen (saved listings with active/ended/unavailable states), Profile screen (display name + email), Edit Profile (update display name; email and password for Email/Password users only with reauthentication), and My Listings (all user listings with edit/delete actions).

**Architecture:** Saved screen fetches the `users/{uid}/saved` subcollection then resolves each listing doc individually. Profile reads from `auth.currentUser` directly — no Firestore user doc. Edit profile gates email/password fields behind `providerData[0].providerId === 'password'` check. My Listings reuses `AddListingScreen` for editing by passing `listingId` as a route param.

**Tech Stack:** Firebase Auth, Firestore, `auth.currentUser`, `verifyBeforeUpdateEmail`, `reauthenticateWithCredential`, TypeScript

**Skills:** `@mobile-developer` (FlatList, navigation patterns), `@expo-best-practices` (Firebase Auth patterns), `@uncodixfy` (invoke before writing any JSX/styling — no generic AI aesthetics), `@code-quality` (TypeScript strictness)

---

## File Structure

```
app/(tabs)/
├── saved.tsx                        # Saved screen
└── profile.tsx                      # Profile screen
app/
├── edit-profile.tsx                 # Edit profile screen
└── my-listings.tsx                  # My listings screen
hooks/
└── useSavedListings.ts              # Fetch + resolve saved listings
__tests__/
└── hooks/
    └── useSavedListings.test.ts
```

---

### Task 1: useSavedListings hook

**Files:**
- Create: `hooks/useSavedListings.ts`
- Create: `__tests__/hooks/useSavedListings.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// __tests__/hooks/useSavedListings.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useSavedListings } from '@/hooks/useSavedListings';

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'u1' } },
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

describe('useSavedListings', () => {
  it('returns empty array when no saved items', async () => {
    const { result } = renderHook(() => useSavedListings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify fails**

```bash
npx jest __tests__/hooks/useSavedListings.test.ts --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Create hooks/useSavedListings.ts**

```ts
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Listing } from '@/types';

export type SavedListingState =
  | { status: 'active'; listing: Listing }
  | { status: 'ended'; listingId: string }
  | { status: 'unavailable'; listingId: string };

export function useSavedListings() {
  const [items, setItems] = useState<SavedListingState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    fetchSaved(uid);
  }, []);

  const fetchSaved = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const savedSnap = await getDocs(collection(db, 'users', uid, 'saved'));
      const results: SavedListingState[] = await Promise.all(
        savedSnap.docs.map(async (savedDoc) => {
          const { listingId } = savedDoc.data();
          const listingSnap = await getDoc(doc(db, 'listings', listingId));
          if (!listingSnap.exists()) return { status: 'unavailable' as const, listingId };
          const data = listingSnap.data();
          if (!data.active) return { status: 'ended' as const, listingId };
          return { status: 'active' as const, listing: { id: listingSnap.id, ...data } as Listing };
        })
      );
      setItems(results);
    } catch {
      setError('Failed to load saved listings.');
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, error };
}
```

- [ ] **Step 4: Run test to verify passes**

```bash
npx jest __tests__/hooks/useSavedListings.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useSavedListings.ts __tests__/hooks/useSavedListings.test.ts
git commit -m "feat: useSavedListings hook with active/ended/unavailable states"
```

---

### Task 2: Saved screen

**Files:**
- Modify: `app/(tabs)/saved.tsx`

- [ ] **Step 1: Replace placeholder with SavedScreen**

```tsx
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSavedListings } from '@/hooks/useSavedListings';
import { ListingCard } from '@/components/ListingCard';

export default function SavedScreen() {
  const { items, loading, error } = useSavedListings();
  const router = useRouter();

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 48 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Saved</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(item, i) => item.status === 'active' ? item.listing.id : `${item.status}-${i}`}
        renderItem={({ item }) => {
          if (item.status === 'active') {
            return (
              <ListingCard
                listing={item.listing}
                onPress={() => router.push(`/listing/${item.listing.id}`)}
              />
            );
          }
          return (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>
                {item.status === 'ended' ? 'This sale has ended.' : 'This listing is no longer available.'}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No saved listings yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  heading: { fontSize: 22, fontWeight: '700', padding: 16 },
  error: { color: '#dc2626', paddingHorizontal: 16 },
  placeholderCard: { marginHorizontal: 16, marginVertical: 6, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 12 },
  placeholderText: { color: '#9ca3af', fontSize: 14 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/saved.tsx
git commit -m "feat: saved screen with active/ended/unavailable listing states"
```

---

### Task 3: Profile screen

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Replace placeholder with ProfileScreen**

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.displayName?.[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
      <Text style={styles.name}>{user?.displayName ?? 'No name'}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity style={styles.btn} onPress={() => router.push('/edit-profile')}>
        <Text style={styles.btnText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => router.push('/my-listings')}>
        <Text style={styles.btnText}>My Listings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.signOutBtn]} onPress={handleSignOut}>
        <Text style={[styles.btnText, styles.signOutText]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12, marginTop: 32 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 32 },
  btn: { width: '100%', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { fontSize: 15, fontWeight: '500' },
  signOutBtn: { borderColor: '#fca5a5', marginTop: 8 },
  signOutText: { color: '#dc2626' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: profile screen with sign out"
```

---

### Task 4: Edit Profile screen

**Files:**
- Create: `app/edit-profile.tsx`

- [ ] **Step 1: Create app/edit-profile.tsx**

```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  updateProfile, reauthenticateWithCredential,
  EmailAuthProvider, updatePassword, verifyBeforeUpdateEmail
} from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';

export default function EditProfileScreen() {
  const user = auth.currentUser!;
  const router = useRouter();
  const isEmailProvider = user.providerData[0]?.providerId === 'password';

  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reauth = async () => {
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await reauthenticateWithCredential(user, credential);
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) { setError('Display name cannot be empty.'); return; }
    setLoading(true); setError('');
    try {
      await updateProfile(user, { displayName });
      Alert.alert('Saved', 'Display name updated.');
    } catch { setError('Failed to update display name.'); }
    finally { setLoading(false); }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !currentPassword) { setError('Enter your current password and new email.'); return; }
    setLoading(true); setError('');
    try {
      await reauth();
      await verifyBeforeUpdateEmail(user, newEmail);
      // Email is NOT updated yet — it updates only after user clicks the verification link
      Alert.alert(
        'Verification email sent',
        `A verification link has been sent to ${newEmail}. Your email address will update after you click that link. You can continue using your current email until then.`
      );
      setNewEmail(''); setCurrentPassword('');
    } catch (e: any) {
      if (e.code === 'auth/wrong-password') setError('Current password is incorrect.');
      else setError('Failed to update email. Please try again.');
    } finally { setLoading(false); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !currentPassword) { setError('Enter your current and new password.'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await reauth();
      await updatePassword(user, newPassword);
      Alert.alert('Saved', 'Password updated.');
      setNewPassword(''); setCurrentPassword('');
    } catch (e: any) {
      if (e.code === 'auth/wrong-password') setError('Current password is incorrect.');
      else setError('Failed to update password. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Edit Profile</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Display Name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <TouchableOpacity style={styles.btn} onPress={handleSaveDisplayName} disabled={loading}>
        <Text style={styles.btnText}>Save Name</Text>
      </TouchableOpacity>

      {isEmailProvider && (
        <>
          <Text style={styles.sectionTitle}>Update Email or Password</Text>
          <Text style={styles.label}>Current Password (required for changes below)</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Current password" />

          <Text style={styles.label}>New Email</Text>
          <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" placeholder="New email address" />
          <TouchableOpacity style={styles.btn} onPress={handleUpdateEmail} disabled={loading}>
            <Text style={styles.btnText}>Update Email</Text>
          </TouchableOpacity>

          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="New password (min 8 chars)" />
          <TouchableOpacity style={styles.btn} onPress={handleUpdatePassword} disabled={loading}>
            <Text style={styles.btnText}>Update Password</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: '#2563eb', padding: 13, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 12 },
  cancelBtn: { marginTop: 16, marginBottom: 32, alignItems: 'center' },
  cancelText: { color: '#6b7280', fontSize: 15 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/edit-profile.tsx
git commit -m "feat: edit profile screen with reauthentication and verifyBeforeUpdateEmail"
```

---

### Task 5: My Listings screen

**Files:**
- Create: `app/my-listings.tsx`

- [ ] **Step 1: Create app/my-listings.tsx**

```tsx
import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { db, auth } from '@/lib/firebase';
import { ListingCard } from '@/components/ListingCard';
import { Listing } from '@/types';

export default function MyListingsScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDocs(
      query(collection(db, 'listings'), where('userId', '==', uid), orderBy('createdAt', 'desc'))
    ).then((snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
      setLoading(false);
    });
  }, []);

  const handleActions = (listing: Listing) => {
    Alert.alert(listing.title, 'What would you like to do?', [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/(tabs)/add', params: { listingId: listing.id } }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete listing?', 'This will remove it from public view.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await updateDoc(doc(db, 'listings', listing.id), { active: false });
                setListings((prev) => prev.filter((l) => l.id !== listing.id));
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 48 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Listings</Text>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard listing={item} onPress={() => handleActions(item)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>You haven't posted any listings yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  heading: { fontSize: 22, fontWeight: '700', padding: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/my-listings.tsx
git commit -m "feat: my listings screen with edit and delete actions"
```

---

### Task 6: Run all tests + TestSprite

- [ ] **Step 1: Run Jest**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 2: Call TestSprite MCP to test Saved and Profile screens**

Use TestSprite MCP tools to test: saved listings rendering (all 3 states), profile display, edit profile form, my listings edit/delete action sheet.

- [ ] **Step 3: Fix any failures**

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: saved and profile screens complete"
```
