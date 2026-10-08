// Spells that answer a trigger (feature group 11), as a card of parts whose later triggers the module watches:
//   - a life link: "Each time an effect damages you, the target attempts a Will save, which can cause it to take part of the damage" with its rows (half
//     the damage moved to the target; a round without it; the spell ending), the 120-foot leash, the end at 0 Hit Points and the Sustain's self-damage;
//   - a sacrifice: "Trigger You take damage that would reduce you to 0 Hit Points." — the ally's Will save; it moves beside the caster and takes half
//     (or all) the damage, the caster at least 1 Hit Point; the ally dies at 0 on a failure; a target that genuinely loves the caster fails (the GM);
//   - a fury: "Trigger A creature damages you." — the creature can't observe the caster until the end of its turn (and the caster is Hidden to it); on a
//     failure again each time it damages the caster for 1 minute; on a critical failure, with no end, the first creature it damages each round;
//   - a leech: the target's Will save (Fatigued on a failure), then "whenever the target casts a divine spell, you regain 6d6 Hit Points and the target
//     must attempt another Will save" with its rows (the spell lost and Stunned 1; Stunned for 1 round; its targets a degree better);
//   - a mimic: "Attempt to counteract the spell cast by the triggering creature. If the spell would be counteracted, you instead gain the ability to Cast
//     that Spell without expending a slot." — the copy at the stated rank, lost at the end of the next turn unless Sustained (up to 1 minute);
//   - a word of death: "Make a melee unarmed Strike. If you hit and the target is alive, anytime during the duration, you can spend a single action … to
//     speak a word of death" with its Fortitude rows (immunity for 24 hours; the spell ending; death);
//   - an emblem: "Attack rolls against the target gain a +1 status bonus, and successful Strikes against the target deal 1d6 fire damage, and 1d10
//     persistent fire damage on a critical hit." with "you're Off-Guard against other enemies" and the new casting replacing the old.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const blocks = adapted => String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/);
const UUID = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Za-z-]+)(?: (\d+))?\}`;
const minutes = text => Number(/^(\d+) minutes?$/.exec(text ?? "")?.[1] ?? NaN);
// (Every sentence read: those stated claimed; nothing with a number, a roll, damage or a save left behind.)
const matchAll = (sentences, patterns) => patterns.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
const unread = (sentences, found, allowed = []) => sentences.filter(sentence => !found.some(match => match?.[0] === sentence) && !allowed.some(pattern => pattern.test(sentence)));

/** {parts, notes, claimed, lasting?, replaces?} or null. */
export function extractTriggerCard(adapted) {
    for (const reader of [lifeLink, sacrifice, fury, leech, mimic, wordOfDeath, emblem]) { const found = reader(adapted); if (found) return found; }
    return null;
}

function lifeLink(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 3 || adapted.defense?.statistic !== "will" || adapted.defense.basic !== false || adapted.lifecycle?.sustained !== true) return null;
    const lead = split(plain(parts[0])), table = split(plain(parts[1]));
    const LEAD = [/^Each time an effect damages you, the target attempts a (Will) save, which can cause it to take part of the damage, as detailed below\.$/,
        /^The spell ends if the target is ever more than (\d+) feet away from you\.$/,
        /^If either you or the target is reduced to 0 Hit Points, any damage from this spell is resolved, and then the spell ends\.$/,
        /^Each time you sustain this spell, you can choose to deal (\d+)d(\d+) damage to yourself, which can be reduced with [a-z ]+ as normal\.$/];
    const ROWS = [/^Critical Success The damage you take is unaffected, and the spell ends\.$/,
        /^Success The damage you take is unaffected, and the target can't take damage from [a-z ]+ for (\d+) rounds?\.$/,
        /^Failure The target takes half the damage of the effect instead of you, then can't take damage from [a-z ]+ for (\d+) rounds?\.$/,
        /^Apply any immunity, resistances, or weaknesses you have to the damage before halving it, and the target still applies any immunity, resistances, weaknesses, and the like it has\.$/,
        /^Critical Failure The target takes half the damage of the effect\.$/];
    const found = matchAll(lead, LEAD), rows = matchAll(table, ROWS);
    if (![...found, ...rows].every(Boolean) || unread(lead, found, [/^You (?:tether|create a life link)\b[^\d]*$/]).length || unread(table, rows).length) return null;
    const step = /^Heightened \(\+(\d+)\) The damage you can choose to deal to yourself each time you sustain the spell increases by (\d+)d(\d+)\.$/.exec(plain(parts[2]));
    const seconds = minutes(adapted.lifecycle?.duration) * 60;
    if (!step || Number(step[3]) !== Number(found[3][2]) || Number(rows[1][1]) !== Number(rows[2][1]) || !Number.isFinite(seconds)) return null;
    const rank = Number(adapted.rank);
    return {
        parts: [
            { key: "link", title: "The life link", kind: "link", statistic: "will", range: Number(found[1][1]), immunityRounds: Number(rows[1][1]),
                reminder: "Target the foe: the module watches the caster's damage and rolls the foe's Will save each time (half the damage moved to it on a failure)." },
            { key: "self", title: "Damage yourself", kind: "damage", self: true, formula: `(${found[3][1]} + ${step[2]} * floor((@item.rank - ${rank}) / ${step[1]}))d${found[3][2]}`,
                repeat: { trigger: "the spell is Sustained (if the caster chooses)" }, reminder: "Optional on each Sustain: the caster takes the damage (the link applies as normal)." }],
        lasting: { seconds, sustained: true },
        notes: [],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^You (?:tether|create a life link)\b/.test(sentence)), ...table, plain(parts[2])]
    };
}

function sacrifice(adapted) {
    const parts = blocks(adapted);
    if (parts.length < 3 || adapted.defense?.statistic !== "will") return null;
    const trigger = /^<p><strong>Trigger<\/strong> You take damage that would reduce you to 0 Hit Points\.<\/p>$/.test(parts[0].trim());
    const lead = split(plain(parts[1])), table = split(plain(parts[2]));
    const LOVE = /^A target that genuinely loves the caster without magical compulsion, at their player's or the GM's discretion, fails the save\.$/;
    const ROWS = [/^Critical Success The target is unaffected\.$/, /^Success The creature moves adjacent to you, moving further than its Speed if necessary as the magic compels it to exceed its limits\.$/,
        /^It takes half the damage you would have taken, while you take the rest\.$/, /^If you would be reduced to 0 Hit Points, you're reduced to 1 instead\.$/,
        /^Failure As success, except they take the full damage\.$/, /^If the damage reduces them to 0 Hit Points, they immediately die; this is a death effect\.$/];
    const love = lead.map(sentence => LOVE.exec(sentence)).find(Boolean), rows = matchAll(table, ROWS);
    if (!trigger || !love || !rows.every(Boolean) || unread(table, rows).length || unread(lead, [love], [/^You cry out for aid\b/]).length) return null;
    const pfs = parts.slice(3).map(plain).filter(text => text && !/^PFS Note:/.test(text));
    if (pfs.length) return null;
    return {
        parts: [{ key: "sacrifice", title: "The sacrifice", kind: "sacrifice", statistic: "will", question: "Does the target genuinely love the caster without magical compulsion? It then fails the save.",
            reminder: "Target the creature: its Will save; on a success or failure it moves beside the caster and takes half (or all) of the damage the caster just took." }],
        notes: [],
        claimed: [plain(parts[0]), love[0], ...lead.filter(sentence => /^You cry out for aid\b/.test(sentence)), ...table, ...parts.slice(3).map(plain).filter(Boolean)]
    };
}

function fury(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 3 || adapted.defense?.statistic !== "will" || !/^<p><strong>Trigger<\/strong> A creature damages you\.<\/p>$/.test(parts[0].trim())) return null;
    const lead = split(plain(parts[1])), table = split(plain(parts[2]));
    const ROWS = [/^Critical Success The target is unaffected\.$/,
        new RegExp(String.raw`^Success The target can't @UUID\[[^\]]+\]\{Observe\} you until the end of its turn, and if you're currently observed by it, you become ${UUID} to it\.$`),
        /^Failure As success, and for (\d+) minutes?, every time the target damages you, it can't observe you until the end of its turn\.$/,
        /^Critical Failure As success, and for an unlimited duration, the first time each round the target damages a creature, it can't observe that creature until the end of its turn\.$/,
        /^If it damages several creatures at once, the creature it can't perceive is chosen randomly among those creatures\.$/];
    const rows = matchAll(table, ROWS);
    if (!rows.every(Boolean) || unread(table, rows).length || unread(lead, [], [/^You curse the target\b/, /^The effect is determined by the target's Will save\.$/]).length) return null;
    return {
        parts: [{ key: "fury", title: "The fury", kind: "fury", statistic: "will", hidden: { uuid: rows[1][1], slug: rows[1][2].toLowerCase() }, minutes: Number(rows[2][1]),
            reminder: "Target the creature that damaged the caster: its Will save; the module then watches the damage it deals for the failure's and critical failure's lasting curse." }],
        notes: ["Who can't observe whom is the GM's on the map: the module's Effects name the creature it can't observe until the end of its turn."],
        claimed: [plain(parts[0]), ...lead, ...table]
    };
}

function leech(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2 || adapted.defense?.statistic !== "will" || adapted.lifecycle?.sustained !== true) return null;
    const lead = split(plain(parts[0])), table = split(plain(parts[1]));
    const LEAD = [new RegExp(String.raw`^If the target fails its save, it is ${UUID}\.$`),
        /^For the spell's duration, whenever the target casts a (divine) spell, you regain @Damage\[(\d+d\d+)\[healing\]\] Hit Points and the target must attempt another (Will) save with the following effects\.$/];
    const ROWS = [/^Critical Success The target is unaffected\.$/, /^Success Each target of the divine spell has an outcome one degree of success better than the result it rolled\.$/,
        new RegExp(String.raw`^Failure The divine spell is lost and target is ${UUID}\.$`), new RegExp(String.raw`^Critical Failure As failure, but the target is ${UUID} for (\d+) rounds?\.$`)];
    const found = matchAll(lead, LEAD), rows = matchAll(table, ROWS);
    if (![...found, ...rows].every(Boolean) || unread(lead, found, [/^You disrupt the connection\b[^\d]*$/]).length || unread(table, rows).length) return null;
    const seconds = minutes(adapted.lifecycle?.duration) * 60;
    if (!Number.isFinite(seconds) || rows[2][2].toLowerCase() !== "stunned" || rows[3][2].toLowerCase() !== "stunned") return null;
    const fatigue = found[0];
    return {
        parts: [
            { key: "disrupt", title: "The disruption", kind: "action", spec: { type: "save", statistic: "will", basic: false,
                html: `<p>The target must attempt a Will save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
                    + `<p><strong>Failure</strong> The target is @UUID[${fatigue[1]}]{${fatigue[2]}}.</p><p><strong>Critical Failure</strong> The target is @UUID[${fatigue[1]}]{${fatigue[2]}}.</p>` },
                leechTargets: true, reminder: "Target the creature: its Will save (Fatigued on a failure); the module then watches it cast divine spells for the spell's duration." },
            { key: "leech", title: "It casts a divine spell", kind: "leech", tradition: found[1][1], heal: found[1][2], statistic: "will",
                stunned: { uuid: rows[2][1], value: Number(rows[2][3] ?? 1), criticalRounds: Number(rows[3][4]) },
                repeat: { trigger: "the target casts a divine spell (the module presses it when it sees the cast)" }, reminder: "The caster regains the Hit Points; the target's Will save against losing the spell." }],
        lasting: { seconds, sustained: true },
        notes: [],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^You disrupt the connection\b/.test(sentence)), ...table]
    };
}

function mimic(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2 || adapted.defense?.kind !== "none") return null;
    const trigger = /^Trigger A creature you're aware of within range Casts a Spell of the same tradition as [a-z ]+ and of the same or lower rank\.$/.exec(plain(parts[0]));
    const lead = split(plain(parts[1]));
    const LEAD = [/^Attempt to counteract the spell cast by the triggering creature\.$/, /^If the spell would be counteracted, you instead gain the ability to Cast that Spell without expending a slot\.$/,
        /^On your next turn, you spend the same number of actions to Cast the Spell as the triggering creature, but you choose the targets \(if any\) and use your spell attack modifier or spell DC as appropriate\.$/,
        /^The spell is heightened to the same rank as [a-z ]+\.$/, /^The mimicked spell is of the same tradition as the spells you normally cast\.$/,
        /^If you don't Cast the mimicked Spell by the end of your next turn, it is lost, unless you Sustain the knowledge of it\.$/, /^You can Sustain this knowledge for up to (\d+) minutes?, after which it is lost\.$/];
    const found = matchAll(lead, LEAD);
    if (!trigger || !found.every(Boolean) || unread(lead, found, [/^You learn the secrets of a spell\b/]).length) return null;
    return {
        parts: [{ key: "mimic", title: "The counteract", kind: "mimic", sameTradition: true, sustainMinutes: Number(found[6][1]),
            reminder: "Target the creature casting the spell and pick its spell: the module's counteract check; on a success, the caster gains that spell at this rank in its own tradition until the end of its next turn (Sustain to keep it, up to 1 minute)." }],
        lasting: { seconds: Number(found[6][1]) * 60, sustained: true },
        notes: [],
        claimed: [trigger[0], ...lead]
    };
}

function wordOfDeath(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 3 || adapted.defense?.statistic !== "fortitude" || adapted.defense.basic !== false) return null;
    const lead = split(plain(parts[0])), table = split(plain(parts[1]));
    const LEAD = [/^Make a melee unarmed Strike\.$/,
        /^If you hit and the target is alive, anytime during the duration, you can spend a single action, which has the (auditory) and (concentrate) traits, to speak a word of death that could instantly slay it\.$/,
        /^The target must attempt a (Fortitude) save\.$/];
    const ROWS = [/^Critical Success The target survives, the spell ends, and the target is then temporarily immune for (\d+) hours\.$/,
        new RegExp(String.raw`^Success The target is ${UUID} and takes @Damage\[(\d+)\*@item\.level\] damage, the spell ends, and the target is then temporarily immune for (\d+) hours\.$`),
        new RegExp(String.raw`^Failure The target is ${UUID} and takes @Damage\[(\d+)\*@item\.level\] damage\.$`),
        /^The spell's duration continues, but the target is then temporarily immune for (\d+) hours against being killed by [a-z ]+\.$/,
        /^Critical Failure The target dies\.$/, /^If you cast [a-z ]+ again, the effects of any [a-z ]+ you had previously cast end\.$/];
    const found = matchAll(lead, LEAD), rows = matchAll(table, ROWS);
    if (![...found, ...rows].every(Boolean) || unread(lead, found).length || unread(table, rows).length) return null;
    const step = /^Heightened \(\+1\) The damage increases by (\d+) on a failure, or (\d+) on a success\.$/.exec(plain(parts[2]));
    // ("@Damage[5*@item.level]": the stated multiple of the rank, which the Heightened entry restates.)
    if (!step || Number(step[1]) !== Number(rows[2][4]) || Number(step[2]) !== Number(rows[1][4])) return null;
    const months = /^(\d+) months?$/.exec(adapted.lifecycle?.duration ?? "");
    if (!months) return null;
    return {
        parts: [
            { key: "mark", title: "The touch (after the Strike hits)", kind: "death-mark", reminder: "After the caster's melee unarmed Strike hits a living target: target it, then mark it." },
            { key: "word", title: "The word of death", kind: "word", statistic: "fortitude", traits: [found[1][1], found[1][2]], immuneHours: Number(rows[0][1]),
                success: { uuid: rows[1][1], slug: rows[1][2].toLowerCase(), value: Number(rows[1][3]), perRank: Number(rows[1][4]) },
                failure: { uuid: rows[2][1], slug: rows[2][2].toLowerCase(), value: Number(rows[2][3]), perRank: Number(rows[2][4]), deathImmuneHours: Number(rows[3][1]) },
                repeat: { trigger: "the caster spends the action during the duration" }, reminder: "Target the marked creature: its Fortitude save against the word of death." }],
        lasting: { seconds: Number(months[1]) * 30 * 86400, sustained: false },
        replaces: true,
        notes: [],
        claimed: [...found.map(match => match[0]), ...table, plain(parts[2])]
    };
}

function emblem(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 3 || adapted.defense?.kind !== "none" || !/^<p><strong>Trigger<\/strong> Your last action was a successful Strike against an enemy<\/p>$/.test(parts[0].trim())) return null;
    const lead = split(plain(parts[1]));
    const LEAD = [/^Attack rolls against the target gain a \+(\d+) status bonus, and successful Strikes against the target deal @Damage\[1d(\d+)\[([a-z]+)\]\] damage, and @Damage\[1d(\d+)\[persistent,([a-z]+)\]\] damage on a critical hit\.$/,
        new RegExp(String.raw`^However, you're ${UUID} against other enemies, as the information from the emblem distracts you\.$`),
        /^The emblem takes your full attention; if you use [a-z ]+ again before the original duration expires, the new casting replaces the previous casting\.$/];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found, [/^You emblazon the target\b/]).length) return null;
    const step = /^Heightened \((\d+)th\) The fire damage increases to @Damage\[1d(\d+)\[([a-z]+)\]\] damage, and the persistent fire damage on a critical hit increases to @Damage\[1d(\d+)\[persistent,([a-z]+)\]\]\.$/.exec(plain(parts[2]));
    const rounds = Number(/^(\d+) rounds?$/.exec(adapted.lifecycle?.duration ?? "")?.[1] ?? NaN);
    if (!step || !Number.isFinite(rounds) || step[3] !== found[0][3] || step[5] !== found[0][5]) return null;
    const [bonus] = found;
    return {
        parts: [{ key: "emblem", title: "The emblem", kind: "emblem", bonus: Number(bonus[1]), type: bonus[3], die: Number(bonus[2]), critDie: Number(bonus[4]),
            heightened: { minRank: Number(step[1]), die: Number(step[2]), critDie: Number(step[4]) }, offGuard: { uuid: found[1][1], slug: found[1][2].toLowerCase() }, rounds,
            reminder: "Target the enemy the caster just hit with a Strike: the emblem on it; the caster is Off-Guard against other enemies." }],
        lasting: { seconds: rounds * 6, sustained: false },
        replaces: true,
        notes: [],
        claimed: [plain(parts[0]), ...lead, plain(parts[2])]
    };
}
