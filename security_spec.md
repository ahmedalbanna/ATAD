# ATAD Security Specification

## Data Invariants
1. A user profile can only be created by the owner and their UID must match.
2. An asset must have a valid `lenderId` that matches the authenticated user's UID.
3. A rental request must have a `renterId` matching the authenticated user.
4. Rental request status transitions must be logical (e.g., from `pending` to `approved` or `rejected`).
5. Only the lender of an asset or an admin can approve/reject a rental request.
6. Only the renter of a request can mark it as `paid` (after approval).

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Creating a user profile with a different UID.
2. **Role Escalation**: A standard user trying to set `role: 'admin'`.
3. **Ghost Asset**: Creating an asset with someone else's `lenderId`.
4. **Price Tampering**: Updating a rental request's `totalPrice` after it's been created.
5. **Unauthorized Approval**: A renter trying to approve their own request.
6. **Orphaned Rental**: Creating a rental for a non-existent asset.
7. **Negative Rate**: Creating an asset with a negative `dailyRate`.
8. **Status Skip**: Moving a rental from `pending` directly to `completed`.
9. **Update Hijack**: Updating an asset you don't own.
10. **Shadow Field**: Adding `isVerified: true` to a user profile.
11. **PII Leak**: Reading all user profiles as an unauthenticated guest.
12. **Mass Query**: Scraping all rentals without being an admin or participant.

## Test Runner (Draft)
```ts
// firestore.rules.test.ts (simplified logic)
// - expect(createProfileWithOtherUid).toBeDenied()
// - expect(updateOtherUserAsset).toBeDenied()
// - expect(approveOwnRequest).toBeDenied()
```
