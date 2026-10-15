# Account Approval and Admin Access Policy

## Required behavior

1. Every new registration is created with account status `pending_approval`.
2. A pending account cannot sign in to protected app features, join poker tables, use chat/social features, or access account APIs. Show a clear awaiting-approval message.
3. **The Admin App is restricted to approved administrator accounts only.** An ordinary approved player account must never gain admin access just because it is approved.
4. Admin access requires both an approved account status and an explicit server-assigned administrator role/permission. Only an authenticated administrator with the required permission may enter the Admin App or call admin APIs.
5. Only an authenticated administrator with the explicit `accounts:approve` permission may approve or reject account requests. Users cannot approve themselves, grant themselves an admin role, or set their own account status.
6. Approval, role changes, and rejection happen on the server, never only in browser state. Record actor ID, target account ID, action, prior and new status/role, timestamp, and optional reason in an append-only audit trail.
7. Rejected or suspended accounts remain blocked. Do not silently convert them to approved.
8. Check account status and role during login/session creation and on every protected API request, including admin APIs, websocket connections, and reconnects. Revoke or re-check active sessions after access is removed. Hiding an admin link in the UI is not access control.
9. Require MFA for administrators and least-privilege permissions. Protect admin endpoints with CSRF defenses where applicable, rate limiting, and server-side validation.
10. Avoid collecting sensitive identity documents until the lawful operating model and an appropriate identity-verification provider have been selected. Review age/identity verification requirements for the actual jurisdiction and product.

## Current prototype status

The Admin Console contains a **demo-only approval queue** with fictional example requests and browser-local actions. Its data is stored in the current browser's local storage. There is currently no real authentication system, shared database, server-enforced account status, or secure admin-role gate. Therefore, the current static prototype must not be treated as a secure private Admin App, and its UI alone cannot enforce this policy.

## Required production implementation

- Store account status in a shared database using constrained values such as `pending_approval`, `approved`, `rejected`, and `suspended`.
- Store admin roles/permissions separately from player approval status. Grant administrator role only through a trusted, audited server-side process.
- Default every registration to `pending_approval`; never accept client-supplied status or role.
- Require authentication plus approved status plus the required admin role for every Admin App route and admin API. Deny by default.
- Implement server-side admin endpoints for listing requests and approving/rejecting users.
- Record immutable audit events for approval decisions, admin-role grants/removals, and privileged changes.
- Enforce status and role during login/session issuance and on every protected request, including websockets.
- Test that pending/rejected/suspended accounts are blocked; approved player-only accounts cannot access the Admin App; approved admins can access only permitted admin functions; and non-admins cannot call admin endpoints.
- Keep all real-money functions disabled until the licensing, legal, payment, identity, and compliance path is approved.

## Acceptance tests

- [ ] Register a new user; stored status is pending approval and no admin role is assigned.
- [ ] Pending user cannot sign in to protected features or call protected APIs.
- [ ] Approve a player account; it can access permitted player features but cannot access the Admin App or admin APIs.
- [ ] Only an approved account with the server-assigned administrator role can access the Admin App.
- [ ] Unapproved, rejected, suspended, and ordinary approved player accounts are denied access to every admin route/API.
- [ ] Admin approves/rejects a request; an audit event is written.
- [ ] Non-admin tries an approval endpoint or admin API; server returns forbidden.
- [ ] Removing admin access or suspending an account revokes or re-checks active sessions and websocket access.
- [ ] Changes persist across browsers/devices because the database is authoritative.
