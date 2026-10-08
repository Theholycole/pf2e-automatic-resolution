// Event lifetime: an outcome condition that lasts "for 1 round or until it
// Escapes" ends early when its bearer succeeds at an Escape check against the
// cast's snapshotted spell DC. PF2e posts Escape as an ordinary check with the
// `action:escape` roll option and no DC, so the module grades the roll against
// each candidate. A creature Escapes from one restraint at a time, so the GM
// confirms which matching Effect ends.
import { activeUsers, escapeHTML, DEGREES } from "./runtime-utils.js";

export const ESCAPE_MODULE_ID = "pf2e-automatic-resolution";

/** PF2e degree of success, including the natural 20/1 step. */
export function escapeDegree(total, natural, dc) {
    if (![total, dc].every(Number.isFinite)) return null;
    let index = total >= dc + 10 ? 3 : total >= dc ? 2 : total <= dc - 10 ? 0 : 1;
    if (natural === 20) index = Math.min(3, index + 1);
    else if (natural === 1) index = Math.max(0, index - 1);
    return DEGREES[index];
}

export function escapeCheck(message) {
    const context = message?.flags?.pf2e?.context;
    if (!Array.isArray(context?.options) || !context.options.includes("action:escape")) return null;
    const roll = message.rolls?.[0];
    const total = Number(roll?.total);
    if (!Number.isFinite(total)) return null;
    const natural = Number(roll?.dice?.[0]?.total ?? roll?.terms?.[0]?.total);
    return {
        total,
        natural: Number.isFinite(natural) ? natural : null,
        reroll: context.isReroll === true,
        actorUuid: context.origin?.actor ?? null,
        speakerActorId: message.speaker?.actor ?? null
    };
}

export function escapeMetadata(effect) {
    const outcome = effect?.flags?.[ESCAPE_MODULE_ID]?.outcomeEffect;
    const escape = outcome?.escape;
    return escape && Number.isFinite(Number(escape.dc)) ? { ...escape, dc: Number(escape.dc), outcome } : null;
}

/** Every Escape-terminable module Effect on the actor, graded against the check. */
export function gradeEscapeCandidates(effects, check) {
    return [...(effects ?? [])]
        .filter(effect => effect?.type === "effect" && !effect.isExpired)
        .map(effect => ({ effect, escape: escapeMetadata(effect) }))
        .filter(entry => entry.escape)
        .map(entry => ({ ...entry, degree: escapeDegree(check.total, check.natural, entry.escape.dc) }))
        .map(entry => ({ ...entry, escaped: ["success", "criticalSuccess"].includes(entry.degree) }));
}

function primaryGM() {
    return activeUsers().find(user => user.isGM) ?? null;
}

async function actorForCheck(check) {
    const fromOrigin = check.actorUuid ? await fromUuid(check.actorUuid) : null;
    return fromOrigin ?? (check.speakerActorId ? game.actors?.get(check.speakerActorId) : null) ?? null;
}

function cardContent(entries, check, actorName, status = {}) {
    const rows = entries.map(entry => {
        const done = status[entry.id];
        const button = done
            ? `<em>${escapeHTML(done)}</em>`
            : `<button type="button" class="pf2e-auto-escape-button" data-escape-action="end" data-entry-id="${escapeHTML(entry.id)}"><i class="fa-solid fa-link-slash"></i> End ${escapeHTML(entry.name)}</button>`;
        return `<li><strong>${escapeHTML(entry.name)}</strong> — Escape DC ${escapeHTML(entry.dc)}: ${escapeHTML(entry.degree === "criticalSuccess" ? "critical success" : "success")}<div>${button}</div></li>`;
    }).join("");
    return `<section class="pf2e-auto-runtime-card"><header><strong>Escape</strong></header>`
        + `<p>${escapeHTML(actorName)} rolled ${escapeHTML(check.total)}${check.natural == null ? "" : ` (natural ${escapeHTML(check.natural)})`} to Escape. `
        + `These spell restraints were beaten. A successful Escape frees the creature from one restraint; end the one it escaped.</p>`
        + `<ul class="pf2e-auto-runtime-effects">${rows}</ul></section>`;
}

/** Removes an Effect's grant of one condition (its GrantItem rule and the granted item) and its Escape; the rest of the Effect stays. */
export async function endGrantedCondition(effect, slug) {
    const actor = effect.actor;
    const granted = (actor?.itemTypes?.condition ?? []).filter(condition => condition.slug === slug && condition.flags?.pf2e?.grantedBy?.id === effect.id);
    const rules = (effect._source?.system?.rules ?? effect.system.rules).filter(rule => !(rule.key === "GrantItem" && /conditionitems/.test(rule.uuid ?? "")
        && fromUuidSync(rule.uuid)?.slug === slug));
    await effect.update({ "system.rules": rules, [`flags.${ESCAPE_MODULE_ID}.outcomeEffect.-=escape`]: null });
    if (granted.length) await actor.deleteEmbeddedDocuments("Item", granted.map(item => item.id)).catch(() => null);
    if (actor?.hasCondition?.(slug) && !granted.length) {
        const leftover = actor.itemTypes.condition.filter(condition => condition.slug === slug && condition.flags?.pf2e?.grantedBy?.id === effect.id);
        if (leftover.length) await actor.deleteEmbeddedDocuments("Item", leftover.map(item => item.id)).catch(() => null);
    }
    return { ended: slug };
}

export class EscapeTermination {
    /** Grade a new Escape check and ask the GM which beaten restraint ended. */
    async handleMessage(message) {
        if (primaryGM()?.id !== game.user?.id) return null;
        const check = escapeCheck(message);
        if (!check) return null;
        const actor = await actorForCheck(check);
        if (!actor) return null;
        if (check.reroll) await this.#supersede(actor.uuid, message.id);
        const graded = gradeEscapeCandidates(actor.items, check).filter(entry => entry.escaped);
        if (!graded.length) return null;
        // Status keys must be dot-free: Foundry expands dotted update paths.
        const entries = graded.map((entry, index) => ({
            id: `e${index}`,
            effectUuid: entry.effect.uuid,
            name: entry.effect.name,
            dc: entry.escape.dc,
            degree: entry.degree,
            castId: entry.escape.outcome?.castId ?? null
        }));
        return await ChatMessage.create({
            content: cardContent(entries, check, actor.name),
            whisper: game.users.filter(user => user.isGM).map(user => user.id),
            speaker: { alias: "Spell restraints" },
            flags: { [ESCAPE_MODULE_ID]: { escapeTermination: {
                checkMessageId: message.id, actorUuid: actor.uuid, actorName: actor.name, check, entries, status: {}
            } } }
        });
    }

    async #supersede(actorUuid, rerollMessageId) {
        for (const card of game.messages?.contents ?? []) {
            const data = card.flags?.[ESCAPE_MODULE_ID]?.escapeTermination;
            if (data?.actorUuid !== actorUuid || data.superseded) continue;
            const status = Object.fromEntries(data.entries.filter(entry => !data.status?.[entry.id])
                .map(entry => [entry.id, "Superseded by a reroll"]));
            await card.update({
                content: cardContent(data.entries, data.check, data.actorName ?? "The creature", { ...data.status, ...status }),
                [`flags.${ESCAPE_MODULE_ID}.escapeTermination.status`]: { ...data.status, ...status },
                [`flags.${ESCAPE_MODULE_ID}.escapeTermination.superseded`]: rerollMessageId
            });
        }
    }

    bind(message, root) {
        const data = message?.flags?.[ESCAPE_MODULE_ID]?.escapeTermination;
        if (!data) return;
        for (const button of root.querySelectorAll("button[data-escape-action='end']")) {
            if (button.dataset.escapeBound) continue;
            button.dataset.escapeBound = "true";
            button.addEventListener("click", async event => {
                event.preventDefault();
                button.disabled = true;
                try { await this.end(message, button.dataset.entryId); }
                catch (error) {
                    button.disabled = false;
                    ui.notifications?.error(`PF2e Automatic Resolution | ${error.message}`);
                }
            });
        }
    }

    /** Re-grade at click time: the Effect, its DC and the check must still agree. */
    async end(message, entryId) {
        if (!game.user?.isGM) throw new Error("Only a GM can end a spell restraint.");
        message = game.messages?.get(message?.id) ?? message;
        const data = message.flags?.[ESCAPE_MODULE_ID]?.escapeTermination;
        const entry = data?.entries?.find(candidate => candidate.id === entryId);
        if (!entry || data.status?.[entryId]) throw new Error("This Escape choice is no longer available.");
        const effectUuid = entry.effectUuid;
        const effect = await fromUuid(effectUuid);
        const escape = escapeMetadata(effect);
        const status = { ...(data.status ?? {}) };
        if (!effect || !escape) status[entryId] = "Already ended";
        else {
            if (effect.actor?.uuid !== data.actorUuid || escape.dc !== entry.dc
                || !["success", "criticalSuccess"].includes(escapeDegree(data.check.total, data.check.natural, escape.dc))) {
                throw new Error(`${effect.name} changed after this Escape check. Review it manually.`);
            }
            // "It can attempt to Escape": when the text ends only one condition, that grant goes and the Effect stays (no longer escapable).
            if (escape.endsOnly) {
                await endGrantedCondition(effect, escape.endsOnly);
                status[entryId] = `Escaped: ${escape.endsOnly} ended`;
                await message.update({ content: cardContent(data.entries, data.check, data.actorName ?? effect?.actor?.name ?? "The creature", status),
                    [`flags.${ESCAPE_MODULE_ID}.escapeTermination.status`]: status });
                return status[entryId];
            }
            const actor = effect.actor;
            await effect.delete({ [ESCAPE_MODULE_ID]: { reason: "escaped" } });
            status[entryId] = "Ended by Escape";
            // "A creature that Escapes after being impaled takes 3 bleed damage": that persistent damage on the creature (PF2e's roll).
            if (escape.damage && actor) {
                const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
                const roll = await new DamageRoll(`(${escape.damage.formula})[persistent,${escape.damage.type}]`).evaluate();
                await actor.applyDamage({ damage: roll, token: actor.getActiveTokens?.(true, true)?.[0] ?? undefined, skipIWR: false });
                status[entryId] = `Ended by Escape; ${escape.damage.formula} persistent ${escape.damage.type} damage`;
            }
            // A creature escapes one restraint per check. Escape-ended Effects of the same cast on this creature are that one
            // restraint ("Creatures can attempt to Escape to remove these effects."), so they end together.
            for (const other of data.entries) {
                if (status[other.id]) continue;
                const sibling = entry.castId && other.castId === entry.castId ? await fromUuid(other.effectUuid) : null;
                if (sibling && escapeMetadata(sibling) && sibling.actor?.uuid === data.actorUuid) {
                    await sibling.delete({ [ESCAPE_MODULE_ID]: { reason: "escaped" } });
                    status[other.id] = "Ended by Escape (same spell)";
                } else status[other.id] = "Not chosen";
            }
        }
        await message.update({
            content: cardContent(data.entries, data.check, data.actorName ?? effect?.actor?.name ?? "The creature", status),
            [`flags.${ESCAPE_MODULE_ID}.escapeTermination.status`]: status
        });
        return status[entryId];
    }
}
