import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

// Notes batches 2 and 4 (2026-10-05): the notes the module now carries out — Spellsurge's Interference aura, Theogeny's critical punishment, Vacuum's
// suffocation, Stone Lance's "on the ground", Pact Broker's penalty to Lie, Pyrotechnics' creature fire source.
const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const find = (value, key) => { if (Array.isArray(value)) { for (const entry of value) { const hit = find(entry, key); if (hit) return hit; } return null; }
    if (value && typeof value === 'object') { if (key in value) return value[key]; for (const entry of Object.values(value)) { const hit = find(entry, key); if (hit) return hit; } } return null; };

test('Spellsurge: Interference an aura of +2 circumstance to saves against mental effects; the other abilities notes', async () => {
    const plan = compileAbility(await fixture('rank-6/spellsurge.json'));
    assert.equal(plan.resolution.kind, 'stated-effect');
    const options = plan.resolution.statedEffect.choice.options;
    assert.deepEqual(options.map(option => option.key), ['interference', 'mana-well', 'overpower-resistance', 'ward']);
    assert.deepEqual(options[0].aura, {radius: 10, rules: [{key: 'FlatModifier', selector: 'saving-throw', type: 'circumstance', value: 2, predicate: ['item:trait:mental']}]});
    assert.ok(options.slice(1).every(option => !option.aura && option.notes.length));
});

test('Vacuum, Stone Lance, Pact Broker, Pyrotechnics: their carried-out notes', async () => {
    assert.deepEqual(compileAbility(await fixture('rank-7/vacuum.json')).resolution.outcomes.criticalFailure.suffocate, {statistic: 'fortitude', dc: 20, dcStep: 5, die: 10});
    assert.equal(compileAbility(await fixture('rank-3/stone-lance.json')).resolution.groundOnly.slug, 'immobilized');
    const pact = compileAbility(await fixture('cantrip/pact-broker.json')).resolution.storedTrigger.casterRules;
    assert.deepEqual(pact.rules, [{key: 'FlatModifier', selector: 'deception', type: 'status', value: -1, predicate: ['pact-accepted', 'action:lie']}]);
    assert.deepEqual(compileAbility(await fixture('rank-3/pyrotechnics.json')).resolution.sourceCreatureDamage, {formula: '1d6', type: 'cold'});
});

test("Theogeny: the foes' option carries the critical punishment", async () => {
    assert.deepEqual(find(compileAbility(await fixture('rank-10/theogeny.json')).resolution, 'watch'), {critPunish: {formula: '10', type: 'spirit'}});
});
