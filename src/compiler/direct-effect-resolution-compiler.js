import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { ruleValueAtRank } from "./degree-choice-effect.js";

function hasAny(keys, candidates) {
    return candidates.some(candidate => keys.has(candidate));
}

function addUnsupportedSignal(blockers, present, supported, name) {
    if (present && !supported) blockers.push(name);
}

// Sentences the Effect's own rules state exactly; they're set aside before the prose checks below.
const FIST_FACES = { 6: 1, 8: 2 };
export function ruleStatedSentences(text, rules, { rank = null } = {}) {
    if (!Array.isArray(rules)) return [];
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@(])/).map(sentence => sentence.trim()).filter(Boolean);
    const stated = [];
    for (const sentence of sentences) {
        // "The target can carry 3 more Bulk than normal before becoming Encumbered and up to a maximum of 6 more Bulk."
        const bulk = /^The target can carry (\d+) more Bulk than normal before becoming @UUID\[Compendium\.pf2e\.conditionitems\.Item\.D5mg6Tc7Jzrj6ro7\]\{Encumbered\} and up to a maximum of (\d+) more Bulk\.$/.exec(sentence);
        if (bulk) {
            const addend = path => rules.filter(rule => rule.key === "ActiveEffectLike" && rule.mode === "add" && rule.path === path && rule.predicate == null);
            const [after, max] = [addend("inventory.bulk.encumberedAfterAddend"), addend("inventory.bulk.maxAddend")];
            if (rules.length === 2 && after.length === 1 && max.length === 1 && after[0].value === Number(bulk[1]) && max[0].value === Number(bulk[2])) stated.push(sentence);
            continue;
        }
        // "Each target's unarmed and weapon Strikes deal an extra 1d4 vitality damage.": a DamageDice rule on Strike damage
        // with that die, type and (at the cast rank) number of dice.
        const extra = /^Each target's unarmed and weapon Strikes deal an extra (\d+)d(\d+) ([a-z]+) damage\.$/.exec(sentence);
        if (extra) {
            const dice = rules.filter(rule => rule.key === "DamageDice" && rule.selector === "strike-damage" && rule.predicate == null);
            if (dice.length === 1 && dice[0].dieSize === `d${extra[2]}` && dice[0].damageType === extra[3] && rank != null
                && ruleValueAtRank(dice[0].diceNumber, rank) === Number(extra[1])) stated.push(sentence);
            continue;
        }
        // "The first time each round the target hits a creature with an unarmed Strike that deals piercing or slashing damage, that Strike deals an
        // additional 1d8 poison damage." (Envenom Companion): PF2e's DamageDice behind its "first hit" toggle, that die and type, and (at the
        // cast rank) that number of dice.
        const firstHit = /^The first time each round the target hits a creature with an unarmed Strike that deals piercing or slashing damage, that Strike deals an additional (\d+)d(\d+) ([a-z]+) damage\.$/.exec(sentence);
        if (firstHit) {
            const dice = rules.filter(rule => rule.key === "DamageDice" && rule.selector === "strike-damage" && JSON.stringify(rule.predicate) === '["first-hit","unarmed"]');
            const diceAt = value => { const match = /^match\((.+)\)$/.exec(String(value).replace(/\s+/g, "")); if (!match) return ruleValueAtRank(value, rank);
                for (const arm of match[1].split(/,(?=when\()/)) { const when = /^when\(btwn\(@item\.level,(\d+),(\d+)\),(\d+)\)$/.exec(arm) ?? /^when\(gte\(@item\.level,(\d+)\),(\d+)\)$/.exec(arm);
                    if (!when) return null; if (when.length === 4 ? rank >= Number(when[1]) && rank <= Number(when[2]) : rank >= Number(when[1])) return Number(when.at(-1)); } return null; };
            if (dice.length === 1 && dice[0].dieSize === `d${firstHit[2]}` && dice[0].damageType === firstHit[3] && rank != null && diceAt(dice[0].diceNumber) === Number(firstHit[1])) stated.push(sentence);
            continue;
        }
        // "If you have the holy trait, you can add that trait to this spell and to the Strikes affected by the spell.": PF2e
        // adds it to the Strikes when the caster has it.
        const trait = /^If you have the ([a-z]+) trait, you can add that trait to this spell and to the Strikes affected by the spell\.$/.exec(sentence);
        if (trait) {
            if (rules.some(rule => rule.key === "AdjustStrike" && rule.mode === "add" && rule.property === "traits" && rule.value === trait[1]
                && JSON.stringify(rule.predicate) === JSON.stringify([`parent:origin:trait:${trait[1]}`]))) stated.push(sentence);
            continue;
        }
        // "The number of targets is equal to the number of actions you spent casting this spell." / a parenthetical aside
        // with no rule ("(This damage typically damages only undead).") accompany a stated Effect.
        if (/^The number of targets is equal to the number of actions you spent casting this spell\.$/.test(sentence)
            || /^\(This damage typically damages only [a-z]+\)\.$/.test(sentence)) { stated.push(sentence); continue; }
        // "Claws You gain a claw attack that deals 1d6 slashing damage and has the agile, finesse, and unarmed traits." (an
        // option's label may lead): a Strike rule granting that attack with that damage and those traits (PF2e adds magical).
        const attack = /^(?:[A-Z][a-z]+(?: [A-Z][a-z]+)?\s+)?You gain an? ([a-z]+) attack that deals (\d+)d(\d+) ([a-z]+) damage(?: and has the ([a-z, ]+?) traits?)?\.$/.exec(sentence.replace(/\s+/g, " "));
        if (attack) {
            const traits = (attack[5] ?? "").split(/,\s*(?:and\s+)?|\s+and\s+/).map(trait => trait.trim()).filter(Boolean);
            if (rules.some(rule => rule.key === "Strike" && rule.baseType === attack[1] && rule.damage?.base?.dice === Number(attack[2])
                && rule.damage.base.die === `d${attack[3]}` && rule.damage.base.damageType === attack[4]
                && traits.every(trait => (rule.traits ?? []).includes(trait))
                && (rule.traits ?? []).every(trait => traits.includes(trait) || trait === "magical"))) stated.push(sentence);
            continue;
        }
        // "Untamed claws are an unarmed attack, have the agile and finesse traits, and and deal 1d6 slashing damage." / "Untamed jaws are
        // an unarmed attack that deal 1d8 piercing damage.": a Strike rule of that base (claws → claw) with that damage, unarmed, and
        // exactly those traits (PF2e adds unarmed and magical).
        const unarmed = /^[A-Z][a-z]+ ([a-z]+) are an unarmed attack(?:, have the ([a-z]+(?:, [a-z]+)*,? and [a-z]+|[a-z]+) traits?, and(?: and)?| that) deal (\d+)d(\d+) ([a-z]+) damage\.$/.exec(sentence.replace(/\s+/g, " "));
        if (unarmed) {
            const base = unarmed[1].replace(/s$/, "");
            const traits = (unarmed[2] ?? "").split(/,\s*(?:and\s+)?|\s+and\s+/).map(trait => trait.trim()).filter(Boolean);
            if (rules.some(rule => rule.key === "Strike" && [base, unarmed[1]].includes(rule.baseType) && rule.category === "unarmed" && rule.damage?.base?.dice === Number(unarmed[3])
                && rule.damage.base.die === `d${unarmed[4]}` && rule.damage.base.damageType === unarmed[5]
                && traits.every(trait => (rule.traits ?? []).includes(trait)) && (rule.traits ?? []).every(trait => traits.includes(trait) || ["unarmed", "magical"].includes(trait)))) stated.push(sentence);
            continue;
        }
        // "The target becomes a +1 striking weapon, gaining a +1 item bonus to attack rolls and increasing the number of weapon
        // damage dice to two.": the Effect's chosen weapon gets potency and striking runes of those values at the cast rank.
        // (The text's emphasis leaves a space before the punctuation: "striking weapon , gaining".)
        const tight = sentence.replace(/\s+([,.])/g, "$1");
        const runes = /^The target becomes a \+(\d) striking weapon(?: while in your hands)?, gaining a \+\1 item bonus to attack rolls and increasing the number of weapon damage dice to two\.$/.exec(tight);
        if (runes) {
            const flag = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true)?.flag;
            const alteration = property => rules.find(rule => rule.key === "ItemAlteration" && rule.property === property && rule.mode === "upgrade"
                && rule.itemId === `{item|flags.system.rulesSelections.${flag}}` && rule.predicate == null);
            if (flag && rank != null && ruleValueAtRank(alteration("runes-potency")?.value, rank) === Number(runes[1])
                && ruleValueAtRank(alteration("runes-striking")?.value, rank) === 1) stated.push(sentence);
            continue;
        }
        // "The target becomes a +1 shock weapon.": potency at the cast rank and the property rune on the chosen weapon's Strikes.
        const property = /^The target becomes a \+(\d) ([a-z]+) weapon\.$/.exec(tight);
        if (property && property[2] !== "striking") {
            const flag = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true)?.flag;
            const potency = rules.find(rule => rule.key === "ItemAlteration" && rule.property === "runes-potency" && rule.mode === "upgrade"
                && rule.itemId === `{item|flags.system.rulesSelections.${flag}}`);
            if (flag && rank != null && ruleValueAtRank(potency?.value, rank) === Number(property[1])
                && rules.some(rule => rule.key === "AdjustStrike" && rule.mode === "add" && rule.property === "property-runes" && rule.value === property[2]
                    && JSON.stringify(rule.definition) === JSON.stringify([`item:id:{item|flags.system.rulesSelections.${flag}}`]))) stated.push(sentence);
            continue;
        }
        // "Strikes with the target weapon deal an additional 1d4 slashing damage until the start of your next turn.": damage dice on
        // the chosen weapon's damage at the cast rank.
        const weaponDice = /^Strikes with the target weapon deal an additional (\d+)d(\d+) ([a-z]+) damage(?: until the start of your next turn)?\.$/.exec(sentence);
        if (weaponDice) {
            const flag = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true)?.flag;
            if (flag && rank != null && rules.some(rule => rule.key === "DamageDice" && rule.selector === `{item|flags.system.rulesSelections.${flag}}-damage`
                && rule.dieSize === `d${weaponDice[2]}` && rule.damageType === weaponDice[3] && rule.predicate == null
                && ruleValueAtRank(rule.diceNumber, rank) === Number(weaponDice[1]))) stated.push(sentence);
            continue;
        }
        // "On your next Strike with that weapon before the start of your next turn, you gain a +1 status bonus to the attack roll
        // and the weapon deals an additional 1d6 spirit damage, and the Strike gains the sanctified trait.": the chosen weapon's
        // attack bonus, damage dice at the cast rank, and the added trait. (PF2e's Effect lasts to the start of your next turn for
        // every Strike with it; the ending sentence below is a data note.)
        const nextStrike = /^On your next Strike with that weapon before the start of your next turn, you gain a \+(\d) (status|circumstance) bonus to the attack roll and the weapon deals an additional (\d+)d(\d+) ([a-z]+) damage(?:, and the Strike gains the ([a-z]+) trait)?\.$/.exec(sentence);
        if (nextStrike) {
            const flag = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true)?.flag;
            const own = `{item|flags.system.rulesSelections.${flag}}`;
            const bonus = rules.some(rule => rule.key === "FlatModifier" && rule.selector === `${own}-attack` && rule.type === nextStrike[2] && Number(rule.value) === Number(nextStrike[1]) && rule.predicate == null);
            const dice = rules.some(rule => rule.key === "DamageDice" && rule.selector === `${own}-damage` && rule.dieSize === `d${nextStrike[4]}` && rule.damageType === nextStrike[5]
                && rule.predicate == null && rank != null && ruleValueAtRank(rule.diceNumber, rank) === Number(nextStrike[3]));
            const trait = !nextStrike[6] || rules.some(rule => rule.key === "AdjustStrike" && rule.mode === "add" && rule.property === "traits" && rule.value === nextStrike[6]
                && JSON.stringify(rule.definition) === JSON.stringify([`item:id:${own}`]));
            if (flag && bonus && dice && trait) stated.push(sentence);
            continue;
        }
        // "On the next successful attack with that weapon during the spell's duration, the attack deals an additional 1d6 precision
        // damage.": dice of that category (or type) on the chosen weapon's damage at the cast rank. (PF2e's Effect adds them to
        // every hit until it ends; a data note, below.)
        const nextHit = /^On the next successful attack with that weapon during the spell's duration, the attack deals an additional (\d+)d(\d+) ([a-z]+) damage\.$/.exec(sentence);
        if (nextHit) {
            const flag = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true)?.flag;
            if (flag && rank != null && rules.some(rule => rule.key === "DamageDice" && rule.selector === `{item|flags.system.rulesSelections.${flag}}-damage`
                && rule.dieSize === `d${nextHit[2]}` && (rule.category === nextHit[3] || rule.damageType === nextHit[3]) && rule.predicate == null
                && ruleValueAtRank(rule.diceNumber, rank) === Number(nextHit[1]))) stated.push(sentence);
            continue;
        }
        // "You can choose for the metal to become your choice of cold iron, silver, or steel, causing the attack to bypass
        // resistances accordingly.": a material choice added to the chosen weapon's Strikes. Every precious material PF2e offers
        // must be listed; one the text lists that PF2e doesn't offer is a data note, below.
        const material = /^You can choose for the metal to become your choice of ((?:[a-z ]+, )+or [a-z ]+), causing the attack to bypass resistances accordingly\.$/.exec(sentence);
        if (material) {
            const listed = material[1].replace(/,? or /, ", ").split(/,\s*/).map(name => name.trim().replace(/ /g, "-"));
            const weaponFlag = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true)?.flag;
            const choice = rules.find(rule => rule.key === "ChoiceSet" && Array.isArray(rule.choices) && rule.choices.length > 0
                && rule.choices.every(option => listed.includes(option.value)));
            if (weaponFlag && choice && rules.some(rule => rule.key === "AdjustStrike" && rule.mode === "add" && rule.property === "materials"
                && rule.value === `{item|flags.system.rulesSelections.${choice.flag}}`
                && JSON.stringify(rule.definition) === JSON.stringify([`item:id:{item|flags.system.rulesSelections.${weaponFlag}}`]))) stated.push(sentence);
            continue;
        }
        // "While you wield the target weapon, it becomes a +1 weapon, gains the versatile fire trait, and sheds light as brightly as a
        // torch.": potency on the chosen weapon at the rank, the trait added to it, and a torch's light (bright 20, dim 40).
        const wielded = /^While you wield the target weapon, it becomes a \+(\d) weapon, gains the ([a-z]+ [a-z]+) trait, and sheds light as brightly as a torch\.$/.exec(tight);
        if (wielded) {
            const flag = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true)?.flag;
            const own = `{item|flags.system.rulesSelections.${flag}}`;
            const potency = rules.some(rule => rule.key === "ItemAlteration" && rule.property === "runes-potency" && rule.mode === "upgrade" && rule.itemId === own
                && rank != null && ruleValueAtRank(rule.value, rank) === Number(wielded[1]));
            const trait = rules.some(rule => rule.key === "ItemAlteration" && rule.mode === "add" && rule.property === "traits" && rule.value === wielded[2].replace(" ", "-")
                && JSON.stringify(rule.predicate) === JSON.stringify([`item:id:${own}`]));
            const light = rules.some(rule => rule.key === "TokenLight" && rule.value?.bright === 20 && rule.value?.dim === 40);
            if (flag && potency && trait && light) stated.push(sentence);
            continue;
        }
        // "Whenever you successfully Strike a creature with the weapon, you can Dismiss the spell as a free action to deal 1d6
        // persistent fire damage to the target; if the target is undead, increase the persistent damage dice to d8s.": PF2e's
        // toggle adds those dice (at the rank) to the chosen weapon's damage, d8s against undead. PF2e adds them as ordinary
        // damage of that type (a data note, below).
        const dismissDice = /^Whenever you successfully Strike a creature with the weapon, you can Dismiss the spell as a free action to deal (\d+)d(\d+) persistent ([a-z]+) damage to the target; if the target is ([a-z]+), increase the persistent damage dice to d(\d+)s\.$/.exec(tight);
        if (dismissDice) {
            const flag = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true)?.flag;
            const own = `{item|flags.system.rulesSelections.${flag}}`;
            const toggle = rules.find(rule => rule.key === "RollOption" && rule.toggleable === true && /^dismiss-/.test(rule.option ?? ""));
            const dice = rules.some(rule => rule.key === "DamageDice" && rule.selector === `${own}-damage` && rule.dieSize === `d${dismissDice[2]}` && rule.damageType === dismissDice[3]
                && JSON.stringify(rule.predicate) === JSON.stringify([toggle?.option]) && rank != null && ruleValueAtRank(rule.diceNumber, rank) === Number(dismissDice[1]));
            const faces = rules.some(rule => rule.key === "DamageAlteration" && rule.property === "dice-faces" && rule.mode === "upgrade" && String(rule.value) === dismissDice[5]
                && JSON.stringify(rule.predicate) === JSON.stringify([`target:mode:${dismissDice[4]}`]) && JSON.stringify(rule.selectors) === JSON.stringify([`${own}-damage`]));
            if (flag && toggle && dice && faces) stated.push(sentence);
            continue;
        }
        // "Your fists deal 1d6 bludgeoning damage, lose the nonlethal trait, and have reach.": PF2e's fist Strike with its
        // damage die upgraded (d4 to d6), nonlethal removed and reach added.
        const fists = /^Your fists deal 1d(6|8) bludgeoning damage, lose the nonlethal trait, and have reach\.$/.exec(sentence);
        if (fists) {
            const fist = rules.filter(rule => rule.itemId === "xxxxxxFISTxxxxxx" && rule.key === "ItemAlteration" && rule.predicate == null);
            const has = (mode, property, value) => fist.some(rule => rule.mode === mode && rule.property === property && (value === undefined || rule.value === value));
            if (rules.some(rule => rule.key === "Strike" && rule.fist === true)
                && fist.filter(rule => rule.property === "damage-dice-faces").length === FIST_FACES[fists[1]]
                && has("upgrade", "damage-dice-faces") && has("remove", "traits", "nonlethal") && has("add", "traits", "reach")) stated.push(sentence);
        }
    }
    return stated;
}

export function analyzeNativeEffectCompleteness(adapted, effect, termination = null, options = {}) {
    const profile = effect.document?.automation ?? null;
    const keys = new Set(profile?.ruleKeys ?? []);
    const fullText = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML))
        .replace(effect.sourceText, "")
        .trim();
    const replacement = replacementRule(fullText, adapted.source?.name);
    // "Benediction can counteract malediction.": casting it against the other spell is a counteract the GM resolves; a reminder.
    const escaped = String(adapted.source?.name ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // "In addition, this spell automatically attempts to counteract any Translocate cast by a devil within the area or cast by a devil
    // attempting to enter the area using dimension door." (and "If a devil attempts to enter the area using dimension door and the
    // spell is counteracted, the devil remains where it started."): a counteract the GM rolls when it happens; a reminder.
    const autoCounteract = /(?:^|(?<=[.!?]\s))(?:In addition, )?this spell automatically attempts to counteract any (?:@UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{([^}]+)\}|([a-z][a-z' ]{2,40})) cast by an? ([a-z]+) within the area(?: or cast by an? \3 attempting to enter the area using [a-z ]+)?\.(?=\s|$)/i.exec(fullText);
    const autoCounteractAfter = autoCounteract && new RegExp(`(?:^|(?<=[.!?]\\s))If an? ${autoCounteract[3]} attempts to enter the area using [a-z ]+ and the spell is counteracted, the ${autoCounteract[3]} remains where it started\\.(?=\\s|$)`, "i").exec(fullText);
    // "You must cast untamed shift using 2 actions for this benefit." (one option's cost; PF2e's choice doesn't check it): a reminder.
    // (It may follow the option's label: "Soaring Shape You must cast …".)
    const optionCost = /(?:^|(?<=[.!?]\s)|(?<=^[A-Z][a-z]+ [A-Z][a-z]+ ))You must cast [a-z' ]+ using (\d) actions for this benefit\.(?=\s|$)/m.exec(fullText);
    const counteractOther = escaped ? new RegExp(`(?:^|(?<=[.!?]\\s))${escaped} can counteract (?:@UUID\\[Compendium\\.pf2e\\.spells-srd\\.Item\\.[A-Za-z0-9]+\\]\\{([^}]+)\\}|([a-z][a-z' ]{2,40}))\\.(?=\\s|$)`, "i").exec(fullText) : null;
    // "…, granting 1d8 temporary Hit Points and ending one source of persistent acid, bleed, fire, poison, or void damage affecting
    // it. If the creature has persistent damage from more than one of these sources, you choose the one that ends.": the Effect's
    // TempHP from its rolled badge ((@item.level)d8), and the module ends that persistent damage on the recipient (asking the
    // caster when there's more than one). "… Concealed until the beginning of their next turn, though this obvious concealment
    // can't be used to Hide." is the Effect's granted Concealed, with a GM reminder.
    const mechanicsRules = effect.document?.mechanics?.rules ?? [];
    const tempEnd = /(?:^|(?<=[.!?]\s))[^.]*?, granting (\d+)d(\d+) temporary Hit Points and ending one source of persistent ((?:[a-z]+, )+or [a-z]+) damage affecting it\.(?=\s|$)/.exec(fullText);
    const chooseEnd = /(?:^|(?<=[.!?]\s))If the creature has persistent damage from more than one of these sources, you choose the one that ends\.(?=\s|$)/.exec(fullText);
    const badgeFormula = effect.document?.badge?.type === "formula" ? String(effect.document.badge.value ?? "") : "";
    const tempProved = tempEnd && chooseEnd && mechanicsRules.some(rule => rule.key === "TempHP" && rule.value === "@item.badge.value")
        && badgeFormula === `(@item.level)d${tempEnd[2]}` && Number(adapted.rank) === Number(tempEnd[1]);
    const endPersistent = tempProved ? { types: tempEnd[3].replace(/,? or /, ", ").split(/,\s*/), choice: true, sourceText: `${tempEnd[0].trim()} ${chooseEnd[0].trim()}` } : null;
    // (Links hold dots, so the sentence runs over "." not followed by a space.)
    const noHide = /(?:^|(?<=[.!?]\s))(?:[^.]|\.(?=\S))*?\{Concealed\} until the beginning of their next turn, though this obvious concealment can't be used to (?:@UUID\[[^\]]+\]\{Hide\}|Hide)\.(?=\s|$)/.exec(fullText);
    const hideNote = tempProved && noHide && mechanicsRules.some(rule => rule.key === "GrantItem" && rule.uuid === "Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W") ? noHide[0].trim() : null;
    // "After a creature has been targeted with bit of luck, it becomes temporarily immune for 24 hours." (from the cast) / "After canceling out
    // the misfortune effect, the spell ends, and you are then temporarily immune to wash your luck for 10 minutes." (once the Effect is used):
    // an immunity marker on the recipient that refuses the spell until it ends.
    const immuneCast = /(?:^|(?<=[.!?]\s))After a creature has been targeted with [a-z' ]+, it becomes temporarily immune for (\d+) (minute|hour|day)s?\.(?=\s|$)/.exec(fullText);
    const immuneUsed = /(?:^|(?<=[.!?]\s))After [a-z ,'-]{5,80}, the spell ends, and you are then temporarily immune to [a-z' ]+ for (\d+) (minute|hour|day)s?\.(?=\s|$)/.exec(fullText);
    const immunitySentence = immuneCast ?? immuneUsed;
    const temporaryImmunity = immunitySentence && !(immuneCast && immuneUsed) ? { key: adapted.source?.slug ?? String(adapted.source?.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        duration: { value: Number(immunitySentence[1]), unit: `${immunitySentence[2]}s` }, startsWhen: immuneCast ? "cast" : "effect-used", sourceText: immunitySentence[0].trim() } : null;
    // Condition sentences around the Effect:
    // - "When you Cast the Spell, the target falls Unconscious if it wasn't already." (with "While unconscious, it experiences a dream of your
    //   choice, though lucidly enough it can wake when it pleases." and "If it wakes up before 1 minute of sleep has passed, the spell ends."):
    //   PF2e's condition applied with the Effect; waking is the creature's, a GM note.
    // - "You are not Off-Guard to the attacker or spellcaster until the beginning of your next turn.": a GM note.
    // - "For the duration of the hex, the two of you share any vision-based senses (…) and gain a +2 status bonus to Perception checks, but if
    //   either of you are Blinded or Dazzled, you both are.": the Effect on both, and a GM note.
    const LINK = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
    const falls = new RegExp(String.raw`(?:^|(?<=[.!?]\s))When you Cast the Spell, the target falls (${LINK}(Unconscious|Prone)\}) if it wasn't already\.(?=\s|$)`).exec(fullText);
    const dreamWake = falls ? /(?:^|(?<=[.!?]\s))While unconscious, it experiences [^.]{3,80}, though lucidly enough it can wake when it pleases\.(?=\s|$)/.exec(fullText) : null;
    const wakeEnds = falls ? /(?:^|(?<=[.!?]\s))If it wakes up before (\d+) minutes? of sleep has passed, the spell ends\.(?=\s|$)/.exec(fullText) : null;
    const notOffGuard = new RegExp(String.raw`(?:^|(?<=[.!?]\s))You are not ${LINK}Off-Guard\} to the attacker or spellcaster until the beginning of your next turn\.(?=\s|$)`).exec(fullText);
    const sharedSenses = new RegExp(String.raw`(?:^|(?<=[.!?]\s))For the duration of the (?:hex|spell), the two of you share any vision-based senses \([^)]{5,80}\) and gain an? \+(\d) status bonus to Perception checks, but if either of you are ${LINK}Blinded\} or ${LINK}Dazzled\}, you both are\.(?=\s|$)`).exec(fullText);
    const sharedProved = sharedSenses && (effect.document?.mechanics?.rules ?? []).length === 1 && effect.document.mechanics.rules[0].key === "FlatModifier"
        && effect.document.mechanics.rules[0].selector === "perception" && effect.document.mechanics.rules[0].type === "status" && effect.document.mechanics.rules[0].value === Number(sharedSenses[1]);
    const castCondition = falls && dreamWake && wakeEnds ? { uuid: /@UUID\[([^\]]+)\]/.exec(falls[1])[1], slug: falls[2].toLowerCase(), sourceText: falls[0].trim() } : null;
    const conditionNotes = [
        ...(castCondition ? [`${dreamWake[0].trim()} ${wakeEnds[0].trim()} Remove the Effect if it wakes that early.`] : []),
        ...(notOffGuard ? ["The caster isn't Off-Guard to the triggering attacker or spellcaster until the start of their next turn."] : []),
        ...(sharedProved ? ["The caster and the target share vision-based senses (darkvision, low-light vision); if either is Blinded or Dazzled, apply it to both."] : [])];
    // "As part of Casting this Spell, you Recall Knowledge using Society to gain information about …": the caster's check, a reminder.
    const partOfCast = /(?:^|(?<=[.!?]\s))As part of Casting this Spell, you (@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Recall Knowledge\}|Recall Knowledge|Seek) using ([A-Z][a-z]+) to gain information about [^.]{3,80}\.(?=\s|$)/.exec(fullText);
    // "You can read the air only once in a given social situation; casting it again has no effect.": the GM's.
    const oncePerSituation = /(?:^|(?<=[.!?]\s))You can [a-z ]+ only once in a given [a-z ]+; casting it again has no effect\.(?=\s|$)/.exec(fullText);
    // "You are then temporarily immune to sure strike for 10 minutes.": from the cast (its Effect lasts only this turn).
    const immuneThen = !immunitySentence ? /(?:^|(?<=[.!?]\s))You are then temporarily immune to [a-z' ]+ for (\d+) (minute|hour)s?\.(?=\s|$)/.exec(fullText) : null;
    const thenImmunity = immuneThen ? { key: adapted.source?.slug ?? String(adapted.source?.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        duration: { value: Number(immuneThen[1]), unit: `${immuneThen[2]}s` }, startsWhen: "cast", sourceText: immuneThen[0].trim() } : null;
    // "The attack ignores circumstance penalties to the attack roll and any flat check required due to the target being Concealed or Hidden.":
    // PF2e suppresses the circumstance penalties; the flat check is the GM's.
    const ignoresFlat = new RegExp(String.raw`(?:^|(?<=[.!?]\s))The attack ignores circumstance penalties to the attack roll and any flat check required due to the target being ${LINK}Concealed\} or ${LINK}Hidden\}\.(?=\s|$)`).exec(fullText);
    const suppressed = ignoresFlat && (effect.document?.mechanics?.rules ?? []).some(rule => rule.key === "AdjustModifier" && rule.suppress === true && rule.selector === "attack-roll"
        && JSON.stringify(rule.predicate) === '["penalty:type:circumstance"]');
    // "The next time you make an attack roll …, roll it twice …" when PF2e's RollTwice isn't removed after the roll: a data note.
    const nextAttackOnly = /(?:^|(?<=[.!?]\s))The next time you make an attack roll before the end of your turn, roll it twice and use the better result\.(?=\s|$)/.exec(fullText);
    // "You immediately escape from every magical effect that has you Immobilized or Grabbed unless the effect is of a higher rank than your
    // unimpeded stride spell. You then Stride.": ending those effects and the Stride are the GM's.
    const escapeAll = new RegExp(String.raw`(?:^|(?<=[.!?]\s))You immediately escape from every magical effect that has you ${LINK}Immobilized\} or ${LINK}Grabbed\} unless the effect is of a higher rank than your [a-z' ]+ spell\.(?=\s|$)`).exec(fullText);
    const thenStride = escapeAll ? /(?:^|(?<=[.!?]\s))You then Stride\.(?=\s|$)/.exec(fullText) : null;
    const reactionNotes = [
        ...(suppressed ? ["That attack also ignores the flat check for the target being Concealed or Hidden."] : []),
        ...(escapeAll && thenStride ? ["End every magical effect of the spell's rank or lower that has the caster Immobilized or Grabbed (in Ongoing spells or on the sheet), then the caster Strides."] : [])];
    // A reaction's Trigger naming the actions it answers ("Trigger You attempt a Perception check to Seek, or you attempt a skill check to
    // Recall Knowledge …"), each of which the Effect's own predicates name (`action:recall-knowledge`): the trigger, not a rule of its own.
    const triggerLine = /^Trigger (?:[^.]|\.(?=\S))+\.(?=\s|$)/.exec(fullText);
    const triggerRules = JSON.stringify(effect.document?.mechanics?.rules ?? []);
    const triggerActions = triggerLine ? [...triggerLine[0].matchAll(/@UUID\[Compendium\.pf2e\.actionspf2e\.[^\]]+\]\{([^}]+)\}|\[\[\/act ([a-z-]+)\]\]/gi)].map(match => (match[1] ?? match[2]).toLowerCase().replace(/\s+/g, "-")) : [];
    const triggerCovered = triggerActions.length > 0 && triggerActions.every(slug => triggerRules.includes(`"action:${slug}"`)) ? triggerLine[0] : null;
    // "You can target 1 non-magical stone or sling bullet for every action you use Casting this Spell." / "Each stone can be used only once,
    // after which it crumbles to dust.": how many stones and their single use are the caster's and GM's.
    const perAction = /(?:^|(?<=[.!?]\s))You can target (?:1|one) [a-z -]+ for every action you use (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Casting this Spell\}|Casting this Spell)\.(?=\s|$)/.exec(fullText);
    const onceUsed = /(?:^|(?<=[.!?]\s))Each [a-z]+ can be used only once, after which it crumbles to dust\.(?=\s|$)/.exec(fullText);
    // "If you touch a tool, your proficiency rank with the next skill check you attempt with that tool (…) … increases to trained …" / "This
    // spell has no benefit for activities that take longer than a minute to complete.": the tool branch is the GM's (PF2e's Effect is the weapon's).
    const toolBranch = /(?:^|(?<=[.!?]\s))If you touch a tool, your proficiency rank with the next skill check you attempt with that tool \([^)]{3,80}\) within the spell's duration temporarily increases to trained \([^)]{3,60}\)\.(?=\s|$)/.exec(fullText);
    const noLongActivities = /(?:^|(?<=[.!?]\s))This spell has no benefit for activities that take longer than a minute to complete\.(?=\s|$)/.exec(fullText);
    const itemNotes = [
        ...(perAction ? ["One stone or sling bullet per action spent casting; the Effect alters all the holder's sling ammunition, so track which are enchanted."] : []),
        ...(onceUsed ? [onceUsed[0].trim()] : []),
        ...(toolBranch ? ["Touching a tool instead: the next skill check with it within the duration uses trained proficiency (expert at 6th rank); PF2e's Effect covers only the weapon."] : []),
        ...(noLongActivities ? [noLongActivities[0].trim()] : [])];
    // The table rules around a stated Effect (batch 136):
    // - "For the duration of this spell, you can't drop your weapon, and you gain a +4 circumstance bonus to your Reflex DC against attempts to
    //   Disarm you." with PF2e's reflex-dc modifier for Disarm: not dropping the weapon is the GM's.
    // - "You create a token, …; as part of Casting the Spell, you can Interact to pass the token to an ally within your reach." / "As long as the
    //   ally has the token on their person, they gain …": the token is the GM's; the Effect holds the bonus.
    // - "When you Cast the Spell and as long as you Sustain it, your apparition provides you with … tools …" and the exploration-mode paragraph:
    //   the tools and the 8-hour casting are the GM's.
    const weldedSentence = new RegExp(String.raw`(?:^|(?<=[.!?]\s))For the duration of this spell, you can't drop your weapon, and you gain a \+(\d) circumstance bonus to your Reflex DC against attempts to (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Disarm\}|Disarm) you\.(?=\s|$)`).exec(fullText);
    const weldedProved = weldedSentence && (effect.document?.mechanics?.rules ?? []).some(rule => rule.key === "FlatModifier" && rule.selector === "reflex-dc" && rule.type === "circumstance"
        && rule.value === Number(weldedSentence[1]) && JSON.stringify(rule.predicate) === '["action:disarm"]');
    const tokenPass = /(?:^|(?<=[.!?]\s))You create a token, such as [^;]{3,80}, that persists for the spell's duration; as part of Casting the Spell, you can (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Interact\}|Interact) to pass the token to an ally within your reach\.(?=\s|$)/.exec(fullText);
    const tokenBonus = tokenPass ? /(?:^|(?<=[.!?]\s))As long as the ally has the token on their person, they gain an? \+(\d) status bonus to Performance checks and Will saves\.(?=\s|$)/.exec(fullText) : null;
    const tokenProved = tokenBonus && (effect.document?.mechanics?.rules ?? []).length === 1 && effect.document.mechanics.rules[0].key === "FlatModifier"
        && JSON.stringify(effect.document.mechanics.rules[0].selector) === '["performance","will"]' && effect.document.mechanics.rules[0].value === Number(tokenBonus[1]);
    const tokenOpening = tokenProved ? /(?:^|(?<=[.!?]\s))You grant an ally a token of favor\.(?=\s|$)/.exec(fullText) : null;
    const workshopTrained = /(?:^|(?<=[.!?]\s))For the duration of this spell, you are trained in Crafting and Thievery\.(?=\s|$)/.exec(fullText);
    const workshopTools = workshopTrained ? /(?:^|(?<=[.!?]\s))When you Cast the Spell and as long as you Sustain it, your apparition provides you with [^.]{10,200}\.(?=\s|$)/.exec(fullText) : null;
    const workshopLong = workshopTrained ? /You can cast this spell as an exploration or downtime activity with a casting time of 10 minutes;[\s\S]*$/.exec(fullText) : null;
    const workshopProved = workshopTrained && workshopTools && workshopLong && !/\d+d\d+|@Damage|@Check|conditionitems/.test(workshopLong[0]);
    const tableNotes = [
        ...(weldedProved ? ["The caster can't drop the weapon for the duration."] : []),
        ...(tokenProved ? ["The bonus lasts only while the ally carries the token; remove the Effect if the ally loses it."] : []),
        ...(workshopProved ? ["The apparition's tools (alchemist's toolkit, repair kit, thieves' toolkit) are the caster's while the spell lasts. Cast as a 10-minute exploration or downtime activity it lasts 8 hours and adds an alchemist's lab and forge: extend the Effect. PF2e's Effect raises the ranks by level (trained, expert from 3rd, master from 5th, legendary from 9th)."] : [])];
    // Batch 137 — the table rules around a stated Effect:
    const mechanicsRules137 = effect.document?.mechanics?.rules ?? [];
    const claim137 = [];
    const notes137 = [];
    const sentence137 = pattern => { const match = new RegExp(String.raw`(?:^|(?<=[.!?]\s))${pattern}(?=\s|$)`).exec(fullText); return match ? match[0].trim() : null; };
    // Figment: the illusion's make-up and a failed diversion's disbelief.
    const diversion = sentence137(String.raw`When you Cast or Sustain the Spell, you can attempt to (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Create a Diversion\}|Create a Diversion) with the illusion, gaining a \+\d circumstance bonus to your Deception check\.`);
    if (diversion && mechanicsRules137.some(rule => rule.key === "FlatModifier" && rule.value === Number(/gaining a \+(\d)/.exec(diversion)[1]) && JSON.stringify(rule.predicate) === '["action:create-a-diversion"]')) {
        const parts = [String.raw`You create a simple illusory sound or vision\.`, String.raw`A sound adds the auditory trait to the spell and the sound can't include intelligible words or elaborate music\.`,
            String.raw`A vision adds the visual trait, can be no larger than a 5-foot cube, and is clearly crude and undetailed if viewed from within 15 feet\.`,
            String.raw`If the attempt fails against a creature, that creature disbelieves the (?:figment|illusion) \.?\.?`].map(sentence137);
        if (parts.every(Boolean)) { claim137.push(diversion, ...parts); notes137.push("The illusion (a sound or a crude vision up to a 5-foot cube) is the GM's; a creature the Create a Diversion attempt fails against disbelieves it."); }
    }
    // Read Aura: what the caster learns, and illusions.
    const advise = sentence137(String.raw`You or anyone you advise about the aura gains a \+\d circumstance bonus to (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Identify Magic\}|Identify Magic) on the item\.`);
    if (advise && mechanicsRules137.some(rule => rule.key === "FlatModifier" && rule.value === Number(/gains a \+(\d)/.exec(advise)[1]) && JSON.stringify(rule.predicate) === '["action:identify-magic"]')) {
        const parts = [String.raw`You focus on the target object, opening your mind to perceive magical auras\.`, String.raw`When the casting is complete, you know whether that item is magical\.`,
            String.raw`If the object is illusory, you detect this only if the effect's rank is lower than the rank of your [a-z ]+ spell\.`].map(sentence137);
        if (parts.every(Boolean)) { claim137.push(advise, ...parts); notes137.push("GM: tell the caster whether the item is magical (an illusory object only if its effect's rank is lower than the spell's)."); }
    }
    // Light: the orb's colour, moving it on a Sustain, and the four-lights limit.
    const attach = sentence137(String.raw`If you create the light in the same space as a willing creature, you can attach the light to the creature, causing it to float near that creature as it moves\.`);
    if (attach && mechanicsRules137.length === 1 && mechanicsRules137[0].key === "TokenLight") {
        const parts = [String.raw`You create an orb of light that sheds bright light in a \d+-foot radius \(and dim light for the next \d+ feet\) in a color you choose\.`,
            String.raw`You can Sustain the spell to move the light up to \d+ feet; you can attach or detach it from a creature as part of this movement\.`,
            String.raw`If you Cast the Spell while you already have four light spells active, you must choose one of the existing spells to end\.`].map(sentence137);
        if (parts.every(Boolean)) { claim137.push(attach, ...parts); notes137.push("The light's colour is the caster's choice. Sustain moves it up to 60 feet (attach or detach it then); with four lights already active, one of them ends."); }
    }
    // Fishing Spot: the roll picks PF2e's fish (the list's order), the fish is cooked and eaten later.
    const rollSentence = sentence137(String.raw`After 10 minutes of fishing, you catch a magical fish; roll \[\[\/r (1d\d+)(?: #[^\]]*)?\]\] to see which fish you caught and the effects gained from eating it once it's cooked\.`);
    const fishChoice = mechanicsRules137.find(rule => rule.key === "ChoiceSet" && Array.isArray(rule.choices));
    let rolledChoice = null;
    if (rollSentence && fishChoice) {
        const names = fishChoice.choices.map(choice => String(choice.value).replace(/-/g, " "));
        const lower = fullText.toLowerCase();
        const positions = names.map(name => lower.indexOf(name));
        const ordered = positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1]));
        const faces = Number(/1d(\d+)/.exec(rollSentence)[1]);
        const parts = [String.raw`You conjure a fishing rod and an extraplanar pool teeming with fish\.`,
            String.raw`The fish must be cooked and eaten \(a process that takes about 30 minutes\) within 1 hour of being caught, and the listed effect lasts for 1 hour after consumption\.`,
            String.raw`Each fish can feed only a single creature\.`].map(sentence137);
        if (ordered && faces === names.length && parts.every(Boolean)) {
            const list = fullText.slice(positions[0] - 0).match(new RegExp(`^${names[0]}[\\s\\S]*$`, "i"))?.[0] ?? "";
            rolledChoice = { formula: `1d${faces}`, ruleIndex: mechanicsRules137.indexOf(fishChoice), values: fishChoice.choices.map(choice => choice.value), sourceText: rollSentence };
            claim137.push(rollSentence, ...parts, list.trim());
            notes137.push("The fish is cooked (about 30 minutes) and eaten within 1 hour of the catch; each feeds one creature.");
        }
    }
    // Batch 138:
    // - Illusory Disguise: the disguise's appearance rules are the GM's; "counts as setting up a disguise for the Impersonate use of Deception;
    //   it ignores any circumstance penalties …, gives a +4 status bonus …, and lets the target add its level …" with PF2e's two modifiers for
    //   Impersonate (the ignored penalty is a GM note).
    const disguise = sentence137(String.raw`Casting [a-z ]+ counts as setting up a disguise for the (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Impersonate\}|Impersonate) use of Deception; it ignores any circumstance penalties the target might take for disguising itself as a dissimilar creature, gives a \+(\d) status bonus to Deception checks to prevent others from seeing through the disguise, and lets the target add its level to such Deception checks even if untrained\.`);
    const disguiseBonus = disguise ? Number(/gives a \+(\d) status bonus/.exec(disguise)[1]) : null;
    const disguiseProved = disguise && mechanicsRules137.some(rule => rule.key === "FlatModifier" && rule.selector === "deception" && rule.type === "status" && rule.value === disguiseBonus
        && JSON.stringify(rule.predicate) === '["action:impersonate"]')
        && mechanicsRules137.some(rule => rule.key === "FlatModifier" && rule.type === "proficiency" && rule.value === "@actor.level" && JSON.stringify(rule.predicate) === '["action:impersonate"]');
    if (disguiseProved) {
        const parts = [String.raw`You create an illusion that causes the target to appear as another creature of the same body shape, and with roughly similar height \(within 6 inches\) and weight \(within 50 pounds\)\.`,
            String.raw`The disguise is typically good enough to hide their identity, but not to impersonate a specific individual\.`, String.raw`The spell changes their appearance and voice, but not mannerisms\.`,
            String.raw`You can change the appearance of its clothing and worn items, such as making its armor look like a dress\.`,
            String.raw`Held items are unaffected, and any worn item removed from the creature returns to its true appearance\.`].map(sentence137);
        if (parts.every(Boolean)) { claim137.push(disguise, ...parts); notes137.push("The disguise (appearance and voice, same body shape) is the GM's to describe; don't apply a circumstance penalty for disguising as a dissimilar creature."); }
    }
    // - Swear Oath: Readying the action, the one-action casting and the Focus Point are the caster's and GM's.
    const oathSentence = sentence137(String.raw`If the trigger you designate occurs and you can use the chosen action as a reaction, you gain a \+\d status bonus to any attack roll or skill check required\.`);
    if (oathSentence && mechanicsRules137.some(rule => rule.key === "RollOption" && rule.toggleable === true)) {
        const parts = [String.raw`You loudly and firmly state a course of action that you swear to fulfill\.`, String.raw`When you Cast this Spell, Ready a single action or free action you can use\.`,
            String.raw`If the action is in line with your personal edicts or the edicts presented by your religion, you can Cast this Spell as a single action\.`,
            String.raw`If the trigger you designate doesn't occur, you can Sustain the spell on your next turn to regain the Focus Point spent for this spell\.`].map(sentence137);
        if (parts.every(Boolean)) { claim137.push(oathSentence, ...parts); notes137.push("Caster: Ready a single action or free action as part of the cast (1 action if it's in line with your edicts). If its trigger doesn't occur, Sustain on your next turn to regain the Focus Point."); }
    }
    // - Forbidding Ward: the ward sentence is the Effect's (with the mark on the enemy).
    const wardSentence = sentence137(String.raw`The target ally gains a \+\d status bonus to Armor Class and saving throws against the target enemy's attacks, spells, and other effects\.`);
    const wardOpening = wardSentence ? sentence137(String.raw`You ward an ally against the attacks and hostile spells from the target enemy\.`) : null;
    if (wardSentence && wardOpening && mechanicsRules137.some(rule => rule.key === "TokenMark")) claim137.push(wardSentence, wardOpening);
    // "Once it does this, the spell ends." when PF2e's Effect doesn't remove itself after the roll: a data note.
    const onceEnds = /(?:^|(?<=[.!?]\s))Once it does this, the spell ends\.(?=\s|$)/.exec(fullText);
    const text = [...ruleStatedSentences(fullText, effect.document?.mechanics?.rules, { rank: adapted.rank }), ...(replacement ? [replacement.sentence] : []),
        ...(temporaryImmunity ? [temporaryImmunity.sourceText] : []), ...(onceEnds ? [onceEnds[0].trim()] : []),
        ...(partOfCast ? [partOfCast[0].trim()] : []), ...(oncePerSituation ? [oncePerSituation[0].trim()] : []),
        ...(perAction ? [perAction[0].trim()] : []), ...(onceUsed ? [onceUsed[0].trim()] : []), ...(toolBranch ? [toolBranch[0].trim()] : []), ...(noLongActivities ? [noLongActivities[0].trim()] : []),
        // The Dismiss sentence a compiled termination carries (its link to PF2e's Dismiss action included).
        ...(termination ? [/(?:^|(?<=[.!?]\s))You can (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Dismiss\}|Dismiss) the spell(?: as a free action)?\.(?=\s|$)/.exec(fullText)?.[0]?.trim() ?? ""] : []),
        ...(weldedProved ? [weldedSentence[0].trim()] : []), ...(tokenProved ? [tokenPass[0].trim(), tokenBonus[0].trim(), ...(tokenOpening ? [tokenOpening[0].trim()] : [])] : []),
        ...(workshopProved ? [workshopTrained[0].trim(), workshopTools[0].trim(), workshopLong[0].trim()] : []),
        ...claim137, ...(triggerCovered ? [triggerCovered] : []), ...(thenImmunity ? [thenImmunity.sourceText] : []), ...(suppressed ? [ignoresFlat[0].trim()] : []), ...(nextAttackOnly ? [nextAttackOnly[0].trim()] : []),
        ...(escapeAll && thenStride ? [escapeAll[0].trim(), thenStride[0].trim()] : []),
        ...(castCondition ? [falls[0].trim(), dreamWake[0].trim(), wakeEnds[0].trim()] : []), ...(notOffGuard ? [notOffGuard[0].trim()] : []), ...(sharedProved ? [sharedSenses[0].trim()] : []),
        ...(counteractOther ? [counteractOther[0]] : []), ...(autoCounteract ? [autoCounteract[0], ...(autoCounteractAfter ? [autoCounteractAfter[0]] : [])] : []), ...(optionCost ? [optionCost[0]] : []), ...(endPersistent ? [tempEnd[0].trim(), chooseEnd[0].trim()] : []), ...(hideNote ? [hideNote] : [])]
        .reduce((remaining, sentence) => remaining.replace(sentence, ""), fullText).trim();
    const blockers = [];

    if (!profile) blockers.push("effect-document-not-audited");
    if (profile && keys.size === 0) blockers.push("effect-has-no-rule-elements");
    if (/@Damage\[/i.test(text)) blockers.push("inline-damage");
    // ("1d6 persistent fire damage": up to two words between the dice and "damage".)
    if (/\b\d+d\d+\s+(?:[a-z]+\s+){0,2}damage\b/i.test(text)) blockers.push("description-damage");
    // "The target becomes a +1 striking weapon …": a weapon's runes are a rule the Effect's rules must state.
    if (/\ba \+\d [a-z ]*weapon\b/i.test(text)) blockers.push("weapon-runes");
    // Persistent damage the Effect's proof didn't claim (dealing it, or ending it) is a rule of its own. (A battle form's stat
    // block — "Damage 2d4 piercing plus 1 persistent bleed", "double damage dice (including persistent damage)" — is the form's.)
    if (/\b(?:deals?|dealing|takes?|taking|ends?|ending|removes?|removing)\b[^.]{0,60}\bpersistent\b[^.]{0,40}\bdamage\b/i.test(text)) blockers.push("persistent-damage");
    if (/@Check\[/i.test(text)) blockers.push("inline-check");
    if (/@Template\[/i.test(text)) blockers.push("inline-template");
    if (/\b(?:at the gm'?s discretion|as determined by the gm)\b/i.test(text)) blockers.push("gm-adjudication");
    if (/\bDismiss\b/i.test(text) && !termination) blockers.push("dismissal");
    blockers.push(...(termination?.blockers ?? []));
    if (/\bcounteract\b/i.test(text)) blockers.push("counteract");
    if (/\byou cast\b.{0,160}?\bas part of casting\b/i.test(text)) blockers.push("embedded-cast");
    if (/\bteleport(?:s|ed|ing)?\b/i.test(text)) blockers.push("movement");
    if (/\bimmune to this spell\b/i.test(text)) blockers.push("temporary-immunity");
    if (/\bdivided? (?:[a-z ]{0,20})?(?:as you choose )?among\b/i.test(text)) blockers.push("distribution");
    if (/\bincapacitation\b/i.test(text)) blockers.push("incapacitation-adjustment");
    if (/\bnewer spell replaces the older\b|\breplaces the older one\b/i.test(text)) blockers.push("replacement");
    // A resistance the text states ("resistance 2 to all damage", "(minimum 1)") that isn't the Effect's at the spell's rank:
    // PF2e's Effect decides, and the card notes the difference.
    const dataNotes = [];
    // "resistance … equal to half the spell's rank (minimum 1)" where PF2e's value is only the half (user decision: the text): the minimum
    // is added to PF2e's formula on the module's Effect.
    const halfMinimum = /\bresistance \d+ to ([a-z -]+?) damage equal to half the spell's rank \(minimum (\d+)\)/i.exec(fullText);
    const halfRule = halfMinimum ? (effect.document?.mechanics?.rules ?? []).findIndex(rule => rule.key === "Resistance" && String(rule.value).replace(/\s+/g, "") === "floor(@item.level/2)") : -1;
    const resistanceOverride = halfRule >= 0 ? [{ index: halfRule, key: "Resistance", patch: { value: `max(${halfMinimum[2]},floor(@item.level/2))` } }] : [];
    const resistanceNote = resistanceOverride.length ? false : resistanceMismatch(fullText, effect.document?.mechanics?.rules, adapted.rank);
    if (resistanceNote) dataNotes.push(resistanceNote);
    if (effect.recipient?.dataNote) dataNotes.push(effect.recipient.dataNote);
    // Where the text limits PF2e's Effect to one use, the module removes it after that roll (user decision: the text); `consumeOn` says which.
    const effectRules = effect.document?.mechanics?.rules ?? [];
    const weaponFlag = effectRules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems && (rule.choices.types ?? []).includes("weapon"))?.flag ?? null;
    let consumeOn = null, ruleOverrides = [...resistanceOverride], durationOverride = null;
    if (nextAttackOnly && !effectRules.some(rule => rule.key === "RollTwice" && rule.removeAfterRoll)) consumeOn = { on: "attack-roll", sourceText: nextAttackOnly[0]?.trim?.() ?? "the next attack" };
    const usedRoll = effectRules.find(rule => rule.key === "RollTwice" && ["saving-throw", "attack-roll", "skill-check", "perception"].includes(rule.selector));
    if (onceEnds && profile?.removesAfterRoll !== true) {
        if (usedRoll && !consumeOn) consumeOn = { on: usedRoll.selector, sourceText: onceEnds[0].trim() };
        else if (!consumeOn) dataNotes.push(`PF2e's ${effect.reference} doesn't remove itself after it's used; remove it once the target has used it (“${onceEnds[0].trim()}”).`);
    }
    // "Weapon surge ends once you complete this Strike or the weapon leaves your possession.", with the next-Strike sentence
    // stated: PF2e's Effect lasts to the start of your next turn for every Strike with the weapon (a data note).
    const strikeEnds = new RegExp(`(?:^|(?<=[.!?]\\s+))${String(adapted.source?.name ?? "\u0000").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} ends once you complete this Strike or the weapon leaves your possession\\.(?=\\s|$)`, "i").exec(text);
    if (strikeEnds && fullText !== text && /On your next Strike with that weapon/.test(fullText) && !/On your next Strike with that weapon/.test(text)) {
        if (weaponFlag) consumeOn = { on: "strike", weaponFlag, sourceText: strikeEnds[0].trim() };
        else dataNotes.push(`PF2e's ${effect.reference} applies to every Strike with the weapon until the start of your next turn; the text ends it after the first Strike (or when the weapon leaves your possession). Remove it then.`);
    }
    // "Heightened (6th) You can choose up to two effects from the list." read by PF2e's extra ChoiceSets on the actor's level
    // ({"gte": ["parent:level", 6]}), not the cast rank: a data note.
    const effectRulesAll = effect.document?.mechanics?.rules ?? [];
    const extraChoices = effectRulesAll.filter(rule => rule.key === "ChoiceSet" && rule.allowNoSelection === true
        && (rule.predicate ?? []).some(term => Array.isArray(term?.gte) && term.gte[0] === "parent:level"));
    // (User decision: the text.) Each extra choice is offered from the Heightened rank that allows it: removed below it, its level term
    // dropped at or above it.
    const extraRanks = [...String(adapted.descriptionHTML ?? "").matchAll(/<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*You can choose up to (two|three) effects from the list\./gi)]
        .map(match => ({ rank: Number(match[1]), count: match[2].toLowerCase() === "two" ? 2 : 3 }));
    const rankGatedChoices = extraChoices.length && extraRanks.length === extraChoices.length ? extraChoices.map((rule, index) => ({ index: effectRulesAll.indexOf(rule),
        rank: extraRanks.find(entry => entry.count === index + 2)?.rank, predicate: (rule.predicate ?? []).filter(term => !(Array.isArray(term?.gte) && term.gte[0] === "parent:level")) })) : null;
    if (extraChoices.length && !(rankGatedChoices ?? []).every(entry => Number.isInteger(entry.rank) && entry.index >= 0))
        dataNotes.push(`PF2e's ${effect.reference} offers its extra choices by your level (${extraChoices.map(rule => rule.predicate.find(term => Array.isArray(term?.gte)).gte[1]).join(" and ")}), not the spell's rank; choose only as many as the cast rank allows (1, 2 at 6th rank, 3 at 10th).`);
    // "… gains fast healing 1 for as long as it's within 15 feet of the target thrall.": PF2e's Effect lasts its duration regardless.
    const nearThrall = /\bgains fast healing \d+ for as long as it's within (\d+) feet of the target thrall\b/.exec(fullText);
    // (User decision: the text.) The module binds the thrall and switches the fast healing off while the creature is farther away.
    const fastHealing = (effect.document?.mechanics?.rules ?? []).findIndex(rule => rule.key === "FastHealing" && !rule.predicate);
    const nearToken = nearThrall && fastHealing >= 0 ? { trait: "thrall", feet: Number(nearThrall[1]), ruleIndex: fastHealing } : null;
    if (nearThrall && !nearToken && (effect.document?.mechanics?.rules ?? []).some(rule => rule.key === "FastHealing"))
        dataNotes.push(`PF2e's ${effect.reference} lasts its full duration; the text's fast healing lasts only while the creature is within ${nearThrall[1]} feet of the thrall. Remove it if the creature moves farther away.`);
    // The next-hit sentence stated: PF2e's dice apply to every hit until the Effect ends.
    if (/On the next successful attack with that weapon during the spell's duration/.test(fullText) && !/On the next successful attack with that weapon/.test(text))
        if (weaponFlag) consumeOn = { on: "weapon-damage", weaponFlag, sourceText: "On the next successful attack with that weapon" };
        else dataNotes.push(`PF2e's ${effect.reference} adds the damage to every hit with the weapon while it lasts; the text adds it only to the next successful attack. Remove it after that hit.`);
    // A listed material PF2e's choice doesn't offer (PF2e's choice applies).
    const materialSentence = /You can choose for the metal to become your choice of ((?:[a-z ]+, )+or [a-z ]+), causing the attack to bypass resistances accordingly\./.exec(fullText);
    const materialRules = effect.document?.mechanics?.rules ?? [];
    if (materialSentence && materialRules.some(rule => rule.key === "AdjustStrike" && rule.property === "materials")) {
        const offered = materialRules.filter(rule => rule.key === "ChoiceSet" && Array.isArray(rule.choices)).flatMap(rule => rule.choices.map(option => option.value));
        const missing = materialSentence[1].replace(/,? or /, ", ").split(/,\s*/).map(name => name.trim()).filter(name => !offered.includes(name.replace(/ /g, "-")));
        if (missing.length) dataNotes.push(`PF2e's ${effect.reference} doesn't offer ${missing.join(" or ")}; to choose it, pick either option and the GM ignores the material.`);
    }
    // The dismiss-for-damage sentence stated by a toggle: PF2e adds the dice as ordinary damage, and the Effect stays until removed.
    if (/Whenever you successfully Strike a creature with the weapon, you can Dismiss the spell as a free action to deal \d+d\d+ persistent/.test(fullText)
        && !/Whenever you successfully Strike a creature with the weapon, you can Dismiss/.test(text))
    {
        // The toggle's dice become persistent (the text), and using them Dismisses the spell: the Effect is removed after that damage roll.
        const toggle = effectRules.find(rule => rule.key === "RollOption" && rule.toggleable && /^dismiss-/.test(rule.option ?? ""));
        const dice = toggle ? effectRules.findIndex(rule => rule.key === "DamageDice" && JSON.stringify(rule.predicate) === JSON.stringify([toggle.option]) && !rule.category) : -1;
        if (toggle && dice >= 0) {
            ruleOverrides.push({ index: dice, key: "DamageDice", patch: { category: "persistent" } });
            consumeOn = { on: "damage-roll", option: toggle.option, sourceText: "you can Dismiss the spell as a free action to deal … persistent … damage" };
        } else dataNotes.push(`PF2e's ${effect.reference} has a toggle that adds the dice to the Strike's damage as ordinary damage of that type, not persistent damage; after using it, remove the Effect (the spell is Dismissed).`);
    }
    // "… until the start of your next turn" while PF2e's Effect runs 1 round to a turn's end: PF2e's duration applies.
    const effectDuration = effect.document?.mechanics?.duration;
    if (/\buntil the start of your next turn\b/i.test(fullText) && effectDuration?.unit === "rounds" && effectDuration.value === 1 && effectDuration.expiry === "turn-end")
        durationOverride = { value: 1, unit: "rounds", expiry: "turn-start" };
    // "Each time you Sustain the spell, the emanation's radius increases …" needs the Effect's counter raised per Sustain.
    // "Each time you Sustain the spell, the emanation's radius increases by 5 feet, to a maximum of 30 feet.": the Effect's Aura
    // radius is a step times its counter badge, whose last value is that maximum. The runtime raises the badge on each Sustain.
    const growthSentence = /\bEach time you Sustain the spell, the emanation's radius increases by (\d+) feet, to a maximum of (\d+) feet\./.exec(text);
    const aura = (effect.document?.mechanics?.rules ?? []).find(rule => rule.key === "Aura");
    const badge = effect.document?.badge ?? effect.badge ?? null;
    const step = growthSentence && /^(\d+) \* @item\.badge\.value$/.exec(String(aura?.radius ?? "").replace(/\s+/g, " ").trim());
    const sustainGrowth = step && badge?.type === "counter" && Number(step[1]) === Number(growthSentence[1]) && Array.isArray(badge.labels)
        && Number(step[1]) * badge.labels.length === Number(growthSentence[2]) && Number(badge.value) === 1
        ? { feet: Number(step[1]), maximum: Number(growthSentence[2]), badgeMax: badge.labels.length, sourceText: growthSentence[0] } : null;
    // "Once per round on subsequent turns, you can Sustain the spell to increase the emanation's radius by 10 feet." with an
    // Aura radius "5 + @item.badge.value * 10" whose first value is the spell's emanation: optional growth, one badge step
    // per Sustain. The spell lasts its own duration either way; the badge's last label is the largest radius.
    const optionalSentence = !sustainGrowth && /\bOnce per round on subsequent turns, you can Sustain the spell to increase the emanation's radius by (\d+) feet\./.exec(text);
    const offsetStep = optionalSentence && /^(\d+) \+ @item\.badge\.value \* (\d+)$/.exec(String(aura?.radius ?? "").replace(/\s+/g, " ").trim());
    const optionalGrowth = offsetStep && badge?.type === "counter" && Array.isArray(badge.labels) && Number(badge.value) === 1
        && Number(offsetStep[2]) === Number(optionalSentence[1]) && adapted.targeting?.area?.type === "emanation"
        && Number(offsetStep[1]) + Number(offsetStep[2]) === Number(adapted.targeting.area.value)
        ? { feet: Number(offsetStep[2]), maximum: Number(offsetStep[1]) + Number(offsetStep[2]) * badge.labels.length, badgeMax: badge.labels.length, optional: true,
            sourceText: optionalSentence[0] } : null;
    const growth = sustainGrowth ?? optionalGrowth;
    if (/\bsustain\b[^.]*\b(?:radius|emanation|aura)\b[^.]*\bincreases?\b|\bsustain the spell to increase\b/i.test(growth ? text.replace(growth.sourceText, "") : text)) blockers.push("sustain-growth");
    if (/\bShield Block\b/.test(text) && !keys.has("GrantItem")) blockers.push("granted-or-follow-up-action");
    if (/\b(?:reduces|increases|changes) (?:[a-z']+ ){0,2}size\b|\bbecomes? (?:Tiny|Small|Medium|Large|Huge|Gargantuan)\b/.test(text) && !keys.has("CreatureSize")) blockers.push("size-change");
    // A reaction limited to "the triggering …" needs an Effect that ends or is
    // removed after the roll; an unlimited Effect would keep applying.
    if (effect.reactionCast && /\btriggering\b/i.test(text) && effect.document?.mechanics?.duration?.unit === "unlimited"
        && profile?.removesAfterRoll !== true) blockers.push("unbounded-trigger-effect");
    if (/\b(?:recover from|flat check)\b/i.test(text)) blockers.push("recovery-check");
    if (/\b(?:can't cast this spell if|must have space|spell is lost)\b/i.test(text)) blockers.push("prerequisite-or-placement");

    // Actions the text lists ("DCs against Athletics skill actions such as Disarm, Reposition, Shove, and Trip") that the
    // Effect's predicates name (`action:disarm`): the Effect covers them. A "such as" list may name only examples.
    // Every sentence naming an action must be a bonus sentence with a "such as" list ("You and your allies gain a +1 status
    // bonus to … skill actions such as Disarm, …"), and a FlatModifier of that value and type must name those actions.
    const actionSentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(sentence => /@UUID\[Compendium\.pf2e\.actionspf2e\./i.test(sentence));
    const modifiers = (effect.document?.mechanics?.rules ?? []).filter(rule => rule.key === "FlatModifier");
    const suchAs = sentence => {
        const bonus = /\bgains? an? \+(\d+) (status|circumstance|item) bonus\b[^.]*\bsuch as\b/i.exec(sentence);
        const slugs = [...sentence.matchAll(/@UUID\[Compendium\.pf2e\.actionspf2e\.[^\]]+\]\{([^}]+)\}/gi)].map(match => match[1].toLowerCase().replace(/\s+/g, "-"));
        const covering = modifiers.filter(rule => bonus && Number(rule.value) === Number(bonus[1]) && rule.type === bonus[2].toLowerCase());
        return bonus && slugs.every(slug => covering.some(rule => JSON.stringify(rule.predicate ?? []).includes(`action:${slug}`)));
    };
    // "a +1 status bonus to Athletics checks, Intimidation checks to Demoralize, and Stealth checks to Hide or Sneak": every
    // action link sits in a "<Skill> checks to <Action>[ or <Action>]" phrase, and for each action named there a FlatModifier of
    // that value (at the cast rank) and type, on that skill, has the `action:` predicate. "… to Hide in areas of dim light or
    // darkness" also needs the dim-light and darkness lighting predicates.
    const skillActions = sentence => {
        const bonus = /\ban? \+(\d+) (status|circumstance|item) bonus to\b/i.exec(sentence);
        if (!bonus) return false;
        const plain = sentence.replace(/@UUID\[Compendium\.pf2e\.actionspf2e\.[^\]]+\]\{([^}]+)\}/gi, "\u0001$1\u0002");
        const NAME = "(?:\u0001[^\u0002]+\u0002|[A-Z][a-z]+(?: [A-Z][a-z]+)?)";
        // The list after "bonus to" is only skill checks (optionally "to <Action>") and saves: nothing the Effect doesn't state.
        const ITEM = new RegExp(String.raw`^(?:[A-Z][a-z]+ checks(?: to ${NAME}(?: or ${NAME})*(?: in areas of dim light or darkness)?)?|(?:Fortitude|Reflex|Will) saves)$`);
        const list = /\bbonus to (.+)\.$/.exec(plain.trim())?.[1] ?? "";
        if (!list.split(/,\s*(?:and\s+)?|\s+and\s+(?=[A-Z])/).every(item => ITEM.test(item.trim()))) return false;
        const phrases = [...plain.matchAll(new RegExp(String.raw`\b([A-Z][a-z]+) checks to (${NAME}(?: or ${NAME})*)( in areas of dim light or darkness)?`, "g"))];
        const claimed = phrases.map(match => match[2]).join(" ");
        if ((plain.match(/\u0001/g) ?? []).length !== (claimed.match(/\u0001/g) ?? []).length) return false;
        return phrases.length > 0 && phrases.every(([, skill, list, lighting]) => list.split(" or ").every(name => {
            const slug = name.replace(/[\u0001\u0002]/g, "").toLowerCase().replace(/\s+/g, "-");
            return modifiers.some(rule => {
                const predicate = JSON.stringify(rule.predicate ?? []);
                return rule.type === bonus[2].toLowerCase() && ruleValueAtRank(rule.value, adapted.rank) === Number(bonus[1])
                    && [rule.selector].flat().includes(skill.toLowerCase()) && predicate.includes(`"action:${slug}"`)
                    && (!lighting || (predicate.includes('"lighting:dim-light"') && predicate.includes('"lighting:darkness"')));
            });
        }));
    };
    // A battle form's ability ("<strong>Grabbing Trunk</strong> … If you succeed at your Grapple check against a creature grabbed by your
    // trunk, …") that PF2e's form shows as its Note (title PF2E.BattleForm.Note.GrabbingTrunk.Title): the Note carries the action's text.
    const formNotes = keys.has("BattleForm") ? [...String(adapted.descriptionHTML ?? "").matchAll(/<p><strong>([A-Z][A-Za-z ]+)<\/strong>([\s\S]*?)<\/p>/g)]
        .filter(([, name]) => (effect.document?.mechanics?.rules ?? []).some(rule => rule.key === "Note"
            && rule.title === `PF2E.BattleForm.Note.${name.split(" ").map(word => word[0].toUpperCase() + word.slice(1)).join("")}.Title`))
        .map(([, , body]) => htmlToPlainText(body).replace(/\s+/g, " ")) : [];
    const formNote = sentence => formNotes.some(body => body.includes(sentence.replace(/\s+/g, " ").trim()));
    // "The target gains a +2 status bonus on Deception checks to Create a Diversion and to Feint, and on Performance checks to Perform that have
    // the visual trait." (Sparkleskin): each named action has a FlatModifier of that value and type on its skill, predicated on the action (and on
    // the trait where the sentence says so).
    const actionBonuses = sentence => {
        const bonus = /^The target gains an? \+(\d) (status|circumstance) bonus on ([A-Z][a-z]+) checks to (.+)\.$/.exec(sentence);
        if (!bonus) return false;
        const clauses = sentence.split(/, and on /).map((clause, index) => index === 0 ? clause : `on ${clause}`);
        return clauses.every(clause => {
            const skill = /\bon ([A-Z][a-z]+) checks to /.exec(clause)?.[1]?.toLowerCase();
            const trait = /that have the ([a-z]+) trait\.?$/.exec(clause)?.[1];
            const slugs = [...clause.matchAll(/@UUID\[Compendium\.pf2e\.actionspf2e\.[^\]]+\]\{([^}]+)\}/g)].map(match => match[1].toLowerCase().replace(/\s+/g, "-"));
            return skill && slugs.length > 0 && slugs.every(slug => modifiers.some(rule => rule.selector === skill && rule.type === bonus[2] && Number(rule.value) === Number(bonus[1])
                && JSON.stringify(rule.predicate ?? []).includes(`"action:${slug}"`) && (!trait || JSON.stringify(rule.predicate ?? []).includes(`"item:trait:${trait}"`))));
        });
    };
    const actionsCovered = actionSentences.length > 0 && actionSentences.every(sentence => suchAs(sentence) || skillActions(sentence) || formNote(sentence) || actionBonuses(sentence));
    if (actionsCovered && actionSentences.some(suchAs)) dataNotes.push(`PF2e's Effect covers ${actionSentences.flatMap(sentence => [...sentence.matchAll(/\{([^}]+)\}/g)].map(match => match[1])).join(", ")}; the text's list is examples (“such as”), so other actions are the GM's call.`);
    addUnsupportedSignal(blockers,
        /@UUID\[Compendium\.pf2e\.actionspf2e\./i.test(text),
        keys.has("GrantItem") || actionsCovered,
        "referenced-action");
    addUnsupportedSignal(blockers,
        /@UUID\[Compendium\.pf2e\.conditionitems\./i.test(text),
        hasAny(keys, ["GrantItem", "Immunity", "BattleForm"]),
        "condition-interaction");
    addUnsupportedSignal(blockers,
        /\btemporarily immune\b/i.test(text),
        keys.has("GrantItem"),
        "temporary-immunity");
    addUnsupportedSignal(blockers,
        /\b(?:choose|choice|pick one|pick two|random)\b/i.test(text),
        profile?.requiresConfiguration === true || options.choiceResolved === true,
        "choice-resolution");
    addUnsupportedSignal(blockers,
        /\b(?:as a|spend(?:ing)?)\s+(?:an?\s+)?(?:single|one|two|three|\d+)[ -]actions?\b|\bcan take the\b[^.!?]*\baction\b|\brequires?\s+(?:an?\s+)?(?:Interact\s+)?action\b/i.test(text),
        keys.has("GrantItem"),
        "granted-or-follow-up-action");
    addUnsupportedSignal(blockers,
        /\bafter which the spell ends\b|\bspell ends after\b/i.test(text),
        profile?.removesAfterRoll === true,
        "consumption-timing");

    return {
        ...(growth ? { sustainGrowth: growth } : {}),
        ...(rolledChoice ? { rolledChoice } : {}),
        ...(castCondition ? { castCondition } : {}),
        ...(sharedProved ? { alsoSource: true } : {}),
        ...(counteractOther || hideNote || autoCounteract || optionCost || conditionNotes.length || partOfCast || oncePerSituation || reactionNotes.length || itemNotes.length || tableNotes.length || notes137.length ? { gmNotes: [
            ...conditionNotes, ...reactionNotes, ...itemNotes, ...tableNotes, ...notes137,
            ...(partOfCast ? [`Caster: as part of the cast, attempt ${partOfCast[1].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/, "$1")} using ${partOfCast[2]}.`] : []),
            ...(oncePerSituation ? [oncePerSituation[0].trim()] : []),
            ...(optionCost ? [`${optionCost[0].replace(/\s+\./g, ".")} PF2e's choice doesn't check the actions spent.`] : []),
            ...(counteractOther ? [`${adapted.source.name} can counteract ${counteractOther[1] ?? counteractOther[2]}: cast against it, that's a counteract check the GM resolves.`] : []),
            ...(autoCounteract ? [`${autoCounteract[0].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/^In addition, t/, "T")}${autoCounteractAfter ? ` ${autoCounteractAfter[0]}` : ""} The GM rolls the counteract check when it happens.`.replace(/\s+\./g, ".")] : []),
            ...(hideNote ? ["The target's concealment from this spell can't be used to Hide."] : [])] } : {}),
        ...(endPersistent ? { endPersistent } : {}),
        ...(temporaryImmunity ?? thenImmunity ? { temporaryImmunity: temporaryImmunity ?? thenImmunity } : {}),
        complete: blockers.length === 0,
        blockers: [...new Set(blockers)],
        requiresConfiguration: profile?.requiresConfiguration === true,
        ...(replacement ? { replaces: replacement.spells, replacementText: replacement.sentence } : {}),
        ...(dataNotes.length ? { dataNotes } : {}),
        ...(consumeOn ? { consumeOn } : {}), ...(ruleOverrides.length ? { ruleOverrides } : {}), ...(durationOverride ? { durationOverride } : {}),
        ...(rankGatedChoices && rankGatedChoices.every(entry => Number.isInteger(entry.rank) && entry.index >= 0) ? { rankGatedChoices } : {}),
        ...(effect.recipient?.autoToggle ? { autoToggle: effect.recipient.autoToggle } : {}),
        ...(effect.recipient?.oncePerSource ? { oncePerSource: effect.recipient.oncePerSource } : {}),
        ...(nearToken ? { nearToken } : {})
    };
}

/**
 * "Special Your eidolon can benefit from either boost eidolon or @UUID[…]{Reinforce Eidolon}, but not both; if you cast
 * one of these spells during the other's duration, the newer spell replaces the older one.": one of the two is this
 * spell; applying its Effect removes the other's (the caster's) from the recipient.
 */
export function replacementRule(text, spellName) {
    const match = /(?:^|(?<=[.!?]\s))(?:Special )?Your [a-z ]+ can benefit from either (@UUID\[[^\]]+\]\{([^}]+)\}|[a-z' ]+?) or (@UUID\[[^\]]+\]\{([^}]+)\}|[a-z' ]+?), but not both; if you cast one of these spells during the other's duration, the newer spell replaces the older one\./.exec(String(text ?? ""));
    if (!match) return null;
    const names = [match[2] ?? match[1], match[4] ?? match[3]].map(name => name.trim());
    const self = String(spellName ?? "").trim().toLowerCase();
    const others = names.filter(name => name.toLowerCase() !== self);
    if (others.length !== 1 || names.length - others.length !== 1) return null;
    return { spells: others, sentence: match[0].trim() };
}

export function compileDirectEffectResolution(adapted, nativeEffects, outcomes) {
    const outcomeApplications = Object.values(nativeEffects.outcomes ?? {})
        .reduce((total, effects) => total + effects.length, 0);
    const eligible = adapted.defense.kind === "none"
        && adapted.damageComponents.length === 0
        && nativeEffects.onUse.length === 1
        && (nativeEffects.deferred?.length ?? 0) === 0
        && (nativeEffects.sequences?.length ?? 0) === 0
        && nativeEffects.unscoped.length === 0
        && outcomeApplications === 0;
    if (!eligible) return null;

    const effect = nativeEffects.onUse[0];
    const termination = (nativeEffects.terminations ?? [])
        .find(candidate => candidate.id === effect.terminationId) ?? null;
    const completeness = analyzeNativeEffectCompleteness(adapted, effect, termination);
    if (globalThis.process?.env?.DER_DEBUG) console.error("DER", JSON.stringify(completeness.blockers));
    // The structural duration-bound recipient rule only proves who receives a
    // complete Effect; it never enables a partial one.
    if ((String(effect.recipient?.evidence ?? "").startsWith("duration-bound") || effect.recipient?.actor === "area-allies" || effect.recipient?.evidence === "native-aura-centre" || effect.reactionCast) && !completeness.complete) return null;
    const level = completeness.complete
        ? completeness.requiresConfiguration ? "prompted" : "automatic"
        : "guided";

    return {
        resolution: {
            kind: "effect",
            check: null,
            sharedDamage: null,
            outcomes,
            postDamageTerminal: null,
            ...(completeness.replaces ? { replaces: { spells: completeness.replaces, sourceText: completeness.replacementText } } : {}),
            // Where PF2e's Effect data and the text differ, the Effect is applied and the GM is told how.
            ...(completeness.dataNotes ? { dataNotes: completeness.dataNotes } : {}),
            // The text's corrections to PF2e's Effect: removed after the use it's for, rules patched, the duration fixed.
            ...(completeness.consumeOn ? { consumeOn: completeness.consumeOn } : {}),
            ...(completeness.ruleOverrides ? { ruleOverrides: completeness.ruleOverrides } : {}),
            ...(completeness.durationOverride ? { durationOverride: completeness.durationOverride } : {}),
            ...(completeness.rankGatedChoices ? { rankGatedChoices: completeness.rankGatedChoices } : {}),
            ...(completeness.autoToggle ? { autoToggle: completeness.autoToggle } : {}),
            ...(completeness.oncePerSource ? { oncePerSource: completeness.oncePerSource } : {}),
            ...(completeness.nearToken ? { nearToken: completeness.nearToken } : {}),
            // An aura growing on each Sustain (its badge raised by the Sustain control).
            ...(completeness.sustainGrowth ? { sustainGrowth: completeness.sustainGrowth } : {}),
            ...(completeness.gmNotes ? { gmNotes: completeness.gmNotes } : {}),
            // "… ending one source of persistent … damage affecting it": the runtime ends it on the recipient.
            ...(completeness.endPersistent ? { endPersistent: completeness.endPersistent } : {}),
            // "… temporarily immune for 24 hours": a marker on each recipient (from the cast, or once the Effect is used).
            ...(completeness.temporaryImmunity ? { temporaryImmunity: completeness.temporaryImmunity } : {}),
            // "the target falls Unconscious": PF2e's condition on each recipient when the Effect is applied.
            ...(completeness.castCondition ? { castCondition: completeness.castCondition } : {}),
            // "the two of you … gain …": the Effect also goes on the caster.
            ...(completeness.alsoSource ? { alsoSource: true } : {}),
            // "roll 1d8 to see which fish you caught": the module rolls and answers PF2e's choice with the listed one.
            ...(completeness.rolledChoice ? { rolledChoice: completeness.rolledChoice } : {}),
            applications: [{
                kind: "native-spell-effect",
                uuid: effect.uuid,
                source: "nativeEffects.onUse",
                ...(effect.terminationId ? { terminationId: effect.terminationId } : {})
            }]
        },
        automation: {
            level,
            confidence: completeness.complete ? 1 : 0.75,
            compiledCapabilities: [
                "source",
                "targeting",
                "direct-effect-resolution",
                "native-spell-effect-on-use"
            ],
            pendingCapabilities: completeness.blockers.map(blocker => `direct-effect:${blocker}`)
        },
        completeness
    };
}

/** Whether the text's resistance value (or minimum) disagrees with the Effect's Resistance rules at the rank. */
export function resistanceMismatch(text, rules, rank) {
    const resistances = (rules ?? []).filter(rule => rule.key === "Resistance");
    if (!resistances.length || rank == null) return false;
    const note = values => `PF2e's Effect gives resistance ${values.join("/")} at rank ${rank}; the text's value differs (${String(text).match(/\bresistance[^.]*\./i)?.[0] ?? "resistance"}).`;
    const plain = String(text ?? "");
    const minimum = /\bresistance\b[^.]*\(minimum (\d+)\)/i.exec(plain);
    const literal = [...plain.matchAll(/\bresistance (\d+) to ([a-z -]+?)(?: damage)?(?=[\s,.(])/gi)];
    // Only a number the text states is checked (a value "equal to your level" is the Effect's to compute).
    if (!minimum && !literal.length) return false;
    const values = resistances.map(rule => ruleValueAtRank(rule.value, rank));
    if (values.some(value => value == null)) return `PF2e's Effect computes its resistance from the creature; the text states a number (${String(text).match(/\bresistance[^.]*\./i)?.[0] ?? "resistance"}).`;
    if (minimum && values.some(value => value < Number(minimum[1]))) return note(values);
    for (const stated of literal) {
        if (/\bequal to\b/i.test(plain.slice(stated.index, stated.index + stated[0].length + 30))) continue;
        if (!values.includes(Number(stated[1]))) return note(values);
    }
    return false;
}

