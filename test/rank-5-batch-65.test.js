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


// Rank 5, batch 65 (2026-10-03): Spellmaster's Ward (the actions' runes on the caster's sustained Effect; a spell's damage spends them, each restoring 2d6 + (rank −
// 5) until that damage is gone; the last rune ends it).

test("Spellmaster's Ward: runes by actions, each preventing its roll of a spell's damage", async () => {
    const plan = compile(await spell("rank-5/spellmasters-ward"));
    assert.equal(plan.resolution.kind, "rune-ward");
    assert.deepEqual(plan.resolution.runeWard, { runesByActions: { 1: 1, 2: 2, 3: 3 }, formula: "2d6 + (@item.rank - 5)", minutes: 1 });
    // Another rune formula, or no extra runes per action, isn't read.
    const other = compile(withText(await spell("rank-5/spellmasters-ward"), html => html.replace("@Damage[2d6 + (@item.rank - 5)[untyped]]", "@Damage[3d6[untyped]]")));
    assert.notEqual(other.resolution.kind, "rune-ward");
});
