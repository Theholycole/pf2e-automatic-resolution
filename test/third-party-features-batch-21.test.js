import assert from 'node:assert/strict';
import test from 'node:test';

import {normalizeLegacyLinks} from '../src/compiler/compile-ability.js';

// Third-party features batch 21 (2026-10-07): a module's Effect linked without its name (Celestial Shift, Aberration Shift) is named from the catalog and read as the others.
const spell = html => ({type: 'spell', system: {description: {value: html}}});

test('an unnamed module Effect link is named from the catalog', () => {
    const catalog = new Map([['GNSz5ksf9fux0j7u', {name: 'Spell Effect: Celestial Shift'}], ['whatever00000000', {name: 'Mounted Combatant'}]]);
    const named = normalizeLegacyLinks(spell('<p>@UUID[Compendium.pf2e-team-plus-magic.misc.GNSz5ksf9fux0j7u]</p>'), catalog).system.description.value;
    assert.equal(named, '<p>@UUID[Compendium.pf2e.spell-effects.Item.GNSz5ksf9fux0j7u]{Spell Effect: Celestial Shift}</p>');
    // (Not an Effect, unknown, or already named: as it was.)
    assert.equal(normalizeLegacyLinks(spell('<p>@UUID[Compendium.pf2e-team-plus-magic.misc.Item.whatever00000000]</p>'), catalog).system.description.value, '<p>@UUID[Compendium.pf2e-team-plus-magic.misc.Item.whatever00000000]</p>');
    assert.equal(normalizeLegacyLinks(spell('<p>@UUID[Compendium.pf2e-team-plus-magic.misc.Item.GNSz5ksf9fux0j7u]</p>')).system.description.value, '<p>@UUID[Compendium.pf2e-team-plus-magic.misc.Item.GNSz5ksf9fux0j7u]</p>');
});
