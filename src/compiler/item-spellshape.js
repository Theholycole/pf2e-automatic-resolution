// Items whose activation is a spellshape (the spell features audit, batch F4, 2026-10-05): grimoires, rings, tattoos, runes, a weapon and a potion
// that change the next spell cast ("Activate … (concentrate, spellshape) … Effect If your next action is to Cast a Spell …"). Read from the item's
// text, each activation into:
//   - requires: the spell it applies to, the forms of the spellshape feats' (src/compiler/spellshape-readers.js unmetRequirement);
//   - riders: the spellshape riders the module already applies, and the items' own (scripts/item-spellshape-runtime.js);
//   - arm: what happens as the item is activated, before the spell (Hundred-Moth Caress's damage to the wielder, Djezet Dose's choice of feat,
//     Star Chart Tattoo's constellation on a creature).
// Any sentence these forms don't read leaves the item unread (null): rules from the text, never from names.
import { readSpellshapeFeat } from "./spellshape-readers.js";
import { readCatalyst } from "./catalysts.js";
import { CONDITION_LINK_HYPHENATED as COND, plain, sentenceSplit as split } from "./text-patterns.js";

const LINK = String.raw`@UUID\[(Compendium\.pf2e\.[a-z-]+\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}`;
const unlinkAction = text => text.replace(/@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{([^}]+)\}/g, "$1");
const ORDINAL = String.raw`(\d+)(?:st|nd|rd|th)`;
const cond = (uuid, slug, value = null, extra = {}) => ({ uuid, slug: slug.toLowerCase(), value: value == null ? null : Number(value), ...extra });

/** The spell an item's lead names ("If your next action is to Cast a prepared Spell with the light trait"): requires, or null. */
export function readItemRequirements(text) {
    const requires = {};
    let rest = unlinkAction(text).trim();
    // ("prepared from this grimoire": the spell must be prepared — PF2e's entry says — and from this book, the table's.)
    if (/ prepared from this grimoire\b/.test(rest)) { requires.prepared = true; requires.table = ["prepared from this grimoire"]; rest = rest.replace(/ prepared from this grimoire\b/, ""); }
    if (/^(?:a |an )?prepared /i.test(rest)) { requires.prepared = true; rest = rest.replace(/^(a |an )?prepared /i, "$1"); }
    const table = text => { requires.table = [...(requires.table ?? []), text]; };
    let m;
    if (/^a Spell that requires a spell attack roll against Armor Class$/.test(rest)) requires.attack = true;
    else if ((m = new RegExp(`^a Spell of ${ORDINAL} level or lower that affects or targets only you$`).exec(rest))) { requires.maxRank = Number(m[1]); table("it affects or targets only you"); }
    else if (/^a Spell with an area of effect that deals the same type of damage as the depicted dragon's breath weapon$/.test(rest)) { requires.area = true; requires.damaging = true; table("it deals the depicted dragon's damage type"); }
    else if (/^a damage-dealing spell$/.test(rest)) requires.damaging = true;
    else if (/^a healing spell that restores Hit Points$/.test(rest)) requires.healing = true;
    // ("a prepared Spell that manipulates blood, such as …, or a spell dealing piercing or slashing damage": either — the blood the table's.)
    else if (/^(?:a )?Spell that manipulates blood, such as [^,]+, or a spell dealing piercing or slashing damage$/.test(rest)) table("it manipulates blood, or deals piercing or slashing damage");
    else if ((m = /^an? ([a-z]+) spell that creates illusory terrain or creatures, such as @UUID\[[^\]]+\]\{[^}]+\}$/.exec(rest))) { requires.anyTraits = [m[1]]; table("it creates illusory terrain or creatures"); }
    else if ((m = /^(?:a |an )?([a-z]+) spell$/.exec(rest)) && m[1] !== "wall") requires.anyTraits = [m[1]];
    else if (/^(?:a |an )?wall spell, such as .+$/.test(rest)) table("a wall spell");
    else if ((m = /^(?:a |an )?Spell with the ([a-z]+) trait$/i.exec(rest))) requires.anyTraits = [m[1]];
    else if ((m = /^(?:a |an )?Spell with the ([a-z]+) or ([a-z]+) trait$/i.exec(rest))) requires.anyTraits = [m[1], m[2]];
    else if ((m = /^a Spell that has the ([a-z]+) trait and that targets 1 creature$/i.exec(rest))) { requires.anyTraits = [m[1]]; requires.singleTarget = true; }
    else if ((m = /^a spell that has the ([a-z]+) trait$/i.exec(rest))) requires.anyTraits = [m[1]];
    else if ((m = new RegExp(`^a ${LINK}, ${LINK}, or ${LINK} spell$`).exec(rest))) requires.spells = [m[2], m[4], m[6]];
    else if (/^a spell your familiar learned from a lesson \(whether a cantrip or from a spell slot\)$/.test(rest)) table("a spell your familiar learned from a lesson");
    else if (/^(?:a )?Spell$/i.test(rest)) {}
    else return null;
    return requires;
}

// The effect's sentences after the lead: [pattern, (match, context) => rider(s) | { requires } | { arm }].
const FORMS = [
    // Shadow Signet.
    [/^choose (Fortitude|Reflex) DC or (Fortitude|Reflex) DC\.$/, m => ({ type: "attack-defense", choice: [m[1].toLowerCase(), m[2].toLowerCase()] })],
    [/^You make your spell attack roll against that defense instead of AC\.$|^If the spell has multiple targets, the choice of DC applies to all of them\.$/, () => []],
    // Reflexive Tattoo, Dragon's Breath, Djezet Dose: a spellshape feat's effects.
    [/^you can hide that you're casting it\.$/, () => []],
    [new RegExp(String.raw`^This has the same effect as the ${LINK} feat\.$`), m => ({ type: "as-feat", feats: [{ uuid: m[1], name: m[2] }] })],
    [new RegExp(String.raw`^the spell gains the effects of the ${LINK} feat\.$`), m => ({ type: "as-feat", feats: [{ uuid: m[1], name: m[2] }] })],
    [new RegExp(String.raw`^you can apply the effects of the ${LINK} or ${LINK} spellshape feats\.$`), m => ({ type: "as-feat", feats: [{ uuid: m[1], name: m[2] }, { uuid: m[3], name: m[4] }], pick: true })],
    [new RegExp(`^The rune can only affect spells of ${ORDINAL} (?:level|rank)(?: or lower)?\\.$`), m => ({ requires: { maxRank: Number(m[1]) } })],
    // Codex of Destruction and Renewal.
    [/^the spell wreaks even greater destruction\.$/, () => []],
    [/^The spell ignores (\d+) resistance and you reroll any damage dice that roll a 1\.$/, m => [{ type: "ignore-resistance", types: null, value: Number(m[1]) }, { type: "reroll-ones" }]],
    [/^If the spell reduces a creature to 0 Hit Points, they're torn apart at an infinitesimal level, not even leaving a fine ash; this is a death effect\.$/, m => ({ type: "note", wandRule: true, text: m[0] })],
    [/^the spell renews the target constantly and perfectly\.$/, () => []],
    [/^The spell grants the target regeneration (\d+), restoring \1 Hit Points at the start of its turn and preventing the target both from dying due to damage and from its dying condition increasing to a value that would result in its death\.$/,
        m => ({ type: "healed-generated", name: `regeneration ${m[1]}`, rules: [{ key: "FastHealing", type: "regeneration", value: Number(m[1]) }], rounds: null })],
    [/^Each time the creature regains Hit Points from regeneration, it regrows all damaged or ruined organs; .*\.$/, () => []],
    [/^The effect lasts for (\d+) rounds\.$/, (m, context) => { const rider = context.riders.findLast(entry => entry.type === "healed-generated"); if (!rider) return null; rider.rounds = Number(m[1]); return []; }],
    // Bloodstained Treatise.
    [/^all targets of the triggering spell take @Damage\[(\d+d\d+)\[persistent,([a-z]+)\](?:\|[^\]]*)?\] damage; if the spell already causes \2 damage, the \2 damage increases by \1\.$/,
        m => ({ type: "persistent", when: "all", formula: m[1], damageType: m[2], raisesOwn: true })],
    [new RegExp(String.raw`^The wounds of one affected target \(chosen by you\) gush uncontrollably, covering the ground with blood in a @Template\[type:emanation\|distance:(\d+)\] that lasts for (\d+) rounds?\.$`),
        m => ({ type: "turn-save-area", center: "chosen-target", radius: Number(m[1]), rounds: Number(m[2]), who: "all", statistic: null, outcomes: {} })],
    [new RegExp(String.raw`^Creatures that begin their turn in the blood must succeed at a (Reflex|Fortitude|Will) save against your spell DC or fall ${COND}\.$`),
        (m, context) => { const rider = context.riders.findLast(entry => entry.type === "turn-save-area"); if (!rider) return null; rider.statistic = m[1].toLowerCase();
            const fall = [cond(m[2], m[3], m[4])]; rider.outcomes = { failure: fall, criticalFailure: fall }; return []; }],
    // Amazing Pop-up Book: the disbelief is the GM's (decisions 2026-10-01), the damage the card's button.
    [/^you draw forth the pop-up scene\.$/, () => []],
    [/^If a creature succeeds, but doesn't critically succeed, at a saving throw to disbelieve the illusion, then .*, dealing (mental) damage equal to the spell's rank\.$/,
        m => ({ type: "damage-card", formula: "rank", damageType: m[1], label: "A creature succeeded (not critically) at disbelieving it: the pop-up's damage" })],
    // Summoning Handscroll.
    [/^you infuse one of the summoned creatures with the spell's energies, causing it to arrive with (\d+) temporary Hit Points that last for up to 1 minute\.$/,
        m => ({ type: "temp-hp-card", amount: Number(m[1]), rounds: 10, label: "one of the summoned creatures" })],
    // Architect's Pattern Book: the room the GM's; PF2e's Effect for the well-rested.
    [/^you add a room to the structure that is up to 10 feet per side per rank of the spell\.$|^This room is outfitted with all the accoutrements for a particular type of recreation, determined by you when you cast the spell\.$/,
        m => ({ type: "note", wandRule: true, text: m[0] })],
    [/^Any character who spends at least 1 hour using this recreational facility and then sleeps a full 8 hours inside the location created by the spell is exceptionally well-rested\.$/, () => []],
    [/^They regain double the amount of Hit Points they would normally receive for an 8-hour rest, and when they make the next day's preparations, they gain a \+1 circumstance bonus to Athletics checks and Will saves for the next 12 hours\.$/,
        () => ({ type: "effect-card", uuid: null, label: "Well-rested (after the hour's recreation and 8 hours' sleep): the targeted characters", doubleRest: true })],
    // Sparking Grimoire: the Strikes' dice on an Effect, the retaliation watched.
    [/^you charge yourself with electrical energy\.$/, () => []],
    [/^Until the end of your next turn, (your|you and your allies') Strikes deal an additional @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage, and creatures targeting you with a melee Strike or spell with a range of touch take @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage, with a basic (Reflex|Fortitude|Will) save against your spell DC\.$/,
        m => [{ type: "strike-dice", allies: m[1] !== "your", diceNumber: Number(m[2]), dieSize: `d${m[3]}`, damageType: m[4], until: "caster-next-turn-end" },
            { type: "retaliate", formula: m[5], damageType: m[6], statistic: m[7].toLowerCase(), until: "caster-next-turn-end" }]],
    // Hundred-Moth Caress: the activation's damage to the wielder, then the spell's extra damage.
    [/^You deal @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage to yourself\.$/, m => ({ arm: { type: "self-damage", formula: m[1], damageType: m[2] } })],
    [/^This damage ignores all resistances and immunities, and you take it even if you would be healed by ([a-z]+) effects\.$/, (m, context) => { if (!context.arm) return null; context.arm.ignoreIWR = true; return []; }],
    // Nine Void Sleeves.
    [/^your spell loses the manipulate trait and gains the ([a-z]+) trait, as .*\.$/, m => [{ type: "trait", trait: m[1] }, { type: "table", text: "the spell loses the manipulate trait" }]],
    // Juubun's One Thousand Poems.
    [/^you're overtaken by Juubun's spirit, and the spoken elements of your spell become impressively poetic\.$/, () => []],
    [/^If the target is an ally, your words inspire them and they gain (\d+) temporary Hit Points that last for 1 minute\.$/, m => ({ type: "ally-temp-hp", amount: Number(m[1]), rounds: 10, uuid: null })],
    [new RegExp(String.raw`^If the targeted creature is an enemy and the spell requires a saving throw, and if the enemy fails its saving throw, they become ${COND} as a result of .*\.$`),
        m => ({ type: "conditions", enemiesOnly: true, degrees: { failure: [cond(m[1], m[2], m[3])], criticalFailure: [cond(m[1], m[2], m[3])] } })],
    // Liar's Lexicon.
    [/^your skill at manipulation and exploiting emotion enhance the spell\.$/, () => []],
    [/^The spell gains the ([a-z]+) trait\.$/, m => ({ type: "trait", trait: m[1] })],
    [/^Attempt a Deception check to Lie as you cast the spell against the Perception DC of all those observing you\.$/, () => ({ type: "lie-check" })],
    [/^Those you succeed against think you were merely talking, not casting a spell on a creature\.$/, () => []],
    // Book of Endless Walls: the wall's spaces aren't the module's — a card for the creature that begins its turn in or passes through them.
    [/^you imbue the wall with an uncanny sense of disorientation, causing creatures to perceive it as an endless labyrinth\.$/, () => []],
    [/^Any creature that begins its turn within the wall's spaces or passes through the wall's spaces must attempt a (Will|Reflex|Fortitude) save against your spell DC, in addition to the wall's normal effect\.$/,
        m => ({ type: "save-card", statistic: m[1].toLowerCase(), label: "A creature began its turn in or passed through the wall: the targeted creature saves", outcomes: {}, immuneHours: null })],
    [/^Regardless of the results, the target then becomes immune to ([A-Za-z ]+) for (\d+) hours\.$/, (m, context) => { const rider = context.riders.findLast(entry => entry.type === "save-card"); if (!rider) return null; rider.immuneHours = Number(m[2]); return []; }],
    // Radiant Tome: an emanation around the caster, the enemies' save as their turns start.
    [/^the luminescence of the book grows even more intense, emitting bright light in a @Template\[type:emanation\|distance:(\d+)\] for 1 minute\.$/,
        m => ({ type: "turn-save-area", center: "caster", radius: Number(m[1]), rounds: 10, who: null, statistic: null, outcomes: {}, light: { bright: Number(m[1]) } })],
    [/^(Enemies|Creatures) that start their turn in this bright light must attempt a (Fortitude|Reflex|Will) save against your spell DC\.$/,
        (m, context) => { const rider = context.riders.findLast(entry => entry.type === "turn-save-area"); if (!rider) return null; rider.who = m[1] === "Enemies" ? "enemies" : "all"; rider.statistic = m[2].toLowerCase(); return []; }],
    // Communion Mat: the familiar's Sustain is the player's.
    [/^your patron notices that you're putting their power to good use and strengthens your familiar with a surge of magic\.$/, () => []],
    [/^Your familiar Sustains one of your spells\.$/, m => ({ type: "note", wandRule: true, text: m[0] })]
];

// The degree entries after an effect: "Critical Success …", "Success …", "Failure …", "Critical Failure …" (for the save card or the area's save).
function readDegree(text, rider) {
    const m = /^(Critical Success|Success|Failure|Critical Failure) (.+)$/.exec(text);
    if (!m) return false;
    const degree = { "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[m[1]];
    const body = m[2].replace(/\.$/, "");
    const list = [];
    let r;
    if (/^The (?:wall|creature) (?:has no additional effect for that creature|is unaffected)$/.test(body)) {}
    else if ((r = /^The creature is unaffected and becomes temporarily immune to this bright light for (\d+) minutes?$/.exec(body))) rider.immuneRounds = Number(r[1]) * 10;
    else if ((r = new RegExp(String.raw`^The creature is bewildered by its perceptions of labyrinthine walls and treats all other creatures as ${COND} for (\d+) rounds?$`).exec(body)))
        list.push({ generated: "treats all other creatures as concealed", rounds: Number(r[4]) });
    else if ((r = /^The creature treats all other creatures as hidden for (\d+) rounds?$/.exec(body))) list.push({ generated: "treats all other creatures as hidden", rounds: Number(r[1]) });
    else if ((r = /^The creature treats all other creatures as hidden for (\d+) rounds? and concealed for (\d+) minutes?$/.exec(body)))
        list.push({ generated: "treats all other creatures as hidden", rounds: Number(r[1]) }, { generated: "treats all other creatures as concealed", rounds: Number(r[2]) * 10 });
    else if ((r = new RegExp(String.raw`^The creature is ${COND} until the start of your next turn$`).exec(body))) list.push(cond(r[1], r[2], r[3], { until: "caster-turn-start" }));
    else if ((r = new RegExp(String.raw`^The creature is blinded until the start of your next turn and ${COND} for (\d+) minutes?$`).exec(body))) {
        const blinded = (rider.outcomes.failure ?? []).find(entry => entry.slug === "blinded");
        if (!blinded) return null;
        list.push({ ...blinded }, cond(r[1], r[2], r[3], { rounds: Number(r[4]) * 10 }));
    } else return null;
    rider.outcomes[degree] = list;
    return true;
}

/** An item's spellshape activations: { name, kind: "item", activations: [{ label, frequency, requires, riders, arm, claimed }] }, or null. */
export function readItemSpellshape(source) {
    // (A catalyst: catalysts.js.)
    return readCatalyst(source) ?? readOfficialItemSpellshape(source) ?? readPlusItemSpellshape(source);
}

/**
 * The "+" modules' items (docs/planning/third-party-features-audit.md): each spellshape activation — "Activate—Veracious Spell f (flourish, manipulate,
 * spellshape) Frequency once per 10 minutes The ring's magic guides your attack. If the next action you use is to Cast a Spell …" — read as the spellshape
 * feats are (spellshape-readers.js). An item whose spellshape activations none of those forms read stays unread.
 */
function readPlusItemSpellshape(source) {
    const text = plain(source?.system?.description?.value ?? "");
    // (A catalyst — Blue Salt Crystal: "Activate Cast a Spell … Adding this catalyst to a casting of Drown transforms the summoned water into deadly brine, causing the target to
    // take [persistent acid] damage for the duration of the spell equal to the rank of the spell." — the rank the text's, not the module's item level.)
    const catalyst = /^Activate Cast a Spell .*?Adding this catalyst to a casting of (?:@UUID\[[^\]]+\]\{)?([A-Z][A-Za-z' ]+?)\}? transforms the summoned water into deadly brine, causing the target to take @Damage\[[^\]]*\[persistent,([a-z]+)\]\] damage for the duration of the spell equal to the rank of the spell\.$/.exec(text);
    if (catalyst) return { name: source.name, kind: "item", activations: [{ label: source.name, frequency: null, requires: { spells: [catalyst[1]] },
        riders: [{ type: "spell-persistent", formula: "rank", damageType: catalyst[2], when: "affected" }], arm: null, claimed: [text] }] };
    const parts = text.split(/(?=\bActivate\b)/).filter(part => part.startsWith("Activate"));
    const activations = [];
    for (const part of parts) {
        const header = /^Activate—(.+?) [0-9AFfR] \(([^)]*)\) /.exec(part);
        if (!header || !header[2].split(/,\s*/).includes("spellshape")) continue;
        // (The next activation's own header ends this one; the item's Craft Requirements too.)
        const body = part.slice(header[0].length).replace(/ Craft Requirements .*$/, "").trim();
        const frequency = /^Frequency (once per [a-z0-9 ]+?)(?= [A-Z])/.exec(body)?.[1] ?? null;
        const read = readSpellshapeFeat({ name: header[1], system: { slug: null, traits: { value: ["spellshape"] }, description: { value: body } } });
        if (!read) return null;
        activations.push({ label: header[1].trim(), frequency, requires: read.requires, riders: read.riders, arm: null, claimed: read.claimed });
    }
    return activations.length ? { name: source.name, kind: "item", activations } : null;
}

function readOfficialItemSpellshape(source) {
    const text = plain(source?.system?.description?.value ?? "");
    // (Each activation from its "Activate"; the potion's "When you drink …, if your next action is to Cast a Spell" its activation's effect.)
    const parts = text.split(/(?=\bActivate\b)/).filter(part => part.startsWith("Activate"));
    if (!parts.length) return null;
    const activations = [];
    for (const part of parts) {
        // ("Activate—Pallid Reaping f (concentrate, …)": the name before the action glyph; the traits the first parentheses before the effect.)
        const name = /^Activate—(.+?) [0-9AFfR] (?:Interact |envision )?\(/.exec(part)?.[1] ?? null;
        const head = part.split(/ (?:Effect|Frequency|Requirements) /)[0];
        const traits = (/\(([^)]*)\)/.exec(head)?.[1] ?? "").split(/,\s*/);
        const body = part;
        const header = [null, name];
        const potion = /(?:^|\. )When you drink an? [^,]+?\s?, if your next action is to Cast a Spell, (.+?)(?= Craft Requirements |$)/.exec(body);
        if (!traits.includes("spellshape") && !potion) continue;
        const frequency = /Frequency (once per [a-z0-9 ]+?)(?= Effect| Requirements)/.exec(body)?.[1] ?? null;
        const precondition = /Requirements (.+?) Effect /.exec(body)?.[1] ?? null;
        let effect = (potion ? `If your next action is to Cast a Spell, ${potion[1]}` : /Effect (.+)$/.exec(body)?.[1])?.trim();
        if (!effect) return null;
        // (A trailing link to PF2e's Effect — "@UUID[…]{Effect: Juubun's One Thousand Poems}" — is the Effect the text's benefit uses.)
        const effectLink = new RegExp(String.raw`\s*@UUID\[(Compendium\.pf2e\.equipment-effects\.Item\.[A-Za-z0-9]+)\]\{(Effect: [^}]+)\}\s*$`).exec(effect);
        if (effectLink) effect = effect.slice(0, effectLink.index).trim();
        const sentences = split(effect);
        const context = { riders: [], arm: null, requires: null };
        const claimed = [];
        // (Star Chart Tattoo: no next spell — the constellation on a creature, its range a benefit the module doesn't measure.)
        if (/^The dots of the tattoo turn to points of light and fly above the head of a creature within (\d+) feet, where they form a three-star constellation/.test(sentences[0] ?? "")) {
            const within = Number(/within (\d+) feet/.exec(sentences[0])[1]);
            const last = /^Each time you use this benefit, one of the stars above the creature's head winks out; when all three have winked out or after (\d+) minutes? has passed, the effect ends\.$/.exec(sentences.at(-1) ?? "");
            if (!last) return null;
            activations.push({ label: header[1]?.trim() || source.name, frequency, requires: null, riders: [], arm: { type: "mark-creature", within, rounds: Number(last[1]) * 10, uses: 3,
                text: sentences.slice(1, -1).map(sentence => unlinkAction(sentence)) }, claimed: sentences });
            continue;
        }
        let at = 0;
        // (Sentences before the lead: the activation's own effect — Hundred-Moth Caress's damage.)
        const LEAD = /^If (?:your next action|the next action you use) is to (?:Strike with the [a-z ]+ or to )?(?:Cast|cast) (.+?), (.+)$/;
        while (at < sentences.length && !LEAD.test(unlinkAction(sentences[at]))) {
            const read = readSentence(sentences[at], context);
            if (!read) return null;
            claimed.push(sentences[at]);
            at++;
        }
        const lead = LEAD.exec(unlinkAction(sentences[at] ?? ""));
        if (!lead) return null;
        // ("…Cast a Spell with the disease or void trait, that Strike or spell deals additional void damage equal to the damage you took.")
        const strikeToo = /^If your next action is to Strike with the [a-z ]+ or to /.test(unlinkAction(sentences[at]));
        // (The requirement ends at the comma before the effect; a requirement with its own commas — "such as …, or a spell dealing …" — tried longer.)
        let requires = null, rest = null;
        const pieces = `${lead[1]}, ${lead[2]}`.split(", ");
        for (let cut = 1; cut < pieces.length && !requires; cut++) {
            requires = readItemRequirements(pieces.slice(0, cut).join(", "));
            if (requires) rest = pieces.slice(cut).join(", ");
        }
        if (!requires) { unreadSentence = sentences[at]; return null; }
        context.requires = requires;
        if (strikeToo) {
            const extra = /^that Strike or spell deals additional ([a-z]+) damage equal to the damage you took\.$/.exec(rest);
            if (!extra || context.arm?.type !== "self-damage") return null;
            context.riders.push({ type: "flat-damage", when: "damaged", formula: "armed", damageType: extra[1] }, { type: "table", text: "or the next Strike with the weapon" });
        } else if (!readSentence(`${rest[0].toLowerCase()}${rest.slice(1)}`, context)) return null;
        claimed.push(sentences[at]);
        for (const sentence of sentences.slice(at + 1)) {
            if (!readSentence(sentence, context)) return null;
            claimed.push(sentence);
        }
        if (precondition) requires.table = [...(requires.table ?? []), precondition];
        for (const rider of context.riders) {
            if (["effect-card", "ally-temp-hp"].includes(rider.type)) rider.uuid = effectLink?.[1] ?? null;
            if (rider.type === "effect-card" && !rider.uuid) return null;
            if (["turn-save-area", "save-card"].includes(rider.type) && (!rider.statistic || !Object.keys(rider.outcomes).length && rider.type === "save-card")) return null;
            if (rider.type === "turn-save-area" && !rider.outcomes.failure) return null;
            if (rider.type === "healed-generated" && !rider.rounds) return null;
        }
        activations.push({ label: header[1]?.trim() || source.name, frequency, requires, riders: context.riders, arm: context.arm, claimed });
    }
    return activations.length ? { name: source.name, kind: "item", activations } : null;
}

/** The sentence the last unread item stopped at (for the audit). */
export let unreadSentence = null;

function readSentence(sentence, context) {
    unreadSentence = sentence;
    // (A degree entry for the save last read: "Success The creature is …".)
    const saveRider = context.riders.findLast(entry => ["save-card", "turn-save-area"].includes(entry.type));
    if (saveRider && /^(?:Critical Success|Success|Failure|Critical Failure) /.test(sentence)) {
        // ("Critical Success … Success … Failure … Critical Failure …": PF2e's description runs them together.)
        const entries = sentence.split(/(?<!Critical) (?=(?:Critical Success|Success|Failure|Critical Failure) [A-Z])/);
        return entries.every(entry => readDegree(entry, saveRider) === true);
    }
    for (const [pattern, make] of FORMS) {
        const m = pattern.exec(sentence);
        if (!m) continue;
        const made = make(m, context);
        if (made == null) return false;
        for (const entry of [made].flat()) {
            if (entry.requires) Object.assign(context.requires ?? (context.requires = {}), entry.requires);
            else if (entry.arm) context.arm = entry.arm;
            else context.riders.push(entry);
        }
        return true;
    }
    return false;
}
