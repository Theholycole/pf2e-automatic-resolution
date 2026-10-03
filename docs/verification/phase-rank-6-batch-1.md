# Rank 6 batch 1 — chains, walls, salvos and repeated saves

2026-10-03. The first batch of the user's ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Chain Lightning | New `chain` on the basic save. The targets go in the order targeted, each within 30 feet of the last (a gap is refused). One damage roll. At Finalize, everyone after the first critical success is excluded. |
| Blade Barrier | Rewritten to the lingering wording (`blade-wall.js`): a placed 120-foot line, the save when cast and as a turn ends inside, the GM's control for a creature passing through. The push and stop rules are reminders. |
| Explosive Barrage | Rewritten (`burst-salvo.js`): the basic save with Deafened 1 minute on a failure. The extra bursts (1d4) are a reminder roll; the GM places them and targets every creature caught. |
| Flame Vortex | New extra-lingering reader (`lingering-extra.js`, hooked after the general one): a sustained cylinder that saves when cast and after each Sustain's move, once per round, with difficult terrain for flyers and the GM's control for creatures it moved through. Its Area paragraph is read. |
| For Love, For Lightning | New kind `repeat-save` (`repeat-save.js`): the caster's sustained Effect, and the granted-action card's button for each arc (a basic Reflex save card). |
| Living Thunderbolt | PF2e's Effect with a rule addition (Escape checks are a success, behind a toggle for a higher-rank magical hold), plus the granted-action button for each creature moved through (basic Reflex, Dazzled 1 round on a failure). The generic Effect path now passes `plan.resolution.ruleAdditions` to PF2e's Effect. |

## Tests

`test/rank-6-batch-1.test.js` is new. A whole-corpus compile (b714 → b715) changed only these six spells.

## Evidence

[Live evidence](phase-rank-6-batch-1-live-results.json), case `rank6Batch1`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Chain Lightning with a gap | Refused |
| Chain of three: success, critical success, failure | The third excluded (no damage); the first lost 32 |
| Blade Barrier | Initial save and turn-end; the passing control exposed the creature |
| Explosive Barrage, failure | Deafened; the bursts reminder |
| Flame Vortex | Sustain events, once per round, fly cost 2 on the region, the moved-through control |
| For Love, For Lightning | A sustained 1-minute Effect; the arc button opened a Reflex save card |
| Living Thunderbolt | Fly 60; the Escape rule on PF2e's Effect; the moved-through card |

**Cleanup:** fixtures and regions removed.
