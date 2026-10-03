# Establish native support for ongoing spell effects

ID: 02
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:research
Type: research
Mode: AFK
Status: resolved
Assignee: theholycole (research delegated to lifecycle-research)
Blocked by: none

## Question

What does Foundry v14 / PF2e 8.5.0 already own for recurring saves, sustained effects, duration expiry, dismissal, encounter timing, and aura reminders, and what durable responsibility would remain with this module?

Compare version-specific primary sources against the existing runtime. Cover reloads, active-GM changes, turn/round and world-time changes, token/actor identity, native Effect and condition expiry, sustained or action-linked termination, and reminder-driven auras. Distinguish verified baseline APIs from latest-version documentation and inferences. Identify where live experiments are still necessary; do not claim source reading proves behavior in a running world.

Produce a concise capability matrix with evidence and uncertainties sufficient to inform the ongoing-spell workflow decision. Preserve the accepted reminder-driven aura and stop-for-review boundaries; research does not choose a replacement product workflow.

Research workspace: `/tmp/pf2e-spell-lifecycle-research`, branch `research/spell-lifecycle-milestone`. Findings: `docs/research/spell-lifecycle-milestone.md`.

## Answer

Resolved 2026-09-19 as bounded source research. The [capability matrix and primary-source citations](../../../docs/research/spell-lifecycle-milestone.md) distinguish exact PF2e 8.5.0 source, version-qualified Foundry v14 documentation, current module behavior, and unverified live behavior.

PF2e supplies native Effect storage, duration computation, and expired-rule suppression. Computed expiry and document deletion are distinct; current module Item listeners do not establish a universal expiry notification. Ongoing spell-specific state, recurring saves, Sustain association, and reminder coordination remain planning responsibilities rather than verified native capabilities. Existing persisted one-shot resolution does not establish a durable ongoing controller.

Live hook ordering, expiry when automatic removal is disabled, and GM/reload behavior remain prerequisites. They are captured in [Verify native expiry events in the baseline world](10-verify-native-expiry.md), which blocks the ongoing-workflow decision. The research file also identifies exact-tag runtime source areas not inspected; no source or live completeness claim is made.

Research checkout: `/tmp/pf2e-spell-lifecycle-research` on `research/spell-lifecycle-milestone`; the linked copy in this repository is the durable planning asset. No runtime changes or live tests were performed.
