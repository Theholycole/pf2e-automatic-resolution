# Define outcome application and native system ownership

ID: 05
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 03

## Question

How should finalized spell outcomes combine damage, healing, conditions, native Effects, and other mechanical changes while preserving the PF2e system's existing responsibilities?

Decide the ownership boundary for outcome-specific native Effects, overlapping spell instances, condition values and duration, immunity and resistance interactions, persistent damage, counteracting, and terminal results. Surface catalog families such as forms and summons that require additional decisions rather than silently treating them as narrative exceptions.

Retain one-click save finalization and stop-for-review on uncertain or interrupted application. Determine what must be settled before a mixed outcome can run, how safely independent manual parts are identified, and which complex families need their own later decision tickets. This is a behavior and responsibility decision, not runtime implementation.

## Answer

Resolved with the user on 2026-09-19. The user accepted all six recommendations and additionally requested total damage to the whole group for spells targeting multiple creatures.

### Native Effects and individual casts

Use official native Effects where available. Where no ready-made Effect exists, generate one only when the spell's mechanics can be represented reliably through native Effects and rules. Mechanics that cannot be represented remain explicit coverage gaps.

Track each cast separately while following PF2e stacking rules. Ending one cast removes only its contributions, preserving unrelated conditions and other active casts. Existing native damage, immunity/weakness/resistance, condition, and standard persistent-damage handling remain the integration boundary; this decision does not authorize duplicating native processing or presume every native interaction has been live-verified.

### GM corrections and blocked targets

Before resolution, the GM may adjust a computed condition value or duration. Preserve the original calculated value and display a clear adjustment note. A correction does not make an unsupported mechanic count as automated. Such adjustments follow the existing rule that a changed prerequisite invalidates dependent provisional results; they do not reopen applied steps.

If an unresolved interaction blocks one target, keep finalization blocked until the GM corrects or explicitly excludes that target. The remaining targets may resolve only when their outcomes are independent. Never silently omit an unresolved target. This is pre-application handling of a known blocker; uncertain failure during application still stops for review.

### Counteracting and application boundaries

Identify the specific effect being challenged; the GM handles hidden or ambiguous choices. Resolve the required counteract check and end only the effect successfully counteracted, preserving other effects even when their names match.

The existing one-click finalization, explicit reaction window before it, and stop-for-review behavior remain in force. Native support is not a blanket claim that every terminal effect is executable: unrepresented or unresolved terminal mechanics remain gaps under the coverage contract.

### Result card and group damage

Show a concise per-target summary of actual damage/healing, applied conditions and Effects, and anything skipped or requiring attention. Keep calculation details, durations, and GM adjustments expandable; attention-required outcomes must remain visible in the summary.

For spells targeting multiple creatures, also show **Total damage to group**: sum the confirmed damage applied across those recipients for the displayed resolution, after each recipient's save outcome and native damage adjustments. Sum recipient results rather than the original shared damage roll. Excluded or unaffected recipients contribute no damage; healing is reported separately and never subtracted from damage. Do not include predicted future persistent-damage ticks.

The group total must count each confirmed application once. If application is interrupted or uncertain, label any known subtotal as incomplete rather than presenting it as a complete group total. Ordered casts can accumulate confirmed steps without counting earlier steps twice. This describes the requested applied-damage total, not a separate claim about net HP lost or overkill.

### Follow-up decisions

Common outcome rules do not fully specify these spell families. They now have separate child decisions, and milestone verification waits on them:

- [Define summoning and created-creature workflows](12-define-summoning-workflow.md).
- [Define transformation and battle-form workflows](13-define-form-workflow.md).
- [Define spell-created objects, areas, and movement](14-define-spatial-workflow.md).

Group totals, overlapping casts, GM adjustments, blocked targets, and exact-effect counteracting need evidence under [Define the milestone verification and exit criteria](08-define-release-evidence.md). No runtime changes or new test results are claimed by this resolution.
