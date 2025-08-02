import {Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import { areDistinctIdentifiers, getIdentifierName } from "../../utils/IdentifierUtils.js";
import { getExternalLinkageIdentifiers } from "../../utils/ProgramUtils.js";
import { compareLocation } from "../../utils/JoinpointUtils.js";
import { isSameVarDecl } from "../../utils/VarUtils.js";
import IdentifierRenameRule from "./IdentifierRenameRule.js";
import { AnalysisType } from "../../MISRA.js";

/**
 * MISRA-C Rule 5.1 External identifiers shall be distinct.
 */
export default class Rule_5_1_DistinctExternalIdentifiers extends IdentifierRenameRule {
    /**
     * Scope of analysis
     */
    readonly analysisType = AnalysisType.SYSTEM;

    /**
     * @returns Rule identifier according to MISRA-C:2012
     */
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
                    !isSameVarDecl(identifier1, identifier2) &&
                    !areDistinctIdentifiers(identifier1, identifier2) &&
                    compareLocation(identifier2, identifier1) < 0
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
}
