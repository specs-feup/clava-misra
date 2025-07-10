import {Joinpoint, Program} from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { renameIdentifier } from "../../utils/IdentifierUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

/**
 * Abstract base class for MISRA-C rules that enforce constraints on identifier uniqueness where renaming may be required.
 * 
 * Need to implement:
 *  - analysisType
 *  - name()
 *  - match($jp, logErrors)
 */
export default abstract class IdentifierRenameRule extends MISRARule {
    priority = 2;

    /**
     * Specifies the scope of analysis: single unit or entire system.
     */
    abstract readonly analysisType: AnalysisType;
    
    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
    abstract override get name(): string;

    /**
     * Identifiers with invalid names that require renaming.
     */
    protected invalidIdentifiers: any[] = []; 

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
        this.rebuildProgram();
        return new MISRATransformationReport(MISRATransformationType.Replacement, Query.root() as Program);
    }
}
