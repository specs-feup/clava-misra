import {Joinpoint, Program} from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierDecls, getInternalLinkageIdentifiers, rebuildProgram } from "../../utils/ProgramUtils.js";
import { getIdentifierName, isIdentifierDuplicated, isIdentifierNameDeclaredBefore, isInternalLinkageIdentifier, renameIdentifier } from "../../utils/IdentifierUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

/**
 * Rule 5.9: Identifiers that define objects or functions with internal linkage should be unique
 */
export default class Rule_5_9_UniqueInternalLinkIdentifiers extends MISRARule {
    priority = 2;
    private invalidIdentifiers: any[] = []; // TODO: use IdentifierJp
    
    constructor(context: MISRAContext) {
        super( context);
    }

    override get name(): string {
        return "5.9";
    }

    /**
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Program)) return false;

        const internalLinkageIdentifiers = getInternalLinkageIdentifiers();
        this.invalidIdentifiers = getIdentifierDecls().filter((identifierJp) => 
            isInternalLinkageIdentifier(identifierJp) ? 
                isIdentifierNameDeclaredBefore(identifierJp, internalLinkageIdentifiers) :
                isIdentifierDuplicated(identifierJp, internalLinkageIdentifiers)
        );
        
        const nonCompliant = this.invalidIdentifiers.length > 0;
        if (nonCompliant && logErrors) {
            this.invalidIdentifiers.forEach(identifierJp => {
                this.logMISRAError(identifierJp, `Identifier '${getIdentifierName(identifierJp)}' is already defined with internal linkage in this or other file.`);
            })
        }
        return nonCompliant;
    }

    /**
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) {
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
