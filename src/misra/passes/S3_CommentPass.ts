import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { Comment, Joinpoint } from "clava-js/api/Joinpoints.js";
import Fix from "clava-js/api/clava/analysis/Fix.js";

export default class S3_CommentPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [3, this.r3_1_fixComments.bind(this)]
        ]);
    }

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return true;
    }

    private static removeCommentSequences(str: string) {
        return str.replace(/(\/\/|\/\*)/g, '');
    }
    
    private r3_1_fixComments($startNode: Joinpoint) { //inlines
        if ($startNode instanceof Comment && /(\/\/|\/\*)/g.test($startNode.text)) {
            this.logMISRAError(`Comment ${$startNode.text} contains invalid character sequences.`, new Fix(
                $startNode,
                $jp => ($jp as Comment).setText(S3_CommentPass.removeCommentSequences($startNode.text))
            ));
        } 
        $startNode.inlineComments.filter(comment => /(\/\/|\/\*)/g.test(comment.text)).forEach(comment => {
            this.logMISRAError(`Comment ${comment.text} contains invalid character sequences.`, new Fix(
                $startNode,
                $jp => ($jp as Comment).setText(S3_CommentPass.removeCommentSequences(comment.text))
            ));
        });
    }

    protected _name: string = "Comments";
}