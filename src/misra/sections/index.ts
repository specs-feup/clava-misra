import Section2_UnusedCode from "./Section2_UnusedCode.js";
import Section3_Comments from "./Section3_Comments.js";
import Section5_Identifiers from "./Section5_Identifiers.js";
import Section6_Types from "./Section6_Types.js";
import Section7_LiteralsConstants from "./Section7_LiteralsConstants.js";
import Section8_DeclarationsDefinitions from "./Section8_DeclarationsDefinitions.js";
import Section10_EssentialTypeModel from "./Section10_EssentialTypeModel.js";
import Section11_PointerTypeConversions from "./Section11_PointerTypeConversions.js";
import Section12_Expressions from "./Section12_Expressions.js";
import Section13_SideEffects from "./Section13_SideEffects.js";
import Section14_ControlStmtExprs from "./Section14_ControlStmtExprs.js";
import Section15_ControlFlow from "./Section15_ControlFlow.js";
import Section16_SwitchStatements from "./Section16_SwitchStatements.js";
import Section17_Functions from "./Section17_Functions.js";
import Section18_PointersAndArrays from "./Section18_PointersAndArrays.js";
import Section19_OverlappingStorage from "./Section19_OverlappingStorage.js";
import Section20_PreprocessingDirectives from "./Section20_PreprocessingDirectives.js";
import Section21_StandardLibraries from "./Section21_StandardLibraries.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

const misraAnalysers = new Map<number, MISRAAnalyser>([
    [2, new Section2_UnusedCode()],
    [3, new Section3_Comments()],
    [5, new Section5_Identifiers()],
    [6, new Section6_Types()],
    [7, new Section7_LiteralsConstants()],
    [8, new Section8_DeclarationsDefinitions()],
    [10, new Section10_EssentialTypeModel()],
    [11, new Section11_PointerTypeConversions()],
    [12, new Section12_Expressions()],
    [13, new Section13_SideEffects()],
    [14, new Section14_ControlStmtExprs()],
    [15, new Section15_ControlFlow()],
    [16, new Section16_SwitchStatements()],
    [17, new Section17_Functions()],
    [18, new Section18_PointersAndArrays()],
    [19, new Section19_OverlappingStorage()],
    [20, new Section20_PreprocessingDirectives()],
    [21, new Section21_StandardLibraries()]
]);

export default misraAnalysers;
