import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getTypeDefDecl, isTypeDeclUsed } from "../../utils/TypeDeclUtils.js";
import { isTagDecl } from "../../utils/JoinpointUtils.js";

/**
 * MISRA-C Rule 2.3: A project should not contain unused type declarations.
 */
export default class Rule_2_3_UnusedTypeDecl extends MISRARule {
    priority = 3;

    constructor(context: MISRAContext) {
        super("2.3", context);
    }

    /**
     * Checks if the given joinpoint represents an unused type declaration
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        const typeDecl = getTypeDefDecl($jp);
        if (typeDecl === undefined) return false;

        const isUnused = !isTypeDeclUsed(typeDecl);
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

        if (isTagDecl($jp) && $jp.name && isTypeDeclUsed($jp)) { 
            $jp.lastChild.detach();
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        } else {
            $jp.detach();
            return new MISRATransformationReport(MISRATransformationType.Removal);
        }

    }
}
