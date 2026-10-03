import { MODULE_ID } from "./effect-runtime.js";
import { clone } from "./runtime-utils.js";

const expired = effect => effect?.system?.expired === true || effect?.isExpired === true;

function exactGrant(effect, ruleFlag, grantId, slug) {
    const grant = effect?.flags?.pf2e?.itemGrants?.[ruleFlag];
    if (!grant || grant.id !== grantId) return false;
    const condition = effect.actor?.items?.get?.(grantId)
        ?? [...(effect.actor?.items ?? [])].find(item => item.id === grantId);
    return condition?.type === "condition" && condition.slug === slug;
}

/** A dependency belongs to one native GrantItem contribution, not an actor slug. */
export async function reconcileLinkedConditions(ongoing, journal, original) {
    const record = clone(original);
    const linked = record.entries.filter(entry => entry.status === "active" && !entry.detached && entry.metadata?.linkedTo);
    if (!linked.length) return false;
    const ending = [];
    const staleRoots = new Map();
    for (const entry of linked) {
        const link = entry.metadata.linkedTo;
        if (!link.rootEffectUuid || !link.rootGrantId || !link.rootRuleFlag || !link.rootSlug) {
            await ongoing.review(journal, "A linked condition lacks its exact native root grant. Review this contribution manually.");
            return true;
        }
        const rootEntry = record.entries.find(candidate => candidate.uuid === link.rootEffectUuid);
        if (!rootEntry || rootEntry.detached) {
            await ongoing.review(journal, "A linked condition's root was detached or lost without its dependency group. Review manually.");
            return true;
        }
        const root = await fromUuid(rootEntry.uuid);
        if (rootEntry.status !== "active" || !root || expired(root)) {
            ending.push(entry);
            continue;
        }
        if (!exactGrant(root, link.rootRuleFlag, link.rootGrantId, link.rootSlug)) {
            ending.push(entry);
            staleRoots.set(rootEntry.uuid, rootEntry);
        }
    }
    if (!ending.length && !staleRoots.size) return false;
    record.status = "ending";
    await ongoing.save(journal, record);
    try {
        for (const entry of ending) {
            const effect = await fromUuid(entry.uuid);
            ongoing.assertCoordinator();
            if (effect) await effect.delete({ [MODULE_ID]: { ongoingCleanup: true, skipSequence: true, skipCascade: true, reason: "linked-root-ended" } });
            entry.status = "ended";
            entry.reason = "linked-root-ended";
        }
        for (const rootEntry of staleRoots.values()) {
            const root = await fromUuid(rootEntry.uuid);
            ongoing.assertCoordinator();
            if (root) await root.delete({ [MODULE_ID]: { ongoingCleanup: true, skipSequence: true, skipCascade: true, reason: "root-grant-removed" } });
            rootEntry.status = "ended";
            rootEntry.reason = "root-grant-removed";
        }
        record.status = record.entries.every(entry => entry.status === "ended" || entry.detached || entry.permanent)
            ? "ended" : "active";
        if (record.status === "ended") record.endedAt = game.time.worldTime;
        await ongoing.save(journal, record);
        return false;
    } catch (error) {
        await ongoing.review(journal, `Linked condition ending is uncertain: ${error.message}`);
        throw error;
    }
}

export function ownsDeletedRootGrant(record, condition) {
    if (condition?.type !== "condition") return false;
    return record.entries.some(entry => entry.status === "active" && !entry.detached
        && entry.metadata?.linkedTo?.rootGrantId === condition.id
        && entry.actorUuid === (condition.actor?.uuid ?? condition.parent?.uuid));
}
