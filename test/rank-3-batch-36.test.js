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


// Rank 3, batch 36 (2026-10-02): Incendiary Ashes (each row's weakness proved by PF2e's (Success)/(Failure) Effect; the "reduced to ashes"
// sentence a GM row note).

test('Incendiary Ashes: the rows\' weakness Effects and the ashes note', async () => {
    const plan = compile(await spell('rank-3/incendiary-ashes'));
    assert.equal(supported(plan), true);
    const rule = degree => plan.resolution.outcomes[degree].nativeEffects[0].outcomeRule;
    assert.deepEqual(rule('success').modifiers, {weakness: {types: ['fire'], value: 3}});
    assert.equal(rule('success').durationAnchor, 'target-turn');
    assert.equal(rule('failure').durationAnchor, 'effect-start');
    assert.equal(plan.resolution.outcomes.criticalFailure.nativeEffects[0].reference, 'Spell Effect: Incendiary Ashes (Failure)');
    assert.equal(plan.resolution.outcomes.failure.rowNotes[0].kind, 'reduced-to-ashes');
    assert.equal(plan.resolution.outcomes.criticalFailure.rowNotes[0].kind, 'reduced-to-ashes');
    // A different weakness value isn't proved by PF2e's Effect.
    const other = compile(withText(await spell('rank-3/incendiary-ashes'), html => html.replace('weakness to fire 3 for 1 minute', 'weakness to fire 5 for 1 minute')));
    assert.equal(supported(other), false);
});
