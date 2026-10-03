# Cantrip / rank 1 batch 133 — Effect route: immunity, a cast condition, both holders, caster reminders

2026-09-28. This continues the push to 100%. These six were on the Effect + note route.

| Rule | Spell |
| --- | --- |
| Immune for 24 hours from the cast (a marker); data note: PF2e's Effect doesn't end itself after use | Bit of Luck (1) |
| The fortune toggle (PF2e deletes it after the roll); immune for 10 minutes once used | Wash Your Luck (cantrip) |
| PF2e's AC or save choice; “not Off-Guard to the attacker” is a GM note | Cutting Eye (1) |
| The +2 Perception Effect on the target and the caster; shared senses and Blinded/Dazzled are a GM note | Share Vision (cantrip) |
| PF2e's Unconscious applied with the dream Effect; waking early is a GM note | Sweet Dream (1) |
| The Diplomacy Effect; “Recall Knowledge using Society” as part of the cast is a caster reminder, and once per situation is a GM note | Read the Air (cantrip) |

**Kept strict (tests):** it isn't read with any of these changes:
- added damage;
- Paralyzed instead of Unconscious;
- +3 instead of the Effect's +2;
- an added skill.

**Also looked at, not built:**
- **“Named by the Effect's predicates” for action links** (Illusory Disguise, Honeyed Words): too loose. Honeyed Words also bonuses Perception checks against you, and Illusory Disguise ignores circumstance penalties; PF2e's Effects cover neither.
- **Practice Makes Perfect:** its bonus is to an already-rolled check. Needs its own build.
- **Uplifting Overture:** PF2e's Effect adjusts its holder's Performance, but the Target is the ally. Unclear holder.

## Coverage

**Census:** **625 enabled**, up from 619.
- The b216 diff against b215 changed only these six.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 743/743 tests pass. Two older tests now treat Sweet Dream and Cutting Eye as built.

[Live evidence](phase-cantrip-rank-1-batch-133-live-results.json), case `cr1Batch133`, in the `pftest` world.
- **Bit of Luck:** the ally got the Effect and the immunity marker. A second cast was refused (“temporarily immune”).
- **Wash Your Luck:**
  - After the cast, the caster had the Effect but no marker.
  - Removing the Effect (standing in for its use) added the marker, and a second cast was refused.
  - A separate probe confirmed PF2e deletes its own Wash Your Luck Effect after a check rolled with the fortune toggle on.
- **Cutting Eye:** PF2e's prompt offered “Armor Class”, which was picked; the Effect's selection is `ac`.
- **Share Vision:** both the ally and the caster got the Effect.
- **Sweet Dream:** “Dream of Insight” was picked. The ally got the Effect and was Unconscious; the caster wasn't.
- **Read the Air:** the caster got the Effect, and the card's reminder said to Recall Knowledge using Society.
- **Cleanup:** fixtures removed.
