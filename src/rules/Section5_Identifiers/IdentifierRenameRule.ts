import {Joinpoint, Program} from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierDecls, getInternalLinkageIdentifiers, rebuildProgram } from "../../utils/ProgramUtils.js";
import { getIdentifierName, isIdentifierDuplicated, isIdentifierNameDeclaredBefore, isInternalLinkageIdentifier, renameIdentifier } from "../../utils/IdentifierUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

/**
 * Abstract base class for MISRA-C rules that enforce constraints on identifier uniqueness where renaming may be required.
 * 
 * Need to implement:
 *  - match($jp, logErrors)
 *  - name()
 */
export default abstract class IdentifierRenameRule extends MISRARule {
    priority = 2;
    /**
     * Identifiers with invalid names that require renaming.
     */
    protected invalidIdentifiers: any[] = []; 

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    abstract override get name(): string;

    /**
     * Checks if the joinpoint violates the rule
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    abstract match($jp: Joinpoint, logErrors: boolean): boolean;

    /**
     * Renames all invalid identifiers found in the program.
     * After renaming, the program is rebuilt to ensure proper linking of functions, variables, and their external declarations.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp, false)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);   
        }

        for (const identifierJp of this.invalidIdentifiers) {
            const newName = this.context.generateIdentifierName(identifierJp)!;
            renameIdentifier(identifierJp, newName);
        }
        rebuildProgram();
        return new MISRATransformationReport(MISRATransformationType.Replacement, Query.root() as Program);
    }
}
