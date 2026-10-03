import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('a save only bystanders make (the GM runs it): a spell note', async () => {
    const illuminate = compileAbility(await spell('cantrip/illuminate'));
    assert.equal(illuminate.resolution.kind, 'spell-note');
    assert.match(illuminate.resolution.note.text, /attended by an unwilling creature/);
    // (Verminous Lure rolls the bystanders' saves since batch 170.)
    assert.equal(compileAbility(await spell('rank-1/verminous-lure')).resolution.kind, 'lure-save');
});

test('bystander saves: kept strict', async () => {
    // A save the target makes, or one with damage, isn't a bystander's.
    const lure = await spell('rank-1/verminous-lure');
    assert.notEqual(compileAbility(withText(lure, text => text.replace('Tiny animals and animal swarms of any size within range must attempt a Will save.', 'The target must attempt a Will save.'))).resolution.kind, 'spell-note');
    assert.notEqual(compileAbility(withText(lure, text => text.replace('Tiny animals and animal swarms of any size within range must attempt a Will save.', 'The target must attempt a Will save.'))).resolution.kind, 'lure-save');
    const illuminate = await spell('cantrip/illuminate');
    assert.notEqual(compileAbility(withText(illuminate, text => text.replace('</p>', ' That creature takes 1d4 fire damage.</p>'))).resolution.kind, 'spell-note');
});
