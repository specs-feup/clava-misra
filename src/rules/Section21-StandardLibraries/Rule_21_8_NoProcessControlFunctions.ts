import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.8: The Standard Library termination functions of <stdlib.h> shall not be used.
 * 
 * The termination functions are abort, exit, _Exit and quick_exit.
 */
export default class Rule_21_8_NoProcessControlFunctions extends DisallowedStdLibFunctionRule {
    protected override readonly appliesTo = ["c90", "c99"];
    protected standardLibrary = "stdlib.h";
    protected invalidFunctions = ["abort", "exit", "_Exit", "quick_exit"];

    override get name(): string {
        return "21.8";
    }    
}
