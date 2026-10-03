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


// Rank 3, batch 47 (2026-10-02): Overload Connection (the line between the caster and their familiar: 3d8 mental with a basic Reflex save on the
// creatures the caster targets in it, repeated from the card once a round on a Sustain — the sustain-bolt family).

test("Overload Connection: the line's basic save, repeated on Sustain", async () => {
    const plan = compile(await spell("rank-3/overload-connection"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.equal(plan.resolution.repeatable.window, 'sustain');
    assert.equal(plan.resolution.repeatable.attacks, 11);
    assert.equal(plan.resolution.reminders.length, 2);
    assert.equal(plan.targeting.target ?? '', '');
    // A target other than the caster's familiar isn't this form.
    const other = compile(withText(await spell("rank-3/overload-connection"), html => html.replace('between you and your familiar', 'between you and your ally')));
    assert.notEqual(other.resolution.repeatable?.window, 'sustain');
});
