// An area the caster picks from a list: "Area @Template[burst|distance:10], @Template[cone|distance:30], or
// @Template[line|distance:60]" with "… in one of the various listed shapes of your choosing, …". The caster places the
// chosen shape and targets the creatures in it, as with any area save; the card lists the choices.
const TEMPLATE = /@Template\[(burst|cone|line|emanation)\|distance:(\d+)\](?:\{[^}]*\})?/g;
const AREA_PARAGRAPH = /^\s*<p>\s*<strong>\s*Area\s*<\/strong>\s*((?:@Template\[[^\]]+\](?:\{[^}]*\})?(?:,\s*|,?\s*or\s*)?)+)\s*<\/p>\s*(?:<hr\s*\/?>\s*)?/i;
const CHOOSING = / in one of the various listed shapes of your choosing(?=,)/;

// Or in the text: "Choose whether the spell's area is a 15-foot emanation or a 15-foot cone when you cast it." (Localized Quake), with no item area.
const CHOOSE_WHETHER = /\s*Choose whether the spell's area is an? (\d+)-foot (burst|cone|line|emanation) or an? (\d+)-foot (burst|cone|line|emanation) when you cast it\./;

export function extractAreaChoice(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const whether = !adapted.targeting?.area ? CHOOSE_WHETHER.exec(html) : null;
    if (whether) {
        const shapes = [{ shape: whether[2], distance: Number(whether[1]) }, { shape: whether[4], distance: Number(whether[3]) }];
        const list = shapes.map(({ shape, distance }) => `a ${distance}-foot ${shape}`);
        return { html: html.replace(whether[0], ""), reminder: { kind: "area-choice", text: `Area: the caster chooses ${list.join(" or ")}. Place it and target the creatures in it.` }, shapes };
    }
    const area = AREA_PARAGRAPH.exec(html);
    if (!area) return null;
    if (adapted.targeting?.area || !CHOOSING.test(html)) return { blocked: "area-choice-wording" };
    const shapes = [...area[1].matchAll(TEMPLATE)].map(match => ({ shape: match[1], distance: Number(match[2]) }));
    if (shapes.length < 2 || area[1].replace(TEMPLATE, "").replace(/,|\bor\b|\s/g, "") !== "") return { blocked: "area-choice-wording" };
    // "30 feet (burst only)": how far away a burst can be placed.
    const burstRange = /^(\d+) feet \(burst only\)$/.exec(String(adapted.targeting?.range ?? "").trim());
    const label = ({ shape, distance }) => `a ${distance}-foot ${shape}${shape === "burst" && burstRange ? ` within ${burstRange[1]} feet` : ""}`;
    const list = shapes.map(label);
    const text = `Area: the caster chooses ${list.slice(0, -1).join(", ")} or ${list.at(-1)}. Place it and target the creatures in it.`;
    return { html: html.replace(AREA_PARAGRAPH, "").replace(CHOOSING, ""), reminder: { kind: "area-choice", text }, shapes };
}
