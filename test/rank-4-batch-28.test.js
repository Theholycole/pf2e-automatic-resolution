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


// Rank 4, batch 28 (2026-10-02): Rust Cloud (a concealing cloud whose start-of-turn damage makes metal creatures rust and the cloud grow).

test('Rust Cloud: concealment, the turn damage, the metal rider', async () => {
    const plan = compile(await spell('rank-4/rust-cloud'));
    assert.equal(plan.automation.level, 'automatic');
    const lingering = plan.resolution.lingering;
    assert.equal(lingering.concealment, true);
    assert.deepEqual(lingering.events, ['turn-start']);
    assert.deepEqual([lingering.traitRust.trait, lingering.traitRust.feet, lingering.traitRust.maxRadius, lingering.traitRust.formula, lingering.traitRust.type],
        ['metal', 5, 40, '(floor(@item.level/2)-1)d4', 'slashing']);
    // A rider of another shape isn't read.
    const other = compile(withText(await spell('rank-4/rust-cloud'), html => html.replace('the cloud\'s area increases by 5 feet', 'the cloud\'s area moves 5 feet')));
    assert.notEqual(other.automation.level, 'automatic');
});
