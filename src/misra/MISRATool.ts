import Section10_EssentialTypeModel from "./sections/Section10_EssentialTypeModel.js";
import Section11_PointerTypeConversions from "./sections/Section11_PointerTypeConversions.js";
import Section12_Expressions from "./sections/Section12_Expressions.js";
import Section13_SideEffects from "./sections/Section13_SideEffects.js";
import Section14_ControlStmtExprs from "./sections/Section14_ControlStmtExprs.js";
import Section15_ControlFlow from "./sections/Section15_ControlFlow.js";
import Section16_SwitchStatements from "./sections/Section16_SwitchStatements.js";
import Section17_Functions from "./sections/Section17_Functions.js";
import Section18_PointersAndArrays from "./sections/Section18_PointersAndArrays.js";
import Section19_OverlappingStorage from "./sections/Section19_OverlappingStorage.js";
import Section20_PreprocessingDirectives from "./sections/Section20_PreprocessingDirectives.js";
import Section21_StandardLibraries from "./sections/Section21_StandardLibraries.js";
import Section2_UnusedCode from "./sections/Section2_UnusedCode.js";
import Section3_Comments from "./sections/Section3_Comments.js";
import Section5_Identifiers from "./sections/Section5_Identifiers.js";
import Section6_Types from "./sections/Section6_Types.js";
import Section7_LiteralsConstants from "./sections/Section7_LiteralsConstants.js";
import Section8_DeclarationsDefinitions from "./sections/Section8_DeclarationsDefinitions.js";
import MISRAAnalyser from "./MISRAAnalyser.js";
import MISRAAnalyserResult from "./MISRAAnalyserResult.js";
import MISRAPass from "./MISRAPass.js";
import MISRAPassResult from "./MISRAPassResult.js";
import MessageGenerator from "@specs-feup/clava/api/clava/analysis/MessageGenerator.js";

export default class MISRATool {
    private messageManager: MessageGenerator;
    #analysers: Map<number, MISRAAnalyser>;
    // #pass: Map<number, MISRAPass>;
    #violations: MISRAAnalyserResult[] = [];
    //#corrections: MISRAPassResult[] = [];

    constructor(rules?: string[]) {
        this.messageManager = new MessageGenerator();
        this.#analysers = new Map<number, MISRAAnalyser>([
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
        
        // TODO: init pass

        rules?.forEach(rule => {
            const ruleSection = this.getRuleSection(rule);
            const analyser = this.#analysers.get(ruleSection);
            if (analyser) {
                analyser.addSelectedRule(rule);
            } else {
                throw new Error("Analyser doesn't support rule number " + rule);
            }
        })
    }

    public analyse(printErrors: boolean = true) {
        this.#analysers.forEach(analyser => {
            const analysisResult = analyser.analyse();
            if (analysisResult !== undefined) {
                this.#violations.push(...analysisResult.list as MISRAAnalyserResult[]); 
            } 
            if (printErrors) {
                this.messageManager.append(analysisResult);
            }
        });

        if (printErrors) {
            this.messageManager.generateReport();
        }
    } 

    //TO DO
    public transform() {
        // this.analyse()
        // correct errors
    }

    private getRuleSection(rule: string): number {
        if (!/^\d+\.\d+$/.test(rule)) {
            throw new Error(`Invalid rule format: ${rule}`);
        }
        return Number(rule.split(".")[0]);
    }
}