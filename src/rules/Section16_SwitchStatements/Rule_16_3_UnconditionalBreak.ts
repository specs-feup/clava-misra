import { Break, Joinpoint, Switch, Case } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { getLastStmtOfCase } from "../../utils/SwitchUtils.js";

/**
 * MISRA-C Rule 16.3: An unconditional break statement shall terminate every switch-clause
 */
export default class Rule_16_3_UnconditionalBreak extends MISRARule {
    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    /**
     * A positive integer starting from 1 that indicates the rule's priority, determining the order in which rules are applied.
     */
    readonly priority = 3; 
    
    /**
     * List of statements that require a `break` statement as their last sibling 
     */
    #statementsNeedingBreakAfter: Joinpoint[] = [];
    
    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "16.3";
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Switch)) return false;

        this.#statementsNeedingBreakAfter = $jp.cases.map(caseLabel => getLastStmtOfCase(caseLabel))
            .filter(lastStmt => lastStmt && !(lastStmt instanceof Break)) as Joinpoint[];

        if (logErrors) {
            this.#statementsNeedingBreakAfter.forEach(stmt => {
                this.logMISRAError(stmt, `Missing unconditional break after statement '${stmt.code}'`);
            });
        }
        return this.#statementsNeedingBreakAfter.length > 0;
    }

    private getNextStatementsToExecute(jp: Joinpoint): Joinpoint[] {
        let stmts = [];

        for (const sibling of jp.siblingsRight) {
            if (sibling instanceof Break)
                break;
            if (sibling instanceof Case)
                continue;
            stmts.push(sibling.deepCopy());
        }
        return stmts;
    }

    private insertNextStatementsToExecute(jp: Joinpoint) {
        const nextStmts = this.getNextStatementsToExecute(jp);
        let lastStmt = jp;

        for (const stmt of nextStmts) {
            lastStmt.insertAfter(stmt);
            lastStmt = stmt;
        }
        lastStmt.insertAfter(ClavaJoinPoints.breakStmt());
    }

    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        for (const stmt of this.#statementsNeedingBreakAfter) {
            if (stmt.rightJp === undefined) { // last statement of the switch
                stmt.insertAfter(ClavaJoinPoints.breakStmt());
            } else {
                this.insertNextStatementsToExecute(stmt);
            }
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
