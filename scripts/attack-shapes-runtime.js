// Attacks with their own shape (attack-shapes.js), on the map:
//   - the caster's spell attack against a creature's AC or one of its save DCs (the GM's ruling on the degree may replace the roll);
//   - lines from the caster to each target (Pierce the Sky's hazardous terrain), one region of thin rectangles;
//   - the space beside a creature nearest the caster (Comet Charge's flight);
//   - "When a marked creature is reduced to 0 Hit Points, all other marked creatures become Off-Guard and Clumsy 1 for 1 round." (Doom Mark).
import { ONGOING_FLAG } from "./ongoing-core.js";
import { destinationProblem } from "./teleport-runtime.js";
import { DEGREES, MODULE_ID, docOf } from "./runtime-utils.js";

const centre = doc => ({ x: doc.x + (Number(doc.width) || 1) * canvas.grid.size / 2, y: doc.y + (Number(doc.height) || 1) * canvas.grid.size / 2 });

/** The caster's spell attack: against the defender's AC (PF2e's own attack roll), or against one of its save DCs ("against the Fortitude DC"). */
export async function spellAttack(spell, defender, { against = "ac", degree = null, label = "" } = {}) {
    if (degree) {
        if (!DEGREES.includes(degree)) throw new Error(`${spell.name}: ${degree} isn't a degree of success.`);
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: spell.actor }), content: `<p><strong>${foundry.utils.escapeHTML(spell.name)}</strong>${label ? ` (${foundry.utils.escapeHTML(label)})` : ""}: the GM rules the spell attack against ${foundry.utils.escapeHTML(defender.name)} a ${degree.replace(/([A-Z])/g, " $1").toLowerCase()}.</p>` }); } catch (_) {}
        return { degree, total: null };
    }
    if (against === "ac") {
        const roll = await spell.rollAttack(null, 1, { target: defender, skipDialog: true });
        const value = Number(roll?.options?.degreeOfSuccess ?? roll?.degreeOfSuccess ?? -1);
        if (value < 0) throw new Error(`${spell.name}: the spell attack against ${defender.name} returned no degree of success.`);
        return { degree: DEGREES[value], total: roll.total };
    }
    const dc = Number(defender.saves?.[against]?.dc?.value ?? NaN);
    const statistic = spell.spellcasting?.statistic;
    if (!Number.isFinite(dc) || !statistic?.check?.roll) throw new Error(`${spell.name}: the attack against ${defender.name}'s ${against} DC can't be rolled.`);
    const roll = await statistic.check.roll({ dc: { value: dc }, item: spell, traits: [...new Set([...(spell.traits ?? []), "attack"])], extraRollOptions: ["attack", "item:trait:attack"], skipDialog: true });
    const value = Number(roll?.degreeOfSuccess ?? -1);
    if (value < 0) throw new Error(`${spell.name}: the spell attack against ${defender.name} wasn't rolled.`);
    return { degree: DEGREES[value], total: roll.total };
}

/** One region of 5-foot-wide lines from the caster's token to each target token. */
export async function linesRegion(scene, from, targets, name, feet = 5) {
    const width = feet / (scene.grid.distance || 5) * scene.grid.size;
    const start = centre(docOf(from));
    const shapes = targets.map(token => {
        const end = centre(docOf(token));
        const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
        const nx = -(end.y - start.y) / length * width / 2, ny = (end.x - start.x) / length * width / 2;
        return { type: "polygon", hole: false, points: [start.x + nx, start.y + ny, end.x + nx, end.y + ny, end.x - nx, end.y - ny, start.x - nx, start.y - ny].map(Math.round) };
    });
    const [region] = await scene.createEmbeddedDocuments("Region", [{ name, color: "#88aaff", shapes }]);
    return region;
}

/** The free space adjacent to the target nearest the token's place, within the feet of it (or null). */
export function nearestSpaceBeside(target, token, feet) {
    const anchor = docOf(target), doc = docOf(token), size = canvas.grid.size;
    const w = Number(doc.width) || 1, h = Number(doc.height) || 1, aw = Number(anchor.width) || 1, ah = Number(anchor.height) || 1;
    const spaces = [];
    for (let dy = -h; dy <= ah; dy++) for (let dx = -w; dx <= aw; dx++) {
        const touching = dx === -w || dx === aw || dy === -h || dy === ah;
        if (!touching) continue;
        const at = { x: anchor.x + dx * size, y: anchor.y + dy * size };
        if (at.x === doc.x && at.y === doc.y) return at;
        if (!destinationProblem(doc, at, { origin: doc, within: feet, ignore: [doc.id] })) spaces.push(at);
    }
    return spaces.sort((a, b) => Math.hypot(a.x - doc.x, a.y - doc.y) - Math.hypot(b.x - doc.x, b.y - doc.y))[0] ?? null;
}

/** A marked creature at 0 Hit Points: the other creatures the same card's record marks get the stated conditions for the stated rounds. */
export async function markedAtZero(ongoing, actor) {
    for (const journal of ongoing.records()) {
        const record = journal.getFlag(MODULE_ID, ONGOING_FLAG);
        if (record?.status !== "active" || !record.markTrigger) continue;
        const marked = entry => entry.status === "active" && !entry.permanent;
        if (!record.entries.some(entry => marked(entry) && entry.actorUuid === actor.uuid)) continue;
        const others = [...new Set(record.entries.filter(entry => marked(entry) && entry.actorUuid !== actor.uuid).map(entry => entry.actorUuid))];
        const trigger = record.markTrigger;
        for (const uuid of others) {
            const other = await fromUuid(uuid);
            if (!other || Number(other.hitPoints?.value ?? 1) <= 0) continue;
            await other.createEmbeddedDocuments("Item", [{ name: `${record.name}: ${actor.name} fell`, type: "effect", img: "icons/svg/skull.svg",
                flags: { [MODULE_ID]: { markPayoff: { castId: record.castId, fallenUuid: actor.uuid } } },
                system: { duration: { value: trigger.rounds, unit: "rounds", expiry: "turn-start", sustained: false }, start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                    tokenIcon: { show: true }, description: { value: `<p>${foundry.utils.escapeHTML(trigger.sourceText ?? "")}</p>` },
                    rules: trigger.conditions.map(entry => ({ key: "GrantItem", uuid: entry.uuid, onDeleteActions: { grantee: "restrict" },
                        ...(entry.value ? { alterations: [{ mode: "override", property: "badge-value", value: entry.value }] } : {}) })) } }]);
        }
    }
}
