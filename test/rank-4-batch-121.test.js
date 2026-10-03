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


// Rank 4, batch 121 (2026-10-03): Rusting Grasp (a metal creature's basic Fortitude save of the text's damage at the cast rank, the failing rows'
// persistent damage; an item's damage and rust rolled on the card for the GM).

test("Rusting Grasp: creature and item", async () => {
    const plan = compile(await spell("rank-4/rusting-grasp"));
    assert.equal(plan.resolution.kind, "rust-grasp");
    const data = plan.resolution.rustGrasp;
    assert.equal(supported(data.creaturePlan), true);
    assert.equal(data.creaturePlan.resolution.sharedDamage.formula, "(8 + 2*floor((@item.rank - 4)/1))d6[untyped]");
    assert.equal(data.creaturePlan.resolution.outcomes.success.damage.mode, "shared");
    assert.equal(data.creaturePlan.resolution.outcomes.failure.damage.formulas[0].formula, "2d6[persistent,untyped]");
    assert.deepEqual([data.item.statistic, data.item.formula, data.item.persistent], ["reflex", "2d6", "1d6"]);
    // A changed creature sentence isn't read.
    const other = compile(withText(await spell("rank-4/rusting-grasp"), html => html.replace("plus @Damage[2d6[persistent]] on a failed save", "plus @Damage[2d6[persistent]] on a successful save")));
    assert.notEqual(other.resolution.kind, "rust-grasp");
});
