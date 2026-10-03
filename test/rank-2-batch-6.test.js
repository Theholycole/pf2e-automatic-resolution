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



// Rank 2, batch 6 (2026-09-30): falls a row states. Dimensional Drop's fall through the void is falling damage (half the distance,
// bludgeoning); Unrelenting Gravity's "if this spell causes the target to fall" riders are GM notes beside the row's Prone.

test('Dimensional Drop: the fall is half its distance in bludgeoning damage, and the rows are executable', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/dimensional-drop'));
    assert.equal(inspectSavePlan(plan).supported, true);
    for (const [degree, formula] of [['failure', '10[bludgeoning]'], ['criticalFailure', '20[bludgeoning]']]) {
        const outcome = plan.resolution.outcomes[degree];
        assert.deepEqual(outcome.damage.formulas.map(entry => [entry.formula, entry.source]), [[formula, 'description-falling']]);
        assert.ok(outcome.semanticCoverage.clauses.every(clause => clause.status === 'compiled'));
    }
    // A fall beside the row's own damage isn't read.
    const other = compile(withText(await spell('rank-2/dimensional-drop'), html => html.replace(/falls 20 feet through the void before reappearing\./, 'falls 20 feet through the void before reappearing. It takes 1d6 fire damage.')));
    assert.notEqual(other.resolution.outcomes.failure.damage?.formulas?.[0]?.source, 'description-falling');
});

test('Unrelenting Gravity: Prone and Encumbered, and the fall riders are GM row notes beside Prone', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/unrelenting-gravity'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual(success.effects.map(effect => effect.slug), ['encumbered']);
    // The unlinked "falls prone and is encumbered" is both conditions.
    for (const outcome of [failure, criticalFailure]) assert.deepEqual(outcome.effects.map(effect => effect.slug).sort(), ['encumbered', 'prone']);
    assert.deepEqual(failure.rowNotes.map(note => [note.kind, note.text]), [['fall-rider', 'If this spell makes it fall, the DC to Arrest a Fall is your spell DC.']]);
    assert.deepEqual(criticalFailure.rowNotes.map(note => [note.kind, note.text]), [['fall-rider', "If this spell makes it fall, it can't Arrest a Fall, and its falling damage is doubled."]]);
    assert.ok(!plan.automation.pendingCapabilities.includes('manual:conditional-effect'));
    // Without the row's Prone the rider isn't a note: the core refuses it.
    const stripped = structuredClone(plan);
    stripped.resolution.outcomes.failure.effects = stripped.resolution.outcomes.failure.effects.filter(effect => effect.slug !== 'prone');
    assert.ok(inspectSavePlan(stripped).blockers.some(blocker => blocker.code === 'row-note'));
});
