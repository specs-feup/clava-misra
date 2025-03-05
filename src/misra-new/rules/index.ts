import MISRAContext from "../MISRAContext.js";
import Rule_2_3_UnusedTypeDecl from "./Section2_UnusedCode/Rule_2_3_UnusedTypeDecl.js";
import Rule_2_6_UnusedLabels from "./Section2_UnusedCode/Rule_2_6_UnusedLabels.js";
import Rule_2_7_UnusedParameters from "./Section2_UnusedCode/Rule_2_7_UnusedParameters.js";
import Rule_3_1_CommentSequences from "./Section3_Comments/Rule_3_1_CommentSequences.js";
import Rule_3_2_CommentSequences from "./Section3_Comments/Rule_3_2_LineSplicing.js";

export function misraRules(context: MISRAContext) {
    return [
        new Rule_2_3_UnusedTypeDecl(context),
        new Rule_2_6_UnusedLabels(context),
        new Rule_2_7_UnusedParameters(context),
        new Rule_3_1_CommentSequences(context),
        new Rule_3_2_CommentSequences(context)
    ];
}

export default misraRules;
