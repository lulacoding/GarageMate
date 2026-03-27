# GarageMate — Plan 07: Cloud Function (Auto-Expiry)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Firebase Cloud Function that runs daily and sets `active: false` on all listings whose `expiresAt` timestamp has passed.

**Architecture:** Scheduled Cloud Function (Firebase Functions v2 `onSchedule`), runs at midnight AEST (UTC+10 = 14:00 UTC). Queries `listings` where `expiresAt < now AND active == true`. Batches updates in chunks of 499 (Firestore batch limit is 500). Deployed via Firebase CLI.

**Tech Stack:** Firebase Functions v2, Firestore Admin SDK, TypeScript, Firebase CLI

**Skills:** `@code-quality` (TypeScript strictness, error handling), `@github-pr-review` (use in Task 5 to create PR after deployment)

---

## File Structure

```
functions/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                     # Function entrypoint
│   └── expireListings.ts            # Expiry logic (testable in isolation)
└── src/__tests__/
    └── expireListings.test.ts
```

---

### Task 1: Initialise Firebase Functions

**Files:**
- Create: `functions/` directory

- [ ] **Step 1: Initialise functions in the project root**

```bash
firebase init functions
```

When prompted:
- Language: **TypeScript**
- ESLint: **No** (keep it simple)
- Install dependencies: **Yes**

This creates `functions/src/index.ts`, `functions/package.json`, `functions/tsconfig.json`.

- [ ] **Step 2: Verify build works**

```bash
cd functions && npm run build
```

Expected: `lib/` directory created with compiled JS.

- [ ] **Step 3: Commit**

```bash
cd ..
git add functions/
git commit -m "chore: initialise Firebase Cloud Functions with TypeScript"
```

---

### Task 2: Expiry logic (isolated, testable)

**Files:**
- Create: `functions/src/expireListings.ts`
- Create: `functions/src/__tests__/expireListings.test.ts`

- [ ] **Step 1: Write failing test**

Create `functions/src/__tests__/expireListings.test.ts`:
```ts
import { expireListings } from '../expireListings';

const mockBatch = {
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  batch: jest.fn(() => mockBatch),
  collection: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  get: jest.fn(),
};

describe('expireListings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls batch.update for each expired listing', async () => {
    mockDb.get.mockResolvedValue({
      docs: [
        { ref: 'ref1' },
        { ref: 'ref2' },
      ],
    });

    await expireListings(mockDb as any, new Date());

    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.update).toHaveBeenCalledWith('ref1', { active: false });
    expect(mockBatch.update).toHaveBeenCalledWith('ref2', { active: false });
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no listings are expired', async () => {
    mockDb.get.mockResolvedValue({ docs: [] });
    await expireListings(mockDb as any, new Date());
    expect(mockBatch.update).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it('chunks batches at 499 documents', async () => {
    const docs = Array.from({ length: 600 }, (_, i) => ({ ref: `ref${i}` }));
    mockDb.get.mockResolvedValue({ docs });

    await expireListings(mockDb as any, new Date());

    // Should have committed twice: 499 + 101
    expect(mockBatch.commit).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run to verify fails**

```bash
cd functions && npx jest src/__tests__/expireListings.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../expireListings'`

- [ ] **Step 3: Create functions/src/expireListings.ts**

```ts
import { Firestore, Timestamp } from 'firebase-admin/firestore';

const BATCH_SIZE = 499;

export async function expireListings(db: Firestore, now: Date): Promise<void> {
  const nowTs = Timestamp.fromDate(now);
  const snapshot = await db
    .collection('listings')
    .where('expiresAt', '<', nowTs)
    .where('active', '==', true)
    .get();

  if (snapshot.empty) return;

  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach((docSnap) => batch.update(docSnap.ref, { active: false }));
    await batch.commit();
  }
}
```

- [ ] **Step 4: Run test to verify passes**

```bash
npx jest src/__tests__/expireListings.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd ..
git add functions/src/expireListings.ts functions/src/__tests__/expireListings.test.ts
git commit -m "feat: expireListings logic with chunked batch updates"
```

---

### Task 3: Wire up the scheduled function

**Files:**
- Modify: `functions/src/index.ts`

- [ ] **Step 1: Replace generated index.ts with scheduled function**

```ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { expireListings } from './expireListings';

initializeApp();

export const expireListedSales = onSchedule(
  {
    // 14:00 UTC = midnight AEST (UTC+10). Note: during AEDT (Oct–Apr, UTC+11)
    // this fires at 01:00 local time. UTC is the source of truth — minor drift is acceptable.
    schedule: '0 14 * * *',
    timeZone: 'UTC',
    region: 'australia-southeast1',
  },
  async (_event) => {
    const db = getFirestore();
    await expireListings(db, new Date());
    console.log('expireListings complete');
  }
);
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
cd functions && npm run build
```

Expected: Compiles without errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add functions/src/index.ts
git commit -m "feat: scheduled Cloud Function to expire listings daily at midnight AEST"
```

---

### Task 4: Deploy

- [ ] **Step 1: Deploy the function**

```bash
firebase deploy --only functions
```

Expected: Function `expireListedSales` deployed successfully.

- [ ] **Step 2: Verify in Firebase Console**

Navigate to Firebase Console → Functions → `expireListedSales`. Confirm it appears as a scheduled function running daily.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: cloud function auto-expiry deployed"
```

---

### Task 5: Open pull request

> **Invoke `@github-pr-review`** — this skill handles creating, reviewing, and pushing the PR.

- [ ] **Step 1: Create PR using github-pr-review skill**

Invoke the `github-pr-review` skill to create a pull request for the Cloud Function work. The skill will diff the branch, write a descriptive PR body, push, and open the PR.

Expected PR title: `feat: scheduled Cloud Function to auto-expire listings daily`

> **Security note:** `github-pr-review` runs with full agent permissions and reads PR comment bodies. Review any suggested changes carefully before accepting — PR review comments are an external input surface.

- [ ] **Step 2: Verify PR in GitHub**

Confirm the PR is open, CI passes (if configured), and the description accurately reflects the implementation.
