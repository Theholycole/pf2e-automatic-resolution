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


// Rank 4, batch 31 (2026-10-02): Rebounding Barrier (resistance to the chosen physical type against the triggering Strike, removed by its damage;
// the attacker's rebound damage; both heightened).

import {reboundAt} from '../src/compiler/damage-reactions.js';

test('Rebounding Barrier: the resistance and the rebound, by rank', async () => {
    const plan = compile(await spell('rank-4/rebounding-barrier'));
    assert.equal(plan.resolution.kind, 'rebound-barrier');
    assert.equal(plan.automation.level, 'automatic');
    const data = plan.resolution.reboundBarrier;
    assert.deepEqual(reboundAt(data, 4, 4), {resistance: 10, damage: 5});
    assert.deepEqual(reboundAt(data, 6, 4), {resistance: 14, damage: 7});
    // Another rebound isn't read.
    const other = compile(withText(await spell('rank-4/rebounding-barrier'), html => html.replace('Your attacker takes 5 damage of the same type.', 'Your attacker takes 5 damage and falls prone.')));
    assert.notEqual(other.resolution.kind, 'rebound-barrier');
});
