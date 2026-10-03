# Define transformation and battle-form workflows

ID: 13
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 04, 05

## Question

How should transformation and battle-form spells select a form, apply its mechanical changes, and restore the actor when the cast ends?

Decide the choice interface, use of official native Effects versus generated Effects, handling of granted attacks/actions, and how cast rank and spell-specific restrictions affect the resulting form. Account for pre-existing conditions, equipment/statistic interactions, overlapping transformation attempts, and changes made to the actor while transformed.

Define what ending one form restores or removes, preserving unrelated state and obeying the agreed cast ownership and overlap rules. Any native-system behavior requiring verification must become a named prerequisite; an actor's appearance alone does not establish mechanical completion.

## Comments

### Accepted first round

The user accepted all six recommendations: select a legal form for cast rank before application with a short summary; automate all defined mechanical changes rather than appearance alone; apply clear overlap rules and otherwise pause for GM adjudication; remove only the ending transformation's contributions while preserving damage, resource use, and unrelated changes; expose granted attacks/actions through native actor controls where supported and remove access when the form ends; keep artwork optional while automating mechanically relevant size/space.

### Source investigation

Animal Form has 13 separate native form Effects. Dragon Form uses one native Effect with a 40-option ChoiceSet and a granted breath action. Native data expresses much of the mechanical behavior, but does not prove correct runtime integration. The current module creates a cloned Effect at cast rank without explicitly supplying PF2e spell origin/context; tradition-dependent predicates need verification. The breath action's recharge is prose rather than an explicit frequency field. Apparent rank-8 flight and Despair breath save discrepancies need audit before any correction is assumed necessary.

These follow-up decisions were settled in the answer below.

## Answer

The user accepted all recommendations across both rounds.

- Present legal forms for the cast rank with concise summaries; complete required choices before changing the actor. Prefer verified official native Effects, using the previously accepted generated-effect approach where needed.
- Supported forms must implement all defined mechanical changes, including statistics, movement, senses, attacks, restrictions, and mechanically relevant size/space. Artwork is optional and uses existing assets unless a replacement is configured.
- Apply clear transformation overlap rules. Pause for a GM ruling when an interaction or placement is uncertain, before replacing effects or applying changes.
- Ending a form removes only that cast's contributions and granted access. Preserve damage taken, resources spent, unrelated effects, and legitimate changes made while transformed; do not restore an obsolete actor snapshot.
- Form-granted attacks and abilities are part of spell coverage, including targeting, saves, damage, and usage/recharge limits. Expose them through native actor controls where supported. This does not expand coverage to unrelated creature abilities.
- Correct demonstrably incorrect or incomplete native data through narrow, tested corrections for the supported baseline. Suspected discrepancies are not sufficient grounds for a patch; keep affected coverage incomplete until verified.
- Canceled choices or unresolved placement apply no transformation changes. Preserve native resource handling and clearly report resources already spent; cancellation is not an implicit refund.

### Implementation verification prerequisite: transformation integration

Before marking any affected form supported, verify its native Effect, cast rank, spell origin/tradition, granted actions, usage limits, and lifecycle behavior. The [source investigation and verification checklist](../../../docs/research/form-workflow-evidence.md) identifies representative Animal Form and Dragon Form checks, including suspected data discrepancies. This is an implementation/release prerequisite, not a claim that runtime behavior has been verified.
