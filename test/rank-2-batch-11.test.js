import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

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



// Rank 2, batch 11 (2026-09-30): a behaviour row with a flat check the creature rolls when it acts (Binding Muzzle), carried by the
// row's note with its roll link; "As success, but the effect lasts 1 minute, and …" rows.

test('Binding Muzzle: 1-round and 1-minute notes, the failure\'s flat check to cast verbal spells, the critical failure\'s silence', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/binding-muzzle'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const note = degree => plan.resolution.outcomes[degree].noteEffects.find(entry => entry.wholeRow);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => `${note(degree).duration.value} ${note(degree).duration.unit}`), ['1 rounds', '1 minutes', '1 minutes']);
    assert.match(note('failure').text, /^The target can't use jaws Strikes.*They must succeed at a @Check\[flat\|dc:11\] to Cast a Spell with verbal components\.$/);
    assert.equal(note('failure').flatCheckOnAct, true);
    assert.match(note('criticalFailure').text, /The target can't speak\.$/);
    assert.doesNotMatch(note('criticalFailure').text, /For 1 round/);
});

test('A flat check is a note only when rolled on acting', async () => {
    const {wholeRowNote} = await import('../src/compiler/note-effects.js');
    const lifecycle = {durationSpec: {mode: 'fixed', value: 1, unit: 'minutes', raw: '1 minute'}};
    const row = (rawText, signals = []) => ({rawText, damage: {mode: 'none'}, effects: [], semanticCoverage: {clauses: [{text: rawText, status: 'residual', guidedClaims: [], unexplainedSignals: signals}]}});
    assert.ok(wholeRowNote(row('The target must succeed at a @Check[flat|dc:5] when attempting to Cast a Spell or the spell fails.', ['save', 'modifier']), {}, lifecycle));
    // Each morning isn't on acting; a concealment-like check against the target isn't the creature's.
    assert.equal(wholeRowNote(row('The target must succeed at a @Check[flat|dc:5] each morning.', ['save']), {}, lifecycle), null);
    assert.equal(wholeRowNote(row('Creatures must succeed at a @Check[flat|dc:11] to target it.', ['save']), {}, lifecycle), null);
});
