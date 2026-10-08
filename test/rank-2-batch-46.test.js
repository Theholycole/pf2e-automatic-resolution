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



// Rank 2, batch 46 (2026-10-01): Soothing Mist.

test('Soothing Mist: heal or harm, persistent vitality on the harmed side\'s failure, persistent removal on the healed side', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/soothing-mist'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.dualMode, {energy: 'vitality'});
    assert.deepEqual(plan.resolution.persistentRemoval.types, ['acid', 'bleed', 'fire', 'poison', 'void']);
    assert.equal(plan.resolution.outcomes.failure.damage.formulas[0].formula, '(@item.rank)[persistent,vitality]');
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.shared.multiplier, 2);
    const forged = structuredClone(plan); forged.resolution.persistentRemoval.sourceText = 'forged';
    assert.equal(inspectSavePlan(forged).supported, false);
});
