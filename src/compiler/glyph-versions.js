// A third-party spell whose versions are listed by action count (Magic+'s "Dynamic" spells, 2026-10-06): one description for all three, each version
// a paragraph opening with PF2e's action glyph ("<p><span class="action-glyph">2</span> The spell's range is 30 feet. The target takes 2d4 cold damage
// …</p>"), and PF2e variants (overlays) with each version's action count, range, area and damage. A variant with a fixed count reads its own version:
//   - the description is the lead paragraphs and that version's paragraph (its glyph dropped); "As the two-action version of the spell, except the
//     range is 60 feet. Additionally, …" is the two-action version's text, then the rest ("Additionally" dropped), the range the variant's own data;
//     "The spell's range is 30 feet." is dropped when it is the variant's range;
//   - the Heightened entry keeps what it says of that version: "The damage increases by 1d6 for the one-action version or by 2d6 for the two-action
//     and three-action versions." is "The damage increases by 2d6." for the two-action version; "The damage of the 2-action and 3-action versions of the
//     spell increases by 1d4." is "The damage increases by 1d4." for those and nothing for the one-action version; a sentence naming no version is kept;
//   - the variant's heightened damage step is the text's (Dynamic Breathe Fire's two-action data steps 1d6; the text says 2d6).
// Returns the rewritten item, or null when the item isn't of this shape (or a version can't be read).

const WORDS = { one: 1, two: 2, three: 3, 1: 1, 2: 2, 3: 3 };
const GLYPH = /<p>\s*<span class="action-glyph">([1-3])<\/span>\s*([\s\S]*?)<\/p>/g;
const VERSIONS = String.raw`(?:(?:one|two|three|[123])(?:-action|-)?(?:,|,? and|,? or| and)? )*(?:one|two|three|[123])-action`;
const counts = phrase => [...String(phrase).matchAll(/\b(one|two|three|[123])\b/g)].map(match => WORDS[match[1]]);
const split = text => String(text).replace(/\s+/g, " ").replace(/([a-z])\.(?=[A-Z][a-z]+ )/g, "$1. ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
const rangeOf = item => String(item?.system?.range?.value ?? "").trim().toLowerCase();

function versionText(texts, count, item, depth = 0) {
    const own = texts.get(count);
    if (own == null || depth > 2) return null;
    const as = new RegExp(String.raw`^As the (one|two|three|[123])-action version(?: of the spell)?, except (?:that )?([^.]+)\.\s*([\s\S]*)$`).exec(own);
    let sentences;
    if (as) {
        const base = versionText(texts, WORDS[as[1]], item, depth + 1);
        if (base == null) return null;
        // (Only a range the variant's own data gives: "except the range is 60 feet".)
        const range = /^the (?:spell's |spell’s )?range is (\d+ feet)$/.exec(as[2].trim());
        const area = /^the (?:spell's |spell’s )?area is an? (@Template\[[^\]]+\])$/.exec(as[2].trim());
        if (!(range && range[1] === rangeOf(item)) && !(area && sameArea(templateArea(area[1]), item))) return null;
        // (The area the base version names is the variant's own: its template sentence's area replaced.)
        // (The base version's own range sentence gives way to the exception's.)
        sentences = [...split(base).filter(sentence => !/^The spell(?:'|’)s range is \d+ feet\.$/.test(sentence)).map(sentence => area ? sentence.replace(TEMPLATE, area[1]) : sentence), ...split(as[3]).map(sentence => sentence.replace(/^Additionally, (\w)/, (_m, letter) => letter.toUpperCase()))];
    } else sentences = split(own);
    // "The spell's range is 30 feet.": the variant's range.
    return sentences.filter(sentence => { const range = /^The spell(?:'|’)s range is (\d+ feet)\.$/.exec(sentence); return !range || range[1] !== rangeOf(item); }).join(" ");
}

/** What a Heightened entry says of one version: its sentences, the version phrase dropped; null when it can't be read. */
export function heightenedForVersion(text, count) {
    const kept = [];
    for (const sentence of split(text)) {
        // "The damage increases by 1d6 for the one-action version or by 2d6 for the two-action and three-action versions."
        const either = new RegExp(String.raw`^(The [a-z ]+?) increases by (\S+?) for the (${VERSIONS}) versions? or (?:by )?(\S+?) for the (${VERSIONS}) versions?\.$`).exec(sentence);
        if (either) {
            const amount = counts(either[3]).includes(count) ? either[2] : counts(either[5]).includes(count) ? either[4] : null;
            if (amount) kept.push(`${either[1]} increases by ${amount}.`);
            continue;
        }
        // "The shield's Hardness increases by 3 for the 1-action version, 7 for the 2-action version, or 9 for the 3-action version." (Dynamic Shield: one amount a version)
        const three = new RegExp(String.raw`^(The [A-Za-z’' ]+?) increases by (\S+?) for the (${VERSIONS}) version, (\S+?) for the (${VERSIONS}) version, or (\S+?) for the (${VERSIONS}) version\.$`).exec(sentence);
        if (three) {
            const amount = [[three[3], three[2]], [three[5], three[4]], [three[7], three[6]]].find(([versions]) => counts(versions).includes(count))?.[1];
            if (amount) kept.push(`${three[1]} increases by ${amount}.`);
            continue;
        }
        // "For the two-action and three-action versions of the spell, the damage increases by 1d6."
        const lead = new RegExp(String.raw`^For the (${VERSIONS}) versions?(?: of the spell)?, (\w)([\s\S]*)$`).exec(sentence);
        if (lead) { if (counts(lead[1]).includes(count)) kept.push(`${lead[2].toUpperCase()}${lead[3]}`); continue; }
        // "The damage of the spell's two-action and three-action versions increases by 1d4 and …" / "… from the 1-action version of the spell increases by 1."
        const inner = new RegExp(String.raw`^(The [a-z ]+?) (?:of|from|for) the (?:spell(?:'|’)s )?(${VERSIONS})(?: versions?)?(?: of the spell)? ([\s\S]+)$`).exec(sentence);
        if (inner) { if (counts(inner[2]).includes(count)) kept.push(`${inner[1]} ${inner[3]}`); continue; }
        // "Creatures that fail their save against the three-action version take 1 additional persistent fire damage."
        const against = new RegExp(String.raw`^([\s\S]+?) against the (${VERSIONS}) versions? ([\s\S]+)$`).exec(sentence);
        if (against) { if (counts(against[2]).includes(count)) kept.push(`${against[1]} ${against[3]}`); continue; }
        // (A sentence naming a version in another way isn't read.)
        if (/\b(?:one|two|three|[123])-action\b|\bversions?\b/.test(sentence)) return null;
        kept.push(sentence);
    }
    return kept.join(" ");
}

// The lead's damage sentence with no dice and the version's dice and area (its area the variant's own): one damage sentence.
//   "You deal fire damage to creatures in the area with a basic Reflex save." + "You deal 2d6 fire damage in a @Template[distance:15|type:line]."
//   "A bolt of lightning strikes outward from your hand, dealing electricity damage with a basic Reflex save." + "Your lightning bolt is a 60-foot line
//     that deals 4d12 electricity damage."
//   "… dealing an amount of fire damage with a range and area based upon the number of actions you spend." + "The spell deals 6d6 damage in a 15-foot
//     burst at a range of 120 feet." (the save the item's)
const TEMPLATE = /@Template\[(?:type:)?([a-z]+)\|distance:(\d+)\]|@Template\[distance:(\d+)\|type:([a-z]+)\]/;
const templateArea = text => { const match = TEMPLATE.exec(text); return match ? { type: match[1] ?? match[4], value: Number(match[2] ?? match[3]) } : null; };
const sameArea = (area, item) => !!area && item?.system?.area?.type === area.type && Number(item.system.area.value) === area.value;
function mergeDamage(leadText, versionText, item) {
    const lead = split(leadText), version = split(versionText);
    const saveOf = item?.system?.defense?.save;
    if (!saveOf?.basic || !saveOf.statistic) return null;
    const statistic = saveOf.statistic[0].toUpperCase() + saveOf.statistic.slice(1);
    const at = lead.findIndex(sentence => /\b([a-z]+) damage(?: to [a-z ]+)? (?:with|on) a basic (?:Fortitude|Reflex|Will) save\.$/.test(sentence) && !/\d+d\d+/.test(sentence)
        || /dealing an amount of ([a-z]+) damage with a range and area based upon the number of actions you spend\.$/.test(sentence));
    if (at < 0) return null;
    const type = /\b([a-z]+) damage(?: to [a-z ]+)? (?:with|on) a basic|an amount of ([a-z]+) damage/.exec(lead[at]);
    const damageType = type[1] ?? type[2];
    const shapes = [
        [/^You deal (\d+d\d+) ([a-z]+) damage (?:in an? |to creatures in a single )(@Template\[[^\]]+\])(?: within (\d+) feet)?\.$/, match => ({ dice: match[1], type: match[2], area: templateArea(match[3]), within: match[4] ? `${match[4]} feet` : null })],
        [/^Your [a-z ]+ is an? (\d+)-foot (line|cone|burst|emanation) that deals (\d+d\d+) ([a-z]+) damage(?:\.| and (.+)\.)$/, match => ({ dice: match[3], type: match[4], area: { type: match[2], value: Number(match[1]) }, rest: match[5] })],
        [/^The spell deals (\d+d\d+) (?:([a-z]+) )?damage in an? (\d+)-foot (burst|cone|line|emanation) at a range of (\d+) feet\.$/, match => ({ dice: match[1], type: match[2] ?? damageType, area: { type: match[4], value: Number(match[3]) }, range: `${match[5]} feet` })]
    ];
    for (const [index, sentence] of version.entries()) {
        for (const [pattern, read] of shapes) {
            const match = pattern.exec(sentence);
            if (!match) continue;
            const found = read(match);
            if (found.type !== damageType || !sameArea(found.area, item) || (found.range && found.range !== rangeOf(item))) return null;
            const merged = [...lead.slice(0, at), `Creatures in the area take ${found.dice} ${damageType} damage with a basic ${statistic} save.`, ...lead.slice(at + 1)];
            const rest = [...(found.rest ? [`${found.rest[0].toUpperCase()}${found.rest.slice(1)}.`] : []), ...version.slice(0, index), ...version.slice(index + 1)];
            // ("… in a single 5-foot square within 15 feet": the variant's range, when its data has none.)
            if (found.within && rangeOf(item) && found.within !== rangeOf(item)) return null;
            return { lead: merged.join(" "), version: rest.join(" "), ...(found.within && !rangeOf(item) ? { range: found.within } : {}) };
        }
    }
    return null;
}

// A version that is a save with no damage (the one-action versions: "If the creature fails the save, they are Enfeebled 1 until the start of your next
// turn. The creature is then temporarily immune to the 1-action version of dynamic void warp for 1 minute."): its own degree table, as PF2e writes one —
// unaffected on a success, the stated condition on a failure (and a critical failure, unless it says otherwise) — and the immunity before it, kept to
// that version (the card's immunity key).
const CONDITION = String.raw`(@UUID\[Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+\]\{[A-Za-z-]+(?: \d)?\})`;
const SPAN = String.raw`(until the (?:start|beginning|end) of (?:your|its|their) next turn|for (?:\d+|one) (?:round|minute)s?)`;
const VERSION_IMMUNE = /^(?:It|The creature|They) (?:is|are) then temporarily immune to the (?:one|1)-action version of [a-z ]+ for (\d+|one) (minute|hour)s?\.$/i;
function conditionTable(sentences, item) {
    const statistic = item?.system?.defense?.save?.statistic;
    if (!statistic || Object.keys(item?.system?.damage ?? {}).length) return null;
    const Stat = statistic[0].toUpperCase() + statistic.slice(1);
    let failure = null, critical = null, immune = null;
    const kept = [];
    for (const sentence of sentences) {
        let match;
        if ((match = new RegExp(String.raw`^(?:If the (?:creature|target) fails the save, (?:they are|it is)|On a failure, the target is) ${CONDITION} ${SPAN}\.$`).exec(sentence)) && !failure) {
            failure = `The target is ${match[1]} ${match[2]}.`; continue;
        }
        // "On a failure, the target is Off-Guard against the next attack you attempt against it before the end of your current turn." (Dynamic Daze)
        if ((match = new RegExp(String.raw`^On a failure, the target is ${CONDITION} against the next attack you attempt against it before the end of your current turn\.$`).exec(sentence)) && !failure) {
            failure = `The target is ${match[1]} against the next attack you attempt against it before the end of your current turn.`; continue;
        }
        if ((match = new RegExp(String.raw`^Creatures within the area who fail an? ${Stat} save are ${CONDITION} ${SPAN} \(or ${SPAN} on a critical failure\)\.$`).exec(sentence)) && !failure) {
            failure = `The creature is ${match[1]} ${match[2]}.`; critical = `The creature is ${match[1]} ${match[3]}.`; continue;
        }
        if ((match = VERSION_IMMUNE.exec(sentence)) && !immune) { immune = `Regardless of the result, the target is temporarily immune for ${match[1] === "one" ? 1 : match[1]} ${match[2]}${(match[1] === "1" || match[1] === "one") ? "" : "s"}.`; continue; }
        // ("Target a creature within 20 feet." / "The area is a @Template[…] within 15 feet of you.": the variant's targeting.)
        if (/^Target a creature within (\d+) feet\.$/.test(sentence) && `${/(\d+)/.exec(sentence)[1]} feet` === rangeOf(item)) continue;
        if ((match = /^The area is an? (@Template\[[^\]]+\]) within (\d+) feet of you\.$/.exec(sentence)) && sameArea(templateArea(match[1]), item)) continue;
        kept.push(sentence);
    }
    if (!failure || !immune) return null;
    return `<p>${[...kept, `The target must attempt a ${Stat} save.`, immune].join(" ")}</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
        + `<p><strong>Failure</strong> ${failure}</p><p><strong>Critical Failure</strong> ${critical ?? failure}</p>`;
}

export function selectGlyphVersion(item) {
    const count = Number(/^\s*([1-3])\s*$/.exec(String(item?.system?.time?.value ?? ""))?.[1]);
    const html = String(item?.system?.description?.value ?? "");
    if (!count || !html.includes('class="action-glyph"')) return null;
    const found = [...html.matchAll(GLYPH)];
    if (found.length < 2 || new Set(found.map(match => match[1])).size !== found.length) return null;
    const texts = new Map(found.map(match => [Number(match[1]), match[2].trim()]));
    const version = versionText(texts, count, item);
    if (version == null) return null;
    const first = html.indexOf(found[0][0]), last = html.indexOf(found.at(-1)[0]) + found.at(-1)[0].length;
    const between = html.slice(first, last).replace(GLYPH, "");
    if (between.trim()) return null;
    let after = html.slice(last);
    let heightened = null;
    const entries = [...after.matchAll(/<p>\s*<strong>\s*Heightened \(([^)]+)\)\s*<\/strong>\s*([\s\S]*?)<\/p>/g)];
    for (const entry of entries) {
        const kept = heightenedForVersion(entry[2].replace(/<[^>]+>/g, ""), count);
        if (kept == null) return null;
        after = after.replace(entry[0], kept ? `<p><strong>Heightened (${entry[1]})</strong> ${kept}</p>` : "");
        if (kept && /^\+\d+$/.test(entry[1])) heightened = { interval: Number(entry[1].slice(1)), text: kept };
    }
    let leadHTML = html.slice(0, first), versionHTML = version;
    // (A rule after a section break would be read as outside the spell's text: only a lead with no break before the versions.)
    if (/<hr\s*\/?>/i.test(leadHTML)) return null;
    // "The hymn deals 1d8 sonic damage in a @Template[distance:15|type:line] with a basic Fortitude save.": the variant's own area.
    versionHTML = versionHTML.replace(/(deals \d+d\d+ [a-z]+ damage) in an? (@Template\[[^\]]+\]) (with a basic (?:Fortitude|Reflex|Will) save)/g,
        (whole, damage, template, save) => sameArea(templateArea(template), item) ? `${damage} to creatures in the area ${save}` : whole);
    const merged = mergeDamage(leadHTML.replace(/<[^>]+>/g, " "), versionHTML, item);
    if (merged) { leadHTML = `<p>${merged.lead}</p>`; versionHTML = merged.version; }
    const range = merged?.range ? { range: { ...(item.system.range ?? {}), value: merged.range } } : {};
    // (A version with no damage: its own degree table, not a basic save.)
    const table = !merged && !/\d+d\d+/.test(versionHTML) ? conditionTable(split(`${leadHTML.replace(/<[^>]+>/g, " ")} ${versionHTML}`), item) : null;
    if (table) {
        const after2 = after.replace(/^\s*<hr\s*\/?>/, "");
        return { ...item, system: { ...item.system, defense: { ...(item.system.defense ?? {}), save: { ...item.system.defense.save, basic: false } },
            description: { ...item.system.description, value: `${table}${after2.trim() ? `<hr />${after2}` : ""}` } },
            flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), glyphVersion: count, versionImmunity: true } } };
    }
    const system = { ...item.system, ...range, description: { ...item.system.description, value: `${leadHTML}${versionHTML ? `<p>${versionHTML}</p>` : ""}${after}`.replace(/<hr\s*\/?>\s*$/, "") } };
    // (The version's text names a basic save that the variant's data marks otherwise — Dynamic Caustic Blast's two-action "with a basic Reflex save": the text's.)
    const basicStated = new RegExp(String.raw`with a basic ${item.system?.defense?.save?.statistic ?? "none"} save`, "i").test(versionHTML ?? "");
    if (basicStated && item.system?.defense?.save?.basic === false) system.defense = { ...item.system.defense, save: { ...item.system.defense.save, basic: true } };
    // The variant's damage step is the text's: "The damage increases by 2d6." for its one damage entry.
    const step = heightened ? /^The (?:[a-z]+ )?damage increases by (\d+d\d+)\.$/.exec(heightened.text) : null;
    const damage = Object.keys(item.system?.damage ?? {});
    let textStep = null;
    if (step && damage.length === 1 && item.system?.heightening?.type === "interval") {
        system.heightening = { ...item.system.heightening, interval: heightened.interval, damage: { [damage[0]]: step[1] } };
        // (Where PF2e's variant steps otherwise, the card rolls the text's: the item's own data would heighten by its step.)
        if (String(item.system.heightening.damage?.[damage[0]] ?? "").replace(/\s+/g, "") !== step[1] || Number(item.system.heightening.interval) !== heightened.interval) {
            const entry = item.system.damage[damage[0]];
            const base = /^(\d+)d(\d+)$/.exec(String(entry.formula).replace(/\s+/g, "")), add = /^(\d+)d(\d+)$/.exec(step[1]);
            if (base && add && base[2] === add[2] && !entry.category)
                textStep = `(${base[1]}+floor((@item.rank - ${Number(item.system.level?.value) || 1})/${heightened.interval})*${add[1]})d${base[2]}[${entry.type}]`;
        }
    }
    return { ...item, system, flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), glyphVersion: count, ...(textStep ? { textStep } : {}) } } };
}

// A spell whose PF2e variants are the one- and two-handed grips (Wizards+'s Staff Striker: "If you hit, you deal 1d6 bludgeoning damage. … If you are
// wielding your staff in two hands, increase all the spell's damage dice to 1d8." / "Heightened (+1) The damage increases by 1d6 or by 1d8 if you are
// wielding your staff in two hands."): the variant cast is the grip, its damage entry's die the text's for it; the text read as that grip's.
const TWO_HANDS = /\s*If you are wielding your ([a-z]+) in two hands, increase all the spell's damage dice to 1d(\d+)\.\s*/;
const TWO_HANDS_STEP = /The damage increases by (\d+)d(\d+) or by (\d+)d(\d+) if you are wielding your ([a-z]+) in two hands\./;
export function fitGripVariant(item) {
    const html = String(item?.system?.description?.value ?? "");
    const grip = TWO_HANDS.exec(html), step = TWO_HANDS_STEP.exec(html);
    const entries = Object.values(item?.system?.damage ?? {});
    if (!grip || !step || entries.length !== 1 || grip[1] !== step[5]) return null;
    const die = /^1d(\d+)$/.exec(String(entries[0].formula).replace(/\s+/g, ""))?.[1];
    const twoHanded = die === grip[2];
    if (!twoHanded && die !== step[2]) return null;
    let value = html.replace(TWO_HANDS, " ").replace(step[0], twoHanded ? `The damage increases by ${step[3]}d${step[4]}.` : `The damage increases by ${step[1]}d${step[2]}.`);
    // ("you deal 1d6 bludgeoning damage": the grip's die.)
    if (twoHanded) value = value.replace(new RegExp(String.raw`you deal 1d${step[2]} ([a-z]+) damage`), `you deal 1d${grip[2]} $1 damage`);
    return { ...item, system: { ...item.system, description: { ...item.system.description, value } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), grip: twoHanded ? "two-hands" : "one-hand" } } };
}

// A spell attack typed by the target's own Strike (Magic+'s Shadow's Betrayal: "Choose a weapon the target is wielding or an unarmed attack it could use
// for a Strike and make a spell attack roll against the target's AC." / "If the target is in dim light or darkness, they are off-guard to this spell attack
// roll." / "If you hit, you deal 2d8 damage to the creature of the same damage type as the chosen weapon or unarmed attack." / "If the chosen weapon or
// unarmed attack you chose deals multiple types of damage, you choose which damage type when you make your spell attack roll."). The item has no attack
// trait though its text makes a spell attack roll (the text wins): read as PF2e's spell attack, its damage the item's entry retyped at the card by the
// target's Strike (the caster's pick among that Strike's types), the darkness a question at the card (off-guard: +2 to the attack).
const STRIKE_TYPED = [/^Choose a weapon the target is wielding or an unarmed attack it could use for a Strike and make a spell attack roll against the target's AC\.$/,
    /^If the target is in dim light or darkness, they are (?:@UUID\[[^\]]+\]\{)?off-guard\}? to this spell attack roll\.$/,
    /^If you hit, you deal (\d+)d(\d+) damage to the creature of the same damage type as the chosen weapon or unarmed attack\.$/,
    /^If the chosen weapon or unarmed attack you chose deals multiple types of damage, you choose which damage type when you make your spell attack roll\.$/];
export function fitTargetStrikeAttack(item) {
    const html = String(item?.system?.description?.value ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i);
    const sentences = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=\.)\s+(?=[A-Z])/);
    const narration = sentences.length === STRIKE_TYPED.length + 1 && !/\d|\b(?:damage|attack|off-guard)\b/i.test(sentences[0].replace(/^You inject a small amount of magic into a foe.s shadow, causing it to rise off the ground and attack its caster\.$/, "")) ? sentences.slice(1) : sentences;
    if (narration.length !== STRIKE_TYPED.length || !narration.every((sentence, index) => STRIKE_TYPED[index].test(sentence))) return null;
    const entries = Object.values(item.system?.damage ?? {});
    const dice = STRIKE_TYPED[2].exec(narration[2]);
    if (entries.length !== 1 || entries[0].category || String(entries[0].formula).replace(/\s+/g, "") !== `${dice[1]}d${dice[2]}` || item.system?.defense?.passive?.statistic !== "ac") return null;
    if (!/^1 creature wielding a weapon or unarmed attack$/i.test(String(item.system?.target?.value ?? "").trim())) return null;
    const value = `<p>Make a spell attack roll against the target's AC. On a hit, you deal ${dice[1]}d${dice[2]} ${entries[0].type} damage (double damage on a critical hit).</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`;
    return { ...item, system: { ...item.system, description: { ...item.system.description, value }, target: { ...item.system.target, value: "1 creature" },
            traits: { ...item.system.traits, value: [...new Set([...(item.system.traits?.value ?? []), "attack"])] } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), targetStrike: { sentences: narration, target: item.system.target.value } } } };
}

// A save the text calls for that the item's data lacks (Witches+'s Eternal Slumber: "The creature must attempt a Will save." with a degree table, the item's
// defense empty): the text's save, not basic (the rows say what each result does). Only a spell with no attack, its four degree headings, and one such sentence.
// (Or the end of a sentence: Planar Court's "…, choosing one of its ability attributes to be punished in recompense and the target must attempt a Will save.")
const TEXT_SAVE = /(?:^|\.\s+|\band\s+)(?:[Tt]he (?:creature|target)(?: creature)?) must attempt an? (Fortitude|Reflex|Will) save\./g;
export function fitTextSave(item) {
    if (item?.system?.defense?.save || item?.system?.defense?.passive || (item?.system?.traits?.value ?? []).includes("attack")) return null;
    const html = String(item?.system?.description?.value ?? "");
    const headings = [...html.matchAll(/<strong\b[^>]*>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/gi)].map(match => match[1].toLowerCase());
    if (headings.join() !== "critical success,success,failure,critical failure") return null;
    const lead = html.slice(0, html.search(/<strong\b[^>]*>\s*Critical Success\s*<\/strong>/i)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const saves = [...lead.matchAll(TEXT_SAVE)];
    if (saves.length !== 1) return null;
    return { ...item, system: { ...item.system, defense: { save: { statistic: saves[0][1].toLowerCase(), basic: false } } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), textSave: saves[0][0].replace(/^\.\s+/, "").trim() } } };
}

// A basic save whose action counts change only the area and its terrain (Oracles+'s Freezing Cold: "Area 2 or more contiguous squares, one of which must be adjacent
// to you" / "The frigid cold deals 1d6 cold damage, and the area becomes sheeted with a frigid flurry of difficult terrain." / "[1] The number of contiguous squares
// is 2, and the duration of the difficult terrain is 1 round." / "[2] (concentrate) … 4, … 2 rounds." / "[3] (concentrate) … 6, … 3 rounds."): the item has no
// versions; the save is the same for each, so the area's squares (placed by the caster) and the terrain's rounds by the actions spent are the card's reminders.
const ACTION_AREA = /^\s*<p>\s*<span class="action-glyph">([123])<\/span>\s*(?:<strong>\s*\(concentrate\)\s*<\/strong>\s*)?Y?The number of contiguous squares is (\d+), and the duration of the difficult terrain is (\d+) rounds?\.\s*<\/p>\s*$/i;
const COLD_LEAD = /^\s*<p>\s*You cast out sheets of ice that stretch from your fingers\. The frigid cold deals (\d+d\d+) ([a-z]+) damage, and the area becomes sheeted with a frigid flurry of difficult terrain\.\s*<\/p>\s*$/i;
export function fitActionAreas(item) {
    if (String(item?.system?.time?.value ?? "").trim() !== "1 to 3" || Object.keys(item?.system?.overlays ?? {}).length || item?.system?.defense?.save?.basic !== true) return null;
    const html = String(item.system.description?.value ?? "");
    const [area, body, ...rest] = html.split(/<hr\s*\/?>/i);
    const areaText = /^\s*<p>\s*<strong>\s*Area\s*<\/strong>\s*([^<]+)<\/p>\s*$/i.exec(area ?? "");
    const paragraphs = [...String(body ?? "").matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0]);
    const lead = COLD_LEAD.exec(paragraphs[0] ?? "");
    const versions = paragraphs.slice(1).map(paragraph => ACTION_AREA.exec(paragraph));
    const entries = Object.values(item.system.damage ?? {});
    if (!areaText || !lead || versions.length !== 3 || versions.some(match => !match) || versions.map(match => match[1]).join() !== "1,2,3" || rest.length > 1) return null;
    if (entries.length !== 1 || entries[0].category || String(entries[0].formula).replace(/\s+/g, "") !== lead[1] || String(entries[0].type).toLowerCase() !== lead[2]) return null;
    const statistic = item.system.defense.save.statistic[0].toUpperCase() + item.system.defense.save.statistic.slice(1);
    const reminders = [`Area: ${areaText[1].trim()} — ${versions.map(match => `${match[1]} action${match[1] === "1" ? "" : "s"}: ${match[2]} squares`).join(", ")}. Target the creatures in it.`,
        `The area is difficult terrain for ${versions.map(match => `${match[3]} round${match[3] === "1" ? "" : "s"} (${match[1]} action${match[1] === "1" ? "" : "s"})`).join(", ")} — the GM's.`];
    return { ...item, system: { ...item.system, duration: { value: "", sustained: false }, area: null,
            description: { ...item.system.description, value: `<p>Each creature in the area takes ${lead[1]} ${lead[2]} damage with a basic ${statistic} save.</p>${rest.length ? `<hr />${rest[0]}` : ""}` } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), actionAreas: { reminders, sourceText: [area, ...paragraphs].map(part => part.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) } } } };
}

// An area that must include the caster, who saves a degree better (Barbarians+'s Blood Surge): "You explode with energy that deals 1d4 force damage to creatures in the
// area and you must include yourself in the area, but you treat your degree of success on your save as one step better." / "You deal your additional damage from your
// blood rage as normal for casting a spell." / "If your melee Strikes are currently empowered by your blood rage, you can choose to change the damage type of this spell
// to be the same damage type as the additional damage on your Strikes." — the area's basic save with the caster added (one degree better: the caster-share rule); the
// blood rage's damage and type, the class's, reminders.
const SURGE = [/^You surge forth with a burst of energy, exuded from your own blood\.$/,
    /^You explode with energy that deals (\d+d\d+) ([a-z]+) damage to creatures in the area and you must include yourself in the area, but you treat your degree of success on your save as one step better\.$/,
    /^You deal your additional damage from your blood rage as normal for casting a spell\.$/,
    /^If your melee Strikes are currently empowered by your blood rage, you can choose to change the damage type of this spell to be the same damage type as the additional damage on your Strikes\.$/];
export function fitSelfInArea(item) {
    if (item?.system?.defense?.save?.basic !== true || !["emanation", "burst"].includes(item?.system?.area?.type)) return null;
    const html = String(item.system.description?.value ?? "").replace(/<section class="traits"[\s\S]*?<\/section>/i, "");
    const [body, heightened, ...rest] = html.split(/<hr\s*\/?>/i);
    const sentences = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=\.)\s+(?=[A-Z])/);
    if (rest.length || sentences.length !== SURGE.length || sentences.some((sentence, index) => !SURGE[index].test(sentence))) return null;
    const [, dice, type] = SURGE[1].exec(sentences[1]);
    const entries = Object.values(item.system.damage ?? {});
    if (entries.length !== 1 || entries[0].category || String(entries[0].formula).replace(/\s+/g, "") !== dice || String(entries[0].type).toLowerCase() !== type) return null;
    const statistic = item.system.defense.save.statistic[0].toUpperCase() + item.system.defense.save.statistic.slice(1);
    return { ...item, system: { ...item.system, description: { ...item.system.description, value: `<p>Each creature in the area takes ${dice} ${type} damage with a basic ${statistic} save.</p>${heightened ? `<hr />${heightened}` : ""}` } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), selfInArea: { sentence: sentences[1],
            reminders: [{ text: "Your blood rage's additional damage applies as normal for casting a spell (add it yourself).", sourceText: sentences[2] },
                { text: "If your melee Strikes are empowered by your blood rage, you can make this spell's damage that type instead (the card rolls force; apply the change yourself).", sourceText: sentences[3] }] } } } };
}

// A sustained hex attacking a save's DC (Witches+'s Tidal Grasp): "When you Cast this hex, you make a spell attack roll against the target's Fortitude DC. If successful,
// the target is Grabbed by your tidal rings until the end of your next turn or until it Escapes. On a critical success, the target also takes @Damage[(2* @item.rank)
// [bludgeoning]] damage equal to twice the rank of the spell. When you Sustain the spell, you make another spell attack roll. If you critically fail your spell attack
// roll against the target or the target critically succeeds an Escape against its grabbed condition, they become temporarily immune to this spell for 1 minute." with
// "Heightened (3rd) You may target Huge or smaller creatures …" / "Heightened (7th) … Gargantuan or smaller …" — the attack table (Grabbed with its Escape; the
// critical success's damage the text's, at the cast rank), the attack against the Fortitude DC (the card's adjustment), the attack again on each Sustain, the
// immunity on the attack's critical failure (an Escape's critical success the GM's), the size by rank the GM's question.
const TIDE = [/^Water rushes around the target's frame, encircling and restraining them with the force of the raging seas\.$/,
    /^When you Cast this hex, you make a spell attack roll against the target's (Fortitude|Reflex|Will) DC\.$/,
    /^If successful, the target is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Grabbed\}) by your [a-z ]+ until the end of your next turn or until it (?:@UUID\[[^\]]+\]\{Escapes\}|Escapes)\.$/,
    /^On a critical success, the target also takes @Damage\[\((\d+)\* ?@item\.rank\)\[([a-z]+)\]\] damage equal to twice the rank of the spell\.$/,
    /^When you Sustain the spell, you make another spell attack roll\.$/,
    /^If you critically fail your spell attack roll against the target or the target critically succeeds an Escape against its grabbed condition, they become temporarily immune to this spell for (\d+) (minute|hour)s?\.$/];
const TIDE_SIZES = /^\s*<p><strong>Heightened \((\d+)(?:st|nd|rd|th)\)<\/strong> You may target (Huge|Gargantuan) or smaller creatures with this spell\.<\/p>\s*<p><strong>Heightened \((\d+)(?:st|nd|rd|th)\)<\/strong> You may target (Huge|Gargantuan) or smaller creatures with this spell\.<\/p>\s*$/;
export function fitSaveDCAttack(item) {
    if (!(item?.system?.traits?.value ?? []).includes("attack") || item?.system?.defense?.save || Object.keys(item?.system?.damage ?? {}).length || !item?.system?.duration?.sustained) return null;
    const size = /^1 (Tiny|Small|Medium|Large|Huge) or smaller creature$/.exec(String(item.system.target?.value ?? "").trim());
    const [body, heightened, ...rest] = String(item.system.description?.value ?? "").split(/<hr\s*\/?>/i);
    const links = [];
    const sentences = body.replace(/@UUID\[[^\]]+\]\{[^}]+\}/g, link => `@@${links.push(link) - 1}@@`).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        .split(/(?<=\.)\s+(?=[A-Z@])/).map(sentence => sentence.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]));
    const sizes = TIDE_SIZES.exec(heightened ?? "");
    if (!size || rest.length || !sizes || sentences.length !== TIDE.length || sentences.some((sentence, index) => !TIDE[index].test(sentence))) return null;
    const [, statistic] = TIDE[1].exec(sentences[1]), [, grabbed] = TIDE[2].exec(sentences[2]), [, times, type] = TIDE[3].exec(sentences[3]), immune = TIDE[5].exec(sentences[5]);
    return { ...item, system: { ...item.system, target: { ...item.system.target, value: "1 creature" },
            // (A placeholder entry for the table's "full damage" on a critical success; the card rolls the text's formula at the cast rank.)
            damage: { tide: { formula: times, type, category: null, kinds: ["damage"], materials: [], applyMod: false } }, heightening: { type: "interval", interval: 1, damage: { tide: times } },
            description: { ...item.system.description, value: `<p>Make a spell attack roll against the target's AC.</p><p><strong>Critical Success</strong> The target takes full damage and is ${grabbed} until the end of your next turn or until it Escapes.</p><p><strong>Success</strong> The target is ${grabbed} until the end of your next turn or until it Escapes.</p>` } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), saveDCAttack: {
            statistic: statistic.toLowerCase(), formula: `(${times} * @item.rank)[${type}]`, sentences,
            immunity: { value: Number(immune[1]), unit: `${immune[2]}s` },
            sizeQuestion: `Is this creature ${size[1]} or smaller (${sizes[2]} or smaller from ${sizes[1]}th rank, ${sizes[4]} or smaller from ${sizes[3]}th)?`.replace(/(\d)th/g, (all, digit) => ({ 1: "1st", 2: "2nd", 3: "3rd" })[digit] ?? all),
            heightenedText: heightened.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() } } } };
}

// Magic+'s Dynamic Caustic Blast, by its PF2e variant (each version its own route):
//   [1] "Target a creature with Hardness within 20 feet … The creature must attempt a Fortitude save. On any result except a critical success, the next time that the
//       creature's Hardness applies before the end of your next turn, the creature's Hardness is reduced. The Hardness is reduced by 1 on a success, 3 on a failure, or 6
//       on a critical failure." with "For the one-action version of the spell, the Hardness reduction increases by 1 on a success, by 3 on a failure, and by 6 on a critical
//       failure." (+2): a Fortitude degree table, each failing row's reduction a GM-played note at the cast rank (the variant's data marks it basic; the text has no damage);
//   [2] "… Creatures in the area take 1d8 acid damage with a basic Reflex save; on a critical failure, the creature also takes @Damage[(floor((@item.rank + 1)/ 2))
//       [persistent,acid]] damage." with "… the initial damage increases by 1d8, and the persistent damage increases by 1.": the table of half, full and double damage, the
//       critical failure's persistent roll (its formula rising 1 every 2 ranks, as the text says);
//   [3] "As the two-action version, except the spell's range is 60 feet, and all creatures that are within 10 feet of the burst (but not within it) take 2 splash damage."
//       (+2 a step): the "Blast" variant is the two-action table (the ring a reminder); the "Splash" variant is the ring's splash damage, no save, on the creatures targeted.
const CAUSTIC = {
    one: /^Target a creature with Hardness within (\d+) feet to cover it with an acid that temporarily weakens its defenses\. The creature must attempt a (Fortitude|Reflex|Will) save\. On any result except a critical success, the next time that the creature.s Hardness applies before the end of your next turn, the creature.s Hardness is reduced\. The Hardness is reduced by (\d+) on a success, (\d+) on a failure, or (\d+) on a critical failure\.$/,
    two: /^The glob of acid explodes in a (\d+)-foot burst within (\d+) feet\. Creatures in the area take (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save; on a critical failure, the creature also takes (@Damage\[\(floor\(\(@item\.rank \+ 1\)\/ ?2\)\)\[persistent,([a-z]+)\]\]) damage\.$/,
    three: /^As the two-action version, except the spell.s range is (\d+) feet, and all creatures that are within (\d+) feet of the burst \(but not within it\) take (\d+) splash damage\.$/,
    heightened: /^For the one-action version of the spell, the Hardness reduction increases by (\d+) on a success, by (\d+) on a failure, and by (\d+) on a critical failure\. For the two and three-action versions of the spell, the initial damage increases by (\d+d\d+), and the persistent damage increases by 1\. The splash damage for the three-action version increases by (\d+)\.$/
};
export function fitCausticVersion(item) {
    const time = String(item?.system?.time?.value ?? "").trim();
    const html = String(item?.system?.description?.value ?? "");
    const glyphs = new Map([...html.matchAll(/<p>\s*<span class="action-glyph">([123])<\/span>\s*([\s\S]*?)<\/p>/g)].map(match => [match[1], match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()]));
    const heightenedEntry = /<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*([\s\S]*?)<\/p>/.exec(html);
    const one = CAUSTIC.one.exec(glyphs.get("1") ?? ""), two = CAUSTIC.two.exec(glyphs.get("2") ?? ""), three = CAUSTIC.three.exec(glyphs.get("3") ?? "");
    const step = heightenedEntry ? CAUSTIC.heightened.exec(heightenedEntry[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) : null;
    if (!["1", "2", "3"].includes(time) || !one || !two || !three || !step || !/^<p>You fling a large glob of acid that immediately detonates\.<\/p>/.test(html)) return null;
    const interval = Number(heightenedEntry[1]);
    const entries = Object.values(item.system.damage ?? {});
    const flags = extra => ({ ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), glyphVersion: Number(time), caustic: extra } });
    const Stat = word => word[0].toUpperCase() + word.slice(1).toLowerCase();
    const table = (statistic, rows) => `<p>Each target must attempt a ${Stat(statistic)} save.</p><hr />${Object.entries(rows).map(([heading, text]) => `<p><strong>${heading}</strong> ${text}</p>`).join("")}`;
    if (time === "1") {
        if (entries.length || item.system?.defense?.save?.statistic !== one[2].toLowerCase()) return null;
        const reduced = amount => `The target's Hardness is reduced by ${amount} the next time it applies before the end of your next turn.`;
        return { ...item, system: { ...item.system, target: { ...(item.system.target ?? {}), value: "1 creature" }, defense: { save: { statistic: one[2].toLowerCase(), basic: false } },
                description: { ...item.system.description, value: `${table(one[2], { "Critical Success": "The target is unaffected.", "Success": reduced(one[3]), "Failure": reduced(one[4]), "Critical Failure": reduced(one[5]) })}<hr /><p><strong>Heightened (+${interval})</strong> The Hardness reduction increases by ${step[1]} on a success, by ${step[2]} on a failure, and by ${step[3]} on a critical failure.</p>` } },
            flags: flags({ version: 1, hardness: { success: Number(one[3]), failure: Number(one[4]), criticalFailure: Number(one[5]), steps: [Number(step[1]), Number(step[2]), Number(step[3])], interval },
                sourceText: glyphs.get("1") }) };
    }
    const splash = entries.find(entry => entry.category === "splash"), blast = entries.find(entry => !entry.category);
    if (time === "3" && splash && entries.length === 1) {
        if (String(splash.formula).replace(/\s+/g, "") !== three[3] || String(item.system.heightening?.damage?.[Object.keys(item.system.damage)[0]] ?? "") !== step[5]) return null;
        return { ...item, system: { ...item.system, defense: null, target: { ...(item.system.target ?? {}), value: "" },
                description: { ...item.system.description, value: `<p>Each creature within ${three[2]} feet of the burst (but not in it) takes ${three[3]} ${splash.type} splash damage.</p>` } },
            flags: flags({ version: 3, splash: { formula: `(${three[3]}+floor((@item.rank - ${Number(item.system.level?.value) || 1})/${interval})*${step[5]})[splash,${splash.type}]`, ring: Number(three[2]) }, sourceText: glyphs.get("3") }) };
    }
    if (!blast || entries.length !== 1 || String(blast.formula).replace(/\s+/g, "") !== two[3] || String(blast.type).toLowerCase() !== two[4] || two[7] !== two[4]) return null;
    const rows = { "Critical Success": "The creature is unaffected.", "Success": "The creature takes half damage.", "Failure": "The creature takes full damage.",
        "Critical Failure": `The creature takes double damage and ${two[6]} damage.` };
    return { ...item, system: { ...item.system, defense: { save: { statistic: two[5].toLowerCase(), basic: false } },
            description: { ...item.system.description, value: `<p>Creatures in the area take ${two[3]} ${two[4]} damage and must attempt a ${two[5]} save.</p><hr />${Object.entries(rows).map(([heading, text]) => `<p><strong>${heading}</strong> ${text}</p>`).join("")}<hr /><p><strong>Heightened (+${interval})</strong> The damage increases by ${step[4]}.</p>` } },
        flags: flags({ version: Number(time), ...(time === "3" ? { ring: { feet: Number(three[2]), damage: Number(three[3]), step: Number(step[5]) } } : {}), sourceText: [glyphs.get("2"), ...(time === "3" ? [glyphs.get("3")] : [])].join(" ") }) };
}

// Magic+'s Dynamic Telekinetic Projectile, by its PF2e variant:
//   [1] "Target a ranged weapon that you are holding. Until the end of your current turn, the range increment of the weapon increases by 10 feet." — the caster's held
//       ranged weapon picked, its range increment raised until the turn ends (the stated-effect route, stated-effect.js);
//   [2] "(attack) You hurl a loose, unattended object … Make a spell attack roll against the target's AC. If you hit, you deal 2d6 bludgeoning, piercing, or slashing
//       damage—as appropriate for the object you hurled. …" with "Critical Success You deal double damage." / "Success You deal full damage." — each type its own PF2e
//       variant: the attack table; the object's limits notes;
//   [3] "As the 2-action version of the spell, except you can use your telekinesis to bank around corners or avoid cover. …" — the same, its cover rules a note.
const PROJECTILE = {
    one: /^Target a ranged weapon that you are holding\. Until the end of your current turn, the range increment of the weapon increases by (\d+) feet\.$/,
    two: /^\(attack\) You hurl a loose, unattended object that is within range and that has 1 Bulk or less at a target\. Both the object and the target must be within (\d+) feet of you\. Make a spell attack roll against the target's AC\. If you hit, you deal (\d+d\d+) bludgeoning, piercing, or slashing damage—as appropriate for the object you hurled\. No specific traits or magic properties of the hurled item affect the attack or the damage\.$/,
    three: /^\(attack\) As the 2-action version of the spell, except you can use your telekinesis to bank around corners or avoid cover\. The object must be within (\d+) feet of you, while the creature is within \1 feet of the object\. As long as the object.s square has line of effect to the creature, you do not need to have line of effect to the creature\. Determine the creature.s cover based on the object.s square\.$/
};
export function fitProjectileVersion(item) {
    const time = String(item?.system?.time?.value ?? "").trim();
    const html = String(item?.system?.description?.value ?? "");
    if (!/^<p>You empower an object with kinetic energy, readying it to assault your foe with great speed\.<\/p>/.test(html)) return null;
    const glyphs = new Map([...html.matchAll(/<p>\s*<span class="action-glyph">([123])<\/span>\s*([\s\S]*?)<\/p>/g)].map(match => [match[1], match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()]));
    const rows = [...html.matchAll(/<p[^>]*>\s*<strong>\s*(Critical Success|Success)\s*<\/strong>\s*([\s\S]*?)<\/p>/g)].map(match => `${match[1]}: ${match[2].trim()}`);
    const one = PROJECTILE.one.exec(glyphs.get("1") ?? ""), two = PROJECTILE.two.exec(glyphs.get("2") ?? ""), three = PROJECTILE.three.exec(glyphs.get("3") ?? "");
    const step = /<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The damage of the 2-action and 3-action versions of the spell increases by (\d+d\d+)\./.exec(html);
    if (!one || !two || !three || !step || rows.join(" | ") !== "Critical Success: You deal double damage. | Success: You deal full damage.") return null;
    const flags = extra => ({ ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), glyphVersion: Number(time), projectile: extra } });
    if (time === "1") return { ...item, system: { ...item.system, target: { ...(item.system.target ?? {}), value: "" }, duration: { value: "until the end of your turn", sustained: false },
            description: { ...item.system.description, value: `<p>${glyphs.get("1")}</p>` } }, flags: flags({ version: 1, feet: Number(one[1]) }) };
    const entries = Object.values(item.system.damage ?? {});
    if (!["2", "3"].includes(time) || entries.length !== 1 || entries[0].category || String(entries[0].formula).replace(/\s+/g, "") !== two[2] || !["bludgeoning", "piercing", "slashing"].includes(entries[0].type)) return null;
    const notes = [`Hurl a loose, unattended object of 1 Bulk or less (its damage type is this variant's: ${entries[0].type}); no traits or magic properties of the object apply.`,
        time === "2" ? `Both the object and the target must be within ${two[1]} feet of you.` : `The object must be within ${three[1]} feet of you and the creature within ${three[1]} feet of the object; you need no line of effect to the creature while the object's square has it, and its cover is judged from the object's square (it can bank around corners).`];
    return { ...item, system: { ...item.system, heightening: { type: "interval", interval: 1, damage: { [Object.keys(item.system.damage)[0]]: step[1] } },
            description: { ...item.system.description, value: `<p>Make a spell attack roll against the target's AC.</p><p><strong>Critical Success</strong> The target takes double damage.</p><p><strong>Success</strong> The target takes full damage.</p>` } },
        flags: flags({ version: Number(time), notes, sourceText: [glyphs.get("2"), ...(time === "3" ? [glyphs.get("3")] : [])].join(" ") }) };
}

// Magic+'s Dynamic Fly, by its PF2e variant (the third has no action count in its data; its target "self and up to 6 creatures" names it): the lead ("Your target
// soars through the air, gaining a fly Speed equal to its Speed or 20 feet, whichever is greater."), the version's sentences and its own Spell Effect link, and the
// 7th-rank entry's part for that version — read by the Effect + note proof (effect-note-proof.js).
const FLY = {
    lead: /^<p>Your target soars through the air, gaining a fly Speed equal to its Speed or 20 feet, whichever is greater\.<\/p>/,
    versions: /<p><span class="action-glyph">([123])<\/span>\s*([\s\S]*?)<\/p>\s*<p>(@UUID\[[^\]]+\]\{[^}]+\})<\/p>/g,
    heightened: /<p><strong>Heightened \(7th\)<\/strong> The one-action version and three action versions also grant all targets a \+20-foot status bonus to their fly Speed until the end of your next turn\. The duration of the two-action version increases to 30 minutes\.<\/p>/
};
export function fitFlyVersion(item) {
    const html = String(item?.system?.description?.value ?? "");
    if (!FLY.lead.test(html) || !FLY.heightened.test(html)) return null;
    const target = String(item.system?.target?.value ?? "").trim();
    const time = String(item.system?.time?.value ?? "").trim();
    const version = /^self and up to 6 creatures$/i.test(target) ? 3 : time === "1" ? 1 : time === "2" ? 2 : null;
    const found = new Map([...html.matchAll(FLY.versions)].map(match => [Number(match[1]), { text: match[2].trim(), link: match[3] }]));
    if (!version || found.size !== 3) return null;
    const { text, link } = found.get(version);
    const heightened = version === 2 ? "<p><strong>Heightened (7th)</strong> The spell's duration increases to 30 minutes.</p>"
        : "<p><strong>Heightened (7th)</strong> All targets also gain a +20-foot status bonus to their fly Speed until the end of your next turn.</p>";
    return { ...item, system: { ...item.system, time: { ...(item.system.time ?? {}), value: String(version) }, ...(version === 3 ? { target: { ...item.system.target, value: "up to 7 creatures" } } : {}),
            duration: { ...(item.system.duration ?? {}), value: version === 2 ? "1 minute" : "until the end of your next turn" },
            description: { ...item.system.description, value: `<p>Your target soars through the air, gaining a fly Speed equal to its Speed or 20 feet, whichever is greater. ${text.replace(/^The spell.s range is touch and its duration is 1 minute\.$/, "")}</p><p>${link}</p><hr />${heightened}` } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), glyphVersion: version, flyVersion: version } } };
}

// Magic+'s Dynamic Gouging Claw, by its PF2e variant:
//   [1] "You gain a claw Strike for 1 minute. The claw deals 1d6 slashing damage, has the agile and finesse traits, and is in the knife weapon group. You gain the critical
//       specialization effect of the claw. You become temporarily immune to gaining a claw Strike from this spell for 10 minutes." — the caster's Strike (PF2e's Strike
//       rule element, its critical specialization) for a minute, then immune (the module's linked Effect has no rules);
//   [2] "… Make a melee spell attack roll against a target's AC within your melee reach. If you hit, you deal your choice of 2d6 slashing damage or 2d6 piercing damage
//       plus @Damage[@item.rank[persistent,bleed]] damage. On a critical success, you deal double damage (but not double bleed damage)." — the attack, the caster's type;
//   [3] "You gain a claw Strike as described in the one-action version. Until the end of your next turn, the claw Strike's reach increases by 10 feet. Make a melee spell
//       attack roll … Your reach is extended by 20 feet instead of 10 feet for this attack. If you hit, you deal your choice of 2d6 slashing damage or 2d6 piercing damage,
//       plus 2 persistent bleed damage. On a critical success, you deal double damage and double bleed damage." — the claw, its reach, then the attack.
const CLAW = {
    one: /^You gain a claw Strike for 1 minute\. The claw deals (\d+)d(\d+) ([a-z]+) damage, has the agile and finesse traits, and is in the knife weapon group\. You gain the critical specialization effect of the claw\. You become temporarily immune to gaining a claw Strike from this spell for (\d+) minutes\./,
    two: /^Your morph is powerful but fleeting\. Make a melee spell attack roll against a target.s AC within your melee reach\. If you hit, you deal your choice of (\d+d\d+) slashing damage or \1 piercing damage plus @Damage\[@item\.rank\[persistent,bleed\]\]\{[^}]*\} damage\. On a critical success, you deal double damage \(but not double bleed damage\)\.$/,
    three: /^You gain a claw Strike as described in the one-action version\. Until the end of your next turn, the claw Strike.s reach increases by (\d+) feet\. Make a melee spell attack roll against the AC of a target within your reach\. Your reach is extended by (\d+) feet instead of \1 feet for this attack\. If you hit, you deal your choice of (\d+d\d+) slashing damage or \3 piercing damage, plus (\d+) persistent bleed damage\. On a critical success, you deal double damage and double bleed damage\./,
    heightened: /The damage of the spell attack increases by (\d+)d6 and the persistent bleed damage for the 2 and 3 action versions of the spell increases by (\d+)\./
};
export function fitClawVersion(item) {
    const html = String(item?.system?.description?.value ?? "");
    if (!/^<p>You temporarily morph your limb into a clawed appendage\.<\/p>/.test(html)) return null;
    const glyphs = new Map([...html.matchAll(/<p>\s*<span class="action-glyph">([123])<\/span>\s*([\s\S]*?)<\/p>/g)].map(match => [match[1], match[2].replace(/@UUID\[[^\]]+\]\{Spell Effect: [^}]+\}/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()]));
    const one = CLAW.one.exec(glyphs.get("1") ?? ""), two = CLAW.two.exec(glyphs.get("2") ?? ""), three = CLAW.three.exec(glyphs.get("3") ?? ""), step = CLAW.heightened.exec(html.replace(/<[^>]+>/g, " "));
    const time = String(item.system?.time?.value ?? "").trim();
    if (!one || !two || !three || !step || !["1", "2", "3"].includes(time)) return null;
    const flags = extra => ({ ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), glyphVersion: Number(time), claw: extra } });
    const strike = { dice: Number(one[1]), die: `d${one[2]}`, type: one[3], immunityMinutes: Number(one[4]) };
    const attack = (dice, persistent, doubleBleed) => `<p>Make a melee spell attack against a target.</p><p><strong>Critical Success</strong> The target takes double damage and @Damage[${doubleBleed ? `(2*(${persistent}))` : `(${persistent})`}[persistent,bleed]] damage.</p><p><strong>Success</strong> The target takes full damage and @Damage[(${persistent})[persistent,bleed]] damage.</p>`;
    if (time === "1") return { ...item, system: { ...item.system, description: { ...item.system.description, value: `<p>${glyphs.get("1")}</p>` } }, flags: flags({ version: 1, strike, sourceText: glyphs.get("1") }) };
    const entries = Object.entries(item.system.damage ?? {}).filter(([, entry]) => !entry.category);
    if (entries.length !== 1 || String(entries[0][1].formula).replace(/\s+/g, "") !== (time === "2" ? two[1] : three[3])) return null;
    const traits = [...new Set([...(item.system.traits?.value ?? []), "attack"])];
    const [id, entry] = entries[0];
    const dice = /^(\d+)d(\d+)$/.exec(String(entry.formula).replace(/\s+/g, ""));
    const formula = `(${dice[1]}+floor((@item.rank - ${Number(item.system.level?.value) || 1})/1)*${step[1]})d${dice[2]}[untyped]`;
    const persistent = time === "2" ? "@item.rank" : `${three[4]}+floor((@item.rank - ${Number(item.system.level?.value) || 1})/1)*${step[2]}`;
    return { ...item, system: { ...item.system, traits: { ...item.system.traits, value: traits }, damage: { [id]: entry }, heightening: { type: "interval", interval: 1, damage: { [id]: `${step[1]}d${dice[2]}` } },
            description: { ...item.system.description, value: attack(entry.formula, persistent, time === "3") } },
        flags: flags({ version: Number(time), formula, choiceSentence: time === "2" ? "you deal your choice of 2d6 slashing damage or 2d6 piercing damage" : "you deal your choice of 2d6 slashing damage or 2d6 piercing damage",
            ...(time === "3" ? { strike, reach: Number(three[1]), attackReach: Number(three[2]) } : {}), sourceText: glyphs.get(time) }) };
}

// Magic+'s Dynamic Ignition, by its PF2e variant:
//   [1] "You target an unoccupied square within 20 feet. Fires spring to life in the square, making it hazardous terrain that deals @Damage[(1+@item.rank)[fire]] damage to
//       creatures that enter the area or end their turn in the area. The flames persist for [[/r 1d4]] rounds. If you cast the 1-action version of this spell again, your
//       previous casting automatically ends." — a placed square burning a creature entering it or ending its turn there (no save), for the rounds rolled;
//   [2] "… making a spell attack roll against the target's AC and dealing 2d4 fire damage on a hit, or double damage and an additional 1d4 persistent fire damage if you
//       critically succeeded … If the target is within your melee reach, you can choose to make a melee spell attack … which increases all the spell's damage dice to d6s."
//       (the "Melee" variant's d6s) with "@Damage[(@item.rank)d4[persistent,fire]]{Scaling Persistent Fire Damage}" — the attack table, the critical hit's persistent fire;
//   [3] "As the 2-action version, except spell's range is 60 feet. Additionally, if the spell attack roll succeeds, the target takes 1d4 persistent fire damage." — the same,
//       the persistent fire on a hit too (one instance: persistent damage of one type doesn't stack).
const IGNITE = {
    one: /^You target an unoccupied square within (\d+) feet\. Fires spring to life in the square, making it hazardous terrain that deals @Damage\[\(1\+@item\.rank\)\[([a-z]+)\]\] damage to creatures that enter the area or end their turn in the area\. The flames persist for \[\[\/r (\d+d\d+)\]\] rounds\. If you cast the 1-action version of this spell again, your previous casting automatically ends\.$/,
    two: /^You target a creature within (\d+) feet, making a spell attack roll against the target.s AC and dealing (\d+d4) fire damage on a hit, or double damage and an additional 1d4 persistent fire damage if you critically succeeded your spell attack roll\. If the target is within your melee reach, you can choose to make a melee spell attack with the flame instead of a ranged spell attack, which increases all the spell's damage dice to d6s\.$/,
    three: /^As the 2-action version, except spell.s range is (\d+) feet\. Additionally, if the spell attack roll succeeds, the target takes 1d4 persistent fire damage\.$/
};
export function fitIgnitionVersion(item) {
    const html = String(item?.system?.description?.value ?? "");
    if (!/^<p>You snap your fingers and point at a target, which begins to smolder\.<\/p>/.test(html)) return null;
    const glyphs = new Map([...html.matchAll(/<p>\s*<span class="action-glyph">([123])<\/span>\s*([\s\S]*?)<\/p>/g)].map(match => [match[1], match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()]));
    const one = IGNITE.one.exec(glyphs.get("1") ?? ""), two = IGNITE.two.exec(glyphs.get("2") ?? ""), three = IGNITE.three.exec(glyphs.get("3") ?? "");
    const step = /The initial damage and persistent fire damage of the spell.s 2-action and 3-action versions increases by 1d4\./.test(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
    const time = String(item.system?.time?.value ?? "").trim();
    if (!one || !two || !three || !step || !["1", "2", "3"].includes(time)) return null;
    const flags = extra => ({ ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), glyphVersion: Number(time), ignition: extra } });
    if (time === "1") return { ...item, system: { ...item.system, description: { ...item.system.description, value: `<p>${glyphs.get("1")}</p>` } },
        flags: flags({ version: 1, square: { formula: "(1+@item.rank)", type: one[2], roundsRoll: one[3], range: Number(one[1]) }, sourceText: glyphs.get("1") }) };
    const entries = Object.entries(item.system.damage ?? {});
    const main = entries.find(([, entry]) => !entry.category);
    const die = /^\d+d(\d+)$/.exec(String(main?.[1]?.formula ?? "").replace(/\s+/g, ""))?.[1];
    if (!main || !["4", "6"].includes(die) || main[1].type !== "fire") return null;
    const persistent = `@Damage[(@item.rank)d${die}[persistent,fire]]`;
    const traits = [...new Set([...(item.system.traits?.value ?? []), "attack"])];
    return { ...item, system: { ...item.system, traits: { ...item.system.traits, value: traits }, damage: { [main[0]]: main[1] }, heightening: { type: "interval", interval: 1, damage: { [main[0]]: `1d${die}` } },
            description: { ...item.system.description, value: `<p>Make a spell attack against a target.</p><p><strong>Critical Success</strong> The target takes double damage and ${persistent} damage.</p><p><strong>Success</strong> The target takes full damage${time === "3" ? ` and ${persistent} damage` : ""}.</p>` } },
        flags: flags({ version: Number(time), melee: die === "6", sourceText: [glyphs.get("2"), ...(time === "3" ? [glyphs.get("3")] : [])].join(" ") }) };
}

// Magic+'s Dynamic Vampiric Feast, by its PF2e variant:
//   [1] "You gather void energy into your hand, ready to augment your next spell with vampiric power. The next time you Cast a Spell before the end of your next turn, you
//       gain temporary Hit Points equal to half the damage a single creature takes from this spell; calculate these temporary Hit Points using the creature that took the most
//       damage (to a maximum of [[5*@item.rank]] temporary Hit Points). You lose any remaining temporary Hit Points after 3 rounds." — a marker on the caster until the end
//       of its next turn, read by its next damaging spell's card (basic-save-runtime.js);
//   [2] "You touch a target, dealing them 6d6 void damage. You gain temporary Hit Points equal to half the void damage the target takes (after applying resistances and the
//       like). You lose any remaining temporary Hit Points after 3 rounds." — official Vampiric Feast's wording (its basic Fortitude save, from the item's data as PF2e's
//       own spell has it), the temporary Hit Points for 3 rounds;
//   [3] "As the 2-action version of the spell, but the range increases from touch to 60 feet and the temporary Hit Points can last for up to 1 minute."
const FEAST = {
    one: /^You gather void energy into your hand, ready to augment your next spell with vampiric power\. The next time you Cast a Spell before the end of your next turn, you gain temporary Hit Points equal to half the damage a single creature takes from this spell; calculate these temporary Hit Points using the creature that took the most damage \(to a maximum of \[\[(\d+)\*@item\.rank\]\] temporary Hit Points\)\. You lose any remaining temporary Hit Points after (\d+) rounds\.$/,
    two: /^You touch a target, dealing them (\d+d\d+) void damage\. (You gain temporary Hit Points equal to half the void damage the target takes \(after applying resistances and the like\)\.) You lose any remaining temporary Hit Points after (\d+) rounds\.$/,
    three: /^As the 2-action version of the spell, but the range increases from touch to (\d+) feet and the temporary Hit Points can last for up to (\d+) minute\.$/
};
export function fitFeastVersion(item) {
    const html = String(item?.system?.description?.value ?? "");
    if (!/^<p>Your magic leeches the lifeblood out of a target to empower yourself\.<\/p>/.test(html)) return null;
    const glyphs = new Map([...html.matchAll(/<p>\s*<span class="action-glyph">([123])<\/span>\s*([\s\S]*?)<\/p>/g)].map(match => [match[1], match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()]));
    const one = FEAST.one.exec(glyphs.get("1") ?? ""), two = FEAST.two.exec(glyphs.get("2") ?? ""), three = FEAST.three.exec(glyphs.get("3") ?? "");
    const time = String(item.system?.time?.value ?? "").trim();
    if (!one || !two || !three || !["1", "2", "3"].includes(time)) return null;
    const flags = extra => ({ ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), glyphVersion: Number(time), feast: extra } });
    if (time === "1") return { ...item, system: { ...item.system, defense: null, description: { ...item.system.description, value: `<p>${glyphs.get("1")}</p>` } },
        flags: flags({ version: 1, capPerRank: Number(one[1]), rounds: Number(one[2]), sourceText: glyphs.get("1") }) };
    const entries = Object.values(item.system.damage ?? {});
    if (entries.length !== 1 || String(entries[0].formula).replace(/\s+/g, "") !== two[1] || entries[0].type !== "void" || item.system?.defense?.save?.statistic !== "fortitude") return null;
    const lasts = time === "2" ? `after ${two[3]} rounds` : `after ${three[2]} minute`;
    return { ...item, system: { ...item.system, defense: { save: { statistic: "fortitude", basic: true } },
            description: { ...item.system.description, value: `<p>You deal ${two[1]} void damage to the target. ${two[2]} You lose any remaining temporary Hit Points ${lasts}.</p><hr /><p><strong>Heightened (+1)</strong> The damage increases by 2d6.</p>` } },
        flags: flags({ version: Number(time), sourceText: glyphs.get(time) }) };
}

// Oracles+'s Winter's Cold Embrace: "… Creatures that end their turn in the area of darkness take 12d4 cold damage with a basic Fortitude save. Creatures with immunities or
// resistance to cold damage take spirit damage instead if they do not possess darkvision or greater darkvision." with the darkness's light rules: the placed burst's
// lingering area (a creature ending its turn there saves; the item's damage), spirit for a creature that shrugs off cold and can't see in the dark (a damage swap the card
// reads from PF2e's data), and the light and sight rules the GM's reminders.
const EMBRACE = {
    lead: /^You create a darkness so cold and chilling that even those that would call the cold and darkness friend fear it\. (Light does not enter the area and any non-magical light sources, such as a torch or lantern, do not emanate any light while inside the area, even if their light radius would extend beyond the darkness\. This also suppresses magical light of the spell.s rank or lower\. Light can.t pass through, so creatures in the area can.t see outside\. From outside, it appears as a frosted globe of pure darkness\. Creatures with darkvision cannot see through the darkness and creatures with greater darkness still treat the area as concealed\.) (Creatures that end their turn in the area of darkness take (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.) (Creatures with immunities or resistance to \4 damage take ([a-z]+) damage instead if they do not possess darkvision or greater darkvision\.)$/
};
export function fitColdEmbrace(item) {
    const [body, heightened, ...rest] = String(item?.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    const text = String(body ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const match = EMBRACE.lead.exec(text);
    const entries = Object.values(item?.system?.damage ?? {});
    if (!match || rest.length || entries.length !== 1 || String(entries[0].formula).replace(/\s+/g, "") !== match[3] || entries[0].type !== match[4] || item.system?.defense?.save?.basic !== true) return null;
    const step = /Increase the damage by (\d+d\d+)\./.exec(String(heightened ?? "").replace(/<[^>]+>/g, " "));
    return { ...item, system: { ...item.system, description: { ...item.system.description, value: `<p>A creature that ends its turn in the area takes ${match[3]} ${match[4]} damage with a basic ${match[5]} save.</p>${step ? `<hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[1]}.</p>` : ""}` } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), coldEmbrace: { light: match[1], swapSentence: match[6], to: match[7], from: match[4], damageSentence: match[2] } } } };
}

// Wizards+'s Energy Exertion: "You hurl what energy remains in your aura at a nearby enemy. You deal 1d4 damage of the same type as your residual energy, or
// bludgeoning damage if your residual energy has the air, earth, or water traits, piercing damage if it has the wood trait, or slashing damage if it has the metal
// trait. Alternatively, you can expend your residual energy to increase the damage to 2d4. This spell gains the trait of your residual energy." with "Critical
// Success The target takes double damage." / "Success The target takes full damage." and "Heightened (+1) The damage increases by 1d4 or 2d4 if you expend your
// residual energy.": each PF2e variant (1d4, or 2d4 expended — the item's placeholder type) a spell attack against AC; the type the caster picks for its residual
// energy (a class feature: asked on the card — the user's decision 2026-10-01), the trait a note.
const EXERTION = /^You hurl what energy remains in your aura at a nearby enemy\. (You deal (\d)d4 damage of the same type as your residual energy, or bludgeoning damage if your residual energy has the air, earth, or water traits, piercing damage if it has the wood trait, or slashing damage if it has the metal trait\.) (Alternatively, you can expend your residual energy to increase the damage to (\d)d4\.) (This spell gains the trait of your residual energy\.) Critical Success The target takes double damage\. Success The target takes full damage\.$/;
export function fitEnergyExertion(item) {
    const [body, heightened, ...rest] = String(item?.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    const text = String(body ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const match = EXERTION.exec(text);
    const entries = Object.values(item?.system?.damage ?? {});
    const step = /^Heightened \(\+1\) The damage increases by (\d)d4 or (\d)d4 if you expend your residual energy\.$/.exec(String(heightened ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    if (!match || !step || rest.length || entries.length !== 1 || entries[0].category || !(item.system?.traits?.value ?? []).includes("attack") || item.system?.defense?.save) return null;
    // (The variant's dice are the text's: the plain version's, or the expended one's, each rising by its own step.)
    const dice = /^(\d)d4$/.exec(String(entries[0].formula).replace(/\s+/g, ""))?.[1];
    const expended = dice === match[4] && dice !== match[2];
    if (!dice || (dice !== match[2] && !expended) || dice !== (expended ? step[2] : step[1])) return null;
    return { ...item, system: { ...item.system, description: { ...item.system.description, value: `<p>Make a spell attack roll against the target's AC, dealing ${dice}d4 ${entries[0].type} damage on a hit (or double damage on a critical hit).</p><hr /><p><strong>Heightened (+1)</strong> The damage increases by ${dice}d4.</p>` } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), energyExertion: { dice: Number(dice), expended, typeSentence: match[1], traitSentence: match[5] } } } };
}

// Inventors+'s Technomancy Ray: "Make a spell attack roll with your innovation against a target within 30 feet. On a hit, the ray deals 1d4 fire damage or twice
// this amount and 1 persistent fire damage on a critical success. If you are a master in Crafting, the die size of your ray increases to d6, and if you are
// legendary in Crafting, the die size increases to d8." / "If you have a Variable Core, you change the damage type from fire damage to the type you chose and
// replace the fire trait with that damage trait.": a spell attack (the item's die a flag its class feature sets: the text's d4, d6 or d8 by the caster's Crafting
// rank, read when the damage is rolled), double and 1 persistent on a critical hit; the type fire, or the caster's Variable Core type (a class pick: asked on
// the card), for both.
const TECHNOMANCY = /^You fire a ray of [a-z ]+ at your opponent\. Make a spell attack roll with your innovation against a target within (\d+) feet\. On a hit, the ray deals 1d(4) ([a-z]+) damage or twice this amount and (\d+) persistent \3 damage on a critical success\. (If you are a master in Crafting, the die size of your ray increases to d(6), and if you are legendary in Crafting, the die size increases to d(8)\.) (If you have a Variable Core, you change the damage type from \3 damage to the type you chose and replace the \3 trait with that damage trait\.)$/;
export function fitTechnomancyRay(item) {
    const text = String(item?.system?.description?.value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const match = TECHNOMANCY.exec(text);
    const entries = Object.entries(item?.system?.damage ?? {});
    if (!match || entries.length !== 1 || entries[0][1].type !== match[3] || entries[0][1].category || !/^1d@actor\.flags\.pf2e\.[a-zA-Z]+$/.test(String(entries[0][1].formula))
        || !(item.system?.traits?.value ?? []).includes("attack") || Number(item.system?.range?.value?.match?.(/\d+/)?.[0]) !== Number(match[1])) return null;
    const [id] = entries[0];
    return { ...item, system: { ...item.system, damage: { [id]: { ...entries[0][1], formula: `1d${match[2]}` } }, heightening: { type: "interval", interval: 1, damage: { [id]: `1d${match[2]}` } },
            description: { ...item.system.description, value: `<p>Make a spell attack roll against the target's AC, dealing 1d${match[2]} ${match[3]} damage on a hit.</p><hr /><p><strong>Critical Success</strong> The target takes double damage and ${match[4]} persistent ${match[3]} damage.</p><p><strong>Success</strong> The target takes full damage.</p>` } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), technomancy: { base: Number(match[2]), byRank: { 3: Number(match[6]), 4: Number(match[7]) },
            type: match[3], dieSentence: match[5], coreSentence: match[8], persistent: Number(match[4]) } } } };
}

// Magic+'s Unhelpful Nudge: "Trigger A creature off-guard to you attempts to Stride" / "With but a thought and a wave of your hand, you cause an unprepared enemy
// to move. The target creature attempts a Reflex save. You push the creature 10 feet at any point during its Stride. If the creature would be pushed into another
// creature or object, it must attempt a Reflex save, falling Prone if it fails its save.": no table — a failed save (the user's ruling 2026-10-03: the rows the
// text leaves out, the failures get the effect) pushes it the stated distance where the caster chooses during the Stride; then, if the GM says it was pushed into
// a creature or object, its second save: Prone on a failure.
const NUDGE = /^(?:Trigger (.+?) )?With but a thought and a wave of your hand, you cause an unprepared enemy to move\. The target creature attempts an? (Fortitude|Reflex|Will) save\. (You push the creature (\d+) feet at any point during its Stride\.) (If the creature would be pushed into another creature or object, it must attempt an? (Fortitude|Reflex|Will) save, falling (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{(Prone)\}) if it fails its save\.)$/;
export function fitNudge(item) {
    const html = String(item?.system?.description?.value ?? "");
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const match = NUDGE.exec(text);
    if (!match || item.system?.defense?.save?.statistic !== match[2].toLowerCase() || item.system.defense.save.basic || Object.keys(item.system?.damage ?? {}).length) return null;
    const trigger = /^\s*<p>\s*<strong>\s*Trigger\s*<\/strong>[\s\S]*?<\/p>\s*<hr\s*\/?>/i.exec(html)?.[0] ?? "";
    return { ...item, system: { ...item.system, description: { ...item.system.description, value: `${trigger}<p>The target must attempt a ${match[2]} save.</p><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is unaffected.</p><p><strong>Failure</strong> The target is pushed ${match[4]} feet.</p><p><strong>Critical Failure</strong> The target is pushed ${match[4]} feet.</p>` } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), nudge: { push: match[3], collision: match[5], statistic: match[6].toLowerCase(),
            condition: { id: match[8], name: match[9], raw: match[7] } } } } };
}

// Magic+'s Shadow Wield: "Select either bludgeoning, piercing, or slashing damage and whether your shadow weapon is a melee or ranged weapon. If you select a ranged weapon,
// it has a range of 30 feet." / "When you first Cast the Spell or when you Sustain the spell, you attempt a spell attack roll against the target's AC with your shadow weapon,
// dealing 1d8 damage on a hit with a melee weapon or 1d6 damage on a hit with ranged weapon (or double damage on a critical hit). The attack deals void damage instead if that
// would be more detrimental to the creature (as determined by the GM). This attack uses and contributes to your multiple attack penalty." with "Heightened (+2) Increase the
// damage of the weapon by 1d8 for a melee weapon or 1d6 for a ranged weapon.": each PF2e variant (melee or ranged — its dice) the spell attack PF2e's Spiritual Armament
// reads: the caster's type among the three (void for the GM's "more detrimental"), repeated on each Sustain against a creature in reach (melee) or within 30 feet.
const SHADOW = /^You draw your shadow into your hands and wield it\. You can form your shadow into a weapon, and your shadow disappears for the duration\. Select either bludgeoning, piercing, or slashing damage and whether your shadow weapon is a melee or ranged weapon\. If you select a ranged weapon, it has a range of (\d+) feet\. When you first Cast the Spell or when you Sustain the spell, you attempt a spell attack roll against the target's AC with your shadow weapon, dealing (\d)d(\d+) damage on a hit with a melee weapon or (\d)d(\d+) damage on a hit with ranged weapon \(or double damage on a critical hit\)\. The attack deals ([a-z]+) damage instead if that would be more detrimental to the creature \(as determined by the GM\)\. This attack uses and contributes to your multiple attack penalty\.$/;
export function fitShadowWield(item) {
    const [body, heightened, ...rest] = String(item?.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    const text = String(body ?? "").replace(/<[^>]+>/g, " ").replace(/&#39;|’/g, "'").replace(/\s+/g, " ").trim();
    const match = SHADOW.exec(text);
    const step = /^Heightened \(\+(\d)\) Increase the damage of the weapon by (\d)d(\d+) for a melee weapon or (\d)d(\d+) for a ranged weapon\.$/.exec(String(heightened ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    const entries = Object.entries(item?.system?.damage ?? {});
    if (!match || !step || rest.length || entries.length !== 1 || entries[0][1].category || !item.system?.duration?.sustained) return null;
    const formula = String(entries[0][1].formula).replace(/\s+/g, "");
    const melee = formula === `${match[2]}d${match[3]}`, ranged = formula === `${match[4]}d${match[5]}`;
    if (melee === ranged) return null;
    const [id, entry] = entries[0];
    const add = melee ? `${step[2]}d${step[3]}` : `${step[4]}d${step[5]}`;
    if (String(item.system?.heightening?.damage?.[id] ?? "") !== add || Number(item.system?.heightening?.interval) !== Number(step[1])) return null;
    const reach = melee ? 5 : Number(match[1]);
    return { ...item, system: { ...item.system, damage: { [id]: { ...entry, type: "untyped" } },
            description: { ...item.system.description, value: `<p>You draw your shadow into your hands and wield it. Attempt a spell attack roll against the target's AC, dealing ${formula} damage on a hit (or double damage on a critical hit). `
                + `The damage type is the same as the chosen weapon (or any of its types for a versatile weapon). The attack deals ${match[6]} damage instead if that would be more detrimental to the creature (as determined by the GM). `
                + `This attack uses and contributes to your multiple attack penalty. Each time you Sustain the spell, you can repeat the attack against any creature within ${reach} feet.</p><hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${add}.</p>` } },
        flags: { ...(item.flags ?? {}), "pf2e-automatic-resolution": { ...(item.flags?.["pf2e-automatic-resolution"] ?? {}), shadowWield: { melee } } } };
}
