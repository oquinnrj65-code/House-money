# Account Approval Policy

## Required behavior

1. Every new registration is created with account status `pending_approval`.
2. A pending account cannot sign in to protected app features, join poker tables, use chat/social features, or access any account APIs. The user should see a clear message that their account is awaiting review.
3. Only an authenticated administrator with the explicit `accounts:approve` permission may approve or reject a request.
4. Approval and rejection happen on the server, not in browser state. Each decision records actor ID, target account ID, prior status, new status, timestamp, and optional reason in an append-only audit trail.
5. Rejected accounts stay blocked. A user may submit a new request or appeal according to the product's documented policy; do not silently convert rejected users to approved.
6. The server must check status on login/session creation and on every protected API request. Hiding buttons in the UI is not access control.
7. Admin accounts require MFA and least-privilege access. Protect approval endpoints with CSRF defenses where applicable, rate limiting, and server-side validation.
8. Avoid collecting sensitive identity documents until the lawful operating model and an appropriate identity-verification provider have been selected. Any age/identity verification requirements must be reviewed for the actual jurisdiction and product.

## Current prototype status

The Admin Console now contains a **demo-only approval queue** with fictional example requests, an add-test-request form, and local approve/reject/reset actions. This queue is stored in the current browser's local storage. It is not connected to a real authentication system, shared database, or login gate. It does not create or approve real accounts.

## Required production implementation

- Add an `account_status` enum or constrained column to the shared user database: `pending_approval`, `approved`, `rejected`, and `suspended`.
- Default every registration to `pending_approval`; never accept a client-supplied status.
- Implement authenticated admin API endpoints for listing pending requests and approving/rejecting a user.
- Check admin role/permission server-side and write immutable audit events for every decision.
- Enforce account status during login/session issuance and on each protected request, including websocket connections and reconnects.
- Add tests proving pending/rejected/suspended accounts cannot enter protected areas and approved accounts can, and test that non-admins cannot approve users.
- Keep all real-money functions disabled until the licensing, legal, payment, identity, and compliance path is approved.

## Acceptance tests

- [ ] Register a new test user; stored status is pending approval.
- [ ] Attempt login as pending user; access is denied with an awaiting-approval message.
- [ ] Attempt protected API calls as pending user; all are denied server-side.
- [ ] Admin sees pending request and approves it; audit event is written.
- [ ] Approved user can sign in and access permitted play-money features.
- [ ] Admin rejects another request; that account stays blocked.
- [ ] Non-admin tries the approval endpoint; server returns forbidden.
- [ ] Revoke/suspend an approved user; active sessions and websocket access are revoked or rechecked.
- [ ] Changes persist across browsers/devices because the database is authoritative.
