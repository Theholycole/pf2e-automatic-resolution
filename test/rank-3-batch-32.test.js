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

const noteOf = plan => plan.resolution.kind === 'spell-note' && plan.automation.level === 'automatic' ? plan.resolution.note : null;

// Rank 3, batch 32 (2026-10-02): notes whose conditions are mentions, not grants — Time Jump (Stupefied 4 only on a recast within a minute),
// Cloud Dragon's Cloak (Hidden only for resolving attacks: the attacker's flat check), Shadow Jump (rank 5; at 8th, the caster may become
// Invisible on arrival).

test('Time Jump, Cloud Dragon\'s Cloak and Shadow Jump are notes; a granted condition is refused', async () => {
    for (const path of ['rank-3/time-jump', 'rank-3/cloud-dragons-cloak', 'rank-5/shadow-jump']) assert.ok(noteOf(compile(await spell(path))), path);
    assert.equal(noteOf(compile(withText(await spell('rank-3/time-jump'), html => html.replace(/if you use .{1,40}? again within 1 minute of using the spell, you become/, 'you become')))), null);
});
