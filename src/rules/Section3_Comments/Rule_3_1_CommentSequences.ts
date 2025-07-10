import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { isInlineComment, getComments } from "../../utils/CommentUtils.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

/**
 * MISRA Rule 3.1: The character sequences /* an d // shall not be used within a comment.
 */
export default class Rule_3_1_CommentSequences extends MISRARule {
    
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    override get name(): string {
        return "3.1";
    }

    /**
     * Checks if given joinpoint contains disallowed character sequences in comments.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        const invalidComments = getComments($jp).filter(comment => 
            (isInlineComment(comment) && /(\/\*)/g.test(comment.text)) ||
            (!isInlineComment(comment) && /(\/\/|\/\*)/g.test(comment.text)));

        if (logErrors) {
            invalidComments.forEach(comment =>
                this.logMISRAError(comment, `Comment \'${comment.text}\' contains invalid character sequences.`)
            )
        }
        return invalidComments.length > 0;
    }

    /**
     * Transforms the given joinpoint if it represents a joinpoint containing disallowed character sequences in comments.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
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
