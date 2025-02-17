import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, Joinpoint, Include } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export default class Section20_PreprocessingDirectives extends MISRAAnalyser {
    ruleMapper: Map<string, (jp: Program | FileJp) => void>;

    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["20.2", this.r20_2_noInvalidCharsInInclude.bind(this)]
        ]);
    }
    
    private r20_2_noInvalidCharsInInclude($startNode: Joinpoint) {
        Query.searchFrom($startNode, Include).get().forEach(include => {
            if (/.*('|"|\\|\/\*|\/\/).*/.test(include.name)) {
                this.logMISRAError(this.currentRule, include, `Invalid characters in include for ${include.name}. Invalid characters are ', ", \\, and the sequences /* and //.`)
            }
        }, this);
    }
}