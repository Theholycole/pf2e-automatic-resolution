import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {executableCasterChoice, inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 29 (2026-10-06): Technomancy Ray (Inventors+: a spell attack; the die by the caster's Crafting rank; double and 1 persistent on a critical
// hit; fire, or the Variable Core's type, for both).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Technomancy Ray: the d4 (d6 master, d8 legendary in Crafting); the type for the hit and the critical persistent damage', () => {
    const plan = compile(spell('Technomancy Ray'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.equal(plan.resolution.sharedDamage.formula, '(@item.rank)d4[untyped]');
    assert.deepEqual(plan.resolution.skillDie, {skill: 'crafting', base: 4, byRank: {3: 6, 4: 8}, sourceText: plan.compilerEvidence.skillDie});
    assert.deepEqual(plan.resolution.outcomes.criticalSuccess.damage.formulas.map(entry => entry.formula), ['1[persistent,untyped]']);
    assert.ok(executableCasterChoice(plan));
    assert.deepEqual([plan.resolution.casterChoice.values, plan.resolution.casterChoice.outcomeFormulas], [['fire', 'acid', 'cold', 'electricity'], true]);
    const broken = structuredClone(plan); broken.compilerEvidence.skillDie = 'x';
    assert.equal(inspectSavePlan(broken).supported, false);
});
