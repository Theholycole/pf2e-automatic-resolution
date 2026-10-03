import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {proveRowModifierClaim} from '../scripts/effect-modifier-proof.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('Ant Haul and Wooden Fists: sentences their Effect rules state exactly', async () => {
    const effects = await catalog();
    const haul = compileAbility(await spell('rank-1/ant-haul'), {nativeEffectCatalog: effects});
    assert.deepEqual([haul.resolution.kind, haul.automation.level], ['effect', 'automatic']);
    const fists = compileAbility(await spell('rank-1/wooden-fists'), {nativeEffectCatalog: effects});
    assert.deepEqual([fists.resolution.kind, fists.automation.level], ['effect', 'automatic']);
    // A different Bulk amount isn't stated by the Effect.
    const heavy = await spell('rank-1/ant-haul');
    heavy.system.description.value = heavy.system.description.value.replace('carry 3 more Bulk', 'carry 4 more Bulk');
    assert.notEqual(compileAbility(heavy, {nativeEffectCatalog: effects}).automation.level, 'automatic');
});

test('Brain Drain: a caster reminder for each target that fails', async () => {
    const plan = compileAbility(await spell('rank-1/brain-drain'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const [reminder] = plan.resolution.reminders;
    assert.deepEqual([reminder.kind, reminder.degrees], ['failed-save-follow-up', ['failure', 'criticalFailure']]);
    assert.match(reminder.text, /Recall Knowledge/);
    // A follow-up with a rule of its own isn't a reminder.
    const extra = await spell('rank-1/brain-drain');
    extra.system.description.value = extra.system.description.value.replace("use the target's skill modifier for the check.", "use the target's skill modifier for the check. Use a +2 bonus.");
    assert.equal(supported(compileAbility(extra)), false);
});

test('Thunderstrike: a GM-judged −1 to the save, and Clumsy 1 only for those targets when damaged', async () => {
    const plan = compileAbility(await spell('rank-1/thunderstrike'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.attackAdjustment.choices.map(choice => choice.value), [-1, 0]);
    for (const degree of ['success', 'failure', 'criticalFailure']) {
        const [clumsy] = plan.resolution.outcomes[degree].effects;
        assert.deepEqual([clumsy.slug, clumsy.value, clumsy.duration.value, clumsy.gate.kind], ['clumsy', 1, 1, 'adjustment-and-damaged']);
    }
    assert.equal(plan.resolution.outcomes.criticalSuccess.effects.length, 0);
});

test('Schadenfreude: the triggering foe, and a success-row Effect whose penalties the row states', async () => {
    const plan = compileAbility(await spell('rank-1/schadenfreude'), {nativeEffectCatalog: await catalog()});
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const rule = plan.resolution.outcomes.success.nativeEffects[0].outcomeRule;
    assert.deepEqual([rule.kind, rule.modifiers.selectors, rule.durationAnchor], ['row-modifier-effect', ['perception', 'will'], 'effect-start']);
    const mechanics = {rules: [{key: 'FlatModifier', selector: ['perception', 'will'], type: 'status', value: -1}], duration: {value: 1, unit: 'rounds', expiry: 'turn-start', sustained: false}};
    const row = 'The creature is distracted by its amusement and takes a -1 status penalty on Perception checks and Will saves for 1 round.';
    assert.ok(proveRowModifierClaim(mechanics, row));
    assert.equal(proveRowModifierClaim(mechanics, row.replace('for 1 round', 'for 1 minute')), null, 'duration differs');
    assert.equal(proveRowModifierClaim(mechanics, row.replace(' and Will saves', '')), null, 'a rule the row doesn\'t state');
    assert.equal(proveRowModifierClaim(mechanics, row.replace('is distracted by its amusement', 'is stunned 1')), null, 'a rule in the narration');
});

test('Split the Tongue: a reaction whose Target is its trigger, a basic save with its own table, and rolled rounds', async () => {
    const plan = compileAbility(await spell('rank-1/split-the-tongue'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.compilerEvidence.basicTable, true);
    const stupefied = plan.resolution.outcomes.failure.effects[0];
    assert.deepEqual([stupefied.slug, stupefied.duration.value, stupefied.duration.valueRoll, stupefied.duration.unit], ['stupefied', null, '1d4', 'rounds']);
    // Chastising Retort's plain "for 1d4 rounds" is read too (the spell stays blocked for its other rule).
    const retort = compileAbility(await spell('rank-1/chastising-retort'));
    assert.equal(retort.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === 'stupefied').duration.valueRoll, '1d4');
    // (Divine Immolation's GM-judged "more detrimental" type is read from PF2e's data since rank 5 batch 34: test/rank-5-batch-34.test.js.)
});
