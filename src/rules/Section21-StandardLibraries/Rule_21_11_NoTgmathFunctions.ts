import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.11: The standard header file <tgmath.h> shall not be used
 */
export default class Rule_21_11_NoTgmathFunctions extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "tgmath.h";
    protected invalidFunctions = [];

    override get name(): string {
        return "21.11";
    }    
}
