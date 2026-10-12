# Family sharing (design, not built yet)

Status: proposal for review. Step 1 (groundwork) has shipped; step 2 is below.

## Why not logins

An email-and-password account means we run a server that holds health data. That brings Health Information Privacy Code duties, breach risk and a support load, and it breaks the promise that sets Hey Baby apart: we never see your data. Two caregivers can share a baby log without either of them having an account with us.

## What's already in place (step 1)

- Every baby log entry can carry `by`: the name set once per phone ("Who's logging on this phone?"). The log shows "Feed · Sam".
- Entries carry `editedAt` when changed after being added, and deletions are kept for 60 days in `baby-log-deleted`.
- Sync merges the baby log entry by entry (`mergeLogs` in `src/lib/babyLog.ts`, used by `combine` in `src/lib/sync/engine.ts`) instead of asking which whole log to keep. Today that works for two phones on the same Google account and recovery code.

## Step 2: pairing code and an encrypted relay

1. **Create a family.** Caregiver 1 taps "Share with a partner". The app makes a random family ID (128 bits) and a family key (256 bits), and shows them as a QR code (and a short code to type).
2. **Join.** Caregiver 2 scans the code. No email, no password. Both phones now hold the same family key, in IndexedDB, never sent anywhere.
3. **Relay.** A small route on our Worker, `/api/family/<id>`, stores one blob per family in Workers KV or R2 (free plan). The blob is encrypted on the phone with the family key using the same AES-GCM code as sync (`src/lib/sync/crypto.ts`). The server only ever sees ciphertext, the family ID and the blob size.
4. **What's shared.** Baby log, deletions, immunisations done, firsts and care team numbers. The journal and pregnancy data stay private unless someone ticks them.
5. **Merging.** Each phone downloads the blob, decrypts it, merges per entry (the step 1 merge), re-encrypts and uploads with a version check (`If-Match`), retrying on a clash, just like Drive sync.
6. **Leaving.** Either phone can leave (forgets the key) or delete the family (deletes the blob). The blob is also deleted after 90 days without a write.

## Open questions for review

- KV (simpler, eventually consistent) or R2 with conditional writes (stronger version check)? R2 is the safer fit for merge-and-retry.
- Rate limits per family ID, so the endpoint can't be used as free storage.
- Whether a family can have more than two members (grandparents, nanny). The design allows it; the UI would need a member list.
- Privacy policy and onboarding wording: the server stores encrypted data for the first time.
