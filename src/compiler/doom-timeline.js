// A doom that draws closer over the spell's rounds (Impending Doom): "… it takes 3 rounds to reach its conclusion. The target must attempt a Will saving throw
// to determine the effects. At the end of the spell's duration, if the target was affected, the target witnesses its death and takes 6d6 mental damage." with
// rows such as "The creature is unaffected for 1 round. On the second round, it becomes {Off-Guard}. Finally, on the third round, it becomes {Frightened 1}. At
// the end of the third round, it takes half damage." / "The creature is immediately off-guard and {Frightened 3}. On the second round, it becomes stunned 1. …":
// each row's immediate conditions applied by the save (for the spell's duration); the later rounds' conditions a timeline the cast's Ongoing record applies as
// each of the spell's rounds begins (at the caster's turn); the damage, half, full or double, rolled once when the spell's duration ends.
import { htmlToPlainText } from "./description-parser.js";

const LINK = /@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Za-z-]+)(?: (\d))?\}/g;
const ROUND_WORDS = { second: 2, third: 3, fourth: 4, fifth: 5 };
const MULTIPLIERS = { half: 0.5, full: 1, double: 2 };
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];

/** "off-guard and @UUID[…]{Frightened 3}" → [{slug, value?, uuid, name}] using the table's own links; null if any part isn't a known condition. */
function conditionList(text, links) {
    const parts = String(text).split(/,\s*(?:and\s+)?|\s+and\s+/).map(part => part.trim()).filter(Boolean);
    const out = [];
    for (const part of parts) {
        const linked = /^@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Za-z-]+)(?: (\d))?\}$/.exec(part);
        const plain = /^([a-z-]+)(?: (\d))?$/.exec(part);
        const name = (linked?.[2] ?? plain?.[1] ?? "").toLowerCase(), value = linked?.[3] ?? plain?.[2];
        const uuid = linked?.[1] ?? links.get(name);
        if (!uuid) return null;
        out.push({ slug: name, ...(value ? { value: Number(value) } : {}), uuid, name: linked?.[2] ?? name });
    }
    return out.length ? out : null;
}

/** {html, damageComponents, timeline, sentences} or null. */
export function rewriteDoomTimeline(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const rounds = /^(\d+) rounds?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!rounds || !table || rest.length || components.length !== 1 || components[0].category || components[0].kinds?.join() !== "damage") return null;
    const total = Number(rounds[1]);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const conclusion = new RegExp(`^(?:.+\\b)?it takes ${total} rounds to reach its conclusion\\.$`);
    const save = /^The target must attempt an? (Fortitude|Reflex|Will) saving throw to determine the effects\.$/.exec(sentences.at(-2) ?? "");
    const damage = /^At the end of the spell's duration, if the target was affected, (?:the target|it) [a-z ]+ and takes (\d+)d(\d+) ([a-z]+) damage\.$/.exec(sentences.at(-1) ?? "");
    const component = components[0], dice = /^(\d+)d(\d+)$/.exec(String(component.formula).replace(/\s+/g, ""));
    if (sentences.length < 3 || !save || save[1].toLowerCase() !== adapted.defense.statistic || !damage || !dice || dice[1] !== damage[1] || dice[2] !== damage[2]
        || String(component.type).toLowerCase() !== damage[3] || !sentences.slice(0, -2).some(sentence => conclusion.test(sentence))
        || sentences.slice(0, -2).some(sentence => /\d+d\d+|@|\b(?:save|bonus|penalty|immune|Sustain)\b/i.test(sentence) && !conclusion.test(sentence))) return null;
    // "Heightened (+1) The damage increases by 2d6.": the dice added each rank.
    let perRank = 0;
    if (heightened) {
        const step = /^<p><strong>Heightened \(\+1\)<\/strong>\s*The damage increases by (\d+)d(\d+)\.<\/p>$/.exec(heightened.replace(/\s+/g, " "));
        if (!step || step[2] !== dice[2]) return null;
        perRank = Number(step[1]);
    }
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (rows.length !== 4) return null;
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const links = new Map([...table.matchAll(LINK)].map(match => [match[2].toLowerCase(), match[1]]));
    const byDegree = {}, immediate = {}, claimed = [];
    for (const [degree, heading] of DEGREES) {
        const text = row(heading);
        if (degree === "criticalSuccess") { if (htmlToPlainText(text).trim() !== "The creature is unaffected.") return null; immediate[degree] = "The creature is unaffected."; claimed.push(text); continue; }
        const parts = text.split(/(?<=\.)\s+(?=[A-Z])/);
        const first = /^The creature is (?:unaffected for 1 round|immediately (.+))\.$/.exec(parts[0] ?? "");
        const end = /^At the end of the (\w+) round, (?:it|the creature) takes (half|full|double) damage\.$/.exec(parts.at(-1) ?? "");
        if (!first || !end || ROUND_WORDS[end[1]] !== total) return null;
        const now = first[1] ? conditionList(first[1], links) : [];
        if (!now) return null;
        const steps = [];
        for (const part of parts.slice(1, -1)) {
            const later = /^(?:Finally, )?[Oo]n the (\w+) round, it (?:also )?becomes (.+)\.$/.exec(part);
            const round = ROUND_WORDS[later?.[1]];
            const conditions = later ? conditionList(later[2], links) : null;
            if (!round || round > total || !conditions || steps.some(step => step.round >= round)) return null;
            steps.push({ round, conditions, sourceText: htmlToPlainText(part) });
        }
        if (!steps.length) return null;
        immediate[degree] = now.length ? `The creature is ${now.map(c => `@UUID[${c.uuid}]{${c.name}${c.value ? ` ${c.value}` : ""}}`).join(" and ")}.` : "The creature is unaffected.";
        byDegree[degree] = { steps, multiplier: MULTIPLIERS[end[2]], sourceText: htmlToPlainText(text) };
        claimed.push(text);
    }
    const narration = sentences.slice(0, -2).join(" ");
    return {
        html: `<p>${narration} The target must attempt a ${save[1]} save.</p><hr />` + DEGREES.map(([degree, heading]) => `<p><strong>${heading}</strong> ${immediate[degree]}</p>`).join(""),
        damageComponents: [],
        heightening: null,
        timeline: { rounds: total, byDegree, damage: { dice: Number(dice[1]), faces: Number(dice[2]), type: damage[3], perRank, baseRank: Number(adapted.rank ?? adapted.level ?? 0) || null,
            sourceText: sentences.at(-1) }, sourceText: sentences.at(-1) },
        sentences: [...sentences, ...DEGREES.map(([, heading]) => htmlToPlainText(row(heading))), ...(heightened ? [htmlToPlainText(heightened)] : [])]
    };
}
