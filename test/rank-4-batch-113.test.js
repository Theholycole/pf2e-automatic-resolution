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


// Rank 4, batch 113 (2026-10-03): Pernicious Poltergeist (each listed effect a save of its own text — the inline formula at the cast rank; the card's
// button per effect, once a round, while the caster's sustained Effect lasts).

test("Pernicious Poltergeist: the listed effects", async () => {
    const plan = compile(await spell("rank-4/pernicious-poltergeist"));
    assert.equal(plan.resolution.kind, "sustain-options");
    const choices = plan.resolution.sustainOptions.choices;
    assert.deepEqual(choices.map(choice => [choice.key, choice.target]), [["deathly-assault", "one"], ["frighten", "all"], ["telekinetic-storm", "all"]]);
    for (const choice of choices) assert.equal(supported(choice.plan), true, choice.key);
    assert.equal(choices[0].plan.resolution.sharedDamage.formula, "(4 + floor((@item.rank - 4)/2))d10[void]");
    assert.equal(choices[1].plan.resolution.check.basic, false);
    assert.equal(plan.resolution.sustainOptions.seconds, 60);
    // A Heightened entry that isn't the formulas' own step isn't read.
    const other = compile(withText(await spell("rank-4/pernicious-poltergeist"), html => html.replace("increases by 1d10", "increases by 2d10")));
    assert.notEqual(other.resolution.kind, "sustain-options");
});
