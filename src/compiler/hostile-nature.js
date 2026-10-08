// Nature turned against the targets (Nature's Enmity): "Animals, plants, and fungi in the area turn against the targets. Each target suffers from the
// following effects as long as it remains in the area." with the list "Vegetation … giving each target a –10-foot circumstance penalty to its Speed any
// time it's adjacent to the plants and fungi." / "Aggressive animals attack unpredictably. At the start of its turn, each target rolls a DC 8 flat check.
// On a failure, it's attacked by creatures that deal 2d10 slashing damage. The target attempts a basic Reflex save and is Off-Guard for 1 round on any
// outcome other than a critical success." / "The target … must succeed at a DC 5 flat check when casting any primal spell or the spell fails.
// Furthermore, animal, fungus, and plant creatures become hostile to it …" and "The GM might decide that you can't subject some creatures …": a card's
// Effect on each target (up to the stated count) for the spell's time — the Speed penalty as PF2e's rule, the turn-start flat check, basic save, damage
// and Off-Guard the module's, the rest notes (and leaving the area the GM's: remove the Effect).
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(String(html ?? "")).replace(/\s+/g, " ").trim();
const INTRO = [/^Animals, plants, and fungi in the area turn against the targets\.$/, /^Each target suffers from the following effects as long as it remains in the area\.$/];
const SPEED = /^Vegetation springs up from every surface, giving each target a [-–−](\d+)-foot (circumstance|status) penalty to its Speed any time it's adjacent to the plants and fungi\.$/;
const ATTACK = [/^Aggressive animals attack unpredictably\.$/, /^At the start of its turn, each target rolls a @Check\[flat\|dc:(\d+)\]\.$/,
    /^On a failure, it's attacked by creatures that deal @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage\.$/,
    /^The target attempts a basic (Fortitude|Reflex|Will) save and is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Off-Guard\} for (\d+) rounds? on any outcome other than a critical success\.$/];
const NATURE = [/^The target loses any connection to nature or natural creatures\.$/, /^The target must succeed at a @Check\[flat\|dc:(\d+)\] when casting any primal spell or the spell fails\.$/,
    /^Furthermore, animal, fungus, and plant creatures become hostile to it, even one with a strong bond to the target, such as an animal companion\.$/];
const GM = /^The GM might decide that you can't subject some creatures, such as an emissary of a nature deity, to the ire of nature\.$/;
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);

/** {count, part, notes, sentences} or null. */
export function extractHostileNature(adapted) {
    const count = /^up to (\d+) creatures$/.exec(String(adapted.targeting?.target ?? "").trim());
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!count || !minutes || adapted.lifecycle?.sustained || adapted.defense?.kind !== "save" || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const shape = /^<p>([\s\S]*?)<\/p>\s*<ul>\s*<li>([\s\S]*?)<\/li>\s*<li>([\s\S]*?)<\/li>\s*<li>([\s\S]*?)<\/li>\s*<\/ul>\s*<p>([\s\S]*?)<\/p>$/.exec(html.trim());
    if (!shape) return null;
    const intro = split(plain(shape[1])), speed = plain(shape[2]), attack = split(shape[3].replace(/\s+/g, " ").trim()), nature = split(shape[4].replace(/<\/?p>/g, "").replace(/\s+/g, " ").trim());
    if (intro.length !== 2 || INTRO.some((pattern, index) => !pattern.test(intro[index])) || !SPEED.test(speed) || attack.length !== 4 || nature.length !== 3 || !GM.test(plain(shape[5]))) return null;
    const a = ATTACK.map((pattern, index) => pattern.exec(attack[index])), n = NATURE.map((pattern, index) => pattern.exec(nature[index]));
    if (a.some(hit => !hit) || n.some(hit => !hit) || a[3][1].toLowerCase() !== adapted.defense.statistic) return null;
    const [, penalty, type] = SPEED.exec(speed);
    const plainAttack = attack.map(plain), plainNature = nature.map(plain);
    return {
        count: Number(count[1]),
        part: { label: "Nature's ire", sourceText: [speed, ...plainAttack].join(" "),
            text: `While it remains in the area: a –${penalty}-foot ${type} penalty to its Speed whenever it's next to the plants and fungi (which spring from every surface); as its turn starts, a DC ${a[1][1]} flat check, and on a failure animals attack (${a[2][1]} ${a[2][2]}, basic ${a[3][1]} save, Off-Guard for ${a[3][3]} round unless it critically succeeds); a DC ${n[1][1]} flat check to cast a primal spell, or it fails; animal, fungus and plant creatures are hostile to it (even its companion). Remove this if it leaves the area.`,
            rules: [{ key: "FlatModifier", selector: "all-speeds", type, value: -Number(penalty) }],
            turnStartAttack: { flat: Number(a[1][1]), formula: a[2][1], type: a[2][2], statistic: a[3][1].toLowerCase(), offGuard: { uuid: a[3][2], rounds: Number(a[3][3]) } },
            duration: { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: "as long as it remains in the area" } },
        notes: [plain(shape[5])],
        sentences: [...intro, speed, ...plainAttack, ...plainNature, plain(shape[5])]
    };
}
