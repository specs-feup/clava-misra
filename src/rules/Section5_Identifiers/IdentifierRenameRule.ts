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
    protected invalidIdentifiers: any[] = []; 
    
    constructor(context: MISRAContext) {
        super( context);
    }

    abstract override get name(): string;

    abstract match($jp: Joinpoint, logErrors: boolean): boolean;

    /**
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
