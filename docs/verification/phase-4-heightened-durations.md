# Heightened Effect durations — verification

2026-09-26. The Effect route now gives the created Effect the duration the spell's Heightened entries state for the cast rank. It's a rule read from the wording; there's no spell-name dispatch.

## PF2e behaviour this works around

PF2e keeps no heightened duration in spell data: `system.heightening` is null for these spells, and the Heightened entry is text only. Its linked Spell Effect carries the base duration. Before this change, Fly cast at 7th rank created an Effect lasting 5 minutes, although the spell says 1 hour.

Some spells link a second Effect for the heightened rank instead, such as *Spell Effect: Tailwind (8 hours)*. PF2e sets that Effect's own duration to the heightened one.

## Compiler (`src/compiler/heightened-duration-compiler.js`)

**Parsing.** Each fixed-rank `Heightened (Nth)` entry is read for one of these sentences:
- “The (spell's) duration (of this spell) increases to / becomes / is *N rounds|minutes|hours|days*”;
- “… is / increases to / lasts (lasting) until the next time you make your daily preparations” (and “until your next daily preparations”). This becomes 1 day, as PF2e writes it on its own Effects (Mystic Armor, Darkvision (24 hours)).

The sentence can sit inside a longer entry. Several entries form a sequence, and each duration applies from its rank up.

Any other change to the duration marks that entry **unsupported**:
- “unlimited”, weeks or longer;
- a `(+N)` entry;
- two durations in one entry;
- “the duration of familiar form increases …”, “Increase the duration to …”.

These aren't duration changes and are ignored:
- a condition's own duration (“the duration of the deafened condition … increases by 2 rounds”), which the condition-duration rule handles;
- “during the spell's duration”.

**Plan.**
- `plan.lifecycle.heightenedDurations`: `[{minRank, value, unit, raw}]`, recorded for every spell that has entries.
- On the `effect`, `effect-variant`, `effect-choice` and `effect-sequence` routes, every application is checked for every rank it covers, up to 10:
  - The Effect already lasts the expected duration (for example a heightened variant Effect): nothing to do.
  - The Effect lasts the spell's base duration: that rank gets an override, stored as `application.heightenedDuration = {template: {value, unit}, branches: [{minRank, maxRank, value, unit, raw}]}`.
  - Otherwise the rank can't be honoured, and the plan gets `heightened-duration:effect-duration-mismatch`.
- These also keep the plan from being automatic:
  - an unsupported entry (`heightened-duration:unparsed`);
  - a base duration that isn't fixed, or a sustained spell (`heightened-duration:base-not-fixed`);
  - an Effect sequence (`heightened-duration:sequence`).
- Any of these pending codes removes the overrides and turns an `automatic` or `prompted` plan into `guided`. A plan that passes gets `heightened-duration` in `compiledCapabilities`.

## Runtime

- `heightenedEffectDuration(application, templateDuration, castRank)` in `scripts/runtime-core.js` picks the branch for the cast rank. It throws if the live template's duration isn't the one the plan was compiled against.
- `EffectRuntime.execute` passes the result to `prepareNativeEffectSource`. That sets `system.duration.value` and `unit`, keeps the template's `expiry`, and records `runtime.heightenedDuration` on the Effect's module flag.
- Sequence successors never take it. The ongoing-cast tracker reads the created Effect's duration, so it follows the override.

## Coverage

These enabled Effect-route spells carry heightened durations, and all are now honoured:

| Spell | Heightened | How |
| --- | --- | --- |
| Musical Accompaniment (guided) | 2nd: 10 minutes | override |
| Juvenile Companion | 2nd: 1 hour | override |
| Nudge the Odds (guided) | 5th: until daily preparations | override to 1 day |
| Tremorsense | 3rd: 1 hour, 5th: 8 hours | override (sequence) |
| Gecko Grip | 5th: 1 hour | override |
| Angelic Wings | 5th: 1 minute | override |
| Deep Sight | 7th: until daily preparations | override to 1 day |
| Fly | 7th: 1 hour | override |
| Dragon Wings | 8th: 10 minutes | override |
| Tailwind | 2nd: 8 hours | rank variant *Tailwind (8 hours)* |
| Iron Gut (guided) | 3rd: 8 hours | rank variant *Iron Gut (3rd Rank)* |
| Darkvision | 5th: until daily preparations | rank variant *Darkvision (24 hours)* |
| Wings of the Valkyrie (guided) | 5th: 1 minute | rank variant *(Heightened)* |
| Divine Vessel (guided) | 9th: 10 minutes | rank variant *(9th level)* |

The rank-variant compiler already selects the heightened Effect for Tailwind, Iron Gut, Wings of the Valkyrie, Darkvision and Divine Vessel. The new check confirms that each variant's own duration matches the text, so none of them needs an override.

The corpus scan also found Tremorsense (“The spell's duration is …”), Deep Sight and Darkvision.

**Census:** unchanged at **318 enabled**. No route changed.

**Corpus diff:**
- `tools/diff-compiled-plans.mjs` reports 0 changed plans, 0 newly executable and 0 no longer executable.
- No automation level changed. The 14 plans above gained `heightened-duration` capabilities and overrides.
- The speed, escape and every rule-family audit show 0 regressions.

**Not enabled today:** 59 other spells carry parsed heightened durations, and 35 spells have an unsupported duration wording. None has an enabled route. Charm and Possession (save route) and the rest are disabled for other reasons.

## Evidence

**Automated:** 344/344 tests pass.
- `test/heightened-duration.test.js`:
  - the wordings: fixed, sequence, daily preparations, inside a longer entry;
  - refusals: unlimited, weeks, `(+N)`, two durations, familiar form;
  - text that's ignored: condition durations and “during the spell's duration”;
  - Fly, Tremorsense and Deep Sight overrides;
  - Tailwind, Iron Gut, Wings of the Valkyrie and Darkvision variants needing none;
  - forged plans left guided: an unlimited entry, a template with a mismatched duration, a variant with the wrong duration;
  - runtime branch selection and refusal of a changed template;
  - the Effect created at rank 4 and at rank 7.
- `test/homebrew-guide.test.js`: the guide's homebrew heightened-duration buff.
- `test/compiler.test.js`: its test catalog now carries Effect mechanics, as the live catalog does. Without them, a heightened duration can't be proven, and Tailwind and Darkvision would correctly drop to guided.

[Live evidence](phase-4-heightened-duration-live-results.json) on Foundry 14.367 / PF2e 8.5.0, world `pftest`. Each spell was cast on a caster of level 2r−1, heightened with `system.location.heightenedLevel`:

| Cast | Effect | Duration | PF2e remaining |
| --- | --- | --- | ---: |
| Fly 4 | Spell Effect: Fly | 5 minutes | 300 s |
| Fly 7 | Spell Effect: Fly | 1 hour | 3600 s |
| Tremorsense 2 / 3 / 5 | Spell Effect: Tremorsense | 10 minutes / 1 hour / 8 hours | 600 / 3600 / 28800 s |
| Juvenile Companion 2 | Spell Effect: Juvenile Companion | 1 hour | 3600 s |
| Gecko Grip 5 | Spell Effect: Gecko Grip | 1 hour | 3600 s |
| Angelic Wings 5 | Spell Effect: Angelic Wings | 1 minute | 60 s |
| Dragon Wings 8 | Spell Effect: Dragon Wings | 10 minutes | 600 s |
| Musical Accompaniment 2 | Spell Effect: Musical Accompaniment | 10 minutes | 600 s |
| Deep Sight 7 | Spell Effect: Deep Sight | 1 day | 86400 s |
| Tailwind 1 / 2 | Tailwind / Tailwind (8 hours) | 1 hour / 8 hours (no override) | 3600 / 28800 s |
| Wings of the Valkyrie 5 | Wings of the Valkyrie (Heightened) | 1 minute (no override) | 60 s |

The Effect's `system.level` equals the cast rank in every row, and `expiry` stays `turn-start`.

**Regressions:** `durationBuffs` (13 spells at base rank, including Fly 5 minutes, Dragon Wings 1 minute and Angelic Wings 3 rounds) and `reactionBuffs` (4) passed. `cleanup` removed 62 fixture actors and 31 journals, leaving 0 fixture actors.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/heightened
node tools/diff-compiled-plans.mjs /path/to/pre-batch/official-spell-compiler-report.json /tmp/heightened/official-spell-compiler-report.json
node tools/report-enabled-spells.mjs /tmp/heightened/official-spell-compiler-report.json
node tools/audit-condition-coverage.mjs /tmp/heightened/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/heightened/official-spell-compiler-report.json
node tools/report-composition-families.mjs /tmp/heightened/official-spell-compiler-report.json
node tools/report-cross-family-speed.mjs /tmp/heightened/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/speed-family-baseline.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/heightened/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
node tools/report-escape-family.mjs /tmp/heightened/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/escape-family-baseline.json
node tools/report-rule-family.mjs <family> /tmp/heightened/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/<family>-family-baseline.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `heightenedDuration`, then `durationBuffs`, `reactionBuffs` and `cleanup`.
