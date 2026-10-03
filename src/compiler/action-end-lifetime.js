// A standalone outcome sentence letting the bearer end one named condition
// with its own Interact action: "The creature can spend an Interact action
// rubbing its eyes to end the Blinded condition." It must name exactly one
// compiled condition of the outcome; anything else stays residual.
// Also: "… an Interact action to rub its eyes and end the blinded condition, but not the dazzled condition." (the
// other condition is named only to say it stays).
const STANDALONE = /^(?:The creature|The target|It) can spend an Interact action(?: [a-z' ]{1,40}?)?(?: to [a-z' ]{1,40}? and| to) end the ([A-Za-z-]+) condition(?:, but not the ([A-Za-z-]+) condition)?\.$/;

// "If the creature moves to outside area, they can spend 1 action to rub their eyes, removing the dazzled condition.": the bearer's
// action, only once it's outside the area (the control says so).
const OUTSIDE = /^If the creature moves (?:to )?outside (?:the )?area, (?:they|it) can spend 1 action to [a-z' ]{1,40}, removing the ([a-z-]+) condition\.$/i;

// "The creature is Fascinated by the wealth until it has completed its first action on its next turn.": the condition ends once the creature
// has taken its first action on its next turn (a control, like "for its next action").
const FIRST_ACTION = /^The (?:creature|target) is (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Za-z-]+)\}|([A-Za-z-]+))(?: by [a-z ]+)? until it has completed its first action on its next turn\.$/;

export function attachActionEnds(outcome) {
    const sentences = String(outcome.rawText ?? "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim());
    for (const sentence of sentences) {
        const first = FIRST_ACTION.exec(sentence);
        if (first) {
            const slug = (first[1] ?? first[2]).toLowerCase();
            const scoped = (outcome.effects ?? []).filter(effect => effect.slug === slug);
            if (scoped.length === 1 && !scoped[0].endsWhen && scoped[0].duration == null) {
                scoped[0].endsWhen = [{ event: "action", action: "next-turn-action" }];
                scoped[0].expirationMode = "event";
                scoped[0].actionEndSourceText = sentence;
            }
            continue;
        }
        const outside = OUTSIDE.exec(sentence);
        if (outside) {
            const scoped = (outcome.effects ?? []).filter(effect => effect.slug === outside[1].toLowerCase());
            if (scoped.length !== 1 || scoped[0].endsWhen || scoped[0].whileCondition || scoped[0].recurringSave) continue;
            scoped[0].endsWhen = [{ event: "action", action: "outside-action" }];
            scoped[0].expirationMode = scoped[0].duration?.mode === "fixed" ? "first" : "event";
            scoped[0].actionEndSourceText = sentence;
            // The sentence's "If …" is this lifetime, not a manual conditional effect.
            outcome.manualInstructions = (outcome.manualInstructions ?? []).filter(instruction => !(instruction.kind === "conditional-effect" && String(instruction.text ?? "").includes(sentence)
                && !/\b(?:if|unless|whenever)\b/i.test(String(instruction.text).replace(sentence, ""))));
            continue;
        }
        const match = STANDALONE.exec(sentence);
        if (!match) continue;
        const slug = match[1].toLowerCase();
        // The condition said to stay must be one of the outcome's conditions too.
        if (match[2] && !(outcome.effects ?? []).some(effect => effect.slug === match[2].toLowerCase())) continue;
        const scoped = (outcome.effects ?? []).filter(effect => effect.slug === slug);
        if (scoped.length !== 1 || scoped[0].endsWhen || scoped[0].whileCondition || scoped[0].recurringSave) continue;
        const effect = scoped[0];
        effect.endsWhen = [{ event: "action", action: "interact" }];
        effect.expirationMode = effect.duration?.mode === "fixed" ? "first" : "event";
        effect.actionEndSourceText = sentence;
    }
}
