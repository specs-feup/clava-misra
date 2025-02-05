import Query from "@specs-feup/lara/api/weaver/Query.js";
import Analyser from "@specs-feup/clava/api/clava/analysis/Analyser.js";
import AnalyserResult from "@specs-feup/clava/api/clava/analysis/AnalyserResult.js";
import { FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import ResultFormatManager from "@specs-feup/clava/api/clava/analysis/ResultFormatManager.js"
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";

type T = Program | FileJp;

export default abstract class MISRAAnalyser extends Analyser {
    #rules: number[];
    #resultFormatManager = new ResultFormatManager();
    protected abstract ruleMapper: Map<number, (jp: T) => void>;
    #results: AnalyserResult[] = [];

    constructor(rules: number[]) {
        super();
        this.#rules = rules;
    }

    get rules(): number[] {return this.#rules.map(num => num)};

    protected logMISRAError(jp: Joinpoint, message: string, fix?: Fix) {
        this.#results.push(new AnalyserResult(`Non-compliant code at ${jp?.filename}@${jp?.line}:${jp?.column}.`, jp, message, fix))
    }

    analyse($startNode: T = Query.root() as Program) {
        for (const rule of this.rules) {
            const rulePass = this.ruleMapper.get(rule);
            if (rulePass) {
                rulePass($startNode);
            }
            else {
                throw new Error("Analyser doesn't support rule number " + rule)
            }
        }

        this.#resultFormatManager.setAnalyserResultList(this.#results);
        const fileResult = this.#resultFormatManager.formatResultList($startNode);

        return fileResult;
    }
}