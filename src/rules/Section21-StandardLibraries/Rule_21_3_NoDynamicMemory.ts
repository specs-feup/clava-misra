import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.3: The memory allocation and deallocation functions of <stdlib.h> shall not be used
 */
export default class Rule_21_3_NoDynamicMemory extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "stdlib.h";
    protected invalidFunctions = new Set(["calloc", "malloc", "aligned_alloc", "realloc", "free"]);
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    override get name(): string {
        return "21.3";
    }    
}
