import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { ruleStatedSentences } from "./direct-effect-resolution-compiler.js";

const NON_ACTOR_TARGET = /\b(?:object|weapon|club|staff|food|liquid|structure|hazard|door|container|corpse|item)\b/i;
const AREA_OR_AURA = /@Template\[|\b(?:aura|emanation|burst|cone|line)\b/i;
const TRIGGER_HEADING = /<strong\b[^>]*>\s*Trigger\b/i;
const TARGET_APPLICATION = /\b(?:the target|target|the touched creature|touched creature|the targeted creature|targeted creature|it)\s+(?:also\s+)?(?:gains?|receives?|becomes?|is granted)\b|\byou grant (?:the )?(?:target|touched creature)\b|\baround the target, granting\b|^That creature regains [^.]+ immediately and gains\b/i;
const SOURCE_APPLICATION = /^(?:(?:while|for)\s+[^,.]{1,120},\s*)?you\s+(?:gain|become|receive|have|take)\b|^you(?:'re| are)\s+(?:surrounded|transformed|warded|protected)\b|^you\s+ward yourself\b/i;
const CONDITIONAL_PREFIX = /\b(?:if|when|whenever|after|before|once|until|unless)\b|\bon (?:a )?(?:critical )?(?:success|failure)\b/i;

function linkIsInsideOptionBlock(html, sourceText) {
    const source = String(html ?? "");
    const index = source.indexOf(sourceText);
    if (index < 0) return false;
    const before = source.slice(0, index);
    return before.lastIndexOf("<li") > before.lastIndexOf("</li>")
        && /<strong\b/i.test(before.slice(before.lastIndexOf("<li")));
}

function applicationEvidence(text, pattern) {
    const clauses = String(text ?? "").split(/(?<=[.!?;])\s+|\n+/).map(clause => clause.trim()).filter(Boolean);
    for (const clause of clauses) {
        const match = pattern.exec(clause);
        pattern.lastIndex = 0;
        if (!match) continue;
        const prefix = clause.slice(0, match.index);
        if (!CONDITIONAL_PREFIX.test(prefix)) return clause;
    }
    return null;
}

const DURATION = /^(?:\d+ (?:rounds?|minutes?|hours?|days?)|until the (?:start|beginning|end) of your next turn)$/i;
const SINGLE_ACTOR_TARGET = /^(?:(?:1|one) (?:willing |living )?creature(?: touched)?|(?:up to \d+|\d+|\d+ to \d+) (?:willing )?creatures|(?:1|one) willing animal|(?:1|one) ally|(?:1|one) undead minion you control|your (?:animal companion|eidolon|companion))$/i;
function durationBound(context, target, effect = null) {
    const full = htmlToPlainText(stripHeighteningHTML(context.descriptionHTML));
    // Sentences the Effect's own rules state are its content, not other recipients or conditions.
    const text = ruleStatedSentences(full, effect?.document?.mechanics?.rules, { rank: context.rank ?? null }).reduce((rest, sentence) => rest.replace(sentence, ""), full);
    return DURATION.test(String(context.duration ?? "").trim())
        // Self: nothing else is named as a recipient. Target: the caster gains nothing.
        && (target ? SINGLE_ACTOR_TARGET.test(target) && !/\byou (?:gain|have|receive|become)\b|\bgrants? you\b/i.test(text)
            : !/\b(?:target|targets|creatures? (?:in|within)|your (?:eidolon|companion|animal companion|familiar|minion|thrall)|all(?:y|ies))\b/i.test(text))
        && !/\b(?:each|every) (?:round|turn)\b|\bwhenever\b|\bthe first time\b|\bthen\b/i.test(text);
}

const AREA_ALLIES = /^(?:(You and (?:all )?(?:your )?allies(?: in the area)?|(?:All )?(?:your )?allies in the area|Your allies in the area|Each ally in the area) gains?\b|Weapon and unarmed attacks by allies in the area are treated as [a-z ]+\.$)/i;
function areaAllyRecipient(context) {
    const area = context.targeting?.area;
    if (context.targeting?.target || area?.type !== "emanation" || !Number.isFinite(Number(area.value))) return null;
    const text = htmlToPlainText(stripHeighteningHTML(context.descriptionHTML));
    if (!DURATION.test(String(context.duration ?? "").trim()) || /@Template\[/i.test(context.descriptionHTML)) return null;
    // An aura that keeps applying ("while within the emanation", "each round") is ongoing, not a cast-time grant.
    if (/\bwhile (?:in|within|inside) the (?:area|emanation|aura)\b|\b(?:each|every) (?:round|turn)\b|\bwhenever\b|\bsustain\b|\bthe first time\b/i.test(text)) return null;
    const sentences = text.split(/(?<=[.!?])\s+/).map(value => value.trim());
    const matches = sentences.filter(sentence => AREA_ALLIES.test(sentence));
    if (matches.length !== 1) return null;
    return { sentence: matches[0], recipient: { actor: "area-allies", evidence: "area-ally-language", includeSelf: /^You and\b/i.test(matches[0]),
        area: { type: "emanation", value: Number(area.value) } } };
}

// Sentence forms that say who holds the spell's one Effect and that it applies when cast; each checks the Effect's own mechanics.
function statedApplication(effect, context, baseText) {
    const target = String(context.targeting?.target ?? "").trim();
    const mechanics = effect.document?.mechanics ?? {};
    const rules = mechanics.rules ?? [];
    const duration = String(context.duration ?? "").trim();
    const sentences = baseText.split(/(?<=[.!?])\s+/).map(value => value.trim());
    // "When the target regains Hit Points from a healing vitality spell, it regains 2 additional Hit Points.": PF2e's healing-received
    // modifier on the target (a sentence limiting it to the first healing from each spell is a data note: PF2e's applies to every one).
    const healing = sentences.find(sentence => /^When the target regains Hit Points from a healing [a-z]+ spell, it regains \d+ additional Hit Points\.$/.test(sentence));
    if (healing && SINGLE_ACTOR_TARGET_LOOSE.test(target) && rules.length === 1 && rules[0].key === "FlatModifier" && rules[0].selector === "healing-received" && DURATION.test(duration)) {
        const once = sentences.find(sentence => /\bonly the first time it regains HP from a given healing spell\b/.test(sentence));
        // (User decision: the text.) Once per healing spell: the module excludes a spell's later heals once it has added to one (a new cast
        // of that spell counts afresh).
        return { recipient: { actor: "target", evidence: "stated-healing-bonus", ...(once ? { oncePerSource: { ruleIndex: 0, sourceText: once } } : {}) }, evidence: healing };
    }
    // "On your first weapon Strike each round, you gain a status bonus to damage …": PF2e's toggle for that Strike on the caster.
    const firstStrike = sentences.find(sentence => /^On your first (?:weapon )?Strike each round, you gain a status bonus to damage\b[^.]*\.$/.test(sentence));
    const toggle = rules.find(rule => rule.key === "RollOption" && rule.toggleable === true);
    if (firstStrike && !target && toggle && rules.some(rule => rule.key === "FlatModifier" && rule.selector === "strike-damage" && (rule.predicate ?? []).includes(toggle.option)) && DURATION.test(duration))
        // (User decision: the text.) The module switches the toggle on each round and off after the first weapon Strike's damage.
        return { recipient: { actor: "source", evidence: "stated-first-strike", autoToggle: { option: toggle.option, domain: toggle.domain ?? "all", per: "round", offAfter: "weapon-damage" } }, evidence: firstStrike };
    // A reaction or free action whose Target names the one creature it helps ("you or the triggering ally", "your familiar").
    if (/^(?:reaction|free)$/i.test(String(context.activation?.time ?? "").trim()) && /^(?:you or the triggering ally|the triggering ally|your familiar)$/i.test(target) && TRIGGER_HEADING.test(context.descriptionHTML))
        return { recipient: { actor: "target", evidence: "reaction-named-target" }, evidence: `Target: ${target}` };
    // "Upon completion, roll 1d4 for your prediction." with PF2e's formula badge of that die, labelled with the listed results: the caster's.
    const rolled = sentences.find(sentence => /^Upon completion, roll (1d\d+) for your [a-z]+\.$/.test(sentence));
    const badge = effect.document?.badge;
    if (rolled && !target && badge?.type === "formula" && badge.value === /roll (1d\d+)/.exec(rolled)[1] && Array.isArray(badge.labels)
        && badge.labels.length === Number(badge.value.slice(2)) && badge.labels.every(label => new RegExp(`<strong>\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(context.descriptionHTML)))
        return { recipient: { actor: "source", evidence: "rolled-badge" }, evidence: rolled };
    // "When you Cast the Spell, the wheel has one mote of thermal energy, …" with PF2e's counter badge starting at 1: the caster's.
    const counted = sentences.find(sentence => /^When you Cast the Spell, the [a-z ]+ has one ([a-z]+) of [a-z ]+, and\b/.test(sentence));
    if (counted && !target && badge?.type === "counter" && badge.value === 1)
        return { recipient: { actor: "source", evidence: "counter-badge", dataNote: `PF2e's ${effect.reference} counts the ${/has one ([a-z]+)/.exec(counted)[1]}s on its badge: raise it when the text says one is gained (at most once a turn, up to the spell's rank).` }, evidence: counted };
    // "Once during the spell's duration, before rolling a check, you can cancel out a misfortune effect on that roll, …" with PF2e's
    // toggle adding the fortune trait, removed after the roll: the caster's.
    const cancel = sentences.find(sentence => /^Once during the spell's duration, before rolling a check, you can cancel out a misfortune effect on that roll\b/.test(sentence));
    if (cancel && !target && rules.length === 1 && rules[0].key === "RollOption" && rules[0].option === "fortune" && rules[0].toggleable === true && rules[0].removeAfterRoll === true && DURATION.test(duration))
        return { recipient: { actor: "source", evidence: "fortune-toggle" }, evidence: cancel };
    // "The next time you make an attack roll before the end of your turn, roll it twice and use the better result." with PF2e's RollTwice on
    // attack rolls: the caster's.
    const nextAttack = sentences.find(sentence => /^The next time you make an attack roll before the end of your turn, roll it twice and use the better result\.$/.test(sentence));
    if (nextAttack && !target && rules.some(rule => rule.key === "RollTwice" && rule.selector === "attack-roll" && rule.keep === "higher"))
        return { recipient: { actor: "source", evidence: "stated-next-attack" }, evidence: nextAttack };
    // "You immediately escape from every magical effect that has you Immobilized or Grabbed … You then Stride. During this movement, you ignore
    // difficult terrain …" with PF2e's Effect ignoring difficult terrain: the caster's.
    const unimpeded = sentences.find(sentence => /^During this movement, you ignore difficult terrain and any circumstance or status penalties to your Speed\.$/.test(sentence));
    if (unimpeded && !target && rules.some(rule => rule.key === "ActiveEffectLike" && rule.path === "system.movement.terrain.difficult.ignored"))
        return { recipient: { actor: "source", evidence: "stated-movement" }, evidence: unimpeded };
    // A reaction whose own check is rolled twice ("The GM rolls the triggering check twice and uses the better result.") with PF2e's RollTwice
    // removed after that roll: the caster's.
    const triggeringTwice = sentences.find(sentence => /^The GM rolls the triggering check twice and uses the better result\.$/.test(sentence));
    if (triggeringTwice && !target && /^(?:reaction|free)$/i.test(String(context.activation?.time ?? "").trim()) && rules.length && rules.every(rule => rule.key === "RollTwice" && rule.removeAfterRoll === true && rule.keep === "higher"))
        return { recipient: { actor: "source", evidence: "stated-triggering-check" }, evidence: triggeringTwice };
    // "The stones must be unattended or carried by you or a willing ally. The stones become +1 striking disrupting Sling Bullets." with PF2e's
    // alterations to the holder's slings: the creature carrying them (the caster targets it: itself or a willing ally).
    const carried = sentences.find(sentence => /^The [a-z]+ must be unattended or carried by you or a willing ally\.$/.test(sentence));
    if (carried && rules.some(rule => rule.key === "ItemAlteration") && DURATION.test(duration))
        return { recipient: { actor: "target", evidence: "stated-carrier" }, evidence: carried };
    // "If you touch a weapon, your proficiency rank with that weapon temporarily increases to trained …" with PF2e's MartialProficiency for
    // the chosen weapon: the caster's.
    const touched = sentences.find(sentence => /^If you touch a weapon, your proficiency rank with that weapon temporarily increases to trained\b/.test(sentence));
    if (touched && rules.some(rule => rule.key === "MartialProficiency") && DURATION.test(duration))
        return { recipient: { actor: "source", evidence: "stated-weapon-proficiency" }, evidence: touched };
    // "You can polymorph into any form listed in Pest Form, which lasts 10 minutes." with PF2e's form choice granting the chosen form: the caster's.
    const polymorph = sentences.find(sentence => /^You can polymorph into any form listed in (?:@UUID\[[^\]]+\]\{[^}]+\}|[A-Z][a-z]+ Form), which lasts \d+ minutes\.$/.test(sentence));
    if (polymorph && !target && rules.some(rule => rule.key === "GrantItem" && /rulesSelections\.formEffect/.test(String(rule.uuid))))
        return { recipient: { actor: "source", evidence: "stated-polymorph" }, evidence: polymorph };
    // "The thrall is split into pieces and flung toward a willing creature within 15 feet of it, destroying the thrall and granting that creature
    // 10 temporary Hit Points …": that creature (the caster targets it; the thrall is removed).
    const flung = sentences.find(sentence => /^The thrall is split into pieces and flung toward a willing creature within \d+ feet of it, destroying the thrall and granting that creature \d+ temporary Hit Points\b/.test(sentence));
    if (flung && /^(?:1|one) of your thralls$/i.test(target) && rules.some(rule => rule.key === "TempHP"))
        return { recipient: { actor: "target", evidence: "stated-thrall-flung", dataNote: "Target the willing creature the thrall is flung at (not the thrall), and remove the thrall: it's destroyed." }, evidence: flung };
    // "The first time each round the target hits a creature with an unarmed Strike that deals piercing or slashing damage, that Strike deals an
    // additional 1d8 poison damage." (Envenom Companion) with PF2e's DamageDice behind its "first hit" toggle: the companion's (the toggle is the
    // player's each round; PF2e's Effect limits it to unarmed Strikes, not to piercing or slashing ones — a data note).
    const firstHit = sentences.find(sentence => /^The first time each round the target hits a creature with an unarmed Strike that deals piercing or slashing damage, that Strike deals an additional \d+d\d+ [a-z]+ damage\.$/.test(sentence));
    if (firstHit && /^your (?:companion|animal companion) or eidolon$/i.test(target) && rules.some(rule => rule.key === "DamageDice" && JSON.stringify(rule.predicate) === '["first-hit","unarmed"]')
        && rules.some(rule => rule.key === "RollOption" && rule.option === "first-hit" && rule.toggleable))
        return { recipient: { actor: "target", evidence: "stated-first-hit", dataNote: "Switch on the Effect's first-hit toggle for the companion's first unarmed hit each round; PF2e adds the poison to any unarmed Strike, so leave it off for a Strike that deals neither piercing nor slashing damage." }, evidence: firstHit };
    // "Destroy the target thrall and gain a +1 status bonus to attack rolls and saving throws.": the caster's (the thrall is removed).
    const bound = sentences.find(sentence => /^Destroy the target thrall and gain an? \+\d status bonus to attack rolls and saving throws\.$/.test(sentence));
    if (bound && /^(?:1|one) of your thralls$/i.test(target) && rules.some(rule => rule.key === "FlatModifier" && rule.type === "status"))
        return { recipient: { actor: "source", evidence: "stated-thrall-bound", dataNote: "Remove the target thrall: it's destroyed." }, evidence: bound };
    // "For the duration of this spell, you can't drop your weapon, and you gain a +4 circumstance bonus to your Reflex DC against attempts to
    // Disarm you." with PF2e's reflex-dc modifier for Disarm: the caster's (not dropping the weapon is the GM's).
    const welded = sentences.find(sentence => /^For the duration of this spell, you can't drop your weapon, and you gain a \+\d circumstance bonus to your Reflex DC against attempts to (?:@UUID\[[^\]]+\]\{Disarm\}|Disarm) you\.$/.test(sentence));
    if (welded && rules.some(rule => rule.key === "FlatModifier" && rule.selector === "reflex-dc" && JSON.stringify(rule.predicate) === '["action:disarm"]'))
        return { recipient: { actor: "source", evidence: "stated-welded-weapon" }, evidence: welded };
    // "… you can Interact to pass the token to an ally within your reach. As long as the ally has the token on their person, they gain a +1
    // status bonus to Performance checks and Will saves.": the ally the caster targets (keeping the token is the GM's).
    const token = sentences.find(sentence => /^As long as the ally has the [a-z]+ on their person, they gain an? \+\d status bonus to [A-Za-z ,]+\.$/.test(sentence));
    if (token && !target && /\bpass the [a-z]+ to an ally within your reach\b/.test(baseText) && rules.length === 1 && rules[0].key === "FlatModifier" && rules[0].type === "status")
        return { recipient: { actor: "target", evidence: "stated-token-holder" }, evidence: token };
    // "For the duration of this spell, you are trained in Crafting and Thievery." with PF2e's rank upgrades on those skills: the caster's.
    const trained = sentences.find(sentence => /^For the duration of this spell, you are trained in ([A-Z][a-z]+) and ([A-Z][a-z]+)\.$/.test(sentence));
    if (trained && !target) {
        const [, a, b] = /trained in ([A-Z][a-z]+) and ([A-Z][a-z]+)/.exec(trained);
        const paths = rules.filter(rule => rule.key === "ActiveEffectLike" && rule.mode === "upgrade").map(rule => rule.path);
        if (paths.length === 2 && [a, b].every(skill => paths.includes(`system.skills.${skill.toLowerCase()}.rank`)))
            return { recipient: { actor: "source", evidence: "stated-trained-skills" }, evidence: trained };
    }
    // "When you Cast or Sustain the Spell, you can attempt to Create a Diversion with the illusion, gaining a +2 circumstance bonus to your
    // Deception check." with PF2e's bonus for that action: the caster's.
    const diversion = sentences.find(sentence => /^When you Cast or Sustain the Spell, you can attempt to (?:@UUID\[[^\]]+\]\{Create a Diversion\}|Create a Diversion) with the illusion, gaining a \+\d circumstance bonus to your Deception check\.$/.test(sentence));
    if (diversion && !target && rules.some(rule => rule.key === "FlatModifier" && JSON.stringify(rule.predicate) === '["action:create-a-diversion"]'))
        return { recipient: { actor: "source", evidence: "stated-diversion" }, evidence: diversion };
    // "If you create the light in the same space as a willing creature, you can attach the light to the creature, …" with PF2e's TokenLight:
    // the creature it's attached to (the caster targets it, itself included).
    const attach = sentences.find(sentence => /^If you create the light in the same space as a willing creature, you can attach the light to the creature, causing it to float near that creature as it moves\.$/.test(sentence));
    if (attach && !target && rules.length === 1 && rules[0].key === "TokenLight")
        return { recipient: { actor: "target", evidence: "stated-light-holder", dataNote: "Target the creature the light floats near (yourself for a light that follows you). A light left in place: put a light source on the map yourself." }, evidence: attach };
    // "You or anyone you advise about the aura gains a +2 circumstance bonus to Identify Magic on the item." with PF2e's bonus for that action:
    // the caster's (a creature the caster advises gets it from the GM).
    const advise = sentences.find(sentence => /^You or anyone you advise about the aura gains a \+\d circumstance bonus to (?:@UUID\[[^\]]+\]\{Identify Magic\}|Identify Magic) on the item\.$/.test(sentence));
    if (advise && rules.some(rule => rule.key === "FlatModifier" && JSON.stringify(rule.predicate) === '["action:identify-magic"]'))
        return { recipient: { actor: "source", evidence: "stated-identify-bonus", dataNote: "A creature the caster advises about the aura gets the same bonus: apply PF2e's Effect to it too." }, evidence: advise };
    // "… you catch a magical fish; roll 1d8 to see which fish you caught and the effects gained from eating it …" with PF2e's choice of those
    // fish: the creature that eats it (the caster targets it); the module rolls and picks the listed fish.
    const caught = sentences.find(sentence => /\broll \[\[\/r (1d\d+)(?: #[^\]]*)?\]\] to see which [a-z]+ you caught\b/.test(sentence));
    if (caught && !target && rules.some(rule => rule.key === "ChoiceSet" && Array.isArray(rule.choices) && rule.choices.length === Number(/1d(\d+)/.exec(caught)[1])))
        return { recipient: { actor: "target", evidence: "rolled-choice", dataNote: "Target the creature that eats the fish once it's cooked (within 1 hour of the catch); the Effect lasts 1 hour after eating." }, evidence: caught };
    // "If the trigger you designate occurs and you can use the chosen action as a reaction, you gain a +1 status bonus to any attack roll or skill
    // check required." with PF2e's toggle for that roll: the caster's.
    const oath = sentences.find(sentence => /^If the trigger you designate occurs and you can use the chosen action as a reaction, you gain a \+\d status bonus to any attack roll or skill check required\.$/.test(sentence));
    const oathToggle = rules.find(rule => rule.key === "RollOption" && rule.toggleable === true);
    if (oath && !target && oathToggle && rules.some(rule => rule.key === "FlatModifier" && (rule.predicate ?? []).includes(oathToggle.option)))
        return { recipient: { actor: "source", evidence: "stated-oath-toggle", dataNote: `PF2e's ${effect.reference} adds the bonus while its toggle is on: switch it on for the readied action's roll.` }, evidence: oath };
    // "The target ally gains a +1 status bonus to Armor Class and saving throws against the target enemy's attacks, spells, and other effects."
    // with PF2e's TokenMark and a modifier against the marked creature: the ally, marking the enemy.
    const ward = sentences.find(sentence => /^The target ally gains a \+\d status bonus to Armor Class and saving throws against the target enemy's attacks, spells, and other effects\.$/.test(sentence));
    const mark = rules.find(rule => rule.key === "TokenMark");
    if (ward && /^(?:1|one) ally and (?:1|one) enemy$/i.test(target) && mark && rules.some(rule => rule.key === "FlatModifier" && JSON.stringify(rule.predicate) === JSON.stringify([`origin:mark:${mark.slug}`])))
        return { recipient: { actor: "target", evidence: "stated-ward-ally", markTarget: "enemy" }, evidence: ward };
    return null;
}
const SINGLE_ACTOR_TARGET_LOOSE = /^(?:1|one) (?:willing )?(?:living )?creature$/i;

function classifyImmediateApplication(effect, context) {
    const reasons = [];
    const target = String(context.targeting?.target ?? "");
    const baseText = htmlToPlainText(stripHeighteningHTML(context.descriptionHTML));
    const targetEvidence = applicationEvidence(baseText, TARGET_APPLICATION);
    const sourceEvidence = applicationEvidence(baseText, SOURCE_APPLICATION);

    if (context.referenceCount !== 1) reasons.push("multiple-native-effects");
    if (context.sectionCount > 0) reasons.push("degree-sections-present");
    if (context.hasPrimarySave) reasons.push("primary-save-present");
    if (context.inlineChecks > 0) reasons.push("inline-check-present");
    // "You and all allies in the area gain …": the caster (when named) and the
    // allies inside the spell's emanation receive the Effect when it's cast.
    const areaAllies = areaAllyRecipient(context);
    // An Effect carrying PF2e's Aura rule element manages its own membership:
    // it is applied to the aura's centre (the caster, or the single target).
    const nativeAura = (effect.document?.automation?.ruleKeys ?? []).includes("Aura")
        && (!target || SINGLE_ACTOR_TARGET.test(target)) && !context.hasPrimarySave;
    // (A stated form names its holder; the word "aura" in "advise about the aura" isn't an area.)
    const statedEarly = statedApplication(effect, context, baseText);
    if (!areaAllies && !nativeAura && !statedEarly && (context.targeting?.area || AREA_OR_AURA.test(context.descriptionHTML))) reasons.push("area-or-aura-present");
    // A reaction applies its Effect as it is cast, which is when the trigger
    // happens; it qualifies only with an explicit recipient sentence below.
    const reaction = TRIGGER_HEADING.test(context.descriptionHTML) || /\b(?:reaction|free)\b/i.test(context.activation?.time ?? "");
    if (reaction && !/^(?:reaction|free)$/i.test(String(context.activation?.time ?? "").trim())) reasons.push("reaction-trigger-present");
    if (linkIsInsideOptionBlock(context.descriptionHTML, effect.sourceText)) reasons.push("option-block-link");
    if (/\bimmunit(?:y|ies)\b/i.test(effect.reference)) reasons.push("immunity-effect");
    // A weapon target whose Effect picks the weapon itself (PF2e's ChoiceSet of the recipient's own weapons): the Effect goes on
    // the wielder — the targeted creature ("wielded by a willing creature"), or the caster ("1 weapon you're wielding").
    const weaponChoice = (effect.document?.mechanics?.rules ?? []).some(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true
        && JSON.stringify(rule.choices.types) === '["weapon"]');
    const wieldedWeapon = weaponChoice && /^(?:1|one) (?:metal )?weapon(?: that is unattended or (?:is )?wielded by (?:a willing creature|you or a willing ally))?$/i.test(target);
    const heldWeapon = weaponChoice && /^(?:1|one) (?:weapon you're wielding|club or staff you(?: hold|'re wielding))$/i.test(target);
    // (A stated form that names the caster as holder — "If you touch a weapon, your proficiency …" — isn't about the object Target.)
    const statedSource = Boolean(statedEarly);
    if (NON_ACTOR_TARGET.test(target) && !wieldedWeapon && !heldWeapon && !statedSource) reasons.push("non-actor-target");

    let recipient = null;
    let evidence = null;
    const stated = !areaAllies && !nativeAura ? statedApplication(effect, context, baseText) : null;
    if (stated) {
        recipient = stated.recipient;
        evidence = stated.evidence;
    } else if (areaAllies) {
        recipient = areaAllies.recipient;
        evidence = areaAllies.sentence;
    } else if (nativeAura && !reaction) {
        recipient = target ? { actor: "target", evidence: "native-aura-centre" } : { actor: "source", evidence: "native-aura-centre" };
        evidence = `PF2e Aura rule on ${effect.reference}`;
    } else if ((wieldedWeapon || heldWeapon) && !reaction && (DURATION.test(String(context.duration ?? "").trim())
        || /\buntil the start of your next turn\.$/m.test(htmlToPlainText(stripHeighteningHTML(context.descriptionHTML)).split(/(?<=\.)\s+/).join("\n"))
        // "On your next Strike with that weapon before the start of your next turn, …" with an Effect lasting exactly that long.
        || (/\bbefore the start of your next turn\b/i.test(baseText) && effect.document?.mechanics?.duration?.value === 1
            && effect.document.mechanics.duration.unit === "rounds" && effect.document.mechanics.duration.expiry === "turn-start"))) {
        recipient = heldWeapon ? { actor: "source", evidence: "weapon-wielder-self" } : { actor: "target", evidence: "weapon-wielder" };
        evidence = `the Effect picks the weapon (${target})`;
    } else if (!target && sourceEvidence) {
        recipient = { actor: "source", evidence: "immediate-source-language" };
        evidence = sourceEvidence;
    } else if (target && !NON_ACTOR_TARGET.test(target) && targetEvidence) {
        recipient = { actor: "target", evidence: "immediate-target-language" };
        evidence = targetEvidence;
    } else if (reaction) {
        reasons.push("reaction-recipient-not-explicit");
    } else if (!targetEvidence && !sourceEvidence && durationBound(context, target, effect)) {
        // A buff with no save, area or trigger, one linked Effect, one actor
        // recipient and a real duration: the Effect is the spell's standing
        // effect on that recipient for the duration, applied when cast.
        recipient = target ? { actor: "target", evidence: "duration-bound-target" } : { actor: "source", evidence: "duration-bound-self" };
        evidence = `duration ${context.duration}; ${target ? `target ${target}` : "no target (self)"}`;
    } else if (!targetEvidence && !sourceEvidence) {
        reasons.push("immediate-application-not-explicit");
    } else if (target && SINGLE_ACTOR_TARGET.test(target) && sourceEvidence && !targetEvidence && DURATION.test(String(context.duration ?? "").trim())
        && !/\b(?:each|every) (?:round|turn)\b|\bwhenever\b|\bthe first time\b|\bthen\b|\ballies\b|\bcreatures? (?:in|within)\b/i.test(htmlToPlainText(stripHeighteningHTML(context.descriptionHTML)))) {
        // The text speaks to the caster ("You gain resistance …") while PF2e's Target names a creature: PF2e's data decides,
        // and the card notes the difference.
        recipient = { actor: "target", evidence: "pf2e-target-over-text", dataNote: `The text describes the caster (“${sourceEvidence}”), but PF2e's Target is ${target}; the Effect goes to the target.` };
        evidence = `PF2e Target ${target}`;
    } else {
        reasons.push("recipient-not-safe");
    }

    return { safe: reasons.length === 0, reasons: [...new Set(reasons)], recipient, evidence, reaction };
}

export function compileUnscopedEffectTriggers(effects, context = {}) {
    const onUse = [];
    const pending = [];

    for (const effect of effects ?? []) {
        const classification = classifyImmediateApplication(effect, context);
        if (!classification.safe) {
            pending.push({
                ...effect,
                triggerAnalysis: {
                    status: "pending",
                    reasons: classification.reasons
                }
            });
            continue;
        }

        onUse.push({
            ...effect,
            recipient: classification.recipient,
            scope: "on-use",
            trigger: {
                event: "use",
                timing: "after-activation",
                once: true
            },
            lifecycleBinding: context.sustained ? "cast-controller" : null,
            ...(classification.reaction ? { reactionCast: true } : {}),
            triggerAnalysis: {
                status: "compiled",
                evidence: classification.evidence
            }
        });
    }

    return { onUse, pending };
}
