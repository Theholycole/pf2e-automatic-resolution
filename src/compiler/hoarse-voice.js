// A voice that fails and hurts (Croak Voice): rows "The target's voice becomes hoarse, and speaking becomes painful. Whenever it uses an action that has
// the auditory trait or attempts to Cast a Spell that doesn't have the subtle trait, it must succeed at a @Check[flat|dc:5] or the action is lost. Once
// per round, the target can spend an Interact action to massage its throat, attempting a Fortitude save against your spell DC. On a success, the spell
// ends." / "As success, but using an action with the auditory trait also deals 2d10 mental damage to the target as the sound of its distorted voice
// grates on its ears." / "As failure, but the damage for using an action with the auditory trait is doubled, and the target can't use an Interact
// action to attempt a Fortitude save to end the effect early." with "Heightened (+1) The damage for using an action with the auditory trait increases
// by 1d10.": each row a note for the spell's duration (the flat check is the table's); the throat massage the creature's control (its save against
// the spell DC, once a round, a success ending the spell); the auditory damage the GM's control (the item's dice at the cast rank, doubled on a
// critical failure).
const SUCCESS = /^The target's voice becomes hoarse, and speaking becomes painful\. Whenever it uses an action that has the auditory trait or attempts to Cast a Spell that doesn't have the subtle trait, it must succeed at a @Check\[flat\|dc:5\] or the action is lost\. Once per round, the target can spend an Interact action to ([a-z ]+), attempting an? (Fortitude|Reflex|Will) save against your spell DC\. On a success, the spell ends\.$/;
const FAILURE = /^As success, but using an action with the auditory trait also deals (\d+)d(\d+) ([a-z]+) damage to the target as [a-z ,']+\.$/;
const CRITICAL = /^As failure, but the damage for using an action with the auditory trait is doubled, and the target can't use an Interact action to attempt an? (Fortitude|Reflex|Will) save to end the effect early\.$/;
const STEP = /Heightened \(\+(\d)\) The damage for using an action with the auditory trait increases by (\d+)d(\d+)\.\s*$/;

/** The rows' notes ({success, failure, criticalFailure}) or null. `rowRaw(degree)` is the row's text; `length` the spell's duration as a note's. */
export function compileHoarseVoice(rowRaw, components, heightenedText, length, rank) {
    const success = SUCCESS.exec(rowRaw("success")), failure = FAILURE.exec(rowRaw("failure")), critical = CRITICAL.exec(rowRaw("criticalFailure"));
    if (!success || !failure || !critical || !length || components.length !== 1 || components[0].category) return null;
    const [component] = components;
    if (`${failure[1]}d${failure[2]}` !== String(component.formula).replace(/\s+/g, "") || failure[3] !== String(component.type).toLowerCase() || critical[1] !== success[2]) return null;
    const step = STEP.exec(heightenedText);
    if (/Heightened/.test(heightenedText) && !(step && step[3] === failure[2])) return null;
    const statistic = success[2].toLowerCase();
    const flat = "Whenever it uses an action that has the auditory trait or Casts a Spell without the subtle trait, it must succeed at a DC 5 flat check or the action is lost.";
    const endSave = { statistic, label: `${success[1]} (Interact)`, oncePerRound: true };
    const damage = multiplier => ({ trigger: "auditory", dice: Number(failure[1]), die: Number(failure[2]), type: failure[3], componentId: component.id, frequency: "each", endsSpell: false,
        baseRank: Number(rank), ...(multiplier ? { multiplier } : {}), ...(step ? { heightening: { interval: Number(step[1]), dice: Number(step[2]) } } : {}) });
    const note = (degree, extra) => ({ label: "Hoarse voice", text: `${flat}${extra}`, sourceText: rowRaw(degree), claimsRow: true, gmPlays: true, duration: { ...length } });
    return {
        success: [{ ...note("success", " Once a round it can Interact to massage its throat: a save against the spell DC ends the spell on a success."), endSave }],
        failure: [{ ...note("failure", " Once a round it can Interact to massage its throat: a save against the spell DC ends the spell on a success. Each auditory action also deals it the damage (the GM's control)."), endSave, triggeredDamage: damage(null) }],
        criticalFailure: [{ ...note("criticalFailure", " Each auditory action deals it double the damage (the GM's control); it can't end the spell early."), triggeredDamage: damage(2) }]
    };
}
