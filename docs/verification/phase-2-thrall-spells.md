# Spells cast through a thrall — verification

2026-09-26. The request was the next largest group in Phases 1–4.

## Choosing the batch

**The largest groups:**
- Phase 3 **Sustain** (146 blocked), **Timed-other** (117) and **Ending or dismissal** (104);
- Phase 2 **Native condition** (116).

These are dominated by one-off mechanisms. The `sustain-effect` spells, for example, move areas, repeat saves or ask a question each round.

**Blockers across Phases 2–4:** the 31 spells blocked only by leftover prose each have a different unclaimed sentence. The most frequent Target wording behind `target-eligibility` is **`1 of your thralls`** (13 spells). It's the one shared rule that frees spells now:
- Necrotic Bomb and Bone Spear (Phase 2 basic-save damage);
- Dead Weight (Phase 2 native condition).

There's no spell-name dispatch.

## Compiler (`src/compiler/thrall-compiler.js`)

The Target must be `1 of your thralls` and the Range must be in feet. Exactly one of these must be present:

| Sentence | Requirement | Becomes |
| --- | --- | --- |
| “Each creature within a N-foot emanation of the (target) thrall takes …/must attempt …” | The item's area is an emanation of N | “Each creature in the area …” |
| “Destroy the target thrall, and each creature in a N-foot line/cone originating from the thrall's former space takes …” | The item's area is that line or cone | “Each creature in the area …” (destroyed) |
| “The target thrall launches itself at a creature within N feet, and the target must attempt a … saving throw.” | No area | “The target must attempt a … saving throw.” (one target) |

- “This destroys the thrall.” / “The (target) thrall is destroyed.” sets `destroyed`, which adds a `thrall-destroyed` card reminder.
- The rewritten text goes to the ordinary save compilers, so any other rule still blocks the spell.
- `plan.targeting.thrall` records the origin, sizes, range and `destroyed`. `executableThrall` checks it against the item's area.

## Runtime (`basic-save-runtime.js`)

When saves are prepared:
- **Choosing the thrall:** `options.thrall`, or the one targeted token, or a dialog asking which targeted token is the thrall.
- **The thrall isn't a save target.** The caster's token must be within the spell's range of it.
- **Distances:**
  - For an emanation, every target must be within its radius of the thrall's token.
  - For a reach, there's one target within that distance.
  - A line or cone is placed by the caster and isn't measured.
- **The card:** records the thrall and names it in the reminder. The module doesn't delete the token.

## Coverage

**New:**
- **Necrotic Bomb:** 10-foot emanation, destroyed.
- **Bone Spear:** 15-foot line, destroyed.
- **Dead Weight:** one creature within 15 feet, Slowed and off-guard by degree, destroyed.

**Census:** **393 enabled**, up from 390.
- Phase 2: 207 of 588.
- Basic-save damage: 25 of 58.
- Native condition: 47 of 162.
- The b60 corpus diff against b59 changed 5 plans:
  - these 3 became executable;
  - Deathly Scream and Bony Barrage lost their target gap but stay blocked.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

**Still blocked in the family:**
- **Deathly Scream:** its narration “While the sound is loud, …” is read as an ongoing trigger. The classifier isn't loosened for one spell.
- **Bony Barrage and Flesh Tsunami:** a second thrall.
- **Blood Infusion and Life Tap:** multi-part outcomes and GM choices.
- **Muscle Barrier and Song of the Soul:** Effects on a creature near the thrall.
- **Thrall Charge:** the thrall's own Strike.
- Created-thrall spells (Phase 6).

## Evidence

**Automated:** 427/427 tests pass.
- `test/thrall-spells.test.js`: the three plans; refusals for a mismatched area and a tampered spec; Deathly Scream still blocked.
- `test/homebrew-guide.test.js` compiles the guide's example.

[Live evidence](phase-2-thrall-spells-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `thrallSpells`:
- **Necrotic Bomb:**
  - A creature 25 feet from the thrall was refused (“more than 10 feet from the thrall”).
  - A thrall 80 feet from the caster was refused (“more than 30 feet from the caster”).
  - With the thrall and one creature beside it targeted, only that creature saved. It failed and lost the full 12, the thrall lost nothing, and the card showed “The thrall (bomb thrall) is destroyed: remove its token.”
- **Bone Spear:** two creatures in the line. The failure lost 8 and the success lost 4. The thrall lost nothing, and the reminder was shown.
- **Dead Weight:** two creatures were refused (“the thrall reaches 1 creature”). One creature within 15 feet failed and became off-guard and Slowed 1.
- **The interface:** on a Necrotic Bomb chat card, with the thrall and a creature targeted, **Prepare Saves** asked “Which targeted token is your thrall?” with both listed. Choosing the thrall prepared saves for the other creature only, with the thrall named in the reminder.
- **Regressions:** `rayCounteract`, `forcedMovement`, `energyByCreature` and `bloodlineDamage` passed. Cleanup left no fixtures.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b60
node tools/diff-compiled-plans.mjs /tmp/phase23-b59/official-spell-compiler-report.json /tmp/phase23-b60/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b60/official-spell-compiler-report.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-b60/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `thrallSpells`, then `cleanup`.
