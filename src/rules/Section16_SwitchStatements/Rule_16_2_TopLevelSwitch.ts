import { Case, Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

/**
 * MISRA Rule 16.2: A switch label shall only be used when the most closely-enclosing
compound statement is the body of a switch statement
 */
export default class Rule_16_2_TopLevelSwitch extends MISRARule {
    priority = 2; 
    #misplacedCases: Case[] = [];

    constructor(context: MISRAContext) {
        super("16.2", context);
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

    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        for (const caseLabel of this.#misplacedCases) {
            caseLabel.detach();
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }
}
