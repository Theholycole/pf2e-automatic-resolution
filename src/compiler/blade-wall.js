// A wall that cuts whoever is in it, crosses it or stays (Blade Barrier): "Blades of force form a churning wall. The wall is a straight line 20 feet high, 120 feet long,
// and 2 inches thick, and it provides cover. The wall deals 7d8 force damage to each creature that's in the wall's space when it is created, that attempts to pass
// through the wall, or that ends its turn inside the wall. A basic Reflex save reduces the damage. A creature that succeeds at this save when the wall is created is
// pushed to the nearest space on the side of its choice. Creatures trying to move through the wall fail to do so if they critically fail the save, ending their
// movement adjacent to the wall." — a lingering area along the line (placed): the save when cast and as a turn ends inside; passing through the GM's control (the
// module can't see an attempt); the push and the stopped movement GM notes on the card.
import { htmlToPlainText } from "./description-parser.js";

const FORM = /^Blades of [a-z]+ form a churning wall\.$/;
const SHAPE = /^The wall is a straight line (\d+) feet high, (\d+) feet long, and \d+ inch(?:es)? thick, and it provides cover\.$/;
const DEALS = /^The wall deals (\d+d\d+) ([a-z]+) damage to each creature that's in the wall's space when it is created, that attempts to pass through the wall, or that ends its turn inside the wall\.$/;
const SAVE = /^A basic (Fortitude|Reflex|Will) save reduces the damage\.$/;
const PUSH = /^A creature that succeeds at this save when the wall is created is pushed to the nearest space on the side of its choice\.$/;
const STOP = /^Creatures trying to move through the wall fail to do so if they critically fail the save, ending their movement adjacent to the wall\.$/;

/** {html, area, gmAction, reminders, sentences} or null. */
export function rewriteBladeWall(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const shape = SHAPE.exec(sentences[1] ?? ""), deals = DEALS.exec(sentences[2] ?? ""), save = SAVE.exec(sentences[3] ?? "");
    if (sentences.length !== 6 || !FORM.test(sentences[0]) || !shape || !deals || !save || !PUSH.test(sentences[4]) || !STOP.test(sentences[5])) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || String(components[0].formula).replace(/\s+/g, "") !== deals[1] || String(components[0].type).toLowerCase() !== deals[2] || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>A creature that is in the area when the spell is cast or ends its turn in the area takes ${deals[1]} ${deals[2]} damage with a basic ${save[1]} save.</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`,
        area: { type: "line", value: Number(shape[2]) },
        gmAction: { actions: ["pass"], label: "tried to pass through the wall", sourceText: sentences[2] },
        reminders: [
            { kind: "spell-note", text: `The wall is a straight line ${shape[1]} feet high and ${shape[2]} feet long (place the line), and it provides cover.`, sourceText: sentences[1] },
            { kind: "spell-note", text: `${sentences[4]} (The module moves each creature that succeeded to the nearest space outside the wall; the GM moves it to the other side if it chooses.)`, sourceText: sentences[4] },
            { kind: "spell-note", text: `${sentences[5]} (Use the area's control when a creature tries to pass through.)`, sourceText: sentences[5] }],
        sentences
    };
}
