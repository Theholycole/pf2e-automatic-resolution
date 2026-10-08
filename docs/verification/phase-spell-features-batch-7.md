# Spell features batch 7: conditions on casting

2026-10-06, from the spell features audit (part G1). The user asked: "audit and implement all of them".

PF2e's condition texts that bear on casting, now carried out as each spell is cast (`scripts/casting-rules-runtime.js`, beside Stupefied):

| Condition | Text | At the table |
| --- | --- | --- |
| Restrained | "you can't use any attack or manipulate actions" | A spell with the manipulate trait is lost |
| Grabbed | "If you attempt a manipulate action while grabbed, you must succeed at a DC 5 flat check or it is lost" | A manipulate spell: the DC 5 flat check; a failure loses it |
| Deafened | "If you perform an action that has the auditory trait, you must succeed at a DC 5 flat check or the action is lost" | An auditory spell: the same |
| Fascinated | "can't use concentrate actions unless … related to the subject of your fascination, as determined by the GM" | A concentrate spell: the GM is told |
| Confused | No allies, no Delay or reactions | The GM is told |
| Concealed / Hidden (the target) | "must succeed at a DC 5 [DC 11] flat check when targeting you with an attack, spell, or other effect" | Each targeted creature that's concealed or hidden: the flat check. One that's missed is left out of the spell's cards; if every target is missed, the card says so and refuses |

A lost spell's cards refuse to resolve, as with Stupefied. Missed targets are recorded on the cast (`targetMisses`) and dropped by the save, Effect, immediate and stored-trigger runtimes (`dropMissedTargets`).

The target check applies to spells that target (a "Targets" line), not to areas. The concealed and hidden conditions are PF2e's, on the target. Whether the caster's senses change that is the GM's.

## Evidence

[Live evidence](phase-spell-features-batch-7-live-results.json), case `spellFeaturesBatch7`, four runs in the `pftest` world (an earlier run, before the all-missed refusal was reworded, isn't in the file).

| Step | Results across the four runs |
| --- | --- |
| Restrained caster, Fireball | Lost each time ("a restrained creature can't use manipulate actions") |
| Grabbed caster, Fireball | Rolled 14, 11, 12: kept; rolled 4: lost |
| Deafened caster, Command | Rolled 9, 19: kept; rolled 4, 3: lost |
| Fascinated caster, Fireball | The GM told; the spell kept |
| Fear at a hidden foe | Rolled 16, 16, 20: the card has the foe. Rolled 8: missed; the card refuses ("… missed every target …") |
