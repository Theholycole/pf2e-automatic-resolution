// The GM's options on a GM-handled spell (user request 2026-10-04: "For Group six make sure the spells that can affect creatures have an option to do so,
// such as earthquake but must be chosen by the gm"): the parts of a world-scale spell that act on creatures, read from its text, each a control on the GM's
// card that applies only to the creatures the GM targets when pressing it:
//   - "save": a save card — a small spell of the stated save, damage and rows, compiled by the ordinary save route from the text it states;
//   - "native-effect": PF2e's linked Effect on each target;
//   - "effect": an Effect of the stated rules on each target (temporary Hit Points, status bonuses, senses, resistances, traits, weaknesses, extra damage).
// Narrative rules (structures, terrain, fuel, memories) stay the GM's text on the card.
import { CONDITION_UUID_START as C, PRONE, plainUnlinked as plain } from "./text-patterns.js";

const cap = word => `${word[0].toUpperCase()}${word.slice(1)}`;
const row = (heading, text) => `<p><strong>${heading}</strong> ${text}</p>`;

/** A save option: the sub-spell's system patch (its description, defense and damage) for the save route. */
function saveOption(key, label, statistic, basic, html, damage = null, extra = {}) {
    return { kind: "save", key, label, patch: { description: { value: html }, defense: { save: { statistic, basic } }, damage: damage ? { [key]: { applyMod: false, category: null, formula: damage.formula, kinds: ["damage"], materials: [], type: damage.type } } : {},
        area: null, target: { value: "" }, duration: { sustained: false, value: extra.duration ?? "" }, heightening: extra.heightening ?? null } };
}

// Earthquake: "Fissures Each creature on the ground must attempt a Reflex save at the start of its turn to keep its footing and avoid falling into 40-foot-deep
// fissures that open beneath it." / "Collapse … A collapse deals 11d6 bludgeoning damage to each creature caught in it with a basic Reflex save. A creature falls
// {Prone} unless it critically succeeds and falls into a fissure if it critically fails." / "Shaking Ground … {Spell Effect: Earthquake (Shaking Ground)}".
const FISSURES = /Each creature on the ground must attempt a (Reflex|Fortitude|Will) save at the start of its turn to keep its footing and avoid falling into (\d+)-foot-deep fissures that open beneath it\./;
const COLLAPSE = /A collapse deals (\d+d\d+) ([a-z]+) damage to each creature caught in it with a basic (Reflex|Fortitude|Will) save\. A creature falls Prone unless it critically succeeds and falls into a fissure if it critically fails\./;
const SHAKING = /@UUID\[(Compendium\.pf2e\.spell-effects\.Item\.[^\]]+)\]\{(Spell Effect: [^}]+)\}/;
function earthquakeOptions(html) {
    const text = plain(html), fissures = FISSURES.exec(text), collapse = COLLAPSE.exec(text), shaking = SHAKING.exec(html);
    if (!fissures || !collapse) return null;
    const fall = Number(fissures[2]) / 2;
    const options = [];
    if (shaking) options.push({ kind: "native-effect", key: "shaking-ground", label: `Shaking Ground: ${shaking[2].replace(/^Spell Effect: /, "")} on the targets`, uuid: shaking[1] });
    options.push(saveOption("fissures", `Fissures: a creature on the ground starts its turn (${fissures[1]} save)`, fissures[1].toLowerCase(), false,
        `<p>The creature must attempt a ${fissures[1]} save to keep its footing.</p><hr />${row("Critical Success", "The creature is unaffected.")}${row("Success", "The creature is unaffected.")}`
        + row("Failure", `The creature falls into a ${fissures[2]}-foot-deep fissure, taking @Damage[${fall}[bludgeoning]] damage, and lands ${PRONE}.`)
        + row("Critical Failure", `The creature falls into a ${fissures[2]}-foot-deep fissure, taking @Damage[${fall}[bludgeoning]] damage, and lands ${PRONE}.`)));
    options.push(saveOption("collapse", `Collapse: creatures caught in a collapse (basic ${collapse[3]}, ${collapse[1]} ${collapse[2]})`, collapse[3].toLowerCase(), false,
        `<p>Each creature caught in the collapse takes ${collapse[1]} ${collapse[2]} damage and must attempt a ${collapse[3]} save.</p><hr />${row("Critical Success", "The creature is unaffected.")}`
        + row("Success", `The creature takes half damage and falls ${PRONE}.`) + row("Failure", `The creature takes full damage and falls ${PRONE}.`)
        + row("Critical Failure", `The creature takes double damage, falls ${PRONE} and falls into a fissure.`), { formula: collapse[1], type: collapse[2] }));
    return { options, notes: [`A creature that falls into a fissure falls ${fissures[2]} feet; the sides need a successful DC 15 Athletics check to Climb.`] };
}

// Upheaval: "A collapse deals 11d6 bludgeoning damage to creatures beneath it; each creature caught in a collapse must attempt a Reflex save to avoid it." with its
// rows (half collapse damage; half and Prone; full and Prone; full and {Restrained} until it Escapes).
const UPHEAVAL = /A collapse deals (\d+d\d+) ([a-z]+) damage to creatures beneath it; each creature caught in a collapse must attempt a (Reflex|Fortitude|Will) save to avoid it\./;
function upheavalOptions(html) {
    const [body, table] = String(html).split(/<hr\s*\/?>/i).filter(Boolean);
    const collapse = UPHEAVAL.exec(plain(body));
    if (!collapse || !table) return null;
    const rows = Object.fromEntries([...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)].map(match => [match[1], match[2].trim()]));
    const restrained = new RegExp(String.raw`^The creature takes the full collapse damage and is (${C}Restrained\}) by debris until it successfully \[\[/act escape\]\]\{Escapes\} \(DC equal to the spell's save DC\)\.$`).exec(rows["Critical Failure"] ?? "");
    if (plain(rows["Critical Success"]) !== "The creature takes half collapse damage." || plain(rows.Success) !== "The creature takes half the collapse damage and falls Prone."
        || plain(rows.Failure) !== "The creature takes the full collapse damage and falls prone." || !restrained) return null;
    return { options: [saveOption("collapse", `Pillar or collapse: creatures caught (${collapse[3]} save, ${collapse[1]} ${collapse[2]})`, collapse[3].toLowerCase(), false,
        `<p>Each creature caught in the collapse takes ${collapse[1]} ${collapse[2]} damage and must attempt a ${collapse[3]} save.</p><hr />${row("Critical Success", "The creature takes half damage.")}`
        + row("Success", `The creature takes half damage and falls ${PRONE}.`) + row("Failure", `The creature takes full damage and falls ${PRONE}.`)
        + row("Critical Failure", `The creature takes full damage and is ${restrained[1]} until it Escapes.`), { formula: collapse[1], type: collapse[2] })],
        notes: ["A creature on a rising pillar that fails its Reflex save falls off the nearest edge (up to 60 feet); one whose pillar is stopped by a structure falls without a save."] };
}

// Trim the Blight: "Creatures in the area that carry features of this blight (as determined by the GM, …) are trimmed as well, … These creatures take 12d10 spirit
// damage and must attempt a Fortitude save." with its rows (the reach reduced, Sickened, Slowed).
const TRIMMED = /These creatures take (\d+d\d+) ([a-z]+) damage and must attempt a (Fortitude|Reflex|Will) save\./;
function trimOptions(html, heightening) {
    const [body, table] = String(html).split(/<hr\s*\/?>/i).filter(Boolean);
    const trimmed = TRIMMED.exec(plain(body));
    if (!trimmed || !table) return null;
    const rows = Object.fromEntries([...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)].map(match => [match[1], match[2].trim()]));
    const failure = new RegExp(String.raw`^The creature's reach with attacks is reduced by (\d+) feet \(to a minimum of 5 feet\) for 1 hour, they are (${C}Sickened 1\}) and (${C}Slowed 1\}) for 1 round\.$`).exec(rows.Failure ?? "");
    const critical = new RegExp(String.raw`^The creature's reach is reduced to 5 feet for 1 hour, they are (${C}Sickened 2\}) and slowed 1 for 1 minute\.$`).exec(rows["Critical Failure"] ?? "");
    if (plain(rows["Critical Success"]) !== "The creature is unaffected." || plain(rows.Success) !== "The creature takes half damage." || !failure || !critical) return null;
    const slowed = failure[5].replace(/\{Slowed 1\}$/, "{Slowed 1}");
    return { options: [saveOption("blighted", `Blighted creatures (the GM's choice): ${trimmed[1]} ${trimmed[2]}, ${trimmed[3]} save`, trimmed[3].toLowerCase(), false,
        `<p>Each creature takes ${trimmed[1]} ${trimmed[2]} damage and must attempt a ${trimmed[3]} save.</p><hr />${row("Critical Success", "The creature is unaffected.")}${row("Success", "The creature takes half damage.")}`
        + row("Failure", `The creature takes full damage and is ${failure[2]} and ${slowed} for 1 round.`) + row("Critical Failure", `The creature takes full damage and is ${critical[1]} and ${slowed} for 1 minute.`),
        { formula: trimmed[1], type: trimmed[2] }, { heightening })],
        notes: [`A failing blighted creature's reach with attacks is reduced by ${failure[1]} feet (to a minimum of 5) for 1 hour; a critically failing one's to 5 feet. The 10th-rank version's hour is 24 hours.`] };
}

// Call of the Quenching: "You and all allies within the area gain resistance 15 to fire and are {Concealed}." / "An enemy that ends its turn within the area takes
// 7d4 piercing and 7d4 bludgeoning damage (basic Reflex save)."
const QUENCH_ALLIES = /You and all allies within the area gain resistance (\d+) to ([a-z]+) and are Concealed\./;
const QUENCH_ENEMY = /An enemy that ends its turn within the area takes (\d+d\d+) ([a-z]+) and (\d+d\d+) ([a-z]+) damage \(basic (Reflex|Fortitude|Will) save\)\./;
function quenchingOptions(html, damageComponents) {
    const text = plain(html), allies = QUENCH_ALLIES.exec(text), enemy = QUENCH_ENEMY.exec(text);
    if (!allies || !enemy) return null;
    const stated = [[enemy[1], enemy[2]], [enemy[3], enemy[4]]];
    if ((damageComponents ?? []).length !== 2 || !stated.every(([formula, type]) => damageComponents.some(component => String(component.formula).replace(/\s+/g, "") === formula && component.type === type))) return null;
    return { options: [
        { kind: "effect", key: "allies", label: `Allies in the area: resistance ${allies[1]} to ${allies[2]}, Concealed`, duration: { value: 1, unit: "minutes" },
            rules: [{ key: "Resistance", type: allies[2], value: Number(allies[1]) }, { key: "GrantItem", uuid: "Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W", onDeleteActions: { grantee: "restrict" } }] },
        { kind: "save", key: "enemy-turn", label: `An enemy ended its turn in the area (basic ${enemy[5]}, ${enemy[1]} ${enemy[2]} and ${enemy[3]} ${enemy[4]})`,
            // (The spell's own two damage entries, heightened as PF2e's.)
            patch: { description: { value: `<p>Each creature takes ${enemy[1]} ${enemy[2]} damage and ${enemy[3]} ${enemy[4]} damage, with a basic ${enemy[5]} save.</p>` },
                defense: { save: { statistic: enemy[5].toLowerCase(), basic: true } }, area: null, target: { value: "" }, duration: { sustained: false, value: "" } } }],
        notes: ["The area is difficult terrain for enemies. Fueling it casts the stated summon (the GM's)."] };
}

// Under Sunless Skies: "You and all allies in the area gain greater darkvision, 40 temporary Hit Points, and a +3 status bonus to saving throws for the spell's
// duration. Enemies within the area take a –3 status penalty to Will saving throws."
const SUNLESS_ALLIES = /You and all allies in the area gain greater darkvision, (\d+) temporary Hit Points, and a \+(\d) status bonus to saving throws for the spell's duration\./;
const SUNLESS_ENEMIES = /Enemies within the area take a [–-](\d) status penalty to Will saving throws\./;
function sunlessOptions(html) {
    const text = plain(html), allies = SUNLESS_ALLIES.exec(text), enemies = SUNLESS_ENEMIES.exec(text);
    if (!allies || !enemies) return null;
    return { options: [
        { kind: "effect", key: "allies", label: `Allies in the area: greater darkvision, ${allies[1]} temporary HP, +${allies[2]} status to saves`, duration: { value: 1, unit: "minutes" },
            rules: [{ key: "Sense", selector: "greater-darkvision" }, { key: "TempHP", value: Number(allies[1]) }, { key: "FlatModifier", selector: "saving-throw", type: "status", value: Number(allies[2]) }] },
        { kind: "effect", key: "enemies", label: `Enemies in the area: −${enemies[1]} status to Will saves`, duration: { value: 1, unit: "minutes" },
            rules: [{ key: "FlatModifier", selector: "will", type: "status", value: -Number(enemies[1]) }] }],
        notes: ["The area is under a 9th-rank darkness. Fueling it casts a 9th-rank command on every enemy in the area (the GM's)."] };
}

// A table save stated plainly (Veil of Broken Reality, Astral Labyrinth): the rows' conditions; their other clauses are notes on the card.
function tableOptions(html, statistic, label, keep) {
    const table = String(html).split(/<hr\s*\/?>/i).find(section => /<strong>\s*Critical Success\s*<\/strong>/.test(section));
    if (!table) return null;
    const rows = Object.fromEntries([...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)].map(match => [match[1], match[2].trim()]));
    if (Object.keys(rows).length !== 4) return null;
    const kept = Object.fromEntries(Object.entries(rows).map(([heading, text]) => [heading, keep(heading, text)]));
    if (Object.values(kept).some(value => value == null)) return null;
    return saveOption("save", label, statistic, false, `<p>The creature must attempt a ${cap(statistic)} save.</p><hr />${Object.entries(kept).map(([heading, text]) => row(heading, text)).join("")}`);
}
function veilOptions(html) {
    const C1 = new RegExp(String.raw`^(?:The creature is (${C}Slowed \d\})|The creature is slowed (\d))`);
    const option = tableOptions(html, "will", "A creature enters the area or starts its turn there (Will save; 16th level or lower critically fails)", (heading, text) => {
        if (heading === "Critical Success") return /^The creature automatically learns you're the spell's caster/.test(plain(text)) ? "The creature is unaffected." : null;
        const slowed = C1.exec(text);
        if (!slowed) return null;
        const value = slowed[1] ? /Slowed (\d)/.exec(slowed[1])[1] : slowed[2];
        return `The creature is @UUID[Compendium.pf2e.conditionitems.Item.xYTAsEpcJE1Ccni3]{Slowed ${value}} for 24 hours.`;
    });
    return option ? { options: [option], notes: ["A creature of 16th level or lower critically fails (the GM sets its result). Each creature is then immune for the rest of the duration; up to 10 creatures the caster designates are immune.",
        "On a success it knows you're the caster; on a failure or critical failure it can't use reactions (the GM's). A critical success reveals the caster, location and effect."] } : null;
}
function labyrinthOptions(html) {
    const option = tableOptions(html, "will", "A creature teleports or travels extradimensionally into or out of the area (Will save)", (heading, text) => {
        if (heading === "Critical Success") return plain(text) === "The creature is unaffected." ? "The creature is unaffected." : null;
        const stunned = new RegExp(String.raw`^The creature is (${C}Stunned \d\})`).exec(text);
        return stunned ? `The creature is ${stunned[1]}.` : null;
    });
    return option ? { options: [option], notes: ["On a failure or critical failure the creature arrives in the empty space closest to the point the caster chose instead (the GM moves it); the caster is alerted, or glimpses it on a critical failure."] } : null;
}

// Theogeny: "If you're holy, your allies gain the holy trait, while your foes gain the unholy trait and weakness 5 to holy. Similarly, if you're unholy, …" / "While
// in the area, you and all allies gain a fly Speed equal to their highest Speed, and their Strikes gain the sanctified trait and deal an additional 1d10 spirit
// damage on hit. Additionally, all enemies take 10 spirit damage whenever they're critically hit by an attack or whenever they critically fail a saving throw."
const THEO_SIDES = /If you're holy, your allies gain the holy trait, while your foes gain the unholy trait and weakness (\d+) to holy\./;
const THEO_ALLIES = /you and all allies gain a fly Speed equal to their highest Speed, and their Strikes gain the sanctified trait and deal an additional (\d+d\d+) ([a-z]+) damage on hit\./;
const THEO_ENEMIES = /all enemies take (\d+) ([a-z]+) damage whenever they're critically hit by an attack or whenever they critically fail a saving throw\./;
function theogenyOptions(html) {
    const text = plain(html.replace(/@Damage\[(\d+d\d+|\d+)\[([a-z]+)\]\]/g, "$1 $2")), sides = THEO_SIDES.exec(text), allies = THEO_ALLIES.exec(text), enemies = THEO_ENEMIES.exec(text);
    if (!sides || !allies || !enemies) return null;
    const side = (sanctity, opposite) => [
        { kind: "effect", key: `allies-${sanctity}`, label: `Allies (caster ${sanctity}): ${sanctity} trait, fly Speed, Strikes +${allies[1]} ${allies[2]}`, duration: { value: 1, unit: "minutes" },
            rules: [{ key: "ActorTraits", add: [sanctity] }, { key: "BaseSpeed", selector: "fly", value: "@actor.attributes.speed.total" },
                { key: "DamageDice", selector: "strike-damage", diceNumber: Number(allies[1].split("d")[0]), dieSize: `d${allies[1].split("d")[1]}`, damageType: allies[2] }] },
        { kind: "effect", key: `foes-${sanctity}`, label: `Foes (caster ${sanctity}): ${opposite} trait, weakness ${sides[1]} to ${sanctity}`, duration: { value: 1, unit: "minutes" },
            rules: [{ key: "ActorTraits", add: [opposite] }, { key: "Weakness", type: sanctity, value: Number(sides[1]) }],
            // (The module deals it: note-watchers.js follows the creature's attack rolls against it and its saves.)
            watch: { critPunish: { formula: enemies[1], type: enemies[2] } },
            note: `It takes ${enemies[1]} ${enemies[2]} damage whenever it's critically hit by an attack or critically fails a saving throw (the module deals it).` }];
    return { options: [...side("holy", "unholy"), ...side("unholy", "holy")],
        notes: ["A creature that already has the holy or unholy trait gains no new trait or weakness. The fly Speed is the land Speed (the GM raises it where another Speed is higher); Strikes gain the sanctified trait."] };
}

/** {options, notes} for a GM-handled spell's creature parts, or null when it has none the module can apply. */
export function compileGmOptions(adapted, item, { referenced = null } = {}) {
    const html = String(adapted.descriptionHTML ?? "");
    const slugFree = plain(html);
    // (Structures "as if affected by Earthquake": that spell's collapse.)
    const asIf = /Structures within range are shaken and may collapse, as if affected by @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{[^}]+\}\./.exec(html);
    if (asIf && referenced) {
        const read = earthquakeOptions(String(referenced.system?.description?.value ?? ""));
        const collapse = read?.options.find(option => option.key === "collapse");
        return collapse ? { options: [collapse], notes: ["Creatures are unaffected unless caught in a structural collapse."], referenced: asIf[1] } : null;
    }
    if (FISSURES.test(slugFree)) return earthquakeOptions(html);
    if (UPHEAVAL.test(slugFree)) return upheavalOptions(html);
    if (TRIMMED.test(slugFree)) return trimOptions(html, item?.system?.heightening ?? null);
    if (QUENCH_ENEMY.test(slugFree)) return quenchingOptions(html, adapted.damageComponents);
    if (SUNLESS_ALLIES.test(slugFree)) return sunlessOptions(html);
    if (/You conceal reality, letting time proceed/.test(slugFree)) return veilOptions(html);
    if (/any creature that tries to depart or arrive in a location in the area by teleportation/.test(slugFree)) return labyrinthOptions(html);
    if (THEO_SIDES.test(slugFree)) return theogenyOptions(html);
    // (Third-party spells of the same kinds, user decision 2026-10-06.)
    if (FLOOD.test(slugFree)) return floodOptions(slugFree);
    if (MOUNTAIN.test(slugFree)) return mountainOptions(html);
    return null;
}

// Thousand-Year Flood (Magic+): "When you initially Cast the Spell, creatures in the area are tossed about by the rushing water, taking 10d10 bludgeoning damage with
// a basic Reflex save." (the GM's option on the creatures it targets) / "The first time each round you Sustain this spell, you can spend an action to attack a creature
// in the area with debris and rushing water, making a spell attack roll against their AC and dealing 9d4 bludgeoning damage on a success, or double damage on a
// critical success." (a note: the caster's attack).
const FLOOD = /When you initially Cast the Spell, creatures in the area are tossed about by the rushing water, taking (\d+d\d+) ([a-z]+) damage with a basic (Reflex|Fortitude|Will) save\./;
function floodOptions(text) {
    const tossed = FLOOD.exec(text);
    const attack = /making a spell attack roll against their AC and dealing (\d+d\d+) ([a-z]+) damage on a success, or double damage on a critical success\./.exec(text);
    return { options: [saveOption("tossed", `Tossed by the water: creatures in the area when it's cast (basic ${tossed[3]}, ${tossed[1]} ${tossed[2]})`, tossed[3].toLowerCase(), true,
            `<p>Each creature in the area takes ${tossed[1]} ${tossed[2]} damage with a basic ${tossed[3]} save.</p>`, { formula: tossed[1], type: tossed[2] })],
        notes: [...(attack ? [`The first time each round the caster Sustains it, it can spend an action to attack a creature in the area: a spell attack roll against its AC, ${attack[1]} ${attack[2]} damage on a success (double on a critical success).`] : []),
            "Creatures that can't breathe water must hold their breath or begin drowning; the water is greater difficult terrain (difficult with a swim Speed)."] };
}

// Raise Mountain (Oracles+): "Creatures in the area must attempt a Reflex save." with rows "The creature can choose to move to the nearest edge or remain in its space." /
// "As critical success, but the creature is Off-Guard until the end of your turn." / "The creature is moved to the nearest adjacent space that is not in the area. …" /
// "The creature falls prone in the area. If the creature is in an area of greater difficult terrain, it is also Immobilized until it Escapes." — the save card's
// conditions (the moves and the greater difficult terrain's Immobilized the GM's notes).
const MOUNTAIN = /move the world to create a mountain\. Each square in the area rises 5 feet higher than the previous square/;
function mountainOptions(html) {
    const option = tableOptions(html, "reflex", "Creatures in the area when the mountain rises (Reflex save)", (heading, text) => {
        const line = plain(text);
        if (heading === "Critical Success") return /^The creature can choose to move to the nearest edge or remain in its space\.$/.test(line) ? "The creature is unaffected." : null;
        if (heading === "Success") return /^As critical success, but the creature is Off-Guard until the end of your turn\.$/.test(line) ? "The creature is @UUID[Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg]{Off-Guard} until the end of your turn." : null;
        if (heading === "Failure") return /^The creature is moved to the nearest adjacent space that is not in the area\./.test(line) ? "The creature is unaffected." : null;
        return /^The creature falls prone in the area\./.test(line) ? `The creature falls ${PRONE}.` : null;
    });
    return option ? { options: [option], notes: ["Critical success or success: the creature can move to the nearest edge or stay. Failure: it's moved to the nearest space outside the area (if it would fall, it can Grab an Edge against the spell DC). Critical failure: in greater difficult terrain it's also Immobilized until it Escapes."] } : null;
}
