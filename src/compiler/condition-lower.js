// A spell that lowers a condition, its versions by the actions spent (Hope Prevails): "You immediately reduce the target's Frightened condition by 2. If this
// would reduce the frightened condition to 0 and the condition was caused by an ongoing effect, you can attempt to counteract a single fear effect that the
// target suffers from. The number of actions you spend when Casting this Spell determines its targets, range, area, and other parameters." with "1 The spell
// has a range of touch." / "2 (concentrate) The spell has a range of 30 feet. The target also gains a +2 status bonus to saves against fear effects for 1
// minute. {Effect: Hope Prevails}" / "3 (concentrate) You share feelings of hope in a 30-foot emanation. This targets all creatures in the burst.": each
// version a `condition-lower` plan — the target's (or each creature's in the emanation) condition lowered by the amount; one an Effect keeps (an ongoing
// effect's) left, with the counteract the GM rolls; the two-action version's module Effect, proved against its sentence.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LOWER = /^You immediately reduce the target's @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\} condition by (\d)\.$/;
const COUNTERACT = /^If this would reduce the ([a-z]+) condition to 0 and the condition was caused by an ongoing effect, you can attempt to counteract a single ([a-z]+) effect that the target suffers from\.$/;
const VERSIONS = /^The number of actions you spend when Casting this Spell determines its targets, range, area, and other parameters\.$/;
const ONE = /^The spell has a range of touch\.$/;
const TWO = /^\(concentrate\) The spell has a range of (\d+) feet\. The target also gains a \+(\d) status bonus to saves against ([a-z]+) effects for 1 minute\. @UUID\[(Compendium\.[A-Za-z0-9_.-]+\.Item\.([A-Za-z0-9]{16}))\]\{([^}]+)\}$/;
const THREE = /^\(concentrate\) You share feelings of [a-z]+ in a @Template\[type:emanation\|distance:(\d+)\]\. This targets all creatures in the burst\.$/;

/** The module's Effect matches the sentence: one status bonus to saves against the trait's effects, for 1 minute. */
function effectMatches(effect, bonus, trait) {
    const rules = effect?.mechanics?.rules ?? effect?.system?.rules ?? [], duration = effect?.mechanics?.duration ?? effect?.system?.duration;
    return rules.length === 1 && rules[0].key === "FlatModifier" && rules[0].selector === "saving-throw" && rules[0].type === "status" && Number(rules[0].value) === bonus
        && JSON.stringify(rules[0].predicate) === JSON.stringify([trait]) && duration?.value === 1 && duration.unit === "minutes";
}

/** {versions: [{actions, conditionLower}], sentences} or null. */
export function extractConditionLower(item, catalog = null) {
    if (!/^1 to 3$/.test(String(item?.system?.time?.value ?? "").trim()) || Object.keys(item.system?.overlays ?? {}).length || Object.keys(item.system?.damage ?? {}).length
        || item.system?.defense?.save || String(item.system?.duration?.value ?? "").trim()) return null;
    const html = String(item.system?.description?.value ?? "");
    if (/<hr\s*\/?>/i.test(html)) return null;
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1].replace(/<span class="action-glyph">\s*(\d)\s*<\/span>/g, "[$1] ")).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 4) return null;
    const lead = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const version = (text, n) => text.startsWith(`[${n}] `) ? text.slice(4).trim() : null;
    const lower = LOWER.exec(lead[1] ?? ""), counteract = COUNTERACT.exec(lead[2] ?? ""), two = TWO.exec(version(paragraphs[2], 2) ?? ""), three = THREE.exec(version(paragraphs[3], 3) ?? "");
    if (lead.length !== 4 || NARRATION_RULES.test(lead[0]) || !lower || !counteract || !VERSIONS.test(lead[3]) || !ONE.test(version(paragraphs[1], 1) ?? "") || !two || !three) return null;
    const slug = lower[2].toLowerCase();
    if (counteract[1] !== slug || counteract[2] !== two[3] || !new RegExp(`^1 ${slug} creature$`, "i").test(String(item.system?.target?.value ?? "").trim())) return null;
    const effect = catalog?.get?.(two[5]) ?? null;
    if (!effect || !effectMatches(effect, Number(two[2]), two[3])) return null;
    const base = { uuid: lower[1], slug, label: lower[2], by: Number(lower[3]), counteract: { trait: counteract[2], text: lead[2] } };
    return {
        versions: [
            { actions: 1, conditionLower: { ...base, recipients: "target", range: "touch" } },
            { actions: 2, conditionLower: { ...base, recipients: "target", range: Number(two[1]), effect: { uuid: two[4], name: two[6], claimText: `The target also gains a +${two[2]} status bonus to saves against ${two[3]} effects for 1 minute.` } } },
            { actions: 3, conditionLower: { ...base, recipients: "emanation", radius: Number(three[1]) } }
        ],
        sentences: [...lead.slice(1), ...paragraphs.slice(1)]
    };
}
