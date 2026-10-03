import { MODULE_ID } from './effect-runtime.js';
import { clone } from './runtime-utils.js';
import { ONGOING_FLAG, turnAdvance, boundaryKey, addObligation } from './ongoing-core.js';

// A condition that grows as each of its creature's turns begins (Coral Scourge's clumsy): "Each round at the beginning of its turn, the target becomes
// clumsy 1 or increases its clumsy condition by 1, to a maximum of 4. … If the target's clumsy condition … reaches 4, … the target becomes Paralyzed."
// The Effect's granted condition is raised by the step (to the maximum); at the maximum the further condition is granted by its own Effect for the rest of
// the cast. A critical failure's Interact lowers it by 1, and at 0 the Effect stays without its condition (the next turn grants it at 1 again).

const state = journal => journal.getFlag(MODULE_ID, ONGOING_FLAG);

/** The Effect's granted condition (by its rule flag), or null when it's at 0. */
export function grownCondition(effect) {
    const ruleFlag = effect?.flags?.[MODULE_ID]?.outcomeEffect?.conditions?.[0]?.ruleFlag;
    const id = ruleFlag ? effect.flags?.pf2e?.itemGrants?.[ruleFlag]?.id : null;
    return id ? effect.actor?.items.get(id) ?? null : null;
}

/** Set the grown condition's value: the rule's badge value, the condition (re-granted at 0 → n), or removed at 0 without ending the Effect. */
export async function setGrownValue(effect, value, cast) {
    const metadata = effect.flags[MODULE_ID].outcomeEffect, ruleFlag = metadata.conditions[0].ruleFlag, slug = metadata.conditions[0].slug;
    const rules = clone(effect._source.system.rules), rule = rules.find(r => r.key === 'GrantItem' && r.flag === ruleFlag);
    const alteration = rule?.alterations?.find(a => a.property === 'badge-value');
    if (!rule || !alteration) throw Error(`${effect.name}: its granted ${slug} rule is missing.`);
    const condition = grownCondition(effect);
    const label = `${slug[0].toUpperCase()}${slug.slice(1)}`;
    if (value <= 0) {
        // "decreasing the clumsy condition to 0 doesn't end the spell": the condition goes, the Effect (and the cast) stays.
        // (PF2e would end the Effect with its granted condition — the rule's own "grantee: cascade" — so the rule detaches first.)
        // The grant is unlinked on both sides before the condition goes (as the module's own lowering, not a removed grant that ends its Effect).
        rule.onDeleteActions = { ...(rule.onDeleteActions ?? {}), grantee: 'detach' };
        await effect.update({ 'system.rules': rules, name: `${cast}: ${label} 0 (growths remain)`, [`flags.pf2e.itemGrants.-=${ruleFlag}`]: null });
        if (condition) { await condition.update({ 'flags.pf2e.-=grantedBy': null }); await condition.delete({ [MODULE_ID]: { ongoingCleanup: true, reason: 'growth-lowered' } }); }
        return;
    }
    alteration.value = value;
    await effect.update({ 'system.rules': rules, name: `${cast}: ${label} ${value} (ends on Interact)` });
    if (condition) { await condition.update({ 'system.value.value': value }); return; }
    const source = (await fromUuid(rule.uuid))?.toObject();
    if (!source) throw Error(`PF2e condition ${slug} is unavailable.`);
    delete source._id;
    source.system.value.value = value;
    source.flags = { ...(source.flags ?? {}), pf2e: { ...(source.flags?.pf2e ?? {}), grantedBy: { id: effect.id, onDelete: 'cascade' } } };
    const [created] = await effect.actor.createEmbeddedDocuments('Item', [source]);
    await effect.update({ [`flags.pf2e.itemGrants.${ruleFlag}`]: { id: created.id, onDelete: 'cascade' } });
}

/** Returns true when the record went to review. */
export async function reconcileConditionGrowth(ongoing, journal, { previousClock, clockEvent = false, recover = false } = {}) {
    const record = clone(state(journal));
    const tracked = record.entries.filter(entry => entry.status === 'active' && !entry.detached && entry.metadata?.growth);
    if (!tracked.length) return false;
    const clock = ongoing.clock(), advance = turnAdvance(previousClock, clock);
    if ((clockEvent || recover) && previousClock?.started && !['same', 'next'].includes(advance)) {
        await ongoing.review(journal, 'Turn order changed. Review the missed growth; none was replayed.', { resumable: true });
        return true;
    }
    if (advance === 'next') for (const entry of tracked.filter(entry => entry.actorUuid === clock.actorUuid)) {
        const key = boundaryKey(clock, entry.uuid, 'condition-growth');
        const fresh = clone(state(journal));
        if (fresh.obligations.some(o => o.key === key)) continue;
        const effect = await fromUuid(entry.uuid);
        if (!effect) continue;
        // (At most once a turn: recorded before it's applied.)
        addObligation(fresh, { key, kind: 'condition-growth', status: 'completed' });
        await ongoing.save(journal, fresh);
        const growth = entry.metadata.growth, current = Number(grownCondition(effect)?.value ?? 0);
        const next = Math.min(growth.maximum, current + growth.step);
        if (next !== current) await setGrownValue(effect, next, record.name);
        if (next === growth.maximum && growth.atMaximum && !effect.flags[MODULE_ID]?.growthMaximum) {
            await effect.update({ [`flags.${MODULE_ID}.growthMaximum`]: true });
            const [further] = await effect.actor.createEmbeddedDocuments('Item', [{ name: `${record.name}: ${growth.atMaximum.name}`, type: 'effect', img: 'icons/svg/paralysis.svg',
                flags: { [MODULE_ID]: { outcomeEffect: { castId: record.castId, sourceActorUuid: record.sourceActorUuid, sourceItemUuid: record.sourceItemUuid, sourceItemName: record.name,
                    conditions: [{ slug: growth.atMaximum.slug, label: growth.atMaximum.name, ruleFlag: 'growthMaximum' }] } } },
                system: { description: { value: `<p>${growth.atMaximum.name} from <strong>${record.name}</strong>: its ${entry.metadata.conditions?.[0]?.slug ?? 'condition'} reached ${growth.maximum}. Lasts until the spell ends.</p>` },
                    duration: { value: -1, unit: 'unlimited', expiry: null, sustained: false }, fromSpell: true, level: { value: Number(record.rank ?? 1) },
                    start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                    rules: [{ key: 'GrantItem', uuid: growth.atMaximum.uuid, flag: 'growthMaximum', onDeleteActions: { grantee: 'cascade' } }] } }]);
            await ongoing.attach(journal, further);
        }
    }
    // (The turn this record has seen, for the next boundary.)
    const seen = clone(state(journal));
    seen.clock = clock; seen.lastWorldTime = clock.worldTime;
    await ongoing.save(journal, seen);
    return false;
}

/** Remove one condition an Effect grants (by its rule flag), keeping the Effect and its other grants: unlinked on both sides first. */
export async function removeGrant(effect, ruleFlag) {
    const rules = clone(effect._source.system.rules), rule = rules.find(r => r.key === 'GrantItem' && r.flag === ruleFlag);
    const id = effect.flags?.pf2e?.itemGrants?.[ruleFlag]?.id, condition = id ? effect.actor?.items.get(id) : null;
    if (!rule) throw Error(`${effect.name}: its granted condition's rule is missing.`);
    rule.onDeleteActions = { ...(rule.onDeleteActions ?? {}), grantee: 'detach' };
    await effect.update({ 'system.rules': rules, [`flags.pf2e.itemGrants.-=${ruleFlag}`]: null });
    if (condition) { await condition.update({ 'flags.pf2e.-=grantedBy': null }); await condition.delete({ [MODULE_ID]: { ongoingCleanup: true, reason: 'condition-saved' } }); }
}
