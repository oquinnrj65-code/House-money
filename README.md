# House Money

Web-first prototype for a poker room, sports game-lines display, admin console, and security checklist.

## Current state

This repository contains a **front-end demonstration only**. It uses static illustrative sports odds and local-only poker interactions. It does not connect to a backend, database, authentication provider, sports data API, payment processor, wallet, or wagering engine.

**No real-money deposits, wagers, withdrawals, or cash games are implemented.** Do not use this prototype to accept real-money play.

## Run locally

Open `index.html` in a modern browser, or serve the repository directory with any basic static web server. No build step is required.

## Modules

- **Poker Room:** 16 configured tables split into four fixed groups of four: Texas Hold'em, 5-Card High / Low, 4-Card Stud, and Omaha. Each table has its own admin-editable demo rake setting (3–20%), buy-in range, small-blind range, big-blind range, enabled/disabled status, and rebuy toggle/range. Settings are saved in the current browser only; no rake is collected and no multiplayer game engine is connected.
- **Game Lines:** sample matchups and odds-like values, explicitly not live data.
- **Admin Console:** per-table poker settings and a demo new-account approval queue. Both are stored in this browser only and are not connected to real systems. Production registration must default to pending approval and the server must block pending/rejected accounts.
- **Security Center:** implementation checklist, not a deployed security control.

## Production roadmap

1. Confirm jurisdiction and obtain specialist gaming-law advice for the precise business model.
2. Choose a lawful operating route: licensed operator partnership or independently licensed operation where available.
3. Select commercial sports data provider and confirm display/redistribution rights.
4. Design backend API, PostgreSQL schema, authentication and role-based authorization; move table configuration and account approvals to a shared database with server-side validation and immutable admin audit logs. All new accounts must remain pending until approved by an authorized admin.
5. Implement server-authoritative play-money poker for all four variants, with deterministic hand evaluation, seat management, turn timers, chip ledger, reconnect handling, and automated tests.
6. Add sports feed ingestion, timestamps, source attribution, stale-feed handling and monitoring.
7. Add audit logging, rate limiting, backups, security testing and incident response.
8. Keep all real-money functionality disabled until legal, licensing, payment, identity, geolocation and compliance requirements are independently verified.

## Security

Never commit API keys, passwords, private keys, production data or secrets. Admin authorization must be enforced on the server, not merely by hiding UI elements. Do not represent the demo admin screen or checklist as production security.
