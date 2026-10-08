import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 20 (2026-10-06): Dynamic Shield (cast with 1 to 3 actions, no PF2e variants: the card asks the actions spent; each version official Shield's
// sequence with its own Effect) and Dynamic Fly (each variant's Effect proved; the one- and three-action versions end at the end of the caster's next turn).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
// (PF2e's own Effects too — Shield Immunity: the official fixtures, as the census reads them.)
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : entry.name.endsWith('.json') ? [`${dir}/${entry.name}`] : []);
for (const file of walk(decodeURIComponent(new URL('../.cache/pf2e-test-fixtures/spell-effects', import.meta.url).pathname))) {
    const effect = JSON.parse(fs.readFileSync(file));
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system?.rules ?? [], duration: effect.system?.duration ?? null, start: null}};
    catalog.set(effect.name, profile); catalog.set(effect._id, profile);
}
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: catalog, referencedSpells: new Map()});
function mergeDeep(target, patch) { for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value; return target; }

test('Dynamic Shield: three versions, each the shield sequence with its own Effect; the card asks the actions spent', () => {
    const plan = compile(spell('Dynamic Shield'));
    assert.equal(plan.resolution.kind, 'action-versions');
    assert.deepEqual(plan.resolution.versions.map(version => version.actions), [1, 2, 3]);
    for (const version of plan.resolution.versions) assert.equal(version.plan.resolution.kind, 'effect-sequence');
    assert.notEqual(plan.resolution.versions[0].plan.resolution.applications[0].uuid, plan.resolution.versions[2].plan.resolution.applications[0].uuid);
});

test("Dynamic Fly: each variant's Effect proved; one and three actions end at the end of the next turn", () => {
    const source = spell('Dynamic Fly');
    const plans = Object.values(source.system.overlays).map(overlay => { const merged = structuredClone(source); merged.system = mergeDeep(merged.system, structuredClone(overlay.system)); delete merged.system.overlays; return compile(merged); });
    assert.deepEqual(plans.map(plan => [plan.resolution.kind, plan.automation.level, plan.resolution.effectNote.recipient]), [['effect-note', 'automatic', 'source'], ['effect-note', 'automatic', 'target'], ['effect-note', 'automatic', 'target']]);
    assert.deepEqual(plans.map(plan => plan.resolution.effectNote.proof.durationOverride?.expiry ?? null), ['turn-end', null, 'turn-end']);
});
