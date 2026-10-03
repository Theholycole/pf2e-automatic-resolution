// Families for spells that would otherwise be note-only: each compiler proves its text and returns its data. The first that matches decides
// the spell's route (resolution kind = the family's kind, its data under `resolution[key]`).
import { compileTerrainArea } from "./terrain-area.js";
import { compileConcealingArea } from "./concealing-area.js";
import { compileAgainstCaster } from "./against-caster.js";
import { compileDarknessArea } from "./darkness-area.js";
import { compileSpellManeuver } from "./spell-maneuver.js";
import { compileObjectDamage } from "./object-damage.js";
import { compileHazardArea } from "./hazard-area.js";
import { compileDamagingWall } from "./damaging-wall.js";
import { compileStealDamage } from "./steal-damage.js";
import { compileCounteractTransfer } from "./counteract-transfer.js";
import { compileBonusEffect } from "./bonus-effect.js";
import { compileRepeatCheck, compileRetroBonus, compileSecretFlatCheck, compileSubstituteRoll } from "./roll-families.js";
import { compileDelayedDamage, compileInterposingCover, compileMartyrRedirect, compileReboundBarrier, compileRedirectDamage } from "./damage-reactions.js";
import { compileSpellStrike } from "./spell-strike.js";
import { compilePromptEscape, compilePullToward, compileSpellShield, compileSustainOther } from "./action-families.js";
import { compilePerceptionAgainstDC, compileSaveReplacement, compileSaveUpgrade, compileSharedSaveBetter, compileSpellshapeDuration, compileSpellshapeEffect } from "./check-helpers.js";
import { compileMarchingSong, compileSharedLore, compileUnarmedReach } from "./rule-effects.js";
import { compileAttackWard, compileStrikeAbsorber } from "./ward-families.js";
import { compileSummon } from "./summon-families.js";
import { compileRuleSet } from "./rule-sets.js";
import { compileConjuredItem, compileItemRepair } from "./item-families.js";
import { compileAidAttack, compileFormChoice, compileHideReaction, compileSeekWhistle } from "./check-actions.js";
import { compileCoverSquare, compileLureSave, compileSaveRetry } from "./area-saves.js";
import { compileSceneWalls, compileShrubWall } from "./scene-features.js";
import { compileImageDecoys } from "./image-decoys.js";
import { compileWisps } from "./wisps.js";
import { compileStoredArmor } from "./stored-armor.js";
import { compileCauterize } from "./cauterize.js";
import { compileDismantle } from "./dismantle.js";
import { compileLightAura } from "./light-aura.js";
import { compileHyphae } from "./hyphae.js";
import { compileOutline } from "./outline.js";
import { compileCauseway } from "./causeway.js";
import { compileBattleForm } from "./battle-form.js";

const FAMILIES = [
    { kind: "terrain-area", key: "terrainArea", compile: adapted => compileTerrainArea(adapted) },
    { kind: "concealing-area", key: "concealingArea", compile: adapted => compileConcealingArea(adapted) },
    { kind: "against-caster-area", key: "againstCaster", compile: adapted => compileAgainstCaster(adapted) },
    { kind: "darkness-area", key: "darknessArea", compile: adapted => compileDarknessArea(adapted) },
    { kind: "spell-maneuver", key: "spellManeuver", compile: adapted => compileSpellManeuver(adapted) },
    { kind: "object-damage", key: "objectDamage", compile: adapted => compileObjectDamage(adapted) },
    { kind: "hazard-area", key: "hazardArea", compile: adapted => compileHazardArea(adapted) },
    { kind: "damaging-wall", key: "damagingWall", compile: adapted => compileDamagingWall(adapted) },
    { kind: "steal-damage", key: "stealDamage", compile: adapted => compileStealDamage(adapted) },
    { kind: "counteract-transfer", key: "counteractTransfer", compile: (adapted, nativeSpellEffects) => compileCounteractTransfer(adapted, nativeSpellEffects) },
    { kind: "bonus-effect", key: "bonusEffect", compile: adapted => compileBonusEffect(adapted) },
    { kind: "substitute-roll", key: "substituteRoll", compile: adapted => compileSubstituteRoll(adapted) },
    { kind: "secret-flat-check", key: "secretFlatCheck", compile: adapted => compileSecretFlatCheck(adapted) },
    { kind: "repeat-check", key: "repeatCheck", compile: adapted => compileRepeatCheck(adapted) },
    { kind: "retro-bonus", key: "retroBonus", compile: adapted => compileRetroBonus(adapted) },
    { kind: "redirect-damage", key: "redirectDamage", compile: adapted => compileRedirectDamage(adapted) },
    { kind: "martyr-redirect", key: "martyrRedirect", compile: adapted => compileMartyrRedirect(adapted) },
    { kind: "delayed-damage", key: "delayedDamage", compile: adapted => compileDelayedDamage(adapted) },
    { kind: "interposing-cover", key: "interposingCover", compile: adapted => compileInterposingCover(adapted) },
    { kind: "rebound-barrier", key: "reboundBarrier", compile: adapted => compileReboundBarrier(adapted) },
    { kind: "spell-strike", key: "spellStrike", compile: adapted => compileSpellStrike(adapted) },
    { kind: "sustain-other", key: "sustainOther", compile: adapted => compileSustainOther(adapted) },
    { kind: "pull-toward", key: "pullToward", compile: adapted => compilePullToward(adapted) },
    { kind: "prompt-escape", key: "promptEscape", compile: adapted => compilePromptEscape(adapted) },
    { kind: "spell-shield", key: "spellShield", compile: adapted => compileSpellShield(adapted) },
    { kind: "spellshape-duration", key: "spellshapeDuration", compile: adapted => compileSpellshapeDuration(adapted) },
    { kind: "spellshape-effect", key: "spellshapeEffect", compile: (adapted, nativeSpellEffects) => compileSpellshapeEffect(adapted, nativeSpellEffects) },
    { kind: "shared-save-better", key: "sharedSaveBetter", compile: adapted => compileSharedSaveBetter(adapted) },
    { kind: "save-replacement", key: "saveReplacement", compile: adapted => compileSaveReplacement(adapted) },
    { kind: "save-upgrade", key: "saveUpgrade", compile: adapted => compileSaveUpgrade(adapted) },
    { kind: "perception-against-dc", key: "perceptionAgainstDC", compile: adapted => compilePerceptionAgainstDC(adapted) },
    { kind: "marching-song", key: "marchingSong", compile: adapted => compileMarchingSong(adapted) },
    { kind: "shared-lore", key: "sharedLore", compile: adapted => compileSharedLore(adapted) },
    { kind: "unarmed-reach", key: "unarmedReach", compile: adapted => compileUnarmedReach(adapted) },
    { kind: "attack-ward", key: "attackWard", compile: adapted => compileAttackWard(adapted) },
    { kind: "strike-absorber", key: "strikeAbsorber", compile: adapted => compileStrikeAbsorber(adapted) },
    { kind: "summon", key: "summon", compile: adapted => compileSummon(adapted) },
    { kind: "rule-set", key: "ruleSet", compile: adapted => compileRuleSet(adapted) },
    { kind: "conjured-item", key: "conjuredItem", compile: adapted => compileConjuredItem(adapted) },
    { kind: "item-repair", key: "itemRepair", compile: adapted => compileItemRepair(adapted) },
    { kind: "hide-reaction", key: "hideReaction", compile: adapted => compileHideReaction(adapted) },
    { kind: "aid-attack", key: "aidAttack", compile: adapted => compileAidAttack(adapted) },
    { kind: "seek-whistle", key: "seekWhistle", compile: adapted => compileSeekWhistle(adapted) },
    { kind: "form-choice", key: "formChoice", compile: adapted => compileFormChoice(adapted) },
    { kind: "lure-save", key: "lureSave", compile: adapted => compileLureSave(adapted) },
    { kind: "cover-square", key: "coverSquare", compile: adapted => compileCoverSquare(adapted) },
    { kind: "save-retry", key: "saveRetry", compile: adapted => compileSaveRetry(adapted) },
    { kind: "shrub-wall", key: "shrubWall", compile: adapted => compileShrubWall(adapted) },
    { kind: "scene-walls", key: "sceneWalls", compile: adapted => compileSceneWalls(adapted) },
    { kind: "image-decoys", key: "imageDecoys", compile: (adapted, nativeSpellEffects) => compileImageDecoys(adapted, nativeSpellEffects) },
    { kind: "wisps", key: "wisps", compile: (adapted, nativeSpellEffects) => compileWisps(adapted, nativeSpellEffects) },
    { kind: "stored-armor", key: "storedArmor", compile: (adapted, nativeSpellEffects) => compileStoredArmor(adapted, nativeSpellEffects) },
    { kind: "cauterize", key: "cauterize", compile: (adapted, nativeSpellEffects) => compileCauterize(adapted, nativeSpellEffects) },
    { kind: "dismantle", key: "dismantle", compile: adapted => compileDismantle(adapted) },
    { kind: "light-aura", key: "lightAura", compile: adapted => compileLightAura(adapted) },
    { kind: "hyphae", key: "hyphae", compile: adapted => compileHyphae(adapted) },
    { kind: "outline", key: "outline", compile: adapted => compileOutline(adapted) },
    { kind: "causeway", key: "causeway", compile: adapted => compileCauseway(adapted) },
    { kind: "battle-form", key: "battleForm", compile: adapted => compileBattleForm(adapted) }
];

/** Returns {kind, key, data, claimed} or null. */
export function compileNoteFamily(adapted, nativeSpellEffects) {
    for (const family of FAMILIES) {
        const result = family.compile(adapted, nativeSpellEffects);
        if (result) return { kind: family.kind, key: family.key, data: result[family.key], claimed: result.claimed, ...(result.dataNotes ? { dataNotes: result.dataNotes } : {}) };
    }
    return null;
}
