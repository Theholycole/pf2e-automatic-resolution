# Cantrip / rank 1 batch 14 — numbers in spell notes

2026-09-27. Spell notes (batch 8) refused any spell with a number PF2e could apply. Many of those numbers are really GM territory: a created object's statistics, or a bonus that applies only in a situation. Each numeric sentence is now judged on its own.

## Rules

| Sentence | Handled as | Example (live) |
| --- | --- | --- |
| A created thing's statistics: “The plant has AC 10, Hardness 5, and 20 Hit Points.” (the note goes on the caster) | in the note | Verdant Sprout (1) |
| A bonus whose own clause says when it applies: “… on Deception checks to Create a Diversion”, “… while in dim light”, “… against forced movement”, “At the GM's discretion …” | in the note | Fashionista (1): a rule-less 1-hour note on the target |
| An ending at 0 Hit Points: “If the duplicate ever reaches 0 Hit Points, it's instantly destroyed …” | in the note | Clone Companion (8), Share Life (2) |
| An unconditional bonus to the note's recipient: “Your companion gains a +1 status bonus to Performance checks.” | a `FlatModifier` on the note Effect (saving throws, AC, Perception, attack rolls, initiative or a skill; +1 to +4 status, circumstance or item) | Groom Companion (1): the companion's Performance went from +0 to +1 |
| Temporary Hit Points, resistance, weakness, Speeds, or any other number | the spell stays off the route | Death's Call (1), test |

An instantaneous environment spell that leaves something in the world (it creates, grows or raises something, a wall, a bridge, difficult terrain) now tells the GM on the card to mark the result. Verdant Sprout's card: “GM: mark Verdant Sprout's result on the map …”, and “the spell's result stays in the world”.

**Kept strict (tests):**
- A sentence with an unconditional clause beside a situational one stays blocked (Movanic Glimmer, rank 4).
- A bonus to the caster when the note goes on the target isn't guessed.
- The note Effect refuses any rule other than the generated FlatModifier shape.
- An instantaneous spell with a generated bonus isn't a note.

## Coverage

**Census:** **491 enabled**, unchanged. Note only: 339 non-ritual (346 in scope, 380 installed); cantrips 25, rank 1 85. Effect + note: 108 non-ritual.

**Compile checks:**
- The b97 corpus diff against b96 made 40 previously `unsupported` plans into spell notes. Nine are cantrips or rank 1: Glamorize, Song of Marching, Time Sense, Vector Screen, Fashionista, Groom Companion, Interposing Earth, Reed Whistle and Swarmsense (plus Vanishing Tracks, Verdant Sprout and Weave Wood).
- No plan became or stopped being executable.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

**Test update:** batch 8's strictness test now expects an added “+1 status bonus to AC” to be carried as a rule, and checks refusal with resistance instead.

## Evidence

**Automated:** 536/536 tests pass (`test/cantrip-rank-1-batch-14.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-14-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch14` (the three examples above).

**Regressions:** `cr1Batch8` and `cr1Batch13` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b97
node tools/diff-compiled-plans.mjs /tmp/phase23-b96/official-spell-compiler-report.json /tmp/phase23-b97/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b97/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch14`, then `cleanup`.
