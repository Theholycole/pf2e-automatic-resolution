# Define summoning and created-creature workflows

ID: 12
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 04, 05, 06

## Question

How should a summon or creature-creation spell select, place, control, and remove its creature while remaining inside the spell-automation milestone?

Decide the caster/GM selection interface, eligible creature choices at the cast rank, token placement, ownership, cast linkage, and treatment of absent or unplaceable creature data. Specify which spell-imposed restrictions and command/Sustain obligations are represented automatically and which need reminders or explicit choices. Reuse the agreed ongoing-spell lifecycle for duration, dismissal, and loss of the originating cast.

Resolve how to handle an existing created creature when its originating spell changes or ends, and what evidence proves correct token/actor cleanup without altering unrelated actors. General automation of the creature's own non-spell abilities remains outside this milestone; spell-created consequences must still be accounted for. Use baseline examples and link any additional prototype or research needs.

## Comments

Begin the independent selection, placement, control, and missing-data questions at the user's request. Ongoing-spell lifecycle remains a blocker for resolution; do not assume duration, Sustain, dismissal, or cleanup decisions while gathering these independent preferences.

### Accepted selection and creation round

The user accepted all six recommendations:

- Present eligible creatures for the spell and cast rank with search and concise summaries; flag uncertain eligibility for GM adjudication.
- If usable creature data is missing, allow the GM to supply a matching actor. Keep that option visibly unsupported until the required data is available; never silently substitute another creature.
- The caster proposes placement. Validate reliable range and space constraints automatically; resolve uncertain obstructions and special restrictions with the GM before creating the token.
- Give the caster control of the created creature with GM oversight, without changing permissions on its original source actor.
- Automate the spell's creation, restrictions, and command-related obligations. Use native controls for the creature's actions; general automation of its own non-spell abilities remains outside this milestone.
- Associate every created creature with its originating cast. Show caster, source spell, and relevant restrictions; repeated casts remain separately identifiable.

This is a partial decision record, not resolution of the ticket. Duration, Sustain, dismissal, originating-cast changes, and safe cleanup still depend on the shared ongoing-spell workflow.

### Shared lifecycle policy accepted

The [ongoing-spell decision](06-shape-ongoing-workflow.md) now records accepted policies for missed Sustain, source loss, confirmed endings, selective cleanup, explicit GM detachment, and ending consequences. Reuse that decision rather than introducing a separate lifecycle. Its prototype and expiry verification are still unresolved prerequisites; this ticket remains open.


## Answer

The accepted selection, placement, caster control, and missing-data policies combine with the resolved ongoing workflow (06). Keep temporary creations attached to a durable cast record, including after edits; explicit GM detachment preserves a separately managed creation. Missing caster/token information requests review instead of proving an ending. Confirmed ending removes only spell-defined temporary contributions. The [evidence matrix](../../../docs/planning/release-evidence-matrix.md), S1 and lifecycle variations, specifies the release gate. This resolves product planning, not native summon support.
