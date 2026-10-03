# Rank 5 batch 13 — Toxic Cloud, Incendiary Fog

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Toxic Cloud (5) | A placed 20-foot burst with Mist's concealment. A creature starting its turn inside makes a basic Fortitude save against 6d8 poison (+1d8 a rank). GM notes: only creatures that breathe, and the cloud drifts 10 feet away from the caster each round (move the region). Dismissable. |
| Incendiary Fog (5) | A placed 20-foot burst with Mist's concealment. When the cloud ignites (an open flame or fire effect in it), the GM's Ongoing control exposes the targeted creatures to a basic Reflex save against 10d6 fire. When those saves are resolved, the spell ends. |

## Rules

- **Borrowed concealment (`borrowed-spell.js` `rewriteBorrowedConcealment`):** "This/The cloud functions as @UUID[…]{Mist}[, except the area moves N feet away from you each round]." is read on a basic-save area when the referenced spell compiles as a concealing area. The sentence becomes Mist's concealment rule for this area, and the drift becomes a note after the area's damage.
- **Breathing creatures (`lingering-area-compiler.js`):** "You deal NdM type damage to each breathing creature that …" is read, with a GM review note. Before, the sentence wasn't matched at all.
- **Ignition:** "If any open flame or fire effect is within the spell's area when it's cast, or later enters or occurs within the area, the cloud ignites." with "Creatures in the cloud take NdM type damage (basic X save), and the spell ends." becomes a GM control (`gmAction` with `endsSpell`) on a concealing cloud.
- **Ending the spell (`ongoing-families.js` `endAfterGmAction`):** the cast ends once every exposure the control made is completed or skipped.
- **Interpretations:** logged in `pending-user-decisions.md`.

## Tests

1097 pass. `test/rank-5-batch-13.test.js` is new, with negative cases: without the referenced Mist, neither spell is read.

A whole-corpus compile (b427 → b428) changed only these two.

## Evidence

[Live evidence](phase-rank-5-batch-13-live-results.json), case `rank5Batch13`, in the `pftest` world, at 5th.
- **Toxic Cloud:** the creature inside is Concealed, with two notes. At the start of its turn a `turn-start` exposure came up; its failed save lost 6d8 poison (30).
- **Incendiary Fog:** the creature inside is Concealed. The ignition control exposed it, and its failed save lost 10d6 fire (36). The record then ended and its concealment was removed.
- **Cleanup:** regions and fixtures removed.
