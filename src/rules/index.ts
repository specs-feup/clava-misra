import MISRAContext from "../MISRAContext.js";
import MISRARule from "../MISRARule.js";
import Rule_13_6_SafeSizeOfOperand from "./Section13_SideEffects/Rule_13_6_SafeSizeOfOperand.js";
import Rule_16_2_TopLevelSwitch from "./Section16_SwitchStatements/Rule_16_2_TopLevelSwitch.js";
import Rule_16_3_UnconditionalBreak from "./Section16_SwitchStatements/Rule_16_3_UnconditionalBreak.js";
import Rule_16_4_SwitchHasDefault from "./Section16_SwitchStatements/Rule_16_4_SwitchHasDefault.js";
import Rule_16_5_DefaultFirstOrLast from "./Section16_SwitchStatements/Rule_16_5_DefaultFirstOrLast.js";
import Rule_16_6_SwitchMinTwoClauses from "./Section16_SwitchStatements/Rule_16_6_SwitchMinTwoClauses.js";
import Rule_16_7_NonBooleanSwitchCondition from "./Section16_SwitchStatements/Rule_16_7_NonBooleanSwitchCondition.js";
import Rule_17_3_ImplicitFunction from "./Section17_Functions/Rule_17_3_ImplicitFunction.js";
import Rule_17_4_NonVoidReturn from "./Section17_Functions/Rule_17_4_NonVoidReturn.js";
import Rule_17_6_StaticArraySizeParam from "./Section17_Functions/Rule_17_6_StaticArraySizeParam.js";
import Rule_17_7_UnusedReturnValue from "./Section17_Functions/Rule_17_7_UnusedReturnValue.js";
import Rule_2_3_UnusedTypeDecl from "./Section2_UnusedCode/Rule_2_3_UnusedTypeDecl.js";
import Rule_2_4_UnusedTagDecl from "./Section2_UnusedCode/Rule_2_4_UnusedTagDecl.js";
import Rule_2_6_UnusedLabels from "./Section2_UnusedCode/Rule_2_6_UnusedLabels.js";
import Rule_2_7_UnusedParameters from "./Section2_UnusedCode/Rule_2_7_UnusedParameters.js";
import Rule_3_1_CommentSequences from "./Section3_Comments/Rule_3_1_CommentSequences.js";
import Rule_3_2_CommentSequences from "./Section3_Comments/Rule_3_2_LineSplicing.js";
import Rule_5_1_UniqueExternalIdentifiers from "./Section5_Identifiers/Rule_5_1_DistinctExternalIdentifiers.js";

export function sortRules(context: MISRAContext) {
     
    const rules: MISRARule[] = [
        new Rule_2_3_UnusedTypeDecl(context),
        new Rule_2_4_UnusedTagDecl(context),
        new Rule_2_6_UnusedLabels(context),
        new Rule_2_7_UnusedParameters(context),
        new Rule_3_1_CommentSequences(context),
        new Rule_3_2_CommentSequences(context),
        new Rule_5_1_UniqueExternalIdentifiers(context),
        new Rule_13_6_SafeSizeOfOperand(context),
        new Rule_16_2_TopLevelSwitch(context),
        new Rule_16_3_UnconditionalBreak(context),
        new Rule_16_4_SwitchHasDefault(context),
        new Rule_16_5_DefaultFirstOrLast(context),
        new Rule_16_6_SwitchMinTwoClauses(context),
        new Rule_16_7_NonBooleanSwitchCondition(context), 
        new Rule_17_3_ImplicitFunction(context),
        new Rule_17_4_NonVoidReturn(context),
        new Rule_17_6_StaticArraySizeParam(context),
        new Rule_17_7_UnusedReturnValue(context),
    ];

    return rules.sort((ruleA, ruleB) => ruleA.priority - ruleB.priority);
}

export default sortRules;