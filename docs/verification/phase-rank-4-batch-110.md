# Rank 4 batch 110 — Pest Swarm

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Pest Swarm (4) | The caster picks one of the six squadrons on the card. The card then holds that squadron's Arrive and Depart, each a save for the creatures the GM targets, with the reminder of who they are (the enemies in its space, within 5 feet, or a cone). PF2e's item has no damage, so the text's dice are rolled. The riders are the rows: can't use concentrate actions (a note), Sickened, Drained, Dazzled for 1 round, Prone with 2d6 bludgeoning, and the webs' –10/–20-foot Speed penalty that an Escape against the spell DC ends (1 minute). The spiders' venom is its own Fortitude save at DC 24, for those who failed the Arrive; a failure hands off violin spider venom at stage 1 (stage 2 on a critical failure). The rats' and webs' difficult terrain for 1 round is the card's terrain control on the selected region. |

## Rules

- **`src/compiler/incarnate-squadrons.js`:** reads the opening, which gives the space and the choice. It then reads each option's speeds and its Arrive and Depart.
  - **Lead sentences:** a set of lead patterns (damage with a basic save, or a save the creatures attempt).
  - **Riders:** a set of rider patterns.
  - **Phase text:** each phase's text is rewritten as a save with rows.
  - **The affliction:** "exposed to" the listed affliction adds a phase for that affliction's own save, at its stated DC.
- **`compileSpell`:** compiles each phase.
  - The formula mode is used for an item with no damage (`incarnateFormula` evidence).
  - The terrain is set as `areaTerrain` in rounds (`incarnateTerrain` evidence).
- **`basic-save-core`:** accepts round-long terrain from an incarnate phase, and the incarnate formula.
- **The card:** the terrain prompt reads "1 round".
- **`outcome-semantics`:** "can't use concentrate (or manipulate) actions" is an action restriction, a note.
- **Runtime:** the incarnate card asks for the option (`options.choice` skips the prompt) and shows that option's phases. A phase with a stated DC uses it.

## Interpretation

- **"For 1 minute; a creature can remove this penalty with a successful Escape"** is read as "until it Escapes", lasting the phase's 1 minute.
- **"Exposed to violin spider venom" is the venom's initial save.** It is made at the DC its block states (24), by the creatures that failed the Arrive; the GM targets them.
- **Pseudo Afflictions has no Effect for this venom.** The handoff names the affliction and its stage, and the GM applies it (the accepted affliction exception).
- **The phase saves cover the targeted creatures.** "Enemies" and "all creatures in the cone" are the GM's targeting, which the reminder states.

## Tests

`test/rank-4-batch-110.test.js` is new. It covers the six squadrons and the support of all 13 phases. It also checks:

- the pigeons' two-type formula;
- the cockroaches' non-basic Depart;
- the venom's DC and handoff;
- the rats' 6-second terrain;
- the webs' –20;
- an unknown rider (not read).

A whole-corpus compile (b649 → b650) changed only Pest Swarm.

## Evidence

[Live evidence](phase-rank-4-batch-110-live-results.json), case `rank4Batch110`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| Spiders, Arrive, failure | 3d6 piercing |
| Venom save | DC 24; the failure hands off Violin Spider Venom, stage 1 |
| Spiders, Depart, critical failure | –20 to all Speeds, ended by an Escape against DC 24, 1 minute |
| Depart again | Refused |
| Rats, Depart, failure | 2d6 bludgeoning and Prone |
| Rats' terrain | Placed on the region for 6 seconds |

**Cleanup:** fixtures and the region removed.
