export { compileAbility } from "./compile-ability.js";
export { adaptSpellSource } from "./spell-source-adapter.js";
export {
    analyzeDescription,
    extractConditionReferences,
    extractDegreeSections,
    extractDurationCandidates,
    extractInlineExpressions,
    extractPersistentDamageExpressions,
    extractScopedConditionReferences,
    htmlToPlainText,
    inferDamageMultiplier,
    stripHeighteningHTML
} from "./description-parser.js";
export { compileEffectDuration, compileItemDuration } from "./duration-compiler.js";
export { validateAbilityPlan } from "./validate-plan.js";
export { assessSimpleBasicSaveDescription } from "./semantic-gate.js";
export { classifyManualSemantics, inferPostDamageTerminal, inferTerminalResult } from "./outcome-semantics.js";
export { analyzeResidualProse } from "./residual-prose.js";
export { compileSecondarySave } from "./secondary-save-compiler.js";
export { compileLinkedConditions } from "./linked-condition-compiler.js";
export { compileDirectEffectResolution } from "./direct-effect-resolution-compiler.js";
export { compileChoiceVariantResolution, compileChoiceVariantSelection } from "./choice-variant-compiler.js";
export { compileEffectTerminations, DISMISS_ACTION_UUID } from "./effect-termination-compiler.js";
export { compileEffectSequenceResolution, compileMultiEffectSequence } from "./multi-effect-sequence-compiler.js";
export { compileRankVariantResolution, compileRankVariantSelection } from "./rank-variant-compiler.js";
export { compileUnscopedEffectTriggers } from "./unscoped-effect-trigger-compiler.js";
export { compileActorTargetConstraints } from "./target-predicate-compiler.js";
export {
    compileNativeSpellEffects,
    degreesFromNativeEffectLabel,
    extractNativeSpellEffectLinks,
    NATIVE_SPELL_EFFECT_UUID_PREFIX
} from "./native-spell-effect-compiler.js";
export {
    ABILITY_MODEL_VERSION,
    AUTOMATION_LEVELS,
    BASIC_SAVE_MULTIPLIERS,
    COMPILER_VERSION,
    DEGREES
} from "./constants.js";
