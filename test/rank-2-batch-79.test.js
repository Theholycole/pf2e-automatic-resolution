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



// Rank 2, batch 79 (2026-10-01): Sweetest Solstice (the ritual-outcome family).

test('Sweetest Solstice: each degree from the confirmed outcome', async () => {
    const plan = compile(await spell('rank-2/sweetest-solstice'));
    const ritual = plan.resolution.ritualOutcome;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, ritual.secondary.casters], ['ritual-outcome', 'automatic', 3]);
    const {criticalSuccess: cs, success: s, failure: f, criticalFailure: cf} = ritual.outcomes;
    assert.deepEqual([cs.casterEffects[0].ruleOverrides[0].patch.selection, cs.casterEffects[0].duration, cs.casterEffects[0].endsAt], ['critical-success', null, 'winter']);
    assert.deepEqual([s.casterEffects[0].ruleOverrides[0].patch.selection, s.casterEffects[0].duration.value, s.casterEffects[0].duration.unit], ['success', 30, 'days']);
    assert.deepEqual([f.base, f.casterEffects.length, f.casterLocks.length], [false, 0, 0]);
    assert.deepEqual([cf.casterLocks[0].slug, cf.casterLocks[0].value, cf.casterLocks[0].seconds], ['sickened', 4, 43200]);
    assert.ok(cf.notes.some(note => /food poisoning/.test(note)) && ritual.notes.some(note => /reduced by 2/.test(note)));
});

test('Sweetest Solstice: changed rules are not read', async () => {
    const source = await spell('rank-2/sweetest-solstice');
    for (const [from, to] of [['+1 status bonus to saves against fear effects', '+2 status bonus to saves against fear effects'], ['against emotion and fear effects', 'against emotion and mental effects'],
        ['for 12 hours', 'for 12 hours, and take 2d6 damage'], ['reduced by 2', 'reduced by 2 and each caster gains 5 temporary Hit Points']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'ritual-outcome', from);
    }
    // A changed lock duration is read.
    const plan = compile(withText(source, html => html.replace("for 12 hours", "for 24 hours")));
    assert.equal(plan.resolution.ritualOutcome.outcomes.criticalFailure.casterLocks[0].seconds, 86400);
});
