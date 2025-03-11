import {Case, Comment, Joinpoint, Statement, Switch, WrapperStmt } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

/**
 * MISRA Rule 16.5: A default label shall appear as either the fi rst or the last switch label of
a switch statement
 */
export default class Rule_16_5_DefaultFirstOrLast extends MISRARule {

    constructor(context: MISRAContext) {
        super("16.5", context);
    }

    private getConsecutiveRightCases($jp: Case): Joinpoint[] {
        const cases = [];
        for (const stmt of $jp.siblingsRight) {
            if (!(stmt instanceof Case || (stmt instanceof WrapperStmt && stmt.kind === "comment")))
                break;
            cases.push(stmt);
        }
        return cases;
    }

    private getConsecutiveLeftCases($jp: Case): Joinpoint[] {
        let cases: Joinpoint[] = [];
        for (let i = $jp.siblingsLeft.length - 1; i >= 0; i--) {
            const currentStmt = $jp.siblingsLeft[i];
            if (!(currentStmt instanceof Case || (currentStmt instanceof WrapperStmt && currentStmt.kind === "comment"))) {
                break;
            }
           cases.push($jp.siblingsLeft[i]);
        }
        return cases.reverse();
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Switch)) return false;

        const caseStmts = $jp.cases;
        for (let i = 0; i < caseStmts.length; i++) {
            const currentCase = caseStmts[i];
            if (currentCase.isDefault) {
                if (i == 0 || i == caseStmts.length - 1) {
                    return false;
                } 
                if (logErrors) {
                    this.logMISRAError($jp, "The default case of a switch statement must be the first or last label.")
                }
                return true;
            }
        }
        return false;
    }

    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);

        const defaultCase = ($jp as Switch).getDefaultCase;
        const rightStatements = defaultCase.siblingsRight.filter(sibling => sibling instanceof Statement);
       
        if (rightStatements[0] instanceof Case) { // At least one of the first statements is a Case
            const rightConsecutiveCases = this.getConsecutiveRightCases(defaultCase);
            const lastRightCase = rightConsecutiveCases[rightConsecutiveCases.length - 1];
            
            defaultCase.detach();
            lastRightCase.insertAfter(defaultCase);
            if (defaultCase.nextCase === undefined) { // Default is now the last case
                return new MISRATransformationReport(MISRATransformationType.DescendantChange);
            }
        }

        const switchScope = $jp.children[1];
        const stmts = [...this.getConsecutiveLeftCases(defaultCase), defaultCase, ...defaultCase.instructions];

        for (const stmt of stmts) {
            stmt.detach();
            switchScope.lastChild.insertAfter(stmt);
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
