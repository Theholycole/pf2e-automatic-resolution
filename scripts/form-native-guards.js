import { MODULE_ID } from './effect-runtime.js';
export function activeManagedForm(actor) {
    if(!actor?.flags?.pf2e?.battleForm)return null;
    return actor?.items?.find(item => item.type === 'effect' && item.getFlag(MODULE_ID, 'formCastId') && !item.isExpired && item.system.rules.some(r => r.key === 'BattleForm'));
}
/** Scoped to module-managed forms; delegate unchanged actors to native methods. */
export function installFormGuards() {
    const classes=CONFIG.PF2E.Item.documentClasses;
    const builtins=game.pf2e.RuleElements.builtin, battle=builtins.BattleForm.prototype, onDelete=battle.onDelete;
    if(!onDelete.pf2eFormGuard){
        const wrapped=function(updates){
            if(this.item.getFlag(MODULE_ID,'formCastId'))new builtins.TempHP({key:'TempHP',value:1},{parent:this.item}).onDelete(updates);
            return onDelete.call(this,updates);
        };
        wrapped.pf2eFormGuard=true;battle.onDelete=wrapped;
    }
    const wrap=(prototype,name,guard)=>{
        const original=prototype[name];
        if(typeof original!=='function'||original.pf2eFormGuard)return;
        const wrapped=function(...args){guard(this,...args);return original.apply(this,args);};
        wrapped.pf2eFormGuard=true;prototype[name]=wrapped;
    };
    const character=CONFIG.PF2E.Actor.documentClasses.character.prototype;
    const prepare=character.prepareData;
    if(!prepare.pf2eFormGuard){
        const wrapped=function(...args){
            const result=prepare.apply(this,args), effect=activeManagedForm(this);
            const battle=effect?.rules.find(r=>r.key==='BattleForm'&&!r.ignored);
            if(battle){
                const allowed=new Set(Object.keys(battle.overrides.speeds));
                for(const rule of effect.rules)if(rule.key==='BaseSpeed'&&!rule.ignored&&rule.test())allowed.add(rule.selector);
                for(const type of ['land','burrow','climb','fly','swim'])if(!allowed.has(type))this.system.movement.speeds[type]=null;
            }
            return result;
        };
        wrapped.pf2eFormGuard=true;character.prepareData=wrapped;
    }
    wrap(classes.spellcastingEntry.prototype,'cast',entry=>{
        if(activeManagedForm(entry.actor))throw Error('This battle form prevents spellcasting. Dismiss it before casting. No resource was spent.');
    });
    wrap(classes.consumable.prototype,'consume',item=>{
        if(activeManagedForm(item.actor))throw Error('Gear is absorbed in this battle form; item activation is unavailable.');
    });
}
/** Item onCreate/onDelete dispatch native actor updates without awaiting them. */
export async function waitForNativeFormUpdate(actor, predicate, label, hookName = 'updateActor') {
    if(predicate())return;
    await new Promise((resolve,reject)=>{
        const finish=()=>{clearTimeout(timer);clearInterval(poll);Hooks.off(hookName,hook);resolve();};
        const check=()=>{if(predicate())finish();};
        const hook=Hooks.on(hookName,changed=>{if(changed.uuid===actor.uuid)queueMicrotask(check);});
        // Token animation may finish after updateToken, without another hook.
        const poll=setInterval(check,50);
        const timer=setTimeout(()=>{clearInterval(poll);Hooks.off(hookName,hook);predicate()?resolve():reject(Error(`${label} did not receive a confirmed native actor update. Review before retrying.`));},5000);
        check();
    });
}
