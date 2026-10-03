import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableSavePlan} from '../scripts/basic-save-core.js';

const source = async () => JSON.parse(await readFile(new URL('../.cache/pf2e-test-fixtures/spells/spells/rank-1/unraveling-blast.json',import.meta.url)));

test('capability report and execution route share the same decision', async()=>{
    const plan=compileAbility(await source());
    assert.deepEqual(inspectSavePlan(plan),{supported:true,route:'degree-save',blockers:[]});
    const changed=structuredClone(plan);
    changed.automation.pendingCapabilities=['unknown-recovery'];
    changed.resolution.outcomes.failure.manualInstructions=[{kind:'action-restriction'}];
    const report=inspectSavePlan(changed);
    assert.equal(report.supported,isExecutableSavePlan(changed));
    assert.equal(report.supported,false);
    assert(report.blockers.some(b=>b.code==='compiler-gap'&&b.message==='unknown-recovery'));
    assert(report.blockers.some(b=>b.code==='manual-mechanic'&&b.path==='resolution.outcomes.failure.manualInstructions'));
    assert.deepEqual(plan.automation.pendingCapabilities,[],'inspection does not mutate the compiled source');
});

test('runtime-only gaps identify their exact outcome when compiler pending list is empty', async()=>{
    const plan=compileAbility(await source());
    plan.resolution.outcomes.failure.nativeEffects=[{kind:'native-spell-effect',uuid:'unresolved',recipient:{actor:'manual'}}];
    plan.resolution.outcomes.criticalFailure.effects[0].value=0;
    assert.deepEqual(plan.automation.pendingCapabilities,[]);
    const report=inspectSavePlan(plan);
    assert.equal(report.supported,false);
    assert(report.blockers.some(b=>b.path.startsWith('resolution.outcomes.failure.nativeEffects')));
    assert(report.blockers.some(b=>b.code==='condition-composition'&&b.path==='resolution.outcomes.criticalFailure.effects'));
    assert.equal(inspectSavePlan(null).blockers[0].code,'primary-save');
});
