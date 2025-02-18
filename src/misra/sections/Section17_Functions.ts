import { Program, FileJp, Joinpoint, Include, Call, BuiltinType, ExprStmt } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

export default class Section17_Functions extends MISRAAnalyser {
    protected ruleMapper: Map<string, (jp: Program | FileJp) => void>;
    
    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["17.1", this.r17_1_noStdargUsage.bind(this)],
            ["17.7", this.r17_7_returnValuesAreUsed.bind(this)]
        ]);
    }

    private r17_1_noStdargUsage($startNode: Joinpoint) {
        Query.searchFrom($startNode, Include, {name: "stdarg.h", isAngled: true}).get().forEach(include => this.logMISRAError(this.currentRule, include, "Use of <stdarg.h> is not allowed."), this);
    }

    private r17_7_returnValuesAreUsed($startNode: Joinpoint) {
        Query.searchFrom($startNode, Call, {returnType: (type) => !(type instanceof BuiltinType && type.isVoid)}).get().forEach(call => {
            //console.log(call.parent);
            if (call.parent instanceof ExprStmt) {
                this.logMISRAError(this.currentRule, call, `Return value of ${call.signature} must be used. It can be discarded with an explicit cast to void.`, new Fix(call, ($jp) => {
                    const newJp = ClavaJoinPoints.cStyleCast(ClavaJoinPoints.type("void"), $jp.deepCopy() as Call);
                    $jp.replaceWith(newJp);
                }));
            }
        }, this);
    }
}