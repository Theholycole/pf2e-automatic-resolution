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


// Rank 4, batch 11 (2026-10-02): Anathematic Reprisal (Stupefied 1 on failing, 1-minute immunity, the cast limit a reminder), Life-Draining
// Roots (1d4 temporary Hit Points for each living creature in the line).

test('Anathematic Reprisal: Stupefied 1 for 1 round on failing, temporary immunity, the cast limit on the card', async () => {
    const plan = compile(await spell('rank-4/anathematic-reprisal'));
    assert.equal(supported(plan), true);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.value, effect.duration.value, effect.duration.unit]), [['stupefied', 1, 1, 'rounds']]);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 1, unit: 'minutes'});
    assert.ok(plan.resolution.reminders.some(entry => entry.kind === 'cast-condition' && /only when a creature actively commits/.test(entry.text)));
    // The cast limit is read only on a reaction.
    const action = await spell('rank-4/anathematic-reprisal'); action.system.time.value = '2';
    assert.equal(supported(compile(action)), false);
});

test('Life-Draining Roots: 1d4 temporary Hit Points per living creature in the line, for 1 minute', async () => {
    const plan = compile(await spell('rank-4/life-draining-roots'));
    assert.equal(supported(plan), true);
    assert.deepEqual([plan.resolution.casterBenefit.measure, plan.resolution.casterBenefit.dice, plan.resolution.casterBenefit.duration], ['dice-per-living', {count: 1, faces: 4}, {value: 1, unit: 'minutes'}]);
    // Without a stated duration it's refused.
    assert.equal(supported(compile(withText(await spell('rank-4/life-draining-roots'), html => html.replace('The temporary Hit Points last for 1 minute.', '')))), false);
});
