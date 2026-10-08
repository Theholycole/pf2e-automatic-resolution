// The caster's option for the terrain in a damaging area: "You can also direct the blight to rot all Small and Tiny non-creature plants
// in the area, eliminating non-magical undergrowth and any resulting difficult terrain, cover, and concealment." optionally followed by
// "<Spell> attempts to counteract any magical effect on the plants before withering them." The module resolves creatures; the terrain
// is the GM's. The sentences leave the description and become a card reminder.
import { stripTags as plain } from "./text-patterns.js";

const OPTION = /You can also direct the [a-z]+ to [a-z]+ all [A-Za-z ,]+ non-creature plants in the area, eliminating [^.<@\d]+\.(?:\s*(?:<em>)?[A-Za-z' ]+(?:<\/em>)? attempts to counteract any magical effect on the plants before withering them\.)?/;

/** {html, text, sourceText} without the option's sentences, or null. */
export function extractTerrainOption(html) {
    const source = String(html ?? "");
    const heightening = source.search(/<strong>\s*Heightened\b/i);
    const body = heightening >= 0 ? source.slice(0, heightening) : source;
    const match = OPTION.exec(body);
    if (!match || OPTION.test(body.replace(match[0], ""))) return null;
    const text = plain(match[0]);
    return { html: body.replace(match[0], "").replace(/\s+(<\/p>)/g, "$1") + (heightening >= 0 ? source.slice(heightening) : ""), text, sourceText: text };
}
