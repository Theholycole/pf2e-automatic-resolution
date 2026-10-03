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


// Rank 5, batch 84 (2026-10-03): Symphony of the Unfettered Heart (the skill counteract of an effect giving a listed condition; the lock after a failure; four
// targets at 9th).

test("Symphony of the Unfettered Heart: the symphony", async () => {
    const plan = compile(await spell("rank-5/symphony-of-the-unfettered-heart"));
    assert.equal(plan.resolution.kind, "skill-counteract");
    const data = plan.resolution.skillCounteract;
    assert.deepEqual([data.skill, data.lockSeconds, data.targets], ["performance", 86400, { rank: 9, count: 4 }]);
    assert.deepEqual(data.conditions.map(condition => condition.slug), ["grabbed", "immobilized", "paralyzed", "restrained", "slowed", "stunned"]);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/symphony-of-the-unfettered-heart"), html => html.replace("If you fail, you can't target", "If you fail, you are stunned and can't target")));
    assert.notEqual(other.resolution.kind, "skill-counteract");
});
