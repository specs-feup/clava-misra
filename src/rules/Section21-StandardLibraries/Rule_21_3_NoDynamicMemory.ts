import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA-C Rule 21.3: The memory allocation and deallocation functions of <stdlib.h> shall not be used
 */
export default class Rule_21_3_NoDynamicMemory extends DisallowedStdLibFunctionRule {
    /**
     * The name of the standard library 
     */
    protected standardLibrary = "stdlib.h";

    /**
     * Names of functions from {@link standardLibrary} that are forbidden. 
     * If the set is empty, all functions from {@link standardLibrary} are forbidden.
     */
    protected invalidFunctions = new Set(["calloc", "malloc", "aligned_alloc", "realloc", "free"]);

    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "21.3";
    }    
}
