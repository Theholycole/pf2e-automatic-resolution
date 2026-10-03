# Ritual reference follow-up

Date: 2026-09-19. Baseline: PF2e 8.5.0, release commit `3601a90ce232134c590d9641df9b62a7254aee6d`. This investigates ticket [15](../../.scratch/full-spell-automation/issues/15-resolve-ritual-references.md) under the [accepted inclusion policy](../../.scratch/full-spell-automation/issues/11-define-referenced-ritual-saves.md). It changes no runtime behavior.

## Construct Mindscape — excluded

The baseline publication is *Dark Archive (Remastered)*. The matching [ritual](https://2e.aonprd.com/Rituals.aspx?ID=231) creates a mental environment and permits selected creatures to enter. Neither its outcomes nor heightened versions specify a save. [Remastered Mindscape Statistics, page 198](https://2e.aonprd.com/Rules.aspx?ID=3513) supplies the previously missing reference: immersive mindscapes have Finite, Metamorphic, and Subjective Gravity traits. Veiling hides the nature of the environment but does not specify a disbelief saving throw.

The referenced [Finite](https://2e.aonprd.com/Traits.aspx?ID=603), [Metamorphic](https://2e.aonprd.com/Traits.aspx?ID=649), and [Subjective Gravity](https://2e.aonprd.com/Traits.aspx?ID=705) rules likewise impose no saves. Subjective gravity uses a free action to select down and the Fly action for movement. **Policy application:** possible environmental dangers or GM-created mechanics do not qualify the ritual. No mandatory inherited save remains established by this chain, so exclusion is supported.

## Aspirational State — source still missing

The baseline ritual explicitly refers to page 7 for spending Aspiration Points. The exact needed source is **Pathfinder Society Scenario #2-22: Breaking the Storm: Excising Ruination**, product **PZOPFS0222E**, **page 7, Aspiration Points rules**, including any mechanically referenced continuation. The [publisher listing](https://paizo.com/products/btq027p8/discuss?Pathfinder-Society-Scenario-222-Breaking-the-Storm-Excising-Ruination=) identifies the scenario but does not expose that rules text.

The local baseline journal search found no Aspiration Points text. Public search found play-by-post discussions, not an authoritative complete subsystem. Those discussions were not used to decide membership. The ritual's grant of points does not establish what spending them does. Membership remains unresolved until the actual rules are available; absence from accessible sources is not evidence of exclusion.

## Recall Past Life — verified text, unresolved interpretation

The [remastered ritual](https://2e.aonprd.com/Rituals.aspx?ID=228) and [Paizo's Spring 2026 remaster compatibility errata, page 146](https://paizo.com/pathfinder/faq) confirm the baseline: critical failure kills the target and immediately puts a malevolent spirit in its body, using Ghost Commoner statistics and Malevolent Possession. Older indexed legacy results use a husk zombie and cannot settle the remastered baseline.

The local baseline `bestiary-family-ability-glossary/ghost/ghost-malevolent-possession.json` imports `spells/spells/rank-7/possession.json`. Ordinary Possession requires an initial Will save; only its failure outcome grants recurring Will saves. Its critical failure outcome instead grants full control. Neither the inspected ritual, ability, spell, nor the publisher erratum specifies a degree of success for the dead body's immediate possession, or explicitly assigns subsequent saves to that dead host.

**Inference and limit:** immediate possession is a specific exception to ordinary targeting, but that alone does not establish which save-outcome branch applies. Importing living-target saves automatically would invent a resolution rule. This is now a documented interpretation gap rather than missing ritual text. An authoritative clarification or an explicit project ruling is needed to determine membership; it remains unresolved. No external question was posted and no user exception was assumed.

## Catalog effect before user decisions

The manifest still contains 167 entries: **43 included, 122 excluded, 2 unresolved**. Only Construct Mindscape changed membership. The final denominator remains unsettled.

## Accepted scope decisions — 2026-09-19

After the research above, the user accepted **excluding Recall Past Life pending authoritative clarification**. Its rules ambiguity remains documented, but no longer blocks this milestone. The user also confirmed the Aspirational State source is unavailable and instructed **“no. skip that”**. Aspirational State is therefore recorded as `skipped` with basis `user-approved-unverified-exception`, not as a verified no-save ritual.

The resulting 167-entry classification is **43 included, 123 excluded, 1 skipped, 0 unresolved**. Of the exclusions, 122 are supported by the rules/policy audit and one is the explicit provisional ruling. The milestone ritual denominator is **43**; combined with the 1,827 non-ritual spell documents, the accepted scoped catalog contains **1,870 documents**, subject to these recorded exceptions. Scope resolution provides no implementation or runtime coverage evidence.
