import Query from "lara-js/api/weaver/Query.js";
import Analyser from "clava-js/api/clava/analysis/Analyser.js";
import AnalyserResult from "clava-js/api/clava/analysis/AnalyserResult.js";
import { FileJp, Joinpoint, Program } from "clava-js/api/Joinpoints.js";
import ResultFormatManager from "clava-js/api/clava/analysis/ResultFormatManager.js"
import Fix from "clava-js/api/clava/analysis/Fix.js";

type T = Program | FileJp;

export default abstract class MISRAAnalyser extends Analyser {
    rules: number[];
    resultFormatManager = new ResultFormatManager();
    abstract ruleMapper: Map<number, (jp: T) => void>;
    results: AnalyserResult[] = [];

    constructor(rules: number[]) {
        super();
        this.rules = rules;
    }

    logMISRAError(jp: Joinpoint, message: string, fix?: Fix) {
        this.results.push(new AnalyserResult(`Non-compliant code at ${jp?.filename}@${jp?.line}:${jp?.column}.`, jp, message, fix))
    }

    analyse($startNode: T = Query.root() as Program) {
        for (const rule of this.rules) {
            const rulePass = this.ruleMapper.get(rule);
            if (rulePass) {
                rulePass($startNode);
            }
            else {
                console.log("Analyser doesn't support rule number", rule);
                return undefined;
            }
        }

        this.resultFormatManager.setAnalyserResultList(this.results);
        const fileResult = this.resultFormatManager.formatResultList($startNode);

        return fileResult;
    }
}