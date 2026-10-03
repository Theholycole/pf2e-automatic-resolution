# Rank 3 batch 13 — Battlefield Persistence, Tempest Cloak, Repel Metal

2026-10-02. Part of the user's ranks 3–5 pass. Three Effect + note spells whose text is now proved against PF2e's Effects (automatic).

| Spell | Now |
| --- | --- |
| Battlefield Persistence (3, focus reaction) | PF2e's Effect on the caster: +2 status to saving throws. It's removed once the caster's next saving throw (the triggering one) is posted. The incapacitation rule is the note. |
| Tempest Cloak (3) | PF2e's Effect on the target: its aura, +2 circumstance AC against physical ranged attacks, and +2 circumstance to AC and saves against auditory effects. The note says the 5-foot burst around the target is difficult terrain and moves with it. |
| Repel Metal (4, focus reaction) | PF2e's Effect on the target: +2 circumstance AC, removed once the next attack roll against it is posted (the triggering attack). Reflecting a missed Strike at the attacker is the note. The target becomes immune to the spell for 10 minutes; a recast on it is refused. |

## Rules

**`effect-note-proof.js`:**
- Readers for:
  - "+N bonus to the triggering save, and if … incapacitation …, … N levels higher" (`endsAfterSave`, with a note);
  - "+N bonus to AC against the triggering attack" (`endsAfterAttack`);
  - Tempest Cloak's aura sentence (with its terrain note) and its two AC sentences;
  - "The target then becomes immune to this spell for N minutes.".
- The reflection sentence is a note pattern.
- A reader may now add a note.
- An opening sentence with no rule words counts as narration.
- A `PROOF_DEBUG` environment variable makes Node print the unproved sentence (it's inert in the browser).

**Runtime:**
- The Effect carries `endsAfterSave` / `endsAfterAttack`. `main.js` removes it after the creature's next saving-throw message, or the next attack roll against it (the same hook as batch 7's `nextAttack`).
- A proved immunity with no separate subject goes on the recipients, and an immune recipient is refused.

## Tests

989 + 2 pass. `test/rank-3-batch-13.test.js` is new. It checks:
- the three proofs;
- that a changed bonus isn't proved.

A whole-corpus compile (b358 → b360) changed only these three.

## Coverage

**Census:** **1177 enabled** (milestone; 1173 non-ritual), up from 1174. Rank 3: 123 of 261; rank 4: 114 of 285.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-13-live-results.json), case `rank3Batch13`, in the `pftest` world.
- **Battlefield Persistence:** Reflex +2 with the note. After a Will save, the Effect was gone and the bonus back to 0.
- **Tempest Cloak:** the Effect (Aura plus two FlatModifiers) with the terrain note.
- **Repel Metal:** AC +2 and the immunity Effect. After an attack-roll message against the target, AC was back. A recast was refused ("temporarily immune").
- **Run note:** the first run read the wrong Effect (the separate note Effect) and found the immunity missing, which led to the recipients fix. The second run passed.
- **Cleanup:** fixtures removed.
