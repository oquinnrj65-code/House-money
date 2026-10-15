# House Money

Web-first prototype for a poker room, sports game-lines display, admin console, and security checklist.

## Current state

This repository contains a **front-end demonstration only**. It uses static illustrative sports odds and local-only poker interactions. It does not connect to a backend, database, authentication provider, sports data API, payment processor, wallet, or wagering engine.

**No real-money deposits, wagers, withdrawals, or cash games are implemented.** Do not use this prototype to accept real-money play.

## Run locally

Open `index.html` in a modern browser, or serve the repository directory with any basic static web server. No build step is required.

## Modules

- **Poker Room:** illustrative community cards and local demo actions.
- **Game Lines:** sample matchups and odds-like values, explicitly not live data.
- **Admin Console:** sample operations dashboard, not authenticated or connected to real systems.
- **Security Center:** implementation checklist, not a deployed security control.

## Production roadmap

1. Confirm jurisdiction and obtain specialist gaming-law advice for the precise business model.
2. Choose a lawful operating route: licensed operator partnership or independently licensed operation where available.
3. Select commercial sports data provider and confirm display/redistribution rights.
4. Design backend API, PostgreSQL schema, authentication and role-based authorization.
5. Implement server-authoritative play-money poker with deterministic hand evaluation and tests.
6. Add sports feed ingestion, timestamps, source attribution, stale-feed handling and monitoring.
7. Add audit logging, rate limiting, backups, security testing and incident response.
8. Keep all real-money functionality disabled until legal, licensing, payment, identity, geolocation and compliance requirements are independently verified.

## Security

Never commit API keys, passwords, private keys, production data or secrets. Admin authorization must be enforced on the server, not merely by hiding UI elements. Do not represent the demo admin screen or checklist as production security.
