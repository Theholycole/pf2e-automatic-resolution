// Lasting states a save leaves on a creature (feature group 4), rewritten into plain rows (their PF2e conditions) with the state as each row's note
// Effect — PF2e's rules where they exist, the module's runtime flags where it can act, the rest the note's text:
//   - Undermine Reality: "As long as it is quasi-real, its Strikes deal half damage, it can't critically succeed at any skill check, and creatures
//     attempting saving throws against its spells and effects get a result one degree of success better than they rolled." with rows "quasi-real until
//     the end of its next turn" / "… for 1 minute. At the end of each of its turns, it can attempt another Will save, ending the spell on a success." /
//     "… for an unlimited duration.": the note (its skill checks' critical successes PF2e's success; its Strikes halved; the module's save cards against
//     it a degree better), the failure's end-of-turn save.
//   - Fabricated Truth: "Choose a single statement you want the targets to believe. …" with rows "doesn't believe … knows you tried to trick it" /
//     "doesn't believe … or realize" / "believes the statement for 1 week" / "… with unlimited duration": the belief as the failing rows' note; the
//     critical success's knowing a whisper; an earlier casting's counteract the GM's.
//   - Cursed Metamorphosis: "Success … Sickened 1 …" / "Failure The target transforms for 1 minute but keeps its mind. If it spends all its actions on
//     its turn concentrating on its original form, it can attempt a Will save to end the effect immediately." / "Critical Failure … transformed into the
//     chosen harmless animal, body and mind, for an unlimited duration.": Sickened 1; the transformation a generated Effect (user decision: forms), the
//     failure's own Will save to end it.
//   - Remake Physiology: the list "–20-foot status penalty to its Speeds" / "Clumsy 1, Drained 1, Enfeebled 1, and Stupefied 1" / "Dazzled" / "Whenever
//     the target would regain actions at the start of its turn, it must first attempt a DC 5 flat check; on a failure, it's Slowed 1 for a round." with
//     rows "affected for 1 round" / "for 1 minute" / "permanent": one note with PF2e's rules (the penalty, the conditions) and the turn-start flat check
//     (the module's), for the row's time.
//   - Calcification: "Destroy a thrall within range, and choose a living or undead creature within 60 feet of where the thrall was. … Creatures already
//     made purely of bone … are immune … An incorporeal creature slowed by this spell loses the incorporeal trait …" with "Success … Slowed 1 and has
//     weakness 5 to bludgeoning for 1 round." / "Failure … slowed 1 and has weakness 10 to bludgeoning for as long as it's slowed. … end of each of its
//     turns … increases by 1 (or 2 …) … reduces … by 1." / "When a creature becomes fully unable to act due to the slowed condition …, Petrified
//     permanently … The spell also ends if the slowed condition is removed …" / "Critical Failure As failure, but … initially Slowed 2.": a card —
//     destroy the thrall, then the creature's save (Slowed escalating to Petrified as Petrify's; the weakness a note that follows its Slowed).
//   - Vitrifying Blast: rows of half (weakness 3 to sonic and bludgeoning for 1 round), full (Slowed 1, weakness 3 × its slowed value, an end-of-turn save:
//     +1/+2, −1/−2, at most 3, ending at 0) and double damage (Slowed 2): the rows' Slowed escalating, the weakness a note that follows it.
//   - Chrysopoetic Curse: "Success … If the target is wearing any armor or clothing, they become Encumbered." / "Failure As success, but … If the target is
//     holding any weapons or other objects, they become Clumsy 3, and the objects' Hardness is reduced by 5." / "Critical Failure … the ground in their space
//     transmutes itself into a quagmire of liquid gold. The gold is greater difficult terrain. …": each condition behind the GM's own question for the
//     creature (keyed gates); the Hardness and the gold a note.
//   - Dread Secret: "Choose a specific resistance or weakness … If the information is incorrect for a given target, the spell has no effect on that target."
//     with "Success The creature takes 1 damage that matches the type or trait of weakness you chose … or loses its resistance until the end of your next
//     turn …" / "Failure As success, and … Frightened 1 …" / "Critical Failure As failure, except … Frightened 3": the rows' Frightened; the secret's damage
//     or lost resistance a note for the GM (the caster's choice isn't in the data).
//   - Fateful Condemnation: "Success The creature takes 4d6 mental damage, and then an aura of shimmering mist with a 10-foot emanation surrounds the creature.
//     … cause the creature and any of its allies in the aura to take a –1 status penalty to all skill checks." / "Failure As success, but … 8d6 … Slowed 1 for
//     the duration of the effect." / "Critical Failure As success, but … 16d6 …, then is slowed 1 for the duration of the effect. Any of the target's allies
//     who begin their turn in the emanation is slowed 1 for 1 round.": each row's damage and Slowed; the aura a region following the target (its rule on the
//     target and its allies inside; the critical failure's Slowed 1 on its allies starting their turns there), for the spell's time.
//   - Overwhelming Presence: "Targets must attempt a Will save. Regardless of the outcome, the target is then temporarily immune for 1 minute." with "Success
//     The target must pay tribute to you two times. … a single action, which has either the move trait … or manipulate trait … at least once on each of
//     their turns, if possible. While affected, the target is Fascinated by you and can't use hostile actions against you." / "Failure … six times." /
//     "Critical Failure … must spend all its actions paying tribute …": a note counting the tribute still owed (PF2e's counter badge, lowered by the GM;
//     at 0 it ends), granting Fascinated while it lasts; the 1-minute immunity for every result.
//   - Tanglecurse: "Success A fungal bloom springs up from the ground in a 5-foot emanation around the target. This area is difficult terrain for creatures that
//     enter the area. The target treats all terrain as difficult terrain since this swath of fungus moves with them … ends after 1 minute or as soon as the
//     curse is lifted …" / "Failure As success, but the fungal bloom increases to 10 feet. It persists until the curse is lifted. In addition, … roll 1d4 …"
//     with the results "Enfeebled 1 / Clumsy 1 / Drained 1 / Stupefied 1" / "Critical Failure … 15 feet, and the condition value … increases to 2.": the bloom a
//     region following the target, difficult terrain for everyone moving in it (the target too, always inside it); the spores the cast's roll.
//   - Undertaker: "This spell works best when both you and the target are in contact with solid ground. If either is not …, the target gains a +2
//     circumstance bonus …, and if both … are not …, the target gains this bonus and treats the result of their save as one degree of success better …"
//     with rows of 40/80/160 void damage; "If the target is in contact with solid ground" the ground shakes (difficult terrain until the start of your next
//     turn), opens into a shallow grave (Prone; difficult terrain until filled in), or closes a stone shell around it (AC 10, Hardness 14, 80 Hit Points;
//     filled with soil at the start of your next turn; a ghast if it dies inside): the rows' damage, Prone behind the GM's ground question, the rest notes.
import { WORD_NUMBERS_2_6 as COUNT, CONDITION_LINK as LINK, PETRIFIED_UUID as PETRIFIED, DEGREE_LABEL_PAIRS as ROWS, plainOrEmpty as plain, rowOf, sentenceSplitTrimmed as sentencesOf } from "./text-patterns.js";

const flagOf = slug => `condition${slug.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join("")}`;
const NEXT_TURN = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its next turn" };
const UNLIMITED = sourceText => ({ mode: "unlimited", value: null, unit: null, sourceText });
const PLAIN_ROWS = (statistic, rows) => `<p>The target must attempt a ${statistic} save.</p><hr />` + ROWS.map(([degree, heading]) => `<p><strong>${heading}</strong> ${rows[degree] ?? "The target is unaffected."}</p>`).join("");

const QUASI = {
    lead: [/^You lash a target with tendrils of shadow that steal some of its substance, making it quasi-real\.$/,
        /^As long as it is quasi-real, its Strikes deal half damage, it can't critically succeed at any skill check, and creatures attempting saving throws against its spells and effects get a result one degree of success better than they rolled\.$/,
        /^The target must attempt an? (Fortitude|Reflex|Will) saving throw\.$/],
    rows: { criticalSuccess: /^The target is unaffected\.$/, success: /^The target is quasi-real until the end of its next turn\.$/,
        failure: /^The target is quasi-real for (\d+) minutes?\. At the end of each of its turns, it can attempt another (Fortitude|Reflex|Will) save, ending the spell on a success\.$/,
        criticalFailure: /^The target is quasi-real for an unlimited duration\.$/ }
};

function undermineReality(adapted) {
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length || adapted.targeting?.area || !/^(?:1|one) creature$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const lead = sentencesOf(plain(body));
    if (lead.length !== 3 || QUASI.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = QUASI.lead[2].exec(lead[2])[1];
    const rows = Object.fromEntries(ROWS.map(([degree, heading]) => [degree, plain(rowOf(table, heading) ?? "")]));
    const m = Object.fromEntries(ROWS.map(([degree]) => [degree, QUASI.rows[degree].exec(rows[degree])]));
    if (Object.values(m).some(hit => !hit) || m.failure[2] !== statistic) return null;
    const quasi = (duration, sourceText, extra = {}) => ({ label: "Quasi-real", text: "Quasi-real: its Strikes deal half damage (the module halves them), it can't critically succeed at skill checks (a critical success is a success), and creatures saving against its spells and effects get a result one degree better (the module's save cards apply it).",
        sourceText, rules: [{ key: "AdjustDegreeOfSuccess", selector: "skill-check", adjustment: { criticalSuccess: "to-success" } }], halfStrikes: true, sourceSavesBetter: true, duration, ...extra });
    return {
        html: PLAIN_ROWS(statistic, {}),
        notes: {
            success: [quasi(NEXT_TURN, rows.success)],
            failure: [quasi({ mode: "fixed", value: Number(m.failure[1]) * 10, unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: `for ${m.failure[1]} minute` }, rows.failure,
                { recurringSave: { timing: "turn-end", mode: "end", statistic: statistic.toLowerCase() } })],
            criticalFailure: [quasi(UNLIMITED("for an unlimited duration"), rows.criticalFailure)]
        },
        claimed: [...lead, ...ROWS.map(([degree, heading]) => `${heading} ${rows[degree]}`)]
    };
}

const TRUTH = {
    lead: [/^Choose a single statement you want the targets to believe\.$/, /^The fact could be narrow, such as "[^"]+"; wide-reaching, such as "[^"]+"; or conceptual, such as "[^"]+"\.$/,
        /^The targets' experiences color how they react to this "truth" and how their behavior changes\.$/, /^If the statement changes what they perceive, they treat the change as a sudden revelation\.$/,
        /^The effect of the spell depends on the targets' (Fortitude|Reflex|Will) saves\.$/,
        /^If a target is already affected by [a-z ]+, your spell tries to counteract it\.$/, /^If the counteract check fails, the outcome of the target's saving throw can't be worse than a success\.$/],
    rows: { criticalSuccess: /^The target doesn't believe the statement, and it knows you tried to trick it\.$/, success: /^The target doesn't believe the statement or realize you tried to trick it\.$/,
        failure: /^The target believes the statement for (\d+) weeks?\.$/, criticalFailure: /^The target believes the statement with unlimited duration\.$/ }
};

function fabricatedTruth(adapted) {
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length || !/^up to \d+ creatures$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    // (A sentence ending inside its quotation: "… in the afterlife." The targets' …)
    const lead = sentencesOf(plain(body).replace(/\."(\s)/g, '".$1'));
    if (lead.length !== TRUTH.lead.length || TRUTH.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = TRUTH.lead[4].exec(lead[4])[1];
    const rows = Object.fromEntries(ROWS.map(([degree, heading]) => [degree, plain(rowOf(table, heading) ?? "")]));
    const m = Object.fromEntries(ROWS.map(([degree]) => [degree, TRUTH.rows[degree].exec(rows[degree])]));
    if (Object.values(m).some(hit => !hit)) return null;
    const believes = (duration, sourceText) => ({ label: "Believes the statement", text: "It believes the statement you chose (the GM keeps it) as a sudden revelation if it changes what it perceives; its experiences color how it reacts.", sourceText, duration });
    return {
        html: PLAIN_ROWS(statistic, {}),
        notes: { failure: [believes({ mode: "fixed", value: Number(m.failure[1]) * 7, unit: "days", expiry: null, anchor: "effect-start", offset: 0, sourceText: `for ${m.failure[1]} week` }, rows.failure)],
            criticalFailure: [believes(UNLIMITED("with unlimited duration"), rows.criticalFailure)] },
        notesExtra: { criticalSuccess: [{ label: "Saw through the trick", text: "It doesn't believe the statement and knows you tried to trick it.", sourceText: rows.criticalSuccess,
            reveal: { kind: "gm-command", timing: "now", text: "this creature knows the caster tried to trick it with a false statement." },
            duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: "now" } }] },
        dataNotes: ["Choose the statement before the saves (the GM keeps it).", `${lead[5]} ${lead[6]} (The GM counteracts the earlier casting and corrects the result.)`],
        claimed: [...lead, ...ROWS.map(([degree, heading]) => `${heading} ${rows[degree]}`)]
    };
}

const METAMORPHOSIS = {
    lead: /^You transform the target creature into a harmless animal appropriate to the area, with effects based on its (Fortitude|Reflex|Will) save\.$/,
    rows: { criticalSuccess: /^The target is unaffected\.$/,
        success: new RegExp(String.raw`^The target's body gains minor features of the harmless animal\. Its insides churn as they partially transform, causing it to be ${LINK}\. When it recovers from the sickened condition, its features revert to normal\.$`),
        failure: /^The target transforms for (\d+) minutes? but keeps its mind\. If it spends all its actions on its turn concentrating on its original form, it can attempt a @Check\[(fortitude|reflex|will)\] save to end the effect immediately\.$/,
        criticalFailure: /^The target is transformed into the chosen harmless animal, body and mind, for an unlimited duration\.$/ }
};

function cursedMetamorphosis(adapted) {
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length) return null;
    const lead = sentencesOf(plain(body));
    if (lead.length !== 1 || !METAMORPHOSIS.lead.test(lead[0])) return null;
    const statistic = METAMORPHOSIS.lead.exec(lead[0])[1];
    const raw = Object.fromEntries(ROWS.map(([degree, heading]) => [degree, rowOf(table, heading) ?? ""]));
    const m = Object.fromEntries(ROWS.map(([degree]) => [degree, METAMORPHOSIS.rows[degree].exec(raw[degree])]));
    if (Object.values(m).some(hit => !hit) || m.success[2] !== "Sickened") return null;
    const animal = mind => `Transformed into a harmless animal appropriate to the area (the caster's choice): it uses the animal's form and Speeds, can't use its own attacks, spells or actions the animal couldn't take${mind ? ", but keeps its mind" : ", body and mind"}.`;
    return {
        html: PLAIN_ROWS(statistic, { success: `The target is @UUID[${m.success[1]}]{Sickened ${m.success[3]}}.` }),
        notes: {
            failure: [{ label: "Harmless animal", text: `${animal(true)} If it spends all its actions on its turn concentrating on its original form, it can attempt a ${m.failure[2][0].toUpperCase()}${m.failure[2].slice(1)} save to end it.`, sourceText: plain(raw.failure),
                duration: { mode: "fixed", value: Number(m.failure[1]) * 10, unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: `for ${m.failure[1]} minute` },
                endSave: { statistic: m.failure[2], label: "spent all its actions concentrating on its original form", oncePerRound: true } }],
            criticalFailure: [{ label: "Harmless animal", text: animal(false), sourceText: plain(raw.criticalFailure), duration: UNLIMITED("for an unlimited duration") }]
        },
        dataNotes: ["The success's minor animal features revert when its Sickened ends (cosmetic)."],
        claimed: [...lead, ...ROWS.map(([degree, heading]) => `${heading} ${plain(raw[degree])}`)]
    };
}

const REMAKE = {
    lead: [/^At your touch, the target's body shifts and transmutes into random mismatched animal parts, such as [a-z ,]+\.$/, /^The target must attempt an? (Fortitude|Reflex|Will) save\.$/],
    speed: /^Due to the unbalanced body weight and mismatched limbs, the target takes a [-–−](\d+)-foot (status|circumstance) penalty to its Speeds\.$/,
    conditions: new RegExp(String.raw`^The creature's mind and body no longer align, making it ((?:${LINK}(?:, (?:and )?)?)+)\.$`),
    dazzled: new RegExp(String.raw`^The target's new eyes make depth perception difficult; the target becomes ${LINK}\.$`),
    flat: new RegExp(String.raw`^Whenever the target would regain actions at the start of its turn, it must first attempt a @Check\[flat\|dc:(\d+)\]; on a failure, it's ${LINK} for a round\.$`),
    rows: { criticalSuccess: /^The target is unaffected\.$/, success: /^The target is affected for (\d+) rounds?\.$/, failure: /^The target is affected for (\d+) minutes?\.$/, criticalFailure: /^The effect is permanent\.$/ }
};

function remakePhysiology(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    // (PF2e 8.5 put the table inside the list's last item; 8.6 closes the list before it and links its own Effect after each row — "Spell Effect: Remake
    // Physiology (Failure)" —, read and left: the notes carry the same parts and the turn-start flat check too.)
    const shape = /^<p>([\s\S]*?)<\/p>\s*<ul>\s*<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>\s*<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>\s*<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>\s*<li>\s*<p>([\s\S]*?)<\/p>\s*<hr\s*\/?>([\s\S]*?)<\/li>\s*<\/ul>$/.exec(html.trim())
        ?? /^<p>([\s\S]*?)<\/p>\s*<ul>\s*<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>\s*<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>\s*<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>\s*<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>\s*<\/ul>\s*<hr\s*\/?>([\s\S]*)$/.exec(html.trim());
    if (!shape) return null;
    const links = [...shape[6].matchAll(/<p>\s*(@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{Spell Effect: [^}]+\})\s*<\/p>/g)].map(match => match[1]);
    if ((shape[6].match(/<p>/g) ?? []).length !== ROWS.length + links.length || (links.length && links.length !== ROWS.length - 1)) return null;
    const lead = sentencesOf(plain(shape[1]));
    if (lead.length !== 2 || REMAKE.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const speed = REMAKE.speed.exec(plain(shape[2])), conditions = REMAKE.conditions.exec(shape[3].replace(/\s+/g, " ").trim()), dazzled = REMAKE.dazzled.exec(shape[4].replace(/\s+/g, " ").trim());
    const flat = REMAKE.flat.exec(shape[5].replace(/\s+/g, " ").trim());
    if (!speed || !conditions || !dazzled || !flat || flat[3] !== "Slowed") return null;
    const linked = [...conditions[1].matchAll(new RegExp(LINK, "g"))].map(link => ({ uuid: link[1], slug: link[2].toLowerCase(), value: link[3] ? Number(link[3]) : null }));
    if (!linked.length || linked.some(link => link.value != null && link.value !== 1)) return null;
    const rows = Object.fromEntries(ROWS.map(([degree, heading]) => [degree, plain(rowOf(shape[6], heading) ?? "")]));
    const m = Object.fromEntries(ROWS.map(([degree]) => [degree, REMAKE.rows[degree].exec(rows[degree])]));
    if (Object.values(m).some(hit => !hit)) return null;
    const statistic = REMAKE.lead[1].exec(lead[1])[1];
    const grants = [...linked, { uuid: dazzled[1], slug: "dazzled" }].map(link => ({ key: "GrantItem", uuid: link.uuid, flag: flagOf(link.slug) }));
    const remade = (duration, sourceText) => ({ label: "Remade body", text: `Mismatched animal parts: a –${speed[1]}-foot ${speed[2]} penalty to its Speeds; ${linked.map(link => `${link.slug}${link.value ? ` ${link.value}` : ""}`).join(", ")}; dazzled; as its turn starts, a DC ${flat[1]} flat check or it's Slowed ${flat[4] ?? 1} for that round (the module rolls it).`,
        sourceText, rules: [{ key: "FlatModifier", selector: "all-speeds", type: speed[2], value: -Number(speed[1]) }, ...grants],
        turnStartFlat: { flat: Number(flat[1]), condition: { uuid: flat[2], slug: "slowed", value: Number(flat[4] ?? 1) } }, duration });
    return {
        html: PLAIN_ROWS(statistic, {}),
        notes: {
            success: [remade({ mode: "fixed", value: Number(m.success[1]), unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: `for ${m.success[1]} round` }, rows.success)],
            failure: [remade({ mode: "fixed", value: Number(m.failure[1]) * 10, unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: `for ${m.failure[1]} minute` }, rows.failure)],
            criticalFailure: [remade(UNLIMITED("permanent"), rows.criticalFailure)]
        },
        claimed: [...lead, plain(shape[2]), plain(shape[3]), plain(shape[4]), plain(shape[5]), ...ROWS.map(([degree, heading]) => `${heading} ${rows[degree]}`), ...links]
    };
}

const GOLD = {
    lead: [/^You grant the target the gift of riches, giving them the power to turn anything they touch to gold\.$/, /^The target must attempt an? (Fortitude|Reflex|Will) save\.$/],
    success: new RegExp(String.raw`^The target's skin turns their armor and clothing partially to gold\. (If the target is wearing any armor or clothing), they become ${LINK}\.$`),
    failure: new RegExp(String.raw`^As success, but the curse extends to the target's held weapons and other gear\. (If the target is holding any weapons or other objects), they become ${LINK}, and the objects' Hardness is reduced by (\d+)\.$`),
    critical: /^The curse becomes even stronger, extending to the surrounding terrain\. As failure, and if the creature is standing on a solid surface, the ground in their space transmutes itself into a quagmire of liquid gold\. The gold is greater difficult terrain\. If the creature leaves its square \(or when the curse ends\), any affected terrain returns to its original shape and substance and the terrain in the new square transmutes to gold\.$/,
    after: /^Any objects that were turned to gold return to their previous form and original shape when they leave the target's possession or the spell ends\. As long as the target did not critically succeed on their saving throw, (\d+d\d+) gp worth of gold flakes and dust are left behind as the curse recedes\.$/
};

function chrysopoeticCurse(adapted) {
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || !table || rest.length || !/^one creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const lead = sentencesOf(plain(body));
    if (lead.length !== 2 || GOLD.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = GOLD.lead[1].exec(lead[1])[1];
    const success = GOLD.success.exec(rowOf(table, "Success") ?? ""), failure = GOLD.failure.exec(rowOf(table, "Failure") ?? ""), critical = GOLD.critical.test(plain(rowOf(table, "Critical Failure") ?? ""));
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => match[1]);
    const after = GOLD.after.exec(plain(paragraphs.at(-1)));
    if (plain(rowOf(table, "Critical Success") ?? "") !== "The target is unaffected." || !success || !failure || !critical || !after || success[3] !== "Encumbered" || failure[3] !== "Clumsy") return null;
    const span = `for ${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}`;
    const encumbered = `@UUID[${success[2]}]{Encumbered} ${span}`, clumsy = `@UUID[${failure[2]}]{Clumsy ${failure[4]}} ${span}`;
    const gates = { armor: { kind: "gm-question", key: "armor", question: "Is it wearing any armor or clothing?", sourceText: plain(success[0]) },
        held: { kind: "gm-question", key: "held", question: "Is it holding any weapons or other objects?", sourceText: plain(failure[0]) } };
    const hardness = { label: "Gilded gear", text: `Its held weapons and objects are partly gold: their Hardness is reduced by ${failure[5]} (the GM). They return to normal when they leave its possession or the spell ends.`,
        sourceText: plain(failure[0]), duration: { mode: "fixed", value: Number(minutes[1]) * 10, unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: span } };
    return {
        html: PLAIN_ROWS(statistic, { success: `The target is ${encumbered}.`, failure: `The target is ${encumbered} and ${clumsy}.`, criticalFailure: `The target is ${encumbered} and ${clumsy}.` }),
        gates: { success: { encumbered: gates.armor }, failure: { encumbered: gates.armor, clumsy: gates.held }, criticalFailure: { encumbered: gates.armor, clumsy: gates.held } },
        notes: { failure: [hardness], criticalFailure: [hardness, { label: "Liquid gold", text: "If it stands on a solid surface, the ground in its space is a quagmire of liquid gold: greater difficult terrain, moving with it (the GM).",
            sourceText: plain(rowOf(table, "Critical Failure")), duration: { mode: "fixed", value: Number(minutes[1]) * 10, unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: span } }] },
        dataNotes: [`Unless the target critically succeeded, ${after[1]} gp of gold flakes and dust are left behind as the curse recedes.`],
        gateSentences: [gates.armor.sourceText, gates.held.sourceText],
        claimed: [...lead, ...ROWS.map(([degree, heading]) => `${heading} ${plain(rowOf(table, heading) ?? "")}`), plain(paragraphs.at(-1))]
    };
}

const SECRET = {
    lead: [/^You utter a powerful secret at odds with the fundamental nature of the target creatures\.$/,
        /^Choose a specific resistance or weakness with a numerical value that you believe one or more of the targets have due to @UUID\[[^\]]+\]\{Recall Knowledge\} or previous experience with the targets, such as resistance to fire or weakness to silver\.$/,
        /^If the information is incorrect for a given target, the spell has no effect on that target\.$/, /^Affected targets must attempt an? (Fortitude|Reflex|Will) saving throw\.$/],
    success: /^The creature takes 1 damage that matches the type or trait of weakness you chose \(thus triggering the creature's weakness\) if you chose a weakness, or loses its resistance until the end of your next turn if you chose a resistance\.$/,
    failure: new RegExp(String.raw`^As success, and the creature becomes ${LINK} from the revelation of its dread secret\.$`),
    critical: new RegExp(String.raw`^As failure, except the creature is ${LINK}\.?$`)
};

function dreadSecret(adapted) {
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length || !/^up to \d+ creatures$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const lead = sentencesOf(body.replace(/<\/?p>/g, "").replace(/\s+/g, " ").trim());
    if (lead.length !== SECRET.lead.length || SECRET.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = SECRET.lead[3].exec(lead[3])[1];
    const success = SECRET.success.test(plain(rowOf(table, "Success") ?? "")), failure = SECRET.failure.exec(rowOf(table, "Failure") ?? ""), critical = SECRET.critical.exec(rowOf(table, "Critical Failure") ?? "");
    if (plain(rowOf(table, "Critical Success") ?? "") !== "The creature is unaffected." || !success || !failure || !critical || failure[2] !== "Frightened" || critical[2] !== "Frightened") return null;
    const secret = { label: "Dread secret", text: "If you chose a weakness: it takes 1 damage of that type or trait, triggering its weakness (apply it). If you chose a resistance: it loses that resistance until the end of your next turn (the GM ignores it).",
        sourceText: plain(rowOf(table, "Success")), duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 1, sourceText: "until the end of your next turn" } };
    return {
        html: PLAIN_ROWS(statistic, { failure: `The target is @UUID[${failure[1]}]{Frightened ${failure[3]}}.`, criticalFailure: `The target is @UUID[${critical[1]}]{Frightened ${critical[3]}}.` }),
        notes: { success: [secret], failure: [secret], criticalFailure: [secret] },
        dataNotes: ["Choose the weakness or resistance (with its type) before the saves; a target that doesn't have it is unaffected (exclude it on the card)."],
        claimed: [...lead.map(plain), ...ROWS.map(([degree, heading]) => `${heading} ${plain(rowOf(table, heading) ?? "")}`)]
    };
}

const FATE = {
    narration: [/^You draw upon the target's negative fate, causing this lingering destiny to afflict it and its nearby allies with the unintended consequences of its past lives\.$/,
        /^Spiritual echoes of the target's past lives instill overwhelming feelings of doubt, regret, and despair into the minds of the target and its nearby allies\.$/,
        /^The effects depend on the target's (Fortitude|Reflex|Will) save, with the following results\.$/],
    success: /^The creature takes (\d+d\d+) ([a-z]+) damage, and then an aura of shimmering mist with a @Template\[emanation\|distance:(\d+)\] surrounds the creature\. This mist isn't dense enough to affect sight, but it does cause the creature and any of its allies in the aura to take a [-–−](\d) (status|circumstance) penalty to all skill checks\.$/,
    failure: new RegExp(String.raw`^As success, but the creature takes an initial (\d+d\d+) ([a-z]+) damage and is then ${LINK} for the duration of the effect\.$`),
    critical: /^As success, but the creature takes an initial (\d+d\d+) ([a-z]+) damage, then is slowed (\d) for the duration of the effect\. Any of the target's allies who begin their turn in the @Template\[emanation\|distance:(\d+)\] is slowed (\d) for (\d+) rounds?\.$/
};

function fatefulCondemnation(adapted) {
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || !table || rest.length || !/^1 living creature$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const lead = sentencesOf(plain(body));
    if (lead.length !== 3 || FATE.narration.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = FATE.narration[2].exec(lead[2])[1];
    const success = FATE.success.exec(plain(rowOf(table, "Success") ?? "")), failure = FATE.failure.exec(rowOf(table, "Failure") ?? ""), critical = FATE.critical.exec(plain(rowOf(table, "Critical Failure") ?? ""));
    if (plain(rowOf(table, "Critical Success") ?? "") !== "The creature is unaffected." || !success || !failure || !critical || failure[4] !== "Slowed" || critical[4] !== success[3]) return null;
    const span = `for ${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}`;
    const slowed = `@UUID[${failure[3]}]{Slowed ${failure[5] ?? 1}}`;
    const penalty = { label: "Condemned fate", text: `In the mist around the condemned creature: a –${success[4]} ${success[5]} penalty to all skill checks.`, rules: [{ key: "FlatModifier", selector: "skill-check", type: success[5], value: -Number(success[4]) }] };
    return {
        html: PLAIN_ROWS(statistic, { success: `The target takes @Damage[${success[1]}[${success[2]}]] damage.`, failure: `The target takes @Damage[${failure[1]}[${failure[2]}]] damage and is ${slowed} ${span}.`,
            criticalFailure: `The target takes @Damage[${critical[1]}[${critical[2]}]] damage and is ${slowed.replace(/ \d\}$/, ` ${critical[3]}}`)} ${span}.` }),
        dropDamage: true,
        targetAura: { radius: Number(success[3]), seconds: Number(minutes[1]) * 60, sourceText: plain(rowOf(table, "Success")),
            byDegree: { success: { ...penalty }, failure: { ...penalty }, criticalFailure: { ...penalty, allyTurnCondition: { uuid: failure[3], slug: "slowed", value: Number(critical[5]), rounds: Number(critical[6]), sourceText: plain(rowOf(table, "Critical Failure")) } } } },
        claimed: [...lead, ...ROWS.map(([degree, heading]) => `${heading} ${plain(rowOf(table, heading) ?? "")}`)]
    };
}

const TRIBUTE = {
    lead: [/^You surround yourself with supernatural splendor, appearing to be a god or similarly majestic being, with an appearance, regalia, and iconography of your choice\.$/,
        /^Targets must attempt an? (Fortitude|Reflex|Will) save\.$/, /^Regardless of the outcome, the target is then temporarily immune for (\d+) (minute|hour)s?\.$/],
    success: new RegExp(String.raw`^The target must pay tribute to you (two|three|four|\d+) times\. Paying tribute requires that the target spend a single action, which has either the move trait \(as they bow\) or manipulate trait \(as they offer up a token in their hands\)\. They must pay tribute at least once on each of their turns, if possible\. While affected, the target is ${LINK} by you and can't use hostile actions against you\.$`),
    failure: /^As success, but the target must pay tribute a total of (two|three|four|five|six|\d+) times\.$/,
    critical: /^As failure, but the target must spend all its actions paying tribute, and they cannot take other actions until the tribute is fully paid\.$/
};

function overwhelmingPresence(adapted) {
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length || !/^any number of creatures$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const lead = sentencesOf(plain(body));
    if (lead.length !== 3 || TRIBUTE.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = TRIBUTE.lead[1].exec(lead[1])[1], immune = TRIBUTE.lead[2].exec(lead[2]);
    const success = TRIBUTE.success.exec(rowOf(table, "Success") ?? ""), failure = TRIBUTE.failure.exec(plain(rowOf(table, "Failure") ?? "")), critical = TRIBUTE.critical.test(plain(rowOf(table, "Critical Failure") ?? ""));
    if (plain(rowOf(table, "Critical Success") ?? "") !== "The target is unaffected." || !success || !failure || !critical || success[3] !== "Fascinated") return null;
    const times = value => COUNT[value] ?? Number(value);
    const owed = (count, all, sourceText) => ({ label: "Owes tribute", text: `It owes you ${count} tribute: each is a single action with the move trait (a bow) or the manipulate trait (an offered token), at least once on each of its turns if possible${all ? "; it must spend all its actions paying tribute and can't take other actions until it's fully paid" : ""}. While it owes tribute it's Fascinated by you and can't use hostile actions against you. Lower the counter for each tribute paid; at 0 it ends.`,
        sourceText, rules: [{ key: "GrantItem", uuid: success[2], flag: "conditionFascinated" }], counter: count, duration: UNLIMITED("until full tribute is paid") });
    return {
        html: `<p>The target must attempt a ${statistic} save. Regardless of the outcome, the target is then temporarily immune for ${immune[1]} ${immune[2]}${immune[1] === "1" ? "" : "s"}.</p><hr />`
            + ROWS.map(([degree, heading]) => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: { success: [owed(times(success[1]), false, plain(rowOf(table, "Success")))], failure: [owed(times(failure[1]), false, plain(rowOf(table, "Failure")))],
            criticalFailure: [owed(times(failure[1]), true, plain(rowOf(table, "Critical Failure")))] },
        claimed: [...lead, ...ROWS.map(([degree, heading]) => `${heading} ${plain(rowOf(table, heading) ?? "")}`)]
    };
}

const TANGLE = {
    lead: [/^Tanglebriar has been called a "curse on the land," which has inspired Treerazer's cult to develop this notorious spell\.$/, /^The target must attempt an? (Fortitude|Reflex|Will) save\.$/],
    success: /^A fungal bloom springs up from the ground in a @Template\[type:emanation\|distance:(\d+)\] around the target\. This area is difficult terrain for creatures that enter the area\. The target treats all terrain as difficult terrain since this swath of fungus moves with them as they do, transforming into [^.]+\. This effect ends after (\d+) minutes? or as soon as the curse is lifted, whichever comes first\.$/,
    failure: /^As success, but the fungal bloom increases to (\d+) feet\. It persists until the curse is lifted\. In addition, the target is also affected by the spores exuded by the fungal bloom—roll \[\[\/r (1d(\d))\]\] and consult the results below to see how the spores affect them\. This affect reactivates automatically every 24 hours, replacing the previous result\.$/,
    result: new RegExp(String.raw`^<strong>(\d):</strong> The spores [^;]+; the target is ${LINK}\.$`),
    critical: /^As failure, but the emanation increases to (\d+) feet, and the condition value caused by the spores increases to (\d)\.$/
};

function tanglecurse(adapted) {
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length || !/^1 creature$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const lead = sentencesOf(plain(body));
    if (lead.length !== 2 || TANGLE.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = TANGLE.lead[1].exec(lead[1])[1];
    const success = TANGLE.success.exec(plain(rowOf(table, "Success") ?? "")), failure = TANGLE.failure.exec(plain(rowOf(table, "Failure") ?? "")), critical = TANGLE.critical.exec(plain(rowOf(table, "Critical Failure") ?? ""));
    const results = [...table.matchAll(/<p>(<strong>\d:<\/strong>[\s\S]*?)<\/p>/g)].map(match => TANGLE.result.exec(match[1].replace(/\s+/g, " ").trim()));
    if (plain(rowOf(table, "Critical Success") ?? "") !== "The target is unaffected." || !success || !failure || !critical || results.length !== Number(failure[3]) || results.some((hit, index) => !hit || Number(hit[1]) !== index + 1)) return null;
    const cells = results.map(hit => ({ uuid: hit[2], name: hit[3], slug: hit[3].toLowerCase(), value: Number(hit[4] ?? 1) }));
    const list = value => `The target is ${cells.slice(0, -1).map(cell => `@UUID[${cell.uuid}]{${cell.name} ${value}}`).join(", ")}, or @UUID[${cells.at(-1).uuid}]{${cells.at(-1).name} ${value}}.`;
    const bloom = (radius, seconds, sourceText) => ({ label: "Fungal bloom", text: `A fungal bloom around it: difficult terrain for creatures in it, and it treats all terrain as difficult since the bloom moves with it. It ends ${seconds ? "after the spell's minute or " : ""}when the curse is lifted (remove it then).`,
        rules: [], radius, ...(seconds ? { seconds } : { untilLifted: true }), terrain: { difficulty: 2 }, sourceText });
    const LONG = 365 * 24 * 3600;
    return {
        html: PLAIN_ROWS(statistic, { failure: list(cells[0].value), criticalFailure: list(Number(critical[2])) }),
        conditionRoll: { formula: failure[2], results: Object.fromEntries(cells.map((cell, index) => [index + 1, cell.slug])), chooseOn: [], options: cells.map(cell => cell.slug),
            labels: Object.fromEntries(cells.map(cell => [cell.slug, cell.name])) },
        targetAura: { radius: Number(success[1]), seconds: Number(success[2]) * 60, sourceText: plain(rowOf(table, "Success")),
            byDegree: { success: bloom(Number(success[1]), Number(success[2]) * 60, plain(rowOf(table, "Success"))), failure: bloom(Number(failure[1]), LONG, plain(rowOf(table, "Failure"))),
                criticalFailure: bloom(Number(critical[1]), LONG, plain(rowOf(table, "Critical Failure"))) } },
        dataNotes: ["The spores reactivate every 24 hours while the curse lasts: roll again and replace the condition (the GM)."],
        claimed: [...lead, ...ROWS.map(([degree, heading]) => `${heading} ${plain(rowOf(table, heading) ?? "")}`)]
    };
}

const GRAVE = {
    lead: [/^You point your finger toward the target and whisper an epitaph that promises to grace their gravestone in the near future\.$/,
        /^This spell works best when both you and the target are in contact with solid ground\.$/,
        /^If either is not in contact with the ground, the target gains a \+(\d) circumstance bonus on their saving throw against the spell, and if both you and the target are not in contact with solid ground, the target gains this bonus and treats the result of their save as one degree of success better than the actual result\.$/,
        /^The target of undertaker can resist with an? (Fortitude|Reflex|Will) save\.$/],
    success: /^The target takes @Damage\[(\d+)\[([a-z]+)\]\] damage\. (If the target is in contact with solid ground), the ground in the target's space shifts and shakes, and is treated as difficult terrain until the start of your next turn\.$/,
    failure: new RegExp(String.raw`^The target takes @Damage\[(\d+)\[([a-z]+)\]\] damage\. If the target is in contact with solid ground, the ground in the target's space churns and cracks open into an open but shallow grave\. The target is knocked ${LINK}, and that space is treated as difficult terrain until the grave is filled in\.$`),
    critical: /^The target takes @Damage\[(\d+)\[([a-z]+)\]\] damage\. If the target is in contact with solid ground, a grave opens beneath their feet and they fall prone within\. The grave then forms a stone sarcophagus-like shell around the victim\. This stone shell cannot be opened and must be broken; it has AC (\d+), Hardness (\d+), and (\d+) Hit Points\. At the start of your next turn, the grave fills in with soil\. If the victim dies while inside this grave, at the next sundown the victim transforms into an evil ([a-z]+) as the sarcophagus crumbles, allowing the new undead to dig its way up to the surface\.$/
};

function undertaker(adapted) {
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length || !/^1 living creature$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const lead = sentencesOf(plain(body).replace(/ ([.;,])/g, "$1"));
    if (lead.length !== 4 || GRAVE.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = GRAVE.lead[3].exec(lead[3])[1], bonus = GRAVE.lead[2].exec(lead[2])[1];
    const success = GRAVE.success.exec(plain(rowOf(table, "Success") ?? "")), failure = GRAVE.failure.exec(rowOf(table, "Failure") ?? ""), critical = GRAVE.critical.exec(plain(rowOf(table, "Critical Failure") ?? ""));
    if (plain(rowOf(table, "Critical Success") ?? "") !== "The target is unaffected." || !success || !failure || !critical || failure[4] !== "Prone") return null;
    const prone = `@UUID[${failure[3]}]{Prone}`;
    const ground = { kind: "gm-question", key: "ground", question: "Is it in contact with solid ground?", sourceText: plain(rowOf(table, "Failure")) };
    const note = (label, text, sourceText, duration) => ({ label, text: `If it's in contact with solid ground: ${text}`, sourceText, duration });
    const nextTurn = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "source-turn", offset: 1, sourceText: "until the start of your next turn" };
    return {
        html: PLAIN_ROWS(statistic, { success: `The target takes @Damage[${success[1]}[${success[2]}]] damage.`, failure: `The target takes @Damage[${failure[1]}[${failure[2]}]] damage and is knocked ${prone}.`,
            criticalFailure: `The target takes @Damage[${critical[1]}[${critical[2]}]] damage and is knocked ${prone}.` }),
        dropDamage: true,
        gates: { failure: { prone: ground }, criticalFailure: { prone: ground } },
        gateSentences: [ground.sourceText],
        notes: {
            success: [note("Shaking ground", "the ground in its space is difficult terrain until the start of your next turn (the GM).", plain(rowOf(table, "Success")), nextTurn)],
            failure: [note("Open grave", "its space is an open, shallow grave: difficult terrain until the grave is filled in (the GM).", plain(rowOf(table, "Failure")), UNLIMITED("until the grave is filled in"))],
            criticalFailure: [note("Stone sarcophagus", `it lies prone in a grave inside a stone shell that can't be opened, only broken (AC ${critical[3]}, Hardness ${critical[4]}, ${critical[5]} Hit Points; the GM places it). At the start of your next turn the grave fills in with soil. If it dies inside, at the next sundown it rises as an evil ${critical[6]}.`,
                plain(rowOf(table, "Critical Failure")), UNLIMITED("until the shell is broken"))]
        },
        dataNotes: [`Ground contact (the GM): if either of you isn't in contact with solid ground, the target has a +${bonus} circumstance bonus to its save; if neither of you is, it also treats its result as one degree better (correct the degree on the card).`],
        claimed: [...lead, ...ROWS.map(([degree, heading]) => `${heading} ${plain(rowOf(table, heading) ?? "")}`)]
    };
}

/** {html, notes: {degree: [note]}, whispers?, dataNotes?, claimed} or null. */
export function extractLastingCurse(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    // (Fateful Condemnation's rows state their own dice: PF2e's single damage entry is set aside.)
    if ((adapted.damageComponents ?? []).length) return fatefulCondemnation(adapted);
    // (Undertaker's rows state their own damage; PF2e's item has none.)
    const graves = undertaker(adapted);
    if (graves) return graves;
    return undermineReality(adapted) ?? fabricatedTruth(adapted) ?? cursedMetamorphosis(adapted) ?? remakePhysiology(adapted) ?? chrysopoeticCurse(adapted) ?? dreadSecret(adapted) ?? overwhelmingPresence(adapted) ?? tanglecurse(adapted)
        ?? slipperySteps(adapted);
}

// Curse of Slippery Steps (PF2e 8.6): "You curse the target with perpetually poor footing and wet boots." / "The target must attempt a Reflex save." with rows
// "The target is unaffected." / "The target treats all terrain as difficult terrain for 1 round." / "The target treats all terrain as difficult terrain, and it
// leaves a trail of water behind it, giving any skill checks to [[/act track]] it during the duration a +2 circumstance bonus. The duration is 1 hour." / "As
// failure, except the duration is 24 hours." — its footing a note for the row's time (difficult terrain for one creature, and others' bonus to Track it, the GM's).
const SLIPPERY = {
    lead: [/^You curse the target with [a-z ,]+\.$/, /^The target must attempt an? (Fortitude|Reflex|Will) save\.$/],
    rows: { criticalSuccess: /^The target is unaffected\.$/, success: /^The target treats all terrain as difficult terrain for (\d+) (round|minute)s?\.$/,
        failure: /^The target treats all terrain as difficult terrain, and it leaves a trail of water behind it, giving any skill checks to (?:\[\[\/act track\]\]|Track) it during the duration a \+(\d) circumstance bonus\. The duration is (\d+) (minute|hour|day)s?\.$/,
        criticalFailure: /^As failure, except the duration is (\d+) (minute|hour|day)s?\.$/ }
};

function slipperySteps(adapted) {
    if (!/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || !/^varies$/i.test(String(adapted.lifecycle?.duration ?? "").trim()) || adapted.targeting?.area) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length || (table.match(/<p>/g) ?? []).length !== 4) return null;
    const lead = sentencesOf(plain(body));
    if (lead.length !== 2 || SLIPPERY.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = SLIPPERY.lead[1].exec(lead[1])[1];
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const rows = Object.fromEntries(ROWS.map(([degree, heading]) => [degree, plain(rowOf(table, heading) ?? "")]));
    const m = Object.fromEntries(ROWS.map(([degree]) => [degree, SLIPPERY.rows[degree].exec(rows[degree])]));
    if (Object.values(m).some(hit => !hit)) return null;
    const time = (value, unit, sourceText) => ({ mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: unit === "round" ? "turn-end" : null, anchor: "effect-start", offset: 0, sourceText });
    const footing = "It treats all terrain as difficult terrain (the GM: for this creature only)";
    const trail = `${footing}, and leaves a trail of water: skill checks to Track it get a +${m.failure[1]} circumstance bonus.`;
    return {
        html: PLAIN_ROWS(statistic, {}),
        notes: {
            success: [{ label: "Slippery steps", text: `${footing}.`, sourceText: rows.success, duration: time(m.success[1], m.success[2], `for ${m.success[1]} ${m.success[2]}`) }],
            failure: [{ label: "Slippery steps", text: trail, sourceText: rows.failure, duration: time(m.failure[2], m.failure[3], `The duration is ${m.failure[2]} ${m.failure[3]}`) }],
            criticalFailure: [{ label: "Slippery steps", text: trail, sourceText: rows.criticalFailure, duration: time(m.criticalFailure[1], m.criticalFailure[2], `the duration is ${m.criticalFailure[1]} ${m.criticalFailure[2]}`) }]
        },
        claimed: [...lead, ...ROWS.map(([degree, heading]) => `${heading} ${rows[degree]}`)]
    };
}

const BONE = {
    lead: [/^You transform a thrall into fine dust particles that invade a creature's body and begin transforming their body into a statue made of pure enhanced bone\.$/,
        /^Destroy a thrall within range, and choose a living or undead creature within (\d+) feet of where the thrall was\.$/,
        /^The creature begins solidifying into pure bone depending on its (Fortitude|Reflex|Will) save\.$/,
        /^Creatures already made purely of bone, such as skeletons, are immune to this spell\.$/,
        /^An incorporeal creature slowed by this spell loses the incorporeal trait and all associated resistances for the duration of the spell\.$/],
    success: new RegExp(String.raw`^The creature is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Slowed (\d)\} and has weakness (\d+) to ([a-z]+) for (\d+) rounds?\.$`),
    failure: /^The creature is slowed (\d) and has weakness (\d+) to ([a-z]+) for as long as it's slowed\. The creature must attempt an additional @Check\[(fortitude|reflex|will)\|[^\]]*\] save at the end of each of its turns; this ongoing save has the incapacitation trait\. On a failed save, the slowed condition increases by (\d) \(or (\d) on a critical failure\) as [a-z' ]+\. A successful save reduces the slowed condition by (\d)\.$/,
    stone: /^When a creature becomes fully unable to act due to the slowed condition from calcification, the spell then ends, leaving the creature @UUID\[[^\]]+\]\{Petrified\} permanently as it becomes a bony statue\. The spell also ends if the slowed condition is removed, which causes the bone to break off harmlessly\.$/,
    critical: new RegExp(String.raw`^As failure, but the target is initially @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Slowed (\d)\}\.$`)
};

/** Calcification: {within, saveHTML, recurring, notes, sentences} or null. */
export function extractCalcification(adapted) {
    if (!/^1 of your thralls$/.test(String(adapted.targeting?.target ?? "").trim()) || adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || rest.length) return null;
    const lead = sentencesOf(plain(body));
    if (lead.length !== BONE.lead.length || BONE.lead.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = BONE.lead[2].exec(lead[2])[1];
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/<\/?em>/g, "").replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(text => new RegExp(String.raw`^<strong>\s*${heading}\s*</strong>`).test(text))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "";
    const stoneText = paragraphs.find(text => /^When a creature becomes fully unable to act/.test(text)) ?? "";
    const success = BONE.success.exec(row("Success")), failure = BONE.failure.exec(row("Failure")), critical = BONE.critical.exec(row("Critical Failure"));
    if (plain(row("Critical Success")) !== "The creature is unaffected." || !success || !failure || !critical || !BONE.stone.test(stoneText) || failure[4] !== statistic.toLowerCase()) return null;
    const slowed = success[1];
    const stone = plain(stoneText);
    const incorporeal = "If it's incorporeal, it loses the incorporeal trait and its associated resistances while slowed by this spell (the GM).";
    return {
        within: Number(BONE.lead[1].exec(lead[1])[1]),
        saveHTML: `<p>The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is @UUID[${slowed}]{Slowed ${success[2]}} for ${success[5]} round${success[5] === "1" ? "" : "s"}.</p>`
            + `<p><strong>Failure</strong> The target is @UUID[${slowed}]{Slowed ${failure[1]}} for an unlimited duration.</p><p><strong>Critical Failure</strong> The target is @UUID[${critical[1]}]{Slowed ${critical[2]}} for an unlimited duration.</p>`,
        recurring: { timing: "turn-end", mode: "escalate", statistic: statistic.toLowerCase(), steps: { criticalSuccess: -Number(failure[7]), success: -Number(failure[7]), failure: Number(failure[5]), criticalFailure: Number(failure[6]) },
            maximum: 4, atActions: { uuid: PETRIFIED, slug: "petrified", sourceText: stone }, sourceText: `${plain(row("Failure"))} ${stone}` },
        notes: {
            success: [{ label: "Calcifying", text: `Weakness ${success[3]} to ${success[4]}. ${incorporeal}`, sourceText: plain(row("Success")), rules: [{ key: "Weakness", type: success[4], value: Number(success[3]) }],
                duration: { mode: "fixed", value: Number(success[5]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${success[5]} round` } }],
            failure: [{ label: "Calcifying", text: `Weakness ${failure[2]} to ${failure[3]} while slowed by this spell (it ends with the Slowed). ${incorporeal}`, sourceText: plain(row("Failure")),
                rules: [{ key: "Weakness", type: failure[3], value: Number(failure[2]) }], withCondition: { slug: "slowed" }, duration: UNLIMITED("for as long as it's slowed") }]
        },
        notes2: [lead[3], lead[4]],
        sentences: [...lead, ...paragraphs.map(plain)]
    };
}

const GLASS = {
    lead: /^You launch a cone of glass shards, which embed in creatures to turn them partially to glass\. The shards deal (\d+d\d+) ([a-z]+) damage to creatures in the area, based on each creature's saving throw\.$/,
    success: /^The target takes half damage and gains weakness (\d+) to ([a-z]+) and ([a-z]+) damage for (\d+) rounds?\.$/,
    failure: new RegExp(String.raw`^The target takes full damage, is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Slowed (\d)\}, and gains weakness to ([a-z]+) and ([a-z]+) damage\. The weakness is equal to (\d+) × the slowed value it has from this spell\. The target must attempt an? (Fortitude|Reflex|Will) save at the end of each of its turns; this ongoing save has the incapacitation trait\. On a failed save, the creature's slowed value increases by (\d) \(or by (\d) on a critical failure\), to a maximum of @UUID\[[^\]]+\]\{Slowed (\d)\}\. A successful save reduces the creature's slowed value by (\d) \(or by (\d) on a critical success\)\. If the creature ends its turn with a slowed value of 0, the effect ends\.$`),
    critical: new RegExp(String.raw`^As failure, but the target is initially @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Slowed (\d)\}\.$`)
};

/** Vitrifying Blast: {html, recurring, notes, claimed} or null. */
export function extractVitrifying(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area?.type !== "cone" || (adapted.damageComponents ?? []).length !== 1) return null;
    const [body, table, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!heightened || rest.length) return null;
    const lead = GLASS.lead.exec(plain(body));
    const component = adapted.damageComponents[0];
    if (!lead || component.category || String(component.formula).replace(/\s+/g, "") !== lead[1] || String(component.type).toLowerCase() !== lead[2]) return null;
    const success = GLASS.success.exec(plain(rowOf(table, "Success") ?? "")), failure = GLASS.failure.exec(rowOf(table, "Failure") ?? ""), critical = GLASS.critical.exec(rowOf(table, "Critical Failure") ?? "");
    if (plain(rowOf(table, "Critical Success") ?? "") !== "The target is unaffected." || !success || !failure || !critical) return null;
    // (The blast's save is the item's; the ongoing save its own.)
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1), ongoing = failure[6];
    const types = [failure[3], failure[4]];
    return {
        html: `<p>The shards deal ${lead[1]} ${lead[2]} damage to creatures in the area, based on each creature's ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes half damage.</p><p><strong>Failure</strong> The target takes full damage and is @UUID[${failure[1]}]{Slowed ${failure[2]}} for an unlimited duration.</p>`
            + `<p><strong>Critical Failure</strong> The target takes double damage and is @UUID[${critical[1]}]{Slowed ${critical[2]}} for an unlimited duration.</p><hr />${heightened}`,
        recurring: { timing: "turn-end", mode: "escalate", statistic: ongoing.toLowerCase(), steps: { criticalSuccess: -Number(failure[11]), success: -Number(failure[10]), failure: Number(failure[7]), criticalFailure: Number(failure[8]) },
            maximum: Number(failure[9]), sourceText: plain(rowOf(table, "Failure")) },
        notes: {
            success: [{ label: "Glassy", text: `Weakness ${success[1]} to ${success[2]} and ${success[3]} damage.`, sourceText: plain(rowOf(table, "Success")), rules: [{ key: "Weakness", type: [success[2], success[3]], value: Number(success[1]) }],
                duration: { mode: "fixed", value: Number(success[4]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${success[4]} round` } }],
            failure: [{ label: "Vitrified", text: `Weakness to ${types.join(" and ")} damage equal to ${failure[5]} × its slowed value from this spell (the module keeps it in step; it ends with the Slowed).`, sourceText: plain(rowOf(table, "Failure")),
                rules: [{ key: "Weakness", type: types, value: Number(failure[5]) }], withCondition: { slug: "slowed", multiplier: Number(failure[5]) }, duration: UNLIMITED("while slowed by this spell") }]
        },
        claimed: [plain(body), ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(rowOf(table, heading) ?? "")}`)]
    };
}
