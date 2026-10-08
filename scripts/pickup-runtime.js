// Things creatures pick up and use (pickup-cards.js):
//   - thrown seeds (Fire Seeds): the acorns as an item on the caster (handed around freely), one used per throw; the placed burst's save card for the
//     creatures in it; the burning ground, one area for all the acorns ("only once per round, even if it's in overlapping areas"), its time from the
//     latest throw; the acorns rot when the spell ends (the card's record removes them);
//   - a season's pod (Tree of Seasons): the placed burst's save card, the season's damage type;
//   - a gift (Bounty of the Sky): for the caster or an ally within the area (an enemy's turns to ash), the benefit it selects — Hit Points, an
//     affliction's stage down by 1 (not below 1), or the listed conditions down by 2 (one) or by 1 (two).
import { applyDamageWithReceipt } from "./native-damage-receipt.js";
import { isDying, recoverFromDying } from "./dying-recovery.js";
import { ONGOING_FLAG } from "./ongoing-core.js";
import { tokenDistance } from "./token-distance.js";
import { lowerAfflictionStage } from "./affliction-care-runtime.js";

const MODULE_ID = "pf2e-automatic-resolution";
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const DamageRollClass = () => { const found = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll"); if (!found) throw new Error("PF2e's DamageRoll class could not be resolved."); return found; };
const say = (actor, content) => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content }).catch(() => null);
const recordOf = (ongoing, castId) => { const journal = castId ? ongoing.find(castId) : null; const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG); return record?.status === "active" ? { journal, record } : null; };
const centreOf = token => ({ x: token.x + (Number(token.width) || 1) * canvas.grid.size / 2, y: token.y + (Number(token.height) || 1) * canvas.grid.size / 2, elevation: Number(token.elevation ?? 0) });
const inside = region => canvas.scene.tokens.filter(token => token.actor && !token.hidden && region.testPoint?.(centreOf(token)));

/** The card's things to pick up, made with the card: one item on the caster holding the stated number. */
export async function makePickupItems(ongoing, castId, caster, { name, count, img = null, text = "" }) {
    const found = recordOf(ongoing, castId);
    if (!found) return null;
    const [item] = await caster.createEmbeddedDocuments("Item", [{ name, type: "equipment", img: img ?? "icons/consumables/nuts/nut-spiked-shell.webp",
        flags: { [MODULE_ID]: { pickup: { castId } } }, system: { quantity: count, description: { value: `<p>${escapeHTML(text)}</p>` } } }]);
    await ongoing.attach(found.journal, item);
    return item;
}

/** One of the card's things used: the thrower's (else any holder's) quantity down by one. */
async function useOne(castId, throwerUuid = null) {
    const held = [...game.actors.contents, ...canvas.scene.tokens.map(token => token.actor).filter(Boolean)].flatMap(actor => actor.items.filter(item => item.flags?.[MODULE_ID]?.pickup?.castId === castId && Number(item.system.quantity ?? 0) > 0));
    const item = held.find(entry => entry.actor?.uuid === throwerUuid) ?? held[0];
    if (!item) return null;
    const left = Number(item.system.quantity) - 1;
    if (left > 0) await item.update({ "system.quantity": left }); else await item.update({ "system.quantity": 0 });
    return { holder: item.actor?.name ?? null, left };
}

async function placeBurst(item, message, place, region) {
    return region ?? await item.clone({ "system.area": { type: place.type, value: place.value } }).placeTemplate(message);
}

export async function seedPart({ ongoing, saves, caster, spell, data, phase, message, options }) {
    const found = recordOf(ongoing, data.lastingCastId);
    if (!found) throw new Error(`${data.spellName}: the spell has ended; the ${phase.item}s have rotted.`);
    const thrown = Number(data.thrown ?? 0);
    if (thrown >= phase.count) throw new Error(`${data.spellName}: all ${phase.count} ${phase.item}s have been thrown.`);
    const placed = await placeBurst(spell, message, phase.place, options.region ?? null);
    if (!placed) return { status: "cancelled" };
    const used = await useOne(data.lastingCastId, options.throwerUuid ?? null);
    const caught = options.targets ?? inside(placed).map(token => token.object ?? token);
    const card = caught.length ? await saves.start(spell, { plan: foundry.utils.deepClone(phase.plan), sourceActor: caster, targets: caught, castRank: Number(data.castRank), skipConfirmation: true }) : null;
    // (The burning ground: one area for every acorn's flames — the first burst's region, the later ones' shapes added to it.)
    const rank = Number(data.castRank);
    const formula = phase.flames.formula.replaceAll("@item.rank", String(rank));
    const flames = data.flamesCastId ? ongoing.find(data.flamesCastId) : null;
    const flameRecord = flames?.getFlag(MODULE_ID, ONGOING_FLAG);
    let flamesCastId = data.flamesCastId ?? null;
    if (flameRecord?.status === "active") {
        const region = await fromUuid(flameRecord.regionUuid);
        await region.update({ shapes: [...region.shapes.map(shape => shape.toObject?.() ?? shape), ...placed.shapes.map(shape => shape.toObject?.() ?? shape)] });
        if (placed.uuid !== region.uuid) await placed.delete();
        const record = foundry.utils.deepClone(flameRecord);
        // (Those caught by the burst didn't enter the flames; the ground burns its minute from this throw.)
        record.members = [...new Set([...(record.members ?? []), ...inside(region).filter(token => region.testPoint?.(centreOf(token))).map(token => token.uuid)])];
        record.maximumAt = Math.max(Number(record.maximumAt ?? 0), game.time.worldTime + phase.flames.seconds);
        await ongoing.save(flames, record);
    } else {
        const started = await ongoing.startRegionArea({ spellName: `${data.spellName}: flames`, sourceActorUuid: caster.uuid, sourceItemUuid: spell.uuid, castRank: rank, region: placed,
            durationSeconds: phase.flames.seconds, notes: [`The ground burns: ${formula} ${phase.flames.type} to a creature entering the flames or ending its turn in them, once per round across all the flames.`],
            events: [...phase.flames.events], hazardOncePerRound: true, seedMembers: true, hazardDamage: { formula, type: phase.flames.type, label: "the flames" } });
        flamesCastId = started.castId;
    }
    const latest = game.messages.get(message.id)?.getFlag(MODULE_ID, "incarnate") ?? data;
    await message.setFlag(MODULE_ID, "incarnate", { ...latest, thrown: thrown + 1, flamesCastId });
    return { card: card?.card ?? card ?? null, caught: caught.map(token => token.name), left: phase.count - thrown - 1, holder: used?.holder ?? null, flamesCastId };
}

export async function podPart({ ongoing, saves, caster, spell, data, phase, message, options }) {
    if (!recordOf(ongoing, data.lastingCastId)) throw new Error(`${data.spellName}: the spell has ended; the pods have rotted.`);
    const placed = await placeBurst(spell, message, phase.place, options.region ?? null);
    if (!placed) return { status: "cancelled" };
    const caught = options.targets ?? inside(placed).map(token => token.object ?? token);
    const card = caught.length ? await saves.start(spell, { plan: foundry.utils.deepClone(phase.plan), sourceActor: caster, targets: caught, castRank: Number(data.castRank), skipConfirmation: true }) : null;
    // (The burst is the explosion only: its marker goes once the creatures in it are read.)
    if (!options.region) await placed.delete().catch(() => null);
    return { card: card?.card ?? card ?? null, caught: caught.map(token => token.name) };
}

export async function giftPart({ ongoing, caster, spell, data, phase, token, options }) {
    if (!recordOf(ongoing, data.lastingCastId)) throw new Error(`${data.spellName}: the spell has ended.`);
    const actor = token.actor, from = caster.getActiveTokens?.(true, true)?.[0];
    if (actor !== caster && !(caster.isAllyOf?.(actor))) { await say(caster, `<p><strong>${escapeHTML(data.spellName)}</strong>: the gift turns to ash in ${escapeHTML(token.name)}'s hands.</p>`); return { ash: true }; }
    if (from && actor !== caster && tokenDistance(from, token) > phase.radius) throw new Error(`${data.spellName}: ${token.name} isn't within ${phase.radius} feet.`);
    let benefit = options.benefit ?? null, picks = options.conditions ?? null, afflictionId = options.afflictionId ?? null;
    if (!benefit) {
        const conditionOptions = ["", ...phase.conditions].map(slug => `<option value="${slug}">${slug || "—"}</option>`).join("");
        const answer = await foundry.applications.api.DialogV2.prompt({ window: { title: `${data.spellName}: ${token.name}` }, rejectClose: false,
            content: `<p>The benefit:</p><select name="benefit"><option value="heal">Regain Hit Points</option><option value="affliction">An affliction's stage down by 1</option><option value="conditions">Conditions down</option></select>`
                + `<p>Conditions (one: down by ${phase.by}; two: each down by ${phase.eachBy}):</p><select name="first">${conditionOptions}</select><select name="second">${conditionOptions}</select>`,
            ok: { callback: (_event, button) => ({ benefit: button.form.elements.benefit.value, picks: [button.form.elements.first.value, button.form.elements.second.value].filter(Boolean) }) } });
        if (!answer) return { status: "cancelled" };
        benefit = answer.benefit; picks = answer.picks;
    }
    const out = { benefit };
    if (benefit === "heal") {
        const roll = await new (DamageRollClass())(`(${phase.heal})[healing]`, { item: { rank: Number(data.castRank), level: Number(data.castRank) } }).evaluate();
        await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(data.spellName)}</strong>: ${escapeHTML(token.name)} eats a gift` }).catch(() => null);
        const wasDying = isDying(actor);
        out.healed = (await applyDamageWithReceipt(actor, { damage: -roll.total, token: token.document ?? token, item: spell, rollOptions: new Set(), skipIWR: false }, foundry.utils.randomID())).healing ?? roll.total;
        await recoverFromDying(actor, wasDying);
    } else if (benefit === "affliction") {
        // (The afflictions the module tracks: the Pseudo Afflictions handler's Effects, their badge the stage.)
        out.affliction = await lowerAfflictionStage(actor, phase.afflictions, { id: afflictionId, by: 1, floor: 1 });
        if (!out.affliction) throw new Error(`${data.spellName}: ${token.name} suffers from no ${phase.afflictions.join(" or ")} the module tracks.`);
    } else {
        const chosen = [...new Set(picks ?? [])].filter(slug => phase.conditions.includes(slug)).slice(0, 2);
        if (!chosen.length) throw new Error(`${data.spellName}: pick one or two of ${phase.conditions.join(", ")}.`);
        const steps = chosen.length === 1 ? phase.by : phase.eachBy;
        out.conditions = {};
        for (const slug of chosen) {
            for (let step = 0; step < steps; step++) if (actor.hasCondition?.(slug)) await actor.decreaseCondition(slug);
            out.conditions[slug] = Number(actor.getCondition?.(slug)?.value ?? 0);
        }
    }
    await say(caster, `<p><strong>${escapeHTML(data.spellName)}</strong>: ${escapeHTML(token.name)} consumes a gift (${benefit === "heal" ? `regains ${out.healed} Hit Points` : benefit === "affliction" ? `${escapeHTML(out.affliction.name)}: stage ${out.affliction.from} → ${out.affliction.to}` : Object.entries(out.conditions).map(([slug, value]) => `${slug} ${value}`).join(", ")}).</p>`);
    return out;
}
