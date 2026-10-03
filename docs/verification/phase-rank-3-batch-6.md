# Rank 3 batch 6 — Hypnotize

2026-10-02. Follows the user's decision of 2026-10-01 that a trigger the module can't detect is a GM control.

| Spell | Now |
| --- | --- |
| Hypnotize (3) | The GM places the 10-foot burst: a sustained lingering area (1 minute). Creatures inside are Dazzled, synced as they move. A creature saves (Will against the spell DC; the GM confirms each exposure) when it's inside as the spell is cast, when it enters, and when it ends its turn inside. It also saves when it uses Seek or Interact on the cloud: the record has a GM control, "a creature used Seek or Interact on the area (target it)". **Failure / Critical Failure:** Fascinated, lasting as long as the area does (leaving doesn't end it; the area's end does). The critical failure adds the reactions note. A creature currently fascinated by this spell gets no new saves. |

## Rules

**Lingering degree areas (`lingering-area-compiler.js`)** gain:
- a listed trigger, "In addition, a creature must attempt a Will saving throw if it is inside the cloud when you cast it, when it enters the cloud, when it ends its turn within the cloud, or if it uses a Seek or Interact action on the cloud.". Each clause must be one of: inside when cast, enters, ends/starts its turn within, or uses an action on the area (`gmAction`);
- "Creatures are Dazzled while inside the cloud." (`memberCondition`, the existing sync);
- "A creature currently Fascinated by hypnotize doesn't attempt new saves." (`skipWhile`).

Those sentences are claimed in their raw form (with links) so the save preamble check sees them.

**Other changes:**
- **A condition "by the cloud" (`duration-compiler.js`):** "The target is fascinated by the cloud." lasts while the area does (`area-ended`).
- **Save route:** `isAreaLifetime`, only in a lingering exposure. The Effect is flagged `areaLifetime` and named "(while the area lasts)"; `clearLeaveArea` removes it when the area ends, not when the creature leaves.
- **Lingering runtime:**
  - `heldBySpell` skips exposures (at the cast, on events, and for the GM's action) while the creature holds that condition from this spell's save;
  - the `gm-action` request and control (the GM's targets; once per creature per turn);
  - validation of `gmAction` and `skipWhile`, where the skipped condition must be one a row applies.

## Tests

967/967 pass. `test/rank-3-batch-6.test.js` is new. It checks:
- the declaration and the area lifetime;
- that an unknown trigger clause or changed riders aren't read.

A whole-corpus compile (b342 → b343) changed only Hypnotize.

## Coverage

**Census:** **1163 enabled** (milestone; 1159 non-ritual), up from 1162. Rank 3: 115 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-6-live-results.json), case `rank3Batch6`, in the `pftest` world.
- **At the cast:** the creature inside was Dazzled and the one outside wasn't; one initial exposure, for the creature inside. Its Will save (−30) was a critical failure: Fascinated, in "Hypnotize: Fascinated (while the area lasts)", with the reactions note.
- **In combat:** its turn ended inside with no new exposure (fascinated by the spell).
- **The GM's control:** "used Seek or Interact" on both creatures. The seeker was added (its Will +60 critically succeeded, no Fascinated). The victim was refused ("already fascinated").
- **Moved out:** Dazzled gone, Fascinated stayed.
- **Ended:** the record ended and Fascinated went.
- **Run note:** the first attempt ran before the page reloaded (a transient tool error), so it used the old module code and refused the plan. The rerun after the reload passed.
- **Cleanup:** fixtures, the combat and the region removed.
