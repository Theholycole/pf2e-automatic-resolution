// A sustained spell that animates an object to follow a list of commands, one of them an attack (Animate Rope):
//   "You can give it two commands when you Cast the Spell, and one command each time you Sustain the Spell." with a list: "Bind (attack) The
//   Rope attempts to partially bind a creature. Attempt a spell attack roll against the target's Reflex DC. If you succeed, the target takes a
//   –10-foot circumstance penalty to its Speed (-20-foot on a critical success). This ends if the target Escapes against your spell DC or breaks
//   the Rope. (A standard adventuring Rope has Hardness 2, HP 8, and a Broken Threshold of 4.) @UUID[…]{Spell Effect: Animate Rope}" and
//   narrative commands (Coil, Crawl, Knot, Loop, Tie, Undo), with PF2e's Effect (a degree ChoiceSet of the Speed penalties and the modifier).
// Casting starts a sustained Ongoing record with the command count (two, and one more on each Sustain) and a marker Effect on the caster.
// The record's controls spend a command: the attack command rolls PF2e's spell attack against the target's Reflex DC and applies PF2e's
// Effect with the degree's penalty (ended by an Escape against the spell DC, or with the spell); the other commands post what the object does.
import { htmlToPlainText } from "./description-parser.js";

const COUNTS = { one: 1, two: 2, three: 3 };
const COMMANDS = /^You can give it (one|two|three) commands? when you (?:@UUID\[[^\]]+\]\{Cast the Spell\}|Cast the Spell), and (one|two) commands? each time you (?:@UUID\[[^\]]+\]\{Sustain the Spell\}|Sustain the Spell)\.$/;
const ATTACK = /^The ([A-Z][a-z]+) attempts to partially bind a creature\. Attempt a spell attack roll against the target's (Fortitude|Reflex|Will) DC\. If you succeed, the target takes a [–-](\d+)-foot circumstance penalty to its Speed \([–-](\d+)-foot on a critical success\)\. This ends if the target (?:@UUID\[[^\]]+\]\{Escapes\}|Escapes) against your spell DC or breaks the [A-Z][a-z]+\. \(A standard adventuring [A-Z][a-z]+ has Hardness (\d+), HP (\d+), and a Broken Threshold of (\d+)\.\)$/;
const NARRATION_RULES = /\d|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|can't|must|each|until|rounds?|minutes?|DC|attack|Speed)\b/i;

/** Returns {commandList, claimed} or null. */
export function compileCommandList(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (!minutes || links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length < 2 || sections.length > 3) return null;
    const lead = htmlToPlainText(sections[0]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const commandsAt = lead.findIndex(sentence => COMMANDS.test(sentence));
    if (commandsAt !== lead.length - 1 || lead.length > 2 || lead.slice(0, commandsAt).some(sentence => NARRATION_RULES.test(sentence.replace(/@UUID\[[^\]]+\]\{[^}]+\}/g, "")))) return null;
    const counts = COMMANDS.exec(lead[commandsAt]);
    const items = [...sections[1].matchAll(/<li>\s*<strong>\s*([A-Z][a-z]+)\s*<\/strong>\s*(\(attack\)\s*)?([\s\S]*?)<\/li>/gi)].map(match => ({ name: match[1], attack: Boolean(match[2]), html: match[3].trim() }));
    if (!items.length || (sections[1].match(/<li>/gi) ?? []).length !== items.length) return null;
    const attacks = items.filter(item => item.attack);
    if (attacks.length !== 1) return null;
    const attackText = attacks[0].html.replace(/\s*@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}\s*$/, "");
    if (attackText === attacks[0].html) return null;
    const attack = ATTACK.exec(htmlToPlainText(`<p>${attackText}</p>`).replace(/\s+/g, " ").trim().replace(/@UUID\[[^\]]+\]\{Escapes\}/, "Escapes"));
    if (!attack) return null;
    // The other commands: what the object does, with no rules of their own.
    const others = items.filter(item => !item.attack).map(item => ({ name: item.name, text: htmlToPlainText(`<p>${item.html}</p>`).replace(/\s+/g, " ").trim() }));
    if (others.some(item => /\b(?:damage|saves?|bonus|penalty|conditions?|DC|attack|Speed|Escape)\b|@|\[\[/i.test(item.text))) return null;
    // PF2e's Effect: the penalty by degree, and the Speed modifier from the choice.
    const rules = links[0].document?.mechanics?.rules ?? links[0].document?.rules ?? [];
    const choice = rules.find(rule => rule.key === "ChoiceSet"), modifier = rules.find(rule => rule.key === "FlatModifier");
    const byDegree = Object.fromEntries((choice?.choices ?? []).map(entry => [String(entry.label ?? "").split(".").pop(), entry.value]));
    if (rules.length !== 2 || byDegree.success !== -Number(attack[3]) || byDegree.criticalSuccess !== -Number(attack[4]) || !choice.flag
        || !(modifier?.selector === "land-speed" && modifier.type === "circumstance" && modifier.value === `@item.flags.system.rulesSelections.${choice.flag}`)) return null;
    // Heightened: range and length only.
    if (sections[2] && !/^<p>\s*<strong>\s*Heightened \(\+\d+\)\s*<\/strong>\s*The range increases by \d+ feet, and you can animate \d+ more feet of [A-Z][a-z]+\.\s*<\/p>$/.test(sections[2])) return null;
    return {
        commandList: {
            object: attack[1], atCast: COUNTS[counts[1]], perSustain: COUNTS[counts[2]], durationSeconds: Number(minutes[1]) * 60,
            attack: { name: attacks[0].name, defense: attack[2].toLowerCase(), penalties: { success: Number(attack[3]), criticalSuccess: Number(attack[4]) }, escape: true,
                effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference, choiceRuleIndex: rules.indexOf(choice) },
                objectStats: { hardness: Number(attack[5]), hp: Number(attack[6]), brokenThreshold: Number(attack[7]) } },
            commands: others,
            notes: [`The Bind ends if the target breaks the ${attack[1]} (Hardness ${attack[5]}, HP ${attack[6]}, Broken Threshold ${attack[7]}): delete the Effect.`, "Bind is an attack: the multiple attack penalty applies (choose it on the roll)."]
        },
        claimed: [...lead, ...items.map(item => htmlToPlainText(`<p>${item.html}</p>`).trim()), ...(sections[2] ? [htmlToPlainText(sections[2]).trim()] : [])]
    };
}

export function isExecutableCommandList(data) {
    return Boolean(data) && Number.isInteger(data.atCast) && Number.isInteger(data.perSustain) && Number.isInteger(data.durationSeconds) && data.durationSeconds > 0
        && ["fortitude", "reflex", "will"].includes(data.attack?.defense) && typeof data.attack.effect?.uuid === "string" && Array.isArray(data.commands);
}

/** The attack command's Effect choice for a degree (null on a miss). */
export function commandAttackPenalty(data, degree) {
    return degree === "criticalSuccess" ? -data.attack.penalties.criticalSuccess : degree === "success" ? -data.attack.penalties.success : null;
}
