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
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const supported = plan => inspectSavePlan(plan).supported;

test('Overselling Flourish: row narration, "It then remains dazzled and off-guard …", the remaining-actions note', async () => {
    const plan = compileAbility(await spell('rank-1/overselling-flourish'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const critical = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual(critical.effects.map(effect => effect.slug).sort(), ['dazzled', 'off-guard']);
    assert.deepEqual(critical.rowNotes.map(note => note.kind), ['remaining-actions']);
    // Narration naming a condition, or with a rule word, is not narration (Impending Doom's "is immediately off-guard").
    // (The timeline reads the spell itself since rank-3 batch 83; a wording it doesn't read keeps the rows as written.)
    const doomSource = structuredClone(await spell('rank-3/impending-doom'));
    doomSource.system.description.value = doomSource.system.description.value.replace('it takes half damage', 'it takes some damage');
    const doom = compileAbility(doomSource);
    assert.ok(doom.resolution.outcomes.failure.semanticCoverage.clauses.some(clause => /immediately off-guard/.test(clause.text) && clause.status !== 'compiled'));
});

test('Deathly Scream: a "While" sentence with no rule is narration', async () => {
    assert.equal(supported(compileAbility(await spell('rank-1/deathly-scream'))), true);
});

test('Curse of Recoil: PF2e row Effects for the ranged attack, off-guard carried from the success row, a data note', async () => {
    const plan = compileAbility(await spell('rank-1/curse-of-recoil'), {nativeEffectCatalog: await catalog()});
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => effect.slug), ['off-guard']);
    assert.equal(plan.resolution.outcomes.criticalFailure.nativeEffects[0].outcomeRule.claims.length, 2);
    // (User decision: the text.) The critical penalty locks to the first ranged attack's item.
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.nativeEffects[0].outcomeRule.lockToFirstItem, {ruleIndex: 0});
    // A different penalty than the Effect's is refused.
    const off = await spell('rank-1/curse-of-recoil');
    off.system.description.value = off.system.description.value.replace('imposes a –1 status penalty', 'imposes a –3 status penalty');
    assert.equal(supported(compileAbility(off, {nativeEffectCatalog: await catalog()})), false);
});

test('Haunting Hymn: "that only creatures in the area can hear" is narration; the critical-failure Deafened rider', async () => {
    const plan = compileAbility(await spell('cantrip/haunting-hymn'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit]), [['deafened', 1, 'minutes']]);
});
