import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA Rule 21.3: The memory allocation and deallocation functions of <stdlib.h> shall not be used
 */
export default class Rule_21_3_NoDynamicMemory extends DisallowedStdLibFunctionRule {
    protected standardLibrary = "stdlib.h";
    protected invalidFunctions = ["calloc", "malloc", "realloc", "free"];

    override get name(): string {
        return "21.3";
    }    
}
