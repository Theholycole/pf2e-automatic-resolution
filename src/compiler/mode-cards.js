// Spells of modes chosen on the cast and each Sustain (Storm Lord, Wrathful Storm, Storm of Vengeance, Musical Shift, Dancing Fountain, Impaling Briars):
// a card whose area (a region following the caster, fixed where it stands, or placed by the GM) holds the current mode's state — an Effect on the creatures
// inside (generated from the text, or PF2e's own), terrain — and whose modes each set that state and run their own action for the targeted creatures (a
// save, damage, a launch, a placed terrain); the spell's extra actions (Storm Lord's bolt, the briars' impaling) are buttons of their own. "You can't
// choose the same effect twice in a row" refuses the last mode again.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const C = (id, name) => `@UUID[Compendium.pf2e.conditionitems.Item.${id}]{${name}}`;
const CONCEALED = "Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W", DEAFENED = "9PR9y0bi4JPKnHPR", IMMOBILIZED = "eIcWbB5o3pP6OIMe";
const rows = list => `<hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map((label, index) => `<p><strong>${label}</strong> ${list[index]}</p>`).join("");
const basicRows = (extra = "") => rows(["The target is unaffected.", "The target takes half damage.", `The target takes full damage${extra}.`, `The target takes double damage${extra}.`]);
const modeList = html => [...String(html).matchAll(/<li>\s*<strong>([^<]+)<\/strong>([\s\S]*?)<\/li>/g)].map(match => ({ name: match[1].trim(), key: match[1].trim().toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""), text: plain(match[2]), raw: match[0] }));
const generated = (name, text, rules) => ({ all: true, generated: { name, text, rules } });
const concealedRule = { key: "GrantItem", uuid: CONCEALED, flag: "modeConcealed", allowDuplicate: true, onDeleteActions: { grantee: "cascade" } };
const rangedPenalty = value => ({ key: "FlatModifier", selector: "ranged-strike-attack-roll", type: "circumstance", value });
const seconds = (duration, sustained) => { const match = /^(\d+) (minute|round)s?$/.exec(String(duration ?? "").trim()); return match ? Number(match[1]) * (match[2] === "minute" ? 60 : 6) : null; };
const save = (html, statistic, basic, extra = {}) => ({ type: "save", html, statistic, basic, ...extra });

/** {area, parts, notes, claimed} or null. */
export function extractModeCard(adapted, catalog = null) {
    const readers = [stormLord, wrathfulStorm, vengeanceStorm, musicalKeys, fountainDisplays, briarModes, sandModes, vibratoAura];
    for (const reader of readers) { const found = reader(adapted, catalog); if (found) return found; }
    return null;
}

// Storm Lord: the emanation around (and on) the caster; Calm, Fog (Mist's concealment), Rain (−2 to Acrobatics and Perception), Wind (−4 to ranged attacks,
// difficult terrain for flyers); the bolt once a round (10d6 electricity, basic Reflex, Deafened 1 round on a failure).
function stormLord(adapted) {
    const area = adapted.targeting?.area, time = seconds(adapted.lifecycle?.duration);
    if (area?.type !== "emanation" || !adapted.lifecycle?.sustained || !time || adapted.defense?.basic !== true) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const lead = /^<p>([^<]*)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*<p>([\s\S]*?)<\/p>\s*$/.exec(html.trim());
    if (!lead) return null;
    const intro = split(plain(lead[1]));
    if (!/^When you Cast the Spell and the first time you Sustain it each turn on subsequent rounds, select one of the following effects to occur in the area\.$/.test(intro.at(-1) ?? "")) return null;
    const modes = Object.fromEntries(modeList(lead[2]).map(mode => [mode.key, mode]));
    const bolt = new RegExp(String.raw`^In addition, once per round you can use a single action, which has the concentrate and manipulate traits, to call down a bolt of lightning, striking any target in range that you can see\. You deal (\d+d\d+) ([a-z]+) damage to the target; it must attempt a basic (Reflex|Fortitude) save\. On a failure, it is also @UUID\[Compendium\.pf2e\.conditionitems\.Item\.${DEAFENED}\]\{Deafened\} for (\d+) rounds?\.$`).exec(plain(lead[3]));
    if (!bolt || modes.calm?.text !== "No additional effect." || !/^Heavy fog rolls in, concealing the area with the effects of @UUID\[[^\]]+\]\{Mist\}\.$/.test(modes.fog?.text ?? "")
        || !/^Torrential rain falls from the sky, dousing ordinary flames\. Creatures in the area take a -(\d) circumstance penalty to Acrobatics and Perception checks\.$/.test(modes.rain?.text ?? "")
        || !/^Powerful winds buffet the area in all directions\. Ranged attacks take a -(\d) circumstance penalty, and the area is difficult terrain for flying creatures\.$/.test(modes.wind?.text ?? "") || Object.keys(modes).length !== 4) return null;
    const rain = Number(/-(\d) circumstance/.exec(modes.rain.text)[1]), wind = Number(/-(\d) circumstance/.exec(modes.wind.text)[1]);
    const deafened = ` and is ${C(DEAFENED, "Deafened")} for ${bolt[4]} round${bolt[4] === "1" ? "" : "s"}`;
    return {
        area: { label: "The storm", shape: "emanation", radius: Number(area.value), follow: true, seconds: time, sustained: true, excludeCaster: false, base: {} },
        parts: [
            { key: "calm", title: "Calm", kind: "mode", state: {}, reminder: "No additional effect." },
            { key: "fog", title: "Fog", kind: "mode", state: { memberEffect: generated("Fog", "Concealed by the heavy fog (as mist).", [concealedRule]) }, reminder: "Creatures in the area are Concealed (creatures outside are concealed to those inside, as mist)." },
            { key: "rain", title: "Rain", kind: "mode", state: { memberEffect: generated("Rain", `−${rain} circumstance to Acrobatics and Perception checks.`, [{ key: "FlatModifier", selector: ["acrobatics", "perception"], type: "circumstance", value: -rain }]) },
                reminder: `Creatures in the area take −${rain} to Acrobatics and Perception checks; ordinary flames are doused.` },
            { key: "wind", title: "Wind", kind: "mode", state: { memberEffect: generated("Wind", `−${wind} circumstance to ranged attacks.`, [rangedPenalty(-wind)]), terrain: { difficulty: 2, movement: ["fly"] } },
                reminder: `Ranged attacks take −${wind}; the area is difficult terrain for flying creatures.` },
            { key: "bolt", title: "Lightning bolt", kind: "action", spec: save(`<p>The target takes ${bolt[1]} ${bolt[2]} damage (basic ${bolt[3]} save).</p>${basicRows(deafened)}`, bolt[3].toLowerCase(), true, { damage: { formula: bolt[1], type: bolt[2] } }),
                repeat: { trigger: "the caster uses its single action (once per round)" }, reminder: "Target one creature the caster can see." }],
        notes: ["Ranged attacks made by creatures in the area take the wind's penalty; attacks into it from outside are the GM's."],
        claimed: [...intro, ...Object.values(modes).map(mode => `${mode.name} ${mode.text}`), plain(lead[3])]
    };
}

// Wrathful Storm: PF2e's Effect (−4 to physical ranged attacks) on the creatures under the placed cloud; Blizzard (4d8 cold, no save; concealment and
// difficult terrain), Hail (4d10 bludgeoning, basic Fortitude), Lightning (up to 10 creatures, 7d6 electricity, basic Reflex), Tornado (thrown 40 feet up).
function wrathfulStorm(adapted, catalog) {
    const area = adapted.targeting?.area, time = seconds(adapted.lifecycle?.duration);
    if (area?.type !== "burst" || !adapted.lifecycle?.sustained || !time || (adapted.defense?.kind ?? "none") !== "none") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = /^<p>([^<]*)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*<p>(@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{(Spell Effect: [^}]+)\})<\/p>\s*<hr\s*\/?>\s*<p><strong>Heightened \((\d+)th\)<\/strong> The range increases to ([\d,]+) feet and the cloud is a ([\d,]+)-foot burst\.<\/p>\s*$/.exec(html.trim());
    if (!parts) return null;
    const intro = split(plain(parts[1]));
    const STATED = [/^The wind imposes a –(\d) circumstance penalty to physical ranged attacks\.$/, /^The air in the area is greater difficult terrain for flying creatures\.$/,
        /^When you Cast this Spell and the first time each round you Sustain it on subsequent rounds, you can choose one of the following storm effects\.$/, /^You can't choose the same effect twice in a row\.$/];
    const found = STATED.map(pattern => intro.map(sentence => pattern.exec(sentence)).find(Boolean));
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === parts[4]);
    const rules = effect?.mechanics?.rules ?? [];
    if (!found.every(Boolean) || !effect?.id || !(rules.length === 1 && rules[0].key === "FlatModifier" && rules[0].selector === "ranged-strike-attack-roll" && rules[0].value === -Number(found[0][1]))) return null;
    const modes = Object.fromEntries(modeList(parts[2]).map(mode => [mode.key, mode]));
    const blizzard = /^The driving snow deals @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage to each creature in or below the storm with no save\. Everything in or beneath the cloud is @UUID\[[^\]]+\]\{Concealed\} by driving snow and any ground is difficult terrain\.$/.exec(modes.blizzard?.text ?? "");
    const hail = /^Each creature in or below the storm takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage with a basic (Fortitude|Reflex) save\.$/.exec(modes.hail?.text ?? "");
    const lightning = /^Choose up to (\d+) creatures in or below the storm to be struck by lightning\. Each of them takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage with a basic (Reflex|Fortitude) save\.$/.exec(modes.lightning?.text ?? "");
    const tornado = /^A roughly cylindrical whirlwind appears in or below the cloud in a (\d+)-foot radius\. Each creature in the whirlwind is thrown (\d+) feet upward\.$/.exec(modes.tornado?.text ?? "");
    if (!blizzard || !hail || !lightning || !tornado || Object.keys(modes).length !== 4) return null;
    const base = { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, all: true };
    return {
        area: { label: "The storm cloud", shape: "burst", radius: Number(area.value), byRank: [{ minRank: Number(parts[5]), radius: Number(parts[7].replace(/,/g, "")) }], place: true, seconds: time, sustained: true, base: { memberEffect: base } },
        parts: [
            { key: "blizzard", title: "Blizzard", kind: "mode", noRepeat: true, state: { memberEffect: base, memberEffects: [generated("Blizzard", "Concealed by the driving snow.", [concealedRule])], terrain: { difficulty: 2 } },
                action: { type: "damage", formula: `${blizzard[1]}[${blizzard[2]}]` }, reminder: "Target each creature in or below the storm: the cold, then concealment and difficult ground." },
            { key: "hail", title: "Hail", kind: "mode", noRepeat: true, state: { memberEffect: base }, action: save(`<p>Each creature takes ${hail[1]} ${hail[2]} damage (basic ${hail[3]} save).</p>`, hail[3].toLowerCase(), true, { damage: { formula: hail[1], type: hail[2] }, area: true }),
                reminder: "Target each creature in or below the storm." },
            { key: "lightning", title: "Lightning", kind: "mode", noRepeat: true, state: { memberEffect: base }, action: save(`<p>Each creature takes ${lightning[2]} ${lightning[3]} damage (basic ${lightning[4]} save).</p>`, lightning[4].toLowerCase(), true, { damage: { formula: lightning[2], type: lightning[3] }, area: true, count: Number(lightning[1]) }),
                reminder: `Target up to ${lightning[1]} creatures in or below the storm.` },
            { key: "tornado", title: "Tornado", kind: "mode", noRepeat: true, state: { memberEffect: base }, action: { type: "launch", feet: Number(tornado[2]) },
                reminder: `Target each creature in a ${tornado[1]}-foot radius in or below the cloud: thrown ${tornado[2]} feet up, then falls (PF2e's falling).` }],
        notes: ["The air in the area is greater difficult terrain for flying creatures (the GM)."],
        claimed: [...intro, ...Object.values(modes).map(mode => `${mode.name} ${mode.text}`), parts[3], plain(html.slice(html.lastIndexOf("<p><strong>Heightened")))]
    };
}

// Storm of Vengeance: the −4 to physical and weapon ranged attacks under the placed cloud (generated); Acid Rain (4d8 acid, no save), Hail (4d10 bludgeoning,
// basic Fortitude), Lightning (up to 10, 7d6 electricity, basic Reflex), Rain and Wind (difficult terrain, concealment), Thunderclap (Fortitude or Deafened for
// 10 minutes; a success immune for 1 hour).
function vengeanceStorm(adapted) {
    const area = adapted.targeting?.area, time = seconds(adapted.lifecycle?.duration);
    if (area?.type !== "burst" || !adapted.lifecycle?.sustained || !time || (adapted.defense?.kind ?? "none") !== "none") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = /^<p>([^<]*)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*<hr\s*\/?>\s*<p><strong>Heightened \((\d+)th\)<\/strong> The range increases to ([\d,]+) feet, and the cloud is a ([\d,]+)-foot burst\.<\/p>\s*$/.exec(html.trim());
    if (!parts) return null;
    const intro = split(plain(parts[1]));
    const STATED = [new RegExp(`^A massive storm cloud forms in the air in a ${area.value}-foot burst\\.$`),
        /^Beneath it, rain begins to fall, and gales impose a -(\d) circumstance penalty to physical ranged attacks and weapon ranged attacks, and the air in the area becomes greater difficult terrain for flying creatures\.$/,
        /^When you Cast this Spell and the first time each round you Sustain the Spell, you can choose one of the following storm effects\.$/, /^You can't choose the same effect twice in a row\.$/];
    const found = STATED.map(pattern => intro.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || intro.length !== STATED.length) return null;
    const modes = Object.fromEntries(modeList(parts[2]).map(mode => [mode.key, mode]));
    const acid = /^Each creature in the storm takes (\d+d\d+) ([a-z]+) damage with no saving throw\.$/.exec(modes["acid-rain"]?.text ?? "");
    const hail = /^The storm deals (\d+d\d+) ([a-z]+) damage to creatures beneath it \(basic (Fortitude|Reflex) save\)\.$/.exec(modes.hail?.text ?? "");
    const lightning = /^Up to (\d+) bolts of lightning strike down, targeting creatures of your choice in the storm\. No more than one bolt can target any one creature\. Each bolt deals (\d+d\d+) ([a-z]+) damage \(basic (Reflex|Fortitude) save\)\.$/.exec(modes.lightning?.text ?? "");
    const wind = /^Heavy rain and whipping wind reduce visibility and mobility, making the area under the storm cloud difficult terrain and making everything seen within or through the area @UUID\[[^\]]+\]\{Concealed\}\.$/.exec(modes["rain-and-wind"]?.text ?? "");
    const thunder = new RegExp(String.raw`^Each creature in the storm must succeed at a (Fortitude|Reflex|Will) save or be @UUID\[Compendium\.pf2e\.conditionitems\.Item\.${DEAFENED}\]\{Deafened\} for (\d+) minutes\. A creature that succeeds is temporarily immune to thunderclaps from [a-z ]+ for (\d+) hours?\.$`).exec(modes.thunderclap?.text ?? "");
    if (!acid || !hail || !lightning || !wind || !thunder || Object.keys(modes).length !== 5) return null;
    const penalty = Number(found[1][1]);
    const base = generated("Storm winds", `−${penalty} circumstance to physical and weapon ranged attacks.`, [rangedPenalty(-penalty)]);
    const deafened = C(DEAFENED, "Deafened");
    return {
        area: { label: "The storm cloud", shape: "burst", radius: Number(area.value), byRank: [{ minRank: Number(parts[3]), radius: Number(parts[5].replace(/,/g, "")) }], place: true, seconds: time, sustained: true, base: { memberEffect: base } },
        parts: [
            { key: "acid-rain", title: "Acid Rain", kind: "mode", noRepeat: true, state: { memberEffect: base }, action: { type: "damage", formula: `${acid[1]}[${acid[2]}]` }, reminder: "Target each creature in the storm." },
            { key: "hail", title: "Hail", kind: "mode", noRepeat: true, state: { memberEffect: base }, action: save(`<p>Each creature takes ${hail[1]} ${hail[2]} damage (basic ${hail[3]} save).</p>`, hail[3].toLowerCase(), true, { damage: { formula: hail[1], type: hail[2] }, area: true }),
                reminder: "Target each creature beneath the storm." },
            { key: "lightning", title: "Lightning", kind: "mode", noRepeat: true, state: { memberEffect: base }, action: save(`<p>Each creature takes ${lightning[2]} ${lightning[3]} damage (basic ${lightning[4]} save).</p>`, lightning[4].toLowerCase(), true, { damage: { formula: lightning[2], type: lightning[3] }, area: true, count: Number(lightning[1]) }),
                reminder: `Target up to ${lightning[1]} creatures in the storm (one bolt each).` },
            { key: "rain-and-wind", title: "Rain and Wind", kind: "mode", noRepeat: true, state: { memberEffect: base, memberEffects: [generated("Rain and wind", "Concealed by the rain and wind.", [concealedRule])], terrain: { difficulty: 2 } },
                reminder: "The area is difficult terrain, and everything in it is Concealed." },
            { key: "thunderclap", title: "Thunderclap", kind: "mode", noRepeat: true, state: { memberEffect: base },
                action: save(`<p>The target must attempt a ${thunder[1]} save.</p>` + rows(["The target is unaffected.", "The target is unaffected.", `The target is ${deafened} for ${thunder[2]} minutes.`, `The target is ${deafened} for ${thunder[2]} minutes.`]),
                    thunder[1].toLowerCase(), false, { area: true }),
                reminder: `Target each creature in the storm, except those that succeeded at a thunderclap in the last ${thunder[3]} hour${thunder[3] === "1" ? "" : "s"}.` }],
        notes: ["The air in the area is greater difficult terrain for flying creatures (the GM).", `A creature that succeeds against a thunderclap is immune to thunderclaps for ${thunder[3]} hour${thunder[3] === "1" ? "" : "s"}.`],
        claimed: [...intro, ...Object.values(modes).map(mode => `${mode.name} ${mode.text}`), plain(html.slice(html.lastIndexOf("<p><strong>Heightened")))]
    };
}

// Musical Shift: PF2e's Effect on each creature in the emanation — the key signature (Flat, Natural, Sharp) for enemies, the time signature (Double,
// Quadruple, Triple) for allies, each changed on a Sustain.
function musicalKeys(adapted, catalog) {
    const area = adapted.targeting?.area, time = seconds(adapted.lifecycle?.duration);
    if (area?.type !== "emanation" || !adapted.lifecycle?.sustained || !time || (adapted.defense?.kind ?? "none") !== "none") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const link = /<p>@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{(Spell Effect: [^}]+)\}<\/p>\s*$/.exec(html.trim());
    if (!link) return null;
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => match[1]);
    const intro = split(plain(paragraphs[0]));
    if (!intro.some(sentence => /^When you cast [a-z ]+, select a key signature \(to affect enemies\) and a time signature \(to affect allies\) from the options below; all creatures within the area are affected as indicated\.$/.test(sentence))
        || !intro.some(sentence => /^You can change the key signature or time signature as part of the action you take when you Sustain the spell\.$/.test(sentence))) return null;
    const options = paragraphs.slice(1, -1).map(paragraph => /^<strong>([A-Z][a-z]+)<\/strong> \((key|time) signature\) ([\s\S]+)$/.exec(paragraph.trim())).filter(Boolean);
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[1]);
    const rules = effect?.mechanics?.rules ?? [];
    const choice = rules.findIndex(rule => rule.key === "ChoiceSet" && Array.isArray(rule.choices));
    const values = choice >= 0 ? rules[choice].choices.map(entry => entry.value) : [];
    if (!effect?.id || options.length !== paragraphs.length - 2 || options.length < 4 || !options.every(option => values.includes(option[1].toLowerCase()))) return null;
    const uuid = `Compendium.pf2e.spell-effects.Item.${effect.id}`;
    const slotOf = kind => kind === "key" ? 1 : 2;
    return {
        area: { label: "The music", shape: "emanation", radius: Number(area.value), follow: true, seconds: time, sustained: true, excludeCaster: false, base: {} },
        parts: options.map(option => ({ key: option[1].toLowerCase(), title: `${option[1]} (${option[2]} signature)`, kind: "mode",
            state: { slot: slotOf(option[2]), member: { uuid, [option[2] === "key" ? "enemies" : "allies"]: true, selection: { index: choice, flag: rules[choice].flag, value: option[1].toLowerCase() } } },
            reminder: option[2] === "key" ? "Enemies in the area: " + plain(option[3]) : "You and your allies in the area: " + plain(option[3]) })),
        notes: ["Choose one key signature and one time signature on the cast; on a Sustain, either can change."],
        claimed: [...intro, ...options.map(option => plain(option[0]))]
    };
}

// Dancing Fountain: a 30-foot burst where the caster stands; Chasing Jets (one creature's Reflex save or moved 15 feet, in the fountain), Flashing Spray
// (Concealed inside), Power Rings (a 10-foot burst's 10d6 bludgeoning, basic Reflex); never the same display twice in a row.
function fountainDisplays(adapted) {
    const area = adapted.targeting?.area, time = seconds(adapted.lifecycle?.duration);
    if (area?.type !== "burst" || !adapted.lifecycle?.sustained || !time || adapted.defense?.basic !== true) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = /^<p><strong>Area<\/strong> (\d+)-foot burst centered on you<\/p>\s*<hr\s*\/?>\s*<p>([^<]*)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*$/.exec(html.trim());
    if (!parts || Number(parts[1]) !== Number(area.value)) return null;
    const intro = split(plain(parts[2]));
    if (!intro.some(sentence => /^When you Cast the Spell, and the first time each round you Sustain the spell, you can command the fountain to use one of the following displays, which is accompanied by a loud burst of music\.$/.test(sentence))
        || !intro.some(sentence => /^The [a-z ]+ is somewhat fickle in its desire for novelty, meaning it can't be commanded to use the same display on two consecutive turns\.$/.test(sentence))) return null;
    const modes = Object.fromEntries(modeList(parts[3]).map(mode => [mode.key, mode]));
    const jets = /^A series of vertical jets shoot up in a chase sequence, forcing one creature within the fountain to move (\d+) feet in a direction of your choice unless it succeeds at a (Reflex|Fortitude) save against your spell DC\. The fountain can't make a creature move outside its area\.$/.exec(modes["chasing-jets"]?.text ?? "");
    const spray = /^Diffuse fog fills the area of the emanation\. All creatures within the fountain become @UUID\[[^\]]+\]\{Concealed\}, and all creatures outside the fountain become concealed to creatures within it\. The spray persists until the beginning of your next turn\.$/.exec(modes["flashing-spray"]?.text ?? "");
    const rings = /^The fountain blasts a series of rings of water into the air that land with a crash in a @Template\[burst\|distance:(\d+)\] centered on a location of your choice within the fountain\. The falling torrent deals @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage to all creatures within the burst \(basic (Reflex|Fortitude)\)\.$/.exec(modes["power-rings"]?.text ?? "");
    if (!jets || !spray || !rings || Object.keys(modes).length !== 3) return null;
    return {
        area: { label: "The fountain", shape: "burst", radius: Number(area.value), atCaster: true, seconds: time, sustained: true, excludeCaster: false, base: {} },
        parts: [
            { key: "chasing-jets", title: "Chasing Jets", kind: "mode", noRepeat: true, state: {},
                action: save(`<p>The target must attempt a ${jets[2]} save.</p>` + rows(["The target is unaffected.", "The target is unaffected.", `The target is pushed ${jets[1]} feet.`, `The target is pushed ${jets[1]} feet.`]), jets[2].toLowerCase(), false),
                reminder: `Target one creature within the fountain: on a failure it moves ${jets[1]} feet in a direction of the caster's choice, staying inside the fountain.` },
            { key: "flashing-spray", title: "Flashing Spray", kind: "mode", noRepeat: true, state: { memberEffect: generated("Flashing spray", "Concealed by the fountain's spray (until the caster's next turn).", [concealedRule]) },
                reminder: "Creatures within the fountain are Concealed (and those outside are concealed to them) until the start of the caster's next turn." },
            { key: "power-rings", title: "Power Rings", kind: "mode", noRepeat: true, state: {},
                action: save(`<p>Each creature takes ${rings[2]} ${rings[3]} damage (basic ${rings[4]} save).</p>`, rings[4].toLowerCase(), true, { damage: { formula: rings[2], type: rings[3] }, area: true }),
                reminder: `Target the creatures in a ${rings[1]}-foot burst within the fountain.` }],
        notes: [],
        claimed: [...intro, ...Object.values(modes).map(mode => `${mode.name} ${mode.text}`)]
    };
}

// Impaling Briars: the emanation's briars; Ensnare (foes' Reflex: −10 feet to Speeds for 1 round, or Immobilized for 1 round unless they Escape), Impede
// (difficult terrain), Wall (a wall of thorns for 1 round, greater difficult terrain); impaling once a round (spell attack, 10d6 piercing, −10 feet or Immobilized).
function briarModes(adapted) {
    const area = adapted.targeting?.area, time = seconds(adapted.lifecycle?.duration);
    if (area?.type !== "emanation" || !adapted.lifecycle?.sustained || !time || adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = /^<p>([^<]*)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*<p>([\s\S]*?)<\/p>\s*$/.exec(html.trim());
    if (!parts) return null;
    const intro = split(plain(parts[1]));
    if (!intro.some(sentence => /^When you Cast the S[a-z]+ and the first time you Sustain it each turn on subsequent rounds, select one of the following effects to occur in the area\.$/.test(sentence))) return null;
    const modes = Object.fromEntries(modeList(parts[2]).map(mode => [mode.key, mode]));
    const IMM = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.${IMMOBILIZED}\]\{Immobilized\}`;
    const ensnare = new RegExp(String.raw`^The briars clump around your foes, attempting to hold them in place\. A foe within the area \(or flying at most (\d+) feet above the area\) must attempt a (Reflex|Fortitude) save\. On a failure, it takes a –(\d+)-foot circumstance penalty to all Speeds for (\d+) rounds?, and on a critical failure, it is ${IMM} for (\d+) rounds? unless it Escapes\.$`).exec(modes.ensnare?.text ?? "");
    const impede = /^The briars twist and writhe, making the entire area difficult terrain\.$/.test(modes.impede?.text ?? "");
    const wall = /^A @UUID\[[^\]]+\]\{Wall of Thorns\} appears in the area, lasting for (\d+) rounds?\. The wall is greater difficult terrain instead of difficult terrain\.$/.exec(modes.wall?.text ?? "");
    const impale = new RegExp(String.raw`^In addition, once per round you can direct the briars to impale any target in the area \(or flying up to (\d+) feet above the area\) that you can see by using a single action, which has the concentrate and manipulate traits\. Make a spell attack roll\. On a success, the target takes (\d+d\d+) ([a-z]+) damage and takes a –(\d+)-foot circumstance penalty to all Speeds for (\d+) rounds?; on a critical success, the target is (?:${IMM}|Immobilized) for (\d+) rounds? unless it Escapes\.$`).exec(plain(parts[3]));
    if (!ensnare || !impede || !wall || !impale || Object.keys(modes).length !== 3) return null;
    const imm = C(IMMOBILIZED, "Immobilized");
    return {
        area: { label: "The briars", shape: "emanation", radius: Number(area.value), follow: true, seconds: time, sustained: true, excludeCaster: false, base: {} },
        parts: [
            { key: "ensnare", title: "Ensnare", kind: "mode", state: {},
                action: save(`<p>The target must attempt a ${ensnare[2]} save.</p>` + rows(["The target is unaffected.", "The target is unaffected.", `The target takes a –${ensnare[3]}-foot circumstance penalty to its Speeds for ${ensnare[4]} round.`,
                    `The target is ${imm} for ${ensnare[5]} round or until it Escapes.`]), ensnare[2].toLowerCase(), false, { area: true }),
                reminder: `Target each foe in the area (or flying at most ${ensnare[1]} feet above it).` },
            { key: "impede", title: "Impede", kind: "mode", state: { terrain: { difficulty: 2 } }, reminder: "The whole area is difficult terrain." },
            { key: "wall", title: "Wall", kind: "mode", state: {}, action: { type: "terrain", place: { type: "line", value: 60 }, difficulty: 3, rounds: Number(wall[1]) },
                reminder: `Place the wall of thorns (as the spell, inside the area): greater difficult terrain for ${wall[1]} round. Its Hit Points and the rest of wall of thorns' text are the GM's.` },
            { key: "impale", title: "Impale", kind: "action", spec: { type: "attack", damage: { formula: impale[2], type: impale[3] }, range: Number(area.value),
                    // (A miss does nothing: the attack's two hit rows.)
                    rowsHTML: rows([`The target takes double damage and is ${imm} for ${impale[6]} round or until it Escapes.`, `The target takes full damage and takes a –${impale[4]}-foot circumstance penalty to its Speeds for ${impale[5]} round.`]).replace(/<p><strong>(?:Failure|Critical Failure)<\/strong> undefined<\/p>/g, "") },
                repeat: { trigger: "the caster uses its single action (once per round)" }, reminder: `Target one creature in the area (or flying up to ${impale[1]} feet above it) that the caster can see.` }],
        notes: ["A critical hit with the impaling briars deals double damage (the spell attack's critical success) and Immobilizes the target."],
        claimed: [...intro, ...Object.values(modes).map(mode => `${mode.name} ${mode.text}`), plain(parts[3])]
    };
}

// Control Sand: the sandstorm around the caster — a creature starting its turn in it or moving in saves (Fortitude) or is Dazzled while inside, then immune
// for 10 minutes; Sand Shield (a held shield of sand: Hardness 14, 21 Hit Points, no AC), Sandblast (one creature within 30 feet: 8d6 slashing, basic
// Reflex, Dazzled for 1 minute on a critical failure), Sandstorm (the area grows to 30 feet and deals 6d4 slashing, basic Reflex, to a creature starting its
// turn in it or moving in); one mode at a time, switched on a Sustain.
const DAZZLED = "Compendium.pf2e.conditionitems.Item.TkIyaNPgTZFBCCuh";
function sandModes(adapted) {
    const area = adapted.targeting?.area, time = seconds(adapted.lifecycle?.duration);
    if (area?.type !== "emanation" || !adapted.lifecycle?.sustained || !time || (adapted.defense?.kind ?? "none") !== "none") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = /^<p>([^<]*)<\/p>\s*<p>([^<]*)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*$/.exec(html.trim());
    if (!parts) return null;
    const base = /^You whip up a small sandstorm around your body\. When a creature starts its turn in the area or moves into the area, it must succeed at a (Fortitude|Reflex|Will) save or become dazzled for as long as it remains in the area; it is then temporarily immune to this dazzling effect for (\d+) minutes\.$/.exec(plain(parts[1]));
    const choose = /^Choose one of the following additional effects when you cast this spell\. On subsequent rounds, you can switch to a different effect once per round as a free action triggered by sustaining the spell\.$/.test(plain(parts[2]));
    const modes = Object.fromEntries(modeList(parts[3]).map(mode => [mode.key, mode]));
    const shield = /^You create a magical shield made of sand\. The sand shield provides no benefit to AC, but it does allow you to use the @UUID\[[^\]]+\]\{Shield Block\} reaction and acts as a shield for this purpose\. The sand shield has Hardness (\d+), (\d+) Hit Points, and no Broken Threshold; when the shield's HP are reduced to 0, you can't use its Shield Block reaction again until the next time you Sustain the Spell and choose the sand shield effect\.$/.exec(modes["sand-shield"]?.text ?? "");
    const blast = new RegExp(String.raw`^You direct a jet of sand at a single target\. One creature of your choice within (\d+) feet takes (\d+d\d+) ([a-z]+) damage \(basic (Reflex|Fortitude) save\)\. On a critical failure, the creature is also @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Dazzled\} for (\d+) minutes?\.$`).exec(modes.sandblast?.text ?? "");
    const storm = /^The area of the spell expands to a (\d+)-foot emanation, and any creature that starts its turn in the area or moves into the area takes (\d+d\d+) ([a-z]+) damage \(basic (Reflex|Fortitude) save\) and must hold its breath or begin suffocating\.$/.exec(modes.sandstorm?.text ?? "");
    if (!base || !choose || !shield || !blast || !storm || Object.keys(modes).length !== 3) return null;
    const key = String(adapted.source?.slug ?? adapted.source?.name ?? "sand").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const dazzle = { conditions: [{ uuid: DAZZLED, slug: "dazzled" }], expiry: "leave-area" };
    return {
        area: { label: "The sandstorm", shape: "emanation", radius: Number(area.value), follow: true, seconds: time, sustained: true, excludeCaster: true,
            base: { hazard: { events: ["enter", "turn-start"], oncePerTurn: true, conditionSave: { statistic: base[1].toLowerCase(), rows: { failure: dazzle, criticalFailure: dazzle }, immunity: { key, seconds: Number(base[2]) * 60 } } } } },
        parts: [
            { key: "sand-shield", title: "Sand Shield", kind: "mode", state: { shield: { name: "Sand shield", part: "sand", hardness: Number(shield[1]), hp: Number(shield[2]), acBonus: 0 } },
                reminder: `A shield of sand in the caster's hands (Hardness ${shield[1]}, ${shield[2]} Hit Points, no Broken Threshold, no AC): only for Shield Block. Choosing it again on a Sustain restores it.` },
            { key: "sandblast", title: "Sandblast", kind: "mode", state: {},
                action: save(`<p>The target takes ${blast[2]} ${blast[3]} damage (basic ${blast[4]} save).</p>` + rows(["The target is unaffected.", "The target takes half damage.", "The target takes full damage.",
                    `The target takes double damage and is @UUID[${blast[5]}]{Dazzled} for ${blast[6]} minute.`]), blast[4].toLowerCase(), true, { damage: { formula: blast[2], type: blast[3] } }),
                reminder: `Target one creature within ${blast[1]} feet.` },
            { key: "sandstorm", title: "Sandstorm", kind: "mode", state: { radius: Number(storm[1]), child: { radius: Number(storm[1]), events: ["enter", "turn-start"], oncePerTurn: true, formula: storm[2], type: storm[3], basic: storm[4].toLowerCase() } },
                reminder: `The area grows to ${storm[1]} feet: a creature starting its turn in it or moving in takes ${storm[2]} ${storm[3]} (basic ${storm[4]}) and must hold its breath or begin suffocating (the GM).` }],
        notes: [`The sandstorm's Fortitude save (Dazzled while inside) is once per creature every ${base[2]} minutes.`],
        claimed: [plain(parts[1]), plain(parts[2]), ...Object.values(modes).map(mode => `${mode.name} ${mode.text}`)]
    };
}

// Vibrant Vibrato: the emanation around the caster (a radius it chooses, up to 40 feet), each creature inside at the cast or entering saving (Will) once for
// the casting; a success, failure or critical failure takes the 5d10 sonic at the end of each of its turns inside; a failure or critical failure leaving the
// area (or left behind by the caster) hears the shattering sound — 5d10 sonic (1d10 more each rank; double on a critical failure), Stunned 1 (3), Deafened for
// the rest of the spell.
function vibratoAura(adapted) {
    const area = adapted.targeting?.area, time = seconds(adapted.lifecycle?.duration);
    if (area?.type !== "emanation" || !adapted.lifecycle?.sustained || !time || adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [lead, rowsPart, heightened] = html.split(/<hr\s*\/?>/i);
    if (!rowsPart || !heightened) return null;
    const intro = split(plain(lead));
    const STATED = [new RegExp(`^When casting the spell, you can make the area any radius you choose, up to ${area.value} feet\\.$`),
        /^The reverberations of your voice continue to shimmer and hang in the air as long as you Sustain the spell but can't be heard at all outside of the area\.$/,
        new RegExp(`^A creature must attempt a (${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)}) save if it's within the area when you Cast the Spell or as soon as it enters the area while the spell is in effect\\.$`),
        /^Once a creature has attempted the save, it uses the same result for that casting of [a-z ]+ ?\.$/];
    const found = STATED.map(pattern => intro.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || intro.filter(sentence => !found.some(match => match[0] === sentence)).some(sentence => /\d|@|\b(?:damage|save)\b/.test(sentence))) return null;
    const row = name => plain((new RegExp(`<p>\\s*<strong>${name}<\\/strong>([\\s\\S]*?)<\\/p>`).exec(rowsPart) ?? [])[1] ?? "");
    const success = /^The creature takes @Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\] damage at the end of their turn as long as they remain within the aura's area of effect\.$/.exec(row("Success"));
    const failure = new RegExp(String.raw`^As success, but if the creature leaves the area, or if you move far enough from the creature that they're no longer in the area, the creature hears a shattering sound and takes (\d+)d(\d+) ([a-z]+) damage and is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Stunned (\d)\}\. The creature is then @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Deafened\} for the rest of the spell's duration\.$`).exec(row("Failure"));
    const critical = /^As failure, but the creature takes double the ([a-z]+) damage and is @UUID\[[^\]]+\]\{Stunned (\d)\}\.$/.exec(row("Critical Failure"));
    const step = /^\s*<p><strong>Heightened \(\+(\d)\)<\/strong> The damage on a failed save increases by (\d)d(\d+)\.<\/p>\s*$/.exec(heightened);
    if (row("Critical Success") !== "The creature is unaffected." || !success || !failure || !critical || !step || critical[1] !== failure[3] || step[3] !== failure[2]) return null;
    const turnEnd = { formula: success[1], type: success[2] };
    return {
        area: { label: "The vibrato", shape: "emanation", radius: Number(area.value), chooseRadius: true, follow: true, seconds: time, sustained: true, excludeCaster: true,
            base: { hazard: { events: ["enter", "turn-end"], remembered: { statistic: adapted.defense.statistic, deafened: failure[5],
                leaveDice: { base: Number(failure[1]), die: failure[2], type: failure[3], step: Number(step[2]) / Number(step[1]), baseRank: Number(adapted.rank) },
                rows: { success: { turnEnd }, failure: { turnEnd, leave: { multiplier: 1, stunned: Number(failure[4]) } }, criticalFailure: { turnEnd, leave: { multiplier: 2, stunned: Number(critical[2]) } } } } } } },
        parts: [{ key: "vibrato", title: "The vibrato", note: "Each creature saves once (when it's inside at the cast or enters); the module keeps its result, deals the end-of-turn damage and the shattering sound when it leaves." }],
        notes: ["The vibrato can't be heard outside its area (the GM)."],
        claimed: [...found.map(match => match[0]), row("Critical Success"), row("Success"), row("Failure"), row("Critical Failure"), plain(heightened)]
    };
}
