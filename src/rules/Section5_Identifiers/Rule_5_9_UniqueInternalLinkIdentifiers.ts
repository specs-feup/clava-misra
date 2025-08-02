import {Joinpoint, Program} from "@specs-feup/clava/api/Joinpoints.js";
import { getIdentifierDecls, getInternalLinkageIdentifiers } from "../../utils/ProgramUtils.js";
import { getIdentifierName, isIdentifierDuplicated, isIdentifierNameDeclaredBefore, isInternalLinkageIdentifier } from "../../utils/IdentifierUtils.js";
import IdentifierRenameRule from "./IdentifierRenameRule.js";
import { AnalysisType } from "../../MISRA.js";

/**
 * MISRA-C Rule 5.9: Identifiers that define objects or functions with internal linkage should be unique
 */
export default class Rule_5_9_UniqueInternalLinkIdentifiers extends IdentifierRenameRule {
    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SYSTEM;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
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
}
