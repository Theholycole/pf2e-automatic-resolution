// The abilities a form's stat block lists around PF2e's Effect, which the Effect doesn't carry (Monstrosity Form, Nature Incarnate, Qi Form):
//   - a damaging aura: "Shroud of Flame (aura, fire, primal) 20 feet. You gain an aura of fire that extends out from you. A creature that enters or
//     ends its turn within the aura takes 2d6 fire damage. A creature can take this damage only once per turn. You can activate or deactivate this
//     aura with a Sustain action." / "Your corona is an aura in a 5-foot emanation that deals 2d6 damage of the chosen type to creatures who start
//     their turn within the emanation. … You can Sustain to flare your corona out to become a 30-foot emanation or return the corona to a 5-foot
//     emanation." — a region following the caster, dealing it by itself (the chosen type from PF2e's choice);
//   - a saving aura: "Green Caress (aura, primal) 60 feet. Enemies other than plants must succeed at a Fortitude save against your spell DC or become
//     Clumsy 1 for 1 round (Clumsy 2 on a critical failure)." — the same region, each enemy's save when it enters or starts its turn there;
//   - a turn-end recovery: "Inexorable You automatically recover from the Paralyzed, Slowed, and Stunned conditions at the end of each of your
//     turns." — those conditions removed as the caster's turn ends;
//   - a moving save: "Spine Rake [2] (move) You extend your spines and Swim or Stride. Each creature you're adjacent to at any point during your
//     movement takes 4d8+10 slashing damage (basic Reflex against your spell DC)." / "Trample [3] You move up to double your Speed … trampling each
//     creature whose space you enter. A trampled creature takes foot damage with a basic Reflex save against your spell DC." — a button on the
//     form's card for the creatures the GM targets (the foot's damage from its Strike line).
// Each ability belongs to the option heading it sits under (PF2e's choice values); it's used only when that option is picked.
import { htmlToPlainText } from "./description-parser.js";

const LINK = /@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]\{(Spell Effect: [^}]+)\}/;
const COND = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d))?\}`;
const DAMAGE_AURA = /^\(aura, ([a-z, ]+)\) (\d+) feet\. You gain an aura of ([a-z]+) that extends out from you\. A creature that enters or ends its turn within the aura takes (\d+d\d+) ([a-z]+) damage\. A creature can take this damage only once per turn\. You can activate or deactivate this aura with a Sustain action\.$/;
const SAVE_AURA = new RegExp(String.raw`^\(aura, ([a-z, ]+)\) (\d+) feet\. Enemies other than ([a-z]+)s must succeed at a @Check\[(fortitude|reflex|will)\|against:spell\] against your spell DC or become ${COND} for (\d+) rounds? \(${COND} on a critical failure\)\.$`);
const RECOVERY = new RegExp(String.raw`^You automatically recover from the ${COND}, ${COND}, and ${COND} conditions at the end of each of your turns\. You're also immune to being ${COND} and ignore difficult terrain and greater difficult terrain\.$`);
const UNSTOPPABLE = new RegExp(String.raw`^You are immune to being ${COND} and ignore difficult terrain and greater difficult terrain;$`);
const MOVE_SAVE = /^(\d) \(move\) ([A-Z][^.]+)\. Each creature you're adjacent to at any point during your movement takes (\d+d\d+\+\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) against your spell DC\)\.$/;
const TRAMPLE = /^(\d) You move up to double your Speed and move through the spaces of (Large|Huge|Gargantuan) or smaller creatures, trampling each creature whose space you enter\. A trampled creature takes ([a-z]+) damage with a @Check\[(fortitude|reflex|will)\|against:spell\|basic\] save against your spell DC\.$/;
const STRIKE_LINE = /^(?:Melee|Ranged) \d ([a-z]+) \([^)]*\),? Damage (\d+d\d+\+\d+) ([a-z]+);$/;
const SPACE = /You must have enough space to expand into or the spell is lost\.\s*/;
// Qi Form's corona: a paragraph's sentences.
const CORONA = [/Your entire body is also surrounded by a glowing corona of the same color as your inner [a-z]+; this is a light effect\./,
    /Your corona is an aura in a (\d+)-foot emanation that deals (\d+d\d+) damage of the chosen type to creatures who start their turn within the emanation\./,
    /If the emanation overlaps with a darkness effect, the corona's glow attempts to counteract the darkness\./,
    /Regardless of the outcome, the corona can't attempt to counteract that effect again for 1 day\./,
    /You can Sustain to flare your corona out to become a (\d+)-foot emanation or return the corona to a (\d+)-foot emanation\./];

// Corrosive Body's sentences.
const CORRODE = /Any creature that touches you or damages you with an unarmed melee attack or non-reach melee weapon takes (\d+d\d+) ([a-z]+) damage, and your unarmed attacks deal (\d+)d(\d+) additional \2 damage\./;
const DIGEST = /The first time each round that you deal ([a-z]+) damage to a creature in this way, you gain (\d+d\d+) Temporary Hit Points temporary Hit Points as [^.]+\./;
const EXPIRES = /When the spell ends, any remaining temporary HP expires as well\./;
const MORE_DICE = /Your ([a-z]+) spells deal one additional die of \1 damage \(of the same damage die the spell uses\)\./;
const INNATE = /You can cast @UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{([^}]+)\} as an innate spell; the splash damage affects all creatures within (\d+) feet instead of the normal (\d+) feet\./;
const CORRODE_STEP = /<p><strong>Heightened \((\d+)th\)<\/strong> Creatures touching you take (\d+d\d+) ([a-z]+) damage instead of (\d+d\d+), your unarmed attacks deal (\d+)d(\d+) additional \3 damage, and you gain (\d+d\d+) Temporary Hit Points temporary Hit Points\.<\/p>/;
// One with the Land's list and closing paragraph.
const LAND = [/You immediately become aware of the surrounding terrain features, and you gain tremorsense as an imprecise sense with a range of (\d+) feet\./,
    /You can make terrain vengeance Strikes by commanding plants, rocks, and other natural features to attack your foes\. These are melee Strikes that use your spell attack modifier, can target any creature within (\d+) feet of you, and deal (\d+d\d+) @Damage\[\d+d\d+\[([a-z]+)\]\]\{\3\}, @Damage\[\d+d\d+\[([a-z]+)\]\]\{\4\}, or @Damage\[\d+d\d+\[([a-z]+)\]\]\{\5\} damage\. You choose the damage type each time you make a terrain vengeance Strike\./,
    /By spending a single action, which has the concentrate trait, you can increase or decrease the environmental temperature changing it to either one step warmer than normal, one step colder than normal, or the normal temperature\./,
    /As a (2)-action activity that has the concentrate trait, you can create or remove difficult terrain caused by natural terrain in a (\d+)-foot burst within (\d+) feet\./,
    /All of your alterations to the land end when the spell ends\./,
    /Significant physical damage to the natural feature while you are inside it expels you and deals \[\[\/r (\d+d\d+)\]\]\{\1 damage\} to you\./,
    /Your merged form is visible within the feature, and creatures can target and attack you normally, though you have cover and can use it to \[\[\/act hide\]\] or \[\[\/act take-cover\]\] within the feature\./,
    /You can cast spells while in the feature as long as they don't require line of effect beyond the feature\./];

const slug = text => String(text).trim().toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const cond = (match, at) => ({ uuid: match[at], slug: match[at + 1].toLowerCase(), ...(match[at + 2] ? { value: Number(match[at + 2]) } : {}) });

/** {remainingHTML, formRiders, claimed, actionSources} or null; the catalog proves PF2e's Effect (its choice values and choice flag). */
export function extractFormRiders(adapted, catalog) {
    if ((adapted.defense?.kind ?? "none") !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    let html = String(adapted.descriptionHTML ?? "");
    const link = LINK.exec(html);
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = link ? entries.find(entry => entry?.name === link[2]) : null;
    if (!effect?.id) return null;
    const rules = effect.mechanics?.rules ?? [];
    const choice = rules.find(rule => rule.key === "ChoiceSet" && Array.isArray(rule.choices));
    const values = (choice?.choices ?? []).map(entry => String(entry.value));
    // The option headings (their places in the text).
    const headings = [...html.matchAll(/<strong>([A-Z][A-Za-z ]+)<\/strong>/g)].filter(match => values.includes(slug(match[1]))).map(match => ({ at: match.index, value: slug(match[1]) }));
    const optionAt = index => headings.filter(heading => heading.at < index).at(-1)?.value ?? null;
    const auras = [], recovery = [], actions = [], parts = [], notes = [], claimed = [];
    let tempExpires = false, stripDamage = false;
    const removals = [];
    const abilities = [...html.matchAll(/<li>\s*<strong>([A-Z][A-Za-z' ]+)<\/strong>((?:(?!<li>|<\/li>|<ul>)[\s\S])*)<\/li>/g)];
    for (const ability of abilities) {
        const name = ability[1].trim(), body = plain(ability[2]), option = optionAt(ability.index);
        if (values.length && !option) continue;
        const sourceText = `${name} ${body}`;
        let match;
        if ((match = DAMAGE_AURA.exec(body))) {
            auras.push({ key: slug(name), label: name, option, radius: Number(match[2]), formula: match[4], type: match[5], events: ["enter", "turn-end"], oncePerTurn: true, toggle: true, sourceText });
        } else if ((match = SAVE_AURA.exec(body))) {
            const failure = cond(match, 5), critical = cond(match, 9);
            if (failure.slug !== critical.slug || !failure.value || !critical.value) return null;
            auras.push({ key: slug(name), label: name, option, radius: Number(match[2]), events: ["enter", "turn-start"], oncePerRound: true, sourceText,
                save: { statistic: match[4], enemiesOnly: true, exceptTrait: match[3], rows: { failure: { ...failure, rounds: Number(match[8]) }, criticalFailure: { ...critical, rounds: Number(match[8]) } } } });
        } else if ((match = RECOVERY.exec(body))) {
            const slugs = [cond(match, 1), cond(match, 4), cond(match, 7)].map(entry => entry.slug), immune = cond(match, 10).slug;
            if (!immuneProved(rules, option, immune)) return null;
            recovery.push({ option, slugs, sourceText });
            notes.push(`${name}: the caster ignores difficult terrain and greater difficult terrain (move the token freely).`);
        } else if ((match = UNSTOPPABLE.exec(body))) {
            if (!immuneProved(rules, option, cond(match, 1).slug)) return null;
            notes.push(`${name}: the caster ignores difficult terrain and greater difficult terrain (move the token freely).`);
        } else if ((match = MOVE_SAVE.exec(body))) {
            actions.push({ key: slug(name), label: name, option, cost: Number(match[1]), formula: match[3], type: match[4], statistic: match[5].toLowerCase(), movement: match[2], sourceText,
                reminder: `${match[2]} (the caster's move); target each creature the caster was adjacent to during it.` });
        } else if ((match = TRAMPLE.exec(body))) {
            // (The named Strike's damage, in the same option.)
            const strike = abilities.length && [...html.matchAll(/<li>((?:(?!<li>|<\/li>|<ul>)[\s\S])*)<\/li>/g)]
                .filter(entry => optionAt(entry.index) === option).map(entry => STRIKE_LINE.exec(plain(entry[1]))).find(line => line?.[1] === match[3]);
            if (!strike) return null;
            actions.push({ key: slug(name), label: name, option, cost: Number(match[1]), formula: strike[2], type: strike[3], statistic: match[4], movement: "Move up to double your Speed", sourceText,
                reminder: `Move up to double the caster's Speed through the spaces of ${match[2]} or smaller creatures; target each creature whose space the caster entered.` });
        } else continue;
        claimed.push(sourceText);
        removals.push(ability[0]);
    }
    // Qi Form's corona: the chosen type from PF2e's choice flag (its Strike dice use it).
    const corona = CORONA.map(pattern => pattern.exec(html));
    // ("All your Strikes deal 1d6 additional damage of the chosen type.": PF2e's DamageDice on strike damage, of the choice's type.)
    const strikeDice = /All your Strikes deal (\d+)d(\d+) additional damage of the chosen type\./.exec(html);
    if (corona.every(Boolean) && strikeDice) {
        const flag = rules.find(rule => rule.key === "DamageDice" && /^\{item\|flags\.system\.rulesSelections\.([A-Za-z]+)\}$/.test(String(rule.damageType))
            && rule.selector === "strike-damage" && Number(rule.diceNumber) === Number(strikeDice[1]) && rule.dieSize === `d${strikeDice[2]}`);
        const typeFlag = flag ? /rulesSelections\.([A-Za-z]+)/.exec(flag.damageType)[1] : null;
        const aura = rules.find(rule => rule.key === "Aura");
        if (!typeFlag || !aura || Number(corona[4][2]) !== Number(corona[1][1])) return null;
        auras.push({ key: "corona", label: "Corona", option: null, radius: Number(corona[1][1]), sizes: [Number(corona[1][1]), Number(corona[4][1])], formula: corona[1][2], typeFlag,
            events: ["turn-start"], sourceText: corona.map(found => found[0]).join(" ") });
        notes.push("The corona is a light effect: overlapping a darkness effect, its glow attempts to counteract the darkness (the GM rolls), and it can't try that effect again for 1 day.");
        claimed.push(...corona.map(found => found[0]), strikeDice[0]);
        removals.push(...corona.map(found => found[0]), strikeDice[0]);
    }
    // Corrosive Body: the touch's damage to the creature (with the caster's temporary Hit Points, the first time each round), the same Hit Points for an
    // unarmed hit's acid, their end with the spell; the unarmed and spell dice PF2e's.
    const corrode = CORRODE.exec(html), digest = DIGEST.exec(html), expires = EXPIRES.exec(html), moreDice = MORE_DICE.exec(html), innate = INNATE.exec(html), step = CORRODE_STEP.exec(html);
    if (corrode && digest && expires && moreDice && innate && step && digest[1] === corrode[2] && moreDice[1] === corrode[2] && step[3] === corrode[2] && step[4] === corrode[1]) {
        const rank = Number(step[1]);
        const unarmed = rules.find(rule => rule.key === "DamageDice" && rule.selector === "strike-damage" && rule.damageType === corrode[2] && rule.dieSize === `d${corrode[4]}`
            && String(rule.diceNumber).replace(/\s+/g, "") === `ternary(gte(@item.level,${rank}),${step[5]},${corrode[3]})` && JSON.stringify(rule.predicate) === '["item:category:unarmed"]');
        const spells = rules.find(rule => rule.key === "DamageDice" && rule.selector === "spell-damage" && Number(rule.diceNumber) === 1 && !rule.dieSize && JSON.stringify(rule.predicate) === `["item:damage:type:${corrode[2]}"]`);
        const immune = rules.some(rule => rule.key === "Immunity" && [rule.type].flat().includes(corrode[2]));
        if (!unarmed || !spells || !immune || step[6] !== corrode[4]) return null;
        const tempHp = { formula: digest[2], byRank: [{ minRank: rank, formula: step[7] }] };
        parts.push({ key: "corrode", title: "Corrosive touch", kind: "retaliate", formula: `${corrode[1]}[${corrode[2]}]`, byRank: [{ minRank: rank, formula: `${step[2]}[${corrode[2]}]` }], tempHp,
            repeat: { trigger: "a creature touches the caster or damages it with an unarmed melee attack or non-reach melee weapon" }, reminder: "Target that creature: it takes the acid, and the caster gains the temporary Hit Points the first time each round." });
        parts.push({ key: "digest", title: "Digesting acid", kind: "temp-hp", tempHp, repeat: { trigger: "the caster's unarmed Strike deals its acid damage" },
            reminder: "The caster gains the temporary Hit Points (the first time each round the acid is dealt)." });
        notes.push(`${innate[1]} is an innate spell while the form lasts; its splash affects all creatures within ${innate[2]} feet instead of ${innate[3]} (the GM).`);
        tempExpires = true; stripDamage = true;
        const sentences = [corrode[0], digest[0], expires[0], moreDice[0], innate[0]];
        claimed.push(...sentences, step[0]); removals.push(...sentences, step[0]);
    }
    // One with the Land: the terrain's Strikes (the caster's spell attack, the chosen type each time), the difficult terrain the caster makes, and the
    // expulsion's damage to the caster; the rest the GM's.
    const land = LAND.map(pattern => pattern.exec(html));
    if (land.every(Boolean) && rules.some(rule => rule.key === "Sense" && rule.selector === "tremorsense" && Number(rule.range) === Number(land[0][1]))) {
        const types = [land[1][3], land[1][4], land[1][5]];
        parts.push({ key: "vengeance", title: "Terrain vengeance Strike", kind: "text-attack", range: Number(land[1][1]), damage: land[1][2], types, count: 1,
            repeat: { trigger: "the caster makes a terrain vengeance Strike" }, reminder: `Target one creature within ${land[1][1]} feet of the caster; choose the damage type on the card.` });
        parts.push({ key: "terrain", title: "Difficult terrain", kind: "terrain", place: { type: "burst", value: Number(land[3][2]) }, difficulty: 2, rounds: 10, repeat: { trigger: "the caster spends 2 actions" },
            reminder: `Place a ${land[3][2]}-foot burst within ${land[3][3]} feet: difficult terrain until the spell ends. Removing natural difficult terrain is the GM's.` });
        parts.push({ key: "expelled", title: "Expelled", kind: "damage", formula: land[5][1], repeat: { trigger: "significant physical damage to the feature expels the caster" },
            reminder: "Target the caster: it takes the damage and leaves the feature (end the spell's Effect)." });
        notes.push("The caster is merged in the feature: it has cover (Hide or Take Cover within it), can be targeted normally, and casts only spells that don't need line of effect beyond the feature.",
            "A single action (concentrate) moves the temperature one step warmer or colder than normal, or back to normal (the GM).");
        const sentences = land.map(found => found[0]);
        claimed.push(...sentences); removals.push(...sentences);
    }
    if (!auras.length && !recovery.length && !actions.length && !parts.length) return null;
    // ("Heightened (9th) … increase damage by one damage die": the form's own damaging abilities gain the die too (user decision 2026-10-05); PF2e's
    // Effect raises the Strikes.)
    const extraDie = /<strong>Heightened \((\d+)th\)<\/strong>[^<]*\bincrease damage by one damage die\b/.exec(html);
    if (extraDie) for (const entry of [...auras, ...actions]) {
        const dice = /^(\d+)d(\d+)((?:\+\d+)?)$/.exec(entry.formula ?? "");
        if (dice) entry.byRank = [{ minRank: Number(extraDie[1]), formula: `${Number(dice[1]) + 1}d${dice[2]}${dice[3]}` }];
    }
    const space = SPACE.exec(html);
    if (space) { notes.push("The caster must have enough space to expand into, or the spell is lost (the GM)."); claimed.push(space[0].trim()); removals.push(space[0]); }
    for (const piece of removals) html = html.replace(piece, "");
    html = html.replace(/<p>\s*<\/p>/g, "").replace(/<li>\s*<\/li>/g, "").replace(/<ul>\s*<\/ul>/g, "");
    return { remainingHTML: html, stripDamage, formRiders: { effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name }, auras, recovery, actions, parts, notes,
        ...(tempExpires ? { tempExpires: true } : {}) }, claimed };
}

// "You're also immune to being Immobilized": PF2e's form for that option has the immunity.
function immuneProved(rules, option, type) {
    return rules.some(rule => rule.key === "BattleForm" && (!option || JSON.stringify(rule.predicate ?? []).includes(`:${option}"`))
        && (rule.overrides?.immunities ?? []).some(entry => entry.type === type));
}

// A basic-save blast that leaves its caster in a new state (Arcane Explosion): "You become unfiltered magic; you gain the incorporeal trait, are immune to
// disease, poison, and precision damage, and gain resistance to all damage equal to your level (except force damage, spirit damage, and damage from
// Strikes with the Ghost Touch property rune), with double the resistance against non-magical damage." (PF2e's Effect, each part proved) / "While
// incorporeal, you can't Strike, Cast a Spell, or take any actions with the manipulate trait." (a note) / "Any creature that ends its turn adjacent to
// you while you're in this state takes 6d6 force damage." (a 5-foot aura following the caster) / "You remain as pure magic until you Dismiss your new
// form, returning to your normal state at maximum Hit Points." (the Effect lasts until removed; its end restores the caster's Hit Points). The blast
// itself is the save's, from the rest of the text.
const UNFILTERED = /You become unfiltered magic; you gain the ([a-z]+) trait, are immune to ([a-z]+), ([a-z]+), and ([a-z]+) damage, and gain resistance to all damage equal to your level \(except ([a-z]+) damage, ([a-z]+) damage, and damage from Strikes with the @UUID\[[^\]]+\]\{Ghost Touch\} property rune\), with double the resistance against non-magical damage\.\s*/;
const NO_ACTIONS = /While incorporeal, you can't Strike, Cast a Spell, or take any actions with the manipulate trait\.\s*/;
const ADJACENT = /Any creature that ends its turn adjacent to you while you're in this state takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage\.\s*/;
const UNTIL_DISMISS = /You remain as pure magic until you Dismiss your new form, returning to your normal state at maximum Hit Points\.\s*/;

/** {remainingHTML, casterForm, claimed} or null. */
export function extractCasterForm(adapted, catalog) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "emanation") return null;
    let html = String(adapted.descriptionHTML ?? "");
    const link = LINK.exec(html);
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = link ? entries.find(entry => entry?.name === link[2]) : null;
    const found = [UNFILTERED, NO_ACTIONS, ADJACENT, UNTIL_DISMISS].map(pattern => pattern.exec(html));
    if (!effect?.id || !found.every(Boolean)) return null;
    const rules = effect.mechanics?.rules ?? [];
    const [form, , adjacent] = found;
    const proved = rules.some(rule => rule.key === "ActorTraits" && (rule.add ?? []).includes(form[1]))
        && rules.some(rule => rule.key === "Immunity" && JSON.stringify([rule.type].flat().sort()) === JSON.stringify([form[2], form[3], form[4]].sort()))
        && rules.some(rule => rule.key === "Resistance" && rule.type === "all-damage" && rule.value === "@actor.level" && JSON.stringify((rule.doubleVs ?? []).sort()) === '["non-magical"]'
            && JSON.stringify([...(rule.exceptions ?? [])].sort()) === JSON.stringify([form[5], "ghost-touch", form[6]].sort()))
        && effect.mechanics?.duration?.unit === "unlimited";
    if (!proved) return null;
    for (const piece of [...found.map(match => match[0]), link[0]]) html = html.replace(piece, "");
    html = html.replace(/<p>\s*<\/p>/g, "");
    return { remainingHTML: html, casterForm: { effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name },
            auras: [{ key: "adjacent", label: "Unfiltered magic", radius: 5, formula: adjacent[1], type: adjacent[2], events: ["turn-end"], sourceText: adjacent[0].trim() }], endFullHp: true,
            notes: ["While incorporeal, the caster can't Strike, Cast a Spell, or take any actions with the manipulate trait.", "The caster remains as pure magic until it Dismisses the form (remove the Effect): it then returns at maximum Hit Points."] },
        claimed: [...found.map(match => match[0].trim()), link[0]] };
}
