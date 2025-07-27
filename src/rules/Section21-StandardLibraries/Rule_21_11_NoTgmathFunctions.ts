import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.11: The standard header file <tgmath.h> shall not be used
 */
export default class Rule_21_11_NoTgmathFunctions extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "tgmath.h";
    protected invalidFunctions = new Set<string>();
    protected override readonly appliesTo = new Set(["c99", "c11"]);
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    override get name(): string {
        return "21.11";
    }    
}
