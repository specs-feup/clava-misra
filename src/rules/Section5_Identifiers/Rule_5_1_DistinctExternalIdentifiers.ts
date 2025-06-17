import {FunctionJp, Joinpoint, Program, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { areDistinctIdentifiers, getIdentifierName, isExternalLinkageIdentifier, renameIdentifier } from "../../utils/IdentifierUtils.js";
import { getExternalLinkageIdentifiers, rebuildProgram } from "../../utils/ProgramUtils.js";
import { getFileLocation } from "../../utils/JoinpointUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

/**
 * Rule 5.1 External identifiers shall be distinct.
 */
export default class Rule_5_1_DistinctExternalIdentifiers extends MISRARule {
    private invalidIdentifiers: (Vardecl | FunctionJp)[] = [];

    constructor(context: MISRAContext) {
        super( context);
    }

    override get name(): string {
        return "5.1";
    }

    /**
     * Checks if the given joinpoint is an external identifier distinct from other external identifiers.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Program)) return false;       
         
        const externalIdentifiers = getExternalLinkageIdentifiers();
        this.invalidIdentifiers = 
            externalIdentifiers.filter(identifier1 =>
                externalIdentifiers.some(identifier2 =>
                    !areDistinctIdentifiers(identifier1, identifier2) &&
                    getFileLocation(identifier2).localeCompare(getFileLocation(identifier1)) < 0
                )
            );
        const nonCompliant = this.invalidIdentifiers.length > 0;

        if (nonCompliant && logErrors) {
            this.invalidIdentifiers.forEach(identifierJp => {
                this.logMISRAError(identifierJp, `Identifier '${getIdentifierName(identifierJp)}' is not distinct from other external identifier within the first 31 characters.`)
            });
        }
        return nonCompliant;
    }

    /**
     * Changes the name of an external identifier that is not distinct from others.
     * External references are also updated to use the new name.
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
