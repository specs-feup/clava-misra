import {Break, Case, Joinpoint, Statement, Expression, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRASwitchConverter, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getNumOfSwitchClauses, switchHasConditionalBreak } from "../../utils/utils.js";

/**
 * MISRA Rule 16.6:  Every switch statement shall have at least two switch-clauses.
 */
export default class Rule_16_6_SwitchMinTwoClauses extends MISRARule {

    constructor(context: MISRAContext) {
        super("16.6", context);
    }

    /**
     * Checks if the given joinpoint is a switch statement with less than two clauses
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Switch)) return false;

        const nonCompliant = getNumOfSwitchClauses($jp) < 2;
        if (nonCompliant && logErrors) {
            this.logMISRAError($jp, "Switch statements should have at least two clauses.")
        }
        return nonCompliant;
    }

    /**
     * Transforms a switch statement with less than two clauses into equivalent statement(s), only if there is no conditional break.
     * If a conditional break is present, no transformation is performed and an error is generated.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        if (switchHasConditionalBreak($jp as Switch)) {
            this.logMISRAError($jp, "switch statement must have at least two clauses and cannot be transformed due to a conditional break statement.")
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        const transformResultNode = MISRASwitchConverter.convert($jp as Switch);
        if (transformResultNode) {
            return new MISRATransformationReport(
                MISRATransformationType.Replacement,
                transformResultNode
            );
        } 
        // Only breaks were present, so the switch was removed
        return new MISRATransformationReport(MISRATransformationType.Removal);
    }
}
