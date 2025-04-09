import { EnumDecl, Joinpoint,RecordJp,TypedefDecl, TypedefType } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getBaseType, getTagUses, getTypeDecl, getTypedJps } from "../../utils/utils.js";

/**
 * MISRA-C Rule 2.3: A project should not contain unused type declarations.
 */
export default class Rule_2_3_UnusedTypeDecl extends MISRARule {

    constructor(context: MISRAContext) {
        super("2.3", context);
    }

    /**
     * Checks if a given joinpoint uses the specified typedef declaration.
     * @param jp - The joinpoint to check
     * @param typeDecl - The typedef declaration to check against
     * @returns Returns true if the joinpoint uses the given typedef declaration, false otherwise
     */
    private isTypedefUsed(jp: Joinpoint, typeDecl: TypedefDecl): boolean {
        const jpType = getBaseType(jp);
        return !jpType?.isBuiltin && jpType instanceof TypedefType && jpType.decl.astId === typeDecl.astId;
    }

    /**
     * Retrieves all joinpoints that use the specified typedef declaration
     * 
     * @param typeDecl - The typedef declaration to search for in the joinpoints
     * @returns Array of joinpoints that use the given typedef declaration
     */
    private getTypeDefUses(typeDecl: TypedefDecl): Joinpoint[] {
        return getTypedJps().filter(jp => this.isTypedefUsed(jp, typeDecl));
    }

    /**
     * Checks if the given joinpoint represents an unused type declaration
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        const typeDecl = getTypeDecl($jp);
        if (typeDecl === undefined) return false;

        const isUnused = this.getTypeDefUses(typeDecl).length === 0;
        if (logErrors && isUnused) {
            this.logMISRAError($jp, `Type declaration ${typeDecl.name} is declared but not used.`)
        }
        return isUnused;
    }
    
    /**
     * Transforms the joinpoint if it represents an unused type declaration
     * 
     * - If the joinpoint defines a tag (named struct, enum or union) that is referenced elsewhere in the code,
     *  the joinpoint is replaced by the tag
     * - Otherwise, the joinpoint is simply removed from the AST
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);

        if (($jp instanceof RecordJp || $jp instanceof EnumDecl) && $jp.name && getTagUses($jp)) { 
            $jp.lastChild.detach();
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        } 
        $jp.detach();
        return new MISRATransformationReport(MISRATransformationType.Removal);
    }
}
