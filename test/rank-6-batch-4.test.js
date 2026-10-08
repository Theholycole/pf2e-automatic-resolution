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

const supported = plan => inspectSavePlan(plan).supported;


import {isRecurringSaveLifetime} from '../scripts/basic-save-core.js';

// Rank 6, batch 4 (2026-10-03): Divine Decree, Petrify, Lignify.

test("Divine Decree: enemies only; the second save up to level 10 (+2 per rank); sent home a GM note", async () => {
    const plan = compile(await spell("rank-7/divine-decree"));
    assert.ok(supported(plan));
    const critical = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual([critical.followUps[0].levelGate.maxLevel, critical.followUps[0].levelGate.perStep], [10, 2]);
    assert.equal(critical.followUps[0].outcomes.criticalFailure.terminal.kind, "death");
    assert.ok(critical.rowNotes.some(note => note.kind === "sent-home"));
    assert.ok(plan.targeting.actorConstraints.predicates.some(predicate => predicate.kind === "enemy-of-caster"));
});

test("Petrify and Lignify: an unlimited Slowed that escalates and petrifies at the creature's action count", async () => {
    for (const path of ["rank-6/petrify", "rank-6/lignify"]) {
        const plan = compile(await spell(path));
        assert.ok(supported(plan), path);
        const slowed = plan.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === "slowed");
        assert.equal(slowed.value, 2);
        assert.ok(isRecurringSaveLifetime(slowed));
        assert.deepEqual([slowed.recurringSave.mode, slowed.recurringSave.atActions.slug, slowed.recurringSave.steps.criticalFailure], ["escalate", "petrified", 2]);
        assert.equal(plan.targeting.actorConstraints.predicates[0].kind, "gm-confirmed");
    }
    const lignify = compile(await spell("rank-6/lignify"));
    assert.deepEqual([lignify.resolution.traitSaveBonus.trait, lignify.resolution.traitSaveBonus.value], ["plant", 2]);
});
