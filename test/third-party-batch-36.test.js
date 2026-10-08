import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';

// Third-party batch 36 (2026-10-06): Divine Eclipse (Oracles+: the caster's 60-foot emanation; a creature ending its turn in it saves against the cold, unless it's
// blessed or in a blessed one's bright light; up to 5 blessed hold the module's light and fast healing while inside).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = (source, withCatalog = true) => compileAbility(source, {nativeEffectCatalog: withCatalog ? catalog : new Map(), referencedSpells: new Map()});

test('Divine Eclipse: the dark emanation\'s turn-end save; the blessing proved; the darkness rules a note', () => {
    const plan = compile(spell('Divine Eclipse'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.area.value, lingering.events, lingering.initial, lingering.excludeCaster], ['caster', 60, ['turn-end'], false, true]);
    assert.deepEqual([lingering.blessed.max, lingering.blessed.bright, lingering.blessed.dim], [5, 5, 5]);
    assert.match(lingering.blessed.effect.uuid, /\.Item\.WbVS2UZMIINwpNBZ$/);
    assert.deepEqual(plan.resolution.sharedDamage.components.map(component => `${component.formula} ${component.type}`), ['6d4 cold']);
    assert.match(lingering.notes[0], /extinguish all non-magical light/);
    const broken = structuredClone(plan); broken.compilerEvidence.divineEclipse = [];
    assert.equal(isExecutableLingeringPlan(broken), false);
    assert.equal(compile(spell('Divine Eclipse'), false).resolution.lingering?.blessed, undefined);
});
