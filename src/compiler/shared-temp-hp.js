// Temporary Hit Points by the triggering spell's rank, shared with its allies (Community Restoration): "Trigger You Cast a Spell from a wizard spell
// slot, and the spell affects one or more willing allies without damaging them." / "When you use your magic to support your allies, shared strength
// bolsters you all." / "You gain 2 temporary Hit Points per rank of the triggering spell, and can grant an equal number divided as you choose among
// allies affected by the triggering spell." / "These temporary Hit Points last for 1 minute." — the triggering spell's rank (the caster's answer); the
// caster's temporary Hit Points; the same number divided among the targeted allies as the caster chooses; each an Effect for the stated time.
import { htmlToPlainText } from "./description-parser.js";

const TRIGGER = /^Trigger You Cast a Spell from an? [a-z ]+ spell slot, and the spell affects one or more willing allies without damaging them\.$/;
const GAIN = /^You gain (\d+) temporary Hit Points per rank of the triggering spell, and can grant an equal number divided as you choose among allies affected by the triggering spell\.$/;
const LAST = /^These temporary Hit Points last for (\d+) (minutes?|rounds?|hours?)\.$/;
const SECONDS = { minute: 60, round: 6, hour: 3600 };

/** {sharedTempHP, claimed} or null. */
export function compileSharedTempHP(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    const [trigger, body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const plain = html => htmlToPlainText(html ?? "").replace(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g, "").replace(/\s+/g, " ").trim();
    const sentences = plain(body).split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => GAIN.test(sentence));
    if (rest.length || !TRIGGER.test(plain(trigger)) || at < 0 || sentences.length !== at + 2 || at > 1 || (at === 1 && /\d|@|\b(?:damage|save|bonus|penalty|Hit Points)\b/.test(sentences[0]))) return null;
    const last = LAST.exec(sentences[at + 1]);
    if (!last) return null;
    return { sharedTempHP: { perRank: Number(GAIN.exec(sentences[at])[1]), seconds: Number(last[1]) * SECONDS[last[2].replace(/s$/, "")] }, claimed: [plain(trigger), ...sentences] };
}
