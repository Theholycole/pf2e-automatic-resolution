import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

const supported = plan => inspectSavePlan(plan).supported;


// Rank 3, batch 27 (2026-10-02): basic saves with one more rule — Echo Jump and Blazing Dive (the caster's move, a reminder), Fungal
// Exhalation (the breathing question with its Sickened rider), Powerful Inhalation (air creatures one degree worse; what failing creatures
// can't do, a note).

test('Echo Jump: the basic save of the creatures in the area, the teleport (its range at the cast rank) a reminder', async () => {
    const plan = compile(await spell('rank-3/echo-jump'));
    assert.equal(supported(plan), true);
    const reminder = plan.resolution.reminders.find(entry => entry.kind === 'caster-movement');
    assert.deepEqual(reminder.rankFeet, {base: 30, step: 10, interval: 2, baseRank: 3});
    assert.match(reminder.text, /centred on the space the caster left/);
    assert.deepEqual(plan.resolution.sharedDamage.components.map(component => [component.formula, component.type]), [['4d8', 'force']]);
    // A blast of another size than the item's area is refused.
    assert.equal(supported(compile(withText(await spell('rank-3/echo-jump'), html => html.replace('10-foot emanation', '20-foot emanation')))), false);
});

test('Blazing Dive: both damage types on one basic save, the dive a reminder', async () => {
    const plan = compile(await spell('rank-3/blazing-dive'));
    assert.equal(supported(plan), true);
    assert.match(plan.resolution.reminders.find(entry => entry.kind === 'caster-movement').text, /Flies 15 feet straight up.*within 60 feet/);
    assert.deepEqual(plan.resolution.sharedDamage.components.map(component => component.type), ['bludgeoning', 'fire']);
    // A heightened step that isn't the item's is refused.
    assert.equal(supported(compile(withText(await spell('rank-3/blazing-dive'), html => html.replace('1d4 bludgeoning', '2d4 bludgeoning')))), false);
});

test('Fungal Exhalation: Sickened 1/2 on failing, and a GM question whether the creature breathes', async () => {
    const plan = compile(await spell('rank-3/fungal-exhalation'));
    assert.equal(supported(plan), true);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].effects.map(effect => `${effect.slug} ${effect.value}`)), [['sickened 1'], ['sickened 2']]);
    assert.match(plan.targeting.actorConstraints.predicates.find(entry => entry.kind === 'gm-confirmed').question, /breathe/);
});

test('Powerful Inhalation: air creatures one degree worse, a note for each failing row', async () => {
    const plan = compile(await spell('rank-3/powerful-inhalation'));
    assert.equal(supported(plan), true);
    assert.deepEqual(plan.resolution.degreeAdjustment.predicate, {kind: 'trait-any', traits: ['air']});
    assert.equal(plan.resolution.outcomes.failure.noteEffects.length, 1);
    assert.equal(plan.resolution.outcomes.criticalFailure.noteEffects.length, 2);
    assert.ok(plan.resolution.outcomes.criticalFailure.noteEffects.every(note => note.duration.value === 1 && note.duration.unit === 'rounds'));
    // A failing row's rule the reader can't place is refused.
    assert.equal(supported(compile(withText(await spell('rank-3/powerful-inhalation'), html => html.replace('for 1 round.', 'until it succeeds at a Fortitude save.')))), false);
});
