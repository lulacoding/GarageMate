# GarageMate

A cross-platform garage sale finder app built with Expo, React Native, and Firebase. Users can post and discover nearby garage sales on iOS, Android, and Web from a single codebase.

## Features

- **Discover** nearby garage sales on a list or map view
- **Post** listings with photos, address autocomplete, and date/time
- **Save** listings and view them later
- **Authentication** via Email/Password, Google, and Apple (iOS)
- **Auto-expiry** — listings automatically deactivate via a scheduled Cloud Function
- **Edit/delete** your own listings from your profile

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 55 + React Native |
| Navigation | Expo Router (file-based) |
| Backend | Firebase (Auth, Firestore, Storage, Functions) |
| Maps | `react-native-maps` (iOS/Android) · `react-leaflet` (Web) |
| Geo queries | `geofire-common` — 9 parallel geohash range queries |
| Auth providers | Email/Password · Google · Apple (iOS only) |
| Cloud Function | Firebase Functions v2 — scheduled daily expiry |

## Project Structure

```
app/
├── _layout.tsx          # Auth gate + Google Sign-In config
├── (auth)/              # login, register, forgot-password
├── (tabs)/              # index, map, add, saved, profile
├── listing/[id].tsx     # Listing detail screen
├── edit-profile.tsx     # Edit profile screen
└── my-listings.tsx      # My listings screen
components/
├── ListingCard.tsx
├── MapNative.tsx        # react-native-maps (iOS/Android)
└── MapWeb.tsx           # react-leaflet (Web)
hooks/
├── useAuth.ts
├── useListings.ts
├── useSavedListings.ts
└── useSavedStatus.ts
lib/
├── firebase.ts
├── geohash.ts
├── listings.ts
└── validation.ts
functions/
└── src/
    ├── index.ts         # Scheduled Cloud Function
    └── expireListings.ts
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/lulacoding/GarageMate.git
cd GarageMate
npm install
```

### 2. Set up Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google)
3. Enable **Firestore** and **Storage**
4. Add a Web app and copy the config

### 3. Configure environment

Create `.env.local` in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=
```

Update `.firebaserc` with your Firebase project ID.

### 4. Run the app

```bash
npx expo start          # Dev server (w=web, i=iOS sim, a=Android)
npx expo start --web    # Web only
```

### 5. Deploy

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Cloud Function
cd functions && npm run build && cd ..
firebase deploy --only functions
```

## Testing

```bash
npx jest --no-coverage   # Run all tests (27 tests across 14 suites)
npx jest --watchAll      # Watch mode
```

## Key Architecture Notes

- **Geohash queries** — 9 parallel Firestore range queries merged and deduped client-side. `startAfter` pagination is incompatible with this pattern; client-side pagination is used instead.
- **`expiresAt` field** — denormalized as `endDate ?? startDate` on every listing, required for the Cloud Function's inequality query.
- **`verifyBeforeUpdateEmail`** — used instead of deprecated `updateEmail`; email only updates after the user clicks the verification link.
- **Apple Sign-In** — rendered on iOS only via `Platform.OS === 'ios'`.
- **`distanceBetween`** from `geofire-common` returns **km**, not metres.
