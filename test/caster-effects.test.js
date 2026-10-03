import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {inspectCasterBenefitClaim} from '../scripts/effect-modifier-proof.js';

const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
async function catalogOf(file) {
    const effect = await read(`spell-effects/${file}.json`);
    const profile = {id: effect._id, name: effect.name, type: effect.type, sourceFile: 'spell-effects', automation: {ruleKeys: [...new Set(effect.system.rules.map(rule => rule.key))], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules, duration: effect.system.duration, start: effect.system.start}, ...(effect.system.badge ? {badge: effect.system.badge} : {})};
    return {effect, catalog: new Map([[profile.name, profile], [profile.id, profile]])};
}

test('caster Effects on spell attacks: always and on a hit', async () => {
    for (const [spell, file, when] of [['rank-1/gluttons-jaws', 'spell-effect-gluttons-jaws', 'hit'], ['rank-1/propelling-air-stream', 'spell-effect-propelling-air-stream', 'always'], ['rank-5/spiked-carapace', 'spell-effect-spiked-carapace', 'always']]) {
        const {catalog} = await catalogOf(file);
        const plan = compileAbility(await read(`spells/spells/${spell}.json`), {nativeEffectCatalog: catalog});
        assert.equal(inspectSavePlan(plan).supported, true, `${spell}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
        assert.equal(plan.resolution.casterEffect.when, when, spell);
    }
});

test('caster Effects: claims are proved against the Effect', async () => {
    const {effect: stream} = await catalogOf('spell-effect-propelling-air-stream');
    const mechanics = {rules: stream.system.rules, duration: stream.system.duration};
    assert.equal(inspectCasterBenefitClaim({mechanics}, 'Regardless of whether you hit, you gain a fly Speed of 15 feet until the end of your next turn.', {rank: 1}).supported, true);
    assert.equal(inspectCasterBenefitClaim({mechanics}, 'you gain a fly Speed of 20 feet until the end of your next turn.', {rank: 1}).supported, false);
    assert.equal(inspectCasterBenefitClaim({mechanics}, 'you gain a fly Speed of 15 feet until the beginning of your next turn.', {rank: 1}).supported, false);
    const {effect: jaws} = await catalogOf('spell-effect-gluttons-jaws');
    const jawsDoc = {mechanics: {rules: jaws.system.rules, duration: jaws.system.duration}, badge: jaws.system.badge};
    assert.equal(inspectCasterBenefitClaim(jawsDoc, 'you gain 1d4 temporary Hit Points that last until the beginning of your next turn', {rank: 1}).supported, true);
    assert.equal(inspectCasterBenefitClaim(jawsDoc, 'you gain 1d6 temporary Hit Points that last until the beginning of your next turn', {rank: 1}).supported, false);
    assert.equal(inspectCasterBenefitClaim({mechanics: jawsDoc.mechanics}, 'you gain 1d4 temporary Hit Points that last until the beginning of your next turn', {rank: 1}).supported, false); // no badge
});

test('caster Effects: refused shapes', async () => {
    // Without the Effect in the catalog the plan is blocked.
    assert.equal(inspectSavePlan(compileAbility(await read('spells/spells/rank-1/gluttons-jaws.json'))).supported, false);
    // A clause the Effect doesn't give is refused.
    const {catalog} = await catalogOf('spell-effect-spiked-carapace');
    const source = await read('spells/spells/rank-5/spiked-carapace.json');
    source.system.description.value = source.system.description.value.replace('+1 circumstance bonus to your AC', '+2 circumstance bonus to your AC');
    assert.equal(inspectSavePlan(compileAbility(source, {nativeEffectCatalog: catalog})).supported, false);
    // A forged plan whose Effect snapshot no longer proves the clause is refused.
    const plan = compileAbility(await read('spells/spells/rank-5/spiked-carapace.json'), {nativeEffectCatalog: catalog});
    plan.resolution.casterEffect.document.mechanics.rules[0].value = 3;
    assert.equal(inspectSavePlan(plan).supported, false);
});
