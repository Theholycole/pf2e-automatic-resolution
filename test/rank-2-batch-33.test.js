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



// Rank 2, batch 33 (2026-10-01): a note on the target animal (Impart Empathy), a sustained area that knocks creatures Prone (Carrion Mire), and
// a cage that Immobilizes until Escape (Osseous Cage); a data save the text never mentions makes a note (Fate's Travels, Painted Scout).

test('Impart Empathy: a note on the target animal, with its 4th-rank line', async () => {
    const plan = compile(await spell('rank-2/impart-empathy'));
    assert.equal(plan.resolution.kind, 'spell-note');
    assert.equal(plan.automation.level, 'automatic');
    assert.match(JSON.stringify(plan.resolution), /plants and fungi/);
});

test('A data save the text never mentions, with no results, is a note', async () => {
    for (const path of ['rank-3/fates-travels', 'rank-3/painted-scout']) {
        const plan = compile(await spell(path));
        assert.equal(plan.resolution.kind, 'spell-note', path);
    }
    // Text that mentions the save is not read as a note.
    const changed = compile(withText(await spell('rank-3/fates-travels'), html => html.replace('You get a vision', 'The creature attempts a Will save. You get a vision')));
    assert.notEqual(changed.resolution.kind, 'spell-note');
});

test('Carrion Mire: a sustained area, saving at the cast and at turn start, Prone on a failure, with the counteract note', async () => {
    const plan = compile(await spell('rank-2/carrion-mire'));
    const lingering = plan.resolution.lingering;
    assert.deepEqual(lingering.events, ['turn-start']);
    assert.equal(lingering.initial, true);
    assert.equal(lingering.sustained, true);
    assert.match(lingering.notes.join(' '), /would be healed by a vitality effect/);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => effect.slug), ['prone']);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['prone']);
    assert.deepEqual(plan.resolution.outcomes.success.effects, []);
});

test('Osseous Cage: Immobilized until Escape on a failure, with the cage as the GM reminder; changed wording is not read', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-2/osseous-cage');
    const plan = compile(source);
    assert.equal(inspectSavePlan(plan).supported, true);
    const [effect] = plan.resolution.outcomes.failure.effects;
    assert.equal(effect.slug, 'immobilized');
    assert.deepEqual(effect.endsWhen, [{event: 'escape', dc: 'spell'}]);
    assert.deepEqual(plan.resolution.outcomes.success.effects, []);
    const [reminder] = plan.resolution.reminders;
    assert.equal(reminder.kind, 'structure');
    assert.match(reminder.text, /AC 10, Hardness 5, and 10 Hit Points/);
    assert.match(reminder.text, /lesser cover/);
    assert.match(reminder.text, /Hit Points increase by 20/);
    // A forged reminder is refused.
    const forged = structuredClone(plan); forged.resolution.reminders[0].sourceText += ' It also deals 4d6 damage.';
    assert.equal(inspectSavePlan(forged).supported, false);
    // A cage with another exit or other statistics is not read.
    for (const replace of [html => html.replace('or destroys the cage', 'or Sustains the spell'), html => html.replace('lesser cover', 'standard cover from all attacks and deals damage')]) {
        assert.notEqual(inspectSavePlan(compile(withText(source, replace))).supported && compile(withText(source, replace)).resolution.reminders?.[0]?.kind === 'structure', true);
    }
});
