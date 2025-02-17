import { Program, FileJp, Joinpoint, Comment } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export default class Section3_Comments extends MISRAAnalyser {
    protected ruleMapper: Map<string, (jp: Program | FileJp) => void>;

    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["3.1", this.r3_1_commentSequences.bind(this)]
        ]);
    }

    
    private r3_1_commentSequences($startNode: Joinpoint) { //inlines        
        Query.searchFrom($startNode, Comment).get().forEach(comment => {
            if (/(\/\/|\/\*)/g.test(comment.text)) {
                this.logMISRAError(this.currentRule, comment, `Comment ${comment.text} contains invalid character sequences.`);
            }
        }, this);
    }    
}