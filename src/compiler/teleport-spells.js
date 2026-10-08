// Teleportation on the battle map (user decision 2026-10-03: teleports within the map are the module's — teleport-runtime.js moves the tokens):
//   - a reaction swap (Unexpected Transposition): "A creature that's unwilling to swap places with you must attempt a Will save. Willing creatures
//     automatically fail, and you switch places." / "After the swap, you and the target are both temporarily immune to … spells for 1 minute." — the
//     save, then the card's swap for a failure (both marked immune);
//   - targets moved within the area (Collective Transposition): "You teleport the targets to new positions within the area." with the rows "Critical
//     Success The target can teleport if it wants, but it chooses the destination within range." / "Failure You teleport the target and choose its
//     destination." — the save, then the card's teleport for those rows;
//   - every target relocated in an emanation (Magnetic Dominion): "When you Cast this Spell, you can relocate each affected target to any other unoccupied
//     space within the emanation. … An unwilling target can resist being moved with a successful Reflex save." — the save, the card's teleport (again on
//     each Sustain, one creature), and the stated rank of Magnetic Repulsion on the caster;
//   - places and Hit Points traded (All Is One, One Is All): "… you can choose to switch the positions of any number of targets with the positions of
//     other targets. … Distribute the Hit Points of all targets however you choose, except that no target can receive fewer than 1 Hit Point or more than
//     their maximum Hit Points." — the card's swap and share;
//   - the caster's own jump with a crater and debris (Proximal Shift): the card's teleport within range, the crater's Reflex save at the origin, the
//     debris' basic Reflex save at the arrival, and its difficult terrain for 1 minute.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const Stat = name => name[0].toUpperCase() + name.slice(1);
const unaffectedRows = statistic => `<p>The target must attempt a ${Stat(statistic)} save.</p><hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map(label => `<p><strong>${label}</strong> The target is unaffected.</p>`).join("");
const unit = word => ({ round: "rounds", minute: "minutes", hour: "hours" })[word];

/** {saveHTML, controls, notes, claimed} or null. */
export function extractSwapReaction(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || !/^(?:1|one) creature\b/i.test(String(adapted.targeting?.target ?? ""))) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const trigger = /^<p><strong>Trigger<\/strong>[^<]*<\/p>\s*<hr\s*\/?>/.exec(html);
    if (!trigger) return null;
    const sentences = split(plain(html.slice(trigger[0].length)));
    const SWAP = [/^When attacked, you attempt to quickly swap your own position with that of another creature, causing them to get hit in your place\.$/,
        new RegExp(`^A creature that's unwilling to swap places with you must attempt an? (${Stat(adapted.defense.statistic)}) save\\.$`), /^Willing creatures automatically fail, and you switch places\.$/,
        /^If you successfully switch places with the target, the triggering attack is resolved against that creature as if it had been the original target of the attack\.$/,
        /^After the swap, you and the target are both temporarily immune to [a-z ]+ spells for (\d+) (minute|round|hour)s?\.$/];
    if (sentences.length !== SWAP.length || SWAP.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const immune = SWAP[4].exec(sentences[4]);
    const key = String(adapted.source?.slug ?? adapted.source?.name ?? "swap").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
        saveHTML: `${trigger[0]}${unaffectedRows(adapted.defense.statistic)}`, saveTarget: "1 creature",
        controls: { degrees: ["failure", "criticalFailure"], label: "The swap", sourceText: sentences[2], parts: [{ key: "swap", title: "Swap places", traits: [], kind: "teleport", mode: "swap", who: "caster",
            immunity: { key, duration: { value: Number(immune[1]), unit: unit(immune[2]) } }, reminder: "Target the creature: it and the caster trade places, and both become temporarily immune." }] },
        notes: ["A willing creature doesn't save: set it to a failure.", "The triggering attack is resolved against the creature that swapped in, as if it had been the original target (the GM redirects it)."],
        claimed: sentences
    };
}

/** {saveHTML, controls, notes, claimed} or null. */
export function extractAreaTeleport(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || area?.type !== "emanation" || !/^up to \d+ creatures$/i.test(String(adapted.targeting?.target ?? ""))) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [lead, rows, heightened] = html.split(/<hr\s*\/?>/i);
    if (!rows) return null;
    const sentences = split(plain(lead));
    const LEAD = [/^You teleport the targets to new positions within the area\.$/,
        /^The creatures must each be able to fit in their new space, and their positions must be unoccupied, entirely within the area, and in your line of sight\.$/,
        new RegExp(`^Unwilling creatures can attempt an? (${Stat(adapted.defense.statistic)}) save\\.$`)];
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const rowText = Object.fromEntries([...rows.matchAll(/<p>\s*<strong>(Critical Success|Success|Failure|Critical Failure)<\/strong>([\s\S]*?)<\/p>/g)].map(match => [match[1], plain(match[2])]));
    if (rowText["Critical Success"] !== "The target can teleport if it wants, but it chooses the destination within range." || rowText.Success !== "The target is unaffected."
        || rowText.Failure !== "You teleport the target and choose its destination." || "Critical Failure" in rowText) return null;
    if (heightened && !/^\s*<p><strong>Heightened \(\+1\)<\/strong> The number of targets increases by 1\.<\/p>\s*$/.test(heightened)) return null;
    return {
        saveHTML: `<p>${sentences[2]}</p>${unaffectedRows(adapted.defense.statistic).replace(/^<p>[^<]*<\/p>/, "")}${heightened ? `<hr />${heightened}` : ""}`,
        controls: { degrees: ["criticalSuccess", "failure", "criticalFailure"], label: "The teleport", sourceText: sentences[0], parts: [{ key: "teleport", title: "Teleport within the area", traits: [], kind: "teleport",
            mode: "move", who: "target", within: Number(area.value), from: "caster", entirely: true, count: 1, repeat: { trigger: "another target is moved" },
            reminder: "Target one creature, then click its new space (entirely within the area, unoccupied, in the caster's line of sight). On a failure the caster chooses; on a critical success the creature chooses, or stays." }] },
        notes: ["A willing creature doesn't save: set it to a failure.", "The new space must be in the caster's line of sight (the GM)."],
        claimed: [...sentences, ...Object.values(rowText)]
    };
}

/** {saveHTML, controls, notes, claimed, castSpell} or null. */
export function extractMagneticRelocation(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || area?.type !== "emanation") return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr/i.test(html)) return null;
    const sentences = split(plain(html));
    const STATED = [/^When you Cast this Spell, you can relocate each affected target to any other unoccupied space within the emanation\.$/, /^You can't move yourself in this way\.$/,
        new RegExp(`^An unwilling target can resist being moved with a successful (${Stat(adapted.defense.statistic)}) save\\.$`),
        /^The creatures move all at once—after you know the results of all the saves, you determine which target occupies each space in whatever order you choose\.$/,
        /^You can move a creature into a space that was previously occupied by another creature so long as you also relocate the first creature elsewhere as part of the movement\.$/,
        /^If you move a target into the air, it descends to the ground harmlessly after being moved unless it chooses not to\.$/,
        /^You can choose to be affected by an? (\d+)(?:st|nd|rd|th)-rank @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\} spell that lasts for the duration of [a-z ]+ ?\.$/,
        /^Each time you Sustain the spell, you can move one creature in the emanation, with the same targeting restrictions and stipulations as above\.$/];
    const found = STATED.map(pattern => sentences.findIndex(sentence => pattern.test(sentence)));
    if (found.some(index => index < 0)) return null;
    const rest = sentences.filter((_, index) => !found.includes(index));
    if (rest.some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|move|teleport|target)\b/i.test(sentence))) return null;
    const cast = STATED[6].exec(sentences[found[6]]);
    return {
        saveHTML: `<p>${sentences[found[2]]}</p>${unaffectedRows(adapted.defense.statistic).replace(/^<p>[^<]*<\/p>/, "")}`, saveTarget: "any number of creatures",
        controls: { degrees: ["failure", "criticalFailure"], label: "The relocation", sourceText: sentences[found[0]], parts: [
            { key: "relocate", title: "Relocate a target", traits: [], kind: "teleport", mode: "move", who: "target", within: Number(area.value), from: "caster", entirely: true, count: 1,
                repeat: { trigger: "another target is moved, and on each Sustain (one creature)" },
                reminder: "Target one creature that failed (or is willing), then click its new space within the emanation. To move one into an occupied space, move the occupant first." }] },
        castSpell: { uuid: cast[2], name: cast[3], rank: Number(cast[1]) },
        notes: ["A willing target doesn't save: set it to a failure. The targets are creatures wearing metal armor, made of metal or with the metal trait (and unattended metal objects): the GM picks them.",
            "A target moved into the air descends to the ground harmlessly unless it chooses not to."],
        claimed: sentences.filter((_, index) => found.includes(index))
    };
}

/** {phases, notes, claimed} or null. */
export function extractMeldSwap(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || adapted.targeting?.area || !/^You and up to (\d+) willing living allies$/i.test(String(adapted.targeting?.target ?? ""))) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr|@/.test(html)) return null;
    const sentences = split(plain(html));
    const STATED = [/^When you separate the targets back into themselves, you can choose to switch the positions of any number of targets with the positions of other targets\.$/,
        /^Distribute the Hit Points of all targets however you choose, except that no target can receive fewer than 1 Hit Point or more than their maximum Hit Points\.$/];
    const found = STATED.map(pattern => sentences.findIndex(sentence => pattern.test(sentence)));
    if (found.some(index => index < 0)) return null;
    const rest = sentences.filter((_, index) => !found.includes(index));
    if (rest.some(sentence => /\d|\b(?:damage|save|bonus|penalty|condition|teleport|target|Hit Points?)\b/i.test(sentence))) return null;
    const count = Number(/^You and up to (\d+)/i.exec(adapted.targeting.target)[1]);
    return {
        phases: [{ key: "swap", title: "Switch positions", traits: [], kind: "teleport", mode: "swap", who: "targets", repeat: { trigger: "another pair switches" },
                reminder: `Target two of the creatures (you and up to ${count} willing living allies): they trade places. Repeat for each pair.` },
            { key: "share", title: "Distribute Hit Points", traits: [], kind: "hp-share", reminder: "Target all the creatures: their Hit Points' total is shared out (each from 1 to its maximum)." }],
        notes: [], claimed: sentences
    };
}

/** {phases, notes, claimed, crater, debris, range} or null: the save parts as text the compiler turns into plans. */
export function extractCraterJump(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim() || !(adapted.activation?.traits ?? []).includes("teleportation")) return null;
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    if (!range || /<hr/i.test(html)) return null;
    const text = plain(html);
    const JUMP = /^With a thunderous crack, you disappear from your current location and reappear in an unoccupied space within range that you can see, bringing all non-magical, non-living, unattended matter \(including objects\) in a @Template\[type:emanation\|distance:(\d+)\] with you\./;
    const CRATER = /Creatures within the emanation must succeed at a (Fortitude|Reflex|Will) save to avoid falling into the crater you leave behind, taking @Damage\[(\d+)\[([a-z]+)\]\|options:area-damage\] damage and falling @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Prone\}\./;
    const DEBRIS = /Creatures in a @Template\[type:emanation\|distance:(\d+)\] on your arrival space take @Damage\[(\d+d\d+)\[([a-z]+)\]\|options:area-damage\] damage with a basic (Fortitude|Reflex|Will) save from the resulting explosion of debris, and the area becomes difficult terrain for (\d+) (minute|round)s?\./;
    const GM = /At the GM's discretion, the spell might have additional effects based on the nature of the material teleported with you\./;
    const FAILS = /If the teleport would cause you to bring another creature—even one inside an extradimensional container—the spell fails\./;
    const found = [JUMP, CRATER, DEBRIS, GM, FAILS].map(pattern => pattern.exec(text));
    if (!found.every(Boolean)) return null;
    const rest = [JUMP, CRATER, DEBRIS, GM, FAILS].reduce((left, pattern) => left.replace(pattern, ""), text).trim();
    if (rest) return null;
    const [jump, crater, debris] = found;
    const rounds = Number(debris[5]) * (debris[6] === "minute" ? 10 : 1);
    return {
        phases: [{ key: "jump", title: "The jump", traits: [], kind: "teleport", mode: "move", who: "caster", within: Number(range[1]), from: "caster",
                reminder: `Click the caster's new space: unoccupied, within ${range[1]} feet, one it can see. Roll the crater's save first for the creatures around where it stands.` }],
        crater: { radius: Number(jump[1]), statistic: crater[1].toLowerCase(), amount: Number(crater[2]), type: crater[3], prone: crater[4] },
        debris: { radius: Number(debris[1]), formula: debris[2], type: debris[3], statistic: debris[4].toLowerCase(), rounds },
        notes: ["The caster brings all non-magical, non-living, unattended matter (including objects) within 5 feet with it. At the GM's discretion, that material may have other effects.",
            "If the teleport would bring another creature (even one inside an extradimensional container), the spell fails."],
        claimed: found.map(match => match[0])
    };
}

// Movement through the ground and the air, the rows the compiler already reads (a push away from the caster or the burst's centre) with the card's parts:
//   - a wave to a target (Heaving Earth): "Each creature in a line between you and the target … must attempt a Reflex saving throw … A creature that fails
//     this save is pushed 10 feet away from you." / "The wave explodes once it reaches the target, … dealing 12d10 bludgeoning damage with a basic Reflex
//     save. A target that fails its save against this explosion is also pushed back 10 feet and knocked Prone." / "Heightened (9th) The wave explodes on one
//     additional target …" — the explosion's basic save (a second target at 9th), the tremors' save on the card for the creatures in the line;
//   - a launch (Earth and Sky): "You fly directly upward, up to 100 feet into the air. … Every other creature in the area … must attempt a Fortitude saving
//     throw." with the rows "launched the same distance into the air as you, then falls" (… "can't Arrest its Fall"; "twice as much damage from falling")
//     — PF2e's falling damage (half the distance) on the rows, Prone as it lands, and the caster's rise on the card;
//   - a downpour (Deluge): "All flying creatures in the area descend 50 feet or until blocked by the ground … takes bludgeoning damage equal to the number
//     of feet it fell … and is knocked Prone. Creatures on the ground … must succeed at a Reflex save or be pushed 50 feet away from the center of the
//     area." — the save's push from the centre, and the card's descent for the flyers (10 feet more each rank).
const PRONE_LINK = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Prone\}`;
const rowsHTML = rows => ["Critical Success", "Success", "Failure", "Critical Failure"].map((label, index) => `<p><strong>${label}</strong> ${rows[index]}</p>`).join("");

/** {mainHTML, mainTarget, mainHeightening, tremorHTML, controls, notes, claimed} or null. */
export function extractHeavingWave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || !/on the ground$/i.test(String(adapted.targeting?.target ?? ""))) return null;
    const components = adapted.damageComponents ?? [];
    const html = String(adapted.descriptionHTML ?? "");
    const [body, heightened] = html.split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const STATED = [/^The effect ends as soon as it can't travel through a solid surface, such as a stone floor\.$/,
        /^Each creature in a line between you and the target is shaken by tremors and must attempt a (Reflex|Fortitude|Will) saving throw against your spell DC\.$/,
        /^A creature that fails this save is pushed (\d+) feet away from you\.$/,
        /^The wave explodes once it reaches the target, showering the target with earth and stone and dealing @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage with a basic (Reflex|Fortitude|Will) save\.$/,
        new RegExp(String.raw`^A target that fails its save against this explosion is also pushed back (\d+) feet and knocked ${PRONE_LINK}\.$`),
        /^A creature subject to the explosion doesn't need to save against the tremors\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || components.length !== 1) return null;
    const rest = sentences.filter(sentence => !found.some(match => match[0] === sentence));
    if (rest.length > 1 || rest.some(sentence => /\d|@|\b(?:damage|save|push|prone)\b/i.test(sentence))) return null;
    const [, tremor, tremorPush, blast, blastPush] = found;
    if (String(components[0].formula).replace(/\s+/g, "") !== blast[1] || components[0].type !== blast[2] || blast[3].toLowerCase() !== adapted.defense.statistic) return null;
    const extra = heightened ? /^\s*<p><strong>Heightened \((\d+)(?:st|nd|rd|th)\)<\/strong> The wave explodes on one additional target of your choice in the line to the final target\.<\/p>\s*$/.exec(heightened) : null;
    if (heightened && !extra) return null;
    const prone = `@UUID[${blastPush[2]}]{Prone}`;
    return {
        mainHTML: `<p>The target takes ${blast[1]} ${blast[2]} damage (basic ${blast[3]} save).</p><hr />` + rowsHTML(["The target is unaffected.", "The target takes half damage.",
            `The target takes full damage and is pushed ${blastPush[1]} feet away from you and knocked ${prone}.`, `The target takes double damage and is pushed ${blastPush[1]} feet away from you and knocked ${prone}.`]),
        mainTarget: "1 creature", ...(extra ? { mainHeightening: { type: "fixed", levels: { [extra[1]]: { target: { value: "up to 2 creatures" } } } } } : {}),
        tremorHTML: `<p>The target must attempt a ${tremor[1]} save.</p><hr />` + rowsHTML(["The target is unaffected.", "The target is unaffected.",
            `The target is pushed ${tremorPush[1]} feet away from you.`, `The target is pushed ${tremorPush[1]} feet away from you.`]), tremorStatistic: tremor[1].toLowerCase(),
        controls: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], label: "The tremors", sourceText: tremor[0], parts: [] },
        notes: ["The target must be on the ground, and the wave stops where it can't travel through a solid surface (the GM).",
            ...(extra ? [`From rank ${extra[1]}, the wave explodes on one more target of the caster's choice in the line (target it too).`] : [])],
        claimed: [...found.map(match => match[0]), ...(extra ? [plain(heightened)] : [])]
    };
}

/** {mainHTML, damage, controls, notes, claimed} or null. */
export function extractSkyLaunch(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || area?.type !== "emanation" || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [lead, rows] = html.split(/<hr\s*\/?>/i);
    if (!rows || /Heightened/.test(html)) return null;
    const sentences = split(plain(lead));
    const STATED = [/^This spell has no effect unless you're on solid ground when you cast it\.$/, /^You fly directly upward, up to (\d+) feet into the air\.$/,
        /^When the spell ends, you safely float to the ground, as gentle landing\.$/, new RegExp(`^Every other creature in the area when you Cast this Spell must attempt a (${Stat(adapted.defense.statistic)}) saving throw\\.$`)];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean)) return null;
    const rest = sentences.filter(sentence => !found.some(match => match[0] === sentence));
    if (rest.some(sentence => /\d|@|\b(?:damage|save|fall|prone)\b/i.test(sentence))) return null;
    const rowText = Object.fromEntries([...rows.matchAll(/<p>\s*<strong>(Critical Success|Success|Failure|Critical Failure)<\/strong>([\s\S]*?)<\/p>/g)].map(match => [match[1], plain(match[2])]));
    if (rowText["Critical Success"] !== "The creature is unaffected." || rowText.Success !== "The creature is launched the same distance into the air as you, then falls."
        || !/^The creature is launched the same distance into the air as you, then falls and can't @UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Arrest its Fall\}\.$/.test(rowText.Failure ?? "")
        || rowText["Critical Failure"] !== "As failure, but the creature takes twice as much damage from falling.") return null;
    const height = Number(found[1][1]);
    // (PF2e's falling: half the distance fallen as bludgeoning damage, landing Prone.)
    const fall = Math.floor(height / 2);
    const prone = "@UUID[Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60]{Prone}";
    return {
        mainHTML: `<p>${found[3][0]}</p><hr />` + rowsHTML(["The creature is unaffected.", `The creature takes full damage and is knocked ${prone}.`, `The creature takes full damage and is knocked ${prone}.`,
            `The creature takes double damage and is knocked ${prone}.`]),
        damage: { formula: String(fall), type: "bludgeoning" },
        controls: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], label: "The rise", sourceText: found[1][0], parts: [{ key: "rise", title: "Rise", traits: [], kind: "elevate", feet: height,
            landing: "When the spell ends, the caster floats safely to the ground (as gentle landing): lower its token.", reminder: `The caster flies up to ${height} feet straight up.` }] },
        notes: [`A launched creature falls ${height} feet: ${fall} bludgeoning damage (PF2e's falling) and Prone. On a success it can still Arrest its Fall if it can (the GM removes the damage).`,
            `If the caster rises less than ${height} feet, the falling damage is half that distance (the GM corrects it).`, "The spell has no effect unless the caster is on solid ground."],
        claimed: [...found.map(match => match[0]), ...Object.values(rowText)]
    };
}

/** {mainHTML, controls, notes, claimed} or null. */
export function extractDownpour(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || area?.type !== "burst" || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, heightened] = html.split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const STATED = [/^All flying creatures in the area descend (\d+) feet or until blocked by the ground or firm surface\.$/,
        new RegExp(String.raw`^Each creature whose descent was blocked by the ground or firm surface takes bludgeoning damage equal to the number of feet it fell \(the creature does not also take falling damage\) and is knocked ${PRONE_LINK}\.$`),
        new RegExp(`^Creatures on the ground, including flying creatures forced to the ground by the spell, must succeed at a (${Stat(adapted.defense.statistic)}) save or be pushed (\\d+) feet away from the center of the area\\.$`),
        /^Flimsy structures in the area collapse\.$/, /^The GM can determine other large-scale effects that result from the [a-z]+\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean)) return null;
    const rest = sentences.filter(sentence => !found.some(match => match[0] === sentence));
    if (rest.some(sentence => /\d|@|\b(?:damage|save|fall|prone|push)\b/i.test(sentence))) return null;
    const step = heightened ? /^\s*<p><strong>Heightened \(\+1\)<\/strong> The area increases by (\d+) feet, and flying creatures fall an additional (\d+) feet\.<\/p>\s*$/.exec(heightened) : null;
    if (heightened && !step) return null;
    return {
        mainHTML: `<p>Creatures on the ground in the area must attempt a ${found[2][1]} save.</p><hr />` + rowsHTML(["The creature is unaffected.", "The creature is unaffected.",
            `The creature is pushed ${found[2][2]} feet away from the center of the burst.`, `The creature is pushed ${found[2][2]} feet away from the center of the burst.`]),
        controls: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], label: "The downpour", sourceText: found[0][0], parts: [{ key: "descend", title: "Flyers forced down", traits: [], kind: "descend",
            feet: Number(found[0][1]), baseRank: Number(adapted.rank), stepFeet: step ? Number(step[2]) : 0,
            reminder: "Target the flying creatures in the area: each descends; one stopped by the ground takes the feet it fell as bludgeoning damage and falls Prone." }] },
        notes: ["Flying creatures forced to the ground also attempt the save: target them on the card (press the downpour first).", "Flimsy structures in the area collapse; other large-scale effects are the GM's."],
        claimed: [...found.map(match => match[0]), ...(step ? [plain(heightened)] : [])]
    };
}

// A leap that fuses the caster with its target (Amalgamizing Leap): "You choose a location within range that you can see and haphazardly catapult yourself and
// the target through space, …" with the rows "Critical Success The target is unaffected, but you're instantly transported to the chosen space." / "Success You
// and a piece of the target are transported to the chosen location, fused together. The target becomes Enfeebled 1, and you gain 20 temporary Hit Points until
// the end of your next turn." / "Failure You and the target creature vanish … and reappear in the chosen space fused together until the end of your next turn."
// with 40 temporary Hit Points, the target's Speeds and senses, +5 feet of reach, the target out of play, and its return to an adjacent space at the end of
// your next turn / "Critical Failure As failure, except the target also becomes Sickened 1." — the save's conditions, then the card's leap (the caster), the
// success's temporary Hit Points, or the fusion.
/** {mainHTML, controls, notes, claimed} or null. */
export function extractFusionLeap(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area || !/^1 creature$/i.test(String(adapted.targeting?.target ?? ""))) return null;
    const range = /^(\d+) (?:feet|ft)$/.exec(String(adapted.targeting?.range ?? "").trim());
    if (!range || !/^until the end of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [lead, rows] = html.split(/<hr\s*\/?>/i);
    if (!rows || /Heightened/.test(html)) return null;
    const leadText = plain(lead);
    if (!/^You choose a location within range that you can see and haphazardly catapult yourself and the target through space, [^.]+\. The target must attempt an? Fortitude save\.$/.test(leadText)
        || adapted.defense.statistic !== "fortitude") return null;
    const text = plain(rows);
    const C = name => String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{${name} (\d)\}`;
    const ROWS = new RegExp(String.raw`^Critical Success The target is unaffected, but you're instantly transported to the chosen space\. `
        + String.raw`Success You and a piece of the target are transported to the chosen location, fused together\. The target becomes ${C("Enfeebled")}, and you gain (\d+) temporary Hit Points until the end of your next turn\. `
        + String.raw`Failure You and the target creature vanish from your current locations and reappear in the chosen space fused together until the end of your next turn\. While fused together, you also gain the following effects\. `
        + String.raw`You gain (\d+) temporary Hit Points that last for the duration of the spell\. You gain all Speeds possessed by the target, unless you already have a higher Speed of that kind\. You gain all special senses possessed by the target\. `
        + String.raw`Your reach increases by (\d+) feet\. While fused, the target creature doesn't occupy space, is unable to act, and can't be targeted or affected by attacks or other effects\. The target does remain aware of its environment and everything transpiring around it\. `
        + String.raw`At the end of your next turn, the target separates from you in an adjacent space\. Both you and the target return to your original forms\. `
        + String.raw`Critical Failure As failure, except the target also becomes ${C("Sickened")}\.$`);
    const m = ROWS.exec(text);
    if (!m) return null;
    const [, enfeebledUuid, enfeebled, pieceHP, fusedHP, reach, sickenedUuid, sickened] = m;
    const nextTurn = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", sourceText: "until the end of your next turn" };
    return {
        clearDuration: true,
        mainHTML: `<p>The target must attempt a Fortitude save.</p><hr />` + rowsHTML(["The target is unaffected.", `The target becomes @UUID[${enfeebledUuid}]{Enfeebled ${enfeebled}} until the end of your next turn.`,
            "The target is unaffected.", `The target becomes @UUID[${sickenedUuid}]{Sickened ${sickened}}.`]),
        controls: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], label: "The leap", sourceText: leadText.split(/(?<=\.)\s/)[0], parts: [
            { key: "leap", title: "The leap", traits: [], kind: "teleport", mode: "move", who: "caster", within: Number(range[1]), from: "caster",
                reminder: `Click the chosen space within ${range[1]} feet (one the caster can see): the caster arrives there on every result.` },
            { key: "piece", title: "A piece of the target (success)", traits: [], kind: "effect", label: "Fused piece", text: `Fused with a piece of the target: ${pieceHP} temporary Hit Points until the end of your next turn.`,
                sourceText: `you gain ${pieceHP} temporary Hit Points until the end of your next turn`, rules: [], grants: [], tempHp: { base: Number(pieceHP), byRank: {} }, duration: nextTurn,
                reminder: "Target the caster (on a success)." },
            { key: "fuse", title: "Fused together (failure)", traits: [], kind: "fuse", tempHP: Number(fusedHP), reach: Number(reach),
                reminder: "Target the creature (on a failure or critical failure): it's taken into the caster until the end of the caster's next turn, then returns beside it." }] },
        notes: ["While fused, the caster has all the target's Speeds (unless its own is higher) and its special senses (the GM).",
            "The fused target doesn't occupy space, can't act and can't be targeted; it stays aware of its surroundings."],
        claimed: [leadText, text]
    };
}
