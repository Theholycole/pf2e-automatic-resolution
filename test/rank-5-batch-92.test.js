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


// Rank 5, batch 92 (2026-10-03): Shall not Falter, Shall not Rout (the round's recovery of twice the rank, up to half the maximum HP).

test("Shall not Falter, Shall not Rout: the recovery", async () => {
    const plan = compile(await spell("rank-5/shall-not-falter-shall-not-rout"));
    assert.equal(plan.resolution.kind, "strike-heal");
    assert.deepEqual(plan.resolution.strikeHeal, { seconds: 60, multiple: 2, capFraction: 0.5 });
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/shall-not-falter-shall-not-rout"), html => html.replace("above half of your maximum HP.", "above half of your maximum HP, and you gain resistance 5.")));
    assert.notEqual(other.resolution.kind, "strike-heal");
});
