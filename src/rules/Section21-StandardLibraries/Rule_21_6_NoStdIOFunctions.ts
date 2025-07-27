import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.6: The Standard Library input/output functions shall not be used
 */
export default class Rule_21_6_NoStdIOFunctions extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "stdio.h";
    protected invalidFunctions = new Set<string>();
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    override get name(): string {
        return "21.6";
    }    
}
