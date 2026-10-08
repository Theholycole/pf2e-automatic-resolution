// Spells bringing creatures back (feature group 13), as a card of parts:
//   - Raise Dead's return: "If the spell is successful, the creature returns to life with 1 Hit Point …" and "… making it Clumsy 2, Drained 2, and
//     Enfeebled 2 for 1 week; these conditions can't be removed or reduced by any means until the week has passed.", for "1 dead creature of 13th level
//     or lower" (higher by its Heightened entries), when the GM says the soul returns ("died within the past 3 days", Pharasma, its wish);
//   - a temporary revival: "All living targets regain 10d8+40 Hit Points." / "… you return any number of dead targets to life temporarily, with the same
//     effects and limitations as Raise Dead." / "The raised creatures have a number of temporary Hit Points equal to the Hit Points you gave living
//     creatures, but no normal Hit Points." / "… once revival's duration ends, they lose all temporary Hit Points and die.";
//   - a jolt: "If the target is a corpse that died within the last round, the creature comes back to life with 0 Hit Points … its wounded condition
//     increases by 1." / "The creature's initiative is right before yours." / "… it regains 8d8 Hit Points, and the bolt wakes it up …" with the
//     supercharge (Quickened; Thunderstrike at will) and the cloud (Hidden) until the end of its next turn;
//   - a day's recovery: "… detrimental effects that would be gone after 24 hours end …" / "The targets regain Hit Points and recover from conditions as
//     if they had taken 24 hours of rest …" / "The targets are then temporarily immune for 1 day."
import { htmlToPlainText } from "./description-parser.js";
import { adaptSpellSource } from "./spell-source-adapter.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const blocks = adapted => String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/);
const UUID = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Za-z-]+)(?: (\d+))?\}`;
const SPELL = String.raw`@UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([A-Za-z' ]+)\}`;
const matchAll = (sentences, patterns) => patterns.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
const unread = (sentences, found, allowed = []) => sentences.filter(sentence => !found.some(match => match?.[0] === sentence) && !allowed.some(pattern => pattern.test(sentence)));

/** {parts, notes, claimed, lasting?} or null. */
export function extractRevivalCard(adapted, referencedSpells = null) {
    for (const reader of [raiseDead, revival, jolt, renewal]) { const found = reader(adapted, referencedSpells); if (found) return found; }
    return null;
}

/** Raise Dead's return: its levels by rank, its debilitation, its GM question. */
export function readRaise(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2) return null;
    const target = /^1 dead creature of (\d+)(?:st|nd|rd|th) level or lower$/.exec(adapted.targeting?.target ?? "");
    const lead = split(plain(parts[0]));
    const LEAD = [/^The creature must have died within the past (\d+) days\.$/,
        /^If Pharasma has decided that the creature's time has come \(at the GM's discretion\), or if the creature doesn't wish to return to life, this spell automatically fails, but the cost isn't consumed in the casting\.$/,
        /^If the spell is successful, the creature returns to life with (\d+) Hit Points?, no spells prepared or spell slots available, no points in any pools or any other daily resources, and still with any long-term debilitations of the old body\.$/,
        new RegExp(String.raw`^The time spent in the Boneyard leaves the target temporarily debilitated, making it ${UUID}, ${UUID}, and ${UUID} for (\d+) weeks?; these conditions can't be removed or reduced by any means until the week has passed\.$`)];
    const found = matchAll(lead, LEAD);
    if (!target || !found.every(Boolean) || unread(lead, found, [/^You attempt to call forth\b[^\d]*$/, /^The creature is also permanently changed\b[^\d]*$/]).length) return null;
    const heightened = split(plain(parts[1]));
    const levels = { [Number(adapted.rank)]: Number(target[1]) };
    for (let index = 0; index < heightened.length; index += 2) {
        const level = /^Heightened \((\d+)th\) The maximum level of the target increases to (\d+)\.$/.exec(heightened[index] ?? "");
        const cost = /^The cost increases to the target's level \(minimum 1\) × [\d,]+ gp\.$/.test(heightened[index + 1] ?? "");
        if (!level || !cost) return null;
        levels[Number(level[1])] = Number(level[2]);
    }
    const debilitated = found[3];
    return {
        days: Number(found[0][1]), hp: Number(found[2][1]), levels,
        debilitation: { conditions: [0, 1, 2].map(index => ({ uuid: debilitated[1 + index * 3], slug: debilitated[2 + index * 3].toLowerCase(), value: Number(debilitated[3 + index * 3]) })), days: Number(debilitated[10]) * 7 },
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^(?:You attempt to call forth|The creature is also permanently changed)\b/.test(sentence)), ...heightened]
    };
}

function raiseDead(adapted) {
    const raise = readRaise(adapted);
    if (!raise) return null;
    return {
        parts: [{ key: "raise", title: "The return", kind: "raise", levels: raise.levels, hp: raise.hp, debilitation: raise.debilitation,
            question: `Does its soul return? (It died within the past ${raise.days} days, Pharasma hasn't decided its time has come, and it wishes to return.)`,
            reminder: "Target the dead creature: the GM says whether its soul returns; it then lives with 1 Hit Point and the week's debilitation." }],
        notes: ["The cost (gemstones by the target's level) is the GM's; it isn't consumed if the spell fails.", "The creature has no spells prepared or slots, no points in pools and no other daily resources (the GM's)."],
        claimed: raise.claimed
    };
}

function revival(adapted, referencedSpells) {
    const parts = blocks(adapted);
    if (parts.length !== 1 || adapted.lifecycle?.sustained !== true) return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^All living targets regain (\d+d\d+\+\d+) Hit Points\.$/,
        new RegExp(String.raw`^In addition, you return any number of dead targets to life temporarily, with the same effects and limitations as ${SPELL}\.$`),
        /^The raised creatures have a number of temporary Hit Points equal to the Hit Points you gave living creatures, but no normal Hit Points\.$/,
        /^The raised creatures can't regain Hit Points or gain temporary Hit Points in other ways, and once [a-z ]+ 's duration ends, they lose all temporary Hit Points and die\.$/,
        new RegExp(String.raw`^[A-Z][a-z ]+ can't resurrect creatures killed by ${SPELL} or a death effect\.$`), /^It has no effect on undead\.$/];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found, [/^A burst of healing energy\b[^\d]*$/]).length) return null;
    const source = referencedSpells?.get?.(found[1][1]);
    const raise = source ? readRaise(adaptSpellSource(source, {})) : null;
    const minutes = Number(/^(\d+) minutes?$/.exec(adapted.lifecycle?.duration ?? "")?.[1] ?? NaN);
    if (!raise || !Number.isFinite(minutes) || (adapted.damageComponents ?? []).length !== 1 || String(adapted.damageComponents[0].formula).replace(/\s/g, "") !== found[0][1]) return null;
    return {
        parts: [{ key: "revive", title: "The burst", kind: "revive", formula: found[0][1], debilitation: raise.debilitation,
            question: `Does its soul return for the spell? (It died within the past ${raise.days} days, wasn't killed by ${found[4][2]} or a death effect, Pharasma allows it, and it wishes to return.)`,
            reminder: "Target the living creatures to heal and the dead to raise (undead are skipped): one healing roll; the raised have that many temporary Hit Points until the spell ends." }],
        lasting: { seconds: minutes * 60, sustained: true },
        notes: [],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^A burst of healing energy\b/.test(sentence))]
    };
}

function jolt(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2) return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^If the target is a corpse that died within the last round, the creature comes back to life with 0 Hit Points, and any effects and conditions it had when it died, with the exception of dying, and its wounded condition increases by (\d+)\.$/,
        /^The creature's initiative is right before yours\.$/,
        new RegExp(String.raw`^Regardless of whether the creature came back to life or was already alive, it regains (\d+)d(\d+) Hit Points, and the bolt wakes it up if it was ${UUID}\.$`),
        /^For the duration of the spell, the target is supercharged\.$/,
        new RegExp(String.raw`^It becomes ${UUID} and can use the extra action to (Stand, Stride, Strike, or Fly) \(if it has a fly Speed\)\.$`),
        new RegExp(String.raw`^In addition, it can cast (\d+)(?:st|nd|rd|th)-rank ${SPELL} as an innate spell at will, using your spell DC\.$`),
        /^The cloud that covered the creature remains until the end of the target's next turn\.$/,
        new RegExp(String.raw`^Any creature in the cloud is ${UUID}, and anything outside the cloud is hidden to any creature inside the cloud\.$`)];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found, [/^A dense lightning cloud descends\b[^\d]*$/]).length) return null;
    const step = /^Heightened \(\+1\) The healing increases by (\d+)d(\d+), and the [a-z]+ rank increases by (\d+)\.$/.exec(plain(parts[1]));
    const minutes = Number(/^(\d+) minutes?$/.exec(adapted.lifecycle?.duration ?? "")?.[1] ?? NaN), rank = Number(adapted.rank);
    const [revive, , heal, , quick, thunder, , cloud] = found;
    if (!step || Number(step[2]) !== Number(heal[2]) || !Number.isFinite(minutes)) return null;
    return {
        parts: [{ key: "shock", title: "The jolt", kind: "shock", formula: `(${heal[1]} + ${step[1]} * (@item.rank - ${rank}))d${heal[2]}`, wounded: Number(revive[1]),
            quickened: { uuid: quick[1], actions: quick[4] }, innate: { uuid: thunder[2], name: thunder[3], rank: Number(thunder[1]), step: Number(step[3]), baseRank: rank },
            cloud: { uuid: cloud[1], slug: cloud[2].toLowerCase() }, seconds: minutes * 60, question: "Did it die within the last round?",
            reminder: "Target the living creature or the corpse that died within the last round: back to life (Wounded +1, initiative just before the caster), the healing, the supercharge and the cloud." }],
        lasting: { seconds: minutes * 60, sustained: false },
        notes: ["Anything outside the cloud is hidden to a creature inside it (the GM's)."],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^A dense lightning cloud descends\b/.test(sentence)), plain(parts[1])]
    };
}

function renewal(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 1 || adapted.defense?.kind !== "none") return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^Any detrimental effects that would be gone after (\d+) hours end, though this doesn't shorten the duration of any active spells affecting the targets\.$/,
        /^The targets regain Hit Points and recover from conditions as if they had taken (\d+) hours of rest, but they do not make their daily preparations again or gain any benefits of rest other than healing\.$/,
        /^The targets are then temporarily immune for (\d+) days?\.$/];
    const found = matchAll(lead, LEAD);
    const count = Number(/^up to (\d+) creatures$/.exec(adapted.targeting?.target ?? "")?.[1] ?? NaN);
    if (!found.every(Boolean) || !Number.isFinite(count) || unread(lead, found, [/^The targets experience a day's worth of recovery in an instant\.$/]).length) return null;
    if (Number(found[0][1]) !== 24 || Number(found[1][1]) !== 24) return null;
    return {
        parts: [{ key: "renewal", title: "The day's recovery", kind: "renewal", count, hours: 24, immuneDays: Number(found[2][1]),
            reminder: `Target up to ${count} creatures: Effects that would be gone within 24 hours end (not active spells'), a full day's rest's Hit Points and conditions, then immunity for a day.` }],
        notes: [],
        claimed: lead
    };
}
