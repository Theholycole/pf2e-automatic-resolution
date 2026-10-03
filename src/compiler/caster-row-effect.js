// A save row whose result benefits the caster through PF2e's linked Effect (Mental Map):
//   Failure "You gain critical information about the place in question, granting you a +2 circumstance bonus to Survival checks while in
//   the location and any skill checks to Recall Knowledge about the location for the next 24 hours." with the Effect link, and Critical
//   Failure "As failure, but you can erase all knowledge of the location from the target for 24 hours if desired."
// The Effect must be exactly a toggle (the "while in the location / about the location" part the caster switches on) and that bonus to
// the named skill's checks and Recall Knowledge, lasting 1 day. It goes on the caster once, when a target gets one of those rows; the
// critical failure's erasing is a note on the target for 24 hours.

const GRANT = /^You gain [a-z ,']{5,80}, granting you an? \+(\d) (circumstance|status) bonus to ([A-Z][a-z]+) checks while in the location and any skill checks to Recall Knowledge about the location for the next 24 hours\.$/;
const ERASE = /^As failure, but you can erase all knowledge of the location from the target for 24 hours if desired\.$/;

/** The Effect's mechanics prove the stated bonus. */
export function casterRowEffectMatches(mechanics, claim) {
    const rules = mechanics?.rules ?? [], duration = mechanics?.duration ?? {};
    // (Roar of the Dragon's cast-time Effect: exactly the bonus to the skill against creatures of the trait, gated on the option the module's toggle
    // sets — "against dragons that were in the area" — lasting the stated time.)
    if (claim?.kind === "cast") {
        const [modifier] = rules;
        return rules.length === 1 && modifier.key === "FlatModifier" && [modifier.selector].flat().join() === claim.skill && modifier.type === claim.type && Number(modifier.value) === claim.value
            && JSON.stringify(modifier.predicate) === JSON.stringify([`target:trait:${claim.trait}`, claim.option]) && /^[a-z-]+$/.test(claim.option ?? "")
            && duration.value === claim.duration?.value && duration.unit === claim.duration?.unit && !duration.sustained;
    }
    // (Defy the Gods: exactly the resistance to the stated types, lasting the stated time.)
    if (claim?.kind === "trait-resistance") {
        const [resistance] = rules;
        return rules.length === 1 && resistance.key === "Resistance" && JSON.stringify([resistance.type].flat().sort()) === JSON.stringify([...claim.types].sort()) && Number(resistance.value) === claim.value
            && resistance.predicate == null && duration.value === claim.duration?.value && duration.unit === claim.duration?.unit && !duration.sustained;
    }
    // (Draw the Lightning's charged weapon: exactly the weapon choice, the toggle, and the toggled dice of the type on that weapon's damage —
    // 1, or 2 from the heightened rank — lasting the stated time.)
    if (claim?.kind === "weapon-cast") {
        const [choice, toggle, dice] = rules;
        return rules.length === 3 && choice.key === "ChoiceSet" && choice.flag === "weapon" && JSON.stringify(choice.choices?.types) === '["weapon"]' && choice.choices?.ownedItems === true
            && toggle.key === "RollOption" && toggle.toggleable === true && toggle.domain === "damage" && /^[a-z-]+$/.test(toggle.option ?? "")
            && dice.key === "DamageDice" && dice.damageType === claim.damageType && dice.dieSize === claim.dieSize && JSON.stringify(dice.predicate) === JSON.stringify([toggle.option])
            && dice.selector === "{item|flags.system.rulesSelections.weapon}-damage"
            && String(dice.diceNumber).replace(/\s+/g, "") === `ternary(gte(@item.level,${claim.heightened.rank}),${claim.heightened.dice},${claim.dice})`
            && duration.value === claim.duration?.value && duration.unit === claim.duration?.unit && !duration.sustained;
    }
    if (rules.length !== 2 || duration.value !== 1 || duration.unit !== "days" || duration.sustained) return false;
    const toggle = rules.find(rule => rule.key === "RollOption"), modifier = rules.find(rule => rule.key === "FlatModifier");
    if (!toggle || !modifier || toggle.toggleable !== true || toggle.domain !== "skill-check" || !/^[a-z-]+$/.test(toggle.option ?? "")) return false;
    const expected = [toggle.option, { or: [`check:statistic:${claim.skill}`, "action:recall-knowledge"] }];
    return [modifier.selector].flat().join() === "skill-check" && modifier.type === claim.type && Number(modifier.value) === claim.value
        && JSON.stringify(modifier.predicate) === JSON.stringify(expected);
}

/** {effect, erase} or null, from the compiled rows. */
export function compileCasterRowEffect(outcomes) {
    const strip = text => String(text ?? "").replace(/\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}\s*/g, " ").replace(/\s+/g, " ").trim();
    const grant = GRANT.exec(strip(outcomes.failure?.rawText));
    if (!grant || !ERASE.test(strip(outcomes.criticalFailure?.rawText))) return null;
    const links = degree => (outcomes[degree]?.nativeEffects ?? []).filter(effect => effect.recipient?.actor === "source" && effect.resolutionStatus === "resolved");
    const [link] = links("failure");
    if (links("failure").length !== 1 || (outcomes.failure.nativeEffects ?? []).length !== 1 || (outcomes.criticalFailure.nativeEffects ?? []).some(effect => effect.uuid !== link.uuid)) return null;
    const claim = { value: Number(grant[1]), type: grant[2], skill: grant[3].toLowerCase() };
    if (!casterRowEffectMatches(link.document?.mechanics, claim)) return null;
    return {
        effect: { degrees: ["failure", "criticalFailure"], uuid: link.uuid, reference: link.reference, document: structuredClone(link.document), ...claim, claimText: grant[0] },
        erase: { label: "Knowledge of the location erased (if chosen)", text: strip(outcomes.criticalFailure.rawText), sourceText: strip(outcomes.criticalFailure.rawText), claimsRow: true, gmPlays: true,
            duration: { mode: "fixed", value: 24, unit: "hours", expiry: null, anchor: "effect-start", offset: 0, sourceText: "for 24 hours" } }
    };
}

// The caster's resistance when a target of the stated traits gets a row with the stated condition (Defy the Gods): "If the target has the divine, holy, or unholy
// trait and becomes drained by this spell, you gain resistance 15 to holy and unholy for 1 minute." with PF2e's Effect (exactly that resistance) — on the caster
// once, when such a target lands on a row that drains it.
const TRAIT_GRANT = /^If the target has the ([a-z]+), ([a-z]+), or ([a-z]+) trait and becomes ([a-z]+) by this spell, you gain resistance (\d+) to ([a-z]+) and ([a-z]+) for (\d+) (round|minute)s?\.$/;
export function compileTraitCasterEffect(preamble, outcomes, unscoped) {
    const sentences = String(preamble ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const grant = sentences.map(sentence => TRAIT_GRANT.exec(sentence)).find(Boolean);
    if (!grant || (unscoped ?? []).length !== 1) return null;
    const [link] = unscoped;
    if (link.resolutionStatus !== "resolved" || link.document?.type !== "effect") return null;
    const degrees = ["criticalSuccess", "success", "failure", "criticalFailure"].filter(degree => (outcomes[degree]?.effects ?? []).some(effect => effect.slug === grant[4]));
    const claim = { kind: "trait-resistance", types: [grant[6], grant[7]], value: Number(grant[5]), duration: { value: Number(grant[8]), unit: `${grant[9]}s` } };
    if (!degrees.length || !casterRowEffectMatches(link.document?.mechanics, claim)) return null;
    return { effect: { degrees, uuid: link.uuid, reference: link.reference, document: structuredClone(link.document), ...claim, traits: [grant[1], grant[2], grant[3]], condition: grant[4], claimText: grant[0] },
        sentences: [grant[0], ...sentences.filter(sentence => /^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}$/.test(sentence))] };
}
