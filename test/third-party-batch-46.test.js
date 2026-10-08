import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 46 (2026-10-06): the proxy spells — Coalesce Form (a polymorph spell cast at its rank), Untamed Aspect Shift (Pest Shift, Animal Shift from 2nd; the
// own-attack +2 toggle), Witch's Bottle (one of the caster's hex spells on the target; Slowed 1 or 2 by its actions).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('the proxy spells\' picks', () => {
    const coalesce = compile(spell('Coalesce Form')).resolution;
    assert.deepEqual([coalesce.kind, coalesce.proxyCast.source, coalesce.proxyCast.sameRank], ['proxy-cast', 'polymorph', true]);
    const untamed = compile(spell('Untamed Aspect Shift')).resolution.proxyCast;
    assert.deepEqual(untamed.list.map(entry => [entry.name, entry.minRank, entry.seconds]), [['Pest Shift', 1, 600], ['Animal Shift', 2, 60]]);
    assert.match(untamed.list[0].uuid, /\.Item\.TXZWyxFYuhQeQ5ue$/);
    assert.deepEqual([untamed.attackToggle.value, untamed.sameRank], [2, true]);
    const bottle = compile(spell("Witch's Bottle")).resolution.proxyCast;
    assert.deepEqual([bottle.source, bottle.trait, bottle.slowed.byActions, bottle.sameRank], ['own-trait', 'hex', {2: 1, 3: 2}, false]);
});
