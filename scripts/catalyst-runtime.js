// PF2e's catalysts beyond the save card's ordinary riders (src/compiler/catalysts.js; the user, 2026-10-08: "automate the 62 catalyst notes too"):
// - at the cast: reminder Effects, the willing creature's condition (Dimensional Knot), a watch on the caster (Black Ash, Fearcracker, Ghostcracker), Preserved Alecost's food card;
// - on the save card: Broken Ram's Thorn's caltrops, Euphoric Loop's save when the charm ends, Kirin Echo Chime's push in a direction of the caster's choice, Ogre Spider
//   Filament's venom, Seventh Prism's doubled dazzled and its dazzled after blindness, Undertaker's Spade's incorporeal creatures, a reminder that holds until the creature moves;
// - on the spell's Effects (once the cast has resolved): Consecrated Shield, Nevercold, Witchwarg Fur, Dragon Scute, and the flags Chaos Falcon Feather, Demon Bone Tiles and Feral
//   Linguist read later;
// - once the spell has resolved (its card's resolvedCast): Force Tiles' wall, Noxious Incense's smoke, Gravemist Taper's dread, Irritating Seedpod's pollen, Odious Token's ally,
//   Skyfisher Vapors' invisible cloud;
// - on events: damage (Black Ash, Ghostcracker, Demon Bone Tiles, Shadow Ash), Mirror Image's destroyed images, flat checks, turns, moves, Effects ending, casts in a battle form.
import { shapeEffect, riderChoice, startShapeCard, tokensWithin, timedConditions, timedTempHp, castTargetActors, castGrants, shapeSpellFacts, shapeTerrain, postTerrainCard, tokenInRegion } from "./spellshape-runtime.js";
import { forcedMove } from "./forced-movement.js";
import { MODULE_ID, activeGM, escapeHTML, say } from "./runtime-utils.js";

const gmWhisper = text => ChatMessage.create({ whisper: game.users.filter(user => user.isGM).map(user => user.id), content: `<p class="pf2e-auto-gm-reminder">${text}</p>` }).catch(() => null);
const PLAIN = "The creature is unaffected.";
const plainRows = { criticalSuccess: PLAIN, success: PLAIN, failure: PLAIN, criticalFailure: PLAIN };
const combatStart = () => { const combat = game.combat?.started ? game.combat : null; return { value: game.time.worldTime, initiative: combat?.combatant?.initiative ?? null }; };
const tokenOf = actor => actor?.getActiveTokens?.(false, true)?.[0] ?? null;
const watchesOf = (actor, watch) => (actor?.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.catalystWatch?.watch === watch);
/** Raise a condition to a value, never lower it (PF2e's increaseCondition adds). */
async function raiseCondition(actor, slug, value = null) {
    const current = Number(actor.getCondition?.(slug)?.value ?? 0);
    if (!value) { if (!actor.hasCondition?.(slug)) await actor.increaseCondition(slug); return; }
    if (current < value) await actor.increaseCondition(slug, { value: value - current });
}

// ---- At the cast (spellshape-runtime.js applyCastRiders) ----

/** A catalyst's rider as the spell is cast: results, or null when the rider isn't one of these. */
export async function catalystCastRider(actor, message, shape, rider, spell, rank) {
    switch (rider.type) {
        case "reminder": {
            // (Its duration: the spell's, the text's, or until the caster's turn ends.)
            const who = rider.who === "target" ? castTargetActors(message, actor).find(other => other !== actor) ?? [...game.user.targets].find(token => token.actor && token.actor !== actor)?.actor ?? null : actor;
            if (!who) return [{ label: `${shape.name}: target the creature for its reminder`, status: "manual" }];
            const rounds = rider.forSpell ? shapeSpellFacts(spell)?.durationRounds ?? 10 : rider.rounds ?? 0;
            // (Days, hours, or until renewed: an Effect in that unit.)
            const long = rider.unlimited ? { value: -1, unit: "unlimited", expiry: null } : rider.days ? { value: rider.days, unit: "days", expiry: "turn-start" } : rider.hours ? { value: rider.hours, unit: "hours", expiry: "turn-start" } : null;
            const made = long
                ? (await who.createEmbeddedDocuments("Item", [{ name: `${shape.name}: reminder`, type: "effect", img: "icons/svg/book.svg", flags: { [MODULE_ID]: { spellshapeRider: { label: shape.name } } },
                    system: { duration: { ...long, sustained: false }, start: combatStart(), tokenIcon: { show: true }, rules: [], description: { value: `<p>${escapeHTML(rider.text)}</p>` } } }]))[0]
                : await shapeEffect(who, actor, `${shape.name}: reminder`, [], { rounds: Math.max(1, rounds), thisTurn: rounds === 0, description: rider.text, img: "icons/svg/book.svg" });
            return [{ label: `${shape.name}: ${rider.text}`, status: "applied", effectUuid: made?.uuid ?? null }];
        }
        case "targeted-ally-condition": {
            const ally = castTargetActors(message, actor).find(other => other !== actor) ?? [...game.user.targets].find(token => token.actor && token.actor !== actor)?.actor ?? null;
            if (!ally) return [{ label: `${shape.name}: target the willing adjacent creature`, status: "manual" }];
            const results = await timedConditions(ally, [rider.condition], shape.name, { caster: actor });
            if (rider.note) await gmWhisper(`<strong>${escapeHTML(shape.name)}</strong>: ${escapeHTML(rider.note)}`);
            return results;
        }
        case "cast-watch": {
            // (A watch on the caster for the spell's duration: the hooks below read it.)
            const rounds = shapeSpellFacts(spell)?.durationRounds ?? 10;
            const made = await shapeEffect(actor, actor, `${shape.name}: ${spell?.name ?? "the spell"}`, [], { rounds, img: "icons/svg/eye.svg",
                flags: { catalystWatch: { ...rider, name: shape.name, spellUuid: spell?.uuid ?? null, spellSlug: spell?.slug ?? null, castMessageId: message.id, rank } } });
            return [{ label: `${shape.name}: watched for ${rounds} rounds`, status: "applied", effectUuid: made?.uuid ?? null }];
        }
        case "food-temp-hp": {
            const amount = rider.perRank * rank;
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), flags: { [MODULE_ID]: { kind: "catalyst-card", catalystFood: { name: shape.name, amount, hours: rider.hours, eaten: [] } } },
                content: `<section class="pf2e-auto-runtime-card"><p><strong>${escapeHTML(shape.name)}</strong>: whoever eats the food gains ${amount} temporary Hit Points for ${rider.hours} hour${rider.hours === 1 ? "" : "s"}.</p><button type="button" data-pf2e-auto-catalyst="food">The targeted creatures eat</button></section>` });
            return [{ label: `${shape.name}: the food's card`, status: "applied" }];
        }
        case "light-rank": {
            // (Deathless Light: the save card's counteract uses the raised rank; elsewhere — the light shining in magical darkness — the caster's reminder for the spell.)
            const raised = Math.max(rank, Math.min(rider.max, rank + rider.by));
            const rounds = shapeSpellFacts(spell)?.durationRounds ?? 10;
            const made = await shapeEffect(actor, actor, `${shape.name}: ${spell?.name ?? "the light"} counts as rank ${raised} against darkness`, [], { rounds, img: "icons/svg/light.svg",
                description: `Against magical darkness (whether the light shines in it, or counteracting a Darkness spell), ${spell?.name ?? "the spell"} counts as rank ${raised}.` });
            return [{ label: `${shape.name}: rank ${raised} against magical darkness`, status: "applied", effectUuid: made?.uuid ?? null }];
        }
        // (Read where they act: the spell's resolution, its card, its Effects, its summons.)
        case "after-resolve": case "summoned-shroud": case "mischief-mode": case "extra-targets": case "caster-benefit-kind":
        case "effect-patch": case "effect-replace": case "effect-flag": return [];
    }
    return null;
}

// ---- On the save card (spellshape-runtime.js applyShapeRiders) ----

/** The card's own Effects on a creature: those granting its conditions, and those flagged with its cast (outcome and note Effects). */
function cardEffects(state, target, actor) {
    const flagged = (actor.itemTypes?.effect ?? []).filter(effect => { const flags = effect.flags?.[MODULE_ID]; return flags?.runtime?.castInstanceId === state.castId || flags?.outcomeEffect?.castId === state.castId; });
    return [...new Set([...castGrants(target, actor).map(grant => grant.effect), ...flagged])];
}

/** A catalyst's rider on one creature of the card: results, or null when it isn't one of these. */
export async function catalystSaveRider(state, target, actor, token, shape, rider, { degree, caster }) {
    switch (rider.type) {
        case "caltrops": {
            // (Broken Ram's Thorn: the squares directly adjacent to each creature in the area — a ring Region; the first creature moving in attempts Acrobatics against the spell DC
            // or takes cold damage equal to the rank, and the ring is spent.)
            const doc = token?.document ?? token;
            if (!doc || !caster) return [];
            const size = canvas.grid.size, w = Number(doc.width ?? 1) * size, h = Number(doc.height ?? 1) * size;
            const shapes = [{ type: "rectangle", x: doc.x - size, y: doc.y - size, width: w + 2 * size, height: size, rotation: 0 }, { type: "rectangle", x: doc.x - size, y: doc.y + h, width: w + 2 * size, height: size, rotation: 0 },
                { type: "rectangle", x: doc.x - size, y: doc.y, width: size, height: h, rotation: 0 }, { type: "rectangle", x: doc.x + w, y: doc.y, width: size, height: h, rotation: 0 }];
            const region = await shapeTerrain(doc.parent, shapes, { name: `${shape.name}: caltrops around ${actor.name}`, castId: state.castId, caster,
                rider: { hazard: { formula: String(state.castRank), damageType: rider.damageType, per: "entry", check: { skill: rider.skill, dc: Number(state.dc) }, spentOnHit: true }, rounds: 10 } });
            await postTerrainCard(caster, region, `icy caltrops around ${actor.name}: the first creature moving in attempts ${rider.skill} (DC ${state.dc}) or takes ${state.castRank} ${rider.damageType}.`);
            return [{ label: `${shape.name}: caltrops around ${actor.name}`, status: "applied" }];
        }
        case "on-end-save": {
            // (Euphoric Loop: the charm's Effect on this creature carries the save for when it ends — one target of the caster's choice, or all.)
            if (rider.oneTarget) {
                state.shapeOne ??= {};
                if (!state.shapeOne[shape.name]) {
                    const choices = (state.targets ?? []).map(entry => ({ value: entry.actorUuid, label: entry.name }));
                    state.shapeOne[shape.name] = choices.length === 1 ? choices[0].value : await riderChoice(shape, "Which target's blissful experience?", choices) ?? choices[0]?.value;
                }
                if (state.shapeOne[shape.name] !== actor.uuid) return [];
            }
            // (The charm's Effect on the creature — its outcome's or its note's; one, so the save comes once.)
            const [held] = cardEffects(state, target, actor);
            if (!held) return [{ label: `${shape.name}: no charm on ${actor.name}`, status: "skipped" }];
            await held.setFlag(MODULE_ID, "catalystOnEnd", { name: shape.name, casterUuid: caster?.uuid ?? null, statistic: rider.statistic, dc: Number(state.dc), rows: rider.rows, rank: state.castRank });
            return [{ label: `${shape.name}: ${actor.name} saves when the charm ends`, status: "applied", effectUuid: held.uuid }];
        }
        case "redirect-push": {
            // (Kirin Echo Chime: a flying creature the spell pushes goes 30 feet in the caster's chosen direction instead — back where it stood, then pushed.)
            const doc = token?.document ?? token;
            if (!doc || !rider.degrees.includes(degree) || !(Number(doc.elevation ?? 0) > 0)) return [];
            state.shapeDirection ??= {};
            const directions = { north: [0, -1], northeast: [1, -1], east: [1, 0], southeast: [1, 1], south: [0, 1], southwest: [-1, 1], west: [-1, 0], northwest: [-1, -1] };
            state.shapeDirection[shape.name] ??= await riderChoice(shape, "Push the flying creatures which way?", Object.keys(directions).map(value => ({ value, label: value }))) ?? "north";
            const [dx, dy] = directions[state.shapeDirection[shape.name]];
            const origin = state.shapeOrigins?.[doc.id];
            if (origin) await doc.update({ x: origin.x, y: origin.y }, { teleport: true, animate: false });
            const size = canvas.grid.size;
            const centre = { x: (origin?.x ?? doc.x) + Number(doc.width ?? 1) * size / 2, y: (origin?.y ?? doc.y) + Number(doc.height ?? 1) * size / 2 };
            const moved = await forcedMove(doc, { point: { x: centre.x - dx * size * 50, y: centre.y - dy * size * 50 }, direction: "away", feet: rider.feet, reason: shape.name }).catch(() => null);
            return [{ label: `${shape.name}: ${actor.name} pushed ${moved?.moved ? moved.squares * 5 : 0} feet ${state.shapeDirection[shape.name]}`, status: moved?.moved ? "applied" : "manual" }];
        }
        // (Ogre Spider Filament: swapped as the affliction is handed over — swapAfflictionConditions.)
        case "affliction-swap": return [];
        case "double-durations": {
            // (Seventh Prism: "Dazzled for twice as long as their saving throw indicates".)
            const results = [];
            for (const { effect, slugs } of castGrants(target, actor)) {
                if (!slugs.includes(rider.slug) || !(Number(effect.system?.duration?.value) > 0)) continue;
                await effect.update({ "system.duration.value": Number(effect.system.duration.value) * 2 });
                results.push({ label: `${shape.name}: ${actor.name}'s ${rider.slug} lasts twice as long`, status: "applied" });
            }
            return results;
        }
        case "after-condition": {
            // ("On a critical failure, the target is dazzled for 1 minute after its blinded condition ends": on the Effect granting blinded.)
            if (!rider.degrees.includes(degree)) return [];
            const holders = castGrants(target, actor).filter(grant => grant.slugs.includes(rider.after)).map(grant => grant.effect);
            for (const effect of holders) await effect.setFlag(MODULE_ID, "catalystAfter", { name: shape.name, condition: rider.condition, casterUuid: caster?.uuid ?? null });
            return holders.length ? [{ label: `${shape.name}: ${rider.condition.slug} for ${rider.condition.rounds} rounds after its ${rider.after} ends`, status: "applied" }] : [];
        }
        case "incorporeal-condition": {
            // (Undertaker's Spade: an incorporeal creature struck can be immobilized if adjacent to a solid surface — the GM's call on the surface, the Effect's reminder.)
            if (!rider.degrees.includes(degree) || !(actor.system?.traits?.value ?? []).includes("incorporeal")) return [];
            const made = await shapeEffect(actor, caster ?? actor, `${shape.name}: ${rider.condition.slug} if adjacent to a solid surface`, [], { rounds: 10, description: rider.note });
            return [{ label: `${shape.name}: ${actor.name} can be ${rider.condition.slug} (adjacent to a solid surface)`, status: "manual", effectUuid: made?.uuid ?? null }];
        }
        case "prone-after-move": {
            // (Leaden Weight on Gravity Well: "also knocked Prone after it moves" — after the spell's pull moved it; one the pull didn't move, after its next move: an Effect watching it.)
            if (!rider.degrees.includes(degree)) return [];
            const doc = token?.document ?? token;
            const origin = doc ? state.shapeOrigins?.[doc.id] : null;
            if (origin && (origin.x !== doc.x || origin.y !== doc.y)) {
                if (!actor.hasCondition?.("prone")) await actor.increaseCondition("prone");
                return [{ label: `${shape.name}: ${actor.name} knocked prone after the spell moved it`, status: "applied" }];
            }
            const made = await shapeEffect(actor, caster ?? actor, `${shape.name}: knocked prone after it moves`, [], { rounds: 10, flags: { catalystProneAfterMove: true } });
            return [{ label: `${shape.name}: ${actor.name} is knocked prone after it moves`, status: "applied", effectUuid: made?.uuid ?? null }];
        }
        case "mark-immune": {
            if (!rider.degrees.includes(degree)) return [];
            await actor.createEmbeddedDocuments("Item", [{ name: `${rider.name}: immune`, type: "effect", img: "icons/svg/shield.svg", flags: { [MODULE_ID]: { catalystImmune: rider.name } },
                system: { duration: { value: rider.minutes, unit: "minutes", expiry: "turn-start", sustained: false }, start: combatStart(), tokenIcon: { show: false } } }]);
            return [{ label: `${rider.name}: ${actor.name} immune for ${rider.minutes} minutes`, status: "applied" }];
        }
    }
    return null;
}

/**
 * Ogre Spider Filament: "causes a creature afflicted with spider venom to become Clumsy instead of Enfeebled" — Pseudo Afflictions' stages (`{slug, value, linked}`) read
 * the swapped condition, and the one its first stage already gave is replaced.
 */
export async function swapAfflictionConditions(effect, swaps, handler = "pseudo-afflictions") {
    const stages = foundry.utils.deepClone(effect.flags?.[handler]?.stages ?? {});
    for (const stage of Object.values(stages)) for (const condition of stage.conditions ?? []) {
        const swap = swaps.find(entry => entry.from === condition.slug);
        if (swap) condition.slug = swap.to.slug;
    }
    let description = String(effect.system?.description?.value ?? "");
    for (const swap of swaps) description = description.replace(new RegExp(String.raw`\b${swap.from}\b`, "gi"), word => word[0] === word[0].toUpperCase() ? swap.to.slug[0].toUpperCase() + swap.to.slug.slice(1) : swap.to.slug);
    await effect.update({ [`flags.${handler}.stages`]: stages, "system.description.value": description });
    const actor = effect.actor;
    for (const swap of swaps) for (const given of (actor?.itemTypes?.condition ?? []).filter(condition => condition.slug === swap.from && condition.flags?.pf2e?.grantedBy?.id === effect.id)) {
        // (As Pseudo Afflictions makes its own: the condition's source, given by the affliction.)
        const replacement = game.pf2e.ConditionManager.getCondition(swap.to.slug);
        replacement.updateSource({ "flags.pf2e.grantedBy.id": effect.id, ...(given.system?.references?.parent?.id ? { "system.references.parent.id": effect.id } : {}),
            ...(replacement.system?.value?.isValued ? { "system.value.value": Number(given.system?.value?.value ?? 1) } : {}) });
        await given.delete();
        await actor.createEmbeddedDocuments("Item", [replacement.toObject()]);
    }
    return effect;
}

/** Kirin Echo Chime, Leaden Weight: where the card's creatures stood before the spell moved them (recorded as the card starts). */
export function catalystOrigins(shapeRiders, targets) {
    if (!(shapeRiders ?? []).some(shape => (shape.riders ?? []).some(rider => ["redirect-push", "prone-after-move"].includes(rider.type)))) return null;
    const origins = {};
    // (By token id: a flag key can't hold the dots of a uuid.)
    for (const target of targets ?? []) { const doc = target?.document ?? target; if (doc?.id) origins[doc.id] = { x: doc.x, y: doc.y }; }
    return origins;
}

// ---- On the spell's Effects (once the cast has resolved: catalystAfterResolve) ----

/** A Resistance rule's types, its "{actor|path}" read from the override that sets that path (Fire Shield's "flags.system.fireShield.resistance"). */
function resolvedTypes(rule, rules) {
    return [rule.type].flat().map(type => { const path = /^\{actor\|(.+)\}$/.exec(String(type))?.[1]; return path ? rules.find(other => other.key === "ActiveEffectLike" && other.path === path)?.value ?? type : type; });
}

export async function catalystAdjustEffects(shape, rider, effects, message) {
    const results = [];
    for (const effect of effects.filter(Boolean)) {
        if (rider.type === "effect-patch") {
            const rules = foundry.utils.deepClone(effect._source?.system?.rules ?? effect.system?.rules ?? []);
            if (rider.op === "selector-swap") {
                // (Consecrated Shield: the bonus to AC, not to attack rolls.)
                let changed = false;
                for (const rule of rules) {
                    if (rule.key !== "FlatModifier") continue;
                    const selectors = [rule.selector].flat();
                    if (!selectors.some(selector => rider.from.includes(selector))) continue;
                    const next = [...new Set(selectors.map(selector => rider.from.includes(selector) ? rider.to : selector))];
                    rule.selector = Array.isArray(rule.selector) ? next : next[0];
                    changed = true;
                }
                if (changed) { await effect.update({ "system.rules": rules, name: `${effect.name} (${shape.name})` }); results.push({ label: `${shape.name}: ${effect.name}'s bonus to AC, not attack rolls`, status: "applied" }); }
            } else if (rider.op === "duration") {
                await effect.update({ "system.duration.value": rider.value, "system.duration.unit": rider.unit });
                results.push({ label: `${shape.name}: ${effect.name} lasts ${rider.value} ${rider.unit}`, status: "applied" });
            } else if (rider.op === "linger-resistance") {
                // (Nevercold: "the cold resistance you gain from it lasts 1 hour" — its own Effect, beside the spell's; at the spell's level, for the rule's formula.)
                const resistance = rules.find(rule => rule.key === "Resistance" && resolvedTypes(rule, rules).includes(rider.resistanceType));
                if (!resistance || !effect.actor) continue;
                await effect.actor.createEmbeddedDocuments("Item", [{ name: `${shape.name}: ${rider.resistanceType} resistance`, type: "effect", img: effect.img,
                    system: { level: { value: Number(effect.system?.level?.value ?? 1) }, duration: { value: rider.hours, unit: "hours", expiry: "turn-start", sustained: false }, start: combatStart(), tokenIcon: { show: true },
                        rules: [{ ...foundry.utils.deepClone(resistance), type: rider.resistanceType }] } }]);
                results.push({ label: `${shape.name}: ${rider.resistanceType} resistance for ${rider.hours} hour${rider.hours === 1 ? "" : "s"}`, status: "applied" });
            } else if (rider.op === "type-swap") {
                // (Witchwarg Fur: resistance to fire instead of cold — the Resistance's type, or the value it reads (Fire Shield's flag); the damage it deals cold instead of fire.)
                for (const rule of rules) {
                    if (rule.key === "Resistance" && [rule.type].flat().includes(rider.resistance.from)) rule.type = Array.isArray(rule.type) ? rule.type.map(type => type === rider.resistance.from ? rider.resistance.to : type) : rider.resistance.to;
                    if (rule.key === "ActiveEffectLike" && rule.value === rider.resistance.from && rules.some(other => other.key === "Resistance" && String(other.type).includes(`{actor|${rule.path}}`))) rule.value = rider.resistance.to;
                    if (rule.damageType === rider.damage.from) rule.damageType = rider.damage.to;
                }
                const swapDamage = text => String(text ?? "").replaceAll(`[${rider.damage.from}]`, `[${rider.damage.to}]`).replace(new RegExp(String.raw`\b${rider.damage.from} damage\b`, "g"), `${rider.damage.to} damage`);
                const description = `${swapDamage(effect.system?.description?.value)}<p><strong>${escapeHTML(shape.name)}:</strong> resistance to ${rider.resistance.to} (not ${rider.resistance.from}); the damage to creatures touching or hitting you is ${rider.damage.to}; the shield is immune to ${rider.damage.to}, its Hardness halved against ${rider.damage.from}.</p>`;
                await effect.update({ "system.rules": rules, "system.description.value": description, name: `${effect.name} (${shape.name})` });
                // (The spell's note Effect with its Shield Block roll: that damage cold too.)
                for (const note of (effect.actor?.itemTypes?.effect ?? []).filter(other => other !== effect && other.flags?.[MODULE_ID]?.runtime?.castInstanceId === effect.flags?.[MODULE_ID]?.runtime?.castInstanceId))
                    await note.update({ "system.description.value": swapDamage(note.system?.description?.value) });
                results.push({ label: `${shape.name}: ${effect.name} inverted (${rider.resistance.to} resistance, ${rider.damage.to} damage)`, status: "applied" });
            }
        } else if (rider.type === "effect-replace") {
            // (Dragon Scute: "Instead of the spell's normal effects", the resistance of the dragon's tradition — asked.)
            const caster = message?.actor ?? null;
            const preset = shape.choice ?? caster?.getFlag(MODULE_ID, "passiveChoices")?.[shape.name] ?? null;
            const picked = await riderChoice({ name: shape.name, choice: preset }, "The dragon's tradition", Object.keys(rider.options).map(value => ({ value, label: value })));
            const rules = rider.options[picked];
            if (!rules) continue;
            await effect.update({ "system.rules": foundry.utils.deepClone(rules), name: `${effect.name} (${shape.name}: ${picked})` });
            results.push({ label: `${shape.name}: ${effect.name} gives the ${picked} dragon's resistance instead`, status: "applied" });
        } else if (rider.type === "effect-flag") {
            await effect.setFlag(MODULE_ID, rider.flag, { ...rider, name: shape.name, casterUuid: message?.actor?.uuid ?? null });
            // (Chaos Falcon Feather: its card's Sustain moves the resistance to an adjacent creature.)
            if (rider.flag === "moveResistance") await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: message?.actor }), flags: { [MODULE_ID]: { kind: "catalyst-card", catalystMove: { effectUuid: effect.uuid, name: shape.name, minutes: rider.minutes } } },
                content: `<section class="pf2e-auto-runtime-card"><p><strong>${escapeHTML(shape.name)}</strong>: Sustain the spell to move the resistance to an adjacent creature (touching it) and change its energy; the duration drops by ${rider.minutes} minute${rider.minutes === 1 ? "" : "s"} (to 1 round if less remains).</p><button type="button" data-pf2e-auto-catalyst="move">Sustain: move it to the targeted creature</button></section>` });
            results.push({ label: `${shape.name}: ${effect.name} marked`, status: "applied" });
        }
    }
    return results;
}

/** Shadow Ash: the summoned undead's shroud (spellshape-runtime.js shapeSummonedAfter). */
export async function catalystSummoned(shape, rider, caster, summoned) {
    if (rider.type !== "summoned-shroud" || !summoned) return null;
    if (!(summoned.system?.traits?.value ?? []).includes("undead")) return [{ label: `${shape.name}: ${summoned.name} isn't undead`, status: "skipped" }];
    const [made] = await summoned.createEmbeddedDocuments("Item", [{ name: `${shape.name}: shroud of frost`, type: "effect", img: "icons/magic/water/snowflake-ice-blue.webp",
        flags: { [MODULE_ID]: { catalystShroud: { ...rider, name: shape.name, casterUuid: caster?.uuid ?? null, spentCombat: null, risen: false } } },
        system: { duration: { value: -1, unit: "unlimited", expiry: null, sustained: false }, start: combatStart(), tokenIcon: { show: true }, rules: [],
            description: { value: `<p>The first opponent to damage it with a melee Strike in a combat takes ${rider.formula} ${rider.damageType} and becomes ${rider.condition.slug} ${rider.condition.value ?? ""}. When it dies, a DC ${rider.riseDC} flat check: it rises with half its Hit Points within 1d4 rounds.</p>` } } }]);
    return [{ label: `${shape.name}: ${summoned.name} wreathed in a shroud of frost`, status: "applied", effectUuid: made?.uuid ?? null }];
}

// ---- Once the spell has resolved ----

/** The cast's card got its resolvedCast: the riders that work on what the spell made. */
export async function catalystAfterResolve(message) {
    if (!activeGM()) return [];
    // (Resolved by its executor, or a lingering area begun from the cast's card: its ongoing cast.)
    const lingering = message?.getFlag?.(MODULE_ID, "ongoingCastId");
    const resolved = message?.getFlag?.(MODULE_ID, "resolvedCast") ?? (lingering ? { castInstanceId: lingering } : null);
    const shaping = message?.getFlag?.(MODULE_ID, "shaping");
    if (!resolved || !shaping || shaping.afterResolved) return [];
    // (The caster's answers given with the cast: `shaping.choices`.)
    const shapes = (shaping.shapes ?? []).map(shape => ({ ...shape, choice: shaping.choices?.[shape.name] ?? shape.choice ?? null }));
    const entries = shapes.flatMap(shape => (shape.riders ?? []).filter(rider => rider.type === "after-resolve").map(rider => ({ shape, rider })));
    const patches = shapes.flatMap(shape => (shape.riders ?? []).filter(rider => ["effect-patch", "effect-replace", "effect-flag"].includes(rider.type)).map(rider => ({ shape, rider })));
    if (!entries.length && !patches.length) return [];
    await message.setFlag(MODULE_ID, "shaping", { ...shaping, afterResolved: true });
    const ongoing = game.modules.get(MODULE_ID)?.api?.ongoing;
    // (A lingering area flags its card before it has finished starting — and then saves its own record: wait until it's active.)
    if (lingering && !message.getFlag(MODULE_ID, "resolvedCast")) {
        for (let i = 0; i < 40 && ongoing?.journalFor?.(resolved.castInstanceId)?.getFlag(MODULE_ID, "ongoingCast")?.status !== "active"; i++) await new Promise(resolve => setTimeout(resolve, 250));
        await new Promise(resolve => setTimeout(resolve, 750));
    }
    const journal = ongoing?.journalFor?.(resolved.castInstanceId) ?? null;
    const record = journal?.getFlag(MODULE_ID, "ongoingCast") ?? null;
    const caster = message.actor;
    const results = [];
    // (The spell's own Effects — PF2e's, made for this cast — on every creature it reached.)
    if (patches.length) {
        const holders = new Set([caster, ...(canvas.scene?.tokens ?? []).map(token => token.actor)].filter(Boolean));
        const made = [...holders].flatMap(actor => (actor.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.runtime?.castInstanceId === resolved.castInstanceId));
        for (const { shape, rider } of patches) {
            try { results.push(...await catalystAdjustEffects(shape, rider, made, message)); }
            catch (error) { results.push({ label: `${shape.name}: ${error.message}`, status: "failed" }); }
        }
    }
    for (const { shape, rider } of entries) {
        try { results.push(await afterResolveOne(shape, rider, { message, journal, record, caster, ongoing, resolvedId: resolved.castInstanceId })); }
        catch (error) { results.push({ label: `${shape.name}: ${error.message}`, status: "failed" }); }
    }
    // (What the catalysts did, kept on the cast's message beside its shaping.)
    await message.setFlag(MODULE_ID, "catalystResults", results).catch(() => null);
    return results;
}

async function afterResolveOne(shape, rider, { message, journal, record, caster, ongoing, resolvedId }) {
    const region = record?.regionUuid ? await fromUuid(record.regionUuid).catch(() => null) : null;
    const remaining = record?.maximumAt ? Math.max(6, record.maximumAt - game.time.worldTime) : 600;
    const scene = region?.parent ?? canvas.scene;
    const size = canvas.grid.size;
    switch (rider.op) {
        case "wall-hazard": {
            // (Force Tiles: a creature trying to move into the wall's space takes 2d6 force — a hazard Region along each of the wall's segments, the GM's button for the creature.)
            // (Wall of Force's walls: flagged with the cast; they last as its Effect on the caster does.)
            const walls = (canvas.scene?.walls ?? []).filter(wall => wall.flags?.[MODULE_ID]?.sceneWallCast === resolvedId);
            const held = (caster?.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.sceneWalls?.castId === resolvedId);
            const wallRounds = held?.remainingDuration?.remaining ? Math.ceil(held.remainingDuration.remaining / 6) : 10;
            const shapes = walls.map(wall => { const [x1, y1, x2, y2] = wall.c; return { type: "rectangle", x: Math.min(x1, x2) - size / 2, y: Math.min(y1, y2) - size / 2, width: Math.abs(x2 - x1) + size, height: Math.abs(y2 - y1) + size, rotation: 0 }; });
            if (!shapes.length) { await gmWhisper(`<strong>${escapeHTML(shape.name)}</strong>: ${escapeHTML(rider.note)} A creature trying to move into the wall's space takes ${escapeHTML(rider.formula)} ${escapeHTML(rider.damageType)} (no wall found to mark).`); return { label: `${shape.name}: the GM's`, status: "manual" }; }
            const terrain = await shapeTerrain(canvas.scene, shapes, { name: `${shape.name}: the wall`, castId: resolvedId, caster, rider: { hazard: { formula: rider.formula, damageType: rider.damageType, per: "entry" }, rounds: wallRounds } });
            await postTerrainCard(caster, terrain, `a creature trying to move into the wall's space takes ${rider.formula} ${rider.damageType}. ${rider.note}`);
            return { label: `${shape.name}: the wall's ${rider.formula} ${rider.damageType}`, status: "applied" };
        }
        case "wall-smoke": {
            // (Noxious Incense: the squares adjacent to the wall, smoke for the spell's duration — the wall's area grown by a square each way, a concealing cloud.)
            if (!region) return { label: `${shape.name}: no wall region`, status: "manual" };
            const shapes = region.shapes.map(entry => { const data = entry.toObject?.() ?? { ...entry };
                if (data.type === "rectangle") return { ...data, x: data.x - size, y: data.y - size, width: data.width + 2 * size, height: data.height + 2 * size };
                if (data.type === "circle") return { ...data, radius: data.radius + size };
                if (data.type === "ellipse") return { ...data, radiusX: data.radiusX + size, radiusY: data.radiusY + size };
                if (data.type === "polygon") { const xs = data.points.filter((_, i) => i % 2 === 0), ys = data.points.filter((_, i) => i % 2 === 1);
                    return { type: "rectangle", x: Math.min(...xs) - size, y: Math.min(...ys) - size, width: Math.max(...xs) - Math.min(...xs) + 2 * size, height: Math.max(...ys) - Math.min(...ys) + 2 * size, rotation: 0 }; }
                return data; });
            const [smoke] = await scene.createEmbeddedDocuments("Region", [{ name: `${shape.name}: smoke`, color: "#555555", shapes, visibility: CONST.REGION_VISIBILITY?.ALWAYS ?? 2 }]);
            await ongoing.startCloud({ spellName: `${shape.name}: smoke`, sourceActorUuid: caster.uuid, sourceItemUuid: record?.sourceItemUuid ?? null, castRank: record?.rank ?? 1, region: smoke, durationSeconds: remaining });
            return { label: `${shape.name}: smoke around the wall`, status: "applied" };
        }
        case "mist-dread": {
            // (Gravemist Taper: a flat check against a creature concealed by this mist fails below 7, and the one failing becomes frightened 1 — the caster's watch, read by flat checks.)
            if (!region) return { label: `${shape.name}: no mist region`, status: "manual" };
            await shapeEffect(caster, caster, `${shape.name}: the mist's dread`, [], { rounds: Math.ceil(remaining / 6), img: "icons/svg/terror.svg",
                flags: { catalystWatch: { watch: "mist-dread", name: shape.name, regionUuid: region.uuid, flatDC: rider.flatDC, condition: rider.condition } },
                description: `Inside the mist: the flat check against concealment is DC ${rider.flatDC}; a creature failing it becomes ${rider.condition.slug} ${rider.condition.value ?? ""}.` });
            return { label: `${shape.name}: flat checks against the mist DC ${rider.flatDC}`, status: "applied" };
        }
        case "area-turn-save": {
            // (Irritating Seedpod: the creatures in the mist save now and as each turn starts inside, unless immune; the lesser's pollen only for a round.)
            if (!region) return { label: `${shape.name}: no mist region`, status: "manual" };
            const rounds = rider.oneRound ? 1 : Math.ceil(remaining / 6);
            await shapeEffect(caster, caster, `${shape.name}: pollen`, [], { rounds, img: "icons/svg/biohazard.svg", flags: { catalystWatch: { ...rider, watch: "area-turn-save", name: shape.name, regionUuid: region.uuid } } });
            const inside = (scene?.tokens ?? []).filter(token => token.actor && token.actor !== caster && tokenInRegion(token, region));
            if (inside.length) await pollenCard(caster, { ...rider, name: shape.name }, inside);
            return { label: `${shape.name}: pollen for ${rounds} round${rounds === 1 ? "" : "s"} (${inside.length} inside now)`, status: "applied" };
        }
        case "aura-on-ally": {
            // (Odious Token: the aura on an ally within 30 feet (the targeted one), the caster immune.)
            const ally = castTargetActors(message, caster).find(other => other !== caster) ?? [...game.user.targets].find(token => token.actor && token.actor !== caster)?.actor ?? null;
            if (!journal || !record || !ally) return { label: `${shape.name}: target the ally first`, status: "manual" };
            const data = foundry.utils.deepClone(record);
            data.declaration = { ...data.declaration, centreActorUuid: ally.uuid, excludeActorUuids: [caster.uuid, ally.uuid] };
            await ongoing.saveRecord(journal, data);
            await ongoing.reconcile?.({});
            return { label: `${shape.name}: the aura centred on ${ally.name}; ${caster.name} immune`, status: "applied" };
        }
        case "hidden-cloud": {
            // (Skyfisher Vapors: the cloud invisible — its Region seen only on the GM's layer — and no concealment; the caster always knows where it is.)
            const cloud = region ?? scene?.regions?.find(entry => entry.flags?.pf2e?.messageId === message.id) ?? null;
            if (cloud) await cloud.update({ visibility: CONST.REGION_VISIBILITY?.LAYER ?? 0 });
            if (journal && record?.declaration?.concealment) {
                const data = foundry.utils.deepClone(record);
                for (const held of data.concealment ?? []) {
                    const effect = await fromUuid(held.effectUuid).catch(() => null);
                    await effect?.delete({ [MODULE_ID]: { ongoingCleanup: true, skipSequence: true, skipCascade: true, reason: "hidden-cloud" } }).catch(() => null);
                    const entry = (data.entries ?? []).find(candidate => candidate.uuid === held.effectUuid);
                    if (entry) { entry.status = "ended"; entry.reason = "hidden-cloud"; }
                }
                data.declaration = { ...data.declaration, concealment: false };
                data.concealment = [];
                await ongoing.saveRecord(journal, data);
            }
            return { label: `${shape.name}: the cloud invisible, no concealment`, status: "applied" };
        }
    }
    return { label: `${shape.name}: ${rider.op}`, status: "skipped" };
}

async function pollenCard(caster, data, tokens) {
    const fresh = tokens.filter(token => !(token.actor.itemTypes?.effect ?? []).some(effect => effect.flags?.[MODULE_ID]?.catalystImmune === data.name));
    if (!fresh.length) return null;
    const list = data.failure.map(entry => ({ uuid: entry.uuid, slug: entry.slug, value: entry.value, rounds: (entry.after ?? 0) + entry.rounds }));
    return startShapeCard({ caster, name: data.name, rank: 1, statistic: data.statistic, outcomes: plainRows, targets: fresh.map(token => token.object ?? token), dc: data.dc,
        riders: [{ type: "conditions", degrees: { failure: list, criticalFailure: list } }, { type: "mark-immune", name: data.name, minutes: data.immuneMinutes, degrees: ["success", "criticalSuccess"] }] }).catch(() => null);
}

// ---- Events ----

/** Damage taken: Black Ash's thorns, Ghostcracker's image, Shadow Ash's shroud. */
export async function catalystOnDamage(message) {
    if (!activeGM() || message?.flags?.pf2e?.context?.type !== "damage-taken") return [];
    const applied = message.flags.pf2e.appliedDamage;
    if (!applied || applied.isHealing) return [];
    const victim = message.actor;
    const lost = Number((applied.updates ?? []).find(update => update.path === "system.attributes.hp.value")?.value ?? 0);
    // (The damage's item and its actor: the module's record of it — PF2e's damage-taken message carries no origin.)
    const origin = message.flags?.[MODULE_ID]?.damageSource ?? message.flags.pf2e.origin ?? {};
    const attacker = origin.actor ? await fromUuid(origin.actor).catch(() => null) : null;
    const done = [];
    // (Black Ash: "A creature damaged by this wall's thorns takes an additional 1d6 persistent poison damage" — damage from the watched spell.)
    if (lost > 0 && attacker && origin.uuid) for (const watch of watchesOf(attacker, "spell-damage-persistent")) {
        const data = watch.flags[MODULE_ID].catalystWatch;
        const item = await fromUuid(origin.uuid).catch(() => null);
        if (origin.uuid !== data.spellUuid && !(item?.slug && item.slug === data.spellSlug)) continue;
        await victim.createEmbeddedDocuments("Item", [{ name: `Persistent Damage (${data.formula} ${data.damageType})`, type: "condition", img: "systems/pf2e/icons/conditions/persistent-damage.webp",
            system: { slug: "persistent-damage", persistent: { formula: data.formula, damageType: data.damageType, dc: 15 } } }]);
        done.push(`${data.name}: ${victim.name} ${data.formula} persistent ${data.damageType}`);
    }
    // (Ghostcracker: the illusory creature ended by an enemy's attack or spell — that enemy frightened 1.)
    const image = victim?.flags?.[MODULE_ID]?.illusoryImage;
    if (image && Number(victim.hitPoints?.value ?? 1) <= 0 && attacker) {
        const caster = await fromUuid(image.casterUuid).catch(() => null);
        const watch = watchesOf(caster, "illusion-ended")[0];
        if (watch && attacker !== caster && !(attacker.alliance && attacker.alliance === caster?.alliance)) {
            const condition = watch.flags[MODULE_ID].catalystWatch.condition;
            await raiseCondition(attacker, condition.slug, condition.value);
            done.push(`${watch.flags[MODULE_ID].catalystWatch.name}: ${attacker.name} ${condition.slug} ${condition.value ?? ""}`);
        }
    }
    // (Shadow Ash: the shroud's first melee Strike in a combat; its rising.)
    const shroud = (victim?.itemTypes?.effect ?? []).find(entry => entry.flags?.[MODULE_ID]?.catalystShroud);
    if (shroud) {
        const data = shroud.flags[MODULE_ID].catalystShroud;
        const combatId = game.combat?.started ? game.combat.id : null;
        const melee = ["weapon", "melee"].includes(origin.type) && !origin.ranged;
        if (lost > 0 && melee && attacker && combatId && data.spentCombat !== combatId) {
            await shroud.setFlag(MODULE_ID, "catalystShroud", { ...data, spentCombat: combatId });
            const DamageRoll = CONFIG.Dice.rolls.find(cls => cls.name === "DamageRoll");
            const roll = await new DamageRoll(`{${data.formula}[${data.damageType}]}`).evaluate();
            await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: victim }), flavor: `<strong>${escapeHTML(data.name)}</strong>: the shroud shatters on ${escapeHTML(attacker.name)}` }).catch(() => null);
            await attacker.applyDamage({ damage: roll, token: tokenOf(attacker) ?? undefined }).catch(() => null);
            await raiseCondition(attacker, data.condition.slug, data.condition.value);
            done.push(`${data.name}: ${attacker.name} ${roll.total} ${data.damageType}, ${data.condition.slug}`);
        }
        if (Number(victim.hitPoints?.value ?? 1) <= 0 && !data.risen) {
            await shroud.setFlag(MODULE_ID, "catalystShroud", { ...foundry.utils.deepClone(shroud.flags[MODULE_ID].catalystShroud), risen: true });
            const flat = await new Roll("1d20").evaluate();
            await flat.toMessage({ speaker: ChatMessage.getSpeaker({ actor: victim }), flavor: `<strong>${escapeHTML(data.name)}</strong>: DC ${data.riseDC} flat check to rise again` }).catch(() => null);
            if (flat.total >= data.riseDC) {
                const delay = await new Roll("1d4").evaluate();
                await victim.createEmbeddedDocuments("Item", [{ name: `${data.name}: rising in ${delay.total} rounds`, type: "effect", img: shroud.img, flags: { [MODULE_ID]: { catalystRising: true } },
                    system: { duration: { value: delay.total, unit: "rounds", expiry: "turn-start", sustained: false }, start: combatStart(), tokenIcon: { show: true } } }]);
                await gmWhisper(`<strong>${escapeHTML(data.name)}</strong>: ${escapeHTML(victim.name)} rises with half its Hit Points in ${delay.total} rounds (unless its remains were destroyed).`);
            }
            done.push(`${data.name}: rise check ${flat.total}`);
        }
    }
    return done;
}

/**
 * Demon Bone Tiles: "When use Shield Block with the spell, the barrier explodes into many bone fragments" — the shield's Effect marked as it blocked (the applyDamage wrapper,
 * item-spellshape-runtime.js); the creatures adjacent to the caster attempt the Reflex save, once.
 */
export async function catalystShieldBlocked(item) {
    const data = item?.flags?.[MODULE_ID]?.shieldShards;
    if (!activeGM() || !data?.blockedAt || data.spent || !item.actor) return null;
    await item.setFlag(MODULE_ID, "shieldShards", { ...data, spent: true });
    const holder = item.actor;
    const center = tokenOf(holder);
    const adjacent = center ? tokensWithin(center, 5).map(token => token.object ?? token) : [];
    const card = adjacent.length ? await startShapeCard({ caster: holder, name: `${data.name}: bone shards`, rank: 1, statistic: data.statistic, outcomes: plainRows, targets: adjacent, dc: data.dc,
        riders: [{ type: "persistent", formula: data.formula, damageType: data.damageType, degrees: ["failure", "criticalFailure"] }] }).catch(() => null) : null;
    if (data.note) await gmWhisper(`<strong>${escapeHTML(data.name)}</strong>: ${escapeHTML(data.note)}`);
    return { adjacent: adjacent.length, card: Boolean(card) };
}

/** Mirror Image's image destroyed (stored-trigger-runtime.js decoy): Fearcracker's attacker frightened 1. */
export async function catalystOnDecoy(message) {
    const data = message?.flags?.[MODULE_ID];
    if (!activeGM() || data?.kind !== "image-decoys" || !data.destroyed || !data.attackerUuid) return null;
    const caster = message.actor;
    const watch = watchesOf(caster, "image-destroyed")[0];
    if (!watch) return null;
    const attacker = (await fromUuid(data.attackerUuid).catch(() => null))?.actor ?? null;
    if (!attacker) return null;
    const condition = watch.flags[MODULE_ID].catalystWatch.condition;
    await raiseCondition(attacker, condition.slug, condition.value);
    await say(caster, `<strong>${escapeHTML(watch.flags[MODULE_ID].catalystWatch.name)}</strong>: the image "dies" horribly — ${escapeHTML(attacker.name)} is ${escapeHTML(condition.slug)} ${condition.value ?? ""}.`);
    return { attacker: attacker.name };
}

/** Gravemist Taper: a flat check against a creature in the mist fails below its DC, and the one who rolled becomes frightened 1. */
export async function catalystOnFlatCheck(message) {
    const context = message?.flags?.pf2e?.context;
    if (!activeGM() || context?.type !== "flat-check") return null;
    const roller = message.actor;
    const total = Number(message.rolls?.[0]?.total ?? NaN);
    if (!roller || !Number.isFinite(total)) return null;
    const target = context.target?.token ? await fromUuid(context.target.token).catch(() => null) : [...game.user.targets][0]?.document ?? null;
    for (const holder of canvas.scene?.tokens ?? []) for (const watch of watchesOf(holder.actor, "mist-dread")) {
        const data = watch.flags[MODULE_ID].catalystWatch;
        const region = await fromUuid(data.regionUuid).catch(() => null);
        const inside = token => Boolean(token && region && tokenInRegion(token, region));
        // (Concealment from the mist: the target inside it, or the roller looking out.)
        if (!inside(target) && !inside(tokenOf(roller)?.document ?? null)) continue;
        if (total >= data.flatDC) continue;
        await raiseCondition(roller, data.condition.slug, data.condition.value);
        await say(roller, `<strong>${escapeHTML(data.name)}</strong>: the flat check (${total}) fails against DC ${data.flatDC} — ${escapeHTML(roller.name)} is ${escapeHTML(data.condition.slug)} ${data.condition.value ?? ""}.`);
        return { roller: roller.name, total };
    }
    return null;
}

/** A creature's turn begins: Irritating Seedpod's pollen. */
export async function catalystTurnStart(combat) {
    if (!activeGM() || !combat?.started) return [];
    const token = combat.combatant?.token;
    if (!token?.actor) return [];
    const done = [];
    for (const holder of canvas.scene?.tokens ?? []) for (const watch of watchesOf(holder.actor, "area-turn-save")) {
        const data = watch.flags[MODULE_ID].catalystWatch;
        const region = await fromUuid(data.regionUuid).catch(() => null);
        if (!region || !tokenInRegion(token, region) || token.actor === holder.actor) continue;
        await pollenCard(holder.actor, data, [token]);
        done.push(token.name);
    }
    return done;
}

/** A token moved: Leaden Weight's prone. */
export async function catalystOnMove(token, changes) {
    if (!activeGM() || !("x" in changes || "y" in changes) || !token?.actor) return null;
    const pending = (token.actor.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.catalystProneAfterMove);
    if (!pending.length) return null;
    await token.actor.deleteEmbeddedDocuments("Item", pending.map(effect => effect.id));
    if (!token.actor.hasCondition?.("prone")) await token.actor.increaseCondition("prone");
    return { prone: token.actor.name };
}

/** An Effect ended: Euphoric Loop's save, Seventh Prism's dazzled after blindness, Shadow Ash's rising. */
export async function catalystOnEffectEnded(item) {
    if (!activeGM() || item?.type !== "effect" || !item.actor) return null;
    const actor = item.actor;
    const onEnd = item.flags?.[MODULE_ID]?.catalystOnEnd;
    if (onEnd) {
        // ("if the spell ended because of a hostile action": the GM's answer.)
        const caster = await fromUuid(onEnd.casterUuid ?? "").catch(() => null);
        const hostile = await riderChoice({ name: onEnd.name, choice: null }, `Did ${actor.name}'s charm end because of a hostile action?`, [{ value: "no", label: "No" }, { value: "yes", label: "Yes, a hostile action" }]);
        const pick = row => [hostile === "yes" ? row.hostile : row.normal].map(entry => ({ ...entry, ...(entry.rounds ? { rounds: entry.rounds } : {}) }));
        const degrees = Object.fromEntries(Object.entries(onEnd.rows).map(([degree, row]) => [degree, pick(row)]));
        const token = tokenOf(actor);
        if (caster && token) await startShapeCard({ caster, name: onEnd.name, rank: onEnd.rank ?? 1, statistic: onEnd.statistic, outcomes: plainRows, targets: [token.object ?? token], dc: onEnd.dc,
            riders: [{ type: "conditions", degrees }] }).catch(() => null);
        return { onEnd: actor.name, hostile };
    }
    const after = item.flags?.[MODULE_ID]?.catalystAfter;
    if (after) return timedConditions(actor, [after.condition], after.name, { caster: await fromUuid(after.casterUuid ?? "").catch(() => null) });
    if (item.flags?.[MODULE_ID]?.catalystRising && Number(actor.hitPoints?.value ?? 1) <= 0) {
        const max = Number(actor.hitPoints?.max ?? 0);
        await actor.update({ "system.attributes.hp.value": Math.floor(max / 2) });
        if (actor.hasCondition?.("dying")) await actor.decreaseCondition("dying", { forceRemove: true });
        await say(actor, `<strong>${escapeHTML(item.name.replace(/: rising.*$/, ""))}</strong>: ${escapeHTML(actor.name)} rises again with ${Math.floor(max / 2)} Hit Points, a garbled screech in its corpse.`);
        return { risen: actor.name };
    }
    return null;
}

/** A cast while in a battle form with Feral Linguist: the greater's one spell (4th rank or lower, or a cantrip); otherwise the GM told it can't be cast. */
export async function catalystOnCast(message) {
    const isCast = message?.flags?.pf2e?.context?.type === "spell-cast" || (!message?.flags?.pf2e?.context?.type && message?.flags?.pf2e?.origin?.type === "spell" && message?.flags?.pf2e?.casting);
    if (!activeGM() || !isCast) return null;
    const actor = message.actor, spell = message.item;
    const form = (actor?.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.formSpeech);
    if (!form || !spell) return null;
    const data = form.flags[MODULE_ID].formSpeech;
    const rank = Number(message.flags.pf2e.origin?.castRank ?? message.flags.pf2e.casting?.castRank ?? spell.rank ?? 1);
    const cantrip = (spell.system?.traits?.value ?? []).includes("cantrip");
    if (data.castOnce && !data.castOnce.used && (cantrip || rank <= data.castOnce.maxRank)) {
        await form.setFlag(MODULE_ID, "formSpeech", { ...data, castOnce: { ...data.castOnce, used: true } });
        await say(actor, `<strong>${escapeHTML(data.name)}</strong>: ${escapeHTML(spell.name)} cast in the battle form (its one spell this duration).`);
        return { allowed: true };
    }
    await gmWhisper(`<strong>${escapeHTML(data.name)}</strong>: ${escapeHTML(actor.name)} can speak in the battle form but can't cast ${escapeHTML(spell.name)}${data.castOnce?.used ? " (its one spell is used)" : ""}.`);
    return { allowed: false };
}

/** The catalyst cards' buttons: Preserved Alecost's food, Chaos Falcon Feather's Sustain. */
export async function runCatalystCard(message, kind, { choice = null } = {}) {
    if (kind === "food") {
        const data = message.getFlag(MODULE_ID, "catalystFood");
        const eaters = [...game.user.targets].map(token => token.actor).filter(Boolean).filter(actor => !(data.eaten ?? []).includes(actor.uuid));
        if (!eaters.length) throw new Error("Target the creatures that eat.");
        const results = [];
        for (const actor of eaters) results.push(await timedTempHp(actor, data.amount, data.name, data.hours * 600));
        await message.setFlag(MODULE_ID, "catalystFood", { ...data, eaten: [...(data.eaten ?? []), ...eaters.map(actor => actor.uuid)] });
        return results;
    }
    if (kind === "move") {
        const data = message.getFlag(MODULE_ID, "catalystMove");
        const effect = await fromUuid(data.effectUuid).catch(() => null);
        const target = [...game.user.targets][0]?.actor ?? null;
        if (!effect) throw new Error("The resistance has ended.");
        if (!target) throw new Error("Target the adjacent creature.");
        // (A new energy type: the Effect's own choice, asked again — its listed energies.)
        const source = effect.toObject(); delete source._id;
        const choiceSet = (source.system.rules ?? []).find(rule => rule.key === "ChoiceSet" && Array.isArray(rule.choices));
        if (choiceSet) {
            const options = choiceSet.choices.map(entry => ({ value: entry.value, label: game.i18n.localize(entry.label ?? String(entry.value)) }));
            const picked = await riderChoice({ name: data.name, choice }, "Its new energy", options);
            if (picked == null) return null;
            choiceSet.selection = picked;
            foundry.utils.setProperty(source, `flags.system.rulesSelections.${choiceSet.flag}`, picked);
            if (source.flags?.pf2e?.rulesSelections) source.flags.pf2e.rulesSelections[choiceSet.flag] = picked;
        }
        const left = Number(effect.remainingDuration?.remaining ?? 600);
        const rounds = left > data.minutes * 60 ? Math.round((left - data.minutes * 60) / 6) : 1;
        source.system.duration = { value: rounds, unit: "rounds", expiry: "turn-start", sustained: false };
        source.system.start = combatStart();
        await effect.delete();
        const [moved] = await target.createEmbeddedDocuments("Item", [source]);
        await message.update({ [`flags.${MODULE_ID}.catalystMove.effectUuid`]: moved?.uuid ?? null });
        return { movedTo: target.name, rounds };
    }
    return null;
}

export function bindCatalystButtons(message, html) {
    for (const button of html.querySelectorAll?.("[data-pf2e-auto-catalyst]") ?? []) button.addEventListener("click", async () => {
        try { await runCatalystCard(message, button.dataset.pf2eAutoCatalyst); } catch (error) { ui.notifications.error(error.message); }
    });
}
