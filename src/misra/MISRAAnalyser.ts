import Query from "lara-js/api/weaver/Query.js";
import Analyser from "clava-js/api/clava/analysis/Analyser.js";
import AnalyserResult from "clava-js/api/clava/analysis/AnalyserResult.js";
import { FileJp, Joinpoint, Program } from "clava-js/api/Joinpoints.js";
import ResultFormatManager from "clava-js/api/clava/analysis/ResultFormatManager.js"
import Fix from "clava-js/api/clava/analysis/Fix.js";

export type T = Program | FileJp;

export default abstract class MISRAAnalyser extends Analyser {
    #rules: number[];
    #resultFormatManager = new ResultFormatManager();
    #results: AnalyserResult[] = [];

    constructor(rules: number[]) {
        super();
        this.#rules = rules;
    }

    get rules(): number[] {return this.#rules.map(num => num)};

    protected logMISRAError(jp: Joinpoint, message: string, fix?: Fix) {
        this.#results.push(new AnalyserResult(`Non-compliant code at ${jp?.filename}@${jp?.line}:${jp?.column}.`, jp, message, fix))
    }

    protected abstract processRules($startNode: T): void;

    analyse($startNode: T = Query.root() as Program) {
        this.processRules($startNode);

        this.#resultFormatManager.setAnalyserResultList(this.#results);
        const fileResult = this.#resultFormatManager.formatResultList($startNode);

        return fileResult;
    }
}