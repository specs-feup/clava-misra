import { Break, Case, Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
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
    readonly priority = 4; 

    #misplacedCases: Case[] = [];
    
    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "16.2";
    }

    /**
     * Checks if the given joinpoint is a switch statement with any misplaced case labels. 
     * A case label is considered misplaced if it is not a direct child of the switch body.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
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

    /**
     * Transforms the joinpoint if it represents a switch with any misplaced case labels. 
     * For that, each case label is moved to a new location within the switch.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        for (const caseLabel of this.#misplacedCases) {
            this.changeCaseLocation(caseLabel);
        }
        return new MISRATransformationReport(MISRATransformationType.DescendantChange);
    }


    /**
     * Relocates a inner case to a new position while preserving control flow.
     * First, copies the instructions to be executed (direct siblings and fall-through code).
     * Then, moves the case to the new position and finally appends the copied instructions after the case.
     * 
     * @param caseLabel The inner case to relocate
     */
    private changeCaseLocation(caseLabel: Case) {
        // Collect instructions that follow the given case
        const instructions = caseLabel.siblingsRight.map(sibling => sibling.deepCopy());

        // If direct instruction do not have a break statement, find additional statements from higher scopes that will be executed
        if (!instructions.some(instruction => instruction instanceof Break)) {
            let lastScope: Joinpoint = caseLabel;
            do {
                lastScope = lastScope.parent;
                const rightStmts = lastScope.siblingsRight;
                for (const rightStmt of rightStmts) {
                    if (rightStmt.currentRegion instanceof Switch && rightStmt instanceof Case) {
                        break;
                    }
                    instructions.push(rightStmt.deepCopy());
                }
            } while(!(lastScope.currentRegion instanceof Switch));
        }

        // Locate target position
        const caseAncestor = this.getCaseAncestor(caseLabel);
        const caseAncestorRightSiblings = caseAncestor.siblingsRight;
        const nextCaseIndex = caseAncestorRightSiblings.findIndex(jp => jp instanceof Case);
        const targetStmt = nextCaseIndex != -1 ? caseAncestorRightSiblings[nextCaseIndex] : caseAncestorRightSiblings[caseAncestorRightSiblings.length - 1];

        // Move case label to the new position
        caseLabel.detach();
        if (targetStmt instanceof Case) {
            targetStmt.insertBefore(caseLabel);
        } else {
            targetStmt.insertAfter(caseLabel);
        }

        // Add instructions after caseLabel
        let lastStmt: Joinpoint = caseLabel;
        for (const instruction of instructions) {
            lastStmt.insertAfter(instruction);
            lastStmt = instruction;
        }
    }

    /**
     * Retrieves the top-level case that contains a given inner case label.
     * 
     * @param caseLabel - The inner case joinpoint
     * @returns The ancestor case that contains the given inner case
     */
    private getCaseAncestor(caseLabel: Case): Case {
        let stmt: Joinpoint = caseLabel; 
        while (!(stmt.currentRegion instanceof Switch)) {
            stmt = stmt.parent;
        }
        const caseAncestor = stmt.siblingsLeft.reverse().find(jp => jp instanceof Case);
        return caseAncestor!;
    }
}
