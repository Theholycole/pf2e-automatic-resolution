// A shifting swarm form (Tian Xia+'s Chorus Made Manifest; user decision 2026-10-01: a battle form PF2e has no Effect for is generated from the text): "For 1 minute,
// you gain the ability to shift form from your current form to a battle form that resembles a chiliad flock of birds … You can assume this form as part of casting
// this spell and you can alternate between your normal form and your battle form as a single action with the concentrate trait for the duration. While in this form,
// you gain the animal and swarm traits. You don't gain the swarm mind ability, so you are still affected normally by mental effects. You can Dismiss the spell." with
// the list "You gain resistance 8 to physical damage and a weakness 8 to area and splash damage." / "You can fit into spaces only a few inches wide …" / "Low-light
// vision and a fly Speed of 60 feet." / "You gain a Choral Swarm Attack which deals 4d6 sonic damage with a basic Fortitude save to all creatures in a 15- foot cone
// which you can use a single action. Creatures that critically fail their Fortitude save are also deafened for 1 round. You cannot make Strikes while in this form.":
// the caster's Effect for the minute, the form's rules behind its toggle (switched as the form is taken or left); the Choral Swarm Attack the card's option — its own
// basic save in the cone; the narrow spaces, no Strikes and Dismiss the Effect's notes.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [/^For (\d+) minutes?, you gain the ability to shift form from your current form to a battle form that resembles [^.]+\.$/,
    /^You can assume this form as part of casting this spell and you can alternate between your normal form and your battle form as a single action with the concentrate trait for the duration\.$/,
    /^While in this form, you gain the ([a-z]+) and ([a-z]+) traits\.$/,
    /^You don['’]t gain the swarm mind ability, so you are still affected normally by mental effects\.$/,
    /^You can Dismiss the spell\.$/];
const RESIST = /^You gain resistance (\d+) to physical damage and a weakness (\d+) to area and splash damage\.$/;
const SPACES = /^You can fit into spaces only a few inches wide, moving your birds through the gap\.$/;
const SENSES = /^Low-light vision and a fly Speed of (\d+) feet\.$/;
const ATTACK = /^You gain a ([A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+) which deals (\d+)d(\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save to all creatures in a (\d+)- ?foot cone which you can use a single action\. Creatures that critically fail their \5 save are also deafened for (\d+) rounds?\. (You cannot make Strikes while in this form\.)$/;

/** {form, attackSpell, sentences} or null. */
export function extractSwarmForm(item) {
    if (!(item?.system?.traits?.value ?? []).includes("polymorph") || item.system?.defense?.save || Object.keys(item.system?.damage ?? {}).length || String(item.system?.target?.value ?? "").trim()) return null;
    const html = String(item.system?.description?.value ?? "");
    const list = /<ul>([\s\S]*?)<\/ul>/i.exec(html);
    if (!list || /<hr\s*\/?>/i.test(html)) return null;
    const paragraphs = [...html.slice(0, list.index).matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const items = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2 || paragraphs[1] !== "You gain the following statistics and abilities:" || lead.length !== 6 || /\d|\bdamage\b/.test(lead[0])
        || LEAD.some((re, index) => !re.test(lead[index + 1])) || items.length !== 4) return null;
    const minutes = Number(LEAD[0].exec(lead[1])[1]), traits = LEAD[2].exec(lead[3]).slice(1, 3);
    const resist = RESIST.exec(items[0]), senses = SENSES.exec(items[2]), attack = ATTACK.exec(items[3]);
    if (!resist || !SPACES.test(items[1]) || !senses || !attack || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) || minutes !== 1) return null;
    const on = ["chorus-form"];
    return {
        form: { recipient: "self", seconds: minutes * 60,
            toggle: { option: on[0], label: "In the battle form" },
            rules: [{ key: "ActorTraits", add: traits, predicate: on }, { key: "Resistance", type: "physical", value: Number(resist[1]), predicate: on },
                { key: "Weakness", type: "area-damage", value: Number(resist[2]), predicate: on }, { key: "Weakness", type: "splash-damage", value: Number(resist[2]), predicate: on },
                { key: "Sense", selector: "low-light-vision", predicate: on }, { key: "BaseSpeed", selector: "fly", value: Number(senses[1]), predicate: on }],
            notes: [lead[2], lead[4], lead[5], items[1], attack[8]] },
        attack: { name: attack[1], formula: `${attack[2]}d${attack[3]}`, type: attack[4], statistic: attack[5].toLowerCase(), cone: Number(attack[6]), rounds: Number(attack[7]) },
        sentences: [...lead.slice(1), ...items]
    };
}
