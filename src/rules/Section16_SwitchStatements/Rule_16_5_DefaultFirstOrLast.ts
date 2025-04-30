import {Case, Comment, Joinpoint, Statement, Switch, WrapperStmt } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { isCommentStmt } from "../../utils/utils.js";

/**
 * MISRA Rule 16.5: A default label shall appear as either the first or the last switch label of
a switch statement
 */
export default class Rule_16_5_DefaultFirstOrLast extends MISRARule {

    constructor(context: MISRAContext) {
        super("16.5", context);
    }

    /**
     * Retrieves all consecutive case statements to the left of a given case statement
     * 
     * @param $jp - The starting case statement from which the search will begin
     * @returns  Array containing consecutive case statements to the left of the provided joinpoint
     * 
     */
    private getConsecutiveRightCases($jp: Case): Joinpoint[] {
        const cases = [];
        for (const stmt of $jp.siblingsRight) {
            if (!(stmt instanceof Case || isCommentStmt($jp)))
                break;
            cases.push(stmt);
        }
        return cases;
    }

    /**
     * Retrieves all consecutive case statements to the right of a given case statement
     * 
     * @param $jp - The starting case statement from which the search will begin
     * @returns  Array containing consecutive case statements to the right of the provided joinpoint
     * 
     */
    private getConsecutiveLeftCases($jp: Case): Joinpoint[] {
        let cases: Joinpoint[] = [];
        for (let i = $jp.siblingsLeft.length - 1; i >= 0; i--) {
            const currentStmt = $jp.siblingsLeft[i];
            if (!(currentStmt instanceof Case || isCommentStmt($jp))) {
                break;
            }
           cases.push($jp.siblingsLeft[i]);
        }
        return cases.reverse();
    }

    /**
     * Checks if the given joinpoint is a switch statement where the default label appears either as first of last label
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
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

    /**
     * Transforms a switch statement so that the default case appears as the last label
     * - If the default case is not already the last case within its case clause list, it is repositioned
     * - Then, the entire case clause list containing the default case to the end of the switch statement
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);

        const defaultCase = ($jp as Switch).getDefaultCase;
        const rightStatements = defaultCase.siblingsRight.filter(sibling => !isCommentStmt(sibling));
       
        //  Reposition the default case to the last position within its case clause list
        if (rightStatements[0] instanceof Case) { // At least one of the first statements is a Case
            const rightConsecutiveCases = this.getConsecutiveRightCases(defaultCase);
            const lastRightCase = rightConsecutiveCases[rightConsecutiveCases.length - 1];
            
            defaultCase.detach();
            lastRightCase.insertAfter(defaultCase);
            if (defaultCase.nextCase === undefined) { // Default is now the last case
                return new MISRATransformationReport(MISRATransformationType.DescendantChange);
            }
        }

        // Move the entire case clause list containing the default case to the end of the switch statement
        const switchScope = $jp.children[1];
        const stmts = [...this.getConsecutiveLeftCases(defaultCase), defaultCase, ...defaultCase.instructions];

        for (const stmt of stmts) {
            stmt.detach();
            switchScope.lastChild.insertAfter(stmt);
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
