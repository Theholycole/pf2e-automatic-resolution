// A warding circle around a touched creature against a chosen alignment (Circle of Protection): "You ward a creature and those nearby against a specified
// alignment. Choose chaotic, evil, good, or lawful; this spell gains the opposing trait. Creatures in the area gain a +1 status bonus to AC against attacks by
// creatures of the chosen alignment and to saves against effects from such creatures. This bonus increases to +3 against effects from such creatures that
// directly control the target and attacks made by summoned creatures of the chosen alignment. Summoned creatures of the chosen alignment can't willingly enter
// the area without succeeding at a Will save; repeated attempts use the first save result." with "Heightened (4th) The duration increases to 1 hour." and
// PF2e's Effect (an unconditional +1 to AC and saves — more than the text) — an aura around the touched creature for the duration (Ongoing's target aura),
// every creature inside holding the module's Effect: toggles for "against a creature of the chosen alignment" (+1) and "against its controlling effect, or a
// summoned one's attack" (+3); the summoned creatures' Will save is the GM's note.
import { htmlToPlainText } from "./description-parser.js";

const S = [/^You ward a creature and those nearby against a specified alignment\.$/,
    /^Choose (chaotic), (evil), (good), or (lawful); this spell gains the opposing trait\.$/,
    /^Creatures in the area gain a \+(\d) status bonus to AC against attacks by creatures of the chosen alignment and to saves against effects from such creatures\.$/,
    /^This bonus increases to \+(\d) against effects from such creatures that directly control the target and attacks made by summoned creatures of the chosen alignment\.$/,
    /^Summoned creatures of the chosen alignment can't willingly enter the area without succeeding at a (Will) save; repeated attempts use the first save result\.$/];
const STEP = /^Heightened \((\d)th\) The duration increases to (\d+) (hour|minute)s?\.$/;

/** {protectionCircle, claimed} or null. */
export function compileProtectionCircle(adapted) {
    const area = adapted.targeting?.area;
    if ((adapted.defense?.kind ?? "none") !== "none" || area?.type !== "emanation" || !/^touch$/i.test(String(adapted.targeting?.range ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const tail = [...rest.join(" ").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const step = tail.map(text => STEP.exec(text)).find(Boolean);
    if (!minutes || sentences.length !== S.length || S.some((pattern, index) => !pattern.test(sentences[index])) || !step || tail.some(text => !STEP.test(text) && !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(text))) return null;
    const choices = S[1].exec(sentences[1]).slice(1, 5), low = Number(S[2].exec(sentences[2])[1]), high = Number(S[3].exec(sentences[3])[1]);
    return { protectionCircle: { radius: Number(area.value), seconds: Number(minutes[1]) * 60, heightened: { rank: Number(step[1]), seconds: Number(step[2]) * (step[3] === "hour" ? 3600 : 60) }, choices,
        low, high, note: `${sentences[4].replace("the chosen alignment", "that alignment")} (The GM rolls it when one tries to enter.)` }, claimed: [...sentences, ...tail] };
}

/** The member Effect's rules for the chosen alignment. */
export function circleMember(data, alignment) {
    const low = "circle-of-protection:aligned", high = "circle-of-protection:controlling";
    return { name: `Protected against ${alignment}`, text: `+${data.low} status to AC against attacks by ${alignment} creatures and to saves against their effects (switch it on); +${data.high} against their effects directly controlling you and attacks by summoned ${alignment} creatures (switch that on instead).`,
        rules: [{ key: "RollOption", domain: "all", option: low, toggleable: true, label: `Against a ${alignment} creature's attack or effect`, value: false },
            { key: "RollOption", domain: "all", option: high, toggleable: true, label: `Against a ${alignment} creature's controlling effect, or a summoned ${alignment} creature's attack`, value: false },
            // (Each its own slug: two modifiers from one Effect would otherwise share one and the later replace the earlier.)
            { key: "FlatModifier", slug: "circle-of-protection-aligned", selector: ["ac", "saving-throw"], type: "status", value: data.low, predicate: [low] },
            { key: "FlatModifier", slug: "circle-of-protection-controlling", selector: ["ac", "saving-throw"], type: "status", value: data.high, predicate: [high] }] };
}
