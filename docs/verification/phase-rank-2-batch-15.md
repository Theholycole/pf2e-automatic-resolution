# Rank 2 batch 15 — heightened versions of rank 2 spells

2026-09-30. User direction: "do the heightened versions of 2nd rank spells too such as invisibility."

## Heightened check of every working rank 2 spell

Every working rank 2 spell with a fixed-rank Heightened entry was cast live at each entry's rank: 87 casts over 50 spells ([results](rank-2-heightened-smoke.json)). `tools/cantrip-rank-1-smoke.mjs` now takes `entries: [{name, rank}]`: it heightens with a level 2r−1 caster and records each cast's Effects, with their level and duration.

**Result:** 83 ok, 3 errors, 1 refusal.
- **The 3 errors:** Animal Form at 3rd/4th/5th, because battle forms need a character caster. Re-run with one, all three applied the form at their rank.
- **The refusal:** Horrifying Blood Loss at 4th, then still gated; fixed below.

**Reviewed:**
- **Effect levels:** every Effect's level is the cast rank. PF2e's Effects key their heightened bonuses and choices on it: Resist Energy 10/15, Impeccable Flow, Spirit of the Beast, Enlarge's Huge, Humanoid Form's Large, Animal Feature's options, Silence's 4th-rank aura.
- **Durations follow the Heightened entries:**
  - Tremorsense: 1 hour at 3rd, 8 hours at 5th.
  - Gecko Grip: 1 hour at 5th.
  - Darkvision: 24 hours at 5th.
  - Iron Gut: 8 hours at 3rd.
  - Water Breathing: 8 hours at 3rd, a day at 4th.
  - Grave Impressions: an hour at 4th, a day at 6th.
  - Floating Harness, Empathic Link, Water Walk and Blast of the Bellows: their stated durations.
- **Target counts:** "You can target up to N creatures" needs nothing: the save and Effect routes don't cap targets, and notes read the heightened limit.
- **Defect found:** Spy's Mark at 9th lasted 8 hours; the text says until the next daily preparations ("The symbol remains until …"). Fixed below.

## Fixes and new spells

| Spell | Now |
| --- | --- |
| Invisibility (2) | Invisible for 10 minutes with a note (its hostile-action ending is the GM's). At 4th and above it lasts 1 minute, and the note shows the heightened rule ("doesn't end if the target uses a hostile action"). |
| Horrifying Blood Loss (2) | At 4th and above, up to four creatures that aren't bleeding join as secondary targets. Each gets the GM's question ("Can it see the primary target?"), makes the same save with the same results, and its Frightened floor ends when the **primary** target stops bleeding. Before, casts at 4th+ were refused. |
| Spy's Mark (2) | At 9th: lasts until the next daily preparations (1 day). |
| Feet to Fins (3) | At 6th: "The spell lasts until your next daily preparations." is now read too (a note-only spell). |

## Rules

- **Heightened durations:**
  - "The spell lasts (for) N minutes …";
  - "The <thing> remains/lasts until … daily preparations" ("The duration lasts until …" was already read; the new wording excludes it, so it isn't counted twice).
- **Condition + note at the cast rank:** the created condition and note use the heightened duration, and the note shows the rank's Heightened text.
  - Also read: "…, rendering it Invisible.", and PF2e's restated Invisible rules ("This makes it Undetected … making it Hidden to them instead.").
- **Secondary targets:**
  - The Heightened entry must state them exactly.
  - At that rank, with one primary target, creatures that fail only the waived requirement (persistent bleed) become secondary targets with a GM confirmation.
  - Their floor Effect's persistent link names the primary. When the primary's last bleed ends, the module removes those floors too.

## Tests

817/817 pass. `test/rank-2-batch-15.test.js` is new. It checks:
- Invisibility's durations and note by rank;
- the new heightened-duration wordings, with no double count;
- Horrifying Blood Loss's secondary targets, the core's check, and the rank gate returning for a changed entry.

A first version of the daily wording also matched "The duration lasts until …" and dropped Charm's, Grave Impressions' and Heatvision's entries; the corpus comparison caught it.

A whole-corpus compile (b268 → b269) changed heightened durations only for Invisibility, Spy's Mark, Feet to Fins and Dismantle (still unsupported). Horrifying Blood Loss gained its secondary targets.

## Coverage

**Census:** **1048 enabled**, up from 1047 (Invisibility). Rank 2: 136 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

- **[Heightened smoke](rank-2-heightened-smoke.json):** the 87 casts with their Effects.
- **[Live case](phase-rank-2-batch-15-live-results.json)** `rank2Batch15`, in the `pftest` world:
  - Invisibility: "Invisible" for 10 minutes at rank 2, and 1 minute at rank 4 with the heightened line in its note.
  - Horrifying Blood Loss at 4th, on a bleeding primary and a non-bleeding witness:
    - the witness became a secondary target of the primary, with the question;
    - after the GM's yes, both failed and got Frightened 2 with floors; the witness's reads "… while blood primary (the primary target) is taking persistent bleed damage";
    - deleting the primary's bleed removed both floors.
  - Spy's Mark at 9th: its note lasts 1 day.
- **Character-caster re-run:** Animal Form at 3rd/4th/5th applied the form, with Effect levels 3/4/5; Invisibility at 4th made 1-minute Effects.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
