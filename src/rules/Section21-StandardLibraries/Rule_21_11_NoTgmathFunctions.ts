import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA-C Rule 21.11: The standard header file <tgmath.h> shall not be used
 */
export default class Rule_21_11_NoTgmathFunctions extends DisallowedStdLibFunctionRule {
    /**
     * The name of the standard library 
     */
    protected standardLibrary = "tgmath.h";

    /**
     * Names of functions from {@link standardLibrary} that forbidden. 
     * If the set is empty, all functions from {@link standardLibrary} are forbidden.
     */
    protected invalidFunctions = new Set<string>();

    /**
     * Standards to which this rule applies to
     */
    protected override readonly appliesTo = new Set(["c99", "c11"]);

    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "21.11";
    }    
}
