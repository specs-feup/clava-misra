import { Program, FileJp, Joinpoint, FunctionJp, Varref, Param } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Query from "lara-js/api/weaver/Query.js";

export default class Section2_UnusedCode extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: Program | FileJp) => void>;
    
    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [7, this.r2_7_noUnusedParams.bind(this)]
        ]);
    }

    private r2_7_noUnusedParams($startNode: Joinpoint) {
        Query.searchFrom($startNode, FunctionJp).get().forEach(fun => {
            const params: Map<string, Param> = new Map();
            for (const param of fun.params) {
                params.set(param.astId, param);
            }

            Query.searchFrom(fun, Varref).get().forEach(ref => {
                params.delete(ref.decl?.astId);
            }, this);

            params.forEach((v, k, m) => {
                this.logMISRAError(v, `Parameter ${v.name} is unused.`);
            }, this);
        }, this);
    }
}