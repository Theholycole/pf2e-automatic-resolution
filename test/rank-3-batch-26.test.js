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

// Rank 3, batch 26 (2026-10-02): the effect stated before the table, its length by the save — Distracting Chatter, Excise Lexicon.

test('Distracting Chatter: Off-Guard and the note for each failing row\'s length', async () => {
    const plan = compile(await spell('rank-3/distracting-chatter'));
    assert.equal(supported(plan), true);
    const lengths = ['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree]);
    assert.deepEqual(lengths.map(outcome => [outcome.effects[0].slug, outcome.effects[0].duration.value, outcome.effects[0].duration.unit]),
        [['off-guard', 1, 'rounds'], ['off-guard', 3, 'rounds'], ['off-guard', 1, 'minutes']]);
    assert.ok(lengths.every(outcome => outcome.noteEffects[0].text.includes('DC 5 flat check')));
    assert.equal((plan.resolution.outcomes.criticalSuccess.effects ?? []).length, 0);
    // Damage in the stated effect is refused.
    assert.equal(supported(compile(withText(await spell('rank-3/distracting-chatter'), html => html.replace('Similarly, a creature', 'The target takes 2d6 mental damage. Similarly, a creature')))), false);
});

test('Excise Lexicon: a note for 1 minute, 1 day or unlimited, with the Heightened entry', async () => {
    const plan = compile(await spell('rank-3/excise-lexicon'));
    assert.equal(supported(plan), true);
    const notes = ['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].noteEffects[0]);
    assert.deepEqual(notes.map(note => note.duration.mode === 'unlimited' ? 'unlimited' : `${note.duration.value} ${note.duration.unit}`), ['1 minutes', '1 days', 'unlimited']);
    assert.ok(notes[0].text.includes('one additional word'));
    // A row whose length isn't stated alone is refused.
    assert.equal(supported(compile(withText(await spell('rank-3/excise-lexicon'), html => html.replace("The spell's duration is 1 day.", "The spell's duration is 1 day and the target is dazzled.")))), false);
});
