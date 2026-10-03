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


// Rank 3, batch 44 (2026-10-02): Unbreaking Wave Advance (Fortitude: pushed 10 feet, or 20 on a critical failure; the item's 3d6 is the collision
// damage when a push would move the creature into a solid barrier or another creature — the GM's, given on the push note at the cast rank).

test("Unbreaking Wave Advance: the pushes and the collision damage", async () => {
    const plan = compile(await spell("rank-3/unbreaking-wave-advance"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.equal(plan.resolution.outcomes.failure.forcedMovement.distance, 10);
    assert.equal(plan.resolution.outcomes.criticalFailure.forcedMovement.distance, 20);
    assert.equal(plan.resolution.collisionDamage.componentId, '0');
    assert.match(plan.resolution.forcedMovementNotes[0], /@Damage\[\(3 \+ \(@item\.rank - 3\) \* 1\)d6\[untyped\]\]/);
    // A collision step other than the item's is refused.
    const other = compile(withText(await spell("rank-3/unbreaking-wave-advance"), html => html.replace('increases by 1d6', 'increases by 2d6')));
    assert.notDeepEqual(other.automation.pendingCapabilities, []);
});
