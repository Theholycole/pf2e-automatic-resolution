# Cantrip / rank 1 batch 2 — verification

2026-09-26. The second batch of the cantrip-and-rank-1 pass.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| “For the duration of the spell, the target must attempt a Fortitude save at the beginning of its turn.”: the degree table at the start of each of the target's turns, with no save when cast; the sustained spell ends without Sustain | Sting of the Sea (cantrip) |
| “The target takes a –2 penalty to Perception checks involving vision until the end of its turn.”: PF2e's row Effect (visual Perception), with a data note for its circumstance type | Sting of the Sea |
| **Timing fix:** “until the end of its turn” applied during that creature's own turn now ends with that turn (it lasted a whole extra turn) | Sting of the Sea's Dazzled and Effect; any such row |
| Weapon targets: PF2e's Effect goes on the weapon's wielder, and PF2e's prompt picks the weapon | Runic Weapon, Serrate, Conductive Weapon (target the wielder); Shillelagh (your own club or staff) |
| “The target becomes a +1 striking weapon, gaining a +1 item bonus …” / “a +1 shock weapon” / “Strikes with the target weapon deal an additional 1d4 slashing damage …”: proved by the Effect's rune, property-rune and damage-dice rules at the cast rank | Runic Weapon, Conductive Weapon, Serrate |
| Serrate: “until the start of your next turn” while PF2e's Effect lasts to the end of it (a data note) | Serrate |
| **Guard:** an unproven “a +N … weapon” sentence blocks (`weapon-runes`). Before, the Effect route didn't check it | |

**Kept strict (tests):**
- A “+2 striking” claim the Effect doesn't give is refused, and so is a die that differs.
- A save statistic other than the item's isn't the turn trigger.
- Weapon Surge (“your next Strike”) and Echoing Weapon stay blocked.

## Coverage

**Census:** **473 enabled**, up from 468. Cantrips: 55 of 120. Rank 1: 135 of 387.
- The b85 corpus diff against b84 changed seven plans:
  - enabled: Sting of the Sea (lingering) and the four weapon spells (Effect route);
  - still blocked: Weapon Surge and Echoing Weapon (pending codes only).
- The diff tool's route field covers one-time saves only, so none show there.
- No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 508/508 tests pass.
- `test/cantrip-rank-1-batch-2.test.js` covers the turn saves, the vision Effect and both weapon targets with their refusals.
- `test/condition-timing.test.js` covers the same-turn turn-end timing.

[Live evidence](phase-cantrip-rank-1-batch-2-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch2`:
- **Sting of the Sea (in combat):**
  - No save when cast.
  - On the target's turn, a success gave “Spell Effect: Sting of the Sea” (Perception −2) lasting 0 rounds to its turn's end, and the card showed the PF2e data note.
  - The Effect was gone on the caster's next turn, when the caster Sustained.
  - On the target's next turn a failure made it Dazzled, which ended with that turn.
  - End removed the record.
  - A first run showed both lasting a whole extra turn, which led to the timing fix.
- **Runic Weapon:** the ally's prompt offered Club and Longsword. The Longsword became “+1 Striking Longsword” (potency 1, striking 1, damage 2d8 slashing), and the club was unchanged.
- **Serrate:** the ally's club dealt 1d6 bludgeoning + 1d4 slashing, with the duration note.
- **Shillelagh:** PF2e picked the caster's only club itself (potency 1, striking 1).
- **Conductive Weapon:** the Longsword became “+1 Shock Longsword” (1d8 slashing + 1d6 electricity). A harness fault first had a leftover prompt-watcher answer this prompt with the club; the watcher now stops.
- **Regressions:** `durationBuffs`, `rank2Batch2`, `rank1Batch1` (Wooden Fists, Ant Haul), `terrainBatch1`, plus the timing fix's `lingering`, `sustainedConditions`, `terrainBatch2`, `cr1Batch1`, `reactionBuffs`, `degreeChoiceAndRift` and `attackConditionRiders`. All passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b85
node tools/diff-compiled-plans.mjs /tmp/phase23-b84/official-spell-compiler-report.json /tmp/phase23-b85/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b85/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch2`, then `cleanup`.
