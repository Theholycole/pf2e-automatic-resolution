// A patron that unravels a creature's training (Unravel Knowledge): "Your patron reaches into the target's mind, plucking out their past training like
// pulling a thread from a cloth. Choose a single action, activity, or spell you know the target can use, … The target attempts a Will save." with rows
// "The target is unaffected." / "The target's memories of their ability grow foggy. The first time they use the chosen ability each round, they take 3d8
// mental damage. This ability is less effective if you choose an ability almost anyone can use; the target takes 3d4 mental damage instead if you choose a
// basic action (…) or a skill action that can be used untrained (…)." / "As failure, and the target takes a –2 status penalty to any check or DC for the
// ability the first time they use it each round." (with PF2e's Spell Effect) and "Heightened (+1) The damage increases by 1d8, or by 1d4 for a basic
// action or untrained skill action.": the save; on a failure or worse a note whose controls (the chosen ability, or a basic or untrained one) deal that
// damage once a round when the target uses the ability; the critical failure's penalty PF2e's Effect (its toggle); the choice of ability a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { ATTEMPTS_SAVE as LEAD, NARRATION_RULES } from "./text-patterns.js";

const CHOOSE = /^Choose a single action, activity, or spell you know the target can use,/;
const FAILURE = /^The target's memories of their ability grow foggy\. The first time they use the chosen ability each round, they take (\d+)d(\d+) ([a-z]+) damage\. This ability is less effective if you choose an ability almost anyone can use; the target takes (\d+)d(\d+) \3 damage instead if you choose a basic action \([^)]*\) or a skill action that can be used untrained \([^)]*\)\.$/;
const CRITICAL = /^As failure, and (the target takes a –(\d) (status) penalty to any check or DC for the ability the first time they use it each round)\.$/;
const STEP = /^Heightened \(\+(\d)\) The damage increases by (\d)d(\d+), or by (\d)d(\d+) for a basic action or untrained skill action\.$/;

/** {html, notes, penalty, reminder, sentences} or null. */
export function rewriteKnowledgeUnravel(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained !== true) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const lead = LEAD.exec(sentences.at(-1) ?? ""), chooseAt = sentences.findIndex(sentence => CHOOSE.test(sentence));
    if (!lead || chooseAt < 1 || sentences.slice(0, chooseAt).some(sentence => NARRATION_RULES.test(sentence)) || lead[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
    const link = /@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/.exec(table)?.[0];
    const failure = FAILURE.exec(plain("Failure")), critical = CRITICAL.exec(plain("Critical Failure").replace(/\s*Spell Effect: .*$/, "")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    // (Three rows: a critical success is a success's.)
    if (plain("Success") !== "The target is unaffected." || !failure || !critical || !step || !link || row("Critical Success") || step[3] !== failure[2] || step[5] !== failure[5]) return null;
    const type = failure[3], interval = Number(step[1]);
    const trigger = { trigger: "ability-used", type, frequency: "round", endsSpell: false, baseRank: Number(adapted.rank) || 1,
        variants: [{ label: "the chosen ability", dice: Number(failure[1]), die: Number(failure[2]), heightening: { interval, dice: Number(step[2]) } },
            { label: "a basic action or an untrained skill action (if that's what you chose)", dice: Number(failure[4]), die: Number(failure[5]), heightening: { interval, dice: Number(step[4]) } }] };
    const note = sourceText => ({ label: "Unraveled knowledge", text: `The first time each round it uses the chosen ability, it takes ${failure[1]}d${failure[2]} ${type} damage (${failure[4]}d${failure[5]} for a basic action or an untrained skill action): use the control.`,
        sourceText, claimsRow: true, triggeredDamage: { ...trigger, variants: trigger.variants.map(variant => ({ ...variant })) } });
    return {
        html: `<p>${sentences.slice(0, chooseAt).join(" ")} The target attempts a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected. ${link}</p>`,
        notes: { failure: note(plain("Failure")), criticalFailure: note(plain("Failure")) },
        penalty: { claimText: critical[1], value: -Number(critical[2]), type: critical[3] },
        reminder: { kind: "spell-note", text: sentences.slice(chooseAt, -1).join(" "), sourceText: sentences[chooseAt] },
        sentences: [...sentences, plain("Success"), plain("Failure"), plain("Critical Failure"), htmlToPlainText(heightened).trim(), critical[1]]
    };
}
