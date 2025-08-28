import { AnalysisType } from "../../MISRA.js";
import DisallowedStdLibFunctionRule from "./DisallowedStdLibFunctionRule.js";

/**
 * MISRA-C Rule 21.6: The Standard Library input/output functions shall not be used
 */
export default class Rule_21_6_NoStdIOFunctions extends DisallowedStdLibFunctionRule {
    /**
     * The name of the standard library 
     */
    protected standardLibrary = "stdio.h";
    
    /**
     * Names of functions from {@link standardLibrary} that are forbidden. 
     * If the set is empty, all functions from {@link standardLibrary} are forbidden.
     */
    protected invalidFunctions = new Set<string>();
    
    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "21.6";
    }    
}
