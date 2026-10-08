import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 32 (2026-10-06): Targeted Ward (Magic+: by the actions spent, the opponent's Will save; the caster's status bonus to its chosen defense against
// that opponent, +1/+2/+3 by the row and one more from 5th rank, for 4 rounds; the one-action version behind a toggle).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Targeted Ward: three versions, each the opponent\'s Will save and the caster\'s ward by its row', () => {
    const plan = compile(spell('Targeted Ward'));
    assert.equal(plan.resolution.kind, 'action-versions');
    assert.deepEqual(plan.resolution.versions.map(version => [version.actions, version.plan.targeting.range, version.plan.resolution.casterWard.toggle]), [[1, '30 feet', true], [2, '30 feet', false], [3, '60 feet', false]]);
    for (const {plan: version} of plan.resolution.versions) {
        assert.equal(inspectSavePlan(version).supported, true, JSON.stringify(inspectSavePlan(version).blockers));
        assert.equal(version.resolution.check.statistic, 'will');
        assert.deepEqual(version.resolution.casterWard.byDegree, {criticalSuccess: 0, success: 1, failure: 2, criticalFailure: 3});
        assert.deepEqual(version.resolution.casterWard.heightened, {rank: 5, add: 1});
        assert.equal(version.resolution.casterWard.seconds, 24);
    }
    assert.match(plan.resolution.versions[2].plan.resolution.casterWard.note, /change your defense/);
    const broken = structuredClone(plan.resolution.versions[1].plan); broken.compilerEvidence.casterWard = [];
    assert.equal(inspectSavePlan(broken).supported, false);
});
