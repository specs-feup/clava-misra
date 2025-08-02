import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA-C Rule 21.8: The Standard Library termination functions of <stdlib.h> shall not be used.
 * 
 * The termination functions are abort, exit, _Exit and quick_exit.
 */
export default class Rule_21_8_NoProcessControlFunctions extends DisallowedStdLibFunctionRule {
    /**
     * Standards to which this rule applies to
     */
    protected override readonly appliesTo = new Set(["c90", "c99"]);

    /**
     * The name of the standard library 
     */
    protected standardLibrary = "stdlib.h";

    /**
     * Names of functions from {@link standardLibrary} that forbidden. 
     * If the set is empty, all functions from {@link standardLibrary} are forbidden.
     */
    protected invalidFunctions = new Set(["abort", "exit", "_Exit", "quick_exit"]);

    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "21.8";
    }    
}
