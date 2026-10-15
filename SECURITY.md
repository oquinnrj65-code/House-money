# Security Policy

## Scope

House Money is an early prototype. The current front end has no production backend, user accounts, database, or real-money features.

## Reporting

Do not submit passwords, tokens, identity documents, payment information, or other sensitive data in public issues. For a discovered vulnerability, contact the project owner privately through a verified private channel before sharing exploit details.

## Required controls before production

- Server-side authentication and authorization; MFA for administrators.
- Least-privilege role separation and auditable administrative actions.
- Secrets stored in deployment environment or a dedicated secret manager, never source control.
- HTTPS, secure cookies, CSRF protections where applicable, input validation, and rate limits.
- Dependency and static analysis scans, plus independent penetration testing.
- Encrypted backups with tested restoration and a documented incident-response process.
- Privacy/data-retention review and applicable age, identity, geolocation, anti-fraud, AML and responsible-gambling controls where legally required.
- Independent legal confirmation and applicable licensing before any real-money functionality is enabled.

The checklist is a plan, not evidence that these controls are already deployed.
