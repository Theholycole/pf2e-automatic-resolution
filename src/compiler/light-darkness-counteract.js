// Light and darkness counteracted where the spell passes or lands:
//   "If the light passes through an area of magical darkness or targets a creature affected by magical darkness, radiant
//    beam attempts to counteract the darkness. If you need to determine whether the light passes through an area of
//    darkness, draw a line between yourself and the target."
//   "If the globe overlaps with an area of magical darkness, moonburst attempts to counteract the darkness effect."
// Where the ray went or the globe landed, and which darkness (or light) that is, is the GM's to see. The sentences are
// taken out of the description and become a card reminder with a Counteract button (the caster's counteract check
// against the effect the GM names).

const NAME = String.raw`(?:<em>)?[A-Za-z' ]+(?:<\/em>)?(?:'s)?`;
const ALONG = new RegExp(String.raw`If the (ray|light|beam|line) passes through an area of magical (light|darkness) or targets a creature affected by magical \2, ${NAME} attempts to counteract the \2\.(?:\s*If you need to determine whether the \1 passes through an area of \2, draw a line between yourself and the (?:spell's )?target\.)?`, "g");
const OVERLAP = new RegExp(String.raw`If the (globe|burst|cloud) overlaps with an area of magical (light|darkness)(?: or affects a creature affected by magical \2)?, ${NAME} attempts to counteract the \2(?: effect)?\.`, "g");

const plain = html => String(html).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** The description without these sentences, and their reminders; null when there are none. */
export function extractLightDarknessCounteract(html) {
    const reminders = [];
    let rest = String(html ?? "");
    // Heightened entries aren't touched.
    const heightening = rest.search(/<strong>\s*Heightened\b/i);
    let body = heightening >= 0 ? rest.slice(0, heightening) : rest;
    const tail = heightening >= 0 ? rest.slice(heightening) : "";
    for (const [pattern, kind] of [[ALONG, "counteract-along-path"], [OVERLAP, "counteract-overlap"]]) {
        body = body.replace(pattern, (sentence, _shape, target) => {
            reminders.push({ kind, target: target.toLowerCase(), text: plain(sentence) });
            return "";
        });
    }
    if (!reminders.length) return null;
    // One reminder per spell: two different light/darkness rules aren't read.
    if (reminders.length > 1) return { blocked: "several-counteract-sentences" };
    body = body.replace(/<p>\s*<\/p>/g, "").replace(/\s+(<\/p>)/g, "$1");
    return { html: body + tail, reminders };
}
