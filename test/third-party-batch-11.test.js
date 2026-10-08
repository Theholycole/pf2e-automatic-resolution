import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {prepareNoteEffectSource, validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 11 (2026-10-06): Eternal Slumber (the text's save where the item has none; Unconscious for the spell, or for good), Summon Jury (an incarnate's
// two phases, each row's penalty at the cast rank), Sudden Outbreak (the disease saves the GM's, from notes).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
// (The modules' Effects, as the census tool's catalog has them.)
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});

test("Eternal Slumber: the text's Will save; drowsy (Seek penalty, concentrate flat check); Unconscious for the spell, or permanently", () => {
    const plan = compile('Eternal Slumber');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.check, {...plan.resolution.check, statistic: 'will', basic: false});
    const drowsy = plan.resolution.outcomes.success.noteEffects[0];
    assert.ok(validNoteEffect(drowsy));
    assert.deepEqual(drowsy.castFlatCheck, {dc: 5, trait: 'concentrate'});
    assert.equal(plan.resolution.outcomes.failure.effects[0].duration.mode, 'sustained');
    assert.equal(plan.resolution.outcomes.criticalFailure.effects[0].duration.mode, 'unlimited');
    assert.match(plan.resolution.dataNotes.join(' '), /no save/);
});

test('Summon Jury: Arrive and Depart, each a Will save; the penalties at the cast rank', () => {
    const plan = compile('Summon Jury');
    assert.equal(plan.resolution.kind, 'incarnate');
    const [arrive, depart] = plan.resolution.incarnate.phases;
    assert.deepEqual([arrive.title, depart.title], ['Call to Order', 'Verdict']);
    const next = arrive.plan.resolution.outcomes.success.noteEffects[0];
    assert.equal(next.rules[0].removeAfterRoll, true);
    const runtime = {castId: 'c', sourceActorUuid: 'Actor.a', targetActorUuid: 'Actor.b', sourceItemName: 'Summon Jury', castRank: 9};
    globalThis.fromUuidSync ??= () => null;
    assert.equal(prepareNoteEffectSource(next, runtime).system.rules[0].value, -3);
    assert.equal(prepareNoteEffectSource(next, {...runtime, castRank: 4}).system.rules[0].value, -1);
    assert.deepEqual(arrive.plan.resolution.outcomes.criticalFailure.noteEffects[0].rules.map(rule => rule.key), ['FlatModifier', 'RollOption', 'FlatModifier']);
    assert.equal(depart.plan.resolution.outcomes.criticalFailure.noteEffects[0].duration.value, 10);
});

test('Sudden Outbreak: the diseased target the GM confirms; the disease saves in GM-played notes', () => {
    const plan = compile('Sudden Outbreak');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.targeting.actorConstraints.predicates[0].kind, 'gm-confirmed');
    assert.ok(['success', 'failure', 'criticalFailure'].every(degree => validNoteEffect(plan.resolution.outcomes[degree].noteEffects[0])));
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects[0].text, /doesn't end the spell/);
});
