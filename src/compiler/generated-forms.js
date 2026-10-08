// Forms PF2e has no Effect for (user decision 2026-10-01, "forms: generate Effect"): the module's own Effect on the caster, built from the text, with
// the riders of form-riders.js (auras following the caster, the form's card).
//   - A cloak with a saving aura (Blanket of Stars): "…, granting you a +2 status bonus to Stealth checks to Hide and Sneak." / "While outside under a
//     starry night sky, you're also Invisible as long as you remain still. When moving under a starry night sky, you're Concealed instead." / "Any
//     creature that ends its turn adjacent to you must attempt a Will save; this is a mental, visual effect." with the rows "Failure The creature is
//     Dazzled until the end of its next turn." / "Critical Failure The creature is Confused and dazzled until the end of its next turn." — the bonus,
//     a toggle for the sky (still: Invisible; moving: Concealed), and a 5-foot aura whose save each creature ending its turn there rolls.
//   - Two options picked from a list and swapped (Mantle of Heaven's Slopes): "Upon Casting this Spell, pick two different options below. As a single
//     action, which has the concentrate trait, you can lose one of the options you chose and select a different one …" — two option slots on the
//     Effect (as PF2e's own mantles: each slot a toggle with the options as its choices), every option's rules behind either slot.
import { CONDITION_LINK_UNVALUED as COND, plain, sentenceSplit as split } from "./text-patterns.js";

const ACTION = name => String.raw`@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{${name}\}`;
// A narration sentence: nothing a rule could hide in.
const narration = sentence => !/\d|@|\[\[|\b(?:damage|save|bonus|penalty|condition|immune|can't|must|each|whenever|until|attack|gain|resistance|weakness|speed)\b/i.test(sentence);
const seconds = duration => { const match = /^(\d+) (minute|round|hour)s?$/.exec(String(duration ?? "").trim()); return match ? Number(match[1]) * { round: 6, minute: 60, hour: 3600 }[match[2]] : null; };

const CLOAK = [new RegExp(String.raw`^It imparts the stillness of the cosmos to you, granting you a \+(\d) (status) bonus to Stealth checks to ${ACTION("Hide")} and ${ACTION("Sneak")}\.$`),
    new RegExp(String.raw`^While outside under a starry night sky, you're also ${COND} as long as you remain still\.$`),
    new RegExp(String.raw`^When moving under a starry night sky, you're ${COND} instead\.$`),
    /^Any creature that ends its turn adjacent to you must attempt an? (Fortitude|Reflex|Will) save; this is an? ([a-z]+), ([a-z]+) effect\.$/];
const ROW = { failure: new RegExp(String.raw`^The creature is ${COND} until the end of its next turn\.$`),
    criticalFailure: new RegExp(String.raw`^The creature is ${COND} and ([a-z]+) until the end of its next turn\.$`) };

/** {generatedForm, formRiders, claimed} or null. */
export function extractCloakAura(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const time = seconds(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    const [lead, rows] = html.split(/<hr\s*\/?>/i);
    if (!time || !rows || /<hr/i.test(rows) || /Heightened/.test(html)) return null;
    const sentences = split(plain(lead));
    const at = sentences.findIndex(sentence => /^It imparts/.test(sentence));
    const stated = CLOAK.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (at < 0 || !stated.every(Boolean)) return null;
    const used = new Set(stated.map(match => match[0]));
    const rest = sentences.filter(sentence => !used.has(sentence));
    if (!rest.every(narration)) return null;
    const [bonus, still, moving, aura] = stated;
    if (aura[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rowText = Object.fromEntries([...rows.matchAll(/<p>\s*<strong>(Critical Success|Success|Failure|Critical Failure)<\/strong>([\s\S]*?)<\/p>/g)].map(match => [match[1], plain(match[2])]));
    const failure = ROW.failure.exec(rowText.Failure ?? ""), critical = ROW.criticalFailure.exec(rowText["Critical Failure"] ?? "");
    if (rowText.Success !== "The creature is unaffected." || !failure || !critical || critical[3] !== failure[2].toLowerCase() || ("Critical Success" in rowText && rowText["Critical Success"] !== "The creature is unaffected.")) return null;
    const cond = (uuid, name) => ({ uuid, slug: name.toLowerCase() });
    const option = String(adapted.source?.slug ?? adapted.source?.name ?? "form").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const sky = `${option}:night-sky`;
    const rules = [
        { key: "FlatModifier", selector: "stealth", type: bonus[2], value: Number(bonus[1]), predicate: [{ or: ["action:hide", "action:sneak"] }] },
        // ("under a starry night sky": the caster's toggle — still or moving.)
        { key: "RollOption", domain: "all", option: sky, toggleable: true, label: "Under a starry night sky", suboptions: [{ label: "Still", value: "still" }, { label: "Moving", value: "moving" }] }];
    return {
        // (The toggle's conditions: the module adds and removes them as it changes — PF2e's GrantItem doesn't follow a toggle.)
        generatedForm: { seconds: time, rules, toggleGrants: [{ option: sky, selection: "still", uuid: still[1], name: still[2] }, { option: sky, selection: "moving", uuid: moving[1], name: moving[2] }], description: [bonus[0], still[0], moving[0]].map(text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")).join(" ") },
        formRiders: { auras: [{ key: "gaze", label: "Gazing into the stars", radius: 5, events: ["turn-end"], sourceText: aura[0],
                save: { statistic: adapted.defense.statistic, traits: [aura[2], aura[3]], rows: {
                    failure: { conditions: [cond(failure[1], failure[2])], rounds: 1, expiry: "turn-end" },
                    criticalFailure: { conditions: [cond(critical[1], critical[2]), cond(failure[1], failure[2])], rounds: 1, expiry: "turn-end" } } } }],
            recovery: [], actions: [], parts: [],
            notes: [`Under a starry night sky, switch the form's toggle: still (Invisible) or moving (Concealed); off otherwise. The gaze's save is a ${aura[2]}, ${aura[3]} effect (creatures immune to those are unaffected).`] },
        claimed: [...used, ...Object.values(rowText)]
    };
}

// The option pair's list: each option's sentences, read into rules (or notes for what no rule states).
const PAIR_LEAD = [/^Upon Casting this Spell, pick (two) different options below\.$/,
    /^As a single action, which has the ([a-z]+) trait, you can lose one of the options you chose and select a different one \(you don't benefit from having the same option selected twice at the same time\)\.$/];
const OPTION_RULES = [
    { pattern: /^You gain cover from the [a-z ]+\.$/, rules: () => [{ key: "FlatModifier", selector: "ac", type: "circumstance", value: 2, label: "Cover" },
        { key: "FlatModifier", selector: "reflex", type: "circumstance", value: 2, label: "Cover", predicate: ["area-effect"] },
        { key: "FlatModifier", selector: "stealth", type: "circumstance", value: 2, label: "Cover", predicate: [{ or: ["action:hide", "action:sneak", "avoid-detection"] }] }] },
    { pattern: /^You gain an? ([a-z]+) unarmed attack, which has the ([a-z]+) and ([a-z]+) traits, in the ([a-z]+) group\. Your \1 attack deals (\d+)d(\d+) ([a-z]+) damage as its base damage, plus an additional (\d+)d(\d+) ([a-z]+) damage, and counts as ([a-z]+)\.$/,
        rules: (m, label) => [{ key: "Strike", category: "unarmed", slug: m[1], label: `${label}: ${m[1]}`, group: m[4], traits: ["unarmed", m[2], m[3]], damage: { base: { damageType: m[7], dice: Number(m[5]), die: `d${m[6]}` } } },
            { key: "DamageDice", selector: `${m[1]}-damage`, diceNumber: Number(m[8]), dieSize: `d${m[9]}`, damageType: m[10] }],
        note: m => `The ${m[1]} attack counts as ${m[11]} (the GM).` },
    { pattern: new RegExp(String.raw`^You gain a \+(\d) (status) bonus on checks to Recall Knowledge and ${ACTION("Sense Motive")}, and when you succeed at a check to Recall Knowledge about a creature you can see, you can attempt to Sense its Motive as a free action\.$`),
        rules: m => [{ key: "FlatModifier", selector: "skill-check", type: m[2], value: Number(m[1]), predicate: ["action:recall-knowledge"] },
            { key: "FlatModifier", selector: "perception", type: m[2], value: Number(m[1]), predicate: ["action:sense-motive"] }],
        note: () => "After a successful Recall Knowledge about a creature it can see, the caster can Sense its Motive as a free action." },
    { pattern: /^You gain fast healing (\d+)\.$/, rules: m => [{ key: "FastHealing", value: Number(m[1]) }] },
    { pattern: /^You can be heard clearly up to (\d+) feet away when you speak, if you choose to project your voice\.$/, rules: () => [], note: m => `The caster's voice can be heard clearly up to ${m[1]} feet away.` },
    { pattern: new RegExp(String.raw`^As a free action triggered by succeeding at a Strike, you can attempt to ${ACTION("Shove")} the creature you hit$`), rules: () => [],
        note: () => "After a successful Strike, the caster can attempt to Shove the creature it hit as a free action." }];

/** {generatedForm, formRiders, claimed} or null. */
export function extractOptionPairForm(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const time = seconds(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    const list = /<ul>([\s\S]*?)<\/ul>/.exec(html);
    if (!time || !list || /<hr|@UUID\[Compendium\.pf2e\.spell-effects/i.test(html) || html.slice(list.index + list[0].length).trim()) return null;
    const lead = split(plain(html.slice(0, list.index)));
    const pick = lead.findIndex(sentence => PAIR_LEAD[0].test(sentence));
    if (pick < 0 || lead.length !== pick + 2 || !PAIR_LEAD[1].test(lead[pick + 1]) || !lead.slice(0, pick).every(narration)) return null;
    const option = String(adapted.source?.slug ?? adapted.source?.name ?? "form").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const slots = [`${option}-first`, `${option}-second`];
    const options = [], rules = [], notes = [], claimed = [...lead];
    for (const item of list[1].matchAll(/<li>\s*<strong>([^<]+)<\/strong>([\s\S]*?)<\/li>/g)) {
        const label = item[1].trim(), value = label.toLowerCase().replace(/['’]/g, "").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
        const sentences = split(plain(item[2]).replace(/([^.])$/, "$1"));
        // (The option's flavour first, then the sentence or two that do something.)
        const read = [1, 2].map(count => ({ count, reader: OPTION_RULES.map(entry => ({ entry, match: entry.pattern.exec(sentences.slice(-count).join(" ")) })).find(found => found.match) }))
            .find(found => found.reader && found.count <= sentences.length);
        const reader = read?.reader, flavour = read ? sentences.slice(0, -read.count) : [];
        if (!reader || !flavour.every(narration)) return null;
        const predicate = [{ or: slots.map(slot => `${slot}:${value}`) }];
        rules.push(...reader.entry.rules(reader.match, label).map(rule => ({ ...rule, predicate: [...(rule.predicate ?? []), ...predicate] })));
        if (reader.entry.note) notes.push(`${label}: ${reader.entry.note(reader.match)}`);
        options.push({ label, value });
        claimed.push(...sentences);
    }
    if (options.length < 3) return null;
    const pickRules = slots.map((slot, index) => ({ key: "RollOption", domain: "all", option: slot, toggleable: true, alwaysActive: true, label: index === 0 ? "First option" : "Second option",
        suboptions: options.map(entry => ({ label: entry.label, value: entry.value, ...(index === 1 ? { predicate: [{ not: `${slots[0]}:${entry.value}` }] } : {}) })) }));
    return {
        generatedForm: { seconds: time, rules: [...pickRules, ...rules], description: `Pick two different options on this Effect (First option, Second option). As a single action (${PAIR_LEAD[1].exec(lead[pick + 1])[1]}), change one of them.` },
        formRiders: { auras: [], recovery: [], actions: [], parts: [], notes },
        claimed
    };
}

// A battle form chosen from a list of deities (Avatar): "You transform into an avatar of your deity, assuming a Huge battle form. You have hands in this battle
// form and can take manipulate actions." with the shared list ("AC = 25 + your level. …" / "30 temporary Hit Points." / "Darkvision." / the attacks' "Your
// attack modifier is +33 …" / "Athletics modifier of +35, unless your own is higher.") and each deity's lines ("Speed 70 feet, fly; shield (15 Hardness, can't
// be damaged);" / "Melee [a] mace (reach 15 feet), Damage 6d10+6 bludgeoning;" / "Ranged [a] hell fire (range 120 feet), Damage 6d6+3 fire.") — PF2e's
// choice of the deity on the module's Effect, and a BattleForm rule for each deity behind it; what no rule states (ignoring difficult terrain, the shield,
// a reload, silver, "damages only undead") the GM's notes.
const AVATAR_LEAD = [/^You transform into an avatar of your deity, assuming an? (Large|Huge|Gargantuan) battle form\.$/, /^You have hands in this battle form and can take manipulate actions\.$/,
    /^You can (?:@UUID\[[^\]]+\]\{Dismiss\}|Dismiss) this spell\.$/, /^You gain the following statistics and abilities regardless of which deity's battle form you assume:$/];
const AVATAR_LIST = { ac: /^AC = (\d+) \+ your level\. Ignore your armor's check penalty and Speed reduction\.$/, tempHP: /^(\d+) temporary Hit Points\.$/, darkvision: /^Darkvision\.$/,
    attacks: /^One or more attacks specific to your deity's battle form, which are the only attacks you can (?:@UUID\[[^\]]+\]\{Strike\}|Strike) with\. You're trained with them\. Your attack modifier is \+(\d+), and you use the listed damage\. Melee attacks are Strength based \(for the purposes of the @UUID\[[^\]]+\]\{Enfeebled\} condition, for example\) unless they have the finesse trait, and all ranged attacks are Dexterity based\.$/,
    athletics: /^Athletics modifier of \+(\d+), unless your own is higher\.$/ };
const SIZES = { Large: "lg", Huge: "huge", Gargantuan: "grg" };
const AVATAR_STRIKE = /^(Melee|Ranged) a ([a-z][A-Za-z' -]*?),? \(([^)]*)\), Damage (\d+)d(\d+)(?:\+(\d+))? ([a-z]+)[.;]?$/;
const MOVE_TOKEN = [[/^Speed (\d+) feet$/, (m, s) => { s.land = Number(m[1]); }], [/^no land Speed$/, (m, s, notes) => { s.land = 0; notes.push("no land Speed"); }],
    [/^(burrow|climb|swim|fly) Speed (\d+) feet$/, (m, s) => { s[m[1]] = Number(m[2]); }], [/^fly$/, (m, s) => { s.fly = "land"; }],
    [/^immune to @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+)\}$/, (m, s, notes, immune) => { immune.push(m[1].toLowerCase()); }],
    [/^ignore difficult terrain and greater difficult terrain$/, (m, s, notes) => { notes.push("ignores difficult terrain and greater difficult terrain"); }]];

/** {generatedForm, formRiders, claimed} or null. */
export function extractDeityForms(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    if (!(adapted.activation?.traits ?? []).includes("polymorph")) return null;
    const time = seconds(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    const [shared, specific] = html.split(/<hr\s*\/?>/i);
    if (!time || !specific || /<hr|Heightened|@UUID\[Compendium\.pf2e\.spell-effects/i.test(specific)) return null;
    const firstList = /<ul>([\s\S]*?)<\/ul>/.exec(shared);
    if (!firstList || shared.slice(firstList.index + firstList[0].length).trim()) return null;
    const lead = split(plain(shared.slice(0, firstList.index)));
    if (lead.length !== AVATAR_LEAD.length || AVATAR_LEAD.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const items = [...firstList[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => plain(match[1]));
    const found = Object.fromEntries(Object.entries(AVATAR_LIST).map(([key, pattern]) => [key, items.map(item => pattern.exec(item)).find(Boolean)]));
    if (items.length !== Object.keys(AVATAR_LIST).length || Object.values(found).some(match => !match)) return null;
    const intro = /^<p>You also gain the specific abilities listed for your deity below:<\/p>\s*<ul>/.exec(specific.trim());
    if (!intro) return null;
    const blocks = [...specific.matchAll(/<li><strong>([^<]+)<\/strong>\s*<ul>([\s\S]*?)<\/ul>\s*<\/li>/g)];
    if (blocks.length < 2) return null;
    const option = String(adapted.source?.slug ?? adapted.source?.name ?? "form").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const attack = Number(found.attacks[1]);
    const choices = [], rules = [], notes = [];
    for (const [, name, body] of blocks) {
        const deity = name.trim(), value = deity.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
        const lines = [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => plain(match[1]));
        // The movement line: its tokens before the first ";", then any extra ("shield (15 Hardness, can't be damaged)").
        const [movement, ...extras] = lines[0].replace(/;\s*$/, "").split(/;\s*/);
        const speeds = {}, deityNotes = [], immune = [];
        for (const token of movement.split(/,\s*/)) {
            const reader = MOVE_TOKEN.map(([pattern, apply]) => ({ match: pattern.exec(token.trim()), apply })).find(entry => entry.match);
            if (!reader) return null;
            reader.apply(reader.match, speeds, deityNotes, immune);
        }
        for (const extra of extras) {
            const shield = /^shield \((\d+) Hardness, can't be damaged\)$/.exec(extra.trim());
            if (!shield) return null;
            deityNotes.push(`a shield (Hardness ${shield[1]}, can't be damaged)`);
        }
        if (speeds.land == null) return null;
        if (speeds.fly === "land") speeds.fly = speeds.land;
        const strikes = {};
        for (const line of lines.slice(1)) {
            const strike = AVATAR_STRIKE.exec(line);
            if (!strike) return null;
            const ranged = strike[1] === "Ranged", traits = ["unarmed"], extra = [];
            let range = null;
            // (A versatile list — "versatile P or S", "versatile cold, electricity, or fire" — is one trait phrase; the rest split on commas and semicolons.)
            const KINDS = String.raw`(?:[BPS]|acid|cold|electricity|fire|sonic|poison|force|spirit|vitality|void|mental)`;
            const phrases = [];
            const rest = strike[3].replace(new RegExp(String.raw`versatile ${KINDS}(?:(?:,? or |, )${KINDS})*`, "g"), match => { phrases.push(match); return ""; });
            for (const trait of [...phrases, ...rest.split(/[,;]\s*/)].map(part => part.trim()).filter(Boolean)) {
                let m;
                if ((m = /^reach (\d+) feet$/.exec(trait))) traits.push(`reach-${m[1]}`);
                else if ((m = /^range (increment )?(\d+) feet$/.exec(trait))) range = m[1] ? { increment: Number(m[2]) } : { max: Number(m[2]) };
                else if ((m = /^thrown (\d+) feet$/.exec(trait))) traits.push(`thrown-${m[1]}`);
                else if ((m = /^deadly (\d*)d(\d+)$/.exec(trait))) traits.push(`deadly-${m[1] && m[1] !== "1" ? m[1] : ""}d${m[2]}`);
                else if ((m = /^versatile ([A-Za-z, ]+?)$/.exec(trait))) {
                    const kinds = m[1].split(/,\s*|,?\s*or\s+/).map(kind => kind.trim().toLowerCase()).filter(Boolean);
                    if (!kinds.every(kind => /^(?:b|p|s|[a-z]{4,})$/.test(kind))) return null;
                    traits.push(...kinds.map(kind => `versatile-${kind}`));
                } else if (/^(?:agile|backswing|finesse|disarm|nonlethal|forceful|shove|trip|mental)$/.test(trait)) traits.push(trait);
                else if ((m = /^reload (\d+)$/.exec(trait))) extra.push(`reload ${m[1]}`);
                else if (/^silver$/.test(trait)) extra.push("counts as silver");
                else if (/^damages only undead$/.test(trait)) extra.push("damages only undead");
                else return null;
            }
            if (ranged && !range) return null;
            const slug = strike[2].trim().toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
            strikes[slug] = { label: strike[2].trim().replace(/^./, letter => letter.toUpperCase()), category: "unarmed", ability: ranged ? "dex" : "str", modifier: attack, traits,
                damage: { dice: Number(strike[4]), die: `d${strike[5]}`, modifier: Number(strike[6] ?? 0), damageType: strike[7] }, ...(range ? { range } : {}) };
            if (extra.length) deityNotes.push(`${strikes[slug].label}: ${extra.join(", ")}`);
        }
        if (!Object.keys(strikes).length) return null;
        choices.push({ label: deity, value });
        rules.push({ key: "BattleForm", predicate: [`${option}:${value}`], hasHands: true, overrides: { size: SIZES[AVATAR_LEAD[0].exec(lead[0])[1]], armorClass: { modifier: `${found.ac[1]} + @actor.level`, ignoreCheckPenalty: true, ignoreSpeedPenalty: true },
            tempHP: Number(found.tempHP[1]), senses: { darkvision: {} }, skills: { athletics: { modifier: Number(found.athletics[1]) } }, speeds: speeds, strikes, ...(immune.length ? { immunities: immune.map(type => ({ type })) } : {}) } });
        if (deityNotes.length) notes.push(`${deity}: ${deityNotes.join("; ")}.`);
    }
    return {
        generatedForm: { seconds: time, rules: [{ key: "ChoiceSet", flag: option.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), rollOption: option, prompt: "Choose your deity", choices }, ...rules],
            description: `${lead[0]} ${lead[1]} The deity's statistics and attacks are the battle form's (pick the deity when the Effect is created). Remove this Effect to Dismiss the spell.` },
        formRiders: { auras: [], recovery: [], actions: [], parts: [], notes },
        claimed: [...lead, ...items, ...blocks.map(block => plain(block[0]))]
    };
}

// Any of the caster's own forms (Metamorphosis): "You transform yourself into any form you could choose with a polymorph spell in your spell repertoire
// or that you could prepare of 8th-rank or lower (including any 8th-rank or lower heightened versions of spells you know). You gain 40 temporary Hit
// Points rather than the amount normally granted by the form. You can Sustain the spell to enter a new form you haven't used during this metamorphosis.
// This replenishes your temporary Hit Points from this spell." — the module's Effect for the duration, and the form's card: the caster's polymorph spell
// (one it has, at a rank up to the limit) cast by its own route, the stated temporary Hit Points instead of the form's, each form once per casting.
const CHOOSER = [/^You transform yourself into any form you could choose with a polymorph spell in your spell repertoire or that you could prepare of (\d+)(?:st|nd|rd|th)-rank or lower \(including any \1(?:st|nd|rd|th)-rank or lower heightened versions of spells you know\)\.$/,
    /^You gain (\d+) temporary Hit Points rather than the amount normally granted by the form\.$/,
    /^You can Sustain the spell to enter a new form you haven't used during this [a-z]+ ?\.$/,
    /^This replenishes your temporary Hit Points from this spell\.$/];

/** {generatedForm, formRiders, claimed} or null. */
export function extractFormChooser(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    if (!(adapted.activation?.traits ?? []).includes("polymorph")) return null;
    const time = seconds(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    if (!time || /<hr|<ul|@UUID|<strong>\s*Heightened/i.test(html)) return null;
    const sentences = split(plain(html));
    const found = CHOOSER.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean)) return null;
    const used = new Set(found.map(match => match[0]));
    if (!sentences.filter(sentence => !used.has(sentence)).every(narration)) return null;
    const maxRank = Number(found[0][1]), tempHP = Number(found[1][1]);
    return {
        generatedForm: { seconds: time, rules: [], description: `The caster takes forms from its own polymorph spells (rank ${maxRank} or lower), with ${tempHP} temporary Hit Points each time; each form once per casting.` },
        formRiders: { auras: [], recovery: [], actions: [], notes: [], parts: [{ key: "form", title: "Take a form", kind: "cast-form", maxRank, tempHP,
            repeat: { trigger: "the caster Casts the Spell, then on a Sustain (a form it hasn't used this casting)" },
            reminder: `Choose one of the caster's polymorph spells (rank ${maxRank} or lower); its form replaces the previous one, with ${tempHP} temporary Hit Points.` }] },
        claimed: sentences
    };
}
