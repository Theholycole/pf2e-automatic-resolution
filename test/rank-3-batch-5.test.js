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



// Rank 3, batch 5 (2026-10-02): Qi Blast (action counts stated as sentences).

// A PF2e variant: the overlay merged into the item, as the official compile does.
function variant(source, time) {
    const [id, overlay] = Object.entries(source.system.overlays).find(([, o]) => o.system?.time?.value === time);
    const copy = structuredClone(source);
    const merge = (target, patch) => { for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' ? merge(target[key], value) : structuredClone(value); return target; };
    copy.system = merge(copy.system, structuredClone(overlay.system ?? {}));
    delete copy.system.overlays;
    for (const entry of Object.values(copy.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ['damage'];
    return copy;
}

test('Qi Blast: each action variant reads its own numbers', async () => {
    const source = await spell('rank-3/qi-blast');
    for (const time of ['1', '2', '3']) {
        const plan = compile(variant(source, time));
        assert.deepEqual([plan.resolution.kind, plan.automation.pendingCapabilities, inspectSavePlan(plan).supported], ['save', [], true], time);
        assert.equal(plan.targeting.actorConstraints.complete, true, time);
    }
});

test('Qi Blast: a variant whose data disagrees with the text is not read', async () => {
    const source = await spell('rank-3/qi-blast');
    for (const [from, to] of [['the damage to 3d6', 'the damage to 5d6'], ['increase the cone to 60 feet', 'increase the cone to 90 feet'], ['or by 2d6 if you use 2 or 3 actions', 'or by 3d6 if you use 2 or 3 actions']]) {
        const changed = withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); });
        const time = from.includes('60') ? '3' : '2';
        assert.equal(inspectSavePlan(compile(variant(changed, time))).supported, false, from);
    }
});
