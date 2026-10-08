// A spell that ends one condition on its target, or reshapes an object instead (Stone to Flesh): "Manipulating the fundamental particles of matter, you convert stone
// into flesh and blood. You restore a {Petrified} creature to its normal state or transform a stone object into a mass of inert flesh (without stone's Hardness) in
// roughly the same shape." with "Target petrified creature or human-size stone object" — the targeted creature's condition removed (with the Effect that grants it);
// no target creature: the object's change the GM's note.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const RESTORE = /^You restore an? @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\} creature to its normal state or (transform an? [a-z ]+ object into [^.]+)\.$/;

/** {restoreCondition, claimed} or null. */
export function compileRestoreCondition(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    if (String(adapted.lifecycle?.duration ?? "").trim()) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\s*\/?>/i.test(html)) return null;
    const sentences = html.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => RESTORE.test(sentence));
    if (at < 0 || at !== sentences.length - 1 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(htmlToPlainText(sentence)))) return null;
    const restore = RESTORE.exec(sentences[at]);
    const slug = restore[2].toLowerCase();
    const target = String(adapted.targeting?.target ?? "").trim();
    if (!new RegExp(`^(?:1 )?${slug} creature or [a-z -]+ object$`, "i").test(target)) return null;
    return { restoreCondition: { uuid: restore[1], slug, label: restore[2], objectNote: `Or, on an object: ${restore[3].replace(/^transform/, "it can transform")} (the GM's).` },
        claimed: [htmlToPlainText(sentences[at])] };
}
