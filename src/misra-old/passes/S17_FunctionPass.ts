import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { BuiltinType, Call, ExprStmt, Include, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

export default class S17_FunctionPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [1, this.r17_1_noStdargUsage.bind(this)],
            [7, this.r17_7_returnValuesAreUsed.bind(this)]
        ]);
    }
    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof Include || $jp instanceof Call;
    }

    private r17_1_noStdargUsage($startNode: Joinpoint) {
        if (!($startNode instanceof Include)) return;;

        if ($startNode.name === "stdarg.h" && $startNode.isAngled) {
            this.logMISRAError("Use of <stdarg.h> is not allowed.");
        }
    }

    private r17_7_returnValuesAreUsed($startNode: Joinpoint) {
        if (!($startNode instanceof Call)) return;
        if ($startNode.returnType instanceof BuiltinType && $startNode.returnType.isVoid) return;

        if ($startNode.parent instanceof ExprStmt) {
            this.logMISRAError(`Return value of ${$startNode.signature} must be used. It can be discarded with an explicit cast to void.`, new Fix($startNode, ($jp) => {
                const newJp = ClavaJoinPoints.cStyleCast(ClavaJoinPoints.type("void"), $jp as Call);
                $jp.replaceWith(newJp);
            }));
        }
    }

    protected _name: string = "Functions";
    
}