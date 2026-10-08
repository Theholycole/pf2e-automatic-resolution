// Strike spells carried by caster Effects. On cast, the "before" Effects are created on the caster (they change the
// Strike the way PF2e models the spell). The caster then makes the Strike with PF2e. Once that Strike is resolved
// (its damage roll, or its attack roll when it misses), a one-Strike Effect is removed and the "after" Effects are
// created ("After the attack, regardless of the result"), so they don't add to the first Strike's own damage.
import { loadNativeEffectTemplate, prepareNativeEffectSource, createNativeEffect } from "./native-outcome-effects.js";
import { isExecutableStrikeEffectsPlan } from "./strike-effects-core.js";
import { MODULE_ID, escapeHTML, isLeadGM } from "./runtime-utils.js";

const PENDING = "pendingStrikeEffects";

/** The effect source with the cast's origin (the spell at its cast rank, so heightened rules apply). */
function effectSource(template, { spell, castRank, castId, sourceActor, plan, phase, removeAfterStrike }) {
    const source = prepareNativeEffectSource(template, { castInstanceId: castId, castRank, sourceActorUuid: sourceActor.uuid,
        sourceItemUuid: spell?.uuid ?? null, sourceItemName: plan.source.name, resolutionKind: "strike-effects", compilerVersion: plan.compilerVersion });
    const origin = typeof spell?.getOriginData === "function" ? spell.getOriginData() : null;
    source.system.context = { ...(source.system.context ?? {}), origin: { ...(source.system.context?.origin ?? {}), ...(origin ?? {}),
        actor: sourceActor.uuid, item: spell?.uuid ?? null }, target: { actor: sourceActor.uuid, token: null }, roll: null };
    source.flags[MODULE_ID].strikeEffect = { castId, phase, removeAfterStrike };
    return source;
}

export class StrikeEffectsRuntime {
    supports(plan) { return isExecutableStrikeEffectsPlan(plan); }

    /** Creates the before-phase Effects on the caster and records the rest for the caster's next Strike. */
    async start(spell, plan, { sourceActor = spell?.actor, castRank = spell?.rank, sourceMessageId = null, selections = null } = {}) {
        if (!this.supports(plan)) throw new Error(`${plan?.source?.name ?? "Spell"} is not an executable Strike spell.`);
        if (!sourceActor) throw new Error("The caster could not be resolved.");
        if (!game.user.isGM && !sourceActor.isOwner) throw new Error(`You don't own ${sourceActor.name}.`);
        const castId = foundry.utils.randomID();
        const created = [];
        const pending = [];
        for (const application of plan.resolution.applications) {
            if (application.phase === "after") { pending.push({ castId, uuid: application.uuid, spellUuid: spell?.uuid ?? null, castRank, plan: { source: plan.source, compilerVersion: plan.compilerVersion } }); continue; }
            const template = await loadNativeEffectTemplate(application.uuid);
            const source = effectSource(template, { spell, castRank, castId, sourceActor, plan, phase: "before", removeAfterStrike: application.removeAfterStrike });
            // Choices already made (e.g. by a macro): PF2e's ChoiceSet uses them instead of prompting.
            for (const rule of source.system.rules ?? []) if (rule.key === "ChoiceSet" && rule.flag && selections?.[rule.flag] != null) rule.selection = selections[rule.flag];
            created.push(await createNativeEffect(sourceActor, source));
        }
        if (pending.length) await sourceActor.setFlag(MODULE_ID, PENDING, [...(sourceActor.getFlag(MODULE_ID, PENDING) ?? []), ...pending]);
        const after = plan.resolution.applications.filter(application => application.phase === "after");
        const message = await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
            content: `<section class="pf2e-auto-runtime-card"><h3>${escapeHTML(plan.source.name)} — Strike</h3>
                <p class="pf2e-auto-gm-reminder"><strong>Strike:</strong> ${escapeHTML(plan.resolution.strike.sourceText)} <em>Make it with PF2e's own Strike; the Effects below change it.</em></p>
                <p>Applied to ${escapeHTML(sourceActor.name)}: ${created.map(effect => `<strong>${escapeHTML(effect.name)}</strong>`).join(", ") || "none"}.</p>
                ${after.length ? `<p>After the Strike's attack roll: ${after.map(application => escapeHTML(application.label ?? application.uuid.split(".").pop())).join(", ")}.</p>` : ""}</section>`,
            flags: { [MODULE_ID]: { kind: "strike-effects", castId } } });
        if (sourceMessageId) await game.messages.get(sourceMessageId)?.setFlag(MODULE_ID, "resolvedCast", { castInstanceId: castId, resolutionKind: "strike-effects" }).catch(() => {});
        return { status: "applied", castId, created, message };
    }
}

/** Watches the caster's Strikes: when one is resolved, one-Strike Effects end and after-phase Effects begin. */
export function registerStrikeEffects() {
    Hooks.on("createChatMessage", message => {
        const context = message?.flags?.pf2e?.context;
        const domains = context?.domains ?? [];
        if (!isLeadGM() || !context) return;
        const actor = message.actor;
        if (!actor) return;
        // The Strike is resolved by its damage roll, or by its attack roll when it misses (there's no damage roll).
        const missed = context.type === "attack-roll" && domains.includes("strike-attack-roll") && ["failure", "criticalFailure"].includes(context.outcome);
        const damaged = context.type === "damage-roll" && message.flags.pf2e.strike && domains.includes("strike-damage");
        if (missed || damaged) strikeResolved(actor).catch(error => console.error(`${MODULE_ID} | Strike spell Effects could not be updated.`, error));
    });
}

/** "After the attack": the one-Strike Effects end and the after-phase Effects begin. */
async function strikeResolved(actor) {
    await removeOneStrikeEffects(actor);
    const pending = actor.getFlag(MODULE_ID, PENDING) ?? [];
    if (!pending.length) return;
    await actor.unsetFlag(MODULE_ID, PENDING);
    for (const entry of pending) {
        const template = await loadNativeEffectTemplate(entry.uuid);
        const spell = entry.spellUuid ? await fromUuid(entry.spellUuid) : null;
        await createNativeEffect(actor, effectSource(template, { spell, castRank: entry.castRank, castId: entry.castId, sourceActor: actor, plan: entry.plan, phase: "after", removeAfterStrike: false }));
    }
}

async function removeOneStrikeEffects(actor) {
    const ended = [...(actor.itemTypes?.effect ?? [])].filter(effect => effect.flags?.[MODULE_ID]?.strikeEffect?.removeAfterStrike === true);
    if (ended.length) await actor.deleteEmbeddedDocuments("Item", ended.map(effect => effect.id), { [MODULE_ID]: { reason: "strike-resolved" } });
}
