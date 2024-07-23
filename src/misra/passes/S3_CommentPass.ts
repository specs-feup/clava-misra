import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint";
import MISRAPass from "../MISRAPass";
import { PreprocessingReqs } from "../MISRAReporter";
import { Comment, Joinpoint } from "clava-js/api/Joinpoints";

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
        return str.replace(/(\/\/||\/\*)/g, '');
    }
    
    private r3_1_fixComments($startNode: Joinpoint) { //inlines
        if ($startNode instanceof Comment) {
            $startNode.setText(S3_CommentPass.removeCommentSequences($startNode.text));
        } 
        $startNode.inlineComments.forEach(comment => comment.setText(S3_CommentPass.removeCommentSequences(comment.text)), this);
    }

    protected _name: string = "Comments";
}