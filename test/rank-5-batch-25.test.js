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


// Rank 5, batch 25 (2026-10-02): Shadow Blast (the text's 6d8 of the type the caster picks among ten, +1d8 a rank; a basic save each target makes
// with its better of Reflex and Will — the target's choice; the area the caster's placement of one of three shapes, a note).

test("Shadow Blast: the caster's type, the target's save", async () => {
    const plan = compile(await spell("rank-5/shadow-blast"));
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.deepEqual(plan.resolution.check.saveChoice.statistics, ["reflex", "will"]);
    assert.equal(plan.resolution.casterChoice.values.length, 10);
    assert.match(plan.resolution.sharedDamage.formula, /d8\[untyped\]$/);
    assert.ok(plan.resolution.dataNotes.some(note => /a 30-foot cone, a 15-foot burst within 120 feet, a 50-foot line/.test(note)));
    // A save choice that isn't the stated pair is blocked.
    const broken = structuredClone(plan); broken.resolution.check.saveChoice.statistics = ["reflex", "fortitude"];
    assert.notDeepEqual(inspectSavePlan(broken).blockers, []);
    // Dice that don't match the inline rolls aren't read.
    const other = compile(withText(await spell("rank-5/shadow-blast"), html => html.replace("deals 6d8 damage", "deals 5d8 damage")));
    assert.notEqual(other.resolution.check?.saveChoice?.chooser, "target");
});
