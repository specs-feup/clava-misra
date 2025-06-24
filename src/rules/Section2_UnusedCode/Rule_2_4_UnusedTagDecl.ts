import { Joinpoint, RecordJp, EnumDecl, DeclStmt, Decl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { hasTypeDefDecl, isTypeDeclUsed } from "../../utils/TypeDeclUtils.js";
import { isTagDecl, TagDecl } from "../../utils/JoinpointUtils.js";
import { getIdentifierName } from "../../utils/IdentifierUtils.js";

/**
 * MISRA-C Rule 2.4: A project should not contain unused tag declarations.
 */
export default class Rule_2_4_UnusedTagDecl extends MISRARule {
    
    constructor(context: MISRAContext) {
        super(context);
    }

    override get name(): string {
        return "2.4";
    }

    /**
     * Checks if the given joinpoint is an unused tag declaration
     * A tag is considered to be unused if it has no references in the code or is only used within a typedef
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!(isTagDecl($jp) || ($jp instanceof DeclStmt && $jp.decls.length === 1))) {
            return false;
        } 
        
        if ($jp instanceof DeclStmt && !isTagDecl($jp.decls[0])) {
            return false;
        }

        const tagJp: TagDecl = $jp instanceof DeclStmt ? $jp.decls[0] as TagDecl : $jp;
        const containsTypeDecl = hasTypeDefDecl(tagJp);
        const jpName = tagJp.name;
        if (containsTypeDecl && (jpName === undefined || jpName === null || (jpName as string).trim().length === 0)) {
            return false;
        }

        const isUnused = !isTypeDeclUsed(tagJp);
        if (isUnused && logErrors) {
            this.logMISRAError(tagJp, 
                containsTypeDecl ? `The tag '${tagJp.name}' is declared but only used in a typedef.` : `The tag '${tagJp.name}' is declared but not used.`);
        }
        return isUnused;
    }
    
    /**
     * Transforms the joinpoint if it is an unused tag declaration
     * - If the joinpoint is a tag declared in a typedef, it removes the name. 
     * - Otherwise, the joinpoint is detached.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        const tagJp: TagDecl = $jp instanceof DeclStmt ? $jp.decls[0] as TagDecl : $jp as TagDecl;
        if (hasTypeDefDecl(tagJp)) {
            (tagJp).setName('');
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        }
        $jp.detach();
        return new MISRATransformationReport(MISRATransformationType.Removal);
    }
}
