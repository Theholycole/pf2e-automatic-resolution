// Explicit disposable-world checks for self-help endings (Interact, Escape
// phrasing), GM-confirmed creature-state eligibility and conjunctive "while".
// Spell names select fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase23SelfHelpVerification', FIXTURE = 'phase23SelfHelpFixture';
const assert = (value, message) => { if (!value) throw Error(message); };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function store() {
    const saved = game.user.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    return {saved, persist: () => game.user.setFlag(NS, KEY, saved)};
}

async function context() {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const {saved, persist} = store();
    const actor = async (name, {level = 5, traits = ['humanoid']} = {}) => {
        const document = await Actor.create({name: `PFTEST P23 SelfHelp ${name}`, type: 'npc', flags: {[NS]: {[FIXTURE]: true}},
            system: {details: {level: {value: level}}, attributes: {hp: {value: 500, max: 500}, ac: {value: 20}},
                saves: {fortitude: {value: 10}, reflex: {value: 10}, will: {value: 10}}, traits: {value: traits}}});
        saved.actors.push(document.id); await persist(); return document;
    };
    const token = async actor => (await canvas.scene.createEmbeddedDocuments('Token', [{...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x: 1500, y: 1500}]))[0];
    const setup = async name => {
        const pack = game.packs.get('pf2e.spells-srd'), row = (await pack.getIndex()).find(item => item.name === name);
        assert(row, `Missing native fixture ${name}`);
        const source = (await pack.getDocument(row._id)).toObject(); delete source._id;
        const caster = await actor(`${name} caster`, {level: source.system.level.value * 2 - 1});
        await token(caster);
        const [entry] = await caster.createEmbeddedDocuments('Item', [{name: 'General rules casting', type: 'spellcastingEntry',
            system: {tradition: {value: 'occult'}, prepared: {value: 'innate'}, spelldc: {dc: 24, value: 14}}}]);
        source.system.location = {value: entry.id};
        const [spell] = await caster.createEmbeddedDocuments('Item', [source]);
        return {caster, spell};
    };
    const state = card => game.messages.get(card.id).getFlag(NS, 'basicSaveState');
    const start = async (fixture, targets) => {
        const plan = await api.compile(fixture.spell);
        assert(api.saves.supports(plan), `${fixture.spell.name}: executable save plan`);
        return (await api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan, targets, castRank: fixture.spell.rank, dc: 24, skipConfirmation: true})).card;
    };
    const roll = async (card, chosen) => {
        for (const [index, target] of state(card).targets.entries()) {
            if (target.eligible === false) continue;
            await api.saves.rollSave(card, target.id, {skipDialog: true});
            await api.saves.correctTarget(card, target.id, {action: 'degree', degree: chosen[index] ?? chosen[0]});
        }
    };
    const cast = async (fixture, targets, chosen) => { const card = await start(fixture, targets); await roll(card, chosen); await api.saves.finalize(card); return card; };
    const effects = actor => actor.items.filter(item => item.type === 'effect' && item.flags?.[NS]?.outcomeEffect);
    // PF2e Blinded overrides Dazzled: the granted Dazzled exists but is inactive.
    const granted = (actor, slug) => actor.itemTypes.condition.some(condition => condition.slug === slug);
    const interactEffect = actor => effects(actor).find(item => item.flags[NS].outcomeEffect.actionEnd);
    // Confirm the Ongoing spells panel offers the bearer's control, then invoke
    // the same request its callback makes. (A real mouse click on this control
    // is verified separately; synthetic clicks race the panel's re-render.)
    const clickPanel = async (labelPart, actor) => {
        await api.ongoing.open(); await wait(800);
        const button = [...document.querySelectorAll('[data-ongoing-index]')].find(candidate => candidate.textContent.includes(labelPart));
        assert(button, `Panel control "${labelPart}" is offered`);
        for (const app of foundry.applications.instances.values()) if (/Ongoing spells/.test(app.title ?? '')) await app.close();
        const effect = interactEffect(actor);
        const record = api.ongoing.records().find(r => r.castId === effect.flags[NS].outcomeEffect.castId);
        await api.ongoing.request('action-end', {castId: record.castId, uuid: effect.uuid}); await wait(500);
    };
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); return result;
    };
    return {api, saved, persist, actor, token, setup, state, start, roll, cast, effects, granted, interactEffect, clickPanel, record};
}

export const cases = {
    async environment() {
        return {foundry: game.version, pf2e: game.system.version, module: game.modules.get(NS).version, world: game.world.id,
            modules: [...game.modules.values()].filter(m => m.active).map(m => m.id), removal: game.pf2e.settings.automation.removeEffects};
    },
    async dazzlingFlash(ctx) {
        const fixture = await ctx.setup('Dazzling Flash');
        const [failed, critical] = [await ctx.actor('flash failure'), await ctx.actor('flash critical')];
        await ctx.cast(fixture, [await ctx.token(failed), await ctx.token(critical)], ['failure', 'criticalFailure']);
        assert(failed.hasCondition('blinded') && ctx.granted(failed, 'dazzled') && critical.hasCondition('blinded'), 'Both blinded and (overridden) dazzled');
        assert(ctx.interactEffect(failed) && !ctx.interactEffect(critical), 'Only the failure offers Interact');
        await ctx.clickPanel(`${failed.name}: Interact to end Blinded`, failed);
        assert(!failed.hasCondition('blinded') && failed.hasCondition('dazzled'), 'Interact ended Blinded only; Dazzled remains and is now active');
        assert(critical.hasCondition('blinded'), 'The critical failure keeps its Blinded');
        return {failedEffects: ctx.effects(failed).map(e => e.name), criticalEffects: ctx.effects(critical).map(e => e.name)};
    },
    async slimeSpit(ctx) {
        const fixture = await ctx.setup('Slime Spit');
        const out = {};
        for (const degree of ['success', 'criticalFailure']) {
            const target = await ctx.actor(`spit ${degree}`);
            await ctx.cast(fixture, [await ctx.token(target)], [degree]);
            const effect = ctx.interactEffect(target);
            assert(effect && ctx.granted(target, 'dazzled'), `${degree}: dazzled ends on Interact`);
            out[degree] = {duration: effect.system.duration, blinded: target.hasCondition('blinded')};
            if (degree === 'criticalFailure') assert(effect.system.duration.unit === 'unlimited' && target.hasCondition('blinded'), 'Critical failure: dazzled until Interact, blinded 1 round');
            await ctx.clickPanel(`${target.name}: Interact to end Dazzled`, target);
            assert(!ctx.granted(target, 'dazzled'), `${degree}: Interact removed dazzled`);
            if (degree === 'criticalFailure') assert(target.hasCondition('blinded'), 'Blinded is not ended by wiping the eyes');
        }
        return out;
    },
    async graspOfTheDeep(ctx) {
        const fixture = await ctx.setup('Grasp of the Deep');
        const target = await ctx.actor('grasp failure');
        await ctx.cast(fixture, [await ctx.token(target)], ['failure']);
        const restraint = ctx.effects(target).find(e => e.flags[NS].outcomeEffect.escape);
        assert(restraint && target.hasCondition('grabbed') && restraint.system.duration.value === 1 && restraint.system.duration.unit === 'minutes', 'Grabbed for the 1-minute spell or until Escape');
        const roll = await new Roll('24').evaluate();
        const message = await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: target}), rolls: [roll], content: 'PFTEST scripted Escape 24',
            flags: {pf2e: {context: {type: 'skill-check', options: ['action:escape'], origin: {actor: target.uuid}}}}});
        await wait(800);
        const card = game.messages.contents.find(m => m.flags?.[NS]?.escapeTermination?.checkMessageId === message.id);
        assert(card, 'A successful Escape posts the review card');
        await ctx.api.escape.end(card, card.flags[NS].escapeTermination.entries[0].id);
        assert(!target.hasCondition('grabbed'), 'Escape ended Grabbed');
        return {duration: restraint.system.duration};
    },
    async boilBlood(ctx) {
        const fixture = await ctx.setup('Boil Blood');
        const [bloody, bloodless] = [await ctx.actor('boil vampire', {traits: ['undead']}), await ctx.actor('boil golem', {traits: ['construct']})];
        const card = await ctx.start(fixture, [await ctx.token(bloody), await ctx.token(bloodless)]);
        assert(ctx.state(card).targets.every(t => t.confirmation?.status === 'pending' && t.eligible === true), 'Both await GM confirmation');
        await ctx.roll(card, ['failure', 'failure']);
        let refused = null; try { await ctx.api.saves.finalize(card); } catch (error) { refused = error.message; }
        assert(refused && bloody.hitPoints.value === 500 && bloodless.hitPoints.value === 500, 'Finalize refuses before confirmation');
        const [t1, t2] = ctx.state(card).targets;
        await ctx.api.saves.correctTarget(card, t1.id, {action: 'affected', expectedRevision: t1.revision});
        await ctx.api.saves.correctTarget(card, t2.id, {action: 'unaffected', expectedRevision: t2.revision});
        await ctx.api.saves.finalize(card);
        assert(bloody.hitPoints.value < 500 && bloody.getCondition('drained')?.value === 2, 'Confirmed creature with blood takes damage and Drained 2');
        assert(bloodless.hitPoints.value === 500 && !bloodless.hasCondition('drained'), 'Confirmed bloodless creature is immune');
        return {refused, confirmations: ctx.state(card).targets.map(t => t.confirmation)};
    },
    async reblooded(ctx) {
        const fixture = await ctx.setup('Reblooded');
        const [undead, living] = [await ctx.actor('reblooded undead', {traits: ['undead']}), await ctx.actor('reblooded living')];
        const card = await ctx.cast(fixture, [await ctx.token(undead), await ctx.token(living)], ['failure', 'failure']);
        const s = ctx.state(card);
        assert(s.targets[1].eligible === false && !living.hasCondition('clumsy'), 'Only an undead creature is a valid target');
        assert(undead.getCondition('clumsy')?.value === 1 && undead.itemTypes.condition.some(c => c.slug === 'persistent-damage'), 'Clumsy 1 and persistent acid on the undead');
        return {persistent: undead.itemTypes.condition.filter(c => c.slug === 'persistent-damage').map(c => c.system.persistent?.formula), clumsyEffect: ctx.effects(undead).map(e => e.system.duration)};
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
        assert(!game.actors.some(a => a.getFlag(NS, FIXTURE)), 'No self-help fixture actors remain');
        return {actorsRemoved: ids.size, journalsRemoved: records.length, remainingFixtureActors: 0};
    }
};

export async function runCase(name) {
    const ctx = await context();
    assert(cases[name], `Unknown case ${name}`);
    return await ctx.record(name, () => cases[name](ctx));
}
export function results() { return store().saved; }
export async function reset() { const {saved, persist} = store(); saved.results = []; saved.cases = {}; await persist(); return saved; }
