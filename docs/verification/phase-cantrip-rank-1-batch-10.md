# Cantrip / rank 1 batch 10 — attacks repeated on later turns

2026-09-27. Your direction names repeating actions among the things to handle. These two spells repeat an attack on the caster's later turns, and the module now runs that.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You can attack with your words once when you finish Casting the Spell, and can repeat the attack once on each of your subsequent turns by taking a single action, which has the attack, concentrate, and linguistic traits.” + “After your third attack total, the spell ends.”: the chat card's button becomes **Attack Again (2 of 3)**. In combat it allows one attack per caster turn, up to the total, within the spell's fixed duration, then reads **Attacks Used** | Biting Words (1), Camel Spit (1) |
| “When you attack with biting words, make a ranged spell attack roll against a creature within 30 feet, dealing 2d6 sonic damage if you hit (or double damage on a critical hit).” | Biting Words |
| “… dealing 1d6 acid damage and causing the target to be Dazzled for 1 round if you hit. On a critical hit, you deal double damage and the target takes @Damage[@item.level[persistent,acid]] damage.” (a critical hit is a hit, so it's also Dazzled). An empty Target is one creature | Camel Spit |

**Kept strict (tests):**
- A missing total, or one outside two to five, keeps the spell blocked.
- So does a sustained duration.
- A tampered attack count is refused at inspection.

## Coverage

**Census:** **489 enabled**, up from 487. Rank 1: 150 of 387.
- The b93 corpus diff against b92 changed only Biting Words and Camel Spit (route null → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 526/526 tests pass (`test/cantrip-rank-1-batch-10.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-10-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch10`, run through the spell's own chat card in combat.

**Biting Words:**
- Attacks were made on rounds 1, 2 and 3, one per caster turn.
- A second click on the same turn, and a click on the foe's turn, made no attack.
- A fourth click after round 3 made none.
- The labels read “Attack Again (2 of 3)”, “Attack Again (3 of 3)”, then “Attacks Used” (disabled).
- Damage: the hit dealt 4 (full), the critical hit 4 (2 × 2) and the miss none.

**Camel Spit:** a critical hit dealt 6 (2 × 3), added persistent acid damage (1), and left the target Dazzled.

**Regressions:** `repeatAndFollowUp` (Scorching Blast's Blast Again), `spellAttack`, `attackRowRules`, `cr1Batch3` and `cr1Batch9` passed, with cleanup between them. The run left no P23 fixtures, combats or hazard regions.

## Limits

- The button's state is computed when the card renders. Off the caster's turn it stays enabled and explains why it can't attack yet.
- Out of combat, the attacks aren't tied to turns; only the total and the duration limit them.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b93
node tools/diff-compiled-plans.mjs /tmp/phase23-b92/official-spell-compiler-report.json /tmp/phase23-b93/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b93/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch10`, then `cleanup`.
