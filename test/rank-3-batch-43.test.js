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


// Rank 3, batch 43 (2026-10-02): Warning Stripes (a retaliation marker: "Any creature that touches you or hits you with an unarmed melee attack
// takes 2d8 poison damage."; "If you have an animal companion, you can cast this spell on them instead, with a range of 30 feet." — the marker on
// the targeted companion).

test("Warning Stripes: the retaliation and the companion option", async () => {
    const plan = compile(await spell("rank-3/warning-stripes"));
    assert.equal(plan.resolution.kind, 'retaliation');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const data = plan.resolution.retaliation;
    assert.equal(data.triggers.length, 1);
    assert.deepEqual(data.triggers[0].damage, {componentId: 'pO0jWffyBOsayMks', formula: '2d8', type: 'poison'});
    assert.equal(data.companion.range, 30);
    // Damage that isn't the item's is refused.
    const other = compile(withText(await spell("rank-3/warning-stripes"), html => html.replace('takes 2d8 poison damage', 'takes 2d6 poison damage')));
    assert.notEqual(other.resolution.kind, 'retaliation');
    // The companion option alone (no retaliation before it) isn't read.
    const alone = compile(withText(await spell("rank-3/warning-stripes"), html => html.replace('Any creature that touches you or hits you with an unarmed melee attack takes 2d8 poison damage. ', '')));
    assert.notEqual(alone.resolution.kind, 'retaliation');
});
