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



// Rank 3, batch 17 (2026-10-02): Confusing Cry, Fearful Feast.

test('Confusing Cry: row immunity "immune to this spell", the self-attack note', async () => {
    const plan = compile(await spell('rank-5/confusing-cry'));
    assert.deepEqual([inspectSavePlan(plan).supported, plan.resolution.temporaryImmunity.degrees, plan.resolution.temporaryImmunity.duration], [true, ['criticalSuccess'], {value: 1, unit: 'minutes'}]);
    assert.ok(/attacks itself/.test(plan.resolution.outcomes.criticalFailure.noteEffects[0].text));
});

test('Fearful Feast: the caster heals half on the failure rows; a changed fraction or row is not read', async () => {
    const source = await spell('rank-4/fearful-feast');
    assert.equal(compile(source).resolution.casterBenefit.kind, 'heal');
    const plan = compile(withText(source, html => html.replace('Failure</strong> The creature takes full damage; you regain', 'Failure</strong> The creature takes full damage; you lose')));
    assert.equal(inspectSavePlan(plan).supported, false);
});
