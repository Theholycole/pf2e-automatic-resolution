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
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };



// Rank 2, batch 10 (2026-09-30): a row that is only behaviour becomes one note Effect for the row's duration (Paranoia, Vicious
// Jealousy), when clause notes leave it partly unclaimed.

test('Paranoia: each row is one note, 1 round / 1 minute / 1 minute, and the critical failure adds its own text', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/paranoia'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const note = degree => plan.resolution.outcomes[degree].noteEffects.filter(entry => entry.wholeRow);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => note(degree).map(entry => `${entry.duration.value} ${entry.duration.unit}`)), [['1 rounds'], ['1 minutes'], ['1 minutes']]);
    assert.match(note('failure')[0].text, /^The target believes everyone it sees is a potential threat\..*It treats no one as an ally\.$/);
    assert.match(note('criticalFailure')[0].text, /It treats no one as an ally\. The target believes that everyone it sees is a mortal enemy\./);
    assert.equal(plan.resolution.outcomes.criticalSuccess.noteEffects, undefined);
});

test('Vicious Jealousy: a sustained spell\'s rows, one note each (the critical failure doesn\'t also inherit the failure\'s)', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/vicious-jealousy'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([success, failure, criticalFailure].map(outcome => outcome.noteEffects.length), [1, 1, 1]);
    assert.deepEqual([success.noteEffects[0].duration.value, success.noteEffects[0].duration.unit], [1, 'rounds']);
    assert.equal(failure.noteEffects[0].duration.sustained, true);
    assert.match(criticalFailure.noteEffects[0].text, /must spend its first action on its turn to berate the creature/);
});

test('A whole-row note refuses rows with a roll rule, a number to apply, or their own timing', async () => {
    const {wholeRowNote} = await import('../src/compiler/note-effects.js');
    const lifecycle = {durationSpec: {mode: 'fixed', value: 1, unit: 'minutes', raw: '1 minute'}};
    const row = rawText => ({rawText, damage: {mode: 'none'}, effects: [], semanticCoverage: {clauses: [{text: rawText, status: 'residual', guidedClaims: [], unexplainedSignals: []}]}});
    assert.ok(wholeRowNote(row('The target believes everyone is a threat.'), {}, lifecycle));
    assert.equal(wholeRowNote(row('Within the next hour, the creature must roll its next two attack rolls twice and take the lower result.'), {}, lifecycle), null);
    assert.equal(wholeRowNote(row('The target takes a -1 status penalty to AC.'), {}, lifecycle), null);
    assert.equal(wholeRowNote({...row('The target is terrified.'), effects: [{kind: 'condition', slug: 'frightened'}]}, {}, lifecycle), null);
    // An unexplained mechanical signal stays a gap.
    const moved = row('The target wanders off.'); moved.semanticCoverage.clauses[0].unexplainedSignals = ['movement'];
    assert.equal(wholeRowNote(moved, {}, lifecycle), null);
});
