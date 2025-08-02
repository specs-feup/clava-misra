import { FunctionJp, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getUnusedLabels } from "../../utils/FunctionUtils.js";

/**
 * MISRA-C Rule 2.6: A function should not contain unused label declarations.
 *  
 */
export default class Rule_2_6_UnusedLabels extends MISRARule {
    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "2.6";
    }

    /**
     * Checks if the given joinpoint represents a function with unused labels.
     * A tag is considered unused if it is declared but not referenced by any goto statement.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof FunctionJp)) 
            return false;

        const unusedLabels = getUnusedLabels($jp);
        if (logErrors) {
            unusedLabels.forEach(label => 
                this.logMISRAError(label, `Label '${label.decl.name}' is unused in function ${$jp.name}.`)
            )
        }
        return unusedLabels.length > 0;
    }
    
    /**
     * Removes all unused labels if the provided joinpoint represents a function
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        const unusedLabels = getUnusedLabels($jp as FunctionJp);
        for (const label of unusedLabels) {
            label.detach();
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
