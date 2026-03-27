# GarageMate — Group 3: Technical Design

**Date:** 2026-03-27  
**Status:** Approved  
**Scope:** Performance, DevOps & Monitoring

---

## 1. Performance

### Image Compression Before Upload
- In `lib/listings.ts` → `uploadListingImages()`, before uploading each image URI, run it through `expo-image-manipulator`.
- Resize to max 1200px on longest side, JPEG quality 0.75.
- This reduces average upload from ~3MB to ~200KB per image.
- Package: `expo-image-manipulator` (already included in Expo SDK 55).

### FlashList Instead of FlatList
- Replace `FlatList` in `app/(tabs)/index.tsx` with `FlashList` from `@shopify/flash-list`.
- Replace `FlatList` in `app/(tabs)/saved.tsx` with `FlashList`.
- Replace `FlatList` in `app/my-listings.tsx` with `FlashList`.
- Provide `estimatedItemSize={120}` (approximate ListingCard height).
- Web fallback: FlashList works on web via react-native-web.

### React.memo on ListingCard
- Wrap `components/ListingCard.tsx` export with `React.memo`.
- No prop change = no re-render during list scrolling.

### Network Error Retry Logic
- In `hooks/useListings.ts`, wrap Firestore queries in try/catch; on failure set an `error` state.
- Home screen shows a "Couldn't load listings. Tap to retry." button that re-runs the query.
- Same pattern for `useSavedListings.ts` and `my-listings.tsx`.

### Firestore Offline Persistence
- In `lib/firebase.ts`, enable offline persistence for Firestore:
  ```ts
  import { enableIndexedDbPersistence } from 'firebase/firestore';
  enableIndexedDbPersistence(db).catch(() => {}); // silent fail on web multi-tab
  ```
- Native uses `initializeFirestore` with `localCache: persistentLocalCache()`.

---

## 2. DevOps & Monitoring

### Error Monitoring — Firebase Crashlytics
- Add `@react-native-firebase/crashlytics` for native crash reporting.
- Web: use Firebase Analytics `logEvent('exception', ...)` in the ErrorBoundary catch handler.
- Wrap the root app in a try/catch to catch unhandled promise rejections.

### Analytics — Firebase Analytics
- Add `firebase/analytics` (already in Firebase JS SDK).
- Initialize in `lib/firebase.ts`: `export const analytics = getAnalytics(app)`.
- Log key events: `login`, `sign_up`, `listing_created`, `listing_viewed`, `listing_saved`.
- Add `logEvent` calls at the relevant points in auth flows, add screen, and listing detail.

### CI/CD — GitHub Actions
- Create `.github/workflows/test.yml`:
  - Trigger: push to `main`, PR to `main`.
  - Steps: checkout → npm install → `npx jest --no-coverage` → report results.
- Create `.github/workflows/eas-build.yml`:
  - Trigger: push tag `v*`.
  - Steps: checkout → npm install → `eas build --platform all --non-interactive`.
  - Requires `EXPO_TOKEN` secret in GitHub repository settings.

### EAS Update (OTA)
- Add `expo-updates` to dependencies.
- In `app.config.ts`, add `updates: { url: 'https://u.expo.dev/<project-id>' }` and `runtimeVersion: { policy: 'appVersion' }`.
- After any JS-only fix, deploy via `eas update --branch production --message "fix: ..."` instead of a full store submission.

### Environment Separation
- Add a `EXPO_PUBLIC_ENV` variable to `.env.local` (values: `development`, `production`).
- In `lib/firebase.ts`, log a warning if Firebase project ID doesn't match expected for the env.
- For a full multi-environment setup (separate Firebase projects), document the approach in `CLAUDE.md` but don't implement in v1 — one Firebase project is sufficient.

---

## Architecture Notes
- `lib/firebase.ts` — offline persistence + analytics init
- `lib/listings.ts` — image compression before upload
- `components/ListingCard.tsx` — React.memo wrap
- `app/(tabs)/index.tsx` — FlashList, retry on error
- `app/(tabs)/saved.tsx` — FlashList, retry on error
- `app/my-listings.tsx` — FlashList, retry on error
- `hooks/useListings.ts` — error state + retry
- `hooks/useSavedListings.ts` — error state + retry
- `.github/workflows/test.yml` — new CI config
- `.github/workflows/eas-build.yml` — new build config
- `eas.json` — EAS Update channel config (shared with Group 1)

---

## Success Criteria
- Images upload at <300KB average (verified by checking Firebase Storage file sizes)
- ListingCard does not re-render when parent re-renders with same data (verified via React DevTools)
- Network error shows retry button instead of crash or silent failure
- Firestore data available offline after first load (verified by disabling network in DevTools)
- `npx jest --no-coverage` runs automatically on every PR via GitHub Actions
- `eas build` triggered on version tag push
- Firebase Analytics events visible in Firebase Console DebugView
