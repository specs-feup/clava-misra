import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA-C Rule 21.10: The Standard Library time and date functions shall not be used
 */
export default class Rule_21_10_NoTimeDateFunctions extends DisallowedStdLibFunctionRule {
    /**
     * The name of the standard library 
     */
    protected standardLibrary = "time.h";

    /**
     * Names of functions from {@link standardLibrary} that forbidden. 
     * If the set is empty, all functions from {@link standardLibrary} are forbidden.
     */
    protected invalidFunctions = new Set<string>();

    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "21.10";
    }    
}
