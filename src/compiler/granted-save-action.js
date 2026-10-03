// An action the spell grants for its duration that forces a save (Swarm Form): "While in swarm form, you can crawl all over any creature
// that shares your space as a single action. That creature must attempt a Fortitude save against your spell DC or become Sickened 1
// (Sickened 2 on a critical failure)."
// The two sentences leave the Effect's proof; the action is compiled as its own save (the GM targets the creature from the card's button,
// as often as the action is used while the spell lasts).
const ACTION = /(?:While [a-z ]+, )?[Yy]ou can ([a-z ]+?) as a single action\./;
const SAVE = /That creature must attempt an? (Fortitude|Reflex|Will) save against your spell DC or become (@UUID\[[^\]]+\]\{[A-Z][a-z]+ \d\}) \((@UUID\[[^\]]+\]\{[A-Z][a-z]+ \d\}) on a critical failure\)\./;

/** {remainingHTML, action: {label, statistic, html, sourceText}} or null. */
export function extractGrantedSaveAction(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const action = ACTION.exec(html);
    if (!action) return null;
    const after = html.slice(action.index + action[0].length);
    const saveMatch = SAVE.exec(after);
    if (!saveMatch || after.slice(0, saveMatch.index).trim()) return null;
    const label = action[1].replace(/^./, letter => letter.toUpperCase());
    const rows = `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
        + `<p><strong>Failure</strong> The creature is ${saveMatch[2]}.</p><p><strong>Critical Failure</strong> The creature is ${saveMatch[3]}.</p>`;
    const sourceText = `${action[0]} ${saveMatch[0]}`.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    return {
        remainingHTML: html.slice(0, action.index) + after.slice(saveMatch.index + saveMatch[0].length).replace(/^\s+/, ""),
        action: { label, statistic: saveMatch[1].toLowerCase(), html: `<p>The creature must attempt a ${saveMatch[1]} save.</p>${rows}`, sourceText }
    };
}

// A save the Effect's damage triggers (Envenom Companion): "A creature that is damaged by this poison must attempt a Fortitude save. On a
// failure, it's also Clumsy 1 for 1 round." with "Heightened (+3) The poison damage increases by 1d8 and the clumsy value imposed on a failed
// save increases by 1." — the item's save isn't the cast's: the Effect is the spell, and the save is a button (the GM targets the creature the
// Effect's damage hit), its condition value at the cast rank. "This spell can't target familiars." keeps a familiar from the Effect.
const DAMAGED_SAVE = /\s*A creature that is damaged by this ([a-z]+) must attempt an? (Fortitude|Reflex|Will) save\. On a failure, it's also (?:@UUID\[[^\]]+\]\{)?(Clumsy|Enfeebled|Sickened|Stupefied) (\d)\}? for (\d+) rounds?\./;
const DAMAGED_STEP = /(<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The ([a-z]+) damage increases by (\d+)d(\d+)) and the ([a-z]+) value imposed on a failed save increases by (\d+)\./;
const CONDITION_UUIDS = { clumsy: "Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm" };
const NO_FAMILIARS = /\s*This spell can't target familiars\./;

/** {effectHTML, action: {label, statistic, byRank: [{minRank, html}], sourceText}, noFamiliars} or null. */
export function extractDamagedSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const save = DAMAGED_SAVE.exec(html);
    if (!save || !/@UUID\[Compendium\.pf2e\.spell-effects\./.test(html) || save[2].toLowerCase() !== adapted.defense.statistic) return null;
    const slug = save[3].toLowerCase(), uuid = CONDITION_UUIDS[slug];
    if (!uuid) return null;
    let effectHTML = html.replace(save[0], "");
    const step = DAMAGED_STEP.exec(effectHTML);
    if (/Heightened/.test(effectHTML) && !(step && step[3] === save[1] && step[6] === slug)) return null;
    if (step) effectHTML = effectHTML.replace(step[0], `${step[1]}.`);
    const noFamiliars = NO_FAMILIARS.test(effectHTML);
    effectHTML = effectHTML.replace(NO_FAMILIARS, "");
    const base = Number(adapted.rank) || 1, value = Number(save[4]), rounds = Number(save[5]);
    const row = n => `<p>The creature must attempt a ${save[2]} save.</p><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
        + `<p><strong>Failure</strong> The creature is @UUID[${uuid}]{${save[3]} ${n}} for ${rounds} round${rounds === 1 ? "" : "s"}.</p><p><strong>Critical Failure</strong> The creature is @UUID[${uuid}]{${save[3]} ${n}} for ${rounds} round${rounds === 1 ? "" : "s"}.</p>`;
    const byRank = [{ minRank: base, html: row(value) }];
    if (step) for (let rank = base + Number(step[2]), n = value + Number(step[7]); rank <= 10; rank += Number(step[2]), n += Number(step[7])) byRank.push({ minRank: rank, html: row(n) });
    return { effectHTML, noFamiliars, action: { label: `A creature damaged by the ${save[1]}`, statistic: save[2].toLowerCase(), byRank, sourceText: save[0].trim().replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") } };
}

// A save the target's damage sets off around it (Sparkleskin): "When the target take damage, glitter bursts out of its wound in a
// @Template[emanation|distance:5]. Creatures in the area must attempt a Fortitude save." with the rows "Failure The creature is Dazzled for 1
// round." / "Critical Failure The creature is dazzled for 3 rounds." — the Effect is the spell; the burst's save is a card button (the GM targets
// the creatures within that emanation of the target).
const BURST = /\s*When the target takes? damage, ([^.@]+?) in a @Template\[(?:type:)?emanation\|distance:(\d+)\]\. Creatures in the area must attempt an? (Fortitude|Reflex|Will) save\./;
const ROWS = /((?:\s*<p>\s*<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>[^<]*(?:@UUID\[[^\]]+\]\{[^}]+\}[^<]*)*<\/p>)+)/;

/** {effectHTML, action: {label, statistic, html, sourceText}} or null. */
export function extractTriggeredAreaSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const burst = BURST.exec(html);
    if (!burst || burst[3].toLowerCase() !== adapted.defense.statistic || !/@UUID\[Compendium\.pf2e\.spell-effects\./.test(html)) return null;
    const after = html.slice(burst.index + burst[0].length);
    const rows = /^\s*<\/p>/.test(after) ? ROWS.exec(after.replace(/^\s*<\/p>/, "")) : null;
    if (!rows || rows.index !== 0) return null;
    const rowHTML = rows[1].trim();
    // Rows not stated are unaffected (a failure-only table).
    const stated = new Set([...rowHTML.matchAll(/<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/g)].map(match => match[1]));
    if (!stated.has("Failure")) return null;
    const unaffected = ["Critical Success", "Success"].filter(degree => !stated.has(degree)).map(degree => `<p><strong>${degree}</strong> The creature is unaffected.</p>`).join("");
    const effectHTML = html.slice(0, burst.index) + "</p>" + after.replace(/^\s*<\/p>/, "").slice(rows[1].length);
    return { effectHTML, action: { label: `${burst[1][0].toUpperCase()}${burst[1].slice(1)} (the target took damage)`, statistic: burst[3].toLowerCase(), radius: Number(burst[2]),
        html: `<p>Creatures in the area must attempt a ${burst[3]} save.</p><hr />${unaffected}${rowHTML}`,
        sourceText: `${burst[0].trim()} ${rowHTML}`.replace(/<[^>]+>/g, " ").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/@Template\[[^\]]+\]/g, "5-foot emanation").replace(/\s+/g, " ").trim() } };
}
