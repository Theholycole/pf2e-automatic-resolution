import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 27 (2026-10-06): Hope Prevails (Clerics+: Frightened lowered by 2 — the touched target, the target 30 feet away with the module's +2 against
// fear, or every creature in the caster's 30-foot emanation; an ongoing effect's frightened kept, with the GM's counteract).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = (source, withCatalog = true) => compileAbility(source, {nativeEffectCatalog: withCatalog ? catalog : new Map(), referencedSpells: new Map()});

test('Hope Prevails: three versions lowering Frightened by 2; the two-action Effect proved; the emanation for three', () => {
    const plan = compile(spell('Hope Prevails'));
    assert.equal(plan.resolution.kind, 'action-versions');
    const versions = plan.resolution.versions.map(version => [version.actions, version.plan.resolution.kind, version.plan.resolution.conditionLower]);
    assert.deepEqual(versions.map(([actions, kind]) => [actions, kind]), [[1, 'condition-lower'], [2, 'condition-lower'], [3, 'condition-lower']]);
    assert.ok(versions.every(([, , data]) => data.slug === 'frightened' && data.by === 2 && data.counteract.trait === 'fear'));
    assert.deepEqual(versions.map(([, , data]) => [data.recipients, data.range ?? data.radius, !!data.effect]), [['target', 'touch', false], ['target', 30, true], ['emanation', 30, false]]);
    assert.match(versions[1][2].effect.uuid, /\.Item\.ePFN29cDDvUqLuQc$/);
    // (Without the module's Effect to prove, it isn't read.)
    assert.notEqual(compile(spell('Hope Prevails'), false).resolution.kind, 'action-versions');
});
