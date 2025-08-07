import {Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRASwitchConverter, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { countSwitchClauses, hasConditionalBreak } from "../../utils/SwitchUtils.js";

/**
 * MISRA-C Rule 16.6:  Every switch statement shall have at least two switch-clauses.
 */
export default class Rule_16_6_SwitchMinTwoClauses extends MISRARule {
    /**
     * A positive integer starting from 1 that indicates the rule's priority, determining the order in which rules are applied.
     */
    readonly priority = 4;

    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

     /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "16.6";
    }

    /**
     * Checks if the given joinpoint is a switch statement with less than two clauses
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Switch)) return false;

        const nonCompliant = countSwitchClauses($jp) < 2;
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
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        const switchJp = $jp as Switch;
        if (hasConditionalBreak(switchJp)) {
            if (switchJp.hasDefaultCase) {
                this.logMISRAError($jp, "Switch statement must have at least two clauses and cannot be transformed due to a conditional break statement.")
            }
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        const transformResultNode = MISRASwitchConverter.convert(switchJp);
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
