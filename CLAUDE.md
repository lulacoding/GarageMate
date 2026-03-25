# GarageMate — Development Guide

> General engineering principles are in your global CLAUDE.md. This file covers project-specific patterns only.

## What It Is
Garage sale finder — users post and discover nearby sales. Single codebase (iOS, Android, Web) via Expo + React Native + Firebase.

## Key Commands

```bash
npx expo start             # Dev server (w=web, i=iOS sim, a=Android)
npx expo start --web       # Web only
npx jest --no-coverage     # Run unit tests
npx jest --watchAll        # TDD watch mode
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

## Architecture

- **Navigation**: Expo Router (file-based) — `app/` mirrors URL structure
- **Auth gate**: `app/_layout.tsx` — `onAuthStateChanged` drives tab vs auth stack
- **Firebase**: JS SDK v10 — `lib/firebase.ts` exports `auth`, `db`, `storage`
- **Geo queries**: 9 parallel Firestore geohash range queries → client-side merge/dedup (`lib/geohash.ts`)
- **Maps**: `react-native-maps` (iOS/Android only) + `react-leaflet` (Web) — platform-conditional import in `map.tsx`

## Critical Non-Obvious Patterns

- **`expiresAt`** — denormalized field (`endDate ?? startDate`) on every listing; required for Cloud Function expiry query (Firestore `<` inequality won't match null `endDate`)
- **`verifyBeforeUpdateEmail`** — use instead of deprecated `updateEmail`; email not updated until user clicks verification link
- **Apple Sign-In** — iOS only (`Platform.OS === 'ios'`); never render on Android/Web
- **`distanceBetween`** returns **km** (not metres) — compare directly against `radiusKm`
- **Geohash + pagination** — `startAfter` cursor across 9 parallel queries is incompatible; use full client-side pagination on merged result set
- **`GoogleSignin.configure()`** — call in root layout `useEffect`, not at module scope

## File Layout

```
app/
├── _layout.tsx        # Root: auth gate + Google Sign-In config
├── (auth)/            # login, register, forgot-password
├── (tabs)/            # index, map, add, saved, profile
└── listing/[id].tsx   # Detail screen
components/            # ListingCard, ListingDetail, MapNative, MapWeb
hooks/                 # useAuth, useListings, useSavedListings, useSavedStatus
lib/                   # firebase.ts, geohash.ts, listings.ts, validation.ts
types/                 # index.ts — Listing, SavedItem, LocationCoords
functions/             # Firebase Cloud Functions (scheduled expiry)
```

## Testing

TDD throughout: write failing test → implement → pass → commit.
Tests in `__tests__/` mirroring source structure. Run TestSprite MCP for UI/E2E after each screen is built.

## Environment Setup

`.env.local` is gitignored — never commit. Fill in after `git init`:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

## Skills

| Skill | When to invoke |
|---|---|
| `@mobile-developer` | React Native / Expo patterns and APIs |
| `@expo-best-practices` | Expo-specific pitfalls and config |
| `@uncodixfy` | Before writing any JSX/styling — no generic AI UI |
| `@code-quality` | TypeScript strictness, SOLID review |
| `@github-pr-review` | Creating and reviewing PRs (Plan 07) |
| `@claude-md-architect` | Updating this file after major changes |

## MCP Tools

- **TestSprite** — E2E UI testing after each screen
- **context7** — official Expo, Firebase, React Native docs
- **Playwright** — browser automation for web platform

## Implementation Plans

7 plans in `docs/superpowers/plans/`, execute in order (01→07). Each builds on the last and includes TDD steps + TestSprite validation.
