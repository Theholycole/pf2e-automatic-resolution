// An emanation on the caster whose save each creature makes once per casting, the result holding while it's inside (the lantern aura's
// record with the degree table's rows):
//   - Infinitesimal Collapse Field: "The first time an enemy enters or starts their turn in the emanation, they must attempt a Fortitude save." /
//     "If a target affected by the spell leaves the spell's area and later re-enters it, the spell's effects resume based on their previous saving
//     throw." with "Success The target is Encumbered while in the area of the spell." / "Failure The target is encumbered and Slowed 1 while in the
//     area of the spell." / "Critical Failure The target is Encumbered, Slowed 1, and cannot take reactions while in the area of the spell.";
//   - Repulsion: "When casting the spell, you can make the area any radius you choose, up to 40 feet." / "A creature must attempt a Will save if
//     it's within the area when you Cast the Spell or as soon as it enters the area while the spell is in effect." / "Once a creature has attempted
//     the save, it uses the same result for that casting of repulsion." with rows restricting how it moves toward the caster (notes on its Effect).
//   - Pied Piping: "Each creature within the emanation must attempt a Will save when you Cast the Spell or the first time they enter the area, after
//     which they become temporarily immune for 1 day. Once per turn, you can Sustain the composition to increase the emanation's radius by 5 feet. You
//     can Dismiss the spell." with "Success … Fascinated with you." / "Failure … fascinated by you and uses all its actions to move toward you …" /
//     "Critical Failure The target gains the minion trait and is controlled by you. …": the rows' Effects kept for the spell wherever the creature goes
//     (the text doesn't tie them to the area), the critical failure's Controlled with the caster's control of a minion (user decision 2026-10-01), the
//     1-day immunity, an optional growing Sustain. PF2e's item has no area: the caster picks the radius (60 feet offered).
// The creatures inside (enemies only when the text says so) get a save card once for the cast; each row's Effect (its conditions, and what PF2e
// can't do as its note) is held while inside, removed on leaving and restored on re-entering.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(String(html ?? "")).replace(/\s+/g, " ").trim();
const sentencesOf = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];
const LINK = /^@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z-]+)(?: (\d))?\}$/;

const FIELD = {
    first: /^The first time an enemy enters or starts their turn in the emanation, they must attempt an? (Fortitude|Reflex|Will) save\.$/,
    resume: /^If a target affected by the spell leaves the spell's area and later re-enters it, the spell's effects resume based on their previous saving throw\.$/,
    // "The target is encumbered and Slowed 1 while in the area of the spell." (a bare name repeats a link given on an earlier row)
    row: /^The target is (.+) while in the area of the spell\.$/
};
const REPULSION = {
    radius: /^When casting the spell, you can make the area any radius you choose, up to (\d+) feet\.$/,
    who: /^A creature must attempt an? (Fortitude|Reflex|Will) save if it's within the area when you Cast the Spell or as soon as it enters the area while the spell is in effect\.$/,
    same: /^Once a creature has attempted the save, it uses the same result for that casting of [a-z' ]+\.$/,
    voluntary: /^Any restrictions on a creature's movement apply only if it voluntarily moves toward you\.$/,
    example: /^For example, if you move closer to a creature, it doesn't then need to move away\.$/,
    free: /^The creature's movement is not restricted\.$/,
    terrain: /^The creature treats each square in the area as difficult terrain when moving closer to you\.$/,
    blocked: /^The creature can't move closer to you within the area\.$/
};

function rowsOf(table) {
    const rows = {};
    for (const [degree, heading] of DEGREES) {
        const row = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table);
        rows[degree] = row ? plain(row[1]) : null;
    }
    return rows;
}

/** "Encumbered, Slowed 1, and cannot take reactions" → conditions (links, or a bare name an earlier link gave) and the rest as text. */
function fieldItems(list, links) {
    const items = list.replace(/,? and /g, ", ").split(/,\s*/).map(item => item.trim()).filter(Boolean);
    const conditions = [], notes = [];
    for (const item of items) {
        const link = LINK.exec(item);
        if (link) { const condition = { uuid: link[1], slug: link[2].toLowerCase(), value: link[3] ? Number(link[3]) : null }; links.set(condition.slug, condition); conditions.push(condition); continue; }
        const bare = /^([a-z]+)(?: (\d))?$/.exec(item);
        if (bare && links.has(bare[1])) { conditions.push({ ...links.get(bare[1]), ...(bare[2] ? { value: Number(bare[2]) } : {}) }); continue; }
        if (/^cannot take reactions$/.test(item)) { notes.push("It can't take reactions."); continue; }
        return null;
    }
    return { conditions, notes };
}

function compileCollapseField(adapted, sentences, table) {
    const area = adapted.targeting?.area;
    if (area?.type !== "emanation" || adapted.lifecycle?.sustained !== true || sentences.length !== 3 || NARRATION_RULES.test(sentences[0])) return null;
    const first = FIELD.first.exec(sentences[1]);
    if (!first || first[1].toLowerCase() !== adapted.defense.statistic || !FIELD.resume.test(sentences[2])) return null;
    const rows = rowsOf(table);
    if (rows.criticalSuccess !== "The target is unaffected.") return null;
    // (Links come first in the critical failure row: read the rows from the most severe, so a bare name finds its link.)
    const links = new Map();
    for (const match of table.matchAll(/@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z-]+)(?: \d)?\}/g)) links.set(match[2].toLowerCase(), { uuid: match[1], slug: match[2].toLowerCase(), value: null });
    const out = {};
    for (const degree of ["success", "failure", "criticalFailure"]) {
        const row = FIELD.row.exec(rows[degree] ?? "");
        const items = row ? fieldItems(row[1], links) : null;
        if (!items || !items.conditions.length) return null;
        out[degree] = { label: degree === "success" ? "Success" : degree === "failure" ? "Failure" : "Critical failure", conditions: items.conditions, notes: items.notes, sourceText: rows[degree] };
    }
    return {
        lanternAura: { radius: Number(area.value), durationSeconds: 60, sustained: true, statistic: adapted.defense.statistic, light: null, enemiesOnly: true, rows: out, growth: null,
            sourceText: [...sentences.slice(1), ...DEGREES.map(([degree, heading]) => rows[degree] ? `${heading} ${rows[degree]}` : null).filter(Boolean)] },
        claimed: sentences
    };
}

function compileRepulsion(adapted, sentences, table) {
    if (adapted.targeting?.area || adapted.lifecycle?.sustained || !/^emanation up to (\d+)-feet$/.test(String(adapted.targeting?.range ?? adapted.range ?? "").trim() || "emanation up to 0-feet")) return null;
    if (sentences.length !== 6 || NARRATION_RULES.test(sentences[0])) return null;
    const [radius, who, same, voluntary, example] = [REPULSION.radius, REPULSION.who, REPULSION.same, REPULSION.voluntary, REPULSION.example].map((pattern, index) => pattern.exec(sentences[index + 1]));
    if (!radius || !who || !same || !voluntary || !example || who[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = rowsOf(table);
    if (!REPULSION.free.test(rows.criticalSuccess ?? "") || !REPULSION.terrain.test(rows.success ?? "") || !REPULSION.blocked.test(rows.failure ?? "")) return null;
    if (rows.criticalFailure != null && !REPULSION.blocked.test(rows.criticalFailure)) return null;
    const why = `Only when it moves toward you of its own accord: if you move closer to it, it doesn't need to move away.`;
    const out = {
        success: { label: "Success", conditions: [], notes: [`${rows.success} ${why}`], sourceText: rows.success },
        failure: { label: "Failure", conditions: [], notes: [`${rows.failure} ${why}`], sourceText: rows.failure }
    };
    // (No critical failure row: a critical failure is a failure.)
    out.criticalFailure = { ...out.failure, label: "Critical failure", sourceText: rows.criticalFailure ?? rows.failure };
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes) return null;
    return {
        lanternAura: { radius: Number(radius[1]), radiusUpTo: Number(radius[1]), durationSeconds: Number(minutes[1]) * 60, sustained: false, statistic: adapted.defense.statistic, light: null,
            enemiesOnly: false, rows: out, growth: null, sourceText: [...sentences.slice(1), ...DEGREES.map(([degree, heading]) => rows[degree] ? `${heading} ${rows[degree]}` : null).filter(Boolean)] },
        claimed: sentences
    };
}

const PIPING = {
    who: /^Each creature within the emanation must attempt an? (Fortitude|Reflex|Will) save when you Cast the Spell or the first time they enter the area, after which they become temporarily immune for (\d+) (day|hour|minute)s?\.$/,
    grow: /^Once per turn, you can Sustain the composition to increase the emanation's radius by (\d+) feet\.$/,
    dismiss: /^You can Dismiss the spell\.$/,
    unaffected: /^The creature is unaffected\.$/,
    success: new RegExp(String.raw`^The creature is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Fascinated\} with you\.$`),
    failure: /^The creature is fascinated by you and uses all its actions to move toward you and compliment your performance\. This effect ends if a hostile action is used against the affected creature\.$/,
    critical: /^The target gains the minion trait and is controlled by you\. This effect ends if a hostile action is used against the affected creature, or if you direct the creature to use any action that causes it harm\.$/
};
const CONTROLLED = "Compendium.pf2e.conditionitems.Item.9qGBRpbX9NEwtAAr";

function compilePiedPiping(adapted, sentences, table) {
    if (adapted.targeting?.area || adapted.lifecycle?.sustained || String(adapted.targeting?.range ?? "").trim() || String(adapted.targeting?.target ?? "").trim()) return null;
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0])) return null;
    const who = PIPING.who.exec(sentences[1]), grow = PIPING.grow.exec(sentences[2]);
    if (!who || !grow || !PIPING.dismiss.test(sentences[3]) || who[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = rowsOf(table);
    const fascinated = PIPING.success.exec(rows.success ?? "");
    if (!PIPING.unaffected.test(rows.criticalSuccess ?? "") || !fascinated || !PIPING.failure.test(rows.failure ?? "") || !PIPING.critical.test(rows.criticalFailure ?? "")) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes) return null;
    const hostile = "It ends if a hostile action is used against it.";
    const out = {
        success: { label: "Success", conditions: [{ uuid: fascinated[1], slug: "fascinated", value: null }], notes: ["Fascinated with you."], sourceText: rows.success },
        failure: { label: "Failure", conditions: [{ uuid: fascinated[1], slug: "fascinated", value: null }], notes: ["It uses all its actions to move toward you and compliment your performance.", hostile], sourceText: rows.failure },
        criticalFailure: { label: "Critical failure", conditions: [{ uuid: CONTROLLED, slug: "controlled", value: null }], minion: true,
            notes: ["It gains the minion trait and is controlled by you (your players own it while this lasts).", "It ends if a hostile action is used against it, or if you direct it to use any action that causes it harm."], sourceText: rows.criticalFailure }
    };
    const unit = `${who[3]}s`;
    return {
        lanternAura: { radius: 60, radiusUpTo: 120, radiusDefault: 60, durationSeconds: Number(minutes[1]) * 60, sustained: false, statistic: adapted.defense.statistic, light: null, enemiesOnly: false, rows: out,
            heldOutside: true, immunity: { value: Number(who[2]), unit }, growth: { feet: Number(grow[1]) }, dismissible: true,
            sourceText: [...sentences.slice(1), ...DEGREES.map(([degree, heading]) => rows[degree] ? `${heading} ${rows[degree]}` : null).filter(Boolean)] },
        claimed: sentences
    };
}

/** Returns {lanternAura, claimed} or null. */
export function compileRememberedAura(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length) return null;
    const sentences = sentencesOf(plain(body));
    return compileCollapseField(adapted, sentences, table) ?? compileRepulsion(adapted, sentences, table) ?? compilePiedPiping(adapted, sentences, table);
}
