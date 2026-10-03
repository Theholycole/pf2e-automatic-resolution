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


// Rank 3, batch 109 (2026-10-03): Zombie Horde (the lingering area's wording: difficult terrain, the turn-start basic save — the text's "basic"; the
// thrall's destruction, placement and move notes; the burst's growth by thralls the GM's control).

test("Zombie Horde: a lingering horde grown by thralls", async () => {
    const plan = compile(await spell("rank-3/zombie-horde"));
    const lingering = plan.resolution.lingering;
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual([lingering.events.join(), lingering.area.value, lingering.terrain.difficulty, lingering.dismissible], ["turn-start", 10, 2, true]);
    assert.deepEqual([lingering.thrallGrowth.feet, lingering.thrallGrowth.maximum], [5, 30]);
    assert.equal(lingering.notes.length, 3);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    // A growth past what the text states isn't read.
    const other = compile(withText(await spell("rank-3/zombie-horde"), html => html.replace("increases by 5 feet for each thrall", "increases by 10 feet for each thrall")));
    assert.notEqual(other.resolution.lingering?.thrallGrowth?.feet, 5);
});
