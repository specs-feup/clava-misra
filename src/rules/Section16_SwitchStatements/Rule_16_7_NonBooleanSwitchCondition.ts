import { BinaryOp, BuiltinType, Joinpoint, Switch, UnaryOp } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRASwitchConverter, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { hasConditionalBreak } from "../../utils/SwitchUtils.js";
import { hasDefinedType } from "../../utils/JoinpointUtils.js";

/**
 * MISRA-C Rule 16.7: A switch-expression shall not have essentially Boolean type.
 */
export default class Rule_16_7_NonBooleanSwitchCondition extends MISRARule {
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
        return "16.7";
    }

    /**
     * Checks if the provided switch statement has a Boolean condition
     * @param switchStmt The switch statement to check
     * @returns Returns true if the switch statement has a Boolean condition, otherwise false
     */
    switchHasBooleanCondition(switchStmt: Switch): boolean {
        const switchCondition = switchStmt.condition;

        if (switchCondition instanceof BinaryOp || switchCondition instanceof UnaryOp) {
            const logicalOps = new Set(["lt", "gt", "le", "ge", "eq", "ne", "not", "l_not", "and", "or"]);
            return logicalOps.has(switchCondition.kind);
        }
        
        return hasDefinedType(switchCondition) && 
            switchCondition.type instanceof BuiltinType && 
            switchCondition.type.builtinKind === "Bool";
    }

    /**
     * Checks if the given joinpoint is a switch statement with an essentially Boolean condition
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Switch)) return false;

        const booleanCondition = this.switchHasBooleanCondition($jp);
        if (booleanCondition && logErrors) {
            this.logMISRAError($jp, `Switch statement controlling expression '${$jp.condition.code}' must not have essentially boolean type.`)
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
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        if (hasConditionalBreak($jp as Switch)) {
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