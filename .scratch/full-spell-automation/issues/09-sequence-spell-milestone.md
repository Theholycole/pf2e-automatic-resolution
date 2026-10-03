# Sequence releases from GM corrections to complete spell coverage

ID: 09
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 08

## Question

Given the resolved scope, workflows, gaps, and verification contract, what is the build sequence to reach the first major milestone?

Preserve the agreed opening: release and live-test GM correction controls, then outcome-specific native Effects, followed by persistent reminders and recurring saves. Determine subsequent dependency-based spell-family releases and what each must prove. Keep kineticist, monster, hazard, and other non-spell trials after the spell milestone.

Produce the implementation handoff and identify any decision still required before building each part. If a dependency exposes a new unresolved question, create its decision ticket rather than assuming an answer. This ticket plans execution; it does not implement the module.

## Comments

### Accepted release sequence

The user accepted all six recommendations:

- Preserve GM corrections → outcome-specific native Effects → reminders and recurring saves, verifying each before dependent workflows.
- Follow with expanded attacks/healing/other immediate spells, transformations, summons, spatial effects, and rituals. Build shared capabilities before dependent families.
- Audit the entire catalog early, expand coverage alongside each family, and reserve a final phase for remaining exceptions and complex interactions.
- Ship small, usable groups of related behavior, splitting large families when needed; each release has explicit checks and live testing.
- Place unresolved prerequisites before dependent work. Verify expiry before ongoing-effect implementation and settle ritual membership before declaring ritual coverage complete. Independent work may proceed.
- Produce one ordered handoff linking decisions, deliverables, dependencies, automated checks, live scenarios, and completion criteria; distinguish planning prerequisites from implementation verification.

[Implementation handoff draft](../../../docs/planning/full-spell-implementation-plan.md). This ticket remains claimed until the outstanding planning prerequisites are resolved and incorporated; the draft does not establish a decision-complete map.


## Answer

The [implementation plan](../../../docs/planning/full-spell-implementation-plan.md) retains the accepted order: GM corrections, outcome-specific native Effects, ongoing reminders/recurring saves, immediate spell expansion, forms, summons, spatial workflows, rituals, catalog closure. The accepted prototype, baseline expiry findings, ritual decisions, and concrete evidence matrix now complete the planning prerequisites. Begin Phase 1 and verify it before dependent work. Foundry observations expose required lifecycle repairs in Phase 3; they do not imply those repairs already exist.
