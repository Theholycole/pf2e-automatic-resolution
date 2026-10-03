# PF2e Automatic Ability Resolution — session handoff

## Purpose and current status

Continue the existing module, beginning with GM correction controls on the save-resolution card. This session read the prior conversation, inspected the project, and conducted a design interview. No project files were changed and no tests were run.

The inspected repository was clean at commit `92b4fd4` (`feat: add PF2e automatic resolution runtime`), module version 0.8.2. Recheck current state before editing.

Project root: use the active workspace named `PF2e AUTOMATIC SPELL RESOLUTION`. Absolute home-directory paths and personal identifiers are intentionally omitted here.

## Existing artifacts: read rather than reconstruct

Paths below are relative to the project root:

- `module.json`: version and Foundry/PF2e compatibility baseline.
- `docs/module-runtime.md`: implemented workflows, permissions, persistence, damage, Effects, and current limitations.
- `docs/normalized-ability-model.md`: compiler schema, resolution semantics, and lifecycle contracts.
- `BASELINE.md`: frozen macro reference and regression matrix.
- `Goals.txt`: original priorities; note the later explicit affliction exception below.
- `scripts/basic-save-core.js`, `scripts/basic-save-runtime.js`, `scripts/main.js`: likely starting points for correction controls.
- `scripts/effect-runtime.js`, `scripts/runtime-core.js`: native Effect execution and shared helpers.
- `src/compiler/`: source-neutral compilation and safety gates.
- `reports/` if present: locate checked-in coverage reports; do not confuse compilation coverage with executable or live-tested coverage.
- `package.json` and `test/`: inspect actual verification commands and existing test conventions.

Prior shared conversation (user-provided source): https://chatgpt.com/s/cx_6aaf104474d48191a538c988ae75c171

The shared page was readable through the in-app browser after ordinary web retrieval failed. It documents prior implementation and live testing through 0.8.2. No need to reread its entirety if the local artifacts answer the question.

## New decisions agreed during this interview

These decisions are not yet recorded in project artifacts or implemented.

### Immediate milestone: GM correction controls

All controls operate before Finalize:

1. **Exclude/restore a target:** exclude it from resolution without erasing its entry or existing roll. Retain a collapsed entry with Restore Target. Restoration preserves the existing roll.
2. **Adjust degree of success:** retain the original dice and display an explicit note, such as “GM adjusted: Failure → Success.” A subsequent reroll clears the override. Secondary-save requirements must follow the effective degree and be removed/recreated as appropriate.
3. **Toggle Unaffected:** a GM may mark a target unaffected or reverse either an automatically assigned or manually assigned Unaffected state. This applies only to this resolution and does not grant lasting immunity. Show an override note. Once restored to affected, the target must complete any required saves.

Build and live-test these controls as one small release before outcome-specific native Effects. Preserve existing ownership boundaries: these are GM correction controls.

### Ordered roadmap agreed here

1. GM correction controls.
2. Outcome-specific native Effects applied according to finalized save outcomes.
3. Persistent combat reminders and recurring saves, providing shared groundwork for sustained spells and aura reminders.
4. One kineticist impulse, monster ability, and hazard as non-spell architecture trials; then resume broad spell coverage.

### Product and behavior decisions

- Keep **one-click Finalize Saves & Resolve**. The user explicitly considers the time before manually pressing Finalize to be the reaction window. Do not add a damage-preview/application pause or ask this again.
- Permit partial save automation only when the unresolved manual portion is clearly independent. If unresolved rules can change targeting, saves, damage, or effect application, keep the path blocked.
- Interrupted application remains stop-for-review for now. Clearly distinguish completed work from uncertain work; do not blindly repeat damage. Automatic recovery is a separate future milestone.
- Prioritize dependable use at the user's own table on the established Foundry v14 / PF2e 8.5.0 baseline. Public distribution and broader compatibility are separate milestones.
- Existing decisions remain in force: three-card workflow, inline saves, rerolls before Finalize, retaining invalid targets as Unaffected, reminder-driven auras, and afflictions delegated elsewhere. The affliction exception was explicitly approved in the previous conversation; do not reopen it as a contradiction with Goals.txt.

## Approval / interview state

The user explicitly accepted recommendations for all eleven interview questions, including implementing correction controls first. The last assistant response summarized agreement and asked for the grilling skill's final shared-understanding confirmation. The user invoked handoff instead of answering that final confirmation.

Do not interpret the handoff request itself as that confirmation. If the next user message says to implement or continue with the controls, treat that as confirmation and proceed without repeating the interview. If the next session provides no such direction, ask only for confirmation of the summarized scope; no further design questions were outstanding.

## Suggested skills

- **grilling**: call via the Skill tool if available, or read its SKILL.md, only if finishing the pending shared-understanding confirmation or if the user requests further design interviewing. The user originally invoked `grill-me`, which redirects to `grilling`.
- **diagnosing-bugs**: use if a live regression or broken behavior is reported.
- **codebase-design**: use if correction-state handling requires a meaningful interface/state-model design decision.
- **writing-for-agents**: use if creating or editing agent-facing project instructions; this handoff does not authorize unrelated instruction-file changes.

Do not invoke unrelated PF2e boss-macro or dungeon skills for this module. Do not spawn agents proactively unless requested by the user or required by an applicable skill/instruction. A read-only exploration agent was used here because grilling explicitly required delegating factual investigation.

## Practical notes

- No applicable AGENTS.md was found in the workspace or its ancestors during inspection; recheck if files change.
- `rg` was unavailable in this environment; use an available search alternative without spending time installing it.
- Project tests and coverage figures reported in the prior chat are historical, not checks performed this session.
- Follow existing tests for meaningful coverage of exclusion/restoration, overrides/rerolls, secondary-stage changes, unaffected overrides, finalization readiness, and persistence as relevant. Live Foundry verification remains distinct from automated checks.
- Keep communication concise and nontechnical unless implementation details help the user. The user prefers action and dislikes repeated permission requests.
