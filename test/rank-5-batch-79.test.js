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


// Rank 5, batch 79 (2026-10-03): Black Tentacles (the spell attack against each creature's Fortitude DC: Grabbed and 3d6; at a turn's end inside, the attempt
// or 1d6 to one held).

test("Black Tentacles: the tentacles", async () => {
    const plan = compile(await spell("rank-5/black-tentacles"));
    assert.equal(plan.resolution.kind, "tentacle-area");
    const data = plan.resolution.tentacleArea;
    assert.deepEqual([data.seconds, data.defense, data.capture, data.held], [60, "fortitude", { formula: "3d6", type: "bludgeoning" }, { formula: "1d6", type: "bludgeoning" }]);
    assert.match(data.grabbed, /^Compendium\.pf2e\.conditionitems\.Item\./);
    assert.equal(data.notes.length, 4);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/black-tentacles"), html => html.replace("You can Dismiss the spell.", "You can Dismiss the spell. The area is darkness.")));
    assert.notEqual(other.resolution.kind, "tentacle-area");
});
