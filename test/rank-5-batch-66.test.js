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


// Rank 5, batch 66 (2026-10-03): Belittling Boast (the caster's choice; one Intimidation check to Demoralize the enemies within 30 feet; the frightened
// enemies' penalty and the caster's bonus for 1 minute; 2 at 8th).

test("Belittling Boast: the boast", async () => {
    const plan = compile(await spell("rank-5/belittling-boast"));
    assert.equal(plan.resolution.kind, "boast");
    const data = plan.resolution.boast;
    assert.deepEqual([data.radius, data.seconds, data.penalty, data.bonus, data.step], [30, 60, { value: 1, type: "circumstance" }, { value: 1, type: "status" }, { rank: 8, value: 2 }]);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/belittling-boast"), html => html.replace("for 1 minute. If at least", "for 1 minute and is slowed. If at least")));
    assert.notEqual(other.resolution.kind, "boast");
});
