import { Program, FileJp, Joinpoint, Include, Call, BuiltinType, ExprStmt } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Query from "lara-js/api/weaver/Query.js";
import Fix from "clava-js/api/clava/analysis/Fix.js";
import ClavaJoinPoints from "clava-js/api/clava/ClavaJoinPoints.js";

export default class Section17_Functions extends MISRAAnalyser {
    protected ruleMapper: Map<number, (jp: Program | FileJp) => void>;
    
    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [1, this.r17_1_noStdargUsage.bind(this)],
            [7, this.r17_7_returnValuesAreUsed.bind(this)]
        ]);
    }

    private r17_1_noStdargUsage($startNode: Joinpoint) {
        Query.searchFrom($startNode, Include, {name: "stdarg.h", isAngled: true}).get().forEach(include => this.logMISRAError(include, "Use of <stdarg.h> is not allowed."), this);
    }

    private r17_7_returnValuesAreUsed($startNode: Joinpoint) {
        Query.searchFrom($startNode, Call, {returnType: (type) => !(type instanceof BuiltinType && type.isVoid)}).get().forEach(call => {
            console.log(call.parent);
            if (call.parent instanceof ExprStmt) {
                this.logMISRAError(call, `Return value of ${call.signature} must be used. It can be discarded with an explicit cast to void.`, new Fix(call, ($jp) => {
                    const newJp = ClavaJoinPoints.cStyleCast(ClavaJoinPoints.type("void"), $jp.deepCopy() as Call);
                    $jp.replaceWith(newJp);
                }));
            }
        }, this);
    }
}