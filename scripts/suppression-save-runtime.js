// An ally's save to suppress an effect (Rude Awakening, PF2e 8.6; the user's option A, 2026-10-16): the card's button — the GM picks the emotion effect or the
// condition and types its DC; the module rolls the save with the spell's bonus; on a success the condition (or the effect, or the Effect granting the condition)
// is removed and kept on the spell's bonus Effect, and put back when that Effect ends, if it would still apply — an effect with time left, frightened lowered by
// the rounds gone by, stupefied as it was.
import { MODULE_ID, activeGM as leadGM } from "./runtime-utils.js";

const escapeHTML = value => foundry.utils.escapeHTML?.(String(value ?? "")) ?? String(value ?? "");
const FLAG = "suppressionSave";

/** What the creature has that the spell can suppress: [{value, label, kind, id}]. */
export function suppressionCandidates(effect) {
    const data = effect?.getFlag?.(MODULE_ID, FLAG), actor = effect?.actor;
    if (!data || !actor) return [];
    const conditions = (actor.itemTypes?.condition ?? []).filter(condition => data.against.conditions.includes(condition.slug))
        .map(condition => ({ value: `condition:${condition.id}`, label: `${condition.name}${condition.flags?.pf2e?.grantedBy?.id ? ` (from ${actor.items.get(condition.flags.pf2e.grantedBy.id)?.name ?? "an effect"})` : ""}`, kind: "condition", id: condition.id }));
    const effects = (actor.itemTypes?.effect ?? []).filter(entry => entry.id !== effect.id && (entry.system?.traits?.value ?? []).some(trait => data.against.traits.includes(trait)))
        .map(entry => ({ value: `effect:${entry.id}`, label: entry.name, kind: "effect", id: entry.id }));
    return [...conditions, ...effects];
}

/** The card's button: the save against the picked effect or condition at the given DC (asked when not given); {degree, suppressed} or {cancelled}. */
export async function suppressionSave(effect, { choice = null, dc = null } = {}) {
    const data = effect?.getFlag?.(MODULE_ID, FLAG), actor = effect?.actor;
    if (!data || !actor) throw new Error("This Effect suppresses nothing.");
    if (data.used) throw new Error(`${data.spellName}: the save was already attempted.`);
    const candidates = suppressionCandidates(effect);
    if (!candidates.length) throw new Error(`${actor.name} has no ${data.against.traits.join(" or ")} effect, ${data.against.conditions.join(" or ")} to suppress.`);
    let picked = choice, value = dc;
    if (!picked || !Number.isFinite(Number(value))) {
        const answer = await foundry.applications.api.DialogV2.prompt({ window: { title: `${data.spellName} — suppress` }, rejectClose: false,
            content: `<p>${escapeHTML(actor.name)} attempts a ${escapeHTML(data.statistic)} save (+${data.bonus.value} ${escapeHTML(data.bonus.type)}) against:</p>`
                + `<select name="choice">${candidates.map(entry => `<option value="${escapeHTML(entry.value)}">${escapeHTML(entry.label)}</option>`).join("")}</select>`
                + `<label>Its DC <input type="number" name="dc" min="1" max="99" value="${escapeHTML(value ?? "")}"></label>`,
            ok: { label: "Roll", callback: (_event, button) => ({ choice: button.form.elements.choice.value, dc: Number(button.form.elements.dc.value) }) } });
        if (!answer || !Number.isFinite(answer.dc) || answer.dc <= 0) return { cancelled: true };
        picked = answer.choice; value = answer.dc;
    }
    const target = candidates.find(entry => entry.value === picked || entry.id === picked);
    if (!target) throw new Error(`${data.spellName}: pick one of ${candidates.map(entry => entry.label).join(", ")}.`);
    const Modifier = game.pf2e?.Modifier;
    const roll = await actor.saves?.[data.statistic]?.roll({ dc: { value: Number(value) }, skipDialog: true,
        modifiers: Modifier ? [new Modifier({ slug: "suppression-save", label: data.spellName, modifier: data.bonus.value, type: data.bonus.type })] : [] });
    const degree = Number(roll?.degreeOfSuccess ?? -1);
    let suppressed = null;
    if (degree >= 2) {
        const condition = target.kind === "condition" ? actor.items.get(target.id) : null;
        // (A condition an Effect grants: that Effect is suppressed — "suppressing the effect or condition".)
        const holder = condition?.flags?.pf2e?.grantedBy?.id ? actor.items.get(condition.flags.pf2e.grantedBy.id) : target.kind === "effect" ? actor.items.get(target.id) : null;
        if (holder) {
            const remaining = Number(holder.remainingDuration?.remaining ?? Infinity);
            suppressed = { kind: "effect", name: holder.name, source: holder.toObject(), remaining: Number.isFinite(remaining) ? remaining : null, at: game.time.worldTime };
            await holder.delete({ [MODULE_ID]: { suppressed: true } });
        } else if (condition) {
            suppressed = { kind: "condition", name: condition.name, slug: condition.slug, value: Number(condition.value ?? 1), at: game.time.worldTime };
            await condition.delete({ [MODULE_ID]: { suppressed: true } });
        }
    }
    await effect.setFlag(MODULE_ID, FLAG, { ...data, used: true, suppressed });
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(data.spellName)}</strong>: ${escapeHTML(actor.name)} ${degree >= 2
        ? `suppresses ${escapeHTML(suppressed?.name ?? target.label)} for the spell's duration.` : `fails to suppress ${escapeHTML(target.label)}.`}</p>` }); } catch (_) {}
    return { degree, suppressed: suppressed ? { kind: suppressed.kind, name: suppressed.name } : null };
}

/** deleteItem: the spell's bonus Effect ended — what it suppressed comes back, if it would still apply (the active GM). */
export async function suppressionEnded(item, options = {}) {
    const data = item?.flags?.[MODULE_ID]?.[FLAG];
    const kept = data?.suppressed, actor = item?.actor;
    if (!leadGM() || !kept || !actor || options?.[MODULE_ID]?.ongoingCleanup) return null;
    const elapsed = Math.max(0, Number(game.time.worldTime) - Number(kept.at ?? game.time.worldTime));
    let back = null;
    if (kept.kind === "effect") {
        const left = kept.remaining == null ? null : kept.remaining - elapsed;
        if (left == null || left > 0) {
            const source = foundry.utils.deepClone(kept.source); delete source._id;
            if (left != null) source.system.duration = { ...(source.system.duration ?? {}), value: Math.max(1, Math.ceil(left / 6)), unit: "rounds", expiry: source.system.duration?.expiry ?? "turn-start" };
            source.system.start = { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null };
            const [made] = await actor.createEmbeddedDocuments("Item", [source]);
            back = made ? `${made.name}${left != null ? ` (${Math.ceil(left / 6)} rounds left)` : ""}` : null;
        }
    } else if (kept.kind === "condition") {
        // (Frightened lowers by 1 at the end of each of its turns: the rounds gone by taken off; stupefied stays as it was.)
        const value = kept.slug === "frightened" ? kept.value - Math.floor(elapsed / 6) : kept.value;
        if (value > 0) {
            await actor.increaseCondition(kept.slug, { value });
            back = `${kept.name.replace(/\s+\d+$/, "")} ${value}`;
        }
    }
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(data.spellName)}</strong> ends: ${back ? `${escapeHTML(back)} returns.` : `${escapeHTML(kept.name)} would no longer apply.`}</p>` }); } catch (_) {}
    return back;
}
