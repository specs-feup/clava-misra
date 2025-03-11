import {Break, Case, Joinpoint, Statement, Expression, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getNumOfSwitchClauses } from "../../utils.js";
import TransformSwitchToIf from "@specs-feup/clava/api/clava/pass/TransformSwitchToIf.js"

/**
 * MISRA Rule 16.6:  Every switch statement shall have at least two switch-clauses.
 */
export default class Rule_16_6_SwitchMinTwoClauses extends MISRARule {

    constructor(context: MISRAContext) {
        super("16.6", context);
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Switch)) return false;

        const nonCompliant = getNumOfSwitchClauses($jp) < 2;
        if (nonCompliant && logErrors) {
            this.logMISRAError($jp, "Switch statements should have more than two clauses.")
        }
        return nonCompliant;
    }

    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        const switchToIfPass = new TransformSwitchToIf();
        const transformResult = switchToIfPass.transformJoinpoint($jp as Switch);
        
        return new MISRATransformationReport(
            MISRATransformationType.Replacement,
            transformResult.jp as Joinpoint
        );
        /*
        const breakStmts = Query.searchFrom($jp, Break, {enclosingStmt: jp => jp.instanceOf("switch")}).get();
        breakStmts.forEach(breakStmt => {
            breakStmt.detach()
        });
        
        if (($jp as Switch).hasDefaultCase) {
            const stmts = ($jp as Switch).cases[0].instructions.filter(stmt => !(stmt instanceof Case));

            let lastStmt: Statement;
            for(let i = 0; i < stmts.length; i++) {
                if (i == 0) {
                    $jp.replaceWith(stmts[i]);
                } else {
                    lastStmt!.insertAfter(stmts[i]);
                }
                lastStmt = stmts[i];
            }
        } else {
            let conditionStmt: Expression;
            
        }
            */
    }
}
