import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {executableCasterChoice, inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 28 (2026-10-06): Energy Exertion (Wizards+: each variant a spell attack, the text's dice untyped until the caster names its residual
// energy's type).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Energy Exertion: each variant a spell attack; the caster names the type; 1d4 or 2d4 a rank', () => {
    const base = spell('Energy Exertion');
    const variant = id => { const copy = structuredClone(base); Object.assign(copy.system, structuredClone(copy.system.overlays[id].system)); delete copy.system.overlays; return compile(copy); };
    for (const [id, formula] of [['5OCJKPChMmpftRGH', '(@item.rank)d4[untyped]'], ['r2l7lFHKiYwlFQKV', '(2*@item.rank)d4[untyped]']]) {
        const plan = variant(id);
        assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
        assert.equal(plan.resolution.check.statistic, 'spell-attack');
        assert.equal(plan.resolution.sharedDamage.formula, formula);
        assert.ok(executableCasterChoice(plan));
        assert.ok(plan.resolution.casterChoice.values.includes('fire') && plan.resolution.casterChoice.values.includes('slashing'));
        assert.equal(plan.resolution.outcomes.criticalSuccess.damage.multiplier, 2);
    }
});
