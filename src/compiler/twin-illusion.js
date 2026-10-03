// An illusory double only the target sees (Trickster's Twin): "You rarely settle for being in just one place. Choose a location within 100 feet of the
// target that the target can see. You create an illusion of yourself there that only it can see and that mimics all your actions. The target must
// attempt a Will save." with rows "The target believes you're in the designated location and can't see you in your actual location. The target
// automatically disbelieves the illusion when you use an action that doesn't make sense in the illusion's position, or if the target attacks,
// touches, Seeks, or otherwise engages with the illusion. If you use a hostile action against the target, the spell ends." / "As success, but the
// target must succeed at a Will save to disbelieve the illusion when one of the listed events occurs." / "As success, but … must critically succeed
// …": a note for the spell's time on each affected row, with the GM's Disbelieve control (automatic; a Will save needing a success; or a critical
// success) ending the spell.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You rarely settle for being in just one place\. (Choose a location within (\d+) feet of the target that the target can see\.) (You create an illusion of yourself there that only it can see and that mimics all your actions\.) The target must attempt a (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = /^(The target believes you're in the designated location and can't see you in your actual location\.) (The target automatically disbelieves the illusion when you use an action that doesn't make sense in the illusion's position, or if the target attacks, touches, Seeks, or otherwise engages with the illusion\.) (If you use a hostile action against the target, the spell ends\.)$/;
const AS = /^As success, but the target must (succeed|critically succeed) at a (Fortitude|Reflex|Will) save to disbelieve(?: the illusion)? when one of the listed events occurs\.$/;

/** {notes, sentences} or null. */
export function rewriteTwinIllusion(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || !minutes) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(plain("Success")), failure = AS.exec(plain("Failure")), critical = AS.exec(plain("Critical Failure"));
    if (!lead || lead[4].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^The target is unaffected\.$/.test(plain("Critical Success")) || !success || !failure || !critical
        || failure[1] !== "succeed" || critical[1] !== "critically succeed" || failure[2] !== "Will" || critical[2] !== "Will") return null;
    const base = `The creature sees an illusory double of the caster (placed within ${lead[2]} feet, visible only to it, mimicking the caster) and believes the caster is there; it can't see the caster's actual location. If the caster uses a hostile action against it, the spell ends.`;
    const events = "when the caster uses an action that doesn't make sense from the double's position, or it attacks, touches, Seeks or otherwise engages with the double";
    const note = (row, needs, how) => ({ label: "Trickster's double", text: `${base} It ${how} ${events} — the GM uses the Disbelieve control, which ends the spell.`,
        sourceText: plain(row), claimsRow: true, gmPlays: true, disbelieve: { statistic: "will", endsSpell: true, needs },
        duration: { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}` } });
    return {
        html: `<p>The target must attempt a ${lead[4]} save.</p><hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: { success: note("Success", "automatic", "automatically disbelieves"), failure: note("Failure", "success", "disbelieves on a successful Will save"),
            criticalFailure: note("Critical Failure", "criticalSuccess", "disbelieves only on a critical success at a Will save") },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}

// An illusory prison disbelieved by a Will save (Phantom Prison): "You completely surround a Large or smaller creature in immobile illusory walls,
// trapping it inside a false prison it can't escape. No other creatures see or feel these walls, and the target can't see anything outside of the
// illusory walls. The target can attempt a Will save when the spell is cast, each time it attempts to interact with or escape the walls, and each
// time something from outside the walls affects the target. On a success, it disbelieves the illusion, and the spell ends." with "Heightened (8th)
// You can target up to 5 creatures." — the cast's Will save (a success disbelieves: unaffected); a failure holds the creature in the prison (a note
// for the spell's duration the GM plays) whose Disbelieve control rolls its Will save again when it interacts with or tries to escape the walls,
// or something from outside affects it; a success ends the spell.
const PRISON = [/^You completely surround an? (Tiny|Small|Medium|Large|Huge) or smaller creature in immobile illusory walls, trapping it inside a false prison it can't escape\.$/,
    /^No other creatures see or feel these walls, and the target can't see anything outside of the illusory walls\.$/,
    /^The target can attempt a (Will) save when the spell is cast, each time it attempts to interact with or escape the walls, and each time something from outside the walls affects the target\.$/,
    /^On a success, it disbelieves the illusion, and the spell ends\.$/];
const PRISON_STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) You can target up to (\d+) creatures\.$/;

/** {html, notes, sentences} or null. */
export function rewriteIllusoryPrison(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const heightened = htmlToPlainText(rest.join(" ")).replace(/\s+/g, " ").trim();
    if (!minutes || sentences.length !== PRISON.length || PRISON.some((pattern, index) => !pattern.test(sentences[index])) || (heightened && !PRISON_STEP.test(heightened))) return null;
    const [, size] = PRISON[0].exec(sentences[0]), [, statistic] = PRISON[2].exec(sentences[2]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const step = PRISON_STEP.exec(heightened);
    const note = row => ({ label: "Phantom prison", text: `Illusory walls surround the creature: it believes it's trapped and can't leave its space, and it can't see anything outside the walls (no one else sees or feels them). It rolls its Will save again each time it interacts with or tries to escape the walls, or something from outside affects it — the GM uses the Disbelieve control; a success ends the spell.`,
        sourceText: row, claimsRow: true, gmPlays: true, disbelieve: { statistic: "will", endsSpell: true, needs: "success" },
        duration: { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}` } });
    return {
        html: `<p>The target must attempt a ${statistic} save.</p><hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: { failure: note("Failure (the cast's save failed)"), criticalFailure: note("Critical Failure (the cast's save failed)") },
        reminder: `Target a ${size} or smaller creature${step ? ` (from ${step[1]}th rank, up to ${step[2]} creatures)` : ""}.`,
        sentences: [...sentences, ...(heightened ? [heightened] : [])]
    };
}

// An illusory mire (Oneiric Mire): "You shroud an area in illusory dreamstuff, making the ground look and feel like a deep mire or quicksand. Ground in the
// area is difficult terrain." / "Each creature in the area when the spell is cast, or that enters the area, must attempt a Will save. On a failure, it
// believes it's being pulled down by the earth, taking a –10-foot circumstance penalty to its Speeds. On a critical failure, it's also Immobilized. In
// addition to the normal actions to Escape, at the end of an affected creature's turn, it can attempt a Will save, removing the effects on a success. On
// a critical success at any Will save made against oneiric mire, the creature fully disbelieves the illusion and no longer needs to make Will saves …,
// though the area is still difficult terrain." — the lingering area's rows: unaffected and immune for the spell (disbelieved) on a critical success;
// the penalty (and Immobilized) until it Escapes; the affected rows' note carries the end-of-turn Will save (the control, once a round; a success
// removes this creature's effects of the spell).
const MIRE = {
    lead: /^You shroud an area in illusory [a-z]+, making the ground look and feel like a deep mire or quicksand\.$/,
    terrain: /^Ground in the area is difficult terrain\.$/,
    save: /^Each creature in the area when the spell is cast, or that enters the area, must attempt a (Will) save\.$/,
    failure: /^On a failure, it believes it's being pulled down by the earth, taking a [–−-](\d+)-foot (circumstance) penalty to its Speeds\.$/,
    critical: /^On a critical failure, it's also (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Immobilized\})\.$/,
    end: /^In addition to the normal actions to Escape, at the end of an affected creature's turn, it can attempt a (Will) save, removing the effects on a success\.$/,
    disbelief: /^On a critical success at any (Will) save made against [a-z ]+, the creature fully disbelieves the illusion and no longer needs to make Will saves to risk a Speed penalty or being immobilized, though the area is still difficult terrain\.$/
};

/** {html, notes, sentences} or null. */
export function rewriteIllusoryMire(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "burst" || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    if (!minutes || /<hr/i.test(html)) return null;
    const sentences = htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const keys = Object.keys(MIRE);
    if (sentences.length !== keys.length || keys.some((key, index) => !MIRE[key].test(sentences[index]))) return null;
    const failure = MIRE.failure.exec(sentences[3]), critical = MIRE.critical.exec(sentences[4]);
    if (MIRE.save.exec(sentences[2])[1].toLowerCase() !== adapted.defense.statistic) return null;
    const time = `${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}`;
    const note = row => ({ label: "Oneiric mire", text: "At the end of each of its turns, it can attempt a Will save against the spell (the control): a success removes this spell's effects on it; a critical success on any Will save against the mire disbelieves it (no more saves).",
        sourceText: row, claimsRow: true, gmPlays: true, endSave: { statistic: "will", label: "at the end of its turn", oncePerRound: true, scope: "creature", immunityOnCritical: { value: Number(minutes[1]), unit: "minutes" } },
        duration: { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: time } });
    return {
        html: `<p>The ground in the area is difficult terrain. Each creature in the area when the spell is cast, or that enters the area, must attempt a Will save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected and is temporarily immune for ${time}.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature takes a –${failure[1]}-foot ${failure[2]} penalty to its Speeds until it Escapes.</p>`
            + `<p><strong>Critical Failure</strong> As failure, but the creature is also ${critical[1]} until it Escapes.</p>`,
        notes: { failure: note("Failure"), criticalFailure: note("Critical Failure") },
        sentences
    };
}

// A wall of wind (Wall of Wind): "You create a barrier of gusting winds that hinders anything moving through it. The wall of swirling winds is 5 feet thick,
// 60 feet long, and 30 feet high. The wall stands vertically, but you can shape its path. Though the wall of wind distorts the air, it does not hamper
// sight. The wall has the following effects." with the list (ammunition can't pass; bigger ranged weapons −2 circumstance through it; massive weapons and
// non-physical spells pass; difficult terrain to creatures moving overland through it; gases can't pass; "A creature that attempts to fly through the wall
// using a move action must attempt a Fortitude save.") and rows (moves through normally / through, but the wall is difficult terrain / stopped, the rest of
// the action's movement wasted / as failure, pushed 10 feet away from the wall) — a lingering line the GM places: difficult terrain for walking; a
// creature entering it saves (the GM leaves out creatures not flying through); the rows' movement is the GM's note, the push the card's.
const WIND = {
    lead: /^You create a barrier of gusting winds that hinders anything moving through it\.$/,
    size: /^The wall of swirling winds is (\d+) feet thick, (\d+) feet long, and (\d+) feet high\.$/,
    shape: /^The wall stands vertically, but you can shape its path\.$/,
    sight: /^Though the wall of wind distorts the air, it does not hamper sight\.$/,
    has: /^The wall has the following effects\.$/
};
const WIND_LIST = [/^Ammunition from physical ranged attacks[-—–]such as arrows, bolts, sling bullets, and other objects of similar size[-—–]can't pass through the wall\. Attacks with bigger ranged weapons, such as javelins, take a [-–−](\d) circumstance penalty to their attack rolls if their paths pass through the wall\. Massive ranged weapons and spell effects that don't create physical objects pass through the wall with no penalty\.$/,
    /^The wall is difficult terrain to creatures attempting to move overland through it\. Gases, including creatures in (?:@UUID\[[^\]]+\]\{Vapor Form\}|Vapor Form), can't pass through the wall\.$/,
    /^A creature that attempts to fly through the wall using a move action must attempt a (Fortitude) save\.$/];
const WIND_ROWS = { criticalSuccess: /^The creature can move through the wall normally this turn\.$/, success: /^The flying creature can move through the wall this turn, but the wall is difficult terrain\.$/,
    failure: /^The wall stops the movement of the flying creature, and any remaining movement from its current action is wasted\.$/, criticalFailure: /^As failure, and the creature is pushed (\d+) feet away from the wall\.$/ };

/** {html, area, notes, push, reminder, sentences} or null. */
export function rewriteWindWall(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const list = /<ul>([\s\S]*?)<\/ul>/i.exec(body);
    if (!list) return null;
    const lead = htmlToPlainText(body.slice(0, list.index)).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const items = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const keys = Object.keys(WIND);
    if (lead.length !== keys.length || keys.some((key, index) => !WIND[key].test(lead[index])) || items.length !== WIND_LIST.length || WIND_LIST.some((pattern, index) => !pattern.test(items[index]))) return null;
    const rows = Object.fromEntries([...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)]
        .map(match => [{ "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[match[1]], htmlToPlainText(match[2]).replace(/\s+/g, " ").trim()]));
    if (Object.keys(WIND_ROWS).some(degree => !WIND_ROWS[degree].test(rows[degree] ?? ""))) return null;
    const [, thick, long, high] = WIND.size.exec(lead[1]), [, penalty] = WIND_LIST[0].exec(items[0]), [, statistic] = WIND_LIST[2].exec(items[2]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const turn = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: "this turn" };
    const note = (degree, text) => ({ label: "Wall of wind", text, sourceText: rows[degree], claimsRow: true, gmPlays: true, duration: { ...turn } });
    const stopped = "The wall stops its flight; any remaining movement from its current action is wasted.";
    return {
        html: `<p>The area is difficult terrain. A creature that enters the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is unaffected.</p><p><strong>Critical Failure</strong> The creature is unaffected.</p>`,
        area: { type: "line", value: Number(long) },
        notes: { success: note("success", "It can fly through the wall this turn, but the wall is difficult terrain for it."), failure: note("failure", stopped), criticalFailure: note("criticalFailure", stopped) },
        push: { degree: "criticalFailure", move: { kind: "push", distance: Number(WIND_ROWS.criticalFailure.exec(rows.criticalFailure)[1]), upTo: false, optional: false, direction: "any", sourceText: rows.criticalFailure } },
        reminder: `Place the wall (${thick} feet thick, up to ${long} feet long and ${high} feet high; you can shape its path) as a line. Only a creature flying through it saves (leave out creatures moving overland: for them the wall is difficult terrain). Ammunition can't pass through it; bigger ranged weapons such as javelins take a −${penalty} circumstance penalty to attacks through it; massive weapons and non-physical spells pass. Gases (Vapor Form) can't pass. The push is away from the wall.`,
        sentences: [...lead, ...items, ...Object.values(rows)]
    };
}

// A churning area (Shifting Sand): "You cause the surface to heave. The area becomes difficult terrain, and any tracks in the area are destroyed by the churning
// ground. Creatures standing in the area take a –1 status penalty to Acrobatics checks to Balance and Tumble Through and Athletics checks to High Jump and
// Long Jump. The first time each round you Sustain the Spell, you can move the churning area up to 20 feet in any direction. Creatures Immobilized by the
// spell are carried along with the shifting sand in the same direction, if possible. Creatures that enter or begin their turn standing in the shifting sand
// must attempt a Reflex save." with rows (unaffected and ignores the terrain and penalty this turn / ignores the penalty this turn / affected normally /
// Immobilized until it Escapes, and Prone if already immobilized by it) and "Heightened (5th) The status penalty increases to –2, …" — a lingering area:
// difficult terrain; an in-area Effect with the penalty (PF2e's bracketed value at the cast rank) on those four actions; the save on entering or at a
// turn's start; the rows' "ignores …" and the Prone a GM note; the move and the carried creatures a reminder.
const SAND = [/^You cause the surface to heave\.$/,
    /^The area becomes difficult terrain, and any tracks in the area are destroyed by the churning ground\.$/,
    /^Creatures standing in the area take a [–−-](\d) status penalty to Acrobatics checks to (?:@UUID\[[^\]]+\]\{Balance\}|Balance) and (?:@UUID\[[^\]]+\]\{Tumble Through\}|Tumble Through) and Athletics checks to (?:@UUID\[[^\]]+\]\{High Jump\}|High Jump) and (?:@UUID\[[^\]]+\]\{Long Jump\}|Long Jump)\.$/,
    /^The first time each round you Sustain the Spell, you can move the churning area up to (\d+) feet in any direction\.$/,
    /^Creatures (?:@UUID\[[^\]]+\]\{Immobilized\}|Immobilized) by the spell are carried along with the shifting sand in the same direction, if possible\.$/,
    /^Creatures that enter or begin their turn standing in the shifting sand must attempt a (Reflex) save\.$/];
const SAND_ROWS = { criticalSuccess: /^The creature is unaffected and ignores the area's difficult terrain and penalty to skill checks until the end of its turn\.$/,
    success: /^The creature ignores the area's penalty to skill checks until the end of its turn\.$/, failure: /^The creature is affected normally by the spell this turn\.$/,
    criticalFailure: /^The creature becomes immobilized within the spell's area until it Escapes\. If the creature was already immobilized by shifting sand, it also falls (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\})\.$/ };
const SAND_STEP = /^Heightened \((\d)th\) The status penalty increases to [–−-](\d)/;

/** {html, notes, memberRules, reminder, sentences} or null. */
export function rewriteShiftingSurface(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained !== true) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    // (A leading "Area (continued)" paragraph names the surface.)
    const start = /^<p>\s*<strong>\s*Area\s*<\/strong>/i.test(sections[0] ?? "") ? 1 : 0;
    const [body, table, ...heightened] = sections.slice(start);
    if (!table) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== SAND.length || SAND.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const rows = Object.fromEntries([...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)]
        .map(match => [{ "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[match[1]], match[2].replace(/\s+/g, " ").trim()]));
    const bare = text => String(text ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (Object.keys(SAND_ROWS).some(degree => !SAND_ROWS[degree].test(bare(rows[degree])))) return null;
    const steps = heightened.flatMap(section => [...section.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => SAND_STEP.exec(htmlToPlainText(match[1]).replace(/\s+/g, " ").trim()))).filter(Boolean);
    if (steps.length !== heightened.join(" ").split(/Heightened/).length - 1) return null;
    const base = Number(SAND[2].exec(sentences[2])[1]), [, moveFeet] = SAND[3].exec(sentences[3]), [, statistic] = SAND[5].exec(sentences[5]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const rank = Number(adapted.rank);
    const brackets = [{ start: rank, end: (steps[0] ? Number(steps[0][1]) - 1 : 20), value: -base },
        ...steps.map((step, index) => ({ start: Number(step[1]), ...(steps[index + 1] ? { end: Number(steps[index + 1][1]) - 1 } : {}), value: -Number(step[2]) }))];
    const value = { brackets, field: "item|system.level.value" };
    const prone = /@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\}/.exec(rows.criticalFailure)[0];
    const turn = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: "until the end of its turn" };
    const note = (degree, text) => ({ label: "Shifting sand", text, sourceText: rows[degree].replace(/<[^>]+>/g, ""), claimsRow: true, gmPlays: true, duration: { ...turn } });
    return {
        html: `<p>The area becomes difficult terrain. Each creature that enters or starts its turn in the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is unaffected.</p>`
            + `<p><strong>Critical Failure</strong> The creature is @UUID[Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe]{Immobilized} until it Escapes.</p>`,
        notes: { criticalSuccess: note("criticalSuccess", "Until the end of its turn it ignores the area's difficult terrain and the penalty to its skill checks (switch the in-area penalty off for those checks)."),
            success: note("success", "Until the end of its turn it ignores the area's penalty to its skill checks (switch the in-area penalty off for those checks)."),
            criticalFailure: { ...note("criticalFailure", `If it was already immobilized by the shifting sand, it also falls ${prone.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/, "$1")} (the GM).`), duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: "now" } } },
        memberRules: [
            { key: "RollOption", domain: "all", option: "shifting-sand-ignored", toggleable: true, label: "It ignores the shifting sand's penalty this turn", value: false },
            { key: "FlatModifier", selector: "acrobatics", type: "status", value, predicate: [{ or: ["action:balance", "action:tumble-through"] }, { not: "shifting-sand-ignored" }] },
            { key: "FlatModifier", selector: "athletics", type: "status", value, predicate: [{ or: ["action:high-jump", "action:long-jump"] }, { not: "shifting-sand-ignored" }] }],
        reminder: `The first time each round you Sustain the spell, you can move the area up to ${moveFeet} feet in any direction (move the region); creatures it holds Immobilized are carried along the same way, if possible. Tracks in the area are destroyed.`,
        sentences
    };
}

// A rolling orb that engulfs (Aqueous Orb): "A sphere of water 10 feet in diameter forms in an unoccupied space in range, …" / "When you Cast this Spell and
// each time you Sustain it, you can roll the orb, moving it up to 10 feet …" / fires extinguished or counteracted / "The orb can engulf Large or smaller
// creatures it moves through, … only once per turn … Any Large or smaller creature whose space the orb tries to move through can attempt a Reflex save." with
// rows (let it pass or be pushed / engulfed: moves with it, holds its breath, gets free by Swimming (DC 10) or Escaping / as failure, but can't Swim free) —
// a lingering 10-foot sphere the GM places and rolls (moves the region); the GM's control for a creature the orb tries to move through (its Reflex save);
// the rows the GM's notes, the engulfed one ending on an Escape against the spell DC; the fires a reminder.
const ORB = {
    forms: /^A sphere of water (\d+) feet in diameter forms in an unoccupied space in range, either on the ground or on the surface of a liquid\.$/,
    roll: /^When you Cast this Spell and each time you Sustain it, you can roll the orb, moving it up to (\d+) feet along the ground or the surface of a liquid\.$/,
    through: /^The orb can move through the spaces of any creatures or obstacles that wouldn't stop the flow of water\.$/,
    fires: /^It extinguishes non-magical fires it moves through of its size or smaller, and it attempts to counteract any magical fires it moves through\.$/,
    failsFire: /^If it fails to counteract a given fire, it can't counteract that fire for the duration of the spell\.$/,
    engulf: /^The orb can engulf (Large) or smaller creatures it moves through, and it can contain as many creatures as fit in its space\.$/,
    once: /^The orb can try to engulf the same creature only once per turn, even if you roll it onto a creature's space more than once\.$/,
    save: /^Any Large or smaller creature whose space the orb tries to move through can attempt a (Reflex) save\.$/
};
const ORB_ROWS = { success: /^The creature can either let the orb pass/, failure: /^The creature is engulfed in the orb\. It moves along with the orb and must hold its breath or begin suffocating \(unless it can breathe in water\)\./,
    criticalFailure: /^As failure, but the creature can't Swim to get free\.$/ };

/** {html, area, notes, gmAction, reminder, sentences} or null. */
export function rewriteRollingOrb(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const keys = Object.keys(ORB);
    if (sentences.length !== keys.length || keys.some((key, index) => !ORB[key].test(sentences[index]))) return null;
    const rows = Object.fromEntries([...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)]
        .map(match => [{ "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[match[1]], htmlToPlainText(match[2]).replace(/\s+/g, " ").trim()]));
    if (rows.criticalSuccess || Object.keys(ORB_ROWS).some(degree => !ORB_ROWS[degree].test(rows[degree] ?? ""))) return null;
    const [, diameter] = ORB.forms.exec(sentences[0]), [, roll] = ORB.roll.exec(sentences[1]), [, statistic] = ORB.save.exec(sentences[7]);
    if (statistic.toLowerCase() !== adapted.defense.statistic || !/Swimming with a successful @Check\[athletics\|traits:action:swim\|dc:(\d+)\] check or by @UUID\[[^\]]+\]\{Escaping\} against your spell DC/.test(table)) return null;
    const swim = /dc:(\d+)/.exec(table)[1];
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes) return null;
    const spell = { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: "the spell's duration" };
    const engulfed = swims => ({ label: "Engulfed", text: `Engulfed in the orb: it moves with the orb and must hold its breath or begin suffocating (unless it can breathe in water). A Medium or smaller creature, and anyone trying to affect it, follow the rules for aquatic battles; a Large one can reach out of the water. It gets free ${swims ? `by Swimming (Athletics DC ${swim}) or ` : ""}by Escaping against the spell DC (ending this), and can then breathe.`,
        sourceText: rows.failure, claimsRow: true, gmPlays: true, escape: true, duration: { ...spell } });
    return {
        html: `<p>A creature that enters the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is unaffected.</p><p><strong>Critical Failure</strong> The creature is unaffected.</p>`,
        area: { type: "burst", value: Number(diameter) / 2 },
        notes: { success: { label: "Orb", text: "It lets the orb pass (staying, or moving out of its path to a space of its choice) or lets itself be pushed in front of the orb to the end of its movement (the GM moves it).", sourceText: rows.success, claimsRow: true, gmPlays: true,
                duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: "now" } },
            failure: engulfed(true), criticalFailure: { ...engulfed(false), sourceText: rows.criticalFailure } },
        gmAction: { actions: ["engulf"], label: "the orb tried to move through it (once per turn for each creature; Large or smaller)", sourceText: sentences[7] },
        reminder: `Place the ${diameter}-foot orb on the ground or a liquid's surface; when you cast it and each time you Sustain it, roll it up to ${roll} feet (move the region). It passes through creatures and obstacles that wouldn't stop water. It puts out non-magical fires its size or smaller and tries to counteract magical fires it moves through (once per fire).`,
        sentences
    };
}
