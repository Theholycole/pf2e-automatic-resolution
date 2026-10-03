# Shape recurring saves and ongoing spell controls

ID: 06
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:prototype
Type: prototype
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 02, 04, 05, 10

## Question

What should players and the GM see and control while a spell persists beyond its initial resolution?

Create a throwaway workflow prototype covering a deferred/recurring save, a sustained spell, and a reminder-driven aura. Show who acts, what native state remains authoritative, and how reminders, duration, dismissal, source loss, reloads, and GM handoff affect the workflow. Include interrupted/uncertain actions as stop-for-review rather than automatic retries.

Base the prototype on verified lifecycle capabilities and the agreed application boundaries. Resolve it through the user's reaction; an agent cannot approve the human interaction on their behalf. Link the prototype asset when available. Production implementation stays outside this map.

## Comments

Gather desired interaction choices before the throwaway prototype. The live expiry experiment remains a prerequisite for resolution and verified lifecycle behavior. Initial proposals concern the cast overview, reminder presentation, recurring-save interaction, explicit Sustain, dismissal controls, uncertain-state review, and out-of-combat timing. These are questions, not accepted decisions or proof of native event support.

### Accepted ongoing interaction round

The user accepted all seven recommendations:

- Provide one overview of each active cast's caster, affected creatures, remaining duration, and next required action. Players see their relevant spells; the GM can manage all casts.
- Group reminders at the relevant turn boundary with direct Roll Save, Sustain, or Review Targets controls. Unresolved obligations remain visible without repeated duplicate messages.
- Prompt authorized players or the GM for recurring saves through native dialogs. Preserve corrections and applicable reactions before GM finalization of consequences. Do not automatically roll recurring saves.
- Recognize a reliably identifiable native Sustain action where possible; otherwise provide an explicit Sustain control. Do not infer Sustain from movement or unrelated actions. Respect spell-specific limits and benefits.
- Offer caster Dismiss controls only where permitted by the spell and respect action requirements. Provide a separate GM correction control to end a tracked effect.
- After reload or GM change, uncertain completion becomes Needs review with the last confirmed state. The GM reconciles it; do not replay damage, saves, or cleanup automatically.
- Outside combat, follow world time. Time jumps crossing unresolved saves or other consequential events produce ordered review instead of silently rolling or applying every missed event.

These are intended interactions, not verified native event capabilities. The live expiry experiment and throwaway interaction prototype remain prerequisites for closing this decision. Further branches include missed Sustain, source loss, aura reminders, and linked cleanup.

### Accepted lifecycle follow-up round

The user accepted all six recommendations:

- When reliable tracking establishes a missed Sustain deadline, end the spell according to its rules. If tracking is uncertain, ask the GM whether Sustain occurred before applying consequences.
- Apply spell-specific ending conditions for unconsciousness, death, and source loss. Disconnection or token deletion alone does not establish an ending; flag missing information for GM review.
- For reminder-driven auras, suggest affected creatures when detection is reliable and prompt at the relevant trigger. The GM confirms uncertain membership. Preserve spell-specific limits on repeated exposure.
- On a confirmed ending, remove only that cast's temporary effects, summons, objects, and granted abilities that the spell says should end. Preserve permanent creations, independent consequences, and unrelated changes.
- Keep substantially edited summons or objects linked to their cast by default. Provide an explicit GM option to detach them from automatic cleanup, clearly marking them as separately managed.
- After a confirmed ending, apply deterministic ending consequences automatically. Prompt for required choices or rolls, stop for review when application is uncertain, and prevent duplicate ending consequences.

These decisions specify desired behavior; they do not establish reliable native expiry detection or runtime correctness. The expiry experiment and prototype remain open.

### Prototype prepared — 2026-09-19

The [throwaway interaction walkthrough](../../../docs/planning/ongoing-spells.prototype.html)
now demonstrates recurring saves and corrections, Sustain and selective cleanup,
aura exposure, interrupted application, missing source, and world-time jumps.
It uses fictional fixtures with in-memory state, not live spell mechanics.
User feedback and interactive verification remain pending. Browser preview was
blocked by browser policy; the local file is available for direct user review.
The native expiry experiment remains a separate prerequisite. No interaction
verdict or production implementation approval is inferred from file creation.

### User feedback and browser retry

The user reviewed the walkthrough and said, “the walk through looks good to me.”
The demonstrated interaction is accepted. The user also requested agent-driven
browser verification after increasing permissions. The browser inventory showed
the open walkthrough, but selecting that existing local-file tab was still
rejected by the Browser Use URL policy. Agent interactive verification remains
pending. The native expiry experiment remains open; user acceptance of the
interaction does not establish live lifecycle behavior or close this dependency.


## Answer

The user approved the demonstrated interaction and instructed continuation. The [expiry experiment](../../../docs/research/native-expiry-experiment.md) now supplies lifecycle evidence the prototype could not. Implement the accepted overview, reminders, native saves, Sustain, permitted Dismiss, selective cleanup and detachment with durable obligations independent of transient Effects. Reconcile after native time/combat processing, reload, and coordinator change; retain uncertain work as Needs review. Native backward-time reactivation is not permission to replay confirmed endings.

Agent browser verification of the prototype remains unavailable and is not represented as passed. User interaction acceptance and actual Foundry observations are separate evidence. Production verification is specified in the release matrix.
