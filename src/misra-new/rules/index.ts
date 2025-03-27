import MISRAContext from "../MISRAContext.js";
import Rule_16_2_TopLevelSwitch from "./Section16_SwitchStatements/Rule_16_2_TopLevelSwitch.js";
import Rule_16_3_UnconditionalBreak from "./Section16_SwitchStatements/Rule_16_3_UnconditionalBreak.js";
import Rule_16_4_SwitchHasDefault from "./Section16_SwitchStatements/Rule_16_4_SwitchHasDefault.js";
import Rule_16_5_DefaultFirstOrLast from "./Section16_SwitchStatements/Rule_16_5_DefaultFirstOrLast.js";
import Rule_16_6_SwitchMinTwoClauses from "./Section16_SwitchStatements/Rule_16_6_SwitchMinTwoClauses.js";
import Rule_16_7_NonBooleanSwitchCondition from "./Section16_SwitchStatements/Rule_16_7_NonBooleanSwitchCondition.js";
import Rule_17_6_StaticArraySizeParam from "./Section17_Functions/Rule_17_6_StaticArraySizeParam.js";
import Rule_17_7_UnusedReturnValue from "./Section17_Functions/Rule_17_7_UnusedReturnValue.js";
import Rule_20_2_InvalidHeaderFileName from "./Section20-PreprocessingDirectives/Rule_20_2_InvalidHeaderFileName.js";
import Rule_2_3_UnusedTypeDecl from "./Section2_UnusedCode/Rule_2_3_UnusedTypeDecl.js";
import Rule_2_4_UnusedTagDecl from "./Section2_UnusedCode/Rule_2_4_UnusedTagDecl.js";
import Rule_2_6_UnusedLabels from "./Section2_UnusedCode/Rule_2_6_UnusedLabels.js";
import Rule_2_7_UnusedParameters from "./Section2_UnusedCode/Rule_2_7_UnusedParameters.js";
import Rule_3_1_CommentSequences from "./Section3_Comments/Rule_3_1_CommentSequences.js";
import Rule_3_2_CommentSequences from "./Section3_Comments/Rule_3_2_LineSplicing.js";

export function misraRules(context: MISRAContext) {
    return [
        new Rule_2_3_UnusedTypeDecl(context),
        new Rule_2_4_UnusedTagDecl(context),
        new Rule_2_6_UnusedLabels(context),
        new Rule_2_7_UnusedParameters(context),
        new Rule_3_1_CommentSequences(context),
        new Rule_3_2_CommentSequences(context),
        new Rule_16_2_TopLevelSwitch(context),
        new Rule_16_3_UnconditionalBreak(context),
        new Rule_16_4_SwitchHasDefault(context),
        new Rule_16_5_DefaultFirstOrLast(context),
        new Rule_16_6_SwitchMinTwoClauses(context),
        new Rule_16_7_NonBooleanSwitchCondition(context), 
        new Rule_17_6_StaticArraySizeParam(context),
        new Rule_17_7_UnusedReturnValue(context),
        new Rule_20_2_InvalidHeaderFileName(context),
    ];
}

export default misraRules;
