import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAContext from "./MISRAContext.js";
import { MISRATransformationReport } from "./MISRA.js";

/**
 * Represents a MISRA Rule that detects and corrects violations in the code according to MISRA standards.
 * 
 * Need to implement:
 *  - match($jp, logErrors)
 *  - transform($jp)
 */
export default abstract class MISRARule {
    /**
     * Unique identifier for the MISRA rule.
     */
    readonly ruleID: string;

    /** 
     * MISRA context for error tracking and rule transformations state
     */    
    protected context: MISRAContext;

    /**
     * 
     * @param ruleID - Unique identifier for the MISRA-C rule
     * @param context - MISRA context for error tracking and rule transformations state
     */
    constructor(ruleID: string, context: MISRAContext) {
        this.ruleID = ruleID;
        this.context = context;
    }

    /**
     * Checks if the joinpoint violates the rule
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected.
     * @returns Returns true if the joinpoint violates the rule, false otherwise.
     */
    abstract match($jp: Joinpoint, logErrors: boolean): boolean;

    /**
     * Transforms the joinpoint to comply with the MISRA-C rule
     * 
     * @param $jp - Joinpoint to transform
     * @returns Returns true if the joinpoint violates the rule and it was 
     * possible to transform it. Otherwise, returns false.
     */
    abstract transform($jp: Joinpoint): MISRATransformationReport;

    /**
     * Logs a MISRA-C rule violation error
     * 
     * @param $jp - The joinpoint where the violation occurred
     * @param msg - Description of the violation
     */
    protected logMISRAError($jp: Joinpoint, msg:string): void {
        this.context.addMISRAError(
            this.ruleID, 
            $jp, 
            `MISRA-C Rule ${this.ruleID} violation at ${$jp.filepath}@${$jp.line}:${$jp.column}: ${msg}`
        )
    }

    /**
     * Logs a warning from automatic MISRA-C correction, which may change the program's behavior
     * 
     * @param $jp - The joinpoint where the correction was applied
     * @param msg - Description of the warning
     */
    protected logMISRAWarning($jp: Joinpoint, msg:string): void {
        this.context.addMISRAWarning(
            this.ruleID, 
            $jp, 
            `Warning: MISRA-C Rule ${this.ruleID} correction at ${$jp.filepath}@${$jp.line}:${$jp.column}: ${msg}.`
        )
    }
}
