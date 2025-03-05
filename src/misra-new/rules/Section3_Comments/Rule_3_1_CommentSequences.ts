import { Comment, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { isInlineComment, getComments } from "../../utils.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

/**
 * MISRA Rule 3.1: 
 */
export default class Rule_3_1_CommentSequences extends MISRARule {

    constructor(context: MISRAContext) {
        super("3.1", context);
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        const invalidComments = getComments($jp).filter(comment => 
            (isInlineComment(comment) && /(\/\*)/g.test(comment.text)) ||
            (!isInlineComment(comment) && /(\/\/|\/\*)/g.test(comment.text)));

        if (logErrors) {
            invalidComments.forEach(comment =>
                this.logMISRAError(comment, `Comment ${comment.text} contains invalid character sequences.`)
            )
        }
        return invalidComments.length > 0;
    }

    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        const comments = getComments($jp);
        for (const comment of comments) {
            const invalidSymbols = isInlineComment(comment) ? /(\/\*)/g : /(\/\/|\/\*)/g;
            const newText = comment.text.replace(invalidSymbols, '');
            comment.setText(newText);
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);;
    }
}
