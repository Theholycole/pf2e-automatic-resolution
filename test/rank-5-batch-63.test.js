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


// Rank 5, batch 63 (2026-10-03): Celestial Brand (PF2e's Effect on the caster and its allies on the scene, its TokenMark on the unholy target; the target's
// immunity for the brand's time and a minute after).

test("Celestial Brand: PF2e's marking Effect for the caster's side, a trait-bound target, immunity", async () => {
    const plan = compile(await spell("rank-5/celestial-brand"));
    assert.equal(plan.resolution.kind, "brand-mark");
    assert.equal(plan.automation.level, "automatic");
    const brand = plan.resolution.brandMark;
    assert.deepEqual([brand.effect.uuid, brand.markSlug, brand.targetTrait, brand.recipients, brand.immunity.value, brand.immunity.unit],
        ["Compendium.pf2e.spell-effects.Item.A61eVVVyUuaUl3tz", "celestial-brand", "unholy", "caster-and-allies", 1, "minutes"]);
    // A bonus PF2e's Effect doesn't give, or another holy damage, isn't read.
    const other = compile(withText(await spell("rank-5/celestial-brand"), html => html.replace("+1 status bonus", "+2 status bonus")));
    assert.notEqual(other.resolution.kind, "brand-mark");
    const dice = compile(withText(await spell("rank-5/celestial-brand"), html => html.replace("additional 1d4 spirit", "additional 1d6 spirit")));
    assert.notEqual(dice.resolution.kind, "brand-mark");
});
