import { Break, Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getLastStmtOfCase } from "../../utils.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

/**
 * MISRA Rule 16.3: An unconditional break statement shall terminate every switch-clause
 */
export default class Rule_16_3_UnconditionalBreak extends MISRARule {
    #statementsNeedingBreakAfter: Joinpoint[] = [];

    constructor(context: MISRAContext) {
        super("16.3", context);
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

    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        for (const stmt of this.#statementsNeedingBreakAfter) {
            stmt.insertAfter(ClavaJoinPoints.breakStmt());
            this.logMISRAWarning($jp, `Unconditional break statement was added after statement '${stmt.code}'`);
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
