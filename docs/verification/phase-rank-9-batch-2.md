# Rank 9 batch 2 — the user's answers: adventure rituals, GM commands

2026-10-03. Ranks 6–10 pass, after the user's answers to its questions.

| Change | Now |
| --- | --- |
| Adventure rituals (user: "leave adventure rituals to be handled by the GM; adventures often have more information in their books") | An uncommon, rare or unique ritual published in an adventure (or a Lost Omens setting book) that no other route resolves is a GM note: casting it whispers its text to the GM with "this ritual's rules come from its adventure or book; resolve it at the table". Read from the item's rarity and publication, not its name. In scope: Terminate Bloodline, Rite of the Red Star, Raga of Remembrance, Purify Tanglebriar, Perfection of Essence, Mindscape Shift, Transmigrate (the last two have no rules text in PF2e). 30 out-of-scope adventure rituals get the same card. Rulebook rituals are unchanged. |
| Catch Your Name (user: "resolve by commands to the GM") | The speaker's Will save; a failure whispers the GM to give the caster's player that creature's private name (not its true name) and precise location. The trigger, requirement and awareness rules are a GM reminder. |
| Telepathic Demand | Suggestion's rows: a critical success whispers the GM that the creature knows it was targeted; a failure (1 minute) or critical failure (1 hour) whispers the GM that it follows the caster's message as a suggestion, with a note for that time. Immune for 1 day on a success, 30 days (a month) on a critical success. "A creature you've telepathically contacted before" is the GM's yes/no on the target. |
| Teleport-only rows (user: count them with a GM reminder only when the distance is in miles or more) | Recorded. No spell resolves by it yet: Collective Transposition moves targets within a 30-foot area (on the map), so it stays unresolved. Forest of Gates' rows teleport miles, but its night's-rest healing still needs building. |

Runtime: a note can carry a "gm-command" reveal (whispered to the GM only when the row applies). The note card of a GM ritual is whispered to the GM.

## Tests

`test/rank-9-batch-2.test.js` is new. A whole-corpus compile (b741 → b742) changed the 37 adventure rituals and the two spells.

## Evidence

[Live evidence](phase-rank-9-batch-2-live-results.json), case `rank9Batch2`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Terminate Bloodline, Mindscape Shift cast | A GM-only card each, with the ritual's text |
| Catch Your Name, a failure | One GM whisper (name and location) |
| Telepathic Demand: failure / success / critical success | The 1-minute note and one GM whisper / immune 1 day / the "knows" whisper and immune 30 days; the GM answered the earlier-contact question for each |

**Cleanup:** fixtures removed.
