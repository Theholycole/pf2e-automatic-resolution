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



// Rank 2, batch 15 (2026-09-30): heightened versions of rank 2 spells — Invisibility (4th: 1 minute), Horrifying Blood Loss (4th: secondary
// targets), Spy's Mark (9th: until the next daily preparations), and the heightened duration wordings they need.

test('Invisibility: Invisible for 10 minutes, 1 minute from 4th rank, with its note', async () => {
    const {spellNoteDurationAt, spellNoteText} = await import('../src/compiler/spell-note.js');
    const plan = compile(await spell('rank-2/invisibility'));
    assert.equal(plan.resolution.kind, 'condition-note');
    const note = plan.resolution.conditionNote;
    assert.equal(note.condition.slug, 'invisible');
    assert.deepEqual([2, 3, 4, 9].map(rank => `${spellNoteDurationAt(note, rank).value} ${spellNoteDurationAt(note, rank).unit}`), ['10 minutes', '10 minutes', '1 minutes', '1 minutes']);
    assert.match(spellNoteText(note, 4, 2), /Heightened \(4\): The spell lasts 1 minute, but it doesn't end if the target uses a hostile action\./);
    assert.doesNotMatch(spellNoteText(note, 3, 2), /Heightened/);
});

test('Heightened durations: "The spell lasts N …" and "The <thing> remains until … daily preparations"', async () => {
    const {parseHeightenedDurations} = await import('../src/compiler/heightened-duration-compiler.js');
    const html = text => `<p>x</p><hr /><p><strong>Heightened (4th)</strong> ${text}</p>`;
    assert.deepEqual(parseHeightenedDurations(html('The spell lasts 1 minute, but it doesn\'t end.')).entries.map(entry => [entry.minRank, entry.value, entry.unit]), [[4, 1, 'minutes']]);
    assert.equal(parseHeightenedDurations(html('The symbol remains until the next time you make your daily preparations.')).entries[0].mode, 'daily-preparations');
    // "The duration lasts until …" stays one entry (the existing wording), not two.
    assert.equal(parseHeightenedDurations(html('The duration lasts until the next time you make your daily preparations.')).entries.length, 1);
    const mark = compile(await spell('rank-2/spys-mark'));
    assert.deepEqual(mark.resolution.note.heightenedDurations.map(entry => [entry.minRank, entry.unit]), [[4, 'hours'], [9, 'days']]);
});

test('Horrifying Blood Loss: secondary targets from 4th rank instead of a rank gate, checked by the core', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/horrifying-blood-loss'));
    assert.equal(plan.resolution.rankGate, undefined);
    assert.deepEqual([plan.resolution.secondaryTargets.fromRank, plan.resolution.secondaryTargets.max, plan.resolution.secondaryTargets.waived], [4, 4, {kind: 'persistent-damage', damageType: 'bleed'}]);
    assert.equal(inspectSavePlan(plan).supported, true);
    const broken = structuredClone(plan); broken.resolution.secondaryTargets.max = 9;
    assert.ok(inspectSavePlan(broken).blockers.some(blocker => blocker.code === 'secondary-targets'));
    // A changed heightened entry is a rank gate again.
    const other = compile(withText(await spell('rank-2/horrifying-blood-loss'), html => html.replace('must be able to see the primary target', 'must be adjacent to you')));
    assert.equal(other.resolution.secondaryTargets, undefined);
    assert.equal(other.resolution.rankGate.minRank, 4);
});
