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



// Rank 2, batch 60 (2026-10-01): Expeditious Excavation.

import {inspectSavePlan, validateActorTarget} from '../scripts/basic-save-core.js';

test('Expeditious Excavation: Prone on a failure, Prone and the 5-foot fall on a critical failure; Medium or smaller, Large from 8th', async () => {
    const plan = compile(await spell('rank-2/expeditious-excavation'));
    assert.ok(inspectSavePlan(plan).supported);
    const rows = plan.resolution.outcomes;
    assert.deepEqual([rows.failure.effects.map(e => e.slug), rows.criticalFailure.effects.map(e => e.slug)], [['prone'], ['prone']]);
    assert.match(JSON.stringify(rows.criticalFailure.damage.formulas), /2\[bludgeoning\]/);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'size-at-most', size: 'med', byRank: {8: 'lg'}}]);
    const large = {type: 'npc', size: 'lg', system: {traits: {value: []}}, traits: new Set()};
    assert.equal(validateActorTarget({...plan.targeting.actorConstraints, castRank: 2}, large).eligible, false);
    assert.equal(validateActorTarget({...plan.targeting.actorConstraints, castRank: 8}, large).eligible, true);
});

test('Expeditious Excavation: another fall, size or row is not read', async () => {
    const source = await spell('rank-2/expeditious-excavation');
    for (const [from, to] of [['Any Medium or smaller', 'Any Huge or smaller'], ['taking falling damage as normal', 'taking 4d6 damage'], ['all four 5-foot cubes', 'all six 5-foot cubes']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.ok(!(plan.compilerEvidence?.areaOrObject ?? []).some(text => /remove loose dirt/.test(text)), from);
    }
});
