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

const supported = plan => inspectSavePlan(plan).supported;

const mergeDeep = (target, patch) => { for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value; return target; };
const variant = (source, time) => {
    const copy = structuredClone(source);
    const [, overlay] = Object.entries(copy.system.overlays).find(([, entry]) => entry.system?.time?.value === time);
    copy.system = mergeDeep(copy.system, structuredClone(overlay.system)); delete copy.system.overlays;
    for (const entry of Object.values(copy.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ['damage'];
    return copy;
};

// Rank 5, batch 9 (2026-10-02): Plasma Whirl — each action variant's cone and damage; the 3-action variant's Sickened 1 (2 on a critical
// failure) rider.

test('Plasma Whirl: the variants, the 3-action Sickened rider', async () => {
    const source = await spell('rank-5/plasma-whirl');
    for (const time of ['1', '2', '3']) assert.equal(supported(compile(variant(source, time))), true, time);
    const three = compile(variant(source, '3'));
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => three.resolution.outcomes[degree].effects.map(effect => `${effect.slug} ${effect.value}`)), [['sickened 1'], ['sickened 2']]);
    assert.deepEqual(compile(variant(source, '1')).resolution.outcomes.failure.effects, []);
});
