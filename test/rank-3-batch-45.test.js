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


// Rank 3, batch 45 (2026-10-02): Shroud of Flame (the caster's 10-foot emanation: 3d6 fire with a basic Reflex save when cast and the first time
// it's sustained each round — "sustain" in lowercase; touching the caster deals 3 fire (+1 a rank): the caster's retaliation marker for the area's
// lifetime, the GM's Retaliate control).

test("Shroud of Flame: the sustained area save and the touch retaliation", async () => {
    const plan = compile(await spell("rank-3/shroud-of-flame"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const lingering = plan.resolution.lingering;
    assert.deepEqual(lingering.events, ['sustain']);
    assert.equal(lingering.initial, true);
    assert.equal(lingering.centre, 'caster');
    assert.deepEqual(lingering.retaliation.triggers[0].damage, {formula: '3 + @item.rank - 3', type: 'fire'});
    // A touch step other than +1 isn't read.
    const other = compile(withText(await spell("rank-3/shroud-of-flame"), html => html.replace('touching you increases by 1,', 'touching you increases by 2,')));
    assert.equal(other.resolution.lingering?.retaliation ?? null, null);
});
