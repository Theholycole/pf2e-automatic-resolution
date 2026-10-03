/** Observe PF2e's own application, including overkill, temporary HP and stamina.
 * Never reconstruct damage by subtracting actor HP or re-running IWR.
 */
export async function applyDamageWithReceipt(actor, options, applicationId) {
    const marker = `pf2e-auto-application:${applicationId}`;
    const updates = [];
    const receipts = [];
    const userId = game.user.id;
    const updateHook = Hooks.on("updateActor", (document, _changes, context, authorId) => {
        if (document.uuid === actor.uuid && Number.isFinite(context.damageTaken)) {
            updates.push({ amount: context.damageTaken, authorId });
        }
    });
    const chatHook = Hooks.on("createChatMessage", message => {
        const context = message.flags?.pf2e?.context;
        if (context?.type === "damage-taken" && context.options?.includes(marker)) receipts.push(message);
    });
    try {
        await actor.applyDamage({ ...options, rollOptions: new Set([...(options.rollOptions ?? []), marker]) });
        const message = receipts.length === 1 ? receipts[0] : null;
        const native = message?.flags?.pf2e?.appliedDamage;
        const healthChanges = native?.updates?.filter(update => /^system\.attributes\.hp\./.test(update.path)) ?? [];
        // A matching receipt proves completion. Multiple actor updates are ambiguous
        // (for example another client applying damage simultaneously); never guess.
        if (!message || (native && native.uuid !== actor.uuid) || updates.length > 1
            || (updates.length === 1 && updates[0].authorId !== userId)
            || (updates.length === 0 && healthChanges.length > 0)
            || (updates.length === 1 && healthChanges.length === 0 && updates[0].amount >= 0)) {
            throw new Error("PF2e damage completed without an unambiguous application receipt; review is required.");
        }
        const amount = updates[0]?.amount ?? 0;
        // PF2e damageTaken includes healing attempted beyond maximum HP. Its
        // own undo receipt records the actual HP restoration after that cap.
        const healing = amount < 0 ? healthChanges.filter(update => update.path === "system.attributes.hp.value")
            .reduce((total, update) => total + Math.max(0, -update.value), 0) : 0;
        // PF2e's own record of the IWR it applied (the damage-taken message's `data-applications`): what a typed portion of the
        // damage became, read rather than recomputed. (No record: PF2e applied no IWR.)
        let iwr = [];
        const applications = /data-applications="([^"]*)"/.exec(String(message.content ?? ""))?.[1];
        if (applications) {
            try { iwr = JSON.parse(applications.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")); } catch (_) { iwr = null; }
            if (!Array.isArray(iwr)) iwr = null;
        }
        return { applicationId, messageId: message.id, status: "confirmed",
            damage: Math.max(0, amount), healing,
            persistentIds: [...(native?.persistent ?? [])], iwr };
    } finally {
        Hooks.off("updateActor", updateHook);
        Hooks.off("createChatMessage", chatHook);
    }
}

export function confirmedDamageSummary(state) {
    const seen = new Set();
    let damage = 0, healing = 0;
    let incomplete = state.status !== "completed" || state.reviewRequired === true;
    for (const target of state.targets ?? []) {
        for (const result of target.damageResults ?? []) {
            const receipt = result.receipt;
            if (receipt?.status !== "confirmed" || !receipt.applicationId) { incomplete = true; continue; }
            if (seen.has(receipt.applicationId)) continue;
            seen.add(receipt.applicationId);
            damage += receipt.damage;
            healing += receipt.healing;
        }
    }
    return { damage, healing, incomplete };
}
