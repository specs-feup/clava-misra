import { Joinpoint, Program, TypedefDecl } from "@specs-feup/clava/api/Joinpoints.js";
import { getIdentifierName, isIdentifierDuplicated, isIdentifierNameDeclaredBefore } from "../../utils/IdentifierUtils.js";
import { getTypeDefDecl } from "../../utils/TypeDeclUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { isTagDecl } from "../../utils/JoinpointUtils.js";
import { getIdentifierDecls } from "../../utils/ProgramUtils.js";
import IdentifierRenameRule from "./IdentifierRenameRule.js";
import { AnalysisType } from "../../MISRA.js";

/**
 * Rule 5.6: A typedef name shall be a unique identifier.
 * 
 * Exception: The typedef name may be the same as the structure, union  or enumeration tag name associated with the typedef.
 */
export default class Rule_5_6_UniqueTypedefNames extends IdentifierRenameRule {
    readonly analysisType = AnalysisType.SYSTEM;
    
    override get name(): string {
        return "5.6";
    }

    /**
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof Program)) return false;
        
        const typedefDecls = Query.search(TypedefDecl).get();

        this.invalidIdentifiers = getIdentifierDecls().filter((identifierJp) => 
        {
            if (isTagDecl(identifierJp)) {
                return typedefDecls.filter((decl) =>
                    getIdentifierName(identifierJp) === getIdentifierName(decl) &&
                    getTypeDefDecl(identifierJp)?.astId !== decl.astId
                ).length > 0
            } 
            else if (identifierJp instanceof TypedefDecl) {
                return isIdentifierNameDeclaredBefore(identifierJp, typedefDecls);
            } 
            return isIdentifierDuplicated(identifierJp, typedefDecls);
        });

        const nonCompliant = this.invalidIdentifiers.length > 0;

        if (nonCompliant && logErrors) { 
            this.invalidIdentifiers.forEach(identifierJp => {
                this.logMISRAError(identifierJp, `Identifier '${getIdentifierName(identifierJp)}' is also the name of a typedef. Typedef identifiers must not be reused.`);
            })
        }
        return nonCompliant;
    }
}
