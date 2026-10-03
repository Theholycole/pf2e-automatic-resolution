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



// Rank 3, batch 8 (2026-10-02): Blastback (a basic save's push rider).

test('Blastback: the push on a failed save, the spared caster, the heightened area', async () => {
    const plan = compile(await spell('rank-3/blastback'));
    assert.deepEqual([plan.automation.pendingCapabilities, inspectSavePlan(plan).supported], [[], true]);
    for (const degree of ['failure', 'criticalFailure']) assert.deepEqual([plan.resolution.outcomes[degree].forcedMovement.kind, plan.resolution.outcomes[degree].forcedMovement.distance], ['push', 5], degree);
    assert.equal(plan.resolution.outcomes.success.forcedMovement, undefined);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'not-caster'}]);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['caster-spared', 'heightened-area']);
});

test('Blastback: changed riders are not read', async () => {
    const source = await spell('rank-3/blastback');
    for (const [from, to] of [['are also pushed back 5 feet.', 'are also pushed back 5 feet and knocked Prone.'], ['take 6d4 bludgeoning damage', 'take 8d4 bludgeoning damage'],
        ['the damage increases by 1d4', 'the damage increases by 2d4']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.equal(inspectSavePlan(plan).supported, false, from);
    }
});
