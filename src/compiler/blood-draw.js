// The target's blood drawn into the caster (Call the Blood): "You deal 8d4 void damage to the target." / "If the target takes damage, its blood
// flows into your mouth." / "If you're a living creature and don't have void healing, you're @UUID[…]{Sickened 2}." / "If you're undead (or
// living but have void healing), you can choose to either gain temporary Hit Points equal to half of the void damage the target takes (after
// applying resistance and the like) and become @UUID[…]{Quickened} for 1 round, or forgo the temporary Hit Points and become quickened for 1
// minute." / "You can use this extra action only to Step, Stride, or Strike." / "You lose any remaining temporary Hit Points after 1 minute.":
// the target's basic save; after Finalize, if the target lost Hit Points, the card gives the caster its part by what the caster is (PF2e's
// mode of being and void healing): Sickened 2, or the caster's pick of the two.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, NARRATION_RULES_NO_DAMAGE as NARRATION_RULES } from "./text-patterns.js";

const DEAL = /^You deal (\d+d\d+) ([a-z]+) damage to the target\.$/;
const FLOWS = /^If the target takes damage, its blood flows into your mouth\.$/;
const LIVING = new RegExp(String.raw`^If you're a living creature and don't have void healing, you're (${C}(Sickened) (\d)\})\.$`);
const UNDEAD = new RegExp(String.raw`^If you're undead \(or living but have void healing\), you can choose to either gain temporary Hit Points equal to half of the ([a-z]+) damage the target takes \(after applying resistance and the like\) and become (${C}(Quickened)\}) for 1 round, or forgo the temporary Hit Points and become quickened for 1 minute\.$`);
const EXTRA = /^You can use this extra action only to Step, Stride, or Strike\.$/;
const LOSE = /^You lose any remaining temporary Hit Points after 1 minute\.$/;

/** {html, casterDraw, sentences} or null. */
export function rewriteBloodDraw(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    if (!/^1 living creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 7 || NARRATION_RULES.test(sentences[0])) return null;
    const deal = DEAL.exec(sentences[1]), living = LIVING.exec(sentences[3]), undead = UNDEAD.exec(sentences[4]);
    if (!deal || !FLOWS.test(sentences[2]) || !living || !undead || !EXTRA.test(sentences[5]) || !LOSE.test(sentences[6])) return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== deal[1]
        || String(components[0].type).toLowerCase() !== deal[2] || undead[1] !== deal[2]) return null;
    const restriction = sentences[5];
    return {
        html: `<p>${sentences[0]} You deal ${deal[1]} ${deal[2]} damage to the target.</p>${heightened ? `<hr />${heightened}` : ""}`,
        casterDraw: {
            living: { slug: living[2].toLowerCase(), name: living[2], value: Number(living[3]), uuid: /@UUID\[([^\]]+)\]/.exec(living[1])[1] },
            undead: { fraction: 0.5, condition: { slug: undead[3].toLowerCase(), name: undead[3], uuid: /@UUID\[([^\]]+)\]/.exec(undead[2])[1] },
                withTemp: { value: 1, unit: "rounds" }, without: { value: 1, unit: "minutes" }, tempLasts: { value: 1, unit: "minutes" }, restriction },
            sourceText: sentences.slice(2).join(" ")
        },
        sentences: sentences.slice(2)
    };
}
