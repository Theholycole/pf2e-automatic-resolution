import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

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



// Rank 3, batch 6 (2026-10-02): Hypnotize.

test('Hypnotize: the listed exposures, Dazzled inside, the GM\'s action control, no new saves while fascinated', async () => {
    const plan = compile(await spell('rank-3/hypnotize'));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([plan.automation.pendingCapabilities, isExecutableLingeringPlan(plan)], [[], true]);
    assert.deepEqual([lingering.initial, lingering.events, lingering.memberCondition, lingering.gmAction.actions, lingering.skipWhile.slug, lingering.sustained],
        [true, ['enter', 'turn-end'], {slug: 'dazzled'}, ['Seek', 'Interact'], 'fascinated', true]);
    for (const degree of ['failure', 'criticalFailure']) {
        const fascinated = plan.resolution.outcomes[degree].effects.find(effect => effect.slug === 'fascinated');
        assert.deepEqual(fascinated.endsWhen, [{event: 'area-ended'}], degree);
    }
});

test('Hypnotize: an unknown trigger or rule is not read', async () => {
    const source = await spell('rank-3/hypnotize');
    for (const [from, to] of [['when it enters the cloud,', 'when it enters the cloud, when it flies over the cloud,'], ['doesn\'t attempt new saves.', 'doesn\'t attempt new saves and takes 2d6 mental damage.'],
        ['while inside the cloud.', 'while inside the cloud and take a -2 status penalty to AC.']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.equal(isExecutableLingeringPlan(plan), false, from);
    }
});
