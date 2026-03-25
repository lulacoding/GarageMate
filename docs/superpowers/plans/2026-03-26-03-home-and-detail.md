# GarageMate — Plan 03: Home Screen & Listing Detail

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Home screen (nearby listings card list with date and location filters) and the shared Listing Detail screen (images, info, save button, maps deep-link).

**Architecture:** `useListings` hook encapsulates the Firestore geohash query logic (9 parallel queries, client-side merge/dedup). `ListingCard` and `ListingDetail` are reusable components. Location via `expo-location`. Suburb search via Google Places Autocomplete. Date filters applied client-side on the in-memory result set.

**Tech Stack:** Firestore, `geofire-common`, `expo-location`, `react-native-google-places-autocomplete`, React Native, TypeScript

**Skills:** `@mobile-developer` (FlatList, hooks patterns), `@expo-best-practices` (location + permissions), `@uncodixfy` (invoke before writing any JSX/styling — no generic AI aesthetics), `@code-quality` (TypeScript strictness)

---

## File Structure

```
app/(tabs)/
└── index.tsx                        # Home screen (replace placeholder)
components/
├── ListingCard.tsx                  # Card component used in list and saved views
└── ListingDetail.tsx                # Full detail view (shared across tabs)
hooks/
├── useListings.ts                   # Geohash query + merge + filter logic
└── useSavedStatus.ts                # Check/toggle saved state for a listing
app/
└── listing/[id].tsx                 # Listing detail route (shared)
__tests__/
├── hooks/
│   ├── useListings.test.ts
│   └── useSavedStatus.test.ts
└── components/
    └── ListingCard.test.tsx
```

---

### Task 1: Build geohash query utility

**Files:**
- Create: `lib/geohash.ts`
- Create: `__tests__/lib/geohash.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/lib/geohash.test.ts`:
```ts
import { getGeohashRange, buildGeohashQueries } from '@/lib/geohash';

describe('geohash utilities', () => {
  it('returns 9 query bounds for a given center and radius', () => {
    const queries = buildGeohashQueries({ lat: -37.8136, lng: 144.9631 }, 20);
    expect(queries.length).toBeGreaterThanOrEqual(1);
    expect(queries.length).toBeLessThanOrEqual(9);
    queries.forEach(([lower, upper]) => {
      expect(typeof lower).toBe('string');
      expect(typeof upper).toBe('string');
      expect(upper >= lower).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/geohash.test.ts --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Create lib/geohash.ts**

```ts
import { geohashQueryBounds, geohashForLocation } from 'geofire-common';
import { LocationCoords } from '@/types';

export function buildGeohashQueries(
  center: LocationCoords,
  radiusKm: number
): [string, string][] {
  const radiusM = radiusKm * 1000;
  const bounds = geohashQueryBounds([center.lat, center.lng], radiusM);
  return bounds as [string, string][];
}

export function encodeGeohash(lat: number, lng: number): string {
  return geohashForLocation([lat, lng]);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/geohash.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/geohash.ts __tests__/lib/geohash.test.ts
git commit -m "feat: geohash query utility using geofire-common"
```

---

### Task 2: Build useListings hook

**Files:**
- Create: `hooks/useListings.ts`
- Create: `__tests__/hooks/useListings.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/hooks/useListings.test.ts`:
```ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useListings } from '@/hooks/useListings';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
}));
jest.mock('@/lib/geohash', () => ({
  buildGeohashQueries: jest.fn(() => [['a', 'z']]),
}));

describe('useListings', () => {
  it('returns empty array and loading=false after fetch', async () => {
    const { result } = renderHook(() =>
      useListings({ lat: -37.8136, lng: 144.9631 }, 20)
    );
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.listings).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/hooks/useListings.test.ts --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Create hooks/useListings.ts**

```ts
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildGeohashQueries } from '@/lib/geohash';
import { Listing, LocationCoords } from '@/types';
import { distanceBetween } from 'geofire-common';

export function useListings(center: LocationCoords | null, radiusKm: number) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!center) return;
    fetchListings(center, radiusKm);
  }, [center?.lat, center?.lng, radiusKm]);

  const fetchListings = async (center: LocationCoords, radiusKm: number) => {
    setLoading(true);
    setError(null);
    try {
      const bounds = buildGeohashQueries(center, radiusKm);
      const promises = bounds.map(([lower, upper]) =>
        getDocs(
          query(
            collection(db, 'listings'),
            where('active', '==', true),
            where('geohash', '>=', lower),
            where('geohash', '<=', upper)
          )
        )
      );
      const snapshots = await Promise.all(promises);
      const seen = new Set<string>();
      const results: Listing[] = [];
      snapshots.forEach((snap) => {
        snap.docs.forEach((doc) => {
          if (!seen.has(doc.id)) {
            seen.add(doc.id);
            const data = doc.data();
            // Confirm within actual radius (geohash bounds are approximate)
            // distanceBetween returns kilometres — compare directly to radiusKm
            const dist = distanceBetween([data.lat, data.lng], [center.lat, center.lng]);
            if (dist <= radiusKm) {
              results.push({ id: doc.id, ...data } as Listing);
            }
          }
        });
      });
      results.sort((a, b) => a.startDate.toMillis() - b.startDate.toMillis());
      setListings(results);
    } catch (e) {
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { listings, loading, error, refetch: () => center && fetchListings(center, radiusKm) };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/hooks/useListings.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useListings.ts __tests__/hooks/useListings.test.ts
git commit -m "feat: useListings hook with geohash radius query and dedup"
```

---

### Task 3: ListingCard component

**Files:**
- Create: `components/ListingCard.tsx`
- Create: `__tests__/components/ListingCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/ListingCard.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ListingCard } from '@/components/ListingCard';
import { Timestamp } from 'firebase/firestore';

const mockListing = {
  id: '1',
  title: 'Big Garage Sale',
  address: '123 Main St, Melbourne',
  images: ['https://example.com/img1.jpg'],
  startDate: { toDate: () => new Date('2026-04-01') } as any,
  endDate: null,
  startTime: '09:00',
  endTime: '14:00',
  active: true,
} as any;

describe('ListingCard', () => {
  it('renders title and address', () => {
    const { getByText } = render(<ListingCard listing={mockListing} onPress={() => {}} />);
    expect(getByText('Big Garage Sale')).toBeTruthy();
    expect(getByText('123 Main St, Melbourne')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/ListingCard.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Create components/ListingCard.tsx**

```tsx
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Listing } from '@/types';

interface Props {
  listing: Listing;
  onPress: () => void;
}

export function ListingCard({ listing, onPress }: Props) {
  const date = listing.startDate.toDate().toLocaleDateString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const endDate = listing.endDate
    ? ` – ${listing.endDate.toDate().toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}`
    : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {listing.images[0] ? (
        <Image source={{ uri: listing.images[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.address} numberOfLines={1}>{listing.address}</Text>
        <Text style={styles.date}>{date}{endDate} · {listing.startTime}–{listing.endTime}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginVertical: 6, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  image: { width: 88, height: 88 },
  imagePlaceholder: { backgroundColor: '#e5e7eb' },
  content: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  address: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  date: { fontSize: 12, color: '#9ca3af' },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/components/ListingCard.test.tsx --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/ListingCard.tsx __tests__/components/ListingCard.test.tsx
git commit -m "feat: ListingCard component"
```

---

### Task 4: Home screen

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Install slider dependency (before writing the screen)**

```bash
npx expo install @react-native-community/slider
```

- [ ] **Step 2: Replace placeholder with full HomeScreen**

```tsx
import { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import { useListings } from '@/hooks/useListings';
import { ListingCard } from '@/components/ListingCard';
import { LocationCoords, Listing } from '@/types';

const PLACES_KEY = Constants.expoConfig?.extra?.googlePlacesApiKey ?? '';

const DATE_FILTERS = ['All', 'Today', 'This Week', 'This Month'] as const;
type DateFilter = typeof DATE_FILTERS[number];

function applyDateFilter(listings: Listing[], filter: DateFilter): Listing[] {
  if (filter === 'All') return listings;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return listings.filter((l) => {
    const d = l.startDate.toDate();
    if (filter === 'Today') return d >= today && d < new Date(today.getTime() + 86400000);
    if (filter === 'This Week') {
      const weekEnd = new Date(today.getTime() + 7 * 86400000);
      return d >= today && d < weekEnd;
    }
    if (filter === 'This Month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

export default function HomeScreen() {
  const [center, setCenter] = useState<LocationCoords | null>(null);
  const [radius, setRadius] = useState(20);
  const [dateFilter, setDateFilter] = useState<DateFilter>('All');
  const [locationError, setLocationError] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const router = useRouter();
  const { listings, loading, error, refetch } = useListings(center, radius);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError(true); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const filtered = applyDateFilter(listings, dateFilter);
  const paged = filtered.slice(0, page * PAGE_SIZE);

  return (
    <View style={styles.container}>
      {/* Date filter chips */}
      <View style={styles.filterRow}>
        {DATE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, dateFilter === f && styles.chipActive]}
            onPress={() => setDateFilter(f)}
          >
            <Text style={[styles.chipText, dateFilter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Radius slider */}
      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Radius: {radius}km</Text>
        <Slider
          style={{ flex: 1 }}
          minimumValue={1}
          maximumValue={50}
          step={1}
          value={radius}
          onSlidingComplete={(v) => setRadius(Math.round(v))}
        />
      </View>

      {locationError && (
        <View style={styles.suburbSearch}>
          <Text style={styles.warning}>Location unavailable. Search by suburb:</Text>
          <GooglePlacesAutocomplete
            placeholder="Enter suburb"
            onPress={(_data, details) => {
              if (!details) return;
              setCenter({
                lat: details.geometry.location.lat,
                lng: details.geometry.location.lng,
              });
            }}
            query={{ key: PLACES_KEY, language: 'en', types: '(cities)' }}
            fetchDetails
            styles={{ container: { marginTop: 4 }, textInput: styles.suburbInput }}
          />
        </View>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 32 }} size="large" />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={paged}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
        )}
        onEndReached={() => { if (paged.length < filtered.length) setPage((p) => p + 1); }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No garage sales nearby.</Text> : null}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  sliderLabel: { fontSize: 13, color: '#6b7280', marginRight: 8, width: 80 },
  warning: { color: '#d97706', fontSize: 13, marginBottom: 4 },
  suburbSearch: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fffbeb' },
  suburbInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  errorText: { color: '#dc2626', textAlign: 'center', marginTop: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
});
```

- [ ] **Step 2: Install slider dependency**

```bash
npx expo install @react-native-community/slider
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: home screen with listings, date filter, radius slider"
```

---

### Task 5: useSavedStatus hook

**Files:**
- Create: `hooks/useSavedStatus.ts`
- Create: `__tests__/hooks/useSavedStatus.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// __tests__/hooks/useSavedStatus.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSavedStatus } from '@/hooks/useSavedStatus';

jest.mock('@/lib/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'user1' } } }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn(() => 'ts'),
}));

describe('useSavedStatus', () => {
  it('returns isSaved=false when not saved', async () => {
    const { result } = renderHook(() => useSavedStatus('listing1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isSaved).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify fails, then create hooks/useSavedStatus.ts**

```bash
npx jest __tests__/hooks/useSavedStatus.test.ts --no-coverage
```

```ts
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export function useSavedStatus(listingId: string) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    const ref = doc(db, 'users', uid, 'saved', listingId);
    getDoc(ref).then((snap) => {
      setIsSaved(snap.exists());
      setLoading(false);
    });
  }, [listingId]);

  const toggle = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'saved', listingId);
    if (isSaved) {
      await deleteDoc(ref);
      setIsSaved(false);
    } else {
      await setDoc(ref, { listingId, savedAt: serverTimestamp() });
      setIsSaved(true);
    }
  };

  return { isSaved, loading, toggle };
}
```

- [ ] **Step 3: Run test to verify it passes**

```bash
npx jest __tests__/hooks/useSavedStatus.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add hooks/useSavedStatus.ts __tests__/hooks/useSavedStatus.test.ts
git commit -m "feat: useSavedStatus hook for toggling saved listings"
```

---

### Task 6: Listing Detail screen

**Files:**
- Create: `app/listing/[id].tsx`

- [ ] **Step 1: Create app/listing/[id].tsx**

```tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useSavedStatus } from '@/hooks/useSavedStatus';
import { Listing } from '@/types';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { isSaved, toggle } = useSavedStatus(id);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'listings', id)).then((snap) => {
      if (!snap.exists()) {
        setNotFound(true);
      } else {
        const data = snap.data();
        const isOwner = auth.currentUser?.uid === data.userId;
        // Non-owners cannot view inactive listings (security rules will also block this read)
        if (!data.active && !isOwner) {
          setNotFound(true);
        } else {
          setListing({ id: snap.id, ...data } as Listing);
        }
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 48 }} size="large" />;
  if (notFound || !listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>This listing is no longer available.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>Go back</Text></TouchableOpacity>
      </View>
    );
  }

  const openMaps = () => {
    const url = Platform.OS === 'ios'
      ? `maps://?q=${listing.lat},${listing.lng}`
      : `geo:${listing.lat},${listing.lng}?q=${encodeURIComponent(listing.address)}`;
    Linking.openURL(url);
  };

  const startDate = listing.startDate.toDate().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });
  const endDate = listing.endDate
    ? listing.endDate.toDate().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })
    : null;

  return (
    <ScrollView style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {listing.images.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.image} />
        ))}
      </ScrollView>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title}>{listing.title}</Text>
          <TouchableOpacity onPress={toggle} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{isSaved ? '★ Saved' : '☆ Save'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.address}>{listing.address}</Text>
        <Text style={styles.date}>{startDate}{endDate ? ` – ${endDate}` : ''}</Text>
        <Text style={styles.time}>{listing.startTime} – {listing.endTime}</Text>
        <Text style={styles.description}>{listing.description}</Text>
        <TouchableOpacity style={styles.mapsBtn} onPress={openMaps}>
          <Text style={styles.mapsBtnText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageScroll: { height: 240 },
  image: { width: 320, height: 240, marginRight: 2 },
  content: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', flex: 1, marginRight: 12 },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2563eb', borderRadius: 8 },
  saveBtnText: { color: '#2563eb', fontWeight: '600' },
  address: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  date: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  time: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  mapsBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  mapsBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  notFound: { fontSize: 16, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  back: { color: '#2563eb', fontSize: 15 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/listing/[id].tsx
git commit -m "feat: listing detail screen with save toggle and maps deep-link"
```

---

### Task 7: Run all tests + TestSprite

- [ ] **Step 1: Run Jest**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 2: Call TestSprite MCP to test Home and Detail screens**

Use TestSprite MCP tools to run UI tests on HomeScreen (filter chips, card rendering, empty state) and ListingDetailScreen (image carousel, save button, maps button).

- [ ] **Step 3: Fix any failures**

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: home screen and listing detail complete"
```
