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


// Rank 5, batch 16 (2026-10-02): Glimmer of Charm (a turn-end Will save in the caster's aura "with the following effects"; the attitude rows
// are note Effects lasting the spell; "No matter the result, it's then temporarily immune for 24 hours." after the sentence that has the
// creature save).

test("Glimmer of Charm: the aura's turn-end save, the rows and the 24-hour immunity", async () => {
    const plan = compile(await spell("rank-5/glimmer-of-charm"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(plan.resolution.lingering.events, ['turn-end']);
    assert.equal(plan.resolution.lingering.centre, 'caster');
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 24, unit: 'hours'});
    assert.ok(plan.resolution.outcomes.failure.noteEffects.length >= 1);
    assert.equal(plan.resolution.outcomes.success.noteEffects[0].duration.sustained, true);
    // The immunity needs the creature's own save just before it.
    const other = compile(withText(await spell("rank-5/glimmer-of-charm"), html => html.replace('No matter the result', 'The effect lasts. No matter the result')));
    assert.equal(other.resolution.temporaryImmunity ?? null, null);
});
