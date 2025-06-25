import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.8: The library functions abort, exit, getenv and system of <stdlib.h> shall not be used.
 */
export default class Rule_21_8_NoProcessControlFunctions extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "stdlib.h";
    protected invalidFunctions = ["abort", "exit", "getenv", "system"];

    override get name(): string {
        return "21.8";
    }    
}
