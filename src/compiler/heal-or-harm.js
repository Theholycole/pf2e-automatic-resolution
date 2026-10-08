// Heal or harm: one roll of void or vitality energy that heals the creatures
// that energy heals and harms the others (basic save).
//   "If the target is a living creature, you deal 1d8 void damage to it, and it gets a basic Fortitude save.
//    If the target is a willing undead creature, you restore that amount of Hit Points."
// Action paragraphs ("1 The spell has a range of touch.", "2 … increase the Hit Points restored by 8.",
// "3 … in a @Template[emanation|distance:30]. This targets all living and undead creatures in the area.")
// are PF2e variants; each variant is judged against its own item data:
//   - both sides (1 and 3 actions): a basic save card in dual mode (the creature decides heal or harm);
//   - healing only (the 2-action healing variant): direct healing, with the extra Hit Points in its formula;
//   - damage only (the 2-action damage variant): an ordinary basic save.
// The item offering all action counts ("1 to 3") is the variants' base and is left alone.
import { htmlToPlainText } from "./description-parser.js";
import { DETERMINES as INTRO } from "./text-patterns.js";

const DICE = String.raw`(\d+d\d+)`;
const KIND = String.raw`(?:an? )?(willing )?(living|undead)(?: creature)?`;
const NARRATION = /^You channel (void|vital) energy to (?:harm|damage|heal) the (?:living|undead) or (?:harm|damage|heal) the (?:living|undead)\.$/;
const HARM = new RegExp(String.raw`^If the target is ${KIND}, you deal (?:${DICE}|that amount of) (void|vitality) damage to it, and it gets a basic (Fortitude|Reflex|Will) save\.$`);
const HEAL = new RegExp(String.raw`^If the target is ${KIND}, you restore (?:${DICE}|that amount of) Hit Points\.$`);
const ONE = /^1 The spell has a range of touch\.$/;
const TWO = /^2(?: \([a-z, ]+\))? The spell has a range of (\d+) feet\. If you're healing an? (living|undead) creature, increase the Hit Points restored by (\d+)\.$/;
const THREE = /^3(?: \([a-z, ]+\))? You disperse (void|vital) energy in an? @Template\[emanation\|distance:(\d+)\]\. This targets all living and undead creatures in the (?:area|burst|emanation)\.$/;

const SIDE = { living: { kind: "living-creature" }, undead: { kind: "undead-or-void-healing" } };

/** Parses the heal-or-harm grammar; null when any rules sentence is outside it. */
function parse(html) {
    const [base] = String(html ?? "").split(/<hr\b/i);
    const paragraphs = base.split(/<\/p>/i).map(value => htmlToPlainText(value).replace(/\s+/g, " ").trim()).filter(Boolean);
    const lead = paragraphs[0]?.split(/(?<=[.!?])\s+(?=[A-Z])/) ?? [];
    if (lead.length !== 4 || !NARRATION.test(lead[0]) || !INTRO.test(lead[3])) return null;
    const harm = HARM.exec(lead[1]) ?? HARM.exec(lead[2]);
    const heal = HEAL.exec(lead[1]) ?? HEAL.exec(lead[2]);
    if (!harm || !heal) return null;
    const energy = harm[4];
    const [harmed, healed] = energy === "void" ? ["living", "undead"] : ["undead", "living"];
    // The damage side names the harmed creature, the healing side the other; one side gives the dice.
    if (harm[2] !== harmed || heal[2] !== healed || (harm[3] ? 1 : 0) + (heal[3] ? 1 : 0) !== 1) return null;
    if (paragraphs.length !== 4 || !ONE.test(paragraphs[1])) return null;
    const two = TWO.exec(paragraphs[2]), three = THREE.exec(paragraphs[3]);
    if (!two || two[2] !== healed || !three || (three[1] === "vital" ? "vitality" : "void") !== energy) return null;
    return {
        energy, harmed, healed, dice: harm[3] ?? heal[3], statistic: harm[5].toLowerCase(),
        twoAction: { range: Number(two[1]), extra: Number(two[3]) }, area: Number(three[2]),
        sourceText: paragraphs.join(" ")
    };
}

const statName = statistic => statistic[0].toUpperCase() + statistic.slice(1);

/**
 * Rewrites a heal-or-harm variant into the canonical form its route compiles: a basic save
 * sentence (dual or damage only) or a direct healing sentence. Returns null for anything else.
 */
// Soothing Mist: "The mist restores 2d8 Hit Points to a target living creature and ends one source of persistent acid, bleed, fire, poison, or
// void damage affecting it." / "If the creature is taking persistent damage from multiple sources, you select which one is removed." /
// "Against an undead target, you deal 2d8 vitality damage (basic Fortitude save); if it fails the save, it also takes
// @Damage[(@item.rank)[persistent,vitality]] damage." with "Heightened (+1) The amount of healing (or damage to an undead target) increases by
// 1d8, and the persistent vitality damage to an undead creature increases by 1."
const MIST_HEAL = /^The [a-z]+ restores (\d+d\d+) Hit Points to a target living creature and ends one source of persistent ((?:[a-z]+, )+(?:or )?[a-z]+) damage affecting it\.$/;
const MIST_PICK = /^If the creature is taking persistent damage from multiple sources, you select which one is removed\.$/;
const MIST_HARM = /^Against an undead target, you deal (\d+d\d+) vitality damage \(basic (Fortitude|Reflex|Will) save\); if it fails the save, it also takes @Damage\[(\(@item\.rank\))\[persistent,vitality\]\] damage\.$/;
const MIST_STEP = /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The amount of healing \(or damage to an undead target\) increases by (\d+d\d+), and the persistent vitality damage to an undead creature increases by 1\.\s*<\/p>$/;

function rewriteMist(adapted) {
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1 || !/^1 willing living creature or 1 undead creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 4 || /\d|@|\bdamage\b/i.test(sentences[0])) return null;
    const heal = MIST_HEAL.exec(sentences[1]), harm = MIST_HARM.exec(sentences[3]), step = MIST_STEP.exec(rest[0]);
    const components = adapted.damageComponents ?? [];
    if (!heal || !MIST_PICK.test(sentences[2]) || !harm || !step || heal[1] !== harm[1] || components.length !== 1 || String(components[0].formula).replace(/\s+/g, "") !== heal[1]
        || components[0].type !== "vitality" || JSON.stringify(components[0].kinds) !== '["damage","healing"]' || adapted.defense?.basic !== true || adapted.defense.statistic !== harm[2].toLowerCase()
        || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== 1 || adapted.heightening.damage?.[components[0].id] !== step[1]) return null;
    const types = heal[2].replace(/\bor /, "").split(/,\s*/).map(type => type.trim());
    return { mode: "dual", html: `<p>You deal ${components[0].formula} vitality damage to the target (basic ${harm[2]} save).</p>`, damageKinds: ["damage"],
        evidence: { energy: "vitality", time: String(adapted.activation?.time ?? "").trim(), sourceText: sentences.slice(1).join(" ") },
        constraints: { sourceText: adapted.targeting.target, supportsActorTargets: true, complete: true, predicates: [] },
        persistentRider: { formula: `${harm[3]}[persistent,vitality]`, sourceText: sentences[3] },
        persistentRemoval: { types, sourceText: `${sentences[1]} ${sentences[2]}` } };
}

export function rewriteHealOrHarm(adapted) {
    const mist = rewriteMist(adapted);
    if (mist) return mist;
    const grammar = parse(adapted.descriptionHTML);
    if (!grammar) return null;
    const time = String(adapted.activation?.time ?? "").trim();
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].type).toLowerCase() !== grammar.energy) return null;
    const component = components[0];
    const formula = String(component.formula).replace(/\s+/g, "");
    const kinds = JSON.stringify(component.kinds ?? []);
    const area = adapted.targeting?.area;
    const range = String(adapted.targeting?.range ?? "").trim().toLowerCase();
    const basicSave = adapted.defense?.kind === "save" && adapted.defense.basic === true && adapted.defense.statistic === grammar.statistic;
    const rest = String(adapted.descriptionHTML).split(/(?=<hr\b)/i).slice(1).join("");
    const saveHTML = recipients => `<p>You deal ${component.formula} ${grammar.energy} damage to ${recipients} (basic ${statName(grammar.statistic)} save).</p>${rest}`;
    const evidence = { energy: grammar.energy, time, sourceText: grammar.sourceText };
    // Both sides: touch (1 action) or the emanation (3 actions); the roll heals or harms by creature.
    if (kinds === JSON.stringify(["damage", "healing"]) && formula === grammar.dice && basicSave) {
        if (time === "1" && range === "touch" && !area) {
            return { mode: "dual", html: saveHTML("the target"), damageKinds: ["damage"], evidence,
                constraints: { sourceText: adapted.targeting?.target ?? null, supportsActorTargets: true, complete: true, predicates: [] } };
        }
        if (time === "3" && area?.type === "emanation" && Number(area.value) === grammar.area) {
            return { mode: "dual", html: saveHTML("each creature in the area"), damageKinds: ["damage"], evidence,
                constraints: { sourceText: "all living and undead creatures", supportsActorTargets: true, complete: true, predicates: [] } };
        }
        return null;
    }
    // Healing only: the 2-action variant restores the dice plus the extra Hit Points to the healed side.
    if (time === "2" && kinds === JSON.stringify(["healing"]) && adapted.defense?.kind === "none" && !area
        && formula === `${grammar.dice}+${grammar.twoAction.extra}` && range === `${grammar.twoAction.range} feet`) {
        return { mode: "healing", html: `<p>The target regains ${component.formula} Hit Points.</p>${rest}`, evidence,
            constraints: { sourceText: `1 ${grammar.healed} creature`, supportsActorTargets: true, complete: true, predicates: [SIDE[grammar.healed]] } };
    }
    // Damage only: the 2-action variant against the harmed side.
    if (time === "2" && kinds === JSON.stringify(["damage"]) && basicSave && !area && formula === grammar.dice
        && range === `${grammar.twoAction.range} feet`) {
        return { mode: "damage", html: saveHTML("the target"), evidence,
            constraints: { sourceText: `1 ${grammar.harmed} creature`, supportsActorTargets: true, complete: true, predicates: [SIDE[grammar.harmed]] } };
    }
    return null;
}
