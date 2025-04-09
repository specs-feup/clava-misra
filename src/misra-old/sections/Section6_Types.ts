import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, Joinpoint, Field, IntLiteral, BuiltinType } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export default class Section6_Types extends MISRAAnalyser {
    ruleMapper: Map<string, (jp: Program | FileJp) => void>;

    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["6.2", this.r6_2_noSingleBitSignedFields.bind(this)],

        ]);
    }
    
    private r6_2_noSingleBitSignedFields($startNode: Joinpoint) {
        Query.searchFrom($startNode, Field).get().forEach(field => {
            if (field.children.length > 0 && field.name) {
                const width = new Number((field.children[0].children[0] as IntLiteral).value);
                if (width == 1 && (field.type as BuiltinType).isSigned) {
                    this.logMISRAError(this.currentRule, field, `Single-bit named bit field ${field.name} must not have a signed type.`);
                }
            }
        }, this);
    }
}