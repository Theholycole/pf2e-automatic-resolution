import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

const supported = plan => inspectSavePlan(plan).supported;


// Rank 4, batch 22 (2026-10-02): Elephant Form (PF2e's battle form; the Grapple sentence sits in the Grabbing Trunk ability PF2e's form shows as
// its Note) and Swarm Form (PF2e's Effect; the crawl action compiled as its own Fortitude save for the card's button).

test('Elephant Form: PF2e\'s battle form, its trunk ability the form\'s Note', async () => {
    const plan = compile(await spell('rank-4/elephant-form'));
    assert.equal(plan.resolution.kind, 'effect');
    assert.equal(plan.automation.level, 'automatic');
    // Without PF2e's Note for the ability, the Grapple sentence isn't covered.
    const effect = structuredClone(effects.get('Spell Effect: Elephant Form'));
    effect.mechanics.rules = effect.mechanics.rules.filter(rule => rule.key !== 'Note');
    const bare = new Map(effects); bare.set('Spell Effect: Elephant Form', effect);
    assert.notEqual(compileAbility(await spell('rank-4/elephant-form'), {nativeEffectCatalog: bare}).automation.level, 'automatic');
});

test('Swarm Form: the Effect and the crawl action\'s save', async () => {
    const plan = compile(await spell('rank-4/swarm-form'));
    assert.equal(plan.resolution.kind, 'effect');
    assert.equal(plan.automation.level, 'automatic');
    const [action] = plan.resolution.grantedActions;
    assert.match(action.label, /^Crawl all over/);
    assert.equal(supported(action.plan), true);
    assert.equal(action.plan.resolution.check.statistic, 'fortitude');
    assert.deepEqual(action.plan.resolution.outcomes.success.effects, []);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => action.plan.resolution.outcomes[degree].effects.map(effect => `${effect.slug} ${effect.value}`)), [['sickened 1'], ['sickened 2']]);
    // A save written another way isn't read as the action.
    const other = compile(withText(await spell('rank-4/swarm-form'), html => html.replace('or become', 'or else become')));
    assert.equal(other.resolution.grantedActions, undefined);
});
