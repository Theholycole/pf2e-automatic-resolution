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
// Every fixture spell by UUID, for "functions as" references.
async function spellsByUuid() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const s = JSON.parse(await readFile(path, 'utf8')); if (s._id) map.set(`Compendium.pf2e.spells-srd.Item.${s._id}`, s); }
    } };
    await walk(new URL('spells/spells/', base));
    return map;
}
const referencedSpells = await spellsByUuid();
const compile = (source, options = {}) => compileAbility(source, {nativeEffectCatalog: effects, referencedSpells, ...options});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };



// Rank 3, batch 4 (2026-10-02): Stinking Cloud ("functions as Mist except …").

test('Stinking Cloud: Mist\'s concealment, the end-of-turn save, and Slowed only while in the cloud', async () => {
    const plan = compile(await spell('rank-3/stinking-cloud'));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([plan.resolution.kind, lingering.concealment, lingering.events, lingering.centre, isExecutableLingeringPlan(plan)], ['save', true, ['turn-end'], 'placed', true]);
    const effects = degree => plan.resolution.outcomes[degree].effects.map(effect => [effect.slug, effect.value, (effect.endsWhen ?? []).map(event => event.event).join()]);
    assert.deepEqual(effects('success'), [['sickened', 1, '']]);
    assert.deepEqual(effects('failure'), [['sickened', 1, ''], ['slowed', 1, 'leave-area']]);
    assert.deepEqual(effects('criticalFailure'), [['sickened', 2, ''], ['slowed', 1, 'leave-area']]);
});

test('Stinking Cloud: without Mist\'s rules, or with a changed rule, it is not a cloud', async () => {
    const source = await spell('rank-3/stinking-cloud');
    // The referenced spell unavailable.
    assert.equal(isExecutableLingeringPlan(compile(source, {referencedSpells: new Map()})), false);
    // Mist changed so it no longer conceals.
    const changed = new Map(referencedSpells);
    const mistUuid = [...changed.keys()].find(uuid => changed.get(uuid).name === 'Mist');
    const mist = structuredClone(changed.get(mistUuid));
    assert.ok(/become concealed to creatures within it/.test(mist.system.description.value));
    mist.system.description.value = mist.system.description.value.replace(/become concealed to creatures within it/, 'take 1d6 cold damage');
    changed.set(mistUuid, mist);
    assert.equal(isExecutableLingeringPlan(compile(source, {referencedSpells: changed})), false);
    for (const [from, to] of [['end their turns within the cloud', 'end their turns within the cloud and take 2d6 poison damage'], ['is not a poison effect.)', 'is not a poison effect, and creatures in it are Blinded.)']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.equal(isExecutableLingeringPlan(plan), false, from);
    }
});

test('Infinitesimal Collapse Field keeps both conditions while in the area', async () => {
    const plan = compile(await spell('rank-7/infinitesimal-collapse-field'));
    assert.equal(plan.resolution.outcomes.failure.effects.length, 2);
    assert.ok(plan.resolution.outcomes.failure.effects.every(effect => (effect.endsWhen ?? []).some(event => event.event === 'leave-area')));
});
