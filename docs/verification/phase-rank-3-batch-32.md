# Rank 3 batch 32 — Time Jump, Cloud Dragon's Cloak, Shadow Jump

2026-10-02. Part of the user's ranks 3–5 pass. (Shadow Jump is rank 5; it's batched here with the two other mention-only notes.)

| Spell | Now |
| --- | --- |
| Time Jump (3) | A note card. The 2 move-only actions and the paused time are the GM's; Stupefied 4 applies only if it's cast again within 1 minute (a mention, not applied now). |
| Cloud Dragon's Cloak (3) | A 1-round note on the creature targeted by the ranged attack: it's treated as Hidden for resolving that attack and ranged attacks against it (the attacker's flat check). |
| Shadow Jump (5) | A note card for the teleport. At 8th the caster may choose to become Invisible on arrival; that's in the note. |

## Rules

- **Spell notes (`spell-note.js`):**
  - Three condition mentions: a recast's condition ("if you use … again within N minute(s) of using the spell, you become @C"), an optional condition on arrival, and "treated as @C for the purposes of resolving the triggering attack".
  - "the creature targeted by the attack" is a single-creature target.
- **Targets (`target-predicate-compiler.js`):** "the creature targeted by the attack" is the reaction's creature.
- **Interpretation (logged):** Shadow Jump's optional Invisible.

## Tests

1067 pass. `test/rank-3-batch-32.test.js` is new, with a negative case: Time Jump's Stupefied stated as a grant stays blocked.

A whole-corpus compile (b400 → b402) changed only these three.

## Evidence

[Live evidence](phase-rank-3-batch-32-live-results.json), case `rank3Batch32`, in the `pftest` world.
- Time Jump: the card mentions Stupefied 4; the caster isn't Stupefied.
- Cloud Dragon's Cloak on an ally: a 1-round note; the ally isn't Hidden.
- Shadow Jump at 8th: the card mentions Invisible; the caster isn't Invisible.
- **Cleanup:** fixtures removed.
