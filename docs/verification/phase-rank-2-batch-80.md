# Rank 2 batch 80 — Rite of Cleansing Flame

2026-10-01. The ritual-outcome family (batch 79), following the accepted ritual workflow (decision ticket 07).

| Spell | Now |
| --- | --- |
| Rite of Cleansing Flame (2, ritual) | The GM gives the result and the secondary casters (up to 3), and targets the creatures within the area; without targets it's refused. **On every degree** (each has the ritual's effect, failures included as "has its intended effect"), the targeted creatures lose their detrimental emotion and mental effects. These are Effects with those traits, their own or their origin item's, unless they come from the creature itself or an ally, plus Frightened, Fascinated, Confused and Controlled when not granted. The GM confirms the list. Ceasing hostilities "as though they'd failed a save against calm" is the GM's (a card note). **Critical Success:** PF2e's Effect on every caster (+1 status against emotion and mental effects) for 1 month. **Failure:** PF2e's curse Effect on every caster (weakness 5 to cold and unholy), with the "curse effect" note. **Critical Failure:** the same, and each caster rolls Fortitude against DC 17. A failure means Drained 1, granted by that caster's curse Effect and locked for as long as the curse lasts (no reduction; it goes with the curse). |

## Rules

**`ritual-outcome.js`** gains:
- the area cure sentence (body);
- "The ritual's power lingers within its casters, granting them …", proved like the casters' bonus. The prover now also reads PF2e's `{or: ["item:trait:emotion", "item:trait:mental"]}` predicate;
- "The ritual has its intended effect, but …" (the base effect happens; the rest is a note);
- "All casters … and gain weakness N to X and Y.", the linked Effect's one Weakness rule proved;
- "This is a curse effect.", a note on that Effect;
- "As failure, but each caster must succeed at a @Check[…|dc:N] save or be permanently Drained N for as long as they have …", meaning the failure's consequences plus each caster's save.

A critical success with no statement of its own carries the ritual's effect when the success does.

**Runtime:**
- the cure: targets, candidates, the GM's checklist (`cure: "detected"` in tests), and removal;
- the casters' saves, rolled before the Effects. On a failure, the curse Effect gets a GrantItem of the condition (`grantee: restrict`) and the `ritualLock` flag. The batch 79 `preUpdateItem` hook then refuses reductions.

## Tests

954/954 pass. `test/rank-2-batch-80.test.js` is new. It checks:
- every degree;
- that changed weakness, bonus, cure or save riders aren't read, and that a changed save DC is.

A whole-corpus compile (b335 → b336) changed Rite of Cleansing Flame. It also changed Sweetest Solstice's plan by the new empty fields (`base`, `casterSaves`); that spell is still automatic.

## Coverage

**Census:** **1157 enabled** (milestone), up from 1156. Rank 2: 243 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-80-live-results.json), case `rank2Batch80`, in the `pftest` world.
- **No targets:** refused.
- **Success:** a foe's emotion Effect and Frightened 2 were cured; a party ally's mental Effect and a traitless Effect stayed. No caster Effects.
- **Critical Success:** both casters got the Effect, 30 days. A Will save with `item:trait:mental` got +1 status.
- **Failure:** both casters had weakness cold 5 and unholy 5.
- **Critical Failure:** the caster (Fortitude −30) failed and the secondary caster (+60) critically succeeded. The caster got Drained 1; a reduction was refused; it went when the curse Effect was deleted. The secondary caster had no Drained. Both had the weaknesses.
- **Run note:** the first run's assertion expected the condition's name "Frightened"; PF2e names it "Frightened 2". The assertion was corrected; the behaviour was unchanged.
- **Cleanup:** fixtures removed.
