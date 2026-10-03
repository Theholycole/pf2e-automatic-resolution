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


// Rank 4, batch 52 (2026-10-02): Call the Blood (8d4 void, basic Fortitude; if the target takes damage, a living caster without void healing
// is Sickened 2, an undead or void-healing caster picks half that damage as temporary Hit Points with Quickened for 1 round, or Quickened
// for 1 minute).

test("Call the Blood: the caster's part", async () => {
    const { isCasterDraw, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/call-the-blood"));
    const draw = plan.resolution.casterDraw;
    assert.deepEqual([draw.living.slug, draw.living.value, draw.undead.condition.slug, draw.undead.fraction, draw.undead.withTemp, draw.undead.without],
        ["sickened", 2, "quickened", 0.5, { value: 1, unit: "rounds" }, { value: 1, unit: "minutes" }]);
    assert.equal(isCasterDraw(plan), true);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another condition for the living isn't read.
    const other = compile(withText(await spell("rank-4/call-the-blood"), html => html.replace("you're @UUID", "you're also @UUID")));
    assert.equal(other.resolution.casterDraw, undefined);
    const broken = structuredClone(plan); broken.resolution.casterDraw.undead.fraction = 1;
    assert.equal(isCasterDraw(broken), false);
});
