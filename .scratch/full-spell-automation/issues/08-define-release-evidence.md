# Define the milestone verification and exit criteria

ID: 08
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 04, 05, 06, 07, 12, 13, 14

## Question

What concrete evidence will establish that the spell milestone is complete on the user's Foundry v14 / PF2e 8.5.0 table?

Turn the accepted standard into an auditable matrix: every in-scope catalog entry and meaningful rank/variant accounted for, automatic checks for supported mechanical outcomes, live verification of every distinct workflow, and representative complex-spell cases. Specify how representative cases are selected, which mixed outcomes and lifecycle transitions require live checks, and how accepted exceptions are visible.

Include multi-user ownership, reloads, interruptions, existing-effect interactions, custom recognized/unrecognized structures, and saving-throw rituals as applicable. Define the release gate and regression evidence; choose neither arbitrary coverage percentages nor a test-passing substitute for live Foundry verification.

The accepted [transformation workflow](13-define-form-workflow.md) requires a named transformation-integration verification gate: rank/tradition context, native form statistics, granted-action resolution and recharge, cancellation/placement, overlap, and removal without reverting unrelated actor changes. Include that gate in the final implementation sequence and release evidence, using the [source checklist](../../../docs/research/form-workflow-evidence.md).

## Comments

### Accepted milestone acceptance round

The user accepted all six recommendations:

- Account for every in-scope spell and ritual, every meaningful casting variant, and legal ranks. Leave no unexplained entries. Unsupported mechanics remain gaps unless explicitly accepted as exceptions.
- Automated verification covers expected outcomes, targeting restrictions, rank changes, effects, and lifecycle transitions; loading or compilation alone is insufficient.
- Live-test every distinct workflow on Foundry v14 / PF2e 8.5.0, plus representative complex spells and known edge cases. Check all catalog variants automatically without requiring a separate manual demonstration of every spell.
- Verify player/GM permissions, multiple clients, rerolls and corrections, repeated casts, overlapping effects, reloads, GM changes, and interrupted application. Uncertain work stops for review without duplicate consequences.
- Provide a searchable coverage report with supported variants, gaps, accepted exceptions, and verification evidence. Show concise limitations before casting resolution.
- Each phase requires its relevant automated checks and live workflows to pass while preserving existing supported behavior. Intermediate releases may list remaining scope; final milestone completion permits no unaccepted gaps.

These are accepted requirements, not completed tests. The ticket remains claimed pending the final workflow/prototype details needed to specify the evidence matrix and representative-case selection. Outstanding ritual membership research must settle catalog membership before final coverage acceptance.

### Accepted evidence-design round

The user accepted all five recommendations:

- Select live cases to collectively cover every distinct mechanic and workflow, including heightened changes, mixed outcomes, granted abilities, and known problem cases. Record the selection rationale.
- Before each test, record the setup and expected targeting, rolls, damage, effects, duration, and cleanup where applicable. Compare observations against those expectations.
- Reuse live evidence across spells only when they share the verified behavior and each spell's data passes automated checks. Materially different rules or interactions require additional live tests.
- Retest affected behavior when implementation, spell data, or relevant settings change. Record tested versions. Unrelated changes do not force a full manual retest.
- Each usable release includes newly supported behavior, passed checks, live results, known gaps, and setup requirements. Unperformed tests remain visibly pending.

The evidence policy is now agreed. The concrete case matrix must still incorporate the outstanding prototype and factual investigations before this ticket is resolved.

### Local live-test availability

The user can make local Foundry available during coding for automated testing. Include automated live checks in each relevant phase and retain observed evidence. Record any untested multi-client or other scenarios as pending; this availability does not itself establish a connection or passing results. See the implementation handoff for test-world and fixture boundaries.


## Answer

The [release evidence matrix](../../../docs/planning/release-evidence-matrix.md) records concrete representative cases, setup, expected behavior, selection rationale, cross-cutting variations, and execution gates. It incorporates the accepted prototype, the completed baseline expiry investigation, and settled ritual scope. Record numeric expectations from pinned data before each case runs; baseline failures are not implementation passes. The earlier accepted evidence policy remains in force. This resolves evidence planning; all release gates remain subject to actual implementation and observed results.
