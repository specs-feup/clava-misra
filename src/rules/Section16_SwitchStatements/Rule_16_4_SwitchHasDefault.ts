import { Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

/**
 * MISRA Rule 16.4: Every switch statement shall have a default label
 */
export default class Rule_16_4_SwitchHasDefault extends MISRARule {
    constructor(context: MISRAContext) {
        super(context);
    }

    override get name(): string {
        return "16.4";
    }

    /**
     * Checks if the given joinpoint is a switch statement with a default case
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Switch)) return false;

        const noDefaultCase = !$jp.hasDefaultCase;
        if (noDefaultCase && logErrors) {
            this.logMISRAError($jp, "Switch statement is missing a default case.")
        }    
        return noDefaultCase;
    }

    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        $jp.children[1].lastChild
            .insertAfter(ClavaJoinPoints.defaultStmt())
            .insertAfter(ClavaJoinPoints.emptyStmt())
            .insertAfter(ClavaJoinPoints.breakStmt());

        this.context.addRuleResult(this.ruleID, $jp, MISRATransformationType.DescendantChange);
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
