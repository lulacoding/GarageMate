# GarageMate — Design Spec
**Date:** 2026-03-26

## Overview

GarageMate is a garage sale finder app for iOS, Android, and Web. Users can browse nearby garage sales on a list or map, save favourites, post their own listings, and manage their profile. Browsing requires authentication.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Expo (React Native) — single codebase for iOS, Android, Web |
| Auth | Firebase Authentication (Google, Apple [iOS only], Email/Password) |
| Database | Firestore |
| Storage | Firebase Storage (listing images) |
| Functions | Firebase Cloud Functions (auto-expiry scheduler) |
| Address Search | Google Places API (autocomplete) |
| Maps (native) | react-native-maps (Apple Maps on iOS, Google Maps on Android) |
| Maps (web) | react-leaflet (rendered conditionally on Web platform) |

---

## Architecture

- **Auth required** to browse — unauthenticated users see the Auth Stack only
- No separate `users` Firestore collection — profile data (displayName, email, photoURL) read directly from `auth.currentUser`
- Listings use a denormalised `expiresAt` field (= `endDate ?? startDate`) for reliable auto-expiry queries
- Geohash-based radius filtering via `geofire-common` helpers with manual Firestore range queries
- Saved listings stored as a subcollection under the authenticated user (`users/{uid}/saved/{listingId}`)
- MapScreen on Web uses `react-leaflet`; on iOS/Android uses `react-native-maps` — same data layer, conditional render

---

## Data Model

### `listings/{listingId}`
```
userId: string           // Firebase Auth UID of creator
title: string            // max 100 chars
description: string      // max 500 chars
images: string[]         // Firebase Storage URLs, max 3
address: string          // Human-readable address
geohash: string          // For radius queries (geofire-common)
lat: number
lng: number
startDate: timestamp
endDate: timestamp | null  // null if single-day
startTime: string          // e.g. "09:00"
endTime: string            // e.g. "14:00"
expiresAt: timestamp       // = endDate ?? startDate (used for auto-expiry queries)
active: boolean            // false when expired or soft-deleted
createdAt: timestamp
```

### `users/{uid}/saved/{listingId}`
```
listingId: string        // String ID — no Firestore reference type
savedAt: timestamp
```

Note: Firestore allows subcollections without a parent document. Security Rules grant write access to `users/{uid}/saved/*` for the authenticated user matching `uid`, without requiring the parent document to exist.

---

## Navigation Structure

```
Root Navigator
├── Auth Stack (unauthenticated)
│   ├── LoginScreen
│   └── RegisterScreen
└── Main Tab Navigator (authenticated)
    ├── HomeTab
    │   ├── HomeScreen
    │   └── ListingDetailScreen
    ├── MapTab
    │   └── MapScreen
    ├── AddTab
    │   └── AddListingScreen
    ├── SavedTab
    │   ├── SavedScreen
    │   └── ListingDetailScreen
    └── ProfileTab
        ├── ProfileScreen
        ├── EditProfileScreen
        └── MyListingsScreen
            └── ListingDetailScreen
```

`ListingDetailScreen` is shared across tabs — navigated to with a `listingId` param and fetches from Firestore on mount.

---

## Auth Flow

1. App loads → `onAuthStateChanged` determines route
2. Unauthenticated → Auth Stack
3. **Register (Email/Password):** create account → send email verification → block app entry until email is verified
4. **Register (Google):** one-tap OAuth, no email verification required
5. **Register (Apple):** shown on iOS only (conditionally rendered); one-tap OAuth, no verification required
6. **Login:** for Email/Password, check `currentUser.emailVerified` before granting access
7. **Forgot password:** `sendPasswordResetEmail`
8. **Error handling:** all auth calls wrapped in try/catch; network errors, invalid credentials, and unverified email each show a specific user-facing message

---

## Screens

### HomeScreen
- On mount: get user location via `expo-location`
  - If permission denied or unavailable: show suburb search input immediately (no default location assumed)
- **Geohash query strategy:** `geofire-common` returns up to 9 `[lowerBound, upperBound]` geohash range pairs for a given center + radius. Each pair is a separate Firestore query (`where active == true AND geohash >= lower AND geohash <= upper`). Results from all queries are merged client-side and deduplicated by `listingId`. Pagination is client-side: fetch all matches for the current radius, sort by `startDate`, display 20 at a time with a "Load more" button.
- **Date filter:** Today / This Week / This Month / All — applied client-side on the merged result set (acceptable since the full radius fetch is already in memory)
- **Location filter:**
  - Default: 20km radius around user's current location
  - Slider: up to 50km
  - Suburb search: Google Places autocomplete → new lat/lng → re-query
- **Required Firestore composite index:** `geohash ASC, active ASC` (one index covers all 9 cell queries)
- Additional required indexes: `userId ASC, createdAt DESC` (MyListings query); `expiresAt ASC, active ASC` (Cloud Function expiry query)
- Results displayed as scrollable card list
- Loading spinner during fetch; error banner on failure; empty state if no results
- Tap card → `ListingDetailScreen`

### ListingDetailScreen
- Fetches listing by `listingId`; shows error state if not found or `active == false`
- Shows: images (carousel), title, description, date(s), times, address
- **Save button:** toggles `users/{uid}/saved/{listingId}` document; shows saved state
- **Maps button:** deep-link to Google Maps or Apple Maps using listing lat/lng

### MapScreen
- **Native (iOS/Android):** `react-native-maps` centred on user's current location
- **Web:** `react-leaflet` with equivalent functionality
- On location permission denied: prompt user to enable or fall back to suburb search
- Loads all active listings within a fixed 20km radius on mount (simple, sufficient for v1)
- Custom annotation per listing; tap annotation → bottom sheet card with title, date, address + "View Details" button → `ListingDetailScreen`
- Loading and error states handled

### AddListingScreen
- **Image picker:** `expo-image-picker`, max 3 images
- **Upload strategy:** upload all images to Firebase Storage first; only write Firestore doc after all uploads succeed. If any upload fails, show error and do not create the listing (no partial state)
- **Fields:** title, description
- **Address:** Google Places Autocomplete → stores address string + lat/lng + geohash
- **Date picker:** start date (not in the past), optional second day (must be after start date), start/end time (end must be after start)
- **Validation:** all fields required, at least 1 image, address selected from autocomplete
- On submit: compute `expiresAt = endDate ?? startDate`, write listing doc → navigate to HomeScreen
- Loading state on submit button; error message on failure

### SavedScreen
- Queries `users/{uid}/saved/` subcollection, fetches each listing by `listingId`
- For each `listingId`:
  - If `getDoc` returns the document and `active == true` → show card
  - If `getDoc` returns the document and `active == false` → show "This sale has ended" placeholder
  - If `getDoc` returns `notFound` (document deleted) → show "This listing is no longer available" placeholder
- Tap active listing → `ListingDetailScreen`
- Empty state if no saved listings

### ProfileScreen
- Displays `auth.currentUser.displayName` and `auth.currentUser.email`

**Edit Profile:**
- Update displayName: `updateProfile({ displayName })` — available to all auth providers
- Update email and update password are **only shown for Email/Password users** (`currentUser.providerData[0].providerId == 'password'`). Google/Apple users cannot change email or password through the app (their identity is managed by the provider).
- Update email (Email/Password only): prompt for current password → `reauthenticateWithCredential(EmailAuthProvider.credential(email, password))` → then `verifyBeforeUpdateEmail(newEmail)` (sends verification link; email updates only after user clicks it)
- Update password (Email/Password only): same reauthentication step → then `updatePassword(newPassword)`

**My Listings:**
- Queries `listings` where `userId == uid` (shows all, including expired, so seller can review past sales — `active` is not filtered here)
- Tap listing → action sheet: **Edit** or **Delete**
  - **Edit:** pre-fills `AddListingScreen` with existing values
    - Images: existing Storage URLs are displayed as thumbnails; user can remove individual images or add new ones (up to the 3-image limit). On submit, only newly added images are uploaded; existing URLs are kept as-is. Final `images[]` array = surviving old URLs + new upload URLs, in display order.
    - Address: if changed, geohash is recomputed from the new lat/lng
    - `expiresAt` is recomputed on save (`endDate ?? startDate`)
    - Start date validation in edit mode: if the listing's start date is already in the past (i.e. the sale has started or ended), the date fields are shown as read-only and cannot be changed. The user can still edit title, description, and images.
    - On save: `updateDoc` in-place (same `listingId`, `createdAt` preserved)
  - **Delete:** sets `active: false`; Storage images not deleted in v1

**Sign Out:** `auth.signOut()` → redirect to Auth Stack

---

## Auto-Expiry (Cloud Function)

```
Schedule: daily (e.g. midnight AEST)
Query: listings where expiresAt < now AND active == true
Action: batch update active = false, chunked in groups of 499 (Firestore batch limit is 500)
```

Uses the denormalised `expiresAt` field so single-day listings (where `endDate` is null) are correctly expired via `startDate`.

---

## Firestore Security Rules (Access Matrix)

| Collection | Read | Write |
|---|---|---|
| `listings` | Any authenticated user if `active == true` OR `userId == uid` | Owner (`userId == uid`) only |
| `users/{uid}/saved/*` | Owner only | Owner only |

**Important implementation note:** Firestore Security Rules cannot filter query results — they allow or deny a query wholesale. Rules are written at the document level:
- For `listings`, the rule is: `allow read: if request.auth != null && (resource.data.active == true || resource.data.userId == request.auth.uid);`
- Client queries for HomeScreen/MapScreen/SavedScreen already include `where active == true`, so those queries will pass
- `ListingDetailScreen` fetches a single doc by ID; if `active == false` and the user is not the owner, the rule denies the read and the screen shows a "not found" error (correct behaviour — the listing is expired or deleted)
- Required Firestore composite indexes: `geohash ASC, active ASC` (HomeScreen/MapScreen queries); `userId ASC, createdAt DESC` (MyListings query); `expiresAt ASC, active ASC` (Cloud Function expiry query)

---

## Validation Rules (AddListingScreen)

- Title: required, max 100 chars
- Description: required, max 500 chars
- Images: at least 1, max 3
- Address: must be selected from Places autocomplete (ensures lat/lng/geohash captured)
- Start date: must not be in the past
- End time: must be after start time
- Second day (optional): must be after start date; maximum 2 days total (v1 scope)

---

## Global UI Patterns

- All data-fetching screens show a loading spinner during fetch
- Network/Firebase errors show an inline error banner with a retry option
- Empty states show a contextual illustration and message (e.g., "No garage sales nearby" on HomeScreen)
- Auth errors (wrong password, unverified email, network failure) show specific, user-readable messages

---

## Key Dependencies

```
expo
firebase
react-native-maps          // iOS + Android maps
react-leaflet              // Web maps
expo-location
expo-image-picker
@react-navigation/native
@react-navigation/bottom-tabs
@react-navigation/stack
react-native-google-places-autocomplete
geofire-common
```

---

## Out of Scope (v1)

- Image deletion from Firebase Storage on listing delete (deferred)
- Push notifications
- Reviews or ratings
- Admin/moderation panel
- Listings spanning more than 2 days
