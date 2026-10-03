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

const mergeDeep = (target, patch) => { for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value; return target; };
const variant = (source, time) => {
    const copy = structuredClone(source);
    const [, overlay] = Object.entries(copy.system.overlays).find(([, entry]) => entry.system?.time?.value === time);
    copy.system = mergeDeep(copy.system, structuredClone(overlay.system)); delete copy.system.overlays;
    for (const entry of Object.values(copy.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ['damage'];
    return copy;
};

// Rank 5, batch 8 (2026-10-02): Rip the Spirit (each action variant: Drained 1 on failing, joined to the damage sentence), Spiritual
// Torrent (vitality damage, void for an undead caster).

test('Rip the Spirit: each variant a basic Fortitude save with Drained 1 on failing; the 3-action variant targets living creatures', async () => {
    const source = await spell('rank-5/rip-the-spirit');
    for (const time of ['1', '2', '3']) {
        const plan = compile(variant(source, time));
        assert.equal(supported(plan), true, time);
        assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].effects.map(effect => `${effect.slug} ${effect.value}`)), [['drained 1'], ['drained 1']], time);
    }
    assert.deepEqual(compile(variant(source, '2')).resolution.sharedDamage.components.map(component => component.formula), ['10d6']);
    assert.deepEqual(compile(variant(source, '3')).targeting.actorConstraints.predicates, [{kind: 'living-creature'}]);
    // A 2-action paragraph whose damage isn't the variant's is refused.
    assert.equal(supported(compile(variant(withText(source, html => html.replace('the damage is 10d6 void damage', 'the damage is 12d6 void damage')), '2'))), false);
});

test('Spiritual Torrent: vitality damage, swapped to void for an undead caster; each action variant\'s area', async () => {
    const plan = compile(await spell('rank-5/spiritual-torrent'));
    assert.equal(supported(plan), true);
    assert.deepEqual(plan.resolution.damageSwap, {from: 'vitality', to: 'void', when: 'caster-undead', sourceText: "If you're a living creature, this spell deals vitality damage and gains the vitality trait. If you're an undead creature, this spell deals void damage and gains the void trait."});
    assert.equal(supported(compile(variant(await spell('rank-5/spiritual-torrent'), '3'))), true);
    // Only the living/undead pair is read.
    assert.equal(supported(compile(withText(await spell('rank-5/spiritual-torrent'), html => html.replace("If you're an undead creature", "If you're a construct")))), false);
});
