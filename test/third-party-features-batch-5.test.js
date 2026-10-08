import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 5 (2026-10-07): Drain Destiny, Reporting Spell, Enlightening Spell, Beguiling Feint (plus-spellshapes.js).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const shape = name => readSpellshapeFeat(structuredClone(items.find(item => item.name === name && item.type !== 'spell' && (item.system.traits?.value ?? []).includes('spellshape'))));
const facts = extra => ({traits: [], damageTypes: [], ...extra});

test('Drain Destiny and Reporting Spell', () => {
    const drain = shape('Drain Destiny');
    assert.deepEqual(drain.riders[0], {type: 'mythic-drain', when: 'hit', gain: 1, drain: 1});
    assert.deepEqual(drain.requires, {singleTarget: true, attack: true});
    const report = shape('Reporting Spell');
    assert.deepEqual(report.riders, [{type: 'report', immunityHours: 24}]);
    assert.match(unmetRequirement(report.requires, facts({attack: false, saveStatistic: null})), /no spell attack roll or save/);
    assert.equal(unmetRequirement(report.requires, facts({attack: false, saveStatistic: 'will'})), null);
});

test('Enlightening Spell and Beguiling Feint', () => {
    const enlightening = shape('Enlightening Spell');
    assert.deepEqual(enlightening.riders[0], {type: 'ally-recipient-effect', uuid: 'Compendium.pf2e-team-plus-oracles-remastered.misc.Item.BgVgR3Jnc7zUNeVX', name: 'Effect: Enlightening Spell', ifCursebound: true});
    assert.deepEqual(enlightening.requires.table, ['from one of your oracle spell slots', 'it targets an ally']);
    const feint = shape('Beguiling Feint').riders[0];
    assert.deepEqual([feint.type, feint.within, feint.skill, feint.against, feint.rollOption], ['feint-check', 30, 'deception', 'perception', 'beguiling-feint']);
    assert.match(feint.concealed, /^you are Concealed to the creature until the end of your next turn/);
});
