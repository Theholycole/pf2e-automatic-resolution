import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 4 (2026-10-07): Magic+'s mystic duo spellshapes — Eldritch Resilience, Spell and Steel, Linked Target Spell, Twinned Target Spell —
// and Ally Form (plus-spellshapes.js).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const shape = name => readSpellshapeFeat(structuredClone(items.find(item => item.name === name && item.type !== 'spell' && (item.system.traits?.value ?? []).includes('spellshape'))));
const facts = extra => ({traits: [], damageTypes: [], ...extra});

test('"Your mystic link is active" is checked; the rest of a Requirements is the table\'s', () => {
    assert.deepEqual(shape('Eldritch Resilience').requires, {mysticLink: true});
    assert.deepEqual(shape('Spell and Steel').requires, {noDuration: true, damaging: true, mysticLink: true, table: ['your mystic duo made a successful Strike since your last turn']});
    assert.match(unmetRequirement({mysticLink: true}, facts({mysticLink: false})), /mystic link isn't active/);
    assert.equal(unmetRequirement({mysticLink: true}, facts({mysticLink: true})), null);
});

test('the duo\'s Effect and damage', () => {
    assert.deepEqual(shape('Eldritch Resilience').riders, [{type: 'duo-effect', uuid: 'Compendium.pf2e-team-plus-magic.misc.Item.aazap1iOXQDvTUNc', name: 'Effect: Eldritch Resilience', times: 2, cantripTimes: 1, whileLinked: true}]);
    assert.deepEqual(shape('Spell and Steel').riders, [{type: 'extra-damage', formula: '2*rank', cantripFormula: 'rank', damageTypeFrom: 'duo-weapon'}]);
});

test('the self-only spell sent elsewhere', () => {
    const linked = shape('Linked Target Spell');
    assert.deepEqual(linked.riders[0], {type: 'redirect-self', to: 'duo', alsoSelf: false, whileLinked: true, endsPrevious: true});
    assert.equal(unmetRequirement(linked.requires, facts({mysticLink: true, cantrip: true, rank: 5, highest: 5})), null);
    assert.match(unmetRequirement(linked.requires, facts({mysticLink: true, cantrip: false, rank: 5, highest: 5})), /cantrip or 1 rank below/);
    assert.deepEqual(shape('Twinned Target Spell').riders, [{type: 'redirect-self', to: 'duo', alsoSelf: true, whileLinked: true}]);
    const ally = shape('Ally Form');
    assert.deepEqual(ally.riders[0], {type: 'redirect-self', to: 'adjacent-ally', alsoSelf: false, maxSeconds: 60});
    assert.deepEqual([ally.requires.fromSlots, ally.requires.anyTraits], [true, ['polymorph']]);
});
