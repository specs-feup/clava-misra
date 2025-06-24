import { Joinpoint, Program, TypedefDecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getIdentifierName, isIdentifierDuplicated, isIdentifierNameDeclaredBefore, renameIdentifier } from "../../utils/IdentifierUtils.js";
import { getTypeDefDecl } from "../../utils/TypeDeclUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { isTagDecl } from "../../utils/JoinpointUtils.js";
import { getIdentifierDecls, rebuildProgram } from "../../utils/ProgramUtils.js";

/**
 * Rule 5.6: A typedef name shall be a unique identifier.
 * 
 * Exception: The typedef name may be the same as the structure, union  or enumeration tag name associated with the typedef.
 */
export default class Rule_5_6_UniqueTypedefNames extends MISRARule {
    priority = 2; 
    private invalidIdentifiers: any[] = []; // TODO: use IdentifierJp

    constructor(context: MISRAContext) {
        super( context);
    }

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
