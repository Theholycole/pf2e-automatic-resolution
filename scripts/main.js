import { EffectRuntime, MODULE_ID } from "./effect-runtime.js";
import { BasicSaveRuntime } from "./basic-save-runtime.js";
import { claimNativeSpellSaveButton } from "./chat-card-controls.js";
import { debugCast, debugEnabled, debugLatestCast, registerDebugSetting } from "./debug.js";

const runtime = new EffectRuntime();
const basicSaves = new BasicSaveRuntime();

function actorFromMessage(message) {
    try { if (message.actor) return message.actor; } catch (_) {}
    const speaker = message.speaker ?? {};
    if (speaker.scene && speaker.token) {
        const actor = game.scenes.get(speaker.scene)?.tokens.get(speaker.token)?.actor;
        if (actor) return actor;
    }
    return speaker.actor ? game.actors.get(speaker.actor) ?? null : null;
}

function spellCardContext(message) {
    if (!String(message.content ?? "").includes("pf2e chat-card item-card")) return null;
    const actor = actorFromMessage(message);
    const itemId = message.content.match(/data-item-id=["']([^"']+)["']/i)?.[1];
    if (!actor || !itemId) return null;
    let item = null;
    try { item = message.item ?? null; } catch (_) {}
    item ??= actor.items.get(itemId) ?? null;
    const embeddedSource = message.flags?.pf2e?.casting?.embeddedSpell ?? null;
    if (item?.type !== "spell" && embeddedSource?.type !== "spell") return null;
    const castRank = Number(
        message.content.match(/data-cast-rank=["'](\d+)["']/i)?.[1]
        ?? message.flags?.pf2e?.origin?.castRank
        ?? item?.rank
        ?? embeddedSource?.system?.level?.value
    );
    return {
        actor,
        item: item ?? embeddedSource,
        baseSource: embeddedSource ?? item,
        castRank: Number.isFinite(castRank) ? castRank : null
    };
}

function notifyError(context, error) {
    console.error(`PF2e Automatic Resolution | ${context}:`, error);
    ui.notifications.error(error instanceof Error ? error.message : String(error));
}

function bindReceiptButtons(root) {
    for (const button of root.querySelectorAll(".pf2e-auto-runtime-button")) {
        if (button.dataset.runtimeBound) continue;
        button.dataset.runtimeBound = "true";
        button.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            if (button.disabled) return;
            button.disabled = true;
            const prior = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Working';
            try {
                await runtime.handleReceiptAction(button);
                button.innerHTML = '<i class="fa-solid fa-check"></i> Complete';
            } catch (error) {
                button.disabled = false;
                button.innerHTML = prior;
                notifyError("Effect control failed", error);
            }
        });
    }
}

function bindSaveButtons(root) {
    for (const button of root.querySelectorAll(".pf2e-auto-save-button")) {
        if (button.dataset.runtimeBound) continue;
        button.dataset.runtimeBound = "true";
        if (["roll-all", "add-targets", "finalize", "roll-damage", "roll-outcome-damage", "apply"].includes(button.dataset.saveAction)) {
            const card = game.messages.get(button.dataset.messageId);
            if (card && !basicSaves.canCoordinate(card)) {
                button.disabled = true;
                button.title = "The active GM coordinates this cast-wide control.";
                continue;
            }
        }
        button.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            if (button.disabled) return;
            button.disabled = true;
            const prior = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Working';
            try {
                await basicSaves.handleCardAction(button, event);
                button.disabled = false;
                button.innerHTML = prior;
            } catch (error) {
                button.disabled = false;
                button.innerHTML = prior;
                notifyError("Save-resolution control failed", error);
            }
        });
    }
}

async function addResolutionButton(message, root) {
    if (root.querySelector(".pf2e-auto-runtime-resolve")) return;
    const context = spellCardContext(message);
    if (!context) return;
    const canPrepare = game.user.isGM || context.actor.canUserModify?.(game.user, "update");

    let plan;
    try { plan = await runtime.compile(context.baseSource); }
    catch (error) {
        console.warn("PF2e Automatic Resolution | Spell plan compilation failed:", error);
        return;
    }
    const effectPlan = runtime.supportedResolutionKinds.includes(plan.resolution?.kind);
    const savePlan = basicSaves.supports(plan);
    if (!effectPlan && !savePlan) return;
    if (effectPlan && !canPrepare) return;

    const nativeSaveButton = savePlan
        ? root.querySelector('button[data-action="spell-save"]')
        : null;
    if (savePlan && !claimNativeSpellSaveButton(nativeSaveButton)) return;
    const button = nativeSaveButton ?? document.createElement("button");
    if (effectPlan) {
        button.type = "button";
        button.className = "pf2e-auto-runtime-resolve";
    }
    const nativeSaveLabel = savePlan ? button.textContent.trim() : null;
    const savedSaveCast = savePlan
        ? message.getFlag(MODULE_ID, "saveCast") ?? message.getFlag(MODULE_ID, "basicSaveCast")
        : null;
    const resolved = effectPlan
        ? message.getFlag(MODULE_ID, "resolvedCast")
        : savedSaveCast && game.messages.get(savedSaveCast.resolutionMessageId)
            ? savedSaveCast
            : null;
    button.disabled = !!resolved || (savePlan && !canPrepare);
    button.innerHTML = resolved
        ? `<i class="fa-solid fa-check"></i> ${effectPlan ? "Native Effect Resolved" : "Saves Prepared"}`
        : effectPlan
            ? '<i class="fa-solid fa-wand-magic-sparkles"></i> Resolve Native Effect'
            : `<i class="fa-solid fa-shield-halved"></i> Prepare Saves — ${nativeSaveLabel}`;
    button.title = effectPlan && plan.automation.level === "guided"
        ? `Guided plan: ${plan.automation.pendingCapabilities.join(", ")}`
        : effectPlan
            ? "Choose and confirm the official PF2e Effect application."
            : canPrepare
                ? "Snapshot current targets for interactive native saves and confirmed damage."
                : "The caster's owner or a GM must prepare this basic-save resolution.";
    if (effectPlan) (root.querySelector(".card-buttons") ?? root).appendChild(button);

    button.addEventListener("click", async event => {
        event.preventDefault();
        event.stopPropagation();
        if (button.disabled) return;
        button.disabled = true;
        const prior = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resolving';
        try {
            const result = effectPlan
                ? await runtime.execute(context.item, {
                    plan,
                    baseSource: context.baseSource,
                    sourceActor: context.actor,
                    sourceMessageId: message.id,
                    castRank: context.castRank
                })
                : await basicSaves.start(context.item, {
                    plan,
                    sourceActor: context.actor,
                    sourceMessageId: message.id,
                    castRank: context.castRank,
                    targets: game.user.targets,
                    skipConfirmation: true
                });
            if (result.status === "applied" || result.status === "prepared") {
                button.innerHTML = `<i class="fa-solid fa-check"></i> ${effectPlan ? "Native Effect Resolved" : "Saves Prepared"}`;
            } else {
                button.disabled = false;
                button.innerHTML = prior;
            }
        } catch (error) {
            button.disabled = false;
            button.innerHTML = prior;
            notifyError(`${plan.source.name} resolution failed`, error);
        }
    });
}

Hooks.once("init", () => {
    registerDebugSetting();
    const module = game.modules.get(MODULE_ID);
    if (module) {
        const saveApi = {
            start: (spell, options) => basicSaves.start(spell, options),
            rollDamage: card => basicSaves.rollDamage(card),
            rollAll: (card, options) => basicSaves.rollAll(card, options),
            rollSave: (card, targetId, options) => basicSaves.rollSave(card, targetId, options),
            addTargets: (card, targets) => basicSaves.addTargets(card, targets),
            finalize: card => basicSaves.finalize(card),
            apply: (card, options) => basicSaves.apply(card, options),
            supports: plan => basicSaves.supports(plan)
        };
        module.api = {
            compile: (item, options) => runtime.compile(item, options),
            execute: (item, options) => runtime.execute(item, options),
            dismiss: (effect, options) => runtime.dismiss(effect, options),
            triggerActionUsed: (actor, actionUuid) => runtime.triggerActionUsed(actor, actionUuid),
            saves: saveApi,
            basicSaves: saveApi,
            debug: {
                enabled: () => debugEnabled(),
                cast: cardOrId => debugCast(cardOrId),
                latest: () => debugLatestCast()
            },
            debugCast: cardOrId => debugCast(cardOrId),
            refreshCatalog: () => runtime.refreshCatalog(),
            supportedResolutionKinds: runtime.supportedResolutionKinds
        };
    }
});

Hooks.once("ready", async () => {
    game.socket.on(`module.${MODULE_ID}`, payload => {
        basicSaves.handleSocket(payload).catch(error => notifyError("Save-result synchronization failed", error));
    });
    try {
        await runtime.refreshCatalog();
        console.log("PF2e Automatic Ability Resolution | Runtime ready");
    } catch (error) {
        notifyError("Native Effect catalog initialization failed", error);
    }
});

Hooks.on("renderChatMessageHTML", (message, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;
    bindReceiptButtons(root);
    bindSaveButtons(root);
    void addResolutionButton(message, root);
});

Hooks.on("createChatMessage", message => {
    void runtime.handleActionMessage(message)
        .catch(error => notifyError("Action-triggered Effect sequence failed", error));
    void basicSaves.handleSaveMessage(message)
        .catch(error => notifyError("Save result recording failed", error));
});

Hooks.on("deleteItem", (item, options) => {
    void runtime.handleDeletedEffect(item, options)
        .catch(error => notifyError("Effect termination failed", error));
});

Hooks.on("updateItem", item => {
    void runtime.handleUpdatedEffect(item)
        .catch(error => notifyError("Effect expiration transition failed", error));
});
