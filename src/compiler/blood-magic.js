// Sorcerer blood magic (the spell features audit, batch F2, 2026-10-05): a bloodline's blood magic text, as PF2e words it, read into the options the
// caster picks from when casting a blood magic spell. Each option: { key, label, who: "self" | "target", effect (PF2e's Effect), selection (its ChoiceSet's
// pick), concealed, damage: { type | alive/undead | elementFlag }, spite }. Null when a sentence isn't one the reader knows.
const C = String.raw`@UUID\[[^\]]+\]\{([^}]+)\}`;

/** The options of a blood magic text, with its Effect (from PF2e's link). */
export function readBloodMagic(text, link = null) {
    const effect = /@UUID\[([^\]]+)\]/.exec(link ?? "")?.[1] ?? null;
    const selfOnlyEffect = /\(Self\)\}$/.test(link ?? "");
    const plain = String(text ?? "").replace(/\s+/g, " ").trim();
    const options = [];
    const add = option => options.push({ ...option, key: `${option.who}-${options.length}` });
    // Hag: "You deal 4×rank mental damage (basic Will save) to the first creature that deals damage to you before the end of your next turn; if no creature
    // damages you in that time, you consume that spite to gain temporary Hit Points at the beginning of your next turn equal to the spell's rank."
    const spite = /^You deal @Damage\[\((\d+)\*@item\.level\)\[([a-z]+)\]\] damage \(@Check\[([a-z]+)\|basic\|against:spell\] save\) to the first creature that deals damage to you before the end of your next turn; if no creature damages you in that time, you consume that spite to gain temporary Hit Points at the beginning of your next turn equal to the spell's rank\./.exec(plain);
    if (spite) {
        add({ who: "self", label: "Spite: the first creature to damage you takes it; otherwise temporary Hit Points", spite: { perRank: Number(spite[1]), type: spite[2], statistic: spite[3] } });
        return { options, effect };
    }
    // Imperial: "Until the start of your next turn, you gain your choice of either a +1 status bonus to AC or to saving throws."
    const imperial = /^Until the start of your next turn, you gain your choice of either a \+(\d) status bonus to AC or to saving throws\.$/.exec(plain);
    if (imperial) {
        add({ who: "self", label: `+${imperial[1]} status to AC`, effect, selection: { flag: "defense", value: "ac" } });
        add({ who: "self", label: `+${imperial[1]} status to saves`, effect, selection: { flag: "defense", value: "saving-throw" } });
        return { options, effect };
    }
    // Shadow: "Shadows grow deeper around you or one target, either granting a +1 status bonus to Stealth or imposing a -1 status penalty to Perception …"
    const shadow = /^Shadows grow deeper around you or one target, either granting a \+(\d) status bonus to (Stealth) or imposing a [-–](\d) status penalty to (Perception) for 1 round\.$/.exec(plain);
    if (shadow) {
        add({ who: "self", label: `+${shadow[1]} status to ${shadow[2]}`, effect, selection: { flag: "shadowBloodMagic", value: "stealth" } });
        add({ who: "target", label: `–${shadow[3]} status to ${shadow[4]}`, effect, selection: { flag: "shadowBloodMagic", value: "perception" } });
        return { options, effect };
    }
    // "You or one target is granted a +1 status bonus to AC for 1 round." (Draconic, Angelic)
    const either = /^You or one target is granted a \+(\d) status bonus to ([A-Za-z ]+?) for 1 round\.?$/.exec(plain);
    if (either) {
        add({ who: "self", label: `You: +${either[1]} status to ${either[2]}`, effect });
        add({ who: "target", label: `A target: +${either[1]} status to ${either[2]}`, effect });
        return { options, effect };
    }
    // Harrow: "You gain Concealment for 1 round, but can't use the concealment to Hide."
    if (new RegExp(String.raw`You gain ${C} for 1 round, but can't use the concealment to ${C}\.$`).test(plain)) {
        add({ who: "self", label: "You: Concealed for 1 round (not to Hide)", concealed: true });
        return { options, effect };
    }
    // The "Either A or B" texts: each part an option.
    const body = plain.replace(/^.*?(?=Either |either |Choose to have either )/, "");
    // (Phoenix's "either you or a target of the spell gain …": one option for either creature, kept whole while splitting.)
    const parts = body.replace(/^(?:Either|either|Choose to have either) /, "").replace(/you or a target of the spell gain/g, "YOU_OR_TARGET gain")
        .split(/,? or (?=(?:you|a target|one target|imposing|to have|granting you|you can)\b)/).map(part => part.replace("YOU_OR_TARGET", "you or a target of the spell"));
    if (parts.length !== 2) return null;
    for (const raw of parts) {
        const part = raw.replace(/\.$/, "").trim();
        let m;
        if ((m = /^(?:granting )?you (?:gain )?a \+(\d) status bonus to ([A-Za-z ]+?)(?: checks| saving throws| saves)? for 1 round/.exec(part))) add({ who: "self", label: `You: +${m[1]} status to ${m[2]}`, effect });
        else if ((m = /^(?:one target|a target) takes a [–-](\d) status penalty to ([A-Za-z ]+?)(?: saving throws| saves)? for 1 round/.exec(part))
            || (m = /^imposing a [–-](\d) status penalty on one target's ([A-Za-z]+) saves for 1 round/.exec(part))) {
            if (selfOnlyEffect) return null;
            add({ who: "target", label: `A target: –${m[1]} status to ${m[2]}`, effect });
        }
        else if (/^you gain temporary Hit Points equal to the spell's rank/.test(part)) add({ who: "self", label: "You: temporary Hit Points equal to the spell's rank", effect });
        else if (/^you or a target of the spell gain temporary Hit Points equal to the spell's rank for 1 round/.test(part)) {
            add({ who: "self", label: "You: temporary Hit Points equal to the spell's rank", effect });
            add({ who: "target", label: "A target: temporary Hit Points equal to the spell's rank", effect });
        }
        else if (new RegExp(String.raw`^you can become ${C} for 1 round`).test(part)) add({ who: "self", label: "You: Concealed for 1 round (not to Hide)", concealed: true });
        else if ((m = /^(?:to have )?a target(?: of the spell)? takes? @Damage\[@item\.level\[([a-z]+)\]\](?:\{[^}]*\})? if it's alive or @Damage\[@item\.level\[([a-z]+)\]\] if it's undead/.exec(part)))
            add({ who: "target", label: `A target: ${m[1]} damage equal to the rank (${m[2]} if undead)`, damage: { alive: m[1], undead: m[2] } });
        else if ((m = /^(?:to have )?a target(?: of the spell)? takes? @Damage\[@item\.level\[@actor\.flags\.system\.([a-zA-Z.]+)\]\]/.exec(part)))
            add({ who: "target", label: "A target: damage of your element equal to the rank", damage: { flag: m[1] } });
        else if ((m = /^(?:to have )?a target(?: of the spell)? takes? @Damage\[@item\.level\[([a-z]+)\]\]/.exec(part)))
            add({ who: "target", label: `A target: ${m[1]} damage equal to the rank`, damage: { type: m[1] } });
        else return null;
    }
    return options.length >= 2 ? { options, effect } : null;
}

