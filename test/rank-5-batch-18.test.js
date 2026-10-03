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


// Rank 5, batch 18 (2026-10-02): Unusual Anatomy (PF2e's Effect — resistance to precision and critical hits, darkvision — proved against the text
// and used as the marker; "Any creature that hits you with an unarmed attack or with a non-reach melee weapon takes 2d6 acid damage." is the
// Retaliate control; the Heightened entry's damage clause matches the item's step).

test("Unusual Anatomy: the proved Effect as the retaliation marker", async () => {
    const plan = compile(await spell("rank-5/unusual-anatomy"));
    assert.equal(plan.resolution.kind, 'retaliation');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const data = plan.resolution.retaliation;
    assert.equal(data.effect.label, 'Spell Effect: Unusual Anatomy');
    assert.equal(data.proven.length, 2);
    assert.deepEqual(data.triggers[0].damage, {componentId: '0', formula: '2d6', type: 'acid'});
    // A resistance PF2e's Effect doesn't give isn't proved.
    const other = compile(withText(await spell("rank-5/unusual-anatomy"), html => html.replace('resistance 10 to precision damage and resistance 10', 'resistance 5 to precision damage and resistance 5')));
    assert.notEqual(other.resolution.kind, 'retaliation');
    // A Heightened damage step other than the item's is refused.
    const step = compile(withText(await spell("rank-5/unusual-anatomy"), html => html.replace('acid damage increases by 1d6', 'acid damage increases by 2d6')));
    assert.notEqual(step.resolution.kind, 'retaliation');
});
