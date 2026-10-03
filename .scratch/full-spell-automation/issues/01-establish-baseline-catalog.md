# Establish the spell and saving-throw ritual catalog

ID: 01
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:research
Type: research
Mode: AFK
Status: resolved
Assignee: theholycole (research delegated to catalog-research)
Blocked by: none

## Question

Which exact content belongs to the accepted PF2e 8.5.0 milestone, and which mechanical families must its coverage accounting include?

Reconcile the checked-in 1,277-spell inventory with the baseline's authoritative spell and ritual sources. Identify rituals whose text requires a saving throw, distinguishing creature saves from primary and secondary ritual skill checks. Record source versions, acquisition method, stable identities, and any missing or unverifiable content. Use a reproducible inclusion rule; a text search alone is candidate discovery, not final semantic classification.

Identify representative spell families beyond the current save/native-Effect runtime: attacks, healing, choices, targeting, counteracting, summoning/forms, areas, movement, ongoing effects, and other mechanically consequential outcomes. Record existing compiler, executable-runtime, and live-verification evidence separately.

Research facts only. Questions about how the module should handle those families belong to later decision tickets. If baseline sources cannot be obtained, document the exact limitation and keep catalog membership unresolved.

Research workspace: `/tmp/pf2e-spell-catalog-research`, branch `research/spell-catalog-milestone`. Findings: `docs/research/spell-catalog-milestone.md`.

## Answer

Resolved 2026-09-19 for baseline provenance, non-ritual membership, direct ritual requirements, and representative mechanical families. The newly exposed indirect-ritual membership decision is explicitly carried by [Define ritual inclusion through referenced mechanics](11-define-referenced-ritual-saves.md); this research does not freeze the final ritual denominator.

The [research findings and primary-source evidence](../../../docs/research/spell-catalog-milestone.md) verify all 1,995 spell-pack JSON blobs in the user's local source against the exact PF2e 8.5.0 tree: 1,994 content documents plus folder metadata. The catalog contains 1,827 non-ritual spells: 1,277 regular, 545 focus, and 5 impossible spells. Existing reports scan only the regular-spell directory and therefore omit 550 in-scope non-ritual documents.

There are 167 ritual documents; 29 directly require saving throws after semantic review. The known milestone floor is 1,856 documents. Referenced spells, conditions, and independently granted abilities may alter ritual inclusion, so the final count remains open until the linked decision and its catalog classification are complete.

The research distinguishes compiler labels, executable save gates, and historical live evidence, and identifies representative mechanical families for the later workflow decisions. No module tests, live Foundry tests, or runtime changes were made.

Research checkout: `/tmp/pf2e-spell-catalog-research` on `research/spell-catalog-milestone`; the linked copy in this repository is the durable planning asset. The research file's proposed unresolved follow-up is now the named child ticket above.
