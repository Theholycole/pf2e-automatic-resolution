# Define spell-created objects, areas, and movement

ID: 14
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 04, 05, 06

## Question

How should spells that create walls or other objects, alter an area, or move creatures apply their spatial consequences in Foundry?

Decide when the caster supplies placement and when the GM adjudicates it; which native scene objects represent the result; how range, destinations, size, obstructions, and spell-specific geometry are validated; and how mechanically relevant durability, collision, targeting, and interactions are represented. Keep descriptive scene decoration distinct from verified mechanical behavior.

Define ownership, cast linkage, later editing, and cleanup for created scene objects without changing unrelated scene content. Identify precise limits where the baseline cannot represent an outcome and apply the accepted coverage-gap policy. Reuse ongoing-spell lifecycle decisions where duration or later triggers are involved.

## Comments

Begin independent spatial interaction questions at the user's request. The ongoing-spell dependency remains required before resolution; duration, recurring triggers, and cleanup are not assumed by this initial round. Existing casting/targeting permissions and GM adjudication rules remain settled.

### Accepted spatial interaction round

The user accepted all six recommendations:

- Show an editable placement preview with spell dimensions and limits before applying walls or shaped areas. Flag uncertain geometry for GM review.
- Represent required movement, sight, and targeting restrictions mechanically. A visual marker alone does not establish full automation.
- Make destructible spell-created objects targetable and track their defined defenses, durability, and damage rules. Identify unsupported mechanics as coverage gaps before resolution.
- Calculate forced movement when the rules determine a unique result. Otherwise request a legal destination from the authorized chooser; resolve uncertain collisions or restrictions with the GM before moving anything.
- Support a GM-selected teleport destination in another available scene. If no destination scene exists, record the resolved travel outcome and explicitly hand off narrative placement rather than inventing a map. This does not waive other mechanically consequential targeting or destination rules.
- Preserve cast linkage when created scene objects are edited. Permit player changes only when the spell allows them; permit GM corrections and visibly flag edits that prevent reliable automation.

The ticket remains claimed. Duration, recurring triggers, and cleanup still depend on the ongoing-spell workflow; these accepted choices do not establish runtime support.

### Shared lifecycle policy accepted

The [ongoing-spell decision](06-shape-ongoing-workflow.md) now records accepted policies for missed Sustain, source loss, confirmed endings, selective cleanup, explicit GM detachment, and ending consequences. Reuse that decision rather than introducing a separate lifecycle. Its prototype and expiry verification are still unresolved prerequisites; this ticket remains open.


## Answer

The accepted preview, collision, durability, movement, destination, and editing policies combine with the resolved ongoing workflow (06). Link creations to durable cast records; preserve permanent or independent consequences and explicit GM detachments. Apply reliable restrictions mechanically and route uncertain geometry to GM review before mutation. P1/P2 and lifecycle variations in the [evidence matrix](../../../docs/planning/release-evidence-matrix.md) define verification. This resolves workflow planning, not native spatial support.
