// A spell that "functions as" another spell, with one change (Stinking Cloud):
//   "The cloud functions as @UUID[…]{Mist} except it sickens creatures that end their turns within the cloud." / "(The Concealed condition is
//   not a poison effect.)"
// The referenced spell's own text decides what it does: only when it compiles as a concealing area (Mist's "All creatures within the mist become
// Concealed, and all creatures outside the mist become concealed to creatures within it.") is the sentence rewritten into that rule for this
// spell's area, plus the change as the area's trigger — "A creature that ends its turn within the cloud must attempt a Fortitude save." — for
// the lingering-area compiler, with the degree table unchanged. The referenced spell's source comes from the compile option `referencedSpells`
// (uuid → source): the official compile has every spell; the module loads the referenced ones before compiling.
import { htmlToPlainText } from "./description-parser.js";
import { adaptSpellSource } from "./spell-source-adapter.js";
import { compileConcealingArea } from "./concealing-area.js";

const FUNCTIONS = /^The ([a-z]+) functions as @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\} except it [a-z]+ creatures that (end|start) their turns within the \1\.$/;
const NOT_POISON = /^\(The @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\} condition is not an? ([a-z]+) effect\.\)$/;
const split = text => text.replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@(])/).map(sentence => sentence.trim()).filter(Boolean);

/** The rewritten description, or null. */
export function rewriteBorrowedSpell(adapted, referencedSpells) {
    if (!referencedSpells || adapted.defense?.kind !== "save" || adapted.defense.basic || !adapted.targeting?.area) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const at = html.search(/<hr\s*\/?>/i);
    if (at < 0) return null;
    const body = html.slice(0, at), rest = html.slice(at);
    const sentences = split(htmlToPlainText(body));
    const index = sentences.findIndex(sentence => FUNCTIONS.test(sentence));
    if (index < 0) return null;
    const [, noun, uuid, , boundary] = FUNCTIONS.exec(sentences[index]);
    const referenced = referencedSpells.get?.(uuid) ?? null;
    if (!referenced) return null;
    const borrowed = compileConcealingArea(adaptSpellSource(referenced, {}));
    if (!borrowed) return null;
    // Before: narration only; after: only the trait's note.
    if (sentences.slice(0, index).some(sentence => /\d|@|\b(?:damage|saves?|conditions?|must|each)\b/i.test(sentence))) return null;
    const after = sentences.slice(index + 1);
    if (after.length > 1 || (after.length === 1 && !(NOT_POISON.test(after[0]) && (adapted.activation?.traits ?? []).includes(NOT_POISON.exec(after[0])[1])))) return null;
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    const rewritten = [...sentences.slice(0, index),
        `All creatures within the ${noun} become concealed, and all creatures outside the ${noun} become concealed to creatures within it.`,
        `A creature that ${boundary}s its turn within the ${noun} must attempt a ${statistic} save.`];
    return { html: `<p>${rewritten.join(" ")}</p>${rest}`, sourceText: [sentences[index], ...after], referenced: { uuid, name: referenced.name } };
}

// A spell with the whole effect of another, plus its own rules (Commanding Lash): "You issue a command to the target, with the effects of the
// spell @UUID[…]{Command}." / "If the target is Frightened, Stupefied, or taking persistent damage, it takes a –2 circumstance penalty to the
// save." / "Regardless of the result, the target is then temporarily immune for 1 hour" — the referenced spell's text and degree rows (not its
// Heightened entries), with this spell's other sentences in its opening; the same save.
const WITH_EFFECTS = /^(.+?), with the effects of the spell @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}\.$/;
export function rewriteBorrowedEffects(adapted, referencedSpells) {
    if (!referencedSpells || adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\b|<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i.test(html)) return null;
    // (Sentences run together after a link: "…{Command}.If the target …".)
    const sentences = split(htmlToPlainText(html).replace(/\}\.(?=[A-Z])/g, "}. ")).map(sentence => /[.!?)]$/.test(sentence) ? sentence : `${sentence}.`);
    const index = sentences.findIndex(sentence => WITH_EFFECTS.test(sentence));
    if (index < 0 || sentences.slice(0, index).some(sentence => /\d|@|\b(?:damage|saves?|conditions?|must|each)\b/i.test(sentence))) return null;
    const referenced = referencedSpells.get?.(WITH_EFFECTS.exec(sentences[index])[2]) ?? null;
    if (!referenced) return null;
    const source = adaptSpellSource(referenced, {});
    if (source.defense?.kind !== "save" || source.defense.basic || source.defense.statistic !== adapted.defense.statistic) return null;
    const own = String(referenced.system?.description?.value ?? "");
    const cut = own.search(/<hr\s*\/?>\s*<p>\s*<strong>\s*Heightened\b/i);
    const body = (cut >= 0 ? own.slice(0, cut) : own).replace(/<hr\s*\/?>/gi, "");
    const opening = /^<p>([\s\S]*?)<\/p>/.exec(body.trim());
    if (!opening) return null;
    const extra = sentences.slice(index + 1).join(" ");
    return { html: `<p>${opening[1]} ${extra}</p>${body.trim().slice(opening[0].length)}`, sourceText: sentences.slice(index), referenced: { uuid: WITH_EFFECTS.exec(sentences[index])[2], name: referenced.name } };
}

// A basic-save cloud that "functions as" a concealing spell (Toxic Cloud): "This functions as @UUID[…]{Mist}, except the area moves 10 feet away
// from you each round." — when the referenced spell compiles as a concealing area, the sentence becomes that rule for this spell's area (and the
// drift a note after the area's damage) for the lingering-area compiler.
const FUNCTIONS_BASIC = /^(?:This|The cloud) functions as @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}(?:, except the area moves (\d+) feet away from you each round)?\.$/;

/** The rewritten description, or null. */
export function rewriteBorrowedConcealment(adapted, referencedSpells) {
    if (!referencedSpells || adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !adapted.targeting?.area) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const at = html.search(/<hr\s*\/?>/i);
    const body = at < 0 ? html : html.slice(0, at), rest = at < 0 ? "" : html.slice(at);
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)];
    if (paragraphs.length !== 1) return null;
    const sentences = split(paragraphs[0][1].replace(/<\/?(?:em|strong)>/g, ""));
    const index = sentences.findIndex(sentence => FUNCTIONS_BASIC.test(sentence));
    if (index < 0) return null;
    const [, uuid, , feet] = FUNCTIONS_BASIC.exec(sentences[index]);
    const referenced = referencedSpells.get?.(uuid) ?? null;
    if (!referenced || !compileConcealingArea(adaptSpellSource(referenced, {}))) return null;
    const rewritten = [...sentences.slice(0, index), "All creatures within the area become concealed, and all creatures outside the area become concealed to creatures within it.",
        ...sentences.slice(index + 1), ...(feet ? [`The area moves ${feet} feet away from you each round: move the region.`] : [])];
    return { html: `<p>${rewritten.join(" ")}</p>${rest}`, sourceText: [sentences[index]], referenced: { uuid, name: referenced.name } };
}

// A no-save area that "obscures vision, with the effect of" a concealing spell (Dust Storm): "The dust storm obscures vision, with the effect of
// @UUID[…]{Mist}." — when the referenced spell compiles as a concealing area, the sentence becomes that rule for this spell's area (the
// concealing-area compiler reads the rest).
const OBSCURES = /^The ([a-z ]+) obscures vision, with the effect of @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}\.$/;

/** The rewritten description, or null. */
export function rewriteBorrowedObscure(adapted, referencedSpells) {
    if (!referencedSpells || (adapted.defense?.kind ?? "none") !== "none" || !adapted.targeting?.area) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const at = html.search(/<hr\s*\/?>/i);
    const body = at < 0 ? html : html.slice(0, at), rest = at < 0 ? "" : html.slice(at);
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)];
    if (paragraphs.length !== 1) return null;
    const sentences = split(paragraphs[0][1].replace(/<\/?(?:em|strong)>/g, ""));
    const index = sentences.findIndex(sentence => OBSCURES.test(sentence));
    if (index < 0) return null;
    const [, , uuid] = OBSCURES.exec(sentences[index]);
    const referenced = referencedSpells.get?.(uuid) ?? null;
    if (!referenced || !compileConcealingArea(adaptSpellSource(referenced, {}))) return null;
    const rewritten = [...sentences.slice(0, index), "All creatures within the area become concealed, and all creatures outside the area become concealed to creatures within it.",
        ...sentences.slice(index + 1)];
    return { html: `<p>${rewritten.join(" ")}</p>${rest}`, sourceText: [sentences[index]], referenced: { uuid, name: referenced.name } };
}

// Creatures of a trait in an unmarked area save with another spell's effects (Control Water): "Area 50 feet long by 50 feet wide" / "By imposing
// your will upon the water, you can raise or lower the level of water in the chosen area by 10 feet. Creatures that have the water trait and that
// are in the area when you Cast the Spell must attempt a Fortitude save, with the effects of the @UUID[…]{Slow} spell." — the referenced spell's
// degree rows (not its Heightened entries) for the creatures of that trait the caster targets (the GM's area, no template); the water a GM note.
const TRAIT_SAVE = /^Creatures that have the ([a-z]+) trait and that are in the area when you Cast the Spell must attempt an? (Fortitude|Reflex|Will) save, with the effects of the @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\} spell\.$/;
const AREA_LINE = /^<p>\s*<strong>\s*Area\s*<\/strong>\s*(\d+) feet long by (\d+) feet wide\s*<\/p>\s*<hr\s*\/?>\s*/;
const WATER_LEVEL = /^By imposing your will upon the [a-z]+, you can raise or lower the level of [a-z]+ in the chosen area by (\d+) feet\.$/;

/** {html, target, note, sourceText} or null. */
export function rewriteBorrowedTraitSave(adapted, referencedSpells) {
    if (!referencedSpells || adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    if ((adapted.damageComponents ?? []).length) return null;
    let html = String(adapted.descriptionHTML ?? "").trim();
    const area = AREA_LINE.exec(html);
    if (!area) return null;
    html = html.slice(area[0].length);
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)];
    if (paragraphs.length !== 1 || html.replace(paragraphs[0][0], "").trim()) return null;
    const sentences = split(paragraphs[0][1]);
    if (sentences.length !== 2 || !WATER_LEVEL.test(sentences[0])) return null;
    const save = TRAIT_SAVE.exec(sentences[1]);
    if (!save || save[2].toLowerCase() !== adapted.defense.statistic) return null;
    const referenced = referencedSpells.get?.(save[3]) ?? null;
    if (!referenced) return null;
    const source = adaptSpellSource(referenced, {});
    if (source.defense?.kind !== "save" || source.defense.basic || source.defense.statistic !== adapted.defense.statistic) return null;
    const own = String(referenced.system?.description?.value ?? "");
    const cut = own.search(/<hr\s*\/?>\s*<p>\s*<strong>\s*Heightened\b/i);
    const body = (cut >= 0 ? own.slice(0, cut) : own).trim();
    const table = body.split(/<hr\s*\/?>/i);
    if (table.length !== 2 || !/<strong>\s*Critical Success\s*<\/strong>/.test(table[1])) return null;
    return {
        html: `<p>The target must attempt a ${save[2]} save.</p><hr />${table[1].trim()}`,
        target: `each creature with the ${save[1]} trait`,
        note: `${sentences[0]} (The GM changes the water in the ${area[1]}-by-${area[2]}-foot area; target only the creatures with the ${save[1]} trait in it.)`,
        sourceText: sentences, referenced: { uuid: save[3], name: referenced.name }
    };
}


// A spell with another spell's effects plus a critical failure's persistent damage (Ranger's Bramble): "You cause plants in the area to entangle your
// foes, with the effects of @UUID[…]{Entangling Flora}." / "A creature that critically fails the save takes @Damage[(max(0,@item.level -1))d4[bleed]]
// damage in addition to being @UUID[…]{Immobilized}." / "Escaping your bramble doesn't end the bleed damage." with "Heightened (+1) The bleed damage
// on a critical failure increases by 1d4." — the referenced spell's text (its own rules, for this spell's area and save), and the critical failure's
// damage as persistent (bleed is persistent; Escaping doesn't end it), the inline roll's formula at the cast rank.
const WITH = /^You cause [a-z ]+ in the area to [a-z ]+, with the effects of @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}\.$/;
const CRIT = /^A creature that critically fails the save takes @Damage\[([^\]]*?)\[([a-z]+)\]\] damage in addition to being @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+)\}\.$/;
const LASTS = /^@UUID\[[^\]]+\]\{Escaping\} your [a-z]+ doesn't end the ([a-z]+) damage\.$/;
const RIDER_STEP = /^Heightened \(\+1\) The ([a-z]+) damage on a critical failure increases by 1d(\d+)\.$/;

/** {html, rider, sentences, referenced} or null. */
export function rewriteBorrowedCriticalRider(adapted, referencedSpells) {
    if (!referencedSpells || adapted.defense?.kind !== "save" || adapted.defense.basic || !adapted.targeting?.area) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(htmlToPlainText(body));
    const with_ = WITH.exec(sentences[0] ?? ""), crit = CRIT.exec(sentences[1] ?? ""), lasts = LASTS.exec(sentences[2] ?? "");
    const step = RIDER_STEP.exec(split(htmlToPlainText(rest.join(" "))).join(" "));
    if (sentences.length !== 3 || !with_ || !crit || !lasts || lasts[1] !== crit[2] || !step || step[1] !== crit[2]) return null;
    // ("(max(0,@item.level -1))d4": one more die a rank — the Heightened entry.)
    const dice = /^\(max\(0,@item\.level ?-(\d+)\)\)d(\d+)$/.exec(crit[1].trim());
    if (!dice || dice[2] !== step[2]) return null;
    const referenced = referencedSpells.get?.(with_[1]) ?? null;
    if (!referenced) return null;
    const source = adaptSpellSource(referenced, {});
    if (source.defense?.kind !== "save" || source.defense.basic || source.defense.statistic !== adapted.defense.statistic) return null;
    // The referenced spell's condition on a critical failure must be the one named.
    if (!new RegExp(`critical failure, it's also @UUID\\[[^\\]]+\\]\\{${crit[3]}\\}`, "i").test(String(referenced.system?.description?.value ?? ""))) return null;
    return { html: String(referenced.system?.description?.value ?? ""), referenced: { uuid: with_[1], name: referenced.name },
        rider: { formula: `${crit[1].trim()}[persistent,${crit[2]}]`, type: crit[2], sourceText: sentences[1], note: unlinkText(sentences[2]) }, sentences };
}
const unlinkText = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
