import { Case, Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

/**
 * MISRA-C Rule 16.2: A switch label shall only be used when the most closely-enclosing compound statement is the body of a switch statement
 */
export default class Rule_16_2_TopLevelSwitch extends MISRARule {    
    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    /**
     * A positive integer starting from 1 that indicates the rule's priority, determining the order in which rules are applied.
     */
    readonly priority = 3; 

    #misplacedCases: Case[] = [];
    
    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "16.2";
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Switch)) return false;

        this.#misplacedCases = Query.searchFrom($jp, Case).get()
            .filter(caseLabel => !(caseLabel.currentRegion instanceof Switch));

        if (logErrors) {
            this.#misplacedCases.forEach(caseLabel =>
                this.logMISRAError(caseLabel, "A switch label can only be used if its enclosing compound statement is the switch statement itself.")
            );
        }    
        return this.#misplacedCases.length > 0;
    }

    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        for (const caseLabel of this.#misplacedCases) {
            caseLabel.detach();
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
