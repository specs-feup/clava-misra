import { Joinpoint, RecordJp, EnumDecl, TagType, ElaboratedType } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getTagUses, hasTypeDecl } from "../../utils.js";

/**
 * MISRA-C Rule 2.4: A project should not contain unused tag declarations.
 */
export default class Rule_2_4_UnusedTagDecl extends MISRARule {

    constructor(context: MISRAContext) {
        super("2.4", context);
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
        if (!($jp instanceof RecordJp || $jp instanceof EnumDecl)) return false;

        const containsTypeDecl = hasTypeDecl($jp);
        const jpName = $jp.name;
        if (containsTypeDecl && jpName === undefined || jpName === null || (jpName as string).trim().length === 0) {
            return false;
        }

        const isUnused = getTagUses($jp).length === 0;
        if (isUnused && logErrors) {
            this.logMISRAError($jp, 
                containsTypeDecl ? `The tag '${$jp.name}' is declared but only used in a typedef.` : `The tag '${$jp.name}' is declared but not used.`);
        }
        return isUnused;
    }
    
    /**
     * Transforms the joinpoint if it is an unused tag declaration
     * - If the Joinpoint is a tag declared in a typedef, it removes the name. 
     * - Otherwise, the Joinpoint is detached.
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        if (hasTypeDecl($jp)) {
            ($jp as RecordJp | EnumDecl).setName('');
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        }
        $jp.detach();
        return new MISRATransformationReport(MISRATransformationType.Removal);
    }
}
