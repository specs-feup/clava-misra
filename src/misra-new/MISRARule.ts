import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAContext from "./MISRAContext.js";

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
     * @param ruleID - Unique identifier for the MISRA rule
     * @param context - MISRA context for error tracking and rule transformations state
     */
    constructor(ruleID: string, context: MISRAContext) {
        this.ruleID = ruleID;
        this.context = context;
    }

    /**
     * Checks if the joinpoint violates the rule
     * 
     * @param $jp - Joinpoint to analyse
     * @param logErrors - Log errors when violations are detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise.
     */
    abstract match($jp: Joinpoint, logErrors: boolean): boolean;

    /**
     * Transforms the joinpoint to comply with the MISRA rule
     * 
     * @param $jp - Joinpoint to transform
     * @returns Returns true if the joinpoint violates the rule and it was 
     * possible to transform it. Otherwise, returns false.
     */
    abstract transform($jp: Joinpoint): boolean;

    /**
     * Logs a MISRA rule violation error
     * 
     * @param $jp - The joinpoint where the violation occurred
     * @param msg - Description of the violation
     */
    protected logMISRAError($jp: Joinpoint, msg:string): void {
        this.context.addMISRAError(
            this.ruleID, 
            $jp, 
            `MISRA Rule ${this.ruleID} violation at ${$jp.filepath}@${$jp.line}:${$jp.column}: ${msg}`
        )
    }
}
