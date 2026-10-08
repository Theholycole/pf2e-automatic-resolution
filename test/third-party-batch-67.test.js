import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 67 (2026-10-07): Animated Spark (Wizards+) — a PF2e familiar mastered by the caster (a familiar's statistics), Construct, the weakness (the caster's level)
// and 2 abilities; 2 actions on the cast and each Sustain; the disperse (2d4, +1d4 a rank, in a 5-foot emanation, basic Reflex; bludgeoning, piercing or slashing).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Animated Spark: the familiar and its disperse', () => {
    const plan = compile(spell('Animated Spark'));
    assert.equal(plan.resolution.kind, 'animated-spark');
    const data = plan.resolution.animatedSpark;
    assert.deepEqual([data.actions, data.weaknessTypes, data.abilities, data.seconds], [2, ['bludgeoning', 'piercing', 'slashing', 'fire'], 2, 600]);
    assert.deepEqual(data.disperse, {dice: 2, die: 4, radius: 5, statistic: 'reflex', types: ['bludgeoning', 'piercing', 'slashing'], step: 1});
    assert.match(data.constructUuid, /familiar-abilities\.Item\.5eqcXtPsYunphMOZ$/);
    assert.equal(data.notes.length, 3);
});
