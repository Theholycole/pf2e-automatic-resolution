// Explicit disposable-world checks for generalized basic-save degree riders.
// Spell names select fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase23RiderVerification', FIXTURE = 'phase23RiderFixture';
const assert = (value, message) => { if (!value) throw Error(message); };
const degrees = ['criticalSuccess', 'success', 'failure', 'criticalFailure'];

function store() {
    const saved = game.user.getFlag(NS, KEY) ?? {results: [], actors: []};
    return {saved, persist: () => game.user.setFlag(NS, KEY, saved)};
}

async function context() {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const {saved, persist} = store();
    const actor = async (name, {level = 5, traits = ['humanoid'], save = 10} = {}) => {
        const document = await Actor.create({name: `PFTEST P23 Rider ${name}`, type: 'npc', flags: {[NS]: {[FIXTURE]: true}},
            system: {details: {level: {value: level}}, attributes: {hp: {value: 500, max: 500}, ac: {value: 20}},
                saves: {fortitude: {value: save}, reflex: {value: save}, will: {value: save}}, traits: {value: traits}}});
        saved.actors.push(document.id); await persist(); return document;
    };
    const token = async actor => (await canvas.scene.createEmbeddedDocuments('Token', [{...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x: 1600, y: 1600}]))[0];
    const setup = async name => {
        const pack = game.packs.get('pf2e.spells-srd'), row = (await pack.getIndex()).find(item => item.name === name);
        const source = (await pack.getDocument(row._id)).toObject(); delete source._id;
        const caster = await actor(`${name} caster`, {level: Math.max(1, source.system.level.value * 2 - 1)});
        // Fixtures default to the opposition; enemy-only spells need the caster on the other side.
        await caster.update({'system.details.alliance': 'party'});
        await token(caster);
        const [entry] = await caster.createEmbeddedDocuments('Item', [{name: 'General rules casting', type: 'spellcastingEntry',
            system: {tradition: {value: 'occult'}, prepared: {value: 'innate'}, spelldc: {dc: 24, value: 14}}}]);
        source.system.location = {value: entry.id};
        const [spell] = await caster.createEmbeddedDocuments('Item', [source]);
        return {caster, spell};
    };
    const state = card => game.messages.get(card.id).getFlag(NS, 'basicSaveState');
    const cast = async (fixture, targets, chosen, confirm = null) => {
        const plan = await api.compile(fixture.spell);
        assert(api.saves.supports(plan), `${fixture.spell.name}: executable save plan`);
        const {card} = await api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan, targets, castRank: fixture.spell.rank, dc: 24, skipConfirmation: true});
        for (const [index, target] of state(card).targets.entries()) {
            if (confirm) await api.saves.correctTarget(card, target.id, {action: confirm[index], expectedRevision: target.revision});
            const fresh = state(card).targets[index];
            if (fresh.eligible === false) continue;
            await api.saves.rollSave(card, fresh.id, {skipDialog: true});
            await api.saves.correctTarget(card, fresh.id, {action: 'degree', degree: chosen[index]});
        }
        await api.saves.finalize(card);
        return card;
    };
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); return result;
    };
    return {api, saved, persist, actor, token, setup, state, cast, record};
}

export const cases = {
    async environment() {
        return {foundry: game.version, pf2e: game.system.version, module: game.modules.get(NS).version, world: game.world.id,
            modules: [...game.modules.values()].filter(m => m.active).map(m => m.id)};
    },
    async torturousTrauma(ctx) {
        const fixture = await ctx.setup('Torturous Trauma');
        const recipients = await Promise.all([...degrees, 'no organs'].map(label => ctx.actor(`trauma ${label}`)));
        const card = await ctx.cast(fixture, await Promise.all(recipients.map(ctx.token)), [...degrees, 'criticalFailure'],
            ['affected', 'affected', 'affected', 'affected', 'unaffected']);
        const s = ctx.state(card), out = [];
        for (const [index, degree] of degrees.entries()) {
            const actor = recipients[index];
            const fatigued = actor.hasCondition('fatigued');
            assert(fatigued === (degree === 'criticalFailure'), `${degree}: Fatigued only on a critical failure`);
            if (fatigued) {
                const effect = actor.items.find(item => item.type === 'effect' && item.name.includes('Fatigued'));
                assert(effect.system.duration.unit === 'rounds' && effect.system.duration.expiry === 'turn-start', 'Until the start of the caster’s next turn');
            }
            out.push({degree, hpLost: 500 - actor.hitPoints.value, fatigued});
        }
        assert(recipients[4].hitPoints.value === 500 && !recipients[4].hasCondition('fatigued') && s.targets[4].confirmation.status === 'immune', 'Confirmed creature without organs is unaffected');
        return out;
    },
    async vomitSwarm(ctx) {
        const fixture = await ctx.setup('Vomit Swarm');
        const recipients = await Promise.all(degrees.map(degree => ctx.actor(`swarm ${degree}`)));
        const card = await ctx.cast(fixture, await Promise.all(recipients.map(ctx.token)), degrees);
        const out = degrees.map((degree, index) => ({degree, sickened: recipients[index].getCondition('sickened')?.value ?? 0, hpLost: 500 - recipients[index].hitPoints.value}));
        assert(out.map(o => o.sickened).join() === '0,0,1,1', `Sickened 1 on failure and critical failure, got ${out.map(o => o.sickened)}`);
        await ctx.api.ongoing.open(); await new Promise(r => setTimeout(r, 800));
        const retch = [...document.querySelectorAll('[data-ongoing-index]')].some(button => button.textContent.includes('swarm failure: Retch'));
        for (const app of foundry.applications.instances.values()) if (/Ongoing spells/.test(app.title ?? '')) await app.close();
        assert(retch, 'Native Sickened recovery (Retch) is offered');
        return {out, retch, cardId: card.id};
    },
    // Option B: timed Stunned is a named, timed Effect with no action-debt recovery.
    async timedStunned(ctx) {
        assert(!game.combat?.started, 'No combat during world-time checks');
        const out = [];
        for (const [name, degree] of [['Synaptic Pulse', 'criticalFailure'], ['Pain of Ages', 'criticalFailure'], ['Dizzying Colors', 'criticalFailure']]) {
            const fixture = await ctx.setup(name);
            const target = await ctx.actor(`${name} timed stunned`);
            await ctx.cast(fixture, [await ctx.token(target)], [degree]);
            const effect = target.items.find(item => item.type === 'effect' && /Stunned \(can't act for 1 round\)/.test(item.name));
            assert(effect && target.hasCondition('stunned'), `${name}: named timed Stunned Effect`);
            const meta = effect.flags[NS].outcomeEffect.conditions.find(c => c.slug === 'stunned');
            assert(!meta.recovery, `${name}: no action-debt recovery`);
            assert(effect.system.duration.value === 1 && effect.system.duration.unit === 'rounds', `${name}: 1-round timer`);
            await game.time.advance(7); await ctx.api.ongoing.reconcile({clockEvent: true}); await new Promise(r => setTimeout(r, 500));
            assert(!target.hasCondition('stunned'), `${name}: Stunned ends with its timer`);
            out.push({name, effect: effect.name, remainingConditions: target.itemTypes.condition.map(c => c.slug)});
        }
        const valued = await ctx.setup('Synaptic Pulse');
        const t2 = await ctx.actor('valued stunned');
        await ctx.cast(valued, [await ctx.token(t2)], ['failure']);
        const meta = t2.items.find(item => item.type === 'effect' && item.flags?.[NS]?.outcomeEffect)?.flags[NS].outcomeEffect.conditions[0];
        assert(t2.getCondition('stunned')?.value === 2 && meta.recovery === 'stunned-actions', 'Valued Stunned 2 still uses action-debt recovery');
        out.push({valued: t2.getCondition('stunned')?.value, recovery: meta.recovery});
        return out;
    },
    // Trait-defined degree shift: rolled degree is kept, the effective degree is shifted for water/plant only.
    async grittyWheeze(ctx) {
        const fixture = await ctx.setup('Gritty Wheeze');
        const plant = await ctx.actor('wheeze plant', {traits: ['plant']}), human = await ctx.actor('wheeze humanoid');
        const plan = await ctx.api.compile(fixture.spell);
        assert(ctx.api.saves.supports(plan), 'executable');
        const {card} = await ctx.api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan, targets: [await ctx.token(plant), await ctx.token(human)], castRank: fixture.spell.rank, dc: 24, skipConfirmation: true});
        for (const target of ctx.state(card).targets) await ctx.api.saves.rollSave(card, target.id, {skipDialog: true});
        const s = ctx.state(card), WORSE = {criticalSuccess: 'success', success: 'failure', failure: 'criticalFailure', criticalFailure: 'criticalFailure'};
        const [p, h] = s.targets;
        assert(p.degreeAdjustment?.status === 'applies' && p.degree === WORSE[p.rolledDegree], `plant shifted: ${p.rolledDegree} -> ${p.degree}`);
        assert(h.degreeAdjustment?.status === 'not-applicable' && h.degree === h.rolledDegree, `humanoid unshifted: ${h.rolledDegree} -> ${h.degree}`);
        const note = document.querySelector(`[data-message-id="${card.id}"]`)?.textContent.includes('Spell rule:');
        await ctx.api.saves.finalize(card);
        const dazzled = actor => actor.hasCondition('dazzled');
        assert(dazzled(plant) === ['failure', 'criticalFailure'].includes(p.degree), 'plant Dazzled follows the shifted degree');
        assert(dazzled(human) === ['failure', 'criticalFailure'].includes(h.degree), 'humanoid Dazzled follows the rolled degree');
        return {plant: {rolled: p.rolledDegree, effective: p.degree, dazzled: dazzled(plant)}, humanoid: {rolled: h.rolledDegree, effective: h.degree, dazzled: dazzled(human)}, cardNote: note};
    },
    // Described population: the GM answers per target, and Finalize waits for the answer.
    async spiritualAnamnesis(ctx) {
        const core = await import(`/modules/${NS}/scripts/basic-save-core.js?v=${Date.now()}`);
        const fixture = await ctx.setup('Spiritual Anamnesis');
        // Will +7 against DC 24: a d20 of 7-16 is a failure, the row the map shifts.
        const yes = await ctx.actor('anamnesis possessed', {save: 7}), no = await ctx.actor('anamnesis ordinary', {save: 7});
        const plan = await ctx.api.compile(fixture.spell);
        const {card} = await ctx.api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan, targets: [await ctx.token(yes), await ctx.token(no)], castRank: fixture.spell.rank, dc: 24, skipConfirmation: true});
        for (const target of ctx.state(card).targets) await ctx.api.saves.rollSave(card, target.id, {skipDialog: true});
        const before = core.saveCollectionReadiness(ctx.state(card));
        assert(!before.ready, 'Finalize waits for the GM answer');
        const [a, b] = ctx.state(card).targets;
        await ctx.api.saves.correctTarget(card, a.id, {action: 'adjustment-applies', expectedRevision: a.revision});
        await ctx.api.saves.correctTarget(card, b.id, {action: 'adjustment-not-applicable', expectedRevision: b.revision});
        const s = ctx.state(card), MAP = {criticalSuccess: 'success', success: 'success', failure: 'criticalFailure', criticalFailure: 'criticalFailure'};
        assert(core.saveCollectionReadiness(s).ready, 'ready after answers');
        assert(s.targets[0].degree === MAP[s.targets[0].rolledDegree], 'confirmed target uses the explicit map');
        assert(s.targets[1].degree === s.targets[1].rolledDegree, 'declined target keeps its roll');
        await ctx.api.saves.finalize(card);
        const stunned = actor => actor.getCondition('stunned')?.value ?? 0;
        for (const [index, actor] of [yes, no].entries()) {
            const degree = s.targets[index].degree;
            // Stunned overrides Slowed in PF2e, so check the granted item rather than the active flag.
            assert(actor.itemTypes.condition.some(c => c.slug === 'slowed') === (degree !== 'criticalSuccess'), `${actor.name}: Slowed follows ${degree}`);
            assert(stunned(actor) === (degree === 'criticalFailure' ? 3 : 0), `${actor.name}: Stunned 3 only on ${degree}`);
        }
        return {blockedBefore: before, targets: s.targets.map((t, i) => ({answer: t.degreeAdjustment.status, rolled: t.rolledDegree, effective: t.degree, slowed: [yes, no][i].itemTypes.condition.some(c => c.slug === 'slowed'), slowedActive: [yes, no][i].hasCondition('slowed'), stunned: stunned([yes, no][i])}))};
    },
    async cleanup(ctx) {
        const actors = ctx.saved.actors.map(id => game.actors.get(id)).filter(a => a?.getFlag(NS, FIXTURE));
        const ids = new Set(actors.map(a => a.id)), uuids = new Set(actors.map(a => a.uuid));
        const records = ctx.api.ongoing.records().filter(r => uuids.has(r.sourceActorUuid));
        for (const r of records) await game.journal.get(r.journalId)?.update({[`flags.${NS}.ongoingCast.status`]: 'ended'});
        for (const scene of game.scenes) {
            const tokens = scene.tokens.filter(t => ids.has(t.actorId)).map(t => t.id);
            if (tokens.length) await scene.deleteEmbeddedDocuments('Token', tokens);
        }
        if (ids.size) await Actor.deleteDocuments([...ids], {[NS]: {ongoingCleanup: true}});
        for (const r of records) await game.journal.get(r.journalId)?.delete();
        ctx.saved.actors = []; await ctx.persist();
        return {actorsRemoved: ids.size, journalsRemoved: records.length, remainingFixtureActors: game.actors.filter(a => a.getFlag(NS, FIXTURE)).length};
    }
};

export async function runCase(name) {
    const ctx = await context();
    assert(cases[name], `Unknown case ${name}`);
    return await ctx.record(name, () => cases[name](ctx));
}
export function results() { return store().saved; }
export async function reset() { const {saved, persist} = store(); saved.results = []; await persist(); return saved; }
