import { GotoStmt, FunctionJp, Joinpoint, LabelStmt } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

/**
 * Rule 2.6: Unused Labels. 
 *  Checks for labels within a function that are not used.
 */
export default class Rule_2_6_UnusedLabels extends MISRARule {
    priority = 3; 
    
    constructor(context: MISRAContext) {
        super(context);
    }

    override get name(): string {
        return "2.6";
    }

    private getUnusedLabels(func: FunctionJp): LabelStmt[] {
        return Query.searchFrom(func, LabelStmt).get().filter(label => 
            Query.searchFrom(func, GotoStmt, { label: jp => jp.astId === label.decl.astId }).get().length === 0
        );
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof FunctionJp)) 
            return false;

        const unusedLabels = this.getUnusedLabels($jp);
        if (logErrors) {
            unusedLabels.forEach(label => 
                this.logMISRAError(label, `Label ${label.decl.name} is unused in function ${$jp.name}.`)
            )
        }
        return unusedLabels.length > 0;
    }
    
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        const unusedLabels = this.getUnusedLabels($jp as FunctionJp);
        for (const label of unusedLabels) {
            label.detach();
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
