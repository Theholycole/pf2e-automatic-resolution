// A mantis symbol whose claws rake on each new bleed (Achaekek's Clutch): "You mark the holy symbol of Achaekek in a visible location on the target's
// body." with rows "The target is unaffected." / "The target is marked by Achaekek's symbol. For 1 minute, the first time per round that the target gains
// @UUID[…]{Persistent Bleed Damage}, they immediately take that amount of slashing damage as the mantis claws grow off the symbol and rake them." / "As
// success, but the curse has an unlimited duration." / "As failure, but the DC on the target's flat check to remove persistent bleed damage increases
// to 20 (15 with particularly effective assistance).": the target's save; on a success or worse a note (1 minute, or unlimited) whose control the GM
// uses when it gains persistent bleed damage — that amount as slashing damage, once a round; the critical failure's flat-check DC in its note.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const SUCCESS = /^The target is marked by [A-Za-z' ]+\. For (\d+) minutes?, the first time per round that the target gains @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Persistent ([A-Z][a-z]+) Damage\}, they immediately take that amount of ([a-z]+) damage as [^.@]+\.$/;
const FAILURE = /^As success, but the curse has an unlimited duration\.$/;
const CRITICAL = /^As failure, but (the DC on the target's flat check to remove persistent ([a-z]+) damage increases to (\d+) \((\d+) with particularly effective assistance\))\.$/;

/** {html, notes: {degree: note}, sentences} or null. */
export function rewriteMantisMark(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (!sentences.length || sentences.some(sentence => NARRATION_RULES.test(sentence))) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(row("Success").replace(/\s+/g, " ")), critical = CRITICAL.exec(plain("Critical Failure"));
    if (rows.length !== 4 || plain("Critical Success") !== "The target is unaffected." || !success || !FAILURE.test(plain("Failure")) || !critical
        || critical[2] !== success[2].toLowerCase()) return null;
    const persistentType = success[2].toLowerCase(), type = success[3], minutes = Number(success[1]);
    const trigger = { trigger: "bleed-gained", persistentType, type, frequency: "round", endsSpell: false, baseRank: Number(adapted.rank) || 1 };
    const text = `The first time each round it gains persistent ${persistentType} damage, it takes that amount of ${type} damage (use the control; give the amount).`;
    const note = (sourceText, duration, extra = "") => ({ label: "Mark of the mantis", text: `${text}${extra}`, sourceText, claimsRow: true, duration, triggeredDamage: { ...trigger } });
    return {
        html: `<p>${sentences.join(" ")} The target must attempt a ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p><p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        notes: {
            success: note(plain("Success"), { mode: "fixed", value: minutes, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `For ${minutes} minute${minutes === 1 ? "" : "s"}` }),
            failure: note(plain("Failure"), { mode: "unlimited", sourceText: "an unlimited duration" }),
            criticalFailure: note(plain("Critical Failure"), { mode: "unlimited", sourceText: "an unlimited duration" }, ` ${critical[1][0].toUpperCase()}${critical[1].slice(1)} (the GM's).`)
        },
        sentences: [...sentences, plain("Critical Success"), plain("Success"), plain("Failure"), plain("Critical Failure")]
    };
}
