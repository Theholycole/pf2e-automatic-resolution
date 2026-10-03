# Full Spell Automation — First Major Milestone

Label: wayfinder:map
Status: resolved

## Destination

A decision-complete implementation plan for dependable coverage of the PF2e 8.5.0 spell catalog, including cantrips, focus spells, and every ritual in that baseline that requires a saving throw, before expanding to other system automation. The map is finished when the workflows, exceptions, evidence, and release sequence are settled; the software milestone is finished only after that plan is implemented and verified.

## Notes

- Planning only. Work one human decision ticket per session; research tickets may resolve in parallel. Use wayfinder, grilling, and domain-modeling for decisions; use research or prototype for tickets of those types. Apply writing-for-agents when maintaining this map.
- Scope confirmed by the user on 2026-09-19: the baseline catalog above is the coverage denominator. Custom spells using recognized official structures are supported; unrecognized mechanics must be identified. See [shared vocabulary](../../CONTEXT.md).
- Preserve the [prior agreements](../../docs/planning/pre-milestone-handoff.md) for GM correction controls, one-click Finalize and its preceding reaction window, three-card saves, ownership, reminder-driven auras, interrupted application, and the personal-table compatibility baseline. The spell-first scope replaces that handoff's early non-spell architecture trials.
- Runtime and schema context: consult [module behavior](../../docs/module-runtime.md) when deciding user flows, [normalized ability model](../../docs/normalized-ability-model.md) when deciding resolution semantics, and [baseline](../../BASELINE.md) when defining regression evidence. Reports under `reports/` are evidence to inspect, not a blanket claim of runtime support.
- Local tracker: child files are in `issues/`. Each has its own identity, title, type, status, assignee, and dependency list. Read the first open, unassigned child whose blockers are resolved; assign it to the driving developer and mark it claimed before work. Record resolution under `## Answer`, mark resolved, and add only a linked gist below. Dependency IDs are file-number prefixes. Query children for open work; this map stores no duplicate open-ticket list.

## Decisions so far

- [Establish the spell and saving-throw ritual catalog](issues/01-establish-baseline-catalog.md): the verified baseline has 1,827 non-ritual spells and at least 29 qualifying rituals; indirect ritual inclusion remains a named decision.
- [Establish native support for ongoing spell effects](issues/02-establish-lifecycle-support.md): native expiry and deletion differ; a live event experiment now gates the ongoing-workflow decision.
- [Define the spell coverage and exception contract](issues/03-define-coverage-contract.md): expose supported variants while retaining spell-level gaps; check every legal rank/variant, distinguish live evidence, and explain limits before resolution.
- [Define casting, targeting, and non-save spell workflows](issues/04-define-cast-workflows.md): keep native casting, add guided choices/targets, preserve target-bound rolls and GM authority, and use ordered steps only for dependent outcomes.
- [Define outcome application and native system ownership](issues/05-define-outcome-ownership.md): preserve each cast's contributions, support GM outcome corrections, and report per-target results plus total group damage.

- [Define ritual inclusion through referenced mechanics](issues/11-define-referenced-ritual-saves.md): include ritual-owned and recovery saves; exclude optional GM saves and general environmental consequences, with final membership and user-approved exceptions recorded in ticket 15.

- [Define transformation and battle-form workflows](issues/13-define-form-workflow.md): automate form mechanics and granted abilities, preserve unrelated state on reversion, and verify native integration before claiming coverage.

## Not yet specified

- Detailed rules and interactions in the long tail of the catalog that the initial family inventory cannot yet distinguish. Promote each precise unresolved question into its own ticket as evidence exposes it.
- Further source investigations that future spell-family requirements make precise, beyond the known expiry experiment already tracked as a child ticket.
- Additional user-interface prototypes needed after casting, outcome, ritual, or ongoing-workflow decisions expose concrete choices.

## Out of scope

- Non-spell player abilities, kineticist impulses, monster abilities, hazards, and item automation, including the earlier proposed architecture trials; these follow the spell milestone.
- Rituals that do not require a saving throw.
- A completeness guarantee for arbitrary homebrew prose beyond recognized spell structures.
- Implementing affliction progression handled elsewhere.
- Public distribution and broader Foundry/PF2e version compatibility.
- Automatic recovery or blind retry after uncertain application; the accepted behavior remains stop-for-review.
- Production implementation during this planning map.

## Planning completion

The user approved the ongoing prototype. The [live expiry investigation](../../docs/research/native-expiry-experiment.md) established required reconciliation and recovery behavior; tickets 06/10/12/14 incorporate it. Ticket 15 settles ritual scope with explicit user exceptions, completing ritual workflow 07. The [evidence matrix](../../docs/planning/release-evidence-matrix.md) and [implementation plan](../../docs/planning/full-spell-implementation-plan.md) resolve tickets 08/09.

This closes the planning map only. Begin GM corrections; production coverage and each release's live verification remain open. Newly discovered spell-specific rules or implementation gaps must still be recorded explicitly rather than assumed supported.
