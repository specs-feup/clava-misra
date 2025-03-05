import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { isInlineComment, getComments } from "../../utils.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

export default class Rule_3_2_LineSplicing extends MISRARule {
    
    constructor(context: MISRAContext) {
        super("3.2", context);
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        const invalidComments = getComments($jp).filter(comment => 
            (isInlineComment(comment) && /\/\n/g.test(comment.text)));

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
            const newText = comment.text.replace(/\/\n/g, '');
            comment.setText(newText);
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
