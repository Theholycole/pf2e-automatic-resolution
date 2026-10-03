import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

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



// Rank 2, batch 4 (2026-09-30): forced movement a variant's action count settles, a pull to the space next to the caster, and "As failure" rows
// carrying the failure's move.
const variant = (source, time) => { const copy = structuredClone(source); copy.system.time = {value: time}; delete copy.system.overlays; return copy; };

test('Boneshaker: the 3-action variant\'s optional move (Prone to avoid; the critical failure knocks Prone), the 2-action variant has none', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {applyActionVersion} = await import('../src/compiler/action-versions.js');
    const source = await spell('rank-2/boneshaker');
    const three = compile(variant(source, '3')), two = compile(variant(source, '2'));
    assert.deepEqual([inspectSavePlan(three).supported, inspectSavePlan(two).supported], [true, true]);
    const move = degree => three.resolution.outcomes[degree].forcedMovement;
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => [move(degree).distance, move(degree).upTo, move(degree).optional, move(degree).avoid]),
        [[5, true, true, 'prone'], [15, true, true, 'prone'], [25, true, true, 'hazard-prone']]);
    // The refusal's Prone link isn't a condition; the critical failure's "then knock the target prone" is.
    assert.deepEqual(three.resolution.outcomes.success.effects.map(effect => effect.slug), []);
    assert.deepEqual(three.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['enfeebled', 'prone']);
    assert.ok(['success', 'failure', 'criticalFailure'].every(degree => !two.resolution.outcomes[degree].forcedMovement));
    assert.deepEqual(two.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['enfeebled']);
    // Only a fixed count is settled.
    assert.equal(applyActionVersion(source.system.description.value, '2 or 3'), null);
    // Kept strict: a different refusal isn't read.
    const other = compile(variant(withText(source, text => text.replace('it can choose to fall', 'it can choose to Step or fall')), '3'));
    assert.equal(inspectSavePlan(other).supported, false);
});

test('Retrieving Hook: a pull to the space next to the caster; the critical failure ("As failure, and …") pulls too; creature or object target', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const hook = compile(await spell('rank-2/retrieving-hook'));
    assert.equal(inspectSavePlan(hook).supported, true);
    assert.deepEqual(hook.resolution.outcomes.failure.forcedMovement, {kind: 'pull', distance: null, toAdjacent: true, upTo: false, optional: false, direction: 'toward', sourceText: 'The target is pulled to the nearest empty space adjacent to you.'});
    assert.equal(hook.resolution.outcomes.criticalFailure.forcedMovement.toAdjacent, true);
    assert.deepEqual(hook.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['off-guard']);
    assert.equal(hook.targeting.actorConstraints.complete, true);
});
