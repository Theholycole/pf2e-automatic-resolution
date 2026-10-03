# Define saving-throw ritual handling

ID: 07
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 01, 03, 11, 15

## Question

For every ritual included because it requires a saving throw, where should this module's workflow begin and end?

Use the qualifying ritual inventory to distinguish ritual skill-check adjudication, identifying the casting result and save DC, immediate saves, later-triggered saves, and their mechanical consequences. Inclusion of saving-throw rituals is already settled; the question is what must be automated and what native or explicit human input supplies prerequisites.

Decide how this workflow reuses ordinary spell resolution, preserves any ongoing obligations, and reports exceptions under the coverage contract. Do not assume that supporting the saving throw automatically makes the entire ritual complete.

## Comments

### Accepted ritual workflow round

The user accepted all six recommendations:

- Use native rolls and GM adjudication for the ritual ceremony and skill checks. Begin this module's resolution from the confirmed casting outcome, then automate qualifying saves and spell consequences.
- Reuse reliable recorded outcome, rank, participant, target, and save-DC information. Ask the GM to supply or confirm missing details before affected rolls; never guess a DC.
- Account for all four degrees of success and relevant heightened variants, including backlash. Clearly distinguish automated consequences from accepted exceptions.
- Preserve a persistent ritual record for later-triggered saves. Reuse shared ongoing-spell controls; allow the GM to trigger events that the scene cannot reliably detect.
- Keep enough information to manage long or permanent ritual effects independently of the original caster or chat message. Follow actual ending conditions; deletion or disappearance alone does not establish expiry.
- For afflictions, resolve supported initial saves and immediate consequences, then explicitly hand off progression to the designated handler or GM. Show the handoff without claiming progression was automated.

The general workflow policy is accepted. This ticket remains claimed pending the three membership references and any spell-specific requirements they expose. Shared ongoing behavior also requires its recorded prototype and expiry verification; no runtime support is implied.


## Answer

The accepted ceremony-outcome intake, missing-input gates, all outcome/rank branches, persistent records, and affliction handoff remain authoritative. Ticket 15 settles membership with 43 included rituals, 123 exclusions (including one provisional user ruling), and one explicitly skipped unverified exception. Reuse resolved ongoing workflow 06 for later obligations and actual ending conditions; persistent records survive absent caster/chat. R1/R2 and catalog checks in the [evidence matrix](../../../docs/planning/release-evidence-matrix.md) define verification. This is planning resolution, not ritual runtime coverage.
