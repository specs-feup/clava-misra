import { BuiltinType, Call, Cast, ExprStmt, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

/**
 * MISRA-C Rule 17.7: The value returned by a function having non-void return type shall be used
 */
export default class Rule_17_7_UnusedReturnValue extends MISRARule {
    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "17.7";
    }

    /**
     * Checks if the given joinpoint represents a non-void function call with an unused return value.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Call)) return false;

        if ($jp.returnType instanceof BuiltinType && $jp.returnType.isVoid) return false;

        if ($jp.parent instanceof ExprStmt && logErrors) {
            this.logMISRAError($jp,`Return value of ${$jp.signature} must be used. It can be discarded with an explicit cast to void.`);
        }
        return $jp.parent instanceof ExprStmt;
    }

    /**
     * Transforms the joinpoint if it represents a non-void function call, whose return type is unused. 
     * It ensures that the return value is explicitly cast to void.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        const callJp = $jp as Call;
        const castJp =  ClavaJoinPoints.cStyleCast(ClavaJoinPoints.type("void"), callJp);
        const newJp = $jp.replaceWith(castJp) as Cast;
        newJp.subExpr.replaceWith($jp);
        return new MISRATransformationReport(MISRATransformationType.Replacement, newJp);
    }
}
