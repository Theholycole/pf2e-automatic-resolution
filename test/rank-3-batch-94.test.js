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


// Rank 3, batch 94 (2026-10-03): Moth's Supper (the caster's Effect heals the item's dice every 10 minutes of world time; the extra healing when
// treated is a button, once; the blood-and-rot sense, which no PF2e sense matches, is a note).

test("Moth's Supper: healing every 10 minutes, the treated extra and its heightening", async () => {
    const plan = compile(await spell("rank-3/moths-supper"));
    assert.equal(plan.resolution.kind, "interval-heal");
    const data = plan.resolution.intervalHeal;
    assert.equal(data.seconds, 3600);
    assert.equal(data.everySeconds, 600);
    assert.equal(data.formula, "2d4");
    assert.deepEqual([data.treated.dice, data.treated.faces, data.treated.perStep, data.treated.interval], [4, 4, 2, 1]);
    assert.equal(data.notes.length, 1);
    // A healing heightening that differs from PF2e's isn't read.
    const other = compile(withText(await spell("rank-3/moths-supper"), html => html.replace("increases by 1d4", "increases by 2d4")));
    assert.notEqual(other.resolution.kind, "interval-heal");
});
