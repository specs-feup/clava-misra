import { Program, FileJp, Joinpoint, Comment } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Query from "lara-js/api/weaver/Query.js";

export default class Section3_Comments extends MISRAAnalyser {
    protected ruleMapper: Map<number, (jp: Program | FileJp) => void>;

    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [3, this.r3_1_fixComments.bind(this)]
        ]);
    }

    private static removeCommentSequences(str: string) {
        return str.replace(/(\/\/||\/\*)/g, '');
    }
    
    private r3_1_fixComments($startNode: Joinpoint) { //inlines
        Query.search(Comment).get().forEach(comment => comment.setText(Section3_Comments.removeCommentSequences(comment.text)));
        //Query.searchFrom(Query.root()).get().forEach(jp => jp.setInlineComments(jp.inlineComments.map(comment => removeCommentSequences(comment.text).toString())));
    }
}