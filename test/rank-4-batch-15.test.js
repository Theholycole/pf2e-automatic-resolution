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

// Rank 4, batch 15 (2026-10-02): notes — Mystic Beacon (another spell heightened one rank, the GM's), Magnetize (the redirection and the
// attackers' penalty "whenever" — situational), Elemental Sense (the chosen sense; seeing Invisible creatures as Concealed is what the caster
// perceives).

test('Mystic Beacon and Magnetize are notes (Elemental Sense: its senses a stated Effect since notes batch 1)', async () => {
    for (const path of ['rank-4/mystic-beacon', 'rank-4/magnetize']) assert.ok(noteOf(compile(await spell(path))), path);
    assert.equal(compile(await spell('rank-4/elemental-sense')).resolution.kind, 'stated-effect');
    // Magnetize's penalty without its "Whenever" situation is refused.
    assert.equal(noteOf(compile(withText(await spell('rank-4/magnetize'), html => html.replace('Whenever a creature within 15 feet Strikes a creature other than the magnetized target with a metal melee weapon, the attacker', 'The attacker')))), null);
});
