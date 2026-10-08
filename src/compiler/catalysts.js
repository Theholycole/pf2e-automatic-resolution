// PF2e's catalysts (items with the catalyst trait; the user, 2026-10-08: build them): "Activate Cast a Spell … When used as a catalyst to cast a Fireball spell, …" — the item's card
// arms the caster's next cast of the named spell(s) (item-spellshape.js), and what the catalyst adds rides on it, read from its text:
// - riders on the creatures the save card resolves (persistent damage, conditions, a push, damage, a reduced condition) or on the healed creature;
// - PF2e's own Effect: on the caster as the spell is cast when it changes the spell (ItemAlteration, DamageAlteration), on the creatures when it is theirs;
// - the rest a GM note with the cast (terrain, areas, targeting, durations, narrative).
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim().replace(/[’]/g, "'");
const SPELL_LINK = /@UUID\[Compendium\.pf2e\.spells-srd\.(?:Item\.)?[A-Za-z0-9]+\]\{([^}]+)\}/g;
const EFFECT_LINK = /@UUID\[(Compendium\.pf2e\.equipment-effects\.(?:Item\.)?[A-Za-z0-9]+)\]\{(Effect: [^}]+)\}/;
const COND = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.(?:Item\.)?([A-Za-z0-9]+)\]\{([A-Za-z-]+)(?: (\d+))?\}`;
const cond = (id, name, value) => ({ uuid: `Compendium.pf2e.conditionitems.Item.${id}`, slug: name.toLowerCase(), value: value ? Number(value) : null });

// [pattern over the text, (match, text) => {riders?, casterEffect?, targetEffect?, note?, requires?}].
const FORMS = [
    // Backdraft Bead: "a creature that fails its saving throw is also knocked back 5 feet from the center of the spell (10 feet on a critical failure)."
    [/a creature that fails its saving throw is also knocked back (\d+) feet from the center of the spell \((\d+) feet on a critical failure\)\./,
        m => ({ riders: [{ type: "push", degrees: { failure: Number(m[1]), criticalFailure: Number(m[2]) }, from: { burst: "center" } }] })],
    // Firestarter Pellets: "clinging flames that deal 1d6 persistent fire damage to all who fail the saving throw against the effect (2d6 persistent fire damage on a critical failure)."
    [/deal @Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\] damage to all who fail the saving throw against the effect \(@Damage\[(\d+d\d+)\[persistent,[a-z]+\]\] damage on a critical failure\)\./,
        m => ({ riders: [{ type: "persistent", formula: m[1], damageType: m[2], degrees: ["failure"] }, { type: "persistent", formula: m[3], damageType: m[2], degrees: ["criticalFailure"] }] })],
    // Bottled Screams: "If a target fails its saving throw against your Seal Fate spell after you've added this catalyst, it takes 1d6 persistent damage of the type chosen for the spell
    // (2d6 persistent if it critically fails)."
    [/If a target fails its saving throw against your .+? spell after you've added this catalyst, it takes @Damage\[(\d+d\d+)\[persistent\]\] of the type chosen for the spell \(@Damage\[(\d+d\d+)\[persistent\]\] if it critically fails\)\./,
        m => ({ riders: [{ type: "persistent", formula: m[1], damageType: "spell", degrees: ["failure"] }, { type: "persistent", formula: m[2], damageType: "spell", degrees: ["criticalFailure"] }] })],
    // Discordant Strings: "a creature that fails its saving throw is also Deafened for 1 round."
    [new RegExp(String.raw`a creature that fails its saving throw is also ${COND} for (\d+) rounds?\.`),
        m => ({ riders: [{ type: "conditions", degrees: Object.fromEntries(["failure", "criticalFailure"].map(degree => [degree, [{ ...cond(m[1], m[2], m[3]), rounds: Number(m[4]) }]])) }] })],
    // Leaden Weight: "A creature that fails its saving throw is also knocked Prone after it moves."
    [new RegExp(String.raw`A creature that fails its saving throw is also knocked ${COND} (after it moves)\.`),
        // (An Effect that knocks it prone as its token next moves: catalyst-runtime.js.)
        m => ({ riders: [{ type: "prone-after-move", condition: cond(m[1], m[2], m[3]), degrees: ["failure", "criticalFailure"] }] })],
    // Wemmuth Trinket: "Creatures who fail or critically fail their Reflex saves against entangling flora also take piercing damage equal to the spell's rank."
    [/Creatures who fail or critically fail their [A-Za-z]+ saves against .+? also take ([a-z]+) damage equal to the spell's rank\./,
        m => ({ riders: [{ type: "flat-damage", formula: "rank", damageType: m[1], degrees: ["failure", "criticalFailure"] }] })],
    // Necrotic Cap: "On a hit, the target additionally gains the Enfeebled 1 and Sickened 1 conditions …" (the void type: PF2e's Effect on the caster).
    [new RegExp(String.raw`On a hit, the target additionally gains the ${COND} and ${COND} conditions as the spores consume their flesh\. (As long as the target is taking persistent void damage, they can't reduce the value of their sickened condition below 1\.)`),
        // ("can't reduce the value of their sickened condition below 1": a sickened 1 held while the creature has persistent damage.)
        // ("On a hit" — the legacy attack; the remastered Acid Grip is a Reflex save: a failure, as its persistent damage.)
        m => ({ riders: [{ type: "conditions", when: "hit-or-failed", list: [cond(m[1], m[2], m[3]), cond(m[4], m[5], m[6]), { ...cond(m[4], m[5], 1), whileCondition: "persistent-damage" }] }] })],
    // Dragon Eye: "Creatures in the spell's area must attempt a basic Will save instead of a basic Reflex save, and in addition to taking the spell's normal damage on a failure, they're
    // Frightened 1." — the Will save and traits PF2e's Effect (on the caster); frightened on a failure.
    [new RegExp(String.raw`in addition to taking the spell's normal damage on a failure, they're ${COND}\.`),
        m => ({ riders: [{ type: "conditions", degrees: Object.fromEntries(["failure", "criticalFailure"].map(degree => [degree, [cond(m[1], m[2], m[3])]])) }] })],
    // Soothing Scents: "also causes the spell to reduce the target's Frightened condition value by 1."
    [new RegExp(String.raw`also causes the spell to reduce the target's ${COND} condition value by (\d+)\.`),
        m => ({ riders: [{ type: "healed-reduce", slug: m[2].toLowerCase(), by: Number(m[4]) }] })],
    // Frigid Rebuke: "This causes the spell to deal cold damage instead of fire."
    [/This causes the spell to deal ([a-z]+) damage instead of ([a-z]+)\./, m => ({ riders: [{ type: "damage-type", from: m[2], to: m[1] }] })],
    // Necrotic Cap: "all acid damage the spell deals becomes void damage" — PF2e's Effect changes the spell's roll; the persistent damage the card composes too.
    [/all ([a-z]+) damage the spell deals becomes ([a-z]+) damage\./, m => ({ riders: [{ type: "damage-type", from: m[1], to: m[2] }] })],
    // Hundred Stings: "you can change the damage type to piercing."
    [/you can change the damage type to ([a-z]+)\./, m => ({ riders: [{ type: "damage-type", to: m[1] }] })],
    // Thunderbird Tuft: "For 1 minute, any creature that touches you or that hits you with a melee unarmed attack or non-reach melee weapon attack takes 1d4 electricity damage, or 1d6
    // electricity damage if the creature is using a metal weapon." (Lesser: "For 1 round, … but the nimbus only lasts 1 round".)
    [/For (1 minute|1 round), any creature that touches you or that hits you with a melee unarmed attack or non-reach melee weapon attack takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage, or @Damage\[(\d+d\d+)\[[a-z]+\]\] damage if the creature is using a metal weapon/,
        m => ({ riders: [{ type: "retaliate", formula: m[2], metalFormula: m[4], damageType: m[3], statistic: null, hitOnly: true, nonReach: true, rounds: m[1] === "1 minute" ? 10 : 1 }] })],
    // Wood-Rotted Root: "For the duration, whenever you take physical damage, your rotting bark skin emits a cloud of spores in a 10-foot emanation. Creatures in the area must attempt a
    // DC 24 Fortitude save to avoid taking 1d8 poison damage."
    [/For the duration, whenever you take physical damage, your rotting bark skin emits a cloud of spores in a @Template\[emanation\|distance:(\d+)\]\. Creatures in the area must attempt a @Check\[(fortitude|reflex|will)\|dc:(\d+)[^\]]*\] save to avoid taking @Damage\[((?:\d+d)?\d+)\[([a-z]+)\][^\]]*\] damage\./,
        m => ({ riders: [{ type: "hurt-spores", radius: Number(m[1]), statistic: m[2], dc: Number(m[3]), formula: m[4], damageType: m[5] }] })],
    // Deadlock Mint: "you release a small blast of concussive air in an emanation … Large or smaller creatures must succeed at a Fortitude save equal to your spell save DC or be pushed …
    // creatures that fail the save are pushed 5 feet." (Greater: 10 feet; "Huge creatures must succeed at the save or be pushed 5 feet".)
    [/Large or smaller creatures must succeed at a (Fortitude|Reflex|Will) save equal to your spell save DC or be pushed the same distance away from you\. Objects of 1 Bulk or less and creatures that fail the save are pushed (\d+) feet\.(?: Objects of up to \d+ Bulk are pushed \d+ feet, and (Huge) creatures must succeed at the save or be pushed (\d+) feet\.)?/,
        // (The emanation's size isn't in the text: the creatures the caster targets; a reminder on the caster for the objects.)
        m => ({ riders: [{ type: "cast-push-save", statistic: m[1].toLowerCase(), feet: Number(m[2]), maxSize: "lg", ...(m[3] ? { huge: Number(m[4]) } : {}) },
            { type: "reminder", who: "caster", rounds: 0, text: `Unattended objects of 1 Bulk or less in the emanation are pushed ${m[2]} feet away from you${m[3] ? "; objects of up to 2 Bulk 5 feet" : ""}.` }] })],
    // Defiled Costa: "The first time any creature critically fails its saving throw against a Mask of Terror spell cast using this catalyst, it also takes 6d10 mental damage, with a basic
    // Fortitude save against the spell's DC … (Greater:) A creature who critically fails against this save is killed instantly. This effect has the incapacitation trait."
    [/The first time any creature critically fails its saving throw against .+? cast using this catalyst, it also takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage, with a basic (Fortitude|Reflex|Will) save against the spell's DC(?:.*?(A creature who critically fails against this sa(?:f|v)e is killed instantly\. This effect has the incapacitation trait\.))?/,
        m => ({ riders: [{ type: "crit-fail-card", damage: { formula: m[1], type: m[2] }, statistic: m[3].toLowerCase(), ...(m[4] ? { traits: ["incapacitation"], killsOnCriticalFailure: true } : {}) }] })],
    // Bougainvillea Blossom: "The area becomes hazardous terrain, dealing 1 piercing damage to an enemy each time it enters an affected square."
    [/The area becomes hazardous terrain, dealing @Damage\[(\d+)\[([a-z]+)\]\] damage to an enemy each time it enters an affected square\./,
        m => ({ riders: [{ type: "terrain", where: "area", difficult: false, hazard: { formula: m[1], damageType: m[2], per: "square" }, rounds: "spell", exemptCaster: true }] })],
    // Nightpitch: "nightpitch used to cast a Darkness spell makes the area of the darkness difficult terrain."
    [/makes the area of the darkness difficult terrain\./, () => ({ riders: [{ type: "terrain", where: "area", difficult: true, rounds: "spell" }] })],
    // Wolliped Fleece: "coats all squares within the area of effect with a thin layer of ice. These squares become difficult terrain until the beginning of your next turn."
    [/coats all squares within the area of effect with a thin layer of ice\. These squares become difficult terrain until the beginning of your next turn\./,
        () => ({ riders: [{ type: "terrain", where: "area", difficult: true, rounds: 1 }] })],
    // Dischoran Rubble: "the cacophony reverberates through the targets' forms for 1 round. If a creature that failed or critically failed its initial saving throw moves 10 feet or more on
    // their next turn, it takes an additional 2d10 sonic damage." — a reminder Effect on those creatures until the end of their next turn (the movement the GM's).
    [/If a creature that failed or critically failed its initial saving throw moves (\d+) feet or more on their next turn, it takes an additional @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage\./,
        m => ({ riders: [{ type: "generated", name: `moving ${m[1]} feet or more this turn: ${m[2]} ${m[3]}`, degrees: ["failure", "criticalFailure"], rules: [] }] })],
    // ---- 2026-10-08, the rest (the user: "automate the 62 catalyst notes too") ----
    // Dazzling Rosary: "A Spiritual Armament empowered with this catalyst flashes with bright light when it critically Strikes a target, causing the target to be Dazzled until the
    // beginning of your next turn." — the cast's attack (its later Strikes PF2e's Effect's note).
    [new RegExp(String.raw`flashes with bright light when it critically Strikes a target, causing the target to be ${COND} until the beginning of your next turn\.`),
        m => ({ riders: [{ type: "conditions", onlySave: "spell-attack", degrees: { criticalSuccess: [{ ...cond(m[1], m[2], m[3]), until: "caster-turn-start" }] } }] })],
    // Alicorn Hair: "A Stabilize spell empowered with an alicorn hair allows you to target 1 additional creature."
    [/allows you to target (\d+) additional creatures?\./, m => ({ riders: [{ type: "extra-targets", count: Number(m[1]) }] })],
    // Black Ash: "A creature damaged by this wall's thorns takes an additional 1d6 persistent poison damage."
    [/A creature damaged by this wall's thorns takes an additional @Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\]/,
        m => ({ riders: [{ type: "cast-watch", watch: "spell-damage-persistent", formula: m[1], damageType: m[2] }] })],
    // Broken Ram's Thorn: "When used to enhance the two-action version of a Howling Blizzard spell, … the squares directly adjacent to every creature within the spell's area … icy
    // caltrops. The first creature that moves into each affected square must succeed at an Acrobatics check with a DC equal to spell's save DC or take an amount of cold damage
    // equal to the spell's rank."
    [/two-action version of a .+? spell, these thorns cause the squares directly adjacent to every creature within the spell's area of effect to become littered with icy caltrops\. The first creature that moves into each affected square must succeed at an @Check\[(acrobatics)\] check with a DC equal to spell's save DC or take an amount of ([a-z]+) damage equal to the spell's rank\./,
        m => ({ requires: { actions: [2] }, riders: [{ type: "caltrops", skill: m[1], damageType: m[2] }] })],
    // Chaos Falcon Feather: "you can Sustain the Spell on an adjacent target, touching them and changing the type of energy to which they have resistance. This reduces the remaining
    // duration of the spell by 1 minute; if the spell has less than a minute remaining, it reduces the duration to 1 round."
    [/you can Sustain the Spell on an adjacent target, touching them and changing the type of energy to which they have resistance\. This reduces the remaining duration of the spell by (\d+) minutes?; if the spell has less than a minute remaining, it reduces the duration to 1 round\./,
        m => ({ riders: [{ type: "effect-flag", flag: "moveResistance", minutes: Number(m[1]) }] })],
    // Consecrated Shield: "the status bonus granted by the spell applies to the target's AC but not to their attack rolls."
    [/the status bonus granted by the spell applies to the target's AC but not to their attack rolls\./,
        () => ({ riders: [{ type: "effect-patch", op: "selector-swap", from: ["attack", "attack-roll", "strike-attack-roll"], to: "ac" }] })],
    // Deathless Light: "increases the spell rank of a spell with the light trait by 1 (maximum 7) when determining whether the spell's light will shine in magical darkness or
    // counteract a Darkness spell." — any light spell (the link only names Darkness).
    [/increases the spell rank of a spell with the light trait by (\d+) \(maximum (\d+)\) when determining whether the spell's light will shine in magical darkness or counteract/,
        m => ({ requiresOverride: { traits: ["light"] }, riders: [{ type: "light-rank", by: Number(m[1]), max: Number(m[2]) }] })],
    // Demon Bone Tiles: "When use Shield Block with the spell, the barrier explodes … The shards cause 1d6 bleed damage to each creature adjacent to you that fails a DC 20 Reflex save."
    [/When use Shield Block with the spell, the barrier explodes into many bone fragments\. The shards cause @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage to each creature adjacent to you that fails a @Check\[(reflex|fortitude|will)\|dc:(\d+)\] save\. (This persistent bleed damage is unholy and can be stopped with an Interact action to remove the shards\.)/,
        m => ({ riders: [{ type: "effect-flag", flag: "shieldShards", formula: m[1], damageType: m[2], statistic: m[3], dc: Number(m[4]), note: m[5] }] })],
    // Dimensional Knot: "allows you to bring a single willing adjacent creature along with you; however, … causing them to become Stunned 1."
    [new RegExp(String.raw`allows you to bring a single willing adjacent creature along with you; however, the teleportation is somewhat disorienting for them, causing them to become ${COND}\.`),
        m => ({ riders: [{ type: "targeted-ally-condition", condition: cond(m[1], m[2], m[3]), note: "The willing adjacent creature (targeted) teleports with you: move its token beside yours." }] })],
    // Fearcracker: "When an image is destroyed, it "dies" in a disturbing fashion, rendering the attacker Frightened 1."
    [new RegExp(String.raw`When an image is destroyed, it "dies" in a disturbing fashion, rendering the attacker ${COND}\.`),
        m => ({ riders: [{ type: "cast-watch", watch: "image-destroyed", condition: cond(m[1], m[2], m[3]) }] })],
    // Feral Linguist: "you retain the ability to speak, though this doesn't allow you to cast spells." (Greater: "Once during the spell's duration, you can cast either a spell of
    // 4th-rank or lower or a cantrip of any level, ignoring the inability to cast spells while in your battle form.")
    [/you retain the ability to speak(?:, though this doesn't allow you to cast spells\.|\. Once during the spell's duration, you can cast either a spell of (\d+)(?:st|nd|rd|th)-rank or lower or a cantrip of any level, ignoring the inability to cast spells while in your battle form\.)/,
        m => ({ riders: [{ type: "effect-flag", flag: "formSpeech", ...(m[1] ? { castOnce: { maxRank: Number(m[1]) } } : {}) }] })],
    // Force Tiles: "increases the wall's maximum length to 80 feet and maximum height to 40 feet and causes creatures that try to move into the wall's space (or are Shoved into the
    // wall) to take 2d6 force damage."
    [/increases the wall's maximum length to (\d+) feet and maximum height to (\d+) feet and causes creatures that try to move into the wall's space \(or are Shoved into the wall\) to take @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage\./,
        m => ({ riders: [{ type: "after-resolve", op: "wall-hazard", formula: m[3], damageType: m[4], note: `The wall can be up to ${m[1]} feet long and ${m[2]} feet high.` }] })],
    // Ghostcracker: "When an enemy's attack or spell ends the illusory creature spell, the creature "dies" …, rendering the enemy Frightened 1."
    [new RegExp(String.raw`When an enemy's attack or spell ends the illusory creature spell, the creature "dies" in a disturbing fashion, rendering the enemy ${COND}\.`),
        m => ({ riders: [{ type: "cast-watch", watch: "illusion-ended", condition: cond(m[1], m[2], m[3]) }] })],
    // Gravemist Taper: "The flat check to overcome the Concealed state from the mist rises to 7, and a creature who fails such a check becomes Frightened 1."
    [new RegExp(String.raw`The flat check to overcome the ${COND} state from the mist rises to (\d+), and a creature who fails such a check becomes ${COND}\.`),
        m => ({ riders: [{ type: "after-resolve", op: "mist-dread", flatDC: Number(m[4]), condition: cond(m[5], m[6], m[7]) }] })],
    // Irritating Seedpod: "irritating pollen fills the area for the spell's duration. Creatures in the area must attempt a DC 21 Fortitude saving throw … On a failed save, the creature
    // becomes Slowed 1 for 1 round. … A creature that succeeds at this saving throw becomes temporarily immune … for 10 minutes." (Lesser: "only remains in the area for 1 round";
    // Major: "Slowed 2 for 1 round, then Slowed 1 for 3 rounds".)
    [new RegExp(String.raw`irritating pollen fills the area for the spell's duration\. Creatures in the area must attempt a @Check\[(fortitude|reflex|will)\|dc:(\d+)\] saving throw to avoid sneezing uncontrollably\. On a failed save, the creature becomes ${COND} for (\d+) rounds?(?:, then ${COND} for (\d+) rounds)?\.( Rather than last for the duration of the spell, the irritating pollen only remains in the area for 1 round\.)? A creature that succeeds at this saving throw becomes temporarily immune to the irritating seedpod's pollen for (\d+) minutes\.`),
        m => ({ riders: [{ type: "after-resolve", op: "area-turn-save", statistic: m[1], dc: Number(m[2]), failure: [{ ...cond(m[3], m[4], m[5]), rounds: Number(m[6]) }, ...(m[7] ? [{ ...cond(m[7], m[8], m[9]), rounds: Number(m[10]), after: Number(m[6]) }] : [])],
            oneRound: Boolean(m[11]), immuneMinutes: Number(m[12]) }] })],
    // Kirin Echo Chime: "causes any flying creatures that would be pushed by the spell's effects to be pushed 30 feet in a direction of your choice, rather than 30 feet in the direction
    // of the spell."
    [/causes any flying creatures that would be pushed by the spell's effects to be pushed (\d+) feet in a direction of your choice, rather than \d+ feet in the direction of the spell\./,
        m => ({ riders: [{ type: "redirect-push", feet: Number(m[1]), degrees: ["failure", "criticalFailure"] }] })],
    // Kushtaka Relic: "A creature who fails the Fortitude save against spirit blast has its grasp on its possessed target weakened. The result of the possessed creature's next Will save
    // against the possession effect is improved by one degree. A creature who is possessing another and critically fails … takes damage and then is banished from the body …"
    [/A creature who fails the [A-Za-z]+ save against .+? has its grasp on its possessed target weakened\. (The result of the possessed creature's next Will save against the possession effect is improved by one degree\.) A creature who is possessing another and critically fails the [A-Za-z]+ save against .+? takes damage and then is banished from the body it was possessing/,
        // (Reminder Effects on the possessing creature: the possession itself the GM's.)
        m => ({ riders: [{ type: "generated", name: "possessing: its grasp weakened", degrees: ["failure"], rules: [], rounds: 10, description: `If it is possessing another creature: ${m[1]}` },
            { type: "generated", name: "possessing: banished from the body it possessed", degrees: ["criticalFailure"], rules: [], description: "If it is possessing another creature, it is banished from that body (move its token out)." }] })],
    // Mistwalker's Instinct: "you can sense the direction of each creature from you within the mist … The DC of flat checks you attempt to target a creature within the mist is reduced
    // from 5 to 3."
    [/you can sense the direction of each creature from you within the mist, though you can't instinctively discern allies from enemies based on direction alone\. The DC of flat checks you attempt to target a creature within the mist is reduced from \d+ to (\d+)\./,
        m => ({ riders: [{ type: "reminder", who: "caster", forSpell: true, text: `You sense the direction of each creature within the mist (not allies from enemies); your flat checks to target a creature within it are DC ${m[1]}.` }] })],
    // Nevercold: "the spell's duration increases to 5 minutes, the cold resistance you gain from it lasts 1 hour, and you're immune to minor and severe cold for 8 hours." (Compressed and
    // Refined: "the immunity from minor and severe cold lasts 24 hours".)
    [/the spell's duration increases to (\d+) minutes, the cold resistance you gain from it lasts (\d+) hours?, and you're immune to minor and severe cold for (\d+) hours\.(?:.*the immunity from minor and severe cold lasts (\d+) hours\.)?/,
        m => ({ riders: [{ type: "effect-patch", op: "duration", value: Number(m[1]), unit: "minutes" }, { type: "effect-patch", op: "linger-resistance", resistanceType: "cold", hours: Number(m[2]) },
            { type: "reminder", who: "caster", hours: Number(m[4] ?? m[3]), text: "Immune to minor and severe cold." }] })],
    // Noxious Incense: "fills all squares adjacent to the wall with thick, foul smoke. Creatures in this area are Concealed, and other creatures are concealed to creatures in the area.
    // The smoke lasts for the duration of the spell."
    [/fills all squares adjacent to the wall with thick, foul smoke\. Creatures in this area are @UUID\[[^\]]+\]\{Concealed\}, and other creatures are concealed to creatures in the area\. The smoke lasts for the duration of the spell\./,
        () => ({ riders: [{ type: "after-resolve", op: "wall-smoke" }] })],
    // Odious Token: "you hurl it to an ally within 30 feet. The spell then treats the ally as you for the purpose of the spell. Additionally, you're immune to the spell"
    [/you hurl it to an ally within (\d+) feet\. The spell then treats the ally as you for the purpose of the spell\. Additionally, you're immune to the spell/,
        m => ({ riders: [{ type: "after-resolve", op: "aura-on-ally", within: Number(m[1]) }] })],
    // Ogre Spider Filament: "causes a creature afflicted with spider venom to become Clumsy instead of Enfeebled."
    [new RegExp(String.raw`causes a creature afflicted with [a-z ]+ to become ${COND} instead of ${COND}\.`),
        m => ({ riders: [{ type: "affliction-swap", from: m[5].toLowerCase(), to: cond(m[1], m[2], m[3]) }] })],
    // Preserved Alecost: "Anyone who eats this food gains 1 temporary Hit Point per rank of the spell that lasts for 1 hour."
    [/Anyone who eats this food gains (\d+) temporary Hit Points? per rank of the spell that lasts for (\d+) hours?\./,
        m => ({ riders: [{ type: "food-temp-hp", perRank: Number(m[1]), hours: Number(m[2]) }] })],
    // Seventh Prism: "targets are Dazzled for twice as long as their saving throw indicates. On a critical failure, the target is dazzled for 1 minute after its Blinded condition ends."
    // (Pentagonal: "The area increases to a 20-foot cone, and the DC for the flat check against the target being Concealed increases to 7.")
    [new RegExp(String.raw`targets are ${COND} for twice as long as their saving throw indicates\. On a critical failure, the target is dazzled for (\d+) minutes? after its ${COND} condition ends\.(?: .*The area increases to a @Template\[cone\|distance:(\d+)\], and the DC for the flat check against the target being @UUID\[[^\]]+\]\{Concealed\} increases to @Check\[flat\|dc:(\d+)\]\.)?`),
        m => ({ riders: [{ type: "double-durations", slug: m[2].toLowerCase() }, { type: "after-condition", degrees: ["criticalFailure"], after: m[6].toLowerCase(), condition: { ...cond(m[1], m[2], m[3]), rounds: Number(m[4]) * 10 } },
            ...(m[8] ? [{ type: "area", grow: [{ types: ["cone"], add: Number(m[8]) - 15, max: 15 }] }, { type: "generated", name: `the flat check against it being Concealed is DC ${m[9]}`, degrees: ["success", "failure", "criticalFailure"], rules: [] }] : [])] })],
    // Silvered Marp Fur: "creates a silver spike rather than a cold iron one."; Undertaker's Spade: "allowing the spell to damage incorporeal creatures as if it were a weapon imbued with a
    // Ghost Touch property rune. An incorporeal creature can be Immobilized by a spike if it's adjacent to a solid surface when struck …"
    [/creates a ([a-z]+) spike rather than a cold iron one\./, m => ({ riders: [{ type: "damage-material", choice: [m[1]], byLevel: null }] })],
    [new RegExp(String.raw`as if it were a weapon imbued with a @UUID\[[^\]]+\]\{Ghost Touch\} property rune\. An incorporeal creature can be ${COND} by a spike if it's adjacent to a solid surface when struck; (it can attempt to Escape as normal but can't phase through the spike or escape to the Ethereal Plane\.)`),
        m => ({ riders: [{ type: "damage-material", choice: ["ghost-touch"], byLevel: null }, { type: "incorporeal-condition", condition: cond(m[1], m[2], m[3]), degrees: ["failure", "criticalFailure"], note: `If adjacent to a solid surface: ${m[4]}` }] })],
    // Skyfisher Vapors: "The cloud is invisible, meaning it does not provide concealment, but it requires a successful Perception check against your spell DC to notice the cloud …
    // you always know where it is."
    [/The cloud is invisible, meaning it does not provide concealment, but it requires a successful @Check\[perception\] check against your spell DC to notice the cloud/,
        () => ({ riders: [{ type: "after-resolve", op: "hidden-cloud" }] })],
    // Swirling Sand: "implants a strange compulsion in one target of the spell. The target creature must spin counterclockwise at the end of its turn if it didn't take a move action that
    // turn. … This effect lasts for 3 rounds on a success, failure, or critical failure against suggestion …; a target that critically succeeds … is unaffected"
    [/implants a strange compulsion in one target of the spell\. (The target creature must spin counterclockwise at the end of its turn if it didn't take a move action that turn\. This spin is a free action that has the move trait\.) This effect lasts for (\d+) rounds on a success, failure, or critical failure/,
        m => ({ riders: [{ type: "generated", name: "a strange compulsion (spin at the end of its turn without a move action)", degrees: ["success", "failure", "criticalFailure"], rounds: Number(m[2]), oneTarget: true, rules: [], description: m[1] }] })],
    // Unsullied Blood: "instead of gaining temporary Hit Points based on the damage dealt, you recover half of the damage dealt as Hit Points. (If the amount of Hit Points that would
    // be restored by the spell exceeds your Hit Point maximum, you gain the excess as temporary Hit Points.)"
    [/instead of gaining temporary Hit Points based on the damage dealt, you recover half of the damage dealt as Hit Points\.( If the amount of Hit Points that would be restored by the spell exceeds your Hit Point maximum, you gain the excess as temporary Hit Points\.)?/,
        m => ({ riders: [{ type: "caster-benefit-kind", kind: m[1] ? "heal-then-temp" : "heal" }] })],
    // Euphoric Loop: "When the spell ends, even if you Dismiss it, … forces the target (all targets) to attempt a Will save against your spell DC. … Success Stunned 1 or, if the spell
    // ended because of a hostile action, Confused for 1 round …"
    [new RegExp(String.raw`the spell creates a blissful experience for (one target of your choice|all targets of the spell)\. When the spell ends, even if you Dismiss it, the sudden mental dissonance between the charmed state and reality forces (?:the target|all targets of the charm spell) to attempt a (Will|Fortitude|Reflex) save against your spell DC\. Critical Success The target is unaffected\. Success The target is ${COND} or, if the spell ended because of a hostile action, ${COND} for (\d+) rounds?\. Failure The target is ${COND} or, if the spell ended because of a hostile action, confused for (\d+) rounds?\. Critical Failure The target is ${COND} or, if the spell ended because of a hostile action, confused for (\d+) rounds?\.`),
        m => ({ riders: [{ type: "on-end-save", oneTarget: m[1].startsWith("one"), statistic: m[2].toLowerCase(), rows: {
            success: { normal: cond(m[3], m[4], m[5]), hostile: { ...cond(m[6], m[7], m[8]), rounds: Number(m[9]) } },
            failure: { normal: cond(m[10], m[11], m[12]), hostile: { ...cond(m[6], m[7], m[8]), rounds: Number(m[13]) } },
            criticalFailure: { normal: cond(m[14], m[15], m[16]), hostile: { ...cond(m[6], m[7], m[8]), rounds: Number(m[17]) } } } }] })],
    // Literate Lemur: "the following option is added to the options normally available. Fierce Debate … Critical Success The creature is unaffected and is temporarily immune for 10
    // minutes. Success … unaffected. Failure The creature is Dazzled for 1 round. Critical Failure The creature is Blinded for 1 round." — a mode of its own; no save named: Reflex.
    [new RegExp(String.raw`the following option is added to the options normally available\. ([A-Z][a-z]+ [A-Z][a-z]+) (.+?) Critical Success The creature is unaffected and is temporarily immune for (\d+) minutes\. Success The creature is unaffected\. Failure The creature is ${COND} for (\d+) rounds?\. Critical Failure The creature is ${COND} for (\d+) rounds?\.`),
        m => ({ riders: [{ type: "mischief-mode", mode: { key: m[1].toLowerCase().replace(/ /g, "-"), label: m[1], kind: "save", statistic: "reflex", immunityMinutes: Number(m[3]), intro: m[2],
            failure: { condition: m[5].toLowerCase(), uuid: `Compendium.pf2e.conditionitems.Item.${m[4]}`, unit: "rounds", value: Number(m[7]) },
            criticalFailure: { condition: m[9].toLowerCase(), uuid: `Compendium.pf2e.conditionitems.Item.${m[8]}`, unit: "rounds", value: Number(m[11]) } } }] })],
    // Dragon Scute: "Instead of the spell's normal effects, the target gains damage resistance based on the type and dragon's tradition. … Arcane resistance 5 against all damage from
    // spells Divine resistance 10 to spirit, vitality, and void Occult resistance 10 to mental Primal resistance 7 to bludgeoning, piercing, slashing, and poison"
    [/Instead of the spell's normal effects, the target gains damage resistance based on the type and dragon's tradition\. .*Arcane resistance (\d+) against all damage from spells Divine resistance (\d+) to ([a-z, ]+?) Occult resistance (\d+) to ([a-z, ]+?) Primal resistance (\d+) to ([a-z, ]+)$/,
        m => {
            const list = text => text.split(/,\s*(?:and\s+)?|\s+and\s+/).map(type => type.trim()).filter(Boolean);
            return { riders: [{ type: "effect-replace", ask: "tradition", options: {
                arcane: [{ key: "Resistance", type: "all-damage", value: Number(m[1]), predicate: ["item:type:spell"] }],
                divine: list(m[3]).map(type => ({ key: "Resistance", type, value: Number(m[2]) })),
                occult: list(m[5]).map(type => ({ key: "Resistance", type, value: Number(m[4]) })),
                primal: list(m[7]).map(type => ({ key: "Resistance", type, value: Number(m[6]) })) } }] };
        }],
    // Shadow Ash: "the first opponent to deal damage to the undead creature with a melee Strike takes 3d6 cold damage and becomes Drained 1 … When an undead creature … dies, it can return
    // to animation with half of its Hit Points within 1d4 rounds of its death … with a DC 11 flat check."
    [new RegExp(String.raw`During a combat encounter, the first opponent to deal damage to the undead creature with a melee Strike takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage and becomes ${COND} as the shroud of ice and rot shatters from the blow\. .*it can return to animation with half of its Hit Points within .+? of its death \(unless it was killed in a manner that destroys it remains completely .*?\) with a @Check\[flat\|dc:(\d+)\]`),
        m => ({ requiresOverride: { spells: ["Animate Dead", "Summon Undead", "Create Undead"] }, riders: [{ type: "summoned-shroud", formula: m[1], damageType: m[2], condition: cond(m[3], m[4], m[5]), riseDC: Number(m[6]) }] })],
    // Placement, range and narrative — what the module doesn't restrict or the GM plays: a reminder Effect (Echoing Theater 1 week; Steadfast Sentinel until renewed).
    [/the caster can record the reenactment for later viewing or showing at a different location\. This recording lasts for (\d+) weeks?/,
        (m, text) => ({ riders: [{ type: "reminder", who: "caster", days: Number(m[1]) * 7, text: "The recorded reenactment: creatures viewing it can investigate as if present." }] })],
    [/Instead of the spell expiring when you next make your daily preparations, you can renew it by expending a spell slot for shadow spy again/,
        () => ({ riders: [{ type: "reminder", who: "caster", unlimited: true, text: "The homunculus persists: renew it with a Shadow Spy slot instead of it expiring at daily preparations." }] })],
    [/the target is also aware of your direction and distance from them/, () => ({ riders: [{ type: "reminder", who: "target", forSpell: true, text: "Aware of the caster's direction and distance (not its conditions)." }] })],
    [/allowing you to alter its appearance to resemble any humanoid creature of your size you've seen\./, () => ({ riders: [{ type: "reminder", who: "caster", forSpell: true, text: "The duplicate looks like any humanoid of your size you've seen." }] })],
    [/placing the magical lockbox in your mind\. (Items from the lockbox can be retrieved by anyone adjacent to you with whom you've shared the release phrase with\.)/,
        m => ({ riders: [{ type: "reminder", who: "caster", forSpell: true, text: `The lockbox is in your mind. ${m[1]}` }] })],
    [/you can choose to place the object in the target's backpack or other container in their possession if they don't have a free hand\. (The spell fails if the object can't fit in the container or if you choose an extradimensional container\.)/,
        m => ({ riders: [{ type: "reminder", who: "caster", rounds: 1, text: `The gift can go into the target's container. ${m[1]}` }] })],
    [/The hand has a range of only (\d+) feet, but its increased agility grants it a \+(\d) status bonus to its AC and Reflex saves\./,
        m => ({ riders: [{ type: "reminder", who: "caster", forSpell: true, text: `The ghostly hand: range ${m[1]} feet, +${m[2]} status to its AC and Reflex saves.` }] })],
    [/If the harm spell is cast with 1 action, its range is (\d+) feet; if it's cast with 2 actions, its range is (\d+) feet\./,
        m => ({ riders: [{ type: "reminder", who: "caster", rounds: 0, text: `Harm's range: ${m[1]} feet (1 action), ${m[2]} feet (2 actions).` }] })],
    [/Before choosing the spell's area, Stride up to twice your Speed\. This movement must be in a straight line and doesn't trigger reactions\./,
        () => ({ riders: [{ type: "reminder", who: "caster", rounds: 0, text: "Stride up to twice your Speed in a straight line first (no reactions); the spell is cast from there." }] })],
    [/creating any number of lines originating from you that total (\d+) feet in length\. A creature that multiple lines pass through is only affected once\./,
        m => ({ riders: [{ type: "reminder", who: "caster", rounds: 0, text: `Any number of lines from you totalling ${m[1]} feet; target each creature they pass through once.` }] })],
    [/the conjured grease fills three 5-foot squares within (\d+) feet instead of its normal area; these squares don't need to be contiguous\./,
        m => ({ riders: [{ type: "reminder", who: "caster", rounds: 0, text: `Three 5-foot squares within ${m[1]} feet, not necessarily contiguous: target the creatures in them.` }] })],
    [/instead of targeting a single creature, you cast the spell in a (\d+)-foot-area cone\. You don't make a spell attack roll/,
        m => ({ riders: [{ type: "reminder", who: "caster", rounds: 0, text: `A ${m[1]}-foot cone: target every creature in it; each attempts the save.` }] })],
    [/The spell's fire trait is replaced with the cold trait, you gain resistance to fire damage and environmental heat effects \(instead of cold effects\).*The damage you deal to creatures that touch you or hit you with a melee or unarmed attack has its type changed to cold\./,
        () => ({ riders: [{ type: "effect-patch", op: "type-swap", resistance: { from: "cold", to: "fire" }, damage: { from: "fire", to: "cold" } }] })],
    // Healer's Gel: "bestows an additional 5 temporary Hit Points to one target healed by the spell. These temporary Hit Points last for 1 minute. Effect: Healer's Gel"
    [/bestows an additional (\d+) temporary Hit Points to one target healed by the spell\. These temporary Hit Points last for (\d+) minutes?\./,
        (m, text) => ({ healedEffect: true, note: null })],
    // Shimmering Dust: "When a creature fails its save against a cloud of Revealing Light created using this catalyst, glowing grains stick to them …" — PF2e's Effect on it.
    [/When a creature fails its save against .+? created using this catalyst, /, () => ({ targetEffectDegrees: ["failure", "criticalFailure"] })],
    // Amphisbaena Spittle: "you can place an additional scrying sensor on the back of each target's head … preventing the target from being flanked" — PF2e's Effect on each target.
    [/on the back of each target's head/, () => ({ targetEffectAll: true })]
];

/** A catalyst: {name, kind: "item", activations: [{label, requires: {spells, minRank?, maxRank?}, riders}]}, or null. */
export function readCatalyst(source) {
    if (!(source?.system?.traits?.value ?? []).includes("catalyst")) return null;
    const text = plain(source.system?.description?.value ?? "");
    const spells = [...new Set([...text.matchAll(SPELL_LINK)].map(m => m[1].trim()))];
    if (!spells.length) return null;
    // ("4th-rank Translocate", "of 4th level or below", "at 3rd rank or higher", "of 10th rank or higher".)
    const minRank = /at (\d+)(?:st|nd|rd|th) rank or higher|of (\d+)(?:st|nd|rd|th) rank or higher|heightened to at least (\d+)(?:st|nd|rd|th) level/.exec(text);
    const maxRank = /of (\d+)(?:st|nd|rd|th) (?:level|rank) or (?:below|lower)|of up to (\d+)(?:st|nd|rd|th) level|affects (\d+)(?:st|nd|rd|th)-rank or lower/.exec(text);
    const requires = { spells, ...(minRank ? { minRank: Number(minRank[1] ?? minRank[2] ?? minRank[3]) } : {}), ...(maxRank ? { maxRank: Number(maxRank[1] ?? maxRank[2] ?? maxRank[3]) } : {}) };
    const effect = EFFECT_LINK.exec(text);
    const riders = [];
    let note = null, matched = false, extra = {};
    for (const [pattern, build] of FORMS) {
        const m = pattern.exec(text);
        if (!m) continue;
        const read = build(m, text);
        matched = true;
        riders.push(...(read.riders ?? []));
        // (Broken Ram's Thorn: "the two-action version".)
        if (read.requires) extra = { ...extra, ...read.requires };
        if (read.note) note = read.note;
        if (effect && read.healedEffect) riders.push({ type: "healed-effect", uuid: effect[1].replace(/equipment-effects\.(?!Item\.)/, "equipment-effects.Item."), name: effect[2], once: true });
        if (effect && read.targetEffectDegrees) riders.push({ type: "effect", uuid: effect[1].replace(/equipment-effects\.(?!Item\.)/, "equipment-effects.Item."), name: effect[2], degrees: read.targetEffectDegrees });
        if (effect && read.targetEffectAll) riders.push({ type: "effect", uuid: effect[1].replace(/equipment-effects\.(?!Item\.)/, "equipment-effects.Item."), name: effect[2], when: "affected" });
    }
    // (A form that names its own spells or traits — Deathless Light's light spells, Shadow Ash's undead summons.)
    const override = FORMS.map(([pattern, build]) => { const m = pattern.exec(text); return m ? build(m, text).requiresOverride : null; }).find(Boolean);
    if (override) { delete requires.spells; Object.assign(requires, override); }
    Object.assign(requires, extra);
    // (PF2e's Effect that changes the spell — its traits, damage type or notes — on the caster as the spell is cast; unless a form already gave it to the creatures.)
    if (effect && !riders.some(rider => ["effect", "healed-effect"].includes(rider.type) && rider.uuid?.endsWith(effect[1].split(".").at(-1))))
        riders.push({ type: "self-effect", uuid: effect[1].replace(/equipment-effects\.(?!Item\.)/, "equipment-effects.Item."), name: effect[2] });
    // (What the module doesn't carry: the GM's, posted with the cast.)
    const body = text.replace(/^Activate .*?(?=[A-Z][a-z]+ [a-z])/, "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/@(?:Damage|Check|Template)\[((?:[^\[\]]|\[[^\]]*\])+)\](?:\{([^}]+)\})?/g, (all, inner, label) => label ?? inner);
    // (PF2e's Effect alone carrying the text — Dragon Breath Scale's damage type — needs no note.)
    if ((!matched && !effect) || note) riders.push({ type: "note", text: note ?? body, atCast: true });
    return { name: source.name, kind: "item", activations: [{ label: source.name, frequency: null, requires, riders, arm: null, claimed: [text] }] };
}
