import {htmlToPlainText} from './description-parser.js';

function hasUnmatchedTypedDamage(text, components) {
    const claims=[...text.matchAll(/\b(\d+(?:d\d+)?)\s+(persistent\s+)?([a-z][a-z-]*)\s+damage\b/gi)]
        .map(match=>({formula:match[1].toLowerCase(),persistent:Boolean(match[2]),type:match[3].toLowerCase()}));
    const available=(components??[]).map(component=>({
        formula:String(component.formula??'').replace(/\s+/g,'').toLowerCase(),
        persistent:component.category==='persistent'||component.type==='bleed',
        type:String(component.type??'').toLowerCase(),
        damage:component.kinds?.includes('damage')
    }));
    for (const claim of claims) {
        const index=available.findIndex(component=>component.damage
            && component.formula===claim.formula && component.persistent===claim.persistent
            && component.type===claim.type);
        if (index<0) return true;
        available.splice(index,1);
    }
    return false;
}

// "Regardless of the result of its save, it's temporarily immune to shadow projectile for 1 hour.", "After attempting its
// save, the target becomes temporarily immune for 24 hours.", "No matter the result, it's then temporarily immune for
// 24 hours.", "After the effects are resolved, the target is temporarily immune for 1 day.", "The target must attempt a
// Will save and is then temporarily immune for 24 hours." The immunity must be to this spell (or unnamed).
const IMMUNE_LEAD = String.raw`(?:(?:Regardless of (?:(?:their|its) result|the (?:result|outcome|effects?)(?: of (?:its|the|that|their) (?:save|saving throw))?)|No matter the result|After attempting its save|After the effects? (?:is|are) resolved),\s+)`;
// ("a creature is then temporarily immune": The End is Nigh, Oracles+.)
// ("creatures are temporarily immune to this spell": Ruler of Everything, Clerics+.)
const IMMUNE_SUBJECT = String.raw`(?:(the target|the creature|each target|a creature|creatures)\s+(?:is|becomes|are)|(it|they)(?:'s|’s|\s+is|\s+becomes|\s+become|\s+are))`;
// ("… is immune to lose the path for 1 hour." without "temporarily" is the same timed immunity.)
const IMMUNE_TAIL = String.raw`(?:\s+then)?\s+(?:temporarily )?immune(?: to ([a-z' ]+?))? for (\d+|one) (minute|hour|day)s?\.$`;
const IMMUNE_SENTENCE = new RegExp(String.raw`^${IMMUNE_LEAD}?${IMMUNE_SUBJECT}${IMMUNE_TAIL}`, "i");
const SAVE_AND_IMMUNE = new RegExp(String.raw`^The (?:target|creature) must attempt an? (Fortitude|Reflex|Will) save and is then temporarily immune for (\d+|one) (minute|hour|day)s?\.$`, "i");
// The sentence before a pronoun must have the target itself save with the item's statistic ("Any creature that ends its turn in the aura must
// attempt a Will saving throw with the following effects." names the saving creature too).
const TARGET_SAVES = /^(?:(?:[^.]*?\b)?(?:the target|the creature|each target|it) (?:must attempt|attempts?) an? (Fortitude|Reflex|Will) (?:save|saving throw)\b[^.]*|The (?:target|creature) takes [^.]+?,? depending on its (Fortitude|Reflex|Will) save|(?:Any|Each) creature that [^.]+? must attempt an? (Fortitude|Reflex|Will) (?:save|saving throw)(?: with the following effects)?|(?:All|Each) (?:enemies|creatures|enemy creatures)\b[^.]*? must attempt an? (Fortitude|Reflex|Will) (?:save|saving throw))\.$/i;

/** Degree tables do not account for rules placed before them. */
export function compileSaveImmunity(html, saveStatistic = null, spellName = null) {
    const prefix=String(html??'').split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const text=htmlToPlainText(prefix);
    const sentences=text.split(/(?<=[.!?])\s+/).map(sentence=>sentence.trim()).filter(Boolean);
    for (const sentence of sentences) {
        const direct=sentence.match(/^The (?:target|creature) (?:then becomes|is then) temporarily immune for (\d+) (minute|hour)s?\.$/i);
        if (direct) return {duration:{value:Number(direct[1]),unit:`${direct[2].toLowerCase()}s`},sourceText:sentence};
        // "Afterward, the target is temporarily immune for 1 day." (a day is 24 hours)
        const afterward=sentence.match(/^Afterward, the (?:target|creature) is temporarily immune for (\d+) (minute|hour|day)s?\.$/i);
        if (afterward) return afterward[2].toLowerCase()==='day'
            ? {duration:{value:Number(afterward[1])*24,unit:'hours'},sourceText:sentence}
            : {duration:{value:Number(afterward[1]),unit:`${afterward[2].toLowerCase()}s`},sourceText:sentence};
        // "Once this spell ends, the target becomes temporarily immune for 1 minute.": immune while the spell lasts, then
        // for the stated time after it ends.
        const after=sentence.match(/^Once this spell ends, the (?:target|creature) becomes temporarily immune for (\d+) (minute|hour)s?\.$/i);
        if (after) return {duration:{value:Number(after[1]),unit:`${after[2].toLowerCase()}s`},startsWhen:'spell-ended',sourceText:sentence};
    }
    // "It" has a clear antecedent only when the immediately preceding
    // sentence names the target and the same saving throw as the item.
    for (let index=0;index<sentences.length-1;index++) {
        const save=sentences[index].match(/^The target attempts a (Fortitude|Reflex|Will) save\.$/i);
        const pronoun=sentences[index+1].match(/^Regardless of the result, it(?:'|’)s then temporarily immune for (\d+) (minute|hour)s?\.$/i);
        if (save && pronoun && save[1].toLowerCase()===String(saveStatistic??'').toLowerCase()) {
            return {duration:{value:Number(pronoun[1]),unit:`${pronoun[2].toLowerCase()}s`},sourceText:sentences[index+1]};
        }
    }
    const count = value => /^one$/i.test(value) ? 1 : Number(value);
    for (const [index, sentence] of sentences.entries()) {
        const combined = SAVE_AND_IMMUNE.exec(sentence);
        if (combined) {
            if (combined[1].toLowerCase() !== String(saveStatistic ?? '').toLowerCase()) return null;
            return {duration:{value:count(combined[2]),unit:`${combined[3].toLowerCase()}s`},sourceText:sentence};
        }
        const match = IMMUNE_SENTENCE.exec(sentence);
        if (!match) continue;
        // "it" refers to the creature only right after the sentence that has it save.
        const previous = TARGET_SAVES.exec(sentences[index - 1] ?? '');
        if (match[2] && !(previous && (previous[1] ?? previous[2] ?? previous[3] ?? previous[4]).toLowerCase() === String(saveStatistic ?? '').toLowerCase())) return null;
        // Immune to this spell only: its own name, or one plain name of a single spell (the text naming itself; the item's name isn't needed,
        // so a renamed copy reads the same). A family ("all curses of death"), "your …", or a plural isn't this cast's immunity.
        const named = match[3]?.trim().toLowerCase();
        const plainName = named && /^[a-z']+(?: [a-z']+){0,3}$/.test(named) && !/\b(?:all|any|every|each|other|your|their|its|such|spells|curses|effects|abilities|these|those)\b/.test(named);
        if (named && named !== String(spellName ?? '').trim().toLowerCase() && !plainName) return null;
        return {duration:{value:count(match[4]),unit:`${match[5].toLowerCase()}s`},sourceText:sentence};
    }
    return null;
}
/**
 * Creature-state immunity PF2e does not model (blood, internal organs,
 * breathing). It compiles to a question the GM must answer per target before
 * Finalize. Only whole-spell scope is accepted ("this effect" is ambiguous).
 */
export function compileStateImmunity(html, { effectIsSpell = false } = {}) {
    const prefix=String(html??'').split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences=htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence=>sentence.trim()).filter(Boolean);
    const found=[];
    for (const sentence of sentences) {
        let match=/^(?:A (?:nonliving|non-living) creature with ([a-z ]{2,30}) in its body(?: \(such as [^)]+\))? can be affected, but )?a creature with no ([a-z ]{2,30}) is immune\.$/i.exec(sentence);
        if (match && (!match[1] || match[1].toLowerCase()===match[2].toLowerCase())) { found.push({sentence,question:`Does the creature have ${match[2].toLowerCase()}? A creature with no ${match[2].toLowerCase()} is immune.`}); continue; }
        match=/^Creatures (?:that|which) lack ([a-z ]{2,30}) are unaffected by this spell\.$/i.exec(sentence);
        if (match) { found.push({sentence,question:`Does the creature have ${match[1].toLowerCase()}? Creatures that lack ${match[1].toLowerCase()} are unaffected.`}); continue; }
        // "Terrestrial creatures in the affected area must attempt a Reflex save …":
        // only creatures on the ground are affected; the GM confirms per target.
        match=/^Terrestrial creatures in the (?:affected )?area must attempt an? (?:Fortitude|Reflex|Will) save\b[^.]*\.$/i.exec(sentence);
        if (match) { found.push({sentence,question:'Is the creature terrestrial (standing on the ground)? Only terrestrial creatures are affected.'}); continue; }
        // "Creatures whose bodies contain no significant moisture (such as fire elementals) are immune to breath of drought."
        match=/^Creatures whose bodies contain no significant ([a-z ]{2,30}?)(?: \(such as [^)]+\))? are immune to (?:this spell|[a-z' ]{2,40})\s*\.$/i.exec(sentence);
        if (match) { found.push({sentence,question:`Does the creature's body contain significant ${match[1].toLowerCase()}? Creatures whose bodies contain none are immune.`}); continue; }
        // "Each creature in the area that can hear must attempt a Will save." (Confusing Cry): only creatures that can hear; the GM confirms
        // each target.
        match=/^(?:Each creature|All (?:enemies|creatures|enemy creatures)) in the (?:area|emanation|burst|cone|line) that can hear(?: you| your [a-z]+)? must attempt an? (?:Fortitude|Reflex|Will) save\.$/i.exec(sentence);
        if (match) { found.push({sentence,question:'Can the creature hear? Only creatures that can hear are affected.'}); continue; }
        // "The target of this spell must be able to see, hear, or otherwise understand you." (Roaring Applause)
        match=/^The target of this spell must be able to see, hear, or otherwise understand you\.$/i.exec(sentence);
        if (match) { found.push({sentence,question:'Can the creature see, hear, or otherwise understand the caster? Only such a target is affected.'}); continue; }
        // "Each creature along the line and on solid ground takes 4d6 bludgeoning damage and 6d6 fire damage with a Reflex save." (Blazing
        // Fissure): only creatures on solid ground. Only the qualifier is claimed; the damage stays for the gate to match against PF2e's.
        match=/^(Each creature along the line and on solid ground) takes [^.]+ with an? (?:basic )?(?:Fortitude|Reflex|Will) save\.$/i.exec(sentence);
        if (match) { found.push({sentence,claim:match[1],question:'Is the creature on solid ground? Only creatures on solid ground are affected.'}); continue; }
        // ("… immune to this effect." only where the spell is one effect: a basic save with its riders, Fungal Exhalation.)
        match=(effectIsSpell ? /^A creature that doesn't ([a-z ]{2,20}) is immune to this (?:spell|effect)\.$/i : /^A creature that doesn't ([a-z ]{2,20}) is immune to this spell\.$/i).exec(sentence);
        if (match) found.push({sentence,question:`Does the creature ${match[1].toLowerCase()}? A creature that doesn't is immune.`});
    }
    if (found.length!==1) return null;
    return {predicate:{kind:'gm-confirmed',question:found[0].question,sourceText:found[0].sentence},sentence:found[0].claim ?? found[0].sentence};
}

// Who a sentence limits the save or a damage component to: "Each incorporeal creature in the area takes …", "… plus an additional 8d4 void
// damage to living creatures.", "Each enemy creature within … must attempt …", "Each creature in the area that can hear must attempt …", "Each
// creature along the line and on solid ground …", "The target of this spell must be able to see, hear, or otherwise understand you.". Only a
// recipient: quantified ("each", "all", …), given the damage, or the subject of the save, damage or immunity. Narration ("rough aquatic
// creatures grow on the target's body", "As your enemies attempt to approach you", "the flesh of the undead") and the target already chosen
// ("The triggering enemy attempts a Will save.") limit nothing.
const NEUTRAL_QUALIFIERS = new Set(['other', 'such', 'targeted', 'affected', 'chosen', 'single', 'nearby', 'adjacent', 'remaining', 'additional', 'these',
    'those', 'its', 'their', 'your', 'the', 'of', 'two', 'three', 'four', 'five', 'six', 'ten', 'more', 'secondary', 'primary', 'original', 'triggering']);
const TRAIT_WORDS = String.raw`(?:non-?)?(?:living|undead|incorporeal|corporeal|construct|fiend|celestial|monitor|elemental|plant|fungus|animal|beast|dragon|humanoid|spirit|mindless|metal|flying|terrestrial|aquatic|swimming|airborne|skeletal)`;
const QUANTIFIER = String.raw`\b(?:each|every|all|any|only|no)\s+(?:of\s+(?:the|your)\s+)?`;
// What follows a recipient: where it is ("in the area", "within a @Template[…]") and then its save, damage or immunity.
const RECIPIENT_VERB = String.raw`(?:\s+(?:in|within|along|inside)\b[^.;]{0,80}?)?,?\s+(?:must attempt|attempts? an? (?:basic )?(?:Fortitude|Reflex|Will|save|saving)|takes?\b|are (?:immune|unaffected)|is (?:immune|unaffected))`;
const TRAIT_RECIPIENT = new RegExp(String.raw`(?:${QUANTIFIER}|\b(?:damage|terrain) to (?:all |each )?|^)(${TRAIT_WORDS})\s+(?:creatures?|enem(?:y|ies)|foes|targets)\b|\b(${TRAIT_WORDS})\s+(?:creatures|enemies|foes)${RECIPIENT_VERB}`, 'gi');
const ENEMY_RECIPIENT = new RegExp(String.raw`(?:${QUANTIFIER}(?:${TRAIT_WORDS}\s+)?enem(?:y|ies)|(?<!\b(?:the|triggering|that|this)\s)\b(?:enemies|foes))(?:\s+creatures?)?${RECIPIENT_VERB}|${QUANTIFIER}enemy creatures?\b|\bdamage to (?:all |each |your )?(?:enemies|foes|enemy creatures)\b|\btargets? only enemies\b|\bonly (?:affects? )?enemies\b`, 'i');
export function recipientQualifiers(text) {
    const found = [];
    for (const sentence of String(text ?? '').split(/(?<=[.!?])\s+/).map(entry => entry.trim()).filter(Boolean)) {
        const add = qualifier => found.push({ qualifier: qualifier.toLowerCase().replace(/^non(?!-)/, 'non-'), sentence });
        for (const match of sentence.matchAll(TRAIT_RECIPIENT)) add(match[1] ?? match[2]);
        for (const match of sentence.matchAll(new RegExp(String.raw`${QUANTIFIER}((?:non-?)?[a-z]+)\s+(?:creatures?|enem(?:y|ies)|foes|targets)\b`, 'gi')))
            if (!NEUTRAL_QUALIFIERS.has(match[1].toLowerCase()) && !/^(?:non-?)?allied$|^enemy$|^hostile$/i.test(match[1])) add(match[1]);
        for (const match of sentence.matchAll(/\bcreatures? with the ([a-z]+) trait\b/gi)) add(match[1]);
        for (const match of sentence.matchAll(/\b(?:Tiny|Small|Medium|Large|Huge|Gargantuan) or (?:smaller|larger)\b/g)) add(`size:${match[0]}`);
        if (ENEMY_RECIPIENT.test(sentence)) add('enemy');
        if (/\bnon-?allied (?:creatures?|enem)/i.test(sentence)) add('non-allied');
        for (const match of sentence.matchAll(/\b(?:that|who) can (hear|see)\b(?: you)?,? (?:must attempt|attempts?|takes?)\b|\bmust be able to (see|hear|understand)\b/gi)) add(`sense:${match[1] ?? match[2]}`);
        if (/\bon solid ground\b|\bstanding on the ground\b/i.test(sentence)) add('situation:ground');
    }
    return found;
}

/** Whether a plan's compiled targeting (or a trait-scoped damage part) carries the recipient a qualifier names. */
export function recipientQualifierCompiled(plan, qualifier) {
    const predicates = plan?.targeting?.actorConstraints?.predicates ?? [];
    const kinds = new Set(predicates.map(predicate => predicate.kind));
    const asked = predicates.filter(predicate => predicate.kind === 'gm-confirmed').map(predicate => `${predicate.question ?? ''} ${predicate.sourceText ?? ''}`.toLowerCase());
    const traits = [
        ...predicates.filter(predicate => predicate.kind === 'trait').map(predicate => `${predicate.present === false ? 'non-' : ''}${predicate.slug}`),
        ...(plan?.resolution?.conditionalDamage ?? []).map(entry => entry.trait),
        plan?.resolution?.traitVariant?.trait
    ].filter(Boolean).map(trait => String(trait).toLowerCase());
    if (qualifier === 'enemy') return kinds.has('enemy-of-caster') || kinds.has('non-ally-of-caster');
    if (qualifier === 'non-allied') return kinds.has('non-ally-of-caster') || kinds.has('enemy-of-caster');
    if (qualifier === 'living') return kinds.has('living-creature') || kinds.has('living-or-undead') || traits.includes('living');
    if (qualifier === 'undead') return traits.includes('undead') || kinds.has('undead-or-void-healing') || kinds.has('living-or-undead');
    if (qualifier.startsWith('size:')) return kinds.has('size-at-most') || kinds.has('size-at-least');
    const word = qualifier.replace(/^(?:sense|situation):/, '').replace(/^non-?/, '');
    if (qualifier.startsWith('sense:') || qualifier.startsWith('situation:')) return asked.some(text => text.includes(word === 'see' ? 'see' : word));
    // "corporeal" is "not incorporeal" (Worm's Repast's "1 corporeal creature").
    if (qualifier === 'corporeal') return traits.includes('non-incorporeal');
    if (qualifier.startsWith('non-')) return traits.includes(qualifier) || traits.includes(`non-${word}`) || (plan?.resolution?.traitVariant?.excludedTraits ?? []).includes(word);
    return traits.includes(word) || asked.some(text => text.includes(word));
}

export function uncompiledSavePreamble(html, immunity = null, {damageComponents = [], claimedSentences = [], recipients = null} = {}) {
    // A reaction's "Trigger" paragraph says when it's cast ("A creature within range becomes Frightened"), not a rule on the target.
    const prefix=String(html??'').split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0]
        .replace(/^\s*<p>\s*<strong>\s*Trigger\s*<\/strong>[^<]*(?:@UUID\[[^\]]+\]\{[^}]+\}[^<]*)*<\/p>/i,'');
    const plain=claimedSentences.reduce((text,sentence)=>text.replace(sentence,''),htmlToPlainText(prefix));
    const immunityStart=immunity?.sourceText ? plain.indexOf(immunity.sourceText) : -1;
    const immunityEnd=immunityStart < 0 ? -1 : immunityStart + immunity.sourceText.length;
    const trailingText=immunityEnd >= 0 && plain.slice(immunityEnd).trim().length > 0;
    // "While the sound is loud, only those closest can feel the true sting of death in it.": a "While" sentence with no rule in
    // it is narration, not an ongoing condition.
    const text=plain.replace(immunity?.sourceText ?? '\u0000','')
        .split(/(?<=[.!?])\s+/).filter(sentence=>!(/^While\b/.test(sentence.trim())
            && !/\d|@|\[\[|\b(?:damage|save|saving|bonus|penalty|condition|immune|turn|round|minute|hour|action|reaction|can't|cannot|must|gains?|loses?|takes?|ends?|spell|effect|area|Sustain)\b/i.test(sentence)))
        // "Moonburst 's cold damage is silver damage for the purposes of weaknesses, resistances, and the like.": PF2e's own damage part
        // carries the material, so its roll applies it.
        .filter(sentence => {
            const material = /^[A-Z][a-z' -]*?\s?['’]s ([a-z]+) damage is ([a-z]+) damage for the purposes of weaknesses, resistances, and the like\.$/.exec(sentence.trim());
            return !material || !(damageComponents ?? []).some(component => String(component.type ?? '').toLowerCase() === material[1]
                && (component.materials ?? []).map(entry => String(entry).toLowerCase()).includes(material[2]));
        }).join(' ');
    const signals=[
        ['temporary-immunity',/\btemporarily immune\b/i],
        ['conditional-eligibility',/\b(?:immune|immunit(?:y|ies)|unaffected|only affects?)\b/i],
        // "while" is an ongoing condition only as a clause opener or with a
        // subject state ("while it is..."); ", while the blood..." is a conjunction.
        // "At the start of each of the target's turns, it must attempt a Will save" is a recurring save, not a one-time one.
        ['ongoing-trigger',/\b(?:ends? its turn|starts? its turn|begins? (?:its|their) turn|each turn|each round|whenever|each time|as long as)\b|\b(?:start|end) of each of (?:its|their|the target's|the creature's) turns\b|(?:^|[.;:]\s*)While\b|\bwhile (?:it|they|the target|the creature|you|affected|in|within|under|the spell|the effect|this spell|this effect)\b|\benters?\b/i],
        ['counteract',/\bcounteract/i],
        // "If a creature affected by parch drinks a liquid, …, the spell ends." ends the effect early: a rule the notes carry.
        ['ends-early',/\b(?:the (?:spell|effect) ends|end the (?:spell|effect))\b/i],
        // Terrain the save's area leaves behind must be compiled (a lingering area's terrain), never dropped.
        ['terrain',/\bdifficult terrain\b|\bhazardous terrain\b/i],
        // Plurals too: "(this damage bypasses its resistances)" is a rule on the damage (Dirge of Remembrance).
        ['modifier',/\b(?:bonus(?:es)?|penalt(?:y|ies)|resistances?|weakness(?:es)?|bypass(?:es)?|increases?|decreases?)\b/i],
        ['additional-condition',/@UUID\[Compendium\.pf2e\.conditionitems\./i],
        ['restriction',/\b(?:can't|cannot|must not)\b/i],
        ['action-change',/\b(?:the target|the creature|it|they)\s+(?:gains?|loses?)\s+\d+\s+actions?\b/i],
        // Caster healing or temporary HP needs a compiled damage-derived benefit.
        ['caster-benefit',/\btemporary Hit Points\b|\bregains? (?:\d+ )?Hit Points\b/i],
        ['forced-movement',/\b(?:the target|the creature|it|they)\s+(?:is|are)\s+(?:pushed|pulled)\s+\d+\s+feet\b|\bcreatures? (?:that|who) [^.]{0,60}\b(?:is|are) (?:pushed|pulled)\b/i],
        // Creature-dependent degree shifts ("if such creatures roll a critical
        // success ... they get a success instead") change the degree table.
        ['degree-adjustment',/\b(?:degrees? of success|one degree (?:better|worse)|roll(?:s)? a (?:critical )?(?:success|failure)|(?:gets?|use|uses) (?:a |the )?(?:critical )?(?:success|failure|outcome)\b[^.]{0,60}\binstead\b)/i]
    ].filter(([,pattern])=>pattern.test(text)).map(([name])=>name);
    if (hasUnmatchedTypedDamage(text,damageComponents)) signals.push('damage');
    // A capitalized condition without its link ("The target is also Slowed 1.") is a condition too.
    if (/\b(?:Blinded|Clumsy|Confused|Controlled|Dazzled|Deafened|Doomed|Drained|Enfeebled|Fascinated|Fatigued|Fleeing|Frightened|Grabbed|Immobilized|Off-Guard|Paralyzed|Petrified|Prone|Quickened|Restrained|Sickened|Slowed|Stunned|Stupefied|Unconscious|Wounded)\b/.test(text)) signals.push('additional-condition');
    // Untyped dice damage ("You take 2d6 damage.") is a rule too.
    if (/\b\d+d\d+ damage\b/i.test(text)) signals.push('damage');
    // What happens when a pushed creature hits a wall or falls off a ledge is a rule of its own: the push rows' note claims
    // it (claimedSentences), or the spell blocks.
    if (/\b(?:firm surface|solid barrier|knocked off a ledge|grab-an-edge)\b/i.test(text)) signals.push('collision');
    // A rule the GM decides is never a one-time save's.
    if (/\b(?:as determined by the GM|at the GM'?s discretion|GM determines)\b/i.test(text)) signals.push('gm-adjudication');
    if (trailingText) signals.push('post-immunity-text');
    // (Only where the caller can say what targeting it compiled: the save's own gate.)
    if (recipients && recipientQualifiers(text).some(({ qualifier }) => !recipients(qualifier))) signals.push('recipient-qualifier');
    return [...new Set(signals)];
}

/**
 * A bonus or penalty to this spell's save when a fact the GM judges holds. The card asks the GM for each target before
 * its save and adds the answer to that roll:
 *   "If the target doesn't understand the language …, it gains a +4 circumstance bonus to its save." (Blistering Invective)
 *   "It gains a +4 circumstance bonus to this save if you or your allies recently threatened … it." (Charming Touch)
 *   "If the target is not on its home plane, it takes a –4 status penalty to this save." (Dimensional Excision)
 *   "A creature afflicted by a disease takes a –2 circumstance penalty to this save." (Sudden Blight)
 *   "…: Prone creatures or those taking persistent bleed damage take a –2 status penalty to the save." (Feral Shades)
 *   "The target must attempt a Fortitude save; creatures with the gnome trait take a –2 circumstance penalty to this save."
 * One such sentence, a circumstance or status value of 1–4, the item's own save.
 */
export function compileSaveAdjustment(html, saveStatistic) {
    const prefix = String(html ?? '').split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences = htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const DASH = '[–−-]', TYPE = '(circumstance|status)', TO = String.raw`to (?:its|the|this|their) (?:(Fortitude|Reflex|Will) )?(?:save|saving throw)\.$`;
    const shapes = [
        [new RegExp(String.raw`^If (.+?), (?:it|the target|that creature|the creature) (?:gains|gets) a \+([1-4]) ${TYPE} bonus ${TO}`), 1],
        [new RegExp(String.raw`^If (.+?), (?:it|the target|that creature|the creature) takes a ${DASH}([1-4]) ${TYPE} penalty ${TO}`), -1],
        // (Without the comma, plural: "If the target has broken the laws of the area you are currently in within the last week they take a –2
        // circumstance penalty to their save." — Hand of Judgement.)
        [new RegExp(String.raw`^If (the target .+?) they take a ${DASH}([1-4]) ${TYPE} penalty ${TO}`), -1],
        [new RegExp(String.raw`^(?:It|The target) (?:gains|gets) a \+([1-4]) ${TYPE} bonus to (?:its|the|this) (?:(Fortitude|Reflex|Will) )?save if (.+?)\.$`), 1, 'trailing'],
        [new RegExp(String.raw`^(An? (?:target|creature) .+?|[A-Z][a-z]+ creatures or those .+?|Creatures with the [a-z]+ trait) takes? a ${DASH}([1-4]) ${TYPE} penalty ${TO}`), -1],
        // "It must attempt a Will save, with a +4 circumstance bonus if you or your allies recently threatened it or used hostile
        // actions against it."
        [new RegExp(String.raw`^(?:It|The target) must attempt an? (Fortitude|Reflex|Will) save, with a \+([1-4]) ${TYPE} bonus if (.+?)\.$`), 1, 'must'],
        // "You can spend an extra action while Casting this Spell and add a cost to the spell to give the creature a –2 circumstance penalty to
        // its save.": the caster's option, asked on the card.
        [new RegExp(String.raw`^You can (spend an extra action while Casting this Spell(?: and add a cost to the spell)?) to give (?:the creature|the target|it) a ${DASH}([1-4]) ${TYPE} penalty ${TO}`), -1, 'option'],
        // "Creatures that are of nobility themselves or that serve nobility directly, such as a royal guard, receive a +2 circumstance bonus to their saves."
        // (Ruler of Everything, Clerics+): the GM's answer for each creature.
        [new RegExp(String.raw`^(Creatures that .+?),? receive a \+([1-4]) ${TYPE} bonus to their saves\.$`), 1, 'subject']
    ];
    const found = [];
    for (const sentence of sentences) {
        // "The target must attempt a Will save; …" states the save itself; a flavour lead-in before a colon is narration.
        const lead = new RegExp(String.raw`^The target must attempt an? ${saveStatistic ?? 'x'} save; `, 'i');
        const body = sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '$1').replace(lead, '').replace(/^[^:.;]{0,80}:\s+(?=[A-Z])/, '').replace(/^[a-z]/, letter => letter.toUpperCase());
        for (const [pattern, sign, order] of shapes) {
            const match = pattern.exec(body);
            if (!match) continue;
            const [fact, value, type, statistic] = order === 'trailing' ? [match[4], match[1], match[2], match[3]]
                : order === 'must' ? [match[4], match[2], match[3], match[1]] : [match[1], match[2], match[3], match[4]];
            if (statistic && statistic.toLowerCase() !== String(saveStatistic ?? '').toLowerCase()) continue;
            // The fact must be about the target or the caster, never a roll result or another rule ("taking persistent
            // damage" is the creature's state).
            if (/\b(?:sav(?:e|ing)|damage|succe|fail|critical|degree|bonus|penalt|roll)/i.test(fact.replace(/\btaking persistent (?:[a-z]+ )?damage\b/gi, ''))) continue;
            found.push({ sentence, fact, value: sign * Number(value), modifierType: type, subject: pattern === shapes[4][0] || order === 'subject', option: order === 'option' });
            break;
        }
    }
    if (found.length !== 1) return null;
    const [{ sentence, fact, value, modifierType, subject, option }] = found;
    const signed = value > 0 ? `+${value}` : `−${-value}`;
    const question = option ? `Did you ${fact}? If so, the creature gets a ${signed} ${modifierType} penalty to its save.` : `${subject ? `Does this describe the creature: ${fact.replace(/^[A-Z]/, letter => letter.toLowerCase())}` : `Does this hold for the creature: ${fact}`}? If so, it gets a ${signed} ${modifierType} ${value > 0 ? 'bonus' : 'penalty'} to its save.`;
    return { question, modifierType, appliesTo: 'save',
        choices: [{ label: `Yes (${signed})`, value }, { label: 'No', value: 0 }], sourceText: sentence };
}

/**
 * A basic save whose GM-judged targets take a penalty to the save and, when damaged by the spell, a condition:
 *   Thunderstrike: "A target wearing metal armor or made of metal takes a –1 circumstance bonus to its save, and if
 *   damaged by the spell is Clumsy 1 for 1 round." (PF2e prints "bonus" with a minus sign; it is a penalty.)
 * Returns {adjustment, condition: {sentence, raw}} or null; the caller compiles the condition and checks the rest.
 */
export function compileBasicSaveAdjustmentRider(html) {
    const text = htmlToPlainText(String(html ?? '').split(/<strong\b[^>]*>\s*Heightened\b/i)[0]);
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const found = sentences.map(sentence => ({ sentence, match: /^An? (?:target|creature) (wearing [a-z ]+|made of [a-z ]+|wearing [a-z ]+ or made of [a-z ]+) takes a [–−-]([1-4]) circumstance (?:bonus|penalty) to its save, and if damaged by the spell is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[^\]]+\]\{[^}]+\}) for 1 round\.$/.exec(sentence) }))
        .filter(entry => entry.match);
    if (found.length !== 1) return null;
    const [{ sentence, match }] = found;
    const question = `Is the creature ${match[1]}? If so, it takes a −${match[2]} circumstance penalty to its save, and ${match[3].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/, '$1')} for 1 round if the spell damages it.`;
    return { sentence, conditionRaw: match[3],
        adjustment: { question, modifierType: 'circumstance', appliesTo: 'save', choices: [{ label: `Yes (−${match[2]})`, value: -Number(match[2]) }, { label: 'No', value: 0 }], sourceText: sentence } };
}
