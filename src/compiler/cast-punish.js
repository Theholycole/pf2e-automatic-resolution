// A spell attack whose hit also punishes the target's spellcasting (Rend Magic): "Make a melee spell attack against the target's AC. If it hits, the
// target takes 3d10 force damage, then takes @Damage[(ceil(@item.rank/2)-1)d10[force]] damage each time it Casts a Spell for 1 minute; on a critical
// hit, double the initial damage and the damage when the target casts spells. This spell ends immediately if the target ends its turn without
// Casting a Spell." with "Heightened (+2) The initial force damage increases by 2d10, and the force damage taken whenever the target casts a spell
// increases by 1d10."
// Written out as the attack's table (double on a critical hit); the hit rows carry a note for 1 minute whose Ongoing control deals the cast damage
// at the cast rank (doubled after a critical hit) each time the GM reports the target Casting a Spell; ending it when a turn passes without a spell
// is the GM's (the note says so).
import { htmlToPlainText } from "./description-parser.js";

const PUNISH = /^Make a (melee|ranged) spell attack against the target's AC\. If it hits, the target takes (\d+d\d+) ([a-z]+) damage, then takes @Damage\[(\([^\[\]]+\)d\d+)\[([a-z]+)\]\] damage each time it Casts a Spell for (\d+) (minute|round)s?; on a critical hit, double the initial damage and the damage when the target casts spells\. This spell ends immediately if the target ends its turn without Casting a Spell\.$/;
const STEP = /^Heightened \(\+(\d)\) The initial ([a-z]+) damage increases by (\d+d\d+), and the \2 damage taken whenever the target casts a spell increases by 1d(\d+)\.$/;

/** {html, notes: {criticalSuccess, success}, sourceText} or null. */
export function rewriteCastPunish(adapted) {
    if (!adapted.activation?.traits?.includes("attack") || (adapted.defense?.kind ?? "none") !== "none" || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const joined = sentences.slice(1).join(" ");
    const punish = PUNISH.exec(joined);
    if (!punish || /\d|@|\b(?:damage|save)\b/i.test(sentences[0])) return null;
    const [, reach, dice, type, castFormula, castType, length, unit] = punish;
    if (String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type || castType !== type) return null;
    // The cast damage's formula must step by one die every 2 ranks from 0 at the spell's rank (ceil(rank/2)-1 at an odd rank).
    const step = STEP.exec(htmlToPlainText(rest[0]).replace(/\s+/g, " ").trim());
    if (!step || step[2] !== type || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(step[1]) || adapted.heightening.damage?.[components[0].id] !== step[3]) return null;
    if (castFormula !== `(ceil(@item.rank/2)-1)d${step[4]}` || Number(step[1]) !== 2) return null;
    const duration = { mode: "fixed", value: Number(length), unit: `${unit}s`, expiry: unit === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: `for ${length} ${unit}` };
    // (The dice at the cast rank: ceil(rank/2) − 1.)
    const base = Math.ceil(Number(adapted.rank) / 2) - 1;
    if (base < 1) return null;
    const note = (formula, doubled) => ({ label: "Rent magic", text: `Each time it Casts a Spell, it takes ${doubled ? "double " : ""}{amount}d${step[4]} ${type} damage (the GM reports it in Ongoing spells). The spell ends if it ends its turn without Casting a Spell (GM: delete this Effect then).`,
        rankAmount: { base, step: 1, interval: 2, baseRank: Number(adapted.rank), multiplier: 1 },
        sourceText: joined, gmPlays: true, duration, triggeredDamage: { trigger: "spell-cast", formula, type, frequency: "each", endsSpell: false, baseRank: Number(adapted.rank) } });
    return {
        html: `<p>Make a ${reach} spell attack against the target's AC.</p><hr /><p><strong>Critical Success</strong> The target takes double damage.</p><p><strong>Success</strong> The target takes full damage.</p>`
            + `<hr />${rest[0].trim().replace(/, and the [a-z]+ damage taken whenever the target casts a spell increases by 1d\d+\./, ".")}`,
        notes: { criticalSuccess: note(`2*(${castFormula})`, true), success: note(castFormula, false) },
        sourceText: [sentences[0], joined, htmlToPlainText(rest[0]).trim()]
    };
}
