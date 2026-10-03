import { htmlToPlainText } from "./description-parser.js";
// Spells cast through one of the caster's thralls (Target "1 of your thralls"): the thrall's token is where the
// spell's area or reach starts, and the spell destroys it.
//   "Each creature within a 10-foot emanation of the thrall takes 1d12 void damage with a basic Fortitude save. This
//    destroys the thrall." (Necrotic Bomb)
//   "Destroy the target thrall, and each creature in a 15-foot line originating from the thrall's former space takes 2d6
//    piercing damage with a basic Reflex save." (Bone Spear)
//   "The target thrall launches itself at a creature within 15 feet, and the target must attempt a Fortitude saving
//    throw. The target thrall is destroyed." (Dead Weight)
//   "Each creature within a 5-foot emanation of the target thrall takes 1d4 mental damage depending on its Will save."
//    (Deathly Scream: the thrall isn't destroyed)
// PF2e has no thrall trait: which token is the caster's thrall is the caster's choice, as with "your companion". The
// sentences become the ordinary save wording, and the card checks the thrall's range and each target's distance from it.
const EMANATION = /Each creature within an? (\d+)-foot emanation of the (?:target )?thrall (takes [^.]+|must attempt [^.]+)\./;
const FROM_SPACE = /Destroy the target thrall, and each creature in an? (\d+)-foot (line|cone) originating from the thrall's former space (takes [^.]+)\./;
const LAUNCH = /The target thrall launches itself at a creature within (\d+) feet, and the target (must attempt an? (?:Fortitude|Reflex|Will) sav(?:e|ing throw))\./;
// "A creature within 15 feet of the target thrall becomes filled with blood. The thrall is destroyed, and the creature must
// attempt a Fortitude saving throw." (Blood Infusion)
const WITHIN = /A creature within (\d+) feet of the (?:target )?thrall becomes [a-z ]+\. The (?:target )?thrall is destroyed, and the creature (must attempt an? (?:Fortitude|Reflex|Will) sav(?:e|ing throw))\./;
// "One creature within 30 feet of the targeted thrall must attempt a Fortitude saving throw." (Life Tap)
const ONE_WITHIN = /One creature within (\d+) feet of the targeted thrall (must attempt an? (?:Fortitude|Reflex|Will) sav(?:e|ing throw))\./;
const DESTROYED = /\s*(?:This destroys the thrall|The (?:target |targeted )?thrall is (?:then )?destroyed)\./;

export function extractThrall(adapted) {
    if (!/^1 of your thralls$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    let html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const rest = cut >= 0 ? html.slice(cut) : "";
    html = cut >= 0 ? html.slice(0, cut) : html;
    const area = adapted.targeting?.area ?? null;
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    if (!range) return null;
    let thrall = null, destroyed = false;
    const emanation = EMANATION.exec(html);
    const fromSpace = FROM_SPACE.exec(html);
    const launch = LAUNCH.exec(html) ?? WITHIN.exec(html) ?? ONE_WITHIN.exec(html);
    if ([emanation, fromSpace, launch].filter(Boolean).length !== 1) return null;
    if (emanation) {
        // The item's own area is that emanation.
        if (area?.type !== "emanation" || Number(area.value) !== Number(emanation[1])) return null;
        thrall = { origin: "emanation", radius: Number(emanation[1]) };
        html = html.replace(EMANATION, `Each creature in the area ${emanation[2]}.`);
    } else if (fromSpace) {
        if (area?.type !== fromSpace[2] || Number(area.value) !== Number(fromSpace[1])) return null;
        thrall = { origin: fromSpace[2], size: Number(fromSpace[1]) };
        destroyed = true;
        html = html.replace(FROM_SPACE, `Each creature in the area ${fromSpace[3]}.`);
    } else {
        if (area) return null;
        thrall = { origin: "within", within: Number(launch[1]), maxTargets: 1 };
        if (WITHIN.test(launch[0])) destroyed = true;
        html = html.replace(launch[0], `The target ${launch[2]}.`);
    }
    if (DESTROYED.test(html)) { destroyed = true; html = html.replace(DESTROYED, ""); }
    return {
        html: html.replace(/<p>\s*<\/p>/g, "") + rest,
        // The save's recipients are the creatures the caster targets: in the area, or the one within reach.
        target: thrall.origin === "within" ? "1 creature" : "",
        thrall: { ...thrall, range: Number(range[1]), destroyed, sourceText: (emanation ?? fromSpace ?? launch)[0] }
    };
}


// A horde made by destroying a thrall, grown by the thralls in it (Zombie Horde): "You destroy the target thrall, and the zombie horde appears in a 10-foot
// burst, which must include a square the destroyed thrall occupied. All squares on the ground in the zombie horde are difficult terrain. Whenever a
// creature begins its turn in the horde, it takes 3d4 bludgeoning damage with a basic Fortitude save." / "Once per round on subsequent turns, you can
// Sustain the spell to move the horde up to 15 feet. At the start of each of your turns, all of your thralls in the horde are destroyed, and the
// area's burst increases by 5 feet for each thrall destroyed (to a maximum of a 30-foot burst). You can Dismiss this spell." — the lingering area's
// own wording (difficult terrain; the turn-start basic save; Dismiss); the thrall's destruction, the placement and the Sustain's move are notes; the
// growth is the GM's control (the thralls destroyed at the start of the caster's turn: 5 feet each, to the maximum).
const HORDE = [/^You destroy the target thrall, and the ([a-z ]+) appears in an? (\d+)-foot burst, which must include a square the destroyed thrall occupied\.$/,
    /^All squares on the ground in the ([a-z ]+) are difficult terrain\.$/,
    /^Whenever a creature begins its turn in the ([a-z ]+), it takes (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/,
    /^Once per round on subsequent turns, you can Sustain the spell to move the ([a-z ]+) up to (\d+) feet\.$/,
    /^At the start of each of your turns, all of your thralls in the ([a-z ]+) are destroyed, and the area's burst increases by (\d+) feet for each thrall destroyed \(to a maximum of an? (\d+)-foot burst\)\.$/,
    /^You can Dismiss this spell\.$/];

/** {html, defense, thrallGrowth, notes, sentences} or null. */
export function rewriteThrallHorde(adapted) {
    if (adapted.defense?.kind !== "save" || !/^1 of your thralls$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area?.type !== "burst") return null;
    const components = adapted.damageComponents ?? [];
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => HORDE[0].test(sentence));
    if (at < 0 || sentences.length !== at + HORDE.length || HORDE.some((pattern, index) => !pattern.test(sentences[at + index]))
        || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|saves?|bonus|penalty|conditions?)\b/i.test(sentence))) return null;
    const appear = HORDE[0].exec(sentences[at]), deals = HORDE[2].exec(sentences[at + 2]), move = HORDE[3].exec(sentences[at + 3]), grow = HORDE[4].exec(sentences[at + 4]);
    if (Number(appear[2]) !== Number(adapted.targeting.area.value) || components.length !== 1 || String(components[0].formula).replace(/\s+/g, "") !== deals[2]
        || String(components[0].type).toLowerCase() !== deals[3] || deals[4].toLowerCase() !== adapted.defense.statistic) return null;
    const heightened = rest.join("<hr />");
    return {
        html: `<p>The ground in the area is difficult terrain. A creature that starts its turn in the area takes ${deals[2]} ${deals[3]} damage with a basic ${deals[4]} save. You can Dismiss the spell.</p>${heightened ? `<hr />${heightened}` : ""}`,
        defense: { ...adapted.defense, basic: true },
        thrallGrowth: { feet: Number(grow[2]), maximum: Number(grow[3]), sourceText: sentences[at + 4] },
        notes: [`Destroy the target thrall (a module thrall token you target is removed; otherwise delete its token) and place the ${appear[2]}-foot burst so it includes a square the thrall occupied.`,
            `Once per round on later turns, you can Sustain the spell to move the area up to ${move[2]} feet: move the region.`,
            `At the start of each of your turns, your thralls in the area are destroyed: use the record's control (it removes and counts your module thrall tokens there, or asks how many): the burst grows ${grow[2]} feet each (to ${grow[3]} feet).`],
        sentences: sentences.slice(at)
    };
}
