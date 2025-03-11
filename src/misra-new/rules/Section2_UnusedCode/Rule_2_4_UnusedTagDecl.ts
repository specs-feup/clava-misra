import { Joinpoint, RecordJp, EnumDecl, TagType, ElaboratedType } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getBaseType, getTypedJps, hasTypeDecl } from "../../utils.js";

/**
 * MISRA-C Rule 2.4: A project should not contain unused tag declarations.
 */
export default class Rule_2_4_UnusedTagDecl extends MISRARule {

    constructor(context: MISRAContext) {
        super("2.4", context);
    }

    private isTagUsed($jp: Joinpoint, tag: RecordJp | EnumDecl): boolean {
        const jpType = getBaseType($jp);
        return jpType instanceof ElaboratedType && 
            jpType.namedType instanceof TagType && 
            jpType.namedType.decl.astId === tag.astId
    }

    private getTagUses(tag: RecordJp | EnumDecl): Joinpoint[] {
        return getTypedJps().filter(jp => this.isTagUsed(jp, tag));
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof RecordJp || $jp instanceof EnumDecl)) return false;

        if (hasTypeDecl($jp) && $jp instanceof RecordJp) {
            const jpName = $jp.name;
            if (jpName === undefined || jpName === null || (jpName as string).trim().length === 0) {
                return false;
            } 
            if (logErrors) {
                this.logMISRAError($jp, `The tag '${$jp.name}' is declared but only used in a typedef. Remove the tag for compliance.`)
            }
            return true;
        }

        const isUnused = this.getTagUses($jp).length === 0;
        if (isUnused && logErrors) {
            this.logMISRAError($jp, `The tag '${$jp.name}' is declared but not used.`);
        }
        return isUnused;
    }
    
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        if ($jp instanceof RecordJp && hasTypeDecl($jp)) {
            $jp.setName('');
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        }
        $jp.detach();
        return new MISRATransformationReport(MISRATransformationType.Removal);
    }
}
