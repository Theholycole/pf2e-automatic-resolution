# Rank 3 batch 4 — Stinking Cloud

2026-10-02.

| Spell | Now |
| --- | --- |
| Stinking Cloud (3) | The GM places the 20-foot burst, which becomes a lingering area for 1 minute. As Mist, it conceals every creature inside, with others concealed to them; this is synced as creatures move. A creature that ends its turn inside is exposed, and the GM confirms it. It rolls Fortitude against the spell DC. **Success:** Sickened 1. **Failure:** Sickened 1 and Slowed 1 while in the cloud. **Critical Failure:** Sickened 2 and Slowed 1 until it leaves the cloud. The Slowed is in an Effect tied to the area, so leaving removes it; the Sickened stays and recovers normally. |

## Rules

- **A spell that "functions as" another (`borrowed-spell.js`, new rewrite before the save compilers):** "The cloud functions as Mist except it sickens creatures that end their turns within the cloud." is read from the referenced spell's own text.
  - Only when Mist compiles as a concealing area (the existing `concealing-area.js`, which matches Mist's concealment sentence) is the sentence rewritten. It becomes that rule for this spell's area, plus the change as the area's trigger: "A creature that ends its turn within the cloud must attempt a Fortitude save."
  - "(The Concealed condition is not a poison effect.)" is claimed when the spell has that trait.
  - The referenced spell comes from a new compile option, `referencedSpells` (uuid → source). `tools/compile-official-content.mjs` supplies every spell. The module's `compile` loads the spells a description names (`fromUuid`) before compiling.
- **Lingering degree areas (`lingering-area-compiler.js`):** the degree-save branch now reads the concealment sentence, which only the basic-damage branch did before.
- **"While in the area" conditions:**
  - The save route accepts the leave-area lifetime (`isLeaveAreaLifetime`), but only in a lingering area's exposure.
  - The condition is applied in its own Effect, flagged `leaveArea` with the area's cast id and named "(while in the area)". The area's existing `clearLeaveArea` removes it when the creature leaves.
- **Which conditions the phrase limits (`duration-compiler.js`):** "Sickened 1 and Slowed 1 while in the cloud" used to put both on the leave-area lifetime. Now a condition with its own way to end (Sickened's retching, Frightened's decrease) keeps that when another condition stands between it and the phrase. Infinitesimal Collapse Field's "Encumbered and Slowed 1 while in the area" still limits both; its plan is unchanged. **This is an interpretation of the text**, recorded here for review.

## Tests

963/963 pass.
- `test/rank-3-batch-4.test.js` is new. It checks:
  - the cloud's plan;
  - that without Mist's source, or with Mist changed so it doesn't conceal, it isn't a cloud;
  - that changed riders aren't read;
  - Infinitesimal Collapse Field keeping both conditions.
- `test/compiler.test.js` was updated: its event-expiration test expected both of Stinking Cloud's failure conditions to end on leaving, and now expects only the Slowed.

A whole-corpus compile (b339 → b341) changed only Stinking Cloud.

## Coverage

**Census:** **1161 enabled** (milestone; 1157 non-ritual), up from 1160. Rank 3: 113 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-4-live-results.json), case `rank3Batch4`, in the `pftest` world.
- **The plan:** lingering save, concealment, a `turn-end` event.
- **At the cast:** the creature inside was Concealed and the one outside wasn't; no save then.
- **In combat:** the victim's turn ended inside, and one exposure was pending ("ended its turn in the area"). Its save (Fortitude −30) was a critical failure: Sickened 2 and Slowed 1, the Slowed in "Stinking Cloud: Slowed 1 (while in the area)".
- **Moved out:** Sickened 2 stayed; Slowed and the concealment went.
- **End:** the record ended.
- **Cleanup:** fixtures, the combat and the region removed.
