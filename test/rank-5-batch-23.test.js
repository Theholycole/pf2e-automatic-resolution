import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableSavePlan} from '../scripts/basic-save-core.js';

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


// Rank 5, batch 23 (2026-10-02): Chthonian Wrath (the basic Reflex save of the item's two untyped 4d6 entries, typed by the realm the caster rolls on
// the 1d4 table and picks on the card: each realm's pair of damage types).

test("Chthonian Wrath: the realm choice types both entries", async () => {
    const plan = compile(await spell("rank-5/chthonian-wrath"));
    assert.equal(plan.resolution.kind, 'save');
    assert.equal(isExecutableSavePlan(plan), true);
    assert.equal(plan.resolution.casterChoice.kind, 'damage-pair');
    assert.deepEqual(plan.resolution.casterChoice.pairs, {skies: ['bludgeoning', 'electricity'], depths: ['acid', 'slashing'], frozen: ['bludgeoning', 'cold'], volcanic: ['fire', 'piercing']});
    // A row whose types aren't damage types isn't read.
    const other = compile(withText(await spell("rank-5/chthonian-wrath"), html => html.replace('Fire and piercing', 'Fire and lava')));
    assert.equal(other.resolution.casterChoice?.kind === 'damage-pair', false);
});
