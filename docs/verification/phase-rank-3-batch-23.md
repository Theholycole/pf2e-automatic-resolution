# Rank 3 batch 23 — Bottomless Stomach, Peaceful Bubble, Hunter's Vision, Shared Invisibility

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Bottomless Stomach (3) | A note. "When … the target falls Unconscious, the contents … are disgorged" mentions a state; it doesn't grant one. |
| Peaceful Bubble (4) | A note. "Those sleeping 8 hours reduce their Doomed condition by 2 instead of 1." is a rest rule the GM applies. |
| Hunter's Vision (5) | A note. The Concealed, Invisible and Hidden mentions are what the caster sees through. The target is "1 hunted prey", the caster's pick. |
| Shared Invisibility (3) | The caster and up to 5 willing creatures (10 from 5th) are Invisible for 10 minutes (1 hour from 5th). Leaving the emanation and the hostile-action end are the note's. |

Side effect: "you and up to N willing creatures" targets now compile. That completes Part the Mists to Paradise's note; Migration, Forest of Gates and Sacred Covenant stay blocked.

## Rules

- **`spell-note.js` mentions:**
  - "the target falls @C, the contents";
  - "@C creatures in the area don't attack anyone";
  - "due to lighting or the @C or @C conditions" and "isn't automatically @C from you due to darkness";
  - "Those sleeping N hours reduce their @C condition by N instead of N."
- **`spell-note.js` grant:** "You and all targets are @C except to each other as long as the targets remain within the emanation." gives recipient `self-and-targets`.
- **Runtime:** the condition-note runtime applies a `self-and-targets` grant to the caster and its targets, limited by `spellNoteTargetLimit`. That limit now reads "The targets increase to you and up to N willing creatures." (caster included).
- **Targets:** "1 hunted prey"; "you and up to N willing creatures".

## Tests

1028 + 2 = 1030 pass. `test/rank-3-batch-23.test.js` is new, with a negative case: a rest rule that increases a condition isn't a mention.

A whole-corpus compile (b377 → b378) changed these four plus the four target-line side effects above.

## Evidence

[Live evidence](phase-rank-3-batch-23-live-results.json), case `rank3Batch23`, in the `pftest` world. It passed on the first run.
- **The three notes:** each was made.
- **Shared Invisibility at 3rd:** the caster and two allies were Invisible for 10 minutes.
- **Shared Invisibility at 5th:** the condition lasted 1 hour.
- **Six allies at 3rd:** refused.
- **Cleanup:** fixtures removed.
