# House Money — Poker Module Test Plan

Use this plan to test one item at a time after each deployment. The current public site is a static browser prototype; tests here verify the interface and local configuration only, not multiplayer or real-money behavior.

## Phase 1 — Table groups and navigation
- [ ] Poker Room shows exactly 16 tables.
- [ ] Texas Hold'em filter shows HM-01 through HM-04 (4 tables).
- [ ] 5-Card High / Low filter shows HM-05 through HM-08 (4 tables).
- [ ] 4-Card Stud filter shows HM-09 through HM-12 (4 tables).
- [ ] Omaha filter shows HM-13 through HM-16 (4 tables).
- [ ] All 16 filter returns every table.
- [ ] Each table's game variant stays fixed to its assigned group.

## Phase 2 — Admin table settings
Test one table first (HM-01), then repeat on a table from each other group.
- [ ] Change the table display name and save; card and admin list update.
- [ ] Set rake to 3%; save succeeds.
- [ ] Set rake to 20%; save succeeds.
- [ ] Try rake below 3% and above 20%; save is rejected.
- [ ] Change minimum and maximum buy-in; valid range saves.
- [ ] Try minimum buy-in greater than maximum; save is rejected.
- [ ] Change small-blind and big-blind ranges; valid ranges save.
- [ ] Try a big blind less than twice the corresponding small blind; save is rejected.
- [ ] Toggle rebuys off; rebuy inputs are disabled and table card shows rebuys off.
- [ ] Toggle rebuys on and set valid minimum/maximum amounts.
- [ ] Try invalid rebuy limits; save is rejected.
- [ ] Disable a table; it no longer offers the Open demo table action.
- [ ] Re-enable the table and verify it is available again.
- [ ] Refresh the page in the same browser; local settings persist.
- [ ] Open the site in another browser/device; confirm settings do not sync (expected in this prototype).

## Phase 3 — Demo table preview
- [ ] Open an enabled table.
- [ ] Enter a buy-in at the minimum and confirm local preview.
- [ ] Enter a buy-in at the maximum and confirm local preview.
- [ ] Enter an amount outside the configured range; it is rejected.
- [ ] Verify the confirmation explicitly says no account, seat, server game, or balance changed.
- [ ] Confirm no actual rake, bet, or chip transfer occurs.

## Phase 4 — Playable demo rules (browser-only)
- [ ] HM-01–HM-04 all open the same Hold'em rules with the selected table number retained.
- [ ] HM-05–HM-08 all open five-card draw high/low with five private cards, discard selection, one draw, and final betting.
- [ ] HM-09–HM-12 all open four-card stud house rules: four private cards, one betting round, best four-card hand at showdown.
- [ ] HM-13–HM-16 all open Omaha with four private cards and exactly two hole cards plus exactly three community cards for the best hand.
- [ ] Hold'em/Omaha reveal flop (3), turn (1), river (1) over separate betting rounds; verify board grows 0 → 3 → 4 → 5.
- [ ] Verify small/big blinds are posted and the dealer marker advances between hands.
- [ ] Verify check is rejected while facing a bet; call, raise, and fold work during betting rounds.
- [ ] Verify action buttons are only enabled during the phase where they apply.
- [ ] Verify five-card draw allows selecting/discarding cards and then a final betting round.
- [ ] Verify high/low splits the pot when a qualifying low exists and handles tied high/low winners.
- [ ] Verify ties split pots, folded players cannot win, and an uncontested hand awards the pot.
- [ ] Verify chip balance, pot, and remaining human stack do not double-count after multiple hands.
- [ ] Test narrow phone layout and every variant on the standalone poker room page.

**Demo rule note:** five-card high/low and four-card stud use documented House Money demo house rules; this is not a casino-certified engine. Betting is a simplified browser demo against simulated opponents, not full live multiplayer.

## Phase 4 — Production blockers (not implemented yet)
- [ ] Shared database and server-side table configuration.
- [ ] Authenticated admin roles, MFA, and server-side authorization.
- [ ] Server-side validation for every table setting; immutable audit trail.
- [ ] Server-authoritative multiplayer game engine and hand evaluation tests for all four variants.
- [ ] Secure account/session system, rate limiting, monitoring, backups, and recovery tests.
- [ ] Legal/licensing/operator review completed before enabling any real-money features.

**Important:** browser-local configuration is not secure administrative control. Never rely on these UI settings for real-money rake, funds, or production gameplay.
