import { BuiltinType, Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import TransformSwitchToIf from "@specs-feup/clava/api/clava/pass/TransformSwitchToIf.js"
import { getSwitchConditionType, switchHasBooleanCondition } from "../../utils.js";

/**
 * MISRA Rule 16.7: A switch-expression shall not have essentially Boolean type.
 */
export default class Rule_16_7_NonBooleanSwitchCondition extends MISRARule {
    constructor(context: MISRAContext) {
        super("16.7", context);
    }

    /**
     * Checks if the given joinpoint is a switch statement with an essentially Boolean condition
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
     * Transforms a switch statement with a Boolean condition into an equivalent `if` statement
     */
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);

        const switchToIfPass = new TransformSwitchToIf();
        const transformResult = switchToIfPass.transformJoinpoint($jp as Switch);
        console.log(transformResult.insertedLiteralCode);
        
        return new MISRATransformationReport(
            MISRATransformationType.Replacement,
            transformResult.jp as Joinpoint
        ); 
    }
}