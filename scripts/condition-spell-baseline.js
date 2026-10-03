// Mechanics verified against installed PF2e 8.5.0 fixtures. Cosmetic item edits are allowed.
export const CONDITION_PROFILE_FIELDS = ['description','duration','defense','damage','heightening','traits','range','target','level','area','requirements','rules','time'];
function ordered(value) {
    if (Array.isArray(value)) return value.map(ordered);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key=>[key,ordered(value[key])]));
    return value;
}
export function conditionProfileMechanics(document) {
    const system=(document._source??document).system;
    return JSON.stringify(ordered(Object.fromEntries(CONDITION_PROFILE_FIELDS.map(key=>[key,key==='description'
        ? system.description.value.replace('Compendium.pf2e.spell-effects.Item.Spell Effect: Clinging Ice','Compendium.pf2e.spell-effects.Item.2sMXAGZfdqiy10kk').replace(/<hr\s*\/?\s*>/gi,'<hr>').replace(/\s+/g,' ').trim()
        : key==='traits' ? {otherTags:[],...system.traits}
        : system[key]??null]))));
}
export async function conditionProfileDigest(document) {
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(conditionProfileMechanics(document)));
    return Array.from(new Uint8Array(bytes),value=>value.toString(16).padStart(2,'0')).join('');
}
export const CONDITION_PROFILE_HASHES = {
    "evil-eye": "3bb28f4a8dc73cd2b77e5194611badb967071d0ea0c05c6c2cad450d9d33bf7a",
    "fear": "b6466816e60aea81dddcb6a575fbdd9145ab32ab02936a29141ce994de9f53c4",
    "clinging-ice": "402b68c3e602b47ccf1142e43b65e97f8a70b34ffbb52aa10058be44130f5a8a",
    "paralyze": "f23c41fb0e19721e4b307d64da13c1cef28086c6d19cb1ed9f8d7c07a5c0d58b"
};
export function clingingIceEffectMechanics(document) {
 const system=(document._source??document).system;
 return JSON.stringify(ordered({duration:system.duration,rules:system.rules}));
}
export const CLINGING_ICE_EFFECT_MECHANICS = "{\"duration\":{\"expiry\":\"turn-start\",\"sustained\":true,\"unit\":\"minutes\",\"value\":1},\"rules\":[{\"choices\":[{\"label\":\"PF2E.Check.Result.Degree.Check.failure\",\"value\":-5},{\"label\":\"PF2E.Check.Result.Degree.Check.criticalFailure\",\"value\":-10}],\"flag\":\"clingingIce\",\"key\":\"ChoiceSet\",\"prompt\":\"PF2E.SpecificRule.Prompt.DegreeOfSuccess\"},{\"key\":\"FlatModifier\",\"selector\":\"all-speeds\",\"type\":\"circumstance\",\"value\":\"{item|flags.system.rulesSelections.clingingIce}\"}]}";
