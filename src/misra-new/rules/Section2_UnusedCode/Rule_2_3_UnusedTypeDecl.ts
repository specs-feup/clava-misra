import { Joinpoint,TypedefDecl, TypedefType } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { getBaseType, getTypeDecl, getTypedJps } from "../../utils.js";

/**
 * MISRA-C Rule 2.3: A project should not contain unused ty pe declarations.
 */
export default class Rule_2_3_UnusedTypeDecl extends MISRARule {

    constructor(context: MISRAContext) {
        super("2.3", context);
    }

    private isTypedefUsed(jp: Joinpoint, typeDecl: TypedefDecl): boolean {
        const jpType = getBaseType(jp);
        return !jpType?.isBuiltin && jpType instanceof TypedefType && jpType.decl.astId === typeDecl.astId;
    }

    private getTypeDefUses(typeDecl: TypedefDecl): Joinpoint[] {
        return getTypedJps().filter(jp => this.isTypedefUsed(jp, typeDecl));
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        const typeDecl = getTypeDecl($jp);
        if (typeDecl === undefined) return false;

        const uses = this.getTypeDefUses(typeDecl);
        if (logErrors && uses.length === 0) {
            this.logMISRAError($jp, `Type declaration ${typeDecl.name} is declared but not used.`)
        }
        return uses.length === 0;
    }
    
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        $jp.detach();
        return new MISRATransformationReport(MISRATransformationType.Removal);
    }
}
