import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAContext from "./MISRAContext.js";
import { MISRATransformationReport, MISRATransformationResults, MISRATransformationType } from "./MISRA.js";
import VisitWithContext from "./ast-visitor/VisitWithContext.js";
import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";

/**
 * Represents a MISRA Rule that detects and corrects violations in the code according to MISRA standards.
 * 
 * Need to implement:
 *  - match($jp, logErrors)
 *  - apply($jp)
 *  - name()
 */
export default abstract class MISRARule extends VisitWithContext<MISRATransformationResults, MISRAContext> {
    
    /**
     * Priority of the rule which is low by default.
     */
    readonly priority: number = Number.MAX_VALUE;

    /**
     * 
     * @param ruleID - Unique identifier for the MISRA-C rule
     * @param context - MISRA context for error tracking and rule transformations state
     */
    constructor(context: MISRAContext) {
        super(context);
    }

    protected getFixFromConfig($jp: Joinpoint, errorMsgPrefix: string): any {
        return undefined;
    }

    /**
     * @returns Initial value stored in the shared context
     */
    override initialValue(): MISRATransformationResults {
        return new Map();
    }

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    abstract override get name(): string;

    /**
     * Unique identifier for the MISRA rule.
     */
    get ruleID(): string {
        return this.name;
    }

    /**
     * Logs a MISRA-C rule violation error
     * 
     * @param $jp - The joinpoint where the violation occurred
     * @param msg - Description of the violation
     */
    protected logMISRAError($jp: Joinpoint, msg:string): void {
        this.context.addMISRAError(this.ruleID, $jp, msg); 
    }

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