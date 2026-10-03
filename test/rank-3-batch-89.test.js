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


// Rank 3, batch 89 (2026-10-03): Ibex's Harvest (the actions spent; temporary Hit Points for the one or two targets, or with 3 actions the chosen creature's
// basic save card — a plan of its own — and temporary Hit Points for every other creature in the emanation; heightened +3 and +1d8).

test("Ibex's Harvest: the actions' targets, temporary Hit Points and the chosen creature's basic save", async () => {
    const plan = compile(await spell("rank-3/ibexs-harvest"));
    assert.equal(plan.resolution.kind, "action-tale");
    const tale = plan.resolution.actionTale;
    assert.deepEqual([tale.baseRank, tale.thpStep, tale.actions[1].thp, tale.actions[1].targets, tale.actions[2].targets, tale.actions[2].within, tale.actions[3].othersThp, tale.actions[3].emanation],
        [3, 3, 10, 1, 2, 20, 5, 10]);
    assert.equal(supported(tale.savePlan), true);
    assert.equal(tale.savePlan.resolution.check.statistic, "will");
    // A heightening PF2e's data doesn't have, or a different 3-action save, isn't read.
    const other = compile(withText(await spell("rank-3/ibexs-harvest"), html => html.replace("increases by 1d8", "increases by 2d8")));
    assert.notEqual(other.resolution.kind, "action-tale");
    const save = compile(withText(await spell("rank-3/ibexs-harvest"), html => html.replace("(basic Will save)", "(basic Reflex save)")));
    assert.notEqual(save.resolution.kind, "action-tale");
});
