import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

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



// Rank 3, batch 14 (2026-10-02): proved Effect + note spells of ranks 3–5.

const proved = source => { const plan = compile(source); return plan.resolution.kind === 'effect-note' && plan.automation.level === 'automatic' ? plan.resolution.effectNote.proof : null; };

test('six Effect + note spells are proved against PF2e\'s Effects', async () => {
    const [gw, rr, um, er, uw, wj] = await Promise.all(['rank-3/ghostly-weapon', 'rank-4/rapid-retreat', 'rank-4/unfettered-movement', 'rank-5/entwined-roots', 'rank-5/unbreaking-wave-vapor', 'rank-5/wind-jump'].map(spell));
    assert.ok(proved(gw)); assert.ok(proved(um)); assert.ok(proved(wj));
    assert.equal(proved(rr).endsAfterDamage, true);
    assert.equal(proved(uw).endsAfterAttack, true);
    assert.equal(proved(er).claims.length, 1);
});

test('a resistance whose heightened value disagrees, or a changed fly rule, is not proved', async () => {
    const roots = await spell('rank-5/entwined-roots');
    assert.equal(proved(withText(roots, html => { assert.ok(html.includes('The resistances increase to 10.')); return html.replace('The resistances increase to 10.', 'The resistances increase to 12.'); })), null);
    const wind = await spell('rank-5/wind-jump');
    assert.equal(proved(withText(wind, html => { assert.ok(html.includes('equal to your Speed')); return html.replace('equal to your Speed', 'equal to half your Speed'); })), null);
});
