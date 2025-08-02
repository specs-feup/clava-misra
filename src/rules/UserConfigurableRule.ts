import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";
import MISRARule from "../MISRARule.js";
import { AnalysisType, MISRATransformationReport } from "../MISRA.js";

/**
 * Represents a MISRARule that requires the user to provide custom settings to assist in the automatic transformation.
 * 
 * Need to implement/define:
 *  - analysisType
 *  - name()
 *  - getErrorMsgPrefix($jp)
 *  - getFixFromConfig($jp, errorMsgPrefix)
 *  - match($jp, logErrors)
 *  - apply($jp)
 *  
 */
export default abstract class UserConfigurableRule extends MISRARule {
    /**
     * Specifies the scope of analysis: single unit or entire system.
     */
    abstract readonly analysisType: AnalysisType;
    
    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    abstract override get name(): string;

    /**
     * Returns the prefix to be used for error messages related to the given joinpoint
     * 
     * @param $jp - Joinpoint where the violation was detected 
     * @returns Returns a prefix to prepend to error messages if no configuration is specified or if the configuration does not contain a fix for this violation
     */
    protected abstract getErrorMsgPrefix($jp: Joinpoint): string;

    /**
     * Retrieves a fix for the given joinpoint using the provided configuration file
     * @param $jp - Joinpoint where the violation was detected
     * @return The fix retrieved from the configuration for the violation, or `undefined` if no applicable fix is found.
     */
    protected abstract getFixFromConfig($jp: Joinpoint): any;

    /**
     * Checks if the joinpoint violates the rule
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    abstract match($jp: Joinpoint, logErrors: boolean): boolean;

    /**
     * Transforms the joinpoint to comply with the MISRA-C rule
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    abstract apply($jp: LaraJoinPoint): MISRATransformationReport;
}