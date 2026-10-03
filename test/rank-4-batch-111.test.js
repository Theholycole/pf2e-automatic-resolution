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


// Rank 4, batch 111 (2026-10-03): Crystallized Vapors (the ball of ice the ordinary ranged spell attack of the item's two entries, when cast and on the
// first Sustain each later turn; the 15-foot emanation of difficult terrain around the caster, the caster exempt, made with the first attack).

test("Crystallized Vapors: the attack and the terrain emanation", async () => {
    const plan = compile(await spell("rank-4/crystallized-vapors"));
    assert.equal(plan.resolution.kind, "save");
    assert.equal(plan.resolution.check.statistic, "spell-attack");
    assert.equal(supported(plan), true);
    assert.equal(plan.resolution.repeatable.window, "sustain");
    assert.deepEqual([plan.resolution.terrainAura.radius, plan.resolution.terrainAura.exemptCaster], [15, true]);
    assert.equal(plan.targeting.area ?? null, null);
    // A malformed emanation isn't supported.
    const broken = structuredClone(plan); broken.resolution.terrainAura.sourceText = "other";
    assert.equal(supported(broken), false);
    // Different damage isn't read.
    const other = compile(withText(await spell("rank-4/crystallized-vapors"), html => html.replace("1d12 bludgeoning damage (or", "1d10 bludgeoning damage (or")));
    assert.equal(other.resolution.terrainAura ?? null, null);
});
