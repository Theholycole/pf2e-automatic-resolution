// A save whose rows depend on what the target is (Curse of Lost Time): "The effect depends on whether the target is an object, a construct, or a living
// creature. Artifacts, along with objects and constructs made of precious materials (as determined by the GM), are immune." with the list
//   "Object If the object is attended, its bearer can attempt a Fortitude save. If the bearer fails or the object is unattended, the object immediately takes
//   4d6 damage (applying Hardness normally) and the item is cursed with an unlimited duration. …" (the GM's: a reminder)
//   "Construct The construct takes 4d6 damage (basic Fortitude save). On a failure, for 1 hour the construct is Clumsy 1, is Enfeebled 1, and can't be
//   Repaired, … On a critical failure, these effects have an unlimited duration." — the basic save of the item's damage, its failing rows' conditions
//   "Living Creature The living creature must attempt a Fortitude save. Ageless creatures are immune." with rows (unaffected / Clumsy 1 and Enfeebled 1
//   for 1 round / as success, 1 hour / as success, unlimited) — a save of those rows
// Each creature mode is compiled as its own save plan; the card asks which the target is.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [/^You curse the target with rapid aging or erosion\.$/,
    /^The effect depends on whether the target is an object, a construct, or a living creature\.$/,
    /^Artifacts, along with objects and constructs made of precious materials \(as determined by the GM\), are immune\.$/];
const C = String.raw`(@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{(?:Clumsy|clumsy) 1\})`, E = String.raw`(@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{(?:Enfeebled|enfeebled) 1\})`;
const CONSTRUCT = new RegExp(String.raw`^The construct takes (\d+d\d+) damage \(basic (Fortitude) save\)\. On a failure, for 1 hour the construct is ${C}, is ${E}, and can't be (?:@UUID\[[^\]]+\]\{Repaired\}|Repaired), and the curse attempts to counteract any spell that would restore the construct's Hit Points\. On a critical failure, these effects have an unlimited duration\.$`);
const LIVING = /^The living creature must attempt a (Fortitude) save\. Ageless creatures are immune\.$/;
const OBJECT = /^If the object is attended, its bearer can attempt a Fortitude save\. If the bearer fails or the object is unattended, the object immediately takes (\d+d\d+) damage \(applying Hardness normally\) and the item is cursed with an unlimited duration\./;
const ROWS = { criticalSuccess: /^The living creature is unaffected\.$/, success: /^The living creature briefly ages, becoming clumsy 1 and enfeebled 1 for 1 round\.$/,
    failure: /^As success, with a duration of 1 hour\.$/, criticalFailure: /^As success, with an unlimited duration\.$/ };

/** {modes, reminders, sentences} or null. */
export function extractTargetKindModes(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || !/\bobject, construct, or living creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    const [body, list, ...heightened] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (lead.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(lead[index])) || !list) return null;
    const item = name => new RegExp(String.raw`<li>\s*<strong>\s*${name}\s*<\/strong>([\s\S]*?)(?=<li>\s*<strong>\s*(?:Object|Construct|Living Creature)\s*<\/strong>|<\/ul>\s*$)`, "i").exec(list)?.[1] ?? "";
    const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
    const object = plain(item("Object")), construct = CONSTRUCT.exec(plain(item("Construct")).replace(/\s+$/, ""));
    const livingHTML = item("Living Creature");
    const living = LIVING.exec(plain(livingHTML.split(/<ul>/i)[0]));
    const rows = Object.fromEntries([...livingHTML.matchAll(/<li>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/li>/gi)]
        .map(match => [{ "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[match[1]], plain(match[2])]));
    if (!OBJECT.test(object) || !construct || !living || Object.keys(ROWS).some(degree => !ROWS[degree].test(rows[degree] ?? ""))) return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== construct[1] || construct[2].toLowerCase() !== adapted.defense.statistic) return null;
    const [, clumsy, enfeebled] = [null, construct[3], construct[4]];
    const step = /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The damage increases by (\d+d\d+)\.\s*<\/p>$/.exec((heightened[0] ?? "").trim());
    if (heightened.length && !step) return null;
    const both = `${clumsy} and ${enfeebled}`;
    return {
        modes: [
            { key: "living", label: "Living creature", basic: false, damage: false,
                html: `<p>The target must attempt a Fortitude save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is ${both} for 1 round.</p>`
                    + `<p><strong>Failure</strong> The target is ${both} for 1 hour.</p><p><strong>Critical Failure</strong> The target is ${both} permanently.</p>` },
            { key: "construct", label: "Construct", basic: false, damage: true,
                html: `<p>The target must attempt a Fortitude save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target takes half damage.</p>`
                    + `<p><strong>Failure</strong> The target takes full damage and is ${both} for 1 hour.</p><p><strong>Critical Failure</strong> The target takes double damage and is ${both} permanently.</p>`
                    + (step ? `<hr />${heightened[0]}` : "") }],
        reminders: ["Choose the target's kind on the card: living creature or construct (ageless creatures are immune; so are constructs of precious materials and artifacts, as the GM determines).",
            `A construct that fails also can't be Repaired, and the curse tries to counteract any spell that would restore its Hit Points (for 1 hour, or unlimited on a critical failure).`,
            `An object (the GM's): if attended, its bearer attempts a Fortitude save; if the bearer fails or it's unattended, the object takes ${construct[1]} damage (Hardness applies) and is cursed indefinitely — shoddy, can't be Repaired, and the curse tries to counteract spells restoring its Hit Points; Cleanse Affliction can target it.`],
        sentences: [...lead, object, plain(item("Construct")), plain(livingHTML.split(/<ul>/i)[0]), ...Object.values(rows)]
    };
}
