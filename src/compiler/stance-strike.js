// A stance granting its own Strikes (Clinging Shadows Stance, Wild Winds Stance): "You adopt the stance of clinging shadows. You can make shadow grasp Strikes. These
// deal 1d4 void damage; are in the brawling group; and have the agile, grapple, reach, and unarmed traits. While in clinging shadows stance, you gain a +2
// circumstance bonus to Athletics checks to {Grapple}, and to the DC for creatures to {Escape} from you." / "You can make wind crash unarmed Strikes as ranged Strikes
// against targets within 30 feet. … Wind crash Strikes ignore {Concealment} and all cover." with "While in wild winds stance, you gain a +2 circumstance bonus to AC
// against ranged attacks." — the caster's stance Effect generated from the text (the user's rule: the text, not PF2e's feat Effect, which lacks the Escape DC): the
// Strike (PF2e's Strike rule), the bonuses (a toggle where they apply only against ranged attacks), the ignored concealment and cover a note on the Strike; until
// the caster leaves the stance (entering another stance ends it).
import { htmlToPlainText } from "./description-parser.js";

const STANCE = /^You (?:adopt|take on) the stance of (?:the )?([a-z ]+?)(?:, [^.]+)?\.$/;
const STRIKE = /^You can make ([a-z ]+?) (?:unarmed )?Strikes(?: as ranged Strikes against targets within (\d+) feet)?\.$/;
const DAMAGE = /^These deal (\d+)d(\d+) ([a-z]+) damage; are in the ([a-z]+) group; and have the ([a-z, ]+) traits\.$/;
const GRAPPLE = /^While in (?:<em>)?[a-z ]+(?:<\/em>)?, you gain a \+(\d) (circumstance|status) bonus to Athletics checks to @UUID\[[^\]]+\]\{Grapple\}, and to the DC for creatures to @UUID\[[^\]]+\]\{Escape\} from you\.$/;
const RANGED_AC = /^While in (?:<em>)?[a-z ]+(?:<\/em>)?, you gain a \+(\d) (circumstance|status) bonus to AC against ranged attacks\.$/;
const IGNORES = /^([A-Za-z ]+) Strikes ignore @UUID\[[^\]]+\]\{Concealment\} and all cover\.$/;
const LINK = /^@UUID\[Compendium\.pf2e\.feat-effects\.Item\.[A-Za-z0-9]+\]\{Stance: [^}]+\}$/;
const TRAITS = new Set(["agile", "grapple", "reach", "unarmed", "nonlethal", "propulsive", "finesse", "trip", "shove", "disarm", "forceful", "sweep", "backswing", "parry", "deadly-d8", "deadly-d10"]);

const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** {stanceStrike, claimed} or null. */
export function compileStanceStrike(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    if (!/^until you leave the stance$/i.test(String(adapted.lifecycle?.duration ?? "").trim()) || !(adapted.activation?.traits ?? []).includes("stance")) return null;
    const paragraphs = [...String(adapted.descriptionHTML ?? "").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim()).filter(Boolean);
    if (/<hr/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const sentences = paragraphs.flatMap(paragraph => paragraph.split(/(?<=[.!?])\s+(?=[A-Z@])/)).filter(Boolean);
    let stance = null, strike = null, damage = null;
    const rules = [], claimed = [];
    for (const sentence of sentences) {
        let match;
        if ((match = STANCE.exec(sentence)) && !stance) stance = match[1];
        else if ((match = STRIKE.exec(sentence)) && !strike) strike = { name: match[1], range: match[2] ? Number(match[2]) : null };
        else if ((match = DAMAGE.exec(sentence)) && !damage) {
            const traits = match[5].split(/,\s*(?:and\s+)?|\s+and\s+/).map(trait => trait.trim()).filter(Boolean);
            if (traits.some(trait => !TRAITS.has(trait))) return null;
            damage = { dice: Number(match[1]), die: `d${match[2]}`, type: match[3], group: match[4], traits };
        }
        else if ((match = GRAPPLE.exec(sentence))) rules.push({ key: "FlatModifier", selector: "athletics", type: match[2], value: Number(match[1]), predicate: ["action:grapple"] },
            { key: "FlatModifier", selector: "athletics-dc", type: match[2], value: Number(match[1]), label: "To the DC to Escape from you" });
        else if ((match = RANGED_AC.exec(sentence))) rules.push({ key: "RollOption", domain: "all", option: "stance-vs-ranged", toggleable: true, value: false, label: "Against a ranged attack" },
            { key: "FlatModifier", selector: "ac", type: match[2], value: Number(match[1]), predicate: ["stance-vs-ranged"] });
        else if ((match = IGNORES.exec(sentence)) && strike && match[1].toLowerCase() === strike.name.toLowerCase()) rules.push({ key: "Note", selector: `${slugify(strike.name)}-attack`, title: strike.name.replace(/\b[a-z]/g, letter => letter.toUpperCase()), text: htmlToPlainText(sentence).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") });
        else if (LINK.test(sentence)) { /* PF2e's own stance Effect: generated from the text instead. */ }
        else return null;
        claimed.push(htmlToPlainText(sentence));
    }
    if (!stance || !strike || !damage) return null;
    const label = strike.name.replace(/\b[a-z]/g, letter => letter.toUpperCase());
    rules.unshift({ key: "Strike", category: "unarmed", slug: slugify(strike.name), label, damage: { base: { damageType: damage.type, dice: damage.dice, die: damage.die } }, group: damage.group,
        traits: damage.traits, range: strike.range ? { max: strike.range } : null });
    return { stanceStrike: { name: `Stance: ${adapted.source?.name ?? stance}`, rules }, claimed };
}
