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



// Rank 5, batch 7 (2026-10-02): Glacial Skewer.

test('Glacial Skewer: a hit pushes 10 feet, a critical hit 20 with double damage; Immobilized only where the GM says it hit an obstacle', async () => {
    const plan = compile(await spell('rank-5/glacial-skewer'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    const row = degree => plan.resolution.outcomes[degree];
    assert.deepEqual([row('success').forcedMovement.distance, row('criticalSuccess').forcedMovement.distance], [10, 20]);
    for (const degree of ['success', 'criticalSuccess']) {
        const [effect] = row(degree).effects;
        assert.deepEqual([effect.slug, effect.gate.kind, effect.duration.value, effect.duration.unit, effect.endsWhen.map(end => end.event)], ['immobilized', 'gm-question', 1, 'minutes', ['escape']]);
    }
    assert.deepEqual([row('failure').effects, row('criticalFailure').effects], [[], []]);
    // Another obstacle sentence isn't gated (the spell stays blocked).
    assert.equal(inspectSavePlan(compile(withText(await spell('rank-5/glacial-skewer'), html => html.replace("that's Large or larger", 'of any size')))).supported, false);
});
