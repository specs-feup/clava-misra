import misraAnalysers from "./sections/index.js";

import MISRAAnalyser from "./MISRAAnalyser.js";
import MISRAAnalyserResult from "./MISRAAnalyserResult.js";

export default class MISRATool {
    #analysers: Map<number, MISRAAnalyser>;
    // #pass: Map<number, MISRAPass>;
    #violations: MISRAAnalyserResult[] = [];
    //#corrections: MISRAPassResult[] = [];

    constructor(rules?: string[]) {
        this.#analysers = misraAnalysers;
        
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
        });

        if (printErrors) {
            this.printErrors();
        }
    } 

    //TO DO
    public transform() {
        // this.analyse()
        // correct errors
    }

    private printErrors() {
        for (const violation of this.#violations) {
            console.log(`${violation.name}. ${violation.message}`);
        }
    }

    private getRuleSection(rule: string): number {
        if (!/^\d+\.\d+$/.test(rule)) {
            throw new Error(`Invalid rule format: ${rule}`);
        }
        return Number(rule.split(".")[0]);
    }

}