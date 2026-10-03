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


// Rank 4, batch 134 (2026-10-03): Umbral Graft (the Steal of a spell affecting a foe: the caster's Effect for 3 rounds and the card's Steal; the rank rule
// or the counteract check; the caster's own or stored, at most 1 minute, with the shadow trait).

test("Umbral Graft: the Steal", async () => {
    const plan = compile(await spell("rank-4/umbral-graft"));
    assert.equal(plan.resolution.kind, "spell-steal");
    const data = plan.resolution.spellSteal;
    assert.deepEqual([data.seconds, data.maxMinutes, data.trait], [18, 1, "shadow"]);
    assert.ok(data.notes.length >= 2);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-4/umbral-graft"), html => html.replace("The spell gains the shadow trait.", "The spell gains the shadow trait and is doubled.")));
    assert.notEqual(other.resolution.kind, "spell-steal");
});
