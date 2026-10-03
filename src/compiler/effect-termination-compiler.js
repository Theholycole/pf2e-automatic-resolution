import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

export const DISMISS_ACTION_UUID = "Compendium.pf2e.actionspf2e.Item.Dismiss";

function dismissalSentence(html) {
    // (Links hold dots: "You can @UUID[Compendium.pf2e.actionspf2e.Item.…]{Dismiss} the spell as a free action." reads by its label.)
    const text = htmlToPlainText(stripHeighteningHTML(html)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    return (text.match(/[^.!?]*(?:\bDismiss\b)[^.!?]*[.!?]?/gi) ?? [])[0]?.trim() ?? null;
}

function authorityFor(sentence, effect) {
    if (/\b(?:each|the) target\b/i.test(sentence)) return "target";
    if (/\bit can Dismiss\b/i.test(sentence)) return effect.recipient.actor === "target" ? "target" : null;
    if (/\byou can Dismiss\b/i.test(sentence)) return "source";
    return null;
}

function actionFor(sentence) {
    const freeAction = /\bas a free action\b/i.test(sentence);
    const action = {
        kind: "pf2e-action",
        uuid: DISMISS_ACTION_UUID,
        slug: "dismiss",
        cost: { type: freeAction ? "free-action" : "action", value: freeAction ? 0 : 1 },
        traits: ["concentrate"]
    };
    // A triggered free action only when the sentence states the trigger ("… when you take fire damage"); "You can Dismiss the spell as a free
    // action." is untriggered.
    if (freeAction && /\b(?:when|whenever|after|if)\b|\btakes?\s+[a-z]+\s+damage\b/i.test(sentence)) {
        const damageType = sentence.match(/\btakes?\s+([a-z]+)\s+damage\b/i)?.[1]?.toLowerCase() ?? null;
        action.trigger = {
            event: "damage-taken",
            ...(damageType ? { damageType } : {})
        };
    }
    return action;
}

function consequenceBlockers(sentence) {
    const dismissal = sentence.match(/\bDismiss\b/i);
    if (!dismissal) return [];
    const suffix = sentence.slice((dismissal.index ?? 0) + dismissal[0].length);
    if (/\bto collapse\b|\bwhich (?:pushes|deals|causes|creates|moves)\b/i.test(suffix)) {
        return ["dismissal-consequence"];
    }
    return [];
}

function compileTermination(effect, sentence) {
    const authority = authorityFor(sentence, effect);
    if (!authority) return null;
    const blockers = consequenceBlockers(sentence);
    const id = `${effect.uuid}:dismiss`;
    return {
        id,
        event: "dismissed",
        sourceEffectUuid: effect.uuid,
        authority: { actor: authority },
        scope: authority === "target" ? "recipient-effect" : "cast-instance",
        controller: { kind: "native-effect-instance", sourceEffectUuid: effect.uuid },
        action: actionFor(sentence),
        operation: "delete-embedded-effect",
        applicationRequiresConfirmation: true,
        sourceText: sentence,
        complete: blockers.length === 0,
        blockers
    };
}

export function compileEffectTerminations(nativeEffects, adapted) {
    const sentence = dismissalSentence(adapted.descriptionHTML);
    if (!sentence) return { ...nativeEffects, terminations: [] };

    const terminations = [];
    const compileEffects = effects => effects.map(effect => {
        const termination = compileTermination(effect, sentence);
        if (!termination) return effect;
        terminations.push(termination);
        return { ...effect, terminationId: termination.id };
    });

    return {
        ...nativeEffects,
        onUse: compileEffects(nativeEffects.onUse ?? []),
        rankVariants: compileEffects(nativeEffects.rankVariants ?? []),
        choiceVariants: compileEffects(nativeEffects.choiceVariants ?? []),
        terminations
    };
}
