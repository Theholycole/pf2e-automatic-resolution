// Explicit disposable-world checks; spell names here select test fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'generalRulesVerification';
const assert = (value, message) => { if (!value) throw Error(message); };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export async function run(macro) {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const saved = macro.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    const persist = () => macro.setFlag(NS, KEY, saved);
    const show = result => new foundry.applications.api.DialogV2({window: {title: 'General rules verification report'}, position: {width: 820},
        content: `<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${escape(JSON.stringify(result, null, 2))}</pre>`,
        buttons: [{action: 'close', label: 'Close report'}]}).render(true);
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); show(result);
    };
    const actor = async name => {
        const document = await Actor.create({name: `PFTEST General ${name}`, type: 'npc', flags: {[NS]: {generalRulesFixture: true}},
            system: {details: {level: {value: 5}}, attributes: {hp: {value: 500, max: 500}, ac: {value: 20}},
                saves: {fortitude: {value: 10}, reflex: {value: 10}, will: {value: 10}}, traits: {value: ['humanoid']}}});
        saved.actors.push(document.id); await persist(); return document;
    };
    const token = async actor => {
        assert(canvas.scene, 'An active disposable test scene is required.');
        return (await canvas.scene.createEmbeddedDocuments('Token', [{...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x: 1100, y: 1100}]))[0];
    };
    const setup = async (name, {custom = false} = {}) => {
        const caster = await actor(`${name} caster`), casterToken = await token(caster);
        // Fixtures default to the opposition; enemy-only spells need the caster on the other side.
        await caster.update({'system.details.alliance': 'party'});
        const [entry] = await caster.createEmbeddedDocuments('Item', [{name: 'General rules casting', type: 'spellcastingEntry',
            system: {tradition: {value: 'occult'}, prepared: {value: 'innate'}, spelldc: {dc: 24, value: 14}}}]);
        const pack = game.packs.get('pf2e.spells-srd'), index = await pack.getIndex(), row = index.find(item => item.name === name);
        assert(row, `Missing native fixture ${name}`);
        const source = (await pack.getDocument(row._id)).toObject(); delete source._id;
        source.system.location = {value: entry.id};
        if (custom) {
            source.name = 'Custom linked nausea'; source.system.slug = 'custom-linked-nausea';
            delete source._stats.compendiumSource;
            source.system.description.value = source.system.description.value.replace('Sickened 2', 'Sickened 3').replace('Slowed 1', 'Slowed 2');
        }
        const [spell] = await caster.createEmbeddedDocuments('Item', [source]);
        return {caster, casterToken, spell};
    };
    const finalize = async (card, degrees) => {
        const state = card.getFlag(NS, 'basicSaveState');
        for (const [index, target] of state.targets.entries()) {
            if (target.eligible === false) continue;
            await api.saves.rollSave(card, target.id, {skipDialog: true});
            await api.saves.correctTarget(card, target.id, {action: 'degree', degree: degrees[index] ?? degrees[0]});
        }
        await api.saves.finalize(card);
    };
    const cast = async (fixture, actors, degrees, rank = fixture.spell.baseRank) => {
        if (fixture.spell.isFocusSpell || fixture.spell.isCantrip) await fixture.caster.update({'system.details.level.value': rank * 2 - 1});
        const targets = await Promise.all(actors.map(token));
        const plan = await api.compile(fixture.spell);
        const {card} = await api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan, targets, castRank: rank, dc: 24, skipConfirmation: true});
        await finalize(card, degrees); return card;
    };
    const get = castId => api.ongoing.records().find(record => record.castId === castId);
    const retch = async (castId, degree) => {
        const current = get(castId), entry = current.entries.find(entry => entry.status === 'active' && entry.metadata?.conditions?.some(condition => condition.recovery === 'sickened'));
        assert(entry, 'Sickened recovery entry exists.');
        const result = await api.ongoing.request('condition-retch', {castId, revision: current.revision, effectUuid: entry.uuid});
        const card = game.messages.get(result.cardId); await finalize(card, [degree]); await api.ongoing.reconcile(); return card.id;
    };
    const addCondition = async (recipient, slug, value) => {
        const source = game.pf2e.ConditionManager.getCondition(slug).toObject(); delete source._id;
        if (value != null) source.system.value.value = value;
        return (await recipient.createEmbeddedDocuments('Item', [source]))[0];
    };
    const actions = [
        ['baseline', 'Record current Foundry baseline', () => record('baseline', async () => ({foundry: game.version, pf2e: game.system.version,
            module: game.modules.get(NS).version, world: game.world.id, activeModules: [...game.modules.values()].filter(module => module.active).map(module => module.id),
            removal: game.settings.get('pf2e', 'automation.removeExpiredEffects'), effectiveRemoval: game.pf2e.settings.automation.removeEffects}))],
        ['inspect', 'Inspect only this harness’s linked fixture state', () => show(api.ongoing.records().filter(record =>
            saved.actors.includes(record.sourceActorUuid?.split('.')[1])).map(record => ({castId: record.castId, name: record.name, status: record.status,
                reviewReason: record.reviewReason, entries: record.entries, recovery: record.obligations.filter(obligation => obligation.kind === 'sickened-recovery').map(obligation => ({
                    status: obligation.status, cardId: obligation.cardId, target: game.messages.get(obligation.cardId)?.getFlag(NS, 'basicSaveState')?.targets?.map(target => ({degree: target.degree, result: target.conditionResults}))}))})))],
        ['linked', 'Verify linked outcomes, Retch, overlap and custom mechanics', () => record('linked-outcomes-recovery', async () => {
            const output = [];
            for (const name of ['Scramble Body', 'Divine Wrath']) {
                const fixture = await setup(name), degrees = ['criticalSuccess', 'success', 'failure', 'criticalFailure'];
                // Separate casts keep the single-target fixture's legal target count.
                for (const degree of degrees) {
                    const recipient = await actor(`${name} ${degree}`), card = await cast(fixture, [recipient], [degree]);
                    const state = card.getFlag(NS, 'basicSaveState'), expected = {criticalSuccess: 0, success: 0, failure: 1, criticalFailure: 2}[degree];
                    assert((recipient.getCondition('sickened')?.value ?? 0) === expected, `${name} ${degree} Sickened outcome`);
                    assert((recipient.getCondition('slowed')?.value ?? 0) === (degree === 'criticalFailure' ? 1 : 0), `${name} ${degree} Slowed outcome`);
                    if (name === 'Divine Wrath' && degree !== 'criticalSuccess') assert(recipient.hitPoints.value < 500, 'Native damage applied');
                    const hp = recipient.hitPoints.value;
                    if (degree === 'criticalFailure') {
                        const unrelated = await addCondition(recipient, 'sickened', 4), unrelatedSlowed = await addCondition(recipient, 'slowed', 3);
                        await fixture.spell.delete();
                        await retch(state.castId, 'failure'); assert(get(state.castId).entries.every(entry => entry.status === 'active'), 'Failed recovery retains both contributions');
                        await retch(state.castId, 'success'); assert(get(state.castId).entries.filter(entry => entry.status === 'active').length === 2, 'Partial recovery retains dependent');
                        await retch(state.castId, 'criticalSuccess');
                        assert(get(state.castId).entries.every(entry => entry.status === 'ended'), 'Recovery ends only this cast and its dependent');
                        assert(recipient.items.has(unrelated.id) && recipient.items.has(unrelatedSlowed.id), 'Unrelated overlapping conditions remain');
                        await api.ongoing.reconcile(); assert(recipient.hitPoints.value === hp, 'Recovery and reconciliation never repeat damage');
                    }
                    output.push({name, degree, cardId: card.id, castId: state.castId, expected, damage: 500 - hp});
                }
            }
            const custom = await setup('Scramble Body', {custom: true}), recipient = await actor('custom recipient');
            const card = await cast(custom, [recipient], ['criticalFailure']), state = card.getFlag(NS, 'basicSaveState');
            assert(recipient.getCondition('sickened')?.value === 3 && recipient.getCondition('slowed')?.value === 2, 'Custom identity and changed values execute the same rules');
            saved.cases.reload = {castId: state.castId, actorUuid: recipient.uuid, cardId: card.id};
            output.push({custom: saved.cases.reload}); return output;
        })],
        ['reload', 'Verify custom linked cast after browser reload', () => record('linked-reload', async () => {
            const entry = saved.cases.reload; assert(entry, 'Prepare linked case first.');
            await api.ongoing.reconcile({recover: true}); const recipient = await fromUuid(entry.actorUuid);
            assert(recipient.getCondition('sickened')?.value === 3 && recipient.getCondition('slowed')?.value === 2, 'Both contributions survive reload');
            await retch(entry.castId, 'criticalSuccess'); assert(recipient.hasCondition('slowed'), 'Partial recovery keeps dependent after reload');
            await retch(entry.castId, 'success'); assert(!recipient.hasCondition('slowed') && !recipient.hasCondition('sickened'), 'Full recovery removes linked payload after reload');
            return entry;
        })],
        ['edges', 'Verify linked immunity, repeat casts, detachment and native removal', () => record('linked-edges', async () => {
            const output = [], fixture = await setup('Scramble Body');
            for (const slug of ['sickened', 'slowed']) {
                const recipient = await actor(`immune ${slug}`);
                await recipient.update({'system.attributes.immunities': [{type: slug}]});
                const card = await cast(fixture, [recipient], ['criticalFailure']), state = card.getFlag(NS, 'basicSaveState');
                await api.ongoing.reconcile();
                assert(!recipient.hasCondition('slowed'), 'Dependent is absent when itself or its root is immune');
                assert(recipient.hasCondition('sickened') === (slug === 'slowed'), 'Root condition respects independent immunity');
                output.push({immune: slug, cardId: card.id, castId: state.castId, results: state.targets[0].conditionResults});
            }
            const recipient = await actor('repeated linked casts');
            const first = await cast(fixture, [recipient], ['criticalFailure']), second = await cast(fixture, [recipient], ['criticalFailure']);
            const one = first.getFlag(NS, 'basicSaveState').castId, two = second.getFlag(NS, 'basicSaveState').castId;
            await retch(one, 'criticalSuccess');
            assert(get(one).entries.every(entry => entry.status === 'ended'), 'First cast ended');
            assert(get(two).entries.every(entry => entry.status === 'active'), 'Second cast remains independent');
            const root = get(two).entries.find(entry => entry.metadata.conditions?.[0]?.slug === 'sickened');
            const rootEffect = await fromUuid(root.uuid), grant = rootEffect.flags.pf2e.itemGrants[root.metadata.conditions[0].ruleFlag];
            await recipient.items.get(grant.id).delete(); await api.ongoing.reconcile();
            assert(!recipient.hasCondition('sickened') && !recipient.hasCondition('slowed'), 'Native root grant deletion cleans its linked contribution');
            output.push({repeated: [one, two]});
            for (const detachRoot of [true, false]) {
                const owner = await actor(`detach ${detachRoot ? 'root' : 'dependent'}`), card = await cast(fixture, [owner], ['criticalFailure']);
                const id = card.getFlag(NS, 'basicSaveState').castId, root = get(id).entries.find(entry => entry.metadata.conditions?.[0]?.slug === 'sickened');
                const dependent = get(id).entries.find(entry => entry.metadata.linkedTo);
                await api.ongoing.request('detach', {castId: id, uuid: detachRoot ? root.uuid : dependent.uuid});
                if (detachRoot) {
                    assert(get(id).entries.every(entry => entry.detached), 'Root detachment transfers the dependency group');
                    await api.ongoing.reconcile();
                    assert(owner.hasCondition('sickened') && owner.hasCondition('slowed'), 'Detachment preserves conditions');
                } else {
                    await retch(id, 'criticalSuccess');
                    assert(!owner.hasCondition('sickened') && owner.hasCondition('slowed'), 'Detached dependent survives managed root recovery');
                }
                output.push({detachRoot, castId: id});
            }
            return output;
        })],
        ['timing', 'Verify next-caster-turn expiry with current removal setting', () => record('rider-turn-expiry', async () => {
            const fixture = await setup('Void Warp'), recipient = await actor('timed rider'), recipientToken = await token(recipient);
            const previous = game.combat?.id, combat = await Combat.create({scene: canvas.scene.id, active: false});
            try {
                await combat.activate();
                await combat.createEmbeddedDocuments('Combatant', [{actorId: fixture.caster.id, tokenId: fixture.casterToken.id, sceneId: canvas.scene.id, initiative: 20},
                    {actorId: recipient.id, tokenId: recipientToken.id, sceneId: canvas.scene.id, initiative: 10}]);
                await combat.startCombat();
                const {card} = await api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan: await api.compile(fixture.spell), targets: [recipientToken], castRank: 3, dc: 24, skipConfirmation: true});
                await finalize(card, ['criticalFailure']); const state = card.getFlag(NS, 'basicSaveState');
                await combat.nextTurn(); await api.ongoing.reconcile({clockEvent: true});
                assert(recipient.hasCondition('enfeebled'), 'Rider survives recipient turn');
                await combat.nextTurn(); await api.ongoing.reconcile({clockEvent: true});
                assert(!recipient.hasCondition('enfeebled'), 'Rider ends at next caster turn');
                return {cardId: card.id, castId: state.castId, removal: game.pf2e.settings.automation.removeEffects};
            } finally {
                await combat.delete(); if (previous) await game.combats.get(previous)?.activate();
            }
        })],
        ['removal-off', 'Set removal OFF for expiry test, then reload', () => record('removal-off', async () => {
            saved.originalRemoval ??= game.settings.get('pf2e', 'automation.removeExpiredEffects');
            await game.settings.set('pf2e', 'automation.removeExpiredEffects', false); return {reloadRequired: true};
        })],
        ['removal-restore', 'Restore original removal setting, then reload', () => record('removal-restored', async () => {
            assert(saved.originalRemoval != null, 'Original setting recorded.');
            await game.settings.set('pf2e', 'automation.removeExpiredEffects', saved.originalRemoval); return {restored: saved.originalRemoval, reloadRequired: true};
        })],
        ['riders', 'Verify Void Warp and Entreat the Many native outcomes', () => record('basic-condition-riders', async () => {
            const output = [];
            for (const name of ['Void Warp', 'Entreat the Many']) {
                const fixture = await setup(name), degreeList = ['criticalSuccess', 'success', 'failure', 'criticalFailure'];
                for (const degree of degreeList) {
                    const recipient = await actor(`${name} ${degree}`), card = await cast(fixture, [recipient], [degree], name === 'Void Warp' ? 3 : 7);
                    const state = card.getFlag(NS, 'basicSaveState'), slug = name === 'Void Warp' ? 'enfeebled' : 'prone';
                    assert(recipient.hasCondition(slug) === (degree === 'criticalFailure'), `${name}: condition only on critical failure`);
                    if (degree !== 'criticalSuccess') assert(recipient.hitPoints.value < 500, 'Native scaled damage applied');
                    if (degree !== 'criticalSuccess') {
                        assert(state.damage.formula.startsWith(name === 'Void Warp' ? '4d4' : '9d8'), 'Native formula matches the tested heightened rank');
                        assert(500 - recipient.hitPoints.value === Math.floor(state.damage.total * ({success: .5, failure: 1, criticalFailure: 2}[degree])), 'Exact basic-save multiplier applied');
                    }
                    if (name === 'Void Warp' && degree === 'criticalFailure') {
                        const effect = await fromUuid(state.targets[0].effectUuids[0]);
                        assert(effect.system.duration.value === 1 && effect.system.duration.unit === 'rounds' && effect.system.context.origin.actor === fixture.caster.uuid, 'Next caster turn duration');
                        saved.cases.timing = {castId: state.castId, actorUuid: recipient.uuid, casterUuid: fixture.caster.uuid,
                            casterTokenUuid: fixture.casterToken.uuid, targetTokenUuid: state.targets[0].tokenUuid, effectUuid: effect.uuid};
                    }
                    output.push({name, degree, cardId: card.id, castId: state.castId, formula: state.damage.formula, damage: 500 - recipient.hitPoints.value});
                }
            }
            return output;
        })],
        ['ranks', 'Verify every legal rank for the four newly enabled spells', () => record('legal-rank-matrix', async () => {
            const output = [];
            for (const [name, base, formula, slug, severity] of [
                ['Scramble Body', 1, null, 'sickened', 2],
                ['Divine Wrath', 4, rank => `${rank}d10`, 'sickened', 2],
                ['Void Warp', 1, rank => `${rank + 1}d4`, 'enfeebled', 1],
                ['Entreat the Many', 6, rank => `${rank + 2}d8`, 'prone', null]
            ]) {
                const fixture = await setup(name);
                for (let rank = base; rank <= 10; rank++) {
                    const recipient = await actor(`${name} rank ${rank}`), card = await cast(fixture, [recipient], ['criticalFailure'], rank);
                    const state = card.getFlag(NS, 'basicSaveState');
                    assert(state.castRank === rank, 'Saved rank matches selected rank');
                    assert(recipient.hasCondition(slug), 'Native condition exists at legal rank');
                    if (severity != null) assert(recipient.getCondition(slug).value === severity, 'Condition value is not accidentally heightened');
                    if (formula) assert(state.damage.formula.startsWith(formula(rank)), `Rank ${rank} native damage scaling`);
                    if (name === 'Scramble Body' || name === 'Divine Wrath') {
                        assert(get(state.castId).entries.some(entry => entry.metadata.linkedTo?.rootGrantId), 'Exact dependency persisted at every rank');
                        await retch(state.castId, 'criticalSuccess');
                        assert(!recipient.hasCondition('slowed') && !recipient.hasCondition('sickened'), 'Recovery clears this rank’s linked effects');
                    }
                    output.push({name, rank, cardId: card.id, castId: state.castId, formula: state.damage.formula});
                }
            }
            return output;
        })],
        ['cleanup', 'Remove only this harness’s disposable fixtures', () => record('cleanup', async () => {
            const actors = saved.actors.map(id => game.actors.get(id)).filter(actor => actor?.getFlag(NS, 'generalRulesFixture'));
            const ids = new Set(actors.map(actor => actor.id)), uuids = new Set(actors.map(actor => actor.uuid));
            const records = api.ongoing.records().filter(record => uuids.has(record.sourceActorUuid));
            for (const record of records) await game.journal.get(record.journalId)?.update({[`flags.${NS}.ongoingCast.status`]: 'ended'});
            for (const scene of game.scenes) {
                const tokenIds = scene.tokens.filter(token => ids.has(token.actorId)).map(token => token.id);
                if (tokenIds.length) await scene.deleteEmbeddedDocuments('Token', tokenIds);
            }
            if (ids.size) await Actor.deleteDocuments([...ids], {[NS]: {ongoingCleanup: true}});
            for (const record of records) await game.journal.get(record.journalId)?.delete();
            saved.actors = []; return {actorsRemoved: ids.size, journalsRemoved: records.length, preserved: 'Other actors, roles, ownership, settings, chat and macro evidence'};
        })],
        ['report', 'Show general rules evidence', () => show(saved)]
    ];
    new foundry.applications.api.DialogV2({window: {title: 'General rules verification'}, position: {width: 720},
        content: '<p>Explicit pftest fixtures only. Reload clients after module changes. Native rolls are finalized with explicit GM degree corrections.</p>',
        buttons: actions.map(([action, label, callback]) => ({action, label, callback}))}).render(true);
}
