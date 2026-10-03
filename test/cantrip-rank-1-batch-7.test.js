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

test('Protective Wards: an aura growing 5 feet on each Sustain, proved by its Aura radius and counter badge', async () => {
    const effects = await catalog();
    const plan = compileAbility(await spell('rank-1/protective-wards'), {nativeEffectCatalog: effects});
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.resolution.sustainGrowth, {feet: 5, maximum: 30, badgeMax: 6, sourceText: "Each time you Sustain the spell, the emanation's radius increases by 5 feet, to a maximum of 30 feet."});
    // A maximum the badge can't reach, or another step, stays blocked.
    for (const [from, to] of [['to a maximum of 30 feet', 'to a maximum of 40 feet'], ['increases by 5 feet', 'increases by 10 feet']]) {
        const changed = await spell('rank-1/protective-wards');
        changed.system.description.value = changed.system.description.value.replace(from, to);
        assert.notEqual(compileAbility(changed, {nativeEffectCatalog: effects}).automation.level, 'automatic', to);
    }
});
