import { Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierName, isExternalLinkageIdentifier, isIdentifierDuplicated, isIdentifierNameDeclaredBefore, renameIdentifier } from "../../utils/IdentifierUtils.js";
import { getExternalLinkageIdentifiers, getIdentifierDecls, rebuildProgram } from "../../utils/ProgramUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import IdentifierRenameRule from "./IdentifierRenameRule.js";

/**
 * Rule 5.8: Identifiers that define objects or functions with external linkage shall be unique
 */
export default class Rule_5_8_UniqueExternalLinkIdentifiers extends IdentifierRenameRule {

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
        
        const externalLinkageIdentifiers = getExternalLinkageIdentifiers();
        this.invalidIdentifiers = getIdentifierDecls().filter((identifierJp) =>
          isExternalLinkageIdentifier(identifierJp) ?
            isIdentifierNameDeclaredBefore(identifierJp, externalLinkageIdentifiers) :
            isIdentifierDuplicated(identifierJp, externalLinkageIdentifiers)
        );

        const nonCompliant = this.invalidIdentifiers.length > 0;
        if (nonCompliant && logErrors) { 
            this.invalidIdentifiers.forEach(identifierJp => {
                this.logMISRAError(identifierJp, `Identifier '${getIdentifierName(identifierJp)}' is already defined with external linkage in this or other file.`);
            })
        }
        return nonCompliant;
    }
}
