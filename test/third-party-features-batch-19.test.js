import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileSummon} from '../src/compiler/summon-families.js';
import {normalizeLegacyLinks} from '../src/compiler/compile-ability.js';
import {readSpellshapeFeat} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 19 (2026-10-07): Magic+'s aspect summons (the aspect creature at the cast rank with its statistics Effect) and Aspect Sage.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));
const adapted = spell => ({defense: {kind: 'none'}, targeting: {range: spell.system.range?.value ?? ''}, lifecycle: {duration: spell.system.duration.value, sustained: spell.system.duration.sustained},
    descriptionHTML: normalizeLegacyLinks(spell).system.description.value});

test('every aspect summon reads its creature and statistics Effect', () => {
    const spells = items.filter(entry => entry.type === 'spell' && /^Summon .* Aspect$/.test(entry.name));
    assert.equal(spells.length, 13);
    for (const spell of spells) {
        const read = compileSummon(adapted(spell))?.summon;
        assert.ok(read?.actorUuid?.includes('.actors.Actor.') && read.aspect.statistics.uuid.includes('.Item.') && read.durationSeconds === 60, spell.name);
    }
    const animal = compileSummon(adapted(item('Summon Animal Aspect'))).summon;
    assert.deepEqual([animal.actorUuid, animal.actorName, animal.rangeFeet, animal.aspect.maxSize], ['Compendium.pf2e-team-plus-magic.actors.Actor.2uDnYIc16jKJdPK1', 'Animal Aspect', 30, 'medium']);
    assert.equal(compileSummon(adapted(item('Summon Fey Aspect'))).summon.rangeFeet, 5);
});

test('Aspect Sage: an aspect summon gains an aspect ability', () => {
    const read = readSpellshapeFeat(item('Aspect Sage'));
    assert.deepEqual([read.requires.anyTraits, read.riders], [['aspectmon'], [{type: 'aspect-ability'}]]);
});
