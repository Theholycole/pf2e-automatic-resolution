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



const proved = source => { const plan = compile(source); return plan.resolution.kind === 'effect-note' && plan.automation.level === 'automatic' ? plan.resolution.effectNote.proof : null; };

// Rank 5, batch 4 (2026-10-02): Domora's Defense, Spiral of Horrors, Unfolding Wind Buffet, Foul Miasma, Flames of Ego.

test("Domora's Defense: a run of story sentences is narration; the AC bonus and fire resistance are PF2e's; the replica is notes", async () => {
    const source = await spell("rank-5/domoras-defense");
    const proof = proved(source);
    assert.ok(proof);
    assert.ok(proof.notes.some(note => /Shield Block/.test(note)));
    // A rule sentence in the story run is not narration.
    assert.equal(proved(withText(source, html => html.replace('This spell gives that intention physical form', 'This spell gives a +1 status bonus to AC'))), null);
    assert.equal(proved(withText(source, html => html.replace('fire resistance 5', 'fire resistance 10'))), null);
});

test('Spiral of Horrors: the frightened floor is PF2e\'s enemy aura', async () => {
    const source = await spell('rank-4/spiral-of-horrors');
    assert.ok(proved(source));
    assert.equal(proved(withText(source, html => html.replace('below 1 for', 'below 2 for'))), null);
});

test('Unfolding Wind Buffet: no save without a hit; each row pushes by the hits, times the row', async () => {
    const plan = compile(await spell('rank-5/unfolding-wind-buffet'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.match(plan.resolution.castGate.question, /^Make three unarmed Strikes against the target\. Did at least one hit\?/);
    const move = degree => plan.resolution.outcomes[degree].forcedMovement?.perHit;
    assert.deepEqual([move('criticalSuccess'), move('success'), move('failure'), move('criticalFailure')],
        [undefined, {normal: 5, critical: 10, multiplier: 0.5}, {normal: 5, critical: 10, multiplier: 1}, {normal: 5, critical: 10, multiplier: 2}]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['prone']);
    const broken = compile(withText(await spell('rank-5/unfolding-wind-buffet'), html => html.replace('half the normal distance', 'half the normal distance and is Dazzled')));
    assert.equal(inspectSavePlan(broken).supported, false);
});

test('Foul Miasma: the critical success is Pseudo Afflictions\' save benefit (a GM note)', async () => {
    const plan = compile(await spell('rank-4/foul-miasma'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.outcomes.criticalSuccess.rowNotes.map(note => note.kind), ['affliction-benefit']);
    const forged = structuredClone(plan); forged.resolution.outcomes.criticalSuccess.rowNotes[0].sourceText = 'The target is cured.';
    assert.equal(inspectSavePlan(forged).supported, false);
});

test('Flames of Ego: Fascinated for the row\'s time, with a light-carrying behaviour note', async () => {
    const plan = compile(await spell('rank-5/flames-of-ego'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const rows = ['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree]);
    assert.deepEqual(rows.map(row => `${row.effects[0].duration.value} ${row.effects[0].duration.unit}`), ['1 rounds', '1 minutes', '1 minutes']);
    assert.deepEqual(rows.map(row => row.noteEffects[0].rules), Array(3).fill([{key: 'TokenLight', value: {bright: 20, dim: 60}}]));
    assert.match(rows[2].noteEffects[0].text, /at least 2 actions/);
    assert.match(rows[1].noteEffects[0].text, /can't act hostile/);
    assert.doesNotMatch(rows[0].noteEffects[0].text, /can't act hostile/);
});
