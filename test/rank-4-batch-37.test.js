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


// Rank 4, batch 37 (2026-10-02): Sacred Nimbus (a sustained 10-foot square whose rain deals 5d6 spirit damage at the end of the caster's turns to
// fiends, undead and creatures weak to spirit inside, with no save — the text states none; moving the cloud is the GM's region).

test("Sacred Nimbus: the caster's-turn rain", async () => {
    const plan = compile(await spell("rank-4/sacred-nimbus"));
    assert.equal(plan.resolution.kind, 'hazard-area');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const data = plan.resolution.hazardArea;
    assert.deepEqual(data.control, {kind: 'caster-turn-end', count: 5, faces: 6, type: 'spirit', traits: ['fiend', 'undead'], weakness: 'spirit', step: {interval: 1, dice: 1}});
    assert.equal(data.sustained, true);
    assert.equal(data.notes.length, 2);
    // A save in the text isn't this form.
    const saved = compile(withText(await spell("rank-4/sacred-nimbus"), html => html.replace('at the end of your turn.', 'at the end of your turn. Each creature attempts a Reflex save.')));
    assert.notEqual(saved.resolution.kind, 'hazard-area');
    // An unknown creature word isn't a trait.
    const other = compile(withText(await spell("rank-4/sacred-nimbus"), html => html.replace('to fiends, undead,', 'to fiends, villains,')));
    assert.notEqual(other.resolution.kind, 'hazard-area');
});
