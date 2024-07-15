import Query from "lara-js/api/weaver/Query.js";
import { Program, FileJp, Loop, Joinpoint, If, ExprStmt } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export default class Section14_ControlStmtExprs extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: Program | FileJp) => void>;

    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [4, this.r14_4_essentiallyBooleanInControllingExpr.bind(this)]
        ]);
    }
    
    private r14_4_essentiallyBooleanInControllingExpr($startNode: Joinpoint) { //better way?
        Query.searchFrom($startNode, Loop).get().forEach(loop => {
            if ((loop.cond as ExprStmt).expr.type.code !== "bool") {
                this.logMISRAError(loop, `Loop controlling expression ${(loop.cond as ExprStmt).expr.code} does not have essentially boolean type.`);
            }
        }, this);
        Query.searchFrom($startNode, If).get().forEach(ifStmt => {
            if (ifStmt.cond.type.code !== "bool") {
                this.logMISRAError(ifStmt, `Loop controlling expression ${ifStmt.cond.code} does not have essentially boolean type.`);
            }
        }, this);
    }
}