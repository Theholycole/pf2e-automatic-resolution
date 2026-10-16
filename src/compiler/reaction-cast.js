// A spell also cast as a reaction (The Night is Mine, PF2e 8.6): "<p>[1] or [R]</p>" before the text and "If a creature within range attempts to
// {Hide}, you can cast this spell targeting them as a reaction." in it — PF2e casts it with its one action either way. The spell is compiled without
// the two; the reaction is the caster's reminder on the card (who may cast it then is the table's call).

const GLYPHS = /^\s*<p>\s*<span class="action-glyph">([123])<\/span>\s*or\s*<span class="action-glyph">R<\/span>\s*<\/p>\s*/i;
const REACTION = /\s*If an? (creature|enemy) within range (attempts to|tries to|uses) (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{([A-Z][A-Za-z ]+)\}|([A-Z][A-Za-z ]+)), you can cast this spell targeting (?:them|it) as a reaction\./;

/** {html, reminder, sourceText} or null. */
export function extractReactionCast(item) {
    const html = String(item?.system?.description?.value ?? "");
    const glyphs = GLYPHS.exec(html);
    if (!glyphs || String(item?.system?.time?.value ?? "").trim() !== glyphs[1]) return null;
    const rest = html.slice(glyphs[0].length);
    const body = rest.split(/<hr\s*\/?>/i)[0];
    const reaction = REACTION.exec(body);
    if (!reaction) return null;
    const action = reaction[3] ?? reaction[4];
    const sourceText = reaction[0].trim().replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    return {
        html: rest.replace(reaction[0], ""),
        reminder: { kind: "reaction-cast", text: `Also cast as a reaction: when a ${reaction[1]} within range ${reaction[2]} ${action}, the caster can cast it targeting that ${reaction[1]}.`, sourceText },
        sourceText
    };
}
