// Messaging spells (Message, Sending, Dream Message): the plan check shared by the runtime and the census.
const WINDOWS = ["reaction-or-next-turn", "immediate"];

export function isExecutableMessagePlan(plan) {
    const message = plan?.resolution?.kind === "message" ? plan.resolution.message : null;
    if (!message || plan.automation?.level !== "automatic" || (plan.automation.pendingCapabilities ?? []).length) return false;
    const limit = value => value == null || (Number.isInteger(value) && value > 0);
    const reply = message.reply;
    return limit(message.words) && limit(message.range) && Number.isInteger(message.maxTargets) && message.maxTargets >= 1
        && ["immediate", "when-asleep"].includes(message.delivery)
        && (reply == null || (limit(reply.words) && WINDOWS.includes(reply.window) && typeof reply.withinRange === "boolean" && (!reply.withinRange || message.range != null)))
        && (message.delivery !== "when-asleep" || reply == null)
        && plan.targeting?.actorConstraints?.complete === true && plan.targeting.actorConstraints.supportsActorTargets === true
        && typeof message.sourceText === "string" && message.sourceText.length > 0;
}
