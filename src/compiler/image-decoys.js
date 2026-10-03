// Illusory images that take attacks meant for the caster (Mirror Image; user decision 2026-10-01: PF2e's Effect plus the module automating
// what it doesn't — here a GM control):
//   "Three illusory images of you swirl about your space, …" / "Any attack that would hit you has a random chance of hitting one of your
//   images instead of you." / "If all three images remain, there is a 1 in 4 chance of hitting you (1 on [[/r 1d4]])." / "With two images
//   remaining, there is a 1 in 3 chance of hitting you (1-2 on [[/r 1d6]])." / "With only one image, the chances are 1 in 2 (1-3 on
//   [[/r 1d6]])." / "Once an image is hit, it is destroyed." / "If an attack roll fails to hit your AC but doesn't critically fail, it
//   destroys an image but has no additional effect …" / "If an attack roll is a critical success and would hit one of the images, one of the
//   images is destroyed and the attack roll becomes a success against you." / "Once all the images are destroyed, the spell ends."
// PF2e's Effect (no rules) goes on the caster with the image count; the Ongoing controls (an attack hit, critically hit, or missed without
// critically failing) roll the stated die, destroy images and say what the attack does; the spell ends with the last image.
import { htmlToPlainText } from "./description-parser.js";

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };
const SENTENCES = {
    swirl: /^(Three|Four|Five) illusory images of you swirl about your space, potentially causing those who attack you to hit one of the images instead of you\.$/,
    chance: /^Any attack that would hit you has a random chance of hitting one of your images instead of you\.$/,
    destroyed: /^Once an image is hit, it is destroyed\.$/,
    miss: /^If an attack roll fails to hit your AC but doesn't critically fail, it destroys an image but has no additional effect \(even if the attack would normally have an effect on a failure\)\.$/,
    critical: /^If an attack roll is a critical success and would hit one of the images, one of the images is destroyed and the attack roll becomes a success against you\.$/,
    ends: /^Once all the images are destroyed, the spell ends\.$/
};
const CHANCE = [
    /^If all (three|four|five) images remain, there is a 1 in (\d) chance of hitting you \(1(?:-(\d))? on \[\[\/r 1d(\d+)\]\]\)\.$/,
    /^With (two|three|four) images remaining, there is a 1 in (\d) chance of hitting you \(1(?:-(\d))? on \[\[\/r 1d(\d+)\]\]\)\.$/,
    /^With only (one) image, the chances are 1 in (\d) \(1(?:-(\d))? on \[\[\/r 1d(\d+)\]\]\)\.$/
];

/** Returns {imageDecoys, claimed} or null. */
export function compileImageDecoys(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const fixed = /^(\d+) (round|minute)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!fixed || /<hr\b|Heightened/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])].filter(effect => effect.resolutionStatus === "resolved");
    if (links.length !== 1 || (links[0].document?.mechanics?.rules ?? []).length) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/@UUID\[[^\]]+\]\{[^}]+\}/g, "").replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const claimed = Object.fromEntries(Object.entries(SENTENCES).map(([key, pattern]) => [key, sentences.find(sentence => pattern.test(sentence))]));
    if (Object.values(claimed).some(sentence => !sentence)) return null;
    const images = WORDS[SENTENCES.swirl.exec(claimed.swirl)[1].toLowerCase()];
    const chances = {};
    for (const sentence of sentences) {
        const match = CHANCE.map(pattern => pattern.exec(sentence)).find(Boolean);
        if (!match) continue;
        const count = WORDS[match[1]], odds = Number(match[2]), max = Number(match[3] ?? 1), die = Number(match[4]);
        // "1 in 3 … (1-2 on 1d6)": the stated range must be the stated odds.
        if (!count || die % odds !== 0 || max !== die / odds) return null;
        chances[count] = { die, max, sourceText: sentence };
    }
    if (Object.keys(chances).length !== images || !Array.from({ length: images }, (_, index) => index + 1).every(count => chances[count])) return null;
    if (sentences.length !== Object.keys(SENTENCES).length + images) return null;
    return {
        imageDecoys: { images, chances, durationSeconds: Number(fixed[1]) * (fixed[2].toLowerCase() === "round" ? 6 : 60),
            effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference } },
        claimed: sentences
    };
}

// Colored images (Chromatic Image): "You call forth three illusory images of yourself, and each of the four of you takes on a different color, … This has the
// effects of {Mirror Image}, except that whenever a foe destroys one of the images, roll [[/r 1d4]]{1d4} to see which color the image was when it was
// destroyed. The attacker takes the corresponding effect." with a list ("Red @Damage[5[fire]] damage and @Damage[5[mental]] damage." … "Green … plus it's
// {Frightened 1}.") — the referenced spell's images (its own compiled data: `mirror` is Mirror Image's imageDecoys), and each destroyed image's 1d4 color:
// that row's damage (and condition) on the attacker the GM targets.
const CHROMA_LEAD = /^You call forth (three|four|five) illusory images of yourself, and each of the [a-z]+ of you takes on a different color, your colors all shifting each time someone attacks you\.$/;
const CHROMA_HAS = /^This has the effects of @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}, except that whenever a foe destroys one of the images, roll \[\[\/r 1d(\d+)\]\](?:\{1d\d+\})? to see which color the image was when it was destroyed\.$/;
const CHROMA_TAKES = /^The attacker takes the corresponding effect\.$/;
const CHROMA_ROW = /^<strong>([A-Z][a-z]+)<\/strong>\s*((?:@Damage\[\d+\[[a-z]+\]\] damage(?: and |, )?)+)(?:, plus it's @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d))?\})?\.$/;
/** The referenced spell's uuid, or null (a cheap look before compiling it). */
export function chromaticReference(adapted) {
    const plain = htmlToPlainText(String(adapted.descriptionHTML ?? "").replace(/<ol>[\s\S]*<\/ol>/, "")).replace(/\s+/g, " ");
    return /This has the effects of @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]/.exec(plain)?.[1] ?? null;
}
/** Returns {imageDecoys, claimed} or null; `mirror` is the referenced spell's compiled imageDecoys. */
export function compileChromaticImage(adapted, mirror) {
    if (!mirror || adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const fixed = /^(\d+) (round|minute)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    if (!fixed || /<hr\b|Heightened/i.test(html) || Number(fixed[1]) * (fixed[2].toLowerCase() === "round" ? 6 : 60) !== mirror.durationSeconds) return null;
    const list = /<ol>([\s\S]*)<\/ol>/.exec(html);
    const sentences = htmlToPlainText(html.replace(/<ol>[\s\S]*<\/ol>/, "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const lead = CHROMA_LEAD.exec(sentences[0] ?? ""), has = CHROMA_HAS.exec(sentences[1] ?? "");
    if (!list || !lead || !has || !CHROMA_TAKES.test(sentences[2] ?? "") || sentences.length !== 3 || WORDS[lead[1].toLowerCase()] !== mirror.images) return null;
    const rows = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => CHROMA_ROW.exec(match[1].replace(/\s+/g, " ").trim()));
    if (rows.length !== Number(has[3]) || rows.some(row => !row)) return null;
    const colors = rows.map((row, index) => ({ face: index + 1, label: row[1], damage: [...row[2].matchAll(/@Damage\[(\d+)\[([a-z]+)\]\]/g)].map(match => `${match[1]}[${match[2]}]`),
        ...(row[3] ? { condition: { uuid: row[3], slug: row[4].toLowerCase(), value: row[5] ? Number(row[5]) : null } } : {}) }));
    return { imageDecoys: { ...structuredClone(mirror), colors: { die: Number(has[3]), rows: colors, sourceText: sentences[1] } },
        claimed: [...sentences, ...rows.map(row => htmlToPlainText(row[0]).trim())] };
}
