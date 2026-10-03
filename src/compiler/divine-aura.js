// A warding aura on the caster's allies that grows on each Sustain (Divine Aura): "Divine power wards the targets, granting each a +1 status bonus to AC and
// saves while in the area." / "Choose an alignment your deity has (…). You can't cast this spell if you don't have a deity or your deity is true neutral. This
// spell gains the trait of the alignment you chose. The bonuses granted by the spell increase to +2 against attacks by-and effects created by-creatures with an
// alignment opposite to the spell (…). These bonuses increase to +4 against effects created by such creatures that attempt to impose the {Controlled} condition
// on a target of your divine aura, as well as against attacks made by creatures summoned by anything opposite in alignment to your divine aura." / "When a
// creature of opposite alignment hits a target with a melee attack, the creature must succeed at a Will save or be {Blinded} for 1 minute. It's then temporarily
// immune for 1 minute." / "The first time you Sustain the Spell each round, the divine aura's radius grows 10 feet." — the caster's emanation: each ally inside
// holds an Effect with the +1 status bonuses and two toggles (against a creature of the opposite alignment: +2; against its Controlled effects or a creature
// it summoned: +4 — PF2e keeps the highest status bonus); the GM's control when such a creature hits a target in melee opens its Will save (Blinded for 1 minute
// on a failure), then it's immune for 1 minute; each Sustain grows the emanation 10 feet. The alignment chosen (and the deity requirement) is the GM's note:
// PF2e's creatures no longer carry alignment traits, so "opposite" is the GM's call (the toggles).
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\}`;
const WARDS = /^Divine power wards the targets, granting each a \+(\d) status bonus to AC and saves while in the area\.$/;
const CHOOSE = /^Choose an alignment your deity has \(chaotic, evil, good, or lawful\)\.$/;
const DEITY = /^You can't cast this spell if you don't have a deity or your deity is true neutral\.$/;
const TRAIT = /^This spell gains the trait of the alignment you chose\.$/;
const OPPOSED = /^The bonuses granted by the spell increase to \+(\d) against attacks by-and effects created by-creatures with an alignment opposite to the spell \([^)]+\)\.$/;
const CONTROLLED = new RegExp(String.raw`^These bonuses increase to \+(\d) against effects created by such creatures that attempt to impose the ${C} condition on a target of your [a-z ]+, as well as against attacks made by creatures summoned by anything opposite in alignment to your [a-z ]+\.$`);
const BLINDS = new RegExp(String.raw`^When a creature of opposite alignment hits a target with a melee attack, the creature must succeed at an? (Fortitude|Reflex|Will) save or be ${C} for 1 (minute|round)\.$`);
const IMMUNE = /^It's then temporarily immune for (\d+) (minutes?|rounds?|hours?)\.$/;
const GROWS = /^The first time you Sustain the Spell each round, the [a-z ]+'s radius grows (\d+) feet\.$/;

/** {html, defense, memberRules, lingering, immunity, notes, sentences} or null. */
export function rewriteDivineAura(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || adapted.targeting?.area?.type !== "emanation" || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    if (!/^allies in the area$/i.test(String(adapted.targeting?.target ?? "").trim()) || !(adapted.activation?.traits ?? []).includes("aura")) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    if (!minutes || /<hr\s*\/?>/i.test(html)) return null;
    const raw = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].flatMap(match => match[1].replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/)).filter(Boolean);
    const plain = raw.map(sentence => htmlToPlainText(sentence).replace(/\s+/g, " ").trim());
    if (raw.length !== 9) return null;
    const wards = WARDS.exec(plain[0]), opposed = OPPOSED.exec(plain[4]), controlled = CONTROLLED.exec(raw[5]), blinds = BLINDS.exec(raw[6]), immune = IMMUNE.exec(plain[7]), grows = GROWS.exec(plain[8]);
    if (!wards || !CHOOSE.test(plain[1]) || !DEITY.test(plain[2]) || !TRAIT.test(plain[3]) || !opposed || !controlled || controlled[3] !== "Controlled" || !blinds || !immune || !grows) return null;
    const [base, more, most] = [Number(wards[1]), Number(opposed[1]), Number(controlled[1])];
    if (!(base < more && more < most)) return null;
    const slug = adapted.source?.slug ?? "divine-aura";
    const toggle = (option, label) => ({ key: "RollOption", domain: "all", option: `${slug}-${option}`, toggleable: true, label });
    // (Each its own slug: PF2e keeps one modifier per slug.)
    const bonus = (selector, value, option) => ({ key: "FlatModifier", slug: `${slug}-${selector}${option ? `-${option}` : ""}`, selector, type: "status", value, ...(option ? { predicate: [`${slug}-${option}`] } : {}) });
    const statistic = blinds[1].toLowerCase(), [, , uuid, condition, unit] = blinds;
    const row = text => `<p><strong>${text[0]}</strong> ${text[1]}</p>`;
    const failed = `The target is @UUID[${uuid}]{${condition}} for 1 ${unit}.`;
    const span = immune[2].replace(/s$/, "");
    return {
        html: `<p>The target must attempt a ${blinds[1]} save.</p><hr />${[["Critical Success", "The target is unaffected."], ["Success", "The target is unaffected."], ["Failure", failed], ["Critical Failure", failed]].map(row).join("")}`,
        defense: { kind: "save", statistic, basic: false },
        memberRules: [bonus("ac", base), bonus("saving-throw", base),
            toggle("opposed", "Against a creature of the alignment opposite the aura's"), bonus("ac", more, "opposed"), bonus("saving-throw", more, "opposed"),
            toggle("controlled", "Against an opposite creature's effect imposing Controlled, or a creature summoned by one"), bonus("ac", most, "controlled"), bonus("saving-throw", most, "controlled")],
        lingering: { events: [], initial: false, oncePerRound: false, excludeCaster: true, enemiesOnly: false, area: { type: "emanation", value: Number(adapted.targeting.area.value) }, centre: "caster",
            durationSeconds: Number(minutes[1]) * 60, sustained: true, concealment: false, memberAllies: true,
            sustainGrowth: { feet: Number(grows[1]), optional: false, sourceText: plain[8] },
            gmAction: { actions: ["hit"], label: "hit a target of the aura with a melee attack (a creature of the opposite alignment: it saves)", sourceText: plain[6] },
            notes: [`${plain[1]} ${plain[2]} ${plain[3]}`, "PF2e's creatures carry no alignment: whether a creature is of the opposite alignment is the GM's call (the allies' toggles, and the melee-hit control)."],
            sourceText: [plain[0], plain[4], plain[5], plain[6], plain[7], plain[8]] },
        immunity: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], duration: { value: Number(immune[1]), unit: `${span}s` }, sourceText: plain[7] },
        sentences: plain
    };
}
