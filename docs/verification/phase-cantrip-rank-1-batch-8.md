# Cantrip / rank 1 batch 8 — spell notes

2026-09-27. Your direction was that whatever the module can't carry out mechanically becomes a generated note Effect with the right duration. A spell placed in the environment puts the reminder on the caster, with a note to mark the area on the map. Scope: all ranks, reported apart.

## Rules

A spell qualifies only when all of these are absent:
- a save, the attack trait, damage entries or linked PF2e Effects;
- `@Damage`, linked conditions or counteracting;
- damage or healing dice;
- any number PF2e could apply: a bonus or penalty, resistance, weakness, Hardness, Hit Points, a Speed or AC.

The route runs only where no other route compiled. **Apply Spell Note** on the card then does the following.

| Rule | Example (live) |
| --- | --- |
| A creature Target line: a rule-less “Spell Note: <spell>” Effect on each target, holding the spell's text, for the spell's duration. More targets than the line allows are refused | Sanctuary (1): a 1-minute note on the target, none on the caster; 2 targets refused |
| An area, template, place or thing, or (with no Target line) a wall, cloud, zone or terrain: “Spell Note: <spell> (area)” on the caster. The Effect and the card say “mark … area on the map” | Wall of Shrubs (1) |
| Sustained: the maximum duration, with PF2e's `sustained` flag and a line to remove it when Sustaining stops | Summon Animal (1): 1 minute, sustained |
| Heightened: the highest fixed entry reached, and each interval with its count, go in the text. An applying “The duration of the spell is 1 hour” sets the duration, and “you can target up to five creatures” raises the target count | Share Lore at 3rd: four targets, 1 hour, “Heightened (3)” text |
| Unlimited duration | Sigil (cantrip): unlimited, area note |
| Instantaneous: the card only, no Effect and no “mark the area” line | Detect Magic (cantrip) |

**Kept strict (tests):**
- Electric Arc (a save with damage) isn't a note.
- Adding a “+1 status bonus to AC” or “1d6 fire damage” to Sanctuary's text takes it off the route.
- The Effect builder refuses a missing duration, empty text or a zero duration.

## Coverage

**Census: 486 enabled, unchanged. Note-only spells are counted apart:**
- 294 non-ritual (300 in the 1,870-spell scope, 330 installed): 18 cantrips and 77 rank 1 in scope.
- The status and by-rank docs have a “Note only” column and list.

**Compile checks:**
- The b91 corpus diff against b90 changed exactly 330 plans, all previously `unsupported`.
- No plan became or stopped being executable.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 521/521 tests pass (`test/cantrip-rank-1-batch-8.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-8-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch8`. It covers the six examples above:
- every Effect had 0 rules;
- the Sanctuary card read “Note Effect on … (1 minute)”;
- Detect Magic created nothing.

**Regressions:** `rank1Batch6`, `rank1Batch10`, `cr1Batch6` and `foodHealing` (Effect, direct-damage, note-row and food routes) passed, with cleanup between them. The run left no P23 fixtures or combats.

## Limits

- The note doesn't enforce anything. A sustained note isn't removed automatically when Sustaining stops; its description says to remove it.
- Heightened wording other than the fixed-duration and target-count forms above is shown as text only (e.g. Sigil's “fades after 1 month”).

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b91
node tools/diff-compiled-plans.mjs /tmp/phase23-b90/official-spell-compiler-report.json /tmp/phase23-b91/official-spell-compiler-report.json
node tools/report-enabled-spells.mjs /tmp/phase23-b91/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b91/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch8`, then `cleanup`.
