// A sustained area whose mode the caster picks when casting, each a lingering area of its own (Pyrotechnics): "You turn a fire into either a burst of
// blinding fireworks or a thick cloud of choking smoke, chosen when you Cast the Spell. The spell targets one fire source, which is immediately
// extinguished if it is a non-magical fire the size of a campfire or smaller. If the fire source is a creature, the creature takes 1d6 points of cold
// damage and is not extinguished." with the list ("Fireworks … in a 20-foot-radius burst. The first time you Sustain the Spell each round, you can cause
// the area of fireworks to ascend up to 20 feet, … Creatures that start their turn within the area of the fireworks must attempt a Fortitude save, and are
// then temporarily immune for 1 minute." with rows; "Smoke Cloud … a 20-foot-radius burst centered on the targeted fire. Creatures within the smoke cloud
// take a -4 circumstance penalty to visual Perception checks, … Creatures that start their turn within the smoke cloud must attempt a Fortitude save, and
// are then temporarily immune for 1 minute." with rows) — each mode's text rewritten to the lingering area's wording (the turn-start save and the
// immunity after it), compiled on its own; the card asks the mode. The fire source, the area's rise or fall, the smoke's Perception penalties and its
// critical failure's "can't recover while in the area" are reminders.
import { htmlToPlainText } from "./description-parser.js";
import { LABELS as DEGREES, squashedSentences as split } from "./text-patterns.js";

const LEAD = [/^You turn a fire into either a burst of blinding fireworks or a thick cloud of choking smoke, chosen when you Cast the Spell\.$/,
    /^The spell targets one fire source, which is immediately extinguished if it is a non-magical fire the size of a campfire or smaller\.$/,
    /^If the fire source is a creature, the creature takes (\d+d\d+) points of ([a-z]+) damage and is not extinguished\.$/];
const AREA = /\bin an? (\d+)-foot-radius burst\b|\bfill an? (\d+)-foot-radius burst\b/;
const ASCEND = /^The first time you Sustain the Spell each round, you can cause the (?:area of fireworks|smoke cloud) to (ascend|descend) up to (\d+) feet, but you cannot move the area laterally\.$/;
const START = /^Creatures that start their turn within the (?:area of the fireworks|smoke cloud) must attempt an? (Fortitude|Reflex|Will) save, and are then temporarily immune for (\d+) (minute|hour)s?\.$/;
const SMOKE_PENALTY = /^Creatures within the smoke cloud take a [-–−](\d) circumstance penalty to visual Perception checks, and creatures outside the smoke cloud take a [-–−]\1 circumstance penalty to visual Perception checks to detect creatures or objects within it\.$/;
const NO_RECOVERY = /^The creature is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Sickened \d\}|Sickened \d) and cannot recover from the sickened condition while in the area of the smoke cloud\.$/;

/** {modes: [{key, label, html, area, notes}], notes, sentences} or null. */
export function extractLingeringModes(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length || !/^1 fire$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const list = /<ul>([\s\S]*)<\/ul>/i.exec(html);
    if (!list || /<hr/i.test(html)) return null;
    const lead = split(htmlToPlainText(html.slice(0, list.index)));
    if (lead.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const cold = LEAD[2].exec(lead[2]);
    const items = [...list[1].matchAll(/<li>\s*<strong>\s*([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s*<\/strong>([\s\S]*?)<\/li>/gi)];
    if (items.length !== 2) return null;
    const modes = [], claimed = [...lead];
    for (const [, label, body] of items) {
        const intro = body.split(/<p>/i)[0];
        const sentences = split(htmlToPlainText(intro));
        const rows = Object.fromEntries([...body.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)].map(match => [DEGREES[match[1]], match[2].replace(/\s+/g, " ").trim()]));
        const start = sentences.map(sentence => START.exec(sentence)).find(Boolean), ascend = sentences.map(sentence => ASCEND.exec(sentence)).find(Boolean);
        const area = AREA.exec(sentences.join(" "));
        if (!start || !ascend || !area || start[1].toLowerCase() !== adapted.defense.statistic) return null;
        const penalty = sentences.find(sentence => SMOKE_PENALTY.test(sentence));
        const others = sentences.filter(sentence => !START.test(sentence) && !ASCEND.test(sentence) && sentence !== penalty);
        if (others.length !== 1 || /\b(?:damage|saves?|bonus|penalty|DC)\b|@/.test(others[0])) return null;
        const notes = [`The ${label.toLowerCase()} can ${ascend[1]} up to ${ascend[2]} feet the first time you Sustain the spell each round (move the region; not laterally).`];
        if (penalty) notes.push(penalty);
        // (Rows: a missing critical success is unaffected; "cannot recover … while in the area" is a note beside its Sickened.)
        const row = degree => {
            const text = rows[degree] ?? (degree === "criticalSuccess" ? "The creature is unaffected." : null);
            if (!text) return null;
            const fixed = text.replace(/^The creature is unaffected$/, "The creature is unaffected.");
            const recovery = NO_RECOVERY.exec(fixed);
            if (recovery) { notes.push("A creature that critically fails can't recover from that Sickened while it's in the smoke cloud."); return `The creature is ${recovery[1].startsWith("@") ? recovery[1] : recovery[1]}.`; }
            return fixed.replace(/is Blinded for 1 minute\.$/, "is @UUID[Compendium.pf2e.conditionitems.Item.XgEqL1kFApUbl5Z2]{Blinded} for 1 minute.");
        };
        const built = Object.fromEntries(Object.values(DEGREES).map(degree => [degree, row(degree)]));
        if (Object.values(built).some(text => !text)) return null;
        modes.push({ key: label.toLowerCase().replace(/[^a-z]+/g, "-"), label, area: { type: "burst", value: Number(area[1] ?? area[2]) }, notes,
            html: `<p>Each creature that starts its turn in the area must attempt a ${start[1]} save. The creature is then temporarily immune for ${start[2]} ${start[3]}${start[2] === "1" ? "" : "s"}.</p><hr />`
                + Object.entries(DEGREES).map(([heading, degree]) => `<p><strong>${heading}</strong> ${built[degree]}</p>`).join("") });
        claimed.push(...sentences, ...Object.values(rows));
    }
    return { modes, sourceCreatureDamage: { formula: cold[1], type: cold[2] }, notes: [`Target the fire source: a non-magical fire the size of a campfire or smaller is extinguished; if the fire source is a creature, it takes ${cold[1]} ${cold[2]} damage (the module deals it to the targeted creature when the area starts) and isn't extinguished. Place the area there.`],
        coldDamage: { formula: cold[1], type: cold[2] }, sentences: claimed };
}

// A swarm around a target whose kind the caster picks (Cinder Swarm): "… They swarm the target and create an aura around it in a 5-foot emanation. The target
// and enemies in the aura are subject to an effect depending on the insects you choose. On subsequent rounds, the first time you Sustain this spell each round,
// you repeat the effect on the target and all your enemies in the insect aura. Pick a type of insect to determine the effects." with "Fire Ants … 3d6 piercing
// damage plus 2d6 persistent fire damage with a basic Reflex save. A creature that fails its save must move 5 feet in a direction of your choice …" and
// "Fireflies (incapacitation) … 3d6 fire damage and can dazzle or blind, depending on the target's Fortitude save." with the fireflies' rows, and
// "Heightened (+1) Increase the ants' piercing damage and fireflies' fire damage by 2d6." — each kind a save plan of its damage (the ants' basic save with
// the push on its failing rows; the fireflies' rows), exposed on the target and the creatures within 5 feet of it when cast and on the first Sustain each
// round (the GM leaves out allies at review).
const SWARM = [/^You breathe life into a mass of fiery critters\.$/,
    /^They swarm the target and create an aura around it in an? @Template\[emanation\|distance:(\d+)\]\.$/,
    /^The target and enemies in the aura are subject to an effect depending on the insects you choose\.$/,
    /^On subsequent rounds, the first time you Sustain this spell each round, you repeat the effect on the target and all your enemies in the insect aura\.$/,
    /^Pick a type of insect to determine the effects\.$/];
const ANTS = /^You create fiery flying ants that deal (\d+d\d+) (piercing) damage plus (\d+d\d+) persistent (fire) damage with a basic (Reflex) save\. A creature that fails its save must move (\d+) feet in a direction of your choice as it tries to escape the biting ants; this happens after all the creatures attempt their saves and can't add new creatures to the aura if the main target moves\.$/;
const FLIES = /^\(incapacitation\) You create a flurry of fireflies that deal (\d+d\d+) (fire) damage and can dazzle or blind, depending on the target's (Fortitude) save\.$/;
const FLY_ROWS = { criticalSuccess: /^The creature takes no damage\.$/, success: /^The creature takes half damage and is (@UUID\[[^\]]+\]\{Dazzled\}) for 1 round\.$/,
    failure: /^The creature takes full damage and is (@UUID\[[^\]]+\]\{Blinded\}) for 1 round\. It's then temporarily immune to being blinded by [a-z ]+ for 24 hours\.$/,
    criticalFailure: /^As failure, but double damage and blinded for 1 minute\.$/ };
const SWARM_STEP = /^Heightened \(\+1\) Increase the ants' piercing damage and fireflies' fire damage by (\d+d\d+)\.$/;

/** {modes, radius, sentences} or null. */
export function extractAuraModes(adapted) {
    if (adapted.defense?.kind && adapted.defense.kind !== "none") return null;
    if (adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, table, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || !heightened || rest.length) return null;
    const list = /<ul>([\s\S]*?)<\/ul>/i.exec(body);
    if (!list) return null;
    const lead = split(htmlToPlainText(body.slice(0, list.index)));
    if (lead.length !== SWARM.length || SWARM.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const items = Object.fromEntries([...list[1].matchAll(/<li>\s*<strong>\s*([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s*<\/strong>([\s\S]*?)<\/li>/gi)].map(match => [match[1], htmlToPlainText(match[2]).replace(/\s+/g, " ").trim()]));
    const ants = ANTS.exec(items["Fire Ants"] ?? ""), flies = FLIES.exec(items["Fireflies"] ?? "");
    const rows = Object.fromEntries([...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)].map(match => [{ "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[match[1]], match[2].replace(/\s+/g, " ").trim()]));
    const step = SWARM_STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!ants || !flies || !step || Object.keys(FLY_ROWS).some(degree => !FLY_ROWS[degree].test(rows[degree] ?? ""))) return null;
    const [, dazzled] = FLY_ROWS.success.exec(rows.success), [, blinded] = FLY_ROWS.failure.exec(rows.failure);
    const entry = (formula, type, category = null) => ({ applyMod: false, category, formula, kinds: ["damage"], materials: [], type });
    return {
        radius: Number(SWARM[1].exec(lead[1])[1]),
        modes: [
            // (The basic save written as its rows, the failing ones with the move: the caster's direction.)
            { key: "fire-ants", label: "Fire ants", basic: false, statistic: ants[5].toLowerCase(), damage: { ants: entry(ants[1], ants[2]), burn: entry(ants[3], ants[4], "persistent") }, heightening: { type: "interval", interval: 1, damage: { ants: step[1] } },
                html: `<p>The target takes ${ants[1]} ${ants[2]} damage and ${ants[3]} persistent ${ants[4]} damage and must attempt a ${ants[5]} save.</p><hr /><p><strong>Critical Success</strong> The target takes no damage.</p>`
                    + `<p><strong>Success</strong> The target takes half damage.</p><p><strong>Failure</strong> The target takes full damage and is pushed ${ants[6]} feet.</p>`
                    + `<p><strong>Critical Failure</strong> The target takes double damage and is pushed ${ants[6]} feet.</p>`, anyDirection: true },
            { key: "fireflies", label: "Fireflies", basic: false, statistic: flies[3].toLowerCase(), damage: { flies: entry(flies[1], flies[2]) }, heightening: { type: "interval", interval: 1, damage: { flies: step[1] } }, incapacitation: true,
                html: `<p>The target takes ${flies[1]} ${flies[2]} damage and must attempt a ${flies[3]} save.</p><hr /><p><strong>Critical Success</strong> The target takes no damage.</p>`
                    + `<p><strong>Success</strong> The target takes half damage and is ${dazzled} for 1 round.</p><p><strong>Failure</strong> The target takes full damage and is ${blinded} for 1 round.</p>`
                    + `<p><strong>Critical Failure</strong> The target takes double damage and is ${blinded} for 1 minute.</p>`,
                note: "A creature that fails is then immune to being blinded by the fireflies for 24 hours (the GM leaves the Blinded off later results)." }],
        sentences: [...lead, items["Fire Ants"], items["Fireflies"], ...Object.values(rows)]
    };
}
