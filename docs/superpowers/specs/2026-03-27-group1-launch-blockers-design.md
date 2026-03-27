# GarageMate — Group 1: Launch Blockers Design

**Date:** 2026-03-27  
**Status:** Approved  
**Scope:** Security, Legal/Compliance, App Store requirements

---

## 1. Security Hardening

### Firebase Storage Rules
Add rules to `storage.rules` so only authenticated users can upload, and only to their own path (`users/{uid}/listings/`). Public reads allowed for listing images.

### Firebase App Check
Enable App Check in Firebase Console with the reCAPTCHA v3 provider for web and DeviceCheck for iOS. Register App Check in `lib/firebase.ts` using `initializeAppCheck`. Add to `app.config.ts` plugin config.

### Google API Key Restrictions
- In Google Cloud Console, restrict `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` to the Places API only, with HTTP referrer restrictions for production domain.
- Restrict `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` to Android apps with the correct package name.
- Firebase API key already restricted by Firebase automatically; no action needed.

### Rate Limiting & Validation
- Image upload: validate file type (JPEG/PNG only) and size (max 5MB) before `uploadListingImages` in `lib/listings.ts`.
- Firestore rules: add field-level validation (title max 100 chars, description max 1000 chars).

---

## 2. Legal & Compliance

### Privacy Policy & Terms of Service
- Add two static screens: `app/privacy-policy.tsx` and `app/terms-of-service.tsx`.
- Link both from the login screen footer and from Profile screen.
- Content: standard GDPR-compliant privacy policy covering Firebase data collection, location usage, image storage; standard ToS for a marketplace app.

### Account Deletion Flow (Apple mandatory)
- Add "Delete Account" button in Profile screen.
- Deletion flow: confirm dialog → delete all user's listings + images from Storage → delete Firestore user data → `auth.currentUser.delete()` → redirect to login.
- Implement in `lib/userDeletion.ts`.

### GDPR Data Export
- Add "Export my data" button in Profile screen.
- Exports a JSON file of the user's listings and saved items.
- Client-side only (Firestore query → JSON.stringify → download via web or share sheet on native).

---

## 3. App Store / Play Store Requirements

### App Icon & Splash
- Create 1024×1024 icon in `assets/icon.png` (already exists; confirm it meets requirements).
- Confirm `assets/splash-icon.png` meets platform requirements.
- Add `adaptive-icon.png` for Android (foreground image on white background).

### EAS Build Setup
- Install EAS CLI: `npm install -g eas-cli`.
- Run `eas build:configure` to generate `eas.json` with development, preview, and production profiles.
- Configure `app.config.ts` with correct `bundleIdentifier` (iOS: `com.garagemate.app`) and `package` (Android: `com.garagemate.app`).

### EAS Update (OTA)
- Configure EAS Update in `eas.json` for over-the-air JS updates.
- Add `expo-updates` package.
- Set update channel to `production` for the production build profile.

### Store Listing Assets
- Screenshots: capture from simulator/device for iPhone 6.7", iPhone 6.5", iPad 12.9", and Android Phone.
- Short description (80 chars), full description, keywords.
- Age rating: 4+ (no objectionable content).
- Support URL and Privacy Policy URL (must be publicly accessible).

---

## Architecture Notes
- `storage.rules` — new file at project root (alongside `firestore.rules`)
- `lib/userDeletion.ts` — new module
- `lib/listings.ts` — add image validation before upload
- `app/privacy-policy.tsx` — new static screen
- `app/terms-of-service.tsx` — new static screen
- `app/(tabs)/profile.tsx` — add Delete Account, Export Data, Privacy/ToS links
- `app/(auth)/login.tsx` — add Privacy/ToS links in footer
- `app.config.ts` — add App Check, EAS Update plugin
- `eas.json` — new file

---

## Success Criteria
- Storage rules deployed and block unauthenticated writes
- App Check active on web (reCAPTCHA)
- Image upload rejects non-image files and files > 5MB
- Privacy Policy and Terms of Service screens accessible without login
- Account deletion removes all user data from Firestore, Storage, and Auth
- EAS Build produces a signed IPA and APK
- `eas.json` has development, preview, and production profiles
