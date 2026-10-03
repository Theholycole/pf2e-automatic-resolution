# Rank 6 batch 2 — Poltergeist's Fury, Phantom Orchestra, Frozen Fog

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Poltergeist's Fury | Rewritten (`caster-storm.js`) to the basic save on the emanation's creatures (targeted). New save adjustment kind `ally-of-caster` (the caster filled in at the cast): an ally's success becomes a critical success. New `casterStorm`: the caster's Effect for the sustained duration with lesser cover (+1 circumstance AC); the save route accepts that lifetime. Its growth is a reminder. |
| Phantom Orchestra | Extra-lingering reader: a placed 10-foot burst, saved against when cast and on each Sustain (the GM moves it first). |
| Frozen Fog | Rewritten (`mist-rewrite.js`) to Mist's concealment, the save as a turn starts inside and the Clumsy rider (Clumsy 2 on a critical failure). The −10 Speed penalty is a rule note on the failing rows for the minute. Moving the fog is the GM's. |

## Tests

`test/rank-6-batch-2.test.js` is new. A whole-corpus compile (b715 → b716) changed only these three spells.

## Evidence

[Live evidence](phase-rank-6-batch-2-live-results.json), case `rank6Batch2`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Poltergeist's Fury on an ally and a foe | The ally's adjustment applies, the foe's doesn't; the caster's AC +1 from the sustained storm Effect |
| Phantom Orchestra | Sustain events, initial save, sustained |
| Frozen Fog in combat: the victim's turn starts inside, failure | Clumsy 1 and the −10 Speed rule |

**Cleanup:** fixtures, combat and regions removed.
