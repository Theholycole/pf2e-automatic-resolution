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


// Rank 3, batch 37 (2026-10-02): Defensive Prescience (misfortune on the triggering attack roll; the spell's damage when the GM reports the
// attack's result — a critical failure on a failed save, a failure or worse on a critical failure).

test('Defensive Prescience: RollTwice on the attack and the attack-result damage', async () => {
    const plan = compile(await spell('rank-3/defensive-prescience'));
    assert.equal(supported(plan), true);
    for (const [degree, results] of [['failure', ['criticalFailure']], ['criticalFailure', ['failure', 'criticalFailure']]]) {
        const [note] = plan.resolution.outcomes[degree].noteEffects;
        assert.deepEqual(note.rules, [{key: 'RollTwice', selector: 'attack-roll', keep: 'lower', removeAfterRoll: true}]);
        assert.deepEqual(note.triggeredDamage.results, results);
        assert.equal(note.triggeredDamage.trigger, 'attack-result');
        assert.equal(plan.resolution.outcomes[degree].damage.mode, 'none');
    }
    assert.deepEqual(plan.resolution.outcomes.success.noteEffects ?? [], []);
    // Swapped results aren't read.
    const other = compile(withText(await spell('rank-3/defensive-prescience'), html => html.replace('if its attack is a critical failure', 'if its attack is a failure')));
    assert.equal(supported(other), false);
});
