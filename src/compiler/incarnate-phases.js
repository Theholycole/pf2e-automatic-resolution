// Incarnates and named summons the narrower readers don't take (Holy Host, Unholy Army, the kaiju, the elemental heralds, the wardens, …): the manifestation is
// one of several listed options (or one), each with an Arrive and a Depart. Each phase's sentences are read into parts:
//   - a save: its lead ("… take @Damage[…] damage (@Check[reflex|basic] save)", "… must attempt a Will save", "… must succeed at a … save or be …") and its riders
//     ("On a failure, a creature is also {Sickened 1} ({Sickened 2} on a critical failure).", "A creature that critically fails is additionally {Deafened} for 10
//     minutes.", "… is also pushed 10 feet away …") become a degree table compiled by the ordinary save route (the damage rolled from the phase's own formula);
//   - an allied benefit: PF2e's linked Effect for that option, or the stated status bonuses / healing, on the allies the GM targets;
//   - the GM's reminders: who the phase reaches, terrain, objects, and rules only the GM can play.
// A sentence none of these reads refuses the spell (`unread` names it, for debugging).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_HYPHEN_NAME as COND, SPELL as SPELL_LINK, condition as condLink } from "./text-patterns.js";

const CONDITION_UUIDS = { prone: "j91X7x0XSomq8d60", stunned: "dfCMdR4wnpbYNTix", sickened: "fesd1n5eVhpCSS18", deafened: "9PR9y0bi4JPKnHPR", slowed: "xYTAsEpcJE1Ccni3",
    frightened: "TBSHQspnbcqxsmjL", clumsy: "i3OJZU2nk64Df3xm", drained: "4D2KBtexWXa6oUMR", enfeebled: "MIRkyAjyBeXivMa7", blinded: "XgEqL1kFApUbl5Z2", immobilized: "eIcWbB5o3pP6OIMe",
    restrained: "VcDeM8A5oI6VqhbM", grabbed: "kWc1fhmv9LBiTuei", confused: "yblD8fOR1J8rDwEQ", fleeing: "sDPxOjQ9kx2RZE8D", dazzled: "TkIyaNPgTZFBCCuh", stupefied: "e1XGnhKNSQIm5IXg",
    "off-guard": "AJh5ex99aV6VTggg", quickened: "nlCjDvLMf2EkV2dl", concealed: "DmAIPqOBomZ7H95W", invisible: "zJxUflt9np0q4yML" };
const bare = (name, value) => condLink(`Compendium.pf2e.conditionitems.Item.${CONDITION_UUIDS[name.toLowerCase()]}`, name.toLowerCase() === "off-guard" ? "Off-Guard" : name[0].toUpperCase() + name.slice(1).toLowerCase(), value);
const DURATION = String.raw`(?: for (\d+) (round|minute|hour)s?)?`;
const STATS = "(Fortitude|Reflex|Will|fortitude|reflex|will)";
// (Plain text for a reader: links by their labels, inline rolls by their dice and type, checks by their save.)
const plainOf = html => htmlToPlainText(String(html ?? ""))
    .replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")
    .replace(/@Damage\[((?:[^\[\]]|\[[^\]]*\])*)\](?:\{([^}]+)\})?/g, (all, body, label) => label ?? body.split("|")[0].replace(/\[([a-z, ]+)\]/g, (m, types) => ` ${types.split(",").map(type => type.trim()).join(" ")}`).replace(/,/g, " plus "))
    .replace(/@Check\[(fortitude|reflex|will)((?:\|[^\]]*)?)\](?:\{[^}]*\})?(?: save)?/gi, (all, statistic, rest) => `${/\|basic\b/.test(rest) ? "basic " : ""}${statistic[0].toUpperCase()}${statistic.slice(1).toLowerCase()} save`)
    .replace(/\[\[\/(?:gm)?r ([^\]#]+?)(?: #[^\]]*)?\]\](?:\{([^}]+)\})?/g, (all, formula, label) => label ?? formula.trim())
    .replace(/\s+/g, " ").trim();

/** The damage entries an inline roll or plain dice state: [[formula, type, category]]. */
function damageEntries(text) {
    const entries = [];
    for (const [, body] of String(text).matchAll(/@Damage\[((?:[^\[\]]|\[[^\]]*\])*)\]/g)) {
        // (Commas inside brackets or parentheses — "[persistent,fire]", "max(2,floor(…))" — don't separate entries.)
        const pieces = [];
        let depth = 0, current = "";
        for (const character of body.split("|")[0]) {
            if ("[(".includes(character)) depth += 1;
            if ("])".includes(character)) depth -= 1;
            if (character === "," && depth === 0) { pieces.push(current); current = ""; } else current += character;
        }
        pieces.push(current);
        for (const part of pieces) {
            // ("(max(3,floor(@item.rank/2)))d12[piercing]": dice whose count reads the cast rank, rolled with the spell's roll data.)
            const m = /^\(?(\d+d\d+(?:\s*[+-]\s*\d+)?|\d+)\)?\[([a-z, ]+)\]$/.exec(part.trim()) ?? /^(\((?:[\d\s+*\/(),-]|max|min|floor|ceil|@item\.rank)+\)d\d+)\[([a-z, ]+)\]$/.exec(part.trim());
            if (!m) return null;
            const kinds = m[2].split(",").map(kind => kind.trim());
            entries.push([m[1].replace(/\s+/g, ""), kinds.at(-1), kinds.includes("persistent") ? "persistent" : null]);
        }
    }
    if (!entries.length) for (const m of String(text).matchAll(/(?:^|[^\w\[])(\d+d\d+) ([a-z]+)(?: energy)? damage\b/g)) entries.push([m[1], m[2], null]);
    // (Dice with no type — "dealing 10d6 damage to metal creatures" — are untyped.)
    if (!entries.length) for (const m of String(text).matchAll(/(?:^|[^\w\[])(\d+d\d+) damage\b/g)) entries.push([m[1], "untyped", null]);
    return entries;
}

// Riders on a basic save (or a non-basic one's failing rows): each appends to rows.
const RIDERS = [
    // "On a failure, a creature is also {Sickened 1} ({Sickened 2} on a critical failure)." / "… is {Clumsy 1} for 1 minute ({Clumsy 2} on a critical failure)."
    [new RegExp(String.raw`^(?:On a failure, (?:a creature|the creature|they)(?: is|'re| are)|A creature (?:who|that) fails (?:the|its) save is)(?: also)? ${COND}${DURATION}(?: \(${COND}${DURATION} on a critical failure\))?\.?$`),
        // (The failure's time holds for the critical failure's condition too: "{Clumsy 1} for 1 minute ({Clumsy 2} on a critical failure)".)
        (rows, m) => { rows.failure.push(cond(m, 1, 4)); rows.criticalFailure.push(m[6] ? cond(m, 6, m[9] ? 9 : 4) : cond(m, 1, 4)); }],
    // "On a failure, a creature is also {Stunned 1}. On a critical failure, they're {Stunned 2}." (two sentences: the second below)
    [new RegExp(String.raw`^On a critical failure, (?:a creature|the creature|they|it)(?: is|'re| are|'s)(?: also)?(?: knocked)? ${COND}${DURATION}(?: and ${COND}${DURATION})?\.?$`),
        (rows, m) => { rows.criticalFailure = rows.criticalFailure.filter(entry => !entry.startsWith(`@UUID[${m[1]}]`)); rows.criticalFailure.push(cond(m, 1, 4)); if (m[6]) rows.criticalFailure.push(cond(m, 6, 9)); }],
    // "On a critical failure, it's also knocked prone and {Immobilized} for 1 round."
    [new RegExp(String.raw`^On a critical failure, (?:a creature|it)(?:'s| is) also knocked prone and ${COND}${DURATION}\.$`),
        (rows, m) => { rows.criticalFailure.push(bare("prone"), cond(m, 1, 4)); }],
    // "On a failure, a creature is also knocked {Prone}."
    [new RegExp(String.raw`^On a failure, (?:a creature|it) is also knocked ${COND}\.$`), (rows, m) => { rows.failure.push(cond(m, 1, 4)); rows.criticalFailure.push(cond(m, 1, 4)); }],
    // "A creature that critically fails is additionally {Deafened} for 10 minutes." / "Enemies that critically fail are {Drained 2}." / "Creatures that critically fail their saves are {Sickened 1}"
    [new RegExp(String.raw`^(?:A creature that|Enemies that|Creatures that|An enemy that) critically fails?(?: (?:its|their) saves?)? (?:is|are) (?:also |additionally )?${COND}${DURATION}\.?$`),
        (rows, m) => { rows.criticalFailure.push(cond(m, 1, 4)); }],
    // "On a critical failure, a creature is also {Blinded} for 1 round" (no period)
    // "A creature that fails the save is also pushed 10 feet away from the kanyas." / "On a failure, the creature is also pushed 60 feet away from the Oliphaunt."
    [/^(?:A creature that fails (?:the|its|this) save|On a failure, the creature) is (?:also )?pushed (\d+) feet away from the [A-Za-z ]+\.?$/, (rows, m, push) => { push.failure = Number(m[1]); push.criticalFailure = Number(m[1]); }],
    // "A creature that fails this save is pulled 15 feet closer to the warden (30 feet on a critical failure)."
    [/^A creature that fails (?:the|its|this) save is pulled (\d+) feet closer to the [A-Za-z ]+ \((\d+) feet on a critical failure\)\.$/,
        (rows, m, push, part) => { part.pull = { failure: Number(m[1]), criticalFailure: Number(m[2]) }; }],
    // "Each creature that begins its turn grabbed or {Immobilized} by these vines takes an additional @Damage[4d6[bludgeoning]] damage, as the vines continue to squeeze …": while the
    // row's hold lasts, the module deals it as the creature's turn starts.
    [new RegExp(String.raw`^Each creature that begins its turn grabbed or ${COND} by these [a-z]+ takes an additional @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage(?:, as [a-z ]+)?\.$`),
        (rows, m) => { for (const degree of ["failure", "criticalFailure"]) {
            const hold = rows[degree].map(entry => /\{(Grabbed|Restrained|Immobilized)\}/.exec(entry)?.[1]).find(Boolean);
            if (!hold) { rows.invalid = true; continue; }
            (rows.extras[degree] ??= []).push({ label: "Squeezed", text: `While ${hold.toLowerCase()} by the vines, it takes ${m[4]} ${m[5]} damage as its turn starts.`, sourceText: m[0],
                whileCondition: hold.toLowerCase(), turnStartDamage: { formula: m[4], type: m[5] }, duration: { mode: "unlimited", sourceText: `while ${hold.toLowerCase()}` } }); } }],
    // "A creature that fails its save is pushed 20 feet away from the herald (or 40 feet on a critical failure)."
    [/^A creature that fails its save is pushed (\d+) feet away from the [A-Za-z ]+ \(or (\d+) feet on a critical failure\)\.$/, (rows, m, push) => { push.failure = Number(m[1]); push.criticalFailure = Number(m[2]); }],
    // "On a critical failure, a creature also takes @Damage[2d8[persistent,fire]] damage." / "On a failure, it also takes @Damage[4d6[persistent,fire]] damage."
    [/^On a (critical failure|failure), (?:a creature|it) (?:also takes|takes an additional) (@Damage\[(?:[^\[\]]|\[[^\]]*\])*\]) damage\.$/,
        (rows, m) => { if (!/\[persistent,/.test(m[2])) return; const entry = `${m[2].replace(/\|[^\]]*\]$/, "]")} damage`; rows.criticalFailure.push(entry); if (m[1] === "failure") rows.failure.push(entry); }],
    // "On a failure, a creature is also dazzled for as long as they take the persistent bleed damage."
    [/^On a failure, a creature is also (deafened|blinded|dazzled|clumsy|enfeebled|sickened|slowed)(?: (\d))? for as long as (?:it takes|they take) the persistent ([a-z]+) damage\.$/,
        (rows, m) => { const entry = `${bare(m[1], m[2] ?? null)} until the persistent ${m[3]} damage ends`; rows.failure.push(entry); rows.criticalFailure.push(entry); }],
    // "Creatures that fail their save become {Immobilized} until they {Escape} (the DC is your spell DC)" / "A creature that fails is {Grabbed} until it Escapes (on a critical failure it is {Restrained} until it Escapes)."
    [new RegExp(String.raw`^(?:Creatures that fail their saves? become|A creature that fails is) ${COND} until (?:they|it) (?:@UUID\[[^\]]+\]\{Escape\}|Escapes?)(?: \(the DC is your spell DC\)| \(on a critical failure it is ${COND} until it Escapes\))?\.?$`),
        (rows, m) => { rows.failure.push(`${condLink(m[1], m[2], m[3])} until it Escapes`); rows.criticalFailure.push(m[4] ? `${condLink(m[4], m[5], m[6])} until it Escapes` : `${condLink(m[1], m[2], m[3])} until it Escapes`); }],
    [/^The (?:Escape DC is your spell DC|@UUID\[[^\]]+\]\{Escape\} DC is your spell DC)\.$/, () => {}]
];
function cond(m, at, durAt) {
    const link = condLink(m[at], m[at + 1], m[at + 2]);
    return m[durAt] ? `${link} for ${m[durAt]} ${m[durAt + 1]}${m[durAt] === "1" ? "" : "s"}` : link;
}

// Lead sentences: {statistic, basic, damage?, failure?/criticalFailure? (conditions), rows?}.
const LEADS = [
    // "<who> take(s) @Damage[…] damage (@Check[reflex|basic] save)" / "… takes 6d12 electricity damage with a basic Reflex save" / "dealing @Damage[…] damage to <who> with a @Check[fortitude|basic] save"
    [new RegExp(String.raw`^.*?\b(?:takes?|dealing|deals?)\s+((?:@Damage\[(?:[^\[\]]|\[[^\]]*\])*\](?:\{[^}]*\})?|\d+d\d+ [a-z]+(?: energy)?)(?: damage)?(?:,? (?:and|plus) (?:@Damage\[(?:[^\[\]]|\[[^\]]*\])*\]|\d+d\d+ [a-z]+) damage)*)(?: damage)?(?: (?:[^.()@]|@Template\[[^\]]*\](?:\{[^}]*\})?)*?)?,? (?:\(|with an? )(?:@Check\[${STATS}\|basic(?:\|[^\]]*)?\]|basic ${STATS})(?: save| saving throw)?\)?(?: (?:[^.@]|@Template\[[^\]]*\](?:\{[^}]*\})?)*)?\.?$`),
        m => ({ damageText: m[1], statistic: (m[2] ?? m[3]).toLowerCase(), basic: true })],
    // "<who> takes @Damage[…] damage and must attempt a @Check[reflex|…] saving throw." (its rows after it)
    [new RegExp(String.raw`^.*?\btakes? (@Damage\[(?:[^\[\]]|\[[^\]]*\])*\]) damage and must attempt (?:an? )?@Check\[${STATS}(?:\|(?!basic)[^\]]*)?\] sav(?:e|ing throw)\.$`),
        m => ({ damageText: m[1], statistic: m[2].toLowerCase(), basic: false })],
    // "<who> must attempt a @Check[will|…] save." / "must attempt a Fortitude save with the following effects." / "… must attempt a Will Save."
    [new RegExp(String.raw`^.*?\bmust attempt (?:an? )?(?:@Check\[${STATS}(?:\|(?!basic)[^\]]*)?\](?:\{[^}]*\})?|${STATS}) [Ss]av(?:e|ing throw)(?: with the following effects)?\.$`),
        m => ({ statistic: (m[1] ?? m[2]).toLowerCase(), basic: false })],
    // "<who> must attempt a Fortitude save; they're {Drained 2} on a failure or {Drained 4} on a critical failure."
    [new RegExp(String.raw`^.*?\bmust attempt an? ${STATS} save; they're ${COND} on a failure or ${COND} on a critical failure\.$`),
        m => ({ statistic: m[1].toLowerCase(), basic: false, failure: [condLink(m[2], m[3], m[4])], criticalFailure: [condLink(m[5], m[6], m[7])] })],
    // "<who> must succeed at a @Check[…] save or be knocked {Prone}." / "… or be sickened 2 (sickened 2 and {Blinded} for 1 round on a critical failure)."
    [new RegExp(String.raw`^.*?\bmust succeed (?:at )?(?:an? )?(?:@Check\[${STATS}(?:\|[^\]]*)?\]|${STATS}) save or be (?:knocked )?(${COND}|(sickened|frightened) (\d))(?: \((?:(?:sickened|frightened) \d and )?${COND}${DURATION} on a critical failure\))?\.$`),
        m => { const fail = m[4] ? condLink(m[4], m[5], m[6]) : bare(m[7], m[8]); return { statistic: (m[1] ?? m[2]).toLowerCase(), basic: false, failure: [fail], criticalFailure: [fail, ...(m[9] ? [cond(m, 9, 12)] : [])] }; }]
];

// GM-only sentences: the card's reminders.
const GM_ONLY = [
    /^Unattended objects automatically critically fail this save\.$/,
    /^This potentially collapses structures with the collapse effect of the @UUID\[[^\]]+\]\{Earthquake\} spell, except there's no chance of falling into a fissure\.?$/,
    /^A creature that descends takes falling damage if this forced movement brings it to the ground\.$/,
    /^The ground in the [a-z]+ is difficult terrain after the [a-z ]+\.$/,
    /^The area becomes greater difficult terrain for (\d+) hours\.$/,
    /^The squares occupied by the [a-z]+ remain disheveled and broken, becoming difficult terrain\.$/,
    /^This smoke lasts for \d+ minutes?\b/,
    // (What the damage does to a destroyed body or object: the GM's, beside the save.)
    /^A creature or vehicle reduced to 0 Hit Points is smashed into fine powder; its gear, passengers, and cargo remain\.$/,
    /^An unattended object in the area is destroyed unless it succeeds at a Fortitude save, regardless of Hardness, or unless it's an artifact or similarly hard to destroy\.$/,
    /^This [a-z]+ automatically destroys any force effect, such as an? [a-z ]+\.$/,
    // (Where the manifestation appears: the GM places it.)
    /^Select [a-z]+ spaces in range and summon an? [A-Za-z-]+ polyp of [A-Za-z ]+ in each of these spaces\.$/,
    // (A Shield spell blocking it, as it blocks Force Barrage's shards: the GM's.)
    /^Like the shards from an? @UUID\[[^\]]+\]\{Force Barrage\}, this can be blocked by the @UUID\[[^\]]+\]\{Shield\} spell\.$/,
    // (Beneficial spells' durations held near the archmage: the GM's, at the start of each caster's turn.)
    /^When the remaining duration of a beneficial spell affecting you or one of your allies would decrease \(usually at the start of the caster's turn\), it doesn't decrease if the subject of the spell is within \d+ feet of the [a-z]+\.$/,
    /^This applies only if the spell's maximum duration was \d+ rounds or longer\.$/,
    // (The caster's own reward for a price they choose to pay: theirs to play.)
    /^If you pay this cost, you lose this memory, [A-Za-z]+ gains this memory, and [A-Za-z]+ whispers a secret into your mind; you can immediately @UUID\[[^\]]+\]\{Recall Knowledge\} on any subject at mythic proficiency\.$/
];
// Sentences that only say where the phase reaches (no rule): the targeting reminder.
const WHERE = /@Template\[[^\]]*\](?:\{[^}]*\})?|\b\d+-foot\b|\bwithin \d+ feet\b/;
const RULE = /\b(?:damage|saves?|must|bonus|penalty|immune|Prone|Escape|pushed|pulled)\b|@UUID\[Compendium\.pf2e\.conditionitems|@Damage|@Check/;
// (The subject that names the area — "Each enemy within a @Template[…] of the rose" — when it does; else the whole sentence.)
const where = sentence => {
    const subject = sentence.split(/ (?:takes?|must|is pushed|is pulled)\b/)[0];
    return whereText(subject !== sentence && WHERE.test(subject) ? subject.replace(/,? (?:to|and)$/, "") : sentence);
};
const whereText = sentence => plainOf(sentence.replace(/@Template\[(?:type:)?(\w+)\|distance:(\d+)[^\]]*\](?:\{([^}]*)\})?/g, (all, type, distance, label) => label || `${distance}-foot ${type}`));

// More leads: a forced move unless the creature saves; a save with its failure stated after it.
const MORE_LEADS = [
    // "Each foe in a @Template[…] is pushed 100 feet away unless it succeeds at a Fortitude save."
    [/^.*?\bis pushed (\d+) feet away unless it succeeds at an? (Fortitude|Reflex|Will) save\.$/, m => ({ statistic: m[2].toLowerCase(), basic: false, push: { failure: Number(m[1]), criticalFailure: Number(m[1]) } })],
    // "Each foe in a @Template[…] is pulled 50 feet toward the center, unless it succeeds at a Fortitude save."
    [/^.*?\bis pulled (\d+) feet toward the center, unless it succeeds at an? (Fortitude|Reflex|Will) save\.$/, m => ({ statistic: m[2].toLowerCase(), basic: false, pull: { failure: Number(m[1]), criticalFailure: Number(m[1]) } })],
    // "… requiring all foes within 60 feet who can hear him to attempt a Will save, leaving them {Stunned 3} on a failure"
    [new RegExp(String.raw`^.*?\bto attempt an? (Fortitude|Reflex|Will) save, leaving them ${COND} on a failure\.?$`), m => ({ statistic: m[1].toLowerCase(), basic: false, failure: [condLink(m[2], m[3], m[4])], criticalFailure: [condLink(m[2], m[3], m[4])] })],
    // "… takes @Damage[6d10[sonic]] damage with a basic Reflex save and is also knocked {Prone} on a failed save."
    [new RegExp(String.raw`^.*?\btakes? (@Damage\[(?:[^\[\]]|\[[^\]]*\])*\]) damage with a basic (Fortitude|Reflex|Will) save and is also knocked ${COND} on a failed save\.$`),
        m => ({ damageText: m[1], statistic: m[2].toLowerCase(), basic: true, failure: [condLink(m[3], m[4], m[5])], criticalFailure: [condLink(m[3], m[4], m[5])] })],
    // "… must succeed at a Reflex save or take a –20-foot circumstance penalty to their Speeds until they Escape (or are {Immobilized} until they Escape on a critical failure)."
    [new RegExp(String.raw`^.*?\bmust succeed at an? (Fortitude|Reflex|Will) save or take a [–-](\d+)-foot (circumstance|status) penalty to their Speeds until they Escape \(or are ${COND} until they Escape on a critical failure\)\.$`),
        m => ({ statistic: m[1].toLowerCase(), basic: false, failure: [`speed:${m[2]}:${m[3]}:escape`], criticalFailure: [`${condLink(m[4], m[5], m[6])} until it Escapes`] })]
];
const MORE_RIDERS = [
    // "On a failure, the creature is also {Slowed 1} for 1 round (for 1 minute on a critical failure)"
    [new RegExp(String.raw`^On a failure, the creature is also ${COND} for (\d+) (round|minute)s? \(for (\d+) (round|minute)s? on a critical failure\)\.?$`),
        (rows, m) => { rows.failure.push(cond(m, 1, 4)); rows.criticalFailure.push(`${condLink(m[1], m[2], m[3])} for ${m[6]} ${m[7]}${m[6] === "1" ? "" : "s"}`); }],
    // "Each enemy that fails its save takes a –10-foot status penalty to its Speeds until the herald departs"
    [/^Each enemy that fails its save takes a [–-](\d+)-foot (status|circumstance) penalty to its Speeds until the [a-z]+ departs\.?$/, (rows, m) => { rows.failure.push(`speed:${m[1]}:${m[2]}:depart`); rows.criticalFailure.push(`speed:${m[1]}:${m[2]}:depart`); }],
    // "Enemies who critically fail fall 30 feet into the crevasse, taking falling damage (the sides of the fissure require successful @Check[athletics|dc:15] checks to Climb)"
    [/^Enemies who critically fail fall (\d+) feet into the [a-z]+, taking falling damage \(the sides of the [a-z]+ require successful @Check\[athletics\|dc:(\d+)\] checks to Climb\)\.?$/,
        (rows, m) => { rows.criticalFailure.push(`@Damage[${Number(m[1]) / 2}[bludgeoning]] damage`, bare("prone")); rows.notes.push(`A critically failing creature falls ${m[1]} feet into the crevasse; its sides need a DC ${m[2]} Athletics check to Climb.`); }],
    // "A creature that fails is knocked {Prone} if it's on the ground or descends 40 feet if it's in the air."
    [new RegExp(String.raw`^A creature that fails is knocked ${COND} if it's on the ground or descends (\d+) feet if it's in the air\.$`),
        (rows, m) => { rows.failure.push(condLink(m[1], m[2], m[3])); rows.criticalFailure.push(condLink(m[1], m[2], m[3])); rows.notes.push(`A failing creature in the air descends ${m[4]} feet instead of falling Prone (the GM moves it; falling damage if it reaches the ground).`); }],
    // "Creatures that fail and reach the center take @Damage[10d6[bludgeoning]] damage"
    [/^Creatures that fail and reach the center take (@Damage\[(?:[^\[\]]|\[[^\]]*\])*\]) damage\.?$/, (rows, m) => { rows.failure.push(`${m[1]} damage`); rows.criticalFailure.push(`${m[1]} damage`); rows.notes.push("Only a failing creature the pull brings to the center takes the damage (the GM leaves the others' damage out)."); }],
    // "On a failure, they take a –10-foot circumstance penalty to their Speeds and @Damage[2d6[bleed]] damage." / "On a critical failure they take a –20-foot … and @Damage[4d6[bleed]] damage."
    // (The penalty a note Effect with PF2e's modifier, removed when the creature's persistent bleed damage ends.)
    [/^On a (critical failure|failure),? they take a [–-](\d+)-foot (circumstance|status) penalty to their Speeds and @Damage\[(\d+d\d+)\[bleed\](?:\|[^\]]*)?\] damage\.$/,
        (rows, m) => { const degree = m[1] === "failure" ? "failure" : "criticalFailure"; rows[degree].push(`@Damage[${m[4]}[persistent,bleed]] damage`);
            (rows.extras[degree] ??= []).push({ label: "Speed penalty", text: `A –${m[2]}-foot ${m[3]} penalty to its Speeds until it recovers from its persistent bleed damage.`, sourceText: m[0],
                rules: [{ key: "FlatModifier", selector: "all-speeds", type: m[3], value: -Number(m[2]) }], whilePersistent: "bleed", duration: { mode: "unlimited", sourceText: "until they recover from their persistent bleed damage" } }); }],
    [/^This penalty to Speeds lasts until they recover from their persistent bleed damage\.?$/, () => {}],
    // "Creatures that fail this save are pushed 30 feet away from the green man and are knocked {Prone}."
    [new RegExp(String.raw`^Creatures that fail this save are pushed (\d+) feet away from the [A-Za-z ]+ and are knocked ${COND}\.$`),
        (rows, m, push) => { push.failure = Number(m[1]); push.criticalFailure = Number(m[1]); rows.failure.push(condLink(m[2], m[3], m[4])); rows.criticalFailure.push(condLink(m[2], m[3], m[4])); }],
    // "A metal creature that fails its save also takes @Damage[2d8[persistent,slashing]] damage. A non-metal creature that fails this save is also {Sickened 2}." (by trait: GM notes on the rows)
    [/^A ([a-z]+) creature that fails its save also takes (@Damage\[(?:[^\[\]]|\[[^\]]*\])*\]) damage\.$/, (rows, m) => { rows.notes.push(`A failing ${m[1]} creature also takes ${plainOf(m[2])} damage (the GM's correction for that creature).`); }],
    [new RegExp(String.raw`^A non-([a-z]+) creature that fails this save is also ${COND}\.$`), (rows, m) => { rows.failure.push(condLink(m[2], m[3], m[4])); rows.criticalFailure.push(condLink(m[2], m[3], m[4])); rows.notes.push(`A ${m[1]} creature isn't ${m[3]} (the GM removes it).`); }],
    // "On a failure, the creature is {Stupefied 2} for 1 round, and if they're currently benefiting from any spells of a lower rank than incarnate archmage, the archmage can
    // choose any one of them and end the spell.": the condition, and the GM's pick of a spell to end beside it.
    [new RegExp(String.raw`^On a failure, the creature is ${COND}${DURATION}, and if they're currently benefiting from any spells of a lower rank than [a-z ]+, the [a-z]+ can choose any one of them and end the spell\.$`),
        (rows, m) => { rows.failure.push(cond(m, 1, 4)); rows.criticalFailure.push(cond(m, 1, 4)); rows.notes.push("A failing creature benefiting from a spell of a lower rank than this one: the caster picks one of those spells and the GM ends it."); }],
    // "The creature is {Frightened 2} ({Frightened 4} on a critical failure) and {Slowed 1} while they are frightened."
    [new RegExp(String.raw`^The creature is ${COND} \(${COND} on a critical failure\) and ${COND} while (?:they are|it is|it's) ([a-z]+)\.$`),
        (rows, m) => { const linked = `${condLink(m[7], m[8], m[9])} while it's ${m[10]}`; rows.failure.push(condLink(m[1], m[2], m[3]), linked); rows.criticalFailure.push(condLink(m[4], m[5], m[6]), linked); }],
    // "If a creature fails its save, it is shunted into the future, vanishing now but automatically reappearing in the same location after [[/gmr 1d4 #rounds]]{1d4 rounds}. A creature can
    // attempt an additional Will save at the end of each of its turns to end the duration." (and what that means, to the end): a note Effect for the rolled rounds, its end-of-turn save
    // ending it early; the GM hides the token while it's gone.
    [/^If a creature fails its save, it is shunted into the future, vanishing now but automatically reappearing in the same location after \[\[\/gmr (\d+d\d+) #rounds\]\]\{\1 rounds\}\.$/,
        (rows, m, push, part, rest) => {
            const again = /^A creature can attempt an additional (Fortitude|Reflex|Will) save at the end of each of its turns to end the duration\.?$/.exec(String(rest[0] ?? "").trim());
            if (!again) return;
            const text = [`Shunted into the future: it vanishes now (the GM hides its token) and reappears in the same location after ${m[1]} rounds.`, ...rest.slice(1).map(sentence => plainOf(sentence))].join(" ");
            const note = { label: "Shunted into the future", text: text.slice(0, 1000), sourceText: `${m[0]} ${String(rest[0]).trim()}`, gmPlays: true,
                duration: { mode: "fixed", value: null, valueRoll: m[1], unit: "rounds", expiry: "turn-end", anchor: "effect-start", sourceText: `${m[1]} rounds` },
                recurringSave: { timing: "turn-end", mode: "end", statistic: again[1].toLowerCase() } };
            for (const degree of ["failure", "criticalFailure"]) (rows.extras[degree] ??= []).push(structuredClone(note));
            part.consumeRest = true;
        }],
    // "If a creature fails its save, until the end of its next turn, any time it rolls above 10 on a d20 for an attack roll, Perception check, saving throw, or skill check, it gets a 10 instead."
    [/^If a creature fails its save, until the end of its next turn, any time it rolls (above|below) (\d+) on a d20 for an attack roll, Perception check, saving throw, or skill check, it gets an? \2 instead\.$/,
        (rows, m) => { for (const degree of ["failure", "criticalFailure"]) (rows.extras[degree] ??= []).push({ label: `d20 ${m[1] === "above" ? "at most" : "at least"} ${m[2]}`, text: plainOf(m[0]).replace(/^If a creature fails its save, /, ""),
            sourceText: m[0], d20Clamp: { [m[1] === "above" ? "max" : "min"]: Number(m[2]), types: ["attack-roll", "perception-check", "saving-throw", "skill-check"] },
            duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its next turn" } }); }],
    // "A creature that fails its save must roll twice and take the lower result on all damage rolls, Perception checks, and saving throws until the end of its next turn."
    [/^A creature that fails its save must roll twice and take the lower result on all damage rolls, Perception checks, and saving throws until the end of its next turn\.$/,
        (rows, m) => { for (const degree of ["failure", "criticalFailure"]) (rows.extras[degree] ??= []).push({ label: "Misfortune", text: plainOf(m[0]).replace(/^A creature that fails its save must/, "It must"), sourceText: m[0],
            rules: [{ key: "RollTwice", selector: ["damage", "perception", "saving-throw"], keep: "lower" }],
            duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its next turn" } }); }],
    // "On a critical failure, the creature Strikes a random target within reach or Strides in a random direction.": the GM's, beside the row's damage.
    [/^On a critical failure, the creature (Strikes a random target within reach or Strides in a random direction)\.$/, (rows, m) => {
        (rows.extras.criticalFailure ??= []).push({ label: "Random target", text: `Its triggering action goes astray: it ${m[1].replace(/^Strikes/, "Strikes").toLowerCase()} (the GM picks).`, sourceText: m[0], gmPlays: true,
            duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 0, sourceText: "this action" } }); }],
    // "On a critical success, the creature becomes temporarily immune for 1 round.": the card refuses it for that long.
    [/^On a critical success, the creature becomes temporarily immune for (\d+) rounds?\.$/, (rows, m, push, part) => { part.immunityRounds = Number(m[1]); }],
    // "A skeleton or other undead foe made almost entirely of bones treats their result as one degree of success worse than they rolled.": the GM's per-creature question.
    [/^A ([a-z]+) or other ([a-z]+) foe made almost entirely of ([a-z]+) treats their result as one degree of success worse than they rolled\.$/,
        (rows, m, push, part) => { part.intro.push(`A creature that's a ${m[1]} or another ${m[2]} made almost entirely of ${m[3]} uses the outcome one degree of success worse than the result of its saving throw.`); }],
    // "Any of your enemies that Casts a Spell within 60 feet of Vorgozen must attempt a Fortitude save with the same effects unless it's already sickened.": the same save again, each time.
    [/^Any of your enemies that (.+?) must attempt an? (Fortitude|Reflex|Will) save with the same effects(?: unless (it's already [a-z]+))?\.$/, (rows, m, push, part) => {
        if (m[2].toLowerCase() === part.lead.statistic) part.repeat = { trigger: `an enemy ${m[1].replace(/^Casts/, "Casts")}`, unless: m[3] ?? null };
        else part.repeat = { invalid: true }; }],
    // "The dragons choose the damage type of each blast of energy depending on the tradition of dragons summoned." and the list after it.
    [/^The [a-z]+ choose the damage type of each blast of energy depending on the tradition of [a-z]+ summoned\.$/, (rows, m, push, part) => { part.typeChoice = { byTradition: null, sourceText: m[0] }; }],
    [/^((?:(?:and )?(?:arcane|divine|occult|primal) dragons can choose @Damage\[[^\]]*\[[a-z]+\][^\]]*\]\{[a-z]+\} or @Damage\[[^\]]*\[[a-z]+\][^\]]*\]\{[a-z]+\}(?:, )?)+)\.$/i, (rows, m, push, part) => {
        if (!part.typeChoice) return;
        part.typeChoice.byTradition = Object.fromEntries([...m[1].matchAll(/(arcane|divine|occult|primal) dragons can choose @Damage\[[^\]]*\[([a-z]+)\][^\]]*\]\{\2\} or @Damage\[[^\]]*\[([a-z]+)\][^\]]*\]\{\3\}/gi)]
            .map(entry => [entry[1].toLowerCase(), [entry[2], entry[3]]])); }]
];

// A row's own rules ("The creature takes 6d12 mental damage and is {Frightened 3}.", "… is {Sickened 4}, {Stunned 1}, and deafened for the duration.",
// "The creature takes full damage and is {Grabbed} by a vine for the duration of the spell or until they Escape."): {entries, multiplier, notes}, or null.
// A duration belongs to the condition it follows ("Sickened 3 and Deafened for the duration": Sickened recovers on its own).
const BARE = /^(deafened|blinded|dazzled|fleeing|confused|prone|slowed|stunned|sickened|frightened|clumsy|enfeebled|drained|stupefied|off-guard)(?: (\d))?/;
const ROW_DURATION = /^ (for (\d+) (round|minute|hour)s?|for the duration(?: of the spell)?|until (?:it|they) Escapes?|until the end of (?:your|its) next turn)/;
const SPELL_END = " until the end of your next turn";
const untilSpellEnds = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 1, sourceText: "for the duration of the spell" };
function rowEntries(text, previous = {}) {
    let rest = String(text).replace(/\s+/g, " ").trim().replace(/\.$/, "");
    const row = { entries: [], multiplier: null, notes: [] };
    // "As success, and the creature …" / "As failure, and …": the earlier row's rules, then this row's own.
    const as = /^As (success|failure), and (?:the creature )?/.exec(rest);
    if (as) {
        const prior = previous[as[1]];
        if (!prior) return null;
        row.entries.push(...prior.entries); row.notes.push(...prior.notes); row.multiplier = prior.multiplier;
        rest = rest.slice(as[0].length);
    } else rest = rest.replace(/^The (?:creature|target) /, "");
    if (/^is unaffected$/.test(rest)) return row;
    const span = duration => !duration ? "" : /^for (\d+) (round|minute|hour)s?$/.test(duration) ? ` ${duration.replace(/^for (1) (round|minute|hour)s$/, "for $1 $2")}`
        : /Escape/.test(duration) ? " until it Escapes" : SPELL_END;
    while (rest) {
        let m;
        if ((m = /^(?:,? and |, )/.exec(rest))) { rest = rest.slice(m[0].length); continue; }
        if ((m = /^(?:also )?takes (no|half|full|double) damage/.exec(rest))) { row.multiplier = { no: 0, half: 0.5, full: 1, double: 2 }[m[1]]; rest = rest.slice(m[0].length); continue; }
        if ((m = /^(?:also )?takes (@Damage\[(?:[^\[\]]|\[[^\]]*\])*\]|(\d+d\d+) ([a-z]+)) damage/.exec(rest))) {
            row.entries.push(m[2] ? `@Damage[${m[2]}[${m[3]}]] damage` : `${m[1].replace(/\|[^\]]*\]$/, "]")} damage`); rest = rest.slice(m[0].length); continue;
        }
        // "kneels, dropping {Prone} as a free action" / "bows its head, becoming {Dazzled} for the duration of the spell"
        if ((m = new RegExp(String.raw`^(?:also )?(?:kneels, dropping|bows its head, becoming) ${COND}(?: as a free action)?`).exec(rest))) {
            const after = ROW_DURATION.exec(rest.slice(m[0].length));
            row.entries.push(`${condLink(m[1], m[2], m[3])}${span(after?.[1])}`); rest = rest.slice(m[0].length + (after?.[0].length ?? 0)); continue;
        }
        // "is {Grabbed} by a vine for the duration of the spell or until they [[/act escape]]": held until it Escapes (or the spell ends).
        if ((m = new RegExp(String.raw`^(?:is |becomes )?(?:also )?${COND} by an? [a-z]+ for the duration of the spell or until (?:they|it) (?:\[\[/act escape\]\]|Escapes?)`).exec(rest))) {
            row.entries.push(`${condLink(m[1], m[2], m[3])} until it Escapes`); row.notes.push({ kind: "spell-end-hold", condition: m[2] }); rest = rest.slice(m[0].length); continue;
        }
        // "can't Stand for the duration of the spell": the GM's (a note on the creature until the spell ends).
        if ((m = /^(?:also )?can't Stand for the duration of the spell/.exec(rest))) { row.notes.push({ kind: "note", label: "Can't Stand", text: "It can't Stand until the spell ends.", sourceText: m[0] }); rest = rest.slice(m[0].length); continue; }
        if ((m = new RegExp(String.raw`^(?:is |becomes |are )?(?:also )?(?:knocked )?(?:${COND}|${BARE.source.slice(1)})`).exec(rest))) {
            const after = ROW_DURATION.exec(rest.slice(m[0].length));
            const link = m[1] ? condLink(m[1], m[2], m[3]) : bare(m[4], m[5] ?? null);
            row.entries.push(`${link}${span(after?.[1])}`); rest = rest.slice(m[0].length + (after?.[0].length ?? 0)); continue;
        }
        return null;
    }
    return row;
}

// A phase's lingering cloud ("… in a @Template[burst|distance:100] … and remains for 1 minute. This mist has the effects of {Mist}, plus any creature within the area at the end of
// its turn takes 5d6 cold damage (basic Fortitude save)." / "… every square in a @Template[emanation|distance:20] is choked with burning ash and smog, making all creatures outside the
// smoke {Concealed} to creatures within it and … This smoke lasts for 1 minute, and a creature who enters or begins its turn within the smoke must attempt a Fortitude save or take
// 2d6 persistent fire damage and become sickened 1 (3d6 persistent fire damage and sickened 2 on a critical failure)."): the cloud as a small spell the lingering-area route reads.
const DMG = String.raw`@Damage\[(?:[^\[\]]|\[[^\]]*\])*\]`;
const MIST_CLOUD = /^.*? in an? @Template\[(?:type:)?(burst|emanation)\|distance:(\d+)\][^.@]*? and remains for (\d+) minutes?\.$/;
const MIST_TURN = new RegExp(String.raw`^This [a-z]+ has the effects of (@UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{Mist\}), plus any creature within the area at the (end|start) of its turn takes (${DMG}) damage \(basic (Fortitude|Reflex|Will) save\)\.$`);
const SMOKE_CLOUD = new RegExp(String.raw`^(?:The [a-z']+ space and )?every square in an? @Template\[(?:type:)?(burst|emanation)\|distance:(\d+)\] is choked with [a-z ,]+, making all creatures outside the ([a-z]+) ${COND} to creatures within it and all creatures within the \3 concealed to creatures outside the \3 and other creatures within it\.$`);
const SMOKE_SAVE = new RegExp(String.raw`^This ([a-z]+) lasts for (\d+) minutes?, and a creature who enters or begins its turn within the \1 must attempt an? (?:@Check\[(fortitude|reflex|will)(?:\|(?!basic)[^\]]*)?\]|(Fortitude|Reflex|Will)) save or take (${DMG}) damage and become (sickened|frightened|enfeebled|clumsy|drained) (\d) \((${DMG}) damage and \6 (\d) on a critical failure\)\.$`);
// "… spreading a thick cloud of smoke in a @Template[emanation|distance:10]. All creatures within the smoke are {Concealed}. Unholy creatures within the smoke are {Enfeebled 2},
// and holy creatures within the smoke gain the effects of truesight and ignore the concealment granted by the smoke.": a concealing cloud whose insiders of one trait get the
// condition and of the other truesight. (No duration is given: 1 minute, as Unholy Army's own smoke — the GM can end it sooner in Ongoing spells.)
const PLAIN_CLOUD = /^.*?\bspreading an? [a-z ]+ in an? @Template\[(?:type:)?(burst|emanation)\|distance:(\d+)\]\.$/;
const CLOUD_CONCEALS = new RegExp(String.raw`^All creatures within the ([a-z]+) are ${COND}\.$`);
const CLOUD_TRAITS = new RegExp(String.raw`^([A-Z][a-z]+) creatures within the ([a-z]+) are ${COND}, and ([a-z]+) creatures within the \2 gain the effects of truesight and ignore the concealment granted by the \2\.$`);
function readCloud(sentences) {
    for (const [at, sentence] of sentences.entries()) {
        const plainCloud = PLAIN_CLOUD.exec(sentence), conceals = CLOUD_CONCEALS.exec(sentences[at + 1] ?? ""), traits = CLOUD_TRAITS.exec(sentences[at + 2] ?? "");
        if (plainCloud && conceals && traits && conceals[3] === "Concealed") {
            const [, harmed, , uuid, name, value, helped] = traits;
            return { consumed: [sentence, sentences[at + 1], sentences[at + 2]], part: { kind: "cloud", area: { type: plainCloud[1], value: Number(plainCloud[2]) }, durationSeconds: 60,
                memberRules: [{ key: "GrantItem", uuid, flag: `condition${name}`, allowDuplicate: true, onDeleteActions: { grantee: "restrict" }, predicate: [`self:trait:${harmed.toLowerCase()}`],
                    ...(value ? { alterations: [{ mode: "override", property: "badge-value", value: Number(value) }] } : {}) },
                    { key: "Sense", selector: "truesight", predicate: [`self:trait:${helped}`] }],
                notes: [`${harmed} creatures inside are ${name}${value ? ` ${value}` : ""}; ${helped} creatures inside have truesight and ignore the smoke's concealment (the module grants both by trait).`,
                    "The text gives the smoke no duration: it lasts 1 minute here (as Unholy Army's smoke); end it sooner in Ongoing spells if you rule otherwise."],
                sourceText: plainOf(`${sentence} ${sentences[at + 1]} ${sentences[at + 2]}`) } };
        }
        const next = sentences[at + 1] ?? "";
        const mist = MIST_CLOUD.exec(sentence), turn = MIST_TURN.exec(next);
        if (mist && turn) {
            const damage = damageEntries(turn[3]);
            if (!damage?.length || damage.length !== 1) return null;
            return { consumed: [sentence, next], part: { kind: "linger", area: { type: mist[1], value: Number(mist[2]) }, minutes: Number(mist[3]), statistic: turn[4].toLowerCase(), basic: true, damage,
                html: `<p>You conjure a cloud. This functions as ${turn[1]}. You deal ${damage[0][0]} ${damage[0][1]} damage to each creature that ${turn[2] === "end" ? "ends" : "starts"} its turn in the spell's area.</p>`,
                sourceText: plainOf(`${sentence} ${next}`) } };
        }
        const smoke = SMOKE_CLOUD.exec(sentence), save = SMOKE_SAVE.exec(next);
        if (smoke && save) {
            const failure = damageEntries(save[5]), critical = damageEntries(save[8]);
            if (failure?.length !== 1 || critical?.length !== 1 || failure[0][2] !== "persistent" || critical[0][2] !== "persistent") return null;
            const condition = save[6], uuid = `Compendium.pf2e.conditionitems.Item.${CONDITION_UUIDS[condition]}`;
            const statistic = (save[3] ?? save[5]).toLowerCase(), Statistic = `${statistic[0].toUpperCase()}${statistic.slice(1)}`;
            const persistent = entry => `@Damage[${entry[0]}[persistent,${entry[1]}]]`;
            const name = `${condition[0].toUpperCase()}${condition.slice(1)}`;
            return { consumed: [sentence, next], part: { kind: "linger", area: { type: smoke[1], value: Number(smoke[2]) }, minutes: Number(save[2]), statistic, basic: false, damage: [],
                html: `<p>You conjure a cloud of ${save[1]}. All creatures within the area become concealed, and all creatures outside the area become concealed to creatures within it. `
                    + `Whenever a creature starts its turn in the cloud or the first time a creature enters the cloud each round, it must attempt a ${Statistic} save.</p><hr />`
                    + `<p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
                    + `<p><strong>Failure</strong> The target takes ${persistent(failure[0])} damage and becomes ${condLink(uuid, name, save[7])}.</p>`
                    + `<p><strong>Critical Failure</strong> The target takes ${persistent(critical[0])} damage and becomes ${condLink(uuid, name, save[9])}.</p>`,
                sourceText: plainOf(`${sentence} ${next}`) } };
        }
    }
    return null;
}

const D20_TYPES = ["attack-roll", "perception-check", "saving-throw", "skill-check"];
function readEffectSentence(sentence, next) {
    let m;
    if ((m = /^While within (\d+) feet of the ([a-z]+), you and your allies who roll (below|above) (\d+) on a d20 for an attack roll, Perception check, saving throw, or skill check get an? \4 instead\.$/.exec(sentence)))
        return { part: { kind: "effect", label: `d20 ${m[3] === "below" ? "at least" : "at most"} ${m[4]}`, who: `you and your allies within ${m[1]} feet of the ${m[2]}`,
            text: `${plainOf(sentence)} (Only while within ${m[1]} feet of the ${m[2]}: the GM removes this from a creature that moves away.)`, sourceText: plainOf(sentence),
            d20Clamp: { [m[3] === "below" ? "min" : "max"]: Number(m[4]), types: [...D20_TYPES] }, duration: { ...untilSpellEnds } } };
    if ((m = /^While within (\d+) feet of the ([a-z]+), you and your allies roll twice and take the (higher|lower) roll on all damage rolls, Perception checks, and saving throws\.$/.exec(sentence)))
        return { part: { kind: "effect", label: m[3] === "higher" ? "Fortune" : "Misfortune", who: `you and your allies within ${m[1]} feet of the ${m[2]}`,
            text: `${plainOf(sentence)} (Only while within ${m[1]} feet of the ${m[2]}: the GM removes this from a creature that moves away.)`, sourceText: plainOf(sentence),
            rules: [{ key: "RollTwice", selector: ["damage", "perception", "saving-throw"], keep: m[3] }], duration: { ...untilSpellEnds } } };
    if ((m = new RegExp(String.raw`^You and each ally within (\d+) feet of the ([a-z]+) are ${COND} while the \2 is present and can use the additional action to (.+)\.$`).exec(sentence)))
        return { part: { kind: "effect", label: m[4], who: `you and each ally within ${m[1]} feet of the ${m[2]}`, text: `${m[4]} while the ${m[2]} is present; the extra action can be used only to ${m[6]}.`,
            sourceText: plainOf(sentence), grants: [{ uuid: m[3], slug: m[4].toLowerCase(), value: m[5] ? Number(m[5]) : null }], duration: { ...untilSpellEnds } } };
    if ((m = new RegExp(String.raw`^The foes become ${COND} and (off-guard), and if they were ${COND}, they become ${COND} instead\.$`).exec(sentence))
        && /^These effects last until the [A-Za-z ]+ departs\.$/.test(String(next).trim()))
        return { consumesNext: true, part: { kind: "effect", label: `${m[2]} and off-guard`, who: "the foes it reveals",
            text: `${m[2]} and off-guard until it departs (the end of your next turn); if it was ${m[6]}, it's ${m[9]} instead (the module adds ${m[9]}; the GM treats the creature as no longer ${m[6]}).`,
            sourceText: plainOf(`${sentence} ${next}`),
            grants: [{ uuid: m[1], slug: m[2].toLowerCase(), value: null }, { uuid: `Compendium.pf2e.conditionitems.Item.${CONDITION_UUIDS["off-guard"]}`, slug: "off-guard", value: null },
                { uuid: m[8], slug: m[9].toLowerCase(), value: null, predicate: [`self:condition:${m[6].toLowerCase()}`] }], duration: { ...untilSpellEnds } } };
    return null;
}
function readCastSentence(sentence, next) {
    let m;
    if ((m = new RegExp(String.raw`^The [a-z]+ casts an? (\d+)(?:st|nd|rd|th)-rank ${SPELL_LINK} that has an? @Template\[(?:type:)?([a-z]+)\|distance:(\d+)\] instead of the usual range and area\.$`).exec(sentence)))
        return { parts: [{ kind: "cast-spell", uuid: m[2], name: m[3], rank: Number(m[1]), area: { type: m[4], value: Number(m[5]) }, who: `the creatures in a ${m[5]}-foot ${m[4]}`, sourceText: plainOf(sentence) }] };
    if ((m = new RegExp(String.raw`^The [a-z]+ casts ${SPELL_LINK} in an? @Template\[(?:type:)?([a-z]+)\|distance:(\d+)\]\.$`).exec(sentence)))
        return { parts: [{ kind: "cast-spell", uuid: m[1], name: m[2], rank: null, area: { type: m[3], value: Number(m[4]) }, who: `the creatures in a ${m[4]}-foot ${m[3]}`, sourceText: plainOf(sentence) }] };
    if ((m = new RegExp(String.raw`^The [a-z]+ casts the (\d)-action version of an? (\d+)(?:st|nd|rd|th)-rank ${SPELL_LINK} with a radius of (\d+) feet\.$`).exec(sentence))
        && /^This spell targets only you and your allies\.$/.test(String(next).trim()))
        return { consumesNext: true, parts: [{ kind: "cast-spell", uuid: m[3], name: m[4], rank: Number(m[2]), actions: Number(m[1]), alliesOnly: true, area: { type: "emanation", value: Number(m[5]) },
            who: `you and your allies within ${m[5]} feet`, sourceText: plainOf(`${sentence} ${next}`) }] };
    if ((m = new RegExp(String.raw`^The [a-z]+ affects you and (?:all )?your allies within (?:@Template\[[^\]]*\]\{(\d+) feet\}|(\d+) feet) with (?:an? )?${SPELL_LINK} and (?:an? )?${SPELL_LINK}\.$`).exec(sentence))) {
        const shorter = /^The duration for both spells is reduced to (\d+) rounds(?:, but (.+))?\.$/.exec(String(next).trim());
        if (!shorter) return null;
        const feet = m[1] ?? m[2];
        const exception = shorter[2] ? plainOf(shorter[2]) : null;
        return { consumesNext: true, parts: [[m[3], m[4]], [m[5], m[6]]].map(([uuid, name]) => ({ kind: "cast-spell", uuid, name, rank: null, alliesOnly: true, durationRounds: Number(shorter[1]),
            who: `you and your allies within ${feet} feet`, exception: exception && new RegExp(`\\b${name.toLowerCase()}\\b`).test(exception.toLowerCase()) ? exception : null,
            sourceText: plainOf(`${sentence} ${next}`) })) };
    }
    return null;
}

/** Reads one phase's text into {parts: [...], reminders, unread}. */
export function readPhase(text, { linkedEffect = null } = {}) {
    // Explicit degree rows after the lead ("… must attempt a Will save. Critical Success The creature is unaffected. Success …"): read as the save's rows.
    const rowsAt = String(text).search(/\bCritical Success The creature\b/);
    if (rowsAt > 0) {
        const lead = String(text).slice(0, rowsAt);
        const table = String(text).slice(rowsAt);
        // (Split on the four headings, longest first, so "Success" isn't read inside "Critical Success".)
        const pieces = table.split(/(?:^|\s)(Critical Success|Critical Failure|Success|Failure) (?=The creature\b|As (?:success|failure)\b)/).filter(piece => piece.trim());
        const byHeading = {};
        for (let at = 0; at + 1 < pieces.length; at += 2) byHeading[pieces[at]] = pieces[at + 1].trim();
        const read = readPhase(lead, { linkedEffect });
        const save = read.parts.find(part => part.kind === "save" && !part.lead.basic);
        const parsed = { criticalSuccess: rowEntries(byHeading["Critical Success"] ?? "") };
        for (const [key, heading] of [["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) parsed[key] = byHeading[heading] ? rowEntries(byHeading[heading], parsed) : null;
        const multipliers = ["criticalSuccess", "success", "failure", "criticalFailure"].map(key => parsed[key]?.multiplier ?? null);
        // (A damaging save whose rows state none, half, full and double damage is a basic save with the rows' riders.)
        const basic = save?.lead.damageText && JSON.stringify(multipliers) === "[0,0.5,1,2]";
        if (save && read.parts.filter(part => part.kind === "save").length === 1 && Object.values(parsed).every(row => row !== null) && parsed.criticalSuccess.entries.length === 0 && !parsed.criticalSuccess.notes.length
            && (basic || (!save.lead.damageText && multipliers.every(value => value === null)))) {
            if (basic) save.lead.basic = true;
            for (const key of ["success", "failure", "criticalFailure"]) {
                save.rows[key] = parsed[key].entries;
                for (const note of parsed[key].notes) {
                    if (note.kind === "note") (save.rows.extras[key] ??= []).push({ label: note.label, text: note.text, sourceText: note.sourceText, gmPlays: true, duration: { ...untilSpellEnds } });
                    else if (note.kind === "spell-end-hold" && !save.rows.notes.includes(`The ${note.condition} ends when the spell does (the end of your next turn), if it hasn't Escaped.`))
                        save.rows.notes.push(`The ${note.condition} ends when the spell does (the end of your next turn), if it hasn't Escaped.`);
                }
            }
            return read;
        }
        return { parts: [], reminders: [], unread: [plainOf(table)] };
    }
    let source = String(text).replace(/\s+/g, " ").trim()
        // ("… gain a +1 circumstance bonus …, and enemies must succeed a … save": two sentences.)
        .replace(/, and (enemies|all enemies|each enemy) must /g, (all, who) => `. ${who[0].toUpperCase()}${who.slice(1)} must `)
        // ("@Damage[…] damage from the slamming rains and @Damage[…] damage from the falling hail with a basic Fortitude save")
        .replace(/ damage from the [a-z ]+?(?= and @Damage| with an? )/g, " damage")
        // ("dealing all enemy creatures in a @Template[…] @Damage[…] damage (basic Reflex save)")
        .replace(new RegExp(String.raw`\bdealing ((?:all |each )?(?:enemy )?creatures in an? @Template\[[^\]]*\]) (${DMG}) damage`, "g"), "dealing $2 damage to $1")
        // ("…, dealing X damage with a basic Reflex save, and a powerful divine blast at one ally, healing 5d12 Hit Points.")
        .replace(/, and an? [a-z ]+ at (one ally|up to \d+ allies), healing (\d+d\d+(?:\+\d+)?) Hit Points\./g, (all, who, dice) => `. ${who[0].toUpperCase()}${who.slice(1)} regains ${dice} Hit Points.`);
    // (A critical success's ladder of semicolons is one sentence; any other "; on a failure" starts its own.)
    const sentences = source.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean)
        .flatMap(sentence => /^On a critical success, they're unaffected;/.test(sentence) ? [sentence] : sentence.split(/;\s+(?=on a (?:success|failure|critical))/));
    const parts = [], reminders = [], unread = [];
    const cloud = readCloud(sentences.map(sentence => sentence.trim().replace(/\.?$/, ".")));
    if (cloud) parts.push(cloud.part);
    let part = null;
    const leads = [...LEADS, ...MORE_LEADS], riders = [...RIDERS, ...MORE_RIDERS];
    for (const [index, raw] of sentences.entries()) {
        if (!sentences[index]) continue;
        const sentence = raw.trim().replace(/\s+/g, " ").replace(/\.?$/, ".");
        if (cloud?.consumed.includes(sentence)) continue;
        // A save lead (a second one starts a second save part: "In addition, everyone in a … must attempt …").
        const found = leads.map(([pattern, read]) => { const m = pattern.exec(sentence.replace(/^In addition, /, "")); return m ? read(m) : null; }).find(Boolean);
        if (found) {
            part = { kind: "save", lead: found, rows: { success: [...(found.success ?? [])], failure: [...(found.failure ?? [])], criticalFailure: [...(found.criticalFailure ?? [])], notes: [], extras: {} },
                push: { ...(found.push ?? {}) }, pull: found.pull ?? null, intro: [],
                where: WHERE.test(sentence) || /\b(?:who|that) (?:failed|fail|are|is|have)\b|\bnon-[a-z]+s?\b|\bstill\b|\bfrightened foe\b/.test(sentence.split(/ (?:takes?|must|is pushed|is pulled) /)[0]) ? where(sentence) : null };
            // ("Each time an enemy within 40 feet of the warden attempts a Strike or Stride action, it takes …": the save again each time the GM reports it.)
            const each = /^Each time (an? [^,]+?), it takes\b/.exec(sentence);
            if (each) part.repeat = { trigger: each[1], unless: null };
            // ("If the warden is summoned in a body of water, it creates …" / "If the warden is summoned outside of a body of water, …": one of the two, the GM's pick.)
            const alternative = /^If the [a-z]+ is summoned ((?:in|outside of) [^,]+), /.exec(sentence);
            if (alternative) part.alternative = `if summoned ${alternative[1]}`;
            parts.push(part);
            continue;
        }
        if (part) {
            const rider = riders.find(([pattern]) => pattern.test(sentence));
            if (rider) { rider[1](part.rows, rider[0].exec(sentence), part.push, part, sentences.slice(index + 1)); if (part.consumeRest) break; continue; }
            const both = new RegExp(String.raw`^On a failure, (?:they're|it's|a creature is) ${COND}${DURATION}, and on a critical failure, (?:they're|it's|a creature is) ${COND}(?: and ${COND})?${DURATION}\.$`).exec(sentence);
            if (both) { part.rows.failure.push(cond(both, 1, 4)); part.rows.criticalFailure.push(condLink(both[6], both[7], both[8]) + (both[12] && !both[9] ? ` for ${both[12]} ${both[13]}${both[12] === "1" ? "" : "s"}` : ""), ...(both[9] ? [cond(both, 9, 12)] : [])); continue; }
            const pair = new RegExp(String.raw`^On a failure, (?:they're|it's|a creature is) ${COND} and ${COND}${DURATION} \(${COND} and [a-z]+ for (\d+) (round|minute)s? on a critical failure\); this effect has the [a-z, ]+ traits\.$`).exec(sentence);
            if (pair) { part.rows.failure.push(condLink(pair[1], pair[2], pair[3]), cond(pair, 4, 7)); part.rows.criticalFailure.push(condLink(pair[9], pair[10], pair[11]), `${condLink(pair[4], pair[5], pair[6])} for ${pair[12]} ${pair[13]}${pair[12] === "1" ? "" : "s"}`); continue; }
            const ladder = new RegExp(String.raw`^On a critical success, they're unaffected; on a success, they're ${COND}${DURATION}; on a failure,? they're ${COND}${DURATION}; and on a critical failure, they're ${COND}(?: and ${COND})?${DURATION}\.?$`).exec(sentence);
            if (ladder) { part.rows.success.push(cond(ladder, 1, 4)); part.rows.failure.push(cond(ladder, 6, 9)); part.rows.criticalFailure.push(condLink(ladder[11], ladder[12], ladder[13]) + (ladder[17] && !ladder[14] ? ` for ${ladder[17]} ${ladder[18]}${ladder[17] === "1" ? "" : "s"}` : ""), ...(ladder[14] ? [cond(ladder, 14, 17)] : [])); continue; }
        }
        // Spell attacks against several targets, each its own roll ("Attempt spell attack rolls against up to 6 different targets within 300 feet." with "On a hit, the target takes
        // @Damage[10d8[piercing]] damage, double on a critical hit, half on a failure, and none on a critical failure."): a spell attack's own rows.
        const attack = /^Attempt spell attack rolls against up to (\d+) different targets within (\d+) feet\.$/.exec(sentence);
        const hit = attack && new RegExp(String.raw`^On a hit, the target takes (${DMG}) damage, double on a critical hit, half on a failure, and none on a critical failure\.$`).exec(String(sentences[index + 1] ?? "").trim());
        if (hit) {
            const damage = damageEntries(hit[1]);
            if (!damage?.length) { unread.push(plainOf(sentence)); continue; }
            parts.push({ kind: "attack", damage, count: Number(attack[1]), who: `up to ${attack[1]} different targets within ${attack[2]} feet`, multipliers: { criticalSuccess: 2, success: 1, failure: 0.5, criticalFailure: 0 },
                sourceText: plainOf(`${sentence} ${sentences[index + 1]}`) });
            sentences[index + 1] = "";
            part = null;
            continue;
        }
        // Damage with no save on the creatures the GM picks ("All creatures still grabbed or restrained by vines take @Damage[…] damage.", "Any creature with a penalty to Speeds from
        // its initial save automatically takes @Damage[…] damage.", "… automatically dealing 3d4+3 force damage to up to 5 creatures it chooses within 100 feet of it.")
        const direct = new RegExp(String.raw`^((?:All|Any|Each) [^@]+?) (?:automatically )?takes? (${DMG}) damage\.$`).exec(sentence)
            ?? /^.*?\bautomatically dealing (\d+d\d+(?:\+\d+)?) ([a-z]+) damage to (up to (\d+) creatures it chooses within \d+ feet of it)\.$/.exec(sentence);
        if (direct) {
            const damage = direct[2]?.startsWith("@Damage") ? damageEntries(direct[2]) : [[direct[1], direct[2], null]];
            if (!damage?.length) { unread.push(plainOf(sentence)); continue; }
            parts.push({ kind: "damage", damage, who: plainOf(direct[2]?.startsWith("@Damage") ? direct[1] : direct[3]), count: direct[4] ? Number(direct[4]) : null, sourceText: plainOf(sentence) });
            part = null;
            continue;
        }
        // Healing on allies ("Allies in this cone regain @Damage[(4d10+16)[healing]] Hit Points.", "One ally regains 5d12 Hit Points.")
        const heal = new RegExp(String.raw`^((?:All )?[Aa]llies in (?:the|this|that) [a-z]+|One ally|Up to \d+ allies) regains? (${DMG}|\d+d\d+(?:\+\d+)?) Hit Points\.$`).exec(sentence);
        if (heal) {
            const formula = heal[2].startsWith("@Damage") ? damageEntries(heal[2])?.[0]?.[0] : heal[2];
            if (!formula) { unread.push(plainOf(sentence)); continue; }
            parts.push({ kind: "heal", formula, who: plainOf(heal[1]), count: /^One ally$/.test(heal[1]) ? 1 : Number(/\d+/.exec(heal[1])?.[0] ?? 0) || null, sourceText: plainOf(sentence) });
            continue;
        }
        // "You and all allies within 100 feet of the soldiers immediately reduce the value of any {Clumsy}, {Drained}, … conditions by 2 and gain a +2 status bonus to all
        // attacks, saving throws, skill checks, and DCs for 3 rounds.": the reduction on the allies the GM targets, and PF2e's linked Effect for the bonus.
        const reduce = /^You and all allies within (\d+) feet of the [a-z ]+ immediately reduce the value of any ((?:@UUID\[[^\]]+\]\{[A-Z][a-z]+\},? (?:and )?)+)conditions by (\d) and gain (.+)\.$/.exec(sentence);
        if (reduce) {
            const slugs = [...reduce[2].matchAll(/\{([A-Z][a-z]+)\}/g)].map(m => m[1].toLowerCase());
            parts.push({ kind: "reduce-conditions", slugs, by: Number(reduce[3]), label: `Allies within ${reduce[1]} feet: reduce ${slugs.join(", ")} by ${reduce[3]}`, sourceText: plainOf(sentence) });
            if (linkedEffect) parts.push({ kind: "native-effect", uuid: linkedEffect.uuid, label: `Allies: ${linkedEffect.name.replace(/^Spell Effect: /, "")}`, sourceText: plainOf(reduce[4]) });
            else unread.push(plainOf(reduce[4]));
            continue;
        }
        // Allies' benefit: PF2e's linked Effect for this option ("Allies in the emanation gain a +2 status bonus …").
        if (/^(?:All )?[Aa]llies in (?:the|this|that) [a-z]+ (?:gain|regain)\b/.test(sentence)) {
            parts.push(linkedEffect ? { kind: "native-effect", uuid: linkedEffect.uuid, label: `Allies: ${linkedEffect.name.replace(/^Spell Effect: /, "")}`, sourceText: plainOf(sentence) }
                : { kind: "ally-note", sourceText: plainOf(sentence) });
            continue;
        }
        // A generated Effect on the creatures the GM targets, for the rest of the spell ("While within 30 feet of the fate, you and your allies who roll below 10 on a d20 for …
        // get a 10 instead.", "… roll twice and take the higher roll on …", "You and each ally within 100 feet of the herald are {Quickened} while the herald is present and …",
        // "The foes become {Dazzled} and off-guard, and if they were {Invisible}, they become {Concealed} instead." with "These effects last until the Thorn Caller departs.").
        const effect = readEffectSentence(sentence, sentences[index + 1] ?? "");
        if (effect) {
            parts.push(effect.part);
            if (effect.consumesNext) sentences[index + 1] = "";
            continue;
        }
        // A spell the manifestation casts ("The herald casts a 5th-rank {Divine Wrath} that has a @Template[…] instead of the usual range and area", "The warden affects you and
        // all your allies within 60 feet with {Fly} and {Unfettered Movement}. The duration for both spells is reduced to 3 rounds."): that spell's own resolution.
        const cast = readCastSentence(sentence, sentences[index + 1] ?? "");
        if (cast) {
            parts.push(...cast.parts);
            if (cast.consumesNext) sentences[index + 1] = "";
            continue;
        }
        // "In addition, all non-magical light within the area is extinguished, and the herald attempts to counteract all magical light (counteract modifier [[/r 1d20+25 #Counteract]]{+25},
        // counteract rank 8).": the GM's reminder on the save before it, with a Counteract button at that modifier and rank.
        const counter = /^(?:In addition, )?all non-magical (light|darkness) within the area is (?:extinguished|dispelled), and the [a-z]+ attempts to counteract all magical \1 \(counteract modifier \[\[\/r 1d20\+(\d+) #Counteract\]\]\{\+\2\}, counteract rank (\d+)\)\.$/.exec(sentence);
        if (counter && part?.kind === "save" && !part.counteract) { part.counteract = { target: counter[1], modifier: Number(counter[2]), rank: Number(counter[3]), text: plainOf(sentence) }; continue; }
        if (!sentence.trim() || sentence === ".") continue;
        if (GM_ONLY.some(pattern => pattern.test(plainOf(sentence)) || pattern.test(sentence))) { reminders.push(plainOf(sentence)); continue; }
        // Where it reaches, with no rule of its own.
        if (WHERE.test(sentence) && !RULE.test(sentence)) { reminders.push(`Where it reaches: ${where(sentence)}`); continue; }
        // Narration: no link, roll or rule word; a number only as a count or a distance ("It summons another enormous gate to Jandelay 200 feet in front of it.", "… the spell
        // summons five of them"); "On a failed save, the creature receives a brief vision of …" is narration after its lead.
        const told = sentence.replace(/^On a failed save, (?=the creature\b)/, "");
        if (!/@|\[\[/.test(told) && !/\b(?:must|saves?|saving throw|bonus|penalty|immune|Prone|Escape|pushed|pulled|conditions?|destroy(?:s|ed)?|instead|roll|check|DC)\b/.test(told)
            && !/\bd\d+\b|\b\d+ (?:rounds?|minutes?|hours?)\b|[+–-]\d/.test(told)) { if (/\b\d+ feet\b/.test(told)) reminders.push(plainOf(told)); continue; }
        unread.push(plainOf(sentence));
    }
    return { parts, reminders, unread };
}

/** The degree table for a save part, as the save route's text. */
export function phaseTable(part) {
    const { lead, rows } = part;
    const statistic = `${lead.statistic[0].toUpperCase()}${lead.statistic.slice(1)}`;
    // A row's rules: its damage (half/full/double for a basic save), extra damage, conditions, a Speed penalty ("speed:20:circumstance:escape").
    const describe = (list, base) => {
        const damages = list.filter(entry => entry.startsWith("@Damage")).map(entry => entry.replace(/ damage$/, "").replace(/\|[^\[\]]*\]$/, "]"));
        // (A condition two riders both give — "also knocked Prone", "also knocked prone and Immobilized" — is written once.)
        const conditions = [...new Set(list.filter(entry => entry.startsWith("@UUID")))];
        const speeds = list.map(entry => /^speed:(\d+):([a-z]+):([a-z]+)$/.exec(entry)).filter(Boolean);
        const takes = [base, ...damages.map(entry => `${entry} damage`)].filter(Boolean);
        const parts = [];
        if (takes.length) parts.push(`takes ${takes.join(" and ")}`);
        if (conditions.length) parts.push(`is ${conditions.join(" and ")}`);
        const speedText = speed => `a –${speed[1]}-foot ${speed[2]} penalty to its Speeds${speed[3] === "escape" ? " until it Escapes" : " until the end of your next turn"}`;
        if (speeds.length === 1 && !conditions.length && !damages.length) return `The creature takes ${base ? `${base} and takes ` : ""}${speedText(speeds[0])}.`;
        let sentence = parts.length ? `The creature ${parts.join(" and ")}.` : "The creature is unaffected.";
        for (const speed of speeds) sentence += ` The creature takes a –${speed[1]}-foot ${speed[2]} penalty to its Speeds${speed[3] === "escape" ? " until it Escapes" : speed[3] === "depart" ? " until the end of your next turn" : " for as long as it takes persistent bleed damage"}.`;
        return sentence;
    };
    const intro = (part.intro ?? []).length ? ` ${part.intro.join(" ")}` : "";
    // (The lead states the damage, so the save route tells the rows' extra persistent damage from it: "Each creature takes 10d6 fire damage and must attempt …".)
    const entries = lead.damageText ? damageEntries(lead.damageText) : null;
    const stated = entries?.length && entries.every(([dice]) => /^\d+d\d+(?:[+-]\d+)?$/.test(dice)) ? entries.map(([dice, type, category]) => `${dice} ${category ? `${category} ` : ""}${type} damage`).join(" and ") : "the damage";
    if (lead.basic) return `<p>Each creature takes ${stated} and must attempt a ${statistic} save.${intro}</p><hr />`
        + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> ${describe(rows.success, "half damage")}</p>`
        + `<p><strong>Failure</strong> ${describe(rows.failure, "full damage")}</p><p><strong>Critical Failure</strong> ${describe(rows.criticalFailure, "double damage")}</p>`;
    return `<p>The creature must attempt a ${statistic} save.${intro}</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> ${describe(rows.success, null)}</p>`
        + `<p><strong>Failure</strong> ${describe(rows.failure, null)}</p><p><strong>Critical Failure</strong> ${describe(rows.criticalFailure, null)}</p>`;
}

/** The damage a save part's lead states: [[formula, type, category]] (or null when the lead has none). */
export function partDamage(part) {
    return part.lead.damageText ? damageEntries(part.lead.damageText) : null;
}

/** The listed manifestations ("When you Cast this Spell, choose one of …"): [{label, html}] — or one, the whole text, when there's no list. */
export function splitOptions(html) {
    const text = String(html);
    // An option item opens with a bold name that isn't a phase ("<li><p><strong>Angels</strong> Speed …", "<li><strong>Air</strong> Speed …", "<li><p><strong>Holy: Arrive</strong> …").
    const starts = [...text.matchAll(/<li>\s*(?:<p>)?\s*<strong>\s*(?!Arrive\b|Depart\b)([^<:]+?)(?::\s*(?:Arrive|Depart)\b[^<]*)?\s*:?\s*<\/strong>/g)];
    if (starts.length < 2) return [{ label: null, html: text }];
    return starts.map((start, index) => ({ label: plainOf(start[1].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")).replace(/:$/, ""),
        html: text.slice(start.index, index + 1 < starts.length ? starts[index + 1].index : text.search(/<\/ul>\s*(?:<hr|<p>\s*@UUID|$)/) > start.index ? text.search(/<\/ul>\s*(?:<hr|<p>\s*@UUID|$)/) : undefined) }));
}

// The phases of one manifestation's text: [{key, title, traits, text}].
const PHASE_MARK = /<strong>\s*(?:(?:[A-Z][a-z]+): )?(Arrive|Depart)(?: [A-Z][a-z]+)?\s*<\/strong>/g;
export function splitPhases(html) {
    const marks = [...String(html).matchAll(PHASE_MARK)];
    return marks.map((mark, index) => {
        const body = String(html).slice(mark.index + mark[0].length, index + 1 < marks.length ? marks[index + 1].index : undefined)
            .replace(/<\/?(?:li|ul|p)[^>]*>/g, " ").replace(/;\s*$/, "").trim();
        const traits = /^\(([a-z, ]+)\)\s*/.exec(body);
        const afterTraits = traits ? body.slice(traits[0].length) : body;
        const title = /^(?:<em>)?\s*(?:\(([a-z, ]+)\)\s*)?([^<(]+?)(?:<\/em>|(?=\s\())/.exec(afterTraits);
        const em = /^<em>(?:\(([a-z, ]+)\)\s*)?([^<]+)<\/em>\s*/.exec(afterTraits);
        const rest = em ? afterTraits.slice(em[0].length) : afterTraits;
        const traits2 = /^\(([a-z, ]+)\)\s*/.exec(rest);
        return { key: mark[1].toLowerCase(), title: (em?.[2] ?? title?.[2] ?? mark[1]).trim(), traits: (traits?.[1] ?? em?.[1] ?? traits2?.[1] ?? "").split(/,\s*/).filter(Boolean),
            text: (traits2 ? rest.slice(traits2[0].length) : rest).replace(/<\/?(?:em|strong)>/g, "").replace(/<hr\s*\/?>/g, " ").replace(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g, "").replace(/\s+/g, " ").trim()
                // (The spell's Heightened entries follow the last phase: its formulas read the cast rank, checked by the compiler.)
                .replace(/\s*Heightened \(\+?\d+(?:st|nd|rd|th)?\)\s.*$/, "") };
    });
}
