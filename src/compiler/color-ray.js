// A ray whose color, rolled on a hit, decides its effect (Chromatic Ray): "Make a spell attack roll. If you hit, roll [[/r 1d4]]{1d4} to see which beam you
// cast. If the ray deals damage, that damage is doubled on a critical hit. …" with the colors ("<strong>Red</strong> (fire) The ray deals @Damage[30[fire]]
// damage to the target." … "<strong>Green</strong> (poison) … @Damage[25[poison]] damage …, and the target must succeed at a Fortitude save or be {Enfeebled 1}
// for 1 minute ({Enfeebled 2} on a critical failure).") and "Heightened (6th) The damage for … each increase by 10. Roll [[/r 1d8]] … using the results for 1-4
// above and the results for 5-8 below." with "Blue" (the effect of {Petrify}; on a critical hit Clumsy 1 while slowed by it), "Indigo" (the effect of {Confusion};
// on a critical hit {Warp Mind} instead), "Violet" (Slowed for 1 minute and a Will save or teleported 120 feet directly away) and "Intense Color" (Dazzled until
// the end of your next turn, or Blinded on a critical hit; roll again and add another color, rerolling 8s) — the caster's spell attack; on a hit the color rolled
// at the cast rank: the stated damage (doubled on a critical hit) of its type, the green's and violet's saves compiled, the borrowed spells' own resolution.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [/^Make a spell attack roll\.$/, /^If you hit, roll \[\[\/r 1d(\d)\]\]\{1d\1\} to see which beam you cast\.$/,
    /^If the ray deals damage, that damage is doubled on a critical hit\.$/, /^Any additional traits that apply to a ray are listed in parentheses just after the name of the color\.$/];
const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{`;
const S = String.raw`@UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}`;
const DEALS = /^The ray deals @Damage\[(\d+)\[([a-z]+)\]\] damage to the target(?:, and the target must succeed at a (Fortitude|Reflex|Will) save or be (@UUID\[[^\]]+\]\{[A-Z][a-z]+ \d\}) for (\d+) minutes? \((@UUID\[[^\]]+\]\{[A-Z][a-z]+ \d\}) on a critical failure\))?\.$/;
const BORROW = new RegExp(String.raw`^The ray has the effect of the ${S} spell\. On a critical hit, (?:the target is (${C}[A-Z][a-z]+ \d\}) as long as it's ${C}Slowed\} by the <em>[a-z ]+<\/em> effect|it has the effect of ${S} instead)\.$`);
const SLOWS = new RegExp(String.raw`^The target is (${C}Slowed\}) for (\d+) minutes?\. It must also succeed at an? (will|fortitude|reflex) save or be teleported (\d+) feet directly away from you \(if there isn't room for it to appear there, it appears in the nearest open space\); this is a teleportation effect\.$`, "i");
const INTENSE = new RegExp(String.raw`^The target is (${C}Dazzled\}) until the end of your next turn, or (${C}Blinded\}) if your attack roll was a critical hit\. Roll again and add the effects of another color \(rerolling results of (\d)\)\.$`);
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The damage for (.+) each increase by (\d+)\. Roll \[\[\/r 1d(\d)\]\]\{1d\4\} to determine the ray's color, using the results for 1-(\d) above and the results for (\d)-(\d) below\.$/;

/** {colorRay, claimed} or null. */
export function compileColorRay(adapted) {
    if (!(adapted.activation?.traits ?? []).includes("attack") || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const lists = [...html.matchAll(/<ol(?: start="(\d+)")?>([\s\S]*?)<\/ol>/g)];
    const [lead, heightenedPart = ""] = html.split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(lead.replace(/<ol[\s\S]*$/, "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const at = sentences.findIndex(sentence => LEAD[0].test(sentence));
    if (lists.length !== 2 || at < 0 || at > 1 || sentences.length !== at + LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[at + index]))) return null;
    if (at === 1 && /\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentences[0])) return null;
    const items = list => [...list.matchAll(/<li>\s*<strong>([^<]+)<\/strong>\s*(?:\(([a-z, ]+)\)\s*)?([\s\S]*?)<\/li>/g)].map(match => ({ name: match[1].trim(), traits: match[2] ? match[2].split(/,\s*/) : [], text: match[3].replace(/\s+/g, " ").trim() }));
    const low = items(lists[0][2]), high = items(lists[1][2]);
    if (low.length !== Number(LEAD[1].exec(sentences[at + 1])[1]) || Number(lists[1][1]) !== low.length + 1 || high.length !== 4) return null;
    const colors = [];
    for (const [index, entry] of low.entries()) {
        const deals = DEALS.exec(entry.text);
        if (!deals) return null;
        colors.push({ roll: index + 1, name: entry.name, traits: entry.traits, damage: { amount: Number(deals[1]), type: deals[2] },
            ...(deals[3] ? { save: { statistic: deals[3].toLowerCase(), failure: deals[4], criticalFailure: deals[6], minutes: Number(deals[5]) } } : {}) });
    }
    const stepText = htmlToPlainText(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/.exec(heightenedPart)?.[0] ?? "").replace(/\s+/g, " ").trim();
    const step = STEP.exec(stepText);
    if (!step || Number(step[5]) !== low.length || Number(step[6]) !== low.length + 1 || Number(step[7]) !== low.length + high.length) return null;
    // ("The damage for 40 fire (Red), … each increase by 10": the named colors' damage at that rank is their own plus the step.)
    const raised = [...step[2].matchAll(/@Damage\[(\d+)\[([a-z]+)\]\]\{([A-Z][a-z]+)\}/g)];
    if (raised.length !== low.length || !raised.every(([, amount, type, name]) => colors.some(color => color.name === name && color.damage.type === type && color.damage.amount + Number(step[3]) === Number(amount)))) return null;
    const notes = [];
    for (const [index, entry] of high.entries()) {
        const roll = low.length + 1 + index;
        const borrow = BORROW.exec(entry.text), slows = SLOWS.exec(entry.text), intense = INTENSE.exec(entry.text);
        if (borrow) colors.push({ roll, name: entry.name, traits: entry.traits, fromRank: Number(step[1]), borrowed: { uuid: borrow[1], name: borrow[2] },
            critical: borrow[3] ? { condition: borrow[3], whileSlowed: true } : { uuid: borrow[6], name: borrow[7] } });
        else if (slows) colors.push({ roll, name: entry.name, traits: entry.traits, fromRank: Number(step[1]), slowed: { condition: slows[1], minutes: Number(slows[3]) },
            teleport: { statistic: slows[4].toLowerCase(), feet: Number(slows[5]) } });
        else if (intense) colors.push({ roll, name: entry.name, traits: entry.traits, fromRank: Number(step[1]), intense: { dazzled: intense[1], blinded: intense[3], reroll: Number(intense[5]) } });
        else return null;
        if (borrow?.[3]) notes.push(`${entry.name}, critical hit: Clumsy 1 while the creature is Slowed by the petrification (the GM removes it then).`);
    }
    return { colorRay: { lowDie: low.length, highDie: low.length + high.length, highFrom: Number(step[1]), raise: Number(step[3]), colors, notes },
        claimed: [...sentences, ...low.map(entry => `${entry.name} ${htmlToPlainText(entry.text)}`), stepText, ...high.map(entry => `${entry.name} ${htmlToPlainText(entry.text)}`)] };
}
