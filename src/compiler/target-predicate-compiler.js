const AREA_NOUN = String.raw`(?:area|cone|line|burst|emanation|cylinder)`;

function normalizedTarget(text) {
    return String(text ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function compileActorTargetConstraints(targeting, {
    requiresActorTargets = false,
    descriptionHTML = "",
    reaction = false
} = {}) {
    const sourceText = String(targeting?.target ?? "").trim() || null;
    const target = normalizedTarget(sourceText);
    if (!target) {
        const description = String(descriptionHTML)
            .split(/<hr\b/i, 1)[0]
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
        // "Each enemy in the area must attempt a Will save." / "You deal 3d4 mental damage to all
        // enemies in the area": only enemies of the caster are affected. A description that also
        // names creatures in the area as recipients is ambiguous and gets no enemy restriction.
        // (Also "Foes in the area must attempt a Will save." and an area given by its template: "Each enemy creature within a
        // @Template[type:emanation|distance:60] must attempt a Fortitude save", "All enemies within a @Template[…] of your shadow must attempt …".)
        const enemyRecipients = new RegExp(String.raw`\b(?:(?:each|all|every) )?(?:your )?(?:living )?(?:enem(?:y|ies)|foes)(?: creatures?)? (?:in|within) (?:the ${AREA_NOUN}|an? @template\[[^\]]+\](?: of your [a-z]+)?),? (?:takes? [^.,;]{1,60} damage and )?(?:must )?attempts?\b[^.]{0,80}\bsav`).test(description)
            || new RegExp(String.raw`\bdamage to (?:all |each |your )?(?:living )?enem(?:y|ies) in the ${AREA_NOUN}(?=[,.;]| \(| with | depending)`).test(description);
        const creatureRecipients = new RegExp(String.raw`\b(?:each|all|every|other) creatures? (?:in|within) the ${AREA_NOUN}\b|\bdamage to (?:all |each )?creatures? in the ${AREA_NOUN}\b`).test(description);
        if (enemyRecipients && !creatureRecipients) {
            const living = /\bliving enem(?:y|ies)\b/.test(description);
            return {
                sourceText: "description: enemies in the area",
                supportsActorTargets: true,
                complete: true,
                predicates: [{ kind: "enemy-of-caster" }, ...(living ? [{ kind: "living-creature" }] : [])]
            };
        }
        // "Each non-allied creature in the area must attempt a Will save.": the caster's allies (and the caster) are left out.
        if (new RegExp(String.raw`\beach non-allied creature (?:in|within) the ${AREA_NOUN} must attempt\b`).test(description) && !creatureRecipients && !enemyRecipients) {
            return { sourceText: "description: non-allied creatures in the area", supportsActorTargets: true, complete: true, predicates: [{ kind: "non-ally-of-caster" }] };
        }
        // "The spell deals 1d4 sonic damage to a single enemy, with a basic Fortitude save.": one enemy of the caster.
        if (/\bdamage to a single enemy\b/.test(description) && !/\b(?:creatures?|enemies) (?:in|within) the\b/.test(description)) {
            return { sourceText: "description: a single enemy", supportsActorTargets: true, complete: true, predicates: [{ kind: "enemy-of-caster" }] };
        }
        if (/\bliving creatures?\b[^.]{0,160}\b(?:must )?attempts?\b[^.]{0,80}\bsave\b/.test(description)) {
            return {
                sourceText: "description: living creatures attempting the save",
                supportsActorTargets: true,
                complete: true,
                predicates: [{ kind: "living-creature" }]
            };
        }
        // "deal 12d6 void damage to living creatures in the area" names the recipients.
        if (/\bdamage to (?:all |each )?living (?:creatures?|enemies) in the (?:area|cone|line|burst|emanation|cylinder)\b/.test(description)) {
            return {
                sourceText: "description: damage to living creatures in the area",
                supportsActorTargets: true,
                complete: true,
                predicates: [{ kind: "living-creature" }]
            };
        }
        // "Each undead creature in the area takes 4d12 vitality damage." / "Each incorporeal creature in the area takes 4d10 sonic damage …"
        const traitOnly = /\beach (undead|incorporeal) creature in the (?:area|cone|line|burst|emanation) takes\b/.exec(description);
        if (traitOnly) {
            return {
                sourceText: `description: each ${traitOnly[1]} creature in the area takes damage`,
                supportsActorTargets: true,
                complete: true,
                predicates: [{ kind: "trait", slug: traitOnly[1], present: true }]
            };
        }
        if (/\bundead creatures?\b[^.]{0,160}\b(?:must )?attempts?\b[^.]{0,80}\bsave\b/.test(description)) {
            return {
                sourceText: "description: undead creatures attempting the save",
                supportsActorTargets: true,
                complete: true,
                predicates: [{ kind: "trait", slug: "undead", present: true }]
            };
        }
        return {
            sourceText,
            supportsActorTargets: requiresActorTargets,
            complete: true,
            predicates: []
        };
    }

    if (/^(?:all )?enemies in (?:the )?(?:area|emanation|aura)$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "enemy-of-caster" }] };
    }
    // An area written in the target field ("10-foot burst") targets the
    // creatures in it, exactly like an area with no target entry.
    if (/^\d+-foot (?:burst|cone|emanation|line)$/.test(target)) {
        return { sourceText, supportsActorTargets: requiresActorTargets, complete: true, predicates: [] };
    }
    // A reaction's target is the creature named by its trigger ("the triggering
    // creature", "the creature that took damage", "the creature that would take fire
    // damage"); the caster picks it.
    if (/^(?:the triggering (?:creature|foe|enemy)|the creature targeted by the attack|the creature that took damage|the creature (?:that|who) would (?:take|be dealt) [a-z ]+damage|the creature targeted by the triggering (?:strike|attack))$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    // "1 of your thralls" healing a creature chosen near it ("Choose one living or undead creature of your choice within 15 feet of the
    // target thrall."): the caster targets that creature; the card reminds them of the thrall's range.
    if (/^(?:1|one) of your thralls$/.test(target) && (/\bChoose one living or undead creature of your choice within \d+ feet of the target thrall\./.test(String(descriptionHTML))
        // "The thrall is split into pieces and flung toward a willing creature within 15 feet of it, …": the caster targets that creature.
        || /\bThe thrall is split into pieces and flung toward a willing creature within \d+ feet of it\b/.test(String(descriptionHTML))
        // "Destroy the target thrall and gain a +1 status bonus …": the caster's own Effect (the thrall is removed).
        || /\bDestroy the target thrall and gain an? \+\d status bonus\b/.test(String(descriptionHTML)))) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    // "the triggering ally": the one creature the trigger names (a reaction), which the caster targets.
    // "the triggering creature or object" (a reaction on an attack's target): the creature the trigger names; an object is the GM's.
    if (/^the triggering creature or object$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "you or the triggering ally" / "your familiar": the one creature the reaction helps, which the caster targets.
    if (/^(?:you or the triggering ally|your familiar)$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    if (/^the triggering ally$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    // "1 ally and 1 enemy": two creatures; the runtime tells them apart by the caster's alliance.
    if (/^(?:1|one) ally and (?:1|one) enemy$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    // "A creature you dealt damage to on your most recent action." (Commanding Lash): the caster judges it.
    if (/^a creature you dealt damage to on your most recent action\.?$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "1 corpse" (Talking Corpse): the dead creature's token, which saves with its statistics at death (the GM picks it).
    if (/^(?:1|one) corpse$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "1 creature within 60 feet" (Caster's Imposition): the range, which the caster judges.
    if (/^(?:1|one) creature within \d+ feet$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "All living creatures" (an area variant, Rip the Spirit's 3 actions): the living creatures in the area.
    if (/^all living creatures$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "living-creature" }] };
    // "1 enemy": one creature, an enemy of the caster.
    if (/^(?:1|one) enemy$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "enemy-of-caster" }] };
    }
        // A reaction whose Target field holds its trigger ("A creature within 30 feet fails a Deception or Diplomacy
    // check."): the target is that triggering creature.
    if (reaction && /^a creature within \d+ feet (?:fails|critically fails|succeeds at|attempts) (?:an? )?[a-z ]+ check\.?$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
        // Anatomy PF2e doesn't model ("1 creature with bones or a natural
    // exoskeleton"): the GM confirms each target before Finalize.
    const ANATOMY = String.raw`(?:an? )?(?:natural )?(?:bones|skeleton|exoskeleton|teeth|blood)`;
    const anatomy = new RegExp(`^(?:1|one) creature with (${ANATOMY}(?: or ${ANATOMY})?)$`).exec(target);
    if (anatomy) {
        return { sourceText, supportsActorTargets: true, complete: true,
            predicates: [{ kind: "gm-confirmed", question: `Does the creature have ${anatomy[1]}? Only such a creature can be targeted.`, sourceText }] };
    }
    // "1 creature that has a shadow" (Tenebrous Freedom, Gift of Dusk; PF2e 8.6): the GM confirms the shadow.
    if (/^(?:1|one) creature that has a shadow$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true,
        predicates: [{ kind: "gm-confirmed", question: "Does the creature have a shadow? Only such a creature can be targeted.", sourceText }] };
    // "1 creature made of organic material" (Petrify), "1 creature made of flesh" (Lignify): the GM confirms what it's made of.
    const madeOfOnly = /^(?:1|one) creature made of ([a-z]+(?: [a-z]+)?)$/.exec(target);
    if (madeOfOnly) return { sourceText, supportsActorTargets: true, complete: true,
        predicates: [{ kind: "gm-confirmed", question: `Is the creature made of ${madeOfOnly[1]}? Only such a creature can be targeted.`, sourceText }] };
    // "1 creature, unattended object, or hazard or structure made of stone or earth": a creature the GM confirms is made of that; the
    // objects, hazards and structures are the GM's (the module targets creatures).
    const madeOf = /^(?:1|one) creature, unattended object, or hazard or structure made of ([a-z]+(?: or [a-z]+)?)$/.exec(target);
    if (madeOf) {
        return { sourceText, supportsActorTargets: true, complete: true,
            predicates: [{ kind: "gm-confirmed", question: `Is the creature made of ${madeOf[1]}? Only such a creature can be targeted.`, sourceText }] };
    }
    // "1 creature or an unattended object of 2 Bulk or less" (PF2e's text spells it "undattended"): a creature; the object is the GM's
    // (the module targets creatures).
    if (/^(?:1|one) creature or an? und?attended object of (?:\d+|light) bulk or less$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "1 non-hostile domesticated animal": an animal (PF2e's trait), whose attitude and upbringing the GM confirms.
    if (/^(?:1|one) non-hostile domesticated animal$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "trait", slug: "animal", present: true },
            { kind: "gm-confirmed", question: "Is the animal domesticated and not hostile? Only such an animal can be targeted.", sourceText }] };
    }
    // "1 target" (Manifold Lives): any one creature.
    if (/^(?:1|one) target$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "1 dying creature": PF2e's Dying condition (Cryostasis).
    if (/^(?:1|one) dying creature$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "condition", slug: "dying" }] };
    // "1 creature that could find you attractive": the GM's judgement, confirmed for each target before Finalize.
    if (/^(?:1|one) creature that could find you attractive$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true,
            predicates: [{ kind: "gm-confirmed", question: "Could the creature find the caster attractive? Only such a creature can be targeted.", sourceText }] };
    }
    // Not a creature: the spell a reaction answers, or a warded door or chest.
    // "the creature you hit": the creature the caster's Strike just hit (the caster picks it).
    if (/^the creature you hit$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    if (/^the triggering spell$/.test(target) || /^(?:1|one) magically sealed or warded doorway or chest$/.test(target)) {
        return { sourceText, supportsActorTargets: false, complete: true, predicates: [] };
    }
    // A weapon whose Effect goes on its wielder: the caster targets the creature wielding it ("1 weapon that is unattended or
    // wielded by a willing creature", "1 metal weapon"); "1 weapon you're wielding" / "1 club or staff you hold" is the caster's.
    if (/^(?:1|one) (?:metal )?weapon(?: that is unattended or (?:is )?wielded by (?:a willing creature|you or a willing ally))?$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    if (/^(?:1|one) (?:weapon you're wielding|club or staff you(?: hold|'re wielding))$/.test(target)) {
        return { sourceText, supportsActorTargets: false, complete: true, predicates: [] };
    }
    // "1 unattended object of up to 8 Bulk, or Medium or smaller creature that is currently on the ground": a creature up to that size
    // (PF2e's size) whom the GM confirms is on the ground; the object is the GM's (the module targets creatures).
    const sizedGround = /^(?:1|one) unattended object of up to \d+ bulk, or (tiny|small|medium|large|huge) or smaller creature that is currently on the ground$/.exec(target);
    if (sizedGround) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "size-at-most", size: { tiny: "tiny", small: "sm", medium: "med", large: "lg", huge: "huge" }[sizedGround[1]] },
            { kind: "gm-confirmed", question: "Is the creature on the ground? Only a creature on the ground can be targeted.", sourceText }] };
    }
    // "1 weapon or tool" the caster touches, "1 metal weapon you are wielding": an object; the caster holds the spell's Effect.
    if (/^(?:1|one) (?:weapon or tool|metal weapon you are wielding)$/.test(target)) return { sourceText, supportsActorTargets: false, complete: true, predicates: [] };
    // "1 to 3 non-magical stones or sling bullets" carried by the caster or a willing ally: the caster targets the carrier.
    if (/^(?:\d+ to \d+|\d+) non-magical stones or sling bullets$/.test(target) && /\bcarried by you or a willing ally\b/.test(String(descriptionHTML)))
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // Things, not creatures: "1 unattended object", "1 cubic foot of clean food or water".
    // (Also "1 hinge or latch", Electrified Crystal Ward's.)
    // ("1 item you're holding and 1 item in another creature's possession …", Trade Items: an item a creature holds is still an item.)
    if (/\b(?:items?|objects?|food|water|liquids?|drinks?|cubic (?:foot|feet)|texts?|documents?|hinge or latch)\b/.test(target) && !/\bcreatures?\b/.test(target.replace(/\bcreature's possession\b/g, "possession"))) {
        return { sourceText, supportsActorTargets: false, complete: true, predicates: [] };
    }
    // Plural or willing creature targets, and the caster's own companion or eidolon
    // (the caster targets it; no trait proves which creature that is).
    if (/^(?:one|\d+|up to (?:one|\d+)|\d+ to \d+) willing creatures?$/.test(target) || /^(?:1|one) (?:willing )?ally$/.test(target) || /^you and up to \d+ (?:allies|willing creatures)$/.test(target)
        || /^your (?:animal companion|eidolon|companion)(?: or (?:eidolon|animal companion))?$/.test(target)
        // "one of your animal companions you can perceive": the caster's pick, as with "your companion".
        || /^one of your animal companions you can perceive$/.test(target)
        // "1 hunted prey": the creature the caster Hunts (the caster's pick).
        || /^(?:1|one) hunted prey$/.test(target)
        // A creature the caster knows (the caster's own knowledge; no trait proves it), or one the caster can see (the caster targets it).
        || /^(?:1|one) creature you know (?:well|by name and have met in person)$/.test(target) || /^(?:1|one) creature you can see$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    // "all creatures and unattended objects" with "Large or smaller creatures must attempt a Fortitude save.": creatures up to that
    // size (PF2e's size); the objects are the GM's (a reminder).
    if (/^all creatures and unattended objects$/i.test(target)) {
        const size = /\b(Tiny|Small|Medium|Large|Huge) or smaller creatures must attempt an? (?:Fortitude|Reflex|Will) save\./.exec(String(descriptionHTML).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
        if (size) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "size-at-most", size: { Tiny: "tiny", Small: "sm", Medium: "med", Large: "lg", Huge: "huge" }[size[1]] }] };
    }
    // "4 contiguous 5-foot squares" (an area branch the caster lays out): the creatures on it, which the caster targets.
    if (/^\d+ contiguous 5-foot squares$/i.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "2 non-overlapping 5-foot bursts": the creatures in the areas the caster places.
    if (/^\d+ non-overlapping \d+-foot bursts$/i.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    // Target lines of one creature with a stated limit (rank 2 batch 5). PF2e data where it has it (size, traits, the caster, persistent damage),
    // the GM's answer where it doesn't.
    const SIZE = { tiny: "tiny", small: "sm", medium: "med", large: "lg", huge: "huge" };
    const sized = /^(?:1|one) (tiny|small|medium|large|huge) or smaller creature$/.exec(target);
    if (sized) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "size-at-most", size: SIZE[sized[1]] }] };
    // "1 object held by 1 creature and the creature holding it": the holder (the GM picks the object).
    if (/^(?:1|one) object held by (?:1|one) creature and the creature holding it$/.test(target)
        // "1 creature in line of sight": the caster targets it.
        || /^(?:1|one) creature in line of sight$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "1 creature touched": the creature the caster touches (the caster targets it).
    if (/^(?:1|one) creature touched$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "Up to 5 willing living creatures": living (PF2e traits); willing is the caster's choice of targets.
    if (/^up to (?:\d+|one|two|three|four|five|six|ten) willing living creatures$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "living-creature" }] };
    // "All creatures" in the spell's area (a PF2e variant's target line): every creature the area holds.
    if (/^all creatures$/.test(target) && targeting?.area) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    if (/^each foe in the area$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "enemy-of-caster" }] };
    if (/^(?:1|one) creature other than you$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "not-caster" }] };
    if (/^(?:1|one) living or undead creature$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "living-or-undead" }] };
    if (/^(?:1|one) corporeal creature$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "trait", slug: "incorporeal", present: false }] };
    if (/^(?:1|one) living humanoid$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "living-creature" }, { kind: "trait", slug: "humanoid", present: true }] };
    if (/^(?:1|one) creature taking (?:persistent )?bleed damage$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "persistent-damage", damageType: "bleed" }] };
    const asked = [
        [/^(?:1|one) creature standing on the ground$/, "Is the creature standing on the ground?"],
        [/^(?:1|one) flying creature$/, "Is the creature flying?"],
        [/^(?:1|one) creature that can bleed$/, "Can the creature bleed?"],
        [/^(?:1|one) creature affected by a disease$/, "Is the creature affected by a disease?"],
        [/^(?:1|one) creature whose true name you know$/, "Does the caster know the creature's true name?"],
        [/^(?:1|one) creature you know by name$/, "Does the caster know the creature by name?"],
        [/^(?:1|one) creature that isn't on its home plane$/, "Is the creature away from its home plane?"],
        [/^(?:1|one) metal item or metal creature$/, "Is the creature made of metal, or holding or wearing the metal item the caster targets?"]
    ].find(([pattern]) => pattern.test(target));
    if (asked) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "gm-confirmed", question: `${asked[1]} Only such a target is affected.`, sourceText }] };
    // "1 living creature that has 0 HP": living (PF2e traits), at 0 Hit Points when targeted.
    if (/^(?:1|one) living creature that has 0 HP$/i.test(target))
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "living-creature" }, { kind: "hp-zero" }] };
    // "1 living creature touched": living (PF2e traits).
    if (/^(?:1|one) living creature touched$/i.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "living-creature" }] };
    }
    // "one creature being influenced" (a reaction's target): the creature the trigger names; the caster picks it.
    if (/^(?:1|one) creature being influenced$/i.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    // "1 animal companion in your service" (Apex Companion): the GM confirms it's the caster's animal companion.
    if (/^(?:1|one) animal companion in your service$/i.test(target)) return { sourceText, supportsActorTargets: true, complete: true,
        predicates: [{ kind: "gm-confirmed", question: "Is this creature the caster's animal companion?" }] };
    // "up to 5 willing creatures who would be harmed by the triggering effect" (Scintillating Safeguard): the caster's pick of those the trigger threatens.
    if (/^up to (?:\d+|five) willing creatures who would be harmed by the triggering effect$/i.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "1 creature (see description)" (Proliferating Eyes): any creature; the text says nothing more about who.
    if (/^(?:1|one) creature \(see description\)$/i.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    // "1 living creature that needs to breathe" (Suffocate): living, and the GM confirms it breathes.
    if (/^(?:1|one) living creature that needs to breathe$/i.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "living-creature" }, { kind: "gm-confirmed", question: "Does this creature need to breathe?" }] };
    }
    // "1 diseased creature" (Witches+'s Sudden Outbreak): the GM confirms it has a disease (PF2e's afflictions are the GM's).
    if (/^(?:1|one) diseased creature$/i.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "gm-confirmed", question: "Does this creature have a disease?" }] };
    // "1 living creature that has a soul": living (PF2e traits), and the GM confirms it has a soul.
    if (/^(?:1|one) living creature that has a soul$/i.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "living-creature" }, { kind: "gm-confirmed", question: "Does this creature have a soul?" }] };
    }
    // "2 creatures that each have an unfriendly or worse attitude toward the other": attitudes between creatures aren't PF2e data;
    // the GM answers for each target.
    if (/^2 creatures that each have an unfriendly or worse attitude toward the other$/i.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true,
            predicates: [{ kind: "gm-confirmed", question: "Is this creature unfriendly or worse toward the other target? The spell affects only such a pair." }] };
    }
    // "1 creature with a land Speed greater than yours": compared with the caster's land Speed when the saves are prepared.
    if (/^(?:1|one) creature with a land speed greater than yours$/i.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "land-speed-above-caster" }] };
    }
    // "1 willing living creature": the caster's willing target, which must be living.
    // "1 willing creature other than yourself": not the caster.
    if (/^(?:1|one) willing creature other than yourself$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "not-caster" }] };
    }
    if (/^(?:1|one) willing living creatures?$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "living-creature" }] };
    }
    // "1 undead minion you control": an undead creature; which minions are the caster's is the caster's choice, as with
    // "your companion".
    // "one undead creature under your control": an undead creature; which are the caster's is the caster's choice.
    if (/^(?:1|one) undead minion you control$/.test(target) || /^(?:1|one) undead creature under your control$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "trait", slug: "undead", present: true }] };
    }
    if (/^(?:1|one) willing living animal$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "trait", slug: "animal", present: true }, { kind: "living-creature" }] };
    }
    if (/^(?:1|one) willing animal$/.test(target) || /^(?:1|one) animal$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "trait", slug: "animal", present: true }] };
    }
    // "2 creatures no more than 10 feet from each other": the targets must be that close to one another.
    const mutual = /^(?:two|three|\d+) creatures no more than (\d+) feet from each other$/.exec(target);
    if (mutual) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [], mutualWithin: Number(mutual[1]) };
    }
    // "any number of creatures": whichever creatures the caster targets.
    if (/^any number of creatures$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    // "2 to 4 creatures in range" (Entangle Fate): the creatures the caster targets.
    if (/^\d+ to \d+ creatures in range$/.test(target)) return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    if (/^(?:one|two|three|\d+|up to (?:one|\d+)|(?:one|\d+) or (?:one|\d+)|(?:one|two|\d+) or more) creatures?(?: or (?:unattended )?(?:[a-z]+ )?objects?)?$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    if (/^(?:one|\d+) creatures? that (?:is|are) undead or (?:otherwise )?(?:has|have) void healing$/.test(target)
        || /^(?:one|\d+) creatures? that (?:has|have) void healing or (?:is|are) undead$/.test(target)) {
        return {
            sourceText,
            supportsActorTargets: true,
            complete: true,
            predicates: [{ kind: "undead-or-void-healing" }]
        };
    }
    // "each creature with the water trait" (Control Water's rewrite): any number of creatures with that trait.
    const withTrait = /^each creature with the ([a-z]+) trait$/.exec(target)?.[1] ?? null;
    if (withTrait) return { sourceText, supportsActorTargets: true, complete: true, predicates: [{ kind: "trait", slug: withTrait, present: true }] };
    const trait = /^(?:one|\d+) (undead) creatures?$/.exec(target)?.[1] ?? null;
    if (trait) {
        return {
            sourceText,
            supportsActorTargets: true,
            complete: true,
            predicates: [{ kind: "trait", slug: trait, present: true }]
        };
    }
    if (/^(?:one|\d+) living creatures?$/.test(target)) {
        return {
            sourceText,
            supportsActorTargets: true,
            complete: true,
            predicates: [{ kind: "living-creature" }]
        };
    }
    return {
        sourceText,
        supportsActorTargets: /\bcreatures?\b/.test(target),
        complete: false,
        predicates: []
    };
}
