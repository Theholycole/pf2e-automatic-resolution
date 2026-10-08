import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility, normalizeLegacyLinks} from '../src/compiler/compile-ability.js';
import {compileBasicFeatureRiders} from '../src/compiler/basic-feature-riders.js';
import {sustainedSaveDamageAt} from '../src/compiler/sustained-save-damage.js';

// Third-party batches 1 and 2 (2026-10-06): the modules' spells, from the export (`.cache/third-party-items.json`).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('older link forms read as the current ones', () => {
    const source = {type: 'spell', system: {description: {value: '<p>@UUID[Compendium.pf2e.conditionitems.TBSHQspnbcqxsmjL]{Frightened 1} @Check[type:flat|dc:6] @Compendium[pf2e.conditionitems.TBSHQspnbcqxsmjL]{x} @UUID[Compendium.pf2e-team-plus-magic.misc.Item.blEZMYfhAWP8iW8Q]{Spell Effect: Hemophilia}</p>'}}};
    assert.equal(normalizeLegacyLinks(source).system.description.value,
        '<p>@UUID[Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL]{Frightened 1} @Check[flat|dc:6] @UUID[Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL]{x} @UUID[Compendium.pf2e.spell-effects.Item.blEZMYfhAWP8iW8Q]{Spell Effect: Hemophilia}</p>');
    const plain = {type: 'spell', system: {description: {value: '<p>Nothing old.</p>'}}};
    assert.equal(normalizeLegacyLinks(plain), plain);
});

test("Personal Blizzard+'s heightening: more cold dice and a flat persistent step", () => {
    const plan = compile('Personal Blizzard+');
    assert.equal(plan.resolution.kind, 'sustained-save-damage');
    assert.deepEqual(sustainedSaveDamageAt(plan.resolution.sustainedSaveDamage, 'failure', 5, 3), {direct: '2d6[cold]', persistent: '(1d6+2)[persistent,cold]'});
});

test("Residual Bad Luck: Frightened by degree, and the held frightened note on the failing rows", () => {
    const plan = compile('Residual Bad Luck');
    for (const degree of ['failure', 'criticalFailure']) {
        const note = plan.resolution.outcomes[degree].noteEffects.find(entry => entry.conditionHold);
        assert.deepEqual(note.conditionHold, {slug: 'frightened', trigger: 'failed-attack-or-skill'});
    }
});

test("Wreak Havok: the Arcane Cascade's type, the area choice, off-guard against the caster", () => {
    const plan = compile('Wreak Havok');
    assert.deepEqual(plan.resolution.damageTypeFrom, {kind: 'arcane-cascade', fallback: 'force', sourceText: 'The damage dealt by this spell is the same type as your Arcane Cascade.'});
    assert.deepEqual(plan.compilerEvidence.areaChoice.map(area => `${area.distance} ${area.shape}`), ['5 emanation', '10 cone', '15 line']);
    const rule = plan.resolution.outcomes.failure.noteEffects[0].rules[0];
    assert.deepEqual(rule.predicate, ['origin:signature:{caster-signature}']);
    assert.equal(compileBasicFeatureRiders({defense: {kind: 'save', basic: false}, descriptionHTML: ''}), null);
});

test("Creature's Howl: its immunity after the plural save, and the hearing question", () => {
    const plan = compile("Creature's Howl");
    assert.equal(plan.resolution.temporaryImmunity.duration.value, 1);
    assert.equal(plan.resolution.outcomes.failure.effects[0].slug, 'frightened');
});
