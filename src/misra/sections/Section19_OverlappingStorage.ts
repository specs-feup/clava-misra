import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, Joinpoint, Class } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export default class Section19_OverlappingStorage extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: Program | FileJp) => void>;

    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [2, this.r19_2_noUnion.bind(this)]
        ]);
    }
    
    private r19_2_noUnion($startNode: Joinpoint) {
        Query.searchFrom($startNode, Class, {kind: "union"}).get().forEach(union => this.logMISRAError(union, "The union keyword should not be used."), this);
    }
}