import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.6: The Standard Library input/output functions shall not be used
 */
export default class Rule_21_6_NoStdIOFunctions extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "stdio.h";
    protected invalidFunctions = [];

    override get name(): string {
        return "21.6";
    }    
}
