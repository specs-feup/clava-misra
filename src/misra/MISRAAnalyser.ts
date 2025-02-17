import Query from "@specs-feup/lara/api/weaver/Query.js";
import Analyser from "@specs-feup/clava/api/clava/analysis/Analyser.js";
import AnalyserResult from "@specs-feup/clava/api/clava/analysis/AnalyserResult.js";
import { FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import ResultFormatManager from "@specs-feup/clava/api/clava/analysis/ResultFormatManager.js"
import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";
import MISRAAnalyserResult from "./MISRAAnalyserResult.js";

type T = Program | FileJp;

export default abstract class MISRAAnalyser extends Analyser {
    #selectedRules: string[];
    protected currentRule: string = "";
    #resultFormatManager = new ResultFormatManager();
    protected abstract ruleMapper: Map<string, (jp: T) => void>;
    #results: AnalyserResult[] = [];

    constructor(rules?: string[]) {
        super();
        this.#selectedRules = rules ?? [];
    }

    public addSelectedRule(ruleID: string) {
        this.#selectedRules.push(ruleID);
    }

    public setSelectedRules(rules: string[]) {
        this.#selectedRules = rules;
    }

    protected logMISRAError(rule: string, jp: Joinpoint, message: string, fix?: Fix) {
        this.#results.push(new MISRAAnalyserResult(rule, `Non-compliant code at ${jp?.filename}@${jp?.line}:${jp?.column}.`, jp, message, fix))
    }

    analyse($startNode: T = Query.root() as Program) {
        if (this.#selectedRules.length === 0) {
            this.setSelectedRules(Array.from(this.ruleMapper.keys()));
        }

        for (const rule of this.#selectedRules) {
            this.currentRule = rule;
            const rulePass = this.ruleMapper.get(rule);
            if (rulePass) {
                rulePass($startNode);
            }
            else {
                throw new Error("Analyser doesn't support rule number " + rule);
            }
        }

        this.#resultFormatManager.setAnalyserResultList(this.#results);
        const fileResult = this.#resultFormatManager.formatResultList($startNode);
        return fileResult;
    }
}