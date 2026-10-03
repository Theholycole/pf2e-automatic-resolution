# Rank 4 batch 109 — Spiritual Attunement

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Spiritual Attunement (4) | The caster picks one of the nine planes on the card, and gets an Effect lasting 1 minute. PF2e's remaster has no alignment damage or alignment traits, so good is read as holy and evil as unholy. **Good planes** (Heaven, Nirvana, Elysium): the caster's Strikes gain holy (AdjustStrike), with resistance to unholy. **Evil planes** (Hell, Abaddon, Abyss): the Strikes gain unholy, with resistance to holy. **The Boneyard:** resistance to vitality and void. **Axis and the Maelstrom:** a note only. The resistance is 5, +5 per 2 ranks. The spells' trait is a note. |

## Rules

- **`src/compiler/rule-sets.js` `attunement`:** reads the sentences, the heightening and the list of planes with their alignments.
- **Options:** each plane becomes an option with its rules.
  - The traits are the remastered ones; the resistance is to the opposed alignment's trait.
  - Lawful and chaotic are dropped, with a note.
- **`ruleSetRules`:** a `scale` placeholder for a value that grows by rank.
- **Runtime:** the rule-set's `choice` asks for the option on the card (`options.choice` skips the prompt).

## Interpretation

- **The alignment names are mapped to the remaster.** Good is holy and evil is unholy; lawful and chaotic have nothing. Logged as a QUESTION.
- **"Your spells gain the traits" is a note.** PF2e has no rule that adds a trait to every spell.

## Tests

`test/rank-4-batch-109.test.js` is new. It covers Heaven at 6th, the Abyss at 5th, the Boneyard, Axis (no rules, with a note), and different text (not read).

A whole-corpus compile (b648 → b649) changed only Spiritual Attunement.

## Evidence

[Live evidence](phase-rank-4-batch-109-live-results.json), case `rank4Batch109`, in the `pftest` world.

| Cast | Result |
| --- | --- |
| Heaven, 6th rank | The Strike gains holy; resistance 10 to unholy |
| The Boneyard, 4th rank | Resistance 5 to vitality and void; no trait |

**Cleanup:** fixtures removed.
