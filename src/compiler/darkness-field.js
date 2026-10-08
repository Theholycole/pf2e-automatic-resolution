// A field of magical darkness that drains those inside (Darklight): "Shadows pour forth from your eyes, creating a field of darkness that prevents light from
// emanating within the area. Light doesn't enter the area; any non-magical light sources … don't emanate any light while inside the area, …. The spell similarly
// suppresses magical light of the spell's rank or lower." / "Light can't pass through, so creatures in the area can't see outside. Even creatures with darkvision
// (but not greater darkvision) can barely see through the darkness; any creatures seen through the darkness are {Concealed} to them. Creatures with greater
// darkvision can see through the darkness normally." / "Creatures who move into the field or start their turn within the field have some of the life and light
// sucked out of them, taking 2d6 bludgeoning damage and 2d6 void damage, with a basic Fortitude save." / "When you cast this spell, choose up to four allies in
// the area to spare from darklight's effects. Until the spell ends, they're immune to damage from darklight spells and can see through darklight (but not other
// darkness) as though they had greater darkvision." — the placed area for the duration, its region fully dark (Foundry's darkness level); entering it or
// starting a turn inside is a basic save against both entries (PF2e's, heightened); the allies the caster targets when it starts (up to the count) are spared
// (each holds the area's immunity); the light and sight rules are the GM's notes.
import { htmlToPlainText } from "./description-parser.js";
import { WORD_NUMBERS_1_6 as COUNT } from "./text-patterns.js";

const DARK = [
    /^Shadows pour forth from your eyes, creating a field of darkness that prevents light from emanating within the area\.$/,
    /^Light doesn't enter the area; any non-magical light sources, such as a torches or lanterns, don't emanate any light while inside the area, even if their light radius would extend beyond the darkness\.$/,
    /^The spell similarly suppresses magical light of the spell's rank or lower\.$/
];
const SIGHT = [
    /^Light can't pass through, so creatures in the area can't see outside\.$/,
    /^Even creatures with darkvision \(but not greater darkvision\) can barely see through the darkness; any creatures seen through the darkness are Concealed to them\.$/,
    /^Creatures with greater darkvision can see through the darkness normally\.$/
];
const DRAIN = /^Creatures who move into the field or start their turn within the field have some of the life and light sucked out of them, taking (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage, with a basic (Fortitude|Reflex|Will) save\.$/;
const SPARE = /^When you cast this spell, choose up to (\w+) allies in the area to spare from [a-z]+'s effects\.$/;
const SPARED = /^Until the spell ends, they're immune to damage from [a-z]+ spells and can see through [a-z]+ \(but not other darkness\) as though they had greater darkvision\.$/;

/** {html, lingering, sentences} or null. */
export function rewriteDarknessField(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/<\/?em>/g, "")).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean));
    if (paragraphs.length !== 4 || paragraphs[0].length !== DARK.length || paragraphs[1].length !== SIGHT.length || paragraphs[2].length !== 1 || paragraphs[3].length !== 2) return null;
    if (!paragraphs[0].every((sentence, index) => DARK[index].test(sentence)) || !paragraphs[1].every((sentence, index) => SIGHT[index].test(sentence))) return null;
    const drain = DRAIN.exec(paragraphs[2][0]), spare = SPARE.exec(paragraphs[3][0]);
    if (!drain || !spare || !SPARED.test(paragraphs[3][1]) || !COUNT[spare[1]] || drain[5].toLowerCase() !== adapted.defense.statistic) return null;
    const components = adapted.damageComponents ?? [];
    const stated = [[drain[1], drain[2]], [drain[3], drain[4]]];
    if (components.length !== 2 || components.some(component => component.category) || !stated.every(([formula, type]) => components.some(component => String(component.formula).replace(/\s+/g, "") === formula && String(component.type).toLowerCase() === type))) return null;
    return {
        html: `<p>Each creature in the area takes ${drain[1]} ${drain[2]} damage and ${drain[3]} ${drain[4]} damage, with a basic ${drain[5]} save.</p>${heightened ? `<hr />${heightened}` : ""}`,
        lingering: { events: ["enter", "turn-start"], initial: false, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: "burst", value: Number(adapted.targeting.area.value) },
            centre: "placed", durationSeconds: Number(minutes[1]) * 60, sustained: false, concealment: false,
            darkness: { mode: 0, modifier: 1, sourceText: paragraphs[0][0] },
            spared: { count: COUNT[spare[1]], sourceText: paragraphs[3][0] },
            notes: ["Light doesn't enter the area, and non-magical light sources inside emit none: turn their lights off while inside. Magical light of the cast rank or lower is suppressed too.",
                "Creatures inside can't see out. Darkvision (but not greater darkvision) sees through the darkness only as Concealed; greater darkvision sees normally.",
                "The spared allies see through this darkness (not other darkness) as though they had greater darkvision."],
            sourceText: [...paragraphs[0], ...paragraphs[1], paragraphs[2][0], ...paragraphs[3]] },
        sentences: [...paragraphs.flat(), htmlToPlainText(heightened).trim()]
    };
}
