/** Map the next occurrence of an explicit turn boundary to PF2e's round clock. */
export function nativeConditionTiming(duration, cast, sourceActorUuid, targetActorUuid) {
    // "until the end of the current creature's turn": the creature whose turn it is when the spell is cast (out of combat, a round).
    if(duration.anchor==='current-turn'){
        const current=cast?.started&&Array.isArray(cast.turnActors)?cast.turnActors[cast.turn]:null;
        return{...duration,value:current?0:1,originActorUuid:current??sourceActorUuid};
    }
    const originActorUuid=duration.anchor==='target-turn'?targetActorUuid:sourceActorUuid;
    let value=duration.value;
    if(duration.unit==='rounds'&&duration.value===1&&(duration.offset===0||duration.offset===1)
        && ['source-turn','target-turn'].includes(duration.anchor)&&cast.started
        && Array.isArray(cast.turnActors)) {
        const positions=cast.turnActors.flatMap((uuid,index)=>uuid===originActorUuid?[index]:[]);
        if(positions.length!==1)throw Error('The condition turn anchor is ambiguous. Review the combatant before applying.');
        // "until the end of its turn" (offset 0, turn end) applied during that creature's own turn ends with this turn; a turn
        // start (already passed) or "its next turn" (offset 1) is next round's.
        value=(duration.offset===0&&duration.expiry==='turn-end'?positions[0]>=cast.turn:positions[0]>cast.turn)?0:1;
    }
    return{...duration,value,originActorUuid};
}
