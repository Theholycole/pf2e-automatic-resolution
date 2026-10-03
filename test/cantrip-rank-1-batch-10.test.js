import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };
const supported = plan => inspectSavePlan(plan).supported;

test('repeated attacks on later turns: one attack when cast, then one per later turn up to the total', async () => {
    const words = compileAbility(await spell('rank-1/biting-words'));
    assert.equal(supported(words), true, JSON.stringify(inspectSavePlan(words).blockers));
    assert.deepEqual([words.resolution.repeatable.window, words.resolution.repeatable.attacks, words.resolution.repeatable.actions, words.resolution.repeatable.traits],
        ['subsequent-turns', 3, 1, ['attack', 'concentrate', 'linguistic']]);
    assert.deepEqual(['criticalSuccess', 'success', 'failure'].map(degree => words.resolution.outcomes[degree].damage.multiplier), [2, 1, 0]);
    assert.deepEqual([words.lifecycle.durationSpec.value, words.lifecycle.durationSpec.unit], [1, 'minutes']);
    // Camel Spit: an empty Target is one creature; a hit dazzles for 1 round; a critical hit doubles and adds persistent acid.
    const spit = compileAbility(await spell('rank-1/camel-spit'));
    assert.equal(supported(spit), true, JSON.stringify(inspectSavePlan(spit).blockers));
    assert.equal(spit.resolution.repeatable.attacks, 3);
    const crit = spit.resolution.outcomes.criticalSuccess, hit = spit.resolution.outcomes.success;
    assert.equal(crit.damage.shared.multiplier, 2);
    assert.match(crit.damage.formulas[0].formula, /persistent,acid/);
    assert.deepEqual([crit.effects[0].slug, hit.effects[0].slug, hit.effects[0].duration.value, hit.damage.multiplier], ['dazzled', 'dazzled', 1, 1]);
});

test('repeated attacks on later turns: kept strict', async () => {
    const source = await spell('rank-1/biting-words');
    // No stated total, or a total the rule doesn't read.
    assert.equal(compileAbility(withText(source, text => text.replace(' After your third attack total, the spell ends.', ''))).resolution.repeatable, undefined);
    assert.equal(supported(compileAbility(withText(source, text => text.replace('After your third attack total', 'After your tenth attack total')))), false);
    // A duration that isn't fixed.
    const sustained = structuredClone(source); sustained.system.duration = {sustained: true, value: '1 minute'};
    assert.equal(supported(compileAbility(sustained)), false);
    // A tampered window is refused.
    const tampered = compileAbility(source); tampered.resolution.repeatable.attacks = 9;
    assert.equal(supported(tampered), false);
});
