import { Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { areIdentifierNamesEqual, getIdentifierName, isExternalLinkageIdentifier, isIdentifierDecl, isIdentifierDuplicated, renameIdentifier } from "../../utils/IdentifierUtils.js";
import { getExternalLinkageIdentifiers, getIdentifierDecls, rebuildProgram } from "../../utils/ProgramUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { getFileLocation } from "../../utils/JoinpointUtils.js";

/**
 * Rule 5.8: Identifiers that defi ne objects or functions with external linkage shall be unique
 */
export default class Rule_5_8_UniqueExternalLinkIdentifiers extends MISRARule {
    private invalidIdentifiers: any[] = []; // TODO: use IdentifierJp

    constructor(context: MISRAContext) {
        super( context);
    }

    override get name(): string {
        return "5.8";
    }

    /**
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Program)) return false;
        
        this.invalidIdentifiers = getIdentifierDecls().filter((identifierJp) => this.hasExternalLinkageConflict(identifierJp));
        const nonCompliant = this.invalidIdentifiers.length > 0;

        if (nonCompliant && logErrors) { 
            this.invalidIdentifiers.forEach(identifierJp => {
                this.logMISRAError(identifierJp, `Identifier '${getIdentifierName(identifierJp)}' is already defined with external linkage in this or other file.`);
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

    private hasExternalLinkageConflict($jp: Joinpoint): boolean {
        if (!isIdentifierDecl($jp)) {
            return false;
        } 

        const externalLinkageIdentifiers = getExternalLinkageIdentifiers();
        if (isExternalLinkageIdentifier($jp)) {
            return externalLinkageIdentifiers
                .some((identifier) => getFileLocation(identifier).localeCompare(getFileLocation($jp)) < 0 && areIdentifierNamesEqual(identifier, $jp));
        } 
        return isIdentifierDuplicated($jp, externalLinkageIdentifiers);
    }
}
