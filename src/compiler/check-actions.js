// Note-only spells whose rule is a check or action the module rolls or runs (Dim the Light, Omnidirectional Scan, Reed Whistle, Darkened Forest
// Form).
import { plainText as plain, splitSentences as split } from "./description-parser.js";

const LINK = name => `(?:@UUID\\[[^\\]]+\\]\\{${name}\\}|${name})`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|immune|can't|must|checks?|DC|Hit Points|Strikes?)\b/i;

// Dim the Light: "You can immediately attempt a Stealth check to Hide, and you can become Hidden to a creature even if you don't have cover and
// aren't otherwise concealed from that creature. You cease being hidden at the end of your turn unless you move into cover or become Concealed
// before then." — PF2e's Stealth check with the Hide option against each foe's Perception DC (no cover needed); Hidden (when it meets every
// DC) ends at the end of the caster's turn unless the GM keeps it (cover or concealment then).
const HIDE_NOW = new RegExp(`^You can immediately attempt a Stealth check to ${LINK("Hide")}, and you can become ${LINK("Hidden")} to a creature even if you don't have cover and aren't otherwise concealed from that creature\\.$`);
const HIDE_ENDS = new RegExp(`^You cease being hidden at the end of your turn unless you move into cover or become ${LINK("Concealed")} before then\\.$`);
export function compileHideReaction(adapted) {
    if (!/^reaction$/i.test(String(adapted.activation?.time ?? "").trim()) || String(adapted.targeting?.target ?? "").trim() || String(adapted.lifecycle?.duration ?? "").trim()) return null;
    const [trigger, body, ...extra] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body ?? ""));
    const at = sentences.findIndex(sentence => HIDE_NOW.test(sentence));
    if (extra.length || !/^Trigger /.test(plain(trigger ?? "")) || at < 0 || !HIDE_ENDS.test(sentences[at + 1] ?? "") || sentences.length !== at + 2 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    return { hideReaction: { noCoverNeeded: true, endsAtTurnEnd: true, trigger: plain(trigger).replace(/^Trigger /, ""), keepNote: "The caster stays Hidden past the end of the turn only in cover or concealed." },
        claimed: [plain(trigger), ...sentences] };
}

// Omnidirectional Scan: "… target one ally and one enemy in the area … You prepare to Aid the target ally on an attack roll against the target
// enemy. If you take this Aid reaction, you use your spell attack modifier and proficiency rank on your check to Aid. If you critically fail the
// roll to Aid, you get a failure instead." — the Aid check with the caster's spell attack against the Aid DC (15), a critical failure a failure;
// the ally's next attack roll against that enemy until the caster's next turn gets the result (+2/+3/+4 by the spell attack's rank, +1). The
// optional Seek of the emanation is PF2e's own action.
const AID = new RegExp(`^You prepare to ${LINK("Aid")} the target ally on an attack roll against the target enemy\\.$`);
const AID_SPELL = /^If you take this Aid reaction, you use your spell attack modifier and proficiency rank on your check to Aid\.$/;
const AID_FLOOR = /^If you critically fail the roll to Aid, you get a failure instead\.$/;
export function compileAidAttack(adapted) {
    if (!/^1 ally and 1 enemy$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area?.type !== "emanation") return null;
    if (!/^until the start of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const at = sentences.findIndex(sentence => AID.test(sentence));
    if (rest.length || at < 0 || !AID_SPELL.test(sentences[at + 1] ?? "") || !AID_FLOOR.test(sentences[at + 2] ?? "") || sentences.length !== at + 3) return null;
    const before = sentences.slice(0, at);
    const seek = before.some(sentence => /^You can choose to \[\[\/act seek\]\] the entire emanation of the spell\.$/.test(sentence));
    const flat = before.some(sentence => /you automatically succeed at the flat check to target it with this spell\.$/.test(sentence));
    if (before.some(sentence => !/\[\[\/act seek\]\]|flat check to target it|^You quickly view/.test(sentence))) return null;
    return { aidAttack: { radius: Number(adapted.targeting.area.value), statistic: "spell-attack", dc: 15, critFailToFailure: true, until: "start-of-next-turn",
        notes: [...(seek ? ["You can Seek the whole emanation (PF2e's Seek)."] : []), ...(flat ? ["You automatically succeed at the flat check to target a concealed or hidden target."] : [])] }, claimed: sentences };
}

// Reed Whistle: "As a reaction, you can reduce the spell's remaining duration by 1 hour to Point Out a creature you detect as you sharply whistle
// through the reed. You and your allies also gain a +2 circumstance bonus to Perception checks to Seek the creature for [[/r 1d4 #rounds]]{1d4
// rounds}." with "Heightened (3rd) The spell's duration becomes 4 hours." — the caster's Effect for the hours; its Whistle (the targeted
// creature) takes an hour off it (ending it at none) and gives the caster and allies +2 circumstance to Seek for 1d4 rounds. Point Out is a note.
const WHISTLE = new RegExp(`^As a reaction, you can reduce the spell's remaining duration by (\\d+) hours? to ${LINK("Point Out")} a creature you detect as you sharply whistle through the [a-z]+\\.$`);
const WHISTLE_SEEK = new RegExp(`^You and your allies also gain a \\+(\\d) (circumstance) bonus to Perception checks to ${LINK("Seek")} the creature for \\[\\[\\/r (\\d+d\\d+) #rounds\\]\\]\\{\\d+d\\d+ rounds\\}\\.$`);
export function compileSeekWhistle(adapted) {
    const hours = /^(\d+) hours? or until expended$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!hours || String(adapted.targeting?.target ?? "").trim()) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const at = sentences.findIndex(sentence => WHISTLE.test(sentence));
    const seek = WHISTLE_SEEK.exec(sentences[at + 1] ?? "");
    if (at < 0 || !seek || sentences.length !== at + 2 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const steps = [];
    for (const section of rest.flatMap(section => section.split(/(?=<p>\s*<strong>\s*Heightened)/)).filter(section => plain(section))) {
        const step = /^Heightened \((\d+)(?:st|nd|rd|th)\) The spell's duration becomes (\d+) hours\.$/.exec(plain(section));
        if (!step) return null;
        steps.push({ minRank: Number(step[1]), hours: Number(step[2]) });
    }
    return { seekWhistle: { hours: Number(hours[1]), steps, costHours: Number(WHISTLE.exec(sentences[at])[1]), bonus: { type: seek[2], value: Number(seek[1]) }, rounds: seek[3],
        notes: ["Point Out: the creature is hidden (not undetected) to your allies who can see or hear you."] }, claimed: [...sentences, ...rest.map(plain)] };
}

// Darkened Forest Form: "You can polymorph into any form listed in Pest Form. When you transform into a form granted by a spell, you gain all the
// effects of the form you chose from a version of the spell heightened to darkened forest form's rank. Each time you Sustain this Spell, you can
// choose to change to a different shape …" with "Heightened (2nd) You can also transform into the forms listed in Animal Form." — the caster picks
// a form spell available at the rank, and the module resolves that spell at this rank (its PF2e form); the form lasts this spell's (sustained)
// duration. Changing shape on a Sustain is casting again.
const FORM_ANY = /^You can polymorph into any form listed in @UUID\[(Compendium\.[^\]]+\.Item\.[^\]]+)\]\{([^}]+)\}\.$/;
const FORM_RANK = /^When you transform into a form granted by a spell, you gain all the effects of the form you chose from a version of the spell heightened to [a-z ]+'s rank\.$/;
const FORM_SUSTAIN = /^Each time you Sustain this Spell, you can choose to change to a different shape from those available via any of the associated spells\.$/;
export function compileFormChoice(adapted) {
    const raw = String(adapted.lifecycle?.duration ?? "").trim();
    const minutes = /^(?:sustained up to )?(\d+) minutes?$/i.exec(raw);
    if (!minutes || !(adapted.lifecycle?.sustained === true || /^sustained/i.test(raw)) || String(adapted.targeting?.target ?? "").trim()) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const at = sentences.findIndex(sentence => FORM_ANY.test(sentence));
    if (at < 0 || !FORM_RANK.test(sentences[at + 1] ?? "") || !FORM_SUSTAIN.test(sentences[at + 2] ?? "") || sentences.length !== at + 3 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const [, uuid, name] = FORM_ANY.exec(sentences[at]);
    const forms = [{ minRank: Number(adapted.rank ?? 1), uuid, name }];
    for (const section of rest.flatMap(section => section.split(/(?=<p>\s*<strong>\s*Heightened)/)).filter(section => plain(section))) {
        const step = /^Heightened \((\d+)(?:st|nd|rd|th)\) You can also transform into the forms listed in @UUID\[(Compendium\.[^\]]+\.Item\.[^\]]+)\]\{([^}]+)\}\.$/.exec(plain(section));
        if (!step) return null;
        forms.push({ minRank: Number(step[1]), uuid: step[2], name: step[3] });
    }
    return { formChoice: { forms, seconds: Number(minutes[1]) * 60, sustained: true, notes: [sentences[at + 2]] }, claimed: [...sentences, ...rest.map(plain)] };
}
