# Rank 7 batch 20: group 10, attack shapes

2026-10-05. Spells whose attack has its own shape, each as a card of parts.

| Spell | Now |
| --- | --- |
| Ray of Corruption | **The attack, then the save**: the module rolls the spell attack against the target's AC. On a hit, the Fortitude save: half, full plus 2d12 persistent acid, or double plus 4d12 persistent acid. On a critical hit, the save is one degree worse. Both 6d12 pools rise with the rank. Melting organic objects is a GM note. |
| Deity's Strike | **The weapon's attack**: 7d12 force (8d12 at 9th), double on a critical hit. **The shock wave**: the GM places the 30-foot line from the target, then 5d6 spirit (6d6 at 9th), basic Reflex. |
| Pierce the Sky | **The arrows**: up to 3 attacks with one multiple attack penalty, each 6d12 electricity and 6d6 sonic by the written rows (Deafened for 1 minute or 1 round; half on a miss). **The lines**: the module draws a 5-foot line from the caster to each creature shot. For 1 minute, a creature entering a line or starting its turn there takes 12 electricity, once per round. |
| Doom Mark | **The dart** (on the cast and each first Sustain): 6d8 void (+1d8 per rank), and Enfeebled 1 and Stupefied 1 until the spell ends. The card's record ends the marks after its minute. When a marked creature drops to 0 Hit Points, the other marked creatures become Off-Guard and Clumsy 1 for 1 round. |
| Ravenous Darkness | **The darkness**: the placed 20-foot burst is rank-4 Darkness (its region and notes). The module rolls the spell attack against each creature's Fortitude DC inside. On a success: 4d6 bludgeoning, and the teeth attach (–10-foot Speeds, no Step). At the end of each creature's turn there, attached teeth deal 1d6; otherwise the teeth attack again. The teeth let go when the creature leaves. |
| Comet Charge | The element is chosen on the cast. **The charge**: the caster flies to the free space beside the target nearest it (within 120 feet), down to the target's elevation. Then the melee attack: +2 (the target Off-Guard) if the caster began higher. Each element's damage and rider: persistent acid, a –15-foot Speed penalty, Dazzled or Clumsy. For Rust, the GM answers whether the target is metal (10d10 instead of 10d8). |
| Unbreaking Wave Containment | **The strands' attack** (up to 4 targets): Immobilized, plus Restrained on a critical hit, until it Escapes. **The constricting waves**: 10d6 bludgeoning, basic Fortitude, for the held creatures. Both repeat on a Sustain. The card's Sustained record ends the hold when the spell ends. |

New runtime:

- Card parts: **attack-save** (a spell attack, then a save, a degree worse on a critical hit), **charge** (flight beside the target, then the attack with the height bonus), **teeth** (darkness, attacks against a save DC, attached teeth), and **hazard** lines drawn between the caster and its targets.
- A card's **lasting record**, Sustained or timed, holds its parts' Effects and ends them with the spell. A save card can attach to it.
- The marks' payoff when a marked creature reaches 0 Hit Points.
- Save cards accept a card's degree adjustment and a stated attack bonus.

## Tests

`test/rank-7-batch-20.test.js` is new. A whole-corpus compile (b794 → b795) changed only these seven spells. The spell-attack reader now accepts "up to 4 creatures".

## Evidence

[Live evidence](phase-rank-7-batch-20-live-results.json), case `rank7Batch20`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Ray of Corruption: critical hit on a creature that critically succeeds | Save read as a success (one degree worse), 43 damage; a miss: no save, no damage |
| Deity's Strike: hit, then the wave's failure on the target and a neighbour | 45, then 14 more each |
| Pierce the Sky: two hits; a creature stepping onto a line | 63 each and Deafened; 2 lines drawn; 12 electricity |
| Doom Mark: two marks; one dropped to 0 Hit Points | Both Enfeebled and Stupefied; the other Off-Guard and Clumsy |
| Ravenous Darkness: the teeth's success; turn's end; leaving | 13 and attached, darkness behaviour; gnaw 2; released |
| Comet Charge (lightning, from 20 feet up); rust on metal | Adjacent, elevation 0, +2 bonus, 50 and Dazzled; the metal attack used |
| Unbreaking Wave Containment: critical and plain hits; crush failure; no Sustain | Immobilized and Restrained, and Immobilized; 44; the hold ended |
