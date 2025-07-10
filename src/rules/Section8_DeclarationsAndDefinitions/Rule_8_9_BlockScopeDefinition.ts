import {DeclStmt, Joinpoint, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { findReferencingFunctions } from "../../utils/VarUtils.js";
import { isInternalLinkageIdentifier } from "../../utils/IdentifierUtils.js";
import { resetCaches } from "../../utils/ProgramUtils.js";

/**
 * Rule 8.9: An object should be defined at block scope if its identifier only appears in a single function
 */
export default class Rule_8_9_BlockScopeDefinition extends MISRARule {
    readonly analysisType = AnalysisType.SYSTEM;

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
        if (!($jp instanceof DeclStmt && $jp.decls.length === 1)) {
            return false;
        }

        const varDecls = Query.searchFrom($jp, Vardecl).get();
        if (!(varDecls.length === 1 && isInternalLinkageIdentifier(varDecls[0]))) {
            return false;
        }
        const varDecl = varDecls[0];
        const nonCompliant = findReferencingFunctions(varDecl).length === 1;

        if (nonCompliant && logErrors) {
            this.logMISRAError(varDecl, `Object '${varDecl.name}' should be defined at block scope because its identifier only appears in one single function.`)
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

        try {
            const varDecl = Query.searchFrom($jp, Vardecl).get()[0];
            const functionJp = findReferencingFunctions(varDecl)[0];
            $jp.detach();
            functionJp.body.firstChild.insertBefore($jp);
            resetCaches();
            
            return new MISRATransformationReport(MISRATransformationType.Removal);
        } catch(error) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }
    }
}
