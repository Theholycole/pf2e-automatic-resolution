# Rank 4 batch 13 — Friends to Foes, Nightmare

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Friends to Foes (4) | Will save for 6d6 mental. **Success:** half damage and Frightened 1. **Failure:** full damage, Frightened 2 and a "can't move closer to its allies" note. **Critical failure:** double damage, Frightened 2, and Confused until no longer Frightened. Each Frightened row has the note "can't reduce Frightened within 10 feet of an ally" (the GM keeps the value). Heightened (7th) five targets. |
| Nightmare (4) | The card says to roll the save when the target next falls asleep. A GM question gives +4 circumstance if the caster knows the target only by name. **Critical success:** immune for 1 week (7 days). **Success:** a note. **Failure:** Fatigued. **Critical failure:** Fatigued, and Drained 2 until no longer Fatigued. |

## Rules

- **Fear of allies (`compile-ability.js`):** "The source of its fear is its allies, and it can't reduce its frightened condition while it's within N feet of an ally." becomes a note on each Frightened row, kept while Frightened.
- **Behaviour while a condition lasts:** "It can't … while <condition>." joins the existing "While X this way …" and "as long as it is X" forms.
- **Row immunity:** "… is unaffected and becomes temporarily immune for …" and "The target suffers no adverse effects and is temporarily immune for 1 week." are read; a week is 7 days.
- **Save timing:** "The next time the target falls asleep, it must attempt a Will save." becomes a `save-timing` reminder, validated in `basic-save-core.js`.
- **Condition text (`description-parser.js`):** "awakens Fatigued" is a condition grant, like "becomes Fatigued".

## Tests

1057 pass. `test/rank-4-batch-13.test.js` is new, with negative cases:
- a fear sentence of another form;
- a month's immunity stays unread.

A whole-corpus compile (b394 → b396) changed only Friends to Foes, Nightmare and Whispers of a Dead Goddess. Whispers' critical-success immunity is now read, but the spell is still blocked by its lingering area.

## Evidence

[Live evidence](phase-rank-4-batch-13-live-results.json), case `rank4Batch13`, in the `pftest` world.
- Friends to Foes at 7th, three targets on one card: Frightened 1, 2 and 2, with 1, 2 and 1 notes. The critical failure was Confused, and Confused ended when its Frightened was removed.
- Nightmare:
  - The reminder was on the card; each target confirmed and given +4.
  - The critical success got a 7-day immunity Effect.
  - The critical failure was Fatigued and Drained 2; removing Fatigued removed Drained.
- **Cleanup:** fixtures removed.
