# Rank 6 batch 5 — Spellsurge, Planar Palace, Ethereal Jaunt, Proliferating Eyes, Mislead

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Spellsurge, Planar Palace, Ethereal Jaunt, Proliferating Eyes | Notes. Each named a condition only as a mention, which the note reader now knows: an example ("such as from the Stupefied condition"), a created entrance or sensor that's Invisible, the Material Plane seen as Concealed from the Ethereal Plane. Ethereal Jaunt's push-out damage when the spell ends inside an object is a GM rule in the note. Proliferating Eyes' "1 creature (see description)" target is any creature; its note goes on the caster, who uses the eyes. |
| Mislead | Condition-note grant: the caster is Invisible for the sustained duration. The duplicate and the Deception option are the note. |

## Tests

`test/rank-6-batch-5.test.js` is new. A whole-corpus compile (b725 → b726) changed only these five spells.

## Evidence

[Live evidence](phase-rank-6-batch-5-live-results.json), case `rank6Batch5`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Spellsurge, Planar Palace, Ethereal Jaunt cast | A Spell Note Effect, and no condition applied |
| Proliferating Eyes on a creature | The note (on the caster); the host isn't made Invisible |
| Mislead | The caster is Invisible (sustained) |

**Cleanup:** fixtures removed.
