import MISRAContext from "../MISRAContext.js";
import Rule_2_6_UnusedLabels from "./Section2_UnusedCode/Rule_2_6_UnusedLabels.js";
import Rule_3_1_CommentSequences from "./Section3_Comments/Rule_3_1_CommentSequences.js";
import Rule_3_2_CommentSequences from "./Section3_Comments/Rule_3_2_LineSplicing.js";

export function misraRules(context: MISRAContext) {
    return [
        new Rule_3_1_CommentSequences(context),
        new Rule_3_2_CommentSequences(context)
    ];
}

export default misraRules;
