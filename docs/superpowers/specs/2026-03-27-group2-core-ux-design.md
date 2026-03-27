# GarageMate — Group 2: Core UX Design

**Date:** 2026-03-27  
**Status:** Approved  
**Scope:** UX Gaps, Missing Features, Accessibility & Polish

---

## 1. UX Gaps

### Onboarding / First-Run Flow
- Show a 3-screen onboarding carousel on first launch (AsyncStorage flag `hasSeenOnboarding`).
- Screens: (1) Discover nearby sales, (2) Post your own sale, (3) Save favourites.
- Each screen: full-bleed illustration placeholder, heading, subtext, Next/Skip button.
- After onboarding → login screen.
- File: `app/onboarding.tsx` (new), checked before auth gate in `_layout.tsx`.

### Pull-to-Refresh
- Add `RefreshControl` to the FlatList in `app/(tabs)/index.tsx` (home).
- Add `RefreshControl` to `app/(tabs)/saved.tsx`.
- Add `RefreshControl` to `app/my-listings.tsx`.
- On refresh, re-fetch listings from Firestore.

### Empty States
- Home screen: when no listings nearby, show an illustration placeholder + "No garage sales nearby. Try expanding your radius." text.
- Saved screen: when no saved items, show "You haven't saved any listings yet." with a link to Home.
- My Listings: when user has no listings, show "You haven't posted any listings yet." with a link to Add.

### Deep Linking (Shareable URLs)
- Configure Expo Router's `linking` so `/listing/[id]` resolves correctly when opened from a URL.
- Web: already works via Expo Router.
- Native: ensure `scheme: 'garagemate'` in `app.config.ts` handles `garagemate://listing/[id]`.
- No backend changes needed.

---

## 2. Missing Features

### Keyword Search
- Add a search bar (TextInput) at the top of the home screen.
- Filter the already-fetched listings client-side by `title.toLowerCase().includes(query)`.
- No new Firestore index required (client-side filter on existing results).
- File: `app/(tabs)/index.tsx`.

### Share Listing Button
- Add a share button (Ionicons `share-social-outline`) to `app/listing/[id].tsx` header.
- On press: call `Share.share({ message: title, url: \`https://garagemate.app/listing/\${id}\` })` using React Native's built-in `Share` API.
- Web fallback: `navigator.share()` if available, else copy URL to clipboard.

### Report / Flag Listing
- Add a "Report" button (3-dot menu or flag icon) on `app/listing/[id].tsx`.
- On press: show an action sheet with reasons (Inappropriate, Spam, Offensive, Other).
- On confirm: write a document to `reports/{listingId}` in Firestore with `{ reportedBy, reason, timestamp }`.
- No admin UI needed for v1 — reports are reviewed manually in Firebase Console.

### Image Zoom on Detail Screen
- Replace the static `Image` in `app/listing/[id].tsx` with a horizontally scrollable image viewer.
- On native: use `react-native-image-zoom-viewer` or a Modal + pinch gesture.
- On web: use CSS `object-fit: contain` in a full-screen overlay Modal on image tap.
- Keep existing ScrollView for the rest of the detail content.

---

## 3. Accessibility & Polish

### Screen Reader Labels
- Add `accessibilityLabel` to all `TouchableOpacity` elements that contain only icons (no text).
- Add `accessibilityRole="button"` to all touchable elements.
- Add `accessibilityLabel` to all `Image` components.
- Priority files: `ListingCard.tsx`, `listing/[id].tsx`, `(tabs)/_layout.tsx`, `add.tsx`.

### Error Boundaries
- Create `components/ErrorBoundary.tsx` — a React class component that catches render errors and shows a "Something went wrong. Tap to retry." fallback screen.
- Wrap the root Stack in `app/_layout.tsx` with `<ErrorBoundary>`.

### Loading States
- Every screen that fetches data must show an `ActivityIndicator` while loading and no spinner after data arrives.
- Audit: `index.tsx`, `saved.tsx`, `my-listings.tsx`, `listing/[id].tsx`, `map.tsx`.
- Ensure no screen flashes blank before showing content.

### Keyboard Avoidance on Forms
- Wrap `login.tsx`, `register.tsx`, `forgot-password.tsx`, `edit-profile.tsx`, and `add.tsx` with `KeyboardAvoidingView` (behavior `padding` on iOS, `height` on Android).

---

## Architecture Notes
- `app/onboarding.tsx` — new 3-screen carousel
- `app/_layout.tsx` — onboarding gate before auth gate
- `components/ErrorBoundary.tsx` — new class component
- `app/(tabs)/index.tsx` — search bar, pull-to-refresh, empty state, share
- `app/(tabs)/saved.tsx` — pull-to-refresh, empty state
- `app/my-listings.tsx` — pull-to-refresh, empty state
- `app/listing/[id].tsx` — share button, report button, image zoom
- `ListingCard.tsx` — accessibility labels
- All auth forms — KeyboardAvoidingView

---

## Success Criteria
- Onboarding shows on first launch, not on subsequent launches
- Pull-to-refresh works on Home, Saved, My Listings
- Search filters listings by keyword in real time
- Share opens native share sheet / browser share dialog
- Report writes to Firestore `reports` collection
- Image tap opens zoom view on both web and native
- VoiceOver / TalkBack can navigate all interactive elements
- Error boundary catches crashes and shows fallback UI
- No blank flash on any data-fetching screen
