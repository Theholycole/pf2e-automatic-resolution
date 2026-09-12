import { compileAbility } from "../src/compiler/index.js";
import {
    effectForApplication,
    recipientActorType,
    selectApplications,
    SUPPORTED_RESOLUTION_KINDS
} from "./runtime-core.js";
import { NativeEffectCatalog } from "./native-effect-catalog.js";
import {
    activeUsers,
    actorFromTarget,
    clone,
    confirmAction,
    escapeHTML,
    randomID
} from "./runtime-utils.js";
import { debugError, debugLog } from "./debug.js";

export const MODULE_ID = "pf2e-automatic-resolution";
const RUNTIME_SCHEMA = 1;

function uniqueActors(values) {
    const entries = Array.isArray(values) ? values : [...(values ?? [])];
    return [...new Map(entries.map(actorFromTarget).filter(Boolean).map(actor => [actor.uuid, actor])).values()];
}

function itemSource(itemOrSource) {
    if (itemOrSource?.toObject) {
        const source = itemOrSource.toObject();
        source.uuid ??= itemOrSource.uuid ?? null;
        return source;
    }
    return clone(itemOrSource);
}

function sourceName(itemOrSource) {
    return itemOrSource?.name ?? "Ability";
}

function effectFlag(effect) {
    return effect?.flags?.[MODULE_ID]?.runtime ?? null;
}

function isAutomationLeader() {
    const users = activeUsers();
    const activeGMs = users.filter(user => user.isGM);
    const leader = activeGMs[0] ?? users[0] ?? null;
    return !leader || leader.id === game.user.id;
}

async function promptChoice(plan) {
    const selector = plan.resolution.selector;
    const options = selector.branches.map(branch =>
        `<option value="${escapeHTML(branch.choiceId)}">${escapeHTML(branch.label)}</option>`).join("");
    return await foundry.applications.api.DialogV2.prompt({
        window: { title: `${sourceName(plan.source)} — Choose Effect` },
        content: `<p>Choose exactly one form. Closing this dialog applies nothing.</p><select name="effectChoice" style="width:100%">${options}</select>`,
        ok: {
            label: "Continue",
            callback: (_event, button) => button.form.elements.effectChoice.value
        },
        rejectClose: false,
        modal: true
    });
}

function allRuntimeActors() {
    const world = game.actors?.contents ?? [...(game.actors ?? [])];
    const synthetic = globalThis.canvas?.tokens?.placeables?.map(token => token.actor).filter(Boolean) ?? [];
    return uniqueActors([...world, ...synthetic]);
}

export class EffectRuntime {
    #catalog = new NativeEffectCatalog();
    #completedTransitions = new Set();
    #transitionJobs = new Map();

    get supportedResolutionKinds() {
        return [...SUPPORTED_RESOLUTION_KINDS];
    }

    async compile(itemOrSource, { sourceFile = null } = {}) {
        const nativeEffectCatalog = await this.#catalog.get();
        return compileAbility(itemSource(itemOrSource), { sourceFile, nativeEffectCatalog });
    }

    async refreshCatalog() {
        return await this.#catalog.get({ refresh: true });
    }

    async execute(itemOrSource, options = {}) {
        const sourceActor = options.sourceActor ?? itemOrSource?.actor ?? null;
        if (!sourceActor) throw new Error("The source actor could not be resolved.");
        const plan = options.plan ?? await this.compile(options.baseSource ?? itemOrSource);
        if (!SUPPORTED_RESOLUTION_KINDS.includes(plan.resolution?.kind)) {
            throw new Error(`${plan.source.name}: ${plan.resolution?.kind ?? "unknown"} is not one of the completed runtime paths.`);
        }
        if (options.sourceMessageId && !options.force) {
            const prior = game.messages.get(options.sourceMessageId)?.getFlag(MODULE_ID, "resolvedCast");
            if (prior) throw new Error(`${plan.source.name}: this spell card has already been resolved.`);
        }

        const castRank = Number(options.castRank ?? itemOrSource?.rank ?? plan.rank);
        let choiceId = options.choiceId ?? null;
        if (plan.resolution.kind === "effect-choice" && !choiceId) {
            choiceId = await promptChoice(plan);
            if (!choiceId) return { status: "cancelled", plan };
        }
        const application = selectApplications(plan, { castRank, choiceId })[0];
        const effect = effectForApplication(plan, application);
        const sequence = this.#sequenceMetadata(plan, application);
        const recipientType = recipientActorType(effect, castRank);
        const actors = recipientType === "source"
            ? [sourceActor]
            : recipientType === "target"
                ? uniqueActors(options.targets ?? [...game.user.targets])
                : [];
        if (actors.length === 0) {
            throw new Error(`${plan.source.name}: select at least one target token before resolving this Effect.`);
        }
        for (const actor of actors) {
            if (!actor.canUserModify?.(game.user, "update") && !game.user.isGM) {
                throw new Error(`You do not have permission to apply an Effect to ${actor.name}.`);
            }
        }
        const blockedActors = sequence?.reapplication?.blockedWhileSuccessorActive
            ? actors.filter(actor => this.#hasSequenceBlocker(actor, sequence))
            : [];
        if (blockedActors.length > 0) {
            const message = `${plan.source.name} cannot be applied while ${sequence.successor.label} is active on ${blockedActors.map(actor => actor.name).join(", ")}.`;
            globalThis.ui?.notifications?.warn(message);
            Hooks.callAll(`${MODULE_ID}.blocked`, {
                plan,
                actors: blockedActors,
                reason: "successor-active",
                sequence
            });
            return { status: "blocked", reason: "successor-active", plan, actors: blockedActors };
        }

        const template = await this.#loadTemplate(effect.uuid);
        const warning = plan.automation.level === "guided"
            ? `<p class="warning"><strong>Guided:</strong> ${escapeHTML(plan.automation.pendingCapabilities.join(", "))}</p>`
            : "";
        const confirmed = options.skipConfirmation === true || await confirmAction({
            title: `${plan.source.name} — Apply Effect`,
            content: `${warning}<p>Apply <strong>${escapeHTML(template.name)}</strong> to ${actors.map(actor => `<strong>${escapeHTML(actor.name)}</strong>`).join(", ")}?</p>`,
            label: "Apply Effect"
        });
        if (!confirmed) return { status: "cancelled", plan };

        const castInstanceId = options.castInstanceId ?? randomID();
        debugLog(castInstanceId, "native Effect application prepared", {
            spell: plan.source.name,
            resolutionKind: plan.resolution.kind,
            castRank,
            selectedEffect: { name: template.name, uuid: effect.uuid },
            sourceActorUuid: sourceActor.uuid,
            recipients: actors.map(actor => ({ name: actor.name, actorUuid: actor.uuid }))
        });
        const termination = (plan.nativeEffects.terminations ?? [])
            .find(candidate => candidate.id === application.terminationId) ?? null;
        const created = [];
        try {
            for (const actor of actors) {
                const effectDocument = await this.#createEffect(actor, template, {
                    castInstanceId,
                    castRank,
                    sourceActorUuid: sourceActor.uuid,
                    sourceItemUuid: itemOrSource?.uuid ?? plan.source.uuid ?? null,
                    sourceItemName: plan.source.name,
                    resolutionKind: plan.resolution.kind,
                    compilerVersion: plan.compilerVersion,
                    termination,
                    sequence
                });
                created.push(effectDocument);
                debugLog(castInstanceId, "native Effect applied", {
                    actorUuid: actor.uuid,
                    effect: { name: effectDocument.name, uuid: effectDocument.uuid }
                });
            }
        } catch (error) {
            debugError(castInstanceId, "native Effect application failed", error, {
                created: created.map(effectDocument => effectDocument.uuid)
            });
            await Promise.allSettled(created.map(effectDocument => effectDocument.delete({
                [MODULE_ID]: { skipSequence: true, skipCascade: true, reason: "rollback" }
            })));
            throw error;
        }

        if (options.sourceMessageId) {
            try {
                await game.messages.get(options.sourceMessageId)?.setFlag(MODULE_ID, "resolvedCast", {
                    castInstanceId,
                    resolutionKind: plan.resolution.kind,
                    effectUuid: effect.uuid
                });
            } catch (error) {
                console.warn(`${MODULE_ID} | Effects were applied, but the source chat card could not be marked as resolved.`, error);
            }
        }
        let receipt = null;
        try {
            receipt = await this.#postReceipt({ plan, sourceActor, created, castInstanceId, sequence });
        } catch (error) {
            console.warn(`${MODULE_ID} | Effects were applied, but the resolution receipt could not be posted.`, error);
        }
        Hooks.callAll(`${MODULE_ID}.resolved`, { plan, created, castInstanceId, receipt });
        debugLog(castInstanceId, "native Effect resolution completed", {
            created: created.map(effectDocument => ({
                name: effectDocument.name,
                uuid: effectDocument.uuid,
                actorUuid: effectDocument.actor?.uuid ?? null
            })),
            receiptId: receipt?.id ?? null
        });
        return { status: "applied", plan, created, castInstanceId, receipt };
    }

    async dismiss(effectDocument, { skipConfirmation = false } = {}) {
        const runtime = effectFlag(effectDocument);
        const termination = runtime?.termination;
        if (!termination) throw new Error(`${effectDocument?.name ?? "This Effect"} has no compiled Dismiss transition.`);
        const cost = termination.action.cost.type === "free-action"
            ? `triggered free action (${termination.action.trigger?.damageType ?? termination.action.trigger?.event})`
            : "one action";
        const confirmed = skipConfirmation || await confirmAction({
            title: `${effectDocument.name} — Dismiss`,
            content: `<p>Use ${escapeHTML(cost)} to Dismiss <strong>${escapeHTML(effectDocument.name)}</strong>?</p>`,
            label: "Dismiss"
        });
        if (!confirmed) return { status: "cancelled" };
        debugLog(runtime.castInstanceId, "Dismiss confirmed", {
            effectUuid: effectDocument.uuid,
            actorUuid: effectDocument.actor?.uuid ?? null,
            scope: termination.scope
        });
        await effectDocument.delete({ [MODULE_ID]: { reason: "dismissed" } });
        return { status: "dismissed" };
    }

    async triggerActionUsed(actor, actionUuid) {
        const matches = actor?.items?.filter(effectDocument => {
            const sequence = effectFlag(effectDocument)?.sequence;
            return sequence?.transition?.event === "action-used"
                && sequence.transition.actionUuid === actionUuid;
        }) ?? [];
        return await Promise.all(matches.map(effectDocument =>
            this.#completeSequence(effectDocument, "action-used")));
    }

    async handleActionMessage(message) {
        if (!isAutomationLeader()) return;
        let item = null;
        try { item = message.item ?? null; } catch (_) {}
        const actor = message.actor ?? actorFromTarget(message.token) ?? null;
        if (!actor) return;
        const candidates = new Set([
            item?.uuid,
            message.flags?.pf2e?.origin?.uuid,
            message.flags?.pf2e?.origin?.item,
            message.content?.match(/data-item-uuid=["']([^"']+)["']/i)?.[1]
        ].filter(Boolean));
        for (const effectDocument of actor.items ?? []) {
            const transition = effectFlag(effectDocument)?.sequence?.transition;
            if (transition?.event !== "action-used") continue;
            const labelMatches = item?.name && transition.actionLabel === item.name;
            if (candidates.has(transition.actionUuid) || labelMatches) {
                await this.#completeSequence(effectDocument, "action-used");
            }
        }
    }

    async handleDeletedEffect(effectDocument, options = {}) {
        if (!isAutomationLeader()) return;
        const runtime = effectFlag(effectDocument);
        if (!runtime || options?.[MODULE_ID]?.skipCascade) return;

        if (runtime.termination?.scope === "cast-instance") {
            const siblings = allRuntimeActors().flatMap(actor => actor.items?.filter(item =>
                item.uuid !== effectDocument.uuid
                && effectFlag(item)?.castInstanceId === runtime.castInstanceId) ?? []);
            await Promise.allSettled(siblings.map(item => item.delete({
                [MODULE_ID]: { skipSequence: true, skipCascade: true, reason: "cast-ended" }
            })));
        }
        if (!options?.[MODULE_ID]?.skipSequence
            && runtime.sequence?.transition?.event === "effect-ended") {
            await this.#completeSequence(effectDocument, "effect-ended");
        }
    }

    async handleUpdatedEffect(effectDocument) {
        if (!isAutomationLeader() || !effectFlag(effectDocument)) return;
        const expired = effectDocument.system?.expired === true
            || effectDocument.isExpired === true
            || effectDocument.remainingDuration?.expired === true;
        if (!expired) return;
        const runtime = effectFlag(effectDocument);
        if (runtime.termination?.scope === "cast-instance") {
            await this.handleDeletedEffect(effectDocument, { [MODULE_ID]: { skipSequence: true } });
        }
        if (runtime.sequence?.transition?.event === "effect-ended") {
            await this.#completeSequence(effectDocument, "effect-ended");
        }
    }

    async handleReceiptAction(button) {
        const actor = await fromUuid(button.dataset.actorUuid);
        const effectDocument = actor?.items?.get(button.dataset.effectId) ?? null;
        if (!effectDocument) throw new Error("The Effect is no longer present on the actor.");
        if (button.dataset.runtimeAction === "dismiss") return await this.dismiss(effectDocument);
        if (button.dataset.runtimeAction === "sequence") return await this.#completeSequence(effectDocument, "action-used");
        throw new Error(`Unknown runtime action ${JSON.stringify(button.dataset.runtimeAction)}.`);
    }

    #sequenceMetadata(plan, application) {
        if (plan.resolution.kind !== "effect-sequence") return null;
        const sequence = plan.nativeEffects.sequences.find(candidate => candidate.id === plan.resolution.sequenceId);
        const successorApplication = plan.resolution.applications[1];
        const successor = plan.nativeEffects.deferred.find(effect => effect.uuid === successorApplication.uuid);
        return {
            id: sequence.id,
            transition: sequence.transition,
            reapplication: sequence.reapplication,
            successor: { uuid: successor.uuid, label: successor.label, reference: successor.reference },
            primaryApplicationUuid: application.uuid
        };
    }

    #hasSequenceBlocker(actor, sequence) {
        const blockerUuid = sequence.reapplication?.blockerEffectUuid;
        return actor.items?.some?.(item => {
            const runtime = effectFlag(item);
            if (runtime?.completedSequenceId === sequence.id) return true;
            const sources = [
                item.sourceId,
                item._stats?.compendiumSource,
                item._stats?.duplicateSource,
                item.flags?.core?.sourceId
            ];
            return sources.includes(blockerUuid);
        }) ?? false;
    }

    async #loadTemplate(uuid) {
        let template = null;
        try { template = await fromUuid(uuid); } catch (_) {}
        if (!template && /^Compendium\./i.test(uuid)) {
            const source = uuid.replace(/^Compendium\./i, "");
            const marker = ".Item.";
            const index = source.lastIndexOf(marker);
            if (index > 0) {
                const pack = game.packs.get(source.slice(0, index));
                const reference = source.slice(index + marker.length);
                if (pack) {
                    try { template = await pack.getDocument(reference); } catch (_) {}
                    if (!template) {
                        const packIndex = await pack.getIndex({ fields: ["name"] });
                        const entry = packIndex.find(candidate => candidate.name === reference);
                        if (entry) template = await pack.getDocument(entry._id);
                    }
                }
            }
        }
        if (!template || !(template.type === "effect" || template.isOfType?.("effect"))) {
            throw new Error(`Could not resolve native PF2e Effect ${uuid}.`);
        }
        return template;
    }

    async #createEffect(actor, template, runtime) {
        const source = clone(template.toObject());
        delete source._id;
        delete source.folder;
        delete source.sort;
        delete source.ownership;
        source._stats ??= {};
        source._stats.compendiumSource ??= template._stats?.compendiumSource ?? template.uuid;
        source._stats.duplicateSource = template.uuid;
        if (source.system?.level && Number.isFinite(runtime.castRank)) {
            source.system.level.value = runtime.castRank;
        }
        source.flags ??= {};
        source.flags[MODULE_ID] = {
            ...source.flags[MODULE_ID],
            runtime: {
                schema: RUNTIME_SCHEMA,
                ...clone(runtime)
            }
        };
        const [created] = await actor.createEmbeddedDocuments("Item", [source], { keepId: false });
        if (!created) throw new Error(`${actor.name}: PF2e did not create ${template.name}.`);
        return created;
    }

    async #completeSequence(effectDocument, event) {
        const runtime = effectFlag(effectDocument);
        const sequence = runtime?.sequence;
        if (!sequence || sequence.transition?.event !== event) return { status: "not-applicable" };
        const key = `${runtime.castInstanceId}:${sequence.id}`;
        if (this.#completedTransitions.has(key)) return { status: "already-completed" };
        if (this.#transitionJobs.has(key)) return await this.#transitionJobs.get(key);

        const job = (async () => {
            const actor = effectDocument.actor;
            if (!actor) throw new Error("The sequence recipient actor is unavailable.");
            const existing = actor.items?.find?.(item => {
                const state = effectFlag(item);
                return state?.castInstanceId === runtime.castInstanceId
                    && state?.completedSequenceId === sequence.id;
            });
            if (existing) {
                this.#completedTransitions.add(key);
                return { status: "already-completed", created: existing };
            }
            const template = await this.#loadTemplate(sequence.successor.uuid);
            const confirmed = await confirmAction({
                title: `${runtime.sourceItemName} — Follow-up Effect`,
                content: `<p>${escapeHTML(event === "action-used" ? sequence.transition.actionLabel : "The primary Effect ended")}.</p><p>Apply <strong>${escapeHTML(template.name)}</strong> to <strong>${escapeHTML(actor.name)}</strong>?</p>`,
                label: "Apply Follow-up"
            });
            if (!confirmed) return { status: "cancelled" };
            if (event === "action-used" && actor.items.get(effectDocument.id)) {
                await effectDocument.delete({
                    [MODULE_ID]: { skipSequence: true, reason: "action-used" }
                });
            }
            const successor = await this.#createEffect(actor, template, {
                castInstanceId: runtime.castInstanceId,
                castRank: runtime.castRank,
                sourceActorUuid: runtime.sourceActorUuid,
                sourceItemUuid: runtime.sourceItemUuid,
                sourceItemName: runtime.sourceItemName,
                resolutionKind: "effect-sequence-successor",
                compilerVersion: runtime.compilerVersion,
                completedSequenceId: sequence.id,
                termination: null,
                sequence: null
            });
            debugLog(runtime.castInstanceId, "Effect sequence completed", {
                event,
                sequenceId: sequence.id,
                actorUuid: actor.uuid,
                successor: { name: successor.name, uuid: successor.uuid }
            });
            this.#completedTransitions.add(key);
            try {
                await this.#postSimpleReceipt(runtime.sourceItemName, actor, successor, runtime.castInstanceId);
            } catch (error) {
                console.warn(`${MODULE_ID} | The follow-up Effect was applied, but its receipt could not be posted.`, error);
            }
            return { status: "applied", created: successor };
        })();
        this.#transitionJobs.set(key, job);
        try { return await job; }
        finally { this.#transitionJobs.delete(key); }
    }

    async #postReceipt({ plan, sourceActor, created, castInstanceId, sequence }) {
        const controls = created.flatMap(effectDocument => {
            const runtime = effectFlag(effectDocument);
            const buttons = [];
            if (runtime?.termination) {
                buttons.push(`<button type="button" class="pf2e-auto-runtime-button" data-runtime-action="dismiss" data-actor-uuid="${escapeHTML(effectDocument.actor.uuid)}" data-effect-id="${escapeHTML(effectDocument.id)}"><i class="fa-solid fa-xmark"></i> Dismiss ${escapeHTML(effectDocument.name)}</button>`);
            }
            if (sequence?.transition?.event === "action-used") {
                buttons.push(`<button type="button" class="pf2e-auto-runtime-button" data-runtime-action="sequence" data-actor-uuid="${escapeHTML(effectDocument.actor.uuid)}" data-effect-id="${escapeHTML(effectDocument.id)}"><i class="fa-solid fa-shield"></i> ${escapeHTML(sequence.transition.actionLabel)} Used</button>`);
            }
            return buttons;
        }).join("");
        const content = `<section class="pf2e-auto-runtime-card"><header><strong>${escapeHTML(plan.source.name)}</strong></header><p>Applied the selected official PF2e Effect:</p><ul class="pf2e-auto-runtime-effects">${created.map(effectDocument => `<li>${escapeHTML(effectDocument.name)} → ${escapeHTML(effectDocument.actor.name)}</li>`).join("")}</ul>${controls ? `<div class="pf2e-auto-runtime-controls">${controls}</div>` : ""}</section>`;
        return await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
            content,
            flags: { [MODULE_ID]: { kind: "resolution-receipt", castInstanceId } }
        });
    }

    async #postSimpleReceipt(sourceName, actor, effectDocument, castInstanceId) {
        return await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<section class="pf2e-auto-runtime-card"><p><strong>${escapeHTML(sourceName)}</strong>: applied <strong>${escapeHTML(effectDocument.name)}</strong> to ${escapeHTML(actor.name)}.</p></section>`,
            flags: { [MODULE_ID]: { kind: "sequence-receipt", castInstanceId } }
        });
    }
}
