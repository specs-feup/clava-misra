import AnalyserResult from "@specs-feup/clava/api/clava/analysis/AnalyserResult.js";
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";
import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";

export default class MISRAAnalyserResult extends AnalyserResult {
    private violatedRule: string;

    constructor(rule:string, name: string, node: Joinpoint, message: string, fix?: Fix) {
        super(name, node, message, fix);
        this.violatedRule = rule;
    }

    getViolatedRule() {
        return this.violatedRule;
    }
}