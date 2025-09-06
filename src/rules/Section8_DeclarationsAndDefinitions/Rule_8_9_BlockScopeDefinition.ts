import {DeclStmt, Joinpoint, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { findReferencingFunctions } from "../../utils/VarUtils.js";
import { isInternalLinkageIdentifier } from "../../utils/IdentifierUtils.js";
import { resetCaches } from "../../utils/ProgramUtils.js";

/**
 * MISRA-C Rule 8.9: An object should be defined at block scope if its identifier only appears in a single function
 */
export default class Rule_8_9_BlockScopeDefinition extends MISRARule {
    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SYSTEM;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    override get name(): string {
        return "8.9";
    }

    /**
     * Checks if the provided joinpoint represents an object definition with internal linkage, whose identifier only appears in a single function.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Vardecl && isInternalLinkageIdentifier($jp))) {
            return false;
        }

        const nonCompliant = findReferencingFunctions($jp).length <= 1;

        if (nonCompliant && logErrors) {
            this.logMISRAError($jp, `Object '${$jp.name}' should be defined at block scope because its identifier only appears in one single function.`)
        }
        return nonCompliant;
    }

    /**
     * If the joinpoint represents the definition of an object with internal linkage used exclusively in one function, it is moved to that function's block scope.
     *  
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        const referencingFunctions = findReferencingFunctions($jp as Vardecl);
        const functionJp = referencingFunctions.length > 0 ? referencingFunctions[0] : undefined;
        const declStmt = $jp.getAncestor("declStmt");
        declStmt.detach();
        functionJp?.body.firstChild.insertBefore(declStmt);        
        resetCaches();
        
        return new MISRATransformationReport(MISRATransformationType.Removal);
    }
}
