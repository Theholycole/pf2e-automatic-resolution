// Thralls as tokens, by the thrall rules (the user's, from the thrall trait, 2026-10-03): "A thrall is a level –1 creature with the mindless and undead traits. It's not a
// minion, nor does it have the summoned trait. It has 1 Hit Point and is immune to bleed, death effects, disease, mental, and poison. Thralls automatically fail all checks,
// and any check made against a thrall automatically succeeds. They can take actions only when commanded … A thrall is temporary and is destroyed after 1 minute if no
// other duration is listed. You choose whether a thrall is Small or Medium … A thrall has a Speed of 15 feet unless otherwise noted. When you Command a Thrall to Strike,
// it makes a melee unarmed Strike using your spell attack modifier for its attack roll. … The Strike deals 1d6 bludgeoning, piercing, or slashing damage. At 5th level and
// every 4 levels thereafter, the damage increases by 1d6." A spell's own numbers (size, Hit Points, Speed, immunities, reach) replace the defaults. Each creation is
// owned by an Effect on the caster for the thralls' time (ending it removes them); a thrall at 0 HP is removed on its own. PF2e can't make checks against a creature
// succeed automatically: the thrall's AC is 0, and its description tells the GM to treat a critical success against it as a success.
const MODULE_ID = "pf2e-automatic-resolution";

export const THRALL = { level: -1, hp: 1, speed: 15, traits: ["mindless", "undead"], immunities: ["bleed", "death-effects", "disease", "mental", "poison"], seconds: 60,
    strike: { die: 6, firstStepLevel: 5, every: 4 } };
const SIZE_CELLS = { tiny: 1, sm: 1, med: 1, lg: 2, huge: 3, grg: 4 };

/** The thrall Strike's dice at the caster's level: 1d6, +1d6 at 5th and every 4 levels after. */
export function thrallDice(level) {
    return 1 + Math.max(0, Math.floor((Number(level ?? 1) - (THRALL.strike.firstStepLevel - THRALL.strike.every)) / THRALL.strike.every));
}

/** Whether a token's actor is a module thrall. */
export function isThrall(actorOrToken) {
    const actor = actorOrToken?.actor ?? actorOrToken;
    return !!actor?.flags?.[MODULE_ID]?.thrall;
}

/** A thrall destroyed: its token and actor removed (only a module thrall; anything else is the GM's). */
export async function destroyThrall(tokenDocument) {
    const token = tokenDocument?.document ?? tokenDocument;
    if (!token?.actor || !isThrall(token.actor)) return false;
    const actor = token.actor;
    await token.delete().catch(() => null);
    if (game.actors.get(actor.id)) await actor.delete().catch(() => null);
    return true;
}

/** Free grid squares (top-left pixels) nearest a point, within `feet` of it, none occupied by a token, inside the scene. */
export function freeSquares(scene, centre, count, { feet = 30, cells = 1, avoid = [], accept = null } = {}) {
    const size = scene.grid.size, distance = scene.grid.distance, rect = scene.dimensions.sceneRect;
    const taken = [...scene.tokens.map(token => ({ x: token.x, y: token.y, w: token.width * size, h: token.height * size })), ...avoid];
    const found = [];
    const reach = Math.ceil(feet / distance) + cells;
    const candidates = [];
    for (let dx = -reach; dx <= reach; dx++) for (let dy = -reach; dy <= reach; dy++) {
        const x = Math.floor(centre.x / size) * size + dx * size, y = Math.floor(centre.y / size) * size + dy * size;
        const middle = { x: x + cells * size / 2, y: y + cells * size / 2 };
        const away = Math.max(Math.abs(middle.x - centre.x), Math.abs(middle.y - centre.y)) / size * distance;
        if (away > feet + cells * distance / 2) continue;
        // (A square the spell rules out — inside Blossoming Gore's field, when they must be adjacent to it.)
        if (accept && !accept(middle)) continue;
        candidates.push({ x, y, away });
    }
    candidates.sort((left, right) => left.away - right.away);
    for (const spot of candidates) {
        if (found.length >= count) break;
        const box = { x: spot.x, y: spot.y, w: cells * size, h: cells * size };
        if (box.x < rect.x || box.y < rect.y || box.x + box.w > rect.x + rect.width || box.y + box.h > rect.y + rect.height) continue;
        if ([...taken, ...found.map(entry => ({ ...entry, w: box.w, h: box.h }))].some(other => box.x < other.x + other.w && box.x + box.w > other.x && box.y < other.y + other.h && box.y + box.h > other.y)) continue;
        found.push({ x: spot.x, y: spot.y });
    }
    return found;
}

/**
 * Make thralls for a caster: `count` of them at `positions` (or the free squares nearest `near` — a point — within `feet`), each by the thrall rules with the spell's
 * overrides; one Effect on the caster owns them for `seconds`. Returns {effect, thralls: [{actor, token}]}.
 */
export async function makeThralls(caster, { count = 1, spell, castId = foundry.utils.randomID(), itemOrSource = null, size = "med", hp = THRALL.hp, speed = THRALL.speed, name = null,
    immunities = [], reach = null, seconds = THRALL.seconds, positions = null, near = null, feet = 30, accept = null, notes = [], fly = null, damageType = null, extraRules = [] } = {}) {
    const casterToken = caster.getActiveTokens?.(true, true)?.[0];
    const scene = casterToken?.parent ?? canvas.scene;
    if (!scene) throw new Error(`${spell}: no scene for the thralls.`);
    const grid = scene.grid.size, cells = SIZE_CELLS[size] ?? 1;
    const centre = near ?? (casterToken ? { x: casterToken.x + casterToken.width * grid / 2, y: casterToken.y + casterToken.height * grid / 2 } : null);
    const spots = positions ?? (centre ? freeSquares(scene, centre, count, { feet, cells, accept }) : []);
    if (spots.length < count) throw new Error(`${spell}: there aren't ${count} free spaces for the thralls${positions ? "" : ` within ${feet} feet`}.`);
    const statistic = itemOrSource?.spellcasting?.statistic ?? caster.getStatistic?.("spell-attack");
    const attack = Number(statistic?.check?.mod ?? statistic?.mod ?? 0);
    const dice = thrallDice(caster.level);
    const thralls = [];
    for (const spot of spots.slice(0, count)) {
        const actor = await Actor.create({ name: name ?? `${spell}: thrall`, type: "npc", img: itemOrSource?.img ?? "icons/svg/skull.svg",
            system: { details: { level: { value: THRALL.level } }, attributes: { hp: { value: hp, max: hp }, ac: { value: 0 }, speed: { value: speed, ...(fly ? { otherSpeeds: [{ type: "fly", value: fly }] } : {}) },
                immunities: [...new Set([...THRALL.immunities, ...immunities])].map(type => ({ type })) }, traits: { value: [...THRALL.traits], size: { value: size }, rarity: "common" } },
            flags: { [MODULE_ID]: { thrall: { casterUuid: caster.uuid, castId, spell }, summoned: { castId, casterUuid: caster.uuid, spell, removeAtZero: true } } } });
        await actor.createEmbeddedDocuments("Item", [
            { name: "Thrall", type: "effect", img: "icons/svg/skull.svg", system: { duration: { value: -1, unit: "unlimited", expiry: null, sustained: false },
                rules: [{ key: "AdjustDegreeOfSuccess", selector: "check", adjustment: { all: "to-failure" } }, ...extraRules],
                description: { value: `<p>A thrall (${escape(spell)}): it automatically fails all checks, and any check made against it automatically succeeds (treat a critical success against it as a success). It acts only when commanded by a grave spell or necromancer ability, and doesn't hold its ground: a creature can move into its space (difficult terrain) and push it aside.</p>${notes.map(note => `<p>${escape(note)}</p>`).join("")}` } } },
            // (A stated damage type — Skeletal Lancers' piercing — in place of the base thrall's bludgeoning, piercing or slashing.)
            { name: "Thrall Strike", type: "melee", img: "icons/svg/sword.svg", system: { bonus: { value: attack }, damageRolls: { thrall: { damage: `${dice}d${THRALL.strike.die}`, damageType: damageType ?? "bludgeoning" } },
                traits: { value: ["unarmed", ...(damageType ? [] : ["versatile-p", "versatile-s"]), ...(reach ? [`reach-${reach}`] : [])] },
                description: { value: `<p>${escape(caster.name)}'s spell attack modifier (+${attack}); it uses and counts toward ${escape(caster.name)}'s multiple attack penalty.</p>` } } }]);
        const tokenData = (await actor.getTokenDocument({ x: spot.x, y: spot.y, disposition: casterToken?.disposition ?? CONST.TOKEN_DISPOSITIONS.FRIENDLY, actorLink: true })).toObject();
        const [token] = await scene.createEmbeddedDocuments("Token", [tokenData]);
        thralls.push({ actor, token });
    }
    const [first, ...rest] = thralls;
    const [effect] = await caster.createEmbeddedDocuments("Item", [{ name: `${spell}: thrall${thralls.length === 1 ? "" : "s"}`, type: "effect", img: itemOrSource?.img ?? "icons/svg/skull.svg",
        flags: { [MODULE_ID]: { summon: { castId, actorUuid: first.actor.uuid, tokenUuid: first.token.uuid, conjuredBy: itemOrSource?.uuid ?? spell, extra: rest.map(entry => ({ actorUuid: entry.actor.uuid, tokenUuid: entry.token.uuid })) } } },
        system: { duration: { value: Math.max(1, Math.round(seconds / 6)), unit: "rounds", expiry: "turn-start", sustained: false }, rules: [], fromSpell: true,
            start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
            description: { value: `<p>${thralls.length} thrall${thralls.length === 1 ? "" : "s"} (${size}, ${hp} HP, Speed ${speed} feet; Strike +${attack}, ${dice}d${THRALL.strike.die}). Destroyed when this ends.</p>` } } }]);
    return { effect, thralls, attack, dice };
}

function escape(value) {
    return foundry.utils.escapeHTML(String(value ?? ""));
}
