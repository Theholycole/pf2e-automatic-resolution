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


// Rank 3, batch 33 (2026-10-02): Roaring Applause (Slowed 1 and no reactions; the applause's manipulate trait and the reactions it triggers are
// the GM's note) and Isolation (rank 4: Invisible only to its allies — a note, not PF2e's Invisible).

test('Roaring Applause: Slowed 1 on failing, the manipulate-trait rules a note', async () => {
    const plan = compile(await spell('rank-3/roaring-applause'));
    assert.equal(supported(plan), true);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => `${effect.slug} ${effect.value}`), ['slowed 1']);
    assert.ok(plan.resolution.outcomes.failure.noteEffects.some(note => /manipulate trait/.test(note.text)));
});

test('Isolation: no Invisible applied; the allies-only note for 3 rounds, the failure\'s inaudibility added', async () => {
    const plan = compile(await spell('rank-4/isolation'));
    assert.equal(supported(plan), true);
    assert.deepEqual(['success', 'failure'].map(degree => plan.resolution.outcomes[degree].effects.length), [0, 0]);
    assert.match(plan.resolution.outcomes.failure.noteEffects[0].text, /inaudible to its allies/);
    assert.equal(plan.resolution.outcomes.success.noteEffects[0].duration.value, 3);
    // Invisible to everyone stays PF2e's condition.
    const plain = compile(withText(await spell('rank-4/isolation'), html => html.replace(', but only to its allies', '')));
    assert.ok(plain.resolution.outcomes.success.effects.some(effect => effect.slug === 'invisible'));
});
