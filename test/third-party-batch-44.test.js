import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectIncarnatePlan} from '../scripts/basic-save-core.js';

// Third-party batch 44 (2026-10-06): Ice Guardian (Oracles+: the guardian token — its Hit Points, AC and bludgeoning weakness by rank, immune to cold; the caster and
// its allies beside it in lesser cover; the Sustain's standard cover the card's part).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Ice Guardian: the conjured guardian\'s statistics and steps; the cover aura; the standard-cover part', () => {
    const plan = compile(spell('Ice Guardian'));
    assert.equal(plan.resolution.kind, 'incarnate');
    const c = plan.resolution.incarnate.conjure;
    assert.deepEqual([c.size, c.hp, c.ac, c.immunities, c.weaknesses, c.step], ['lg', 30, 22, ['cold'], [{type: 'bludgeoning', value: 3}], {baseRank: 3, hp: 10, ac: 3, weakness: 3}]);
    assert.deepEqual(c.coverAura.rules, [{key: 'FlatModifier', selector: 'ac', type: 'circumstance', value: 1, label: 'Lesser cover'}]);
    assert.deepEqual(plan.resolution.incarnate.phases.map(phase => [phase.key, phase.kind, phase.rules[0].value]), [['standard-cover', 'effect', 2]]);
    assert.deepEqual(inspectIncarnatePlan(plan), []);
});
