import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.9: The library functions bsearch and qsort of <stdlib.h> shall not be used.
 */
export default class Rule_21_9_NoGenericSearchOrSort extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "stdlib.h";
    protected invalidFunctions = ["bsearch", "qsort"];
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    override get name(): string {
        return "21.9";
    }    
}
