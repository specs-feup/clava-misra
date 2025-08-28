import { Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAContext from "./MISRAContext.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationResults } from "./MISRA.js";
import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { resetCaches } from "./utils/ProgramUtils.js";
import StandardGuideline from "./StandardGuideline.js";

/**
 * Represents a MISRA Rule that detects and corrects violations in the code according to MISRA standards.
 * 
 * Need to implement/define:
 *  - analysisType
 *  - name()
 *  - match($jp, logErrors)
 *  - apply($jp)
 */
export default abstract class MISRARule extends StandardGuideline<MISRATransformationResults, MISRAContext> {
    /**
     * A positive integer starting from 1 that indicates the rule's priority, determining the order in which rules are applied.
     * By default, a rule has the lowest priority unless overridden.
     */
    readonly priority: number = Number.MAX_VALUE;

    /**
     * Scope of analysis: single unit or entire system.
     */
    abstract readonly analysisType: AnalysisType;

    /**
     * Standards to which this rule applies to
     */
    protected readonly appliesTo: Set<string> = new Set(["c90", "c99", "c11"]);

    /**
     * 
     * @param context - MISRA context for error tracking and rule transformations state
     */
    constructor(context: MISRAContext) {
        super(context);
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
     * An alias for 'name'
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
     * Verifies if the rule applies to the standard being used
     */
    protected appliesToCurrentStandard(): boolean {
        return this.appliesTo.has(Clava.getStandard());
    }

    /**
     *  Rebuilds the program based on the current AST, clears stored data in the shared context, and resets all caches
     */
    protected rebuildProgram() {
        (Query.root() as Program).rebuild();
        this.context.resetStorage();
        resetCaches();
    }

    /**
     * Transforms the joinpoint to comply with the MISRA-C rule
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    abstract apply($jp: LaraJoinPoint): MISRATransformationReport;
}