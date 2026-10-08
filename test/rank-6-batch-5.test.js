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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 6, batch 5 (2026-10-03): Spellsurge, Planar Palace, Ethereal Jaunt, Proliferating Eyes, Mislead.

test("Notes whose conditions are only mentions", async () => {
    // (Spellsurge: a stated Effect since notes batch 2, its Interference an aura.)
    assert.equal(compile(await spell("rank-6/spellsurge")).resolution.kind, "stated-effect");
    for (const path of ["rank-7/planar-palace", "rank-7/ethereal-jaunt", "rank-9/proliferating-eyes"]) {
        const plan = compile(await spell(path));
        assert.equal(plan.resolution.kind, "spell-note", path);
        assert.deepEqual(plan.automation.pendingCapabilities, [], path);
    }
});

test("Mislead: the caster Invisible for the sustained duration", async () => {
    const plan = compile(await spell("rank-6/mislead"));
    assert.deepEqual([plan.resolution.kind, plan.resolution.conditionNote.recipient, plan.resolution.conditionNote.condition.slug], ["condition-note", "source", "invisible"]);
});
