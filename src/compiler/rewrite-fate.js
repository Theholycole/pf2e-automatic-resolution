// A target's initiative bonus and the caster's reaction to reroll its failed check (Rewrite Possibility): "… you can't have more than one rewrite possibility spell
// in effect at a time. Casting it again ends the previous casting. While rewrite possibility is in effect, the target gains a +1 status bonus to initiative rolls.
// In addition, you gain the following reaction." with "Rewrite Possibility [reaction] Trigger The target fails a check" / "Effect The target rolls again with a
// +2 status bonus and uses the higher result." — the target's Effect (the bonus) for the duration, a recast ending the caster's previous one; the card's reaction
// rerolls the target's latest failed check with PF2e's reroll (keeping the higher), the status bonus added to the new roll.
import { htmlToPlainText } from "./description-parser.js";

const RULES = {
    one: /^Due to the amount of information this spell requires you to process, you can't have more than one [a-z ]+ spell in effect at a time\.$/,
    recast: /^Casting it again ends the previous casting\.$/,
    bonus: /^While [a-z ]+ is in effect, the target gains a \+(\d) (status|circumstance) bonus to initiative rolls\.$/,
    gain: /^In addition, you gain the following reaction\.$/,
    trigger: /^Trigger The target fails a check$/,
    effect: /^Effect The target rolls again with a \+(\d) (status|circumstance) bonus and uses the higher result\.$/
};

/** {rewriteFate, claimed} or null. */
export function compileRewriteFate(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes) return null;
    const paragraphs = [...String(adapted.descriptionHTML ?? "").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    // (The reaction's own heading — its name and glyph — is its paragraph.)
    const heading = paragraphs.findIndex(paragraph => /^[A-Z][a-z]+(?: [A-Z][a-z]+)* r$/.test(paragraph));
    if (heading !== 1) return null;
    const sentences = [...paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z])/), ...paragraphs.slice(2)].filter(Boolean);
    const claimed = {};
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length) return null;
    return { rewriteFate: { seconds: Number(minutes[1]) * 60, initiative: { value: Number(claimed.bonus[1]), type: claimed.bonus[2] }, reroll: { value: Number(claimed.effect[1]), type: claimed.effect[2] },
            reaction: paragraphs[1].replace(/ r$/, "") },
        claimed: [paragraphs[1], ...sentences] };
}
