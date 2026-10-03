# Define ritual inclusion through referenced mechanics

ID: 11
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 01

## Question

When a ritual references another spell, condition, granted action, or created creature, which downstream saving throws make that ritual part of the accepted saving-throw ritual scope?

The [verified catalog research](../../../docs/research/spell-catalog-milestone.md) establishes 29 rituals with explicit saving throws, including conditional, heightened, backlash, and later-triggered saves. Other rituals can introduce saves indirectly: Ward Domain references Illusory Object, while a ritual might create a creature with its own abilities or grant access to later spellcasting. Those are different relationships and need a consistent inclusion rule.

Decide the boundary with the user using actual baseline examples. A starting recommendation for discussion is to include saves needed to resolve or maintain the ritual's own produced effects, whether stated directly or inherited by reference, while distinguishing independently activated downstream abilities. This recommendation is not an accepted decision or an exclusion.

After the user settles the rule, inspect all 167 baseline ritual documents and their relevant referenced mechanics, using factual delegation where needed. Record a complete included/excluded/unresolved classification with source identity and rationale. Any unresolved item remains a visible gap; 29 direct matches are a floor, not a frozen denominator. Link the resulting manifest as an asset instead of pasting it here.

Resolve when the inclusion rule and its full-catalog application are established, or create explicit follow-up prerequisites for unresolved references. This supplies exact ritual membership to the ritual-workflow decision and final coverage acceptance.

## Comments

### Scope accepted — 2026-09-19

The user accepted all three recommendations:

- Include saves belonging to the ritual's produced effects even when their rules appear in a referenced spell.
- A created creature or separately used granted ability does not qualify the ritual solely because its independent activity might later cause saves. Saves required by the ritual itself still qualify.
- Include saving throws for recovery from conditions imposed by the ritual, including conditions from failure outcomes. Use native condition handling where available and preserve the existing affliction-delegation exception.

Full-catalog classification is in progress before closing this decision.

### Full catalog review — 2026-09-19

[Provisional ritual scope audit](../../../docs/research/ritual-scope-audit.md) classifies all 167 records with provenance and rationale: 43 included, 112 excluded, 12 unresolved. Remaining discretionary-save and environmental boundaries require user decisions; factual reference gaps remain visible. This ticket stays claimed until those decisions or explicit follow-up prerequisites are recorded.

## Answer

The user accepted the produced-effect, independent-ability, and condition-recovery boundaries recorded above, plus both follow-up recommendations:

- Optional GM invention or substitution of a saving throw does not itself qualify a ritual. A save must be established by the ritual or its referenced mechanics.
- General environmental consequences, including weather, falling into water, and hazardous terrain, do not qualify a ritual solely through possible later saves. Explicitly invoked save mechanics remain included. General environmental automation follows this milestone.

Applying these boundaries yields 43 included, 121 excluded, and three unresolved entries across all 167 rituals. [The audit](../../../docs/research/ritual-scope-audit.md) records every classification. [Resolve remaining ritual membership references](15-resolve-ritual-references.md) is an explicit prerequisite for ritual workflow and final catalog acceptance; these three entries are not silently excluded. This resolves the inclusion policy, not the remaining factual gaps.
