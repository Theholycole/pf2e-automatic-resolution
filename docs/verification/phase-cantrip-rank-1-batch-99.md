# Cantrip / rank 1 batch 99 — Hallowed Ground

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Each undead creature in the area takes 1d6 vitality damage and 1d4 spirit damage when you Cast the Spell, with a basic Fortitude save.”: a lingering 10-foot burst for 1 minute; undead inside save when it's cast, and other creatures are unaffected | Hallowed Ground (1) |
| “After that, undead creatures have weakness 1 to vitality damage … while in the area.”: PF2e's Effect (weakness to vitality, ceil(rank/2)) on each undead inside. A creature entering gets it; one leaving loses it | Hallowed Ground |
| “… and your necromancy spells”: a data note, since PF2e's Effect doesn't give it | Hallowed Ground |
| “This spell also automatically attempts to counteract any attempt to raise undead in the area …”: a Counteract reminder | Hallowed Ground |
| “If you Cast this Spell again, any previous hallowed ground you had cast ends.”: recasting ends the previous area | Hallowed Ground |

**Kept strict (tests):**
- Another weakness value isn't read.
- Another weakness type isn't read.
- A missing damage entry isn't read.
- A different trait isn't read.
- A forged member Effect is refused.

## Coverage

**Census:** **580 enabled**, up from 579.
- The b182 corpus diff against b181 changed only Hallowed Ground.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 690/690 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-99-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch99`:
- **When cast:** the undead zombie inside failed and lost 10 (`1d6 vitality + 1d4 spirit`); the living creature was unaffected.
- **The weakness at cast:** the zombie had weakness 1 to vitality.
- **Moves:** the zombie left and a ghoul walked in. At the next turn the zombie had lost the weakness and the ghoul had it.

**Harness problems, fixed:**
- The first attempts placed tokens outside the scene, so the moves were refused. The positions are now on the scene.

**Regressions:**
- `cr1Batch88` (Swampcall) passed.
- `cr1Batch98` (Gust of Wind) failed once when run straight after Swampcall: the flyer's failure wasn't adjusted, most likely because the harness read the card state too early. It passed alone, and again in the same sequence after a 400 ms wait in the harness.
- The runs left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b182
node tools/diff-compiled-plans.mjs /tmp/phase23-b181/official-spell-compiler-report.json /tmp/phase23-b182/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b182/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch99`, then `cleanup`.
