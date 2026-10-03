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


// Rank 5, batch 70 (2026-10-03): Flame Dancer (PF2e's Effect, its dice proved at both ranks; the card's Demoralize with Performance; Fleeing on a critical
// success at 7th).

test("Flame Dancer: the dance", async () => {
    const plan = compile(await spell("rank-5/flame-dancer"));
    assert.equal(plan.resolution.kind, "skill-demoralize");
    const data = plan.resolution.skillDemoralize;
    assert.deepEqual([data.seconds, data.skill, data.range, data.effect.name], [60, "performance", 30, "Spell Effect: Flame Dancer"]);
    assert.deepEqual([data.fleeing.rank, data.fleeing.rounds], [7, 1]);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/flame-dancer"), html => html.replace("deal an additional 2d6 fire damage.", "deal an additional 2d6 fire damage and gain reach.")));
    assert.notEqual(other.resolution.kind, "skill-demoralize");
});
