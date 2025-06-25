import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.10: The Standard Library time and date functions shall not be used
 */
export default class Rule_21_10_NoTimeDateFunctions extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "time.h";
    protected invalidFunctions = [];

    override get name(): string {
        return "21.10";
    }    
}
