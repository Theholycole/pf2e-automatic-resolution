// Darkness around the caster, a few blessed with light (Divine Eclipse): "You extinguish all non-magical light effects and attempt to counteract any other magical
// light in the area." / "Select up to 5 creatures in the area; you grant them the eclipse's blessing, they exude bright light in a 5-foot emanation (and dim light
// 5 feet thereafter) and gain fast healing 6 while within the emanation. All other creatures in the area that end their turn in an area of dim light or darkness
// take 6d4 cold damage with a basic Reflex save." with "Heightened (+1) The cold damage increases by 1d4 and the fast healing increases by 1.": the caster's
// emanation as a lingering area — a creature ending its turn in it saves (the item's damage), unless it's blessed or within a blessed creature's bright light;
// the blessed (the cast's targets, up to the number) hold the module's Effect — its light and fast healing the text's — while inside the emanation; the
// light it puts out and counteracts the GM's note.
import { htmlToPlainText } from "./description-parser.js";
import { ITEM_LINK as LINK } from "./text-patterns.js";

const LEAD = /^You extinguish all non-magical light effects and attempt to counteract any other magical light in the area\.$/;
const BLESS = /^Select up to (\d+) creatures in the area; you grant them the [a-z' ’]+, they exude bright light in a (\d+)-foot emanation \(and dim light (\d+) feet thereafter\) and gain fast healing (\d+) while within the emanation\.$/;
const DARK = /^All other creatures in the area that end their turn in an area of dim light or darkness take (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const STEP = /^Heightened \(\+1\) The ([a-z]+) damage increases by (\d+d\d+) and the fast healing increases by (\d+)\.$/;

/** The module's Effect gives the stated light and fast healing (at the rank, one more a rank). */
export function blessingMatches(effect, { bright, dim, healing, step, rank }) {
    const rules = effect?.mechanics?.rules ?? effect?.system?.rules ?? [];
    const light = rules.find(rule => rule.key === "TokenLight"), fast = rules.find(rule => rule.key === "FastHealing");
    return rules.length === 2 && Number(light?.value?.bright) === bright && Number(light?.value?.dim) === bright + dim && fast?.value === "@item.level" && healing === rank && step === 1;
}

/** {html, lingering, sentences} or null. */
export function rewriteDivineEclipse(adapted, catalog = null) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || area?.type !== "emanation" || adapted.lifecycle?.sustained || !/^1 minute$/.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const first = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/), second = (paragraphs[1] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const bless = BLESS.exec(second[0] ?? ""), dark = DARK.exec(second[1] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim()), link = LINK.exec(paragraphs[2] ?? "");
    if (paragraphs.length !== 3 || first.length !== 2 || !LEAD.test(first[1]) || second.length !== 2 || !bless || !dark || !step || !link || dark[3].toLowerCase() !== adapted.defense.statistic) return null;
    const components = adapted.damageComponents ?? [], heightening = adapted.heightening ?? {}, rank = Number(adapted.rank) || 1;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== dark[1] || components[0].type !== dark[2] || step[1] !== dark[2]
        || heightening.type !== "interval" || heightening.interval !== 1 || String(heightening.damage?.[components[0].id]) !== step[2]) return null;
    const effect = catalog?.get?.(link[2]) ?? null;
    if (!effect || !blessingMatches(effect, { bright: Number(bless[2]), dim: Number(bless[3]), healing: Number(bless[4]), step: Number(step[3]), rank })) return null;
    return {
        html: `<p>A creature that ends its turn in the area takes ${dark[1]} ${dark[2]} damage with a basic ${dark[3]} save.</p><hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[2]}.</p>`,
        lingering: { events: ["turn-end"], initial: false, oncePerRound: false, excludeCaster: true, enemiesOnly: false, area: { type: "emanation", value: Number(area.value) }, centre: "caster",
            durationSeconds: 60, sustained: false, concealment: false,
            blessed: { max: Number(bless[1]), effect: { uuid: link[1], name: link[3] }, bright: Number(bless[2]), dim: Number(bless[3]), sourceText: second[0] },
            notes: [`${first[1]} (The GM puts out the area's non-magical light and rolls the counteract against any magical light.)`],
            sourceText: [second[1]] },
        sentences: [first[1], ...second, htmlToPlainText(heightened).trim()]
    };
}
