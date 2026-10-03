# Rank 8 batch 1 — rank 6–10 rituals

2026-10-03. Ranks 6–10 pass. Seven rituals now use `ritual-degrees`.

| Ritual | Now |
| --- | --- |
| Binding Circle (6) | The target's level is at most double the rank. Critical success: the creature's "held" record for 1 day. |
| Separation (9) | Success: both targets' "separated" record (100 feet; the DC 5 flat check) for 1 month. Critical success: 1 year. Critical failure: the caster's record for 1 year. |
| Freedom (8) | New action `free`: Petrified ended on the target, with a reminder. Critical success: +1 status to saves against those effects for 1 week, behind a toggle. |
| Imprisonment (8) | The forms list is now read (`forms`, each with its minimum rank). New action `form`: the caster picks a form allowed at the rank (one higher on a critical success) and it's recorded with its text, on the target or, on a critical failure, the casters. The Heightened entries' maximum levels are read. |
| Sleepless Season (6) | New action `curse-save`: each living targeted creature's save against the GM's DC; on a failure, the curse for 1 week. Critical success adds the Enfeebled strain controls (released, not removed, when the creature stops being fatigued). Critical failure: the casters Fatigued, plus the record. |
| Void Harvest (9) | New action `area-controls`: the caster's year-long Effect with controls (Doomed +1 on a failed Will; undead vitality resistance; on a critical success, −2 to saves against death and void effects for living creatures). Critical failure: the casters Drained 4, locked for 1 week. |
| Awaken Curse (8) | The curse holder's record with the counteract change. |

## Tests

`test/rank-8-batch-1.test.js` is new. A whole-corpus compile (b716 → b717) changed only these seven rituals, apart from an empty `forms` field on the others.

## Evidence

[Live evidence](phase-rank-8-batch-1-live-results.json), case `rank8Batch1`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Binding Circle on a level 13 creature at 6th | Refused (at most 12) |
| Binding Circle, critical success | 24-hour hold |
| Separation, success | Both 720 hours |
| Separation, critical failure | The caster's record |
| Freedom on a Petrified creature, critical success | Petrified gone; the toggled +1 |
| Imprisonment: Object at 8th | Refused (cancelled) |
| Imprisonment: Chains | The record |
| Imprisonment: Object on a critical success | Allowed |
| Imprisonment: Slumber on a critical failure | The caster's record |
| Sleepless Season: Fortitude −40 and +60 | 168-hour curse; resisted |
| The strain control | Enfeebled 1 |
| Sleepless Season, critical failure | Caster Fatigued, plus the record |
| Void Harvest doom control twice (Will −40) | Doomed 2 |
| Its undead control on a zombie and a living creature | Only the zombie gets resistance (@actor.level) |
| Void Harvest, critical failure | Drained 4 |
| Awaken Curse, critical success | "2 higher" record |

**Cleanup:** fixtures removed.
