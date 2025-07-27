import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.7: The atof, atoi, atol and atoll functions of <stdlib.h> shall not be used.
 */
export default class Rule_21_7_NoNumericStringConversions extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "stdlib.h";
    protected invalidFunctions = new Set(["atof", "atoi", "atol", "atoll"]);
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    override get name(): string {
        return "21.7";
    }    
}