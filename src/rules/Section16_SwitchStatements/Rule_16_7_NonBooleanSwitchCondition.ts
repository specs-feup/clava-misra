import { BuiltinType, Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRASwitchConverter, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { switchHasBooleanCondition, switchHasConditionalBreak } from "../../utils/utils.js";

/**
 * MISRA Rule 16.7: A switch-expression shall not have essentially Boolean type.
 */
export default class Rule_16_7_NonBooleanSwitchCondition extends MISRARule {
    constructor(context: MISRAContext) {
        super("16.7", context);
    }

    /**
     * Checks if the given joinpoint is a switch statement with an essentially Boolean condition
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Switch)) return false;

        const booleanCondition = switchHasBooleanCondition($jp);
        if (booleanCondition && logErrors) {
            this.logMISRAError($jp, `Switch statement controlling expression ${$jp.condition.code} must not have essentially boolean type.`)
        }    
        return booleanCondition;
    }

    /**
     * Transforms a switch statement with a Boolean condition into equivalent statement(s), only if there is no conditional break.
     * If a conditional break is present, no transformation is performed and an error is generated.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);

        if (switchHasConditionalBreak($jp as Switch)) {
            this.logMISRAError($jp, `The switch statement's controlling expression ${($jp as Switch).condition.code} must not be of a boolean type and cannot be transformed due to a conditional break statement.`)
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